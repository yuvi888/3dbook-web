'use client';

import { useMemo } from 'react';
import * as THREE from 'three';

interface Plant3DProps {
  position?: [number, number, number];
  scale?: number;
  variant?: 'trailing' | 'bushy' | 'succulent';
}

export function Plant3D({ position = [0, 0, 0], scale = 1.0, variant = 'trailing' }: Plant3DProps) {
  const materials = useMemo(() => {
    // Matte white/cream ceramic pot
    const potMaterial = new THREE.MeshPhysicalMaterial({
      color: '#f5f0e8',
      roughness: 0.55,
      metalness: 0.02,
      clearcoat: 0.15,
      clearcoatRoughness: 0.6,
    });

    // Warm terracotta saucer
    const saucerMaterial = new THREE.MeshStandardMaterial({
      color: '#d4c4b0',
      roughness: 0.5,
      metalness: 0.03,
    });

    // Rich dark potting soil
    const soilMaterial = new THREE.MeshStandardMaterial({
      color: '#3e2a1a',
      roughness: 0.95,
      metalness: 0.0,
    });

    // Deep mature leaf
    const leafMaterial = new THREE.MeshPhysicalMaterial({
      color: '#2d6a2e',
      roughness: 0.3,
      metalness: 0.04,
      side: THREE.DoubleSide,
      transmission: 0.08,
      thickness: 0.5,
    });

    // Fresh young lighter leaf
    const lightLeafMaterial = new THREE.MeshPhysicalMaterial({
      color: '#4caf50',
      roughness: 0.28,
      metalness: 0.03,
      side: THREE.DoubleSide,
      transmission: 0.1,
      thickness: 0.4,
    });

    // Even lighter spring leaf
    const springLeafMaterial = new THREE.MeshPhysicalMaterial({
      color: '#81c784',
      roughness: 0.3,
      metalness: 0.02,
      side: THREE.DoubleSide,
      transmission: 0.12,
      thickness: 0.3,
    });

    // Thin stems
    const stemMaterial = new THREE.MeshStandardMaterial({
      color: '#3e6b2b',
      roughness: 0.5,
      metalness: 0.0,
    });

    return {
      potMaterial,
      saucerMaterial,
      soilMaterial,
      leafMaterial,
      lightLeafMaterial,
      springLeafMaterial,
      stemMaterial,
    };
  }, []);

  // Procedural leaf geometries — multiple sizes for variety
  const { largeLeaf, mediumLeaf, smallLeaf } = useMemo(() => {
    const createLeafGeo = (w: number, h: number) => {
      const shape = new THREE.Shape();
      shape.moveTo(0, 0);
      shape.bezierCurveTo(w * 0.6, h * 0.3, w * 0.8, h * 0.6, w * 0.3, h);
      shape.bezierCurveTo(0.0, h * 1.05, -0.0, h * 1.05, -w * 0.3, h);
      shape.bezierCurveTo(-w * 0.8, h * 0.6, -w * 0.6, h * 0.3, 0, 0);

      const geo = new THREE.ShapeGeometry(shape, 16);
      const pos = geo.attributes.position;
      for (let i = 0; i < pos.count; i++) {
        const y = pos.getY(i);
        const x = pos.getX(i);
        // Subtle natural curvature and cupping
        pos.setZ(i, -Math.sin(y / h * Math.PI) * 0.025 - Math.abs(x) * 0.2);
      }
      geo.computeVertexNormals();
      return geo;
    };

    return {
      largeLeaf: createLeafGeo(0.06, 0.22),
      mediumLeaf: createLeafGeo(0.045, 0.16),
      smallLeaf: createLeafGeo(0.03, 0.10),
    };
  }, []);

  // Leaves arrangement based on variant
  const leaves = useMemo(() => {
    const list: Array<{
      pos: [number, number, number];
      rot: [number, number, number];
      scale: number;
      matType: 'dark' | 'light' | 'spring';
      size: 'large' | 'medium' | 'small';
    }> = [];

    if (variant === 'trailing') {
      // Upright crown leaves
      const crownCount = 12;
      for (let i = 0; i < crownCount; i++) {
        const angle = (i / crownCount) * Math.PI * 2 + 0.2;
        const radius = 0.035 + (i % 4) * 0.015;
        const x = Math.cos(angle) * radius;
        const z = Math.sin(angle) * radius;
        const rotX = 0.2 + (i % 3) * 0.2;
        const rotY = angle - Math.PI / 2;
        const leafScale = 0.8 + (i % 3) * 0.2;

        list.push({
          pos: [x, 0.19, z],
          rot: [rotX, rotY, (Math.random() - 0.5) * 0.15],
          scale: leafScale,
          matType: i % 3 === 0 ? 'spring' : i % 2 === 0 ? 'light' : 'dark',
          size: i % 3 === 0 ? 'large' : i % 2 === 0 ? 'medium' : 'large',
        });
      }

      // Cascading vines
      const trails = [
        { angle: -Math.PI / 4, len: 6, dY: 0.14, fZ: 0.09 },
        { angle: -Math.PI / 2, len: 8, dY: 0.13, fZ: 0.12 },
        { angle: -Math.PI * 0.7, len: 5, dY: 0.14, fZ: 0.10 },
        { angle: Math.PI / 3, len: 4, dY: 0.15, fZ: 0.08 },
      ];

      trails.forEach((trail) => {
        for (let j = 0; j < trail.len; j++) {
          const t = j / trail.len;
          const x = Math.cos(trail.angle) * (0.07 + t * 0.05);
          const y = trail.dY - t * 0.3 - Math.pow(t, 2) * 0.14;
          const z = trail.fZ + t * 0.14;

          list.push({
            pos: [x, y, z],
            rot: [
              Math.PI * 0.4 + t * 0.5,
              trail.angle + (j % 2 === 0 ? 0.25 : -0.25),
              -0.15 + (Math.random() - 0.5) * 0.2,
            ],
            scale: 0.7 - t * 0.12,
            matType: j % 3 === 0 ? 'spring' : j % 2 === 0 ? 'light' : 'dark',
            size: j < 2 ? 'medium' : 'small',
          });
        }
      });
    } else if (variant === 'bushy') {
      // Dense bushy plant (like a small fern or herb)
      const bushCount = 20;
      for (let i = 0; i < bushCount; i++) {
        const angle = (i / bushCount) * Math.PI * 2 + Math.random() * 0.3;
        const radius = 0.02 + Math.random() * 0.06;
        const x = Math.cos(angle) * radius;
        const z = Math.sin(angle) * radius;
        const h = 0.17 + Math.random() * 0.08;
        const rotX = 0.15 + Math.random() * 0.4;

        list.push({
          pos: [x, h, z],
          rot: [rotX, angle - Math.PI / 2, (Math.random() - 0.5) * 0.2],
          scale: 0.6 + Math.random() * 0.5,
          matType: i % 3 === 0 ? 'spring' : i % 2 === 0 ? 'light' : 'dark',
          size: i % 3 === 0 ? 'small' : 'medium',
        });
      }
    } else {
      // Succulent — fewer, thicker leaves arranged in rosette
      const rosCount = 8;
      for (let ring = 0; ring < 2; ring++) {
        for (let i = 0; i < rosCount; i++) {
          const angle = (i / rosCount) * Math.PI * 2 + ring * 0.4;
          const radius = 0.03 + ring * 0.03;
          const x = Math.cos(angle) * radius;
          const z = Math.sin(angle) * radius;
          const rotX = 0.5 + ring * 0.3;

          list.push({
            pos: [x, 0.18 + ring * 0.015, z],
            rot: [rotX, angle - Math.PI / 2, 0],
            scale: 1.0 - ring * 0.2,
            matType: ring === 0 ? 'dark' : 'light',
            size: 'medium',
          });
        }
      }
    }

    return list;
  }, [variant]);

  const getLeafGeo = (size: 'large' | 'medium' | 'small') => {
    if (size === 'large') return largeLeaf;
    if (size === 'medium') return mediumLeaf;
    return smallLeaf;
  };

  const getLeafMat = (type: 'dark' | 'light' | 'spring') => {
    if (type === 'dark') return materials.leafMaterial;
    if (type === 'light') return materials.lightLeafMaterial;
    return materials.springLeafMaterial;
  };

  return (
    <group position={position} scale={[scale, scale, scale]}>
      {/* 1. Saucer Base */}
      <mesh position={[0, 0.012, 0]} material={materials.saucerMaterial} castShadow>
        <cylinderGeometry args={[0.13, 0.14, 0.02, 24]} />
      </mesh>

      {/* 2. Ceramic Pot — slightly tapered */}
      <mesh position={[0, 0.11, 0]} material={materials.potMaterial} castShadow receiveShadow>
        <cylinderGeometry args={[0.115, 0.09, 0.17, 24]} />
      </mesh>
      {/* Rim collar */}
      <mesh position={[0, 0.195, 0]} material={materials.potMaterial} castShadow>
        <cylinderGeometry args={[0.12, 0.116, 0.015, 24]} />
      </mesh>

      {/* 3. Potting Soil */}
      <mesh position={[0, 0.185, 0]} material={materials.soilMaterial}>
        <cylinderGeometry args={[0.11, 0.11, 0.012, 20]} />
      </mesh>

      {/* 4. Foliage */}
      {leaves.map((leaf, idx) => (
        <group key={idx} position={leaf.pos} rotation={leaf.rot} scale={leaf.scale}>
          <mesh
            geometry={getLeafGeo(leaf.size)}
            material={getLeafMat(leaf.matType)}
            castShadow
          />
        </group>
      ))}

      {/* 5. Vine Stems (for trailing variant) */}
      {variant === 'trailing' && (
        <>
          <mesh position={[0, 0.02, 0.10]} rotation={[0.4, 0, 0]} material={materials.stemMaterial}>
            <cylinderGeometry args={[0.004, 0.002, 0.30, 6]} />
          </mesh>
          <mesh position={[-0.04, 0.04, 0.08]} rotation={[0.3, -0.3, 0.2]} material={materials.stemMaterial}>
            <cylinderGeometry args={[0.004, 0.002, 0.22, 6]} />
          </mesh>
          <mesh position={[0.03, 0.03, 0.09]} rotation={[0.35, 0.2, -0.15]} material={materials.stemMaterial}>
            <cylinderGeometry args={[0.003, 0.002, 0.18, 6]} />
          </mesh>
        </>
      )}
    </group>
  );
}
