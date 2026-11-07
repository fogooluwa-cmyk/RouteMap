import { NextRequest, NextResponse } from "next/server";
import { mapboxToken, validCoordinates } from "@/lib/mapbox";

export async function POST(request: NextRequest) {
  let body: { origin?: unknown; destination?: unknown };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Send a valid start and destination." }, { status: 400 });
  }
  if (!validCoordinates(body.origin) || !validCoordinates(body.destination)) {
    return NextResponse.json({ error: "Choose a start and destination from the location search results." }, { status: 400 });
  }

  const token = mapboxToken();
  if (!token) {
    const [originLng, originLat] = body.origin;
    const [destinationLng, destinationLat] = body.destination;
    const radians = Math.PI / 180;
    const lat1 = originLat * radians;
    const lat2 = destinationLat * radians;
    const deltaLat = (destinationLat - originLat) * radians;
    const deltaLng = (destinationLng - originLng) * radians;
    const h = Math.sin(deltaLat / 2) ** 2 + Math.cos(lat1) * Math.cos(lat2) * Math.sin(deltaLng / 2) ** 2;
    const roadMiles = Math.max(1, 3958.8 * 2 * Math.atan2(Math.sqrt(h), Math.sqrt(1 - h)) * 1.24);
    const perpendicularLength = Math.hypot(destinationLat - originLat, destinationLng - originLng) || 1;
    const perpendicularLng = -(destinationLat - originLat) / perpendicularLength;
    const perpendicularLat = (destinationLng - originLng) / perpendicularLength;
    const coordinates = Array.from({ length: 32 }, (_, index) => {
      const progress = index / 31;
      const bend = Math.sin(progress * Math.PI) * 0.09;
      return [
        originLng + (destinationLng - originLng) * progress + perpendicularLng * bend,
        originLat + (destinationLat - originLat) * progress + perpendicularLat * bend,
      ];
    });
    return NextResponse.json({
      distanceMeters: roadMiles * 1609.344,
      durationSeconds: roadMiles / 57 * 3600,
      geometry: { type: "LineString", coordinates },
      isDemo: true,
    });
  }

  const coordinates = `${body.origin[0]},${body.origin[1]};${body.destination[0]},${body.destination[1]}`;
  const params = new URLSearchParams({
    overview: "full",
    geometries: "geojson",
    steps: "false",
    access_token: token,
  });

  try {
    const response = await fetch(`https://api.mapbox.com/directions/v5/mapbox/driving/${coordinates}?${params}`, { cache: "no-store" });
    const data = await response.json();
    if (!response.ok || data.code !== "Ok" || !Array.isArray(data.routes) || !data.routes[0]) {
      return NextResponse.json({ error: data.message ?? "Mapbox could not find a driving route between those places." }, { status: 502 });
    }
    const route = data.routes[0];
    if (!Array.isArray(route.geometry?.coordinates) || route.geometry.coordinates.length < 2) {
      return NextResponse.json({ error: "Mapbox returned a route without drawable geometry. Try different locations." }, { status: 502 });
    }
    return NextResponse.json({
      distanceMeters: route.distance,
      durationSeconds: route.duration,
      geometry: route.geometry,
    });
  } catch {
    return NextResponse.json({ error: "Driving directions are temporarily unavailable. Please try again." }, { status: 502 });
  }
}
