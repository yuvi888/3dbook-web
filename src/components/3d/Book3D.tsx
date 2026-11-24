'use client';

import { useRef, useState, useMemo } from 'react';
import { useFrame } from '@react-three/fiber';
import { Html } from '@react-three/drei';
import * as THREE from 'three';
import { BookItem } from '@/types/library';

interface Book3DProps {
  book: BookItem;
  position: [number, number, number];
  rotationY?: number;
  tiltAngle?: number;
  zOffset?: number;
  isShelfInspected: boolean;
  onSelectBook?: (book: BookItem) => void;
}

export function Book3D({
  book,
  position,
  rotationY = 0,
  tiltAngle = 0,
  zOffset = 0,
  isShelfInspected,
  onSelectBook,
}: Book3DProps) {
  const groupRef = useRef<THREE.Group>(null!);
  const [hovered, setHovered] = useState(false);

  // Proportional trade hardcover dimensions matching the reference image
  const thickness = 0.075; // Spine thickness (~3.2 cm in scale)
  const height = 0.38;    // Height (~24 cm in scale)
  const depth = 0.26;     // Width / Depth (~16 cm in scale)

  const boardOverhang = 0.008; // 8mm overhang past text block
  const boardThick = 0.006;    // Binder board thickness
  const textBlockW = thickness - boardThick * 2 - 0.004;
  const textBlockH = height - boardOverhang * 2;
  const textBlockD = depth - boardOverhang;

  // Base coordinates
  const baseX = position[0];
  const baseY = position[1] + height / 2; // Sit on shelf surface
  const baseZ = position[2] + zOffset;

  // =====================================================================
  // 1. PROCEDURAL ULTRA-CRISP FRONT COVER ARTWORK TEXTURE (1024 x 1536)
  // Illustrated front cover styled like "The Alchemist" / high-end hardcover
  // =====================================================================
  const frontCoverTexture = useMemo(() => {
    if (typeof window === 'undefined') return undefined;
    const canvas = document.createElement('canvas');
    canvas.width = 1024;
    canvas.height = 1536;
    const ctx = canvas.getContext('2d');
    if (!ctx) return undefined;

    // A. Base Midnight / Rich Jewel Tone Field matching the book's palette
    const bgGrad = ctx.createLinearGradient(0, 0, 1024, 1536);
    bgGrad.addColorStop(0, book.color || '#15243b');
    bgGrad.addColorStop(0.35, book.spineColor || '#1c2d47');
    bgGrad.addColorStop(0.75, '#0b1320');
    bgGrad.addColorStop(1, '#050a12');
    ctx.fillStyle = bgGrad;
    ctx.fillRect(0, 0, 1024, 1536);

    // Fine bookcloth canvas stipple
    ctx.fillStyle = 'rgba(255, 255, 255, 0.035)';
    for (let y = 0; y < 1536; y += 4) {
      ctx.fillRect(0, y, 1024, 1.5);
    }

    // B. Atmospheric Artwork / Illustrated Landscape Silhouette
    // Glowing celestial / desert sun & horizons
    const sunGrad = ctx.createRadialGradient(512, 820, 20, 512, 820, 360);
    sunGrad.addColorStop(0, '#fff4b8');
    sunGrad.addColorStop(0.3, '#f59e0b');
    sunGrad.addColorStop(0.65, 'rgba(217, 119, 6, 0.4)');
    sunGrad.addColorStop(1, 'rgba(217, 119, 6, 0)');
    ctx.fillStyle = sunGrad;
    ctx.beginPath();
    ctx.arc(512, 820, 360, 0, Math.PI * 2);
    ctx.fill();

    // Layered Dune & Mountain Silhouettes
    ctx.fillStyle = '#1e1106';
    ctx.beginPath();
    ctx.moveTo(0, 1020);
    ctx.bezierCurveTo(240, 960, 480, 1040, 720, 980);
    ctx.bezierCurveTo(860, 940, 960, 990, 1024, 1010);
    ctx.lineTo(1024, 1536);
    ctx.lineTo(0, 1536);
    ctx.closePath();
    ctx.fill();

    ctx.fillStyle = '#0f0803';
    ctx.beginPath();
    ctx.moveTo(0, 1150);
    ctx.bezierCurveTo(320, 1100, 640, 1180, 1024, 1120);
    ctx.lineTo(1024, 1536);
    ctx.lineTo(0, 1536);
    ctx.closePath();
    ctx.fill();

    // C. Elegant Debossed Gold Foil Border Frame
    ctx.strokeStyle = '#e5c158';
    ctx.lineWidth = 6;
    ctx.strokeRect(56, 56, 912, 1424);

    ctx.strokeStyle = '#fff3c4';
    ctx.lineWidth = 2;
    ctx.strokeRect(70, 70, 884, 1396);

    // D. BOOK TITLE IN METALLIC GOLD FOIL (Bold Roman Serif)
    ctx.save();
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';

    // Gold Foil Title Header
    ctx.fillStyle = '#fce498';
    ctx.font = 'bold 36px "Cinzel", "Georgia", serif';
    ctx.letterSpacing = '8px';
    ctx.fillText('SPECIAL EDITION', 512, 180);

    // Main Title Name
    ctx.fillStyle = 'rgba(0, 0, 0, 0.6)';
    ctx.font = '900 84px "Cinzel", "Playfair Display", "Times New Roman", serif';
    ctx.letterSpacing = '5px';
    ctx.fillText(book.title.toUpperCase(), 515, 345);

    ctx.fillStyle = '#fef08a';
    ctx.fillText(book.title.toUpperCase(), 512, 340);

    // Gold diamond ornament rule
    ctx.strokeStyle = '#e5c158';
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.moveTo(280, 430);
    ctx.lineTo(744, 430);
    ctx.stroke();

    ctx.fillStyle = '#e5c158';
    ctx.beginPath();
    ctx.moveTo(512, 420);
    ctx.lineTo(524, 430);
    ctx.lineTo(512, 440);
    ctx.lineTo(500, 430);
    ctx.closePath();
    ctx.fill();

    // Publication Year & Classic Seal
    ctx.fillStyle = '#ffffff';
    ctx.font = '600 42px "Cinzel", "Georgia", serif';
    ctx.letterSpacing = '4px';
    ctx.fillText(`PUBLISHED • ${book.year}`, 512, 510);

    // E. French Groove Joint Shadow Line (Left hinge indentation)
    ctx.fillStyle = 'rgba(0, 0, 0, 0.45)';
    ctx.fillRect(40, 0, 16, 1536);
    ctx.fillStyle = 'rgba(255, 255, 255, 0.15)';
    ctx.fillRect(56, 0, 6, 1536);

    ctx.restore();

    const tex = new THREE.CanvasTexture(canvas);
    tex.generateMipmaps = true;
    tex.minFilter = THREE.LinearMipmapLinearFilter;
    tex.magFilter = THREE.LinearFilter;
    tex.needsUpdate = true;
    return tex;
  }, [book]);

  // =====================================================================
  // 2. PROCEDURAL 4K SPINE TEXTURE WITH GOLD FOIL TITLE (512 x 2048)
  // =====================================================================
  const spineTexture = useMemo(() => {
    if (typeof window === 'undefined') return undefined;
    const canvas = document.createElement('canvas');
    canvas.width = 512;
    canvas.height = 2048;
    const ctx = canvas.getContext('2d');
    if (!ctx) return undefined;

    // Rich matching buckram bookcloth
    ctx.fillStyle = book.spineColor || '#1c2d47';
    ctx.fillRect(0, 0, 512, 2048);

    // Cylindrical curved shading (shadows on edges, soft crown highlight)
    const spineShade = ctx.createLinearGradient(0, 0, 512, 0);
    spineShade.addColorStop(0, 'rgba(0, 0, 0, 0.55)');
    spineShade.addColorStop(0.15, 'rgba(0, 0, 0, 0.15)');
    spineShade.addColorStop(0.5, 'rgba(255, 255, 255, 0.18)');
    spineShade.addColorStop(0.85, 'rgba(0, 0, 0, 0.15)');
    spineShade.addColorStop(1, 'rgba(0, 0, 0, 0.55)');
    ctx.fillStyle = spineShade;
    ctx.fillRect(0, 0, 512, 2048);

    // Gold Top Crown & Tail Bands
    [180, 1860].forEach((by) => {
      ctx.fillStyle = '#e5c158';
      ctx.fillRect(36, by, 440, 10);
      ctx.fillStyle = '#fff4b8';
      ctx.fillRect(36, by + 2, 440, 3);
    });

    // Vertical Book Title in Gold Foil
    ctx.save();
    ctx.translate(256, 1024);
    ctx.rotate(-Math.PI / 2);
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';

    ctx.fillStyle = 'rgba(0, 0, 0, 0.7)';
    ctx.font = '900 86px "Cinzel", "Playfair Display", "Times New Roman", serif';
    ctx.letterSpacing = '6px';
    ctx.fillText(book.title.toUpperCase(), 3, 5);

    ctx.fillStyle = '#fef08a';
    ctx.fillText(book.title.toUpperCase(), 0, 0);

    // Publication year on spine tail
    ctx.font = 'bold 58px "Cinzel", "Georgia", serif';
    ctx.fillStyle = '#ffffff';
    ctx.fillText(book.year, -680, 0);

    ctx.restore();

    // Publisher Oval Emblem at the tail (like Penguin/Classics)
    ctx.fillStyle = '#d97706';
    ctx.beginPath();
    ctx.ellipse(256, 1940, 38, 52, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = '#ffffff';
    ctx.lineWidth = 4;
    ctx.stroke();

    ctx.fillStyle = '#ffffff';
    ctx.font = '900 38px sans-serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText('Y', 256, 1940);

    const tex = new THREE.CanvasTexture(canvas);
    tex.generateMipmaps = true;
    tex.minFilter = THREE.LinearMipmapLinearFilter;
    tex.magFilter = THREE.LinearFilter;
    tex.needsUpdate = true;
    return tex;
  }, [book]);

  // =====================================================================
  // 3. TEXT BLOCK PAPER TEXTURE (Warm Ivory with Page Striations)
  // =====================================================================
  const textBlockTexture = useMemo(() => {
    if (typeof window === 'undefined') return undefined;
    const canvas = document.createElement('canvas');
    canvas.width = 512;
    canvas.height = 512;
    const ctx = canvas.getContext('2d');
    if (!ctx) return undefined;

    // Warm natural off-white book paper
    ctx.fillStyle = '#f7f3e8';
    ctx.fillRect(0, 0, 512, 512);

    // Horizontal micro-striations for individual paper leaves
    ctx.fillStyle = 'rgba(160, 140, 110, 0.22)';
    for (let y = 0; y < 512; y += 4) {
      ctx.fillRect(0, y, 512, 1.5);
    }
    ctx.fillStyle = 'rgba(60, 45, 30, 0.12)';
    for (let y = 0; y < 512; y += 12) {
      ctx.fillRect(0, y, 512, 1);
    }

    const tex = new THREE.CanvasTexture(canvas);
    tex.wrapS = THREE.RepeatWrapping;
    tex.wrapT = THREE.RepeatWrapping;
    tex.repeat.set(1, 8);
    return tex;
  }, []);

  // Materials
  const materials = useMemo(() => {
    const frontCoverMat = new THREE.MeshStandardMaterial({
      map: frontCoverTexture,
      roughness: 0.38,
      metalness: 0.06,
    });

    const spineMat = new THREE.MeshStandardMaterial({
      map: spineTexture,
      roughness: 0.35,
      metalness: 0.08,
    });

    const plainCoverMat = new THREE.MeshStandardMaterial({
      color: book.spineColor || '#1c2d47',
      roughness: 0.45,
      metalness: 0.04,
    });

    const paperMat = new THREE.MeshStandardMaterial({
      map: textBlockTexture,
      color: '#fcf8ef',
      roughness: 0.85,
      metalness: 0.02,
    });

    const headbandMat = new THREE.MeshStandardMaterial({
      color: '#d4af37',
      roughness: 0.4,
      metalness: 0.3,
    });

    return {
      frontCoverMat,
      spineMat,
      plainCoverMat,
      paperMat,
      headbandMat,
    };
  }, [frontCoverTexture, spineTexture, textBlockTexture, book.spineColor]);

  // =====================================================================
  // 4. INTERACTION ANIMATION (Smooth 3D Pop-Out)
  // =====================================================================
  useFrame((_, delta) => {
    if (!groupRef.current) return;

    const targetZ = hovered ? baseZ + 0.14 : baseZ;
    const targetY = hovered ? baseY + 0.02 : baseY;
    const targetRotX = hovered ? 0.06 : 0;
    const targetRotZ = hovered ? tiltAngle - 0.03 : tiltAngle;

    const lerpSpeed = Math.min(1, delta * 14);

    groupRef.current.position.z = THREE.MathUtils.lerp(
      groupRef.current.position.z,
      targetZ,
      lerpSpeed
    );
    groupRef.current.position.y = THREE.MathUtils.lerp(
      groupRef.current.position.y,
      targetY,
      lerpSpeed
    );
    groupRef.current.rotation.x = THREE.MathUtils.lerp(
      groupRef.current.rotation.x,
      targetRotX,
      lerpSpeed
    );
    groupRef.current.rotation.z = THREE.MathUtils.lerp(
      groupRef.current.rotation.z,
      targetRotZ,
      lerpSpeed
    );
  });

  return (
    <group
      ref={groupRef}
      position={[baseX, baseY, baseZ]}
      rotation={[0, rotationY, tiltAngle]}
      onPointerOver={(e) => {
        e.stopPropagation();
        setHovered(true);
        document.body.style.cursor = 'pointer';
      }}
      onPointerOut={() => {
        setHovered(false);
        document.body.style.cursor = 'auto';
      }}
      onClick={(e) => {
        e.stopPropagation();
        if (onSelectBook) onSelectBook(book);
      }}
    >
      {/* ========================================================= */}
      {/* A. INNER PAPER TEXT BLOCK (Recessed with Overhangs)        */}
      {/* ========================================================= */}
      <mesh
        position={[0, 0, -boardOverhang / 2]}
        material={materials.paperMat}
        castShadow
        receiveShadow
      >
        <boxGeometry args={[textBlockW, textBlockH, textBlockD]} />
      </mesh>

      {/* ========================================================= */}
      {/* B. HARDCOVER BINDER BOARDS (Left Cover & Right Front Cover)*/}
      {/* ========================================================= */}
      {/* Back Cover Board (Left face) */}
      <mesh
        position={[-thickness / 2 + boardThick / 2, 0, 0]}
        material={materials.plainCoverMat}
        castShadow
        receiveShadow
      >
        <boxGeometry args={[boardThick, height, depth]} />
      </mesh>

      {/* Front Cover Board (Right face with Illustrated Artwork) */}
      <mesh
        position={[thickness / 2 - boardThick / 2, 0, 0]}
        material={[
          materials.frontCoverMat, // +X Outer front cover face
          materials.plainCoverMat, // -X Inner paste-down face
          materials.plainCoverMat, // +Y Head edge
          materials.plainCoverMat, // -Y Tail edge
          materials.plainCoverMat, // +Z Fore-edge
          materials.plainCoverMat, // -Z Spine edge
        ]}
        castShadow
        receiveShadow
      >
        <boxGeometry args={[boardThick, height, depth]} />
      </mesh>

      {/* French Groove Crease Indentation (Joint alongside spine) */}
      <mesh
        position={[thickness / 2 - boardThick * 1.5, 0, depth / 2 - 0.02]}
        material={materials.plainCoverMat}
      >
        <boxGeometry args={[0.002, height, 0.004]} />
      </mesh>

      {/* ========================================================= */}
      {/* C. ROUNDED CONVEX 3D SPINE (+Z Facing Corridor Aisle)      */}
      {/* ========================================================= */}
      <group position={[0, 0, depth / 2 - 0.005]}>
        {/* Curved Spine Cylinder Segment */}
        <mesh
          scale={[1, 1, 0.45]}
          material={materials.spineMat}
          castShadow
          receiveShadow
        >
          <cylinderGeometry
            args={[
              thickness / 2,
              thickness / 2,
              height,
              24,
              1,
              false,
              -Math.PI / 2,
              Math.PI,
            ]}
          />
        </mesh>

        {/* Woven Fabric Headband / Tailband Trim */}
        <mesh position={[0, height / 2 - 0.005, -0.005]} material={materials.headbandMat}>
          <boxGeometry args={[thickness - 0.008, 0.01, 0.012]} />
        </mesh>
        <mesh position={[0, -height / 2 + 0.005, -0.005]} material={materials.headbandMat}>
          <boxGeometry args={[thickness - 0.008, 0.01, 0.012]} />
        </mesh>
      </group>

      {/* ========================================================= */}
      {/* D. FLOATING INTERACTION TOOLTIP                           */}
      {/* ========================================================= */}
      {hovered && (
        <Html
          position={[0, height / 2 + 0.16, depth / 2 + 0.06]}
          center
          distanceFactor={4.8}
          style={{ pointerEvents: 'none' }}
        >
          <div className="bg-white/95 backdrop-blur-xl text-neutral-800 border border-amber-200/60 rounded-2xl px-4 py-3 shadow-[0_20px_50px_rgba(0,0,0,0.15)] flex flex-col whitespace-nowrap pointer-events-none transform -translate-y-2 transition-all">
            <div className="flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-amber-600 animate-pulse" />
              <span className="text-xs font-black uppercase tracking-wider text-amber-900">
                {book.title}
              </span>
            </div>
            <div className="flex items-center gap-2 mt-1 text-[11px] text-neutral-600">
              <span className="text-amber-700 font-semibold">{book.year}</span>
              <span className="text-neutral-400">•</span>
              <span>{book.pages} pages</span>
              <span className="text-neutral-400">•</span>
              <span className="text-emerald-700 font-medium">Hardcover Edition</span>
            </div>
            {isShelfInspected && (
              <span className="mt-1.5 text-[10px] text-amber-700 font-medium tracking-wide">
                ✦ Click to view literary synopsis
              </span>
            )}
          </div>
        </Html>
      )}
    </group>
  );
}
