/* eslint-disable @typescript-eslint/no-explicit-any */
'use client';

import { Suspense, useState, useRef, useMemo } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import { OrbitControls, useGLTF, ContactShadows } from '@react-three/drei';
import * as THREE from 'three';
import Link from 'next/link';
import { AdvancedBook3D } from '@/components/3d/AdvancedBook3D';

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
// PHOTOREALISTIC BOTANICAL PLANT POT WITH TRANSPARENT BULK LEAVES
// ---------------------------------------------------------------------------
function CurvedLeafCard({
  width,
  length,
  texture,
  position,
  direction,
  roll = 0,
}: {
  width: number;
  length: number;
  texture: THREE.Texture;
  position: [number, number, number];
  direction: [number, number, number];
  roll?: number;
}) {
  const { geo, quaternion } = useMemo(() => {
    // 1. Create PlaneGeometry with origin at base (petiole attachment point)
    const g = new THREE.PlaneGeometry(width, length, 8, 12);
    const pos = g.attributes.position;
    for (let i = 0; i < pos.count; i++) {
      const x = pos.getX(i);
      const y = pos.getY(i);
      // Shift so base is at y = 0, apex is at y = length
      const localY = y + length / 2;
      const normY = Math.max(0, Math.min(1, localY / length));
      const distFromCenter = Math.abs(x) / (width / 2);

      // Natural 3D cupping across leaf wings (flatter at base and tip, cupped in middle)
      const cup = Math.sin(normY * Math.PI) * Math.pow(distFromCenter, 1.4) * (width * 0.18);
      // Natural arching droop along leaf length (gravity pulls tip downward in local -Z)
      const droop = -Math.pow(normY, 1.5) * (length * 0.26);

      pos.setY(i, localY);
      pos.setZ(i, cup + droop);
    }
    g.computeVertexNormals();

    // 2. Compute rotation quaternion to orient local +Y along direction, plus twist
    const dirVec = new THREE.Vector3(...direction).normalize();
    const upVec = new THREE.Vector3(0, 1, 0);
    const q = new THREE.Quaternion().setFromUnitVectors(upVec, dirVec);

    if (roll !== 0) {
      const qRoll = new THREE.Quaternion().setFromAxisAngle(dirVec, roll);
      q.premultiply(qRoll);
    }

    return { geo: g, quaternion: q };
  }, [width, length, direction, roll]);

  return (
    <mesh
      geometry={geo}
      position={position}
      quaternion={quaternion}
      castShadow
      receiveShadow
    >
      <meshStandardMaterial
        map={texture}
        transparent={true}
        alphaTest={0.08}
        depthWrite={true}
        side={THREE.DoubleSide}
        roughness={0.28}
        metalness={0.01}
      />
    </mesh>
  );
}

function PetioleStem({
  start,
  end,
  arch = 0.008,
}: {
  start: [number, number, number];
  end: [number, number, number];
  arch?: number;
}) {
  const geo = useMemo(() => {
    const p0 = new THREE.Vector3(...start);
    const p2 = new THREE.Vector3(...end);
    // Smooth upward arching midpoint
    const p1 = new THREE.Vector3(
      (p0.x + p2.x) / 2,
      Math.max(p0.y, p2.y) + arch,
      (p0.z + p2.z) / 2
    );
    const curve = new THREE.CatmullRomCurve3([p0, p1, p2]);
    return new THREE.TubeGeometry(curve, 8, 0.0014, 6, false);
  }, [start, end, arch]);

  return (
    <mesh geometry={geo} castShadow>
      <meshStandardMaterial color="#4a7936" roughness={0.42} />
    </mesh>
  );
}

function TrailingVineRunner({ points }: { points: THREE.Vector3[] }) {
  const geo = useMemo(() => {
    const curve = new THREE.CatmullRomCurve3(points);
    return new THREE.TubeGeometry(curve, 32, 0.0018, 8, false);
  }, [points]);

  return (
    <mesh geometry={geo} castShadow>
      <meshStandardMaterial color="#3f6d2e" roughness={0.45} />
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

  // Load botanical leaf textures & organic soil texture
  const textures = useMemo(() => {
    const loader = new THREE.TextureLoader();
    const load = (path: string) => {
      const tex = loader.load(path);
      tex.colorSpace = THREE.SRGBColorSpace;
      return tex;
    };
    const soilTex = load('/textures/soil_texture.png');
    soilTex.wrapS = THREE.RepeatWrapping;
    soilTex.wrapT = THREE.RepeatWrapping;
    soilTex.repeat.set(2, 2);

    return {
      heart: load('/textures/leaf_heart.png'),
      curved: load('/textures/leaf_curved.png'),
      young: load('/textures/leaf_young.png'),
      droop: load('/textures/leaf_droop.png'),
      soil: soilTex,
    };
  }, []);

  const potRadius = 0.068; // 13.6 cm diameter
  const potHeight = 0.125; // 12.5 cm height
  const soilY = potHeight - 0.014; // recessed 1.4 cm below rim

  // 1. GENERATE DENSE, BUSHY CROWN FOLIAGE (38 bulk leaves forming a lush domed canopy)
  const crownFoliage = useMemo(() => {
    const leaves: any[] = [];

    // --- Tier 1: Center Sprouting Core (6 tender leaves) ---
    for (let i = 0; i < 6; i++) {
      const angle = (i * Math.PI * 2) / 6 + 0.2;
      const rRoot = 0.010 + (i % 2) * 0.005;
      const rBase = 0.018 + (i % 3) * 0.005;
      const yBase = soilY + 0.032 + (i % 3) * 0.006;
      leaves.push({
        id: `core-${i}`,
        root: [rRoot * Math.cos(angle), soilY + 0.002, rRoot * Math.sin(angle)] as [number, number, number],
        base: [rBase * Math.cos(angle + 0.15), yBase, rBase * Math.sin(angle + 0.15)] as [number, number, number],
        dir: [0.35 * Math.cos(angle + 0.15), 0.92, 0.35 * Math.sin(angle + 0.15)] as [number, number, number],
        w: 0.058,
        len: 0.078,
        roll: ((i % 3) - 1) * 0.12,
        tex: i % 2 === 0 ? textures.young : textures.heart,
        arch: 0.004,
      });
    }

    // --- Tier 2: Inner Canopy (10 leaves, spreading at 45°) ---
    for (let i = 0; i < 10; i++) {
      const angle = (i * Math.PI * 2) / 10 + 0.4;
      const rRoot = 0.018 + (i % 2) * 0.006;
      const rBase = 0.036 + (i % 3) * 0.006;
      const yBase = soilY + 0.026 + (i % 2) * 0.006;
      leaves.push({
        id: `inner-${i}`,
        root: [rRoot * Math.cos(angle), soilY + 0.002, rRoot * Math.sin(angle)] as [number, number, number],
        base: [rBase * Math.cos(angle + 0.1), yBase, rBase * Math.sin(angle + 0.1)] as [number, number, number],
        dir: [0.65 * Math.cos(angle + 0.1), 0.72, 0.65 * Math.sin(angle + 0.1)] as [number, number, number],
        w: 0.072,
        len: 0.094,
        roll: ((i % 4) - 1.5) * 0.14,
        tex: i % 2 === 0 ? textures.heart : textures.curved,
        arch: 0.005,
      });
    }

    // --- Tier 3: Mid-Rim Canopy (12 leaves, flaring outward to conceal pot opening) ---
    for (let i = 0; i < 12; i++) {
      const angle = (i * Math.PI * 2) / 12 + 0.15;
      const rRoot = 0.025 + (i % 3) * 0.006;
      const rBase = 0.054 + (i % 3) * 0.005;
      const yBase = soilY + 0.020 + (i % 2) * 0.005;
      leaves.push({
        id: `mid-${i}`,
        root: [rRoot * Math.cos(angle), soilY + 0.002, rRoot * Math.sin(angle)] as [number, number, number],
        base: [rBase * Math.cos(angle + 0.08), yBase, rBase * Math.sin(angle + 0.08)] as [number, number, number],
        dir: [0.82 * Math.cos(angle + 0.08), 0.48, 0.82 * Math.sin(angle + 0.08)] as [number, number, number],
        w: 0.078,
        len: 0.102,
        roll: ((i % 5) - 2) * 0.15,
        tex: i % 3 === 0 ? textures.curved : textures.heart,
        arch: 0.006,
      });
    }

    // --- Tier 4: Outer Lip-Softening Canopy (10 broad leaves draping gracefully over rim) ---
    for (let i = 0; i < 10; i++) {
      const angle = (i * Math.PI * 2) / 10 + 0.3;
      const rRoot = 0.030 + (i % 2) * 0.006;
      const rBase = 0.072 + (i % 3) * 0.004;
      const yBase = soilY + 0.016 + (i % 2) * 0.004; // Cresting right above rim
      leaves.push({
        id: `outer-${i}`,
        root: [rRoot * Math.cos(angle), soilY + 0.002, rRoot * Math.sin(angle)] as [number, number, number],
        base: [rBase * Math.cos(angle + 0.05), yBase, rBase * Math.sin(angle + 0.05)] as [number, number, number],
        dir: [0.90 * Math.cos(angle + 0.05), -0.10, 0.90 * Math.sin(angle + 0.05)] as [number, number, number],
        w: 0.084,
        len: 0.108,
        roll: ((i % 3) - 1) * 0.18,
        tex: i % 2 === 0 ? textures.droop : textures.heart,
        arch: 0.008,
      });
    }

    return leaves;
  }, [textures, soilY]);

  // 2. GENERATE REALISTIC CASCADING TRAILING VINES (Matching reference photo top shelf plant)
  const trailingVines = useMemo(() => {
    const vineConfigs = [
      // Primary dramatic front-left cascade
      { id: 'vine-fl', phi: 2.15, len: 1.0, count: 7 },
      // Secondary right side cascade
      { id: 'vine-r', phi: -0.70, len: 0.85, count: 5 },
      // Subtle front-center arch
      { id: 'vine-fc', phi: 1.15, len: 0.65, count: 4 },
    ];

    return vineConfigs.map((cfg) => {
      // 7-point CatmullRom spline strictly verified for pot rim & wall clearance
      const points = [
        new THREE.Vector3(0.024 * Math.cos(cfg.phi - 0.2), soilY + 0.002, 0.024 * Math.sin(cfg.phi - 0.2)),
        new THREE.Vector3(0.048 * Math.cos(cfg.phi - 0.08), 0.122, 0.048 * Math.sin(cfg.phi - 0.08)),
        new THREE.Vector3(0.074 * Math.cos(cfg.phi), 0.134, 0.074 * Math.sin(cfg.phi)), // Crest cleanly over rim
        new THREE.Vector3(0.080 * Math.cos(cfg.phi + 0.03), 0.098 * cfg.len + (1 - cfg.len) * 0.115, 0.080 * Math.sin(cfg.phi + 0.03)),
        new THREE.Vector3(0.084 * Math.cos(cfg.phi + 0.06), 0.062 * cfg.len + (1 - cfg.len) * 0.110, 0.084 * Math.sin(cfg.phi + 0.06)),
        new THREE.Vector3(0.086 * Math.cos(cfg.phi + 0.08), 0.026 * cfg.len + (1 - cfg.len) * 0.105, 0.086 * Math.sin(cfg.phi + 0.08)),
        new THREE.Vector3(0.084 * Math.cos(cfg.phi + 0.10), -0.008 * cfg.len + (1 - cfg.len) * 0.100, 0.084 * Math.sin(cfg.phi + 0.10)),
      ];

      const curve = new THREE.CatmullRomCurve3(points);

      const leaves = [];
      for (let i = 0; i < cfg.count; i++) {
        const t = 0.28 + (i / (cfg.count - 1)) * 0.68;
        const pOnVine = curve.getPointAt(t);
        const tangent = curve.getTangentAt(t);

        const normal = new THREE.Vector3(pOnVine.x, 0, pOnVine.z).normalize();
        const isLeft = i % 2 === 0;

        // Tangential side offset: leaves branch naturally along the vine flow (no 90-deg pegs)
        const sideDir = new THREE.Vector3().crossVectors(tangent, normal).normalize();
        const leafPos = pOnVine
          .clone()
          .add(normal.clone().multiplyScalar(0.006))
          .add(sideDir.clone().multiplyScalar(isLeft ? 0.005 : -0.005));

        const leafLen = 0.082 - (i / cfg.count) * 0.026;
        const leafW = 0.062 - (i / cfg.count) * 0.020;

        // Leaf blade direction: drapes naturally down along the vine and outwards
        const leafDir = normal
          .clone()
          .multiplyScalar(0.50)
          .add(new THREE.Vector3(0, -0.85, 0))
          .add(sideDir.clone().multiplyScalar(isLeft ? 0.20 : -0.20))
          .normalize();

        const tex =
          i === cfg.count - 1
            ? textures.young
            : i % 2 === 0
            ? textures.droop
            : textures.curved;

        leaves.push({
          id: `${cfg.id}-leaf-${i}`,
          pos: leafPos,
          dir: [leafDir.x, leafDir.y, leafDir.z] as [number, number, number],
          w: leafW,
          len: leafLen,
          roll: isLeft ? 0.18 : -0.18,
          tex,
        });
      }

      return { id: cfg.id, points, leaves };
    });
  }, [textures, soilY]);

  return (
    <group ref={groupRef} position={[0, -0.02, 0]}>
      {/* 1. CERAMIC POT (Hollow, open-top minimalist cylinder) */}
      <group position={[0, 0, 0]}>
        {/* Outer Cylinder Wall */}
        <mesh position={[0, potHeight / 2, 0]} castShadow receiveShadow>
          <cylinderGeometry args={[potRadius, potRadius * 0.94, potHeight, 48, 1, true]} />
          <meshStandardMaterial color="#faf8f4" roughness={0.32} metalness={0.01} side={THREE.DoubleSide} />
        </mesh>

        {/* Inner Cylinder Wall */}
        <mesh position={[0, potHeight / 2, 0]}>
          <cylinderGeometry args={[potRadius - 0.005, potRadius * 0.94 - 0.005, potHeight, 48, 1, true]} />
          <meshStandardMaterial color="#f4f1ec" roughness={0.34} metalness={0.01} side={THREE.DoubleSide} />
        </mesh>

        {/* Smooth Rounded Ceramic Rim Lip */}
        <mesh position={[0, potHeight, 0]} rotation={[Math.PI / 2, 0, 0]}>
          <torusGeometry args={[potRadius - 0.0025, 0.0035, 16, 48]} />
          <meshStandardMaterial color="#faf8f4" roughness={0.32} metalness={0.01} />
        </mesh>

        {/* Bottom Base Plate */}
        <mesh position={[0, 0.002, 0]} rotation={[-Math.PI / 2, 0, 0]}>
          <circleGeometry args={[potRadius * 0.94, 48]} />
          <meshStandardMaterial color="#faf8f4" roughness={0.32} metalness={0.01} />
        </mesh>

        {/* Recessed Dark Organic Potting Soil with Soil Texture */}
        <mesh position={[0, soilY, 0]} rotation={[-Math.PI / 2, 0, 0]} receiveShadow>
          <circleGeometry args={[potRadius - 0.006, 36]} />
          <meshStandardMaterial
            map={textures.soil}
            color="#221812"
            roughness={0.96}
            metalness={0.0}
          />
        </mesh>

        {/* Decorative River Pebbles on Soil */}
        {[
          [-0.028, soilY + 0.004, 0.022, 0.007],
          [0.022, soilY + 0.003, -0.024, 0.006],
          [-0.01, soilY + 0.004, -0.030, 0.008],
          [0.032, soilY + 0.003, 0.016, 0.006],
          [-0.025, soilY + 0.003, -0.015, 0.005],
          [0.012, soilY + 0.003, 0.032, 0.006],
        ].map(([x, y, z, s], i) => (
          <mesh key={i} position={[x, y, z]} scale={[1, 0.55, 0.85]}>
            <sphereGeometry args={[s, 10, 8]} />
            <meshStandardMaterial color="#5e5750" roughness={0.52} />
          </mesh>
        ))}
      </group>

      {/* 2. CROWN FOLIAGE (38 bulk leaves forming a dense, bushy dome) */}
      {crownFoliage.map((leaf) => (
        <group key={leaf.id}>
          <PetioleStem start={leaf.root} end={leaf.base} arch={leaf.arch} />
          <CurvedLeafCard
            width={leaf.w}
            length={leaf.len}
            texture={leaf.tex}
            position={leaf.base}
            direction={leaf.dir}
            roll={leaf.roll}
          />
        </group>
      ))}

      {/* 3. CASCADING TRAILING VINES (Graceful runners with natural cascading leaves) */}
      {trailingVines.map((vine) => (
        <group key={vine.id}>
          <TrailingVineRunner points={vine.points} />
          {vine.leaves.map((l) => (
            <CurvedLeafCard
              key={l.id}
              width={l.w}
              length={l.len}
              texture={l.tex}
              position={[l.pos.x, l.pos.y, l.pos.z]}
              direction={l.dir}
              roll={l.roll}
            />
          ))}
        </group>
      ))}
    </group>
  );
}

useGLTF.preload('/models/bookshelf_minimal_white.glb');
useGLTF.preload('/models/table_lamp_realistic.glb');
useGLTF.preload('/models/advanced_book_realistic.glb');

const COVER_PRESETS = [
  {
    name: '📖 Vintage Hardcover',
    url: 'https://images.unsplash.com/photo-1543002588-bfa74002ed7e?auto=format&fit=crop&w=1200&q=80',
    title: 'Vintage Hardcover',
    author: 'Classic Literature',
  },
  {
    name: '🎨 Desert / Alchemist',
    url: 'https://images.unsplash.com/photo-1544716278-ca5e3f4abd8c?auto=format&fit=crop&w=1200&q=80',
    title: 'The Alchemist',
    author: 'Paulo Coelho',
  },
  {
    name: '🌌 Cosmic Galaxy',
    url: 'https://images.unsplash.com/photo-1518709268805-4e9042af9f23?auto=format&fit=crop&w=1200&q=80',
    title: 'Cosmic Journey',
    author: 'Carl Sagan',
  },
  {
    name: '🏛️ Classical Marble',
    url: 'https://images.unsplash.com/photo-1532012164546-f432f2e3777a?auto=format&fit=crop&w=1200&q=80',
    title: 'Meditations',
    author: 'Marcus Aurelius',
  },
  {
    name: '🌿 Botanical Flora',
    url: 'https://images.unsplash.com/photo-1512820790803-83ca734da794?auto=format&fit=crop&w=1200&q=80',
    title: 'Botanica',
    author: 'Alexander Humboldt',
  },
];

function BookViewerModel({
  autoRotate,
  coverUrl,
}: {
  autoRotate: boolean;
  coverUrl: string;
}) {
  const groupRef = useRef<any>();

  useFrame((_, delta) => {
    if (autoRotate && groupRef.current) {
      groupRef.current.rotation.y += delta * 0.42;
    }
  });

  return (
    <group ref={groupRef} position={[0, -0.02, 0]} rotation={[0.08, -0.32, 0.02]}>
      <AdvancedBook3D
        coverUrl={coverUrl}
        title="The Alchemist"
        author="Paulo Coelho"
        interactive={false}
        scale={1.08}
      />
    </group>
  );
}

function LampViewerModel({ autoRotate }: { autoRotate: boolean }) {
  const gltf = useGLTF('/models/table_lamp_realistic.glb') as any;
  const groupRef = useRef<any>();

  useFrame((_, delta) => {
    if (autoRotate && groupRef.current) {
      groupRef.current.rotation.y += delta * 0.42;
    }
  });

  return (
    <group ref={groupRef} position={[0, -0.12, 0]}>
      <primitive object={gltf.scene.clone()} />
      {/* Warm 2700K downward point light under shade */}
      <pointLight
        position={[0, 0.085, 0]}
        color="#ffe2a8"
        intensity={1.75}
        distance={1.6}
        decay={2}
        castShadow
      />
      {/* Soft floor wash */}
      <pointLight
        position={[0, -0.06, 0]}
        color="#ffd280"
        intensity={0.5}
        distance={0.8}
        decay={2}
      />
    </group>
  );
}

type ModelKey = 'plant' | 'bookshelf' | 'lamp' | 'book';

export default function ModelViewerPage() {
  const [selectedModel, setSelectedModel] = useState<ModelKey>('book');
  const [autoRotate, setAutoRotate] = useState(false);
  const [customCoverUrl, setCustomCoverUrl] = useState<string>(COVER_PRESETS[0].url);
  const [inputUrl, setInputUrl] = useState<string>('');

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
    lamp: {
      name: 'Minimalist Sculptural Table Lamp',
      fileName: 'table_lamp_realistic.glb',
      fileSize: '188.3 KB',
      subTitle: 'Brushed Champagne Brass • Matte Dome Shade • Warm 2700K Glow',
      cameraPos: [0, 0.06, 0.62] as [number, number, number],
      cameraFov: 36,
      shadowPos: [0, -0.125, 0] as [number, number, number],
      shadowScale: 0.52,
    },
    book: {
      name: 'Advanced Realistic 3D Hardcover Book',
      fileName: 'advanced_book_realistic.glb',
      fileSize: 'Custom Image UV Map',
      subTitle: 'Concave Fore-Edge • Beveled Hardcover Boards • Debossed French Groove • Convex Spine',
      cameraPos: [0, 0.06, 0.62] as [number, number, number],
      cameraFov: 38,
      shadowPos: [0, -0.17, 0] as [number, number, number],
      shadowScale: 0.65,
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
            <button
              onClick={() => setSelectedModel('lamp')}
              className={`px-3 py-1 rounded-full text-xs font-semibold transition-all cursor-pointer ${
                selectedModel === 'lamp'
                  ? 'bg-amber-500 text-neutral-950 shadow-md font-bold'
                  : 'text-neutral-400 hover:text-white'
              }`}
            >
              💡 Table Lamp
            </button>
            <button
              onClick={() => setSelectedModel('book')}
              className={`px-3 py-1 rounded-full text-xs font-semibold transition-all cursor-pointer ${
                selectedModel === 'book'
                  ? 'bg-amber-600 text-white shadow-md font-bold'
                  : 'text-neutral-400 hover:text-white'
              }`}
            >
              📖 Advanced Book
            </button>
          </div>

          {selectedModel === 'bookshelf' && (
            <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-neutral-900 border border-white/10 text-xs">
              <span className="w-2 h-2 rounded-full bg-amber-400 shadow-[0_0_8px_rgba(251,191,36,0.6)]"></span>
              <span className="text-neutral-400">LED:</span>
              <span className="text-amber-300 font-mono font-semibold">30%</span>
            </div>
          )}

          {selectedModel === 'lamp' && (
            <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-neutral-900 border border-white/10 text-xs">
              <span className="w-2 h-2 rounded-full bg-amber-400 animate-pulse shadow-[0_0_8px_rgba(251,191,36,0.8)]"></span>
              <span className="text-neutral-400">Light:</span>
              <span className="text-amber-300 font-mono font-semibold">Warm 2700K</span>
            </div>
          )}

          {selectedModel === 'book' && (
            <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-neutral-900 border border-white/10 text-xs">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse shadow-[0_0_8px_rgba(52,211,153,0.8)]"></span>
              <span className="text-neutral-400">Cover:</span>
              <span className="text-emerald-300 font-mono font-semibold">Custom Image UV</span>
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
                : selectedModel === 'bookshelf'
                ? '/models/bookshelf_minimal_white.glb'
                : selectedModel === 'lamp'
                ? '/models/table_lamp_realistic.glb'
                : '/models/advanced_book_realistic.glb'
            }
            download={
              selectedModel === 'plant'
                ? 'plant_pot_realistic.glb'
                : selectedModel === 'bookshelf'
                ? 'bookshelf_minimal_white.glb'
                : selectedModel === 'lamp'
                ? 'table_lamp_realistic.glb'
                : 'advanced_book_realistic.glb'
            }
            className="px-4 py-1.5 rounded-full text-xs font-bold bg-white text-neutral-950 hover:bg-neutral-200 transition-colors shadow-lg cursor-pointer"
          >
            Download .GLB
          </a>
        </div>
      </header>

      {/* Floating Custom Cover Art Controls Bar for 3D Book */}
      {selectedModel === 'book' && (
        <div className="absolute top-20 left-1/2 -translate-x-1/2 z-30 flex flex-col md:flex-row items-center gap-2 px-4 py-2 rounded-2xl bg-neutral-950/90 backdrop-blur-xl border border-white/15 shadow-2xl animate-in fade-in slide-in-from-top-2 duration-300">
          <span className="text-xs font-bold text-amber-300 whitespace-nowrap flex items-center gap-1.5">
            <span>🎨</span> Cover Presets:
          </span>
          <div className="flex items-center gap-1.5 flex-wrap">
            {COVER_PRESETS.map((preset, idx) => (
              <button
                key={idx}
                onClick={() => setCustomCoverUrl(preset.url)}
                className={`px-2.5 py-1 rounded-lg text-[11px] font-semibold transition-all cursor-pointer ${
                  customCoverUrl === preset.url
                    ? 'bg-amber-500 text-neutral-950 font-bold shadow-md'
                    : 'bg-white/10 hover:bg-white/20 text-neutral-300'
                }`}
              >
                {preset.name}
              </button>
            ))}
          </div>
          <div className="flex items-center gap-1.5 w-full md:w-auto mt-1 md:mt-0">
            <input
              type="text"
              placeholder="Paste any custom image URL..."
              value={inputUrl}
              onChange={(e) => setInputUrl(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter' && inputUrl.trim()) {
                  setCustomCoverUrl(inputUrl.trim());
                }
              }}
              className="px-3 py-1 text-xs rounded-lg bg-neutral-900 border border-white/20 text-white placeholder-neutral-500 focus:outline-none focus:border-amber-400 w-56 font-mono"
            />
            <button
              onClick={() => {
                if (inputUrl.trim()) setCustomCoverUrl(inputUrl.trim());
              }}
              className="px-3 py-1 rounded-lg text-xs font-bold bg-amber-500 hover:bg-amber-400 text-neutral-950 transition-colors cursor-pointer shadow-md"
            >
              Apply
            </button>
          </div>
        </div>
      )}

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
            ) : selectedModel === 'bookshelf' ? (
              <BookshelfModel autoRotate={autoRotate} />
            ) : selectedModel === 'lamp' ? (
              <LampViewerModel autoRotate={autoRotate} />
            ) : (
              <BookViewerModel autoRotate={autoRotate} coverUrl={customCoverUrl} />
            )}

            {/* Soft drop shadow strictly on floor plane */}
            <ContactShadows
              position={modelInfo.shadowPos}
              opacity={
                selectedModel === 'plant'
                  ? 0.6
                  : selectedModel === 'lamp'
                  ? 0.55
                  : selectedModel === 'book'
                  ? 0.6
                  : 0.45
              }
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
            minDistance={
              selectedModel === 'plant'
                ? 0.2
                : selectedModel === 'lamp'
                ? 0.25
                : selectedModel === 'book'
                ? 0.25
                : 1.2
            }
            maxDistance={
              selectedModel === 'plant'
                ? 1.6
                : selectedModel === 'lamp'
                ? 1.8
                : selectedModel === 'book'
                ? 2.2
                : 6.0
            }
            target={
              selectedModel === 'plant'
                ? [0, 0.06, 0]
                : selectedModel === 'lamp'
                ? [0, 0.04, 0]
                : selectedModel === 'book'
                ? [0, 0, 0]
                : [0, 0, 0]
            }
            maxPolarAngle={Math.PI / 2 + 0.05}
          />
        </Canvas>
      </div>

      {/* Bottom Hint */}
      <div className="absolute bottom-6 left-1/2 -translate-x-1/2 z-30 px-5 py-2 rounded-full bg-neutral-950/80 backdrop-blur-md border border-white/10 text-neutral-400 text-xs flex items-center gap-2 pointer-events-none shadow-2xl">
        <span className="text-amber-400">✦</span>
        <span>
          {selectedModel === 'plant'
            ? 'Click & drag to rotate 360° • Scroll to inspect photographic transparent leaves & ceramic finish'
            : selectedModel === 'lamp'
            ? 'Click & drag to rotate 360° • Inspect brushed brass base, opal glass diffuser & warm 2700K downward glow'
            : selectedModel === 'book'
            ? 'Click & drag to rotate 360° • Select a preset or paste any image URL above to map your custom cover in real-time!'
            : 'Click & drag to rotate 360° • Scroll mouse wheel to inspect architectural compartments'}
        </span>
      </div>
    </div>
  );
}
