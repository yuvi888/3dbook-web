/* eslint-disable @typescript-eslint/no-explicit-any */
'use client';

import { Suspense, useState, useRef } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import { OrbitControls, useGLTF, ContactShadows } from '@react-three/drei';
import Link from 'next/link';

// Fixed warm LED intensity at 30%
const FIXED_LED_INTENSITY = 0.3;

// Light points mapped specifically to each modern compartment
const LIGHT_CONFIGS = [
  // Top-Left niche (y = 0.95m)
  { y: 0.95, xs: [-0.64, -0.42] },
  // Top-Right panoramic shelf (y = 0.95m)
  { y: 0.95, xs: [-0.05, 0.25, 0.55, 0.75] },
  // Center-Left HERO DOUBLE-HEIGHT GALLERY NICHE (y = 0.46m, cascades down 0.95m tall alcove!)
  { y: 0.46, xs: [-0.64, -0.42] },
  // Center-Right upper shelf (y = 0.46m)
  { y: 0.46, xs: [-0.05, 0.25, 0.55, 0.75] },
  // Center-Right lower cubbies (y = -0.03m)
  { y: -0.03, xs: [0.08, 0.60] },
  // Bottom full-width shelf (y = -0.52m)
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
      {LIGHT_CONFIGS.map((tier, tierIdx) =>
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

useGLTF.preload('/models/bookshelf_minimal_white.glb');

export default function ModelViewerPage() {
  const [autoRotate, setAutoRotate] = useState(false);

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
            <h1 className="text-sm font-bold tracking-wider uppercase text-white font-serif">
              3D Model Studio Inspector
            </h1>
            <p className="text-[11px] text-amber-400 font-mono">
              bookshelf_minimal_white.glb (87.2 KB • Modern Architectural Layout • Fixed 30% LED)
            </p>
          </div>
        </div>

        {/* Status & Live Controls */}
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-neutral-900 border border-white/10 text-xs">
            <span className="w-2 h-2 rounded-full bg-amber-400 shadow-[0_0_8px_rgba(251,191,36,0.6)]"></span>
            <span className="text-neutral-400">LED Glow:</span>
            <span className="text-amber-300 font-mono font-semibold">30% (Fixed)</span>
          </div>

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
            href="/models/bookshelf_minimal_white.glb"
            download="bookshelf_minimal_white.glb"
            className="px-4 py-1.5 rounded-full text-xs font-bold bg-white text-neutral-950 hover:bg-neutral-200 transition-colors shadow-lg cursor-pointer"
          >
            Download .GLB
          </a>
        </div>
      </header>

      {/* 3D Viewport with OrbitControls */}
      <div className="w-full h-full">
        <Canvas
          camera={{ position: [0, 0.05, 3.2], fov: 44 }}
          gl={{ antialias: true }}
          style={{ width: '100%', height: '100%' }}
        >
          {/* Subtle studio lighting */}
          <ambientLight intensity={0.95} color="#fffcf7" />
          <directionalLight position={[0, 0, 4.0]} intensity={0.55} color="#ffffff" />
          <directionalLight position={[3, 4, 3]} intensity={0.45} color="#ffffff" />
          <directionalLight position={[-3, 4, 3]} intensity={0.35} color="#f8fafc" />

          <Suspense fallback={null}>
            <BookshelfModel autoRotate={autoRotate} />

            {/* Soft drop shadow strictly on floor plane beneath base plinth (y = -1.045m) */}
            <ContactShadows
              position={[0, -1.045, 0]}
              opacity={0.45}
              scale={3.8}
              blur={2.0}
              far={1.2}
              color="#000000"
            />
          </Suspense>

          <OrbitControls
            enablePan={true}
            enableZoom={true}
            enableRotate={true}
            minDistance={1.2}
            maxDistance={6.0}
            target={[0, 0, 0]}
            maxPolarAngle={Math.PI / 2 + 0.05}
          />
        </Canvas>
      </div>

      {/* Bottom Hint */}
      <div className="absolute bottom-6 left-1/2 -translate-x-1/2 z-30 px-5 py-2 rounded-full bg-neutral-950/80 backdrop-blur-md border border-white/10 text-neutral-400 text-xs flex items-center gap-2 pointer-events-none shadow-2xl">
        <span className="text-amber-400">✦</span>
        <span>Click & drag to rotate 360° • Scroll mouse wheel to zoom in & inspect architectural layout</span>
      </div>
    </div>
  );
}
