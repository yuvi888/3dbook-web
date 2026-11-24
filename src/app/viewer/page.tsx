/* eslint-disable @typescript-eslint/no-explicit-any */
'use client';

import { Suspense, useState, useRef, useMemo } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import { OrbitControls, useGLTF, ContactShadows } from '@react-three/drei';
import * as THREE from 'three';
import Link from 'next/link';

// Fixed warm LED intensity at 30% for bookshelf
const FIXED_LED_INTENSITY = 0.3;

const BOOKSHELF_LIGHTS = [
  { y: 0.95, xs: [-0.64, -0.42] },
  { y: 0.95, xs: [-0.05, 0.25, 0.55, 0.75] },
  { y: 0.46, xs: [-0.64, -0.42] },
  { y: 0.46, xs: [-0.05, 0.25, 0.55, 0.75] },
  { y: -0.03, xs: [0.08, 0.6] },
  { y: -0.52, xs: [-0.6, -0.3, 0.0, 0.3, 0.6] },
];

function BookshelfModel({ autoRotate }: { autoRotate: boolean }) {
  const gltf = useGLTF('/models/bookshelf_minimal_white.glb') as any;
  const groupRef = useRef<any>();

  useFrame((_, delta) => {
    if (autoRotate && groupRef.current) {
      groupRef.current.rotation.y += delta * 0.35;
    }
  });

  return (
    <group ref={groupRef} position={[0, 0, 0]}>
      <primitive object={gltf.scene.clone()} />

      {/* Fixed 30% soft architectural LED cove illumination */}
      {BOOKSHELF_LIGHTS.map((tier, tierIdx) =>
        tier.xs.map((x, xIdx) => (
          <pointLight
            key={`light-${tierIdx}-${xIdx}`}
            position={[x, tier.y, -0.15]}
            color="#ffdfa4"
            intensity={FIXED_LED_INTENSITY * 0.32}
            distance={0.85}
            decay={2}
          />
        ))
      )}
    </group>
  );
}

// ---------------------------------------------------------------------------
// PHOTOREALISTIC BOTANICAL PLANT POT WITH TRANSPARENT LEAF CARDS
// ---------------------------------------------------------------------------
function CurvedLeafCard({
  width,
  length,
  texture,
  position,
  rotation,
}: {
  width: number;
  length: number;
  texture: THREE.Texture;
  position: [number, number, number];
  rotation: [number, number, number];
}) {
  const geo = useMemo(() => {
    const g = new THREE.PlaneGeometry(width, length, 6, 8);
    const pos = g.attributes.position;
    for (let i = 0; i < pos.count; i++) {
      const x = pos.getX(i);
      const y = pos.getY(i);
      const normY = (y + length / 2) / length;
      const distFromCenter = Math.abs(x) / (width / 2);
      // Natural 3D cupping across leaf wings
      const cupZ = Math.pow(distFromCenter, 1.4) * (width * 0.16);
      // Natural arching droop along leaf length
      const droopZ = -Math.sin(normY * Math.PI * 0.8) * (length * 0.22);
      pos.setZ(i, cupZ + droopZ);
    }
    g.computeVertexNormals();
    return g;
  }, [width, length]);

  return (
    <mesh geometry={geo} position={position} rotation={rotation} castShadow receiveShadow>
      <meshStandardMaterial
        map={texture}
        transparent={true}
        alphaTest={0.06}
        depthWrite={true}
        side={THREE.DoubleSide}
        roughness={0.28}
        metalness={0.01}
      />
    </mesh>
  );
}

function StemTube({
  start,
  end,
  midArch = 0.014,
}: {
  start: [number, number, number];
  end: [number, number, number];
  midArch?: number;
}) {
  const geo = useMemo(() => {
    const p0 = new THREE.Vector3(...start);
    const p2 = new THREE.Vector3(...end);
    const p1 = new THREE.Vector3(
      (p0.x + p2.x) / 2,
      (p0.y + p2.y) / 2 + midArch,
      (p0.z + p2.z) / 2
    );
    const curve = new THREE.CatmullRomCurve3([p0, p1, p2]);
    return new THREE.TubeGeometry(curve, 8, 0.0013, 6, false);
  }, [start, end, midArch]);

  return (
    <mesh geometry={geo} castShadow>
      <meshStandardMaterial color="#4a7936" roughness={0.42} />
    </mesh>
  );
}

function TrailingPothosPlantPot({ autoRotate }: { autoRotate: boolean }) {
  const groupRef = useRef<any>();

  useFrame((_, delta) => {
    if (autoRotate && groupRef.current) {
      groupRef.current.rotation.y += delta * 0.38;
    }
  });

  // Load transparent PNG leaf textures
  const textures = useMemo(() => {
    const loader = new THREE.TextureLoader();
    const load = (path: string) => {
      const tex = loader.load(path);
      tex.colorSpace = THREE.SRGBColorSpace;
      return tex;
    };
    return {
      heart: load('/textures/leaf_heart.png'),
      curved: load('/textures/leaf_curved.png'),
      young: load('/textures/leaf_young.png'),
      droop: load('/textures/leaf_droop.png'),
    };
  }, []);

  const potRadius = 0.068;
  const potHeight = 0.125;
  const soilY = potHeight - 0.014;

  // Realistic leaf card placements
  const crownLeaves = [
    // Center young sprouting leaves
    { pos: [0.015, soilY + 0.075, 0.012], rot: [0.5, 0.2, 0.1], w: 0.046, len: 0.068, tex: textures.young },
    { pos: [-0.012, soilY + 0.082, -0.014], rot: [0.45, 2.2, -0.1], w: 0.048, len: 0.070, tex: textures.young },
    { pos: [0.02, soilY + 0.086, -0.015], rot: [0.4, 4.1, 0.15], w: 0.045, len: 0.066, tex: textures.young },

    // Mid-tier canopy leaves (spreading)
    { pos: [-0.045, soilY + 0.062, 0.035], rot: [0.75, 0.8, -0.2], w: 0.068, len: 0.085, tex: textures.heart },
    { pos: [0.052, soilY + 0.058, 0.028], rot: [0.82, -0.5, 0.25], w: 0.072, len: 0.090, tex: textures.curved },
    { pos: [0.038, soilY + 0.065, -0.048], rot: [0.78, -2.4, -0.18], w: 0.066, len: 0.084, tex: textures.heart },
    { pos: [-0.055, soilY + 0.060, -0.032], rot: [0.80, 2.7, 0.22], w: 0.070, len: 0.088, tex: textures.curved },
    { pos: [-0.018, soilY + 0.068, 0.058], rot: [0.85, 0.3, 0.15], w: 0.069, len: 0.086, tex: textures.heart },
    { pos: [0.015, soilY + 0.064, -0.058], rot: [0.76, 3.2, -0.2], w: 0.067, len: 0.083, tex: textures.curved },

    // Outer spreading leaves
    { pos: [-0.068, soilY + 0.045, 0.048], rot: [1.05, 0.9, -0.3], w: 0.078, len: 0.096, tex: textures.heart },
    { pos: [0.072, soilY + 0.042, 0.042], rot: [1.12, -0.7, 0.32], w: 0.080, len: 0.098, tex: textures.curved },
    { pos: [0.058, soilY + 0.046, -0.062], rot: [1.02, -2.2, -0.25], w: 0.075, len: 0.094, tex: textures.heart },
    { pos: [-0.074, soilY + 0.040, -0.045], rot: [1.10, 2.5, 0.28], w: 0.079, len: 0.097, tex: textures.curved },
  ];

  // Cascading trailing leaves spilling down the pot sides
  const trailingLeaves = [
    // Front-Left trailing vine
    { pos: [-0.065, soilY - 0.005, 0.058], rot: [1.45, 0.6, -0.35], w: 0.068, len: 0.084, tex: textures.droop },
    { pos: [-0.078, soilY - 0.038, 0.062], rot: [1.60, 0.5, -0.28], w: 0.064, len: 0.078, tex: textures.droop },
    { pos: [-0.082, soilY - 0.072, 0.058], rot: [1.65, 0.45, -0.22], w: 0.058, len: 0.072, tex: textures.droop },
    { pos: [-0.076, soilY - 0.105, 0.052], rot: [1.70, 0.40, -0.18], w: 0.052, len: 0.065, tex: textures.young },

    // Right trailing vine
    { pos: [0.068, soilY - 0.008, 0.042], rot: [1.42, -0.6, 0.35], w: 0.066, len: 0.082, tex: textures.droop },
    { pos: [0.078, soilY - 0.042, 0.036], rot: [1.58, -0.5, 0.28], w: 0.062, len: 0.076, tex: textures.droop },
    { pos: [0.080, soilY - 0.078, 0.028], rot: [1.64, -0.42, 0.20], w: 0.056, len: 0.070, tex: textures.droop },

    // Front soft trailing vine
    { pos: [0.012, soilY - 0.012, 0.072], rot: [1.50, 0.1, 0.12], w: 0.065, len: 0.080, tex: textures.droop },
    { pos: [0.018, soilY - 0.048, 0.078], rot: [1.62, 0.05, 0.10], w: 0.058, len: 0.072, tex: textures.droop },
  ];

  return (
    <group ref={groupRef} position={[0, -0.02, 0]}>
      {/* 1. CERAMIC POT (Hollow, open-top minimalist cylinder) */}
      <group position={[0, 0, 0]}>
        {/* Outer Cylinder Wall */}
        <mesh position={[0, potHeight / 2, 0]} castShadow receiveShadow>
          <cylinderGeometry args={[potRadius, potRadius * 0.94, potHeight, 48, 1, true]} />
          <meshStandardMaterial color="#f8f6f1" roughness={0.34} metalness={0.01} side={THREE.DoubleSide} />
        </mesh>

        {/* Inner Cylinder Wall */}
        <mesh position={[0, potHeight / 2, 0]}>
          <cylinderGeometry args={[potRadius - 0.005, potRadius * 0.94 - 0.005, potHeight, 48, 1, true]} />
          <meshStandardMaterial color="#f8f6f1" roughness={0.34} metalness={0.01} side={THREE.DoubleSide} />
        </mesh>

        {/* Smooth Rounded Ceramic Rim Lip */}
        <mesh position={[0, potHeight, 0]} rotation={[Math.PI / 2, 0, 0]}>
          <torusGeometry args={[potRadius - 0.0025, 0.0035, 16, 48]} />
          <meshStandardMaterial color="#f8f6f1" roughness={0.34} metalness={0.01} />
        </mesh>

        {/* Bottom Base Plate */}
        <mesh position={[0, 0.002, 0]} rotation={[-Math.PI / 2, 0, 0]}>
          <circleGeometry args={[potRadius * 0.94, 48]} />
          <meshStandardMaterial color="#f8f6f1" roughness={0.34} metalness={0.01} />
        </mesh>

        {/* Recessed Dark Organic Potting Soil */}
        <mesh position={[0, soilY, 0]} rotation={[-Math.PI / 2, 0, 0]} receiveShadow>
          <circleGeometry args={[potRadius - 0.006, 36]} />
          <meshStandardMaterial color="#1a120b" roughness={0.96} metalness={0.0} />
        </mesh>

        {/* Decorative River Pebbles on Soil */}
        {[
          [-0.028, soilY + 0.004, 0.022, 0.007],
          [0.022, soilY + 0.003, -0.024, 0.006],
          [-0.01, soilY + 0.004, -0.030, 0.008],
          [0.032, soilY + 0.003, 0.016, 0.006],
        ].map(([x, y, z, s], i) => (
          <mesh key={i} position={[x, y, z]} scale={[1, 0.55, 0.85]}>
            <sphereGeometry args={[s, 10, 8]} />
            <meshStandardMaterial color="#6a635b" roughness={0.52} />
          </mesh>
        ))}
      </group>

      {/* 2. PETIOLE STEMS */}
      {crownLeaves.map((leaf, idx) => (
        <StemTube
          key={`stem-crown-${idx}`}
          start={[leaf.pos[0] * 0.22, soilY + 0.002, leaf.pos[2] * 0.22]}
          end={leaf.pos as [number, number, number]}
          midArch={0.012}
        />
      ))}

      {/* Trailing Vine Main Stems */}
      <StemTube start={[-0.02, soilY + 0.004, 0.02]} end={[-0.075, soilY - 0.10, 0.052]} midArch={0.025} />
      <StemTube start={[0.02, soilY + 0.004, 0.015]} end={[0.08, soilY - 0.075, 0.028]} midArch={0.022} />
      <StemTube start={[0.01, soilY + 0.004, 0.025]} end={[0.018, soilY - 0.045, 0.078]} midArch={0.018} />

      {/* 3. PHOTOGRAPHIC TRANSPARENT LEAVES */}
      {crownLeaves.map((leaf, idx) => (
        <CurvedLeafCard
          key={`leaf-crown-${idx}`}
          width={leaf.w}
          length={leaf.len}
          texture={leaf.tex}
          position={leaf.pos as [number, number, number]}
          rotation={leaf.rot as [number, number, number]}
        />
      ))}

      {trailingLeaves.map((leaf, idx) => (
        <CurvedLeafCard
          key={`leaf-trailing-${idx}`}
          width={leaf.w}
          length={leaf.len}
          texture={leaf.tex}
          position={leaf.pos as [number, number, number]}
          rotation={leaf.rot as [number, number, number]}
        />
      ))}
    </group>
  );
}

useGLTF.preload('/models/bookshelf_minimal_white.glb');

type ModelKey = 'plant' | 'bookshelf';

export default function ModelViewerPage() {
  const [selectedModel, setSelectedModel] = useState<ModelKey>('plant');
  const [autoRotate, setAutoRotate] = useState(false);

  const modelInfo = {
    plant: {
      name: 'Photorealistic Trailing Pothos Planter',
      fileName: 'plant_pot_realistic.glb',
      fileSize: 'Realistic Botanical Textures',
      subTitle: 'Transparent Photographic Leaves • Hollow Ceramic Pot • Dark Peat Soil',
      cameraPos: [0, 0.17, 0.42] as [number, number, number],
      cameraFov: 40,
      shadowPos: [0, -0.02, 0] as [number, number, number],
      shadowScale: 0.38,
    },
    bookshelf: {
      name: 'Modern Architectural Bookshelf',
      fileName: 'bookshelf_minimal_white.glb',
      fileSize: '87.2 KB',
      subTitle: 'Double-Height Gallery Niche • Multi-Tier Modern Grid • Fixed 30% LED',
      cameraPos: [0, 0.05, 3.2] as [number, number, number],
      cameraFov: 44,
      shadowPos: [0, -1.045, 0] as [number, number, number],
      shadowScale: 3.8,
    },
  }[selectedModel];

  return (
    <div className="w-full h-screen bg-[#111113] text-neutral-100 flex flex-col relative overflow-hidden select-none font-sans">
      {/* Top Header & Controls */}
      <header className="absolute top-0 left-0 right-0 z-30 px-6 py-4 flex items-center justify-between bg-neutral-950/70 backdrop-blur-xl border-b border-white/10">
        <div className="flex items-center gap-3">
          <Link
            href="/"
            className="w-8 h-8 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center text-xs text-white transition-colors"
          >
            ←
          </Link>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-sm font-bold tracking-wider uppercase text-white font-serif">
                3D Model Studio
              </h1>
              <span className="text-[10px] px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 font-mono font-semibold">
                ACTIVE
              </span>
            </div>
            <p className="text-[11px] text-amber-400 font-mono">
              {modelInfo.fileName} ({modelInfo.subTitle})
            </p>
          </div>
        </div>

        {/* Model Switcher Tabs & Live Controls */}
        <div className="flex items-center gap-3">
          {/* Model Switcher */}
          <div className="flex items-center bg-neutral-900/90 p-1 rounded-full border border-white/15">
            <button
              onClick={() => setSelectedModel('plant')}
              className={`px-3 py-1 rounded-full text-xs font-semibold transition-all cursor-pointer ${
                selectedModel === 'plant'
                  ? 'bg-emerald-600 text-white shadow-md font-bold'
                  : 'text-neutral-400 hover:text-white'
              }`}
            >
              🌿 Pothos Plant Pot
            </button>
            <button
              onClick={() => setSelectedModel('bookshelf')}
              className={`px-3 py-1 rounded-full text-xs font-semibold transition-all cursor-pointer ${
                selectedModel === 'bookshelf'
                  ? 'bg-amber-600 text-white shadow-md font-bold'
                  : 'text-neutral-400 hover:text-white'
              }`}
            >
              📚 Bookshelf
            </button>
          </div>

          {selectedModel === 'bookshelf' && (
            <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-neutral-900 border border-white/10 text-xs">
              <span className="w-2 h-2 rounded-full bg-amber-400 shadow-[0_0_8px_rgba(251,191,36,0.6)]"></span>
              <span className="text-neutral-400">LED:</span>
              <span className="text-amber-300 font-mono font-semibold">30%</span>
            </div>
          )}

          <button
            onClick={() => setAutoRotate(!autoRotate)}
            className={`px-3 py-1.5 rounded-full text-xs font-semibold border transition-all cursor-pointer ${
              autoRotate
                ? 'bg-amber-500 text-neutral-950 border-amber-400 shadow-md font-bold'
                : 'bg-neutral-900 text-neutral-300 border-white/15 hover:bg-white/10'
            }`}
          >
            {autoRotate ? 'Rotating ON' : 'Auto Rotate'}
          </button>

          <a
            href={
              selectedModel === 'plant'
                ? '/models/plant_pot_realistic.glb'
                : '/models/bookshelf_minimal_white.glb'
            }
            download={
              selectedModel === 'plant'
                ? 'plant_pot_realistic.glb'
                : 'bookshelf_minimal_white.glb'
            }
            className="px-4 py-1.5 rounded-full text-xs font-bold bg-white text-neutral-950 hover:bg-neutral-200 transition-colors shadow-lg cursor-pointer"
          >
            Download .GLB
          </a>
        </div>
      </header>

      {/* 3D Viewport with OrbitControls */}
      <div className="w-full h-full">
        <Canvas
          key={selectedModel}
          camera={{ position: modelInfo.cameraPos, fov: modelInfo.cameraFov }}
          gl={{ antialias: true }}
          style={{ width: '100%', height: '100%' }}
        >
          {/* Studio Lighting */}
          <ambientLight intensity={selectedModel === 'plant' ? 1.05 : 0.95} color="#fffcf7" />
          <directionalLight
            position={[2.0, 3.5, 2.5]}
            intensity={selectedModel === 'plant' ? 1.5 : 0.55}
            color="#fffdf5"
            castShadow
          />
          <directionalLight
            position={[-2.5, 2.0, 1.0]}
            intensity={selectedModel === 'plant' ? 0.75 : 0.45}
            color="#f0fdf4"
          />
          <directionalLight
            position={[0, -1.0, 2.0]}
            intensity={0.3}
            color="#fffbeb"
          />

          <Suspense fallback={null}>
            {selectedModel === 'plant' ? (
              <TrailingPothosPlantPot autoRotate={autoRotate} />
            ) : (
              <BookshelfModel autoRotate={autoRotate} />
            )}

            {/* Soft drop shadow strictly on floor plane */}
            <ContactShadows
              position={modelInfo.shadowPos}
              opacity={selectedModel === 'plant' ? 0.6 : 0.45}
              scale={modelInfo.shadowScale}
              blur={1.8}
              far={1.0}
              color="#000000"
            />
          </Suspense>

          <OrbitControls
            enablePan={true}
            enableZoom={true}
            enableRotate={true}
            minDistance={selectedModel === 'plant' ? 0.2 : 1.2}
            maxDistance={selectedModel === 'plant' ? 1.6 : 6.0}
            target={selectedModel === 'plant' ? [0, 0.06, 0] : [0, 0, 0]}
            maxPolarAngle={Math.PI / 2 + 0.05}
          />
        </Canvas>
      </div>

      {/* Bottom Hint */}
      <div className="absolute bottom-6 left-1/2 -translate-x-1/2 z-30 px-5 py-2 rounded-full bg-neutral-950/80 backdrop-blur-md border border-white/10 text-neutral-400 text-xs flex items-center gap-2 pointer-events-none shadow-2xl">
        <span className="text-emerald-400">✦</span>
        <span>
          {selectedModel === 'plant'
            ? 'Click & drag to rotate 360° • Scroll to inspect photographic transparent leaves & ceramic finish'
            : 'Click & drag to rotate 360° • Scroll mouse wheel to inspect architectural compartments'}
        </span>
      </div>
    </div>
  );
}
