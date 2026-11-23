'use client';

import { useRef, useState, useMemo } from 'react';
import { useFrame } from '@react-three/fiber';
import { Html } from '@react-three/drei';
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
  // 1. DIMENSIONS & ASYMMETRIC STEPPED GEOMETRY (Matching Reference Image)
  // =====================================================================
  const width = 2.4;
  const height = 1.75;
  const depth = 0.44;
  const boardThick = 0.052; // Chunky 5.2cm uniform designer boards

  const innerW = width - 2 * boardThick;
  const innerH = height - 2 * boardThick;
  const innerLeft = -innerW / 2;
  const innerBottom = -innerH / 2;

  // Normalized coordinate helper for internal dividers
  const getX = (normX: number) => innerLeft + normX * innerW;
  const getY = (normY: number) => innerBottom + normY * innerH;

  // =====================================================================
  // 2. MATERIALS: PURE SATIN WHITE LACQUER & MODERN ACCENTS
  // =====================================================================
  const materials = useMemo(() => {
    // Pure Architectural Satin White Lacquer
    const whiteSatinMaterial = new THREE.MeshStandardMaterial({
      color: '#ffffff',
      roughness: 0.28,
      metalness: 0.02,
    });

    // Back Panel
    const backPanelMaterial = new THREE.MeshStandardMaterial({
      color: '#f8f8fa',
      roughness: 0.45,
      metalness: 0.01,
    });

    // Sleek Brushed Brass Accents
    const brassMaterial = new THREE.MeshStandardMaterial({
      color: '#d4af37',
      roughness: 0.22,
      metalness: 0.85,
    });

    // Modern Ceramic Vase Material
    const ceramicMaterial = new THREE.MeshStandardMaterial({
      color: '#e8e2d8',
      roughness: 0.6,
      metalness: 0.02,
    });

    return {
      whiteSatinMaterial,
      backPanelMaterial,
      brassMaterial,
      ceramicMaterial,
    };
  }, []);

  // =====================================================================
  // 3. PHYSICAL 4K ENGRAVED MUSEUM BRASS AUTHOR PLAQUE (2048 x 560)
  // =====================================================================
  const plaqueTexture = useMemo(() => {
    if (typeof window === 'undefined') return undefined;
    const canvas = document.createElement('canvas');
    canvas.width = 2048;
    canvas.height = 560;
    const ctx = canvas.getContext('2d');
    if (!ctx) return undefined;

    // High-end brushed warm brass plate
    const bgGrad = ctx.createLinearGradient(0, 0, 2048, 560);
    bgGrad.addColorStop(0, '#e5be65');
    bgGrad.addColorStop(0.25, '#fae19a');
    bgGrad.addColorStop(0.5, '#edd080');
    bgGrad.addColorStop(0.75, '#fae3a5');
    bgGrad.addColorStop(1, '#d8af4f');
    ctx.fillStyle = bgGrad;
    ctx.fillRect(0, 0, 2048, 560);

    // Subtle brushed metal sheen lines
    ctx.fillStyle = 'rgba(255, 255, 255, 0.12)';
    for (let y = 0; y < 560; y += 4) {
      ctx.fillRect(0, y, 2048, 1.5);
    }

    // Outer and Inner Precision Border
    ctx.strokeStyle = '#221808';
    ctx.lineWidth = 10;
    ctx.strokeRect(20, 20, 2008, 520);

    ctx.strokeStyle = '#fff5cf';
    ctx.lineWidth = 3;
    ctx.strokeRect(32, 32, 1984, 496);

    // Corner brass mounting bolts
    const corners = [
      [64, 64],
      [1984, 64],
      [64, 496],
      [1984, 496],
    ];
    corners.forEach(([cx, cy]) => {
      ctx.fillStyle = '#9e731b';
      ctx.beginPath();
      ctx.arc(cx, cy, 16, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = '#fce498';
      ctx.beginPath();
      ctx.arc(cx, cy, 12, 0, Math.PI * 2);
      ctx.fill();
    });

    // Sub-header: Collection Label
    ctx.fillStyle = '#3a270b';
    ctx.font = 'bold 34px "Cinzel", "Georgia", serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.letterSpacing = '8px';
    ctx.fillText('YSHELF CURATED ARCHIVE • EXHIBIT COLLECTION', 1024, 110);

    // Divider Line
    ctx.strokeStyle = '#4a3310';
    ctx.lineWidth = 2.5;
    ctx.beginPath();
    ctx.moveTo(400, 155);
    ctx.lineTo(1648, 155);
    ctx.stroke();

    // AUTHOR NAME (Massive, crisp, deep black enamel lettering)
    ctx.save();
    ctx.fillStyle = 'rgba(255, 255, 255, 0.85)';
    ctx.font = '900 112px "Cinzel", "Playfair Display", "Times New Roman", serif';
    ctx.letterSpacing = '6px';
    ctx.fillText(shelf.author.toUpperCase(), 1026, 276);

    ctx.fillStyle = '#110b03';
    ctx.fillText(shelf.author.toUpperCase(), 1024, 272);
    ctx.restore();

    // Genre Tag Capsule
    ctx.fillStyle = '#1e1406';
    ctx.beginPath();
    ctx.roundRect(1024 - 380, 385, 760, 75, 38);
    ctx.fill();

    ctx.strokeStyle = '#d4af37';
    ctx.lineWidth = 2.5;
    ctx.stroke();

    ctx.fillStyle = '#fae19a';
    ctx.font = '700 36px "Cinzel", "Georgia", serif';
    ctx.letterSpacing = '3px';
    ctx.fillText(shelf.genre.toUpperCase(), 1024, 423);

    const tex = new THREE.CanvasTexture(canvas);
    tex.generateMipmaps = false;
    tex.minFilter = THREE.LinearFilter;
    tex.magFilter = THREE.LinearFilter;
    tex.needsUpdate = true;
    return tex;
  }, [shelf.author, shelf.genre]);

  const plaqueFaceMaterial = useMemo(
    () =>
      new THREE.MeshBasicMaterial({
        map: plaqueTexture,
        toneMapped: false,
        side: THREE.DoubleSide,
      }),
    [plaqueTexture]
  );

  // Subtle floating idle motion when not inspected
  useFrame((state) => {
    if (!groupRef.current) return;
    if (!isInspected) {
      const t = state.clock.elapsedTime;
      groupRef.current.position.y = position[1] + Math.sin(t * 0.8 + shelf.t * 4) * 0.015;
    }
  });

  // Distribute books across compartments
  const books = shelf.books;
  const zone5Books = books.slice(0, 3); // Lower-left cubby
  const zone6Books = books.slice(3, 6); // Lower-right wide shelf
  const featuredCoverBook = books[0];   // Displayed at an angle showing front cover

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
      {/* 1. CRYSTAL-CLEAR SCROLLING AUTHOR SIGNAGE (HTML BILLBOARD) */}
      {/* Fully visible, crisp and readable while scrolling past!  */}
      {/* ========================================================= */}
      <Html
        position={[0, height / 2 + 0.45, depth / 2 + 0.06]}
        center
        distanceFactor={6.8}
        style={{ pointerEvents: 'none' }}
      >
        <div className="flex flex-col items-center select-none pointer-events-none transform -translate-y-2 transition-transform duration-300">
          <div className="flex items-center gap-3 px-5 py-2 rounded-full bg-neutral-950/90 backdrop-blur-xl border border-amber-500/60 shadow-[0_12px_40px_rgba(0,0,0,0.85)]">
            <span className="w-2.5 h-2.5 rounded-full bg-amber-400 animate-pulse shadow-[0_0_10px_#f59e0b]" />
            <span className="text-sm md:text-base font-black tracking-widest uppercase text-amber-200 drop-shadow-md whitespace-nowrap font-serif">
              {shelf.author}
            </span>
            <span className="text-[10px] uppercase font-bold text-amber-300 bg-amber-950/90 px-2.5 py-0.5 rounded-full border border-amber-500/40 whitespace-nowrap hidden sm:inline">
              {shelf.genre}
            </span>
          </div>
          <span className="mt-1 text-[10px] font-semibold tracking-wider uppercase text-amber-300/90 bg-neutral-900/80 px-3 py-0.5 rounded-full border border-amber-400/30 backdrop-blur-md shadow-md whitespace-nowrap">
            ✦ Click shelf to explore
          </span>
        </div>
      </Html>

      {/* ========================================================= */}
      {/* 2. SOLID WALL MOUNT SPACER (Wall Attachment)              */}
      {/* ========================================================= */}
      <mesh position={[0, 0, -depth / 2 - 0.015]} material={materials.brassMaterial}>
        <boxGeometry args={[width * 0.85, height * 0.8, 0.03]} />
      </mesh>

      {/* ========================================================= */}
      {/* 3. RECESSED BACK PANEL                                    */}
      {/* ========================================================= */}
      <mesh
        position={[0, 0, -depth / 2 + 0.012]}
        material={materials.backPanelMaterial}
        receiveShadow
      >
        <boxGeometry args={[innerW, innerH, 0.02]} />
      </mesh>

      {/* ========================================================= */}
      {/* 4. OUTER PERIMETER FRAME (Chunky White Lacquer Boards)   */}
      {/* ========================================================= */}
      {/* Top Board */}
      <mesh
        position={[0, height / 2 - boardThick / 2, 0]}
        material={materials.whiteSatinMaterial}
        castShadow
        receiveShadow
      >
        <boxGeometry args={[width, boardThick, depth]} />
      </mesh>

      {/* Bottom Board */}
      <mesh
        position={[0, -height / 2 + boardThick / 2, 0]}
        material={materials.whiteSatinMaterial}
        castShadow
        receiveShadow
      >
        <boxGeometry args={[width, boardThick, depth]} />
      </mesh>

      {/* Left Outer Board */}
      <mesh
        position={[-width / 2 + boardThick / 2, 0, 0]}
        material={materials.whiteSatinMaterial}
        castShadow
        receiveShadow
      >
        <boxGeometry args={[boardThick, height - 2 * boardThick, depth]} />
      </mesh>

      {/* Right Outer Board */}
      <mesh
        position={[width / 2 - boardThick / 2, 0, 0]}
        material={materials.whiteSatinMaterial}
        castShadow
        receiveShadow
      >
        <boxGeometry args={[boardThick, height - 2 * boardThick, depth]} />
      </mesh>

      {/* ========================================================= */}
      {/* 5. ASYMMETRIC INTERNAL SHELVES & DIVIDERS                 */}
      {/* ========================================================= */}

      {/* A. Top Vertical Divider (drops from top y=1.0 down to upper shelf y=0.62 at x=0.40) */}
      {(() => {
        const topH = (1.0 - 0.62) * innerH;
        const cy = getY((1.0 + 0.62) / 2);
        const cx = getX(0.4);
        return (
          <mesh
            position={[cx, cy, 0]}
            material={materials.whiteSatinMaterial}
            castShadow
            receiveShadow
          >
            <boxGeometry args={[boardThick, topH, depth - 0.01]} />
          </mesh>
        );
      })()}

      {/* B. Upper Horizontal Shelf with CANTILEVERED LEFT WING */}
      {/* Runs from x=0.16 to x=0.68 at y=0.62; left side floats freely without touching left wall! */}
      {(() => {
        const spanW = (0.68 - 0.16) * innerW;
        const cx = getX((0.16 + 0.68) / 2);
        const cy = getY(0.62);
        return (
          <mesh
            position={[cx, cy, 0]}
            material={materials.whiteSatinMaterial}
            castShadow
            receiveShadow
          >
            <boxGeometry args={[spanW, boardThick, depth - 0.01]} />
          </mesh>
        );
      })()}

      {/* C. Upper-Right Vertical Riser (drops from y=0.62 to y=0.42 at x=0.68) */}
      {(() => {
        const riserH = (0.62 - 0.42) * innerH + boardThick;
        const cx = getX(0.68);
        const cy = getY((0.62 + 0.42) / 2);
        return (
          <mesh
            position={[cx, cy, 0]}
            material={materials.whiteSatinMaterial}
            castShadow
            receiveShadow
          >
            <boxGeometry args={[boardThick, riserH, depth - 0.01]} />
          </mesh>
        );
      })()}

      {/* D. Mid-Right & Central Niche Continuous Shelf (at y=0.42 from x=0.42 to x=1.0) */}
      {(() => {
        const spanW = (1.0 - 0.42) * innerW;
        const cx = getX((0.42 + 1.0) / 2);
        const cy = getY(0.42);
        return (
          <mesh
            position={[cx, cy, 0]}
            material={materials.whiteSatinMaterial}
            castShadow
            receiveShadow
          >
            <boxGeometry args={[spanW, boardThick, depth - 0.01]} />
          </mesh>
        );
      })()}

      {/* E. Mid-Left Vertical Riser (drops from y=0.42 down to y=0.28 at x=0.42) */}
      {(() => {
        const riserH = (0.42 - 0.28) * innerH + boardThick;
        const cx = getX(0.42);
        const cy = getY((0.42 + 0.28) / 2);
        return (
          <mesh
            position={[cx, cy, 0]}
            material={materials.whiteSatinMaterial}
            castShadow
            receiveShadow
          >
            <boxGeometry args={[boardThick, riserH, depth - 0.01]} />
          </mesh>
        );
      })()}

      {/* F. Lower-Left Horizontal Shelf (runs from x=0.0 to x=0.42 at y=0.28) */}
      {(() => {
        const spanW = 0.42 * innerW;
        const cx = getX(0.21);
        const cy = getY(0.28);
        return (
          <mesh
            position={[cx, cy, 0]}
            material={materials.whiteSatinMaterial}
            castShadow
            receiveShadow
          >
            <boxGeometry args={[spanW, boardThick, depth - 0.01]} />
          </mesh>
        );
      })()}

      {/* G. Lower Vertical Divider (drops from y=0.28 down to base y=0.0 at x=0.42) */}
      {(() => {
        const divH = 0.28 * innerH;
        const cx = getX(0.42);
        const cy = getY(0.14);
        return (
          <mesh
            position={[cx, cy, 0]}
            material={materials.whiteSatinMaterial}
            castShadow
            receiveShadow
          >
            <boxGeometry args={[boardThick, divH, depth - 0.01]} />
          </mesh>
        );
      })()}

      {/* ========================================================= */}
      {/* 6. STUNNING 3D POTTED PLANTS & GALLERY DECOR              */}
      {/* ========================================================= */}

      {/* Zone 1: Cantilevered Left Wing - Lush 3D Potted Plant with Cascading Vines */}
      <Plant3D
        position={[getX(0.24), getY(0.62) + boardThick / 2, 0.06]}
        scale={0.95}
      />

      {/* Zone 2: Upper-Right Double-Height Area - Ceramic Vase & Featured Angled Book */}
      <group position={[getX(0.86), getY(0.42) + boardThick / 2 + 0.20, 0.04]}>
        <mesh material={materials.ceramicMaterial} castShadow>
          <cylinderGeometry args={[0.075, 0.12, 0.40, 32]} />
        </mesh>
        <mesh position={[0, 0.22, 0]} material={materials.ceramicMaterial} castShadow>
          <torusGeometry args={[0.065, 0.014, 16, 32]} />
        </mesh>
        <mesh position={[0, -0.19, 0]} material={materials.brassMaterial} castShadow>
          <cylinderGeometry args={[0.125, 0.125, 0.02, 32]} />
        </mesh>
      </group>

      {/* Featured Hardcover Book in Zone 2 angled to show its illustrated front cover */}
      {featuredCoverBook && (
        <group position={[getX(0.72), getY(0.42) + boardThick / 2, 0.04]}>
          <Book3D
            book={featuredCoverBook}
            position={[0, 0, 0]}
            rotationY={-0.38} // Angled so the front cover art is visible from the corridor!
            tiltAngle={0.02}
            isShelfInspected={isInspected}
            onSelectBook={onSelectBook}
          />
        </group>
      )}

      {/* Zone 4: Central Letterbox Niche - Stacked Art Volumes */}
      <group position={[getX(0.55), getY(0.42) + boardThick / 2 + 0.06, 0.03]}>
        <mesh position={[0, 0.02, 0]} material={materials.whiteSatinMaterial} castShadow>
          <boxGeometry args={[0.38, 0.035, 0.26]} />
        </mesh>
        <mesh
          position={[0.01, 0.055, -0.01]}
          rotation={[0, 0.05, 0]}
          material={materials.brassMaterial}
          castShadow
        >
          <boxGeometry args={[0.34, 0.035, 0.24]} />
        </mesh>
      </group>

      {/* ========================================================= */}
      {/* 7. REALISTIC 3D STANDING BOOKS (Pop-Out on Hover)         */}
      {/* ========================================================= */}

      {/* Zone 5: Lower-Left Cubby - Standing Hardcover Books */}
      <group position={[getX(0.21), getY(0.0) + boardThick / 2, 0.04]}>
        {zone5Books.map((book, idx) => {
          const spacing = 0.13;
          const startX = -((zone5Books.length - 1) * spacing) / 2;
          const x = startX + idx * spacing;
          return (
            <Book3D
              key={book.id}
              book={book}
              position={[x, 0, 0]}
              tiltAngle={idx === 0 ? 0.025 : idx === 2 ? -0.02 : 0}
              isShelfInspected={isInspected}
              onSelectBook={onSelectBook}
            />
          );
        })}
      </group>

      {/* Zone 6: Lower-Right Wide Shelf - Standing Books */}
      <group position={[getX(0.65), getY(0.0) + boardThick / 2, 0.04]}>
        {zone6Books.map((book, idx) => {
          const spacing = 0.14;
          const startX = -((zone6Books.length - 1) * spacing) / 2;
          const x = startX + idx * spacing;
          return (
            <Book3D
              key={book.id}
              book={book}
              position={[x, 0, 0]}
              tiltAngle={idx === 1 ? 0.03 : 0}
              isShelfInspected={isInspected}
              onSelectBook={onSelectBook}
            />
          );
        })}
      </group>

      {/* ========================================================= */}
      {/* 8. WALL-MOUNTED BRASS AUTHOR PLAQUE ABOVE FLOATING SHELF  */}
      {/* ========================================================= */}
      <group position={[0, height / 2 + 0.38, -depth / 2 + 0.02]}>
        <mesh material={materials.brassMaterial} castShadow>
          <boxGeometry args={[2.08, 0.48, 0.04]} />
        </mesh>
        <mesh position={[0, 0, 0.025]} material={plaqueFaceMaterial}>
          <planeGeometry args={[2.02, 0.42]} />
        </mesh>
      </group>

      {/* ========================================================= */}
      {/* 9. WARM SPOTLIGHTS WASHING OVER SHELF & BOOKS             */}
      {/* ========================================================= */}
      <pointLight
        position={[0, height / 2 + 0.75, depth * 1.3]}
        intensity={2.2}
        distance={5.0}
        color="#fff6e8"
      />
      <pointLight
        position={[0, 0, depth * 1.6]}
        intensity={1.2}
        distance={4.0}
        color="#ffffff"
      />

      {/* Hover Selection Callout Ring */}
      {shelfHovered && !isInspected && (
        <group position={[0, -height / 2 - 0.22, depth / 2 + 0.15]}>
          <mesh rotation={[-Math.PI / 2, 0, 0]}>
            <ringGeometry args={[0.65, 0.85, 32]} />
            <meshBasicMaterial
              color="#d4af37"
              transparent
              opacity={0.85}
              side={THREE.DoubleSide}
            />
          </mesh>
        </group>
      )}
    </group>
  );
}
