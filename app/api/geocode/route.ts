import { NextRequest, NextResponse } from "next/server";
import { mapboxToken } from "@/lib/mapbox";

const demoPlaces = [
  { id: "demo-london", name: "London, England", coordinates: [-0.1278, 51.5074] },
  { id: "demo-bristol", name: "Bristol, England", coordinates: [-2.5879, 51.4545] },
  { id: "demo-manchester", name: "Manchester, England", coordinates: [-2.2426, 53.4808] },
  { id: "demo-birmingham", name: "Birmingham, England", coordinates: [-1.8904, 52.4862] },
  { id: "demo-leeds", name: "Leeds, England", coordinates: [-1.5491, 53.8008] },
  { id: "demo-edinburgh", name: "Edinburgh, Scotland", coordinates: [-3.1883, 55.9533] },
  { id: "demo-glasgow", name: "Glasgow, Scotland", coordinates: [-4.2514, 55.8642] },
  { id: "demo-cardiff", name: "Cardiff, Wales", coordinates: [-3.1791, 51.4816] },
  { id: "demo-newcastle", name: "Newcastle, England", coordinates: [-1.6178, 54.9783] },
];

export async function GET(request: NextRequest) {
  const query = request.nextUrl.searchParams.get("q")?.trim() ?? "";
  if (query.length < 2) return NextResponse.json({ features: [] });

  const token = mapboxToken();
  if (!token) {
    const normalized = query.toLowerCase();
    const features = demoPlaces.filter((place) => place.name.toLowerCase().includes(normalized));
    return NextResponse.json({ features: features.slice(0, 5).map((place) => ({ ...place, sourceMode: "demo" })), mode: "demo" });
  }

  const params = new URLSearchParams({
    q: query,
    country: "GB",
    language: "en",
    limit: "5",
    types: "place,locality,postcode,address",
    access_token: token,
  });

  try {
    const response = await fetch(`https://api.mapbox.com/search/geocode/v6/forward?${params}`, { cache: "no-store" });
    if (!response.ok) {
      return NextResponse.json({ error: "Mapbox could not search for that place. Check your token and try again." }, { status: response.status === 401 || response.status === 403 ? 502 : 503 });
    }
    const data = await response.json();
    const features = Array.isArray(data.features) ? data.features.flatMap((feature: {
      id?: string;
      properties?: { name?: string; full_address?: string; place_formatted?: string };
      geometry?: { coordinates?: unknown };
    }) => {
      const coordinates = feature.geometry?.coordinates;
      if (typeof feature.id !== "string" || !Array.isArray(coordinates) || coordinates.length !== 2 ||
        typeof coordinates[0] !== "number" || typeof coordinates[1] !== "number") return [];
      const name = feature.properties?.full_address ?? [feature.properties?.name, feature.properties?.place_formatted].filter(Boolean).join(", ");
      if (!name) return [];
      return [{ id: feature.id, name, coordinates: [coordinates[0], coordinates[1]], sourceMode: "live" }];
    }) : [];
    return NextResponse.json({ features, mode: "live" });
  } catch {
    return NextResponse.json({ error: "Location search is temporarily unavailable. Please try again." }, { status: 502 });
  }
}
