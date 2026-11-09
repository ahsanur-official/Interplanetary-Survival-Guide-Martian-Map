# MarsWay

## Explore Mars. Navigate Safer. Discover More.

MarsWay is an interactive Mars GIS and mission-planning prototype for exploring planetary places, rover missions, environmental conditions, terrain, and explainable travel routes in one browser application.

> Educational decision-support software for the NASA Space Apps Challenge 2026 theme **Interplanetary Survival Guide: Martian Map**. MarsWay is not flight-certified navigation software.

![React](https://img.shields.io/badge/React-19-20232a?logo=react&logoColor=61dafb)
![TypeScript](https://img.shields.io/badge/TypeScript-7-3178c6?logo=typescript&logoColor=white)
![Vite](https://img.shields.io/badge/Vite-8-646cff?logo=vite&logoColor=white)
![Leaflet](https://img.shields.io/badge/Leaflet-1.9-199900?logo=leaflet&logoColor=white)
![Three.js](https://img.shields.io/badge/Three.js-0.186-black?logo=three.js)
![Tailwind CSS](https://img.shields.io/badge/Tailwind_CSS-4-06b6d4?logo=tailwindcss&logoColor=white)

## Overview

Mars exploration data is spread across planetary nomenclature databases, orbital imagery, elevation products, rover records, weather observations, and mission archives. MarsWay brings those data families together so a user can find a Martian feature, understand its context, select a route, compare the safety/time trade-off, and inspect the result through a map, globe, EVA view, or local assistant.

The platform is designed for students, educators, planetary science enthusiasts, researchers, and mission-planning demonstrations.

## Features

### Mars map and exploration

- Global Leaflet-based 2D Mars map with wrap-safe horizontal navigation.
- NASA-style surface layers, coordinates, scale bar, compass, zoom, and filters.
- Official feature search for craters, plains, canyons, volcanoes, landing sites, and mission locations.
- Region boundaries, labels, rover markers, landing sites, and historical traverse overlays.
- NASA/JPL, HiRISE, Mars 2020, and photojournal image access where available.

### 3D globe and astronaut EVA

- Three.js Mars globe with lighting, orbit controls, moons, orbit visuals, and mission markers.
- Astronaut EVA presentation mode for a human exploration perspective.
- Earth-scale comparison and surface perspective tools.

### Environmental science

- Local pressure and CO2-dominated atmosphere context.
- Water/ice, precipitation, temperature, radiation, dust, human survivability, and rover suitability cards.
- MOLA-inspired elevation and slope analysis.
- MOLA, THEMIS, HiRISE, CRISM, MEDA, RAD, and mission-derived context where implemented.
- Provenance labels distinguish observed, historical, derived, modeled, and simulated values.

### Explainable route planning

- Select START and FINAL points directly on the map.
- Compare **Safest**, **Shortest**, and **Science** routes.
- Choose walking or rover travel and crew configuration.
- Estimate distance, duration, slope, elevation change, soil trafficability, terrain suitability, and hazard exposure.
- Use Jezero, Gale, and global modeled hazard zones where applicable.
- Show safer bypasses when the direct corridor crosses a modeled hazard.
- Draw the selected route from the actual START point to FINAL and explain the trade-offs.

The routing model is a transparent educational approximation using Mars geography, terrain proxies, slope, elevation, hazards, travel mode, and modeled soil/traction effects. A green or nominal result is not a guarantee of operational safety.

### Offline multilingual Ask MarsWay

Ask MarsWay works locally and requires no API key, remote model, or network AI service.

- Supports basic English, বাংলা, and Banglish questions.
- Answers questions about Mars atmosphere, gases, human survivability, rover suitability, places, routes, soil, terrain, hazards, and travel time.
- Uses the selected location and active route context when available.
- Explains why a safer route may be longer or slower.
- Gives a clear local-data fallback for unsupported questions.
- Browser voice navigation uses the Web Speech API.

## How it works

```text
User interaction
    |
    +--> React interface
    |       +--> 2D map / 3D globe / EVA view
    |       +--> places, missions, science, route and voice tools
    |
    +--> Local Mars data and models
    |       +--> feature catalog and regions
    |       +--> elevation and atmosphere models
    |       +--> hazard datasets
    |       +--> route and safety engines
    |
    +--> Express API
            +--> feature, elevation, weather and route endpoints
            +--> in-memory missions
            +--> offline local Ask MarsWay endpoint
```

## Project structure

```text
src/
  components/       React map, mission, science, route and common UI
  data/              Mars feature, mission, atmosphere and hazard datasets
  engine/            Routing, elevation, science, weather and local AI logic
  types/             Shared TypeScript models
  apiApp.ts          Express API assembled from local Mars data
server.ts            Development and production server entry point
tests/               Automated engine tests
public/              Static application assets
```

Important files include `RealMarsMap.tsx`, `marsAStarRouter.ts`, `marsRouteSafetyAnalyzer.ts`, `AskMarsWayModal.tsx`, `usgsMarsGazetteer.ts`, `marsGlobalHazards.ts`, and `apiApp.ts`.

## Installation and usage

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

Then open `http://localhost:3001`.

Production:

```bash
npm run build
npm run start
```

No AI key is required. Optional `.env` configuration:

```env
PORT=3000
```

## API reference

| Method | Endpoint | Purpose |
| --- | --- | --- |
| GET | `/api/health` | Service status and dataset counts |
| GET | `/api/regions` | Mars region metadata |
| GET | `/api/layers` | Layer and provenance metadata |
| GET | `/api/features` | Search the Mars feature catalog |
| GET | `/api/features/:featureId` | Read feature details |
| GET | `/api/elevation?lat=...&lng=...` | Read modeled elevation |
| GET | `/api/weather?scenario=...` | Read modeled environment |
| POST | `/api/routes/plan` | Generate local route candidates |
| GET | `/api/missions` | List in-memory missions |
| POST | `/api/missions` | Create an in-memory mission |
| GET/PUT | `/api/missions/:missionId` | Read or update a mission |
| POST | `/api/ask-marsway` | Ask the offline local assistant |

Example:

```bash
curl -X POST http://localhost:3000/api/ask-marsway \
  -H "Content-Type: application/json" \
  -d '{"query":"Banglish e Mars er gas ki?"}'
```

## Validation

```bash
npm run lint
npm test -- --run
npm run build
```

Tests cover Mars distance, polygon area, slope, elevation, route generation, route safety, Martian walking speed, pressure, space weather, Jezero data, and science analysis.

## Data references

- [USGS/IAU Planetary Names](https://planetarynames.wr.usgs.gov/)
- [NASA Mars](https://mars.nasa.gov/)
- [NASA Mars Trek](https://trek.nasa.gov/mars/)
- [NASA/JPL Photojournal](https://photojournal.jpl.nasa.gov/)
- [HiRISE](https://hirise.lpl.arizona.edu/)
- [Mars 2020 raw images](https://mars.nasa.gov/mars2020/multimedia/raw-images/)
- [NASA Open Data](https://data.nasa.gov/)

## Limitations

MarsWay is not flight-ready software and does not replace engineering review, rover AutoNav, astronaut judgment, real-time obstacle detection, or mission certification.

- MOLA-scale elevation cannot resolve every rock, rut, dune edge, or trench.
- Soil trafficability, terrain suitability, and global hazards are modeled proxies.
- Weather and radiation values may be historical, derived, or modeled baselines.
- Public NASA/USGS services may have network, rate, availability, or attribution constraints.
- Missions are held in server memory and may disappear after restart.
- The offline assistant answers only supported basic questions from local MarsWay data.
- 3D/EVA performance depends on browser WebGL and device hardware.

See [LIMITATIONS.md](LIMITATIONS.md) for the full statement.

**MarsWay - a visual and explainable way to explore where humans and robots might go next on Mars.**

## Detailed feature reference

### 1. First launch and navigation

When the application starts, MarsWay presents the map as the primary workspace. The header switches between the three main experiences:

- **Flat Map**: the practical GIS workspace for search, places, layers, measurements, routes, and science panels.
- **3D Globe**: a planetary overview for orientation, missions, moons, orbit context, and global scale.
- **Astronaut EVA**: a human-centered surface presentation for exploration and mission storytelling.

The same Mars location and mission context can be reused across these experiences. The bottom navigation exposes Missions, Layers, Places, Tools, Weather, Search, AI, and Voice without requiring the user to leave the map.

### 2. Finding a place

Use the search bar to find a named crater, volcano, canyon, plain, region, landing site, rover, or mission. A result can be selected to:

1. Fly the map to the location.
2. Show its name, type, coordinates, and contextual information.
3. Open environmental and science cards.
4. Use the location as a route START or FINAL point.
5. Compare it with another site or mission.

At global zoom the interface declutters labels so the map remains readable. As the user zooms into a region, more nearby names and official catalog features become visible.

### 3. Layer controls

Layer controls allow the user to combine surface visualization with scientific and operational overlays. Depending on the current view, the available controls include:

- Mars surface imagery and contrast modes.
- Named places and official feature labels.
- Mission and rover markers.
- Rover traverse tracks.
- Region boundaries and planetary quadrangles.
- Atmosphere, wind, dust, and storm visualizations.
- MOLA elevation availability and elevation profile tools.
- Hazard zones used by route analysis.
- Measurement and coordinate tools.

Layers are visual aids. Turning on a layer does not mean that its source is live or that it has operational navigation accuracy.

### 4. Route planning: complete user workflow

The intended route workflow is:

1. Click **Route Plan**.
2. Select the transport mode and crew setup.
3. Click once on the Mars surface to place the START point.
4. Click a second time to place the FINAL point.
5. Review the direct corridor and generated candidate routes.
6. Choose Safest, Shortest, or Science mode.
7. Click **Check Route** to run the safety assessment.
8. Read the distance, time, slope, soil, terrain, hazard, and explanation cards.
9. Apply the safer route if the direct path has a modeled concern.

The map keeps the selected endpoints visible and draws the currently active route. A route is not automatically marked safe simply because two points were selected. The assessment must use the route corridor, the local surface model, and the available hazard datasets.

### 5. What changes route time and safety

The route engine combines several factors:

- **Distance**: the geometric length of the candidate path.
- **Elevation**: uphill/downhill changes derived from the Mars elevation model.
- **Slope**: grade penalties affect walking and rover speed.
- **Soil trafficability**: a modeled estimate of how easily the selected vehicle or crew can cross the surface.
- **Terrain suitability**: a composite proxy for slope, roughness, and local surface difficulty.
- **Hazards**: route corridor exposure to regional or site-specific hazard zones.
- **Transport mode**: foot travel and rover travel use different speed/traction assumptions.
- **Crew configuration**: operational assumptions can change the planning multiplier.
- **Route objective**: safest, shortest, and science objectives use different weights.

The result is a planning estimate, not a promise. A longer route can be preferable when it avoids a steep slope, soft soil, dust-prone area, or hazard corridor.

### 6. Offline assistant behavior

Ask MarsWay is intentionally narrow and explainable. It is not a general-purpose chatbot. It detects supported intents locally and reads information already present in MarsWay.

Supported intent families include:

| Intent | Example question | Answer source |
| --- | --- | --- |
| Atmosphere | `What gas is on Mars?` | Local atmosphere model and science copy |
| Human safety | `Mars e manush thakte parbe?` | EVA and survivability context |
| Rover | `Ei jaygay rover cholbe?` | Terrain and rover suitability model |
| Place | `Where is Jezero Crater?` | Local feature catalog |
| Route | `Ei route safe?` | Active route and safety assessment |
| Soil | `Soil condition kemon?` | Local route/environment assessment |
| Time | `Which route takes less time?` | Candidate route comparison |
| Help | `How do I select a route?` | Local workflow guidance |

English, বাংলা, and Banglish are handled through normalized text and supported keyword patterns. The assistant returns a limitation message for unsupported topics instead of pretending to have unrestricted knowledge.

### 7. Voice navigation

The Voice control uses browser speech capabilities for local navigation and mission queries. Browser permissions may be required. Voice behavior depends on browser support, microphone access, language availability, and device settings. Voice navigation is not a remote AI service and does not require an AI key.

### 8. Troubleshooting

#### Port 3000 is busy

Use another port:

```powershell
$env:PORT=3001
npm run dev
```

On Windows, the process using port 3000 can be identified with:

```powershell
Get-NetTCPConnection -LocalPort 3000 -State Listen
```

Do not stop a process unless you recognize it as the old MarsWay development server.

#### Blank or stale page after a code change

- Stop the old development server.
- Start the current server again.
- Hard-refresh the browser with `Ctrl+Shift+R`.
- Confirm that the browser URL uses the same port printed by the server.

#### 3D view does not render

Check browser WebGL support, update the graphics driver, close other GPU-heavy tabs, and use Flat Map while diagnosing. The 2D map and API do not require the 3D renderer.

#### Map tiles or images are missing

Public NASA/USGS services may be unavailable, rate-limited, blocked by a network, or slow. Local feature and route tools can still work with bundled data.

### 9. Development checklist

Before submitting a change:

1. Run `npm run lint`.
2. Run `npm test -- --run`.
3. Run `npm run build`.
4. Start the app and open the printed local URL.
5. Test Flat Map, search, a feature detail, route START/FINAL selection, Check Route, AI, and one alternate view.
6. Confirm that the browser console has no new runtime errors.
7. Confirm that new data or claims include a source or an explicit modeled/simulated label.

### 10. Design principles

- **Explainability over false certainty**: every route result is a model with visible reasons.
- **Local-first assistance**: basic help remains available without a paid or remote AI dependency.
- **Scientific labeling**: measured, derived, modeled, and simulated values are not mixed silently.
- **Progressive disclosure**: global views stay readable while zoomed views reveal more detail.
- **Mission usability**: important actions are available from the map without navigating through many pages.
- **Graceful failure**: unavailable external imagery should not disable local catalog, science, or route tools.
