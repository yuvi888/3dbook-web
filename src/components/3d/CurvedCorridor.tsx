'use client';

import { Suspense, useMemo } from 'react';
import * as THREE from 'three';
import { RealisticGlassWindow3D } from './RealisticGlassWindow3D';
import { RealisticTallBananaPlant3D } from './RealisticTallBananaPlant3D';
import { RealisticTallFiddleFig3D } from './RealisticTallFiddleFig3D';
import { CeilingChandelier3D, WallSconce3D } from './CorridorFixtures3D';

function seededRand(seed: number): number {
  const x = Math.sin(seed * 127.1 + 311.7) * 43758.5453123;
  return x - Math.floor(x);
}

// Smooth long luxury curved gallery spline (~232 meters)
export const TUNNEL_CURVE_POINTS = [
  new THREE.Vector3(0, 0, 8),
  new THREE.Vector3(0, 0, -16),
  new THREE.Vector3(2.0, 0, -40),
  new THREE.Vector3(9.5, 0, -66),
  new THREE.Vector3(22.0, 0, -94),
  new THREE.Vector3(36.0, 0, -124),
  new THREE.Vector3(48.0, 0, -154),
  new THREE.Vector3(56.0, 0, -184),
  new THREE.Vector3(60.0, 0, -210),
];

export const tunnelCurve = new THREE.CatmullRomCurve3(
  TUNNEL_CURVE_POINTS,
  false,
  'catmullrom',
  0.5
);

export const CORRIDOR_DIMS = {
  WIDTH: 4.8,
  HALF_W: 2.4,
  HEIGHT: 3.3,
  FLOOR_Y: -1.65,
  CEILING_Y: 1.65,
  CARPET_HALF_W: 1.54,
} as const;

// Spaced center chandeliers running overhead down the long gallery centerline
export const CHANDELIER_TS = [
  0.035, 0.103, 0.171, 0.239, 0.307, 0.375, 0.443,
  0.511, 0.579, 0.647, 0.715, 0.783, 0.851, 0.925,
];

// Panoramic double-glazed windows placed after bookshelves along Left & Right walls
export const CORRIDOR_WINDOWS: Array<{ t: number; side: 'left' | 'right' }> = [
  // Left wall (sunny trees & grass sky view) — placed cleanly after each Left bookshelf
  { t: 0.105, side: 'left' },
  { t: 0.235, side: 'left' },
  { t: 0.365, side: 'left' },
  { t: 0.495, side: 'left' },
  { t: 0.625, side: 'left' },
  { t: 0.755, side: 'left' },
  { t: 0.885, side: 'left' },
  // Right wall (ocean sea & clouds view) — entrance balance + after each Right bookshelf
  { t: 0.045, side: 'right' },
  { t: 0.170, side: 'right' },
  { t: 0.300, side: 'right' },
  { t: 0.430, side: 'right' },
  { t: 0.560, side: 'right' },
  { t: 0.690, side: 'right' },
  { t: 0.820, side: 'right' },
  { t: 0.955, side: 'right' },
];

// Architectural wall sconce lamps spaced cleanly on open beige wall bays (avoiding shelves & windows)
export const WALL_SCONCE_PLACEMENTS: Array<{ t: number; side: 'left' | 'right' }> = [
  // Left wall sconces (clear between Left shelves & Left windows)
  { t: 0.025, side: 'left' },
  { t: 0.140, side: 'left' },
  { t: 0.168, side: 'left' },
  { t: 0.270, side: 'left' },
  { t: 0.298, side: 'left' },
  { t: 0.400, side: 'left' },
  { t: 0.428, side: 'left' },
  { t: 0.530, side: 'left' },
  { t: 0.558, side: 'left' },
  { t: 0.660, side: 'left' },
  { t: 0.688, side: 'left' },
  { t: 0.790, side: 'left' },
  { t: 0.818, side: 'left' },
  { t: 0.920, side: 'left' },
  // Right wall sconces (clear between Right windows & Right shelves)
  { t: 0.024, side: 'right' },
  { t: 0.088, side: 'right' },
  { t: 0.215, side: 'right' },
  { t: 0.345, side: 'right' },
  { t: 0.475, side: 'right' },
  { t: 0.605, side: 'right' },
  { t: 0.735, side: 'right' },
  { t: 0.865, side: 'right' },
];

// Floor tall architectural potted plants flanking bookshelves & sunlit windows
const FLOOR_PLANT_PLACEMENTS: Array<{
  t: number;
  side: 'left' | 'right';
  species: 'fig' | 'banana';
  rotOffset: number;
}> = [
  { t: 0.050, side: 'left', species: 'fig', rotOffset: 0.4 },
  { t: 0.068, side: 'right', species: 'banana', rotOffset: -0.5 },
  { t: 0.083, side: 'left', species: 'banana', rotOffset: 0.8 },
  { t: 0.114, side: 'right', species: 'fig', rotOffset: -0.3 },
  { t: 0.148, side: 'right', species: 'banana', rotOffset: 0.6 },
  { t: 0.179, side: 'left', species: 'banana', rotOffset: 0.2 },
  { t: 0.213, side: 'left', species: 'fig', rotOffset: -0.7 },
  { t: 0.244, side: 'right', species: 'fig', rotOffset: 0.9 },
  { t: 0.278, side: 'right', species: 'banana', rotOffset: -0.4 },
  { t: 0.309, side: 'left', species: 'banana', rotOffset: 0.5 },
  { t: 0.343, side: 'left', species: 'fig', rotOffset: -0.2 },
  { t: 0.374, side: 'right', species: 'fig', rotOffset: 0.3 },
  { t: 0.408, side: 'right', species: 'banana', rotOffset: -0.8 },
  { t: 0.439, side: 'left', species: 'fig', rotOffset: 0.5 },
  { t: 0.473, side: 'left', species: 'banana', rotOffset: -0.4 },
  { t: 0.504, side: 'right', species: 'banana', rotOffset: 0.7 },
  { t: 0.538, side: 'right', species: 'fig', rotOffset: -0.3 },
  { t: 0.569, side: 'left', species: 'banana', rotOffset: 0.6 },
  { t: 0.603, side: 'left', species: 'fig', rotOffset: -0.5 },
  { t: 0.634, side: 'right', species: 'fig', rotOffset: 0.2 },
  { t: 0.668, side: 'right', species: 'banana', rotOffset: -0.6 },
  { t: 0.699, side: 'left', species: 'fig', rotOffset: 0.4 },
  { t: 0.733, side: 'left', species: 'banana', rotOffset: -0.7 },
  { t: 0.764, side: 'right', species: 'banana', rotOffset: 0.8 },
  { t: 0.798, side: 'right', species: 'fig', rotOffset: -0.3 },
  { t: 0.829, side: 'left', species: 'banana', rotOffset: 0.5 },
  { t: 0.863, side: 'left', species: 'fig', rotOffset: -0.2 },
  { t: 0.899, side: 'right', species: 'fig', rotOffset: 0.4 },
  { t: 0.933, side: 'right', species: 'banana', rotOffset: -0.6 },
];

type CorridorSharedTextures = {
  woodFloorMap: THREE.CanvasTexture;
  carpetAlbedoMap: THREE.CanvasTexture;
  carpetNormalMap: THREE.CanvasTexture;
  beigeWallMap: THREE.CanvasTexture;
  beigeWallNormalMap: THREE.CanvasTexture;
  wainscotMap: THREE.CanvasTexture;
  wainscotNormalMap: THREE.CanvasTexture;
  ceilingMap: THREE.CanvasTexture;
};

let cachedCorridorTextures: CorridorSharedTextures | null = null;

function buildNormalFromHeight(height: Float32Array, size: number, strength: number): THREE.CanvasTexture {
  const canvas = document.createElement('canvas');
  canvas.width = size;
  canvas.height = size;
  const ctx = canvas.getContext('2d')!;
  const img = ctx.createImageData(size, size);
  const d = img.data;

  for (let y = 0; y < size; y++) {
    const ym = (y - 1 + size) % size;
    const yp = (y + 1) % size;
    for (let x = 0; x < size; x++) {
      const xm = (x - 1 + size) % size;
      const xp = (x + 1) % size;
      const dX = (height[y * size + xp] - height[y * size + xm]) * strength;
      const dY = (height[yp * size + x] - height[ym * size + x]) * strength;
      const nx = -dX;
      const ny = dY;
      const nz = 1.0;
      const len = Math.sqrt(nx * nx + ny * ny + nz * nz);
      const idx = (y * size + x) * 4;
      d[idx] = Math.round(((nx / len) * 0.5 + 0.5) * 255);
      d[idx + 1] = Math.round(((ny / len) * 0.5 + 0.5) * 255);
      d[idx + 2] = Math.round(((nz / len) * 0.5 + 0.5) * 255);
      d[idx + 3] = 255;
    }
  }
  ctx.putImageData(img, 0, 0);
  const tex = new THREE.CanvasTexture(canvas);
  tex.wrapS = THREE.RepeatWrapping;
  tex.wrapT = THREE.RepeatWrapping;
  return tex;
}

function getCorridorTextures(): CorridorSharedTextures {
  if (cachedCorridorTextures) return cachedCorridorTextures;

  // 1. DARK EUROPEAN WALNUT / OAK HARDWOOD FLOOR BORDER TEXTURE
  const wSize = 512;
  const wCanvas = document.createElement('canvas');
  wCanvas.width = wSize;
  wCanvas.height = wSize;
  const wCtx = wCanvas.getContext('2d')!;
  wCtx.fillStyle = '#4f2f17';
  wCtx.fillRect(0, 0, wSize, wSize);

  const cols = 4;
  const rows = 8;
  const pw = wSize / cols;
  const ph = wSize / rows;
  const planks = ['#6b4120', '#5b3619', '#774925', '#522f14'];
  for (let r = 0; r < rows; r++) {
    for (let c = 0; c < cols; c++) {
      const x = c * pw;
      const y = r * ph;
      const col = planks[(r * 3 + c) % planks.length];
      wCtx.fillStyle = col;
      wCtx.fillRect(x + 1.5, y + 1.5, pw - 3, ph - 3);
      wCtx.fillStyle = 'rgba(22, 10, 2, 0.22)';
      for (let g = 0; g < 6; g++) {
        wCtx.fillRect(x + 3, y + 6 + g * (ph / 6.5), pw - 6, 1.5);
      }
      wCtx.strokeStyle = '#241307';
      wCtx.lineWidth = 2;
      wCtx.strokeRect(x, y, pw, ph);
    }
  }
  const woodFloorMap = new THREE.CanvasTexture(wCanvas);
  woodFloorMap.colorSpace = THREE.SRGBColorSpace;
  woodFloorMap.wrapS = THREE.RepeatWrapping;
  woodFloorMap.wrapT = THREE.RepeatWrapping;
  woodFloorMap.anisotropy = 8;

  // 2. LUXURY WOVEN BOUCLE & BORDERED GALLERY RUNNER CARPET TEXTURE (512 x 512)
  const cSize = 512;
  const cCanvas = document.createElement('canvas');
  cCanvas.width = cSize;
  cCanvas.height = cSize;
  const cCtx = cCanvas.getContext('2d')!;

  const chHeight = new Float32Array(cSize * cSize);

  // Warm oat-taupe wool base field
  cCtx.fillStyle = '#ddd2bf';
  cCtx.fillRect(0, 0, cSize, cSize);

  // Architectural outer tailored borders on left (x: 0..56) and right (x: cSize-56..cSize)
  const borderColorOuter = '#7c654b';
  const borderColorInner = '#a98d62';
  const borderBandW = 54;
  cCtx.fillStyle = borderColorOuter;
  cCtx.fillRect(0, 0, borderBandW, cSize);
  cCtx.fillRect(cSize - borderBandW, 0, borderBandW, cSize);

  // Delicate champagne gold hairline & ivory pin-stripe framing
  cCtx.fillStyle = '#e7dcc9';
  cCtx.fillRect(14, 0, 5, cSize);
  cCtx.fillRect(cSize - 19, 0, 5, cSize);

  cCtx.fillStyle = borderColorInner;
  cCtx.fillRect(borderBandW, 0, 12, cSize);
  cCtx.fillRect(cSize - borderBandW - 12, 0, 12, cSize);

  cCtx.fillStyle = '#4e3e2d';
  cCtx.fillRect(borderBandW + 15, 0, 3, cSize);
  cCtx.fillRect(cSize - borderBandW - 18, 0, 3, cSize);

  // Subtle woven diamond trellis geometric pattern across central field (x: 78..434)
  cCtx.strokeStyle = 'rgba(130, 110, 82, 0.18)';
  cCtx.lineWidth = 2;
  const step = 64;
  for (let y = -step; y <= cSize + step; y += step) {
    for (let x = 76; x <= cSize - 76; x += step) {
      cCtx.beginPath();
      cCtx.moveTo(x, y - step / 2);
      cCtx.lineTo(x + step / 2, y);
      cCtx.lineTo(x, y + step / 2);
      cCtx.lineTo(x - step / 2, y);
      cCtx.closePath();
      cCtx.stroke();

      cCtx.fillStyle = 'rgba(148, 124, 88, 0.14)';
      cCtx.beginPath();
      cCtx.arc(x, y, 4, 0, Math.PI * 2);
      cCtx.fill();
    }
  }

  // Tufted wool pile weave micro-knots (both albedo variation & tactile heightmap!)
  const cImg = cCtx.getImageData(0, 0, cSize, cSize);
  const cd = cImg.data;
  for (let y = 0; y < cSize; y++) {
    for (let x = 0; x < cSize; x++) {
      const idx = y * cSize + x;
      const tuft =
        Math.sin(x * 1.15) * Math.cos(y * 1.15) * 0.45 +
        (seededRand(x * 17.3 + y * 31.7) - 0.5) * 0.55;
      chHeight[idx] = 0.5 + tuft * 0.4;
      const pIdx = idx * 4;
      const shade = tuft * 11;
      cd[pIdx] = Math.max(0, Math.min(255, cd[pIdx] + shade));
      cd[pIdx + 1] = Math.max(0, Math.min(255, cd[pIdx + 1] + shade * 0.94));
      cd[pIdx + 2] = Math.max(0, Math.min(255, cd[pIdx + 2] + shade * 0.85));
    }
  }
  cCtx.putImageData(cImg, 0, 0);

  const carpetAlbedoMap = new THREE.CanvasTexture(cCanvas);
  carpetAlbedoMap.colorSpace = THREE.SRGBColorSpace;
  carpetAlbedoMap.wrapS = THREE.ClampToEdgeWrapping;
  carpetAlbedoMap.wrapT = THREE.RepeatWrapping;
  carpetAlbedoMap.anisotropy = 8;

  const carpetNormalMap = buildNormalFromHeight(chHeight, cSize, 2.2);
  carpetNormalMap.wrapS = THREE.ClampToEdgeWrapping;
  carpetNormalMap.wrapT = THREE.RepeatWrapping;

  // 3. WARM ARCHITECTURAL BEIGE VENETIAN PLASTER WALL TEXTURE
  const bSize = 512;
  const bCanvas = document.createElement('canvas');
  bCanvas.width = bSize;
  bCanvas.height = bSize;
  const bCtx = bCanvas.getContext('2d')!;
  const bHeight = new Float32Array(bSize * bSize);

  bCtx.fillStyle = '#e7dcc7'; // Rich tactile architectural beige
  bCtx.fillRect(0, 0, bSize, bSize);

  // Subtle architectural plaster trowel clouds
  for (let i = 0; i < 420; i++) {
    const x = seededRand(i * 5.1 + 3) * bSize;
    const y = seededRand(i * 9.7 + 7) * bSize;
    const rad = 18 + seededRand(i * 11.3) * 44;
    const g = bCtx.createRadialGradient(x, y, 2, x, y, rad);
    const warm = i % 2 === 0;
    g.addColorStop(0, warm ? 'rgba(244, 237, 222, 0.08)' : 'rgba(212, 198, 174, 0.07)');
    g.addColorStop(1, 'rgba(231, 220, 199, 0)');
    bCtx.fillStyle = g;
    bCtx.beginPath();
    bCtx.arc(x, y, rad, 0, Math.PI * 2);
    bCtx.fill();
  }

  for (let i = 0; i < bSize * bSize; i++) {
    bHeight[i] = 0.5 + (seededRand(i * 3.7) - 0.5) * 0.25;
  }

  const beigeWallMap = new THREE.CanvasTexture(bCanvas);
  beigeWallMap.colorSpace = THREE.SRGBColorSpace;
  beigeWallMap.wrapS = THREE.RepeatWrapping;
  beigeWallMap.wrapT = THREE.RepeatWrapping;

  const beigeWallNormalMap = buildNormalFromHeight(bHeight, bSize, 0.9);

  // 4. COFFERED BEIGE ARCHITECTURAL CEILING TEXTURE
  const ceCanvas = document.createElement('canvas');
  ceCanvas.width = 512;
  ceCanvas.height = 512;
  const ceCtx = ceCanvas.getContext('2d')!;
  ceCtx.fillStyle = '#e8decb';
  ceCtx.fillRect(0, 0, 512, 512);
  ceCtx.strokeStyle = 'rgba(182, 166, 138, 0.55)';
  ceCtx.lineWidth = 10;
  ceCtx.strokeRect(26, 26, 460, 460);
  ceCtx.fillStyle = '#efe6d5';
  ceCtx.fillRect(36, 36, 440, 440);
  ceCtx.strokeStyle = 'rgba(215, 202, 178, 0.65)';
  ceCtx.lineWidth = 3;
  ceCtx.strokeRect(48, 48, 416, 416);

  const ceilingMap = new THREE.CanvasTexture(ceCanvas);
  ceilingMap.colorSpace = THREE.SRGBColorSpace;
  ceilingMap.wrapS = THREE.RepeatWrapping;
  ceilingMap.wrapT = THREE.RepeatWrapping;

  // 5. CLASSIC PANELED WAINSCOT MILLWORK TEXTURE (u = floor->ledge height, v = wall length)
  const wnSize = 512;
  const wnCanvas = document.createElement('canvas');
  wnCanvas.width = wnSize;
  wnCanvas.height = wnSize;
  const wnCtx = wnCanvas.getContext('2d')!;
  const wnHeight = new Float32Array(wnSize * wnSize);
  wnHeight.fill(0.6);

  // Satin cream-beige painted woodwork base
  const wnGrad = wnCtx.createLinearGradient(0, 0, wnSize, 0);
  wnGrad.addColorStop(0.0, '#ddd1bc');
  wnGrad.addColorStop(0.5, '#eae0ce');
  wnGrad.addColorStop(1.0, '#efe6d6');
  wnCtx.fillStyle = wnGrad;
  wnCtx.fillRect(0, 0, wnSize, wnSize);

  // Top dado rail shadow lip & crisp highlight (x = 460..512)
  wnCtx.fillStyle = 'rgba(140, 120, 92, 0.35)';
  wnCtx.fillRect(468, 0, 10, wnSize);
  wnCtx.fillStyle = 'rgba(255, 250, 240, 0.45)';
  wnCtx.fillRect(478, 0, 14, wnSize);

  // Inset architectural rectangular panel molding (2 panels per vertical repeat)
  const panelMarginX = 96;
  const panelEndX = 435;
  const panelMarginsY = [34, 286];
  const panelH = 192;
  panelMarginsY.forEach((py) => {
    // Outer shadow groove
    wnCtx.strokeStyle = 'rgba(130, 112, 86, 0.38)';
    wnCtx.lineWidth = 8;
    wnCtx.strokeRect(panelMarginX, py, panelEndX - panelMarginX, panelH);
    // Inner bevel highlight
    wnCtx.strokeStyle = 'rgba(255, 252, 245, 0.50)';
    wnCtx.lineWidth = 4;
    wnCtx.strokeRect(panelMarginX + 10, py + 10, panelEndX - panelMarginX - 20, panelH - 20);
    // Subtle recessed center panel
    wnCtx.fillStyle = 'rgba(218, 206, 184, 0.25)';
    wnCtx.fillRect(panelMarginX + 14, py + 14, panelEndX - panelMarginX - 28, panelH - 28);

    // Sculpt matching heightfield bevel for normalMap
    for (let y = py - 6; y <= py + panelH + 6; y++) {
      if (y < 0 || y >= wnSize) continue;
      for (let x = panelMarginX - 6; x <= panelEndX + 6; x++) {
        if (x < 0 || x >= wnSize) continue;
        const onOuterEdge =
          Math.abs(y - py) < 5 ||
          Math.abs(y - (py + panelH)) < 5 ||
          Math.abs(x - panelMarginX) < 5 ||
          Math.abs(x - panelEndX) < 5;
        const onInnerBead =
          Math.abs(y - (py + 12)) < 4 ||
          Math.abs(y - (py + panelH - 12)) < 4 ||
          Math.abs(x - (panelMarginX + 12)) < 4 ||
          Math.abs(x - (panelEndX - 12)) < 4;
        if (onOuterEdge) wnHeight[y * wnSize + x] = 0.28;
        else if (onInnerBead) wnHeight[y * wnSize + x] = 0.85;
      }
    }
  });

  const wainscotMap = new THREE.CanvasTexture(wnCanvas);
  wainscotMap.colorSpace = THREE.SRGBColorSpace;
  wainscotMap.wrapS = THREE.ClampToEdgeWrapping;
  wainscotMap.wrapT = THREE.RepeatWrapping;

  const wainscotNormalMap = buildNormalFromHeight(wnHeight, wnSize, 1.8);
  wainscotNormalMap.wrapS = THREE.ClampToEdgeWrapping;
  wainscotNormalMap.wrapT = THREE.RepeatWrapping;

  cachedCorridorTextures = {
    woodFloorMap,
    carpetAlbedoMap,
    carpetNormalMap,
    beigeWallMap,
    beigeWallNormalMap,
    wainscotMap,
    wainscotNormalMap,
    ceilingMap,
  };
  return cachedCorridorTextures;
}

/**
 * Helper: Builds continuous wall geometry with millimeter-accurate rectangular window holes cut out
 * where left/right casement windows sit, plus solid lower wainscot and upper header bands.
 */
function buildPerforatedWallGeometry(
  side: 'left' | 'right',
  windowTs: number[],
  totalLen: number,
  halfW: number,
  floorY: number,
  winCutBotY: number,
  winCutTopY: number,
  ceilingY: number
): THREE.BufferGeometry {
  const halfCutT = 0.58 / totalLen; // Exact 1.16m wide clear opening inside 1.24m window casing
  const cutSpans = windowTs.map((wt) => ({
    start: Math.max(0.001, wt - halfCutT),
    end: Math.min(0.999, wt + halfCutT),
  }));

  // Merge regular uniform stations + exact window hole boundaries
  const uSet = new Set<number>();
  const baseSteps = 340;
  for (let i = 0; i <= baseSteps; i++) {
    uSet.add(Number((i / baseSteps).toFixed(6)));
  }
  cutSpans.forEach((sp) => {
    uSet.add(Number(sp.start.toFixed(6)));
    uSet.add(Number(sp.end.toFixed(6)));
  });

  const stations = Array.from(uSet).sort((a, b) => a - b);
  const yRows = [floorY, winCutBotY, winCutTopY, ceilingY];

  const verts: number[] = [];
  const uvs: number[] = [];
  const indices: number[] = [];

  for (let i = 0; i < stations.length; i++) {
    const t = stations[i];
    const pt = tunnelCurve.getPointAt(t);
    const tangent = tunnelCurve.getTangentAt(t).normalize();
    const normal = new THREE.Vector3(-tangent.z, 0, tangent.x).normalize();
    const wx = pt.x + normal.x * (side === 'left' ? -halfW : halfW);
    const wz = pt.z + normal.z * (side === 'left' ? -halfW : halfW);

    for (let r = 0; r < yRows.length; r++) {
      verts.push(wx, yRows[r], wz);
      const vCoord = (yRows[r] - floorY) / (ceilingY - floorY);
      uvs.push(t * 26, vCoord * 1.4);
    }
  }

  for (let i = 0; i < stations.length - 1; i++) {
    const tMid = (stations[i] + stations[i + 1]) * 0.5;
    const isWindowCut = cutSpans.some((sp) => tMid > sp.start && tMid < sp.end);

    for (let r = 0; r < 3; r++) {
      // Skip middle row (r = 1: winCutBotY .. winCutTopY) cleanly where windows open!
      if (r === 1 && isWindowCut) continue;

      const v0 = i * 4 + r;
      const v1 = v0 + 1;
      const v2 = (i + 1) * 4 + r;
      const v3 = v2 + 1;

      if (side === 'left') {
        indices.push(v0, v1, v2, v1, v3, v2);
      } else {
        indices.push(v0, v2, v1, v1, v2, v3);
      }
    }
  }

  const geo = new THREE.BufferGeometry();
  geo.setAttribute('position', new THREE.Float32BufferAttribute(verts, 3));
  geo.setAttribute('uv', new THREE.Float32BufferAttribute(uvs, 2));
  geo.setIndex(indices);
  geo.computeVertexNormals();
  return geo;
}

/**
 * Helper: Builds a continuous curved strip ribbon extruded along tunnelCurve for floor, carpet,
 * brass edge trims, wainscot dado rail ledges, baseboards, crown cornices, and coffered ceiling.
 */
function buildCorridorRibbon(
  samples: number,
  leftOffset: number,
  rightOffset: number,
  yLeft: number,
  yRight: number,
  uRepeatX: number,
  vRepeatLen: number,
  flipWinding = false
): THREE.BufferGeometry {
  const verts: number[] = [];
  const uvs: number[] = [];
  const indices: number[] = [];

  for (let i = 0; i <= samples; i++) {
    const t = i / samples;
    const pt = tunnelCurve.getPointAt(t);
    const tangent = tunnelCurve.getTangentAt(t).normalize();
    const normal = new THREE.Vector3(-tangent.z, 0, tangent.x).normalize();

    const pL = pt.clone().add(normal.clone().multiplyScalar(leftOffset));
    pL.y = yLeft;
    const pR = pt.clone().add(normal.clone().multiplyScalar(rightOffset));
    pR.y = yRight;

    verts.push(pL.x, pL.y, pL.z, pR.x, pR.y, pR.z);
    uvs.push(0, t * vRepeatLen, uRepeatX, t * vRepeatLen);

    if (i < samples) {
      const v0 = i * 2;
      const v1 = v0 + 1;
      const v2 = (i + 1) * 2;
      const v3 = v2 + 1;
      if (!flipWinding) {
        indices.push(v0, v1, v2, v1, v3, v2);
      } else {
        indices.push(v0, v2, v1, v1, v2, v3);
      }
    }
  }

  const geo = new THREE.BufferGeometry();
  geo.setAttribute('position', new THREE.Float32BufferAttribute(verts, 3));
  geo.setAttribute('uv', new THREE.Float32BufferAttribute(uvs, 2));
  geo.setIndex(indices);
  geo.computeVertexNormals();
  return geo;
}

export function CurvedCorridor() {
  const { WIDTH, HALF_W, FLOOR_Y, CEILING_Y, CARPET_HALF_W } = CORRIDOR_DIMS;

  const {
    woodFloorGeo,
    carpetGeo,
    carpetTrimLeftGeo,
    carpetTrimRightGeo,
    ceilingGeo,
    leftWallGeo,
    rightWallGeo,
    dadoLedgeLeftTopGeo,
    dadoLedgeRightTopGeo,
    dadoPanelLeftGeo,
    dadoPanelRightGeo,
    baseboardLeftGeo,
    baseboardRightGeo,
    crownLeftGeo,
    crownRightGeo,
    ceilingBeams,
    woodFloorMat,
    carpetMat,
    brassMat,
    wallMat,
    dadoTrimMat,
    wainscotPanelMat,
    ceilingMat,
    windowsData,
    chandeliersData,
    sconcesData,
    floorPlantsData,
  } = useMemo(() => {
    const tex = getCorridorTextures();
    const totalLen = tunnelCurve.getLength();
    const SAMPLES = 340;

    // 1. Subfloor Hardwood + Luxury Raised Runner Carpet + Brass Edge Trims
    const wGeo = buildCorridorRibbon(SAMPLES, -HALF_W, HALF_W, FLOOR_Y, FLOOR_Y, 4, 58, false);
    const cpGeo = buildCorridorRibbon(
      SAMPLES,
      -CARPET_HALF_W,
      CARPET_HALF_W,
      FLOOR_Y + 0.008,
      FLOOR_Y + 0.008,
      1,
      72,
      false
    );
    const trLGeo = buildCorridorRibbon(
      SAMPLES,
      -CARPET_HALF_W - 0.028,
      -CARPET_HALF_W + 0.002,
      FLOOR_Y + 0.011,
      FLOOR_Y + 0.011,
      1,
      36,
      false
    );
    const trRGeo = buildCorridorRibbon(
      SAMPLES,
      CARPET_HALF_W - 0.002,
      CARPET_HALF_W + 0.028,
      FLOOR_Y + 0.011,
      FLOOR_Y + 0.011,
      1,
      36,
      false
    );

    // 2. Ceiling (Beige Coffered Plaster)
    const ceGeo = buildCorridorRibbon(SAMPLES, -HALF_W, HALF_W, CEILING_Y, CEILING_Y, 2, 38, true);

    // 3. Perforated Left & Right Beige Walls with real rectangular window cutouts
    const leftWinTs = CORRIDOR_WINDOWS.filter((w) => w.side === 'left').map((w) => w.t);
    const rightWinTs = CORRIDOR_WINDOWS.filter((w) => w.side === 'right').map((w) => w.t);

    const lwGeo = buildPerforatedWallGeometry('left', leftWinTs, totalLen, HALF_W, FLOOR_Y, -0.80, 0.76, CEILING_Y);
    const rwGeo = buildPerforatedWallGeometry('right', rightWinTs, totalLen, HALF_W, FLOOR_Y, -0.80, 0.76, CEILING_Y);

    // 4. Lower Architectural Wainscot Band & Protruding Dado Ledge (-0.89m runs cleanly below window aprons!)
    const DADO_Y = -0.89;
    const dlTopGeo = buildCorridorRibbon(SAMPLES, -HALF_W, -HALF_W + 0.068, DADO_Y, DADO_Y, 1, 36, false);
    const drTopGeo = buildCorridorRibbon(SAMPLES, HALF_W - 0.068, HALF_W, DADO_Y, DADO_Y, 1, 36, false);
    const dpLGeo = buildCorridorRibbon(SAMPLES, -HALF_W + 0.052, -HALF_W + 0.052, FLOOR_Y, DADO_Y, 1, 76, false);
    const dpRGeo = buildCorridorRibbon(SAMPLES, HALF_W - 0.052, HALF_W - 0.052, FLOOR_Y, DADO_Y, 1, 76, true);

    // Raised Baseboard plinth sitting 1.6cm proud of the wainscot paneling
    const bbLGeo = buildCorridorRibbon(SAMPLES, -HALF_W + 0.068, -HALF_W + 0.068, FLOOR_Y, FLOOR_Y + 0.14, 1, 32, false);
    const bbRGeo = buildCorridorRibbon(SAMPLES, HALF_W - 0.068, HALF_W - 0.068, FLOOR_Y, FLOOR_Y + 0.14, 1, 32, true);

    // Stepped Crown Cornice Trim along ceiling edge
    const crLGeo = buildCorridorRibbon(SAMPLES, -HALF_W + 0.06, -HALF_W, CEILING_Y - 0.09, CEILING_Y, 1, 32, false);
    const crRGeo = buildCorridorRibbon(SAMPLES, HALF_W, HALF_W - 0.06, CEILING_Y, CEILING_Y - 0.09, 1, 32, false);

    // 5. Transverse Coffered Ceiling Beams framing every chandelier bay
    const beamTs = [
      0.015, 0.070, 0.137, 0.205, 0.273, 0.341, 0.409, 0.477,
      0.545, 0.613, 0.681, 0.749, 0.817, 0.888, 0.962, 0.992,
    ];
    const cBeams = beamTs.map((bt) => {
      const pt = tunnelCurve.getPointAt(bt);
      const tangent = tunnelCurve.getTangentAt(bt).normalize();
      const rotY = Math.atan2(tangent.x, tangent.z);
      return {
        position: [pt.x, CEILING_Y - 0.045, pt.z] as [number, number, number],
        rotation: [0, rotY, 0] as [number, number, number],
      };
    });

    // Materials
    const wFloorMat = new THREE.MeshStandardMaterial({
      map: tex.woodFloorMap,
      roughness: 0.34,
      metalness: 0.08,
      side: THREE.DoubleSide,
    });

    const cpMat = new THREE.MeshPhysicalMaterial({
      map: tex.carpetAlbedoMap,
      normalMap: tex.carpetNormalMap,
      normalScale: new THREE.Vector2(1.0, 1.0),
      roughness: 0.92,
      metalness: 0.0,
      sheen: 0.45,
      sheenColor: new THREE.Color('#efe7d6'),
      sheenRoughness: 0.85,
      side: THREE.DoubleSide,
    });

    const bMat = new THREE.MeshStandardMaterial({
      color: '#cfb069',
      roughness: 0.28,
      metalness: 0.86,
      side: THREE.DoubleSide,
    });

    const wlMat = new THREE.MeshStandardMaterial({
      map: tex.beigeWallMap,
      normalMap: tex.beigeWallNormalMap,
      normalScale: new THREE.Vector2(0.45, 0.45),
      color: '#f2eadc',
      roughness: 0.72,
      metalness: 0.02,
      side: THREE.DoubleSide,
    });

    const dTrimMat = new THREE.MeshStandardMaterial({
      color: '#e5d9c3',
      roughness: 0.48,
      metalness: 0.03,
      side: THREE.DoubleSide,
    });

    const wPanelMat = new THREE.MeshStandardMaterial({
      map: tex.wainscotMap,
      normalMap: tex.wainscotNormalMap,
      normalScale: new THREE.Vector2(1.0, 1.0),
      color: '#f2e8d7',
      roughness: 0.56,
      metalness: 0.02,
      side: THREE.DoubleSide,
    });

    const ceMat = new THREE.MeshStandardMaterial({
      map: tex.ceilingMap,
      color: '#f0e7d6',
      roughness: 0.74,
      metalness: 0.02,
      side: THREE.DoubleSide,
    });

    // Transform helper for wall items facing inward toward corridor spline center
    const placeOnWall = (t: number, side: 'left' | 'right', distFromCenter: number, y: number) => {
      const pt = tunnelCurve.getPointAt(t);
      const tangent = tunnelCurve.getTangentAt(t).normalize();
      const normal = new THREE.Vector3(-tangent.z, 0, tangent.x).normalize();
      const sign = side === 'left' ? -1 : 1;
      const pos = pt.clone().add(normal.clone().multiplyScalar(sign * distFromCenter));
      pos.y = y;
      const inwardDir = pt.clone().sub(pos).setY(0).normalize();
      const rotY = Math.atan2(inwardDir.x, inwardDir.z);
      return {
        position: [pos.x, pos.y, pos.z] as [number, number, number],
        rotation: [0, rotY, 0] as [number, number, number],
      };
    };

    const wData = CORRIDOR_WINDOWS.map((w, idx) => ({
      key: `win-${idx}-${w.side}`,
      variant: w.side,
      ...placeOnWall(w.t, w.side, HALF_W - 0.02, 0.0),
    }));

    const cData = CHANDELIER_TS.map((ct, idx) => {
      const pt = tunnelCurve.getPointAt(ct);
      const tangent = tunnelCurve.getTangentAt(ct).normalize();
      const rotY = Math.atan2(tangent.x, tangent.z);
      return {
        key: `chandelier-${idx}`,
        position: [pt.x, CEILING_Y, pt.z] as [number, number, number],
        rotation: [0, rotY, 0] as [number, number, number],
      };
    });

    const scData = WALL_SCONCE_PLACEMENTS.map((sc, idx) => ({
      key: `sconce-${idx}`,
      ...placeOnWall(sc.t, sc.side, HALF_W - 0.015, 0.24),
    }));

    // Grounded Floor Tall Potted Plants: Banana inner base offset is -0.76 -> +0.76, Fiddle Fig -0.78 -> +0.78
    const fpData = FLOOR_PLANT_PLACEMENTS.map((fp, idx) => {
      const baseOffsetY = fp.species === 'banana' ? 0.76 : 0.78;
      const placed = placeOnWall(fp.t, fp.side, HALF_W - 0.34, FLOOR_Y + baseOffsetY);
      return {
        key: `floor-plant-${idx}`,
        species: fp.species,
        position: placed.position,
        rotation: [0, placed.rotation[1] + fp.rotOffset, 0] as [number, number, number],
      };
    });

    return {
      woodFloorGeo: wGeo,
      carpetGeo: cpGeo,
      carpetTrimLeftGeo: trLGeo,
      carpetTrimRightGeo: trRGeo,
      ceilingGeo: ceGeo,
      leftWallGeo: lwGeo,
      rightWallGeo: rwGeo,
      dadoLedgeLeftTopGeo: dlTopGeo,
      dadoLedgeRightTopGeo: drTopGeo,
      dadoPanelLeftGeo: dpLGeo,
      dadoPanelRightGeo: dpRGeo,
      baseboardLeftGeo: bbLGeo,
      baseboardRightGeo: bbRGeo,
      crownLeftGeo: crLGeo,
      crownRightGeo: crRGeo,
      ceilingBeams: cBeams,
      woodFloorMat: wFloorMat,
      carpetMat: cpMat,
      brassMat: bMat,
      wallMat: wlMat,
      dadoTrimMat: dTrimMat,
      wainscotPanelMat: wPanelMat,
      ceilingMat: ceMat,
      windowsData: wData,
      chandeliersData: cData,
      sconcesData: scData,
      floorPlantsData: fpData,
    };
  }, [HALF_W, FLOOR_Y, CEILING_Y, CARPET_HALF_W]);

  return (
    <group>
      {/* 1. HARDWOOD PARQUET SUBFLOOR & PLUSH WOVEN LUXURY CARPET RUNNER */}
      <mesh geometry={woodFloorGeo} material={woodFloorMat} receiveShadow />
      <mesh geometry={carpetGeo} material={carpetMat} receiveShadow />
      <mesh geometry={carpetTrimLeftGeo} material={brassMat} />
      <mesh geometry={carpetTrimRightGeo} material={brassMat} />

      {/* 2. BEIGE ARCHITECTURAL COFFERED CEILING & BEAMS */}
      <mesh geometry={ceilingGeo} material={ceilingMat} />
      {ceilingBeams.map((b, idx) => (
        <mesh key={`cbeam-${idx}`} position={b.position} rotation={b.rotation} material={dadoTrimMat} castShadow>
          <boxGeometry args={[WIDTH + 0.08, 0.09, 0.16]} />
        </mesh>
      ))}

      {/* 3. PERFORATED WARM BEIGE PLASTER WALLS */}
      <mesh geometry={leftWallGeo} material={wallMat} receiveShadow />
      <mesh geometry={rightWallGeo} material={wallMat} receiveShadow />

      {/* 4. CONTINUOUS WAINSCOT DADO RAIL LEDGE, BASEBOARD PLINTHS & CROWN MOLDING */}
      <mesh geometry={dadoLedgeLeftTopGeo} material={dadoTrimMat} receiveShadow />
      <mesh geometry={dadoLedgeRightTopGeo} material={dadoTrimMat} receiveShadow />
      <mesh geometry={dadoPanelLeftGeo} material={wainscotPanelMat} receiveShadow />
      <mesh geometry={dadoPanelRightGeo} material={wainscotPanelMat} receiveShadow />
      <mesh geometry={baseboardLeftGeo} material={dadoTrimMat} />
      <mesh geometry={baseboardRightGeo} material={dadoTrimMat} />
      <mesh geometry={crownLeftGeo} material={dadoTrimMat} />
      <mesh geometry={crownRightGeo} material={dadoTrimMat} />

      {/* 5. RECESSED PANORAMIC GLASS WINDOWS (Left: Sunny Park/Sky, Right: Blue Ocean/Clouds) */}
      <Suspense fallback={null}>
        {windowsData.map((win) => (
          <group key={win.key} position={win.position} rotation={win.rotation}>
            <RealisticGlassWindow3D variant={win.variant} autoRotate={false} />
          </group>
        ))}
      </Suspense>

      {/* 6. SPACED CENTER CEILING CHANDELIERS */}
      {chandeliersData.map((ch) => (
        <CeilingChandelier3D key={ch.key} position={ch.position} rotation={ch.rotation} scale={1.0} />
      ))}

      {/* 7. ARCHITECTURAL SMALL WALL SCONCE LAMPS */}
      {sconcesData.map((sc) => (
        <WallSconce3D key={sc.key} position={sc.position} rotation={sc.rotation} scale={1.0} />
      ))}

      {/* 8. TALL FLOOR POTTED PLANTS ALONG CORRIDOR SIDES */}
      {floorPlantsData.map((fp) => (
        <group key={fp.key} position={fp.position} rotation={fp.rotation}>
          {fp.species === 'banana' ? (
            <RealisticTallBananaPlant3D autoRotate={false} />
          ) : (
            <RealisticTallFiddleFig3D autoRotate={false} />
          )}
        </group>
      ))}
    </group>
  );
}
