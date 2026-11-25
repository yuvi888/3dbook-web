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
  orientBloomOutward,
} from './botanicalPBR';

/**
 * Generates narrow lanceolate botanical leaf PBR maps (Peace Lily / Anthurium style)
 * with deep emerald lamina, sunken parallel-arcuate veins, and soft pale-lime midrib.
 */
function createLanceLeafPBR(variant: 'deep' | 'mid' | 'young') {
  const size = 384;
  const aCanvas = document.createElement('canvas');
  aCanvas.width = size;
  aCanvas.height = size;
  const aCtx = aCanvas.getContext('2d')!;

  const hCanvas = document.createElement('canvas');
  hCanvas.width = size;
  hCanvas.height = size;
  const hCtx = hCanvas.getContext('2d')!;

  const pal =
    variant === 'deep'
      ? { dark: '#113819', mid: '#1c5324', tip: '#2d6e2e', vein: '#6fa44c' }
      : variant === 'mid'
      ? { dark: '#17481f', mid: '#26682c', tip: '#3c8539', vein: '#85b85c' }
      : { dark: '#377629', mid: '#569c39', tip: '#7bb84b', vein: '#b5dc74' };

  const grad = aCtx.createLinearGradient(0, size, 0, 0);
  grad.addColorStop(0.0, pal.dark);
  grad.addColorStop(0.55, pal.mid);
  grad.addColorStop(1.0, pal.tip);
  aCtx.fillStyle = grad;
  aCtx.fillRect(0, 0, size, size);

  hCtx.fillStyle = '#909090';
  hCtx.fillRect(0, 0, size, size);

  // Fine botanical cell micro-mottling
  for (let i = 0; i < 480; i++) {
    const px = seededRand(i * 3.7 + 2) * size;
    const py = seededRand(i * 6.1 + 5) * size;
    aCtx.fillStyle = i % 2 === 0 ? 'rgba(255,255,215,0.022)' : 'rgba(6,20,8,0.03)';
    aCtx.beginPath();
    aCtx.arc(px, py, 1.5 + seededRand(i * 9.3) * 3, 0, Math.PI * 2);
    aCtx.fill();

    hCtx.fillStyle = i % 2 === 0 ? 'rgba(255,255,255,0.04)' : 'rgba(0,0,0,0.04)';
    hCtx.beginPath();
    hCtx.arc(px, py, 1.5 + seededRand(i * 2.1) * 2.5, 0, Math.PI * 2);
    hCtx.fill();
  }

  // Prominent central midrib + 9 tight steep arcuate veins (Peace Lily / Lanceolate look)
  const strokeVein = (
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
    const vGrad = aCtx.createLinearGradient(x0, y0, x1, y1);
    vGrad.addColorStop(0, pal.vein);
    vGrad.addColorStop(0.75, pal.vein);
    vGrad.addColorStop(1, pal.vein + '00');
    aCtx.strokeStyle = vGrad;
    aCtx.globalAlpha = aAlpha;
    aCtx.lineWidth = w;
    aCtx.lineCap = 'round';
    aCtx.beginPath();
    aCtx.moveTo(x0, y0);
    aCtx.bezierCurveTo(cx1, cy1, cx2, cy2, x1, y1);
    aCtx.stroke();
    aCtx.restore();

    hCtx.save();
    hCtx.strokeStyle = `rgba(22, 22, 22, ${dAlpha})`;
    hCtx.lineWidth = w * 1.5;
    hCtx.lineCap = 'round';
    hCtx.beginPath();
    hCtx.moveTo(x0, y0);
    hCtx.bezierCurveTo(cx1, cy1, cx2, cy2, x1, y1);
    hCtx.stroke();
    hCtx.restore();
  };

  for (let seg = 0; seg < 14; seg++) {
    const t0 = seg / 14;
    const t1 = (seg + 1) / 14;
    const y0 = size * (1 - t0 * 0.97);
    const y1 = size * (1 - t1 * 0.97);
    strokeVein(
      size * 0.5, y0, size * 0.5, (y0 + y1) / 2, size * 0.5, (y0 + y1) / 2, size * 0.5, y1,
      5.2 * (1 - t0 * 0.8), 0.62 - t0 * 0.25, 0.88 - t0 * 0.25
    );
  }

  for (let idx = 0; idx < 9; idx++) {
    const f = 0.08 + idx * 0.095;
    [-1, 1].forEach((side) => {
      const frac = Math.min(0.92, f + (side > 0 ? 0.02 : 0));
      const yS = size * (1 - frac);
      const reach = size * (0.44 - frac * 0.22);
      const sweep = size * (0.18 + (1 - frac) * 0.08);
      strokeVein(
        size * 0.5, yS,
        size * 0.5 + side * reach * 0.4, yS - sweep * 0.15,
        size * 0.5 + side * reach * 0.85, yS - sweep * 0.65,
        size * 0.5 + side * reach, Math.max(8, yS - sweep),
        2.2 - idx * 0.14, 0.28, 0.68
      );
    });
  }

  const hData = hCtx.getImageData(0, 0, size, size).data;
  const hFloat = new Float32Array(size * size);
  for (let i = 0; i < size * size; i++) hFloat[i] = hData[i * 4] / 255;

  const map = new THREE.CanvasTexture(aCanvas);
  map.colorSpace = THREE.SRGBColorSpace;
  map.anisotropy = 8;

  const normalMap = heightfieldToNormalTexture(hFloat, size, 3.0);
  normalMap.anisotropy = 8;

  return { map, normalMap };
}

/**
 * Generates delicate translucent flower petal PBR maps (creamy white with soft blush-amber veins).
 */
function createFlowerPetalPBR() {
  const size = 256;
  const aCanvas = document.createElement('canvas');
  aCanvas.width = size;
  aCanvas.height = size;
  const aCtx = aCanvas.getContext('2d')!;

  const hCanvas = document.createElement('canvas');
  hCanvas.width = size;
  hCanvas.height = size;
  const hCtx = hCanvas.getContext('2d')!;

  // Soft ivory-cream base warming slightly toward throat
  const grad = aCtx.createLinearGradient(0, size, 0, 0);
  grad.addColorStop(0.0, '#f3ebd8');
  grad.addColorStop(0.25, '#fbf9f2');
  grad.addColorStop(0.85, '#ffffff');
  grad.addColorStop(1.0, '#f7f4ec');
  aCtx.fillStyle = grad;
  aCtx.fillRect(0, 0, size, size);

  hCtx.fillStyle = '#888888';
  hCtx.fillRect(0, 0, size, size);

  // Delicate radial petal veins
  for (let i = -4; i <= 4; i++) {
    const xEnd = size * 0.5 + i * (size * 0.095);
    aCtx.strokeStyle = 'rgba(218, 206, 180, 0.35)';
    aCtx.lineWidth = 1.4;
    aCtx.beginPath();
    aCtx.moveTo(size * 0.5, size);
    aCtx.quadraticCurveTo(size * 0.5 + i * 10, size * 0.5, xEnd, 10);
    aCtx.stroke();

    hCtx.strokeStyle = 'rgba(48, 48, 48, 0.45)';
    hCtx.lineWidth = 2.0;
    hCtx.beginPath();
    hCtx.moveTo(size * 0.5, size);
    hCtx.quadraticCurveTo(size * 0.5 + i * 10, size * 0.5, xEnd, 10);
    hCtx.stroke();
  }

  const hData = hCtx.getImageData(0, 0, size, size).data;
  const hFloat = new Float32Array(size * size);
  for (let i = 0; i < size * size; i++) hFloat[i] = hData[i * 4] / 255;

  const map = new THREE.CanvasTexture(aCanvas);
  map.colorSpace = THREE.SRGBColorSpace;
  const normalMap = heightfieldToNormalTexture(hFloat, size, 1.5);
  return { map, normalMap };
}

/**
 * Generates warm matte fluted terracotta-sand stoneware pot texture.
 */
function createFlutedClayPotTexture() {
  const size = 256;
  const aCanvas = document.createElement('canvas');
  aCanvas.width = size;
  aCanvas.height = size;
  const aCtx = aCanvas.getContext('2d')!;

  const grad = aCtx.createLinearGradient(0, 0, 0, size);
  grad.addColorStop(0.0, '#eae0d2');
  grad.addColorStop(0.7, '#e0d2c0');
  grad.addColorStop(1.0, '#d3c2ac');
  aCtx.fillStyle = grad;
  aCtx.fillRect(0, 0, size, size);

  for (let i = 0; i < 650; i++) {
    const x = seededRand(i * 4.3 + 1) * size;
    const y = seededRand(i * 7.9 + 3) * size;
    aCtx.fillStyle = i % 2 === 0 ? 'rgba(130, 105, 82, 0.085)' : 'rgba(255, 250, 240, 0.08)';
    aCtx.beginPath();
    aCtx.arc(x, y, 0.4 + seededRand(i * 11) * 0.65, 0, Math.PI * 2);
    aCtx.fill();
  }

  const tex = new THREE.CanvasTexture(aCanvas);
  tex.colorSpace = THREE.SRGBColorSpace;
  tex.wrapS = THREE.RepeatWrapping;
  return tex;
}

/**
 * Builds a slender glossy lanceolate leaf blade (Peace Lily style — elongated oval tapering cleanly).
 */
function buildLanceLeafGeometry(width: number, length: number, droop: number, seed: number): THREE.BufferGeometry {
  const uSegs = 14;
  const vSegs = 22;
  const verts: number[] = [];
  const uvs: number[] = [];
  const indices: number[] = [];

  for (let iv = 0; iv <= vSegs; iv++) {
    const v = iv / vSegs;
    // Sleek lanceolate leaf profile: tapers at petiole base and gracefully sharp tip
    const profile = v === 0 ? 0.02 : Math.pow(Math.sin(Math.pow(v, 0.80) * Math.PI), 0.72);
    for (let iu = 0; iu <= uSegs; iu++) {
      const u = (iu / uSegs) * 2 - 1;
      const absU = Math.abs(u);
      const x = u * (width * 0.5) * profile;
      const y = v * length;

      const midribChannel = -width * 0.04 * Math.exp(-Math.pow(u / 0.16, 2)) * (1 - v * 0.6);
      const cup = Math.sin(v * Math.PI) * Math.pow(absU, 1.35) * (width * 0.19);
      const droopZ = -Math.pow(v, 1.65) * (length * droop);
      const wave = Math.sin(v * Math.PI * 3.2 + seed * 1.9) * Math.pow(absU, 1.5) * (width * 0.055);

      verts.push(x, y, midribChannel + cup + droopZ + wave);
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
 * Builds a single cupped realistic flower petal (Spathiphyllum / Lily petal).
 */
function buildFlowerPetalGeometry(width: number, length: number, cupDepth: number): THREE.BufferGeometry {
  const uSegs = 16;
  const vSegs = 22;
  const verts: number[] = [];
  const uvs: number[] = [];
  const indices: number[] = [];

  for (let iv = 0; iv <= vSegs; iv++) {
    const v = iv / vSegs;
    const profile = v === 0 ? 0.06 : Math.pow(Math.sin(Math.pow(v, 0.78) * Math.PI), 0.68);
    for (let iu = 0; iu <= uSegs; iu++) {
      const u = (iu / uSegs) * 2 - 1;
      const absU = Math.abs(u);
      const x = u * (width * 0.5) * profile;
      const y = v * length;
      const cup = Math.sin(v * Math.PI) * Math.pow(absU, 1.35) * (width * cupDepth);
      const arch = -Math.pow(v, 1.55) * (length * 0.16);
      verts.push(x, y, cup + arch);
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
 * Builds a multi-petal realistic 3D bloom with textured golden spadix / stamen core.
 */
function FlowerBlossom({
  position,
  direction,
  scale = 1.0,
  petalMat,
  stamenMat,
  isSpathe = true,
}: {
  position: [number, number, number];
  direction: [number, number, number];
  scale?: number;
  petalMat: THREE.MeshPhysicalMaterial;
  stamenMat: THREE.MeshStandardMaterial;
  isSpathe?: boolean;
}) {
  const { outerPetalGeo, innerPetalGeo, quaternion } = useMemo(() => {
    const outerG = buildFlowerPetalGeometry(0.036 * scale, 0.056 * scale, isSpathe ? 0.42 : 0.25);
    const innerG = buildFlowerPetalGeometry(0.022 * scale, 0.042 * scale, 0.28);
    const dirVec = new THREE.Vector3(...direction).normalize();
    const q = orientBloomOutward(dirVec, new THREE.Vector3(...position));
    return { outerPetalGeo: outerG, innerPetalGeo: innerG, quaternion: q };
  }, [scale, isSpathe, direction, position]);

  return (
    <group position={position} quaternion={quaternion}>
      {/* Textured golden spadix / stamen column */}
      <mesh position={[0, 0.017 * scale, 0.002 * scale]} material={stamenMat} castShadow>
        <capsuleGeometry args={[0.0036 * scale, 0.018 * scale, 6, 12]} />
      </mesh>
      {/* Tiny anther pollen bumps around spadix */}
      {[0, 1, 2, 3, 4, 5].map((k) => {
        const a = (k * Math.PI * 2) / 6;
        return (
          <mesh
            key={k}
            position={[Math.cos(a) * 0.0034 * scale, (0.012 + (k % 3) * 0.005) * scale, 0.002 * scale + Math.sin(a) * 0.0034 * scale]}
            material={stamenMat}
          >
            <sphereGeometry args={[0.0014 * scale, 6, 6]} />
          </mesh>
        );
      })}

      {isSpathe ? (
        <>
          {/* Sculpted Peace-Lily Hooded Spathe + Supporting Inner Bract */}
          <mesh geometry={outerPetalGeo} material={petalMat} position={[0, 0, -0.003 * scale]} rotation={[0.18, 0, 0]} castShadow />
          <mesh geometry={innerPetalGeo} material={petalMat} position={[0, 0, 0.002 * scale]} rotation={[0.55, 2.4, 0.15]} castShadow />
        </>
      ) : (
        /* 5-Petal Star Lily Blossom */
        [0, 1, 2, 3, 4].map((p) => (
          <mesh
            key={p}
            geometry={innerPetalGeo}
            material={petalMat}
            rotation={[0.62, (p * Math.PI * 2) / 5, 0]}
            castShadow
          />
        ))
      )}
    </group>
  );
}

export function RealisticSmallFlowerPot3D({ autoRotate }: { autoRotate: boolean }) {
  const groupRef = useRef<any>();

  useFrame((_, delta) => {
    if (autoRotate && groupRef.current) {
      groupRef.current.rotation.y += delta * 0.38;
    }
  });

  const potRadius = 0.064;
  const potHeight = 0.116;
  const soilY = potHeight - 0.014;

  const {
    leafMats,
    petalMat,
    stamenMat,
    soilMat,
    potMat,
    potInnerMat,
    outerPotGeo,
    innerPotGeo,
    soilGeo,
  } = useMemo(() => {
    const deep = createLanceLeafPBR('deep');
    const mid = createLanceLeafPBR('mid');
    const young = createLanceLeafPBR('young');

    const makeLeafMat = (maps: { map: THREE.CanvasTexture; normalMap: THREE.CanvasTexture }) =>
      new THREE.MeshPhysicalMaterial({
        map: maps.map,
        normalMap: maps.normalMap,
        normalScale: new THREE.Vector2(1.1, 1.1),
        roughness: 0.30,
        metalness: 0.01,
        clearcoat: 0.45,
        clearcoatRoughness: 0.22,
        sheen: 0.22,
        sheenColor: new THREE.Color('#95d068'),
        side: THREE.DoubleSide,
      });

    const pMaps = createFlowerPetalPBR();
    const pMat = new THREE.MeshPhysicalMaterial({
      map: pMaps.map,
      normalMap: pMaps.normalMap,
      normalScale: new THREE.Vector2(0.85, 0.85),
      roughness: 0.42,
      sheen: 0.55,
      sheenColor: new THREE.Color('#fff9ed'),
      sheenRoughness: 0.45,
      side: THREE.DoubleSide,
    });

    const sMat = new THREE.MeshStandardMaterial({
      color: new THREE.Color('#e3b84c'),
      roughness: 0.72,
    });

    const soilMaps = createRichSoilPBR(1.4);
    const soMat = new THREE.MeshStandardMaterial({
      map: soilMaps.map,
      normalMap: soilMaps.normalMap,
      normalScale: new THREE.Vector2(1.4, 1.4),
      roughness: 0.94,
    });

    const clayTex = createFlutedClayPotTexture();
    const poMat = new THREE.MeshPhysicalMaterial({
      map: clayTex,
      roughness: 0.48,
      clearcoat: 0.25,
      clearcoatRoughness: 0.35,
    });
    const poInnerMat = new THREE.MeshStandardMaterial({
      color: new THREE.Color('#d6c6b2'),
      roughness: 0.65,
    });

    // Fluted Artisan Rim Stoneware Pot (Lathe + subtle 28 vertical ribs)
    const wall = 0.005;
    const baseR = potRadius * 0.90;
    const outerPts = [
      new THREE.Vector2(0.0, 0.003),
      new THREE.Vector2(baseR - 0.007, 0.003),
      new THREE.Vector2(baseR, 0.002),
      new THREE.Vector2(baseR + 0.001, 0.008),
      new THREE.Vector2(potRadius, potHeight - 0.006),
      new THREE.Vector2(potRadius + 0.001, potHeight),
      new THREE.Vector2(potRadius - wall * 0.5, potHeight + 0.003),
      new THREE.Vector2(potRadius - wall, potHeight + 0.001),
    ];
    const oGeo = new THREE.LatheGeometry(outerPts, 72).rotateY(Math.PI);

    const innerPts = [
      new THREE.Vector2(potRadius - wall, potHeight + 0.001),
      new THREE.Vector2(potRadius - wall - 0.001, soilY - 0.02),
    ];
    const iGeo = new THREE.LatheGeometry(innerPts, 64).rotateY(Math.PI);
    const sGeo = buildSoilMoundGeometry(potRadius - wall + 0.0005, 0.007);

    return {
      leafMats: { deep: makeLeafMat(deep), mid: makeLeafMat(mid), young: makeLeafMat(young) },
      petalMat: pMat,
      stamenMat: sMat,
      soilMat: soMat,
      potMat: poMat,
      potInnerMat: poInnerMat,
      outerPotGeo: oGeo,
      innerPotGeo: iGeo,
      soilGeo: sGeo,
    };
  }, [potRadius, potHeight, soilY]);

  // 28 Glossy Lanceolate Leaves emerging from 3 soil root tufts
  const leaves = useMemo(() => {
    const items: Array<{
      id: string;
      root: [number, number, number];
      base: [number, number, number];
      dir: [number, number, number];
      w: number;
      len: number;
      droop: number;
      roll: number;
      seed: number;
      matKey: 'deep' | 'mid' | 'young';
    }> = [];

    const roots: Array<[number, number, number]> = [
      [-0.011, soilY - 0.003, 0.008],
      [0.012, soilY - 0.003, -0.006],
      [-0.003, soilY - 0.003, -0.012],
    ];

    // Inner upright rosette (8 narrow upright leaves)
    for (let i = 0; i < 8; i++) {
      const a = (i * Math.PI * 2) / 8 + 0.2;
      const rB = 0.014 + (i % 2) * 0.006;
      const yB = soilY + 0.026 + (i % 3) * 0.005;
      items.push({
        id: `in-${i}`,
        root: roots[i % 3],
        base: [rB * Math.cos(a), yB, rB * Math.sin(a)],
        dir: [0.42 * Math.cos(a), 0.88, 0.42 * Math.sin(a)],
        w: 0.036,
        len: 0.095 + (i % 3) * 0.01,
        droop: 0.22,
        roll: ((i % 3) - 1) * 0.2,
        seed: 10 + i * 5,
        matKey: i % 2 === 0 ? 'young' : 'mid',
      });
    }

    // Mid arching rosette (10 glossy spreading leaves)
    for (let i = 0; i < 10; i++) {
      const a = (i * Math.PI * 2) / 10 + 0.5;
      const rB = 0.028 + (i % 3) * 0.006;
      const yB = soilY + 0.020 + (i % 2) * 0.004;
      items.push({
        id: `mid-${i}`,
        root: roots[i % 3],
        base: [rB * Math.cos(a), yB, rB * Math.sin(a)],
        dir: [0.72 * Math.cos(a), 0.65, 0.72 * Math.sin(a)],
        w: 0.044,
        len: 0.115 + (i % 2) * 0.012,
        droop: 0.30,
        roll: ((i % 4) - 1.5) * 0.16,
        seed: 50 + i * 7,
        matKey: i % 2 === 0 ? 'mid' : 'deep',
      });
    }

    // Outer broad rim-draping leaves (10 deep emerald leaves clearing pot rim gracefully)
    for (let i = 0; i < 10; i++) {
      const a = (i * Math.PI * 2) / 10 + 0.15;
      const rB = 0.042 + (i % 2) * 0.005;
      const yB = soilY + 0.024;
      items.push({
        id: `out-${i}`,
        root: roots[i % 3],
        base: [rB * Math.cos(a), yB, rB * Math.sin(a)],
        dir: [0.84 * Math.cos(a), 0.34 - (i % 2) * 0.06, 0.84 * Math.sin(a)],
        w: 0.048,
        len: 0.122 + (i % 3) * 0.008,
        droop: 0.34,
        roll: ((i % 3) - 1) * 0.16,
        seed: 110 + i * 9,
        matKey: 'deep',
      });
    }

    return items;
  }, [soilY]);

  // 6 Realistic Flowering Stalks rising gracefully above the dark foliage (5 blooms + 1 green bud)
  const flowers = useMemo(
    () => [
      { pos: [-0.024, soilY + 0.128, 0.022] as [number, number, number], root: [-0.008, soilY - 0.002, 0.008] as [number, number, number], dir: [-0.22, 0.94, 0.24] as [number, number, number], scale: 1.05, isSpathe: true },
      { pos: [0.032, soilY + 0.115, 0.016] as [number, number, number], root: [0.010, soilY - 0.002, 0.004] as [number, number, number], dir: [0.30, 0.92, 0.20] as [number, number, number], scale: 0.96, isSpathe: false },
      { pos: [-0.008, soilY + 0.145, -0.024] as [number, number, number], root: [-0.003, soilY - 0.002, -0.009] as [number, number, number], dir: [-0.08, 0.97, -0.22] as [number, number, number], scale: 1.0, isSpathe: true },
      { pos: [0.022, soilY + 0.095, -0.034] as [number, number, number], root: [0.008, soilY - 0.002, -0.010] as [number, number, number], dir: [0.24, 0.88, -0.38] as [number, number, number], scale: 0.88, isSpathe: false },
      { pos: [-0.044, soilY + 0.092, -0.010] as [number, number, number], root: [-0.012, soilY - 0.002, -0.004] as [number, number, number], dir: [-0.42, 0.88, -0.10] as [number, number, number], scale: 0.92, isSpathe: true },
    ],
    [soilY]
  );

  // Precompute leaf geometries + petiole stem geometries cleanly
  const leafMeshes = useMemo(() => {
    return leaves.map((l) => {
      const geo = buildLanceLeafGeometry(l.w, l.len, l.droop, l.seed);
      const dirVec = new THREE.Vector3(...l.dir).normalize();
      const q = orientLeafSkyward(dirVec, l.roll);

      const p0 = new THREE.Vector3(...l.root);
      const p3 = new THREE.Vector3(...l.base);
      const p1 = new THREE.Vector3(p0.x * 0.65 + p3.x * 0.35, Math.max(p0.y, p3.y) + 0.004, p0.z * 0.65 + p3.z * 0.35);
      const p2 = p3.clone().sub(dirVec.clone().multiplyScalar(0.01));
      const stemGeo = buildTaperedTube([p0, p1, p2, p3], 10, 0.0018, 0.0009, 6);

      return { id: l.id, geo, stemGeo, pos: l.base, q, mat: leafMats[l.matKey] };
    });
  }, [leaves, leafMats]);

  const flowerStems = useMemo(() => {
    return flowers.map((f, idx) => {
      const p0 = new THREE.Vector3(...f.root);
      const p2 = new THREE.Vector3(...f.pos);
      const p1 = new THREE.Vector3((p0.x + p2.x) * 0.45, (p0.y + p2.y) * 0.55, (p0.z + p2.z) * 0.45);
      return { id: `fst-${idx}`, geo: buildTaperedTube([p0, p1, p2], 14, 0.0020, 0.0012, 6, false) };
    });
  }, [flowers]);

  return (
    <group ref={groupRef} position={[0, -0.02, 0]}>
      {/* 1. ARTISAN WARM STONEWARE POT & SOIL */}
      <mesh geometry={outerPotGeo} material={potMat} castShadow receiveShadow />
      <mesh geometry={innerPotGeo} material={potInnerMat} receiveShadow />
      <mesh geometry={soilGeo} material={soilMat} position={[0, soilY, 0]} receiveShadow />

      {/* Natural river pebbles on soil */}
      {[
        [-0.030, soilY + 0.001, 0.024, 0.007, '#7c7368'],
        [0.026, soilY + 0.001, -0.024, 0.0065, '#928678'],
        [-0.018, soilY + 0.002, -0.030, 0.0075, '#5b544c'],
        [0.032, soilY + 0.001, 0.014, 0.006, '#877d70'],
      ].map(([x, y, z, s, col], i) => (
        <mesh key={i} position={[x as number, y as number, z as number]} scale={[s as number, (s as number) * 0.55, (s as number) * 0.85]} castShadow>
          <icosahedronGeometry args={[1, 2]} />
          <meshStandardMaterial color={col as string} roughness={0.68} />
        </mesh>
      ))}

      {/* 2. LANCEOLATE FOLIAGE ROSETTE */}
      {leafMeshes.map((lm) => (
        <group key={lm.id}>
          <mesh geometry={lm.stemGeo} castShadow>
            <meshStandardMaterial color="#3c6b2d" roughness={0.44} />
          </mesh>
          <mesh geometry={lm.geo} material={lm.mat} position={lm.pos} quaternion={lm.q} castShadow receiveShadow />
        </group>
      ))}

      {/* 3. SCULPTED FLOWER STEMS & BLOOMS */}
      {flowerStems.map((fs) => (
        <mesh key={fs.id} geometry={fs.geo} castShadow>
          <meshStandardMaterial color="#4b7b35" roughness={0.40} />
        </mesh>
      ))}
      {flowers.map((f, idx) => (
        <FlowerBlossom
          key={`bloom-${idx}`}
          position={f.pos}
          direction={f.dir}
          scale={f.scale}
          petalMat={petalMat}
          stamenMat={stamenMat}
          isSpathe={f.isSpathe}
        />
      ))}
    </group>
  );
}
