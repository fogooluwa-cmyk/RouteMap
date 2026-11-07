import { NextRequest, NextResponse } from "next/server";
import { validCoordinates, type Coordinates } from "@/lib/mapbox";

type OcmConnection = {
  ConnectionType?: { Title?: string; FormalName?: string };
  PowerKW?: number | null;
};

type OcmPoi = {
  ID?: number;
  AddressInfo?: {
    Title?: string;
    AddressLine1?: string;
    Town?: string;
    Postcode?: string;
    Latitude?: number;
    Longitude?: number;
  };
  Connections?: OcmConnection[];
  OperatorInfo?: { Title?: string };
  DateLastStatusUpdate?: string | null;
  DataProvider?: { Title?: string; WebsiteURL?: string };
};

function milesBetween(a: Coordinates, b: Coordinates) {
  const radians = Math.PI / 180;
  const lat1 = a[1] * radians;
  const lat2 = b[1] * radians;
  const dLat = (b[1] - a[1]) * radians;
  const dLon = (b[0] - a[0]) * radians;
  const h = Math.sin(dLat / 2) ** 2 + Math.cos(lat1) * Math.cos(lat2) * Math.sin(dLon / 2) ** 2;
  return 3958.8 * 2 * Math.atan2(Math.sqrt(h), Math.sqrt(1 - h));
}

function routeProximity(point: Coordinates, route: Coordinates[]) {
  let best = { miles: Number.POSITIVE_INFINITY, progress: 0, routeMiles: 0 };
  const segmentLengths = route.slice(1).map((coordinate, index) => milesBetween(route[index], coordinate));
  const totalMiles = segmentLengths.reduce((sum, length) => sum + length, 0);
  let passedMiles = 0;

  for (let index = 0; index < route.length - 1; index += 1) {
    const a = route[index];
    const b = route[index + 1];
    const meanLat = ((a[1] + b[1] + point[1]) / 3) * Math.PI / 180;
    const scaleX = Math.cos(meanLat);
    const bx = (b[0] - a[0]) * scaleX;
    const by = b[1] - a[1];
    const px = (point[0] - a[0]) * scaleX;
    const py = point[1] - a[1];
    const denominator = bx * bx + by * by || 1;
    const t = Math.max(0, Math.min(1, (px * bx + py * by) / denominator));
    const closest: Coordinates = [a[0] + (b[0] - a[0]) * t, a[1] + (b[1] - a[1]) * t];
    const miles = milesBetween(point, closest);
    if (miles < best.miles) {
      const segmentMiles = segmentLengths[index] ?? 0;
      const routeMiles = passedMiles + segmentMiles * t;
      best = { miles, progress: totalMiles ? routeMiles / totalMiles : 0, routeMiles };
    }
    passedMiles += segmentLengths[index] ?? 0;
  }
  return best;
}

function sampleRoute(route: Coordinates[], count: number) {
  if (count <= 1) return [route[0]];
  return Array.from({ length: count }, (_, index) => route[Math.round(index * (route.length - 1) / (count - 1))]);
}

export async function POST(request: NextRequest) {
  const apiKey = process.env.OPEN_CHARGE_MAP_API_KEY;
  let body: { coordinates?: unknown; connectorAliases?: unknown };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Send a valid route geometry." }, { status: 400 });
  }
  if (!Array.isArray(body.coordinates) || body.coordinates.length < 2 || !body.coordinates.every(validCoordinates)) {
    return NextResponse.json({ error: "A valid driving route is required before searching for chargers." }, { status: 400 });
  }
  const route = body.coordinates as Coordinates[];
  const connectorAliases = Array.isArray(body.connectorAliases)
    ? body.connectorAliases.filter((alias): alias is string => typeof alias === "string").map((alias) => alias.toLowerCase())
    : [];
  if (!connectorAliases.length) return NextResponse.json({ chargers: [] });

  const routeMiles = route.slice(1).reduce((sum, coordinate, index) => sum + milesBetween(route[index], coordinate), 0);
  const sampleCount = Math.min(8, Math.max(3, Math.ceil(routeMiles / 35) + 1));
  const samples = sampleRoute(route, sampleCount);

  if (!apiKey) {
    const demoCount = routeMiles > 170 ? 2 : 1;
    const connector = connectorAliases.some((alias) => alias.includes("chademo")) ? "CHAdeMO" : "CCS Combo 2";
    const chargers = Array.from({ length: demoCount }, (_, index) => {
      const routeProgress = (index + 1) / (demoCount + 1);
      const routeIndex = Math.round(routeProgress * (route.length - 1));
      return {
        id: -1 - index,
        title: `Demo charge stop ${String(index + 1).padStart(2, "0")}`,
        operator: "Example network",
        address: "Illustrative location along this route",
        coordinates: route[routeIndex],
        routeMilesAway: 0.4,
        routeProgress,
        connectors: [connector],
        maxPowerKw: 150,
        recordUpdatedAt: null,
        dataSource: "Demo data",
        dataSourceUrl: null,
        availability: "unknown" as const,
        isDemo: true,
      };
    });
    return NextResponse.json({ chargers, mode: "demo" });
  }

  try {
    const groups = await Promise.all(samples.map(async ([longitude, latitude]) => {
      const params = new URLSearchParams({
        output: "json",
        countrycode: "GB",
        latitude: String(latitude),
        longitude: String(longitude),
        distance: "20",
        distanceunit: "miles",
        maxresults: "50",
        compact: "false",
        verbose: "false",
      });
      const response = await fetch(`https://api.openchargemap.io/v3/poi/?${params}`, {
        headers: { "X-API-Key": apiKey, "User-Agent": "EVRouteMate/0.1 (web journey planner)" },
        cache: "no-store",
      });
      if (!response.ok) throw new Error(`Open Charge Map returned ${response.status}`);
      const results: unknown = await response.json();
      return Array.isArray(results) ? results as OcmPoi[] : [];
    }));

    const unique = new Map<number, OcmPoi>();
    for (const poi of groups.flat()) if (typeof poi.ID === "number") unique.set(poi.ID, poi);

    const chargers = Array.from(unique.values()).flatMap((poi) => {
      const address = poi.AddressInfo;
      if (typeof address?.Latitude !== "number" || typeof address.Longitude !== "number") return [];
      const connections = (poi.Connections ?? []).flatMap((connection) => {
        const name = connection.ConnectionType?.Title ?? connection.ConnectionType?.FormalName ?? "";
        const normalized = name.toLowerCase();
        if (!name || !connectorAliases.some((alias) => normalized.includes(alias))) return [];
        return [{ name, powerKw: typeof connection.PowerKW === "number" ? connection.PowerKW : null }];
      });
      if (!connections.length) return [];

      const point: Coordinates = [address.Longitude, address.Latitude];
      const proximity = routeProximity(point, route);
      if (proximity.miles > 12) return [];
      const title = address.Title || [address.AddressLine1, address.Town].filter(Boolean).join(", ") || "Charging location";
      const powers = connections.map((connection) => connection.powerKw).filter((power): power is number => typeof power === "number");
      return [{
        id: poi.ID!,
        title,
        operator: poi.OperatorInfo?.Title ?? null,
        address: [address.AddressLine1, address.Town, address.Postcode].filter(Boolean).join(", "),
        coordinates: point,
        routeMilesAway: Number(proximity.miles.toFixed(1)),
        routeProgress: proximity.progress,
        connectors: Array.from(new Set(connections.map((connection) => connection.name))),
        maxPowerKw: powers.length ? Math.max(...powers) : null,
        recordUpdatedAt: poi.DateLastStatusUpdate ?? null,
        dataSource: poi.DataProvider?.Title ?? "Open Charge Map",
        dataSourceUrl: poi.DataProvider?.WebsiteURL ?? "https://openchargemap.org/",
        availability: "unknown" as const,
        isDemo: false,
      }];
    }).sort((a, b) => a.routeProgress - b.routeProgress || a.routeMilesAway - b.routeMilesAway).slice(0, 30);

    return NextResponse.json({ chargers });
  } catch (error) {
    console.error("Open Charge Map lookup failed", error);
    return NextResponse.json({ error: "Open Charge Map could not return charging locations. Try again shortly." }, { status: 502 });
  }
}
