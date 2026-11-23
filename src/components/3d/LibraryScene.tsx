'use client';

import { useRef, useState, useCallback, useMemo } from 'react';
import { Canvas, useFrame, useThree } from '@react-three/fiber';
import * as THREE from 'three';
import { BOOKSHELVES_DATA } from '@/data/libraryData';
import { BookshelfItem, BookItem } from '@/types/library';
import { Bookshelf3D } from './Bookshelf3D';
import { CurvedCorridor, tunnelCurve } from './CurvedCorridor';
import { ShelfInspectionHUD } from '../ui/ShelfInspectionHUD';

interface LibrarySceneProps {
  scrollProgress: number;
}

// Camera Rig to handle curved corridor progression and bookshelf inspection
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

  useFrame((_, delta) => {
    const lerpFactor = Math.min(1, delta * 4.0);

    if (inspectedShelf) {
      // -----------------------------------------------------------
      // INSPECTION MODE: Zoom in directly facing the selected shelf
      // -----------------------------------------------------------
      const transform = shelfTransforms.get(inspectedShelf.id);
      if (transform) {
        // Camera positioned to frame the wall-mounted white bookcase and brass plaque
        const targetCamPos = transform.pos
          .clone()
          .add(transform.frontVec.clone().multiplyScalar(3.5));
        targetCamPos.y = transform.pos.y + 0.15;

        // Look at center of the wall-mounted bookcase
        const targetLookAt = transform.pos.clone();
        targetLookAt.y = transform.pos.y + 0.15;

        camera.position.lerp(targetCamPos, lerpFactor);
        currentLookAt.current.lerp(targetLookAt, lerpFactor);
        camera.lookAt(currentLookAt.current);
      }
    } else {
      // -----------------------------------------------------------
      // CORRIDOR SCROLL MODE: Travel smoothly along the curved tunnel
      // -----------------------------------------------------------
      const clampedProgress = THREE.MathUtils.clamp(scrollProgress, 0.001, 0.998);

      // Camera position on curve
      const pathPoint = tunnelCurve.getPointAt(clampedProgress);
      const targetCamPos = pathPoint.clone();
      targetCamPos.y = 0.22; // Eye height

      // Look ahead along the curve's turn
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
      // Offset from center corridor wall (attached cleanly to wooden wall)
      const offsetDist = isLeft ? -3.12 : 3.12;
      const shelfPos = pt.clone().add(normal.clone().multiplyScalar(offsetDist));
      shelfPos.y = 0.08; // Wall-mounted floating level

      // Direction vector pointing from the bookshelf directly into the center corridor aisle
      const inwardDir = pt.clone().sub(shelfPos).setY(0).normalize();

      // Orientation: local +Z (the open front of the bookshelf with books and plaque) faces inward toward the corridor
      const rotY = Math.atan2(inwardDir.x, inwardDir.z);

      // Front vector facing out from the shelf toward the aisle
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
    <div className="w-full h-full relative bg-[#120b06]">
      <Canvas
        camera={{ fov: 55, near: 0.1, far: 180, position: [0, 0.22, 8] }}
        gl={{
          antialias: true,
          toneMapping: THREE.ACESFilmicToneMapping,
          toneMappingExposure: 1.2,
        }}
        style={{ width: '100%', height: '100%', display: 'block', background: '#120b06' }}
      >
        {/* Warm atmospheric library depth fog */}
        <fog attach="fog" args={['#160e08', 7, 58]} />

        {/* Global Multi-directional Gallery Lighting */}
        <ambientLight intensity={0.9} color="#fff8ee" />
        <hemisphereLight args={['#fff5e6', '#3b2210', 0.7]} />
        <directionalLight position={[14, 22, 10]} intensity={1.3} color="#fff3e0" castShadow />
        <directionalLight position={[-14, 16, -10]} intensity={0.8} color="#fdecd9" />

        {/* Camera controller */}
        <CameraRig
          scrollProgress={scrollProgress}
          inspectedShelf={inspectedShelf}
          shelfTransforms={transformMap}
        />

        {/* Curved White Architectural Corridor */}
        <CurvedCorridor />

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
