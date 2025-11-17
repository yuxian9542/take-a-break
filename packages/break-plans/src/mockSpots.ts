export type RelaxationSpot = {
  id: string;
  name: string;
  category: 'park' | 'cafe' | 'waterfront' | 'quiet_space' | 'indoor';
  description: string;
  amenityTags: string[];
  distanceMeters: number;
  durationMinutes: number;
  coordinates: { lat: number; lng: number };
};

export const mockSpots: RelaxationSpot[] = [
  {
    id: 'spot_riverwalk',
    name: 'Hudson Riverside Walk',
    category: 'waterfront',
    description: 'Calm waterfront path with benches and gentle breeze.',
    amenityTags: ['water_view', 'benches', 'shade'],
    distanceMeters: 680,
    durationMinutes: 9,
    coordinates: { lat: 40.7842, lng: -73.9691 }
  },
  {
    id: 'spot_garden',
    name: 'Conservatory Garden Nook',
    category: 'park',
    description: 'Quiet garden corner surrounded by seasonal flowers.',
    amenityTags: ['flowers', 'quiet', 'seating'],
    distanceMeters: 520,
    durationMinutes: 7,
    coordinates: { lat: 40.7854, lng: -73.9662 }
  },
  {
    id: 'spot_cafe',
    name: 'Tranquil Grounds Café',
    category: 'cafe',
    description: 'Mindful café with lo-fi music and window seating.',
    amenityTags: ['coffee', 'wifi', 'indoor'],
    distanceMeters: 310,
    durationMinutes: 4,
    coordinates: { lat: 40.7821, lng: -73.9719 }
  }
];

