'use client';

import { useRef, useState, useCallback, useMemo, useEffect } from 'react';
import { Canvas, useFrame, useThree } from '@react-three/fiber';
import { ContactShadows } from '@react-three/drei';
import { EffectComposer, N8AO, Bloom, Vignette } from '@react-three/postprocessing';
import * as THREE from 'three';
import { BOOKSHELVES_DATA } from '@/data/libraryData';
import { BookshelfItem, BookItem } from '@/types/library';
import { Bookshelf3D } from './Bookshelf3D';
import { CurvedCorridor, tunnelCurve } from './CurvedCorridor';
import { ShelfInspectionHUD } from '../ui/ShelfInspectionHUD';

interface LibrarySceneProps {
  scrollProgress: number;
}

// Camera Rig with parallax mouse tracking
function CameraRig({
  scrollProgress,
  inspectedShelf,
  shelfTransforms,
}: {
  scrollProgress: number;
  inspectedShelf: BookshelfItem | null;
  shelfTransforms: Map<string, { pos: THREE.Vector3; rotY: number; frontVec: THREE.Vector3 }>;
}) {
  const { camera } = useThree();
  const currentLookAt = useRef(new THREE.Vector3(0, 0, -10));
  const mouseRef = useRef({ x: 0, y: 0 });

  // Track mouse for parallax effect
  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      mouseRef.current.x = (e.clientX / window.innerWidth - 0.5) * 2;
      mouseRef.current.y = (e.clientY / window.innerHeight - 0.5) * 2;
    };
    window.addEventListener('mousemove', handleMouseMove);
    return () => window.removeEventListener('mousemove', handleMouseMove);
  }, []);

  useFrame((_, delta) => {
    const lerpFactor = Math.min(1, delta * 4.0);

    // Subtle parallax offset from mouse
    const parallaxX = mouseRef.current.x * 0.08;
    const parallaxY = -mouseRef.current.y * 0.05;

    if (inspectedShelf) {
      const transform = shelfTransforms.get(inspectedShelf.id);
      if (transform) {
        const targetCamPos = transform.pos
          .clone()
          .add(transform.frontVec.clone().multiplyScalar(3.5));
        targetCamPos.y = transform.pos.y + 0.15;

        // Add parallax to inspection view
        targetCamPos.x += parallaxX * 0.3;
        targetCamPos.y += parallaxY * 0.2;

        const targetLookAt = transform.pos.clone();
        targetLookAt.y = transform.pos.y + 0.15;

        camera.position.lerp(targetCamPos, lerpFactor);
        currentLookAt.current.lerp(targetLookAt, lerpFactor);
        camera.lookAt(currentLookAt.current);
      }
    } else {
      const clampedProgress = THREE.MathUtils.clamp(scrollProgress, 0.001, 0.998);

      const pathPoint = tunnelCurve.getPointAt(clampedProgress);
      const targetCamPos = pathPoint.clone();
      targetCamPos.y = 0.22;

      // Apply parallax to corridor scroll
      targetCamPos.x += parallaxX * 0.12;
      targetCamPos.y += parallaxY * 0.08;

      const lookAheadProgress = Math.min(0.999, clampedProgress + 0.045);
      const lookAheadPoint = tunnelCurve.getPointAt(lookAheadProgress);
      const targetLookAt = lookAheadPoint.clone();
      targetLookAt.y = 0.15;

      camera.position.lerp(targetCamPos, lerpFactor);
      currentLookAt.current.lerp(targetLookAt, lerpFactor);
      camera.lookAt(currentLookAt.current);
    }
  });

  return null;
}

export default function LibraryScene({ scrollProgress }: LibrarySceneProps) {
  const [inspectedShelf, setInspectedShelf] = useState<BookshelfItem | null>(null);
  const [selectedBook, setSelectedBook] = useState<BookItem | null>(null);

  // Pre-calculate positions and rotations for each bookshelf along the curve
  const { shelvesWithTransforms, transformMap } = useMemo(() => {
    const map = new Map<
      string,
      { pos: THREE.Vector3; rotY: number; frontVec: THREE.Vector3 }
    >();

    const items = BOOKSHELVES_DATA.map((shelf) => {
      const pt = tunnelCurve.getPointAt(shelf.t);
      const tangent = tunnelCurve.getTangentAt(shelf.t).normalize();
      const normal = new THREE.Vector3(-tangent.z, 0, tangent.x).normalize();

      const isLeft = shelf.side === 'left';
      const offsetDist = isLeft ? -3.12 : 3.12;
      const shelfPos = pt.clone().add(normal.clone().multiplyScalar(offsetDist));
      shelfPos.y = 0.08;

      const inwardDir = pt.clone().sub(shelfPos).setY(0).normalize();
      const rotY = Math.atan2(inwardDir.x, inwardDir.z);
      const frontVec = inwardDir.clone();

      map.set(shelf.id, {
        pos: shelfPos,
        rotY,
        frontVec,
      });

      return {
        shelf,
        position: [shelfPos.x, shelfPos.y, shelfPos.z] as [number, number, number],
        rotation: [0, rotY, 0] as [number, number, number],
      };
    });

    return { shelvesWithTransforms: items, transformMap: map };
  }, []);

  const handleSelectShelf = useCallback((shelf: BookshelfItem) => {
    setInspectedShelf(shelf);
  }, []);

  const handleExitInspection = useCallback(() => {
    setInspectedShelf(null);
    setSelectedBook(null);
  }, []);

  const handleSelectBook = useCallback((book: BookItem) => {
    setSelectedBook(book);
  }, []);

  const handleCloseBookDetail = useCallback(() => {
    setSelectedBook(null);
  }, []);

  return (
    <div className="w-full h-full relative bg-[#f5f0e8]">
      <Canvas
        camera={{ fov: 55, near: 0.1, far: 180, position: [0, 0.22, 8] }}
        gl={{
          antialias: true,
          toneMapping: THREE.ACESFilmicToneMapping,
          toneMappingExposure: 1.4,
        }}
        style={{ width: '100%', height: '100%', display: 'block', background: '#f5f0e8' }}
      >
        {/* Soft warm atmospheric fog — light beige */}
        <fog attach="fog" args={['#ebe4d8', 10, 65]} />

        {/* ============================================================ */}
        {/* BRIGHT SUNLIT GALLERY LIGHTING                               */}
        {/* ============================================================ */}
        <ambientLight intensity={1.4} color="#fff8ee" />
        <hemisphereLight args={['#e3f2fd', '#d7ccc8', 0.8]} />

        {/* Strong warm sunlight from above-right */}
        <directionalLight
          position={[20, 30, 15]}
          intensity={2.0}
          color="#fff3e0"
          castShadow
          shadow-mapSize-width={1024}
          shadow-mapSize-height={1024}
        />
        {/* Fill light from opposite side */}
        <directionalLight position={[-15, 20, -10]} intensity={0.9} color="#fdecd9" />

        {/* Soft sky light from above */}
        <directionalLight position={[0, 25, 0]} intensity={0.6} color="#e3f2fd" />

        {/* Camera controller with parallax */}
        <CameraRig
          scrollProgress={scrollProgress}
          inspectedShelf={inspectedShelf}
          shelfTransforms={transformMap}
        />

        {/* Curved Bright Beige Corridor */}
        <CurvedCorridor />

        {/* Contact Shadows under bookshelves */}
        <ContactShadows
          position={[0, -2.3, -55]}
          opacity={0.35}
          scale={120}
          blur={2.5}
          far={4}
          color="#8d7b5e"
        />

        {/* 3D Bookshelves placed along the corridor curve */}
        {shelvesWithTransforms.map(({ shelf, position, rotation }) => (
          <Bookshelf3D
            key={shelf.id}
            shelf={shelf}
            position={position}
            rotation={rotation}
            isInspected={inspectedShelf?.id === shelf.id}
            onSelectShelf={handleSelectShelf}
            onSelectBook={handleSelectBook}
          />
        ))}

        {/* ============================================================ */}
        {/* POST-PROCESSING EFFECTS                                      */}
        {/* ============================================================ */}
        <EffectComposer>
          {/* Ambient Occlusion — subtle contact shadows */}
          <N8AO
            aoRadius={0.8}
            intensity={1.2}
            distanceFalloff={0.8}
          />
          {/* Bloom — subtle glow on LED strips and windows */}
          <Bloom
            luminanceThreshold={0.85}
            luminanceSmoothing={0.3}
            intensity={0.25}
            mipmapBlur
          />
          {/* Vignette — cinematic edge darkening */}
          <Vignette darkness={0.25} offset={0.3} />
        </EffectComposer>
      </Canvas>

      {/* Floating UI HUD for Shelf Inspection & Book Modal */}
      <ShelfInspectionHUD
        inspectedShelf={inspectedShelf}
        selectedBook={selectedBook}
        onExitInspection={handleExitInspection}
        onCloseBookDetail={handleCloseBookDetail}
        scrollProgress={scrollProgress}
      />
    </div>
  );
}
