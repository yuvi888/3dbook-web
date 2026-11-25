'use client';

import { useRef, useMemo } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';

function seededRand(seed: number): number {
  const x = Math.sin(seed * 127.1 + 311.7) * 43758.5453123;
  return x - Math.floor(x);
}

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
      data[idx] = Math.round(((nx / len) * 0.5 + 0.5) * 255);
      data[idx + 1] = Math.round(((ny / len) * 0.5 + 0.5) * 255);
      data[idx + 2] = Math.round(((nz / len) * 0.5 + 0.5) * 255);
      data[idx + 3] = 255;
    }
  }

  ctx.putImageData(img, 0, 0);
  const tex = new THREE.CanvasTexture(canvas);
  tex.wrapS = THREE.RepeatWrapping;
  tex.wrapT = THREE.RepeatWrapping;
  tex.needsUpdate = true;
  return tex;
}

/**
 * Generates honed Crema Travertine stone PBR maps (mineral bands, pores, satin sheen).
 */
function createTravertinePBRSet() {
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

  // Warm honed travertine cream base
  aCtx.fillStyle = '#e5dbc9';
  aCtx.fillRect(0, 0, size, size);
  hCtx.fillStyle = '#9a9a9a';
  hCtx.fillRect(0, 0, size, size);
  rCtx.fillStyle = '#747474'; // Honed matte-satin stone (~0.45)
  rCtx.fillRect(0, 0, size, size);

  // Horizontal sedimentary limestone mineral veins (seamless horizontally)
  for (let y = 0; y < size; y += 2) {
    const wave = Math.sin(y * 0.045) * 0.5 + Math.cos(y * 0.11) * 0.5;
    if (wave > 0.15) {
      aCtx.fillStyle = `rgba(202, 186, 162, ${0.14 + wave * 0.16})`;
      aCtx.fillRect(0, y, size, 2);
    } else if (wave < -0.2) {
      aCtx.fillStyle = `rgba(245, 239, 228, ${0.18 + Math.abs(wave) * 0.14})`;
      aCtx.fillRect(0, y, size, 2);
    }
  }

  // Organic travertine micro-pitting & porous mineral flecks (wrapped seamlessly across x=0/size)
  for (let i = 0; i < 650; i++) {
    const x = seededRand(i * 3.7 + 5) * size;
    const y = seededRand(i * 7.3 + 9) * size;
    const w = 4 + seededRand(i * 11.1) * 18;
    const h = 1.2 + seededRand(i * 13.7) * 2.4;
    const isPore = i % 3 === 0;

    const drawWrapped = (ctx: CanvasRenderingContext2D, style: string) => {
      ctx.fillStyle = style;
      ctx.beginPath();
      ctx.ellipse(x, y, w * 0.5, h * 0.5, 0, 0, Math.PI * 2);
      ctx.fill();
      if (x + w > size) {
        ctx.beginPath();
        ctx.ellipse(x - size, y, w * 0.5, h * 0.5, 0, 0, Math.PI * 2);
        ctx.fill();
      }
    };

    drawWrapped(aCtx, isPore ? 'rgba(155, 138, 114, 0.30)' : 'rgba(250, 245, 236, 0.22)');
    if (isPore) {
      drawWrapped(hCtx, 'rgba(35, 35, 35, 0.72)');
      drawWrapped(rCtx, 'rgba(195, 195, 195, 0.7)');
    }
  }

  const hData = hCtx.getImageData(0, 0, size, size).data;
  const hFloat = new Float32Array(size * size);
  for (let i = 0; i < size * size; i++) hFloat[i] = hData[i * 4] / 255;

  const map = new THREE.CanvasTexture(aCanvas);
  map.colorSpace = THREE.SRGBColorSpace;
  map.wrapS = THREE.RepeatWrapping;
  map.wrapT = THREE.RepeatWrapping;
  map.anisotropy = 8;

  const normalMap = heightfieldToNormalTexture(hFloat, size, 1.8);
  const roughnessMap = new THREE.CanvasTexture(rCanvas);
  roughnessMap.wrapS = THREE.RepeatWrapping;
  roughnessMap.wrapT = THREE.RepeatWrapping;

  return { map, normalMap, roughnessMap };
}

/**
 * Generates woven oatmeal linen fabric maps (warp/weft weave + bulb glow falloff emissiveMap).
 */
function createLinenShadePBRSet() {
  const size = 512;
  const aCanvas = document.createElement('canvas');
  aCanvas.width = size;
  aCanvas.height = size;
  const aCtx = aCanvas.getContext('2d')!;

  const hCanvas = document.createElement('canvas');
  hCanvas.width = size;
  hCanvas.height = size;
  const hCtx = hCanvas.getContext('2d')!;

  const eCanvas = document.createElement('canvas');
  eCanvas.width = size;
  eCanvas.height = size;
  const eCtx = eCanvas.getContext('2d')!;

  // Warm natural oatmeal linen base
  aCtx.fillStyle = '#efe7d6';
  aCtx.fillRect(0, 0, size, size);
  hCtx.fillStyle = '#808080';
  hCtx.fillRect(0, 0, size, size);

  // Authentic warp-and-weft slubbed flax threads (seamless tile)
  for (let y = 0; y < size; y += 3) {
    const slub = (seededRand(y * 1.9 + 3) - 0.5) * 26;
    const tone = Math.round(234 + slub);
    aCtx.fillStyle = `rgb(${tone}, ${tone - 9}, ${tone - 26})`;
    aCtx.fillRect(0, y, size, 1.5);

    hCtx.fillStyle = y % 6 === 0 ? '#a8a8a8' : '#646464';
    hCtx.fillRect(0, y, size, 1.5);
  }
  for (let x = 0; x < size; x += 3) {
    const slub = (seededRand(x * 2.3 + 7) - 0.5) * 24;
    aCtx.fillStyle = slub > 0 ? 'rgba(255,250,240,0.22)' : 'rgba(165,148,122,0.16)';
    aCtx.fillRect(x, 0, 1.5, size);

    hCtx.fillStyle = x % 6 === 0 ? 'rgba(210,210,210,0.45)' : 'rgba(70,70,70,0.45)';
    hCtx.fillRect(x, 0, 1.5, size);
  }

  // Subtle rolled fabric trim band darkening at top (y=0..18) and bottom (y=size-18..size)
  aCtx.fillStyle = 'rgba(182, 166, 140, 0.35)';
  aCtx.fillRect(0, 0, size, 14);
  aCtx.fillRect(0, size - 14, size, 14);

  // Realistic subsurface light transmission emissive gradient:
  // Brightest warm 2700K amber glow across the middle bulb plane, tapering softly to rolled seams!
  const glowGrad = eCtx.createLinearGradient(0, 0, 0, size);
  glowGrad.addColorStop(0.0, '#3a220b');
  glowGrad.addColorStop(0.08, '#8c5a22');
  glowGrad.addColorStop(0.45, '#ffdf9a');
  glowGrad.addColorStop(0.68, '#ffcf76');
  glowGrad.addColorStop(0.92, '#966126');
  glowGrad.addColorStop(1.0, '#40250b');
  eCtx.fillStyle = glowGrad;
  eCtx.fillRect(0, 0, size, size);

  // Overlay subtle woven linen thread shadow onto emissiveMap so fabric texture glows through!
  for (let y = 0; y < size; y += 3) {
    if (seededRand(y * 3.1) > 0.45) {
      eCtx.fillStyle = 'rgba(70, 35, 5, 0.14)';
      eCtx.fillRect(0, y, size, 1.4);
    }
  }
  for (let x = 0; x < size; x += 3) {
    if (seededRand(x * 4.7) > 0.5) {
      eCtx.fillStyle = 'rgba(70, 35, 5, 0.12)';
      eCtx.fillRect(x, 0, 1.4, size);
    }
  }

  const hData = hCtx.getImageData(0, 0, size, size).data;
  const hFloat = new Float32Array(size * size);
  for (let i = 0; i < size * size; i++) hFloat[i] = hData[i * 4] / 255;

  const map = new THREE.CanvasTexture(aCanvas);
  map.colorSpace = THREE.SRGBColorSpace;
  map.wrapS = THREE.RepeatWrapping;
  map.wrapT = THREE.ClampToEdgeWrapping;
  map.repeat.set(3, 1);
  map.anisotropy = 8;

  const normalMap = heightfieldToNormalTexture(hFloat, size, 1.4);
  normalMap.wrapS = THREE.RepeatWrapping;
  normalMap.wrapT = THREE.ClampToEdgeWrapping;
  normalMap.repeat.set(3, 1);

  const emissiveMap = new THREE.CanvasTexture(eCanvas);
  emissiveMap.colorSpace = THREE.SRGBColorSpace;
  emissiveMap.wrapS = THREE.RepeatWrapping;
  emissiveMap.wrapT = THREE.ClampToEdgeWrapping;
  emissiveMap.repeat.set(3, 1);

  return { map, normalMap, emissiveMap };
}

/**
 * Generates radial brushed antique brass roughness/bump texture.
 */
function createBrushedBrassMaps() {
  const size = 256;
  const rCanvas = document.createElement('canvas');
  rCanvas.width = size;
  rCanvas.height = size;
  const rCtx = rCanvas.getContext('2d')!;
  rCtx.fillStyle = '#484848'; // ~0.28 satin brushed metal
  rCtx.fillRect(0, 0, size, size);

  for (let y = 0; y < size; y++) {
    const streak = Math.round(52 + seededRand(y * 5.3) * 44);
    rCtx.fillStyle = `rgb(${streak},${streak},${streak})`;
    rCtx.fillRect(0, y, size, 1);
  }

  const roughnessMap = new THREE.CanvasTexture(rCanvas);
  roughnessMap.wrapS = THREE.RepeatWrapping;
  roughnessMap.wrapT = THREE.RepeatWrapping;
  return roughnessMap;
}

/**
 * Builds the fluted travertine urn/column geometry with 32 sculpted architectural flutes.
 */
function buildFlutedTravertinePedestal(): THREE.BufferGeometry {
  const radialSegs = 128;
  const profile: Array<[number, number, number]> = [
    // [y, radius, fluteAmplitude]
    [0.011, 0.049, 0.0],
    [0.014, 0.052, 0.0004],
    [0.025, 0.055, 0.0016],
    [0.048, 0.056, 0.0020],
    [0.075, 0.052, 0.0019],
    [0.102, 0.043, 0.0015],
    [0.125, 0.031, 0.0010],
    [0.142, 0.021, 0.0003],
    [0.150, 0.019, 0.0],
    [0.155, 0.021, 0.0],
  ];

  // Subdivide height smoothly between profile rings
  const curvePts = profile.map(([y, r]) => new THREE.Vector2(r, y));
  const spline = new THREE.SplineCurve(curvePts);
  const ySteps = 40;

  const verts: number[] = [];
  const uvs: number[] = [];
  const indices: number[] = [];

  for (let iy = 0; iy <= ySteps; iy++) {
    const v = iy / ySteps;
    const pt = spline.getPointAt(v);
    const y = pt.y;
    const baseR = pt.x;

    // Smooth flute fade-in at bottom & fade-out at neck
    const fluteFade = Math.sin(Math.min(1, Math.max(0, (v - 0.05) / 0.85)) * Math.PI);
    const amp = 0.0018 * Math.pow(fluteFade, 0.7);

    for (let ir = 0; ir <= radialSegs; ir++) {
      const u = ir / radialSegs;
      const theta = u * Math.PI * 2 + Math.PI; // Hide UV seam at back (-Z)
      // 32 rounded architectural flutes
      const flute = Math.cos(u * Math.PI * 2 * 32);
      const r = baseR + amp * flute;

      verts.push(r * Math.sin(theta), y, r * Math.cos(theta));
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

export interface RealisticLamp3DProps {
  autoRotate?: boolean;
  lightLevel?: 0 | 1; // 0: OFF (Default), 1: Minimal Soft Glow
  onToggleLight?: () => void;
  emitPointLight?: boolean;
}

type SharedLampAssets = {
  travertineGeo: THREE.BufferGeometry;
  footPlinthGeo: THREE.BufferGeometry;
  shadeGeo: THREE.BufferGeometry;
  harpLeftGeo: THREE.BufferGeometry;
  harpRightGeo: THREE.BufferGeometry;
  bulbGlassGeo: THREE.BufferGeometry;
  filamentGeo: THREE.BufferGeometry;
  travertineMat: THREE.MeshPhysicalMaterial;
  brassMat: THREE.MeshStandardMaterial;
  polishedBrassMat: THREE.MeshStandardMaterial;
  bulbGlassMat: THREE.MeshPhysicalMaterial;
  linenMatOff: THREE.MeshPhysicalMaterial;
  linenMatLit: THREE.MeshPhysicalMaterial;
  filamentMatOff: THREE.MeshStandardMaterial;
  filamentMatLit: THREE.MeshStandardMaterial;
};

let cachedLampAssets: SharedLampAssets | null = null;

function getSharedLampAssets(): SharedLampAssets {
  if (cachedLampAssets) return cachedLampAssets;

  const travMaps = createTravertinePBRSet();
  const linenMaps = createLinenShadePBRSet();
  const brassRough = createBrushedBrassMaps();

  const tMat = new THREE.MeshPhysicalMaterial({
    map: travMaps.map,
    normalMap: travMaps.normalMap,
    normalScale: new THREE.Vector2(0.85, 0.85),
    roughnessMap: travMaps.roughnessMap,
    roughness: 0.48,
    metalness: 0.02,
    clearcoat: 0.16,
    clearcoatRoughness: 0.35,
  });

  const bMat = new THREE.MeshStandardMaterial({
    color: new THREE.Color('#c89f4e'),
    roughnessMap: brassRough,
    roughness: 0.30,
    metalness: 0.88,
  });

  const pBMat = new THREE.MeshStandardMaterial({
    color: new THREE.Color('#dfb965'),
    roughness: 0.18,
    metalness: 0.94,
  });

  const makeLinen = (emissiveIntensity: number) =>
    new THREE.MeshPhysicalMaterial({
      map: linenMaps.map,
      normalMap: linenMaps.normalMap,
      normalScale: new THREE.Vector2(0.65, 0.65),
      emissiveMap: linenMaps.emissiveMap,
      emissive: new THREE.Color('#ffcf78'),
      emissiveIntensity,
      roughness: 0.88,
      metalness: 0.0,
      sheen: 0.35,
      sheenColor: new THREE.Color('#fff1d6'),
      side: THREE.DoubleSide,
    });

  const gMat = new THREE.MeshPhysicalMaterial({
    color: new THREE.Color('#fff9ec'),
    transparent: true,
    opacity: 0.42,
    roughness: 0.08,
    metalness: 0.0,
    ior: 1.48,
    reflectivity: 0.9,
    clearcoat: 0.8,
  });

  const makeFil = (color: string, emissiveIntensity: number) =>
    new THREE.MeshStandardMaterial({
      color: new THREE.Color(color),
      emissive: new THREE.Color('#ffab38'),
      emissiveIntensity,
      roughness: 0.2,
    });

  const tGeo = buildFlutedTravertinePedestal();

  const footPts = [
    new THREE.Vector2(0.053, 0.0025),
    new THREE.Vector2(0.058, 0.003),
    new THREE.Vector2(0.059, 0.007),
    new THREE.Vector2(0.055, 0.0105),
    new THREE.Vector2(0.049, 0.012),
  ];
  const fGeo = new THREE.LatheGeometry(footPts, 64).rotateY(Math.PI);

  const shadePts = [
    new THREE.Vector2(0.076, 0.289),
    new THREE.Vector2(0.078, 0.291),
    new THREE.Vector2(0.079, 0.288),
    new THREE.Vector2(0.090, 0.232),
    new THREE.Vector2(0.101, 0.176),
    new THREE.Vector2(0.102, 0.172),
    new THREE.Vector2(0.100, 0.171),
  ];
  const sGeo = new THREE.LatheGeometry(shadePts, 72).rotateY(Math.PI);

  const makeHarpArm = (sign: 1 | -1) => {
    const curve = new THREE.CatmullRomCurve3([
      new THREE.Vector3(sign * 0.015, 0.172, 0),
      new THREE.Vector3(sign * 0.046, 0.186, 0),
      new THREE.Vector3(sign * 0.052, 0.232, 0),
      new THREE.Vector3(sign * 0.036, 0.272, 0),
      new THREE.Vector3(sign * 0.008, 0.286, 0),
    ]);
    return new THREE.TubeGeometry(curve, 24, 0.0017, 8, false);
  };

  const bulbPts = [
    new THREE.Vector2(0.008, 0.210),
    new THREE.Vector2(0.012, 0.220),
    new THREE.Vector2(0.021, 0.236),
    new THREE.Vector2(0.022, 0.249),
    new THREE.Vector2(0.016, 0.261),
    new THREE.Vector2(0.006, 0.267),
    new THREE.Vector2(0.0, 0.268),
  ];
  const bGlassGeo = new THREE.LatheGeometry(bulbPts, 32);

  const filPts: THREE.Vector3[] = [];
  for (let i = 0; i <= 24; i++) {
    const t = i / 24;
    const angle = t * Math.PI * 1.4 - Math.PI * 0.2;
    const r = 0.0085;
    const fx = Math.sin(angle) * r;
    const fy = 0.238 + Math.cos(angle) * 0.009 + Math.sin(t * Math.PI * 10) * 0.0012;
    const fz = Math.cos(t * Math.PI * 10) * 0.0012;
    filPts.push(new THREE.Vector3(fx, fy, fz));
  }
  const filCurve = new THREE.CatmullRomCurve3(filPts);
  const fGeoTube = new THREE.TubeGeometry(filCurve, 40, 0.00055, 6, false);

  cachedLampAssets = {
    travertineGeo: tGeo,
    footPlinthGeo: fGeo,
    shadeGeo: sGeo,
    harpLeftGeo: makeHarpArm(-1),
    harpRightGeo: makeHarpArm(1),
    bulbGlassGeo: bGlassGeo,
    filamentGeo: fGeoTube,
    travertineMat: tMat,
    brassMat: bMat,
    polishedBrassMat: pBMat,
    bulbGlassMat: gMat,
    linenMatOff: makeLinen(0.0),
    linenMatLit: makeLinen(0.18),
    filamentMatOff: makeFil('#6c5a4a', 0.0),
    filamentMatLit: makeFil('#ffd485', 1.4),
  };
  return cachedLampAssets;
}

export function RealisticLamp3D({
  autoRotate = false,
  lightLevel = 0,
  onToggleLight,
  emitPointLight = true,
}: RealisticLamp3DProps) {
  const groupRef = useRef<THREE.Group>(null!);

  useFrame((_, delta) => {
    if (autoRotate && groupRef.current) {
      groupRef.current.rotation.y += delta * 0.36;
    }
  });

  const {
    travertineGeo,
    footPlinthGeo,
    shadeGeo,
    harpLeftGeo,
    harpRightGeo,
    bulbGlassGeo,
    filamentGeo,
    travertineMat,
    brassMat,
    polishedBrassMat,
    bulbGlassMat,
    linenMatOff,
    linenMatLit,
    filamentMatOff,
    filamentMatLit,
  } = useMemo(() => getSharedLampAssets(), []);

  const isLit = lightLevel === 1;
  const linenMat = isLit ? linenMatLit : linenMatOff;
  const filamentMat = isLit ? filamentMatLit : filamentMatOff;

  const pointIntensity = isLit ? 0.035 : 0;

  return (
    <group
      ref={groupRef}
      position={[0, -0.14, 0]}
      onClick={(e) => {
        if (onToggleLight) {
          e.stopPropagation();
          onToggleLight();
        }
      }}
    >
      {/* 1. ANTI-SCRATCH DARK FELT BASE PAD */}
      <mesh position={[0, 0.0015, 0]}>
        <cylinderGeometry args={[0.055, 0.055, 0.003, 48]} />
        <meshStandardMaterial color="#1f1b18" roughness={0.94} />
      </mesh>

      {/* 2. TURNED BRUSHED BRASS FOOT PLINTH */}
      <mesh geometry={footPlinthGeo} material={brassMat} castShadow receiveShadow />

      {/* 3. SCULPTED 32-FLUTE HONED TRAVERTINE STONE PEDESTAL */}
      <mesh geometry={travertineGeo} material={travertineMat} castShadow receiveShadow />

      {/* 4. UPPER BRASS NECK COLLAR, SOCKET SHELL & ROTARY DIMMER KEY */}
      <mesh position={[0, 0.161, 0]} material={polishedBrassMat} castShadow>
        <cylinderGeometry args={[0.014, 0.022, 0.013, 36]} />
      </mesh>
      {/* Harp saddle */}
      <mesh position={[0, 0.171, 0]} material={brassMat}>
        <boxGeometry args={[0.032, 0.004, 0.009]} />
      </mesh>
      {/* Knurled Brass E26 Socket Cup */}
      <mesh position={[0, 0.191, 0]} material={brassMat} castShadow>
        <cylinderGeometry args={[0.0155, 0.0145, 0.036, 32]} />
      </mesh>
      <mesh position={[0, 0.207, 0]} material={polishedBrassMat}>
        <cylinderGeometry args={[0.0165, 0.0165, 0.005, 32]} />
      </mesh>
      {/* Tactile Rotary Dimmer Paddle Key (+X side under shade) */}
      <mesh position={[0.020, 0.188, 0]} rotation={[0, 0, Math.PI / 2]} material={polishedBrassMat}>
        <cylinderGeometry args={[0.0018, 0.0018, 0.012, 12]} />
      </mesh>
      <mesh position={[0.027, 0.188, 0]} rotation={[0, Math.PI / 2, 0]} material={polishedBrassMat}>
        <boxGeometry args={[0.0022, 0.0075, 0.009]} />
      </mesh>

      {/* 6. INTERIOR BRASS HARP FRAME, SPIDER WIRES & TOP FINIAL */}
      <mesh geometry={harpLeftGeo} material={polishedBrassMat} />
      <mesh geometry={harpRightGeo} material={polishedBrassMat} />
      {/* Harp Top Crown Cap */}
      <mesh position={[0, 0.286, 0]} material={polishedBrassMat}>
        <cylinderGeometry args={[0.009, 0.009, 0.005, 24]} />
      </mesh>
      {/* 3 Radial Spider Wires supporting the top shade ring */}
      {[0, (Math.PI * 2) / 3, (Math.PI * 4) / 3].map((ang, idx) => (
        <mesh
          key={`spider-${idx}`}
          position={[Math.cos(ang) * 0.042, 0.285, Math.sin(ang) * 0.042]}
          rotation={[0, -ang, Math.PI / 2]}
          material={polishedBrassMat}
        >
          <cylinderGeometry args={[0.0011, 0.0011, 0.074, 8]} />
        </mesh>
      ))}
      {/* Turned Brass Ball Finial above Shade */}
      <mesh position={[0, 0.293, 0]} material={polishedBrassMat} castShadow>
        <cylinderGeometry args={[0.005, 0.007, 0.007, 20]} />
      </mesh>
      <mesh position={[0, 0.301, 0]} material={polishedBrassMat} castShadow>
        <sphereGeometry args={[0.0075, 24, 18]} />
      </mesh>

      {/* 7. GLOWING A19 CLEAR GLASS BULB & WARM TUNGSTEN FILAMENT */}
      <mesh position={[0, 0.211, 0]} material={polishedBrassMat}>
        <cylinderGeometry args={[0.0085, 0.009, 0.006, 20]} />
      </mesh>
      <mesh geometry={filamentGeo} material={filamentMat} />
      <mesh geometry={bulbGlassGeo} material={bulbGlassMat} />

      {/* 8. OPEN WOVEN OATMEAL LINEN EMPIRE SHADE */}
      <mesh geometry={shadeGeo} material={linenMat} castShadow receiveShadow />

      {/* 9. MINIMAL WARM 2700K GLOW (Subtle warmth without blowing out inner shade weave) */}
      {isLit && emitPointLight && (
        <pointLight
          position={[0, 0.228, 0]}
          color="#ffcc7a"
          intensity={pointIntensity}
          distance={0.75}
          decay={1}
        />
      )}
    </group>
  );
}
