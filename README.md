# 🔴 MARSWAY — Next-Generation Mars Exploration & Marswalk Intelligence Platform

> **"Explore Smarter. Navigate Safer. Discover More."**  
> *An integrated planetary GIS, multi-objective astronaut EVA route planner, 3D planetary globe, first-person spacesuit surface simulator, and AI flight controller for Mars exploration.*

[![NASA Space Apps Challenge 2026](https://img.shields.io/badge/NASA%20Space%20Apps%20Challenge-2026%20Global%20Nominee-orange.svg)](https://spaceappschallenge.org)
[![Node.js](https://img.shields.io/badge/Node.js-22.x-green.svg)](https://nodejs.org)
[![React](https://img.shields.io/badge/React-19.0-blue.svg)](https://react.dev)
[![TypeScript](https://img.shields.io/badge/TypeScript-7.0%2B-blue.svg)](https://www.typescriptlang.org)
[![Three.js](https://img.shields.io/badge/Three.js-0.186-black.svg)](https://threejs.org)
[![Leaflet](https://img.shields.io/badge/Leaflet-1.9.4-brightgreen.svg)](https://leafletjs.com)
[![Gemini API](https://img.shields.io/badge/Google%20GenAI-gemini--3.8--flash%20%7C%20live-purple.svg)](https://ai.google.dev)
[![Tailwind CSS](https://img.shields.io/badge/TailwindCSS-v4-cyan.svg)](https://tailwindcss.com)

---

## 📑 Table of Contents

1. [Executive Summary & Problem Statement](#1-executive-summary--problem-statement)
2. [Platform Architecture & System Design](#2-platform-architecture--system-design)
3. [Key Exploration & Intelligence Modes](#3-key-exploration--intelligence-modes)
   - [3.1 3D Planetary Globe (Three.js WebGL)](#31-3d-planetary-globe-threejs-webgl)
   - [3.2 2D Flat Mercator Planetary GIS (Leaflet + NASA Trek)](#32-2d-flat-mercator-planetary-gis-leaflet--nasa-trek)
   - [3.3 Astronaut First-Person Surface EVA (3D Visor HUD & Audio)](#33-astronaut-first-person-surface-eva-3d-visor-hud--audio)
   - [3.4 A* Science-Aware Multi-Objective Route Planner & Safety HUD](#34-a-science-aware-multi-objective-route-planner--safety-hud)
   - [3.5 Ask MarsWay & Gemini Live Voice Flight Controller](#35-ask-marsway--gemini-live-voice-flight-controller)
4. [Authentic NASA Multi-Mission Data Pipeline](#4-authentic-nasa-multi-mission-data-pipeline)
5. [Mathematical & Scientific Formulation](#5-mathematical--scientific-formulation)
   - [5.1 Planetocentric Geodesy & Distance](#51-planetocentric-geodesy--distance)
   - [5.2 Margaria-Minetti Bioenergetic Metabolic Suited Walking Model (0.38g)](#52-margaria-minetti-bioenergetic-metabolic-suited-walking-model-038g)
   - [5.3 Multi-Objective Pareto Traverse Formulation](#53-multi-objective-pareto-traverse-formulation)
   - [5.4 MOLA Topographic Elevation & Slope Gradient Extraction](#54-mola-topographic-elevation--slope-gradient-extraction)
6. [Complete Codebase Architecture & File Map](#6-complete-codebase-architecture--file-map)
7. [Installation, Setup & Deployment](#7-installation-setup--deployment)
8. [API Reference & Telemetry Endpoints](#8-api-reference--telemetry-endpoints)
9. [NASA Space Apps Challenge 2026 Alignment](#9-nasa-space-apps-challenge-2026-alignment)
10. [Scientific Honesty & Operational Disclaimer](#10-scientific-honesty--operational-disclaimer)

---

## 1. Executive Summary & Problem Statement

Over sixty years of robotic Mars exploration by NASA, ESA, ISRO, and CNSA have accumulated petabytes of high-precision imagery, altimetry, hyperspectral mineralogy, and surface meteorological telemetry. However, when planning future human **Extravehicular Activities (EVAs / "Marswalks")**, existing software tools treat navigation as a simplistic shortest-distance geometric problem.

On Mars, the shortest geometric line is frequently hazardous or scientifically unproductive:
- **Catastrophic Terrain:** Slopes $> 15^\circ$ increase astronaut slippage and suit-abrasion risks; slopes $> 25^\circ$ induce life-threatening tumble risks.
- **Aeolian Hazards:** Uncompacted transverse sand ripple fields (such as the *Séítah* unit in Jezero Crater) can entrap robotic wheels and suited boots.
- **Missed Scientific Discoveries:** A simple detour of only 200–400 meters can yield access to prime astrobiological biosignatures (e.g., smectite clay-rich mudstones, deltaic bottomset beds, hydrothermal silica sinter) that would otherwise be bypassed.

**MARSWAY** is an interactive planetary intelligence decision-support platform that transforms raw archival planetary data into actionable, explainable mission navigation for the future human exploration of Mars.

---

## 2. Platform Architecture & System Design

```
                                  ┌────────────────────────────────────────────────────────┐
                                  │                  MARSWAY PLATFORM                      │
                                  └──────────────────────────┬─────────────────────────────┘
                                                             │
                    ┌────────────────────────────────────────┴────────────────────────────────────────┐
                    ▼                                                                                 ▼
     ┌─────────────────────────────┐                                                   ┌─────────────────────────────┐
     │      CLIENT / FRONTEND      │                                                   │     BACKEND / SERVER.TS     │
     │      React 19 + TypeScript  │                                                   │     Express + Node.js 22    │
     └──────────────┬──────────────┘                                                   └──────────────┬──────────────┘
                    │                                                                                 │
     ┌──────────────┴───────────────────────────────────────────────────────┐                         │
     │ INTERACTIVE PRESENTATION MODES:                                      │                         │
     │  ├── 3D WebGL Globe (Three.js Viking 2K, Rayleigh terminator, moons) │                         │
     │  ├── 2D Planetary GIS (Leaflet + NASA Trek WMTS tiles)               │                         │
     │  └── Astronaut EVA 3D Simulator (First-Person Visor HUD + Web Audio) │                         │
     │                                                                      │                         │
     │ SCIENTIFIC ROUTING & HUD ENGINES:                                    │                         │
     │  ├── marsAStarRouter.ts (Multi-objective A* corridor solver)         │                         │
     │  ├── marsRouteSafetyAnalyzer.ts (Slope, sand, hazard bypass)         │                         │
     │  ├── marsMolaElevation.ts (Deterministic MEGDR elevation grid)       │                         │
     │  └── marsAtmosphereDustModel.ts (Diurnal pressure & optical tau)     │                         │
     └──────────────────────────────────────────────────────────────────────┘                         │
                                                                                                      │
                    ┌─────────────────────────────────────────────────────────────────────────────────┴┐
                    │ REST ENDPOINTS & WEBSOCKET ENGINE:                                               │
                    │  ├── GET /api/health (Service status, dataset catalog, telemetry metrics)        │
                    │  ├── GET /api/regions & /api/features (Authoritative IAU planetary gazetteer)    │
                    │  ├── GET /api/layers (Viking, MOLA, THEMIS, CRISM, RAD, MEDA metadata)           │
                    │  ├── POST /api/routes/plan (Shared A* solver execution & Pareto trade-offs)      │
                    │  ├── GET/POST /api/missions (In-memory & JSON file persistent EVA flight plans)  │
                    │  ├── POST /api/ask-marsway (Server-side Gemini 3.8 Flash spatial intelligence)   │
                    │  └── WS /api/live-ws (Gemini 3.8 Live bidirectional 16kHz/24kHz audio websocket) │
                    └──────────────────────────────────────────────────────────────────────────────────┘
```

---

## 3. Key Exploration & Intelligence Modes

### 3.1 3D Planetary Globe (Three.js WebGL)
- **High-Fidelity Textures & Bump Shaders:** Viking MDIM 2.1 global color mosaic mapped onto an astronomical sphere with MOLA displacement normal maps.
- **Dynamic Orbital Lighting:** Real-time calculation of sub-solar latitude ($\delta_\odot$) and solar longitude ($L_s$) to simulate authentic Martian diurnal day/night terminators.
- **Celestial Satellites:** Orbital trajectory rendering and smooth fly-to targeting for Martian moons **Phobos** (semi-major axis 9,376 km) and **Deimos** (23,463 km).
- **Interactive Landmarking:** Direct 3D raycasting and animated camera transitions to Olympus Mons, Valles Marineris, Jezero Crater, Gale Crater, and human landing candidate sites.

### 3.2 2D Flat Mercator Planetary GIS (Leaflet + NASA Trek)
- **Authoritative Basemaps:** Seamless integration with official NASA Trek tile servers:
  1. *Viking MDIM 2.1 Color Global Mosaic* (232 m/pixel)
  2. *MGS MOLA Color Shaded Relief Topography* (463 m/pixel)
  3. *Mars Odyssey THEMIS Daytime Infrared* (100 m/pixel)
  4. *OpenPlanetaryMap (OPM) Basemap*
- **Dynamic Bearing & Counter-Rotating Typography:** Full 360° map rotation. A custom CSS variable counter-rotation pipeline ensures all text labels, pins, tooltips, and waypoint badges face upright toward the user at all times.
- **MOLA Elevation Cross-Section Tool:** Click any two points across Mars to generate an instantaneous elevation profile transect with peak altitude, depression depths, and slope distributions.
- **Multi-Mission Overlay Layers:** MRO HiRISE high-resolution footprint footprints, CRISM mineral hydration signatures, Curiosity/Perseverance rover traverses, EDL landing ellipses, and dust storm opacity maps.

### 3.3 Astronaut First-Person Surface EVA (3D Visor HUD & Audio)
- **Immersive 3D Surface:** Procedural Martian terrain rendering rocky regolith, impact craters, stratified bedrock, and dust devil particulates.
- **Spacesuit Visor HUD:** Authentic real-time display of astronaut telemetry:
  - Consumable Oxygen Supply (fluctuating with metabolic exertion)
  - Core Body Temperature and Pulse Rate
  - Space Suit Internal Pressure ($29.6 \text{ kPa}$ nominal pure-O2 setting)
  - Real-time Gyro Heading and Pitch Angle
  - In-Situ Geological Rock Spectrometer crosshair identifying hematite, smectite, olivine, and carbonate minerals.
- **Spatial Acoustic Engine (`marsEvaAudio.ts`):** Synthesized realistic spacesuit life-support audio (breathing cycles, helmet ventilation fans, comms static, radio beeps, and geological survey pings) using the Web Audio API.
- **Speech Recognition (English & Bengali):** Hands-free voice commands to take EVA photographs, illuminate helmet spotlights, activate tactical map overlays, or request Capcom guidance.

### 3.4 A* Science-Aware Multi-Objective Route Planner & Safety HUD
- **Pareto Traverse Generation:** Computes three distinct operational traverses for every mission:
  1. **Direct Efficiency Route (Route A):** Minimizes distance and metabolic energy expenditure.
  2. **Science Opportunity Route (Route B):** Maximizes astrobiological return by buffering and intersecting documented clay outcrops, sedimentary deltas, and sample caches.
  3. **Maximum Safety Route (Route C):** Strictly limits slopes to $< 8^\circ$ and avoids soft sand ripple fields and boulder clusters.
- **"Why This Route?" Explainable Decision Support:** Comprehensive breakdown analyzing trade-offs (e.g., *"+0.6 km distance added, but delivers 300% greater biosignature sampling score while staying 2.1 hours within EVA life-support limits"*).
- **Route Safety HUD (`MarsRouteSafetyHUD.tsx`):** Detects terrain hazards along the planned traverse, isolates high-risk segments, and computes an automated **Safer Bypass Route**.

### 3.5 Ask MarsWay & Gemini Live Voice Flight Controller
- **Spatial Intelligence Endpoint (`/api/ask-marsway`):** Powered by `gemini-3.8-flash` running server-side with strict JSON schema outputs. Interprets natural language questions (e.g. *"Show me where Perseverance landed"*), returns scientific explanations grounded in NASA PDS data, and automatically executes camera fly-to actions.
- **Real-Time Voice Streaming (`/api/live-ws`):** Powered by `gemini-3.8-live` connected over bidirectional WebSockets. Transmits real-time 16kHz PCM astronaut microphone input to Gemini and streams 24kHz audio output back to the client with sub-second latency. Includes automated tool calling for camera navigation and GIS layer switching.

---

## 4. Authentic NASA Multi-Mission Data Pipeline

MARSWAY rigorously attributes, standardizes, and labels all planetary datasets according to strict provenance criteria:

| Domain | Instrument / Dataset | Mission / Source | Spatial Resolution | Status Label |
|---|---|---|---|---|
| **Global Topography** | MOLA MEGDR (Areoid 0 km Datum) | Mars Global Surveyor (MGS) | 128 px/deg (~463 m/px) | `OBSERVED` |
| **Global True Color** | Viking MDIM 2.1 Mosaic | Viking Orbiters 1 & 2 (USGS) | 232 m/pixel | `OBSERVED` |
| **Thermal Infrared** | THEMIS Daytime Infrared 100m | 2001 Mars Odyssey (ASU/NASA) | 100 m/pixel | `OBSERVED` |
| **Orbital Reconnaissance**| HiRISE DTMs & Orthomosaics | Mars Reconnaissance Orbiter (MRO) | 0.25 – 1.0 m/pixel | `DERIVED` |
| **Spectroscopic Mineralogy**| CRISM Targeted Hyperspectral Indices | Mars Reconnaissance Orbiter (MRO) | 18 m/pixel | `DERIVED` |
| **In-Situ Science & Traverses**| Mars 2020 (Perseverance) & MSL (Curiosity) | NASA Planetary Data System (PDS) | Centimetric Surface Logs | `OBSERVED / HISTORICAL` |
| **Surface Meteorology**| MEDA Environmental Package | Perseverance Rover (Mars 2020) | Hourly Surface Logs | `HISTORICAL` |
| **Radiation Environment** | RAD Radiation Assessment Detector | Curiosity Rover (MSL) | Point Sensor + Model | `MODELED` |
| **Topographic Approximations**| Deterministic MOLA Mesh Calibration | MARSWAY MOLA Altimetry Model | Continuous Point Sampling | `MODELED` |

Every coordinate, feature card, and route briefing displays an accessible, color-independent **Provenance Badge**: `[OBSERVED]`, `[HISTORICAL]`, `[DERIVED]`, `[MODELED]`, or `[SIMULATED]`.

---

## 5. Mathematical & Scientific Formulation

### 5.1 Planetocentric Geodesy & Distance
Mars is modeled as an ellipsoid with mean radius $R_\text{Mars} = 3,389.5 \text{ km}$. For two points on the surface $P_1(\phi_1, \lambda_1)$ and $P_2(\phi_2, \lambda_2)$, the great-circle arc distance $d$ is determined via the haversine formula:

$$\Delta\phi = \phi_2 - \phi_1, \quad \Delta\lambda = \lambda_2 - \lambda_1$$

$$a = \sin^2\left(\frac{\Delta\phi}{2}\right) + \cos(\phi_1)\cos(\phi_2)\sin^2\left(\frac{\Delta\lambda}{2}\right)$$

$$c = 2 \cdot \operatorname{atan2}\left(\sqrt{a}, \sqrt{1-a}\right), \quad d = R_\text{Mars} \cdot c$$

Local polygon areas (such as landing hazard zones or geological quadrangles) are integrated using spherical excess formulas over planetocentric coordinates.

### 5.2 Margaria-Minetti Bioenergetic Metabolic Suited Walking Model (0.38g)
Under Martian surface gravity ($g_\text{Mars} = 3.72 \text{ m/s}^2 \approx 0.38g_\text{Earth}$), the metabolic energy cost of suited locomotion is a non-linear function of terrain slope $i = \tan\theta$:

$$C_w(i) = \left(280 \cdot i^5 - 54 \cdot i^4 - 23 \cdot i^3 + 12 \cdot i^2 + 2.5 \cdot i + 2.8\right) \cdot \gamma_\text{suit} \cdot \left(\frac{g_\text{Mars}}{g_\text{Earth}}\right)$$

Where $\gamma_\text{suit} = 1.35$ represents the internal joint stiffness and pressurization resistance of an advanced planetary exploration spacesuit (xEMU).

The adjusted walking velocity $v(i)$ is given by:

$$v(i) = v_0 \cdot \exp\left(-3.5 \cdot |i + 0.05|\right)$$

With flat-ground suited base speed $v_0 = 1.11 \text{ m/s} \approx 4.0 \text{ km/h}$.

### 5.3 Multi-Objective Pareto Traverse Formulation
The generalized cost function $J(\pi)$ for a candidate traverse $\pi$ connecting departure base $S$ to destination $D$ across a sequence of discrete spatial steps $e = (u, v)$ is:

$$J(\pi) = \sum_{e \in \pi} \left[ w_d \cdot \frac{d(e)}{d_\text{direct}} + w_t \cdot \frac{\Delta t(e)}{t_\text{nominal}} + w_s \cdot \left(\frac{\text{slope}(e)}{\theta_\text{max}}\right)^2 + w_h \cdot H(e) - w_\text{sci} \cdot S(e) - w_\text{res} \cdot R(e) \right]$$

Where:
- $H(e) \in [0, 10]$ represents terrain hazard penalties (friable scarps, uncompacted dune ripple fields).
- $S(e) \in [0, 10]$ represents scientific reward (presence of hydrated minerals, smectite clays, delta bottomsets).
- $R(e) \in [0, 10]$ represents in-situ resource value (shallow subsurface water ice, regolith shielding).
- $w_d, w_t, w_s, w_h, w_\text{sci}, w_\text{res}$ are normalized objective weights chosen according to the mission strategy (*Efficiency*, *Science*, or *Safety*).

---

## 6. Complete Codebase Architecture & File Map

```
MARSWAY/
├── api/
│   └── index.ts                 # Vercel serverless entry point proxying to Express backend
├── data/
│   └── missions.json            # Persistent storage for user-created Marswalk mission plans
├── public/
│   ├── assets/
│   │   ├── aistudio/            # Generated high-resolution icons & UI illustrations
│   │   ├── icon-192.svg         # PWA home screen icon
│   │   └── icon-512.svg         # PWA high-res manifest icon
│   ├── textures/
│   │   └── mars_viking_2k.jpg   # NASA Viking global true-color 2K planetary map texture
│   ├── manifest.json            # Progressive Web App manifest definition
│   ├── marsway-icon.png         # Primary application favicon & brand mark
│   └── sw.js                    # Service worker for offline caching and PWA installation
├── src/
│   ├── components/
│   │   ├── common/              # Global shared UI components
│   │   │   ├── AskMarsWayModal.tsx         # AI Assistant dialog with interactive fly-to triggers
│   │   │   ├── DemoTourModal.tsx           # 3-minute guided tour for NASA Space Apps judges
│   │   │   ├── ErrorBoundary.tsx           # React crash prevention boundary
│   │   │   ├── MarsBookmarksModal.tsx      # Saved landing coordinates & locations
│   │   │   ├── MarsPlatformTourModal.tsx   # Feature overview tour
│   │   │   ├── MarsPresentationMode.tsx    # Fullscreen presentation & showcase HUD
│   │   │   ├── MarsSearchModal.tsx         # Universal Mars feature and crater search modal
│   │   │   ├── MarsTimeline.tsx            # Interactive chronological robotic exploration slider
│   │   │   └── ProvenanceBadge.tsx         # Accessible OBSERVED/MODELED provenance tag
│   │   ├── map/                 # Mapping, 3D Globe & First-Person EVA components
│   │   │   ├── ElevationProfile.tsx        # MGS MOLA elevation transect chart
│   │   │   ├── MapLayerControls.tsx        # Basemap and raster overlay switcher
│   │   │   ├── MapLegend.tsx               # Cartographic elevation and hazard legend
│   │   │   ├── Mars3DGlobe.tsx             # Interactive Three.js WebGL Mars Globe
│   │   │   ├── MarsAstronautView.tsx       # First-Person Spacesuit EVA Surface Simulator
│   │   │   ├── MarsAtmosphereOverlayControl.tsx # Atmospheric optical depth & pressure widget
│   │   │   ├── MarsCompassWidget.tsx       # Compass rose, solar azimuth & bearing control
│   │   │   ├── MarsCoordinateOverlay.tsx   # Live cursor geodetic coordinates & elevation HUD
│   │   │   ├── MarsDestinationTool.tsx     # Destination waypoint picker
│   │   │   ├── MarsDustStormLayerControl.tsx # Dust opacity (tau) visualization tool
│   │   │   ├── MarsLayerControlPanel.tsx   # Full-featured GIS layer management panel
│   │   │   ├── MarsMeasurementTool.tsx     # Click-to-measure geodesic distance ruler
│   │   │   ├── MarsMissionBottomSheet.tsx  # Touch-friendly collapsible mobile bottom dock
│   │   │   ├── MarsMolaAvailabilityControl.tsx # MGS MOLA & HRSC high-res DTM inventory
│   │   │   ├── MarsMoonDossierModal.tsx    # Phobos & Deimos orbital telemetry dossier
│   │   │   ├── MarsNasaMissionsOverlayControl.tsx # Historic landing sites & rover traverse lines
│   │   │   ├── MarsPathElevationGraph.tsx  # Dynamic elevation chart for planned Marswalk routes
│   │   │   ├── MarsPlaceIdentifierModal.tsx# IAU Gazetteer place dossiers and geology
│   │   │   ├── MarsRegionDetailModal.tsx   # Detailed quadrangle overview dialog
│   │   │   ├── MarsScaleBar.tsx            # Adaptive metric scale bar for Leaflet viewport
│   │   │   ├── MarsScienceDossierModal.tsx # Astrobiological target science dossiers
│   │   │   ├── MarsSwipeCompare.tsx        # Split-screen swipe comparison between Viking & MOLA
│   │   │   ├── MarsTopSearchBar.tsx        # Quick search bar with autocomplete suggestions
│   │   │   ├── NASACloseUpModal.tsx        # High-res orbital and rover surface imagery gallery
│   │   │   ├── NasaLandingSiteModal.tsx    # Detailed rover landing site explorer
│   │   │   └── RealMarsMap.tsx             # Main orchestrator component hosting 2D, 3D, and EVA
│   │   ├── mission/             # Astronaut Marswalk planning & safety components
│   │   │   ├── CandidateRouteCard.tsx      # Pareto traverse comparison card (Route A, B, C)
│   │   │   ├── HumanMissionMode.tsx        # Future human Mars base planning & ISRU analyzer
│   │   │   ├── MarsConditionsPanel.tsx     # Live Sol meteorological conditions & thermal ranges
│   │   │   ├── MarsRoutePlannerModal.tsx   # Comprehensive Marswalk Route Planning modal
│   │   │   ├── MarsRouteSafetyHUD.tsx      # Real-time route hazard detection & bypass corridor generator
│   │   │   ├── MissionExplorerDrawer.tsx   # Slide-over catalog of all historic Martian missions
│   │   │   ├── MissionSummaryModal.tsx     # Flight-ready EVA mission briefing exporter
│   │   │   ├── MissionTimelineSlider.tsx   # Mars exploration timeline from Viking to present
│   │   │   ├── NasaSurfacePovModal.tsx     # Rover Mastcam 360° panoramas
│   │   │   └── WhyThisRouteModal.tsx       # Explainable AI decision support breakdown
│   │   ├── provenance/          # Scientific honesty & challenge criteria modals
│   │   │   ├── ChallengeAlignmentModal.tsx # Alignment with NASA Space Apps 2026 rubric
│   │   │   ├── DataSourcesModal.tsx        # Complete PDS dataset citations and instruments
│   │   │   └── MethodologyModal.tsx        # Algorithmic methodology, datum, and bioenergetics
│   │   ├── science/             # Scientific comparison & location intelligence
│   │   │   ├── CompareSitesModal.tsx       # Multi-site side-by-side geological comparison
│   │   │   ├── EarthScaleComparisonModal.tsx # True-scale visual overlay comparing Mars vs Earth
│   │   │   ├── ElevationProfileModal.tsx   # Dedicated full-featured elevation transect tool
│   │   │   ├── LocationIntelDrawer.tsx     # Detailed point-and-click geodetic telemetry drawer
│   │   │   └── ScienceOpportunityList.tsx  # Ranked list of nearby high-value outcrops
│   │   ├── simulation/
│   │   │   └── WhatIfSimulatorPanel.tsx    # Contingency simulation (EVA cuts, pass closures)
│   │   └── voice/
│   │       └── MarsLiveVoiceModal.tsx      # Interactive two-way voice console using Gemini Live
│   ├── data/                    # Authoritative scientific data stores
│   │   ├── earthMarsComparisons.ts # Scaled geological analogs (Grand Canyon vs Valles Marineris)
│   │   ├── galeDataset.ts          # Mount Sharp & Curiosity rover PDS science catalog
│   │   ├── humanLandingSites.ts    # NASA Human Landing Site Study candidate locations
│   │   ├── jezeroDataset.ts        # Jezero Crater Western Delta astrobiology target catalog
│   │   ├── marsAtmosphereData.ts   # Diurnal temperature, pressure, and dust optical depth records
│   │   ├── marsMissions.ts         # Complete roster of global Mars surface & orbital missions
│   │   ├── marsNomenclature.ts     # IAU approved craters, montes, valles, and planitiae
│   │   ├── marsRegions.ts          # 18 major Martian quadrangles with geodetic boundaries
│   │   └── provenanceData.ts       # PDS catalog metadata, uncertainty notes, and instrument logs
│   ├── engine/                  # Core algorithmic & mathematical modules
│   │   ├── marsAStarRouter.ts      # Multi-objective A* corridor pathfinding algorithm
│   │   ├── marsAtmosphereDustModel.ts # Seasonal dust storm and atmospheric pressure calculations
│   │   ├── marsElevationAvailability.ts # MOLA and HiRISE DTM availability index
│   │   ├── marsEnvironmentalAnalysis.ts # Surface radiation, temperature, and sun angle analyzer
│   │   ├── marsEvaAudio.ts         # Web Audio API procedural spacesuit sound synthesizer
│   │   ├── marsLiveAudio.ts        # Linear 16-bit PCM audio recorder & 24kHz stream player
│   │   ├── marsMolaElevation.ts    # Deterministic MOLA MEGDR elevation model
│   │   ├── marsRouteSafetyAnalyzer.ts # Slope, sand, and obstacle hazard detector & bypass solver
│   │   ├── marsSonification.ts     # Web Audio API elevation profile sound sonification
│   │   ├── marsSpaceWeather.ts     # Solar particle events and galactic cosmic ray modeling
│   │   ├── marsTextureGenerator.ts # Procedural Three.js terrain shaders and textures
│   │   ├── multiObjectiveRouter.ts # High-level mission trade-off and Pareto coordinator
│   │   ├── nasaMarsService.ts      # PDS archive integration and orbital ephemeris math
│   │   └── spatialMath.ts          # Great-circle Haversine, slope gradient, and spherical geometry
│   ├── types/
│   │   └── mars.ts                 # Full TypeScript definitions for sites, routes, hazards, and telemetry
│   ├── App.tsx                  # Root application component
│   ├── index.css                # Global stylesheet with Tailwind CSS v4 and Leaflet overrides
│   └── main.tsx                 # Application entry point with strict ErrorBoundary
├── tests/
│   └── marsway.test.ts          # Comprehensive unit tests for geodesy, MOLA math, and A* routing
├── server.ts                    # Full-stack Express server with Gemini Live WebSocket server
├── package.json                 # Dependency definitions and build scripts
├── tsconfig.json                # TypeScript compiler configuration
└── vite.config.ts               # Vite bundler configuration with Tailwind CSS v4 plugin
```

---

## 7. Installation, Setup & Deployment

### Prerequisites
- **Node.js**: Version 22.x or later
- **npm**: Version 10.x or later

### Local Development Setup

1. **Clone the repository:**
   ```bash
   git clone https://github.com/ahsanur-official/Interplanetary-Survival-Guide-Martian-Map.git
   cd Interplanetary-Survival-Guide-Martian-Map
   ```

2. **Install dependencies:**
   ```bash
   npm install
   ```

3. **Configure Environment Variables:**
   Copy the `.env.example` file to create `.env`:
   ```bash
   cp .env.example .env
   ```
   Add your Google Gemini API Key to enable AI Spatial Intelligence and Live Voice:
   ```env
   GEMINI_API_KEY=your_gemini_api_key_here
   PORT=3000
   ```

4. **Start the Development Server:**
   ```bash
   npm run dev
   ```
   *The Express server and Vite development server will boot on `http://localhost:3000`.*

5. **Run Automated Test Suite:**
   ```bash
   npm test
   ```

6. **Production Build:**
   ```bash
   npm run build
   npm start
   ```

---

## 8. API Reference & Telemetry Endpoints

The MARSWAY Express backend provides robust REST endpoints and WebSocket protocols:

| Method | Endpoint | Description |
|---|---|---|
| `GET` | `/api/health` | Health telemetry, loaded dataset count, available regions, and Gemini status |
| `GET` | `/api/regions` | Authoritative Martian regions (Jezero Delta, Gale Crater, Olympus Mons, etc.) |
| `GET` | `/api/layers` | Global GIS raster metadata with verified NASA Trek WMTS tile URLs |
| `GET` | `/api/features` | IAU Martian nomenclature catalog with query filtering and categorizations |
| `GET` | `/api/features/:id` | Detailed dossier for a specific crater, volcano, mountain, or rover site |
| `POST` | `/api/routes/plan` | Solves multi-objective A* routes with custom weights and hazard avoidance |
| `GET` | `/api/missions` | Retrieves saved Marswalk mission plans from persistent storage |
| `POST` | `/api/missions` | Creates and saves a new Marswalk mission plan |
| `POST` | `/api/missions/:id/report` | Generates a flight-ready, exportable EVA mission briefing document |
| `POST` | `/api/ask-marsway` | Natural language spatial AI query powered by `gemini-3.8-flash` |
| `WS` | `/api/live-ws` | Bidirectional real-time audio WebSocket powered by `gemini-3.8-live` |

---

## 9. NASA Space Apps Challenge 2026 Alignment

| Challenge Requirement | MARSWAY Solution |
|---|---|
| **Layered, Integrated Martian View** | Multi-layer composite viewport blending MOLA topography, HiRISE slope gradients, CRISM hydration spectra, and hazard zones. |
| **Multiple NASA Science Missions** | Data pipeline combining MGS (MOLA), MRO (HiRISE, CRISM), MSL (Curiosity RAD, REMS), and Mars 2020 (Perseverance MEDA, PIXL, SHERLOC). |
| **Route & Destination Information** | Start/Dest geodetic waypoints, EVA duration constraints, and bioenergetic traverse planning under 0.38g gravity. |
| **Conduct New Science Along the Way** | Science Opportunity Engine detecting nearby high-value outcrops within a 750m corridor buffer. |
| **Mission Safety & Environmental Context** | Real slope trafficability thresholds, boulder field hazards, and authentic diurnal thermal and radiation shielding calculations. |
| **Explainable Decision Support** | Transparent "Why This Route?" modal and Pareto trade-off matrix. |
| **Scientific Honesty & Provenance** | Clear labeling of OBSERVED vs MODELED vs SIMULATED data with complete PDS archive citations. |

---

## 10. Scientific Honesty & Operational Disclaimer

MARSWAY is an educational and conceptual decision-support system developed for the **2026 NASA Space Apps Challenge**. It is **not certified for operational extraterrestrial flight operations** by NASA, ESA, or any international space agency. All route calculations, metabolic expenditures, and hazard detections are based on scientific models calibrated with authentic archival planetary data for research and decision-support demonstration purposes.
