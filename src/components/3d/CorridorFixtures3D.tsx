'use client';

import { useMemo } from 'react';
import * as THREE from 'three';

function createSoftGlowMap(mode: 'ceiling' | 'sconce'): THREE.CanvasTexture | null {
  if (typeof window === 'undefined') return null;
  const w = 256;
  const h = mode === 'sconce' ? 512 : 256;
  const canvas = document.createElement('canvas');
  canvas.width = w;
  canvas.height = h;
  const ctx = canvas.getContext('2d');
  if (!ctx) return null;

  ctx.clearRect(0, 0, w, h);

  if (mode === 'ceiling') {
    const grad = ctx.createRadialGradient(w / 2, h / 2, 10, w / 2, h / 2, w * 0.5);
    grad.addColorStop(0.0, 'rgba(255, 224, 158, 0.45)');
    grad.addColorStop(0.45, 'rgba(255, 212, 138, 0.18)');
    grad.addColorStop(1.0, 'rgba(255, 212, 138, 0.0)');
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, w, h);
  } else {
    // Upward & downward IES architectural sconce wash along plaster wall
    const drawCone = (cy: number, ry: number, alpha: number) => {
      ctx.save();
      ctx.translate(w / 2, cy);
      ctx.scale(1.0, ry / (w * 0.42));
      const g = ctx.createRadialGradient(0, 0, 4, 0, 0, w * 0.46);
      g.addColorStop(0.0, `rgba(255, 224, 154, ${alpha})`);
      g.addColorStop(0.45, `rgba(255, 208, 128, ${alpha * 0.45})`);
      g.addColorStop(1.0, 'rgba(255, 200, 110, 0.0)');
      ctx.fillStyle = g;
      ctx.beginPath();
      ctx.arc(0, 0, w * 0.46, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();
    };
    // Center bright bloom
    drawCone(h * 0.5, 48, 0.46);
    // Upper architectural wall cone
    drawCone(h * 0.29, 135, 0.34);
    // Lower architectural wall cone
    drawCone(h * 0.72, 135, 0.28);
  }

  const tex = new THREE.CanvasTexture(canvas);
  tex.colorSpace = THREE.SRGBColorSpace;
  tex.needsUpdate = true;
  return tex;
}

type SharedChandelierAssets = {
  brassMat: THREE.MeshStandardMaterial;
  polishedBrassMat: THREE.MeshStandardMaterial;
  globeMat: THREE.MeshStandardMaterial;
  medallionMat: THREE.MeshStandardMaterial;
  ceilingHaloMat: THREE.MeshBasicMaterial | null;
  outerRingGeo: THREE.BufferGeometry;
  innerRingGeo: THREE.BufferGeometry;
  globeGeo: THREE.BufferGeometry;
  cupGeo: THREE.BufferGeometry;
  finialGeo: THREE.BufferGeometry;
};

let cachedChandelierAssets: SharedChandelierAssets | null = null;

function getSharedChandelierAssets(): SharedChandelierAssets {
  if (cachedChandelierAssets) return cachedChandelierAssets;

  const brassMat = new THREE.MeshStandardMaterial({
    color: '#c9a458',
    roughness: 0.26,
    metalness: 0.88,
  });

  const polishedBrassMat = new THREE.MeshStandardMaterial({
    color: '#e0bd70',
    roughness: 0.16,
    metalness: 0.94,
  });

  const medallionMat = new THREE.MeshStandardMaterial({
    color: '#e7dcc8',
    roughness: 0.58,
    metalness: 0.04,
  });

  const globeMat = new THREE.MeshStandardMaterial({
    color: '#fffbf0',
    emissive: '#ffd996',
    emissiveIntensity: 1.55,
    roughness: 0.22,
    metalness: 0.02,
  });

  const haloTex = createSoftGlowMap('ceiling');
  const ceilingHaloMat = haloTex
    ? new THREE.MeshBasicMaterial({
        map: haloTex,
        transparent: true,
        opacity: 0.72,
        blending: THREE.AdditiveBlending,
        depthWrite: false,
        side: THREE.DoubleSide,
      })
    : null;

  const outerRingGeo = new THREE.TorusGeometry(0.42, 0.011, 14, 64);
  outerRingGeo.rotateX(Math.PI / 2);

  const innerRingGeo = new THREE.TorusGeometry(0.22, 0.009, 12, 48);
  innerRingGeo.rotateX(Math.PI / 2);

  const globeGeo = new THREE.SphereGeometry(0.048, 22, 18);
  const cupGeo = new THREE.CylinderGeometry(0.026, 0.016, 0.020, 20);
  const finialGeo = new THREE.ConeGeometry(0.022, 0.065, 20);
  finialGeo.rotateX(Math.PI);

  cachedChandelierAssets = {
    brassMat,
    polishedBrassMat,
    globeMat,
    medallionMat,
    ceilingHaloMat,
    outerRingGeo,
    innerRingGeo,
    globeGeo,
    cupGeo,
    finialGeo,
  };
  return cachedChandelierAssets;
}

export function CeilingChandelier3D({
  position,
  rotation = [0, 0, 0],
  scale = 1,
}: {
  position: [number, number, number];
  rotation?: [number, number, number];
  scale?: number;
}) {
  const {
    brassMat,
    polishedBrassMat,
    globeMat,
    medallionMat,
    ceilingHaloMat,
    outerRingGeo,
    innerRingGeo,
    globeGeo,
    cupGeo,
    finialGeo,
  } = useMemo(() => getSharedChandelierAssets(), []);

  const outerGlobes = useMemo(() => {
    const arr: Array<{ angle: number; x: number; z: number }> = [];
    for (let i = 0; i < 6; i++) {
      const a = (i * Math.PI * 2) / 6;
      arr.push({ angle: a, x: Math.cos(a) * 0.42, z: Math.sin(a) * 0.42 });
    }
    return arr;
  }, []);

  const innerGlobes = useMemo(() => {
    const arr: Array<{ angle: number; x: number; z: number }> = [];
    for (let i = 0; i < 4; i++) {
      const a = (i * Math.PI * 2) / 4 + Math.PI / 4;
      arr.push({ angle: a, x: Math.cos(a) * 0.22, z: Math.sin(a) * 0.22 });
    }
    return arr;
  }, []);

  return (
    <group position={position} rotation={rotation} scale={[scale, scale, scale]}>
      {/* Architectural plaster ceiling medallion ring */}
      <mesh position={[0, -0.008, 0]} material={medallionMat}>
        <cylinderGeometry args={[0.175, 0.195, 0.016, 36]} />
      </mesh>
      {/* Brushed brass canopy plate */}
      <mesh position={[0, -0.022, 0]} material={brassMat}>
        <cylinderGeometry args={[0.072, 0.088, 0.020, 32]} />
      </mesh>

      {/* Soft ceiling ambient bounce glow */}
      {ceilingHaloMat && (
        <mesh position={[0, -0.012, 0]} rotation={[Math.PI / 2, 0, 0]} material={ceilingHaloMat}>
          <planeGeometry args={[1.9, 1.9]} />
        </mesh>
      )}

      {/* Central suspension downrod + mid hub collars */}
      <mesh position={[0, -0.24, 0]} material={brassMat} castShadow>
        <cylinderGeometry args={[0.009, 0.009, 0.42, 16]} />
      </mesh>
      <mesh position={[0, -0.21, 0]} material={polishedBrassMat}>
        <cylinderGeometry args={[0.032, 0.032, 0.026, 24]} />
      </mesh>
      <mesh position={[0, -0.39, 0]} material={polishedBrassMat}>
        <cylinderGeometry args={[0.036, 0.030, 0.032, 24]} />
      </mesh>
      {/* Decorative lower brass drop finial */}
      <mesh position={[0, -0.435, 0]} geometry={finialGeo} material={polishedBrassMat} />
      <mesh position={[0, -0.475, 0]} material={polishedBrassMat}>
        <sphereGeometry args={[0.014, 16, 12]} />
      </mesh>

      {/* Upper Inner Brass Halo Tier (y = -0.21) */}
      <mesh position={[0, -0.21, 0]} geometry={innerRingGeo} material={brassMat} castShadow />
      {innerGlobes.map((g, idx) => (
        <group key={`inner-${idx}`}>
          {/* Radial brass spoke */}
          <mesh
            position={[g.x * 0.5, -0.21, g.z * 0.5]}
            rotation={[0, -g.angle, Math.PI / 2]}
            material={polishedBrassMat}
          >
            <cylinderGeometry args={[0.0045, 0.0045, 0.22, 8]} />
          </mesh>
          {/* Brass globe seat & frosted opal globe */}
          <mesh position={[g.x, -0.195, g.z]} geometry={cupGeo} material={polishedBrassMat} />
          <mesh position={[g.x, -0.155, g.z]} scale={[0.84, 0.84, 0.84]} geometry={globeGeo} material={globeMat} />
        </group>
      ))}

      {/* Main Outer Brass Halo Tier (y = -0.39) */}
      <mesh position={[0, -0.39, 0]} geometry={outerRingGeo} material={brassMat} castShadow />
      {outerGlobes.map((g, idx) => (
        <group key={`outer-${idx}`}>
          {/* Radial brass spoke arm from central lower hub */}
          <mesh
            position={[g.x * 0.5, -0.39, g.z * 0.5]}
            rotation={[0, -g.angle, Math.PI / 2]}
            material={brassMat}
          >
            <cylinderGeometry args={[0.0055, 0.0055, 0.42, 10]} />
          </mesh>
          {/* Delicate diagonal brass suspension tie rod */}
          <mesh
            position={[g.x * 0.46, -0.21, g.z * 0.46]}
            rotation={[0, -g.angle, 0.82]}
            material={polishedBrassMat}
          >
            <cylinderGeometry args={[0.0022, 0.0022, 0.44, 6]} />
          </mesh>
          {/* Brass cup + warm glowing frosted alabaster globe */}
          <mesh position={[g.x, -0.372, g.z]} geometry={cupGeo} material={polishedBrassMat} />
          <mesh position={[g.x, -0.328, g.z]} geometry={globeGeo} material={globeMat} />
        </group>
      ))}
    </group>
  );
}

type SharedSconceAssets = {
  brassMat: THREE.MeshStandardMaterial;
  polishedBrassMat: THREE.MeshStandardMaterial;
  alabasterShadeMat: THREE.MeshStandardMaterial;
  innerGlowMat: THREE.MeshStandardMaterial;
  wallWashMat: THREE.MeshBasicMaterial | null;
  backplateGeo: THREE.BufferGeometry;
  shadeGeo: THREE.BufferGeometry;
};

let cachedSconceAssets: SharedSconceAssets | null = null;

function getSharedSconceAssets(): SharedSconceAssets {
  if (cachedSconceAssets) return cachedSconceAssets;

  const brassMat = new THREE.MeshStandardMaterial({
    color: '#c9a354',
    roughness: 0.28,
    metalness: 0.86,
  });

  const polishedBrassMat = new THREE.MeshStandardMaterial({
    color: '#e0bd72',
    roughness: 0.16,
    metalness: 0.94,
  });

  const alabasterShadeMat = new THREE.MeshStandardMaterial({
    color: '#fbf3e2',
    emissive: '#ffd58c',
    emissiveIntensity: 1.05,
    roughness: 0.52,
    metalness: 0.02,
    side: THREE.DoubleSide,
  });

  const innerGlowMat = new THREE.MeshStandardMaterial({
    color: '#fff7e0',
    emissive: '#ffcf76',
    emissiveIntensity: 1.85,
    roughness: 0.2,
  });

  const washTex = createSoftGlowMap('sconce');
  const wallWashMat = washTex
    ? new THREE.MeshBasicMaterial({
        map: washTex,
        transparent: true,
        opacity: 0.62,
        blending: THREE.AdditiveBlending,
        depthWrite: false,
        side: THREE.DoubleSide,
      })
    : null;

  const backplateGeo = new THREE.CylinderGeometry(0.056, 0.058, 0.016, 28);
  backplateGeo.rotateX(Math.PI / 2);

  // Fluted architectural alabaster cylinder torchere shade (open top & bottom!)
  const shadeGeo = new THREE.CylinderGeometry(0.052, 0.040, 0.19, 28, 1, true);

  cachedSconceAssets = {
    brassMat,
    polishedBrassMat,
    alabasterShadeMat,
    innerGlowMat,
    wallWashMat,
    backplateGeo,
    shadeGeo,
  };
  return cachedSconceAssets;
}

export function WallSconce3D({
  position,
  rotation,
  scale = 1,
}: {
  position: [number, number, number];
  rotation: [number, number, number];
  scale?: number;
}) {
  const {
    brassMat,
    polishedBrassMat,
    alabasterShadeMat,
    innerGlowMat,
    wallWashMat,
    backplateGeo,
    shadeGeo,
  } = useMemo(() => getSharedSconceAssets(), []);

  return (
    <group position={position} rotation={rotation} scale={[scale, scale, scale]}>
      {/* Up-and-down warm IES architectural wall wash behind sconce */}
      {wallWashMat && (
        <mesh position={[0, 0.08, 0.006]} material={wallWashMat}>
          <planeGeometry args={[0.85, 1.55]} />
        </mesh>
      )}

      {/* Turned brushed brass circular wall backplate & outer rim */}
      <mesh position={[0, -0.02, 0.008]} geometry={backplateGeo} material={brassMat} castShadow />
      <mesh position={[0, -0.02, 0.018]} rotation={[Math.PI / 2, 0, 0]} material={polishedBrassMat}>
        <cylinderGeometry args={[0.028, 0.036, 0.014, 24]} />
      </mesh>

      {/* Horizontal & Vertical Articulated Brass Stem Arm */}
      <mesh position={[0, -0.02, 0.064]} rotation={[Math.PI / 2, 0, 0]} material={brassMat} castShadow>
        <cylinderGeometry args={[0.0065, 0.0065, 0.095, 14]} />
      </mesh>
      <mesh position={[0, -0.02, 0.110]} material={polishedBrassMat}>
        <sphereGeometry args={[0.011, 14, 10]} />
      </mesh>
      <mesh position={[0, 0.015, 0.110]} material={brassMat} castShadow>
        <cylinderGeometry args={[0.0065, 0.0065, 0.072, 14]} />
      </mesh>

      {/* Brass shade collar cup */}
      <mesh position={[0, 0.056, 0.110]} material={polishedBrassMat} castShadow>
        <cylinderGeometry args={[0.043, 0.016, 0.018, 24]} />
      </mesh>

      {/* Glowing Inner Filament Diffuser Core */}
      <mesh position={[0, 0.128, 0.110]} material={innerGlowMat}>
        <capsuleGeometry args={[0.014, 0.028, 6, 12]} />
      </mesh>

      {/* Fluted Glowing Alabaster / Oatmeal Cylindrical Wall Shade */}
      <mesh position={[0, 0.155, 0.110]} geometry={shadeGeo} material={alabasterShadeMat} castShadow />

      {/* Crisp Brass Top & Bottom Trim Rings on Shade */}
      <mesh position={[0, 0.250, 0.110]} rotation={[Math.PI / 2, 0, 0]} material={polishedBrassMat}>
        <torusGeometry args={[0.052, 0.0024, 10, 32]} />
      </mesh>
      <mesh position={[0, 0.060, 0.110]} rotation={[Math.PI / 2, 0, 0]} material={polishedBrassMat}>
        <torusGeometry args={[0.040, 0.0022, 10, 32]} />
      </mesh>
    </group>
  );
}
