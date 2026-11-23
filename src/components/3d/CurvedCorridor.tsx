'use client';

import { useMemo } from 'react';
import * as THREE from 'three';

// Define the curve for the tunnel with an elegant, smooth turn
export const TUNNEL_CURVE_POINTS = [
  new THREE.Vector3(0, 0, 8),
  new THREE.Vector3(0, 0, -12),
  new THREE.Vector3(1.5, 0, -28),
  new THREE.Vector3(7.0, 0, -45),
  new THREE.Vector3(16.5, 0, -64),
  new THREE.Vector3(28.0, 0, -82),
  new THREE.Vector3(38.0, 0, -102),
  new THREE.Vector3(44.0, 0, -118),
];

export const tunnelCurve = new THREE.CatmullRomCurve3(
  TUNNEL_CURVE_POINTS,
  false,
  'catmullrom',
  0.5
);

const TUNNEL_WIDTH = 6.8;
const TUNNEL_HEIGHT = 4.6;
const SAMPLES = 160;

export function CurvedCorridor() {
  // =====================================================================
  // 1. PROCEDURAL LUXURY HARDWOOD PARQUET TILE TEXTURE (1024 x 1024)
  // Warm oak/walnut parquet tiles with realistic grain, bevels & satin sheen
  // =====================================================================
  const floorWoodTileTex = useMemo(() => {
    if (typeof window === 'undefined') return undefined;
    const canvas = document.createElement('canvas');
    canvas.width = 1024;
    canvas.height = 1024;
    const ctx = canvas.getContext('2d');
    if (!ctx) return undefined;

    // Base rich honey walnut color
    ctx.fillStyle = '#5c3517';
    ctx.fillRect(0, 0, 1024, 1024);

    const tileCols = 4;
    const tileRows = 8;
    const tileW = 1024 / tileCols;
    const tileH = 1024 / tileRows;

    const woodPalettes = [
      ['#7c4b22', '#6b3d17', '#8c5929', '#542e11'],
      ['#845125', '#73411b', '#925f31', '#5d3414'],
      ['#703f19', '#613413', '#804c22', '#4b270c'],
      ['#8c572a', '#79471f', '#9b6637', '#643916'],
    ];

    for (let r = 0; r < tileRows; r++) {
      for (let c = 0; c < tileCols; c++) {
        const x = c * tileW;
        const y = r * tileH;
        const palette = woodPalettes[(r + c * 3) % woodPalettes.length];

        // Draw individual wood plank tile
        const grad = ctx.createLinearGradient(x, y, x + tileW, y + tileH * 0.2);
        grad.addColorStop(0, palette[0]);
        grad.addColorStop(0.3, palette[1]);
        grad.addColorStop(0.7, palette[2]);
        grad.addColorStop(1, palette[3]);
        ctx.fillStyle = grad;
        ctx.fillRect(x + 2, y + 2, tileW - 4, tileH - 4);

        // Natural fine wood grain lines running along the length of each tile
        ctx.fillStyle = 'rgba(25, 12, 4, 0.22)';
        for (let i = 0; i < 7; i++) {
          const py = y + 8 + i * (tileH / 8);
          ctx.fillRect(x + 4, py, tileW - 8, 2.5);
        }
        ctx.fillStyle = 'rgba(255, 235, 205, 0.08)';
        for (let i = 0; i < 4; i++) {
          const py = y + 14 + i * (tileH / 4.5);
          ctx.fillRect(x + 4, py, tileW - 8, 1.5);
        }

        // Crisp beveled groove seam between tiles
        ctx.strokeStyle = '#221105';
        ctx.lineWidth = 3;
        ctx.strokeRect(x, y, tileW, tileH);
      }
    }

    // Micro noise for realistic tactile timber texture
    const imgData = ctx.getImageData(0, 0, 1024, 1024);
    const d = imgData.data;
    for (let i = 0; i < d.length; i += 4) {
      const noise = (Math.random() - 0.5) * 12;
      d[i] = Math.min(255, Math.max(0, d[i] + noise));
      d[i + 1] = Math.min(255, Math.max(0, d[i + 1] + noise * 0.6));
      d[i + 2] = Math.min(255, Math.max(0, d[i + 2] + noise * 0.3));
    }
    ctx.putImageData(imgData, 0, 0);

    const tex = new THREE.CanvasTexture(canvas);
    tex.wrapS = THREE.RepeatWrapping;
    tex.wrapT = THREE.RepeatWrapping;
    tex.repeat.set(4, 28);
    tex.generateMipmaps = true;
    return tex;
  }, []);

  // =====================================================================
  // 2. PROCEDURAL ARCHITECTURAL WOOD SLAT WALL TEXTURE (1024 x 1024)
  // Luxury vertical acoustic timber slats with dark recessed shadow reveals
  // =====================================================================
  const wallWoodSlatTex = useMemo(() => {
    if (typeof window === 'undefined') return undefined;
    const canvas = document.createElement('canvas');
    canvas.width = 1024;
    canvas.height = 1024;
    const ctx = canvas.getContext('2d');
    if (!ctx) return undefined;

    // Deep acoustic felt dark background in the slat recesses
    ctx.fillStyle = '#140c06';
    ctx.fillRect(0, 0, 1024, 1024);

    const numSlats = 32;
    const slatPitch = 1024 / numSlats;
    const slatW = slatPitch * 0.72; // Slat width
    const gapW = slatPitch - slatW; // Recessed shadow gap

    for (let i = 0; i < numSlats; i++) {
      const x = i * slatPitch + gapW / 2;

      // Natural timber color variation per slat (warm honey oak / teak)
      const toneVariation = Math.sin(i * 1.7) * 15;
      const rVal = Math.min(255, Math.max(0, 148 + toneVariation));
      const gVal = Math.min(255, Math.max(0, 102 + toneVariation * 0.7));
      const bVal = Math.min(255, Math.max(0, 58 + toneVariation * 0.4));

      const grad = ctx.createLinearGradient(x, 0, x + slatW, 0);
      grad.addColorStop(0, `rgb(${rVal * 0.85}, ${gVal * 0.85}, ${bVal * 0.85})`);
      grad.addColorStop(0.2, `rgb(${rVal * 1.1}, ${gVal * 1.1}, ${bVal * 1.1})`);
      grad.addColorStop(0.8, `rgb(${rVal}, ${gVal}, ${bVal})`);
      grad.addColorStop(1, `rgb(${rVal * 0.75}, ${gVal * 0.75}, ${bVal * 0.75})`);

      ctx.fillStyle = grad;
      ctx.fillRect(x, 0, slatW, 1024);

      // Fine vertical wood grain fibers along each slat
      ctx.fillStyle = 'rgba(40, 20, 6, 0.25)';
      for (let g = 0; g < 4; g++) {
        const gx = x + 3 + g * (slatW / 4.5);
        ctx.fillRect(gx, 0, 1.5, 1024);
      }
      ctx.fillStyle = 'rgba(255, 235, 190, 0.1)';
      ctx.fillRect(x + 2, 0, 1.5, 1024);
    }

    const tex = new THREE.CanvasTexture(canvas);
    tex.wrapS = THREE.RepeatWrapping;
    tex.wrapT = THREE.RepeatWrapping;
    tex.repeat.set(6, 12);
    tex.generateMipmaps = true;
    return tex;
  }, []);

  // =====================================================================
  // 3. CONTINUOUS EXTRUDED RIBBON GEOMETRIES ALONG THE SPLINE CURVE
  // =====================================================================
  const { floorGeo, ceilingGeo, leftWallGeo, rightWallGeo, ceilingLightGeo } = useMemo(() => {
    const halfW = TUNNEL_WIDTH / 2;
    const halfH = TUNNEL_HEIGHT / 2;
    const lightStripHalfW = 0.35; // Linear recessed ceiling glow channel

    const floorVerts: number[] = [];
    const floorUVs: number[] = [];
    const floorIndices: number[] = [];

    const ceilingVerts: number[] = [];
    const ceilingUVs: number[] = [];
    const ceilingIndices: number[] = [];

    const leftWallVerts: number[] = [];
    const leftWallUVs: number[] = [];
    const leftWallIndices: number[] = [];

    const rightWallVerts: number[] = [];
    const rightWallUVs: number[] = [];
    const rightWallIndices: number[] = [];

    const lightVerts: number[] = [];
    const lightUVs: number[] = [];
    const lightIndices: number[] = [];

    for (let i = 0; i <= SAMPLES; i++) {
      const t = i / SAMPLES;
      const pt = tunnelCurve.getPointAt(t);
      const tangent = tunnelCurve.getTangentAt(t).normalize();
      const normal = new THREE.Vector3(-tangent.z, 0, tangent.x).normalize();

      // Floor vertices (left & right)
      const flL = pt.clone().add(normal.clone().multiplyScalar(-halfW));
      flL.y = -halfH;
      const flR = pt.clone().add(normal.clone().multiplyScalar(halfW));
      flR.y = -halfH;

      // Ceiling vertices (left & right)
      const ceL = pt.clone().add(normal.clone().multiplyScalar(-halfW));
      ceL.y = halfH;
      const ceR = pt.clone().add(normal.clone().multiplyScalar(halfW));
      ceR.y = halfH;

      // Center recessed ceiling light strip
      const clL = pt.clone().add(normal.clone().multiplyScalar(-lightStripHalfW));
      clL.y = halfH - 0.03;
      const clR = pt.clone().add(normal.clone().multiplyScalar(lightStripHalfW));
      clR.y = halfH - 0.03;

      // UV coordinates mapped to curve progress t
      floorVerts.push(flL.x, flL.y, flL.z, flR.x, flR.y, flR.z);
      floorUVs.push(0, t * 24, 1, t * 24);

      ceilingVerts.push(ceL.x, ceL.y, ceL.z, ceR.x, ceR.y, ceR.z);
      ceilingUVs.push(0, t * 18, 1, t * 18);

      leftWallVerts.push(flL.x, flL.y, flL.z, ceL.x, ceL.y, ceL.z);
      leftWallUVs.push(0, t * 24, 1, t * 24);

      rightWallVerts.push(flR.x, flR.y, flR.z, ceR.x, ceR.y, ceR.z);
      rightWallUVs.push(0, t * 24, 1, t * 24);

      lightVerts.push(clL.x, clL.y, clL.z, clR.x, clR.y, clR.z);
      lightUVs.push(0, t * 10, 1, t * 10);

      if (i < SAMPLES) {
        const v0 = i * 2;
        const v1 = i * 2 + 1;
        const v2 = (i + 1) * 2;
        const v3 = (i + 1) * 2 + 1;

        floorIndices.push(v0, v1, v2, v1, v3, v2);
        ceilingIndices.push(v0, v2, v1, v1, v2, v3);
        leftWallIndices.push(v0, v1, v2, v1, v3, v2);
        rightWallIndices.push(v0, v2, v1, v1, v2, v3);
        lightIndices.push(v0, v2, v1, v1, v2, v3);
      }
    }

    const fGeo = new THREE.BufferGeometry();
    fGeo.setAttribute('position', new THREE.Float32BufferAttribute(floorVerts, 3));
    fGeo.setAttribute('uv', new THREE.Float32BufferAttribute(floorUVs, 2));
    fGeo.setIndex(floorIndices);
    fGeo.computeVertexNormals();

    const cGeo = new THREE.BufferGeometry();
    cGeo.setAttribute('position', new THREE.Float32BufferAttribute(ceilingVerts, 3));
    cGeo.setAttribute('uv', new THREE.Float32BufferAttribute(ceilingUVs, 2));
    cGeo.setIndex(ceilingIndices);
    cGeo.computeVertexNormals();

    const lwGeo = new THREE.BufferGeometry();
    lwGeo.setAttribute('position', new THREE.Float32BufferAttribute(leftWallVerts, 3));
    lwGeo.setAttribute('uv', new THREE.Float32BufferAttribute(leftWallUVs, 2));
    lwGeo.setIndex(leftWallIndices);
    lwGeo.computeVertexNormals();

    const rwGeo = new THREE.BufferGeometry();
    rwGeo.setAttribute('position', new THREE.Float32BufferAttribute(rightWallVerts, 3));
    rwGeo.setAttribute('uv', new THREE.Float32BufferAttribute(rightWallUVs, 2));
    rwGeo.setIndex(rightWallIndices);
    rwGeo.computeVertexNormals();

    const clGeo = new THREE.BufferGeometry();
    clGeo.setAttribute('position', new THREE.Float32BufferAttribute(lightVerts, 3));
    clGeo.setAttribute('uv', new THREE.Float32BufferAttribute(lightUVs, 2));
    clGeo.setIndex(lightIndices);
    clGeo.computeVertexNormals();

    return {
      floorGeo: fGeo,
      ceilingGeo: cGeo,
      leftWallGeo: lwGeo,
      rightWallGeo: rwGeo,
      ceilingLightGeo: clGeo,
    };
  }, []);

  // =====================================================================
  // 4. ARCHITECTURAL MATERIALS
  // =====================================================================
  const floorMaterial = useMemo(
    () =>
      new THREE.MeshStandardMaterial({
        map: floorWoodTileTex,
        roughness: 0.32,
        metalness: 0.08,
        side: THREE.DoubleSide,
      }),
    [floorWoodTileTex]
  );

  const wallMaterial = useMemo(
    () =>
      new THREE.MeshStandardMaterial({
        map: wallWoodSlatTex,
        roughness: 0.55,
        metalness: 0.04,
        side: THREE.DoubleSide,
      }),
    [wallWoodSlatTex]
  );

  // Warm Dark Timber for Ceiling & Cross Beams
  const ceilingMaterial = useMemo(
    () =>
      new THREE.MeshStandardMaterial({
        color: '#2a1a10',
        roughness: 0.75,
        metalness: 0.05,
        side: THREE.DoubleSide,
      }),
    []
  );

  const timberBeamMaterial = useMemo(
    () =>
      new THREE.MeshStandardMaterial({
        color: '#382214',
        roughness: 0.6,
        metalness: 0.08,
      }),
    []
  );

  const brassSpotlightHousingMaterial = useMemo(
    () =>
      new THREE.MeshStandardMaterial({
        color: '#d4af37',
        roughness: 0.25,
        metalness: 0.85,
      }),
    []
  );

  const ceilingLightMaterial = useMemo(
    () =>
      new THREE.MeshBasicMaterial({
        color: '#fffaed',
      }),
    []
  );

  // =====================================================================
  // 5. ARCHITECTURAL EXPOSED TIMBER CEILING CROSS-BEAMS WITH SPOTLIGHTS
  // Spanned along the curve to create real architectural presence
  // =====================================================================
  const ceilingBeams = useMemo(() => {
    const list = [];
    const count = 38;
    for (let i = 1; i <= count; i++) {
      const t = i / (count + 1);
      const pt = tunnelCurve.getPointAt(t);
      const tangent = tunnelCurve.getTangentAt(t).normalize();
      const normal = new THREE.Vector3(-tangent.z, 0, tangent.x).normalize();

      // Rotation around Y to align beam across corridor width
      const rotY = Math.atan2(tangent.x, tangent.z);

      list.push({
        t,
        position: [pt.x, TUNNEL_HEIGHT / 2 - 0.12, pt.z] as [number, number, number],
        rotation: [0, rotY + Math.PI / 2, 0] as [number, number, number],
        pt,
        normal,
      });
    }
    return list;
  }, []);

  return (
    <group>
      {/* 1. Rich Hardwood Parquet Tile Floor */}
      <mesh geometry={floorGeo} material={floorMaterial} receiveShadow />

      {/* 2. Warm Dark Timber Ceiling */}
      <mesh geometry={ceilingGeo} material={ceilingMaterial} />

      {/* 3. Linear Warm Glowing LED Strip along the Curve */}
      <mesh geometry={ceilingLightGeo} material={ceilingLightMaterial} />

      {/* 4. Luxury Architectural Wood Slat Left Wall */}
      <mesh geometry={leftWallGeo} material={wallMaterial} receiveShadow />

      {/* 5. Luxury Architectural Wood Slat Right Wall */}
      <mesh geometry={rightWallGeo} material={wallMaterial} receiveShadow />

      {/* 6. Exposed Timber Ceiling Cross-Beams & Cylindrical Downlights */}
      {ceilingBeams.map((beam, idx) => (
        <group key={idx} position={beam.position} rotation={beam.rotation}>
          {/* Main Transverse Timber Beam */}
          <mesh material={timberBeamMaterial} castShadow>
            <boxGeometry args={[TUNNEL_WIDTH + 0.15, 0.22, 0.26]} />
          </mesh>

          {/* Left & Right Brass Downlight Cylinders on alternate beams */}
          {idx % 2 === 0 && (
            <>
              {/* Left Wall Spotlight Housing */}
              <group position={[-2.2, -0.16, 0]}>
                <mesh material={brassSpotlightHousingMaterial} castShadow>
                  <cylinderGeometry args={[0.07, 0.08, 0.16, 16]} />
                </mesh>
                <mesh position={[0, -0.09, 0]} material={ceilingLightMaterial}>
                  <cylinderGeometry args={[0.065, 0.065, 0.02, 16]} />
                </mesh>
              </group>

              {/* Right Wall Spotlight Housing */}
              <group position={[2.2, -0.16, 0]}>
                <mesh material={brassSpotlightHousingMaterial} castShadow>
                  <cylinderGeometry args={[0.07, 0.08, 0.16, 16]} />
                </mesh>
                <mesh position={[0, -0.09, 0]} material={ceilingLightMaterial}>
                  <cylinderGeometry args={[0.065, 0.065, 0.02, 16]} />
                </mesh>
              </group>
            </>
          )}
        </group>
      ))}

      {/* 7. Warm Atmospheric Museum Point Lights Spaced Along the Pathway */}
      {[0.04, 0.16, 0.28, 0.42, 0.56, 0.70, 0.84, 0.96].map((tVal, idx) => {
        const pt = tunnelCurve.getPointAt(tVal);
        return (
          <group key={idx}>
            {/* Center Pathway Warm Wash */}
            <pointLight
              position={[pt.x, 1.85, pt.z]}
              intensity={1.2}
              distance={14}
              color="#fff6e8"
              castShadow={false}
            />
            {/* Low Ambient Fill on Floor Tiles */}
            <pointLight
              position={[pt.x, -1.5, pt.z]}
              intensity={0.4}
              distance={10}
              color="#d97706"
              castShadow={false}
            />
          </group>
        );
      })}
    </group>
  );
}
