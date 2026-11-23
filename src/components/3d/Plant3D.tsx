'use client';

import { useMemo } from 'react';
import * as THREE from 'three';

interface Plant3DProps {
  position?: [number, number, number];
  scale?: number;
}

export function Plant3D({ position = [0, 0, 0], scale = 1.0 }: Plant3DProps) {
  // Planter and foliage materials
  const materials = useMemo(() => {
    // Elegant matte ribbed ceramic pot
    const potMaterial = new THREE.MeshStandardMaterial({
      color: '#f4f1ea',
      roughness: 0.45,
      metalness: 0.05,
    });

    // Brushed brass saucer base
    const saucerMaterial = new THREE.MeshStandardMaterial({
      color: '#d4af37',
      roughness: 0.25,
      metalness: 0.85,
    });

    // Dark fertile soil
    const soilMaterial = new THREE.MeshStandardMaterial({
      color: '#26160c',
      roughness: 0.9,
      metalness: 0.0,
    });

    // Lush deep green leaf material
    const leafMaterial = new THREE.MeshStandardMaterial({
      color: '#2e7d32',
      roughness: 0.35,
      metalness: 0.08,
      side: THREE.DoubleSide,
    });

    // Fresh lighter green young leaf material
    const lightLeafMaterial = new THREE.MeshStandardMaterial({
      color: '#4caf50',
      roughness: 0.3,
      metalness: 0.05,
      side: THREE.DoubleSide,
    });

    // Thin flexible plant stem material
    const stemMaterial = new THREE.MeshStandardMaterial({
      color: '#33691e',
      roughness: 0.5,
      metalness: 0.0,
    });

    return {
      potMaterial,
      saucerMaterial,
      soilMaterial,
      leafMaterial,
      lightLeafMaterial,
      stemMaterial,
    };
  }, []);

  // Procedural leaf geometry (curved teardrop/heart shape)
  const leafGeometry = useMemo(() => {
    const shape = new THREE.Shape();
    shape.moveTo(0, 0);
    shape.bezierCurveTo(0.04, 0.06, 0.07, 0.12, 0.04, 0.2);
    shape.bezierCurveTo(0.02, 0.25, -0.02, 0.25, -0.04, 0.2);
    shape.bezierCurveTo(-0.07, 0.12, -0.04, 0.06, 0, 0);

    const geo = new THREE.ShapeGeometry(shape, 12);
    // Add subtle curvature to the leaf plane
    const pos = geo.attributes.position;
    for (let i = 0; i < pos.count; i++) {
      const y = pos.getY(i);
      const x = pos.getX(i);
      pos.setZ(i, -Math.sin(y * 12) * 0.02 - Math.abs(x) * 0.15);
    }
    geo.computeVertexNormals();
    return geo;
  }, []);

  // Upright and cascading leaf placements
  const leaves = useMemo(() => {
    const list = [];

    // 1. Upright central crown leaves
    const uprightCount = 9;
    for (let i = 0; i < uprightCount; i++) {
      const angle = (i / uprightCount) * Math.PI * 2 + 0.3;
      const radius = 0.04 + (i % 3) * 0.02;
      const x = Math.cos(angle) * radius;
      const z = Math.sin(angle) * radius;
      const rotX = 0.35 + (i % 3) * 0.15;
      const rotY = angle - Math.PI / 2;
      const rotZ = (Math.random() - 0.5) * 0.2;
      const leafScale = 0.85 + (i % 3) * 0.18;

      list.push({
        pos: [x, 0.18, z] as [number, number, number],
        rot: [rotX, rotY, rotZ] as [number, number, number],
        scale: leafScale,
        isLight: i % 2 === 0,
      });
    }

    // 2. Cascading trailing vines draping down over the front shelf edge
    const vineTrails = [
      { startAngle: -Math.PI / 4, length: 5, drapeY: 0.14, forwardZ: 0.08 },
      { startAngle: -Math.PI / 2, length: 7, drapeY: 0.12, forwardZ: 0.12 },
      { startAngle: -Math.PI * 0.75, length: 4, drapeY: 0.13, forwardZ: 0.09 },
    ];

    vineTrails.forEach((trail) => {
      for (let j = 0; j < trail.length; j++) {
        const t = j / trail.length;
        const x = Math.cos(trail.startAngle) * (0.08 + t * 0.06);
        // Vines drape down gracefully
        const y = trail.drapeY - t * 0.28 - Math.pow(t, 2) * 0.12;
        const z = trail.forwardZ + t * 0.16;

        list.push({
          pos: [x, y, z] as [number, number, number],
          rot: [Math.PI * 0.45 + t * 0.4, trail.startAngle + (j % 2 === 0 ? 0.3 : -0.3), -0.2] as [
            number,
            number,
            number
          ],
          scale: 0.75 - t * 0.15,
          isLight: j % 2 === 1,
        });
      }
    });

    return list;
  }, []);

  return (
    <group position={position} scale={[scale, scale, scale]}>
      {/* 1. Brushed Brass Saucer Base */}
      <mesh position={[0, 0.015, 0]} material={materials.saucerMaterial} castShadow>
        <cylinderGeometry args={[0.13, 0.14, 0.025, 24]} />
      </mesh>

      {/* 2. Modern Matte Ribbed Ceramic Pot */}
      <mesh position={[0, 0.11, 0]} material={materials.potMaterial} castShadow receiveShadow>
        <cylinderGeometry args={[0.12, 0.095, 0.17, 24]} />
      </mesh>
      {/* Upper pot rim collar */}
      <mesh position={[0, 0.19, 0]} material={materials.potMaterial} castShadow>
        <cylinderGeometry args={[0.126, 0.122, 0.02, 24]} />
      </mesh>

      {/* 3. Dark Potting Soil */}
      <mesh position={[0, 0.18, 0]} material={materials.soilMaterial}>
        <cylinderGeometry args={[0.115, 0.115, 0.015, 20]} />
      </mesh>

      {/* 4. Foliage & Trailing Vines */}
      {leaves.map((leaf, idx) => (
        <group key={idx} position={leaf.pos} rotation={leaf.rot} scale={leaf.scale}>
          <mesh
            geometry={leafGeometry}
            material={leaf.isLight ? materials.lightLeafMaterial : materials.leafMaterial}
            castShadow
          />
        </group>
      ))}

      {/* 5. Cascading Vine Tendril Stems */}
      <mesh position={[0, 0.02, 0.11]} rotation={[0.4, 0, 0]} material={materials.stemMaterial}>
        <cylinderGeometry args={[0.005, 0.003, 0.32, 8]} />
      </mesh>
      <mesh position={[-0.05, 0.05, 0.09]} rotation={[0.3, -0.3, 0.2]} material={materials.stemMaterial}>
        <cylinderGeometry args={[0.005, 0.003, 0.24, 8]} />
      </mesh>
    </group>
  );
}
