# EV RouteMate

A responsive EV journey planner built with Next.js, React, TypeScript, Mapbox, and Open Charge Map.

## Run locally

```sh
npm install
npm run dev
```

Open <http://localhost:3000>.

## API keys

Create `.env.local` in the project root (or copy `.env.example`) and add:

```dotenv
MAPBOX_ACCESS_TOKEN=your_server_side_mapbox_token
NEXT_PUBLIC_MAPBOX_ACCESS_TOKEN=your_public_mapbox_token
OPEN_CHARGE_MAP_API_KEY=your_open_charge_map_api_key
```

- Create a Mapbox token for server-side geocoding and driving directions. Keep this value server-side.
- Create a separate public Mapbox token for map tiles/styles and restrict it to the app's allowed URLs.
- Request an Open Charge Map API key from its **My Apps** profile page. The key is sent only by the server.

Restart the dev server after changing environment variables. The planner uses Mapbox Geocoding v6 for UK location search and Mapbox Directions for driving routes. It searches Open Charge Map around points along the returned route, deduplicates the results, and filters to the selected EV's connector types.

Battery consumption is estimated from route distance, the selected vehicle's typical efficiency, and usable battery capacity. Open Charge Map records are directory data; charger availability is always shown as unknown because the API results do not verify live stall availability. Respect Open Charge Map's fair-use and data attribution requirements.

If one or more keys are missing, the planner falls back to clearly labelled demo places, a simulated route, and example charger markers so the interface remains interactive. Demo distances are rough estimates; demo charger names and locations are fictional and must not be used for travel.

## Sources

- [Mapbox Geocoding API](https://docs.mapbox.com/api/search/geocoding/)
- [Mapbox Directions API](https://docs.mapbox.com/api/navigation/directions/)
- [Mapbox GL JS](https://docs.mapbox.com/mapbox-gl-js/)
- [Open Charge Map API](https://www.openchargemap.org/develop/api)

## Vehicle catalogue

The planner includes 35 UK trim/year entries from Volkswagen, Škoda, CUPRA, Audi, Ford, and Nissan. Each entry links to its manufacturer's technical data or UK price/specification sheet from the selector. Battery capacity is usable/net capacity. Efficiency is a WLTP combined estimate in mi/kWh; when the source gives kWh/100 km, it is converted using `62.137 / (kWh/100 km)`. WLTP is a comparison baseline and does not predict an individual trip's real-world consumption. Changing the selected vehicle recalculates estimated energy use and refreshes compatible charger results using its connector types.

Catalogue sources: [Volkswagen Newsroom](https://www.volkswagen-newsroom.com/en/), [Škoda UK technical data](https://www.skoda.co.uk/new-cars), [CUPRA Born](https://www.cupraofficial.com/), [Audi MediaCenter](https://www.audi-mediacenter.com/en), [Ford UK price lists](https://www.ford.co.uk/), and [Nissan UK LEAF specifications](https://www.nissan.co.uk/vehicles/new-vehicles/leaf/prices-specifications.html).
