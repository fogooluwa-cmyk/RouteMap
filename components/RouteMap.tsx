"use client";

import { useEffect, useRef, useState } from "react";
import type { GeoJSONSource, Map as MapboxMap, Marker as MapboxMarker } from "mapbox-gl";
import type { PlaceResult, DrivingRoute } from "@/lib/mapbox";

export type Charger = {
  id: number;
  title: string;
  operator: string | null;
  address: string;
  coordinates: [number, number];
  routeMilesAway: number;
  routeProgress: number;
  connectors: string[];
  maxPowerKw: number | null;
  recordUpdatedAt: string | null;
  dataSource: string;
  dataSourceUrl: string | null;
  availability: "unknown";
  isDemo?: boolean;
};

type Props = {
  route: DrivingRoute | null;
  origin: PlaceResult | null;
  destination: PlaceResult | null;
  chargers: Charger[];
  selectedChargerIds: number[];
};

function DemoMap({ route, origin, destination, chargers }: Props) {
  const coords = route?.geometry.coordinates ?? [];
  const allPoints = [...coords, ...(origin ? [origin.coordinates] : []), ...(destination ? [destination.coordinates] : [])];
  const longitudes = allPoints.map(([longitude]) => longitude);
  const latitudes = allPoints.map(([, latitude]) => latitude);
  const minLongitude = longitudes.length ? Math.min(...longitudes) : -6.5;
  const maxLongitude = longitudes.length ? Math.max(...longitudes) : 2;
  const minLatitude = latitudes.length ? Math.min(...latitudes) : 50;
  const maxLatitude = latitudes.length ? Math.max(...latitudes) : 56;
  const longitudeSpan = Math.max(.5, maxLongitude - minLongitude);
  const latitudeSpan = Math.max(.5, maxLatitude - minLatitude);
  const padding = 95;
  const x = (longitude: number) => padding + ((longitude - minLongitude) / longitudeSpan) * (1000 - padding * 2);
  const y = (latitude: number) => padding + ((maxLatitude - latitude) / latitudeSpan) * (650 - padding * 2);
  const routePoints = coords.map(([longitude, latitude]) => `${x(longitude)},${y(latitude)}`).join(" ");

  return (
    <div className="demo-map" aria-label="Demo map preview">
      <svg viewBox="0 0 1000 650" preserveAspectRatio="xMidYMid slice" role="img" aria-label="Illustrative map preview with route and demo charging locations">
        <rect width="1000" height="650" fill="#e8ece4" />
        <path d="M0 0h1000v155q-95 24-175-4t-165 13q-65 24-157-9t-176 6Q197 194 0 151Z" fill="#dfe8d9" />
        <path d="M0 510q125-36 228-1t186-1q98-38 189 12t175 16q111-32 222-3v117H0Z" fill="#dfe8d9" />
        <g fill="none" stroke="#fffdf7" strokeWidth="10" opacity=".83">
          <path d="M-20 193 115 223l128-29 117 48 117-34 146 58 125-24 156 52 126-7" />
          <path d="m-14 434 143-60 121 24 92-61 111 27 89 74 114-9 109-77 248 38" />
          <path d="M156-30 179 97l-54 119 47 120-18 102 76 127 4 115" />
          <path d="m410-30 12 121 80 94-22 99 43 100-25 114 81 167" />
          <path d="m678-25-34 122 44 103-55 85 65 115-12 102 51 171" />
          <path d="m890-12-84 112 12 120-53 92 43 104-22 94 94 138" />
        </g>
        <g fill="none" stroke="#c3c7bc" strokeWidth="2" opacity=".8">
          <path d="M-20 193 115 223l128-29 117 48 117-34 146 58 125-24 156 52 126-7" />
          <path d="m-14 434 143-60 121 24 92-61 111 27 89 74 114-9 109-77 248 38" />
          <path d="M156-30 179 97l-54 119 47 120-18 102 76 127 4 115" />
          <path d="m410-30 12 121 80 94-22 99 43 100-25 114 81 167" />
          <path d="m678-25-34 122 44 103-55 85 65 115-12 102 51 171" />
          <path d="m890-12-84 112 12 120-53 92 43 104-22 94 94 138" />
        </g>
        {routePoints && <>
          <polyline points={routePoints} fill="none" stroke="#fffdf8" strokeWidth="13" strokeLinecap="round" strokeLinejoin="round" />
          <polyline points={routePoints} fill="none" stroke="#b4e63e" strokeWidth="6" strokeLinecap="round" strokeLinejoin="round" />
        </>}
        {chargers.map((charger) => <g key={charger.id} transform={`translate(${x(charger.coordinates[0])} ${y(charger.coordinates[1])})`}>
          <circle r="17" fill="#d3fa6b" stroke="#20241e" strokeWidth="2" />
          <path d="m2-9-6 9h5l-2 9 8-11H2Z" fill="#20241e" />
        </g>)}
        {origin && <g transform={`translate(${x(origin.coordinates[0])} ${y(origin.coordinates[1])})`}><circle r="17" fill="#fffdf8" opacity=".8"/><circle r="8" fill="#344c3b" stroke="#fffdf8" strokeWidth="3"/><text className="demo-map-label" x="0" y="-24" textAnchor="middle">{origin.name.split(",")[0]}</text></g>}
        {destination && <g transform={`translate(${x(destination.coordinates[0])} ${y(destination.coordinates[1])})`}><circle r="17" fill="#fffdf8" opacity=".8"/><circle r="8" fill="#c9f259" stroke="#20241e" strokeWidth="2"/><text className="demo-map-label" x="0" y="-24" textAnchor="middle">{destination.name.split(",")[0]}</text></g>}
      </svg>
      <div className="demo-map-badge"><span /> DEMO MAP · ADD MAPBOX TOKEN FOR LIVE TILES</div>
      {!route && <div className="demo-map-empty">Search for two places to preview a demo route.</div>}
      <div className="map-attribution">Illustrative map only · not for navigation</div>
    </div>
  );
}

export default function RouteMap({ route, origin, destination, chargers, selectedChargerIds }: Props) {
  const containerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<MapboxMap | null>(null);
  const markersRef = useRef<MapboxMarker[]>([]);
  const [mapError, setMapError] = useState("");
  const [mapReady, setMapReady] = useState(false);
  const publicToken = process.env.NEXT_PUBLIC_MAPBOX_ACCESS_TOKEN;

  useEffect(() => {
    if (!containerRef.current || !publicToken) return;
    let cancelled = false;
    let map: MapboxMap | null = null;

    void import("mapbox-gl").then((mapboxgl) => {
      if (cancelled || !containerRef.current) return;
      const mapbox = mapboxgl.default;
      mapbox.accessToken = publicToken;
      map = new mapbox.Map({
        container: containerRef.current,
        style: "mapbox://styles/mapbox/light-v11",
        center: origin?.coordinates ?? [-2.3, 53.4],
        zoom: origin ? 7 : 5.4,
        attributionControl: true,
      });
      map.addControl(new mapbox.NavigationControl({ showCompass: false }), "top-right");
      map.on("error", () => setMapError("Map tiles could not be loaded. Check the public Mapbox token and its allowed URLs."));
      mapRef.current = map;
      setMapReady(true);
    }).catch(() => setMapError("Mapbox could not be loaded in this browser."));

    return () => {
      cancelled = true;
      markersRef.current.forEach((marker) => marker.remove());
      markersRef.current = [];
      map?.remove();
      mapRef.current = null;
      setMapReady(false);
    };
  }, [publicToken]);

  useEffect(() => {
    const map = mapRef.current;
    if (!map) return;

    if (!route) {
      markersRef.current.forEach((marker) => marker.remove());
      markersRef.current = [];
      if (map.getLayer("journey-route-line")) map.removeLayer("journey-route-line");
      if (map.getLayer("journey-route-casing")) map.removeLayer("journey-route-casing");
      if (map.getSource("journey-route")) map.removeSource("journey-route");
      return;
    }

    const drawRouteAndMarkers = async () => {
      const mapboxgl = await import("mapbox-gl");
      if (!mapRef.current) return;

      const feature = {
        type: "Feature" as const,
        properties: {},
        geometry: route.geometry,
      };
      const existing = map.getSource("journey-route") as GeoJSONSource | undefined;
      if (existing) existing.setData(feature);
      else {
        map.addSource("journey-route", { type: "geojson", data: feature });
        map.addLayer({
          id: "journey-route-casing",
          type: "line",
          source: "journey-route",
          layout: { "line-cap": "round", "line-join": "round" },
          paint: { "line-color": "#fffdf8", "line-width": 9, "line-opacity": 0.92 },
        });
        map.addLayer({
          id: "journey-route-line",
          type: "line",
          source: "journey-route",
          layout: { "line-cap": "round", "line-join": "round" },
          paint: { "line-color": "#b4e63e", "line-width": 6 },
        });
      }

      markersRef.current.forEach((marker) => marker.remove());
      markersRef.current = [];
      const addMarker = (coordinates: [number, number], className: string, label: string, selected = false) => {
        const element = document.createElement("div");
        element.className = `map-marker ${className}${selected ? " map-marker-selected" : ""}`;
        element.setAttribute("aria-label", label);
        element.title = label;
        const marker = new mapboxgl.Marker({ element, anchor: className === "map-marker-origin" || className === "map-marker-destination" ? "center" : "bottom" })
          .setLngLat(coordinates)
          .addTo(map);
        markersRef.current.push(marker);
      };
      if (origin) addMarker(origin.coordinates, "map-marker-origin", `Start: ${origin.name}`);
      if (destination) addMarker(destination.coordinates, "map-marker-destination", `Destination: ${destination.name}`);
      for (const charger of chargers) {
        addMarker(charger.coordinates, "map-marker-charger", charger.title, selectedChargerIds.includes(charger.id));
      }

      const coords = route.geometry.coordinates;
      if (coords.length) {
        const lngs = coords.map(([lng]) => lng);
        const lats = coords.map(([, lat]) => lat);
        map.fitBounds([[Math.min(...lngs), Math.min(...lats)], [Math.max(...lngs), Math.max(...lats)]], { padding: 80, duration: 700, maxZoom: 10 });
      }
    };

    if (map.isStyleLoaded()) void drawRouteAndMarkers();
    else map.once("load", () => void drawRouteAndMarkers());
  }, [route, origin, destination, chargers, selectedChargerIds, mapReady]);

  if (!publicToken) {
    return (
      <DemoMap route={route} origin={origin} destination={destination} chargers={chargers} selectedChargerIds={selectedChargerIds} />
    );
  }

  return <div className="map-live-wrap"><div className="map-live" ref={containerRef} aria-label="Map showing the driving route and charging locations" />{mapError && <div className="map-error" role="status">{mapError}</div>}</div>;
}
