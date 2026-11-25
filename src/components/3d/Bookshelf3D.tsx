'use client';

import { useRef, useState, useMemo } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { BookshelfItem, BookItem } from '@/types/library';
import { RealisticModernWhiteBookshelf3D } from './RealisticModernWhiteBookshelf3D';
import { RealisticLamp3D } from './RealisticLamp3D';
import { RealisticPlantPot3D } from './RealisticPlantPot3D';
import { RealisticSmallFlowerPot3D } from './RealisticSmallFlowerPot3D';
import { AdvancedBook3D } from './AdvancedBook3D';

interface Bookshelf3DProps {
  shelf: BookshelfItem;
  position: [number, number, number];
  rotation: [number, number, number];
  isInspected: boolean;
  onSelectShelf: (shelf: BookshelfItem) => void;
  onSelectBook?: (book: BookItem) => void;
  onHoverBook?: (book: BookItem | null) => void;
}

const MOTIF_BY_AUTHOR: Record<string, 'sun' | 'arch' | 'cosmos' | 'botanical' | 'swiss'> = {
  murakami: 'cosmos',
  marquez: 'sun',
  woolf: 'botanical',
  asimov: 'cosmos',
  austen: 'arch',
  camus: 'swiss',
  borges: 'arch',
  kafka: 'swiss',
  dostoevsky: 'arch',
  orwell: 'swiss',
  tolstoy: 'sun',
  morrison: 'botanical',
  hesse: 'sun',
  wilde: 'botanical',
};

// Deep rich editorial hardcover tone mapper so every volume looks museum-grade
function resolveCoverPalette(
  book: BookItem,
  authorId: string,
  idx: number
): { bgTop: string; bgBottom: string; accent: string; spine: string; motif: 'sun' | 'arch' | 'cosmos' | 'botanical' | 'swiss' } {
  const motifs: Array<'sun' | 'arch' | 'cosmos' | 'botanical' | 'swiss'> = [
    MOTIF_BY_AUTHOR[authorId] || 'arch',
    'arch',
    'botanical',
    'sun',
    'cosmos',
    'swiss',
  ];

  // Darken bright hex into rich cloth tone if needed while preserving book identity
  const baseCol = new THREE.Color(book.color || '#1d2b44');
  const topCol = baseCol.clone().multiplyScalar(0.62);
  const botCol = baseCol.clone().multiplyScalar(0.34);
  const spineCol = baseCol.clone().multiplyScalar(0.45);

  return {
    bgTop: '#' + topCol.getHexString(),
    bgBottom: '#' + botCol.getHexString(),
    spine: '#' + spineCol.getHexString(),
    accent: book.accentColor || '#e5c158',
    motif: motifs[idx % motifs.length],
  };
}

let cachedPlaqueBrassMat: THREE.MeshStandardMaterial | null = null;
let cachedPlaqueBackingMat: THREE.MeshStandardMaterial | null = null;

function getPlaqueSharedMats() {
  if (!cachedPlaqueBrassMat) {
    cachedPlaqueBrassMat = new THREE.MeshStandardMaterial({
      color: '#cfb069',
      roughness: 0.28,
      metalness: 0.86,
    });
  }
  if (!cachedPlaqueBackingMat) {
    cachedPlaqueBackingMat = new THREE.MeshStandardMaterial({
      color: '#f5efe4',
      roughness: 0.45,
      metalness: 0.02,
    });
  }
  return { brassMat: cachedPlaqueBrassMat, backingMat: cachedPlaqueBackingMat };
}

export function Bookshelf3D({
  shelf,
  position,
  rotation,
  isInspected,
  onSelectShelf,
  onSelectBook,
  onHoverBook,
}: Bookshelf3DProps) {
  const groupRef = useRef<THREE.Group>(null!);
  const [shelfHovered, setShelfHovered] = useState(false);

  const { brassMat, backingMat } = useMemo(() => getPlaqueSharedMats(), []);

  // =====================================================================
  // 1. CRYSTAL CLEAR WALL-MOUNTED AUTHOR NAME PLAQUE (4K Mipmapped & Anisotropic)
  // High-contrast gallery typography legible smoothly from down the corridor
  // =====================================================================
  const authorCardMaterial = useMemo(() => {
    if (typeof window === 'undefined') return undefined;
    const canvas = document.createElement('canvas');
    canvas.width = 2048;
    canvas.height = 512;
    const ctx = canvas.getContext('2d');
    if (!ctx) return undefined;

    // Bright clean ivory museum sign base for maximum wall contrast
    ctx.fillStyle = '#fffdf8';
    ctx.fillRect(0, 0, 2048, 512);

    // Rich dark espresso-bronze perimeter framing rule
    ctx.strokeStyle = '#3c2a1a';
    ctx.lineWidth = 10;
    ctx.strokeRect(14, 14, 2020, 484);

    // Gold hairline inner frame
    ctx.strokeStyle = '#c5a059';
    ctx.lineWidth = 4;
    ctx.strokeRect(32, 32, 1984, 448);

    // Subtle divider lines
    ctx.strokeStyle = '#c5a059';
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.moveTo(220, 114);
    ctx.lineTo(1828, 114);
    ctx.stroke();

    // Eyebrow label
    ctx.fillStyle = '#7c5c34';
    ctx.font = '800 36px system-ui, -apple-system, sans-serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.letterSpacing = '10px';
    ctx.fillText('CURATED COLLECTION', 1024, 74);

    // OWNER / AUTHOR NAME — Ultra-crisp heavy dark ink readable down entire corridor!
    ctx.fillStyle = '#120b07';
    const nameLen = shelf.author.length;
    const fontSize = nameLen > 18 ? 112 : 132;
    ctx.font = `900 ${fontSize}px Georgia, "Times New Roman", serif`;
    ctx.letterSpacing = '6px';
    ctx.fillText(shelf.author.toUpperCase(), 1024, 248);

    // Subtle crisp dark edge stroke so letters stay bold under oblique viewing angle
    ctx.lineWidth = 2.5;
    ctx.strokeStyle = '#120b07';
    ctx.strokeText(shelf.author.toUpperCase(), 1024, 248);

    ctx.strokeStyle = '#c5a059';
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.moveTo(220, 356);
    ctx.lineTo(1828, 356);
    ctx.stroke();

    ctx.fillStyle = '#4a3623';
    ctx.font = '800 38px system-ui, -apple-system, sans-serif';
    ctx.letterSpacing = '6px';
    ctx.fillText(shelf.genre.toUpperCase(), 1024, 414);

    const tex = new THREE.CanvasTexture(canvas);
    tex.colorSpace = THREE.SRGBColorSpace;
    tex.generateMipmaps = true;
    tex.minFilter = THREE.LinearMipmapLinearFilter;
    tex.magFilter = THREE.LinearFilter;
    tex.anisotropy = 16;
    tex.needsUpdate = true;

    return new THREE.MeshBasicMaterial({
      map: tex,
      toneMapped: false,
      side: THREE.DoubleSide,
    });
  }, [shelf.author, shelf.genre]);

  // Subtle hover lift feedback (strictly wall-mounted, gentle breathing motion only on hover)
  useFrame((_, delta) => {
    if (!groupRef.current) return;
    const targetScale = shelfHovered && !isInspected ? 1.008 : 1.0;
    const s = THREE.MathUtils.lerp(groupRef.current.scale.x, targetScale, Math.min(1, delta * 10));
    groupRef.current.scale.set(s, s, s);
  });

  // =====================================================================
  // 2. CURATED 3D BOOK PLACEMENT ACROSS COMPARTMENT BAYS
  // Positioned flush on shelf boards & angled cleanly toward gallery view
  // =====================================================================
  const bookScale = 0.98;
  const bookHalfH = (0.245 * bookScale) / 2; // Exact bottom flush with shelf surface
  const angleSign = shelf.side === 'left' ? -1 : 1;

  const bookSlots = useMemo(() => {
    // 7 gallery showcase slots across ALL 4 shelf tiers, turned ~32–38° so concave 3D page edges pop!
    const rawSlots = [
      // Bay Top-Left (next to Trailing Pothos)
      { x: -0.17, floorY: 0.374, z: 0.024, rotMag: 0.58 },
      // Bay Top-Right hero display
      { x: 0.45, floorY: 0.374, z: 0.022, rotMag: 0.64 },
      // Bay Row 3 Center (highlighted next to Tall Lamp bay)
      { x: -0.06, floorY: 0.039, z: 0.024, rotMag: 0.56 },
      // Bay Row 3 Right
      { x: 0.54, floorY: 0.039, z: 0.022, rotMag: 0.62 },
      // Bay Row 2 Wide Center (centered hero display flanked by Lamp & Flower Pot)
      { x: 0.01, floorY: -0.306, z: 0.026, rotMag: 0.55 },
      // Bay Bottom-Left (balanced right underneath Lamp bay)
      { x: -0.52, floorY: -0.678, z: 0.024, rotMag: 0.60 },
      // Bay Bottom-Center (right next to blooming Peace Lily flower pot)
      { x: 0.09, floorY: -0.678, z: 0.024, rotMag: 0.54 },
    ];

    return shelf.books.slice(0, rawSlots.length).map((book, idx) => {
      const sl = rawSlots[idx];
      const pal = resolveCoverPalette(book, shelf.id, idx);
      return {
        book,
        pal,
        position: [sl.x, sl.floorY + bookHalfH, sl.z] as [number, number, number],
        rotation: [0, angleSign * sl.rotMag, 0] as [number, number, number],
      };
    });
  }, [shelf.books, shelf.id, angleSign, bookHalfH]);

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
      {/* 1. WALL-MOUNTED 4K AUTHOR NAME PLAQUE (Above Shelf)       */}
      {/* Raised & enlarged for razor-sharp corridor legibility      */}
      {/* ========================================================= */}
      <group position={[0, 1.00, -0.156]}>
        {/* Brushed champagne brass outer border bevel */}
        <mesh material={brassMat} castShadow>
          <boxGeometry args={[1.76, 0.42, 0.022]} />
        </mesh>
        {/* Cream backing plate */}
        <mesh position={[0, 0, 0.005]} material={backingMat}>
          <boxGeometry args={[1.72, 0.38, 0.020]} />
        </mesh>
        {/* Crisp 4K mipmapped canvas face */}
        {authorCardMaterial && (
          <mesh position={[0, 0, 0.017]} material={authorCardMaterial}>
            <planeGeometry args={[1.68, 0.35]} />
          </mesh>
        )}
      </group>

      {/* ========================================================= */}
      {/* 2. MODERN WHITE ARCHITECTURAL ILLUMINATED WALL BOOKSHELF  */}
      {/* ========================================================= */}
      <RealisticModernWhiteBookshelf3D autoRotate={false} showPointLights={false} />

      {/* ========================================================= */}
      {/* 3. CURATED INTERIOR 3D OBJECTS (Flush on Shelves!)        */}
      {/* ========================================================= */}

      {/* A. Fluted Travertine & Linen Table Lamp in Tall Left Alcove */}
      {/* Shelf floor y = -0.306; lamp base inner offset = -0.14 * scale */}
      <group position={[-0.60, -0.306 + 0.14 * 0.96, 0.015]} rotation={[0, angleSign * 0.22, 0]} scale={[0.96, 0.96, 0.96]}>
        <RealisticLamp3D autoRotate={false} lightLevel={1} emitPointLight={false} />
      </group>

      {/* B. Trailing Pothos Planter on Top-Left Shelf */}
      {/* Shelf floor y = +0.374; pothos base inner offset = -0.02 * scale */}
      <group position={[-0.63, 0.374 + 0.02 * 0.90, 0.028]} rotation={[0, angleSign * 0.45, 0]} scale={[0.90, 0.90, 0.90]}>
        <RealisticPlantPot3D autoRotate={false} />
      </group>

      {/* C. Sculpted Small Ceramic Flower Pot in Tall Right Alcove */}
      {/* Shelf floor y = -0.678; flower pot base inner offset = -0.02 * scale */}
      <group position={[0.61, -0.678 + 0.02 * 1.0, 0.018]} rotation={[0, angleSign * -0.25, 0]} scale={[1.0, 1.0, 1.0]}>
        <RealisticSmallFlowerPot3D autoRotate={false} />
      </group>

      {/* D. Advanced 3D Casebound Hardcover Books (hover pops ONLY when shelf is inspected!) */}
      {bookSlots.map((slot) => (
        <AdvancedBook3D
          key={slot.book.id}
          title={slot.book.title}
          author={shelf.author}
          spineColor={slot.pal.spine}
          fallbackBgTop={slot.pal.bgTop}
          fallbackBgBottom={slot.pal.bgBottom}
          fallbackAccent={slot.pal.accent}
          fallbackMotif={slot.pal.motif}
          position={slot.position}
          rotation={slot.rotation}
          scale={bookScale}
          interactive={isInspected}
          showFloatingTooltip={false}
          onHoverChange={(isHov) => {
            if (onHoverBook) {
              onHoverBook(isHov ? slot.book : null);
            }
          }}
          onClick={() => {
            if (!isInspected) {
              onSelectShelf(shelf);
            } else if (onSelectBook) {
              onSelectBook(slot.book);
            }
          }}
        />
      ))}

      {/* Subtle Bottom Champagne Selection Underline on Hover */}
      {shelfHovered && !isInspected && (
        <mesh position={[0, -0.75, 0.08]}>
          <boxGeometry args={[1.66, 0.008, 0.012]} />
          <meshBasicMaterial color="#e5c158" toneMapped={false} />
        </mesh>
      )}
    </group>
  );
}
