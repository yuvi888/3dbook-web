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

  // Book physical dimensions
  const thickness = book.thickness ?? 0.18;
  const height = book.height ?? 0.96;
  const depth = book.depth ?? 0.58;

  // Base coordinates
  const baseX = position[0];
  const baseY = position[1] + height / 2; // place on shelf surface
  const baseZ = position[2] + zOffset;

  // -------------------------------------------------------------
  // 1. ULTRA-CRISP 4K PROCEDURAL SPINE TEXTURE (1024 x 2048)
  // Zero blur, crystal clear typography and gold leaf embossing
  // -------------------------------------------------------------
  const spineTexture = useMemo(() => {
    if (typeof window === 'undefined') return undefined;
    const canvas = document.createElement('canvas');
    canvas.width = 1024;
    canvas.height = 2048;
    const ctx = canvas.getContext('2d');
    if (!ctx) return undefined;

    // A. Base Rich Full-Grain Morocco Leather / Buckram
    ctx.fillStyle = book.spineColor;
    ctx.fillRect(0, 0, 1024, 2048);

    // Fine tactile leather grain texture
    const imgData = ctx.getImageData(0, 0, 1024, 2048);
    const data = imgData.data;
    for (let i = 0; i < data.length; i += 4) {
      const noise = (Math.random() - 0.5) * 14;
      data[i] = Math.min(255, Math.max(0, data[i] + noise));
      data[i + 1] = Math.min(255, Math.max(0, data[i + 1] + noise));
      data[i + 2] = Math.min(255, Math.max(0, data[i + 2] + noise));
    }
    ctx.putImageData(imgData, 0, 0);

    // B. Cylindrical 3D Curvature Highlight (Shadows at outer edges, bright crown)
    const grad = ctx.createLinearGradient(0, 0, 1024, 0);
    grad.addColorStop(0, 'rgba(0, 0, 0, 0.42)');
    grad.addColorStop(0.12, 'rgba(0, 0, 0, 0.12)');
    grad.addColorStop(0.5, 'rgba(255, 255, 255, 0.2)');
    grad.addColorStop(0.88, 'rgba(0, 0, 0, 0.12)');
    grad.addColorStop(1, 'rgba(0, 0, 0, 0.42)');
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, 1024, 2048);

    // C. 5 Raised Horizontal Bands with Gold Leaf Foil Filigree
    const bandYs = [300, 700, 1100, 1500, 1820];
    bandYs.forEach((by) => {
      // Warm gold foil band gradient
      const goldGrad = ctx.createLinearGradient(0, by - 24, 0, by + 24);
      goldGrad.addColorStop(0, '#9e6a10');
      goldGrad.addColorStop(0.2, '#fde68a');
      goldGrad.addColorStop(0.6, '#ffffff');
      goldGrad.addColorStop(0.85, '#d97706');
      goldGrad.addColorStop(1, '#78350f');

      ctx.fillStyle = goldGrad;
      ctx.fillRect(48, by - 12, 928, 24);

      // Fine embossed border rules
      ctx.strokeStyle = '#451a03';
      ctx.lineWidth = 3;
      ctx.strokeRect(48, by - 12, 928, 24);

      // Ornate embossed gold dots along the band
      ctx.fillStyle = '#fffbeb';
      for (let x = 80; x < 960; x += 64) {
        ctx.beginPath();
        ctx.arc(x, by, 5, 0, Math.PI * 2);
        ctx.fill();
      }
    });

    // D. Top Classical Headband Crown Frame
    ctx.strokeStyle = book.accentColor || '#fde047';
    ctx.lineWidth = 6;
    ctx.strokeRect(64, 60, 896, 160);
    ctx.lineWidth = 3;
    ctx.strokeRect(76, 72, 872, 136);

    // Center gold fleur-de-lis / crown emblem
    ctx.fillStyle = book.accentColor || '#fde047';
    ctx.beginPath();
    ctx.arc(512, 140, 32, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = book.spineColor;
    ctx.beginPath();
    ctx.arc(512, 140, 18, 0, Math.PI * 2);
    ctx.fill();

    // E. Bottom Tailpiece Publisher Frame & Year
    ctx.strokeStyle = book.accentColor || '#fde047';
    ctx.lineWidth = 6;
    ctx.strokeRect(64, 1880, 896, 120);

    // Publication Year in Gold
    ctx.fillStyle = '#ffffff';
    ctx.font = 'bold 74px "Cinzel", "Playfair Display", "Times New Roman", Georgia, serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(book.year, 512, 1940);

    // F. VERTICAL BOOK TITLE - BOLD, SHARP, ELEGANT GOLD FOIL STAMPING
    ctx.save();
    ctx.translate(512, 1020);
    ctx.rotate(-Math.PI / 2);
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';

    // Deep embossed drop shadow
    ctx.fillStyle = 'rgba(0, 0, 0, 0.75)';
    ctx.font = '900 88px "Cinzel", "Playfair Display", "Times New Roman", Georgia, serif';
    ctx.letterSpacing = '4px';
    ctx.fillText(book.title.toUpperCase(), 4, 6);

    // High-contrast gold & white face (razor sharp legibility)
    ctx.fillStyle = '#ffffff';
    ctx.fillText(book.title.toUpperCase(), 0, 0);
    ctx.restore();

    const tex = new THREE.CanvasTexture(canvas);
    // Crucial: Disable mipmaps to eliminate distance blurriness completely
    tex.generateMipmaps = false;
    tex.minFilter = THREE.LinearFilter;
    tex.magFilter = THREE.LinearFilter;
    tex.needsUpdate = true;
    return tex;
  }, [book]);

  // -------------------------------------------------------------
  // 2. PROCEDURAL COVER BOARD TEXTURE (1024 x 1024)
  // -------------------------------------------------------------
  const coverTexture = useMemo(() => {
    if (typeof window === 'undefined') return undefined;
    const canvas = document.createElement('canvas');
    canvas.width = 1024;
    canvas.height = 1024;
    const ctx = canvas.getContext('2d');
    if (!ctx) return undefined;

    // Base cover color
    ctx.fillStyle = book.color;
    ctx.fillRect(0, 0, 1024, 1024);

    // Micro-grain stipple
    const imgData = ctx.getImageData(0, 0, 1024, 1024);
    const data = imgData.data;
    for (let i = 0; i < data.length; i += 4) {
      const n = (Math.random() - 0.5) * 14;
      data[i] = Math.min(255, Math.max(0, data[i] + n));
      data[i + 1] = Math.min(255, Math.max(0, data[i + 1] + n));
      data[i + 2] = Math.min(255, Math.max(0, data[i + 2] + n));
    }
    ctx.putImageData(imgData, 0, 0);

    // Gold foil double-ruled border
    ctx.strokeStyle = book.accentColor || '#fde047';
    ctx.lineWidth = 8;
    ctx.strokeRect(48, 48, 928, 928);
    ctx.lineWidth = 3;
    ctx.strokeRect(68, 68, 888, 888);

    // Corner filigree flourishes
    const corners = [
      [68, 68],
      [956, 68],
      [68, 956],
      [956, 956],
    ];
    ctx.fillStyle = book.accentColor || '#fde047';
    corners.forEach(([cx, cy]) => {
      ctx.beginPath();
      ctx.arc(cx, cy, 12, 0, Math.PI * 2);
      ctx.fill();
    });

    const tex = new THREE.CanvasTexture(canvas);
    tex.generateMipmaps = false;
    tex.minFilter = THREE.LinearFilter;
    tex.magFilter = THREE.LinearFilter;
    tex.needsUpdate = true;
    return tex;
  }, [book]);

  // -------------------------------------------------------------
  // 3. MATERIALS
  // -------------------------------------------------------------
  const materials = useMemo(() => {
    // Hardcover cloth/leather
    const coverMat = new THREE.MeshStandardMaterial({
      map: coverTexture,
      roughness: 0.32,
      metalness: 0.08,
    });

    // Curved spine material (self-illuminated to stay crisp and brilliant)
    const spineMat = new THREE.MeshBasicMaterial({
      map: spineTexture,
      toneMapped: false,
    });

    // Warm ivory paper pages
    const pagesMat = new THREE.MeshStandardMaterial({
      color: '#fcf8ee',
      roughness: 0.8,
      metalness: 0.02,
    });

    // Gilded luxury gold top page edge
    const gildedTopMat = new THREE.MeshStandardMaterial({
      color: '#d4af37',
      roughness: 0.22,
      metalness: 0.88,
    });

    // Gold raised ribs material
    const raisedRibMat = new THREE.MeshStandardMaterial({
      color: '#f59e0b',
      roughness: 0.2,
      metalness: 0.82,
    });

    // Silk bookmark ribbon
    const ribbonMat = new THREE.MeshStandardMaterial({
      color: book.accentColor || '#c2410c',
      roughness: 0.3,
      metalness: 0.1,
      side: THREE.DoubleSide,
    });

    return {
      coverMat,
      spineMat,
      pagesMat,
      gildedTopMat,
      raisedRibMat,
      ribbonMat,
    };
  }, [coverTexture, spineTexture, book.accentColor]);

  // Page block dimensions (slightly inset from cover boards)
  const pageW = thickness - 0.024;
  const pageH = height - 0.034;
  const pageD = depth - 0.035;

  // 5 Raised rib positions along the spine
  const bandRelYs = [
    height * 0.38,
    height * 0.18,
    -0.02,
    -height * 0.22,
    -height * 0.38,
  ];

  // -------------------------------------------------------------
  // 4. INTERACTION ANIMATION (Smooth 3D Pop-Out)
  // -------------------------------------------------------------
  useFrame((_, delta) => {
    if (!groupRef.current) return;

    // Pop forward along Z when hovered
    const targetZ = hovered ? baseZ + 0.34 : baseZ;
    const targetY = hovered ? baseY + 0.05 : baseY;
    const targetRotX = hovered ? 0.06 : 0;
    const targetRotZ = hovered ? tiltAngle - 0.04 : tiltAngle;

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
      onPointerOut={(e) => {
        e.stopPropagation();
        setHovered(false);
        document.body.style.cursor = 'auto';
      }}
      onClick={(e) => {
        e.stopPropagation();
        if (onSelectBook) onSelectBook(book);
      }}
    >
      {/* ========================================================= */}
      {/* A. INNER PAPER BLOCK (Gilded Top & Ivory Side Pages)       */}
      {/* ========================================================= */}
      <group position={[0, 0, -0.012]}>
        <mesh
          material={[
            materials.pagesMat,
            materials.pagesMat,
            materials.gildedTopMat, // +y gilt gold top edge
            materials.pagesMat,
            materials.pagesMat,
            materials.pagesMat,
          ]}
          castShadow
          receiveShadow
        >
          <boxGeometry args={[pageW, pageH, pageD]} />
        </mesh>
      </group>

      {/* ========================================================= */}
      {/* B. HARDCOVER BOARDS (Left & Right with Square Overhang)    */}
      {/* ========================================================= */}
      <mesh
        position={[-thickness / 2 + 0.006, 0, 0]}
        material={materials.coverMat}
        castShadow
        receiveShadow
      >
        <boxGeometry args={[0.012, height, depth]} />
      </mesh>
      <mesh
        position={[thickness / 2 - 0.006, 0, 0]}
        material={materials.coverMat}
        castShadow
        receiveShadow
      >
        <boxGeometry args={[0.012, height, depth]} />
      </mesh>

      {/* ========================================================= */}
      {/* C. CURVED 3D SPINE (+Z Front Facing the Aisle)            */}
      {/* ========================================================= */}
      <group position={[0, 0, depth / 2 - 0.01]}>
        {/* Smooth arched spine cylinder segment */}
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
              20,
              1,
              false,
              -Math.PI / 2,
              Math.PI,
            ]}
          />
        </mesh>

        {/* 5 Raised 3D Horizontal Rib Bands catching realistic light */}
        {bandRelYs.map((by, idx) => (
          <mesh
            key={idx}
            position={[0, by, (thickness / 2) * 0.45 + 0.003]}
            scale={[1, 0.4, 0.5]}
            material={materials.raisedRibMat}
            castShadow
          >
            <cylinderGeometry
              args={[
                thickness / 2 + 0.006,
                thickness / 2 + 0.006,
                0.02,
                16,
                1,
                false,
                -Math.PI / 2,
                Math.PI,
              ]}
            />
          </mesh>
        ))}

        {/* Headband woven fabric trim at top and bottom */}
        <mesh position={[0, height / 2 - 0.008, 0]} material={materials.raisedRibMat}>
          <boxGeometry args={[thickness - 0.016, 0.014, 0.01]} />
        </mesh>
        <mesh position={[0, -height / 2 + 0.008, 0]} material={materials.raisedRibMat}>
          <boxGeometry args={[thickness - 0.016, 0.014, 0.01]} />
        </mesh>
      </group>

      {/* ========================================================= */}
      {/* D. SATIN RIBBON BOOKMARK DRAPING DOWN                     */}
      {/* ========================================================= */}
      <mesh
        position={[0.02, -height * 0.15, depth / 2 + 0.008]}
        rotation={[0.04, 0.05, -0.08]}
        material={materials.ribbonMat}
      >
        <planeGeometry args={[0.022, height * 0.7]} />
      </mesh>

      {/* ========================================================= */}
      {/* E. FLOATING INTERACTION TOOLTIP                           */}
      {/* ========================================================= */}
      {hovered && (
        <Html
          position={[0, height / 2 + 0.35, depth / 2 + 0.12]}
          center
          distanceFactor={5.5}
          style={{ pointerEvents: 'none' }}
        >
          <div className="bg-neutral-950/95 backdrop-blur-xl text-white border border-amber-500/50 rounded-2xl px-4 py-3 shadow-[0_20px_50px_rgba(0,0,0,0.85)] flex flex-col whitespace-nowrap pointer-events-none transform -translate-y-2 transition-all">
            <div className="flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-amber-400 animate-pulse" />
              <span className="text-xs font-black uppercase tracking-wider text-amber-200">
                {book.title}
              </span>
            </div>
            <div className="flex items-center gap-2 mt-1.5 text-[11px] text-neutral-300">
              <span className="text-amber-400 font-semibold">{book.year}</span>
              <span className="text-neutral-500">•</span>
              <span>{book.pages} pages</span>
              <span className="text-neutral-500">•</span>
              <span className="text-emerald-400 font-medium">Museum Leather-bound</span>
            </div>
            {isShelfInspected && (
              <span className="mt-2 text-[10px] text-amber-300 font-medium tracking-wide">
                ✦ Click to open volume synopsis
              </span>
            )}
          </div>
        </Html>
      )}
    </group>
  );
}