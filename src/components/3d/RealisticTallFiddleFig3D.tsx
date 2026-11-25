'use client';

import { useRef, useMemo } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import {
  seededRand,
  heightfieldToNormalTexture,
  createRichSoilPBR,
  buildTaperedTube,
  buildSoilMoundGeometry,
  orientLeafSkyward,
} from './botanicalPBR';

/**
 * Generates leathery Fiddle-Leaf Fig (Ficus lyrata) PBR maps:
 * deep waxy emerald blade with prominent pale cream branching veins & recessed channel normalMap.
 */
function createFiddleLeafPBR(tone: 'mature' | 'young') {
  const size = 512;
  const aCanvas = document.createElement('canvas');
  aCanvas.width = size;
  aCanvas.height = size;
  const aCtx = aCanvas.getContext('2d')!;

  const hCanvas = document.createElement('canvas');
  hCanvas.width = size;
  hCanvas.height = size;
  const hCtx = hCanvas.getContext('2d')!;

  const pal =
    tone === 'mature'
      ? { base: '#18441c', mid: '#215724', tip: '#2d6a2d', vein: '#9bc46a' }
      : { base: '#346e26', mid: '#4e9135', tip: '#6eb046', vein: '#c4e088' };

  const grad = aCtx.createLinearGradient(0, size, 0, 0);
  grad.addColorStop(0.0, pal.base);
  grad.addColorStop(0.55, pal.mid);
  grad.addColorStop(1.0, pal.tip);
  aCtx.fillStyle = grad;
  aCtx.fillRect(0, 0, size, size);

  hCtx.fillStyle = '#8e8e8e';
  hCtx.fillRect(0, 0, size, size);

  // Subtle leathery quilted cellular grain
  for (let i = 0; i < 650; i++) {
    const px = seededRand(i * 4.3 + 5) * size;
    const py = seededRand(i * 7.1 + 9) * size;
    aCtx.fillStyle = i % 2 === 0 ? 'rgba(255,255,215,0.025)' : 'rgba(6,18,6,0.04)';
    aCtx.beginPath();
    aCtx.arc(px, py, 1.5 + seededRand(i * 11) * 4, 0, Math.PI * 2);
    aCtx.fill();

    hCtx.fillStyle = i % 2 === 0 ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.05)';
    hCtx.beginPath();
    hCtx.arc(px, py, 1.5 + seededRand(i * 2.9) * 3, 0, Math.PI * 2);
    hCtx.fill();
  }

  const drawVein = (
    x0: number,
    y0: number,
    cx1: number,
    cy1: number,
    cx2: number,
    cy2: number,
    x1: number,
    y1: number,
    w: number,
    aAlpha: number,
    dAlpha: number
  ) => {
    aCtx.save();
    aCtx.strokeStyle = pal.vein;
    aCtx.globalAlpha = aAlpha;
    aCtx.lineWidth = w;
    aCtx.lineCap = 'round';
    aCtx.beginPath();
    aCtx.moveTo(x0, y0);
    aCtx.bezierCurveTo(cx1, cy1, cx2, cy2, x1, y1);
    aCtx.stroke();
    aCtx.restore();

    hCtx.save();
    hCtx.strokeStyle = `rgba(22,22,22,${dAlpha})`;
    hCtx.lineWidth = w * 1.55;
    hCtx.lineCap = 'round';
    hCtx.beginPath();
    hCtx.moveTo(x0, y0);
    hCtx.bezierCurveTo(cx1, cy1, cx2, cy2, x1, y1);
    hCtx.stroke();
    hCtx.restore();
  };

  // Prominent woody pale-chartreuse Ficus lyrata midrib
  for (let seg = 0; seg < 14; seg++) {
    const t0 = seg / 14;
    const t1 = (seg + 1) / 14;
    const y0 = size * (1 - t0 * 0.96);
    const y1 = size * (1 - t1 * 0.96);
    drawVein(
      size * 0.5, y0, size * 0.5, (y0 + y1) / 2, size * 0.5, (y0 + y1) / 2, size * 0.5, y1,
      7.2 * (1 - t0 * 0.78), 0.68 - t0 * 0.25, 0.9 - t0 * 0.2
    );
  }

  // Forked pale lateral Ficus veins (narrower at pinched waist, wide across upper violin lobes!)
  const veinFracs = [0.14, 0.30, 0.48, 0.64, 0.78, 0.88];
  veinFracs.forEach((f, idx) => {
    [-1, 1].forEach((side) => {
      const frac = Math.min(0.92, f + (side > 0 ? 0.02 : 0));
      const yS = size * (1 - frac);
      const reach = size * (frac < 0.38 ? 0.28 : 0.44 - (frac - 0.5) * 0.2);
      const sweep = size * 0.14;
      const xEnd = size * 0.5 + side * reach;
      const yEnd = Math.max(14, yS - sweep);

      drawVein(
        size * 0.5, yS,
        size * 0.5 + side * reach * 0.45, yS - sweep * 0.2,
        size * 0.5 + side * reach * 0.85, yS - sweep * 0.65,
        xEnd, yEnd,
        3.4 - idx * 0.25, 0.46, 0.78
      );

      // Forked secondary branchlet near outer lobe
      const fx0 = size * 0.5 + side * reach * 0.55;
      const fy0 = yS - sweep * 0.35;
      drawVein(fx0, fy0, fx0 + side * 16, fy0 + 4, fx0 + side * 32, fy0 + 10, fx0 + side * 42, fy0 + 18, 1.5, 0.28, 0.45);
    });
  });

  const hData = hCtx.getImageData(0, 0, size, size).data;
  const hFloat = new Float32Array(size * size);
  for (let i = 0; i < size * size; i++) hFloat[i] = hData[i * 4] / 255;

  const map = new THREE.CanvasTexture(aCanvas);
  map.colorSpace = THREE.SRGBColorSpace;
  map.anisotropy = 8;
  const normalMap = heightfieldToNormalTexture(hFloat, size, 3.2);
  normalMap.anisotropy = 8;
  return { map, normalMap };
}

/**
 * Generates realistic fissured woody Ficus trunk bark PBR maps.
 */
function createFicusBarkPBR() {
  const size = 256;
  const aCanvas = document.createElement('canvas');
  aCanvas.width = size;
  aCanvas.height = size;
  const aCtx = aCanvas.getContext('2d')!;

  const hCanvas = document.createElement('canvas');
  hCanvas.width = size;
  hCanvas.height = size;
  const hCtx = hCanvas.getContext('2d')!;

  aCtx.fillStyle = '#6f5c4a';
  aCtx.fillRect(0, 0, size, size);
  hCtx.fillStyle = '#888888';
  hCtx.fillRect(0, 0, size, size);

  for (let x = 0; x < size; x += 3) {
    const shade = Math.round(92 + (seededRand(x * 3.1) - 0.5) * 40);
    aCtx.fillStyle = `rgb(${shade + 12}, ${shade}, ${shade - 14})`;
    aCtx.fillRect(x, 0, 2, size);
    hCtx.fillStyle = seededRand(x * 3.1) > 0.5 ? '#b4b4b4' : '#585858';
    hCtx.fillRect(x, 0, 2, size);
  }
  // Subtle horizontal Ficus lenticel node scars
  for (let y = 0; y < size; y += 16) {
    aCtx.fillStyle = 'rgba(55,44,34,0.35)';
    aCtx.fillRect(0, y, size, 2);
    hCtx.fillStyle = '#383838';
    hCtx.fillRect(0, y, size, 2);
  }

  const hData = hCtx.getImageData(0, 0, size, size).data;
  const hFloat = new Float32Array(size * size);
  for (let i = 0; i < size * size; i++) hFloat[i] = hData[i * 4] / 255;

  const map = new THREE.CanvasTexture(aCanvas);
  map.colorSpace = THREE.SRGBColorSpace;
  map.wrapS = THREE.RepeatWrapping;
  map.wrapT = THREE.RepeatWrapping;
  map.repeat.set(2, 4);

  const normalMap = heightfieldToNormalTexture(hFloat, size, 2.2, true);
  normalMap.repeat.set(2, 4);
  return { map, normalMap };
}

/**
 * Generates warm fluted cream-limestone texture for the tall corridor stoneware pot.
 */
function createWarmFlutedLimestoneTexture() {
  const size = 256;
  const aCanvas = document.createElement('canvas');
  aCanvas.width = size;
  aCanvas.height = size;
  const aCtx = aCanvas.getContext('2d')!;

  const grad = aCtx.createLinearGradient(0, 0, 0, size);
  grad.addColorStop(0, '#f0e9dc');
  grad.addColorStop(0.75, '#e5dccb');
  grad.addColorStop(1, '#d8cdba');
  aCtx.fillStyle = grad;
  aCtx.fillRect(0, 0, size, size);

  for (let i = 0; i < 420; i++) {
    const x = seededRand(i * 4.7 + 1) * size;
    const y = seededRand(i * 7.3 + 5) * size;
    aCtx.fillStyle = i % 2 === 0 ? 'rgba(150,136,115,0.12)' : 'rgba(255,252,244,0.14)';
    aCtx.beginPath();
    aCtx.arc(x, y, 0.7 + seededRand(i * 11) * 1.1, 0, Math.PI * 2);
    aCtx.fill();
  }

  const tex = new THREE.CanvasTexture(aCanvas);
  tex.colorSpace = THREE.SRGBColorSpace;
  tex.wrapS = THREE.RepeatWrapping;
  return tex;
}

/**
 * Builds the iconic violin / lyre-shaped Fiddle-Leaf Fig leaf geometry
 * (narrow pinched waist at v ~ 0.30, broad rounded upper lobes, ruffled leathery margins).
 */
function buildFiddleLeafGeometry(width: number, length: number, droop: number, seed: number): THREE.BufferGeometry {
  const uSegs = 16;
  const vSegs = 26;
  const verts: number[] = [];
  const uvs: number[] = [];
  const indices: number[] = [];

  for (let iv = 0; iv <= vSegs; iv++) {
    const v = iv / vSegs;
    // Ficus lyrata violin/fiddle width curve:
    // Small base auricle lobe (v~0.14), pinched waist (v~0.32), broad expansive crown (v~0.72), rounded tip!
    const baseLobe = 0.28 * Math.exp(-Math.pow((v - 0.14) / 0.12, 2));
    const upperCrown = 0.52 * Math.exp(-Math.pow((v - 0.70) / 0.24, 2));
    const waistPinch = -0.10 * Math.exp(-Math.pow((v - 0.32) / 0.10, 2));
    const endTaper = v < 0.04 ? v * 25 : v > 0.92 ? Math.max(0.05, (1 - v) * 12.5) : 1.0;
    const profile = Math.max(0.03, (0.16 + baseLobe + upperCrown + waistPinch) * endTaper);

    for (let iu = 0; iu <= uSegs; iu++) {
      const u = (iu / uSegs) * 2 - 1;
      const absU = Math.abs(u);
      const x = u * width * profile;
      const y = v * length;

      // Deep leathery central groove + cupped upper lobes + crinkled undulated margins
      const midribGroove = -width * 0.038 * Math.exp(-Math.pow(u / 0.15, 2)) * (1 - v * 0.5);
      const cup = Math.sin(v * Math.PI) * Math.pow(absU, 1.3) * (width * 0.16);
      const droopZ = -Math.pow(v, 1.55) * (length * droop);
      const crinkle = Math.sin(v * Math.PI * 5.8 + seed * 2.1) * Math.pow(absU, 1.4) * (width * 0.052);

      verts.push(x, y, midribGroove + cup + droopZ + crinkle);
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
 * Builds a 36-flute tall stoneware planter cylinder geometry.
 */
function buildFlutedTallPlanter(radius: number, height: number): THREE.BufferGeometry {
  const radialSegs = 108;
  const profile = [
    [0.008, radius * 0.78],
    [0.014, radius * 0.80],
    [height * 0.5, radius * 0.90],
    [height - 0.02, radius],
    [height, radius + 0.002],
  ];
  const spline = new THREE.SplineCurve(profile.map(([y, r]) => new THREE.Vector2(r, y)));
  const ySteps = 24;
  const verts: number[] = [];
  const uvs: number[] = [];
  const indices: number[] = [];

  for (let iy = 0; iy <= ySteps; iy++) {
    const v = iy / ySteps;
    const pt = spline.getPointAt(v);
    const fade = Math.sin(Math.min(1, Math.max(0, (v - 0.06) / 0.84)) * Math.PI);
    const amp = 0.0025 * Math.pow(fade, 0.7);
    for (let ir = 0; ir <= radialSegs; ir++) {
      const u = ir / radialSegs;
      const theta = u * Math.PI * 2 + Math.PI;
      const r = pt.x + amp * Math.cos(u * Math.PI * 2 * 36);
      verts.push(r * Math.sin(theta), pt.y, r * Math.cos(theta));
      uvs.push(u * 2, v);
    }
  }

  for (let iy = 0; iy < ySteps; iy++) {
    for (let ir = 0; ir < radialSegs; ir++) {
      const a = iy * (radialSegs + 1) + ir;
      const b = a + 1;
      const c = a + (radialSegs + 1);
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

type SharedFiddleFigAssets = {
  leafMats: Record<'mature' | 'young', THREE.MeshPhysicalMaterial>;
  barkMat: THREE.MeshStandardMaterial;
  potMat: THREE.MeshPhysicalMaterial;
  potInnerMat: THREE.MeshStandardMaterial;
  soilMat: THREE.MeshStandardMaterial;
  flutedPotGeo: THREE.BufferGeometry;
  rimLipGeo: THREE.BufferGeometry;
  innerPotGeo: THREE.BufferGeometry;
  soilGeo: THREE.BufferGeometry;
  trunkGeos: THREE.BufferGeometry[];
  figLeaves: Array<{
    id: string;
    petioleGeo: THREE.BufferGeometry;
    leafGeo: THREE.BufferGeometry;
    pos: [number, number, number];
    q: THREE.Quaternion;
    tone: 'mature' | 'young';
  }>;
};

let cachedFiddleFigAssets: SharedFiddleFigAssets | null = null;

function getSharedFiddleFigAssets(potRadius: number, potHeight: number, soilY: number): SharedFiddleFigAssets {
  if (cachedFiddleFigAssets) return cachedFiddleFigAssets;

  const mature = createFiddleLeafPBR('mature');
  const young = createFiddleLeafPBR('young');

  const makeLeafMat = (m: { map: THREE.CanvasTexture; normalMap: THREE.CanvasTexture }) =>
    new THREE.MeshPhysicalMaterial({
      map: m.map,
      normalMap: m.normalMap,
      normalScale: new THREE.Vector2(1.25, 1.25),
      roughness: 0.36,
      metalness: 0.01,
      clearcoat: 0.26,
      clearcoatRoughness: 0.42,
      sheen: 0.22,
      sheenColor: new THREE.Color('#8ac45f'),
      side: THREE.DoubleSide,
    });

  const bMaps = createFicusBarkPBR();
  const bMat = new THREE.MeshStandardMaterial({
    map: bMaps.map,
    normalMap: bMaps.normalMap,
    normalScale: new THREE.Vector2(1.1, 1.1),
    roughness: 0.84,
  });

  const pTex = createWarmFlutedLimestoneTexture();
  const pMat = new THREE.MeshPhysicalMaterial({
    map: pTex,
    roughness: 0.48,
    clearcoat: 0.18,
    clearcoatRoughness: 0.35,
  });
  const pInMat = new THREE.MeshStandardMaterial({ color: '#d5cbb8', roughness: 0.72 });

  const sMaps = createRichSoilPBR(2.4);
  const sMat = new THREE.MeshStandardMaterial({
    map: sMaps.map,
    normalMap: sMaps.normalMap,
    normalScale: new THREE.Vector2(1.5, 1.5),
    roughness: 0.94,
  });

  const wall = 0.014;
  const fPotGeo = buildFlutedTallPlanter(potRadius, potHeight);
  const rGeo = new THREE.TorusGeometry(potRadius - wall * 0.45, wall * 0.55, 14, 72);
  rGeo.rotateX(Math.PI / 2);

  const iPts = [
    new THREE.Vector2(potRadius - wall, potHeight),
    new THREE.Vector2(potRadius - wall - 0.004, soilY - 0.05),
  ];
  const iGeo = new THREE.LatheGeometry(iPts, 48).rotateY(Math.PI);
  const soGeo = buildSoilMoundGeometry(potRadius - wall + 0.002, 0.020);

  const mainTrunkPts = [
    new THREE.Vector3(0.0, soilY - 0.02, 0.0),
    new THREE.Vector3(-0.018, 0.65, 0.015),
    new THREE.Vector3(0.012, 0.92, -0.012),
    new THREE.Vector3(-0.008, 1.16, 0.008),
  ];
  const branch1Pts = [
    new THREE.Vector3(0.005, 0.88, -0.008),
    new THREE.Vector3(0.095, 1.08, 0.065),
    new THREE.Vector3(0.145, 1.32, 0.105),
  ];
  const branch2Pts = [
    new THREE.Vector3(-0.006, 0.98, 0.005),
    new THREE.Vector3(-0.105, 1.18, -0.055),
    new THREE.Vector3(-0.155, 1.40, -0.085),
  ];
  const branch3Pts = [
    new THREE.Vector3(-0.008, 1.15, 0.008),
    new THREE.Vector3(-0.025, 1.34, 0.055),
    new THREE.Vector3(0.012, 1.54, 0.020),
  ];

  const tGeos = [
    buildTaperedTube(mainTrunkPts, 24, 0.024, 0.013, 10, true),
    buildTaperedTube(branch1Pts, 16, 0.013, 0.007, 8, true),
    buildTaperedTube(branch2Pts, 16, 0.013, 0.007, 8, true),
    buildTaperedTube(branch3Pts, 14, 0.012, 0.006, 8, true),
  ];

  const branchCurves = [
    { curve: new THREE.CatmullRomCurve3(branch3Pts), count: 11, scale: 0.95 },
    { curve: new THREE.CatmullRomCurve3(branch1Pts), count: 10, scale: 1.0 },
    { curve: new THREE.CatmullRomCurve3(branch2Pts), count: 9, scale: 1.0 },
  ];

  const leaves: SharedFiddleFigAssets['figLeaves'] = [];

  branchCurves.forEach((bc, bIdx) => {
    for (let i = 0; i < bc.count; i++) {
      const t = 0.25 + (i / (bc.count - 1)) * 0.74;
      const bPt = bc.curve.getPointAt(t);
      const azimuth = bIdx * 2.1 + i * 2.39996;
      const reach = (0.045 + (1 - t) * 0.045) * bc.scale;
      const lift = 0.035 + t * 0.03;

      const leafBase = new THREE.Vector3(
        bPt.x + Math.cos(azimuth) * reach,
        bPt.y + lift,
        bPt.z + Math.sin(azimuth) * reach
      );

      const dirY = 0.25 + t * 0.58;
      const dirVec = new THREE.Vector3(Math.cos(azimuth), dirY, Math.sin(azimuth)).normalize();
      const pMid = bPt.clone().lerp(leafBase, 0.55).add(new THREE.Vector3(0, 0.012, 0));
      const pPre = leafBase.clone().sub(dirVec.clone().multiplyScalar(0.018));
      const petioleGeo = buildTaperedTube([bPt, pMid, pPre, leafBase], 8, 0.005, 0.003, 6);

      const w = (0.16 - t * 0.04) * bc.scale;
      const len = (0.28 - t * 0.06) * bc.scale;
      const leafGeo = buildFiddleLeafGeometry(w, len, 0.26 - t * 0.08, 30 + bIdx * 19 + i * 7);
      const q = orientLeafSkyward(dirVec, ((i % 3) - 1) * 0.18);

      leaves.push({
        id: `fig-${bIdx}-${i}`,
        petioleGeo,
        leafGeo,
        pos: [leafBase.x, leafBase.y, leafBase.z],
        q,
        tone: t > 0.80 ? 'young' : 'mature',
      });
    }
  });

  cachedFiddleFigAssets = {
    leafMats: { mature: makeLeafMat(mature), young: makeLeafMat(young) },
    barkMat: bMat,
    potMat: pMat,
    potInnerMat: pInMat,
    soilMat: sMat,
    flutedPotGeo: fPotGeo,
    rimLipGeo: rGeo,
    innerPotGeo: iGeo,
    soilGeo: soGeo,
    trunkGeos: tGeos,
    figLeaves: leaves,
  };
  return cachedFiddleFigAssets;
}

export function RealisticTallFiddleFig3D({ autoRotate = false }: { autoRotate?: boolean }) {
  const groupRef = useRef<THREE.Group>(null!);

  useFrame((_, delta) => {
    if (autoRotate && groupRef.current) {
      groupRef.current.rotation.y += delta * 0.30;
    }
  });

  const potRadius = 0.168;
  const potHeight = 0.43;
  const soilY = potHeight - 0.042;

  const {
    leafMats,
    barkMat,
    potMat,
    potInnerMat,
    soilMat,
    flutedPotGeo,
    rimLipGeo,
    innerPotGeo,
    soilGeo,
    trunkGeos,
    figLeaves,
  } = useMemo(() => getSharedFiddleFigAssets(potRadius, potHeight, soilY), [potRadius, potHeight, soilY]);

  return (
    <group ref={groupRef} position={[0, -0.78, 0]}>
      {/* 1. FLUTED CREAM LIMESTONE CORRIDOR PLANTER & SOIL */}
      <mesh geometry={flutedPotGeo} material={potMat} castShadow receiveShadow />
      <mesh geometry={rimLipGeo} material={potMat} position={[0, potHeight, 0]} castShadow />
      <mesh geometry={innerPotGeo} material={potInnerMat} receiveShadow />
      <mesh geometry={soilGeo} material={soilMat} position={[0, soilY, 0]} receiveShadow />

      {/* Base plate closing underside */}
      <mesh position={[0, 0.008, 0]} rotation={[Math.PI / 2, 0, 0]} material={potMat}>
        <circleGeometry args={[potRadius * 0.78, 48]} />
      </mesh>

      {/* River stones */}
      {[
        [-0.08, soilY + 0.005, 0.06, 0.020, '#787066'],
        [0.075, soilY + 0.005, -0.065, 0.019, '#918577'],
        [-0.055, soilY + 0.006, -0.082, 0.022, '#5c564f'],
        [0.085, soilY + 0.004, 0.048, 0.018, '#837a6f'],
      ].map(([x, y, z, s, col], i) => (
        <mesh
          key={i}
          position={[x as number, y as number, z as number]}
          scale={[s as number, (s as number) * 0.55, (s as number) * 0.85]}
          castShadow
        >
          <icosahedronGeometry args={[1, 2]} />
          <meshStandardMaterial color={col as string} roughness={0.68} />
        </mesh>
      ))}

      {/* 2. WOODY MULTI-BRANCHING FICUS TRUNK */}
      {trunkGeos.map((geo, idx) => (
        <mesh key={`trunk-${idx}`} geometry={geo} material={barkMat} castShadow receiveShadow />
      ))}

      {/* 3. LEATHERY FIDDLE-LEAF FIG CANOPY */}
      {figLeaves.map((entry) => (
        <group key={entry.id}>
          <mesh geometry={entry.petioleGeo} material={barkMat} castShadow />
          <mesh
            geometry={entry.leafGeo}
            material={leafMats[entry.tone]}
            position={entry.pos}
            quaternion={entry.q}
            castShadow
            receiveShadow
          />
        </group>
      ))}
    </group>
  );
}
