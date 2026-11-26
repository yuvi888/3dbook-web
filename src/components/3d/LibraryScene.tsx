'use client';

import { Suspense, useRef, useState, useCallback, useMemo, useEffect } from 'react';
import { Canvas, useFrame, useThree } from '@react-three/fiber';
import { EffectComposer, N8AO, Bloom, Vignette } from '@react-three/postprocessing';
import * as THREE from 'three';
import { BOOKSHELVES_DATA } from '@/data/libraryData';
import { BookshelfItem, BookItem } from '@/types/library';
import { Bookshelf3D } from './Bookshelf3D';
import {
  CurvedCorridor,
  tunnelCurve,
  CORRIDOR_DIMS,
  CHANDELIER_TS,
  WALL_SCONCE_PLACEMENTS,
} from './CurvedCorridor';
import { ShelfInspectionHUD } from '../ui/ShelfInspectionHUD';

interface LibrarySceneProps {
  onInspectionChange?: (isInspecting: boolean) => void;
}

// Camera Rig synced directly to sub-pixel Lenis scroll with frame-rate-independent exponential damping
function CameraRig({
  inspectedShelf,
  shelfTransforms,
}: {
  inspectedShelf: BookshelfItem | null;
  shelfTransforms: Map<string, { pos: THREE.Vector3; rotY: number; frontVec: THREE.Vector3 }>;
}) {
  const { camera } = useThree();
  const currentLookAt = useRef(new THREE.Vector3(0, -0.05, -6));
  const mouseTargetRef = useRef({ x: 0, y: 0 });
  const mouseSmoothedRef = useRef({ x: 0, y: 0 });
  const smoothedProgressRef = useRef(0.001);
  const inspectBlendRef = useRef(0);
  const lastInspectPosRef = useRef(new THREE.Vector3(0, -0.02, 7.5));
  const lastInspectLookRef = useRef(new THREE.Vector3(0, -0.06, -6));

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      mouseTargetRef.current.x = (e.clientX / window.innerWidth - 0.5) * 2;
      mouseTargetRef.current.y = (e.clientY / window.innerHeight - 0.5) * 2;
    };
    window.addEventListener('mousemove', handleMouseMove, { passive: true });
    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
    };
  }, []);

  useFrame((_, delta) => {
    const dt = Math.min(delta, 0.05);

    // Smooth parallax mouse input independently
    const mouseAlpha = 1 - Math.exp(-7.5 * dt);
    mouseSmoothedRef.current.x = THREE.MathUtils.lerp(mouseSmoothedRef.current.x, mouseTargetRef.current.x, mouseAlpha);
    mouseSmoothedRef.current.y = THREE.MathUtils.lerp(mouseSmoothedRef.current.y, mouseTargetRef.current.y, mouseAlpha);

    const parallaxX = mouseSmoothedRef.current.x * 0.14;
    const parallaxY = -mouseSmoothedRef.current.y * 0.08;

    // Read floating-point sub-pixel scroll every frame directly (zero DOM scroll-event phase jitter)
    const maxScroll = Math.max(1, document.documentElement.scrollHeight - window.innerHeight);
    const liveScroll = (typeof window !== 'undefined' ? window.__yshelfScroll : undefined) ?? window.scrollY;
    const rawTarget = THREE.MathUtils.clamp(liveScroll / maxScroll, 0.001, 0.965);

    // Single smooth exponential damper along the 1D spline parameter
    const scrollAlpha = 1 - Math.exp(-6.5 * dt);
    smoothedProgressRef.current = THREE.MathUtils.lerp(smoothedProgressRef.current, rawTarget, scrollAlpha);

    const clampedProgress = THREE.MathUtils.clamp(smoothedProgressRef.current, 0.001, 0.965);
    const pathPoint = tunnelCurve.getPointAt(clampedProgress);
    const tangent = tunnelCurve.getTangentAt(clampedProgress).normalize();
    const normal = new THREE.Vector3(-tangent.z, 0, tangent.x).normalize();

    const corridorCamPos = pathPoint.clone();
    corridorCamPos.y = -0.02 + parallaxY * 0.35;
    corridorCamPos.add(normal.multiplyScalar(parallaxX * 0.85));

    const lookAheadProgress = Math.min(0.999, clampedProgress + 0.042);
    const corridorLookAt = tunnelCurve.getPointAt(lookAheadProgress).clone();
    corridorLookAt.y = -0.06 + parallaxY * 0.2;

    // Blend smoothly into/out of bookshelf close-up inspection without cutting corridor corners while scrolling
    const inspectTarget = inspectedShelf ? 1 : 0;
    const inspectAlpha = 1 - Math.exp(-5.5 * dt);
    inspectBlendRef.current = THREE.MathUtils.lerp(inspectBlendRef.current, inspectTarget, inspectAlpha);

    if (inspectedShelf) {
      const transform = shelfTransforms.get(inspectedShelf.id);
      if (transform) {
        const targetCamPos = transform.pos
          .clone()
          .add(transform.frontVec.clone().multiplyScalar(2.42));
        targetCamPos.y = transform.pos.y + 0.14 + parallaxY * 0.18;
        targetCamPos.x += parallaxX * 0.18;

        const targetLookAt = transform.pos.clone();
        targetLookAt.y = transform.pos.y + 0.18;

        lastInspectPosRef.current.lerp(targetCamPos, inspectAlpha);
        lastInspectLookRef.current.lerp(targetLookAt, inspectAlpha);
      }
    } else if (inspectBlendRef.current < 0.001) {
      inspectBlendRef.current = 0;
    }

    if (inspectBlendRef.current > 0) {
      camera.position.lerpVectors(corridorCamPos, lastInspectPosRef.current, inspectBlendRef.current);
      currentLookAt.current.lerpVectors(corridorLookAt, lastInspectLookRef.current, inspectBlendRef.current);
      if (!inspectedShelf) {
        // Keep lastInspectPos anchored on transition start so exiting doesn't snap
        lastInspectPosRef.current.copy(lastInspectPosRef.current);
      }
    } else {
      camera.position.copy(corridorCamPos);
      currentLookAt.current.copy(corridorLookAt);
      lastInspectPosRef.current.copy(corridorCamPos);
      lastInspectLookRef.current.copy(corridorLookAt);
    }

    camera.lookAt(currentLookAt.current);
  });

  return null;
}

/**
 * Tracking Directional Sun Light:
 * Smoothly moves its 2048px crisp orthographic shadow frustum with the camera down the entire 232m gallery
 * so there is never a harsh shadow-frustum box seam anywhere along the carpet or oak planks.
 */
function DirectionalSunRig() {
  const { camera } = useThree();
  const dirLightRef = useRef<THREE.DirectionalLight>(null!);
  const targetObj = useMemo(() => new THREE.Object3D(), []);

  useFrame(() => {
    if (!dirLightRef.current) return;
    targetObj.position.set(camera.position.x, -1.0, camera.position.z - 8);
    targetObj.updateMatrixWorld();
    dirLightRef.current.position.set(camera.position.x + 12, 22, camera.position.z + 6);
  });

  return (
    <>
      <primitive object={targetObj} />
      <directionalLight
        ref={dirLightRef}
        target={targetObj}
        position={[12, 22, 10]}
        intensity={0.95}
        color="#fff3dc"
        castShadow
        shadow-mapSize-width={1024}
        shadow-mapSize-height={1024}
        shadow-camera-left={-18}
        shadow-camera-right={18}
        shadow-camera-top={18}
        shadow-camera-bottom={-18}
        shadow-camera-near={2}
        shadow-camera-far={48}
        shadow-bias={-0.0004}
      />
    </>
  );
}

/**
 * Fixed-budget dynamic point-light pool (12 hardware point lights total):
 * Prevents WebGL shader uniform overflows while keeping nearest chandeliers,
 * active bookshelves, and wall sconces genuinely illuminated everywhere down the corridor.
 */
function DynamicCorridorLightPool({
  shelvesWithTransforms,
  inspectedShelfId,
}: {
  shelvesWithTransforms: Array<{
    shelf: BookshelfItem;
    pos: THREE.Vector3;
    frontVec: THREE.Vector3;
  }>;
  inspectedShelfId: string | null;
}) {
  const { camera } = useThree();
  const chandRefs = useRef<Array<THREE.PointLight | null>>([]);
  const shelfRefs = useRef<Array<THREE.PointLight | null>>([]);
  const sconceRefs = useRef<Array<THREE.PointLight | null>>([]);

  const chandelierPositions = useMemo(() => {
    return CHANDELIER_TS.map((t) => {
      const pt = tunnelCurve.getPointAt(t);
      return new THREE.Vector3(pt.x, CORRIDOR_DIMS.CEILING_Y - 0.56, pt.z);
    });
  }, []);

  const sconcePositions = useMemo(() => {
    return WALL_SCONCE_PLACEMENTS.map((sc) => {
      const pt = tunnelCurve.getPointAt(sc.t);
      const tangent = tunnelCurve.getTangentAt(sc.t).normalize();
      const normal = new THREE.Vector3(-tangent.z, 0, tangent.x).normalize();
      const sign = sc.side === 'left' ? -1 : 1;
      const p = pt.clone().add(normal.multiplyScalar(sign * (CORRIDOR_DIMS.HALF_W - 0.25)));
      p.y = 0.34;
      return p;
    });
  }, []);

  const shelfLightPositions = useMemo(() => {
    return shelvesWithTransforms.map((item) => ({
      id: item.shelf.id,
      pos: item.pos.clone().add(item.frontVec.clone().multiplyScalar(0.58)),
    }));
  }, [shelvesWithTransforms]);

  useFrame(() => {
    const camPos = camera.position;

    // 4 nearest ceiling chandeliers
    const nearestChands = chandelierPositions
      .map((p) => ({ p, d: p.distanceToSquared(camPos) }))
      .sort((a, b) => a.d - b.d)
      .slice(0, 4);
    nearestChands.forEach((item, idx) => {
      const l = chandRefs.current[idx];
      if (l) l.position.copy(item.p);
    });

    // 4 nearest / inspected bookshelf wash lights
    const nearestShelves = shelfLightPositions
      .map((item) => ({
        p: item.pos,
        d: item.id === inspectedShelfId ? -1 : item.pos.distanceToSquared(camPos),
      }))
      .sort((a, b) => a.d - b.d)
      .slice(0, 4);
    nearestShelves.forEach((item, idx) => {
      const l = shelfRefs.current[idx];
      if (l) l.position.copy(item.p);
    });

    // 4 nearest wall sconce wash lights
    const nearestSconces = sconcePositions
      .map((p) => ({ p, d: p.distanceToSquared(camPos) }))
      .sort((a, b) => a.d - b.d)
      .slice(0, 4);
    nearestSconces.forEach((item, idx) => {
      const l = sconceRefs.current[idx];
      if (l) l.position.copy(item.p);
    });
  });

  return (
    <group>
      {[0, 1, 2, 3].map((i) => (
        <pointLight
          key={`pool-chand-${i}`}
          ref={(el) => {
            chandRefs.current[i] = el;
          }}
          position={[0, 1.0, -5 - i * 14]}
          color="#ffe2ad"
          intensity={2.4}
          distance={13}
          decay={1.5}
        />
      ))}
      {[0, 1, 2, 3].map((i) => (
        <pointLight
          key={`pool-shelf-${i}`}
          ref={(el) => {
            shelfRefs.current[i] = el;
          }}
          position={[0, 0.0, -6 - i * 16]}
          color="#ffebc4"
          intensity={1.4}
          distance={4.0}
          decay={1.45}
        />
      ))}
      {[0, 1, 2, 3].map((i) => (
        <pointLight
          key={`pool-sconce-${i}`}
          ref={(el) => {
            sconceRefs.current[i] = el;
          }}
          position={[0, 0.34, -4 - i * 12]}
          color="#ffd58c"
          intensity={1.1}
          distance={5.5}
          decay={1.7}
        />
      ))}
    </group>
  );
}

export default function LibraryScene({ onInspectionChange }: LibrarySceneProps) {
  const [inspectedShelf, setInspectedShelf] = useState<BookshelfItem | null>(null);
  const [selectedBook, setSelectedBook] = useState<BookItem | null>(null);
  const [hoveredBook, setHoveredBook] = useState<BookItem | null>(null);

  useEffect(() => {
    if (onInspectionChange) {
      onInspectionChange(inspectedShelf !== null);
    }
  }, [inspectedShelf, onInspectionChange]);

  // Place shelves flush against left/right beige corridor walls
  const { shelvesWithTransforms, transformMap } = useMemo(() => {
    const map = new Map<
      string,
      { pos: THREE.Vector3; rotY: number; frontVec: THREE.Vector3 }
    >();

    const wallMountDist = CORRIDOR_DIMS.HALF_W - 0.172; // Rear French cleat touches 2.40m wall cleanly

    const items = BOOKSHELVES_DATA.map((shelf) => {
      const pt = tunnelCurve.getPointAt(shelf.t);
      const tangent = tunnelCurve.getTangentAt(shelf.t).normalize();
      const normal = new THREE.Vector3(-tangent.z, 0, tangent.x).normalize();

      const isLeft = shelf.side === 'left';
      const shelfPos = pt.clone().add(normal.clone().multiplyScalar(isLeft ? -wallMountDist : wallMountDist));
      shelfPos.y = -0.10; // Grounded cleanly above wainscot dado ledge

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
        pos: shelfPos,
        frontVec,
        position: [shelfPos.x, shelfPos.y, shelfPos.z] as [number, number, number],
        rotation: [0, rotY, 0] as [number, number, number],
      };
    });

    return { shelvesWithTransforms: items, transformMap: map };
  }, []);

  const handleSelectShelf = useCallback((shelf: BookshelfItem) => {
    setHoveredBook(null);
    setInspectedShelf(shelf);
  }, []);

  const handleExitInspection = useCallback(() => {
    setInspectedShelf(null);
    setSelectedBook(null);
    setHoveredBook(null);
  }, []);

  const handleSelectBook = useCallback((book: BookItem) => {
    setSelectedBook(book);
  }, []);

  const handleCloseBookDetail = useCallback(() => {
    setSelectedBook(null);
  }, []);

  return (
    <div className="w-full h-full relative bg-[#e9dfd0]">
      <Canvas
        shadows
        dpr={[1, 1.5]}
        camera={{ fov: 52, near: 0.08, far: 280, position: [0, -0.02, 7.5] }}
        gl={{
          antialias: true,
          toneMapping: THREE.ACESFilmicToneMapping,
          toneMappingExposure: 1.08,
        }}
        style={{ width: '100%', height: '100%', display: 'block', background: '#e9dfd0' }}
      >
        {/* Warm Architectural Museum Haze */}
        <fog attach="fog" args={['#e5dac7', 22, 84]} />

        {/* Balanced Warm Natural & Interior Lighting */}
        <ambientLight intensity={0.62} color="#fff7ea" />
        <hemisphereLight args={['#fff4e0', '#8d7154', 0.65]} />

        {/* Camera-Tracking Sun Shadow Frustum + Soft Fill */}
        <DirectionalSunRig />
        <directionalLight position={[-14, 18, -12]} intensity={0.48} color="#f8ebd4" />

        {/* Camera controller with smooth eye-level stroll & close inspection */}
        <CameraRig
          inspectedShelf={inspectedShelf}
          shelfTransforms={transformMap}
        />

        {/* Fixed 12-Light Dynamic Pool (Chandeliers, Shelves & Wall Sconces) */}
        <DynamicCorridorLightPool
          shelvesWithTransforms={shelvesWithTransforms}
          inspectedShelfId={inspectedShelf?.id ?? null}
        />

        <Suspense fallback={null}>
          {/* Curved Luxury Corridor Shell, Carpet, Beige Walls, Chandeliers, Windows, Sconces & Tall Plants */}
          <CurvedCorridor />

          {/* 3D Illuminated Modern White Bookshelves with Lamp, Plants, Flower Pot & Angled 3D Books */}
          {shelvesWithTransforms.map(({ shelf, position, rotation }) => (
            <Bookshelf3D
              key={shelf.id}
              shelf={shelf}
              position={position}
              rotation={rotation}
              isInspected={inspectedShelf?.id === shelf.id}
              onSelectShelf={handleSelectShelf}
              onSelectBook={handleSelectBook}
              onHoverBook={setHoveredBook}
            />
          ))}
        </Suspense>

        {/* Architectural Post-Processing (halfRes N8AO for ultra-smooth 60fps scrolling) */}
        <EffectComposer>
          <N8AO
            halfRes
            aoSamples={8}
            denoiseSamples={4}
            aoRadius={0.68}
            intensity={1.35}
            distanceFalloff={0.85}
          />
          <Bloom
            luminanceThreshold={1.06}
            luminanceSmoothing={0.28}
            intensity={0.28}
            mipmapBlur
          />
          <Vignette darkness={0.22} offset={0.32} />
        </EffectComposer>
      </Canvas>

      {/* Floating UI HUD for Shelf Inspection, Side Book Card & Full Book Modal */}
      <ShelfInspectionHUD
        inspectedShelf={inspectedShelf}
        selectedBook={selectedBook}
        hoveredBook={hoveredBook}
        onExitInspection={handleExitInspection}
        onCloseBookDetail={handleCloseBookDetail}
      />
    </div>
  );
}
