class LocationService {
    constructor() {
        this.locations = [
            // Monas, Jakarta
            { id: 1, name: "Monas", lat: -6.175392, lng: 106.827153 },
            // Candi Borobudur, Magelang
            { id: 2, name: "Candi Borobudur", lat: -7.607873, lng: 110.203751 },
            // Gedung Sate, Bandung
            { id: 3, name: "Gedung Sate", lat: -6.902481, lng: 107.618810 },
            // Jembatan Ampera, Palembang
            { id: 4, name: "Jembatan Ampera", lat: -2.992015, lng: 104.760089 },
            // Raja Ampat (Viewpoint)
            { id: 5, name: "Piaynemo, Raja Ampat", lat: -0.565076, lng: 130.270920 },
            // Simpang Lima, Semarang
            { id: 6, name: "Simpang Lima Semarang", lat: -6.991196, lng: 110.422891 },
            // Tugu Yogyakarta
            { id: 7, name: "Tugu Yogyakarta", lat: -7.782873, lng: 110.367073 },
            // Nusa Penida, Bali (Kelingking Beach top)
            { id: 8, name: "Kelingking Beach", lat: -8.750694, lng: 115.474636 }
        ];
    }

    getRandomLocation() {
        const randomIndex = Math.floor(Math.random() * this.locations.length);
        return this.locations[randomIndex];
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
        // 0m = 5000
        // > 2000km = 0
        // Use an exponential decay or linear drop
        const maxDist = 2000;
        if (distanceKm > maxDist) return 0;

        // Simple linear for MVP: 5000 * (1 - dist/max)
        // Or cleaner: 5000 * e^(-d / 1000)

        // Let's use Geoguessr-ish curve but simpler
        const score = 5000 * Math.exp(-distanceKm / 1000);
        return Math.floor(score);
    }

    deg2rad(deg) {
        return deg * (Math.PI / 180);
    }
}

module.exports = new LocationService();
