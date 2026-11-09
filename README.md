# MarsWay

## Explore Mars. Navigate Safer. Discover More.

MarsWay is an interactive Mars GIS, science-exploration, EVA-visualization, and mission-planning prototype. It brings planetary places, orbital basemaps, rover missions, environmental context, explainable route analysis, and a local multilingual assistant into one browser application.

> **Important:** MarsWay is educational decision-support software for the NASA Space Apps Challenge 2026 theme **Interplanetary Survival Guide: Martian Map**. It is not flight-certified navigation software and must not be used as the sole source for real astronaut or rover operations.

![React](https://img.shields.io/badge/React-19-20232a?logo=react&logoColor=61dafb)
![TypeScript](https://img.shields.io/badge/TypeScript-7-3178c6?logo=typescript&logoColor=white)
![Vite](https://img.shields.io/badge/Vite-8-646cff?logo=vite&logoColor=white)
![Leaflet](https://img.shields.io/badge/Leaflet-1.9-199900?logo=leaflet&logoColor=white)
![Three.js](https://img.shields.io/badge/Three.js-0.186-black?logo=three.js)

## What problem MarsWay solves

Mars data is distributed across planetary nomenclature catalogues, orbital imagery, elevation products, mineralogy archives, rover records, environmental instruments, and mission documents. A place name alone does not explain whether a crew or rover can reach it. A line on a map does not explain slope, soil, hazards, pressure, dust, or travel time.

MarsWay connects those pieces in one explainable workflow:

1. Find a named Martian place.
2. Inspect its location, science, environment, and mission context.
3. Select a START point and FINAL point.
4. Compare shortest, safest, and science-oriented routes.
5. Understand terrain, soil, hazard, and time trade-offs.
6. Ask the local assistant for a simple explanation.

## Features

### Flat Map / 2D GIS

- Leaflet-based global Mars map with wrap-safe east/west navigation.
- NASA Mars Trek layers for Viking true colour, MOLA shaded topography, and THEMIS daytime infrared.
- Bundled Viking mosaic fallback for faster startup and network failure recovery.
- Official feature search for craters, plains, valleys, canyons, volcanoes, mesas, landing sites, rovers, and missions.
- Progressive label decluttering, coordinates, scale, compass, region boundaries, mission markers, rover tracks, measurements, and GIS tools.
- Direct START/FINAL selection for route planning.

### Three.js 3D Globe

- Global Mars orientation with lighting, atmosphere, mission markers, Phobos, Deimos, orbit context, and Earth-scale comparison.
- Viking global mosaic used as the planetary surface texture.
- Intended for global orientation; detailed routing remains centred on the 2D map and route engine.

### Astronaut EVA

- Human-centred first-person EVA presentation with helmet/HUD styling.
- Real Mars reconnaissance inset and local Viking surface texture mapped to the 3D terrain.
- Telemetry, compass, EVA timer, target reticle, scan card, sample action, movement controls, and forward hazard guidance.
- Designed as an educational surface simulation, not a photogrammetric reconstruction of every rock.

### Environmental science

- CO₂-dominated atmosphere, pressure, temperature, wind, dust, precipitation, water/ice, and resource context.
- Elevation, slope, terrain suitability, and soil trafficability.
- Human EVA requirements, rover suitability, radiation, and space-weather context.
- Provenance labels: **OBSERVED**, **HISTORICAL**, **DERIVED**, **MODELED**, and **SIMULATED**.

### Explainable route planning

1. Click **Route Plan**.
2. Click the map for START.
3. Click the map for FINAL.
4. Choose foot or rover travel and crew configuration.
5. Compare **Safest**, **Shortest**, and **Science** routes.
6. Click **Check Route**.

The local route engine evaluates Mars distance, MOLA-style elevation, slope, soil trafficability, terrain suitability, hazards, transport mode, crew assumptions, and science/resource value. A safer route may be longer or slower. A green/nominal result only means that the available model found no major issue; it is not an operational safety guarantee.

## NASA and USGS data used

| Data family | How MarsWay uses it |
| --- | --- |
| **USGS/IAU Planetary Nomenclature** | Official feature names, types, coordinates, search, labels, and place identity. |
| **MGS MOLA MEGDR** | Global elevation, MOLA Areoid reference, slope, elevation profiles, pressure adjustment, and route penalties. |
| **MRO HiRISE** | Targeted high-resolution imagery/DTMs for Jezero, Gale, landing-site, rock, and terrain context. |
| **MRO CRISM** | Hydrated minerals, clay/smectite, carbonate, and resource/science interpretation. |
| **Mars Odyssey THEMIS** | Daytime infrared/thermal layer and regional surface interpretation. |
| **Mars 2020 MEDA** | Historical Jezero pressure, wind, temperature, dust, and environmental baseline. |
| **Mars 2020 instruments** | Mastcam-Z, SuperCam, PIXL, SHERLOC, and RIMFAX science-target and sample context. |
| **MSL RAD** | Gale Crater radiation baseline and explicitly modelled cross-location shielding comparison. |
| **NASA/JPL archives** | Rover/lander identity, mission history, educational imagery, and science references. |
| **NASA Mars Trek** | Public Viking, MOLA, and THEMIS basemap tiles. |

### Provenance meanings

- **Observed:** represented by an image, measurement, archive record, or instrument observation.
- **Historical:** recorded by a past mission or mapping campaign; not live telemetry.
- **Derived:** calculated from coordinates, geometry, or catalogue relationships.
- **Modeled:** produced by a transparent scientific/engineering approximation.
- **Simulated:** generated for visualization, education, or scenario exploration.

## Why the AI is offline

Ask MarsWay is local, deterministic, and bounded. It does not use Gemini, OpenAI, a remote LLM, an AI API key, or a provider-specific SDK.

Mars operations and emergency demonstrations may involve communication delay, network loss, low bandwidth, public-service outages, or no access to an AI account. A local assistant keeps basic guidance available without sending questions outside the application. It is also private, predictable, fast, easy to deploy, and easier to audit.

It supports basic questions in English, Bangla Unicode, and Banglish:

```text
What gas is on Mars?
মঙ্গল গ্রহে মানুষ থাকতে পারবে?
Mars er gas ki?
Ei route safe?
Kon route e time kom lagbe?
```

Supported topics include atmosphere, gases, human survivability, EVA, rover suitability, places, elevation, soil, terrain, hazards, route safety, route time, and route comparison. It reads the selected location and active route when available. Unsupported questions receive a limitation message instead of an invented answer.

### Offline-first behaviour

The service worker caches the application shell, local assets, and previously requested resources. External NASA tiles use network-first behaviour with cache fallback. After the application has been visited once, the following can continue without network AI:

- Local feature search.
- Route calculation and safety explanation.
- Local elevation, atmosphere, and science models.
- Ask MarsWay basic help.
- Previously cached imagery and application assets.

New uncached public imagery and remote photographs may still require a network connection.

## Architecture

```text
React UI
  ├─ Flat Map / Leaflet
  ├─ 3D Globe / Three.js
  ├─ Astronaut EVA / Three.js + HUD
  ├─ Search, places, missions, science, and routes
  └─ Offline Ask MarsWay
          │
          ▼
Local Mars datasets and deterministic engines
  ├─ USGS/IAU feature catalogue
  ├─ elevation and pressure model
  ├─ route and safety engine
  ├─ atmosphere / space-weather models
  └─ local assistant intent matcher
          │
          ▼
Express API + Vite server
```

Important files:

```text
src/components/map/RealMarsMap.tsx       2D map and GIS interactions
src/components/map/Mars3DGlobe.tsx       Three.js globe
src/components/map/MarsAstronautView.tsx EVA scene, HUD, texture, movement
src/engine/marsAStarRouter.ts            route generation and time model
src/engine/marsRouteSafetyAnalyzer.ts    hazards and safety explanation
src/engine/marsMolaElevation.ts          elevation and pressure model
src/data/provenanceData.ts               NASA dataset catalogue
src/data/usgsMarsGazetteer.ts            official feature parser
src/apiApp.ts                            local API and assistant
public/sw.js                             offline-first service worker
tests/                                   deterministic tests
```

## Installation and running

Requirements: Node.js 20.19+ or Node.js 22+, npm/Bun, and a modern WebGL-capable browser.

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

No AI key is required. Optional environment setting:

```env
PORT=3000
```

## API reference

| Method | Endpoint | Purpose |
| --- | --- | --- |
| GET | `/api/health` | Service status, offline AI mode, and dataset counts |
| GET | `/api/regions` | Mars region metadata |
| GET | `/api/layers` | Basemap and provenance metadata |
| GET | `/api/features` | Search the local feature catalogue |
| GET | `/api/features/:featureId` | Read one feature |
| GET | `/api/elevation?lat=...&lng=...` | Local modeled elevation and pressure |
| GET | `/api/weather?scenario=...` | Local environment/space-weather scenario |
| POST | `/api/routes/plan` | Generate local route candidates |
| GET/POST/PUT | `/api/missions...` | In-memory mission records |
| POST | `/api/ask-marsway` | Offline local assistant |

Example:

```bash
curl -X POST http://localhost:3000/api/ask-marsway \
  -H "Content-Type: application/json" \
  -d '{"query":"Mars er gas ki?"}'
```

## Complete user guide

## Full web function map

This section explains the visible web interface from top to bottom and the function behind each major control.

### 1. Global application shell

The global shell is shared by all primary views. It keeps the selected Mars location, active mission context, route context, modal state, and navigation state connected.

| Area | Control | Function |
| --- | --- | --- |
| Header left | MarsWay logo | Returns the user to the main Mars workspace. |
| Header left | `3D Globe` | Opens the Three.js planetary overview. |
| Header left | `Flat Map` | Opens the Leaflet GIS map and route workspace. |
| Header left | `Astronaut EVA` | Opens the first-person surface exploration experience. |
| Header right | `Search` | Opens place, rover, mission, and feature search. |
| Header right | `Route Plan` | Activates START/FINAL route selection and route comparison. |
| Header right | `Missions` | Opens mission and rover records. |
| Header right | `Base Plan` | Opens base/landing planning context. |
| Header right | `Ask AI` | Opens the local offline Ask MarsWay assistant. |
| Header right | `Menu` | Opens additional tools and application options. |
| Bottom dock | Missions | Opens mission filters, records, and activity context. |
| Bottom dock | Layers | Opens basemap and scientific overlay controls. |
| Bottom dock | Places | Opens the place catalogue and feature categories. |
| Bottom dock | Tools | Opens measurement, elevation, atmosphere, and GIS tools. |
| Bottom dock | Weather | Opens environment and space-weather context. |
| Bottom dock | Search | Opens the global search flow. |
| Bottom dock | AI | Opens the local assistant. |
| Bottom dock | Voice | Activates browser speech controls where supported. |

The shell uses shared modal layering so a card, dossier, route panel, and bottom dock do not incorrectly cover each other. Close buttons, Escape handling, and outside-click behaviour are used where supported by the active panel.

### 2. Flat Map controls

The Flat Map is the main GIS screen.

| Map function | How the user uses it | What happens internally |
| --- | --- | --- |
| Pan | Drag the map or use a touch gesture. | Leaflet updates the centre coordinate and visible feature set. |
| Zoom | Use `+`, `-`, mouse wheel, or touch pinch. | Leaflet changes scale; labels and feature density are recalculated. |
| Search | Type a named place or mission. | Local catalogue/API filtering returns matching Mars records and map coordinates. |
| Click a place | Click a marker or label. | The place becomes selected and its dossier/context can open. |
| Coordinate readout | Move over or click the map. | Latitude, longitude, elevation, and related local context are calculated. |
| Compass | Use the compass/orientation control. | Map bearing and visual orientation are updated while preserving readable labels. |
| Scale bar | Read the lower map scale. | Scale is recalculated from Mars map zoom and latitude. |
| Route selection | Click Route Plan, then click twice. | First click creates START; second creates FINAL; route state becomes ready for analysis. |
| Measurement | Open Tools and select measurement. | Points, distance, bearing, elevation difference, or transect data are calculated. |
| Feature filter | Choose craters, volcanoes, canyons, plains, missions, or all places. | Marker visibility is filtered without deleting the underlying dataset. |
| Basemap | Choose Viking, MOLA, or THEMIS. | The active Leaflet tile layer changes and provenance is retained. |

The map intentionally uses progressive disclosure. At global scale, only important labels are shown. At regional scale, more official features and mission points are revealed. This prevents the entire planet from becoming a wall of overlapping text.

### 3. Layer system

The layer panel controls visual and scientific overlays independently.

- **Viking true colour:** visible Mars surface mosaic for general interpretation.
- **MOLA shaded relief:** topographic form and elevation context.
- **THEMIS infrared:** thermal-style surface contrast.
- **Places:** named geological and planetary features.
- **Missions:** landers, rovers, mission sites, and tracks.
- **Regions:** named regional boundaries and planetary quadrangles.
- **Hazards:** modelled areas considered by route analysis.
- **Atmosphere/weather:** pressure, wind, dust, and environmental overlays.
- **Elevation tools:** MOLA-style point inspection and transects.

The remote tile layer is preferred. While tiles are incomplete, the application avoids showing a differently coloured local image beside remote tiles. If remote imagery fails, a consistent whole-map local Viking fallback is used.

### 4. Search function

Search works across official and curated local records. A result may represent a geological feature, rover, lander, mission, region, or science target.

Search flow:

1. User types a name or keyword.
2. Text is normalised for case and common variants.
3. Local records and API results are filtered.
4. Matching results show category, coordinates, and context.
5. Selecting a result flies the map to that coordinate.
6. The same result can become a route endpoint or dossier target.

Search does not create new scientific facts; it retrieves and presents the local catalogue.

### 5. Place dossier and modal functions

A place dossier is a contextual panel, not just a popup label. It can expose:

- Place name and official category.
- Latitude, longitude, elevation, and region.
- Water/ice and resource context.
- Atmosphere, gas, pressure, temperature, and precipitation context.
- Human safety and rover suitability.
- Mission/lander/rover relationship.
- Photos or archive links where available.
- Earth-scale or profile tools.
- Route actions such as use as START or FINAL.

Long content is scrollable inside the modal. The modal is rendered in the correct top-level layer so the bottom navigation cannot cut off its buttons.

### 6. Route Plan function map

Route Plan has four states:

1. **Idle:** no endpoint selection is active.
2. **Select START:** the next map click creates the departure point.
3. **Select FINAL:** the next map click creates the destination point.
4. **Analysed:** candidate routes and safety explanations are available.

After analysis, the panel can show:

- Selected route name and objective.
- Start and final names/coordinates.
- Distance and estimated travel time.
- Transport mode and crew configuration.
- Maximum slope and elevation change.
- Soil trafficability and terrain suitability.
- Hazard count/exposure and direct-corridor warning.
- Safer bypass recommendation.
- Route line and waypoints on the map.

The active route is also passed into Ask MarsWay so the assistant can answer questions about the current route rather than giving a generic answer.

### 7. Mission function map

The Missions function combines mission identity and map context.

- Filter by mission, rover, lander, agency, or status.
- Select a mission marker to inspect landing location and timeline context.
- View rover/lander name, mission purpose, coordinates, and science activity.
- Display traverse tracks where available.
- Open related photos or science dossiers.
- Use a mission location as a route endpoint.

Mission records are curated for the educational prototype. They are not a live spacecraft telemetry stream.

### 8. Science and environment function map

Science cards transform numbers into readable explanations.

- **Atmosphere:** thin CO₂-dominated air, pressure, and gas context.
- **Water/Ice:** surface hydration, ice indicators, and resource proxy context.
- **Human:** suit requirement, pressure danger, radiation context, and EVA warning.
- **Rover:** terrain/soil suitability and movement implications.
- **Weather:** historical/modelled temperature, wind, dust, and precipitation context.
- **Geology:** mineral composition, terrain type, and science target context.
- **Elevation:** MOLA reference height, slope, and pressure relationship.

Each card should be interpreted with its provenance label. The UI distinguishes live-looking presentation from actual live telemetry.

### 9. 3D Globe function map

- Rotate: orbit the camera around Mars.
- Zoom: change the planetary viewing distance.
- Lighting: view Mars under a directional sun model.
- Mission markers: inspect global mission locations.
- Moons: toggle or inspect Phobos and Deimos.
- Earth Scale: compare planetary size context.
- Surface/2D handoff: move from global orientation to the detailed map.

The globe answers “where is this on Mars?” The Flat Map and route engine answer “how can this location be approached?”

### 10. Astronaut EVA function map

- **Helmet/HUD:** fixed to the camera and displays suit telemetry.
- **Recon inset:** shows the astronaut's current geographic location on real Mars imagery.
- **Compass/heading:** shows orientation and target direction.
- **EVA timer:** records the current session duration.
- **Movement:** W/A/S/D or the visible controller changes local position.
- **Forward scan:** checks the corridor in front of the astronaut against modelled hazards.
- **Target reticle:** identifies the current inspection point.
- **Scan:** presents local geology/mineral composition.
- **Sample:** records a local science interaction in the UI.
- **Tactical Map:** opens a full GIS map without removing the EVA context.

The EVA camera represents the astronaut's eye position. The view is intentionally local rather than a zoomed-out global map. The terrain is real-texture-informed but not a certified high-resolution surface reconstruction.

### 11. Offline AI function map

Ask MarsWay follows this local sequence:

1. Receive text from the modal or API.
2. Normalise case, punctuation, Bangla/Banglish variants, and whitespace.
3. Detect a supported intent: place, atmosphere, route, safety, soil, terrain, time, rover, EVA, or help.
4. Read selected place and active route context.
5. Generate a bounded response from local templates and values.
6. Return `marsway-offline-local` as the source marker.

It does not call Gemini or another remote provider. This is important for privacy, resilience, predictable demonstrations, and emergency/no-network use. It also means the assistant cannot answer arbitrary questions like a general-purpose cloud model.

### 12. Voice function

Voice uses the browser Web Speech API. It may:

- Listen for supported navigation commands.
- Open a view or tool.
- Trigger search or route workflow.
- Read or respond to basic local commands where browser support permits.

Microphone permission, browser support, language settings, and device hardware affect voice behaviour. Voice is not the same as remote AI inference.

### A. Start with the Flat Map

The Flat Map is the best starting point because it shows the largest amount of searchable GIS information. The map is centred on Mars, not Earth, and uses Mars coordinates, Mars scale, Mars place names, and Mars-specific layers.

1. Use the search bar to type a place name such as `Jezero Crater`, `Olympus Mons`, `Valles Marineris`, or a rover name.
2. Select a result to fly the map to that location.
3. Open the place card to read its feature type, coordinates, elevation, mission context, and environment.
4. Use the layer panel to compare visible colour, infrared, elevation, mission, region, and hazard information.
5. Use the coordinate and measurement tools when a precise map location or distance is needed.

The map can continue east or west without exposing an unintended empty strip. Labels are deliberately reduced at global scale and become denser at local scale so the surface remains readable.

### B. Understand a place card

A place card may contain several different types of information. They should be read separately:

- **Identity:** official or curated feature name and feature class.
- **Location:** latitude, longitude, region, and map position.
- **Elevation:** local value referenced to the MOLA Areoid model.
- **Science:** geological, mineralogical, water/ice, or mission interpretation.
- **Environment:** pressure, temperature, wind, dust, radiation, or atmosphere context.
- **Operations:** rover suitability, human EVA requirements, route starting point, or mission relevance.
- **Provenance:** whether the value is observed, historical, derived, modeled, or simulated.

This separation prevents a modelled pressure or route score from being mistaken for a live measurement.

### C. Plan a route correctly

Route planning uses two explicit points so that the application never guesses the user's destination.

1. Click **Route Plan**.
2. Click the surface once. This creates the green START point.
3. Click the surface again. This creates the red FINAL point.
4. Select **Foot** for astronaut-style travel or **Rover** for vehicle travel.
5. Select the crew configuration when available.
6. Review the generated candidate routes.
7. Click **Check Route** to run the direct-corridor and candidate-path analysis.
8. Select a route to display it from the actual START coordinate to the actual FINAL coordinate.

The three route objectives have different meanings:

| Route mode | What it prioritizes | Typical trade-off |
| --- | --- | --- |
| **Shortest** | Lowest geometric travel distance | May cross steeper, rougher, or more hazardous terrain |
| **Safest** | Lower hazard, slope, soil, and terrain penalties | Can be longer or take more time |
| **Science** | Scientific targets and resource value along the route | May add stops and operational time |

### D. How route safety is calculated

The route engine is deterministic: the same inputs produce the same planning result. It combines several signals rather than using a single “safe” flag.

1. The direct start-to-final corridor is measured.
2. Candidate nodes are generated between the two points.
3. Each node receives local elevation, slope, terrain, soil, and hazard costs.
4. A route search combines accumulated cost with the estimated remaining distance.
5. Transport mode and crew assumptions modify speed and operational cost.
6. The safety analyzer checks the chosen route and the direct corridor again.
7. The UI explains the main concern and can suggest a bypass.

The most important route outputs are:

- **Distance:** Mars surface distance in kilometres.
- **Estimated time:** movement time adjusted for slope, soil, terrain, and mode.
- **Maximum slope:** steepest modelled part of the route.
- **Elevation change:** vertical change between and along route points.
- **Soil trafficability:** how suitable the model considers the surface for the selected mode.
- **Terrain suitability:** combined surface difficulty proxy.
- **Hazard exposure:** overlap or proximity to modelled hazard zones.
- **Explanation:** plain-language reason for the route status.

### E. Use the 3D Globe

The 3D Globe is for planetary orientation and storytelling:

- Drag to rotate Mars.
- Scroll or use the controls to change distance from the planet.
- Inspect mission markers and global features.
- Compare Mars with Earth scale when the control is available.
- View Phobos and Deimos in the orbital context.

The globe is not a replacement for local route analysis. For route endpoints, slope, hazards, and detailed terrain, return to Flat Map.

### F. Use Astronaut EVA mode

Astronaut EVA is a first-person educational presentation of a surface mission:

- The helmet HUD shows heart rate, oxygen, suit pressure, altitude, heading, and EVA time.
- The reconnaissance inset shows the astronaut's Mars position on a real Mars map.
- The target reticle identifies the current forward inspection point.
- The scan card exposes local geology/mineral context.
- LIBS scan and Sample controls represent science interactions.
- W/A/S/D and the movement controls change the local EVA position.
- Forward guidance can report a nominal corridor or recommend a heading change.

The EVA surface uses real Mars texture and local terrain logic, but it is still a visualization. It is not a complete local DEM with every rock, slope break, or obstacle reconstructed.

### G. Use layers and map imagery

- **Viking true colour:** visible global surface mosaic for general geography.
- **MOLA shaded relief:** topography and elevation-related surface form.
- **THEMIS infrared:** thermal-style surface contrast.
- **Missions:** landing sites, rover positions, and mission tracks.
- **Places:** named geological and mission features.
- **Hazards:** modelled areas considered relevant to route analysis.
- **Atmosphere/weather:** pressure, wind, dust, and environmental overlays.

Remote NASA tiles are preferred. While tiles are loading, the application avoids mixing a differently coloured local fallback with partially loaded remote imagery. If the remote service fails, the whole map can use the same local Viking fallback so the surface remains visually consistent.

### H. Ask MarsWay examples

```text
What gas is most common on Mars?
মঙ্গল গ্রহে মানুষের জন্য কী দরকার?
Mars er pressure koto?
Jezero Crater kothay?
Ei route safe ki?
Kon route e time kom lagbe?
Why is the safest route longer?
Rover ki ei terrain e jete parbe?
```

If a route is active, the assistant can use its status, distance, time, slope, soil score, terrain score, and hazards. If no route is active, it explains that START and FINAL must be selected first. If the question is outside the supported local topics, it says so instead of pretending to be a general AI.

### I. Voice controls

Voice controls use the browser's Web Speech API. The browser may request microphone permission. Voice behaviour depends on browser support, device microphone access, language settings, and local privacy permissions. Voice control is separate from the offline text assistant and does not require an AI key.

## Data lifecycle: from source to screen

```text
NASA / USGS archive or local catalogue
        ↓
Normalised Mars feature, mission, image, or measurement record
        ↓
Derived geometry, elevation, pressure, slope, or route values
        ↓
Science / route / environment explanation
        ↓
Map marker, HUD card, dossier, route line, or local assistant answer
```

MarsWay keeps source-backed facts separate from calculations. For example, a HiRISE image is a source observation; a slope value calculated from an elevation model is derived; a travel time adjusted for soil is modeled; and a dust visual effect is simulated.

## What works without a network

After the application has loaded once and local assets are cached, these functions can continue without a network AI service:

- Application shell and navigation.
- Local place search and bundled feature catalogue.
- Local route candidates and safety calculations.
- Local elevation, pressure, atmosphere, and science models.
- Offline Ask MarsWay responses.
- Previously cached imagery and static assets.

These may require a network if not already cached:

- New NASA Mars Trek tiles.
- New external mission photographs.
- Remote archive pages.
- Any future live data integration.

## Troubleshooting

### Port 3000 is busy

```powershell
$env:PORT=3001
npm run dev
```

To identify the listener on Windows:

```powershell
Get-NetTCPConnection -LocalPort 3000 -State Listen
```

### The page is blank or stale

Restart the current development server and hard-refresh with `Ctrl+Shift+R`. Confirm that the browser URL uses the same port printed by the server.

### Remote tiles are slow

Wait for the NASA tile status to finish, or continue using the local catalogue and route tools. If the public service fails, the application uses a consistent local Viking fallback where available.

### 3D or EVA does not render

Check WebGL support, graphics drivers, GPU-heavy browser tabs, and browser hardware acceleration. Flat Map and local route tools remain the best fallback for low-power devices.

### Route result looks unexpected

Confirm that both START and FINAL points are visible, check the selected transport mode, read the slope/soil/hazard explanation, and compare the Safest and Shortest candidates.

## Validation

```bash
npm run lint
npm test
npm run build
```

Tests cover distance, polygon area, slope, elevation, pressure, route generation, route safety, Martian walking speed, space weather, Jezero science data, and geographic science variation.

## Limitations

- MarsWay is not flight-ready or safety-certified.
- MOLA-scale elevation cannot resolve every boulder, rut, dune edge, or trench.
- HiRISE/CRISM coverage is targeted, not uniform across Mars.
- Soil, terrain, hazards, weather, radiation, and travel time may be modeled or historical.
- The route engine does not replace lidar, rover AutoNav, geotechnical sampling, or astronaut judgement.
- Public NASA/USGS services can be slow, rate-limited, unavailable, or network-dependent.
- The offline assistant answers only supported basic questions from bundled MarsWay data.
- In-memory missions may disappear after server restart.
- 3D/EVA performance depends on WebGL and device hardware.

See [LIMITATIONS.md](LIMITATIONS.md) and [METHODOLOGY.md](METHODOLOGY.md) for detailed scientific boundaries and equations.

## References

- [USGS/IAU Planetary Names](https://planetarynames.wr.usgs.gov/)
- [NASA Mars](https://mars.nasa.gov/)
- [NASA Mars Trek](https://trek.nasa.gov/mars/)
- [NASA Planetary Data System](https://pds.nasa.gov/)
- [HiRISE](https://hirise.lpl.arizona.edu/)
- [NASA Mars 2020 raw images](https://mars.nasa.gov/mars2020/multimedia/raw-images/)
- [NASA/JPL Photojournal](https://photojournal.jpl.nasa.gov/)
- [NASA Open Data](https://data.nasa.gov/)
