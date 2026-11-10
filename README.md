# MarsWay

## Explore Mars. Navigate Safer. Discover More.

MarsWay is an interactive Martian GIS, science-exploration, EVA-visualization,
and mission-planning application built for the NASA Space Apps Challenge theme
**Interplanetary Survival Guide: Martian Map**.

It brings Mars places, NASA surface layers, rover missions, environmental
science, explainable route planning, a 3D globe, an astronaut EVA view, and a
local multilingual assistant into one browser workspace.

> **Safety notice:** MarsWay is an educational decision-support prototype. It
> is not flight-certified navigation software and must not be used as the sole
> source for real astronaut, rover, or spacecraft operations.

![React](https://img.shields.io/badge/React-19-20232a?logo=react&logoColor=61dafb)
![TypeScript](https://img.shields.io/badge/TypeScript-7-3178c6?logo=typescript&logoColor=white)
![Vite](https://img.shields.io/badge/Vite-8-646cff?logo=vite&logoColor=white)
![Leaflet](https://img.shields.io/badge/Leaflet-1.9-199900?logo=leaflet&logoColor=white)
![Three.js](https://img.shields.io/badge/Three.js-0.186-black?logo=three.js)

## What problem MarsWay solves

Mars data is distributed across planetary nomenclature catalogues, orbital
imagery, elevation products, mineral archives, rover records, environmental
instruments, and mission documents. A place name alone does not explain
whether a crew or rover can reach it. A straight line on a map does not show
slope, soil, dust, terrain trafficability, or travel time.

MarsWay connects those pieces into one explainable workflow:

1. Find a named Martian place.
2. Inspect its location, science, environment, and mission context.
3. Select a START point and a FINAL point.
4. Choose EVA/foot or rover travel and configure the crew.
5. Compare shortest, safest, and science-priority routes.
6. Understand terrain, soil, hazard, and time trade-offs.
7. Ask the local assistant for a simple explanation.

## Feature overview

### Flat Map / 2D GIS

- Leaflet-based global Mars map with pan, zoom, compass, coordinates, and
  Mars scale bar.
- NASA Mars Trek layers for Viking true colour, MOLA shaded relief, and THEMIS
  daytime infrared.
- Bundled Viking surface fallback for fast startup and network recovery.
- Progressive tile loading without black/empty map rectangles.
- Searchable feature catalogue for craters, plains, valleys, canyons, volcanoes,
  mesas, regions, rovers, landers, and missions.
- Place filters, mission overlays, region boundaries, rover tracks, measurements,
  elevation profiles, atmosphere, dust, and MOLA availability tools.
- Direct map-based START and FINAL selection for route planning.

### 3D Globe

- Three.js Mars globe for planetary orientation and global context.
- Directional sunlight, atmosphere, mission markers, Phobos, Deimos, orbit
  context, and Earth-scale comparison.
- Handoff from a global feature to the detailed 2D map.
- Intended for “where is it on Mars?” rather than detailed local routing.

### Astronaut EVA

- First-person local surface exploration experience with helmet-inspired HUD.
- Reconnaissance inset linked to the astronaut's current Mars position.
- Heart rate, oxygen, suit pressure, altitude, heading, and EVA timer.
- Target reticle, geology/mineral scan card, LIBS-style scan, and sample action.
- W/A/S/D movement and visible 6-DOF movement controller.
- Forward hazard scan with continue/change-heading guidance.
- Tactical map handoff while preserving EVA context.

### Science and environment

- CO2-dominated atmosphere, pressure, gas, temperature, wind, dust, and
  precipitation context.
- Water/ice, hydrated-mineral, clay/smectite, carbonate, and resource context.
- Human survivability, EVA suit, radiation, and pressure warnings.
- Rover terrain suitability and soil trafficability.
- Elevation, slope, pressure, environmental, and geological interpretation.
- Provenance labels: **OBSERVED**, **HISTORICAL**, **DERIVED**, **MODELED**, and
  **SIMULATED**.

### Explainable route planning

1. Click **Route Plan**.
2. Click the map for START.
3. Click the map for FINAL.
4. Choose EVA/foot or rover mode.
5. Configure crew and objective.
6. Click **Check Route**.
7. Compare **Safest**, **Shortest**, and **Science** candidates.
8. Use **Fit to Map** or activate the safe corridor.

Every result can show distance, expected time, maximum slope, soil
trafficability, terrain suitability, hazard count, dust risk, and detour cost.
A green/nominal result means that the current local model found no critical
issue; it is not a field-certified safety guarantee.

## How route planning works

The route engine evaluates candidate waypoints using Mars distance, elevation,
slope, soil, terrain, hazards, dust risk, transport mode, crew assumptions,
and science value.

```text
route cost = distance + time + slope
             + soil/terrain + hazards + dust risk
             - science/resource value
```

- **Shortest** prioritizes distance and expected time.
- **Safest** gives more weight to terrain, slope, soil, hazard, and dust risk.
- **Science** allows a controlled detour toward a science/resource target.

The safety analyzer separately checks the direct corridor and the selected
path. Therefore, a direct line can be marked as a concern while a nearby green
bypass is recommended.

## NASA and USGS data usage

| Data family | Use in MarsWay |
| --- | --- |
| USGS/IAU Planetary Nomenclature | Official feature names, types, coordinates, search, and labels. |
| MGS MOLA / MEGDR | Elevation, Areoid reference, slope, profiles, pressure adjustment, and route penalties. |
| MRO HiRISE | Targeted high-resolution terrain, rocks, scarps, landing sites, and local context. |
| MRO CRISM | Hydrated minerals, clay/smectite, carbonates, alteration, and resource interpretation. |
| Mars Odyssey THEMIS | Daytime infrared and thermal-style surface interpretation. |
| Mars 2020 MEDA | Historical Jezero pressure, wind, temperature, and dust baseline. |
| Mars 2020 instruments | Mastcam-Z, SuperCam, PIXL, SHERLOC, and RIMFAX science context. |
| MSL RAD | Gale radiation baseline and modeled cross-location comparison. |
| NASA/JPL archives | Mission identity, rover/lander history, public imagery, and science context. |
| NASA Mars Trek | Public Viking, MOLA, and THEMIS basemap tiles. |

### Provenance meanings

- **Observed:** represented by an image, measurement, archive record, or
  instrument observation.
- **Historical:** recorded by a past mission or mapping campaign; not live
  telemetry.
- **Derived:** calculated from coordinates, geometry, or catalogue relations.
- **Modeled:** produced by a transparent scientific/engineering approximation.
- **Simulated:** generated for visualization, education, or scenario exploration.

## Offline Ask MarsWay

Ask MarsWay is local and deterministic. It does not use Gemini, OpenAI, a
remote LLM, an AI API key, or a provider-specific SDK.

This is intentional: a Mars emergency or field demonstration may involve
communication delay, low bandwidth, network loss, public-service outages, or no
access to an AI account. A local assistant keeps basic guidance available from
the data already inside the application. It is private, predictable, fast, and
easier to audit.

Supported examples:

```text
What gas is dominant on Mars?
Mars er gas ki?
মঙ্গল গ্রহে মানুষ কি বাঁচতে পারবে?
Ei route safe?
Kon route e time kom lagbe?
Why is this slope risky?
What can I do in EVA mode?
```

It supports basic English, Bangla Unicode, and Banglish questions about
atmosphere, gases, places, elevation, terrain, soil, hazards, routes, time,
rover suitability, and EVA. Unsupported questions receive a limitation
message instead of an invented answer.

### Offline boundary

Offline AI means supported assistant questions do not need a remote AI call. It
does not mean that every new uncached NASA tile, remote photograph, archive
page, or live external feed is available without a network. The service worker
caches the application shell, local assets, and previously requested resources.

## Architecture

```text
React + TypeScript UI
  ├─ Flat Map / Leaflet
  ├─ 3D Globe / Three.js
  ├─ Astronaut EVA / surface renderer + HUD
  ├─ Search, places, missions, science, and routes
  └─ Offline Ask MarsWay
          │
          ▼
Local datasets and deterministic engines
  ├─ USGS/IAU feature catalogue
  ├─ elevation and pressure model
  ├─ route and safety engine
  ├─ atmosphere, dust, radiation, and space-weather models
  └─ local multilingual intent matcher
          │
          ▼
Express API + Vite server
```

Important files:

```text
src/App.tsx                              application shell and view state
src/components/map/RealMarsMap.tsx      2D map and GIS interactions
src/components/map/Mars3DGlobe.tsx      Three.js globe
src/components/map/MarsAstronautView.tsx EVA scene, HUD, and movement
src/components/mission/MarsRouteSafetyHUD.tsx route safety panel
src/components/mission/MarsRoutePlannerModal.tsx route configuration
src/engine/marsAStarRouter.ts            route generation and time model
src/engine/marsRouteSafetyAnalyzer.ts    hazards and safety explanation
src/engine/offlineMarsRiskModel.ts       local dust-risk estimator
src/engine/marsMolaElevation.ts          elevation and pressure model
src/data/usgsMarsGazetteer.ts            local feature catalogue
src/data/provenanceData.ts               source metadata
src/apiApp.ts                            local API and assistant
public/sw.js                             offline-first cache
tests/                                   deterministic tests
```

## Installation and running

Requirements: Node.js 20.19+ or Node.js 22+, npm or Bun, and a modern
WebGL-capable browser.

```bash
npm install
npm run dev
```

Open `http://localhost:3000`.

If port 3000 is busy in PowerShell:

```powershell
$env:PORT=3001
npm run dev
```

Production:

```bash
npm run build
npm run start
```

No AI key is required. Optional setting:

```env
PORT=3000
```

## API reference

| Method | Endpoint | Purpose |
| --- | --- | --- |
| GET | `/api/health` | Service status, offline mode, and dataset counts. |
| GET | `/api/regions` | Mars region metadata. |
| GET | `/api/layers` | Basemap and provenance metadata. |
| GET | `/api/features` | Search the local feature catalogue. |
| GET | `/api/features/:featureId` | Read one feature. |
| GET | `/api/elevation?lat=...&lng=...` | Local modeled elevation and pressure. |
| GET | `/api/weather?scenario=...` | Local environmental/space-weather scenario. |
| POST | `/api/routes/plan` | Generate route candidates and safety analysis. |
| GET/POST/PUT | `/api/missions...` | In-memory mission records. |
| POST | `/api/ask-marsway` | Offline local assistant. |

Example:

```bash
curl -X POST http://localhost:3000/api/ask-marsway \
  -H "Content-Type: application/json" \
  -d '{"query":"Mars er gas ki?"}'
```

## User interface guide

### Header and bottom dock

- **3D Globe:** global planetary view.
- **Flat Map:** detailed GIS and route workspace.
- **Astronaut EVA:** local first-person surface exploration.
- **Search:** places, missions, rovers, and science targets.
- **Route Plan:** START/FINAL selection and route comparison.
- **Missions:** rover, lander, orbiter, and mission records.
- **Base Plan:** landing/base-planning context.
- **Ask AI / AI:** local assistant.
- **Menu:** additional tools and controls.
- **Layers:** basemaps and scientific overlays.
- **Places:** feature categories and labels.
- **Tools:** measurements and analysis tools.
- **Weather:** environment and space-weather context.
- **Voice:** browser speech controls where supported.

### Place dossier

A dossier can show official identity, category, coordinates, elevation, region,
geology, water/ice, atmosphere, human safety, rover suitability, mission
relationship, imagery, Earth-scale comparison, profiles, and route actions.
Long content is scrollable and modal actions remain above the bottom dock.

### 3D Globe

Use it to rotate Mars, zoom the planetary view, inspect mission markers, view
sunlight, inspect Phobos and Deimos, compare Earth scale, and hand off to the
2D map. It is a global orientation view, not a detailed route authority.

### Astronaut EVA

The astronaut stays at a local surface position rather than showing a full
global map. W/A/S/D and the visible controls move the astronaut. The recon
inset, compass, telemetry, forward scan, geology scan, sample action, and
tactical map are separate functional layers.

## Complete function reference

### Application shell and navigation

The shared shell keeps the active view, selected location, route context,
mission context, layer state, modal state, and assistant context connected.

| Control | Function | Result |
| --- | --- | --- |
| MarsWay logo | Return to the main workspace | Restores the primary map shell. |
| 3D Globe | Open planetary overview | Shows Mars, missions, moons, sunlight, and global context. |
| Flat Map | Open detailed GIS view | Shows surface imagery, labels, places, and route tools. |
| Astronaut EVA | Open local exploration view | Shows first-person surface movement and suit HUD. |
| Search | Search places, missions, rovers, and science targets | Results can fly the map to a location or open a dossier. |
| Route Plan | Start endpoint selection | The next two map clicks become START and FINAL. |
| Missions | Open mission explorer | Filters and displays rover, lander, orbiter, and mission records. |
| Base Plan | Open base/landing context | Shows planning-oriented landing and environmental information. |
| Ask AI | Open Ask MarsWay | Opens the offline assistant; no API key is required. |
| Menu | Open global tools | Provides additional application and presentation actions. |
| Layers | Open basemap/overlay controls | Changes imagery and scientific overlays. |
| Places | Filter named features | Filters craters, volcanoes, canyons, plains, and missions. |
| Tools | Open analysis tools | Provides measurement, elevation, profiles, and GIS utilities. |
| Weather | Open environmental context | Shows atmosphere, dust, temperature, wind, and radiation context. |
| Voice | Start browser speech controls | Uses browser speech support when available. |

### Flat Map interaction rules

1. Dragging pans the map and updates its centre.
2. Mouse wheel, plus/minus buttons, and touch pinch change zoom.
3. Clicking a marker selects a feature and can open its dossier.
4. Search normalises the query, filters local records, and flies to a result.
5. The compass changes the visual bearing while keeping labels readable.
6. The coordinate panel reports the current or inspected Mars position.
7. The scale bar recalculates distance using Mars map scale and latitude.
8. Layer changes preserve the selected location and route state.
9. Public NASA tiles load progressively over the local fallback layer.
10. Closing a modal does not delete the selected place or active route.

### Place dossier functions

A place dossier is a contextual information panel. Depending on the selected
record, it may contain:

- official name, feature type, and coordinates;
- elevation and regional location;
- water/ice and resource information;
- atmospheric gas, pressure, temperature, and precipitation context;
- human survivability and EVA warning;
- rover suitability and terrain interpretation;
- mission, lander, rover, or traverse relationship;
- photos and archive links where available;
- Earth-scale comparison and elevation profile actions;
- “Plan Route to This Site” action;
- 360 EVA or Astronaut View action where supported.

The panel is scrollable. Actions remain available above the bottom navigation,
and close controls are always visible on desktop and mobile layouts.

### Layer system

The layer system separates visual basemaps from scientific overlays:

- **Viking true colour:** general surface appearance and place orientation.
- **MOLA shaded relief:** elevation form, escarpments, basins, and slopes.
- **THEMIS infrared:** thermal-style regional contrast.
- **Places:** official/curated geological feature labels.
- **Missions:** landing sites, rovers, landers, orbiters, and tracks.
- **Regions:** named regional boundaries and map context.
- **Hazards:** areas considered by route safety analysis.
- **Atmosphere:** pressure, temperature, wind, and gas context.
- **Dust:** simulated or modeled atmospheric visibility context.
- **Elevation tools:** point elevation and transect profiles.

### Mission Explorer

Mission Explorer supports search and category filtering for rovers, landers,
and orbiters. A mission record can provide agency, arrival date, landing site,
mission purpose, status, science objective, traverse relationship, and links to
map or dossier actions. Mission records are curated educational context, not a
live spacecraft telemetry stream.

### Route Plan state machine

```text
IDLE
  └─ click Route Plan
      SELECT START
        └─ first map click
            SELECT FINAL
              └─ second map click
                  READY
                    └─ Check Route
                        CHECKED
                          ├─ compare candidates
                          ├─ Details
                          ├─ Fit to Map
                          └─ Safe Corridor Active
                              ACTIVE ROUTE
```

The first click is never treated as a complete route. The second click does not
automatically make the route safe. Safety is calculated only after the route
engine receives both endpoints and the selected options.

### Route result interpretation

The route panel should be read in this order:

1. **Status:** Nominal, Caution, Concern, or Hazard.
2. **Direct path:** distance, slope, and direct-corridor issue.
3. **Recommended path:** route distance, time, and hazard reduction.
4. **Trade-off:** additional distance/time versus improved safety.
5. **Details:** terrain, soil, dust, elevation, and science factors.
6. **Map line:** verify that the visual line matches the selected endpoints.

Example mission explanation:

```text
Shortest: 18.4 km, 6.1 h, crosses a steep scarp.
Safest:   21.0 km, 7.0 h, avoids the scarp and improves traction.
Science:  24.6 km, 8.2 h, visits a clay-bearing target before the destination.
```

### 3D Globe controls

- Drag to orbit the camera around Mars.
- Wheel or pinch to zoom the planetary view.
- Use the sun/lighting control to change illumination context.
- Use mission markers to inspect global landing locations.
- Use Phobos and Deimos controls for moon context.
- Use Earth Scale to communicate planetary size.
- Use 2D View for detailed map navigation.
- Use Astronaut EVA for local surface exploration.

### Astronaut EVA controls

- **Mouse movement:** head/look direction where pointer capture is available.
- **W:** move forward.
- **S:** move backward.
- **A/D:** strafe left/right.
- **Controller arrows:** move or turn using the visible interface.
- **Altitude controls:** adjust vertical movement in the simulated EVA model.
- **Target reticle:** identify the area under inspection.
- **Laser LIBS Scan:** show mineral/composition context.
- **Sample:** record a simulated science collection action.
- **Tactical Map:** open the real map without losing the EVA context.
- **Forward Scan:** report whether the corridor is smooth, cautionary, or risky.

## Demonstration script

For a clear presentation, use this sequence:

1. Start on Flat Map and show a named region and mission markers.
2. Search for **Jezero Crater** and open the place dossier.
3. Show atmosphere, water/ice, human, rover, and provenance labels.
4. Explain the scientific objective: “find clay-bearing delta deposits.”
5. Click Route Plan and select a START near the landing zone.
6. Select a FINAL near the target delta.
7. Choose rover or EVA mode and run Check Route.
8. Compare the shortest direct path with the safer bypass.
9. Show distance, time, slope, soil, hazards, and route colours.
10. Use Fit to Map and Safe Corridor Active.
11. Ask in English: “Why is the direct route risky?”
12. Ask in Banglish: “Kon route e time kom lagbe?”
13. Ask in Bangla: “মঙ্গল গ্রহে মানুষ কি বাঁচতে পারবে?”
14. Switch to 3D Globe to show planetary scale.
15. Switch to Astronaut EVA and demonstrate local movement and forward scan.

The central judging moment is the route comparison: a short direct route can
cross a modeled hazard while a slightly longer route avoids it and provides a
clearer operational recommendation.

## Troubleshooting

### Port already in use

```powershell
$env:PORT=3001
npm run dev
```

Then open `http://localhost:3001`.

### Map starts with a loading state

The bundled surface should appear first. Public NASA tiles may continue loading
in the background. If the network is unavailable, search, places, routes,
science models, and the offline assistant can continue using local data.

### Map tiles look incomplete

This usually means a public tile request is slow or rate-limited. Wait for the
progressive load, change to the Viking fallback-compatible layer, or continue
with the local surface. The application should not become unusable because one
remote tile failed.

### Modals overlap

Close the active panel with its X button or Escape, then reopen the desired
tool. The current UI uses separate top-level modal layers and responsive
scrolling; a new issue should be checked at both desktop and mobile widths.

### Route appears safe unexpectedly

Check the selected objective, transport mode, endpoints, and route details.
“Nominal” means the current local model found no critical issue; it does not
mean the route has been physically verified by a rover or astronaut.

### Ask MarsWay does not answer an arbitrary question

The assistant is intentionally bounded. Try a supported question about gas,
atmosphere, a place, route safety, route time, soil, terrain, rover suitability,
or EVA help. No Gemini key is required.

## Development and verification

```bash
npm run lint
npm test
npm run build
```

Before release, verify:

1. Flat Map shows the local fallback before public tiles finish.
2. NASA tiles replace it progressively without black gaps.
3. Search opens the correct result and coordinate.
4. Place, mission, science, and route modals close correctly.
5. Route Plan stores START and FINAL in order.
6. Shortest, safest, and science routes show meaningful differences.
7. Fit to Map frames the route.
8. Compass rotation does not create empty edges or break pointer mapping.
9. 3D Globe, Flat Map, and EVA handoffs work.
10. Ask MarsWay answers English, Bangla, and Banglish without an API key.
11. Desktop and mobile modal layouts remain usable.
12. Browser console has no new runtime errors.

## Limitations

- Not flight-certified and not suitable as the sole operational navigation
  source.
- MOLA-scale elevation cannot resolve every small rock, rut, cliff, or void.
- HiRISE and CRISM coverage is targeted, not uniform.
- Soil, terrain, dust, weather, radiation, pressure, and route time may be
  historical, derived, modeled, or simulated.
- The route engine does not replace lidar, rover AutoNav, field sampling, or
  astronaut judgement.
- Public NASA tiles and remote archives may be unavailable or slow.
- New uncached imagery may require a network.
- In-memory mission records may disappear after a server restart.
- WebGL performance depends on hardware and browser capability.

The correct interpretation is: **the best result supported by the current
local model and datasets, not a guarantee that a route is safe in the real
Martian environment.**

## Project value

MarsWay turns distributed Mars science into an understandable and explainable
exploration workflow. Its local-first design is especially valuable during a
network outage or simulated emergency: users can still search bundled places,
inspect local science models, calculate route candidates, compare hazards, and
receive bounded basic help without a Gemini key or remote AI service.
