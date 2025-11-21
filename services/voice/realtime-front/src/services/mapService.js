import { mockSpots } from "./mockSpots.js";

const WALKING_SPEED_METERS_PER_MINUTE = 80;

const CATEGORY_RULES = [
  {
    match: (types) => types.some((type) => type.includes("park") || type.includes("trail")),
    category: "park",
  },
  {
    match: (types) => types.some((type) => type.includes("cafe") || type.includes("coffee")),
    category: "cafe",
  },
  {
    match: (types) => types.some((type) => type.includes("water") || type.includes("river")),
    category: "waterfront",
  },
  {
    match: (types) => types.some((type) => type.includes("library") || type.includes("quiet")),
    category: "quiet_space",
  },
];

function deriveCategory(types = []) {
  const lowerTypes = types.map((type) => type.toLowerCase());
  const matchedRule = CATEGORY_RULES.find((rule) => rule.match(lowerTypes));
  return matchedRule ? matchedRule.category : "indoor";
}

function deriveDuration(distanceMeters) {
  const safeDistance = Number.isFinite(distanceMeters) ? distanceMeters : 400;
  return Math.max(2, Math.round(safeDistance / WALKING_SPEED_METERS_PER_MINUTE));
}

function normalizeAmenityTags(types = []) {
  return types
    .map((type) =>
      type
        .split("_")
        .map((chunk) => chunk.trim())
        .filter(Boolean)
        .join(" "),
    )
    .filter(Boolean)
    .slice(0, 5);
}

function formatDescription(place) {
  const fragments = [];
  if (place.address) fragments.push(place.address);
  if (place.isOpenNow !== undefined) fragments.push(place.isOpenNow ? "Currently open" : "May be closed");
  if (place.rating) fragments.push(`Google rating ${place.rating.toFixed(1)}`);
  return fragments.length > 0 ? fragments.join(" · ") : "Nearby place suggested by map service.";
}

function adaptNearbyPlace(place) {
  const category = deriveCategory(place.types ?? []);
  const description = formatDescription(place);
  const distanceMeters = Number.isFinite(place.distanceMeters) ? place.distanceMeters : 400;

  return {
    id: place.id,
    name: place.name,
    category,
    description,
    amenityTags: normalizeAmenityTags(place.types ?? []),
    distanceMeters,
    durationMinutes: deriveDuration(distanceMeters),
    coordinates: {
      lat: place.lat,
      lng: place.lng,
    },
  };
}

export async function getUserPosition() {
  if (typeof navigator === "undefined" || !navigator.geolocation) {
    return fallbackPosition();
  }

  try {
    const position = await new Promise((resolve, reject) => {
      navigator.geolocation.getCurrentPosition(resolve, reject, {
        enableHighAccuracy: true,
        timeout: 8000,
        maximumAge: 120000,
      });
    });

    return {
      lat: position.coords.latitude,
      lng: position.coords.longitude,
      accuracyMeters: position.coords.accuracy ?? undefined,
    };
  } catch (error) {
    console.warn("[mapService] Failed to read browser location, falling back to mock data.", error);
    return fallbackPosition();
  }
}

export async function getNearbySpots(position) {
  let resolvedPosition = position;
  if (!resolvedPosition) {
    resolvedPosition = await getUserPosition();
  }

  try {
    // Placeholder: if a browser map service exists, plug it here. For now, fallback to mock data.
    return mockSpots;
  } catch (error) {
    console.warn("[mapService] Failed to load nearby places from API, falling back to mock data.", error);
    return mockSpots;
  }
}

export function buildSystemPrompt(position, spots) {
  if (!position) return null;
  const accuracyText = typeof position.accuracyMeters === "number" ? ` (+/- ${Math.round(position.accuracyMeters)} m)` : "";

  const lines = [
    "Ambient context for the voice assistant:",
    `- Approximate user coordinates: ${position.lat.toFixed(4)}, ${position.lng.toFixed(4)}${accuracyText}.`,
  ];

  if (Array.isArray(spots) && spots.length > 0) {
    lines.push("- Nearby relaxation spots to consider:");
    spots.slice(0, 3).forEach((spot, index) => {
      const distanceKm = (spot.distanceMeters / 1000).toFixed(2);
      const amenities = (spot.amenityTags ?? []).slice(0, 3);
      const amenitiesText = amenities.length > 0 ? amenities.join(", ") : "no listed amenities";
      const categoryLabel = spot.category.replace(/_/g, " ");
      lines.push(
        `  ${index + 1}. ${spot.name} (${categoryLabel}) - ${spot.description} Distance approx ${distanceKm} km, about ${spot.durationMinutes} min walk. Amenities: ${amenitiesText}.`,
      );
    });
  } else {
    lines.push("- No curated relaxation spots were retrieved; invite the user to share preferred environments.");
  }

  lines.push("- Use this context to tailor suggestions subtly without exposing raw coordinates unless the user asks.");
  return lines.join("\n");
}

export function getMockRoute(origin, destination) {
  const midLat = (origin.lat + destination.lat) / 2 + 0.001;
  const midLng = (origin.lng + destination.lng) / 2 - 0.001;

  return [
    { lat: origin.lat, lng: origin.lng },
    { lat: midLat, lng: midLng },
    { lat: destination.lat, lng: destination.lng },
  ];
}

function fallbackPosition() {
  const firstSpot = mockSpots[0];
  return {
    lat: firstSpot.coordinates.lat - 0.002,
    lng: firstSpot.coordinates.lng + 0.002,
    accuracyMeters: undefined,
  };
}
