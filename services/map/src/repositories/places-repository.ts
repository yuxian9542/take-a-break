import type { NearbyPlace } from '@take-a-break/types';

export interface PlacesRepository {
  findById(id: string): Promise<NearbyPlace | null>;
}

export class InMemoryPlacesRepository implements PlacesRepository {
  private readonly places = new Map<string, NearbyPlace>();

  constructor(initialPlaces: NearbyPlace[] = []) {
    initialPlaces.forEach((place) => this.places.set(place.id, place));
  }

  async findById(id: string): Promise<NearbyPlace | null> {
    return this.places.get(id) ?? null;
  }

  upsert(place: NearbyPlace) {
    this.places.set(place.id, place);
  }
}
