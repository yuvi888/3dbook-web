'use client';

import { useRef, useMemo } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';

function seededRand(seed: number): number {
  const x = Math.sin(seed * 127.1 + 311.7) * 43758.5453123;
  return x - Math.floor(x);
}

/**
 * Creates crisp chalk-white lacquer PBR textures and a complementary warm alabaster off-white
 * texture for the recessed fluted architectural back wall.
 */
function createModernShelfTextures() {
  const size = 256;

  // Chalk-white architectural lacquer albedo + subtle micro-satin normal
  const wCanvas = document.createElement('canvas');
  wCanvas.width = size;
  wCanvas.height = size;
  const wCtx = wCanvas.getContext('2d')!;

  const hCanvas = document.createElement('canvas');
  hCanvas.width = size;
  hCanvas.height = size;
  const hCtx = hCanvas.getContext('2d')!;

  wCtx.fillStyle = '#faf9f5';
  wCtx.fillRect(0, 0, size, size);
  hCtx.fillStyle = '#808080';
  hCtx.fillRect(0, 0, size, size);

  for (let i = 0; i < 420; i++) {
    const x = seededRand(i * 4.1 + 2) * size;
    const y = seededRand(i * 7.3 + 9) * size;
    wCtx.fillStyle = i % 2 === 0 ? 'rgba(255,255,255,0.22)' : 'rgba(210,206,198,0.05)';
    wCtx.beginPath();
    wCtx.arc(x, y, 0.5 + seededRand(i * 11.7) * 1.1, 0, Math.PI * 2);
    wCtx.fill();

    hCtx.fillStyle = i % 2 === 0 ? '#858585' : '#7b7b7b';
    hCtx.beginPath();
    hCtx.arc(x, y, 0.6 + seededRand(i * 3.9) * 0.9, 0, Math.PI * 2);
    hCtx.fill();
  }

  const hData = hCtx.getImageData(0, 0, size, size).data;
  const nImg = hCtx.createImageData(size, size);
  for (let y = 0; y < size; y++) {
    const ym = (y - 1 + size) % size;
    const yp = (y + 1) % size;
    for (let x = 0; x < size; x++) {
      const xm = (x - 1 + size) % size;
      const xp = (x + 1) % size;
      const dX = ((hData[(y * size + xp) * 4] - hData[(y * size + xm) * 4]) / 255) * 0.55;
      const dY = ((hData[(yp * size + x) * 4] - hData[(ym * size + x) * 4]) / 255) * 0.55;
      const nx = -dX;
      const ny = dY;
      const nz = 1.0;
      const len = Math.sqrt(nx * nx + ny * ny + nz * nz);
      const idx = (y * size + x) * 4;
      nImg.data[idx] = Math.round(((nx / len) * 0.5 + 0.5) * 255);
      nImg.data[idx + 1] = Math.round(((ny / len) * 0.5 + 0.5) * 255);
      nImg.data[idx + 2] = Math.round(((nz / len) * 0.5 + 0.5) * 255);
      nImg.data[idx + 3] = 255;
    }
  }
  hCtx.putImageData(nImg, 0, 0);

  // Subtle warm alabaster off-white plaster micro-grain for the fluted interior back panel
  const owSize = 512;
  const owCanvas = document.createElement('canvas');
  owCanvas.width = owSize;
  owCanvas.height = owSize;
  const owCtx = owCanvas.getContext('2d')!;
  owCtx.fillStyle = '#ece9e1';
  owCtx.fillRect(0, 0, owSize, owSize);

  for (let i = 0; i < 3600; i++) {
    const x = seededRand(i * 6.1 + 13) * owSize;
    const y = seededRand(i * 9.3 + 27) * owSize;
    owCtx.fillStyle = i % 2 === 0 ? 'rgba(255,255,255,0.06)' : 'rgba(120,114,104,0.03)';
    owCtx.fillRect(x, y, 1 + seededRand(i * 2.1) * 1.1, 1 + seededRand(i * 4.3) * 1.1);
  }

  const whiteMap = new THREE.CanvasTexture(wCanvas);
  whiteMap.colorSpace = THREE.SRGBColorSpace;
  whiteMap.wrapS = THREE.RepeatWrapping;
  whiteMap.wrapT = THREE.RepeatWrapping;

  const normalMap = new THREE.CanvasTexture(hCanvas);
  normalMap.wrapS = THREE.RepeatWrapping;
  normalMap.wrapT = THREE.RepeatWrapping;

  const offWhiteMap = new THREE.CanvasTexture(owCanvas);
  offWhiteMap.colorSpace = THREE.SRGBColorSpace;
  offWhiteMap.wrapS = THREE.RepeatWrapping;
  offWhiteMap.wrapT = THREE.RepeatWrapping;
  offWhiteMap.repeat.set(3, 3);

  return { whiteMap, normalMap, offWhiteMap };
}

function addRoundedRectPath(path: THREE.Path | THREE.Shape, w: number, h: number, r: number, cw: boolean) {
  const hw = w / 2;
  const hh = h / 2;
  const rad = Math.min(r, hw * 0.45, hh * 0.45);
  if (!cw) {
    path.moveTo(-hw + rad, -hh);
    path.lineTo(hw - rad, -hh);
    path.quadraticCurveTo(hw, -hh, hw, -hh + rad);
    path.lineTo(hw, hh - rad);
    path.quadraticCurveTo(hw, hh, hw - rad, hh);
    path.lineTo(-hw + rad, hh);
    path.quadraticCurveTo(-hw, hh, -hw, hh - rad);
    path.lineTo(-hw, -hh + rad);
    path.quadraticCurveTo(-hw, -hh, -hw + rad, -hh);
  } else {
    path.moveTo(-hw + rad, -hh);
    path.quadraticCurveTo(-hw, -hh, -hw, -hh + rad);
    path.lineTo(-hw, hh - rad);
    path.quadraticCurveTo(-hw, hh, -hw + rad, hh);
    path.lineTo(hw - rad, hh);
    path.quadraticCurveTo(hw, hh, hw, hh - rad);
    path.lineTo(hw, -hh + rad);
    path.quadraticCurveTo(hw, -hh, hw - rad, -hh);
    path.lineTo(-hw + rad, -hh);
  }
}

/**
 * Builds a hollow rounded-corner architectural portal frame or recessed metallic collar.
 */
function buildHollowRoundedFrameGeometry(
  outerW: number,
  outerH: number,
  innerW: number,
  innerH: number,
  depth: number,
  outerR: number,
  innerR: number,
  bevel = 0.004
): THREE.BufferGeometry {
  const outer = new THREE.Shape();
  addRoundedRectPath(outer, outerW - bevel * 2, outerH - bevel * 2, outerR, false);
  const inner = new THREE.Path();
  addRoundedRectPath(inner, innerW + bevel * 2, innerH + bevel * 2, innerR, true);
  outer.holes.push(inner);

  const innerDepth = Math.max(0.002, depth - bevel * 2);
  const geo = new THREE.ExtrudeGeometry(outer, {
    steps: 1,
    depth: innerDepth,
    bevelEnabled: bevel > 0,
    bevelThickness: bevel,
    bevelSize: bevel,
    bevelSegments: 3,
    curveSegments: 16,
  });
  geo.translate(0, 0, -innerDepth / 2);
  geo.computeVertexNormals();
  return geo;
}

/**
 * Builds a modern architectural knife-edge cantilevered horizontal shelf:
 * 100% flat top surface for secure object placement + sleek swept chamfered underside front lip.
 */
function buildKnifeEdgeShelfGeometry(width: number, thickness: number, zBack: number, zFront: number): THREE.BufferGeometry {
  const halfH = thickness / 2;
  const s = new THREE.Shape();
  s.moveTo(zBack, -halfH);
  s.lineTo(zFront - 0.044, -halfH);
  s.lineTo(zFront, -0.003);
  s.lineTo(zFront, halfH - 0.003);
  s.lineTo(zFront - 0.003, halfH);
  s.lineTo(zBack, halfH);
  s.closePath();

  const geo = new THREE.ExtrudeGeometry(s, {
    steps: 1,
    depth: width,
    bevelEnabled: false,
  });
  geo.translate(0, 0, -width / 2);
  geo.rotateY(-Math.PI / 2);
  geo.computeVertexNormals();
  return geo;
}

/**
 * Builds a sleek recessed architectural vertical divider with subtly chamfered leading face.
 */
function buildChamferedDividerGeometry(thickness: number, height: number, zBack: number, zFront: number): THREE.BufferGeometry {
  const halfT = thickness / 2;
  const s = new THREE.Shape();
  s.moveTo(zBack, -halfT);
  s.lineTo(zFront - 0.006, -halfT);
  s.lineTo(zFront, -halfT + 0.004);
  s.lineTo(zFront, halfT - 0.004);
  s.lineTo(zFront - 0.006, halfT);
  s.lineTo(zBack, halfT);
  s.closePath();

  const geo = new THREE.ExtrudeGeometry(s, {
    steps: 1,
    depth: height,
    bevelEnabled: false,
  });
  geo.translate(0, 0, -height / 2);
  geo.rotateY(-Math.PI / 2);
  geo.rotateZ(-Math.PI / 2);
  geo.computeVertexNormals();
  return geo;
}

/**
 * Builds a single-draw-call architectural fluted off-white back panel (soft 32mm vertical reed ridges).
 */
function buildFlutedOffWhiteBackGeometry(width: number, height: number, depth: number): THREE.BufferGeometry {
  const geo = new THREE.BoxGeometry(width, height, depth, 320, 1, 1);
  const pos = geo.attributes.position;
  const period = 0.032; // 32mm architectural reed rhythm
  for (let i = 0; i < pos.count; i++) {
    const z = pos.getZ(i);
    if (z > 0) {
      const x = pos.getX(i);
      const wave = 0.5 + 0.5 * Math.cos((x / period) * Math.PI * 2);
      const reed = Math.pow(wave, 0.72) * 0.0036;
      pos.setZ(i, z + reed);
    }
  }
  pos.needsUpdate = true;
  geo.computeVertexNormals();
  return geo;
}

type SharedWhiteBookshelfAssets = {
  whiteLacquerMat: THREE.MeshPhysicalMaterial;
  offWhiteFlutedMat: THREE.MeshStandardMaterial;
  rearOffWhiteMat: THREE.MeshStandardMaterial;
  champagneTrimMat: THREE.MeshStandardMaterial;
  ledDiffuserMat: THREE.MeshStandardMaterial;
  mountMetalMat: THREE.MeshStandardMaterial;
  portalGeo: THREE.BufferGeometry;
  trimCollarGeo: THREE.BufferGeometry;
  flutedBackGeo: THREE.BufferGeometry;
  shelves: Array<{ key: string; geo: THREE.BufferGeometry; pos: [number, number, number] }>;
  dividers: Array<{ key: string; geo: THREE.BufferGeometry; pos: [number, number, number] }>;
  brassInlays: Array<{ key: string; pos: [number, number, number]; w: number }>;
  ledStrips: Array<{ pos: [number, number, number]; args: [number, number, number]; key: string }>;
  ledLights: Array<{ pos: [number, number, number]; intensity: number; distance: number; key: string }>;
};

let cachedWhiteBookshelfAssets: SharedWhiteBookshelfAssets | null = null;

function getSharedWhiteBookshelfAssets(): SharedWhiteBookshelfAssets {
  if (cachedWhiteBookshelfAssets) return cachedWhiteBookshelfAssets;

  const { whiteMap, normalMap, offWhiteMap } = createModernShelfTextures();

  const whiteMat = new THREE.MeshPhysicalMaterial({
    map: whiteMap,
    normalMap,
    normalScale: new THREE.Vector2(0.26, 0.26),
    color: new THREE.Color('#faf9f5'),
    roughness: 0.30,
    metalness: 0.02,
    clearcoat: 0.34,
    clearcoatRoughness: 0.28,
  });

  const offWhiteMat = new THREE.MeshStandardMaterial({
    map: offWhiteMap,
    normalMap,
    normalScale: new THREE.Vector2(0.14, 0.14),
    color: new THREE.Color('#edeae2'),
    roughness: 0.62,
    metalness: 0.02,
  });

  const rearMat = new THREE.MeshStandardMaterial({
    map: offWhiteMap,
    color: new THREE.Color('#f1efe8'),
    roughness: 0.52,
    metalness: 0.01,
  });

  const champagneMat = new THREE.MeshStandardMaterial({
    color: new THREE.Color('#d2c2a3'),
    roughness: 0.28,
    metalness: 0.82,
  });

  const ledMat = new THREE.MeshStandardMaterial({
    color: new THREE.Color('#fff9ed'),
    emissive: new THREE.Color('#ffe09e'),
    emissiveIntensity: 2.2,
    roughness: 0.18,
  });

  const mountMat = new THREE.MeshStandardMaterial({
    color: new THREE.Color('#d5d1c8'),
    roughness: 0.36,
    metalness: 0.45,
  });

  // Outer Rounded Architectural Portal Frame (1.70m x 1.44m x 0.32m) with Champagne Bezel Trim
  const pGeo = buildHollowRoundedFrameGeometry(1.700, 1.440, 1.616, 1.356, 0.320, 0.044, 0.016, 0.004);
  const tGeo = buildHollowRoundedFrameGeometry(1.636, 1.376, 1.614, 1.354, 0.007, 0.020, 0.016, 0.001);
  const fBackGeo = buildFlutedOffWhiteBackGeometry(1.622, 1.362, 0.018);

  // Tiered architectural depths: Portal (+0.160) -> Knife-edge Shelves (+0.150) -> Recessed Dividers (+0.138)
  const shelfList = [
    { key: 'shelf-3', geo: buildKnifeEdgeShelfGeometry(1.620, 0.028, -0.128, 0.150), pos: [0.0, 0.360, 0.0] as [number, number, number] },
    { key: 'shelf-2', geo: buildKnifeEdgeShelfGeometry(1.196, 0.028, -0.128, 0.150), pos: [0.214, 0.025, 0.0] as [number, number, number] },
    { key: 'shelf-1', geo: buildKnifeEdgeShelfGeometry(1.216, 0.028, -0.128, 0.150), pos: [-0.204, -0.320, 0.0] as [number, number, number] },
  ];

  const divList = [
    { key: 'div-row4', geo: buildChamferedDividerGeometry(0.024, 0.320, -0.128, 0.138), pos: [0.08, 0.522, 0.0] as [number, number, number] },
    { key: 'div-tall-left', geo: buildChamferedDividerGeometry(0.024, 0.676, -0.128, 0.138), pos: [-0.38, 0.020, 0.0] as [number, number, number] },
    { key: 'div-tall-right', geo: buildChamferedDividerGeometry(0.024, 0.706, -0.128, 0.138), pos: [0.40, -0.329, 0.0] as [number, number, number] },
    { key: 'div-row3', geo: buildChamferedDividerGeometry(0.024, 0.330, -0.128, 0.138), pos: [0.26, 0.193, 0.0] as [number, number, number] },
    { key: 'div-row1', geo: buildChamferedDividerGeometry(0.024, 0.358, -0.128, 0.138), pos: [-0.22, -0.501, 0.0] as [number, number, number] },
  ];

  const inlays = [
    { key: 'inlay-3', pos: [0.0, 0.364, 0.150] as [number, number, number], w: 1.612 },
    { key: 'inlay-2', pos: [0.214, 0.029, 0.150] as [number, number, number], w: 1.186 },
    { key: 'inlay-1', pos: [-0.204, -0.316, 0.150] as [number, number, number], w: 1.206 },
  ];

  const strips: Array<{ pos: [number, number, number]; args: [number, number, number]; key: string }> = [
    { key: 'led-4a', pos: [-0.36, 0.676, 0.025], args: [0.80, 0.005, 0.014] },
    { key: 'led-4b', pos: [0.44, 0.676, 0.025], args: [0.64, 0.005, 0.014] },
    { key: 'led-tall-l', pos: [-0.59, 0.344, 0.025], args: [0.36, 0.005, 0.014] },
    { key: 'led-3a', pos: [-0.06, 0.344, 0.025], args: [0.56, 0.005, 0.014] },
    { key: 'led-3b', pos: [0.53, 0.344, 0.025], args: [0.47, 0.005, 0.014] },
    { key: 'led-2-wide', pos: [0.01, 0.009, 0.025], args: [0.70, 0.005, 0.014] },
    { key: 'led-tall-r', pos: [0.60, 0.009, 0.025], args: [0.34, 0.005, 0.014] },
    { key: 'led-1a', pos: [-0.51, -0.336, 0.025], args: [0.52, 0.005, 0.014] },
    { key: 'led-1b', pos: [0.09, -0.336, 0.025], args: [0.54, 0.005, 0.014] },
    { key: 'led-v-left', pos: [-0.804, 0.020, -0.095], args: [0.006, 0.58, 0.010] },
    { key: 'led-v-right', pos: [0.804, -0.330, -0.095], args: [0.006, 0.60, 0.010] },
  ];

  const lights: Array<{ pos: [number, number, number]; intensity: number; distance: number; key: string }> = [
    { key: 'pt-top-l', pos: [-0.36, 0.52, 0.24], intensity: 0.52, distance: 1.9 },
    { key: 'pt-top-r', pos: [0.44, 0.52, 0.24], intensity: 0.52, distance: 1.9 },
    { key: 'pt-tall-l', pos: [-0.59, 0.06, 0.24], intensity: 0.55, distance: 1.9 },
    { key: 'pt-mid-c', pos: [0.04, 0.04, 0.26], intensity: 0.58, distance: 2.0 },
    { key: 'pt-mid-r', pos: [0.53, 0.18, 0.24], intensity: 0.45, distance: 1.8 },
    { key: 'pt-tall-r', pos: [0.60, -0.32, 0.24], intensity: 0.55, distance: 1.9 },
    { key: 'pt-bot-l', pos: [-0.51, -0.50, 0.24], intensity: 0.48, distance: 1.8 },
    { key: 'pt-bot-c', pos: [0.09, -0.50, 0.24], intensity: 0.48, distance: 1.8 },
  ];

  cachedWhiteBookshelfAssets = {
    whiteLacquerMat: whiteMat,
    offWhiteFlutedMat: offWhiteMat,
    rearOffWhiteMat: rearMat,
    champagneTrimMat: champagneMat,
    ledDiffuserMat: ledMat,
    mountMetalMat: mountMat,
    portalGeo: pGeo,
    trimCollarGeo: tGeo,
    flutedBackGeo: fBackGeo,
    shelves: shelfList,
    dividers: divList,
    brassInlays: inlays,
    ledStrips: strips,
    ledLights: lights,
  };
  return cachedWhiteBookshelfAssets;
}

export function RealisticModernWhiteBookshelf3D({
  autoRotate = false,
  showPointLights = true,
}: {
  autoRotate?: boolean;
  showPointLights?: boolean;
}) {
  const groupRef = useRef<THREE.Group>(null!);

  useFrame((_, delta) => {
    if (autoRotate && groupRef.current) {
      groupRef.current.rotation.y += delta * 0.25;
    }
  });

  const {
    whiteLacquerMat,
    offWhiteFlutedMat,
    rearOffWhiteMat,
    champagneTrimMat,
    ledDiffuserMat,
    mountMetalMat,
    portalGeo,
    trimCollarGeo,
    flutedBackGeo,
    shelves,
    dividers,
    brassInlays,
    ledStrips,
    ledLights,
  } = useMemo(() => getSharedWhiteBookshelfAssets(), []);

  return (
    <group ref={groupRef} position={[0, 0.0, 0]}>
      {/* =================================================================== */}
      {/* 1. FLUTED WARM OFF-WHITE ARCHITECTURAL BACK PANEL & REAR MOUNTS     */}
      {/* =================================================================== */}
      <mesh geometry={flutedBackGeo} position={[0, 0, -0.134]} material={offWhiteFlutedMat} receiveShadow />

      {/* Clean Off-White Rear Exterior Casing (360° finished back) */}
      <mesh position={[0, 0, -0.150]} material={rearOffWhiteMat} castShadow receiveShadow>
        <boxGeometry args={[1.618, 1.358, 0.014]} />
      </mesh>

      {/* Recessed Anodized Aluminum Wall-Mount French Cleat Rails */}
      {[0.44, -0.38].map((my, idx) => (
        <mesh key={`cleat-${idx}`} position={[0, my, -0.163]} material={mountMetalMat} castShadow>
          <boxGeometry args={[1.44, 0.044, 0.012]} />
        </mesh>
      ))}
      {[-0.68, 0.68].map((kx, idx) => (
        <mesh key={`mount-tab-${idx}`} position={[kx, 0.52, -0.162]} material={mountMetalMat}>
          <boxGeometry args={[0.040, 0.056, 0.010]} />
        </mesh>
      ))}

      {/* =================================================================== */}
      {/* 2. ROUNDED WHITE PORTAL FRAME, CHAMPAGNE INLAY & KNIFE-EDGE SHELVES */}
      {/* =================================================================== */}
      <mesh geometry={portalGeo} position={[0, 0, 0]} material={whiteLacquerMat} castShadow receiveShadow />
      <mesh geometry={trimCollarGeo} position={[0, 0, 0.157]} material={champagneTrimMat} />

      {shelves.map((s) => (
        <mesh key={s.key} geometry={s.geo} position={s.pos} material={whiteLacquerMat} castShadow receiveShadow />
      ))}

      {dividers.map((d) => (
        <mesh key={d.key} geometry={d.geo} position={d.pos} material={whiteLacquerMat} castShadow receiveShadow />
      ))}

      {brassInlays.map((b) => (
        <mesh key={b.key} position={b.pos} material={champagneTrimMat}>
          <boxGeometry args={[b.w, 0.0025, 0.0025]} />
        </mesh>
      ))}

      {/* =================================================================== */}
      {/* 3. INCREASED WARM INTEGRATED COMPARTMENT LED ILLUMINATION           */}
      {/* =================================================================== */}
      {ledStrips.map((strip) => (
        <mesh key={strip.key} position={strip.pos} material={ledDiffuserMat}>
          <boxGeometry args={strip.args} />
        </mesh>
      ))}

      {showPointLights &&
        ledLights.map((l) => (
          <pointLight key={l.key} position={l.pos} color="#ffe6ba" intensity={l.intensity} distance={l.distance} decay={1.35} />
        ))}
    </group>
  );
}
