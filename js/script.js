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
}

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
        fetchAPI(coordinates.lat, coordinates.lng, searchDistance);
    }, 1000);
});

const toggleMenuButton = document.querySelector("#button_toggleOptions");
toggleMenuButton.addEventListener("click", () => {
    toggleMenu();    
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
            console.log(json)
            for(let i = 0; i < json.data.length; i++) {
                createRestaurantCard(json.data[i]);
                console.log(hasCuisineTag(json.data[i], "American"));
                console.log("Tag match should be logged here");
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

// Uses the MapBox API 
function getCenterCoordinates() {
    const mapCenter = map.transform._center;
    return {lng: mapCenter.lng, lat: mapCenter.lat};
}


function clearRestaurantCards() {
    while (cardList.firstChild) {
        cardList.firstChild.remove();
    }
    console.log("Cleared restaurant cards.");
}

// Uses data from the Documenu API
function createRestaurantCard(restaurant) {
    // TODO: Get the coordinates for the restaurant
    //const restaurantCoordinates = restaurant.getLngLat(); // This is bork'd
    //const restaurantDistance = centerMarker.distanceTo(restaurantCoordinates);

    const cardDiv = document.createElement("div");

    //const restaurantDistanceLabel = document.createElement("h3");
    //restaurantDistanceLabel.innerText = `${restaurantDistance} away`;
    const restaurantName = document.createElement("h2");
    restaurantName.innerText = restaurant.restaurant_name;
    cardDiv.appendChild(restaurantName);

    //const restaurantHeader = document.createElement("div");
    //restaurantHeader.appendChild(restaurantName);
    //restaurantHeader.appendChild(restaurantDistanceLabel);
    //cardDiv.appendChild(restaurantHeader);

    const restaurantStreet = document.createElement("h3");
    restaurantStreet.innerText = restaurant.address.street;
    cardDiv.appendChild(restaurantStreet);
    
    if (restaurant.cuisines.length > 1) {
        const cuisesinesDiv = document.createElement("div");
        cuisesinesDiv.className = "restaurantcard_cuisinesbox";

        for (let i = 0; i < restaurant.cuisines.length; i++) {
            const newTag = document.createElement("h5");
            newTag.innerText = restaurant.cuisines[i];
            newTag.className = "cuisinetag";
            cuisesinesDiv.appendChild(newTag);
        }
        cardDiv.appendChild(cuisesinesDiv);
    }

    const restaurantPhone = document.createElement("p");
    restaurantPhone.innerText = `Phone: ${restaurant.restaurant_phone}`;
    cardDiv.appendChild(restaurantPhone);
    const restaurantWebsiteLink = document.createElement("a");
    restaurantWebsiteLink.target = "blank";
    restaurantWebsiteLink.innerText = restaurant.restaurant_website;
    restaurantWebsiteLink.href = restaurant.restaurant_website;
    cardDiv.appendChild(restaurantWebsiteLink);

    cardDiv.className = "restaurantcard";
    cardList.appendChild(cardDiv);

    const newMarker = createRestaurantMarker(restaurant);
    cardDiv.addEventListener("click", () => {
        map.flyTo({
            center: newMarker.getLngLat()
        });
    });
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
function hasCuisineTag(restaurant, tag) {
    for(let i = 0; i < restaurant.cuisines.length; i++) {
        if(restaurant.cuisines[i] === tag) {
            console.log(`Restaurant: ${restaurant} has tag: ${tag}`);
            return true;
        } 
    } 
    console.log(`Restaurant: ${restaurant} did not have the tag you are looking for.`);
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
