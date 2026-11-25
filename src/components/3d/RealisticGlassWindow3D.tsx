'use client';

import { useRef, useMemo } from 'react';
import { useFrame, useLoader } from '@react-three/fiber';
import * as THREE from 'three';

function seededRand(seed: number): number {
  const x = Math.sin(seed * 127.1 + 311.7) * 43758.5453123;
  return x - Math.floor(x);
}

/**
 * Generates crisp warm alabaster-white painted architectural timber PBR maps
 * (subtle brushed woodgrain + satin lacquer micro-roughness) for window millwork.
 */
function createWhiteTimberPBR() {
  const size = 256;
  const aCanvas = document.createElement('canvas');
  aCanvas.width = size;
  aCanvas.height = size;
  const aCtx = aCanvas.getContext('2d')!;

  const hCanvas = document.createElement('canvas');
  hCanvas.width = size;
  hCanvas.height = size;
  const hCtx = hCanvas.getContext('2d')!;

  aCtx.fillStyle = '#f2eee6';
  aCtx.fillRect(0, 0, size, size);
  hCtx.fillStyle = '#808080';
  hCtx.fillRect(0, 0, size, size);

  for (let i = 0; i < 240; i++) {
    const x = seededRand(i * 3.7 + 1) * size;
    aCtx.fillStyle = i % 2 === 0 ? 'rgba(255,255,255,0.18)' : 'rgba(180,170,154,0.08)';
    aCtx.fillRect(x, 0, 1.2 + seededRand(i * 5.3) * 1.5, size);

    hCtx.fillStyle = i % 2 === 0 ? '#8c8c8c' : '#747474';
    hCtx.fillRect(x, 0, 1.5, size);
  }

  const hData = hCtx.getImageData(0, 0, size, size).data;
  const img = hCtx.createImageData(size, size);
  for (let y = 0; y < size; y++) {
    const ym = (y - 1 + size) % size;
    const yp = (y + 1) % size;
    for (let x = 0; x < size; x++) {
      const xm = (x - 1 + size) % size;
      const xp = (x + 1) % size;
      const dX = ((hData[(y * size + xp) * 4] - hData[(y * size + xm) * 4]) / 255) * 1.2;
      const dY = ((hData[(yp * size + x) * 4] - hData[(ym * size + x) * 4]) / 255) * 1.2;
      const nx = -dX;
      const ny = dY;
      const nz = 1.0;
      const len = Math.sqrt(nx * nx + ny * ny + nz * nz);
      const idx = (y * size + x) * 4;
      img.data[idx] = Math.round(((nx / len) * 0.5 + 0.5) * 255);
      img.data[idx + 1] = Math.round(((ny / len) * 0.5 + 0.5) * 255);
      img.data[idx + 2] = Math.round(((nz / len) * 0.5 + 0.5) * 255);
      img.data[idx + 3] = 255;
    }
  }
  hCtx.putImageData(img, 0, 0);

  const map = new THREE.CanvasTexture(aCanvas);
  map.colorSpace = THREE.SRGBColorSpace;
  map.wrapS = THREE.RepeatWrapping;
  map.wrapT = THREE.RepeatWrapping;

  const normalMap = new THREE.CanvasTexture(hCtx.canvas);
  normalMap.wrapS = THREE.RepeatWrapping;
  normalMap.wrapT = THREE.RepeatWrapping;

  return { map, normalMap };
}

/**
 * Generates subtle diagonal Fresnel sky reflection sheen across architectural glass panes
 * so double-glazed clear panes look unmistakably glass-like while staying crystal transparent.
 */
function createGlassReflectionAlphaMap() {
  const size = 256;
  const c = document.createElement('canvas');
  c.width = size;
  c.height = size;
  const ctx = c.getContext('2d')!;

  ctx.fillStyle = '#242424';
  ctx.fillRect(0, 0, size, size);

  const glint1 = ctx.createLinearGradient(0, 0, size, size);
  glint1.addColorStop(0.0, 'rgba(255,255,255,0.08)');
  glint1.addColorStop(0.24, 'rgba(255,255,255,0.44)');
  glint1.addColorStop(0.32, 'rgba(255,255,255,0.10)');
  glint1.addColorStop(0.64, 'rgba(255,255,255,0.34)');
  glint1.addColorStop(0.73, 'rgba(255,255,255,0.06)');
  glint1.addColorStop(1.0, 'rgba(255,255,255,0.10)');
  ctx.fillStyle = glint1;
  ctx.fillRect(0, 0, size, size);

  const tex = new THREE.CanvasTexture(c);
  tex.colorSpace = THREE.NoColorSpace;
  return tex;
}

/**
 * Builds a gentle concave curved vista plane for the real outdoor sky-and-grass photograph
 * placed outside the glass window so slight interior viewing angles preserve natural parallax.
 */
function buildCurvedVistaGeometry(width: number, height: number, curveDepth = 0.08): THREE.BufferGeometry {
  const geo = new THREE.PlaneGeometry(width, height, 24, 1);
  const pos = geo.attributes.position;
  for (let i = 0; i < pos.count; i++) {
    const x = pos.getX(i);
    const normX = x / (width * 0.5);
    const zOffset = curveDepth * normX * normX;
    pos.setZ(i, zOffset);
  }
  geo.computeVertexNormals();
  return geo;
}

export function RealisticGlassWindow3D({
  autoRotate,
  variant = 'left',
}: {
  autoRotate: boolean;
  variant?: 'left' | 'right';
}) {
  const groupRef = useRef<any>();

  useFrame((_, delta) => {
    if (autoRotate && groupRef.current) {
      groupRef.current.rotation.y += delta * 0.25;
    }
  });

  // Real generated photorealistic outdoor view placed outside the glass window (Left = Sky & Grass, Right = Sea & Clouds)
  const sceneryPath = variant === 'right' ? '/textures/outdoor_sea_clouds.jpg' : '/textures/outdoor_sky_grass.jpg';
  const outdoorVistaTex = useLoader(THREE.TextureLoader, sceneryPath);
  outdoorVistaTex.colorSpace = THREE.SRGBColorSpace;
  outdoorVistaTex.anisotropy = 8;

  const winW = 1.24;
  const winH = 1.62;
  const frameD = 0.14; // Deep architectural wall jamb reveal

  const {
    timberMat,
    gasketMat,
    spacerMat,
    brassMat,
    sillStoneMat,
    glassMat,
    vistaMat,
    vistaBackMat,
    vistaGeo,
    vistaBackGeo,
  } = useMemo(() => {
    const tMaps = createWhiteTimberPBR();
    const tMat = new THREE.MeshStandardMaterial({
      map: tMaps.map,
      normalMap: tMaps.normalMap,
      normalScale: new THREE.Vector2(0.45, 0.45),
      roughness: 0.42,
      metalness: 0.02,
    });

    const gMat = new THREE.MeshStandardMaterial({ color: '#222428', roughness: 0.72, metalness: 0.15 });
    const spMat = new THREE.MeshStandardMaterial({ color: '#6b7078', roughness: 0.35, metalness: 0.8 });
    const bMat = new THREE.MeshStandardMaterial({ color: '#c89f4e', roughness: 0.24, metalness: 0.88 });
    const sMat = new THREE.MeshStandardMaterial({ color: '#e6dfd3', roughness: 0.56, metalness: 0.02 });

    const reflectionMap = createGlassReflectionAlphaMap();
    const glMat = new THREE.MeshPhysicalMaterial({
      color: new THREE.Color('#eef8fc'),
      transparent: true,
      opacity: 0.24,
      alphaMap: reflectionMap,
      roughness: 0.03,
      metalness: 0.10,
      reflectivity: 0.98,
      clearcoat: 1.0,
      clearcoatRoughness: 0.02,
      ior: 1.52,
      side: THREE.DoubleSide,
      depthWrite: false,
    });

    // Sized inside the window opening reveal box so the sky/grass vista never overflows outside the frame
    const vGeo = buildCurvedVistaGeometry(1.16, 1.54, 0.035);
    const vBackGeo = new THREE.PlaneGeometry(1.22, 1.60);

    const vMat = new THREE.MeshBasicMaterial({
      map: outdoorVistaTex,
      toneMapped: false,
    });

    const vbMat = new THREE.MeshStandardMaterial({
      color: '#d8d2c6',
      roughness: 0.78,
      side: THREE.DoubleSide,
    });

    return {
      timberMat: tMat,
      gasketMat: gMat,
      spacerMat: spMat,
      brassMat: bMat,
      sillStoneMat: sMat,
      glassMat: glMat,
      vistaMat: vMat,
      vistaBackMat: vbMat,
      vistaGeo: vGeo,
      vistaBackGeo: vBackGeo,
    };
  }, [outdoorVistaTex]);

  const innerW = winW - 0.11;
  const innerH = winH - 0.11;
  const transomY = 0.40;
  const sashW = innerW / 2 - 0.012;
  const lowerH = transomY - (-innerH / 2) - 0.02;
  const upperH = innerH / 2 - transomY - 0.02;
  const lowerCenterY = (-innerH / 2 + transomY) / 2;
  const upperCenterY = (innerH / 2 + transomY) / 2;

  return (
    <group ref={groupRef} position={[0, -0.02, 0]}>
      {/* ===================================================================== */}
      {/* 1. REAL OUTDOOR SKY & GRASS SCENERY CONTAINED OUTSIDE THE WINDOW (-Z) */}
      {/* ===================================================================== */}
      <group position={[0, 0, -0.24]}>
        {/* Real generated landscape photo of blue sky, horizon trees & green grass recessed outside glazing */}
        <mesh geometry={vistaGeo} material={vistaMat} />
        {/* Warm stone/stucco rear enclosure shell + side reveal walls connecting flush to exterior window frame */}
        <mesh geometry={vistaBackGeo} material={vistaBackMat} position={[0, 0, -0.012]} />
        <mesh position={[-0.59, 0, 0.09]} material={vistaBackMat}>
          <boxGeometry args={[0.04, 1.60, 0.22]} />
        </mesh>
        <mesh position={[0.59, 0, 0.09]} material={vistaBackMat}>
          <boxGeometry args={[0.04, 1.60, 0.22]} />
        </mesh>
        <mesh position={[0, 0.78, 0.09]} material={vistaBackMat}>
          <boxGeometry args={[1.22, 0.04, 0.22]} />
        </mesh>
        <mesh position={[0, -0.78, 0.09]} material={vistaBackMat}>
          <boxGeometry args={[1.22, 0.04, 0.22]} />
        </mesh>
      </group>

      {/* ===================================================================== */}
      {/* 2. ARCHITECTURAL TIMBER WINDOW CASING, JAMBS, CROWN & WINDOW SILL     */}
      {/* ===================================================================== */}
      {/* Deep Left & Right Structural Wall Jambs */}
      <mesh position={[-winW / 2 + 0.028, 0, 0]} material={timberMat} castShadow receiveShadow>
        <boxGeometry args={[0.056, winH, frameD]} />
      </mesh>
      <mesh position={[winW / 2 - 0.028, 0, 0]} material={timberMat} castShadow receiveShadow>
        <boxGeometry args={[0.056, winH, frameD]} />
      </mesh>
      {/* Top Head Jamb */}
      <mesh position={[0, winH / 2 - 0.028, 0]} material={timberMat} castShadow receiveShadow>
        <boxGeometry args={[winW, 0.056, frameD]} />
      </mesh>
      {/* Stepped Interior Casing / Architrave (+Z) */}
      <mesh position={[-winW / 2 - 0.02, 0, frameD / 2 + 0.008]} material={timberMat} castShadow receiveShadow>
        <boxGeometry args={[0.075, winH + 0.04, 0.022]} />
      </mesh>
      <mesh position={[winW / 2 + 0.02, 0, frameD / 2 + 0.008]} material={timberMat} castShadow receiveShadow>
        <boxGeometry args={[0.075, winH + 0.04, 0.022]} />
      </mesh>
      {/* Crown Cornice Header */}
      <mesh position={[0, winH / 2 + 0.032, frameD / 2 + 0.012]} material={timberMat} castShadow receiveShadow>
        <boxGeometry args={[winW + 0.14, 0.068, 0.036]} />
      </mesh>
      <mesh position={[0, winH / 2 + 0.074, frameD / 2 + 0.022]} material={timberMat} castShadow receiveShadow>
        <boxGeometry args={[winW + 0.19, 0.026, 0.054]} />
      </mesh>

      {/* Exterior Brickmold Trim (-Z) */}
      <mesh position={[-winW / 2 - 0.01, 0, -frameD / 2 - 0.008]} material={timberMat} castShadow>
        <boxGeometry args={[0.06, winH + 0.03, 0.02]} />
      </mesh>
      <mesh position={[winW / 2 + 0.01, 0, -frameD / 2 - 0.008]} material={timberMat} castShadow>
        <boxGeometry args={[0.06, winH + 0.03, 0.02]} />
      </mesh>
      <mesh position={[0, winH / 2 + 0.018, -frameD / 2 - 0.008]} material={timberMat} castShadow>
        <boxGeometry args={[winW + 0.09, 0.055, 0.022]} />
      </mesh>

      {/* Deep Interior Timber Stool / Sill & Lower Apron Molding */}
      <mesh position={[0, -winH / 2 + 0.012, 0.015]} material={sillStoneMat} castShadow receiveShadow>
        <boxGeometry args={[winW + 0.18, 0.042, frameD + 0.095]} />
      </mesh>
      <mesh position={[0, -winH / 2 - 0.034, frameD / 2 + 0.006]} material={timberMat} castShadow>
        <boxGeometry args={[winW + 0.10, 0.052, 0.024]} />
      </mesh>

      {/* ===================================================================== */}
      {/* 3. TRANSOM BAR, CENTRAL MEETING STILE & DIVIDED-LIGHT MUNTINS         */}
      {/* ===================================================================== */}
      {/* Horizontal Structural Transom Bar */}
      <mesh position={[0, transomY, 0]} material={timberMat} castShadow receiveShadow>
        <boxGeometry args={[innerW + 0.02, 0.048, frameD * 0.72]} />
      </mesh>
      {/* Central Vertical Meeting Mullion */}
      <mesh position={[0, 0, 0]} material={timberMat} castShadow receiveShadow>
        <boxGeometry args={[0.046, innerH + 0.02, frameD * 0.62]} />
      </mesh>
      {/* Dark Bronze Weather-Seal Shadow Strip along Meeting Stile */}
      <mesh position={[0, 0, frameD * 0.32]} material={gasketMat}>
        <boxGeometry args={[0.006, innerH, 0.004]} />
      </mesh>

      {/* Twin Casement Inner Sash Perimeter Frames + Horizontal Glazing Muntins */}
      {[-1, 1].map((side) => {
        const cx = side * (sashW / 2 + 0.014);
        return (
          <group key={side} position={[cx, 0, 0]}>
            {/* Lower casement sash rails */}
            <mesh position={[0, -innerH / 2 + 0.022, 0]} material={timberMat} castShadow>
              <boxGeometry args={[sashW, 0.036, 0.055]} />
            </mesh>
            <mesh position={[0, transomY - 0.036, 0]} material={timberMat} castShadow>
              <boxGeometry args={[sashW, 0.032, 0.055]} />
            </mesh>
            <mesh position={[-sashW / 2 + 0.016, lowerCenterY, 0]} material={timberMat} castShadow>
              <boxGeometry args={[0.032, lowerH, 0.055]} />
            </mesh>
            <mesh position={[sashW / 2 - 0.016, lowerCenterY, 0]} material={timberMat} castShadow>
              <boxGeometry args={[0.032, lowerH, 0.055]} />
            </mesh>
            {/* Slim Horizontal Dividing Muntin across lower glass pane */}
            <mesh position={[0, lowerCenterY - 0.02, 0]} material={timberMat} castShadow>
              <boxGeometry args={[sashW - 0.02, 0.022, 0.034]} />
            </mesh>

            {/* Upper transom sash rails */}
            <mesh position={[0, transomY + 0.034, 0]} material={timberMat} castShadow>
              <boxGeometry args={[sashW, 0.028, 0.055]} />
            </mesh>
            <mesh position={[0, innerH / 2 - 0.022, 0]} material={timberMat} castShadow>
              <boxGeometry args={[sashW, 0.032, 0.055]} />
            </mesh>
            <mesh position={[-sashW / 2 + 0.016, upperCenterY, 0]} material={timberMat} castShadow>
              <boxGeometry args={[0.032, upperH, 0.055]} />
            </mesh>
            <mesh position={[sashW / 2 - 0.016, upperCenterY, 0]} material={timberMat} castShadow>
              <boxGeometry args={[0.032, upperH, 0.055]} />
            </mesh>

            {/* Double-glazed Aluminum Bottom & Top Spacer Frame Rails (flush inside sash edges) */}
            <mesh position={[0, -innerH / 2 + 0.042, 0]} material={spacerMat}>
              <boxGeometry args={[sashW - 0.064, 0.006, 0.014]} />
            </mesh>
            <mesh position={[0, transomY - 0.054, 0]} material={spacerMat}>
              <boxGeometry args={[sashW - 0.064, 0.006, 0.014]} />
            </mesh>

            {/* ================================================================= */}
            {/* 4. CRYSTAL CLEAR DOUBLE-PANE ARCHITECTURAL GLASS GLAZING          */}
            {/* ================================================================= */}
            {/* Lower Casement Double-Pane Glass */}
            <mesh position={[0, lowerCenterY, 0.009]} material={glassMat}>
              <planeGeometry args={[sashW - 0.058, lowerH - 0.052]} />
            </mesh>
            <mesh position={[0, lowerCenterY, -0.009]} material={glassMat}>
              <planeGeometry args={[sashW - 0.058, lowerH - 0.052]} />
            </mesh>
            {/* Upper Transom Double-Pane Glass */}
            <mesh position={[0, upperCenterY, 0.009]} material={glassMat}>
              <planeGeometry args={[sashW - 0.058, upperH - 0.048]} />
            </mesh>
            <mesh position={[0, upperCenterY, -0.009]} material={glassMat}>
              <planeGeometry args={[sashW - 0.058, upperH - 0.048]} />
            </mesh>
          </group>
        );
      })}

      {/* ===================================================================== */}
      {/* 5. BRUSHED AGED BRASS CASEMENT HANDLES, BACKPLATES & PIVOT HINGES     */}
      {/* ===================================================================== */}
      {/* Center Locking Cremone Handle & Backplate */}
      <mesh position={[0.022, -0.18, 0.036]} material={brassMat} castShadow>
        <boxGeometry args={[0.024, 0.088, 0.008]} />
      </mesh>
      <mesh position={[0.022, -0.16, 0.056]} material={brassMat} castShadow>
        <boxGeometry args={[0.014, 0.014, 0.032]} />
      </mesh>
      <mesh position={[0.022, -0.20, 0.072]} material={brassMat} castShadow>
        <capsuleGeometry args={[0.007, 0.076, 6, 12]} />
      </mesh>

      {/* Outer Stile Brass Barrel Hinges */}
      {[-0.64, -0.22, 0.24].map((hy, i) => (
        <group key={i}>
          <mesh position={[-winW / 2 + 0.056, hy, 0.032]} material={brassMat}>
            <cylinderGeometry args={[0.006, 0.006, 0.048, 12]} />
          </mesh>
          <mesh position={[winW / 2 - 0.056, hy, 0.032]} material={brassMat}>
            <cylinderGeometry args={[0.006, 0.006, 0.048, 12]} />
          </mesh>
        </group>
      ))}
    </group>
  );
}
