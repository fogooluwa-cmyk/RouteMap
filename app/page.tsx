"use client";

import { FormEvent, useMemo, useState } from "react";
import LocationSearch from "@/components/LocationSearch";
import RouteMap, { type Charger } from "@/components/RouteMap";
import { vehicles } from "@/lib/vehicles";
import type { DrivingRoute, PlaceResult } from "@/lib/mapbox";

function Icon({ name, size = 20 }: { name: string; size?: number }) {
  const paths: Record<string, React.ReactNode> = {
    bolt: <path d="m13 2-3 8H5l6 12 3-9h5L13 2Z"/>,
    car: <><path d="m5 11 1.5-4.5A2 2 0 0 1 8.4 5h7.2a2 2 0 0 1 1.9 1.5L19 11"/><path d="M3 11h18v8H3zM6 19v2m12-2v2M3 14h3m12 0h3"/><circle cx="7" cy="15" r=".5"/><circle cx="17" cy="15" r=".5"/></>,
    arrow: <><path d="M5 12h14"/><path d="m13 6 6 6-6 6"/></>,
    clock: <><circle cx="12" cy="12" r="9"/><path d="M12 7v5l3 2"/></>,
    plus: <><path d="M12 5v14M5 12h14"/></>,
    close: <><path d="m18 6-12 12M6 6l12 12"/></>,
    route: <><circle cx="6" cy="18" r="2"/><circle cx="18" cy="6" r="2"/><path d="M8 18h4a3 3 0 0 0 3-3V9a3 3 0 0 1 3-3"/></>,
    sliders: <><path d="M4 7h9m4 0h3M4 17h3m4 0h9"/><circle cx="15" cy="7" r="2"/><circle cx="9" cy="17" r="2"/></>,
    external: <><path d="M14 3h7v7m0-7-9 9"/><path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"/></>,
    check: <path d="m5 12 4 4L19 6"/>,
  };
  return <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">{paths[name]}</svg>;
}

function formatDuration(seconds: number) {
  const totalMinutes = Math.round(seconds / 60);
  const hours = Math.floor(totalMinutes / 60);
  const minutes = totalMinutes % 60;
  return `${hours}h ${String(minutes).padStart(2, "0")}m`;
}

function arrivalCharge(route: DrivingRoute, vehicle: typeof vehicles[number], startingCharge: number, selectedStops: number) {
  const miles = route.distanceMeters / 1609.344;
  const energyKwh = miles / vehicle.efficiencyMiPerKwh;
  const energyPercent = (energyKwh / vehicle.batteryKwh) * 100;
  if (selectedStops > 0) return Math.max(0, Math.min(95, Math.round(Math.min(startingCharge, 80) - energyPercent / (selectedStops + 1))));
  return Math.max(0, Math.round(startingCharge - energyPercent));
}

type ApiError = { error?: string };
type RouteResponse = DrivingRoute & ApiError;
type ChargerResponse = { chargers?: Charger[] } & ApiError;

export default function Home() {
  const [vehicleIndex, setVehicleIndex] = useState(0);
  const [battery, setBattery] = useState(82);
  const [origin, setOrigin] = useState<PlaceResult | null>(null);
  const [destination, setDestination] = useState<PlaceResult | null>(null);
  const [route, setRoute] = useState<DrivingRoute | null>(null);
  const [chargers, setChargers] = useState<Charger[]>([]);
  const [selectedChargerIds, setSelectedChargerIds] = useState<number[]>([]);
  const [loadingRoute, setLoadingRoute] = useState(false);
  const [loadingChargers, setLoadingChargers] = useState(false);
  const [routeError, setRouteError] = useState("");
  const [chargerError, setChargerError] = useState("");
  const [notice, setNotice] = useState("");
  const vehicle = vehicles[vehicleIndex];
  const demoMode = !process.env.NEXT_PUBLIC_MAPBOX_ACCESS_TOKEN ||
    origin?.sourceMode === "demo" || destination?.sourceMode === "demo" || Boolean(route?.isDemo) || chargers.some((charger) => charger.isDemo);

  function updateOrigin(place: PlaceResult | null) {
    setOrigin(place);
    setRoute(null);
    setChargers([]);
    setSelectedChargerIds([]);
    setRouteError("");
    setChargerError("");
  }

  function updateDestination(place: PlaceResult | null) {
    setDestination(place);
    setRoute(null);
    setChargers([]);
    setSelectedChargerIds([]);
    setRouteError("");
    setChargerError("");
  }

  async function updateVehicle(index: number) {
    setVehicleIndex(index);
    setSelectedChargerIds([]);
    if (!route) return;
    setChargers([]);
    setLoadingChargers(true);
    setChargerError("");
    try {
      const response = await fetch("/api/chargers", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ coordinates: route.geometry.coordinates, connectorAliases: vehicles[index].connectorAliases }),
      });
      const data = await response.json() as ChargerResponse;
      if (!response.ok) throw new Error(data.error ?? "Could not refresh compatible charging locations.");
      setChargers(data.chargers ?? []);
    } catch (error) {
      setChargers([]);
      setChargerError(error instanceof Error ? error.message : "Could not refresh compatible charging locations.");
    } finally {
      setLoadingChargers(false);
    }
  }

  const stats = useMemo(() => {
    if (!route) return null;
    const miles = route.distanceMeters / 1609.344;
    const energyKwh = miles / vehicle.efficiencyMiPerKwh;
    const energyPercent = (energyKwh / vehicle.batteryKwh) * 100;
    let suggestedStops = 0;
    while (suggestedStops < 3 && Math.min(battery, 80) - energyPercent / (suggestedStops + 1) < 18) suggestedStops += 1;
    return {
      miles: Math.round(miles),
      energyKwh: Math.round(energyKwh),
      energyPercent,
      driveTime: formatDuration(route.durationSeconds),
      suggestedStops,
      arrival: arrivalCharge(route, vehicle, battery, selectedChargerIds.length),
    };
  }, [route, vehicle, battery, selectedChargerIds.length]);

  async function planJourney(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setNotice("");
    if (!origin || !destination) {
      setRouteError("Choose both locations from the search suggestions before planning your route.");
      return;
    }
    if (origin.id === destination.id) {
      setRouteError("Choose two different locations for your journey.");
      return;
    }

    setLoadingRoute(true);
    setLoadingChargers(false);
    setRouteError("");
    setChargerError("");
    setRoute(null);
    setChargers([]);
    setSelectedChargerIds([]);

    let routeLoaded = false;
    try {
      const response = await fetch("/api/route", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ origin: origin.coordinates, destination: destination.coordinates }),
      });
      const routeData = await response.json() as RouteResponse;
      if (!response.ok) throw new Error(routeData.error ?? "Could not calculate a driving route.");
      setRoute(routeData);
      routeLoaded = true;

      setLoadingChargers(true);
      const chargerResponse = await fetch("/api/chargers", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ coordinates: routeData.geometry.coordinates, connectorAliases: vehicle.connectorAliases }),
      });
      const chargerData = await chargerResponse.json() as ChargerResponse;
      if (!chargerResponse.ok) throw new Error(chargerData.error ?? "Could not load charging locations.");
      setChargers(chargerData.chargers ?? []);
    } catch (error) {
      const message = error instanceof Error ? error.message : "Something went wrong while planning this trip.";
      if (!routeLoaded) setRouteError(message);
      else setChargerError(message);
    } finally {
      setLoadingRoute(false);
      setLoadingChargers(false);
    }
  }

  function toggleCharger(id: number) {
    setSelectedChargerIds((current) => current.includes(id) ? current.filter((selectedId) => selectedId !== id) : [...current, id]);
  }

  const miles = stats?.miles ?? 0;
  const isOverReserveWithoutStop = Boolean(stats && stats.arrival < 18 && selectedChargerIds.length === 0);

  return (
    <main className="app-shell">
      <header className="topbar">
        <a className="brand" href="#planner" aria-label="EV RouteMate home">
          <span className="brand-mark"><span /><span /><span /></span>
          <span className="brand-name">route<span>mate</span></span>
          <span className="brand-beta">BETA</span>
        </a>
        <div className="topbar-meta">
          <span className={`data-indicator ${demoMode ? "data-indicator-demo" : ""}`}><i /> {demoMode ? "DEMO PREVIEW" : "ESTIMATES ONLY"}</span>
          <span className="topbar-separator" />
          <span className="locale-label">UK <span className="locale-dot">·</span> mi</span>
          <button className="avatar-button" type="button" aria-label="Selected vehicle"><Icon name="car" size={17} /></button>
        </div>
      </header>

      <div className="workspace" id="planner">
        <aside className="planner-panel">
          <div className="panel-heading">
            <div className="eyebrow"><span className="eyebrow-line" /> JOURNEY PLANNER</div>
            <h1>Go a little<br /><em>further.</em></h1>
            <p>Know your route. Know where to pause.</p>
          </div>

          <form className="route-form" onSubmit={planJourney}>
            <div className="field-label-row"><span className="field-label">YOUR JOURNEY</span><span className="form-hint">Search any UK place</span></div>
            <div className="location-fields">
              <div className="location-rail"><i className="origin-dot" /><span /><i className="destination-dot" /></div>
              <div className="location-inputs">
                <LocationSearch label="Starting point" placeholder="Search starting point" marker="origin" onSelect={updateOrigin} />
                <div className="field-rule" />
                <LocationSearch label="Destination" placeholder="Where to?" marker="destination" onSelect={updateDestination} />
              </div>
            </div>

            <div className="field-label-row vehicle-label"><label htmlFor="vehicle">YOUR VEHICLE</label><span className="form-hint">{vehicle.connectorLabel}</span></div>
            <div className="select-wrap">
              <span className="vehicle-icon"><Icon name="car" size={17} /></span>
              <select id="vehicle" value={vehicleIndex} onChange={(event) => { void updateVehicle(Number(event.target.value)); }}>
                {vehicles.map((item, index) => <option key={item.name} value={index}>{item.name}</option>)}
              </select>
              <span className="select-chevron">⌄</span>
            </div>

            <div className="battery-heading"><label htmlFor="battery">STARTING BATTERY</label><span className="battery-number">{battery}<small>%</small></span></div>
            <input className="battery-slider" id="battery" type="range" min="5" max="100" value={battery} style={{ "--range-progress": `${((battery - 5) / 95) * 100}%` } as React.CSSProperties} onChange={(event) => setBattery(Number(event.target.value))} />
            <div className="range-labels"><span>Nearly empty</span><span>Full</span></div>

            <button type="submit" className="plan-button" disabled={loadingRoute}>{loadingRoute ? <>Finding your route <span className="button-spinner" /></> : <>Plan my journey <Icon name="arrow" size={18} /></>}</button>
            {routeError && <p className="form-notice" role="alert">{routeError}</p>}
            {notice && <p className="form-success" role="status">{notice}</p>}
          </form>

          {demoMode && <div className="demo-notice"><strong>Demo preview</strong><span>Example locations, routes, or chargers are labelled DEMO. Add the keys listed in README to the project root <code>.env.local</code> for live provider data.</span></div>}
          <div className="vehicle-note"><span className="note-icon"><Icon name="sliders" size={15} /></span><span>Energy use is estimated from route distance and typical vehicle efficiency.</span></div>
          <div className="panel-footer"><span>MADE FOR THE OPEN ROAD</span><span>01 / UK</span></div>
        </aside>

        <section className="journey-view" aria-label="Journey overview">
          <div className="journey-toolbar">
            <div className="journey-title-group">
              <div className="journey-kicker">YOUR NEXT JOURNEY <span className={`live-pill ${route ? "" : "live-pill-muted"}`}><i /> {route ? "ROUTE READY" : "AWAITING ROUTE"}</span></div>
              <h2>{origin?.name.split(",")[0] ?? "Starting point"}<span className="title-arrow"><Icon name="arrow" size={19} /></span>{destination?.name.split(",")[0] ?? "Destination"}</h2>
            </div>
            <div className="toolbar-actions"><button className="icon-action" type="button" aria-label="Route options"><Icon name="sliders" size={17} /></button><button className="share-button" type="button" disabled={!route} onClick={() => { void navigator.clipboard?.writeText(`${origin?.name ?? ""} to ${destination?.name ?? ""}`); setNotice("Route details copied."); }}><Icon name="external" size={15} /> Share route</button></div>
          </div>

          <div className="route-stats-bar" aria-label="Journey summary">
            <div className="route-stat"><span className="stat-icon"><Icon name="route" size={16} /></span><span><strong>{route ? `${miles} ` : "— "}<small>mi</small></strong><em>ROUTE DISTANCE</em></span></div>
            <span className="stat-divider" />
            <div className="route-stat"><span className="stat-icon"><Icon name="clock" size={17} /></span><span><strong>{route ? formatDuration(route.durationSeconds) : "—"}</strong><em>DRIVING TIME</em></span></div>
            <span className="stat-divider" />
            <div className="route-stat battery-stat"><span className="stat-icon charge-icon"><Icon name="bolt" size={16} /></span><span><strong>{stats ? `${stats.arrival}` : "—"}<small>%</small></strong><em>EST. ARRIVAL CHARGE</em></span></div>
          </div>

          <div className="map-frame">
            <RouteMap route={route} origin={origin} destination={destination} chargers={chargers} selectedChargerIds={selectedChargerIds} />
            {loadingRoute && <div className="map-loading"><span className="small-spinner" /> Calculating a driving route…</div>}
            {loadingChargers && route && <div className="map-loading map-loading-subtle"><span className="small-spinner" /> Looking for compatible chargers…</div>}
            {route && <div className="map-caption"><span className="map-caption-dot" /> {route.isDemo ? "DEMO ROUTE" : "MAPBOX DRIVING ROUTE"} <span className="caption-divider" /> UK</div>}
            {route && <div className="map-key"><span><i className="key-route" /> Your route</span><span><i className="key-charge"><Icon name="bolt" size={11} /></i>{chargers.some((charger) => charger.isDemo) ? "Demo chargers" : "Open Charge Map"}</span></div>}
          </div>

          <div className="route-content">
            <div className="route-content-heading"><div><div className="section-eyebrow">YOUR ROUTE, AT A GLANCE</div><h3>{route ? "Charging locations along your route." : "Your route will appear here."}</h3></div>{route && <div className="estimate-badge"><span className="estimate-spark">✳</span> Estimated plan</div>}</div>

            {routeError && <div className="route-alert" role="alert">{routeError}</div>}
            {chargerError && <div className="route-alert route-alert-warning" role="status">{chargerError}</div>}
            {isOverReserveWithoutStop && <div className="route-alert route-alert-warning" role="status">This estimate falls below an 18% arrival reserve. Add a compatible stop to see an updated estimate.</div>}

            {route ? <>
              <div className="route-timeline">
                <div className="timeline-line"><i className="timeline-start" /><span /><i className="timeline-end" /></div>
                <div className="timeline-items">
                  <div className="timeline-row origin-row"><div className="timeline-main"><div className="timeline-place">{origin?.name ?? "Starting point"}</div><div className="timeline-meta">Start at {battery}% <span>·</span> {vehicle.name}</div></div><div className="timeline-charge">{battery}%<small>START</small></div></div>

                  {loadingChargers && <div className="charger-loading-row"><span className="small-spinner" /> Loading Open Charge Map locations…</div>}
                  {!loadingChargers && !chargerError && chargers.length === 0 && <div className="charger-empty">No connector-compatible locations were returned close to this route.</div>}
                  {!loadingChargers && chargers.map((charger, index) => {
                    const isSelected = selectedChargerIds.includes(charger.id);
                    return <div className={`timeline-row stop-row ${isSelected ? "is-added" : ""}`} key={charger.id}>
                      <div className="stop-pin" aria-label={`Charging stop ${index + 1}`}>{String(index + 1).padStart(2, "0")}</div>
                      <div className="timeline-main charger-main">
                        <div className="timeline-place">{charger.title}</div>
                        <div className="timeline-meta">{charger.operator ? `${charger.operator} · ` : ""}{charger.routeMilesAway.toFixed(1)} mi from route <span>·</span> availability unknown</div>
                        <div className="connector-list">{charger.connectors.map((connector) => <span key={connector}>{connector}</span>)}{charger.maxPowerKw && <span>Up to {charger.maxPowerKw} kW</span>}</div>
                        <div className="station-source">{charger.isDemo ? <><strong>DEMO DATA</strong> · Example only, not a real charger location.</> : <>Directory: {charger.dataSourceUrl && <a href={charger.dataSourceUrl} target="_blank" rel="noreferrer">{charger.dataSource}</a>}{charger.recordUpdatedAt && <> · record updated {new Date(charger.recordUpdatedAt).toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" })}</>}</>}</div>
                      </div>
                      <div className="stop-action"><span className="timeline-charge">{Math.max(0, Math.round(battery - (stats?.energyPercent ?? 0) * charger.routeProgress))}%<small>EST. AT STOP</small></span><button type="button" className={isSelected ? "added-button" : "add-stop-button"} onClick={() => toggleCharger(charger.id)}>{isSelected ? <><Icon name="check" size={14} /> Added</> : <><Icon name="plus" size={15} /> Add stop</>}</button></div>
                    </div>;
                  })}

                  <div className="timeline-row destination-row"><div className="timeline-main"><div className="timeline-place">{destination?.name ?? "Destination"}</div><div className="timeline-meta">{stats?.energyKwh} kWh estimated use <span>·</span> {selectedChargerIds.length} charge {selectedChargerIds.length === 1 ? "stop" : "stops"} selected</div></div><div className="timeline-charge destination-charge">{stats?.arrival}%<small>EST. ARRIVE</small></div></div>
                </div>
              </div>
              <div className="estimate-footnote"><span className="footnote-mark">i</span><p>Battery use is estimated from route distance and typical vehicle efficiency; speed, temperature, terrain, and load affect real range. Open Charge Map directory status does not confirm live stall availability. <strong>Availability is unknown.</strong></p><button aria-label="About these estimates" title="Battery figures are estimates. Charger availability is unknown." className="info-button">?</button></div>
              <div className="ocm-attribution">Charging location data by <a href="https://openchargemap.org/" target="_blank" rel="noreferrer">Open Charge Map</a>. Details may be community-submitted and may be out of date.</div>
            </> : !routeError && <div className="route-empty-state"><span className="empty-route-icon"><Icon name="route" size={21} /></span><div><strong>Ready when you are.</strong><p>Search for a start and destination, choose your EV, then plan your drive.</p></div></div>}
          </div>
        </section>
      </div>
      <footer className="mobile-footer"><span>EV ROUTEMATE</span><span>Plan thoughtfully. Drive freely.</span></footer>
    </main>
  );
}
