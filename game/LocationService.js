class LocationService {
    constructor() {
        this.locations = [
            // Monas, Jakarta
            { id: 1, name: "Monas", lat: -6.175392, lng: 106.827153, category: ['all', 'java-bali', 'city'] },
            // Candi Borobudur, Magelang
            { id: 2, name: "Candi Borobudur", lat: -7.607873, lng: 110.203751, category: ['all', 'java-bali'] },
            // Gedung Sate, Bandung
            { id: 3, name: "Gedung Sate", lat: -6.902481, lng: 107.618810, category: ['all', 'java-bali', 'city'] },
            // Jembatan Ampera, Palembang
            { id: 4, name: "Jembatan Ampera", lat: -2.992015, lng: 104.760089, category: ['all', 'sumatera', 'city'] },
            // Raja Ampat (Viewpoint)
            { id: 5, name: "Piaynemo, Raja Ampat", lat: -0.565076, lng: 130.270920, category: ['all', 'extreme'] },
            // Simpang Lima, Semarang
            { id: 6, name: "Simpang Lima Semarang", lat: -6.991196, lng: 110.422891, category: ['all', 'java-bali', 'city'] },
            // Tugu Yogyakarta
            { id: 7, name: "Tugu Yogyakarta", lat: -7.782873, lng: 110.367073, category: ['all', 'java-bali', 'city'] },
            // Nusa Penida, Bali
            { id: 8, name: "Kelingking Beach", lat: -8.750694, lng: 115.474636, category: ['all', 'java-bali', 'extreme'] },
            // Jam Gadang, Bukittinggi
            { id: 9, name: "Jam Gadang", lat: -0.3055, lng: 100.3692, category: ['all', 'sumatera', 'city'] },
            // Danau Toba
            { id: 10, name: "Danau Toba", lat: 2.6136, lng: 98.6253, category: ['all', 'sumatera', 'extreme'] },
            // Gunung Bromo
            { id: 11, name: "Gunung Bromo", lat: -7.94249, lng: 112.95301, category: ['all', 'java-bali', 'extreme'] }
        ];
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
