/* eslint-disable @typescript-eslint/no-explicit-any */
'use client';

import { Suspense, useState, useRef } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import { OrbitControls, useGLTF, ContactShadows } from '@react-three/drei';
import Link from 'next/link';

function BookshelfModel({
  autoRotate,
  ledIntensity,
}: {
  autoRotate: boolean;
  ledIntensity: number;
}) {
  const gltf = useGLTF('/models/bookshelf_minimal_white.glb') as any;
  const groupRef = useRef<any>();

  useFrame((_, delta) => {
    if (autoRotate && groupRef.current) {
      groupRef.current.rotation.y += delta * 0.4;
    }
  });

  return (
    <group ref={groupRef} position={[0, -0.9, 0]}>
      <primitive object={gltf.scene.clone()} />

      {/* Gentle physical soft point light at the REAR of each shelf washing over the backboard */}
      {[0.75, 0.4, 0.05, -0.3, -0.65].map((y, idx) => (
        <pointLight
          key={idx}
          position={[0, y, -0.15]}
          color="#ffdfa4"
          intensity={ledIntensity}
          distance={0.85}
          decay={2}
        />
      ))}
    </group>
  );
}

useGLTF.preload('/models/bookshelf_minimal_white.glb');

export default function ModelViewerPage() {
  const [autoRotate, setAutoRotate] = useState(false);
  const [ledIntensity, setLedIntensity] = useState(0.35);

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
              bookshelf_minimal_white.glb (36.9 KB)
            </p>
          </div>
        </div>

        {/* Live Controls */}
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-neutral-900 border border-white/10 text-xs">
            <span className="text-neutral-400">LED Glow:</span>
            <input
              type="range"
              min="0"
              max="1"
              step="0.05"
              value={ledIntensity}
              onChange={(e) => setLedIntensity(parseFloat(e.target.value))}
              className="w-20 accent-amber-500 cursor-pointer"
            />
            <span className="text-amber-300 font-mono text-[10px]">
              {(ledIntensity * 100).toFixed(0)}%
            </span>
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
          camera={{ position: [0, 0.4, 3.2], fov: 45 }}
          gl={{ antialias: true }}
          style={{ width: '100%', height: '100%' }}
        >
          {/* Subtle studio lighting */}
          <ambientLight intensity={0.85} color="#fffcf5" />
          <directionalLight position={[3, 5, 4]} intensity={0.9} color="#ffffff" />
          <directionalLight position={[-3, 4, 3]} intensity={0.5} color="#f8fafc" />
          <directionalLight position={[0, -2, 3]} intensity={0.25} color="#fff7ed" />

          <Suspense fallback={null}>
            <BookshelfModel autoRotate={autoRotate} ledIntensity={ledIntensity} />

            {/* Soft drop shadow beneath bookshelf */}
            <ContactShadows
              position={[0, -0.9, 0]}
              opacity={0.65}
              scale={3.5}
              blur={1.8}
              far={1.5}
              color="#000000"
            />
          </Suspense>

          <OrbitControls
            enablePan={true}
            enableZoom={true}
            enableRotate={true}
            minDistance={1.2}
            maxDistance={6.0}
            maxPolarAngle={Math.PI / 2 + 0.05}
          />
        </Canvas>
      </div>

      {/* Bottom Hint */}
      <div className="absolute bottom-6 left-1/2 -translate-x-1/2 z-30 px-5 py-2 rounded-full bg-neutral-950/80 backdrop-blur-md border border-white/10 text-neutral-400 text-xs flex items-center gap-2 pointer-events-none shadow-2xl">
        <span className="text-amber-400">✦</span>
        <span>Click & drag to rotate 360° • Scroll mouse wheel to zoom in & inspect details</span>
      </div>
    </div>
  );
}
