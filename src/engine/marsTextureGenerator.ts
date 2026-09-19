// High-fidelity procedural Mars equirectangular texture generators for Three.js
// Provides instantaneous fallback textures so the 3D globe renders immediately
// without waiting for network imagery, and supplements NASA Viking & MOLA maps.

export function createProceduralMarsTexture(width = 2048, height = 1024): string {
  const canvas = document.createElement('canvas');
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext('2d');
  if (!ctx) return '';

  // Base Martian ochre / terracotta gradient
  const baseGrad = ctx.createLinearGradient(0, 0, 0, height);
  baseGrad.addColorStop(0, '#e5e7eb'); // North polar ice cap base
  baseGrad.addColorStop(0.08, '#c2623d');
  baseGrad.addColorStop(0.3, '#b85433');
  baseGrad.addColorStop(0.5, '#a74324'); // Equatorial highlands
  baseGrad.addColorStop(0.7, '#96391d');
  baseGrad.addColorStop(0.92, '#c2623d');
  baseGrad.addColorStop(1, '#f3f4f6'); // South polar ice cap base
  ctx.fillStyle = baseGrad;
  ctx.fillRect(0, 0, width, height);

  // Helper to convert lat/lng to canvas pixel coordinates
  const toX = (lng: number) => ((lng + 180) / 360) * width;
  const toY = (lat: number) => ((90 - lat) / 180) * height;

  // Draw Major Martian Albedo Features (Basaltic Dark Maria)
  ctx.save();
  ctx.filter = 'blur(12px)';

  // 1. Syrtis Major (dark basaltic volcanic shield at ~290° E = -70° to -80° or +60° to +70° E, lat +10°)
  ctx.fillStyle = 'rgba(45, 25, 18, 0.75)';
  ctx.beginPath();
  const smX = toX(68);
  const smY = toY(10);
  ctx.ellipse(smX, smY, width * 0.05, height * 0.12, 0.2, 0, Math.PI * 2);
  ctx.fill();

  // 2. Acidalia Planitia (dark lowland plain in northern hemisphere)
  ctx.beginPath();
  ctx.ellipse(toX(-35), toY(48), width * 0.08, height * 0.14, -0.1, 0, Math.PI * 2);
  ctx.fill();

  // 3. Mare Tyrrhenum & Mare Cimmerium (southern dark belt)
  ctx.beginPath();
  ctx.ellipse(toX(140), toY(-22), width * 0.14, height * 0.07, 0.05, 0, Math.PI * 2);
  ctx.ellipse(toX(210), toY(-25), width * 0.12, height * 0.06, -0.05, 0, Math.PI * 2);
  ctx.fill();

  // 4. Sinus Sabaeus & Meridiani
  ctx.beginPath();
  ctx.ellipse(toX(5), toY(-5), width * 0.09, height * 0.04, 0, 0, Math.PI * 2);
  ctx.fill();

  // 5. Mare Sirenum
  ctx.beginPath();
  ctx.ellipse(toX(-140), toY(-30), width * 0.11, height * 0.06, 0.1, 0, Math.PI * 2);
  ctx.fill();

  // Bright Albedo Features (Hellas Basin & Argyre Basin)
  ctx.fillStyle = 'rgba(215, 140, 95, 0.65)';
  // Hellas Basin (huge circular impact basin at 70°E, -42°S)
  ctx.beginPath();
  ctx.ellipse(toX(70), toY(-42), width * 0.07, height * 0.08, 0, 0, Math.PI * 2);
  ctx.fill();

  // Argyre Basin (-44°W, -50°S)
  ctx.beginPath();
  ctx.ellipse(toX(-44), toY(-50), width * 0.045, height * 0.05, 0, 0, Math.PI * 2);
  ctx.fill();

  // Tharsis Bulge (bright reddish dust plateau)
  ctx.fillStyle = 'rgba(200, 115, 75, 0.55)';
  ctx.beginPath();
  ctx.ellipse(toX(-105), toY(0), width * 0.14, height * 0.22, 0, 0, Math.PI * 2);
  ctx.fill();

  // Elysium Planitia
  ctx.beginPath();
  ctx.ellipse(toX(145), toY(25), width * 0.08, height * 0.09, 0, 0, Math.PI * 2);
  ctx.fill();

  ctx.restore();

  // Valles Marineris (4,000 km grand canyon system along equator from -90° to -40°)
  ctx.save();
  ctx.filter = 'blur(4px)';
  ctx.strokeStyle = 'rgba(35, 15, 10, 0.85)';
  ctx.lineWidth = 5;
  ctx.beginPath();
  ctx.moveTo(toX(-95), toY(-8));
  ctx.quadraticCurveTo(toX(-70), toY(-14), toX(-45), toY(-10));
  ctx.stroke();

  // Secondary tributary chasmata
  ctx.lineWidth = 3;
  ctx.beginPath();
  ctx.moveTo(toX(-85), toY(-6));
  ctx.lineTo(toX(-65), toY(-7));
  ctx.stroke();
  ctx.restore();

  // Olympus Mons Caldera & Volcanic Edifice (-133°W, 18.6°N)
  ctx.save();
  const omX = toX(-133);
  const omY = toY(18.6);
  // Outer shield
  const omGrad = ctx.createRadialGradient(omX, omY, 2, omX, omY, width * 0.035);
  omGrad.addColorStop(0, 'rgba(65, 30, 20, 0.85)');
  omGrad.addColorStop(0.3, 'rgba(120, 55, 35, 0.7)');
  omGrad.addColorStop(0.8, 'rgba(185, 95, 60, 0.5)');
  omGrad.addColorStop(1, 'transparent');
  ctx.fillStyle = omGrad;
  ctx.beginPath();
  ctx.arc(omX, omY, width * 0.035, 0, Math.PI * 2);
  ctx.fill();

  // Tharsis Montes Trio (Ascraeus, Pavonis, Arsia Mons in a diagonal line)
  const montes = [
    { lng: -104, lat: 11.9 }, // Ascraeus
    { lng: -113, lat: 0.8 },  // Pavonis
    { lng: -121, lat: -9.0 }, // Arsia
  ];
  montes.forEach((m) => {
    const mx = toX(m.lng);
    const my = toY(m.lat);
    const mGrad = ctx.createRadialGradient(mx, my, 1, mx, my, width * 0.02);
    mGrad.addColorStop(0, 'rgba(55, 25, 15, 0.8)');
    mGrad.addColorStop(1, 'transparent');
    ctx.fillStyle = mGrad;
    ctx.beginPath();
    ctx.arc(mx, my, width * 0.02, 0, Math.PI * 2);
    ctx.fill();
  });
  ctx.restore();

  // Surface Micro-Craters & Noise Texture
  ctx.save();
  ctx.fillStyle = 'rgba(30, 15, 10, 0.15)';
  for (let i = 0; i < 400; i++) {
    const rx = Math.random() * width;
    const ry = Math.random() * height;
    const rSize = Math.random() * 2.5 + 0.5;
    ctx.beginPath();
    ctx.arc(rx, ry, rSize, 0, Math.PI * 2);
    ctx.fill();
  }
  ctx.restore();

  // North & South Polar Ice Caps (Water Ice and Frozen CO2 Dry Ice)
  ctx.save();
  // North Pole: Planum Boreum
  const npGrad = ctx.createLinearGradient(0, 0, 0, height * 0.12);
  npGrad.addColorStop(0, 'rgba(255, 255, 255, 0.98)');
  npGrad.addColorStop(0.6, 'rgba(240, 248, 255, 0.85)');
  npGrad.addColorStop(0.85, 'rgba(215, 230, 245, 0.4)');
  npGrad.addColorStop(1, 'transparent');
  ctx.fillStyle = npGrad;
  ctx.fillRect(0, 0, width, height * 0.12);

  // South Pole: Planum Australe
  const spGrad = ctx.createLinearGradient(0, height, 0, height * 0.88);
  spGrad.addColorStop(0, 'rgba(255, 255, 255, 0.98)');
  spGrad.addColorStop(0.6, 'rgba(240, 248, 255, 0.85)');
  spGrad.addColorStop(0.85, 'rgba(215, 230, 245, 0.4)');
  spGrad.addColorStop(1, 'transparent');
  ctx.fillStyle = spGrad;
  ctx.fillRect(0, height * 0.88, width, height * 0.12);
  ctx.restore();

  return canvas.toDataURL('image/jpeg', 0.88);
}

// Procedural MOLA Topographic Elevation Color Map
export function createProceduralMolaTexture(width = 2048, height = 1024): string {
  const canvas = document.createElement('canvas');
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext('2d');
  if (!ctx) return '';

  // Martian Dichotomy Gradient (Northern lowlands blue/cyan, Southern highlands green/yellow/brown)
  const grad = ctx.createLinearGradient(0, 0, 0, height);
  grad.addColorStop(0, '#e0f2fe'); // North pole cyan/white
  grad.addColorStop(0.15, '#0284c7'); // Northern lowlands deep blue (-4 to -5 km)
  grad.addColorStop(0.4, '#0d9488'); // Transition
  grad.addColorStop(0.5, '#16a34a'); // Equatorial datum (0 km)
  grad.addColorStop(0.65, '#ca8a04'); // Southern cratered highlands (+2 to +3 km)
  grad.addColorStop(0.85, '#991b1b'); // High plateaus
  grad.addColorStop(1, '#f1f5f9'); // South polar cap
  ctx.fillStyle = grad;
  ctx.fillRect(0, 0, width, height);

  const toX = (lng: number) => ((lng + 180) / 360) * width;
  const toY = (lat: number) => ((90 - lat) / 180) * height;

  // Olympus Mons elevation spike (+21.9 km = pure white & magenta)
  ctx.save();
  const omX = toX(-133);
  const omY = toY(18.6);
  const omGrad = ctx.createRadialGradient(omX, omY, 2, omX, omY, width * 0.04);
  omGrad.addColorStop(0, '#ffffff');
  omGrad.addColorStop(0.3, '#f43f5e');
  omGrad.addColorStop(0.7, '#d97706');
  omGrad.addColorStop(1, 'transparent');
  ctx.fillStyle = omGrad;
  ctx.beginPath();
  ctx.arc(omX, omY, width * 0.04, 0, Math.PI * 2);
  ctx.fill();

  // Hellas Basin deepest depression (-7.2 km = dark purple / navy)
  const hbX = toX(70);
  const hbY = toY(-42);
  const hbGrad = ctx.createRadialGradient(hbX, hbY, 2, hbX, hbY, width * 0.08);
  hbGrad.addColorStop(0, '#1e1b4b');
  hbGrad.addColorStop(0.4, '#1e3a8a');
  hbGrad.addColorStop(0.8, '#0284c7');
  hbGrad.addColorStop(1, 'transparent');
  ctx.fillStyle = hbGrad;
  ctx.beginPath();
  ctx.arc(hbX, hbY, width * 0.08, 0, Math.PI * 2);
  ctx.fill();

  // Valles Marineris rift (-6 to -8 km canyon trough)
  ctx.filter = 'blur(3px)';
  ctx.strokeStyle = '#1e3a8a';
  ctx.lineWidth = 6;
  ctx.beginPath();
  ctx.moveTo(toX(-95), toY(-8));
  ctx.quadraticCurveTo(toX(-70), toY(-14), toX(-45), toY(-10));
  ctx.stroke();
  ctx.restore();

  return canvas.toDataURL('image/jpeg', 0.88);
}
