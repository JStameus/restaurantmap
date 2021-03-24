class RestaurantCard {
    constructor(name, street, phone, website) {
        this.name = name;
        this.street = street;
        this.phone = phone;
        this.website = website;
    }

    render() {
        return `
                    <h2>${this.name}</h2> 
                    <h3>${this.street}</h3>
                    <p>${this.phone}</p>
                    <a href="${this.website}">Website</a>
                `
    }
} 
