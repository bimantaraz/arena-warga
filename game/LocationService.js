class LocationService {
    constructor() {
        try {
            this.locations = require('./locations.json');
            console.log(`Loaded ${this.locations.length} locations.`);
        } catch (error) {
            console.error("Failed to load locations.json, using fallback.", error);
            this.locations = [
                { id: 1, name: "Monas", lat: -6.175392, lng: 106.827153, category: ['all', 'java-bali', 'city'] }
            ];
        }
    }

    getRandomLocation(category = 'all') {
        const filtered = this.locations.filter(l => l.category.includes(category));
        // Fallback to all if no locations found in category
        const pool = filtered.length > 0 ? filtered : this.locations;
        const randomIndex = Math.floor(Math.random() * pool.length);
        return pool[randomIndex];
    }

    // Calculate distance in km
    calculateDistance(lat1, lon1, lat2, lon2) {
        const R = 6371; // Radius of the earth in km
        const dLat = this.deg2rad(lat2 - lat1);
        const dLon = this.deg2rad(lon2 - lon1);
        const a =
            Math.sin(dLat / 2) * Math.sin(dLat / 2) +
            Math.cos(this.deg2rad(lat1)) * Math.cos(this.deg2rad(lat2)) *
            Math.sin(dLon / 2) * Math.sin(dLon / 2)
            ;
        const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
        const d = R * c; // Distance in km
        return d;
    }

    calculateScore(distanceKm) {
        // Max score 5000
        // Use exponential decay
        const score = 5000 * Math.exp(-distanceKm / 1000);
        return Math.floor(score);
    }

    // Battle Royale Damage Calculation
    calculateDamage(winnerDist, loserDist) {
        // Logic: Damage = Difference in km * Multiplier?
        // Or simple: 50% of difference?
        // Let's go with: Damage = (LoserDist - WinnerDist) * 10
        // Cap at 2000 per round
        const diff = loserDist - winnerDist;
        const damage = Math.min(Math.floor(diff * 10), 2000); // 1km diff = 10 dmg
        return Math.max(0, damage);
    }

    deg2rad(deg) {
        return deg * (Math.PI / 180);
    }
}

module.exports = new LocationService();
