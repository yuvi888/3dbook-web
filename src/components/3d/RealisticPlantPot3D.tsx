'use client';

import { useRef, useMemo } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';

type LeafVariant =
  | 'deepEmerald'
  | 'variegatedGold'
  | 'chartreuseMarble'
  | 'matureOlive'
  | 'youngShoot';

interface LeafPBRMaps {
  map: THREE.CanvasTexture;
  normalMap: THREE.CanvasTexture;
  roughnessMap: THREE.CanvasTexture;
}

/**
 * Deterministic pseudo-random helper so foliage textures & leaf shapes stay stable across renders.
 */
function seededRand(seed: number): number {
  const x = Math.sin(seed * 127.1 + 311.7) * 43758.5453123;
  return x - Math.floor(x);
}

/**
 * Converts a 2D grayscale heightfield [0..1] into a tangent-space NormalMap CanvasTexture.
 */
function heightfieldToNormalTexture(
  height: Float32Array,
  size: number,
  strength: number
): THREE.CanvasTexture {
  const canvas = document.createElement('canvas');
  canvas.width = size;
  canvas.height = size;
  const ctx = canvas.getContext('2d')!;
  const img = ctx.createImageData(size, size);
  const data = img.data;

  for (let y = 0; y < size; y++) {
    const ym = Math.max(0, y - 1);
    const yp = Math.min(size - 1, y + 1);
    for (let x = 0; x < size; x++) {
      const xm = Math.max(0, x - 1);
      const xp = Math.min(size - 1, x + 1);

      const dX = (height[y * size + xp] - height[y * size + xm]) * strength;
      const dY = (height[yp * size + x] - height[ym * size + x]) * strength;

      const nx = -dX;
      const ny = dY;
      const nz = 1.0;
      const len = Math.sqrt(nx * nx + ny * ny + nz * nz);

      const idx = (y * size + x) * 4;
      data[idx] = Math.round(((nx / len) * 0.5 + 0.5) * 255);
      data[idx + 1] = Math.round(((ny / len) * 0.5 + 0.5) * 255);
      data[idx + 2] = Math.round(((nz / len) * 0.5 + 0.5) * 255);
      data[idx + 3] = 255;
    }
  }

  ctx.putImageData(img, 0, 0);
  const tex = new THREE.CanvasTexture(canvas);
  tex.needsUpdate = true;
  return tex;
}

/**
 * Generates synchronized Albedo, Normal, and Roughness maps for a pothos leaf variant.
 * UV convention: u=0.5 is central midrib, v=0 (bottom of canvas/UV) is petiole sinus, v=1 (top) is leaf tip.
 */
function createLeafPBRSet(variant: LeafVariant, seedOffset: number): LeafPBRMaps {
  const size = 512;

  // 1. ALBEDO CANVAS
  const albedoCanvas = document.createElement('canvas');
  albedoCanvas.width = size;
  albedoCanvas.height = size;
  const aCtx = albedoCanvas.getContext('2d')!;

  // Base chlorophyll palette per botanical variant
  const palettes: Record<
    LeafVariant,
    { baseDark: string; midGreen: string; tipGreen: string; vein: string; varColor?: string }
  > = {
    deepEmerald: {
      baseDark: '#16421d',
      midGreen: '#235e28',
      tipGreen: '#377a33',
      vein: '#77aa52',
    },
    variegatedGold: {
      baseDark: '#1c4d23',
      midGreen: '#2c6c31',
      tipGreen: '#43853c',
      vein: '#9ec467',
      varColor: '#cedb7e',
    },
    chartreuseMarble: {
      baseDark: '#1f5425',
      midGreen: '#357834',
      tipGreen: '#529942',
      vein: '#9fcc6a',
      varColor: '#8dc455',
    },
    matureOlive: {
      baseDark: '#193d1f',
      midGreen: '#285729',
      tipGreen: '#3c6e35',
      vein: '#6c994a',
    },
    youngShoot: {
      baseDark: '#3f7e2d',
      midGreen: '#5da13d',
      tipGreen: '#82be4e',
      vein: '#b8dc78',
    },
  };

  const pal = palettes[variant];

  // Radial + vertical chlorophyll gradient (Canvas y=size corresponds to UV v=0 base, y=0 corresponds to UV v=1 tip)
  const bgGrad = aCtx.createLinearGradient(0, size, 0, 0);
  bgGrad.addColorStop(0.0, pal.baseDark);
  bgGrad.addColorStop(0.55, pal.midGreen);
  bgGrad.addColorStop(1.0, pal.tipGreen);
  aCtx.fillStyle = bgGrad;
  aCtx.fillRect(0, 0, size, size);

  // Subtle darker chlorophyll glow near center vein base
  const heartGrad = aCtx.createRadialGradient(
    size * 0.5,
    size * 0.85,
    size * 0.04,
    size * 0.5,
    size * 0.65,
    size * 0.52
  );
  heartGrad.addColorStop(0, 'rgba(12, 35, 14, 0.35)');
  heartGrad.addColorStop(1, 'rgba(12, 35, 14, 0)');
  aCtx.fillStyle = heartGrad;
  aCtx.fillRect(0, 0, size, size);

  // Authentic Golden Pothos marbling: feathered directional streaks sweeping along veins!
  if (pal.varColor) {
    aCtx.save();
    for (let i = 0; i < 22; i++) {
      const side = i % 3 === 0 ? -1 : 1;
      const frac = 0.14 + seededRand(seedOffset + i * 11) * 0.72;
      const y0 = size * (1 - frac);
      const reach = size * (0.18 + seededRand(seedOffset + i * 13) * 0.28);
      const sweep = size * (0.08 + seededRand(seedOffset + i * 17) * 0.14);
      const xStart = size * (0.5 + side * (0.04 + seededRand(seedOffset + i * 7) * 0.14));
      const xEnd = Math.max(12, Math.min(size - 12, xStart + side * reach));
      const yEnd = Math.max(12, y0 - sweep);

      const sGrad = aCtx.createLinearGradient(xStart, y0, xEnd, yEnd);
      sGrad.addColorStop(0, pal.varColor + '00');
      sGrad.addColorStop(0.28, pal.varColor + 'b8');
      sGrad.addColorStop(0.72, pal.varColor + '90');
      sGrad.addColorStop(1, pal.varColor + '00');

      aCtx.strokeStyle = sGrad;
      aCtx.lineCap = 'round';
      aCtx.lineWidth = 6 + seededRand(seedOffset + i * 23) * 14;
      aCtx.beginPath();
      aCtx.moveTo(xStart, y0);
      aCtx.quadraticCurveTo(xStart + side * reach * 0.5, y0 - sweep * 0.18, xEnd, yEnd);
      aCtx.stroke();
    }
    aCtx.restore();
  }

  // Organic fine cellular mottling & subtle longitudinal fiber variation
  for (let i = 0; i < 550; i++) {
    const px = seededRand(seedOffset + i * 3.1) * size;
    const py = seededRand(seedOffset + i * 5.7) * size;
    const pr = 1.2 + seededRand(seedOffset + i * 9.3) * 4.5;
    aCtx.fillStyle = i % 2 === 0 ? 'rgba(255,255,215,0.022)' : 'rgba(8,25,10,0.032)';
    aCtx.beginPath();
    aCtx.arc(px, py, pr, 0, Math.PI * 2);
    aCtx.fill();
  }

  // 2. HEIGHTFIELD CANVAS (for crisp recessed veins & quilted leaf pillows!)
  const hCanvas = document.createElement('canvas');
  hCanvas.width = size;
  hCanvas.height = size;
  const hCtx = hCanvas.getContext('2d')!;
  hCtx.fillStyle = '#909090';
  hCtx.fillRect(0, 0, size, size);

  // Subtle quilted inter-vein pillowing + fine epidermis micro-texture
  for (let i = 0; i < 1100; i++) {
    const px = seededRand(i * 4.3 + 2) * size;
    const py = seededRand(i * 6.9 + 5) * size;
    const pr = 1 + seededRand(i * 2.7) * 2.8;
    hCtx.fillStyle = i % 2 === 0 ? 'rgba(255,255,255,0.04)' : 'rgba(0,0,0,0.04)';
    hCtx.beginPath();
    hCtx.arc(px, py, pr, 0, Math.PI * 2);
    hCtx.fill();
  }

  // 3. ROUGHNESS CANVAS (waxy specular lamina vs satin recessed veins)
  const rCanvas = document.createElement('canvas');
  rCanvas.width = size;
  rCanvas.height = size;
  const rCtx = rCanvas.getContext('2d')!;
  rCtx.fillStyle = '#484848'; // ~0.28 waxy cuticle roughness
  rCtx.fillRect(0, 0, size, size);

  // Draw synchronized Midrib + Arcuate Secondary Veins across Albedo, Heightfield, and Roughness
  // Subtle natural chlorophyll veins in albedo; crisp physical recess in heightfield/normalMap!
  const drawVeinStroke = (
    x0: number,
    y0: number,
    cx1: number,
    cy1: number,
    cx2: number,
    cy2: number,
    x1: number,
    y1: number,
    w: number,
    albedoAlpha: number,
    depthAlpha: number
  ) => {
    // Softly blended albedo vein (gradually fades along length)
    aCtx.save();
    const vGrad = aCtx.createLinearGradient(x0, y0, x1, y1);
    vGrad.addColorStop(0, pal.vein);
    vGrad.addColorStop(0.75, pal.vein);
    vGrad.addColorStop(1, pal.vein + '00');
    aCtx.strokeStyle = vGrad;
    aCtx.globalAlpha = albedoAlpha;
    aCtx.lineWidth = w;
    aCtx.lineCap = 'round';
    aCtx.beginPath();
    aCtx.moveTo(x0, y0);
    aCtx.bezierCurveTo(cx1, cy1, cx2, cy2, x1, y1);
    aCtx.stroke();
    aCtx.restore();

    // Heightfield recessed channel (darker = indented vein)
    hCtx.save();
    hCtx.strokeStyle = `rgba(26, 26, 26, ${Math.min(0.9, depthAlpha)})`;
    hCtx.lineWidth = w * 1.55;
    hCtx.lineCap = 'round';
    hCtx.beginPath();
    hCtx.moveTo(x0, y0);
    hCtx.bezierCurveTo(cx1, cy1, cx2, cy2, x1, y1);
    hCtx.stroke();
    hCtx.restore();

    // Roughness (veins slightly less glossy than waxy lamina pillows)
    rCtx.save();
    rCtx.strokeStyle = `rgba(135, 135, 135, ${depthAlpha * 0.7})`;
    rCtx.lineWidth = w * 1.3;
    rCtx.lineCap = 'round';
    rCtx.beginPath();
    rCtx.moveTo(x0, y0);
    rCtx.bezierCurveTo(cx1, cy1, cx2, cy2, x1, y1);
    rCtx.stroke();
    rCtx.restore();
  };

  // Central Midrib (tapers smoothly from base y=size to tip y=10)
  for (let seg = 0; seg < 16; seg++) {
    const t0 = seg / 16;
    const t1 = (seg + 1) / 16;
    const y0 = size * (1 - t0 * 0.97);
    const y1 = size * (1 - t1 * 0.97);
    const w = 6.6 * (1 - t0 * 0.84);
    drawVeinStroke(
      size * 0.5, y0, size * 0.5, (y0 + y1) / 2, size * 0.5, (y0 + y1) / 2, size * 0.5, y1,
      w, 0.55 - t0 * 0.28, 0.85 - t0 * 0.25
    );
  }

  // 7 pairs of arcuate secondary pothos veins sweeping naturally from midrib toward margins
  const veinStartFractions = [0.12, 0.22, 0.34, 0.47, 0.60, 0.72, 0.83];
  veinStartFractions.forEach((f, idx) => {
    [-1, 1].forEach((side) => {
      const stagger = side === 1 ? 0.025 : 0;
      const frac = Math.min(0.92, f + stagger);
      const yStart = size * (1 - frac);
      const reach = size * (0.43 - frac * 0.26);
      const sweepUp = size * (0.14 + (1 - frac) * 0.08);
      const w = Math.max(1.1, 3.0 - idx * 0.28);

      const xEnd = size * 0.5 + side * reach;
      const yEnd = Math.max(14, yStart - sweepUp);
      const cx1 = size * 0.5 + side * reach * 0.48;
      const cy1 = yStart - sweepUp * 0.10;
      const cx2 = size * 0.5 + side * reach * 0.86;
      const cy2 = yStart - sweepUp * 0.55;

      drawVeinStroke(size * 0.5, yStart, cx1, cy1, cx2, cy2, xEnd, yEnd, w, 0.34 - idx * 0.03, 0.68 - idx * 0.05);

      // Subtle tertiary branching veinlets
      if (idx < 5) {
        const bx0 = size * 0.5 + side * reach * 0.52;
        const by0 = yStart - sweepUp * 0.30;
        const bx1 = size * 0.5 + side * reach * 0.76;
        const by1 = by0 - size * 0.045;
        drawVeinStroke(bx0, by0, bx0 + side * 12, by0 - 6, bx1 - side * 8, by1 + 4, bx1, by1, 1.0, 0.14, 0.35);
      }
    });
  });

  // Extract heightfield float buffer and bake smooth tangent-space NormalMap
  const hData = hCtx.getImageData(0, 0, size, size).data;
  const heightFloat = new Float32Array(size * size);
  for (let i = 0; i < size * size; i++) {
    heightFloat[i] = hData[i * 4] / 255;
  }

  const mapTex = new THREE.CanvasTexture(albedoCanvas);
  mapTex.colorSpace = THREE.SRGBColorSpace;
  mapTex.anisotropy = 8;
  mapTex.needsUpdate = true;

  const normalTex = heightfieldToNormalTexture(heightFloat, size, 3.2);
  normalTex.anisotropy = 8;

  const roughTex = new THREE.CanvasTexture(rCanvas);
  roughTex.anisotropy = 4;
  roughTex.needsUpdate = true;

  return { map: mapTex, normalMap: normalTex, roughnessMap: roughTex };
}

/**
 * Generates rich, readable organic potting mix (peat, bark, perlite) PBR maps.
 */
function createSoilPBRSet(): LeafPBRMaps {
  const size = 512;
  const aCanvas = document.createElement('canvas');
  aCanvas.width = size;
  aCanvas.height = size;
  const aCtx = aCanvas.getContext('2d')!;

  const hCanvas = document.createElement('canvas');
  hCanvas.width = size;
  hCanvas.height = size;
  const hCtx = hCanvas.getContext('2d')!;

  const rCanvas = document.createElement('canvas');
  rCanvas.width = size;
  rCanvas.height = size;
  const rCtx = rCanvas.getContext('2d')!;

  // Rich dark chocolate-umber peat base (readable under studio light, not pitch black)
  aCtx.fillStyle = '#38261a';
  aCtx.fillRect(0, 0, size, size);
  hCtx.fillStyle = '#707070';
  hCtx.fillRect(0, 0, size, size);
  rCtx.fillStyle = '#e6e6e6';
  rCtx.fillRect(0, 0, size, size);

  // Organic soil crumbs & humus clumps
  for (let i = 0; i < 2400; i++) {
    const x = seededRand(i * 3.1 + 11) * size;
    const y = seededRand(i * 5.3 + 23) * size;
    const rad = 1.2 + seededRand(i * 7.7) * 5.2;
    const tone = seededRand(i * 11.1);

    if (tone > 0.75) {
      aCtx.fillStyle = '#523826';
      hCtx.fillStyle = '#b5b5b5';
    } else if (tone > 0.35) {
      aCtx.fillStyle = '#2d1e14';
      hCtx.fillStyle = '#505050';
    } else {
      aCtx.fillStyle = '#453021';
      hCtx.fillStyle = '#8d8d8d';
    }
    aCtx.beginPath();
    aCtx.arc(x, y, rad, 0, Math.PI * 2);
    aCtx.fill();

    hCtx.beginPath();
    hCtx.arc(x, y, rad, 0, Math.PI * 2);
    hCtx.fill();
  }

  // Bark mulch chips
  for (let i = 0; i < 140; i++) {
    const x = seededRand(i * 13.3 + 7) * size;
    const y = seededRand(i * 17.9 + 3) * size;
    const w = 6 + seededRand(i * 19.1) * 14;
    const h = 3 + seededRand(i * 23.7) * 5;
    const rot = seededRand(i * 29.3) * Math.PI;

    aCtx.save();
    aCtx.translate(x, y);
    aCtx.rotate(rot);
    aCtx.fillStyle = i % 2 === 0 ? '#654630' : '#4a3120';
    aCtx.fillRect(-w / 2, -h / 2, w, h);
    aCtx.restore();

    hCtx.save();
    hCtx.translate(x, y);
    hCtx.rotate(rot);
    hCtx.fillStyle = '#d4d4d4';
    hCtx.fillRect(-w / 2, -h / 2, w, h);
    hCtx.restore();
  }

  // Natural perlite mineral flecks (subtle authentic horticultural potting mix detail)
  for (let i = 0; i < 55; i++) {
    const x = seededRand(i * 31.7 + 41) * size;
    const y = seededRand(i * 37.1 + 59) * size;
    const rad = 1.6 + seededRand(i * 43.3) * 2.5;
    aCtx.fillStyle = '#d8d0c3';
    aCtx.beginPath();
    aCtx.arc(x, y, rad, 0, Math.PI * 2);
    aCtx.fill();
    hCtx.fillStyle = '#ebebeb';
    hCtx.beginPath();
    hCtx.arc(x, y, rad, 0, Math.PI * 2);
    hCtx.fill();
  }

  const hData = hCtx.getImageData(0, 0, size, size).data;
  const heightFloat = new Float32Array(size * size);
  for (let i = 0; i < size * size; i++) {
    heightFloat[i] = hData[i * 4] / 255;
  }

  const mapTex = new THREE.CanvasTexture(aCanvas);
  mapTex.colorSpace = THREE.SRGBColorSpace;
  mapTex.wrapS = THREE.RepeatWrapping;
  mapTex.wrapT = THREE.RepeatWrapping;
  mapTex.repeat.set(1.5, 1.5);

  const normalTex = heightfieldToNormalTexture(heightFloat, size, 2.6);
  normalTex.wrapS = THREE.RepeatWrapping;
  normalTex.wrapT = THREE.RepeatWrapping;
  normalTex.repeat.set(1.5, 1.5);

  const roughTex = new THREE.CanvasTexture(rCanvas);
  roughTex.wrapS = THREE.RepeatWrapping;
  roughTex.wrapT = THREE.RepeatWrapping;

  return { map: mapTex, normalMap: normalTex, roughnessMap: roughTex };
}

/**
 * Generates subtle glazed speckled ceramic stoneware textures for the pot.
 */
function createCeramicGlazeTexture(): { map: THREE.CanvasTexture; roughnessMap: THREE.CanvasTexture } {
  const size = 512;
  const aCanvas = document.createElement('canvas');
  aCanvas.width = size;
  aCanvas.height = size;
  const aCtx = aCanvas.getContext('2d')!;

  const rCanvas = document.createElement('canvas');
  rCanvas.width = size;
  rCanvas.height = size;
  const rCtx = rCanvas.getContext('2d')!;

  // Warm artisan porcelain/stoneware cream gradient
  const grad = aCtx.createLinearGradient(0, 0, 0, size);
  grad.addColorStop(0.0, '#fbf9f4');
  grad.addColorStop(0.75, '#f5f1e7');
  grad.addColorStop(1.0, '#ece6d8');
  aCtx.fillStyle = grad;
  aCtx.fillRect(0, 0, size, size);

  rCtx.fillStyle = '#3d3d3d'; // Glossy satin ceramic glaze (~0.24)
  rCtx.fillRect(0, 0, size, size);

  // Subtle natural mineral flecks & handmade throwing bands
  for (let y = 0; y < size; y += 6) {
    aCtx.fillStyle = y % 12 === 0 ? 'rgba(255,255,255,0.08)' : 'rgba(180,168,150,0.04)';
    aCtx.fillRect(0, y, size, 2);
  }
  for (let i = 0; i < 650; i++) {
    const x = seededRand(i * 4.7 + 3) * size;
    const y = seededRand(i * 8.1 + 9) * size;
    const rad = 0.5 + seededRand(i * 12.3) * 1.1;
    aCtx.fillStyle = 'rgba(145, 132, 118, 0.16)';
    aCtx.beginPath();
    aCtx.arc(x, y, rad, 0, Math.PI * 2);
    aCtx.fill();
  }

  const mapTex = new THREE.CanvasTexture(aCanvas);
  mapTex.colorSpace = THREE.SRGBColorSpace;
  mapTex.wrapS = THREE.RepeatWrapping;
  mapTex.wrapT = THREE.ClampToEdgeWrapping;

  const roughTex = new THREE.CanvasTexture(rCanvas);
  roughTex.wrapS = THREE.RepeatWrapping;
  roughTex.wrapT = THREE.ClampToEdgeWrapping;

  return { map: mapTex, roughnessMap: roughTex };
}

/**
 * Builds a structured 3D cordate (heart-shaped) pothos leaf mesh with:
 * - True basal heart lobes wrapping behind (0,0,0) petiole sinus
 * - Crisp tapered acuminate tip
 * - Recessed midrib keel + gentle quilted lobes + unique organic margin undulation
 * - Exact [0..1] UVs mapped directly to the leaf PBR texture set
 */
function buildBotanicalLeafGeometry(
  width: number,
  length: number,
  droopAmount: number,
  seed: number
): THREE.BufferGeometry {
  const uSegs = 18;
  const vSegs = 24;

  const verts: number[] = [];
  const uvs: number[] = [];
  const indices: number[] = [];

  for (let iv = 0; iv <= vSegs; iv++) {
    const v = iv / vSegs; // 0 = base sinus, 1 = drip tip
    // Broad cordate shoulder width profile tapering to acuminate tip
    const baseWidthProfile =
      v === 0
        ? 0.004
        : Math.pow(Math.sin(Math.pow(v, 0.56) * Math.PI), 0.70);

    for (let iu = 0; iu <= uSegs; iu++) {
      const u = (iu / uSegs) * 2 - 1; // -1 (left edge) .. 0 (midrib) .. +1 (right edge)
      const absU = Math.abs(u);

      // X position across leaf width
      const x = u * (width * 0.5) * baseWidthProfile;

      // Y position: heart lobes sweep backward below y=0 near base sinus!
      const lobeBackwardDip =
        -length * 0.14 * Math.exp(-v * 6.5) * Math.sin(absU * Math.PI * 0.88);
      const y = v * length + lobeBackwardDip;

      // Z 3D sculpting:
      // 1. Midrib V-trough + wing camber
      const midribGroove = -width * 0.028 * Math.exp(-Math.pow(u / 0.14, 2)) * (1 - v * 0.7);
      const cup = Math.sin(v * Math.PI) * Math.pow(absU, 1.35) * (width * 0.16);
      // 2. Gravity arch + graceful reflex curl at tip
      const droop = -Math.pow(v, 1.55) * (length * droopAmount);
      const tipCurl = v > 0.75 ? -Math.pow((v - 0.75) / 0.25, 2) * (length * 0.06) : 0;
      // 3. Unique organic margin undulation (no two leaves identical!)
      const waveFreq = 2.6 + (seed % 3) * 0.5;
      const marginWave =
        Math.sin(v * Math.PI * waveFreq + seed * 2.1) *
        Math.pow(absU, 1.45) *
        (width * 0.045);

      const z = midribGroove + cup + droop + tipCurl + marginWave;

      verts.push(x, y, z);
      uvs.push(u * 0.5 + 0.5, v);
    }
  }

  for (let iv = 0; iv < vSegs; iv++) {
    for (let iu = 0; iu < uSegs; iu++) {
      const a = iv * (uSegs + 1) + iu;
      const b = a + 1;
      const c = a + (uSegs + 1);
      const d = c + 1;
      indices.push(a, b, c, b, d, c);
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
 * Builds a smooth tapered organic tube along a CatmullRomCurve3 (zero blunt cut tube ends).
 */
function buildTaperedStemGeometry(
  points: THREE.Vector3[],
  tubularSegs: number,
  radiusStart: number,
  radiusEnd: number,
  radialSegs = 8
): THREE.BufferGeometry {
  const curve = new THREE.CatmullRomCurve3(points);
  const frames = curve.computeFrenetFrames(tubularSegs, false);

  const verts: number[] = [];
  const normals: number[] = [];
  const uvs: number[] = [];
  const indices: number[] = [];

  for (let i = 0; i <= tubularSegs; i++) {
    const t = i / tubularSegs;
    const p = curve.getPointAt(t);
    const N = frames.normals[i];
    const B = frames.binormals[i];
    const r = radiusStart + (radiusEnd - radiusStart) * t;

    for (let j = 0; j <= radialSegs; j++) {
      const v = (j / radialSegs) * Math.PI * 2;
      const sin = Math.sin(v);
      const cos = -Math.cos(v);

      const nx = cos * N.x + sin * B.x;
      const ny = cos * N.y + sin * B.y;
      const nz = cos * N.z + sin * B.z;

      verts.push(p.x + r * nx, p.y + r * ny, p.z + r * nz);
      normals.push(nx, ny, nz);
      uvs.push(j / radialSegs, t);
    }
  }

  for (let i = 0; i < tubularSegs; i++) {
    for (let j = 0; j < radialSegs; j++) {
      const a = i * (radialSegs + 1) + j;
      const b = (i + 1) * (radialSegs + 1) + j;
      const c = (i + 1) * (radialSegs + 1) + (j + 1);
      const d = i * (radialSegs + 1) + (j + 1);
      indices.push(a, b, d, b, c, d);
    }
  }

  // Cap the tip cleanly with a rounded point vertex so no hollow tube end ever appears
  const tipCenter = curve.getPointAt(1);
  const tipTangent = curve.getTangentAt(1);
  const tipApex = tipCenter.clone().add(tipTangent.multiplyScalar(radiusEnd * 1.6));
  const tipIdx = verts.length / 3;
  verts.push(tipApex.x, tipApex.y, tipApex.z);
  normals.push(tipTangent.x, tipTangent.y, tipTangent.z);
  uvs.push(0.5, 1);

  const lastRingStart = tubularSegs * (radialSegs + 1);
  for (let j = 0; j < radialSegs; j++) {
    indices.push(lastRingStart + j, tipIdx, lastRingStart + j + 1);
  }

  const geo = new THREE.BufferGeometry();
  geo.setAttribute('position', new THREE.Float32BufferAttribute(verts, 3));
  geo.setAttribute('normal', new THREE.Float32BufferAttribute(normals, 3));
  geo.setAttribute('uv', new THREE.Float32BufferAttribute(uvs, 2));
  geo.setIndex(indices);
  return geo;
}

type SharedPothosAssets = {
  outerPotGeo: THREE.BufferGeometry;
  innerPotGeo: THREE.BufferGeometry;
  soilMoundGeo: THREE.BufferGeometry;
  ceramicMat: THREE.MeshPhysicalMaterial;
  ceramicInnerMat: THREE.MeshPhysicalMaterial;
  soilMat: THREE.MeshStandardMaterial;
  petioleMat: THREE.MeshStandardMaterial;
  vineMat: THREE.MeshStandardMaterial;
  nodeCollarMat: THREE.MeshStandardMaterial;
  pebbleGeoList: THREE.BufferGeometry[];
  pebbleMats: THREE.MeshStandardMaterial[];
  leafMaterials: Record<LeafVariant, THREE.MeshPhysicalMaterial>;
  crownMeshes: Array<{
    id: string;
    petioleGeo: THREE.BufferGeometry;
    leafGeo: THREE.BufferGeometry;
    pos: [number, number, number];
    q: THREE.Quaternion;
    material: THREE.MeshPhysicalMaterial;
  }>;
  trailingVines: Array<{
    id: string;
    runnerGeo: THREE.BufferGeometry;
    nodes: Array<{
      id: string;
      nodePos: THREE.Vector3;
      petioleGeo: THREE.BufferGeometry;
      leafPos: [number, number, number];
      leafGeo: THREE.BufferGeometry;
      leafQ: THREE.Quaternion;
      material: THREE.MeshPhysicalMaterial;
    }>;
    tipLeaf: {
      pos: [number, number, number];
      leafGeo: THREE.BufferGeometry;
      leafQ: THREE.Quaternion;
      material: THREE.MeshPhysicalMaterial;
    };
  }>;
};

let cachedPothosAssets: SharedPothosAssets | null = null;

function computeLeafQuaternion(direction: [number, number, number], roll = 0): THREE.Quaternion {
  const dirVec = new THREE.Vector3(...direction).normalize();
  const upVec = new THREE.Vector3(0, 1, 0);
  const q = new THREE.Quaternion().setFromUnitVectors(upVec, dirVec);
  if (roll !== 0) {
    const qRoll = new THREE.Quaternion().setFromAxisAngle(dirVec, roll);
    q.premultiply(qRoll);
  }
  return q;
}

function getSharedPothosAssets(potRadius: number, potHeight: number, soilY: number): SharedPothosAssets {
  if (cachedPothosAssets) return cachedPothosAssets;

  const variants: LeafVariant[] = [
    'deepEmerald',
    'variegatedGold',
    'chartreuseMarble',
    'matureOlive',
    'youngShoot',
  ];
  const leafMaterials = {} as Record<LeafVariant, THREE.MeshPhysicalMaterial>;
  variants.forEach((v, idx) => {
    const maps = createLeafPBRSet(v, (idx + 1) * 37);
    leafMaterials[v] = new THREE.MeshPhysicalMaterial({
      map: maps.map,
      normalMap: maps.normalMap,
      normalScale: new THREE.Vector2(1.15, 1.15),
      roughnessMap: maps.roughnessMap,
      roughness: 0.34,
      metalness: 0.01,
      clearcoat: 0.48,
      clearcoatRoughness: 0.22,
      sheen: 0.28,
      sheenColor: new THREE.Color('#9ed672'),
      sheenRoughness: 0.65,
      side: THREE.DoubleSide,
    });
  });

  const soilMaps = createSoilPBRSet();
  const soilMat = new THREE.MeshStandardMaterial({
    map: soilMaps.map,
    normalMap: soilMaps.normalMap,
    normalScale: new THREE.Vector2(1.4, 1.4),
    roughnessMap: soilMaps.roughnessMap,
    roughness: 0.94,
    metalness: 0.0,
  });

  const glazeMaps = createCeramicGlazeTexture();
  const ceramicMat = new THREE.MeshPhysicalMaterial({
    map: glazeMaps.map,
    roughnessMap: glazeMaps.roughnessMap,
    roughness: 0.26,
    metalness: 0.01,
    clearcoat: 0.72,
    clearcoatRoughness: 0.14,
    reflectivity: 0.65,
  });

  const ceramicInnerMat = new THREE.MeshPhysicalMaterial({
    color: new THREE.Color('#ebe5d8'),
    roughness: 0.42,
    clearcoat: 0.35,
    clearcoatRoughness: 0.28,
  });

  const petioleMat = new THREE.MeshStandardMaterial({ color: '#467632', roughness: 0.42, metalness: 0.02 });
  const vineMat = new THREE.MeshStandardMaterial({ color: '#3c6b2c', roughness: 0.44, metalness: 0.02 });
  const nodeCollarMat = new THREE.MeshStandardMaterial({ color: '#4e7838', roughness: 0.5 });

  const pebbleGeoList = [0, 1, 2, 3].map((pIdx) => {
    const g = new THREE.IcosahedronGeometry(1, 3);
    const pos = g.attributes.position;
    for (let i = 0; i < pos.count; i++) {
      const vx = pos.getX(i);
      const vy = pos.getY(i);
      const vz = pos.getZ(i);
      const n =
        1 +
        0.12 * Math.sin(vx * 3.1 + pIdx * 2.0) * Math.cos(vz * 2.7 + pIdx) +
        0.07 * Math.cos(vy * 4.2 + pIdx * 1.3);
      pos.setXYZ(i, vx * n, vy * 0.56 * n, vz * 0.82 * n);
    }
    g.computeVertexNormals();
    return g;
  });

  const pebbleColors = ['#787066', '#948674', '#58534d', '#847b70', '#6b645c', '#9c8e7c', '#605a52', '#8f8375', '#544f49'];
  const pebbleMats = pebbleColors.map((col) => new THREE.MeshStandardMaterial({ color: col, roughness: 0.68, metalness: 0.02 }));

  const baseR = potRadius * 0.93;
  const wall = 0.0052;
  const outerPts: THREE.Vector2[] = [
    new THREE.Vector2(0.0, 0.003),
    new THREE.Vector2(baseR - 0.008, 0.003),
    new THREE.Vector2(baseR - 0.006, 0.0),
    new THREE.Vector2(baseR - 0.001, 0.0),
    new THREE.Vector2(baseR, 0.004),
    new THREE.Vector2(potRadius - 0.002, potHeight - 0.005),
    new THREE.Vector2(potRadius, potHeight - 0.002),
    new THREE.Vector2(potRadius - 0.0005, potHeight + 0.0025),
    new THREE.Vector2(potRadius - wall * 0.5, potHeight + 0.0038),
    new THREE.Vector2(potRadius - wall, potHeight + 0.0015),
  ];
  const outerPotGeo = new THREE.LatheGeometry(outerPts, 72).rotateY(Math.PI);

  const innerPts: THREE.Vector2[] = [
    new THREE.Vector2(potRadius - wall, potHeight + 0.0015),
    new THREE.Vector2(potRadius - wall - 0.001, soilY - 0.025),
  ];
  const innerPotGeo = new THREE.LatheGeometry(innerPts, 64).rotateY(Math.PI);

  const soilMoundGeo = new THREE.PlaneGeometry((potRadius - wall) * 2.02, (potRadius - wall) * 2.02, 32, 32);
  soilMoundGeo.rotateX(-Math.PI / 2);
  const gPos = soilMoundGeo.attributes.position;
  const maxR = potRadius - wall + 0.0008;
  for (let i = 0; i < gPos.count; i++) {
    let x = gPos.getX(i);
    let z = gPos.getZ(i);
    const r = Math.sqrt(x * x + z * z);
    if (r > maxR) {
      const s = maxR / r;
      x *= s;
      z *= s;
    }
    const normR = Math.min(1, r / maxR);
    const dome = (1 - normR * normR) * 0.007;
    const organicBump = 0.0022 * Math.sin(x * 85) * Math.cos(z * 85) + 0.0012 * Math.sin((x + z) * 140);
    gPos.setXYZ(i, x, dome + organicBump * (1 - normR * 0.6), z);
  }
  soilMoundGeo.computeVertexNormals();

  const rootClusters: Array<[number, number, number]> = [
    [-0.013, soilY - 0.003, 0.010],
    [0.015, soilY - 0.003, -0.008],
    [-0.004, soilY - 0.003, -0.015],
  ];

  const crownItems: Array<{
    id: string;
    root: [number, number, number];
    base: [number, number, number];
    dir: [number, number, number];
    w: number;
    len: number;
    droop: number;
    roll: number;
    seed: number;
    variant: LeafVariant;
    arch: number;
  }> = [];

  for (let i = 0; i < 7; i++) {
    const angle = (i * Math.PI * 2) / 7 + 0.25;
    const root = rootClusters[i % 3];
    const rBase = 0.016 + (i % 3) * 0.006;
    const yBase = soilY + 0.028 + (i % 3) * 0.005;
    crownItems.push({
      id: `t1-${i}`,
      root,
      base: [rBase * Math.cos(angle), yBase, rBase * Math.sin(angle)],
      dir: [0.54 * Math.cos(angle + 0.14), 0.78 - (i % 2) * 0.06, 0.54 * Math.sin(angle + 0.14)],
      w: 0.052 + (i % 2) * 0.006,
      len: 0.068 + (i % 3) * 0.005,
      droop: 0.28,
      roll: ((i % 3) - 1) * 0.22,
      seed: 10 + i * 3,
      variant: i % 3 === 0 ? 'chartreuseMarble' : 'youngShoot',
      arch: 0.006,
    });
  }
  for (let i = 0; i < 11; i++) {
    const angle = (i * Math.PI * 2) / 11 + 0.48;
    const root = rootClusters[i % 3];
    const rBase = 0.032 + (i % 3) * 0.006;
    const yBase = soilY + 0.024 + (i % 3) * 0.005;
    const vCycle: LeafVariant[] = ['variegatedGold', 'deepEmerald', 'chartreuseMarble', 'matureOlive'];
    crownItems.push({
      id: `t2-${i}`,
      root,
      base: [rBase * Math.cos(angle), yBase, rBase * Math.sin(angle)],
      dir: [0.66 * Math.cos(angle + 0.08), 0.72 + (i % 2) * 0.06, 0.66 * Math.sin(angle + 0.08)],
      w: 0.064 + (i % 3) * 0.005,
      len: 0.084 + (i % 3) * 0.006,
      droop: 0.24,
      roll: ((i % 5) - 2) * 0.14,
      seed: 40 + i * 5,
      variant: vCycle[i % vCycle.length],
      arch: 0.007,
    });
  }
  for (let i = 0; i < 12; i++) {
    const angle = (i * Math.PI * 2) / 12 + 0.12;
    const root = rootClusters[i % 3];
    const rBase = 0.052 + (i % 3) * 0.005;
    const yBase = soilY + 0.019 + (i % 2) * 0.004;
    const vCycle: LeafVariant[] = ['deepEmerald', 'variegatedGold', 'matureOlive', 'chartreuseMarble'];
    crownItems.push({
      id: `t3-${i}`,
      root,
      base: [rBase * Math.cos(angle), yBase, rBase * Math.sin(angle)],
      dir: [0.84 * Math.cos(angle + 0.06), 0.44 + (i % 2) * 0.05, 0.84 * Math.sin(angle + 0.06)],
      w: 0.072 + (i % 3) * 0.004,
      len: 0.092 + (i % 3) * 0.006,
      droop: 0.28,
      roll: ((i % 4) - 1.5) * 0.16,
      seed: 80 + i * 7,
      variant: vCycle[i % vCycle.length],
      arch: 0.008,
    });
  }
  for (let i = 0; i < 10; i++) {
    const angle = (i * Math.PI * 2) / 10 + 0.32;
    const root = rootClusters[i % 3];
    const rBase = 0.071 + (i % 3) * 0.003;
    const yBase = soilY + 0.017 + (i % 2) * 0.003;
    const vCycle: LeafVariant[] = ['matureOlive', 'deepEmerald', 'variegatedGold'];
    crownItems.push({
      id: `t4-${i}`,
      root,
      base: [rBase * Math.cos(angle), yBase, rBase * Math.sin(angle)],
      dir: [0.92 * Math.cos(angle), -0.12 - (i % 2) * 0.08, 0.92 * Math.sin(angle)],
      w: 0.074 + (i % 2) * 0.005,
      len: 0.095 + (i % 2) * 0.007,
      droop: 0.32,
      roll: ((i % 3) - 1) * 0.20,
      seed: 130 + i * 11,
      variant: vCycle[i % vCycle.length],
      arch: 0.010,
    });
  }

  const crownMeshes = crownItems.map((l) => {
    const p0 = new THREE.Vector3(...l.root);
    const p3 = new THREE.Vector3(...l.base);
    const dVec = new THREE.Vector3(...l.dir).normalize();
    const p1 = new THREE.Vector3(p0.x * 0.65 + p3.x * 0.35, Math.max(p0.y, p3.y) + l.arch * 0.5, p0.z * 0.65 + p3.z * 0.35);
    const p2 = p3.clone().sub(dVec.clone().multiplyScalar(0.011));
    return {
      id: l.id,
      petioleGeo: buildTaperedStemGeometry([p0, p1, p2, p3], 12, 0.0019, 0.0009, 7),
      leafGeo: buildBotanicalLeafGeometry(l.w, l.len, l.droop, l.seed),
      pos: l.base,
      q: computeLeafQuaternion(l.dir, l.roll),
      material: leafMaterials[l.variant],
    };
  });

  const configs = [
    { id: 'vine-fl', phi: 2.15, len: 0.72, count: 5, rootIdx: 0 },
    { id: 'vine-r', phi: -0.65, len: 0.65, count: 4, rootIdx: 1 },
    { id: 'vine-fc', phi: 1.18, len: 0.58, count: 4, rootIdx: 0 },
    { id: 'vine-bl', phi: 3.65, len: 0.55, count: 4, rootIdx: 2 },
  ];

  const trailingVines = configs.map((cfg, cIdx) => {
    const root = rootClusters[cfg.rootIdx];
    const points = [
      new THREE.Vector3(root[0], root[1], root[2]),
      new THREE.Vector3(0.046 * Math.cos(cfg.phi - 0.08), 0.124, 0.046 * Math.sin(cfg.phi - 0.08)),
      new THREE.Vector3(0.074 * Math.cos(cfg.phi), 0.135, 0.074 * Math.sin(cfg.phi)),
      new THREE.Vector3(0.080 * Math.cos(cfg.phi + 0.04), 0.116 - 0.022 * cfg.len, 0.080 * Math.sin(cfg.phi + 0.04)),
      new THREE.Vector3(0.085 * Math.cos(cfg.phi - 0.02), 0.104 - 0.048 * cfg.len, 0.085 * Math.sin(cfg.phi - 0.02)),
      new THREE.Vector3(0.087 * Math.cos(cfg.phi + 0.05), 0.092 - 0.068 * cfg.len, 0.087 * Math.sin(cfg.phi + 0.05)),
      new THREE.Vector3(0.086 * Math.cos(cfg.phi + 0.09), 0.082 - 0.075 * cfg.len, 0.086 * Math.sin(cfg.phi + 0.09)),
    ];

    const curve = new THREE.CatmullRomCurve3(points);
    const runnerGeo = buildTaperedStemGeometry(points, 36, 0.0021, 0.0008, 8);
    const vList: LeafVariant[] = ['deepEmerald', 'variegatedGold', 'chartreuseMarble', 'matureOlive'];
    const nodes: SharedPothosAssets['trailingVines'][number]['nodes'] = [];

    for (let i = 0; i < cfg.count; i++) {
      const t = 0.30 + (i / cfg.count) * 0.60;
      const pNode = curve.getPointAt(t);
      const tangent = curve.getTangentAt(t);
      const normal = new THREE.Vector3(pNode.x, 0, pNode.z).normalize();
      const sideDir = new THREE.Vector3().crossVectors(tangent, normal).normalize();
      const isLeft = i % 2 === 0;

      const leafBase = pNode
        .clone()
        .add(tangent.clone().multiplyScalar(0.009))
        .add(normal.clone().multiplyScalar(0.008))
        .add(sideDir.clone().multiplyScalar(isLeft ? 0.010 : -0.010));

      const outwardBias = 0.50 + t * 0.28;
      const downBias = -0.80 + t * 0.22;
      const leafDir = normal
        .clone()
        .multiplyScalar(outwardBias)
        .add(new THREE.Vector3(0, downBias, 0))
        .add(sideDir.clone().multiplyScalar(isLeft ? 0.30 : -0.30))
        .normalize();

      const petioleMid = pNode.clone().lerp(leafBase, 0.55).add(normal.clone().multiplyScalar(0.003));
      const petioleGeo = buildTaperedStemGeometry([pNode, petioleMid, leafBase], 8, 0.0013, 0.0008, 6);

      const frac = i / cfg.count;
      const leafLen = 0.068 - frac * 0.022;
      const leafW = 0.054 - frac * 0.016;
      const dirArr: [number, number, number] = [leafDir.x, leafDir.y, leafDir.z];
      const variant = i === cfg.count - 1 ? 'youngShoot' : vList[(cIdx + i) % vList.length];

      nodes.push({
        id: `${cfg.id}-node-${i}`,
        nodePos: pNode,
        petioleGeo,
        leafPos: [leafBase.x, leafBase.y, leafBase.z],
        leafGeo: buildBotanicalLeafGeometry(leafW, leafLen, 0.28, 200 + cIdx * 23 + i * 7),
        leafQ: computeLeafQuaternion(dirArr, isLeft ? 0.28 : -0.28),
        material: leafMaterials[variant],
      });
    }

    const tipPos = curve.getPointAt(1.0);
    const tipNormal = new THREE.Vector3(tipPos.x, 0, tipPos.z).normalize();
    const tipDir = tipNormal.clone().multiplyScalar(0.75).add(new THREE.Vector3(0, -0.45, 0)).normalize();

    return {
      id: cfg.id,
      runnerGeo,
      nodes,
      tipLeaf: {
        pos: [tipPos.x, tipPos.y, tipPos.z] as [number, number, number],
        leafGeo: buildBotanicalLeafGeometry(0.030, 0.044, 0.18, 300 + cIdx * 13),
        leafQ: computeLeafQuaternion([tipDir.x, tipDir.y, tipDir.z], 0.1),
        material: leafMaterials.youngShoot,
      },
    };
  });

  cachedPothosAssets = {
    outerPotGeo,
    innerPotGeo,
    soilMoundGeo,
    ceramicMat,
    ceramicInnerMat,
    soilMat,
    petioleMat,
    vineMat,
    nodeCollarMat,
    pebbleGeoList,
    pebbleMats,
    leafMaterials,
    crownMeshes,
    trailingVines,
  };
  return cachedPothosAssets;
}

export function RealisticPlantPot3D({ autoRotate = false }: { autoRotate?: boolean }) {
  const groupRef = useRef<THREE.Group>(null!);

  useFrame((_, delta) => {
    if (autoRotate && groupRef.current) {
      groupRef.current.rotation.y += delta * 0.38;
    }
  });

  const potRadius = 0.068;  // 13.6 cm rim diameter
  const potHeight = 0.125;  // 12.5 cm tall
  const soilY = potHeight - 0.015; // 11.0 cm

  const {
    outerPotGeo,
    innerPotGeo,
    soilMoundGeo,
    ceramicMat,
    ceramicInnerMat,
    soilMat,
    petioleMat,
    vineMat,
    nodeCollarMat,
    pebbleGeoList,
    pebbleMats,
    crownMeshes,
    trailingVines,
  } = useMemo(() => getSharedPothosAssets(potRadius, potHeight, soilY), [potRadius, potHeight, soilY]);

  const pebbles = useMemo(
    () => [
      { pos: [-0.032, soilY + 0.001, 0.025], s: 0.0085, rot: [0.1, 0.5, 0.2], g: 0 },
      { pos: [0.028, soilY + 0.001, -0.026], s: 0.0072, rot: [-0.2, 1.1, 0.1], g: 1 },
      { pos: [-0.012, soilY + 0.002, -0.035], s: 0.0090, rot: [0.15, 2.3, -0.1], g: 2 },
      { pos: [0.036, soilY + 0.001, 0.018], s: 0.0068, rot: [0.05, 0.8, 0.3], g: 3 },
      { pos: [-0.036, soilY + 0.001, -0.016], s: 0.0075, rot: [-0.1, 1.9, 0.15], g: 0 },
      { pos: [0.014, soilY + 0.002, 0.038], s: 0.0078, rot: [0.2, 0.4, -0.2], g: 1 },
      { pos: [0.004, soilY + 0.004, 0.002], s: 0.0062, rot: [0.1, 2.7, 0.05], g: 2 },
      { pos: [-0.022, soilY + 0.002, 0.038], s: 0.0058, rot: [0.0, 1.2, 0.1], g: 3 },
      { pos: [0.042, soilY, -0.005], s: 0.0064, rot: [0.2, 0.9, -0.1], g: 0 },
    ],
    [soilY]
  );

  return (
    <group ref={groupRef} position={[0, -0.02, 0]}>
      {/* 1. GLAZED ARTISAN STONEWARE CERAMIC POT (72-segment smooth Lathe) */}
      <group>
        <mesh geometry={outerPotGeo} material={ceramicMat} castShadow receiveShadow />
        <mesh geometry={innerPotGeo} material={ceramicInnerMat} receiveShadow />

        {/* 3D Mounded Organic Potting Mix */}
        <mesh
          geometry={soilMoundGeo}
          material={soilMat}
          position={[0, soilY, 0]}
          receiveShadow
        />

        {/* Sculpted Organic River Pebbles embedded in soil */}
        {pebbles.map((pb, idx) => (
          <mesh
            key={`pebble-${idx}`}
            geometry={pebbleGeoList[pb.g]}
            material={pebbleMats[idx]}
            position={pb.pos as [number, number, number]}
            rotation={pb.rot as [number, number, number]}
            scale={[pb.s, pb.s, pb.s]}
            castShadow
            receiveShadow
          />
        ))}
      </group>

      {/* 2. DENSE CROWN FOLIAGE (40 Unique Sculpted Heart Leaves + Rooted Tapered Petioles) */}
      {crownMeshes.map((leaf) => (
        <group key={leaf.id}>
          <mesh geometry={leaf.petioleGeo} material={petioleMat} castShadow />
          <mesh
            geometry={leaf.leafGeo}
            material={leaf.material}
            position={leaf.pos}
            quaternion={leaf.q}
            castShadow
            receiveShadow
          />
        </group>
      ))}

      {/* 3. CASCADING VINE RUNNERS (Tapered Vines, Nodes, Acute Petioles, Apical Shoots) */}
      {trailingVines.map((vine) => (
        <group key={vine.id}>
          <mesh geometry={vine.runnerGeo} material={vineMat} castShadow />

          {vine.nodes.map((n) => (
            <group key={n.id}>
              <mesh position={[n.nodePos.x, n.nodePos.y, n.nodePos.z]} material={nodeCollarMat}>
                <sphereGeometry args={[0.0022, 8, 6]} />
              </mesh>

              <mesh geometry={n.petioleGeo} material={petioleMat} castShadow />

              <mesh
                geometry={n.leafGeo}
                material={n.material}
                position={n.leafPos}
                quaternion={n.leafQ}
                castShadow
                receiveShadow
              />
            </group>
          ))}

          <mesh
            geometry={vine.tipLeaf.leafGeo}
            material={vine.tipLeaf.material}
            position={vine.tipLeaf.pos}
            quaternion={vine.tipLeaf.leafQ}
            castShadow
            receiveShadow
          />
        </group>
      ))}
    </group>
  );
}
