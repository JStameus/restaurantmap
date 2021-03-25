// User specified settings
let userOptions = {
    searchDistance: 5,
    searchTags: [],
    onlyShowTagMatches: false,
}

// Loading API Keys from local file
window.onload = () => {
    fetch("../assets/env.json")
        .then(response => response.json())
        .then(json => {
            mapboxgl.accessToken = json.mapboxkey;
            documenuKey = json.documenukey;
            console.log("Loaded API Key from local file.");
        })
        .catch(err => {
            console.log(`ERROR: ${err}`);
        });
};

// API Settings 
let documenuKey = "";
let APICallURL = "https://api.documenu.com/v2/restaurants/search/geo?lat=39&lon=-94&distance=5";

// For using locally saved data
let localURL = "../assets/data.json";

mapboxgl.accessToken = "pk.eyJ1IjoianN0YW1ldXMiLCJhIjoiY2ttMzh5MXB1MjNtbDJxbHlicWdzc3NpeiJ9.mgv20WRpcdojJ8elyTdmyg";
var map = new mapboxgl.Map({
    container: 'map',
    style: 'mapbox://styles/mapbox/streets-v11'
});

// Globally available markers 
let centerMarker = new mapboxgl.Marker({
    color: "#ff0000",
});
let debugMarkers = [];

// DOM Elements 
const cardList = document.querySelector("#cardlist");
const optionsMenu = document.querySelector("#optionsPanel");

const searchButton = document.querySelector("#button_startSearch");
searchButton.addEventListener("click", () => {
    console.log("Searching...");
    const coordinates = getCenterCoordinates();
    setTimeout(() => {
        fetchAPI(coordinates.lat, coordinates.lng, userOptions.searchDistance);
    }, 1000);
});

const toggleMenuButton = document.querySelector("#button_toggleOptions");
toggleMenuButton.addEventListener("click", () => {
    toggleMenu();    
});

const toggleMatchSearchButton = document.querySelector("#button_tagMatches");
toggleMatchSearchButton.addEventListener("click", () => {
    toggleSearchMatches();
});

map.on("dragend", () => {
    console.log(getCenterCoordinates());
    updateCenterMarker();
});

// API call functions
function fetchAPI(latitude, longitude, distance) {
   clearRestaurantCards();
    let fullUrl = `https://api.documenu.com/v2/restaurants/search/geo?lat=${latitude}&lon=${longitude}&distance=${distance}`;
    fetch(fullUrl, {headers: {"X-API-KEY": "8bb10903010e51cfb76da6d356c1d84d"}})
        .then(response => response.json())
        .then(json => {
            map.zoomTo(15.9);
            console.log("-- DATA RECIEVED --");
            console.log(json)
            console.log("-------------------");

            // If onlyShowTagMatches is on, filter out any restaurants that do
            // not have at least one of the specified tags
            if(userOptions.onlyShowTagMatches === true) {
                let matchingRestaurants = json.data.filter(restaurant => hasCuisineTag(restaurant));
                console.log("Matching restaurants:");
                console.log(matchingRestaurants);
                matchingRestaurants.forEach(restaurant => createRestaurantCard(restaurant));
            } else {
                // Otherwise, just create cards for all restaurants
                json.data.forEach(restaurant => {
                    createRestaurantCard(restaurant);
                });
            }
        })
        .catch(err => {
            console.log(`ERROR: ${err}`);
        });
}

function fetchLocal() {
    fetch(localURL)
        .then(response => response.json())
        .then(json => {
            console.log(`Json: ${json}`);
            console.log(`Json.data: ${json.data}`);
            for(let i = 0; i < json.data.length; i++) {
                createRestaurantCard(json.data[i]);
            }
            return json;
        })
        .catch(err => {
            console.log(`ERROR: ${err}`);
        });
}

// Uses the MapBox API to set new coordinates for where we are on the map.
function getCenterCoordinates() {
    const mapCenter = map.transform._center;
    return {lng: mapCenter.lng, lat: mapCenter.lat};
}

// Uses data from the Documenu API to create a "card" for a restaurant with the
// most important information.
function createRestaurantCard(restaurant) {
    const cardDiv = document.createElement("div");
    const card = new RestaurantCard(
        restaurant.restaurant_name,
        restaurant.address.street,
        restaurant.restaurant_phone,
        restaurant.restaurant_website
    );
    cardDiv.innerHTML = card.render();

    // If the restaurant has any cuisine tags, they'll be added now.
    if (restaurant.cuisines.length > 1) {
        cardDiv.appendChild(document.createElement("hr"));

        const cuisesinesDiv = document.createElement("div");
        cuisesinesDiv.className = "restaurantcard_cuisinesbox";

        restaurant.cuisines.map(cuisine => {
            const newTag = document.createElement("h5");
            newTag.innerText = cuisine;
            newTag.className = "cuisinetag";
            cuisesinesDiv.appendChild(newTag);
        });
        cardDiv.appendChild(cuisesinesDiv);
    }
    
    cardDiv.className = "restaurantcard";
    cardList.appendChild(cardDiv);

    // Creating a marker and adding an event listener to the card so that the
    // marker can be shown when the user clicks the card.
    const newMarker = createRestaurantMarker(restaurant);
    cardDiv.addEventListener("click", () => {
        map.flyTo({
            center: newMarker.getLngLat()
        });
    });
}

function clearRestaurantCards() {
    while (cardList.firstChild) {
        cardList.firstChild.remove();
    }
    console.log("Cleared restaurant cards.");
}

function createRestaurantMarker(restaurant) {
    const newMarker = new mapboxgl.Marker()
        .setLngLat([restaurant.geo.lon, restaurant.geo.lat])
        .addTo(map);
    return newMarker;
}

function updateCenterMarker() {
    const coordinates = getCenterCoordinates();
    centerMarker.setLngLat([coordinates.lng, coordinates.lat]).addTo(map);
}

// Restaurant sorting and filtering

// Returns true of the the specified restaurant has at least one of the tags the
// user is searching for.
function hasCuisineTag(restaurant) {
    // For every tag specified by the user, loop through all the cuisines in the
    // restaurant and look for a match
    userOptions.searchTags.forEach(searchTag => {
        restaurant.cuisines.forEach(cuisine => {
            if(cuisine == searchTag) {
                console.log(`${restaurant.restaurant_name}: Match found!`);
                return true;
            }
        })
    }); 
    // If no matches were found, return false
    return false;
}

// Manipulating user options
function toggleMenu() {
    if(optionsMenu.style.display == "block") {
        optionsMenu.style.display = "none";
    } else if (optionsMenu.style.display == "none") {
        optionsMenu.style.display = "block";
    }
}

function toggleSearchMatches() {
    if(userOptions.onlyShowTagMatches === true) {
        toggleMatchSearchButton.className = "button_off";
        toggleMatchSearchButton.innerText = "Only show tag matches: No ";
        userOptions.onlyShowTagMatches = false;
    } else if (userOptions.onlyShowTagMatches === false) {
        toggleMatchSearchButton.className = "button_on";
        toggleMatchSearchButton.innerText = "Only show tag matches: Yes";
        userOptions.onlyShowTagMatches = true;
    }
}

// Debug functions
function createDebugMarker(coordinates) {
    const newMarker = new mapboxgl.Marker()
        .setLngLat([coordinates.lng, coordinates.lat])
        .addTo(map);
    debugMarkers.push(newMarker);
}

function debugDistance() {
    const pointA = debugMarkers[0].getLngLat();
    const pointB = debugMarkers[1].getLngLat();
    const distance = pointA.distanceTo(pointB);
    console.log(distance);
}

userOptions.searchTags = ["American", "Burgers", "Asian"];
