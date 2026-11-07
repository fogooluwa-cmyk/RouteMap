# EV RouteMate — Product Requirements Document

## Product

**EV RouteMate** is a simple, mobile-friendly EV journey planner that estimates battery use and suggests compatible charging stops for longer trips.

## Problem

Planning a long EV journey can mean cross-checking a route, vehicle range, plug types, and charger information across several tools. First-time EV drivers especially need a clear plan and honest expectations about what is estimated and what is confirmed.

## Target user

EV owners and first-time EV drivers planning a longer drive in the UK. They know their vehicle and current battery level, but may not know where or how long to charge en route.

## Core features for v1

1. **Vehicle and starting charge**
   - As a driver, I want to select a supported EV and enter my starting battery percentage so the plan reflects my car and current charge.
   - Start with a small, curated vehicle catalogue containing usable battery capacity, typical consumption, and connector types. Include a generic vehicle fallback.

2. **Route entry**
   - As a driver, I want to enter a start and destination so I can plan a specific journey.
   - Support place search and a single driving route. Allow manual start and destination entry; geolocation is optional and permission-based.

3. **Route overview**
   - As a driver, I want to see the route on a map with distance and driving-time estimates so I can understand the journey at a glance.
   - Show an estimated battery level at arrival and explain that weather, speed, terrain, load, and driving style can change consumption.

4. **Compatible charging suggestions**
   - As a driver, I want suggested stops along my route that match my vehicle’s connectors so I can identify places to recharge.
   - Rank nearby stations by route proximity, connector match, and available power metadata. Show station name, connector/power details when available, and distance from the route. Let the driver add or remove a suggestion and update the estimate.

5. **Clear estimate and availability labels**
   - As a driver, I want to know whether a battery figure or charger status is estimated or verified live so I can judge how much to rely on it.
   - Label battery and charging-time figures **Estimated**. Label station directory details with their data source and update timestamp when supplied. Do not claim a charger or stall is available now unless a live operator/network feed confirms it; v1 does not provide live availability.

## Out of scope

- Turn-by-turn navigation, voice guidance, and in-car integrations.
- Verified live stall availability, reservations, payments, tariffs, and charging-network accounts.
- User accounts, saved trips across devices, trip sharing, and a persistent trip database.
- Multi-stop trip editing, alternative-route optimization, weather-aware or elevation-aware energy simulation.
- Native mobile apps and launch outside the UK.

## Tech stack

- **Next.js App Router, React, TypeScript** for the web app and server-side API proxy routes.
- **Tailwind CSS** for responsive styling.
- **Mapbox GL JS + Directions API** for the interactive map and road route. Keep tokens and calls behind server routes where appropriate, set usage limits, and cache/debounce lookups. Use standard driving routing for v1; Mapbox’s EV routing is currently private preview and should not be a launch dependency.
- **Open Charge Map API** for charging-location and connector metadata, subject to its fair-use policy and attribution/licensing requirements. Treat records as directory data, not live stall availability.
- **Curated static JSON vehicle catalogue** for the first release; avoid database and auth setup during the one-week MVP.
- **Vercel** for deployment. Add Supabase later only if saved trips, accounts, or editable vehicle data become necessary.

## Design direction

Take Lithosquare’s confident typography, spacious editorial layout, and restrained use of color, with Pacific Fusion’s dark, cinematic brand accents as inspiration. Keep the planner itself practical: a high-contrast map, clear trip form, compact route summary, and legible stop list. On mobile, stack the form and stop list around a full-width map without hiding key estimate labels.

## Definition of done

- A user can select a supported vehicle, enter a starting charge, set UK start and destination points, and calculate a drivable route on desktop and mobile browsers.
- The result shows route distance/time, a transparent estimated arrival charge, and connector-compatible charging suggestions when station data is available.
- Estimated battery/charging figures are visually distinct from source-supplied station records; no UI implies verified live availability.
- Empty, loading, no-route, and station-data failure states are understandable and recoverable.
- Map and charging-data attribution is present, API keys are not exposed unnecessarily, and provider usage limits are configured.
- The deployed MVP has been manually checked at desktop and mobile viewport sizes.

## One-week delivery guardrail

Limit v1 to one route, a small vehicle catalogue, one charging-location source, estimated energy use, and one UK-focused responsive planner screen. If station search or route-corridor matching takes longer than planned, show compatible nearby stations as suggestions without claiming they are optimized stops.

## Research links

- [Lithosquare](https://www.lithosquare.com/) and [Pacific Fusion](https://www.pacificfusion.com/) — visual references.
- [Mapbox Directions API](https://docs.mapbox.com/api/navigation/directions/) — routing and EV-routing status.
- [Mapbox pricing](https://www.mapbox.com/pricing) — usage-based API costs and allowances.
- [Open Charge Map API](https://www.openchargemap.org/develop/api) — station directory API, fair-use policy, and data attribution.
- [Supabase Next.js quickstart](https://supabase.com/docs/guides/getting-started/quickstarts/nextjs) — available integration path if persistence is added later.
