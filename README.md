# MARSWAY — Science-Aware Marswalk Mission Planner
**Multi-Mission, Science-Aware Route Planning for Human Marswalks**

> *"Plan the journey. Discover the science. Understand the terrain."*

**2026 NASA Space Apps Challenge Submission**  
**Challenge:** *Interplanetary Survival Guide: Martian Map*

---

## 1. Executive Summary & Problem Statement

Decades of robotic exploration by NASA and international partners—including the Mars Global Surveyor (MGS), Mars Reconnaissance Orbiter (MRO), Curiosity (MSL), and Perseverance (Mars 2020)—have yielded unprecedented petabytes of topographic, hyperspectral, atmospheric, and in-situ geochemical data.

However, when planning future human Extravehicular Activities (EVAs or "Marswalks"), existing navigation models reduce pathfinding to a simple shortest-distance problem (e.g. Euclidean or Dijkstra shortest path).

On Mars, the shortest route is frequently the most dangerous or the least productive:
- A suit-puncture risk on a 25° friable delta scarp
- Deep sinkage in uncompacted aeolian sand ripples (Séítah formation)
- Complete omission of once-in-a-lifetime astrobiological sample outcrops (e.g. smectite mudstones, shoreline carbonates) located just a few hundred meters away.

**MARSWAY** is an integrated scientific decision-support system that transforms decades of NASA robotic exploration data into an explainable, multi-objective Marswalk mission planner.

---

## 2. Core Innovation: Science-Aware Multi-Objective Route Optimization

Rather than claiming a single "optimal" route, MARSWAY evaluates multiple competing objectives simultaneously:

$$\text{Route Cost}(\pi) = w_d \cdot \tilde{C}_{\text{dist}} + w_t \cdot \tilde{C}_{\text{time}} + w_s \cdot \tilde{C}_{\text{slope}} + w_h \cdot \tilde{C}_{\text{hazard}} - w_{\text{sci}} \cdot \tilde{V}_{\text{science}} - w_{\text{res}} \cdot \tilde{V}_{\text{resource}}$$

For every mission scenario, MARSWAY generates three Pareto candidate traverses:
1. **Route A (Direct Efficiency):** Minimizes transit duration and metabolic oxygen expenditure.
2. **Route B (Science Opportunity):** Intercepts documented sedimentary layers, smectite clays, and rover sample locations while respecting strict EVA time envelopes.
3. **Route C (Maximum Safety):** Bypasses all critical escarpments, keeps slopes $< 8^\circ$, and eliminates transit across uncompacted sand ripple dunes.

Every route is accompanied by a transparent **"Why This Route?"** decision support analysis detailing advantages, trade-offs, and critical astronaut decision factors.

---

## 3. NASA Multi-Mission Data Integration

MARSWAY ingests and harmonizes verified datasets from the NASA Planetary Data System (PDS):

| Domain | Dataset | Mission / Instrument | Processing & Datum | Status Label |
|---|---|---|---|---|
| **Topography** | MOLA MEGDR & HRSC DTM | Mars Global Surveyor (MGS) / Mars Express | 128 pix/deg (~463m/px), normalized to MOLA Areoid 0 km gravity potential surface | `OBSERVED` |
| **High-Resolution Imagery** | HiRISE Stereo DTM & Orthomosaics | Mars Reconnaissance Orbiter (MRO) | 0.25 - 1.0 m/px photogrammetric DTMs for local slope & boulder mapping | `DERIVED` |
| **Mineralogy & Resources** | CRISM Targeted Hyperspectral Parameters | Mars Reconnaissance Orbiter (MRO) | BD1900 / BD2200 metal-OH absorption for Fe/Mg smectite hydrated clays & carbonates | `DERIVED` |
| **In-Situ Science & Traverses** | Perseverance & Curiosity PDS Science Archives | Mars 2020 & Mars Science Laboratory | SuperCam, PIXL, SHERLOC, Mastcam-Z, ChemCam verified observation coordinates | `OBSERVED / HISTORICAL` |
| **Atmospheric Environment** | MEDA Calibrated Sensor Records | Perseverance Rover (Mars 2020) | Diurnal temperature cycles (-84°C to -14°C) & surface pressure (740 Pa) | `HISTORICAL` |
| **Surface Radiation** | RAD Calibrated Dose Telemetry | Curiosity Rover (MSL) | MSL RAD Gale baseline calibrated with MOLA atmospheric column depth (+2km elevation) | `MODELED` |

Every data point in the UI carries an accessible, color-independent **Provenance Badge**: `OBSERVED`, `HISTORICAL`, `DERIVED`, `MODELED`, or `SIMULATED`.

---

## 4. Key Functional Features

1. **Interactive Martian Cartographic Viewport:** High-performance 2D Canvas engine with continuous pan/zoom, metric scale bar, North indicator, crosshair coordinate readout, and hypsometric tinting.
2. **Multi-Layer Toggle Stack:** Independent toggles for Topography, Slope Heatmap, Hazard Zones, Science Targets, Rover Tracks, Resource Sites, and Candidate Traverses.
3. **Astronaut Mission Planner:** Departure and destination pickers, EVA duration threshold sliders (4h to 12h), mission priority presets (Balanced, Safety, Science, Efficiency), and configurable cost weights.
4. **"Why This Route?" Explainable Decision Support:** Complete transparency into why a route was chosen, what was gained, and what was sacrificed.
5. **Science Opportunity Engine:** Radial 750m corridor buffer analysis detecting nearby geological outcrops and rover observation sites, with one-click integration into mandatory mission objectives.
6. **What-If Mission Simulator:** Dynamic contingency testing (emergency EVA duration cuts to 5.5h, canyon rockfall pass closures, mandated sample collection) with real-time delta logs.
7. **Longitudinal Elevation Profile:** Interactive cross-section chart tracking altitude gradients, slope danger zones, visited science stations, and cumulative distance.
8. **Location Intelligence Inspector:** Point-and-click geodetic inspector reporting latitude, longitude, MOLA elevation, slope gradient, suit trafficability, local radiation dose rate, and PDS provenance.
9. **Exportable Marswalk Mission Brief:** Flight-formatted operational plan ready for print or clipboard export.
10. **Guided 3-Minute Demo Tour:** Step-by-step interactive walkthrough designed specifically for NASA Space Apps Challenge judges.

---

## 5. Technology Stack & Architecture

- **Frontend & Visualization:** React 19, TypeScript, HTML5 Canvas API (for 60fps responsive planetary rendering), Tailwind CSS v4, Lucide Icons.
- **Geospatial & Bioenergetic Math:** IAU 2000 Planetocentric Spherical Geodesy, Great-Circle Haversine distance, Margaria-Minetti suited astronaut walking velocity model under 0.38g.
- **Routing Engine:** Multi-objective weighted graph search with slope penalties and hazard avoidance buffers.
- **Operational Targets:** Jezero Crater Western Delta quadrangle (Perseverance operational area) and Gale Crater Mount Sharp quadrangle (Curiosity traverse).

---

## 6. How to Run Locally

```bash
# Clone the repository
git clone https://github.com/nasa-space-apps-2026/marsway.git
cd marsway

# Install dependencies
npm install

# Start the local development server
npm run dev

# Open http://localhost:3000 in your browser
```

---

## 7. NASA Challenge Alignment

| Challenge Requirement | MARSWAY Implementation |
|---|---|
| **Layered, Integrated Martian View** | Multi-layer composite viewport blending MOLA topography, HiRISE slope gradients, CRISM hydration spectra, and hazard zones. |
| **Multiple NASA Science Missions** | Data pipeline combining MGS (MOLA), MRO (HiRISE, CRISM), MSL (Curiosity RAD, REMS), and Mars 2020 (Perseverance MEDA, PIXL, SHERLOC). |
| **Route & Destination Information** | Start/Dest geodetic waypoints, EVA duration constraints, and bioenergetic traverse planning. |
| **Conduct New Science Along the Way** | Science Opportunity Engine detecting nearby high-value outcrops within the traverse corridor. |
| **Mission Safety & Environmental Context** | Real slope trafficability thresholds, boulder field hazards, and authentic diurnal thermal and radiation shielding calculations. |
| **Explainable Decision Support** | Transparent "Why This Route?" modal and Pareto trade-off matrix. |
| **Scientific Honesty & Provenance** | Clear labeling of OBSERVED vs MODELED vs SIMULATED data with complete PDS archive citations. |

---

## 8. Disclaimer & Scientific Honesty

MARSWAY is an educational and conceptual decision-support system developed for the 2026 NASA Space Apps Challenge. It is **not flight-certified** or approved by NASA or ESA for operational spaceflight or extraterrestrial EVA navigation. All operational claims reflect simulated scenarios based on authentic archival data.
