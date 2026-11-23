'use client';

import { useRef, useState, useMemo } from 'react';
import { useFrame } from '@react-three/fiber';
import { Text } from '@react-three/drei';
import * as THREE from 'three';

interface TunnelPosterProps {
  position: [number, number, number];
  rotation: [number, number, number];
  color: string;
  title: string;
  index: number;
  onSelect: () => void;
}

export function TunnelPoster({
  position,
  rotation,
  color,
  title,
  index,
  onSelect,
}: TunnelPosterProps) {
  const meshRef = useRef<THREE.Mesh>(null!);
  const [hovered, setHovered] = useState(false);
  const baseY = position[1];

  // Create a gradient canvas texture for the poster
  const gradientTexture = useMemo(() => {
    if (typeof window === 'undefined') return undefined;
    const canvas = document.createElement('canvas');
    canvas.width = 512;
    canvas.height = 640;
    const ctx = canvas.getContext('2d');
    if (!ctx) return undefined;

    // Parse the hex color and create lighter/darker variants
    const baseColor = new THREE.Color(color);
    const lighterColor = baseColor.clone().lerp(new THREE.Color('#ffffff'), 0.3);
    const darkerColor = baseColor.clone().lerp(new THREE.Color('#000000'), 0.2);

    // Gradient background
    const gradient = ctx.createLinearGradient(0, 0, canvas.width, canvas.height);
    gradient.addColorStop(0, `#${lighterColor.getHexString()}`);
    gradient.addColorStop(0.5, `#${baseColor.getHexString()}`);
    gradient.addColorStop(1, `#${darkerColor.getHexString()}`);
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // Add some abstract art elements
    ctx.globalAlpha = 0.15;
    for (let i = 0; i < 5; i++) {
      ctx.beginPath();
      const cx = Math.random() * canvas.width;
      const cy = Math.random() * canvas.height;
      const r = 40 + Math.random() * 120;
      ctx.arc(cx, cy, r, 0, Math.PI * 2);
      ctx.fillStyle = '#ffffff';
      ctx.fill();
    }

    // Add geometric lines
    ctx.globalAlpha = 0.1;
    ctx.strokeStyle = '#ffffff';
    ctx.lineWidth = 2;
    for (let i = 0; i < 3; i++) {
      ctx.beginPath();
      ctx.moveTo(Math.random() * canvas.width, 0);
      ctx.lineTo(Math.random() * canvas.width, canvas.height);
      ctx.stroke();
    }
    ctx.globalAlpha = 1;

    const texture = new THREE.CanvasTexture(canvas);
    texture.needsUpdate = true;
    return texture;
  }, [color]);

  useFrame((state) => {
    if (!meshRef.current) return;

    const t = state.clock.elapsedTime;
    // Subtle floating/bobbing motion unique per poster
    meshRef.current.position.y = baseY + Math.sin(t * 0.8 + index * 1.5) * 0.05;

    // Smooth scale on hover
    const targetScale = hovered ? 1.1 : 1;
    meshRef.current.scale.x = THREE.MathUtils.lerp(meshRef.current.scale.x, targetScale, 0.1);
    meshRef.current.scale.y = THREE.MathUtils.lerp(meshRef.current.scale.y, targetScale, 0.1);
  });

  return (
    <group position={position} rotation={rotation}>
      <mesh
        ref={meshRef}
        onPointerOver={(e) => {
          e.stopPropagation();
          setHovered(true);
          document.body.style.cursor = 'pointer';
        }}
        onPointerOut={(e) => {
          e.stopPropagation();
          setHovered(false);
          document.body.style.cursor = 'auto';
        }}
        onClick={(e) => {
          e.stopPropagation();
          onSelect();
        }}
      >
        <planeGeometry args={[1.6, 2.2]} />
        <meshStandardMaterial
          map={gradientTexture}
          emissive={color}
          emissiveIntensity={hovered ? 0.4 : 0.05}
          toneMapped={false}
        />
      </mesh>

      {/* White border frame */}
      <mesh position={[0, 0, -0.01]}>
        <planeGeometry args={[1.75, 2.35]} />
        <meshStandardMaterial color="#f0f0f0" />
      </mesh>

      {/* Title below the poster */}
      <Text
        position={[0, -1.4, 0.01]}
        fontSize={0.12}
        color="#333333"
        anchorX="center"
        anchorY="top"
        maxWidth={1.5}
        font={undefined}
      >
        {title}
      </Text>
    </group>
  );
}
