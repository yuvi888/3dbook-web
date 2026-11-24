'use client';

import { useRef, useState, useMemo, useEffect } from 'react';
import { useFrame } from '@react-three/fiber';
import { Html } from '@react-three/drei';
import * as THREE from 'three';

export interface AdvancedBook3DProps {
  coverUrl?: string;
  spineColor?: string;
  title?: string;
  author?: string;
  position?: [number, number, number];
  rotation?: [number, number, number];
  scale?: number;
  interactive?: boolean;
  onClick?: () => void;
}

// Ultra-realistic default network book cover (photorealistic classic hardcover binding)
const DEFAULT_NETWORK_COVER =
  'https://images.unsplash.com/photo-1543002588-bfa74002ed7e?auto=format&fit=crop&w=1200&q=80';

export function AdvancedBook3D({
  coverUrl = DEFAULT_NETWORK_COVER,
  spineColor = '#141c2b',
  title = 'Vintage Hardcover',
  author = 'Classic Literature',
  position = [0, 0, 0],
  rotation = [0, 0, 0],
  scale = 1.0,
  interactive = true,
  onClick,
}: AdvancedBook3DProps) {
  const groupRef = useRef<THREE.Group>(null!);
  const [hovered, setHovered] = useState(false);
  const [loadedCoverTexture, setLoadedCoverTexture] = useState<THREE.Texture | null>(null);

  // Proportions for authentic royal trade volume
  const bookW = 0.165;      // Width across page block (X axis)
  const bookH = 0.245;      // Height (Y axis)
  const bookT = 0.046;      // Total thickness (Z axis)
  const boardThick = 0.0035;// Binder board thickness (3.5 mm)
  const overhang = 0.006;   // Squares overhang past paper (6 mm)

  const pageW = bookW - overhang;
  const pageH = bookH - overhang * 2;
  const pageT = bookT - boardThick * 2 - 0.003;

  // =========================================================================
  // 1. DYNAMIC NETWORK COVER IMAGE LOADER WITH CORS
  // =========================================================================
  useEffect(() => {
    let active = true;
    const loader = new THREE.TextureLoader();
    loader.setCrossOrigin('anonymous');

    loader.load(
      coverUrl,
      (tex) => {
        if (!active) return;
        tex.colorSpace = THREE.SRGBColorSpace;
        tex.generateMipmaps = true;
        tex.minFilter = THREE.LinearMipmapLinearFilter;
        tex.magFilter = THREE.LinearFilter;
        tex.wrapS = THREE.ClampToEdgeWrapping;
        tex.wrapT = THREE.ClampToEdgeWrapping;
        tex.needsUpdate = true;
        setLoadedCoverTexture(tex);
      },
      undefined,
      (err) => {
        console.warn('Network cover failed to load, falling back to procedural:', err);
        if (active) setLoadedCoverTexture(null);
      }
    );

    return () => {
      active = false;
    };
  }, [coverUrl]);

  // High-fidelity fallback procedural canvas texture if offline
  const fallbackCoverTexture = useMemo(() => {
    if (typeof window === 'undefined') return undefined;
    const canvas = document.createElement('canvas');
    canvas.width = 1024;
    canvas.height = 1536;
    const ctx = canvas.getContext('2d');
    if (!ctx) return undefined;

    // Deep textured bookcloth gradient
    const grad = ctx.createLinearGradient(0, 0, 1024, 1536);
    grad.addColorStop(0, '#16233b');
    grad.addColorStop(0.5, '#1e2f4e');
    grad.addColorStop(1, '#0c1524');
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, 1024, 1536);

    // Fine tactile cloth stipple
    ctx.fillStyle = 'rgba(255, 255, 255, 0.04)';
    for (let y = 0; y < 1536; y += 4) {
      ctx.fillRect(0, y, 1024, 1.5);
    }

    // Debossed gold foil border
    ctx.strokeStyle = '#e5c158';
    ctx.lineWidth = 10;
    ctx.strokeRect(48, 48, 928, 1440);
    ctx.strokeStyle = '#fff3c4';
    ctx.lineWidth = 3;
    ctx.strokeRect(66, 66, 892, 1404);

    // Typography
    ctx.save();
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillStyle = '#fce498';
    ctx.font = 'bold 36px serif';
    ctx.letterSpacing = '8px';
    ctx.fillText('SPECIAL HARDCOVER EDITION', 512, 220);

    ctx.fillStyle = '#ffffff';
    ctx.font = '900 84px serif';
    ctx.letterSpacing = '4px';
    ctx.fillText(title.toUpperCase(), 512, 380);

    ctx.font = '600 44px serif';
    ctx.fillStyle = '#fce498';
    ctx.fillText(author.toUpperCase(), 512, 540);
    ctx.restore();

    const tex = new THREE.CanvasTexture(canvas);
    tex.colorSpace = THREE.SRGBColorSpace;
    return tex;
  }, [title, author]);

  // Paper leaves striation texture (horizontal micro-layers)
  const paperTexture = useMemo(() => {
    if (typeof window === 'undefined') return undefined;
    const canvas = document.createElement('canvas');
    canvas.width = 512;
    canvas.height = 512;
    const ctx = canvas.getContext('2d');
    if (!ctx) return undefined;

    ctx.fillStyle = '#faf5ec';
    ctx.fillRect(0, 0, 512, 512);

    ctx.fillStyle = 'rgba(150, 130, 100, 0.22)';
    for (let y = 0; y < 512; y += 4) {
      ctx.fillRect(0, y, 512, 1.5);
    }
    ctx.fillStyle = 'rgba(60, 45, 25, 0.12)';
    for (let y = 0; y < 512; y += 10) {
      ctx.fillRect(0, y, 512, 1);
    }

    const tex = new THREE.CanvasTexture(canvas);
    tex.wrapS = THREE.RepeatWrapping;
    tex.wrapT = THREE.RepeatWrapping;
    tex.repeat.set(1, 10);
    return tex;
  }, []);

  // Materials
  const materials = useMemo(() => {
    const activeCover = loadedCoverTexture || fallbackCoverTexture;

    // Front cover with user network image
    const frontCoverMat = new THREE.MeshStandardMaterial({
      map: activeCover,
      roughness: 0.38,
      metalness: 0.04,
    });

    // Premium dark bookcloth wrap for spine and back
    const bookClothMat = new THREE.MeshStandardMaterial({
      color: spineColor,
      roughness: 0.52,
      metalness: 0.02,
    });

    // Natural paper text block
    const paperMat = new THREE.MeshStandardMaterial({
      map: paperTexture,
      color: '#fcf8ee',
      roughness: 0.85,
      metalness: 0.01,
    });

    // Headband woven fabric
    const headbandMat = new THREE.MeshStandardMaterial({
      color: '#d4af37',
      roughness: 0.38,
      metalness: 0.35,
    });

    return {
      frontCoverMat,
      bookClothMat,
      paperMat,
      headbandMat,
    };
  }, [loadedCoverTexture, fallbackCoverTexture, spineColor, paperTexture]);

  // =========================================================================
  // 2. CONCAVE 3D PAPER TEXT BLOCK GEOMETRY
  // =========================================================================
  const concavePaperGeo = useMemo(() => {
    const xSegs = 16;
    const ySegs = 20;
    const zSegs = 16;

    const halfPW = pageW / 2;
    const halfPH = pageH / 2;
    const halfPT = pageT / 2;
    const concavity = 0.007; // 7mm inward curvature on fore-edge

    const verts: number[] = [];
    const normals: number[] = [];
    const uvs: number[] = [];
    const indices: number[] = [];

    function addQuad(v0: number, v1: number, v2: number, v3: number) {
      indices.push(v0, v1, v2, v1, v3, v2);
    }

    // Fore-edge (+X curved face)
    const foreStart = verts.length / 3;
    for (let iy = 0; iy <= ySegs; iy++) {
      const v = iy / ySegs;
      const y = -halfPH + v * pageH;
      for (let iz = 0; iz <= zSegs; iz++) {
        const u = iz / zSegs;
        const z = -halfPT + u * pageT;
        const normZ = z / halfPT;
        const curveX = halfPW - concavity * (1.0 - normZ * normZ);

        verts.push(curveX, y, z);
        const dXdz = (2 * concavity * normZ) / halfPT;
        const n = new THREE.Vector3(1, 0, -dXdz).normalize();
        normals.push(n.x, n.y, n.z);
        uvs.push(u, v * 12);
      }
    }
    for (let iy = 0; iy < ySegs; iy++) {
      for (let iz = 0; iz < zSegs; iz++) {
        const row1 = foreStart + iy * (zSegs + 1);
        const row2 = foreStart + (iy + 1) * (zSegs + 1);
        addQuad(row1 + iz, row1 + iz + 1, row2 + iz, row2 + iz + 1);
      }
    }

    // Top head (+Y)
    const topStart = verts.length / 3;
    for (let ix = 0; ix <= xSegs; ix++) {
      const u = ix / xSegs;
      for (let iz = 0; iz <= zSegs; iz++) {
        const v = iz / zSegs;
        const z = -halfPT + v * pageT;
        const normZ = z / halfPT;
        const endX = halfPW - concavity * (1.0 - normZ * normZ);
        const startX = -halfPW;
        const x = startX + u * (endX - startX);

        verts.push(x, halfPH, z);
        normals.push(0, 1, 0);
        uvs.push(u, v);
      }
    }
    for (let ix = 0; ix < xSegs; ix++) {
      for (let iz = 0; iz < zSegs; iz++) {
        const row1 = topStart + ix * (zSegs + 1);
        const row2 = topStart + (ix + 1) * (zSegs + 1);
        addQuad(row1 + iz, row2 + iz, row1 + iz + 1, row2 + iz + 1);
      }
    }

    // Bottom tail (-Y)
    const botStart = verts.length / 3;
    for (let ix = 0; ix <= xSegs; ix++) {
      const u = ix / xSegs;
      for (let iz = 0; iz <= zSegs; iz++) {
        const v = iz / zSegs;
        const z = -halfPT + v * pageT;
        const normZ = z / halfPT;
        const endX = halfPW - concavity * (1.0 - normZ * normZ);
        const startX = -halfPW;
        const x = startX + u * (endX - startX);

        verts.push(x, -halfPH, z);
        normals.push(0, -1, 0);
        uvs.push(u, v);
      }
    }
    for (let ix = 0; ix < xSegs; ix++) {
      for (let iz = 0; iz < zSegs; iz++) {
        const row1 = botStart + ix * (zSegs + 1);
        const row2 = botStart + (ix + 1) * (zSegs + 1);
        addQuad(row1 + iz, row1 + iz + 1, row2 + iz, row2 + iz + 1);
      }
    }

    // Spine inner face (-X)
    const spineStart = verts.length / 3;
    for (let iy = 0; iy <= ySegs; iy++) {
      const v = iy / ySegs;
      const y = -halfPH + v * pageH;
      for (let iz = 0; iz <= zSegs; iz++) {
        const u = iz / zSegs;
        const z = -halfPT + u * pageT;
        verts.push(-halfPW, y, z);
        normals.push(-1, 0, 0);
        uvs.push(u, v);
      }
    }
    for (let iy = 0; iy < ySegs; iy++) {
      for (let iz = 0; iz < zSegs; iz++) {
        const row1 = spineStart + iy * (zSegs + 1);
        const row2 = spineStart + (iy + 1) * (zSegs + 1);
        addQuad(row1 + iz, row2 + iz, row1 + iz + 1, row2 + iz + 1);
      }
    }

    // Front & Back faces
    const frontStart = verts.length / 3;
    verts.push(-halfPW, -halfPH, halfPT, halfPW, -halfPH, halfPT, -halfPW, halfPH, halfPT, halfPW, halfPH, halfPT);
    normals.push(0, 0, 1, 0, 0, 1, 0, 0, 1, 0, 0, 1);
    uvs.push(0, 0, 1, 0, 0, 1, 1, 1);
    addQuad(frontStart, frontStart + 1, frontStart + 2, frontStart + 3);

    const backStart = verts.length / 3;
    verts.push(-halfPW, -halfPH, -halfPT, -halfPW, halfPH, -halfPT, halfPW, -halfPH, -halfPT, halfPW, halfPH, -halfPT);
    normals.push(0, 0, -1, 0, 0, -1, 0, 0, -1, 0, 0, -1);
    uvs.push(0, 0, 0, 1, 1, 0, 1, 1);
    addQuad(backStart, backStart + 1, backStart + 2, backStart + 3);

    const geo = new THREE.BufferGeometry();
    geo.setAttribute('position', new THREE.Float32BufferAttribute(verts, 3));
    geo.setAttribute('normal', new THREE.Float32BufferAttribute(normals, 3));
    geo.setAttribute('uv', new THREE.Float32BufferAttribute(uvs, 2));
    geo.setIndex(indices);
    geo.computeVertexNormals();
    return geo;
  }, [pageW, pageH, pageT]);

  // Back cover board with beveled edges
  const backBoardGeo = useMemo(() => {
    const shape = new THREE.Shape();
    const cornerR = 0.003;
    const bW = bookW;
    const bH = bookH;

    shape.moveTo(-bW / 2, -bH / 2 + cornerR);
    shape.lineTo(-bW / 2, bH / 2 - cornerR);
    shape.quadraticCurveTo(-bW / 2, bH / 2, -bW / 2 + cornerR, bH / 2);
    shape.lineTo(bW / 2 - cornerR, bH / 2);
    shape.quadraticCurveTo(bW / 2, bH / 2, bW / 2, bH / 2 - cornerR);
    shape.lineTo(bW / 2, -bH / 2 + cornerR);
    shape.quadraticCurveTo(bW / 2, -bH / 2, bW / 2 - cornerR, -bH / 2);
    shape.lineTo(-bW / 2 + cornerR, -bH / 2);
    shape.quadraticCurveTo(-bW / 2, -bH / 2, -bW / 2, -bH / 2 + cornerR);

    const geo = new THREE.ExtrudeGeometry(shape, {
      steps: 1,
      depth: boardThick,
      bevelEnabled: true,
      bevelThickness: 0.001,
      bevelSize: 0.001,
      bevelSegments: 3,
    });
    geo.center();
    return geo;
  }, [bookW, bookH, boardThick]);

  // Smooth hover pop-out interaction
  useFrame((_, delta) => {
    if (!groupRef.current || !interactive) return;

    const targetZ = hovered ? position[2] + 0.06 : position[2];
    const targetY = hovered ? position[1] + 0.015 : position[1];
    const targetRotX = hovered ? rotation[0] + 0.05 : rotation[0];
    const targetRotY = hovered ? rotation[1] - 0.08 : rotation[1];

    const lerpSpeed = Math.min(1, delta * 14);
    groupRef.current.position.z = THREE.MathUtils.lerp(groupRef.current.position.z, targetZ, lerpSpeed);
    groupRef.current.position.y = THREE.MathUtils.lerp(groupRef.current.position.y, targetY, lerpSpeed);
    groupRef.current.rotation.x = THREE.MathUtils.lerp(groupRef.current.rotation.x, targetRotX, lerpSpeed);
    groupRef.current.rotation.y = THREE.MathUtils.lerp(groupRef.current.rotation.y, targetRotY, lerpSpeed);
  });

  return (
    <group
      ref={groupRef}
      position={position}
      rotation={rotation}
      scale={[scale, scale, scale]}
      onClick={(e) => {
        if (!interactive) return;
        e.stopPropagation();
        if (onClick) onClick();
      }}
      onPointerOver={(e) => {
        if (!interactive) return;
        e.stopPropagation();
        setHovered(true);
        document.body.style.cursor = 'pointer';
      }}
      onPointerOut={() => {
        setHovered(false);
        document.body.style.cursor = 'auto';
      }}
    >
      {/* 1. Fully 3D Concave Paper Text Block */}
      <mesh
        geometry={concavePaperGeo}
        position={[overhang / 2, 0, 0]}
        material={materials.paperMat}
        castShadow
        receiveShadow
      />

      {/* 2. Beveled Back Cover Board (-Z Face) */}
      <mesh
        geometry={backBoardGeo}
        position={[0, 0, -bookT / 2 + boardThick / 2]}
        material={materials.bookClothMat}
        castShadow
        receiveShadow
      />

      {/* 3. Front Cover Board (+Z Face) with Clean Planar UVs for User Image */}
      <mesh
        position={[0, 0, bookT / 2 - boardThick / 2]}
        material={[
          materials.bookClothMat, // +X Fore-edge
          materials.bookClothMat, // -X Spine-edge
          materials.bookClothMat, // +Y Top head
          materials.bookClothMat, // -Y Bottom tail
          materials.frontCoverMat,// +Z FRONT COVER (USER NETWORK IMAGE)
          materials.bookClothMat, // -Z Inner paste-down
        ]}
        castShadow
        receiveShadow
      >
        <boxGeometry args={[bookW, bookH, boardThick]} />
      </mesh>

      {/* 4. Debossed French Groove Hinge Joint Creases */}
      <mesh
        position={[-bookW / 2 + 0.016, 0, bookT / 2 + 0.0006]}
        material={materials.bookClothMat}
      >
        <boxGeometry args={[0.0028, bookH - 0.002, 0.002]} />
      </mesh>
      <mesh
        position={[-bookW / 2 + 0.016, 0, -bookT / 2 - 0.0006]}
        material={materials.bookClothMat}
      >
        <boxGeometry args={[0.0028, bookH - 0.002, 0.002]} />
      </mesh>

      {/* 5. Continuous Rounded Convex Spine */}
      <group position={[-bookW / 2 + 0.003, 0, 0]}>
        <mesh
          scale={[0.52, 1, 1]}
          material={materials.bookClothMat}
          castShadow
          receiveShadow
        >
          <cylinderGeometry
            args={[
              bookT / 2,
              bookT / 2,
              bookH,
              32,
              1,
              false,
              Math.PI / 2,
              Math.PI,
            ]}
          />
        </mesh>

        {/* Headband Cloth at Top and Bottom of Spine */}
        <mesh position={[0.004, bookH / 2 - 0.0035, 0]} material={materials.headbandMat}>
          <boxGeometry args={[0.008, 0.007, bookT - 0.008]} />
        </mesh>
        <mesh position={[0.004, -bookH / 2 + 0.0035, 0]} material={materials.headbandMat}>
          <boxGeometry args={[0.008, 0.007, bookT - 0.008]} />
        </mesh>
      </group>

      {/* NO RED STRIPE! (Completely removed) */}

      {/* 6. Interactive Hover Tooltip */}
      {hovered && interactive && (
        <Html
          position={[0, bookH / 2 + 0.08, bookT / 2 + 0.02]}
          center
          distanceFactor={5.2}
          style={{ pointerEvents: 'none' }}
        >
          <div className="bg-neutral-950/95 backdrop-blur-xl text-white border border-amber-500/50 rounded-2xl px-4 py-2.5 shadow-[0_15px_40px_rgba(0,0,0,0.85)] flex flex-col whitespace-nowrap pointer-events-none transform -translate-y-2 transition-all">
            <div className="flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-amber-400 animate-pulse" />
              <span className="text-xs font-black uppercase tracking-wider text-amber-200">
                {title}
              </span>
            </div>
            <div className="flex items-center gap-2 mt-1 text-[11px] text-neutral-300">
              <span className="text-amber-300 font-semibold">{author}</span>
              <span className="text-neutral-500">•</span>
              <span className="text-emerald-400 font-medium">3D Casebound Hardcover</span>
            </div>
          </div>
        </Html>
      )}
    </group>
  );
}
