export class InMemoryPlacesRepository {
    places = new Map();
    constructor(initialPlaces = []) {
        initialPlaces.forEach((place) => this.places.set(place.id, place));
    }
    async findById(id) {
        return this.places.get(id) ?? null;
    }
    async findNearby(params) {
        // Simple in-memory filtering
        // TODO: Replace with real geospatial query (Firebase, PostGIS, etc.)
        const allPlaces = Array.from(this.places.values());
        const radius = params.radius ?? 1000; // default 1km
        const limit = params.limit ?? 20;
        // Filter by distance (using simple Euclidean approximation for demo)
        const results = allPlaces
            .map((place) => {
            const latDiff = (place.lat - params.lat) * 111000; // ~111km per degree
            const lngDiff = (place.lng - params.lng) * 111000 * Math.cos((params.lat * Math.PI) / 180);
            const distance = Math.sqrt(latDiff * latDiff + lngDiff * lngDiff);
            return {
                place,
                distance
            };
        })
            .filter(({ distance }) => distance <= radius);
        // Filter by types if specified
        let filtered = results;
        if (params.types) {
            const requestedTypes = params.types.split(',').map((t) => t.trim());
            filtered = results.filter(({ place }) => place.types.some((t) => requestedTypes.includes(t)));
        }
        filtered.sort((a, b) => a.distance - b.distance);
        return filtered.slice(0, limit).map(({ place, distance }) => ({
            ...place,
            distanceMeters: Math.round(distance)
        }));
    }
    upsert(place) {
        this.places.set(place.id, place);
    }
}
//# sourceMappingURL=places-repository.js.map