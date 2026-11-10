# MARSWAY — Operational & Scientific Limitations
**2026 NASA Space Apps Challenge**

Transparent communication of uncertainty, data gaps, and model boundaries is an indispensable requirement of responsible planetary science and engineering. This document outlines the explicit operational and scientific limitations of the MARSWAY decision-support prototype.

---

## 1. Lack of Flight Readiness Certification
- **Status:** Educational & Conceptual Decision-Support Prototype.
- **Limitation:** MARSWAY is designed for the 2026 NASA Space Apps Challenge. It has not undergone formal flight software qualification, fault-tree hazard verification, or NASA Crew Health & Safety Board certification. Under no circumstances should it be used for actual extraterrestrial surface navigation.

---

## 2. Spatial Resolution Discrepancy (Orbital vs In-Situ Ground Truth)
- **Topography Scale Gap:** Orbital MOLA MEGDR data ($463\text{ m/pixel}$) and HRSC blended models provide macroscopic elevation gradients over kilometer scales. However, spacesuit traversability and rover wheel slippage are governed by decimeter-scale roughness (e.g. $20\text{ cm}$ rocks, loose dust mantles, perched duricrusts).
- **HiRISE Coverage Gaps:** While MRO HiRISE provides $0.25\text{ m/pixel}$ imagery and $1.0\text{ m}$ DTMs over targeted interest swathes in Jezero Crater, vast surrounding regions remain unmapped at sub-meter fidelity. Areas without HiRISE stereo DTMs may harbor undetected local scarps or boulder hazards.

---

## 3. Atmospheric Telemetry & Temporal Extrapolation
- **Not Real-Time Weather:** In-situ atmospheric data displayed in MARSWAY (e.g. surface pressure $742\text{ Pa}$, diurnal temperature $-84^\circ\text{C}$ to $-14^\circ\text{C}$) are derived from historical Mars 2020 MEDA sensor baselines. Mars possesses intense seasonal cycles (polar $\text{CO}_2$ condensation/sublimation, regional dust storm events, thermal tide variations). These archival figures represent climatological baselines, not live weather forecasting.
- **Dust Storm Vulnerability:** Sudden local or regional dust storms significantly alter surface insolation, thermal conditions, and visual navigation landmarks; dynamic atmospheric modeling would be required for operational execution.

---

## 4. Radiation Dose Extrapolation
- **Local vs Regional:** Direct in-situ surface radiation dose rates ($~640\ \mu\text{Gy/day}$) are measured by the MSL RAD instrument at Gale Crater floor ($-4.5\text{ km}$ MOLA datum).
- **Model Calibration:** For Jezero Crater ($-2.5\text{ km}$ MOLA datum), the atmospheric column is approximately $2\text{ km}$ thinner, resulting in an estimated ~8% reduction in column shielding against Galactic Cosmic Rays (GCR). MARSWAY models this effect using exponential barometric column depth scaling, explicitly labeled as `MODELED`. Solar Particle Events (SPE) produce unpredictable high-dose spikes not captured by quiescent GCR baselines.

---

## 5. Mineralogical & Resource Optical Skin Depth
- **Surface vs Subsurface:** CRISM hyperspectral reflectance parameter maps (e.g. smectite phyllosilicates, hydrated sulfates, and carbonates) query only the uppermost optical skin depth of the regolith (tens of microns).
- **Subsurface Extrapolation:** Volume estimates for extractable water from hydrated minerals are geologically inferred from exposed outcrop thickness and stratigraphic dip. Deep subsurface ice detection relies on orbital radar (SHARAD) soundings with large along-track footprints ($300\text{ m} \times 1000\text{ m}$), labeled as `LOW CONFIDENCE PROXY` requiring ground-truth core drilling.

---

## 6. Route Model Assumptions
- **Margaria-Minetti Model:** Suited astronaut walking speeds and metabolic calorie expenditures are adapted from terrestrial metabolic equations corrected for $0.38g$. They assume nominal spacesuit joint torques, steady pacing, and absence of severe regolith trenching or suit pressurization leaks.
- **No Path Finding Black-Box:** The system uses deterministic weighted graph search to avoid the unpredictability of black-box deep learning. However, real-time tactical routing around unanticipated small obstacles remains the astronaut's visual pilotage responsibility.
- **Limited Dust-Risk Model:** MARSWAY bundles a small statistical model trained from selected historical MRO MARCI storm labels. It estimates coarse seasonal/location dust risk and adjusts safer-route costs; optional local dust-opacity, visibility, and slope readings can refine that estimate. It is not trained on a continuous rover-sensor time series, does not forecast storm motion, and is not validated for operational EVA decisions. Terrain routing remains a deterministic graph search. Mars has no liquid-rain weather; dust, frost, and seasonal CO₂/H₂O ice are the relevant environmental conditions.

## 7. Offline Operation & Imagery Resolution
- **Local Basemap:** The bundled 2K Viking global mosaic and mission/science datasets are available without a network after the app shell has been installed or opened once while connected. NASA high-resolution map tiles are opportunistically cached after they are viewed; complete planetary tile coverage is not bundled.
- **Live Services:** Gemini chat, remote NASA imagery, and live telemetry require connectivity and may be unavailable offline. The bundled dust-risk route model works offline from its historical data and any local sensor values entered on the device; those values are not uploaded by the route planner.
- **Zoom Detail:** Zoom responds immediately using the local global mosaic. Higher-resolution NASA tiles sharpen the view when available; the 2K offline mosaic cannot provide new surface detail beyond its source resolution.
