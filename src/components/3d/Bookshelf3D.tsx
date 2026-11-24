'use client';

import { useRef, useState, useMemo } from 'react';
import { useFrame } from '@react-three/fiber';

import * as THREE from 'three';
import { BookshelfItem, BookItem } from '@/types/library';
import { Book3D } from './Book3D';
import { Plant3D } from './Plant3D';

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

  // =====================================================================
  // 1. DIMENSIONS — Clean Reference-Matching White Bookcase
  // 4 horizontal shelves, crown molding top, base molding bottom
  // =====================================================================
  const width = 2.4;
  const height = 2.0;
  const depth = 0.44;
  const boardThick = 0.04;
  const crownOverhang = 0.04; // Crown molding extends wider
  const baseOverhang = 0.02;

  const innerW = width - 2 * boardThick;
  const innerH = height - boardThick * 2; // Inside between top and bottom boards

  // 4 shelves equally spaced inside
  const shelfCount = 3; // 3 horizontal dividers = 4 compartments
  const compartmentH = innerH / (shelfCount + 1);

  // =====================================================================
  // 2. MATERIALS — Warm White Frame + Peach Backboard + LED Glow
  // =====================================================================
  const materials = useMemo(() => {
    // Clean warm white lacquer frame
    const whiteMaterial = new THREE.MeshStandardMaterial({
      color: '#faf8f4',
      roughness: 0.3,
      metalness: 0.02,
    });

    // Warm peach/cream backboard (matching reference image)
    const backboardMaterial = new THREE.MeshStandardMaterial({
      color: '#f5e0c8',
      roughness: 0.5,
      metalness: 0.01,
    });

    // LED strip warm glow material
    const ledMaterial = new THREE.MeshBasicMaterial({
      color: '#fff5e6',
      toneMapped: false,
    });

    return {
      whiteMaterial,
      backboardMaterial,
      ledMaterial,
    };
  }, []);

  // =====================================================================
  // 3. CRYSTAL CLEAR WALL-MOUNTED AUTHOR NAME CARD (4K Canvas)
  // =====================================================================
  const authorCardTexture = useMemo(() => {
    if (typeof window === 'undefined') return undefined;
    const canvas = document.createElement('canvas');
    canvas.width = 2048;
    canvas.height = 512;
    const ctx = canvas.getContext('2d');
    if (!ctx) return undefined;

    // Clean cream/ivory card background
    ctx.fillStyle = '#faf6ef';
    ctx.fillRect(0, 0, 2048, 512);

    // Subtle warm border
    ctx.strokeStyle = '#d4c4a8';
    ctx.lineWidth = 6;
    ctx.strokeRect(16, 16, 2016, 480);

    // Inner fine gold accent line
    ctx.strokeStyle = '#c4a76c';
    ctx.lineWidth = 2;
    ctx.strokeRect(28, 28, 1992, 456);

    // Top decorative rule
    ctx.strokeStyle = '#c4a76c';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(300, 110);
    ctx.lineTo(1748, 110);
    ctx.stroke();

    // "CURATED COLLECTION" label
    ctx.fillStyle = '#8b7355';
    ctx.font = '600 32px "Cinzel", "Georgia", serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.letterSpacing = '10px';
    ctx.fillText('CURATED COLLECTION', 1024, 75);

    // AUTHOR NAME — Large, bold, deep charcoal
    ctx.fillStyle = '#2c1810';
    ctx.font = '900 108px "Cinzel", "Playfair Display", "Times New Roman", serif';
    ctx.letterSpacing = '5px';
    ctx.fillText(shelf.author.toUpperCase(), 1024, 240);

    // Bottom decorative rule
    ctx.strokeStyle = '#c4a76c';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(300, 330);
    ctx.lineTo(1748, 330);
    ctx.stroke();

    // Genre tag
    ctx.fillStyle = '#6b5a42';
    ctx.font = '700 36px "Cinzel", "Georgia", serif';
    ctx.letterSpacing = '6px';
    ctx.fillText(shelf.genre.toUpperCase(), 1024, 395);

    // Small diamond ornaments
    const drawDiamond = (cx: number, cy: number, s: number) => {
      ctx.fillStyle = '#c4a76c';
      ctx.beginPath();
      ctx.moveTo(cx, cy - s);
      ctx.lineTo(cx + s, cy);
      ctx.lineTo(cx, cy + s);
      ctx.lineTo(cx - s, cy);
      ctx.closePath();
      ctx.fill();
    };
    drawDiamond(260, 240, 8);
    drawDiamond(1788, 240, 8);

    const tex = new THREE.CanvasTexture(canvas);
    tex.generateMipmaps = false;
    tex.minFilter = THREE.LinearFilter;
    tex.magFilter = THREE.LinearFilter;
    tex.needsUpdate = true;
    return tex;
  }, [shelf.author, shelf.genre]);

  const authorCardMaterial = useMemo(
    () =>
      new THREE.MeshBasicMaterial({
        map: authorCardTexture,
        toneMapped: false,
        side: THREE.DoubleSide,
      }),
    [authorCardTexture]
  );

  // Subtle floating idle motion when not inspected
  useFrame((state) => {
    if (!groupRef.current) return;
    if (!isInspected) {
      const t = state.clock.elapsedTime;
      groupRef.current.position.y = position[1] + Math.sin(t * 0.8 + shelf.t * 4) * 0.012;
    }
  });

  // Distribute books across 4 shelf tiers
  const books = shelf.books;
  const tier1Books = books.slice(0, 2); // Top shelf — 2 books
  const tier2Books = books.slice(2, 4); // Second shelf — 2 books
  const tier3Books = books.slice(4, 6); // Third shelf — 2 books
  const tier4Books = books.length > 6 ? books.slice(6) : []; // Bottom — remainder

  const getShelfY = (tierIdx: number) => {
    // tierIdx: 0=top, 1=second, 2=third, 3=bottom
    // Each tier sits on top of its shelf board
    return -height / 2 + boardThick + (shelfCount - tierIdx) * compartmentH + boardThick / 2;
  };

  // Plant placement variants for each shelf
  const plantVariants: Array<'trailing' | 'bushy' | 'succulent'> = ['trailing', 'bushy', 'succulent'];

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
      {/* 1. WALL-MOUNTED CRYSTAL CLEAR AUTHOR NAME CARD            */}
      {/* Mounted on the wall above the bookshelf — 4K clarity      */}
      {/* ========================================================= */}
      <group position={[0, height / 2 + 0.32, -depth / 2 + 0.02]}>
        {/* Card backing plate */}
        <mesh castShadow>
          <boxGeometry args={[1.9, 0.38, 0.025]} />
          <meshStandardMaterial color="#f5f0e6" roughness={0.4} metalness={0.03} />
        </mesh>
        {/* Card face with author text */}
        <mesh position={[0, 0, 0.015]} material={authorCardMaterial}>
          <planeGeometry args={[1.84, 0.34]} />
        </mesh>
      </group>

      {/* ========================================================= */}
      {/* 2. BACK PANEL — Warm Peach/Cream Backboard                */}
      {/* ========================================================= */}
      <mesh
        position={[0, 0, -depth / 2 + 0.012]}
        material={materials.backboardMaterial}
        receiveShadow
      >
        <boxGeometry args={[innerW, innerH, 0.02]} />
      </mesh>

      {/* ========================================================= */}
      {/* 3. CROWN MOLDING TOP — Wider, elegant top board           */}
      {/* ========================================================= */}
      <mesh
        position={[0, height / 2 - boardThick / 2, crownOverhang / 2]}
        material={materials.whiteMaterial}
        castShadow
        receiveShadow
      >
        <boxGeometry args={[width + crownOverhang * 2, boardThick * 1.3, depth + crownOverhang]} />
      </mesh>

      {/* ========================================================= */}
      {/* 4. BASE MOLDING BOTTOM — Slightly wider base              */}
      {/* ========================================================= */}
      <mesh
        position={[0, -height / 2 + boardThick / 2, baseOverhang / 2]}
        material={materials.whiteMaterial}
        castShadow
        receiveShadow
      >
        <boxGeometry args={[width + baseOverhang * 2, boardThick * 1.1, depth + baseOverhang]} />
      </mesh>

      {/* ========================================================= */}
      {/* 5. LEFT & RIGHT SIDE BOARDS                               */}
      {/* ========================================================= */}
      <mesh
        position={[-width / 2 + boardThick / 2, 0, 0]}
        material={materials.whiteMaterial}
        castShadow
        receiveShadow
      >
        <boxGeometry args={[boardThick, height - 2 * boardThick, depth]} />
      </mesh>
      <mesh
        position={[width / 2 - boardThick / 2, 0, 0]}
        material={materials.whiteMaterial}
        castShadow
        receiveShadow
      >
        <boxGeometry args={[boardThick, height - 2 * boardThick, depth]} />
      </mesh>

      {/* ========================================================= */}
      {/* 6. 3 HORIZONTAL SHELF BOARDS (creating 4 tiers)           */}
      {/* ========================================================= */}
      {Array.from({ length: shelfCount }).map((_, idx) => {
        const shelfY = -height / 2 + boardThick + (idx + 1) * compartmentH;
        return (
          <group key={`shelf-${idx}`}>
            {/* Shelf board */}
            <mesh
              position={[0, shelfY, 0]}
              material={materials.whiteMaterial}
              castShadow
              receiveShadow
            >
              <boxGeometry args={[innerW, boardThick, depth - 0.01]} />
            </mesh>

            {/* LED strip light on underside of each shelf — subtle warm glow */}
            <mesh position={[0, shelfY - boardThick / 2 - 0.005, depth / 2 - 0.06]}>
              <boxGeometry args={[innerW * 0.85, 0.008, 0.015]} />
              <meshBasicMaterial color="#fff5e6" toneMapped={false} />
            </mesh>
            {/* LED point light for illumination effect */}
            <pointLight
              position={[0, shelfY - boardThick / 2 - 0.03, 0.05]}
              intensity={0.3}
              distance={1.0}
              color="#fff5e6"
            />
          </group>
        );
      })}

      {/* ========================================================= */}
      {/* 7. 3D BOOKS DISTRIBUTED ACROSS TIERS                      */}
      {/* ========================================================= */}

      {/* Tier 1 (Top) — Books + Plant */}
      <group position={[0, getShelfY(0), 0.04]}>
        {tier1Books.map((book, idx) => {
          const spacing = 0.14;
          const startX = -0.3;
          return (
            <Book3D
              key={book.id}
              book={book}
              position={[startX + idx * spacing, 0, 0]}
              tiltAngle={idx === 0 ? 0.02 : -0.015}
              isShelfInspected={isInspected}
              onSelectBook={onSelectBook}
            />
          );
        })}
        {/* Trailing plant on top shelf right side */}
        <Plant3D
          position={[0.55, 0, 0.02]}
          scale={0.85}
          variant={plantVariants[0]}
        />
      </group>

      {/* Tier 2 — Books */}
      <group position={[0, getShelfY(1), 0.04]}>
        {tier2Books.map((book, idx) => {
          const spacing = 0.14;
          const startX = -0.15;
          return (
            <Book3D
              key={book.id}
              book={book}
              position={[startX + idx * spacing, 0, 0]}
              tiltAngle={idx === 1 ? 0.025 : 0}
              isShelfInspected={isInspected}
              onSelectBook={onSelectBook}
            />
          );
        })}
        {/* Small bushy plant */}
        <Plant3D
          position={[-0.6, 0, 0.02]}
          scale={0.7}
          variant={plantVariants[1]}
        />
      </group>

      {/* Tier 3 — Books */}
      <group position={[0, getShelfY(2), 0.04]}>
        {tier3Books.map((book, idx) => {
          const spacing = 0.13;
          const startX = 0.15;
          return (
            <Book3D
              key={book.id}
              book={book}
              position={[startX + idx * spacing, 0, 0]}
              tiltAngle={0}
              isShelfInspected={isInspected}
              onSelectBook={onSelectBook}
            />
          );
        })}
        {/* Succulent plant on right */}
        <Plant3D
          position={[-0.5, 0, 0.03]}
          scale={0.65}
          variant={plantVariants[2]}
        />
      </group>

      {/* Tier 4 (Bottom) — Remaining books */}
      {tier4Books.length > 0 && (
        <group position={[0, getShelfY(3), 0.04]}>
          {tier4Books.map((book, idx) => {
            const spacing = 0.13;
            const startX = -((tier4Books.length - 1) * spacing) / 2;
            return (
              <Book3D
                key={book.id}
                book={book}
                position={[startX + idx * spacing, 0, 0]}
                tiltAngle={idx === 0 ? 0.02 : 0}
                isShelfInspected={isInspected}
                onSelectBook={onSelectBook}
              />
            );
          })}
        </group>
      )}

      {/* ========================================================= */}
      {/* 8. WARM SPOTLIGHTS WASHING OVER BOOKSHELF                 */}
      {/* ========================================================= */}
      <pointLight
        position={[0, height / 2 + 0.6, depth * 1.3]}
        intensity={1.8}
        distance={5.0}
        color="#fff8e1"
      />
      <pointLight
        position={[0, 0, depth * 1.5]}
        intensity={1.0}
        distance={3.5}
        color="#ffffff"
      />

      {/* Hover Selection Glow Ring */}
      {shelfHovered && !isInspected && (
        <group position={[0, -height / 2 - 0.18, depth / 2 + 0.1]}>
          <mesh rotation={[-Math.PI / 2, 0, 0]}>
            <ringGeometry args={[0.6, 0.78, 32]} />
            <meshBasicMaterial
              color="#c4a76c"
              transparent
              opacity={0.7}
              side={THREE.DoubleSide}
            />
          </mesh>
        </group>
      )}
    </group>
  );
}
