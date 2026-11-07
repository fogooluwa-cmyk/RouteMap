export type Coordinates = [longitude: number, latitude: number];

export type PlaceResult = {
  id: string;
  name: string;
  coordinates: Coordinates;
  sourceMode?: "demo" | "live";
};

export type DrivingRoute = {
  distanceMeters: number;
  durationSeconds: number;
  geometry: { type: "LineString"; coordinates: Coordinates[] };
  isDemo?: boolean;
};

export function validCoordinates(value: unknown): value is Coordinates {
  return Array.isArray(value) && value.length === 2 &&
    typeof value[0] === "number" && Number.isFinite(value[0]) && value[0] >= -180 && value[0] <= 180 &&
    typeof value[1] === "number" && Number.isFinite(value[1]) && value[1] >= -90 && value[1] <= 90;
}

export function mapboxToken() {
  return process.env.MAPBOX_ACCESS_TOKEN;
}
