'use client';

import { useRef, useState, useCallback, useMemo, Suspense } from 'react';
import { Canvas, useFrame, useThree } from '@react-three/fiber';
import { Environment } from '@react-three/drei';
import * as THREE from 'three';
import { TunnelPoster } from './TunnelPoster';
import PosterModal from './PosterModal';

/* ------------------------------------------------------------------ */
/*  Poster data                                                       */
/* ------------------------------------------------------------------ */

const POSTERS = [
  { id: 1, title: 'Aurora Dreams', description: 'An ethereal exploration of light and color in the digital realm.', color: '#8B5CF6' },
  { id: 2, title: 'Neon Horizons', description: 'Where technology meets artistry at the edge of tomorrow.', color: '#3B82F6' },
  { id: 3, title: 'Digital Bloom', description: 'Organic forms emerge from mathematical precision.', color: '#14B8A6' },
  { id: 4, title: 'Cosmic Drift', description: 'A journey through the vast expanse of creative possibility.', color: '#F97316' },
  { id: 5, title: 'Pulse Wave', description: 'Rhythmic patterns that dance between chaos and order.', color: '#EC4899' },
  { id: 6, title: 'Shadow Grid', description: 'Structure and void in perfect architectural balance.', color: '#EF4444' },
  { id: 7, title: 'Velvet Code', description: 'Software rendered as sensory experience.', color: '#A855F7' },
  { id: 8, title: 'Iron Blossom', description: 'Industrial strength meets organic beauty.', color: '#06B6D4' },
];

/* ------------------------------------------------------------------ */
/*  Tunnel constants                                                  */
/* ------------------------------------------------------------------ */

const TUNNEL_LENGTH = 80;        // total Z depth of the tunnel
const TUNNEL_WIDTH = 6;          // X extent (left wall at -3, right at +3)
const TUNNEL_HEIGHT = 5;         // Y extent
const POSTER_WALL_OFFSET = 2.85; // how far from center the poster sits (on the wall)
const POSTER_SPACING = 8;        // Z spacing between successive posters
const POSTER_START_Z = -8;       // first poster Z

/* ------------------------------------------------------------------ */
/*  TunnelWalls – the corridor geometry                               */
/* ------------------------------------------------------------------ */

function TunnelWalls() {
  const wallMaterial = (
    <meshStandardMaterial
      color="#f0f0f0"
      roughness={0.9}
      metalness={0.0}
      side={THREE.FrontSide}
    />
  );

  // Grid texture for subtle wall pattern
  const gridTexture = useMemo(() => {
    if (typeof window === 'undefined') return undefined;
    const canvas = document.createElement('canvas');
    canvas.width = 512;
    canvas.height = 512;
    const ctx = canvas.getContext('2d');
    if (!ctx) return undefined;
    ctx.fillStyle = '#f5f5f5';
    ctx.fillRect(0, 0, 512, 512);
    ctx.strokeStyle = '#e8e8e8';
    ctx.lineWidth = 1;
    // Grid lines
    const step = 32;
    for (let i = 0; i <= 512; i += step) {
      ctx.beginPath();
      ctx.moveTo(i, 0);
      ctx.lineTo(i, 512);
      ctx.stroke();
      ctx.beginPath();
      ctx.moveTo(0, i);
      ctx.lineTo(512, i);
      ctx.stroke();
    }
    const tex = new THREE.CanvasTexture(canvas);
    tex.wrapS = THREE.RepeatWrapping;
    tex.wrapT = THREE.RepeatWrapping;
    tex.repeat.set(2, TUNNEL_LENGTH / 4);
    return tex;
  }, []);

  const halfW = TUNNEL_WIDTH / 2;
  const halfH = TUNNEL_HEIGHT / 2;
  const halfL = TUNNEL_LENGTH / 2;

  return (
    <group>
      {/* Left wall */}
      <mesh position={[-halfW, 0, -halfL]} rotation={[0, Math.PI / 2, 0]}>
        <planeGeometry args={[TUNNEL_LENGTH, TUNNEL_HEIGHT]} />
        <meshStandardMaterial
          map={gridTexture}
          color="#f0f0f0"
          roughness={0.9}
          metalness={0}
          side={THREE.DoubleSide}
        />
      </mesh>

      {/* Right wall */}
      <mesh position={[halfW, 0, -halfL]} rotation={[0, -Math.PI / 2, 0]}>
        <planeGeometry args={[TUNNEL_LENGTH, TUNNEL_HEIGHT]} />
        <meshStandardMaterial
          map={gridTexture}
          color="#f0f0f0"
          roughness={0.9}
          metalness={0}
          side={THREE.DoubleSide}
        />
      </mesh>

      {/* Floor */}
      <mesh position={[0, -halfH, -halfL]} rotation={[-Math.PI / 2, 0, 0]}>
        <planeGeometry args={[TUNNEL_WIDTH, TUNNEL_LENGTH]} />
        <meshStandardMaterial
          map={gridTexture}
          color="#e8e8e8"
          roughness={0.95}
          metalness={0}
          side={THREE.DoubleSide}
        />
      </mesh>

      {/* Ceiling */}
      <mesh position={[0, halfH, -halfL]} rotation={[Math.PI / 2, 0, 0]}>
        <planeGeometry args={[TUNNEL_WIDTH, TUNNEL_LENGTH]} />
        {wallMaterial}
      </mesh>
    </group>
  );
}

/* ------------------------------------------------------------------ */
/*  CameraController – moves the camera based on scrollProgress       */
/* ------------------------------------------------------------------ */

function CameraController({ scrollProgress }: { scrollProgress: number }) {
  const { camera } = useThree();
  const targetZ = useRef(0);

  useFrame(() => {
    // Map scrollProgress [0,1] to Z position [0, -TUNNEL_LENGTH + 10]
    targetZ.current = -scrollProgress * (TUNNEL_LENGTH - 10);
    camera.position.z = THREE.MathUtils.lerp(camera.position.z, targetZ.current, 0.08);
    camera.position.x = THREE.MathUtils.lerp(camera.position.x, 0, 0.05);
    camera.position.y = THREE.MathUtils.lerp(camera.position.y, 0, 0.05);
  });

  return null;
}

/* ------------------------------------------------------------------ */
/*  TunnelPosters – places all posters on the tunnel walls            */
/* ------------------------------------------------------------------ */

interface TunnelPostersProps {
  onSelect: (poster: typeof POSTERS[number]) => void;
}

function TunnelPosters({ onSelect }: TunnelPostersProps) {
  return (
    <>
      {POSTERS.map((poster, i) => {
        const isLeft = i % 2 === 0;
        const x = isLeft ? -POSTER_WALL_OFFSET : POSTER_WALL_OFFSET;
        const z = POSTER_START_Z - i * POSTER_SPACING;
        const rotY = isLeft ? Math.PI / 12 : -Math.PI / 12; // slightly angled towards camera

        return (
          <TunnelPoster
            key={poster.id}
            position={[x, 0, z]}
            rotation={[0, rotY, 0]}
            color={poster.color}
            title={poster.title}
            index={i}
            onSelect={() => onSelect(poster)}
          />
        );
      })}
    </>
  );
}

/* ------------------------------------------------------------------ */
/*  TunnelLights                                                      */
/* ------------------------------------------------------------------ */

function TunnelLights() {
  return (
    <>
      <ambientLight intensity={0.6} color="#ffffff" />
      {/* Overhead lights along the tunnel */}
      {Array.from({ length: 8 }).map((_, i) => (
        <pointLight
          key={i}
          position={[0, 2.2, -i * 10]}
          intensity={1.2}
          distance={15}
          color="#fff5ee"
          castShadow={false}
        />
      ))}
      <directionalLight position={[2, 3, 5]} intensity={0.3} color="#ffffff" />
    </>
  );
}

/* ------------------------------------------------------------------ */
/*  TunnelScene – the exported component                              */
/* ------------------------------------------------------------------ */

interface TunnelSceneProps {
  scrollProgress: number;
}

export default function TunnelScene({ scrollProgress }: TunnelSceneProps) {
  const [selectedPoster, setSelectedPoster] = useState<typeof POSTERS[number] | null>(null);

  const handleSelect = useCallback((poster: typeof POSTERS[number]) => {
    setSelectedPoster(poster);
  }, []);

  const handleCloseModal = useCallback(() => {
    setSelectedPoster(null);
  }, []);

  return (
    <>
      <div className="w-full h-screen relative">
        <Canvas
          camera={{ fov: 60, near: 0.1, far: 200, position: [0, 0, 0] }}
          gl={{ antialias: true, toneMapping: THREE.ACESFilmicToneMapping, toneMappingExposure: 1.2 }}
          style={{ background: '#f5f5f5' }}
        >
          {/* Atmospheric fog */}
          <fog attach="fog" args={['#f5f5f5', 5, 50]} />

          <Suspense fallback={null}>
            <CameraController scrollProgress={scrollProgress} />
            <TunnelLights />
            <TunnelWalls />
            <TunnelPosters onSelect={handleSelect} />
            <Environment preset="studio" environmentIntensity={0.3} />
          </Suspense>
        </Canvas>
      </div>

      {/* 2D modal overlay */}
      <PosterModal poster={selectedPoster} onClose={handleCloseModal} />
    </>
  );
}
