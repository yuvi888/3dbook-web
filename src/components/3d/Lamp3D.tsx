'use client';

import { useRef, useState } from 'react';
import { useGLTF, Html } from '@react-three/drei';
import * as THREE from 'three';

interface Lamp3DProps {
  position?: [number, number, number];
  scale?: number;
  rotationY?: number;
  interactive?: boolean;
}

export function Lamp3D({
  position = [0, 0, 0],
  scale = 1.0,
  rotationY = 0,
  interactive = true,
}: Lamp3DProps) {
  const groupRef = useRef<THREE.Group>(null!);
  const [hovered, setHovered] = useState(false);
  const [lightState, setLightState] = useState<number>(2); // 0: OFF, 1: SOFT (50%), 2: BRIGHT (100%)

  // Load production GLTF model
  const gltf = useGLTF('/models/table_lamp_realistic.glb') as unknown as { scene: THREE.Group };

  // Light intensity values based on state
  const lightIntensity = lightState === 2 ? 1.6 : lightState === 1 ? 0.75 : 0;
  const isLightOn = lightState > 0;

  const handleClick = (e: { stopPropagation: () => void }) => {
    if (!interactive) return;
    e.stopPropagation();
    // Cycle between BRIGHT -> SOFT -> OFF -> BRIGHT
    setLightState((prev) => (prev === 2 ? 1 : prev === 1 ? 0 : 2));
  };

  return (
    <group
      ref={groupRef}
      position={position}
      scale={[scale, scale, scale]}
      rotation={[0, rotationY, 0]}
      onClick={handleClick}
      onPointerOver={(e) => {
        if (!interactive) return;
        e.stopPropagation();
        setHovered(true);
        document.body.style.cursor = 'pointer';
      }}
      onPointerOut={() => {
        setHovered(false);
        document.body.style.cursor = 'auto';
      }}
    >
      {/* 1. Cloned GLB Model Scene */}
      <primitive object={gltf.scene.clone()} />

      {/* 2. Downward Warm Ambient Illumination under the Dome Shade */}
      {isLightOn && (
        <>
          {/* Main Cone Warm Point Light directly under diffuser disc */}
          <pointLight
            position={[0, 0.19, 0]}
            color="#ffe2a8"
            intensity={lightIntensity}
            distance={1.6}
            decay={2}
            castShadow
          />

          {/* Secondary Soft Ambient Downward Floor Wash */}
          <pointLight
            position={[0, 0.05, 0]}
            color="#ffd280"
            intensity={lightIntensity * 0.45}
            distance={0.8}
            decay={2}
          />
        </>
      )}

      {/* 3. Interactive Floating Tooltip */}
      {hovered && interactive && (
        <Html
          position={[0, 0.32, 0]}
          center
          distanceFactor={4.8}
          style={{ pointerEvents: 'none' }}
        >
          <div className="bg-neutral-950/95 backdrop-blur-xl text-white border border-amber-500/50 rounded-2xl px-4 py-2.5 shadow-[0_15px_40px_rgba(0,0,0,0.85)] flex flex-col whitespace-nowrap pointer-events-none transform -translate-y-2 transition-all">
            <div className="flex items-center gap-2">
              <span
                className={`w-2 h-2 rounded-full ${
                  isLightOn ? 'bg-amber-400 animate-pulse' : 'bg-neutral-600'
                }`}
              />
              <span className="text-xs font-black uppercase tracking-wider text-amber-200">
                Sculptural Dome Lamp
              </span>
            </div>
            <div className="flex items-center gap-2 mt-1 text-[11px] text-neutral-300">
              <span className="text-amber-300 font-semibold">
                {lightState === 2 ? 'Warm 100%' : lightState === 1 ? 'Soft 50%' : 'Turned OFF'}
              </span>
              <span className="text-neutral-500">•</span>
              <span className="text-neutral-400">Brushed Brass & Enamel</span>
            </div>
            <span className="mt-1 text-[10px] text-amber-400 font-medium tracking-wide">
              ✦ Click lamp to adjust light level
            </span>
          </div>
        </Html>
      )}
    </group>
  );
}

useGLTF.preload('/models/table_lamp_realistic.glb');
