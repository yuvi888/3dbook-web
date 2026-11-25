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
 * Generates high-detail aged heritage walnut/oak PBR maps (map, normalMap, roughnessMap)
 * with cathedral grain arches, open timber pores, knots, and satin hand-rubbed patina.
 */
function createAgedWoodPBRSet(options: {
  horizontal: boolean;
  tone: 'walnut' | 'plankBack';
  repeatX?: number;
  repeatY?: number;
}) {
  const size = 256;
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

  const isPlank = options.tone === 'plankBack';
  const baseHex = isPlank ? '#563823' : '#6c472d';

  aCtx.fillStyle = baseHex;
  aCtx.fillRect(0, 0, size, size);
  hCtx.fillStyle = '#8e8e8e';
  hCtx.fillRect(0, 0, size, size);
  rCtx.fillStyle = isPlank ? '#8c8c8c' : '#727272';
  rCtx.fillRect(0, 0, size, size);

  const aImg = aCtx.getImageData(0, 0, size, size);
  const hImg = hCtx.getImageData(0, 0, size, size);
  const rImg = rCtx.getImageData(0, 0, size, size);

  // Rich warm aged heirloom walnut / chestnut oak
  const baseR = isPlank ? 88 : 112;
  const baseG = isPlank ? 57 : 74;
  const baseB = isPlank ? 36 : 47;

  // Smooth elongated cathedral timber grain + fine natural wood fibers (zero zig-zag zebra stripes)
  for (let y = 0; y < size; y++) {
    for (let x = 0; x < size; x++) {
      const gx = options.horizontal ? y / size : x / size; // Across grain
      const gy = options.horizontal ? x / size : y / size; // Along grain (smooth & elongated)

      const warp =
        Math.sin(gy * Math.PI * 2) * 0.035 +
        Math.cos(gx * Math.PI * 2) * 0.015;
      const ringVal = Math.sin((gx * 7.0 + warp * 2.4) * Math.PI * 2);
      const secondaryRing = Math.sin((gx * 16.0 + warp * 3.1) * Math.PI * 2) * 0.45;
      const fineFiber =
        Math.sin(gx * 210 + Math.sin(gy * 8) * 1.4) * 0.6 +
        Math.cos(gx * 380 + gy * 4) * 0.4;

      // Subtle micro-grain pore variation along the wood length (no blocky rectangular dashes)
      const microNoise = seededRand(x * 13.7 + y * 3.1) - 0.5;
      const ringFactor = (ringVal * 0.65 + secondaryRing * 0.35) * 0.5 + 0.5;
      const grainShade = 0.84 + ringFactor * 0.26 + fineFiber * 0.045 + microNoise * 0.05;

      const idx = (y * size + x) * 4;
      aImg.data[idx] = Math.min(255, Math.max(0, Math.round(baseR * grainShade)));
      aImg.data[idx + 1] = Math.min(255, Math.max(0, Math.round(baseG * grainShade)));
      aImg.data[idx + 2] = Math.min(255, Math.max(0, Math.round(baseB * grainShade)));
      aImg.data[idx + 3] = 255;

      const hVal = Math.round(128 + ringFactor * 28 + fineFiber * 14 + microNoise * 18);
      hImg.data[idx] = hVal;
      hImg.data[idx + 1] = hVal;
      hImg.data[idx + 2] = hVal;
      hImg.data[idx + 3] = 255;

      const rVal = Math.round((isPlank ? 142 : 108) + (1 - ringFactor) * 26);
      rImg.data[idx] = rVal;
      rImg.data[idx + 1] = rVal;
      rImg.data[idx + 2] = rVal;
      rImg.data[idx + 3] = 255;
    }
  }

  aCtx.putImageData(aImg, 0, 0);
  hCtx.putImageData(hImg, 0, 0);
  rCtx.putImageData(rImg, 0, 0);

  // Add subtle antique timber knots
  const knotCoords = isPlank ? [[0.32, 0.38]] : [[0.24, 0.45]];
  knotCoords.forEach(([kx, ky]) => {
    const cx = kx * size;
    const cy = ky * size;
    const grad = aCtx.createRadialGradient(cx, cy, 1, cx, cy, 10);
    grad.addColorStop(0, 'rgba(34, 19, 10, 0.55)');
    grad.addColorStop(0.6, 'rgba(48, 28, 15, 0.25)');
    grad.addColorStop(1, 'rgba(48, 28, 15, 0)');
    aCtx.fillStyle = grad;
    aCtx.beginPath();
    aCtx.ellipse(
      cx,
      cy,
      options.horizontal ? 12 : 6,
      options.horizontal ? 6 : 12,
      0,
      0,
      Math.PI * 2
    );
    aCtx.fill();
  });

  // Add historic vertical Tongue-and-Groove plank joints on backboard
  if (isPlank) {
    const plankCount = 6;
    for (let p = 0; p < plankCount; p++) {
      const px = Math.round((p / plankCount) * size);
      aCtx.fillStyle = 'rgba(26, 14, 7, 0.58)';
      aCtx.fillRect(px, 0, 2, size);
      aCtx.fillStyle = 'rgba(145, 102, 68, 0.18)';
      aCtx.fillRect(px + 2, 0, 1.5, size);

      hCtx.fillStyle = '#242424';
      hCtx.fillRect(px, 0, 2, size);
    }
  }

  const hData = hCtx.getImageData(0, 0, size, size).data;
  const hFloat = new Float32Array(size * size);
  for (let i = 0; i < size * size; i++) hFloat[i] = hData[i * 4] / 255;

  const rx = options.repeatX || 1;
  const ry = options.repeatY || 1;

  const map = new THREE.CanvasTexture(aCanvas);
  map.colorSpace = THREE.SRGBColorSpace;
  map.wrapS = THREE.RepeatWrapping;
  map.wrapT = THREE.RepeatWrapping;
  map.repeat.set(rx, ry);
  map.anisotropy = 8;

  const normalMap = heightfieldToNormalTexture(hFloat, size, 2.2);
  normalMap.repeat.set(rx, ry);

  const roughnessMap = new THREE.CanvasTexture(rCanvas);
  roughnessMap.wrapS = THREE.RepeatWrapping;
  roughnessMap.wrapT = THREE.RepeatWrapping;
  roughnessMap.repeat.set(rx, ry);

  return { map, normalMap, roughnessMap };
}

/**
 * Builds a carved S-curved architectural wall corbel bracket (ExtrudeGeometry with beveled edges).
 * Mounted against the wall (-Z) underneath the bookcase apron.
 */
function buildCarvedCorbelGeometry(): THREE.BufferGeometry {
  const s = new THREE.Shape();
  // Profile in XY (will be rotated so -Z is back wall and +Z points forward)
  s.moveTo(0, 0);        // Top-back corner at wall
  s.lineTo(0.20, 0);     // Top horizontal seat under shelf (20 cm forward)
  s.lineTo(0.20, -0.024);
  // Classic S-scroll curve tapering back toward the wall
  s.bezierCurveTo(0.14, -0.032, 0.13, -0.088, 0.085, -0.105);
  s.bezierCurveTo(0.045, -0.120, 0.042, -0.158, 0.015, -0.172);
  s.lineTo(0, -0.175);   // Bottom tip against wall
  s.closePath();

  const geo = new THREE.ExtrudeGeometry(s, {
    steps: 1,
    depth: 0.042,
    bevelEnabled: true,
    bevelThickness: 0.004,
    bevelSize: 0.004,
    bevelSegments: 3,
    curveSegments: 16,
  });
  // Center along Z thickness (0.042m), then rotate +PI/2 around Y so profile X extends along +Z!
  geo.translate(0, 0, -0.021);
  geo.rotateY(-Math.PI / 2);
  const cPos = geo.attributes.position;
  const cUv = geo.attributes.uv;
  for (let i = 0; i < cPos.count; i++) {
    cUv.setXY(i, (cPos.getZ(i) + 0.1) * 3.5, (cPos.getY(i) + 0.2) * 3.5);
  }
  geo.computeVertexNormals();
  return geo;
}

/**
 * Builds the carved Roman/Georgian timber archway spandrel for the center gallery focal niche.
 */
function buildArchSpandrelGeometry(spanW: number, archHeight: number, depth: number): THREE.BufferGeometry {
  const hw = spanW / 2;
  const r = hw * 0.88;
  const shape = new THREE.Shape();

  // Outer rectangular header frame
  shape.moveTo(-hw, 0);
  shape.lineTo(-hw, archHeight);
  shape.lineTo(hw, archHeight);
  shape.lineTo(hw, 0);
  // Inner semicircular arch cutout
  shape.lineTo(r, 0);
  shape.absarc(0, 0, r, 0, Math.PI, false);
  shape.lineTo(-hw, 0);

  const geo = new THREE.ExtrudeGeometry(shape, {
    steps: 1,
    depth,
    bevelEnabled: true,
    bevelThickness: 0.003,
    bevelSize: 0.003,
    bevelSegments: 3,
    curveSegments: 28,
  });
  geo.translate(0, 0, -depth / 2);
  const aPos = geo.attributes.position;
  const aUv = geo.attributes.uv;
  for (let i = 0; i < aPos.count; i++) {
    aUv.setXY(i, (aPos.getX(i) + hw) / spanW, aPos.getY(i) / archHeight);
  }
  geo.computeVertexNormals();
  return geo;
}

/**
 * Builds a fluted architectural vertical pilaster with plinth foot & capital collar.
 */
function buildFlutedPilasterGeometry(width: number, height: number, depth: number): THREE.BufferGeometry {
  // High-res box face with 3 subtle vertical concave flutes carved into front (+Z) face
  const geo = new THREE.BoxGeometry(width, height, depth, 18, 1, 1);
  const pos = geo.attributes.position;
  for (let i = 0; i < pos.count; i++) {
    const x = pos.getX(i);
    const y = pos.getY(i);
    const z = pos.getZ(i);
    if (z > depth * 0.45 && Math.abs(y) < height * 0.44) {
      // 3 crisp vertical flutes across shaft
      const normX = x / (width * 0.36);
      if (Math.abs(normX) <= 1.0) {
        const fluteWave = Math.cos(normX * Math.PI * 3);
        if (fluteWave > 0) {
          pos.setZ(i, z - fluteWave * 0.0035);
        }
      }
    }
  }
  geo.computeVertexNormals();
  return geo;
}

export function RealisticWoodenBookshelf3D({ autoRotate }: { autoRotate: boolean }) {
  const groupRef = useRef<THREE.Group>(null!);

  useFrame((_, delta) => {
    if (autoRotate && groupRef.current) {
      groupRef.current.rotation.y += delta * 0.30;
    }
  });

  // =========================================================================
  // 1. DIMENSIONS (Wall-Mounted Classic Proportions: 1.66m W x 1.24m H x 0.34m D)
  // =========================================================================
  const totalW = 1.66;
  const totalH = 1.24;
  const depth = 0.34;
  const boardT = 0.030;
  const crownH = 0.072;
  const apronH = 0.044;

  const innerW = totalW - boardT * 2; // 1.60m
  const topShelfY = totalH / 2 - crownH - boardT / 2;    // +0.533m
  const botShelfY = -totalH / 2 + apronH + boardT / 2;   // -0.561m
  const interiorTop = topShelfY - boardT / 2;            // +0.518m
  const interiorBot = botShelfY + boardT / 2;            // -0.546m
  const interiorH = interiorTop - interiorBot;           // 1.064m
  const interiorCenterY = (interiorTop + interiorBot) / 2; // -0.014m

  // Tripartite Bay X Layout: Left Wing (0.43m) | Center Arch Gallery (0.64m) | Right Wing (0.43m)
  const divThick = 0.032;
  const leftDivX = -0.336;
  const rightDivX = 0.336;

  const leftBayW = leftDivX - divThick / 2 - (-innerW / 2); // 0.448m
  const leftBayCenterX = (-innerW / 2 + (leftDivX - divThick / 2)) / 2; // -0.56m

  const centerBayW = rightDivX - leftDivX - divThick; // 0.640m
  const centerBayCenterX = 0;

  const rightBayW = innerW / 2 - (rightDivX + divThick / 2); // 0.448m
  const rightBayCenterX = ((rightDivX + divThick / 2) + innerW / 2) / 2; // +0.56m

  // =========================================================================
  // 2. PBR MATERIALS & CUSTOM SCULPTED GEOMETRIES
  // =========================================================================
  const {
    woodHMat,
    woodVMat,
    backPlankMat,
    agedBrassMat,
    corbelGeo,
    archSpandrelGeo,
    pilasterOuterGeo,
    pilasterInnerGeo,
  } = useMemo(() => {
    const hWood = createAgedWoodPBRSet({ horizontal: true, tone: 'walnut', repeatX: 2, repeatY: 1 });
    const vWood = createAgedWoodPBRSet({ horizontal: false, tone: 'walnut', repeatX: 1, repeatY: 2 });
    const backWood = createAgedWoodPBRSet({ horizontal: false, tone: 'plankBack', repeatX: 2, repeatY: 1 });

    const wHMat = new THREE.MeshStandardMaterial({
      map: hWood.map,
      normalMap: hWood.normalMap,
      normalScale: new THREE.Vector2(0.85, 0.85),
      roughnessMap: hWood.roughnessMap,
      roughness: 0.48,
      metalness: 0.03,
    });

    const wVMat = new THREE.MeshStandardMaterial({
      map: vWood.map,
      normalMap: vWood.normalMap,
      normalScale: new THREE.Vector2(0.85, 0.85),
      roughnessMap: vWood.roughnessMap,
      roughness: 0.48,
      metalness: 0.03,
    });

    const bMat = new THREE.MeshStandardMaterial({
      map: backWood.map,
      normalMap: backWood.normalMap,
      normalScale: new THREE.Vector2(1.05, 1.05),
      roughnessMap: backWood.roughnessMap,
      roughness: 0.56,
      metalness: 0.02,
    });

    const brassMat = new THREE.MeshStandardMaterial({
      color: new THREE.Color('#b69148'),
      roughness: 0.32,
      metalness: 0.86,
    });

    const cGeo = buildCarvedCorbelGeometry();
    const aGeo = buildArchSpandrelGeometry(centerBayW, 0.25, 0.028);
    const pOuter = buildFlutedPilasterGeometry(0.044, interiorH + boardT * 2, 0.020);
    const pInner = buildFlutedPilasterGeometry(0.042, interiorH, 0.020);

    return {
      woodHMat: wHMat,
      woodVMat: wVMat,
      backPlankMat: bMat,
      agedBrassMat: brassMat,
      corbelGeo: cGeo,
      archSpandrelGeo: aGeo,
      pilasterOuterGeo: pOuter,
      pilasterInnerGeo: pInner,
    };
  }, [centerBayW, interiorH, boardT]);

  // Shelf horizontal depth (recessed cleanly inside pilaster front nosing)
  const shelfDepth = depth - 0.024;
  const shelfZ = -0.004;

  // Molded shelf helper: board + beveled front bullnose trim
  const renderShelf = (w: number, x: number, y: number, key: string) => (
    <group key={key} position={[x, y, shelfZ]}>
      <mesh material={woodHMat} castShadow receiveShadow>
        <boxGeometry args={[w, boardT, shelfDepth]} />
      </mesh>
      {/* Front architectural molded nosing lip */}
      <mesh position={[0, 0, shelfDepth / 2 + 0.005]} material={woodHMat} castShadow>
        <boxGeometry args={[w, boardT + 0.006, 0.012]} />
      </mesh>
    </group>
  );

  return (
    // Elevated cleanly in air (+0.16m) as wall-mounted floating architectural cabinetry
    <group ref={groupRef} position={[0, 0.14, 0]}>
      {/* =================================================================== */}
      {/* 1. STEPPED CLASSIC CROWN CORNICE & FRIEZE                           */}
      {/* =================================================================== */}
      <group position={[0, totalH / 2, 0]}>
        {/* Upper molded crown cap */}
        <mesh position={[0, -0.014, 0.022]} material={woodHMat} castShadow receiveShadow>
          <boxGeometry args={[totalW + 0.088, 0.028, depth + 0.044]} />
        </mesh>
        {/* Cove step transition */}
        <mesh position={[0, -0.038, 0.012]} material={woodHMat} castShadow receiveShadow>
          <boxGeometry args={[totalW + 0.046, 0.022, depth + 0.024]} />
        </mesh>
        {/* Lower frieze trim */}
        <mesh position={[0, -0.059, 0.005]} material={woodHMat} castShadow>
          <boxGeometry args={[totalW + 0.016, 0.020, depth + 0.010]} />
        </mesh>
      </group>

      {/* Solid Top & Bottom Casework Panels */}
      <mesh position={[0, topShelfY, 0]} material={woodHMat} castShadow receiveShadow>
        <boxGeometry args={[totalW, boardT, depth]} />
      </mesh>
      <mesh position={[0, botShelfY, 0]} material={woodHMat} castShadow receiveShadow>
        <boxGeometry args={[totalW, boardT, depth]} />
      </mesh>
      {/* Front nosing lip on bottom shelf */}
      <mesh position={[0, botShelfY, depth / 2 + 0.005]} material={woodHMat} castShadow>
        <boxGeometry args={[totalW + 0.01, boardT + 0.008, 0.012]} />
      </mesh>

      {/* =================================================================== */}
      {/* 2. WALL-MOUNTED LOWER APRON & 3 CARVED TIMBER CORBEL BRACKETS       */}
      {/* =================================================================== */}
      <mesh position={[0, -totalH / 2 + apronH / 2, -0.005]} material={woodHMat} castShadow receiveShadow>
        <boxGeometry args={[totalW - 0.016, apronH, depth - 0.012]} />
      </mesh>

      {/* Three Sculpted S-Curved Timber Wall Corbels beneath the unit */}
      {[-0.64, 0, 0.64].map((cx, idx) => (
        <mesh
          key={`corbel-${idx}`}
          geometry={corbelGeo}
          position={[cx, -totalH / 2 + 0.002, -depth / 2]}
          material={woodVMat}
          castShadow
          receiveShadow
        />
      ))}

      {/* =================================================================== */}
      {/* 3. OUTER UPRIGHT WALLS, TONGUE-AND-GROOVE BACKBOARD & REAR CLEATS   */}
      {/* =================================================================== */}
      <mesh position={[-totalW / 2 + boardT / 2, interiorCenterY, 0]} material={woodVMat} castShadow receiveShadow>
        <boxGeometry args={[boardT, interiorH, depth]} />
      </mesh>
      <mesh position={[totalW / 2 - boardT / 2, interiorCenterY, 0]} material={woodVMat} castShadow receiveShadow>
        <boxGeometry args={[boardT, interiorH, depth]} />
      </mesh>

      {/* Full-Height Tongue-and-Groove Timber Backboard */}
      <mesh position={[0, interiorCenterY, -depth / 2 + 0.009]} material={backPlankMat} receiveShadow>
        <boxGeometry args={[innerW, interiorH + 0.01, 0.018]} />
      </mesh>

      {/* Rear Wall-Mount Hardware (Visible when orbited 360° behind cabinet) */}
      <group position={[0, 0, -depth / 2 - 0.006]}>
        {/* Upper & Lower Solid Hardwood French Cleat Mounting Ledgers */}
        <mesh position={[0, 0.34, 0]} material={woodHMat} castShadow>
          <boxGeometry args={[totalW - 0.14, 0.055, 0.014]} />
        </mesh>
        <mesh position={[0, -0.34, 0]} material={woodHMat} castShadow>
          <boxGeometry args={[totalW - 0.14, 0.055, 0.014]} />
        </mesh>
        {/* Recessed Aged-Brass Keyhole Mounting Brackets */}
        {[-0.68, 0.68].map((kx, idx) => (
          <group key={`keyhole-${idx}`} position={[kx, 0.44, -0.002]}>
            <mesh material={agedBrassMat}>
              <boxGeometry args={[0.038, 0.072, 0.004]} />
            </mesh>
            <mesh position={[0, 0.012, -0.003]}>
              <cylinderGeometry args={[0.007, 0.007, 0.002, 16]} />
              <meshStandardMaterial color="#18120c" roughness={0.9} />
            </mesh>
          </group>
        ))}
      </group>

      {/* =================================================================== */}
      {/* 4. FOUR CLASSIC FLUTED VERTICAL PILASTERS & INTERNAL DIVIDERS       */}
      {/* =================================================================== */}
      {/* Inner Structural Bay Dividers */}
      <mesh position={[leftDivX, interiorCenterY, shelfZ]} material={woodVMat} castShadow receiveShadow>
        <boxGeometry args={[divThick, interiorH, shelfDepth]} />
      </mesh>
      <mesh position={[rightDivX, interiorCenterY, shelfZ]} material={woodVMat} castShadow receiveShadow>
        <boxGeometry args={[divThick, interiorH, shelfDepth]} />
      </mesh>

      {/* Fluted Front Architectural Pilasters */}
      <mesh
        geometry={pilasterOuterGeo}
        position={[-totalW / 2 + 0.022, interiorCenterY, depth / 2 + 0.006]}
        material={woodVMat}
        castShadow
      />
      <mesh
        geometry={pilasterOuterGeo}
        position={[totalW / 2 - 0.022, interiorCenterY, depth / 2 + 0.006]}
        material={woodVMat}
        castShadow
      />
      <mesh
        geometry={pilasterInnerGeo}
        position={[leftDivX, interiorCenterY, depth / 2 + 0.004]}
        material={woodVMat}
        castShadow
      />
      <mesh
        geometry={pilasterInnerGeo}
        position={[rightDivX, interiorCenterY, depth / 2 + 0.004]}
        material={woodVMat}
        castShadow
      />

      {/* Pilaster Capital Collars & Plinth Blocks */}
      {[-totalW / 2 + 0.022, leftDivX, rightDivX, totalW / 2 - 0.022].map((px, idx) => (
        <group key={`pilaster-trim-${idx}`} position={[px, 0, depth / 2 + 0.009]}>
          <mesh position={[0, interiorTop - 0.016, 0]} material={woodHMat}>
            <boxGeometry args={[0.052, 0.024, 0.024]} />
          </mesh>
          <mesh position={[0, interiorBot + 0.016, 0]} material={woodHMat}>
            <boxGeometry args={[0.052, 0.028, 0.024]} />
          </mesh>
        </group>
      ))}

      {/* =================================================================== */}
      {/* 5. PROPER INSIDE DESIGNED COMPARTMENT LAYOUT                        */}
      {/* =================================================================== */}

      {/* A. LEFT READING WING (3 Tiered Shelves: Top Curio, Tall Books, Lower Folio) */}
      {renderShelf(leftBayW, leftBayCenterX, 0.21, 'left-shelf-upper')}
      {renderShelf(leftBayW, leftBayCenterX, -0.24, 'left-shelf-lower')}

      {/* B. CENTER GRAND ARCHED GALLERY FOCAL NICHE */}
      {/* Main Gallery Floor Shelf dividing tall arched display from lower twin cubbies */}
      {renderShelf(centerBayW, centerBayCenterX, -0.18, 'center-gallery-floor')}

      {/* Carved Roman Timber Arch Spandrel + Keystone at Top of Center Niche */}
      <mesh
        geometry={archSpandrelGeo}
        position={[0, interiorTop - 0.25, depth / 2 - 0.026]}
        material={woodHMat}
        castShadow
        receiveShadow
      />
      {/* Carved Arch Keystone Accent */}
      <mesh position={[0, interiorTop - 0.024, depth / 2 - 0.008]} material={woodVMat} castShadow>
        <boxGeometry args={[0.054, 0.056, 0.018]} />
      </mesh>

      {/* Raised Mitered Wainscot Back Panel inside the Arched Gallery Niche */}
      <group position={[0, 0.13, -depth / 2 + 0.022]}>
        <mesh material={woodVMat} receiveShadow>
          <boxGeometry args={[0.46, 0.48, 0.010]} />
        </mesh>
        {/* Beveled Inner Frame Molding */}
        <mesh position={[0, 0.225, 0.006]} material={woodHMat}>
          <boxGeometry args={[0.42, 0.024, 0.008]} />
        </mesh>
        <mesh position={[0, -0.225, 0.006]} material={woodHMat}>
          <boxGeometry args={[0.42, 0.024, 0.008]} />
        </mesh>
        {/* Subtle Aged-Brass Gallery Picture Rail Accent */}
        <mesh position={[0, -0.27, 0.014]} rotation={[0, 0, Math.PI / 2]} material={agedBrassMat}>
          <cylinderGeometry args={[0.004, 0.004, 0.52, 12]} />
        </mesh>
      </group>

      {/* Subtle Warm Gallery Accent Light tucked cleanly behind the center arch header */}
      <pointLight
        position={[0, interiorTop - 0.12, 0.02]}
        color="#ffda9e"
        intensity={0.28}
        distance={0.95}
        decay={2}
      />

      {/* Lower Center Twin Symmetrical Apothecary / Folio Cubbies */}
      <mesh
        position={[0, (interiorBot + (-0.18 - boardT / 2)) / 2, shelfZ]}
        material={woodVMat}
        castShadow
        receiveShadow
      >
        <boxGeometry args={[0.026, -0.18 - boardT / 2 - interiorBot, shelfDepth]} />
      </mesh>
      {/* Subtle Aged Brass Trim Pins on twin cubby fronts */}
      {[-0.155, 0.155].map((tx, idx) => (
        <mesh key={`brass-pin-${idx}`} position={[tx, -0.18, shelfZ + shelfDepth / 2 + 0.012]} material={agedBrassMat}>
          <boxGeometry args={[0.036, 0.005, 0.004]} />
        </mesh>
      ))}

      {/* C. RIGHT READING WING (Staggered Asymmetrical Layout: Tall Upper + Split Mid Nook + Lower) */}
      {renderShelf(rightBayW, rightBayCenterX, 0.14, 'right-shelf-upper')}
      {renderShelf(rightBayW, rightBayCenterX, -0.20, 'right-shelf-lower')}
      {/* Vertical Asymmetric Folio Divider in Middle Right Tier */}
      <mesh position={[rightBayCenterX - 0.075, -0.03, shelfZ]} material={woodVMat} castShadow receiveShadow>
        <boxGeometry args={[0.024, 0.34 - boardT, shelfDepth]} />
      </mesh>
    </group>
  );
}
