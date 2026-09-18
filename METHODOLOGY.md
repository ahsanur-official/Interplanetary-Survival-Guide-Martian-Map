# MARSWAY — Scientific Methodology & Mathematical Formulations
**2026 NASA Space Apps Challenge**

This document details the mathematical, geospatial, and bioenergetic methodologies implemented in **MARSWAY** for science-aware multi-objective route planning on Mars.

---

## 1. Geodetic & Spatial Coordinate Normalization

All planetary coordinates are defined in accordance with the **IAU 2000 Planetocentric coordinate system**:
- **Latitude ($\phi$):** Planetocentric degrees North ($-90^\circ \le \phi \le +90^\circ$).
- **Longitude ($\lambda$):** Degrees East ($0^\circ \le \lambda \le 360^\circ$).
- **Mars Mean Volumetric Radius ($R_{\text{Mars}}$):** $3,396.19\text{ km}$.
- **Vertical Datum:** Mars Orbiter Laser Altimeter (MOLA) Areoid zero-potential gravity datum ($0\text{ km}$).

Surface Great-Circle distance $d_{\text{surface}}$ between two coordinates $(\phi_1, \lambda_1)$ and $(\phi_2, \lambda_2)$ is calculated using the Haversine equation:

$$\Delta \phi = \frac{(\phi_2 - \phi_1) \pi}{180}, \quad \Delta \lambda = \frac{(\lambda_2 - \lambda_1) \pi}{180}$$

$$a = \sin^2\left(\frac{\Delta \phi}{2}\right) + \cos\left(\frac{\phi_1 \pi}{180}\right) \cos\left(\frac{\phi_2 \pi}{180}\right) \sin^2\left(\frac{\Delta \lambda}{2}\right)$$

$$c = 2 \cdot \arctan2(\sqrt{a}, \sqrt{1 - a}), \quad d_{\text{surface}} = R_{\text{Mars}} \cdot c$$

The 3D physical traverse distance accounting for vertical elevation delta $\Delta z = z_2 - z_1$ is:

$$d_{3D} = \sqrt{d_{\text{surface}}^2 + \Delta z^2}$$

---

## 2. Terrain Slope & Astronaut Trafficability Model

Local surface inclination angle $\theta$ across edge $(u, v)$ is:

$$\theta = \arctan\left(\frac{|z_v - z_u|}{d_{\text{surface}}(u, v)}\right) \cdot \frac{180^\circ}{\pi}$$

### Human EVA Suit Mobility Cutoffs:
- **$\theta \le 8^\circ$ (Good):** Nominal unassisted walking cadence.
- **$8^\circ < \theta \le 14^\circ$ (Moderate):** Metabolic load increases; requires slower pacing.
- **$14^\circ < \theta \le 20^\circ$ (Hazardous):** Significant boot regolith slip; requires trekking poles / hand stabilizers.
- **$\theta > 20^\circ$ (Impassable):** Prohibited for un-tethered pedestrian EVA due to risk of sliding, suit abrasion, and rockfall.

---

## 3. Astronaut Bioenergetic Speed & Metabolic Model

Suited walking velocity under Martian gravity ($g = 3.72\text{ m/s}^2$) for an astronaut with a $120\text{ kg}$ total system mass (suit + life support + body) is adapted from the Margaria-Minetti energetic formulation:

$$v(\theta) = v_0 \cdot \exp\left(-k \cdot |\tan \theta|\right)$$

where:
- $v_0 = 3.2\text{ km/h}$ (nominal flat ground pedestrian pace in an xEMU-class suit).
- $k_{\text{uphill}} = 2.9$ (steep exponential speed penalty uphill).
- $k_{\text{downhill}} = 2.1$ for $\theta > 8^\circ$ (controlled descent to prevent tumbling).

Segment traverse time is:
$$\Delta t = \frac{d_{3D}}{v(\theta)}$$

Metabolic energy expenditure rate $\dot{E}_{\text{met}}$ ($\text{kcal/hour}$) is modeled as:
$$\dot{E}_{\text{met}} = 260\text{ kcal/h (base life support)} + 80 \cdot v + 45 \cdot \left(\frac{\theta}{5}\right)^{1.4}$$

Total energy consumed along path $\pi$:
$$E_{\text{total}} = \sum_{e \in \pi} \dot{E}_{\text{met}}(e) \cdot \Delta t(e)$$

---

## 4. Multi-Objective Cost Formulation

For path $\pi$, the unified cost function is:

$$\text{Cost}(\pi) = w_d \cdot \tilde{C}_{\text{dist}}(\pi) + w_t \cdot \tilde{C}_{\text{time}}(\pi) + w_s \cdot \tilde{C}_{\text{slope}}(\pi) + w_h \cdot \tilde{C}_{\text{hazard}}(\pi) - w_{\text{sci}} \cdot \tilde{V}_{\text{science}}(\pi) - w_{\text{res}} \cdot \tilde{V}_{\text{resource}}(\pi)$$

where all factors are normalized to $[0, 1]$.

Hazard penalty $\tilde{C}_{\text{hazard}}$ incorporates exponential distance attenuation from identified hazard polygons (friable scarps, boulder fields, soft sand drifts):

$$\text{HazardPenalty}(p) = \sum_{h \in \text{Hazards}} \text{RiskWeight}(h) \cdot \max\left(0, 1 - \frac{\text{dist}(p, h)}{1.5 \cdot R_h}\right)^2$$

---

## 5. Science Opportunity Radial Buffer Engine

For any proposed path $\pi$ composed of segments $\{S_1, S_2, \dots, S_m\}$, the perpendicular distance from scientific target $T_k$ to segment $S_i = (A_i, B_i)$ is computed:

$$\vec{AB} = B_i - A_i, \quad \vec{AT} = T_k - A_i$$
$$t_{\text{proj}} = \frac{\vec{AT} \cdot \vec{AB}}{|\vec{AB}|^2}$$
$$\text{dist}(T_k, S_i) = \begin{cases} 
|\vec{AT}| & \text{if } t_{\text{proj}} \le 0 \\
|\vec{BT}| & \text{if } t_{\text{proj}} \ge 1 \\
|\vec{AT} - t_{\text{proj}} \vec{AB}| & \text{if } 0 < t_{\text{proj}} < 1
\end{cases}$$

If $\min_i \text{dist}(T_k, S_i) \le 750\text{ meters}$, target $T_k$ is flagged as an active science opportunity with estimated detour time:

$$\Delta t_{\text{detour}} = \frac{2 \cdot \text{dist}(T_k)}{v_0} + t_{\text{sampling}}(T_k)$$
