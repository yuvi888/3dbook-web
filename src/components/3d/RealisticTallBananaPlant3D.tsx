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
 * Generates tropical Banana / Giant Bird-of-Paradise leaf PBR maps:
 * bold central yellow-green midrib + crisp parallel transverse lateral striations.
 */
function createBananaLeafPBR(tone: 'mature' | 'fresh' | 'young') {
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
      ? { base: '#1a4f20', mid: '#266828', edge: '#34782d', midrib: '#8db854', vein: '#4f8f3b' }
      : tone === 'fresh'
      ? { base: '#245f26', mid: '#347d30', edge: '#46923a', midrib: '#a0c960', vein: '#64a648' }
      : { base: '#44842f', mid: '#63a63f', edge: '#80be4e', midrib: '#c5e280', vein: '#8ec762' };

  const grad = aCtx.createLinearGradient(0, size, 0, 0);
  grad.addColorStop(0.0, pal.base);
  grad.addColorStop(0.6, pal.mid);
  grad.addColorStop(1.0, pal.edge);
  aCtx.fillStyle = grad;
  aCtx.fillRect(0, 0, size, size);

  hCtx.fillStyle = '#8e8e8e';
  hCtx.fillRect(0, 0, size, size);

  // Subtle horizontal/transverse tropical leaf corrugation + parallel veins (Banana Musa signature!)
  for (let i = 0; i < 42; i++) {
    const frac = 0.04 + (i / 42) * 0.93;
    const yStart = size * (1 - frac);
    const sweep = size * (0.04 + frac * 0.03);

    [-1, 1].forEach((side) => {
      const yS = yStart + (side > 0 ? 3 : 0);
      const xEnd = side > 0 ? size - 6 : 6;
      const yEnd = Math.max(6, yS - sweep);

      // Alternating brighter vein line & subtle recessed furrow
      aCtx.strokeStyle = pal.vein;
      aCtx.globalAlpha = i % 3 === 0 ? 0.34 : 0.16;
      aCtx.lineWidth = i % 3 === 0 ? 2.1 : 1.1;
      aCtx.beginPath();
      aCtx.moveTo(size * 0.5, yS);
      aCtx.quadraticCurveTo(size * (0.5 + side * 0.25), yS - sweep * 0.25, xEnd, yEnd);
      aCtx.stroke();

      hCtx.strokeStyle = i % 3 === 0 ? 'rgba(32,32,32,0.75)' : 'rgba(65,65,65,0.45)';
      hCtx.lineWidth = i % 3 === 0 ? 4.2 : 2.2;
      hCtx.beginPath();
      hCtx.moveTo(size * 0.5, yS);
      hCtx.quadraticCurveTo(size * (0.5 + side * 0.25), yS - sweep * 0.25, xEnd, yEnd);
      hCtx.stroke();

      // Subtle raised corrugated pillow between major transverse veins
      if (i % 3 === 0) {
        hCtx.strokeStyle = 'rgba(210,210,210,0.28)';
        hCtx.lineWidth = 6.0;
        hCtx.beginPath();
        hCtx.moveTo(size * 0.5, yS - 6);
        hCtx.quadraticCurveTo(size * (0.5 + side * 0.25), yS - 6 - sweep * 0.25, xEnd, Math.max(6, yEnd - 6));
        hCtx.stroke();
      }
    });
  }
  aCtx.globalAlpha = 1;

  // Bold pale chartreuse-olive central midrib
  const midGrad = aCtx.createLinearGradient(size * 0.47, 0, size * 0.53, 0);
  midGrad.addColorStop(0, pal.midrib + '00');
  midGrad.addColorStop(0.35, pal.midrib);
  midGrad.addColorStop(0.5, '#d5eb96');
  midGrad.addColorStop(0.65, pal.midrib);
  midGrad.addColorStop(1, pal.midrib + '00');
  aCtx.fillStyle = midGrad;
  aCtx.fillRect(size * 0.475, 10, size * 0.05, size - 10);

  // Subtle organic moisture/chlorophyll mottling
  for (let i = 0; i < 600; i++) {
    const px = seededRand(i * 4.1 + 7) * size;
    const py = seededRand(i * 6.7 + 13) * size;
    aCtx.fillStyle = i % 2 === 0 ? 'rgba(255,255,210,0.025)' : 'rgba(6,22,8,0.035)';
    aCtx.beginPath();
    aCtx.arc(px, py, 1.5 + seededRand(i * 11) * 4, 0, Math.PI * 2);
    aCtx.fill();
  }

  const hData = hCtx.getImageData(0, 0, size, size).data;
  const hFloat = new Float32Array(size * size);
  for (let i = 0; i < size * size; i++) hFloat[i] = hData[i * 4] / 255;

  const map = new THREE.CanvasTexture(aCanvas);
  map.colorSpace = THREE.SRGBColorSpace;
  map.anisotropy = 8;

  const normalMap = heightfieldToNormalTexture(hFloat, size, 2.8);
  normalMap.anisotropy = 8;

  return { map, normalMap };
}

/**
 * Generates crisp warm-white architectural ribbed ceramic/stoneware texture for the tall corridor planter.
 */
function createWhiteCeramicPlanterTexture() {
  const size = 256;
  const aCanvas = document.createElement('canvas');
  aCanvas.width = size;
  aCanvas.height = size;
  const aCtx = aCanvas.getContext('2d')!;

  const hCanvas = document.createElement('canvas');
  hCanvas.width = size;
  hCanvas.height = size;
  const hCtx = hCanvas.getContext('2d')!;

  const grad = aCtx.createLinearGradient(0, 0, 0, size);
  grad.addColorStop(0, '#f7f5f0');
  grad.addColorStop(0.7, '#efeae0');
  grad.addColorStop(1, '#e5dfd2');
  aCtx.fillStyle = grad;
  aCtx.fillRect(0, 0, size, size);

  hCtx.fillStyle = '#808080';
  hCtx.fillRect(0, 0, size, size);

  // Subtle horizontal ceramic lathe throwing bands & ultra-fine mineral glaze flecks
  for (let y = 0; y < size; y += 5) {
    aCtx.fillStyle = y % 10 === 0 ? 'rgba(255,255,255,0.22)' : 'rgba(195,188,176,0.12)';
    aCtx.fillRect(0, y, size, 2);
    hCtx.fillStyle = y % 10 === 0 ? '#969696' : '#6c6c6c';
    hCtx.fillRect(0, y, size, 2);
  }
  for (let i = 0; i < 520; i++) {
    const x = seededRand(i * 5.1 + 3) * size;
    const y = seededRand(i * 8.3 + 7) * size;
    aCtx.fillStyle = i % 2 === 0 ? 'rgba(255,255,255,0.20)' : 'rgba(170,162,150,0.09)';
    aCtx.beginPath();
    aCtx.arc(x, y, 0.45 + seededRand(i * 13) * 0.7, 0, Math.PI * 2);
    aCtx.fill();
  }

  const hData = hCtx.getImageData(0, 0, size, size).data;
  const hFloat = new Float32Array(size * size);
  for (let i = 0; i < size * size; i++) hFloat[i] = hData[i * 4] / 255;

  const map = new THREE.CanvasTexture(aCanvas);
  map.colorSpace = THREE.SRGBColorSpace;
  map.wrapS = THREE.RepeatWrapping;
  const normalMap = heightfieldToNormalTexture(hFloat, size, 1.15, true);

  return { map, normalMap };
}

/**
 * Builds a giant sculpted 3D Banana paddle leaf with deep midrib trough,
 * ruffled margins, natural droop, and optional authentic botanical wind-splits!
 */
function buildBananaLeafGeometry(
  width: number,
  length: number,
  droop: number,
  seed: number,
  splits: Array<{ vPos: number; side: 1 | -1 }> = []
): THREE.BufferGeometry {
  const uSegs = 20;
  const vSegs = 34;
  const verts: number[] = [];
  const uvs: number[] = [];
  const indices: number[] = [];

  for (let iv = 0; iv <= vSegs; iv++) {
    const v = iv / vSegs;
    // Broad oblong paddle banana leaf shape (rounded base shoulders + broad center + blunt-oval tip)
    const profile = v < 0.04 ? 0.08 + v * 6 : Math.pow(Math.sin(Math.pow(v, 0.76) * Math.PI), 0.52);

    for (let iu = 0; iu <= uSegs; iu++) {
      const u = (iu / uSegs) * 2 - 1;
      const absU = Math.abs(u);
      const x = u * (width * 0.5) * profile;

      // Subtle wind-split shear offset across split lines for authentic torn banana leaf edges
      let splitGapY = 0;
      let splitDroop = 0;
      for (const sp of splits) {
        if (Math.sign(u) === sp.side && absU > 0.22) {
          const distV = v - sp.vPos;
          if (Math.abs(distV) < 0.055) {
            splitGapY += (distV >= 0 ? 0.012 : -0.012) * Math.min(1, (absU - 0.22) * 2.5);
          }
          if (distV > 0 && distV < 0.14) {
            splitDroop -= 0.018 * Math.sin((distV / 0.14) * Math.PI) * Math.pow(absU, 1.3);
          }
        }
      }

      const y = v * length + splitGapY;
      // Deep keel trough along central midrib + outward wing camber + gentle ruffled margins
      const midribKeel = -width * 0.055 * Math.exp(-Math.pow(u / 0.13, 2)) * (1 - v * 0.45);
      const wingArch = Math.sin(v * Math.PI) * Math.pow(absU, 1.2) * (width * 0.14);
      const droopZ = -Math.pow(v, 1.65) * (length * droop);
      const ruffle = Math.sin(v * Math.PI * 5.2 + seed * 2.3) * Math.pow(absU, 1.55) * (width * 0.055);

      verts.push(x, y, midribKeel + wingArch + droopZ + ruffle + splitDroop);
      uvs.push(u * 0.5 + 0.5, v);
    }
  }

  for (let iv = 0; iv < vSegs; iv++) {
    const vMid = (iv + 0.5) / vSegs;
    for (let iu = 0; iu < uSegs; iu++) {
      const uMid = ((iu + 0.5) / uSegs) * 2 - 1;
      // Skip triangles right across a botanical wind-split!
      const isSplit = splits.some(
        (sp) =>
          Math.sign(uMid) === sp.side &&
          Math.abs(uMid) > 0.25 &&
          Math.abs(vMid - sp.vPos) < 0.020
      );
      if (isSplit) continue;

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

type SharedBananaAssets = {
  leafMats: Record<'mature' | 'fresh' | 'young', THREE.MeshPhysicalMaterial>;
  potMat: THREE.MeshPhysicalMaterial;
  potInnerMat: THREE.MeshStandardMaterial;
  soilMat: THREE.MeshStandardMaterial;
  stemMat: THREE.MeshStandardMaterial;
  outerPotGeo: THREE.BufferGeometry;
  innerPotGeo: THREE.BufferGeometry;
  soilGeo: THREE.BufferGeometry;
  pseudostemMeshes: THREE.BufferGeometry[];
  leafEntries: Array<{
    id: string;
    petioleGeo: THREE.BufferGeometry;
    leafGeo: THREE.BufferGeometry;
    pos: [number, number, number];
    q: THREE.Quaternion;
    tone: 'mature' | 'fresh' | 'young';
  }>;
};

let cachedBananaAssets: SharedBananaAssets | null = null;

function getSharedBananaAssets(potRadius: number, potHeight: number, soilY: number): SharedBananaAssets {
  if (cachedBananaAssets) return cachedBananaAssets;

  const mature = createBananaLeafPBR('mature');
  const fresh = createBananaLeafPBR('fresh');
  const young = createBananaLeafPBR('young');

  const makeLeafMat = (m: { map: THREE.CanvasTexture; normalMap: THREE.CanvasTexture }) =>
    new THREE.MeshPhysicalMaterial({
      map: m.map,
      normalMap: m.normalMap,
      normalScale: new THREE.Vector2(1.2, 1.2),
      roughness: 0.32,
      metalness: 0.01,
      clearcoat: 0.44,
      clearcoatRoughness: 0.24,
      sheen: 0.24,
      sheenColor: new THREE.Color('#95ce68'),
      side: THREE.DoubleSide,
    });

  const pMaps = createWhiteCeramicPlanterTexture();
  const pMat = new THREE.MeshPhysicalMaterial({
    map: pMaps.map,
    normalMap: pMaps.normalMap,
    normalScale: new THREE.Vector2(0.7, 0.7),
    roughness: 0.45,
    metalness: 0.01,
    clearcoat: 0.24,
    clearcoatRoughness: 0.34,
  });
  const pInMat = new THREE.MeshStandardMaterial({ color: '#e0dbd0', roughness: 0.68 });

  const sMaps = createRichSoilPBR(2.4);
  const sMat = new THREE.MeshStandardMaterial({
    map: sMaps.map,
    normalMap: sMaps.normalMap,
    normalScale: new THREE.Vector2(1.5, 1.5),
    roughness: 0.94,
  });

  const stMat = new THREE.MeshStandardMaterial({ color: '#4d7332', roughness: 0.48 });

  const wall = 0.014;
  const baseR = potRadius * 0.78;
  const outerPts = [
    new THREE.Vector2(0, 0.008),
    new THREE.Vector2(baseR - 0.01, 0.008),
    new THREE.Vector2(baseR, 0),
    new THREE.Vector2(baseR + 0.004, 0.025),
    new THREE.Vector2(potRadius - 0.006, potHeight * 0.55),
    new THREE.Vector2(potRadius, potHeight - 0.022),
    new THREE.Vector2(potRadius + 0.003, potHeight - 0.010),
    new THREE.Vector2(potRadius - wall * 0.4, potHeight + 0.006),
    new THREE.Vector2(potRadius - wall, potHeight),
  ];
  const oGeo = new THREE.LatheGeometry(outerPts, 64).rotateY(Math.PI);

  const innerPts = [
    new THREE.Vector2(potRadius - wall, potHeight),
    new THREE.Vector2(potRadius - wall - 0.004, soilY - 0.05),
  ];
  const iGeo = new THREE.LatheGeometry(innerPts, 48).rotateY(Math.PI);
  const soGeo = buildSoilMoundGeometry(potRadius - wall + 0.002, 0.022);

  const stalks = [
    { root: new THREE.Vector3(-0.022, soilY - 0.01, 0.015), top: new THREE.Vector3(-0.035, 0.92, 0.025), rB: 0.032, rT: 0.017 },
    { root: new THREE.Vector3(0.032, soilY - 0.01, -0.012), top: new THREE.Vector3(0.048, 0.78, -0.018), rB: 0.026, rT: 0.014 },
    { root: new THREE.Vector3(-0.010, soilY - 0.01, -0.030), top: new THREE.Vector3(-0.015, 0.64, -0.042), rB: 0.022, rT: 0.012 },
  ];
  const pseudoMeshes = stalks.map((s) => {
    const mid = s.root.clone().lerp(s.top, 0.5).add(new THREE.Vector3(0.008, 0, 0.008));
    return buildTaperedTube([s.root, mid, s.top], 16, s.rB, s.rT, 12, false);
  });

  const leafSpecs = [
    { stalk: 0, hFrac: 0.98, angle: 0.5, reach: 0.16, hLift: 0.28, w: 0.22, len: 0.56, droop: 0.24, dirY: 0.76, tone: 'young' as const, splits: [] },
    { stalk: 0, hFrac: 0.94, angle: 2.7, reach: 0.22, hLift: 0.22, w: 0.26, len: 0.62, droop: 0.30, dirY: 0.62, tone: 'fresh' as const, splits: [{ vPos: 0.62, side: 1 as const }] },
    { stalk: 0, hFrac: 0.88, angle: 4.9, reach: 0.25, hLift: 0.16, w: 0.28, len: 0.66, droop: 0.34, dirY: 0.50, tone: 'fresh' as const, splits: [{ vPos: 0.48, side: -1 as const }] },
    { stalk: 0, hFrac: 0.78, angle: 1.5, reach: 0.26, hLift: 0.10, w: 0.29, len: 0.68, droop: 0.38, dirY: 0.36, tone: 'mature' as const, splits: [{ vPos: 0.38, side: 1 as const }, { vPos: 0.70, side: -1 as const }] },
    { stalk: 0, hFrac: 0.68, angle: 3.8, reach: 0.24, hLift: 0.05, w: 0.27, len: 0.62, droop: 0.42, dirY: 0.24, tone: 'mature' as const, splits: [{ vPos: 0.55, side: 1 as const }] },
    { stalk: 1, hFrac: 0.96, angle: -0.4, reach: 0.18, hLift: 0.22, w: 0.23, len: 0.54, droop: 0.28, dirY: 0.68, tone: 'young' as const, splits: [] },
    { stalk: 1, hFrac: 0.88, angle: 0.9, reach: 0.22, hLift: 0.14, w: 0.26, len: 0.60, droop: 0.34, dirY: 0.48, tone: 'fresh' as const, splits: [{ vPos: 0.52, side: -1 as const }] },
    { stalk: 1, hFrac: 0.76, angle: -1.6, reach: 0.24, hLift: 0.08, w: 0.27, len: 0.62, droop: 0.38, dirY: 0.32, tone: 'mature' as const, splits: [{ vPos: 0.42, side: 1 as const }] },
    { stalk: 1, hFrac: 0.68, angle: 5.5, reach: 0.22, hLift: 0.11, w: 0.24, len: 0.55, droop: 0.32, dirY: 0.38, tone: 'mature' as const, splits: [{ vPos: 0.62, side: -1 as const }] },
    { stalk: 2, hFrac: 0.96, angle: 3.3, reach: 0.16, hLift: 0.18, w: 0.21, len: 0.48, droop: 0.28, dirY: 0.62, tone: 'fresh' as const, splits: [] },
    { stalk: 2, hFrac: 0.86, angle: 4.3, reach: 0.20, hLift: 0.10, w: 0.24, len: 0.52, droop: 0.34, dirY: 0.42, tone: 'mature' as const, splits: [{ vPos: 0.46, side: 1 as const }] },
    { stalk: 2, hFrac: 0.74, angle: 2.3, reach: 0.20, hLift: 0.06, w: 0.23, len: 0.50, droop: 0.38, dirY: 0.28, tone: 'mature' as const, splits: [{ vPos: 0.58, side: -1 as const }] },
  ];

  const lEntries = leafSpecs.map((sp, idx) => {
    const s = stalks[sp.stalk];
    const stemOrigin = s.root.clone().lerp(s.top, sp.hFrac);
    const leafBase = new THREE.Vector3(
      stemOrigin.x + Math.cos(sp.angle) * sp.reach,
      stemOrigin.y + sp.hLift,
      stemOrigin.z + Math.sin(sp.angle) * sp.reach
    );
    const dirVec = new THREE.Vector3(Math.cos(sp.angle), sp.dirY, Math.sin(sp.angle)).normalize();
    const petioleMid = stemOrigin.clone().lerp(leafBase, 0.5).add(new THREE.Vector3(0, 0.04, 0));
    const petiolePre = leafBase.clone().sub(dirVec.clone().multiplyScalar(0.05));
    const petioleGeo = buildTaperedTube([stemOrigin, petioleMid, petiolePre, leafBase], 14, 0.011, 0.0055, 8);

    const leafGeo = buildBananaLeafGeometry(sp.w, sp.len, sp.droop, 17 + idx * 11, sp.splits);
    const q = orientLeafSkyward(dirVec, ((idx % 3) - 1) * 0.16);

    return {
      id: `banana-leaf-${idx}`,
      petioleGeo,
      leafGeo,
      pos: [leafBase.x, leafBase.y, leafBase.z] as [number, number, number],
      q,
      tone: sp.tone,
    };
  });

  cachedBananaAssets = {
    leafMats: {
      mature: makeLeafMat(mature),
      fresh: makeLeafMat(fresh),
      young: makeLeafMat(young),
    },
    potMat: pMat,
    potInnerMat: pInMat,
    soilMat: sMat,
    stemMat: stMat,
    outerPotGeo: oGeo,
    innerPotGeo: iGeo,
    soilGeo: soGeo,
    pseudostemMeshes: pseudoMeshes,
    leafEntries: lEntries,
  };
  return cachedBananaAssets;
}

export function RealisticTallBananaPlant3D({ autoRotate = false }: { autoRotate?: boolean }) {
  const groupRef = useRef<THREE.Group>(null!);

  useFrame((_, delta) => {
    if (autoRotate && groupRef.current) {
      groupRef.current.rotation.y += delta * 0.30;
    }
  });

  const potRadius = 0.175; // 35 cm wide corridor floor planter
  const potHeight = 0.44;  // 44 cm tall architectural planter
  const soilY = potHeight - 0.045;

  const {
    leafMats,
    potMat,
    potInnerMat,
    soilMat,
    stemMat,
    outerPotGeo,
    innerPotGeo,
    soilGeo,
    pseudostemMeshes,
    leafEntries,
  } = useMemo(() => getSharedBananaAssets(potRadius, potHeight, soilY), [potRadius, potHeight, soilY]);

  return (
    <group ref={groupRef} position={[0, -0.76, 0]}>
      {/* 1. ARCHITECTURAL DARK BASALT CORRIDOR PLANTER & SOIL */}
      <mesh geometry={outerPotGeo} material={potMat} castShadow receiveShadow />
      <mesh geometry={innerPotGeo} material={potInnerMat} receiveShadow />
      <mesh geometry={soilGeo} material={soilMat} position={[0, soilY, 0]} receiveShadow />

      {/* Large natural river stones nestled in mulch */}
      {[
        [-0.085, soilY + 0.005, 0.065, 0.022, '#756e65'],
        [0.080, soilY + 0.005, -0.068, 0.020, '#8d8173'],
        [-0.060, soilY + 0.006, -0.088, 0.024, '#56514b'],
        [0.095, soilY + 0.004, 0.052, 0.018, '#7f776c'],
        [0.015, soilY + 0.008, 0.098, 0.019, '#68625a'],
      ].map(([x, y, z, s, col], i) => (
        <mesh
          key={i}
          position={[x as number, y as number, z as number]}
          scale={[s as number, (s as number) * 0.55, (s as number) * 0.85]}
          castShadow
        >
          <icosahedronGeometry args={[1, 2]} />
          <meshStandardMaterial color={col as string} roughness={0.70} />
        </mesh>
      ))}

      {/* 2. OVERLAPPING PSEUDOSTEM STALKS */}
      {pseudostemMeshes.map((geo, idx) => (
        <mesh key={`stalk-${idx}`} geometry={geo} material={stemMat} castShadow receiveShadow />
      ))}

      {/* 3. GIANT PADDLE BANANA LEAVES */}
      {leafEntries.map((entry) => (
        <group key={entry.id}>
          <mesh geometry={entry.petioleGeo} material={stemMat} castShadow />
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
