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

        const grad = ctx.createLinearGradient(x, y, x + tileW, y + tileH * 0.2);
        grad.addColorStop(0, palette[0]);
        grad.addColorStop(0.3, palette[1]);
        grad.addColorStop(0.7, palette[2]);
        grad.addColorStop(1, palette[3]);
        ctx.fillStyle = grad;
        ctx.fillRect(x + 2, y + 2, tileW - 4, tileH - 4);

        // Natural fine wood grain lines
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

        // Crisp beveled groove seam
        ctx.strokeStyle = '#221105';
        ctx.lineWidth = 3;
        ctx.strokeRect(x, y, tileW, tileH);
      }
    }

    // Micro noise
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
  // 2. OUTDOOR NATURE VIEW TEXTURE (for glass windows)
  // Procedural landscape: blue sky, clouds, green hills, grass
  // =====================================================================
  const outdoorViewTex = useMemo(() => {
    if (typeof window === 'undefined') return undefined;
    const canvas = document.createElement('canvas');
    canvas.width = 1024;
    canvas.height = 768;
    const ctx = canvas.getContext('2d');
    if (!ctx) return undefined;

    // Sky gradient — bright warm blue
    const skyGrad = ctx.createLinearGradient(0, 0, 0, 480);
    skyGrad.addColorStop(0, '#87CEEB');
    skyGrad.addColorStop(0.3, '#a8d8ea');
    skyGrad.addColorStop(0.6, '#c8e6f0');
    skyGrad.addColorStop(1, '#e8f4f8');
    ctx.fillStyle = skyGrad;
    ctx.fillRect(0, 0, 1024, 480);

    // Soft white clouds
    const drawCloud = (cx: number, cy: number, w: number, h: number) => {
      ctx.fillStyle = 'rgba(255, 255, 255, 0.85)';
      ctx.beginPath();
      ctx.ellipse(cx, cy, w, h, 0, 0, Math.PI * 2);
      ctx.fill();
      ctx.beginPath();
      ctx.ellipse(cx - w * 0.6, cy + h * 0.2, w * 0.6, h * 0.7, 0, 0, Math.PI * 2);
      ctx.fill();
      ctx.beginPath();
      ctx.ellipse(cx + w * 0.5, cy + h * 0.15, w * 0.5, h * 0.65, 0, 0, Math.PI * 2);
      ctx.fill();
    };
    drawCloud(200, 120, 90, 35);
    drawCloud(600, 80, 110, 40);
    drawCloud(850, 150, 70, 28);
    drawCloud(400, 170, 60, 22);

    // Distant hills
    const hillGrad = ctx.createLinearGradient(0, 350, 0, 480);
    hillGrad.addColorStop(0, '#7cb342');
    hillGrad.addColorStop(1, '#558b2f');
    ctx.fillStyle = hillGrad;
    ctx.beginPath();
    ctx.moveTo(0, 450);
    ctx.bezierCurveTo(200, 380, 400, 420, 600, 390);
    ctx.bezierCurveTo(800, 370, 950, 410, 1024, 400);
    ctx.lineTo(1024, 480);
    ctx.lineTo(0, 480);
    ctx.closePath();
    ctx.fill();

    // Grass field
    const grassGrad = ctx.createLinearGradient(0, 460, 0, 768);
    grassGrad.addColorStop(0, '#66bb6a');
    grassGrad.addColorStop(0.3, '#4caf50');
    grassGrad.addColorStop(0.7, '#43a047');
    grassGrad.addColorStop(1, '#388e3c');
    ctx.fillStyle = grassGrad;
    ctx.fillRect(0, 460, 1024, 308);

    // Grass blades detail
    for (let i = 0; i < 300; i++) {
      const gx = Math.random() * 1024;
      const gy = 470 + Math.random() * 280;
      const gh = 8 + Math.random() * 20;
      ctx.strokeStyle = `rgba(${30 + Math.random() * 40}, ${100 + Math.random() * 80}, ${20 + Math.random() * 30}, 0.4)`;
      ctx.lineWidth = 1 + Math.random();
      ctx.beginPath();
      ctx.moveTo(gx, gy);
      ctx.lineTo(gx + (Math.random() - 0.5) * 6, gy - gh);
      ctx.stroke();
    }

    // Small trees in distance
    const drawTree = (tx: number, ty: number, s: number) => {
      ctx.fillStyle = '#5d4037';
      ctx.fillRect(tx - 2 * s, ty, 4 * s, 15 * s);
      ctx.fillStyle = '#2e7d32';
      ctx.beginPath();
      ctx.arc(tx, ty - 5 * s, 14 * s, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = '#1b5e20';
      ctx.beginPath();
      ctx.arc(tx + 5 * s, ty - 2 * s, 10 * s, 0, Math.PI * 2);
      ctx.fill();
    };
    drawTree(150, 440, 0.8);
    drawTree(450, 430, 1.0);
    drawTree(750, 445, 0.7);
    drawTree(950, 435, 0.9);

    // Sun glow top right
    const sunGrad = ctx.createRadialGradient(850, 60, 10, 850, 60, 150);
    sunGrad.addColorStop(0, 'rgba(255, 253, 220, 0.9)');
    sunGrad.addColorStop(0.3, 'rgba(255, 248, 180, 0.4)');
    sunGrad.addColorStop(1, 'rgba(255, 248, 180, 0)');
    ctx.fillStyle = sunGrad;
    ctx.beginPath();
    ctx.arc(850, 60, 150, 0, Math.PI * 2);
    ctx.fill();

    // Sun disc
    ctx.fillStyle = '#fff9c4';
    ctx.beginPath();
    ctx.arc(850, 60, 25, 0, Math.PI * 2);
    ctx.fill();

    const tex = new THREE.CanvasTexture(canvas);
    tex.generateMipmaps = false;
    tex.minFilter = THREE.LinearFilter;
    tex.magFilter = THREE.LinearFilter;
    return tex;
  }, []);

  // =====================================================================
  // 3. CONTINUOUS EXTRUDED RIBBON GEOMETRIES ALONG THE SPLINE CURVE
  // =====================================================================
  const { floorGeo, ceilingGeo, leftWallGeo, rightWallGeo, ceilingLightGeo } = useMemo(() => {
    const halfW = TUNNEL_WIDTH / 2;
    const halfH = TUNNEL_HEIGHT / 2;
    const lightStripHalfW = 0.35;

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

      const flL = pt.clone().add(normal.clone().multiplyScalar(-halfW));
      flL.y = -halfH;
      const flR = pt.clone().add(normal.clone().multiplyScalar(halfW));
      flR.y = -halfH;

      const ceL = pt.clone().add(normal.clone().multiplyScalar(-halfW));
      ceL.y = halfH;
      const ceR = pt.clone().add(normal.clone().multiplyScalar(halfW));
      ceR.y = halfH;

      const clL = pt.clone().add(normal.clone().multiplyScalar(-lightStripHalfW));
      clL.y = halfH - 0.03;
      const clR = pt.clone().add(normal.clone().multiplyScalar(lightStripHalfW));
      clR.y = halfH - 0.03;

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
  // 4. ARCHITECTURAL MATERIALS — BRIGHT SUNLIT BEIGE CORRIDOR
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

  // Warm beige plaster walls — clean, elegant
  const wallMaterial = useMemo(
    () =>
      new THREE.MeshStandardMaterial({
        color: '#f0e6d6',
        roughness: 0.65,
        metalness: 0.02,
        side: THREE.DoubleSide,
      }),
    []
  );

  // Light warm beige ceiling
  const ceilingMaterial = useMemo(
    () =>
      new THREE.MeshStandardMaterial({
        color: '#f5efe6',
        roughness: 0.7,
        metalness: 0.02,
        side: THREE.DoubleSide,
      }),
    []
  );

  // Bright white LED ceiling strip
  const ceilingLightMaterial = useMemo(
    () =>
      new THREE.MeshBasicMaterial({
        color: '#ffffff',
      }),
    []
  );

  // Window frame material — elegant white painted wood
  const windowFrameMaterial = useMemo(
    () =>
      new THREE.MeshStandardMaterial({
        color: '#fafafa',
        roughness: 0.4,
        metalness: 0.05,
      }),
    []
  );

  // Window glass material — the view texture
  const windowGlassMaterial = useMemo(
    () =>
      new THREE.MeshBasicMaterial({
        map: outdoorViewTex,
        toneMapped: false,
        side: THREE.DoubleSide,
      }),
    [outdoorViewTex]
  );

  // =====================================================================
  // 5. GLASS WINDOWS WITH OUTDOOR VIEWS — Between Each Shelf
  // Placed at regular intervals along the corridor walls
  // =====================================================================
  const windows = useMemo(() => {
    const halfW = TUNNEL_WIDTH / 2;
    const list = [];
    // Place windows at t intervals between shelf positions
    const windowTs = [0.08, 0.20, 0.32, 0.44, 0.56, 0.68, 0.80, 0.92];

    for (let i = 0; i < windowTs.length; i++) {
      const t = windowTs[i];
      const pt = tunnelCurve.getPointAt(t);
      const tangent = tunnelCurve.getTangentAt(t).normalize();
      const normal = new THREE.Vector3(-tangent.z, 0, tangent.x).normalize();

      // Alternate left and right walls
      const isLeft = i % 2 === 0;
      const wallOffset = isLeft ? (-halfW + 0.02) : (halfW - 0.02);
      const windowPos = pt.clone().add(normal.clone().multiplyScalar(wallOffset));
      windowPos.y = 0.5; // Eye-level windows

      // Rotation: face inward toward the corridor
      const inwardDir = pt.clone().sub(windowPos).setY(0).normalize();
      const rotY = Math.atan2(inwardDir.x, inwardDir.z);

      list.push({
        position: [windowPos.x, windowPos.y, windowPos.z] as [number, number, number],
        rotation: [0, rotY, 0] as [number, number, number],
      });
    }
    return list;
  }, []);

  // =====================================================================
  // 6. SUBTLE CROWN MOLDING PROFILE ALONG TOP WALL-CEILING JUNCTION
  // =====================================================================
  const crownMoldingPositions = useMemo(() => {
    const halfW = TUNNEL_WIDTH / 2;
    const halfH = TUNNEL_HEIGHT / 2;
    const positions = [];
    const count = 80;
    for (let i = 0; i < count; i++) {
      const t = i / (count - 1);
      const pt = tunnelCurve.getPointAt(t);
      const tangent = tunnelCurve.getTangentAt(t).normalize();
      const normal = new THREE.Vector3(-tangent.z, 0, tangent.x).normalize();
      const rotY = Math.atan2(tangent.x, tangent.z);

      // Left molding
      const leftPos = pt.clone().add(normal.clone().multiplyScalar(-halfW + 0.08));
      leftPos.y = halfH - 0.08;

      // Right molding
      const rightPos = pt.clone().add(normal.clone().multiplyScalar(halfW - 0.08));
      rightPos.y = halfH - 0.08;

      positions.push(
        { position: [leftPos.x, leftPos.y, leftPos.z] as [number, number, number], rotY },
        { position: [rightPos.x, rightPos.y, rightPos.z] as [number, number, number], rotY }
      );
    }
    return positions;
  }, []);

  return (
    <group>
      {/* 1. Rich Hardwood Parquet Tile Floor */}
      <mesh geometry={floorGeo} material={floorMaterial} receiveShadow />

      {/* 2. Light Warm Beige Ceiling */}
      <mesh geometry={ceilingGeo} material={ceilingMaterial} />

      {/* 3. Bright White LED Strip along ceiling center */}
      <mesh geometry={ceilingLightGeo} material={ceilingLightMaterial} />

      {/* 4. Warm Beige Plaster Left Wall */}
      <mesh geometry={leftWallGeo} material={wallMaterial} receiveShadow />

      {/* 5. Warm Beige Plaster Right Wall */}
      <mesh geometry={rightWallGeo} material={wallMaterial} receiveShadow />

      {/* 6. Glass Windows with Outdoor Nature Views */}
      {windows.map((win, idx) => (
        <group key={`window-${idx}`} position={win.position} rotation={win.rotation}>
          {/* Window Frame — White painted elegant frame */}
          {/* Top frame bar */}
          <mesh position={[0, 0.75, 0]} material={windowFrameMaterial} castShadow>
            <boxGeometry args={[1.6, 0.08, 0.06]} />
          </mesh>
          {/* Bottom frame bar */}
          <mesh position={[0, -0.75, 0]} material={windowFrameMaterial} castShadow>
            <boxGeometry args={[1.6, 0.08, 0.06]} />
          </mesh>
          {/* Left frame bar */}
          <mesh position={[-0.78, 0, 0]} material={windowFrameMaterial} castShadow>
            <boxGeometry args={[0.06, 1.58, 0.06]} />
          </mesh>
          {/* Right frame bar */}
          <mesh position={[0.78, 0, 0]} material={windowFrameMaterial} castShadow>
            <boxGeometry args={[0.06, 1.58, 0.06]} />
          </mesh>
          {/* Center vertical divider (classic double-hung style) */}
          <mesh position={[0, 0, 0]} material={windowFrameMaterial}>
            <boxGeometry args={[0.03, 1.5, 0.04]} />
          </mesh>
          {/* Center horizontal divider */}
          <mesh position={[0, 0, 0]} material={windowFrameMaterial}>
            <boxGeometry args={[1.5, 0.03, 0.04]} />
          </mesh>

          {/* Glass pane with outdoor view texture */}
          <mesh position={[0, 0, -0.01]} material={windowGlassMaterial}>
            <planeGeometry args={[1.5, 1.5]} />
          </mesh>

          {/* Subtle sunlight glow through window */}
          <pointLight
            position={[0, 0, 0.3]}
            intensity={1.5}
            distance={8}
            color="#fff8e1"
            castShadow={false}
          />
        </group>
      ))}

      {/* 7. Subtle baseboard molding along floor edges (every 4th sample point) */}
      {crownMoldingPositions
        .filter((_, i) => i % 4 === 0)
        .map((item, idx) => (
          <mesh
            key={`molding-${idx}`}
            position={item.position}
            rotation={[0, item.rotY, 0]}
          >
            <boxGeometry args={[0.08, 0.08, 1.6]} />
            <meshStandardMaterial color="#ece3d5" roughness={0.5} metalness={0.03} />
          </mesh>
        ))}

      {/* 8. Bright Warm Sunlight-Style Point Lights Along Corridor */}
      {[0.04, 0.16, 0.28, 0.42, 0.56, 0.70, 0.84, 0.96].map((tVal, idx) => {
        const pt = tunnelCurve.getPointAt(tVal);
        return (
          <group key={idx}>
            {/* Warm overhead gallery wash */}
            <pointLight
              position={[pt.x, 1.85, pt.z]}
              intensity={1.8}
              distance={16}
              color="#fff8e1"
              castShadow={false}
            />
            {/* Low warm floor fill */}
            <pointLight
              position={[pt.x, -1.5, pt.z]}
              intensity={0.5}
              distance={10}
              color="#ffe0b2"
              castShadow={false}
            />
          </group>
        );
      })}
    </group>
  );
}
