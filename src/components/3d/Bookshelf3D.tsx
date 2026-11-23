'use client';

import { useRef, useState, useMemo } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { BookshelfItem, BookItem } from '@/types/library';
import { Book3D } from './Book3D';

interface Bookshelf3DProps {
  shelf: BookshelfItem;
  position: [number, number, number];
  rotation: [number, number, number];
  isInspected: boolean;
  onSelectShelf: (shelf: BookshelfItem) => void;
  onSelectBook?: (book: BookItem) => void;
}

export function Bookshelf3D({
  shelf,
  position,
  rotation,
  isInspected,
  onSelectShelf,
  onSelectBook,
}: Bookshelf3DProps) {
  const groupRef = useRef<THREE.Group>(null!);
  const [shelfHovered, setShelfHovered] = useState(false);

  // Grand Museum Bookcase Dimensions
  const width = 2.5;
  const height = 3.7;
  const depth = 0.85;
  const halfW = width / 2;
  const columnWidth = 0.16;
  const innerW = width - columnWidth * 2;

  // Shelving tier levels (Y positions of shelf surfaces)
  const lowerShelfY = -0.55;
  const upperShelfY = 0.58;
  const baseShelfY = -height / 2 + 0.18;

  // -----------------------------------------------------------------
  // 1. PROCEDURAL ANTIQUE MAHOGANY WOOD TEXTURE (1024 x 1024)
  // -----------------------------------------------------------------
  const antiqueWoodTexture = useMemo(() => {
    if (typeof window === 'undefined') return undefined;
    const canvas = document.createElement('canvas');
    canvas.width = 1024;
    canvas.height = 1024;
    const ctx = canvas.getContext('2d');
    if (!ctx) return undefined;

    // Deep rich antique Cuban mahogany base
    ctx.fillStyle = '#2a1408';
    ctx.fillRect(0, 0, 1024, 1024);

    // Flowing wood grain rings and figure
    for (let i = 0; i < 60; i++) {
      const y = (i / 60) * 1024;
      const grad = ctx.createLinearGradient(0, y, 1024, y + 25);
      grad.addColorStop(0, 'rgba(68, 32, 14, 0.6)');
      grad.addColorStop(0.3, 'rgba(84, 40, 18, 0.8)');
      grad.addColorStop(0.7, 'rgba(52, 24, 10, 0.6)');
      grad.addColorStop(1, 'rgba(34, 16, 7, 0.9)');
      ctx.fillStyle = grad;
      ctx.fillRect(0, y, 1024, 18);
    }

    // Micro wood pores and fibers
    const imgData = ctx.getImageData(0, 0, 1024, 1024);
    const d = imgData.data;
    for (let i = 0; i < d.length; i += 4) {
      const noise = (Math.random() - 0.5) * 16;
      d[i] = Math.min(255, Math.max(0, d[i] + noise));
      d[i + 1] = Math.min(255, Math.max(0, d[i + 1] + noise * 0.6));
      d[i + 2] = Math.min(255, Math.max(0, d[i + 2] + noise * 0.3));
    }
    ctx.putImageData(imgData, 0, 0);

    const tex = new THREE.CanvasTexture(canvas);
    tex.wrapS = THREE.RepeatWrapping;
    tex.wrapT = THREE.RepeatWrapping;
    tex.generateMipmaps = false;
    tex.minFilter = THREE.LinearFilter;
    tex.magFilter = THREE.LinearFilter;
    tex.needsUpdate = true;
    return tex;
  }, []);

  // -----------------------------------------------------------------
  // 2. ULTRA-CRISP 4K ENGRAVED MUSEUM BRASS AUTHOR PLAQUE (2048 x 640)
  // Razor-sharp vector-like clarity with zero blurriness
  // -----------------------------------------------------------------
  const plaqueTexture = useMemo(() => {
    if (typeof window === 'undefined') return undefined;
    const canvas = document.createElement('canvas');
    canvas.width = 2048;
    canvas.height = 640;
    const ctx = canvas.getContext('2d');
    if (!ctx) return undefined;

    // A. Rich Hand-Polished Antique Brushed Brass Background
    const brassGrad = ctx.createLinearGradient(0, 0, 2048, 640);
    brassGrad.addColorStop(0, '#d4a244');
    brassGrad.addColorStop(0.2, '#f6d278');
    brassGrad.addColorStop(0.5, '#e0b050');
    brassGrad.addColorStop(0.8, '#f9dc88');
    brassGrad.addColorStop(1, '#c59235');
    ctx.fillStyle = brassGrad;
    ctx.fillRect(0, 0, 2048, 640);

    // Subtle horizontal brushed brass directional grain
    ctx.fillStyle = 'rgba(255, 255, 255, 0.08)';
    for (let y = 0; y < 640; y += 4) {
      ctx.fillRect(0, y, 2048, 1.5);
    }
    ctx.fillStyle = 'rgba(0, 0, 0, 0.05)';
    for (let y = 2; y < 640; y += 6) {
      ctx.fillRect(0, y, 2048, 1);
    }

    // B. Deep Black Enamel Engraved Border Channels
    // Heavy outer beveled border
    ctx.strokeStyle = '#181206';
    ctx.lineWidth = 14;
    ctx.strokeRect(28, 28, 1992, 584);

    // Inner bright gold highlight line
    ctx.strokeStyle = '#fff3c4';
    ctx.lineWidth = 4;
    ctx.strokeRect(40, 40, 1968, 560);

    // Secondary engraved black filigree border
    ctx.strokeStyle = '#2d1f08';
    ctx.lineWidth = 4;
    ctx.strokeRect(56, 56, 1936, 528);

    // C. 4 Authentic Antique Slotted Brass Screws in Corners
    const screwPositions = [
      [80, 80],
      [1968, 80],
      [80, 560],
      [1968, 560],
    ];
    screwPositions.forEach(([sx, sy]) => {
      // Screw rim
      ctx.fillStyle = '#9e731b';
      ctx.beginPath();
      ctx.arc(sx, sy, 22, 0, Math.PI * 2);
      ctx.fill();

      // Screw head
      ctx.fillStyle = '#fce498';
      ctx.beginPath();
      ctx.arc(sx, sy, 18, 0, Math.PI * 2);
      ctx.fill();

      // Screw center slot
      ctx.strokeStyle = '#1c1203';
      ctx.lineWidth = 4;
      ctx.beginPath();
      ctx.moveTo(sx - 12, sy - 12);
      ctx.lineTo(sx + 12, sy + 12);
      ctx.stroke();
    });

    // D. Header: Museum Hall / Classical Archive Seal
    ctx.fillStyle = '#261805';
    ctx.font = 'bold 36px "Cinzel", "Georgia", "Times New Roman", serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.letterSpacing = '10px';
    ctx.fillText('GRAND MUSÉE DE LITTÉRATURE • ARCHIVES OFFICIELLES', 1024, 120);

    // Decorative horizontal flourish bar with center diamond
    ctx.strokeStyle = '#4a320c';
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.moveTo(420, 170);
    ctx.lineTo(1628, 170);
    ctx.stroke();

    // Center brass star/diamond
    ctx.fillStyle = '#1c1203';
    ctx.beginPath();
    ctx.moveTo(1024, 158);
    ctx.lineTo(1036, 170);
    ctx.lineTo(1024, 182);
    ctx.lineTo(1012, 170);
    ctx.closePath();
    ctx.fill();

    // E. AUTHOR NAME - MASSIVE, DEEP BLACK ENAMEL ENGRAVED (ULTRA CRISP)
    ctx.save();
    // Engraved highlight (simulates sunlit bevel inside the engraved letters)
    ctx.fillStyle = 'rgba(255, 255, 255, 0.7)';
    ctx.font = '900 115px "Cinzel", "Playfair Display", "Times New Roman", Georgia, serif';
    ctx.letterSpacing = '6px';
    ctx.fillText(shelf.author.toUpperCase(), 1026, 308);

    // Deep crisp jet-black enamel lettering
    ctx.fillStyle = '#0a0703';
    ctx.fillText(shelf.author.toUpperCase(), 1024, 304);
    ctx.restore();

    // F. Genre / Era Ribbon Seal
    ctx.fillStyle = '#1c1305';
    ctx.beginPath();
    ctx.roundRect(1024 - 440, 440, 880, 84, 42);
    ctx.fill();

    // Gold inner border on ribbon
    ctx.strokeStyle = '#d4a244';
    ctx.lineWidth = 3;
    ctx.stroke();

    ctx.fillStyle = '#fae19a';
    ctx.font = '700 40px "Cinzel", "Georgia", -apple-system, serif';
    ctx.letterSpacing = '3px';
    ctx.fillText(shelf.genre.toUpperCase(), 1024, 482);

    const tex = new THREE.CanvasTexture(canvas);
    // Crucial: Disable mipmaps to ensure 100% full-resolution sharpness without blur
    tex.generateMipmaps = false;
    tex.minFilter = THREE.LinearFilter;
    tex.magFilter = THREE.LinearFilter;
    tex.needsUpdate = true;
    return tex;
  }, [shelf.author, shelf.genre]);

  // -----------------------------------------------------------------
  // 3. ARCHITECTURAL MATERIALS
  // -----------------------------------------------------------------
  const materials = useMemo(() => {
    // Rich Cuban Antique Handcrafted Mahogany
    const mahoganyMaterial = new THREE.MeshStandardMaterial({
      map: antiqueWoodTexture,
      color: '#381c0c',
      roughness: 0.32,
      metalness: 0.06,
      emissive: '#180a03',
      emissiveIntensity: 0.12,
    });

    // Dark carved trim highlights
    const carvedWoodMaterial = new THREE.MeshStandardMaterial({
      color: '#281206',
      roughness: 0.4,
      metalness: 0.08,
      emissive: '#120702',
      emissiveIntensity: 0.08,
    });

    // Antique Museum Heavy Cast Brass
    const antiqueBrassMaterial = new THREE.MeshStandardMaterial({
      color: '#d4a244',
      roughness: 0.24,
      metalness: 0.88,
      emissive: '#664614',
      emissiveIntensity: 0.15,
    });

    // Razor-Sharp Plaque Face Material (Self-illuminated so 100% visible from afar)
    const plaqueFaceMaterial = new THREE.MeshBasicMaterial({
      map: plaqueTexture,
      toneMapped: false,
      side: THREE.DoubleSide,
    });

    // Fluted dark panel backing
    const backboardMaterial = new THREE.MeshStandardMaterial({
      color: '#1a0b04',
      roughness: 0.6,
      metalness: 0.04,
    });

    // Brass picture lamp hooded shade material
    const pictureLampMaterial = new THREE.MeshStandardMaterial({
      color: '#c99a3e',
      metalness: 0.9,
      roughness: 0.2,
      emissive: '#7a5416',
      emissiveIntensity: 0.2,
    });

    return {
      mahoganyMaterial,
      carvedWoodMaterial,
      antiqueBrassMaterial,
      plaqueFaceMaterial,
      backboardMaterial,
      pictureLampMaterial,
    };
  }, [antiqueWoodTexture, plaqueTexture]);

  // Gentle breathing idle floating motion when not inspected
  useFrame((state) => {
    if (!groupRef.current) return;
    if (!isInspected) {
      const t = state.clock.elapsedTime;
      groupRef.current.position.y = position[1] + Math.sin(t * 0.75 + shelf.t * 5) * 0.02;
    }
  });

  // Standardized high-fidelity books for full capacity
  const fullShelfBooks = useMemo(() => {
    const list: BookItem[] = [];
    while (list.length < 16) {
      for (const b of shelf.books) {
        list.push({
          ...b,
          id: `${b.id}-${list.length}`,
        });
        if (list.length >= 16) break;
      }
    }
    return list;
  }, [shelf.books]);

  const lowerBooks = fullShelfBooks.slice(0, 8);
  const upperBooks = fullShelfBooks.slice(8, 16);

  // Natural subtle tilts for authentic library look
  const naturalTilts = [0, 0.015, -0.018, 0, 0.02, 0, -0.015, 0];

  return (
    <group
      ref={groupRef}
      position={position}
      rotation={rotation}
      onClick={(e) => {
        if (!isInspected) {
          e.stopPropagation();
          onSelectShelf(shelf);
        }
      }}
      onPointerOver={(e) => {
        if (!isInspected) {
          e.stopPropagation();
          setShelfHovered(true);
          document.body.style.cursor = 'pointer';
        }
      }}
      onPointerOut={() => {
        setShelfHovered(false);
        if (!isInspected) {
          document.body.style.cursor = 'auto';
        }
      }}
    >
      {/* ========================================================= */}
      {/* 1. HANDCRAFTED ANTIQUE MUSEUM CABINETRY ARCHITECTURE      */}
      {/* ========================================================= */}

      {/* --------------------------------------------------------- */}
      {/* A. LEFT & RIGHT FLUTED CLASSICAL PILASTER COLUMNS         */}
      {/* --------------------------------------------------------- */}
      {/* Left Column Group */}
      <group position={[-halfW + columnWidth / 2, 0, 0]}>
        {/* Main Column Body */}
        <mesh material={materials.mahoganyMaterial} castShadow receiveShadow>
          <boxGeometry args={[columnWidth, height - 0.5, depth]} />
        </mesh>
        {/* 3 Vertical Carved Fluting Channels along front */}
        {[-0.04, 0, 0.04].map((fluteX, idx) => (
          <mesh
            key={idx}
            position={[fluteX, 0, depth / 2 + 0.005]}
            material={materials.carvedWoodMaterial}
          >
            <boxGeometry args={[0.02, height - 0.8, 0.01]} />
          </mesh>
        ))}
        {/* Classical Column Capital at top */}
        <mesh
          position={[0, height / 2 - 0.35, depth / 2 + 0.01]}
          material={materials.carvedWoodMaterial}
          castShadow
        >
          <boxGeometry args={[columnWidth + 0.06, 0.14, 0.06]} />
        </mesh>
        {/* Column Plinth Base at bottom */}
        <mesh
          position={[0, -height / 2 + 0.35, depth / 2 + 0.01]}
          material={materials.carvedWoodMaterial}
          castShadow
        >
          <boxGeometry args={[columnWidth + 0.06, 0.22, 0.06]} />
        </mesh>
      </group>

      {/* Right Column Group */}
      <group position={[halfW - columnWidth / 2, 0, 0]}>
        {/* Main Column Body */}
        <mesh material={materials.mahoganyMaterial} castShadow receiveShadow>
          <boxGeometry args={[columnWidth, height - 0.5, depth]} />
        </mesh>
        {/* 3 Vertical Carved Fluting Channels along front */}
        {[-0.04, 0, 0.04].map((fluteX, idx) => (
          <mesh
            key={idx}
            position={[fluteX, 0, depth / 2 + 0.005]}
            material={materials.carvedWoodMaterial}
          >
            <boxGeometry args={[0.02, height - 0.8, 0.01]} />
          </mesh>
        ))}
        {/* Classical Column Capital at top */}
        <mesh
          position={[0, height / 2 - 0.35, depth / 2 + 0.01]}
          material={materials.carvedWoodMaterial}
          castShadow
        >
          <boxGeometry args={[columnWidth + 0.06, 0.14, 0.06]} />
        </mesh>
        {/* Column Plinth Base at bottom */}
        <mesh
          position={[0, -height / 2 + 0.35, depth / 2 + 0.01]}
          material={materials.carvedWoodMaterial}
          castShadow
        >
          <boxGeometry args={[columnWidth + 0.06, 0.22, 0.06]} />
        </mesh>
      </group>

      {/* --------------------------------------------------------- */}
      {/* B. TOP ENTABLATURE, ARCHED PEDIMENT & DENTIL MOLDING     */}
      {/* --------------------------------------------------------- */}
      <group position={[0, height / 2 - 0.1, 0]}>
        {/* Main Overhanging Classical Cornice */}
        <mesh material={materials.mahoganyMaterial} castShadow receiveShadow>
          <boxGeometry args={[width + 0.22, 0.12, depth + 0.08]} />
        </mesh>
        {/* Upper stepped frieze */}
        <mesh position={[0, 0.08, 0]} material={materials.carvedWoodMaterial} castShadow>
          <boxGeometry args={[width + 0.28, 0.06, depth + 0.12]} />
        </mesh>

        {/* 22 Handcrafted Classical Dentil Blocks along the frieze */}
        {Array.from({ length: 22 }).map((_, idx) => {
          const spacing = (width + 0.14) / 22;
          const dx = -((width + 0.14) / 2) + idx * spacing + spacing / 2;
          return (
            <mesh
              key={idx}
              position={[dx, -0.06, depth / 2 + 0.03]}
              material={materials.carvedWoodMaterial}
              castShadow
            >
              <boxGeometry args={[0.045, 0.04, 0.04]} />
            </mesh>
          );
        })}

        {/* Arched Classical Pediment Peak (Top Center) */}
        <group position={[0, 0.26, depth / 2 - 0.05]}>
          <mesh material={materials.mahoganyMaterial} castShadow>
            <cylinderGeometry args={[0.85, 0.85, 0.08, 32, 1, false, 0, Math.PI]} />
          </mesh>
          {/* Carved Central Medallion */}
          <mesh
            position={[0, 0.15, 0.05]}
            material={materials.antiqueBrassMaterial}
            castShadow
          >
            <cylinderGeometry args={[0.14, 0.14, 0.03, 24]} />
          </mesh>
        </group>
      </group>

      {/* --------------------------------------------------------- */}
      {/* C. BOTTOM CARVED PLINTH BASE                             */}
      {/* --------------------------------------------------------- */}
      <group position={[0, -height / 2 + 0.09, 0]}>
        <mesh material={materials.mahoganyMaterial} castShadow receiveShadow>
          <boxGeometry args={[width + 0.18, 0.18, depth + 0.06]} />
        </mesh>
        {/* Stepped base floor molding */}
        <mesh
          position={[0, -0.07, 0]}
          material={materials.carvedWoodMaterial}
          castShadow
          receiveShadow
        >
          <boxGeometry args={[width + 0.24, 0.06, depth + 0.1]} />
        </mesh>
      </group>

      {/* --------------------------------------------------------- */}
      {/* D. SHELVING TIERS & CARVED CORBEL BRACKETS                */}
      {/* --------------------------------------------------------- */}
      {/* Lower Shelf Tier */}
      <group position={[0, lowerShelfY, 0.02]}>
        {/* Solid Mahogany Shelf */}
        <mesh material={materials.mahoganyMaterial} castShadow receiveShadow>
          <boxGeometry args={[innerW, 0.07, depth - 0.04]} />
        </mesh>
        {/* Bullnose Carved Edge Trim */}
        <mesh
          position={[0, 0, (depth - 0.04) / 2 + 0.008]}
          material={materials.carvedWoodMaterial}
          castShadow
        >
          <boxGeometry args={[innerW, 0.04, 0.016]} />
        </mesh>
        {/* Left & Right Carved Support Corbels */}
        <mesh
          position={[-innerW / 2 + 0.06, -0.08, (depth - 0.04) / 2 - 0.06]}
          material={materials.carvedWoodMaterial}
          castShadow
        >
          <boxGeometry args={[0.07, 0.14, 0.14]} />
        </mesh>
        <mesh
          position={[innerW / 2 - 0.06, -0.08, (depth - 0.04) / 2 - 0.06]}
          material={materials.carvedWoodMaterial}
          castShadow
        >
          <boxGeometry args={[0.07, 0.14, 0.14]} />
        </mesh>
      </group>

      {/* Upper Shelf Tier */}
      <group position={[0, upperShelfY, 0.02]}>
        {/* Solid Mahogany Shelf */}
        <mesh material={materials.mahoganyMaterial} castShadow receiveShadow>
          <boxGeometry args={[innerW, 0.07, depth - 0.04]} />
        </mesh>
        {/* Bullnose Carved Edge Trim */}
        <mesh
          position={[0, 0, (depth - 0.04) / 2 + 0.008]}
          material={materials.carvedWoodMaterial}
          castShadow
        >
          <boxGeometry args={[innerW, 0.04, 0.016]} />
        </mesh>
        {/* Left & Right Carved Support Corbels */}
        <mesh
          position={[-innerW / 2 + 0.06, -0.08, (depth - 0.04) / 2 - 0.06]}
          material={materials.carvedWoodMaterial}
          castShadow
        >
          <boxGeometry args={[0.07, 0.14, 0.14]} />
        </mesh>
        <mesh
          position={[innerW / 2 - 0.06, -0.08, (depth - 0.04) / 2 - 0.06]}
          material={materials.carvedWoodMaterial}
          castShadow
        >
          <boxGeometry args={[0.07, 0.14, 0.14]} />
        </mesh>
      </group>

      {/* Back Panel - Antique dark wood boiserie */}
      <mesh
        position={[0, 0, -depth / 2 + 0.02]}
        material={materials.backboardMaterial}
        receiveShadow
      >
        <boxGeometry args={[innerW, height - 0.3, 0.04]} />
      </mesh>

      {/* ========================================================= */}
      {/* 2. RAZOR-SHARP ENGRAVED BRASS AUTHOR PLAQUE               */}
      {/* ========================================================= */}
      <group position={[0, height / 2 + 0.42, 0.08]}>
        {/* Solid Cast Brass Backing Plate with Beveled Rim */}
        <mesh material={materials.antiqueBrassMaterial} castShadow>
          <boxGeometry args={[2.28, 0.62, 0.06]} />
        </mesh>
        {/* Carved Mahogany Mounting Frame */}
        <mesh position={[0, 0, -0.035]} material={materials.carvedWoodMaterial} castShadow>
          <boxGeometry args={[2.34, 0.68, 0.03]} />
        </mesh>

        {/* Razor-Sharp 4K Plaque Face (Zero Blur, Crisp Vector Quality) */}
        <mesh position={[0, 0, 0.035]} material={materials.plaqueFaceMaterial}>
          <planeGeometry args={[2.22, 0.56]} />
        </mesh>

        {/* ------------------------------------------------------- */}
        {/* ANTIQUE BRASS GOOSENECK PICTURE LAMP SHINING ON PLAQUE  */}
        {/* ------------------------------------------------------- */}
        <group position={[0, 0.45, 0.2]}>
          {/* Curved Gooseneck Arm */}
          <mesh material={materials.antiqueBrassMaterial} castShadow>
            <cylinderGeometry args={[0.014, 0.014, 0.28, 16]} />
          </mesh>
          {/* Horizontal Hooded Reflector Shade */}
          <mesh
            position={[0, 0.1, 0.12]}
            rotation={[0, 0, Math.PI / 2]}
            material={materials.pictureLampMaterial}
            castShadow
          >
            <cylinderGeometry args={[0.045, 0.045, 0.85, 16]} />
          </mesh>
          {/* Warm Focused Museum Spotlight illuminating Plaque & Upper Tier */}
          <pointLight
            position={[0, 0.05, 0.16]}
            intensity={1.6}
            distance={3.2}
            color="#fff2db"
          />
        </group>
      </group>

      {/* Frontal Soft Light Illuminating Book Spines */}
      <pointLight
        position={[0, 0.1, 2.1]}
        intensity={1.0}
        distance={5.0}
        color="#ffffff"
      />

      {/* ========================================================= */}
      {/* 3. 3D BOOKS ON SHELVES (CRYSTAL CLEAR REALISTIC BOOKS)    */}
      {/* ========================================================= */}
      {/* Lower Shelf Books */}
      <group position={[0, lowerShelfY + 0.035, 0.08]}>
        {/* Left Antique Heavy Brass Bookend */}
        <mesh
          position={[-0.98, 0.32, 0]}
          material={materials.antiqueBrassMaterial}
          castShadow
        >
          <boxGeometry args={[0.03, 0.64, 0.48]} />
        </mesh>

        {lowerBooks.map((book, idx) => {
          const totalBooks = lowerBooks.length;
          const spacing = 0.24;
          const startX = -((totalBooks - 1) * spacing) / 2;
          const x = startX + idx * spacing;
          const tilt = naturalTilts[idx % naturalTilts.length];
          return (
            <Book3D
              key={book.id}
              book={book}
              position={[x, 0, 0]}
              tiltAngle={tilt}
              isShelfInspected={isInspected}
              onSelectBook={onSelectBook}
            />
          );
        })}

        {/* Right Antique Heavy Brass Bookend */}
        <mesh
          position={[0.98, 0.32, 0]}
          material={materials.antiqueBrassMaterial}
          castShadow
        >
          <boxGeometry args={[0.03, 0.64, 0.48]} />
        </mesh>
      </group>

      {/* Upper Shelf Books */}
      <group position={[0, upperShelfY + 0.035, 0.08]}>
        {/* Left Antique Heavy Brass Bookend */}
        <mesh
          position={[-0.98, 0.32, 0]}
          material={materials.antiqueBrassMaterial}
          castShadow
        >
          <boxGeometry args={[0.03, 0.64, 0.48]} />
        </mesh>

        {upperBooks.map((book, idx) => {
          const totalBooks = upperBooks.length;
          const spacing = 0.24;
          const startX = -((totalBooks - 1) * spacing) / 2;
          const x = startX + idx * spacing;
          const tilt = naturalTilts[(idx + 2) % naturalTilts.length];
          return (
            <Book3D
              key={book.id}
              book={book}
              position={[x, 0, 0]}
              tiltAngle={tilt}
              isShelfInspected={isInspected}
              onSelectBook={onSelectBook}
            />
          );
        })}

        {/* Right Antique Heavy Brass Bookend */}
        <mesh
          position={[0.98, 0.32, 0]}
          material={materials.antiqueBrassMaterial}
          castShadow
        >
          <boxGeometry args={[0.03, 0.64, 0.48]} />
        </mesh>
      </group>

      {/* Base Level: Rare Antique Foliants & Museum Relic Stack */}
      <group position={[0, baseShelfY + 0.07, 0.08]}>
        {/* Left Stack of Large Leather-Bound Folios */}
        <group position={[-0.6, 0.05, 0]}>
          <mesh
            position={[0, 0.035, 0]}
            material={materials.carvedWoodMaterial}
            castShadow
          >
            <boxGeometry args={[0.52, 0.07, 0.56]} />
          </mesh>
          <mesh
            position={[0.02, 0.1, 0.01]}
            rotation={[0, 0.04, 0]}
            material={materials.antiqueBrassMaterial}
            castShadow
          >
            <boxGeometry args={[0.46, 0.06, 0.5]} />
          </mesh>
        </group>

        {/* Center Classical Museum Brass Armillary Sphere / Relic */}
        <group position={[0, 0.24, 0]}>
          <mesh material={materials.antiqueBrassMaterial} castShadow>
            <torusGeometry args={[0.19, 0.022, 16, 32]} />
          </mesh>
          <mesh rotation={[Math.PI / 4, 0, 0]} material={materials.antiqueBrassMaterial}>
            <torusGeometry args={[0.16, 0.018, 16, 32]} />
          </mesh>
          <mesh position={[0, -0.16, 0]} material={materials.carvedWoodMaterial} castShadow>
            <cylinderGeometry args={[0.12, 0.15, 0.08, 24]} />
          </mesh>
        </group>

        {/* Right Stack of Antique Monograph Volumes */}
        <group position={[0.6, 0.05, 0]}>
          <mesh
            position={[0, 0.035, 0]}
            material={materials.antiqueBrassMaterial}
            castShadow
          >
            <boxGeometry args={[0.5, 0.07, 0.54]} />
          </mesh>
          <mesh
            position={[-0.02, 0.1, -0.01]}
            rotation={[0, -0.04, 0]}
            material={materials.mahoganyMaterial}
            castShadow
          >
            <boxGeometry args={[0.45, 0.06, 0.48]} />
          </mesh>
        </group>
      </group>

      {/* ========================================================= */}
      {/* 4. HOVER CALLOUT INDICATOR                                */}
      {/* ========================================================= */}
      {shelfHovered && !isInspected && (
        <group position={[0, -height / 2 - 0.12, depth / 2 + 0.2]}>
          <mesh rotation={[-Math.PI / 2, 0, 0]}>
            <ringGeometry args={[0.65, 0.88, 32]} />
            <meshBasicMaterial
              color="#d4a244"
              transparent
              opacity={0.9}
              side={THREE.DoubleSide}
            />
          </mesh>
        </group>
      )}
    </group>
  );
}