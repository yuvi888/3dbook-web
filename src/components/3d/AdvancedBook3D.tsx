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

/**
 * Generates an editorial 2:3 hardcover artwork on an offscreen canvas.
 * Used both for realistic built-in presets and as an instant offline fallback.
 */
export function createEditorialCoverDataUrl(options: {
  title: string;
  author: string;
  subtitle?: string;
  bgTop: string;
  bgBottom: string;
  accent: string;
  textColor?: string;
  motif?: 'sun' | 'arch' | 'cosmos' | 'botanical' | 'swiss';
}): string {
  if (typeof window === 'undefined') return '';
  const w = 1024;
  const h = 1536;
  const canvas = document.createElement('canvas');
  canvas.width = w;
  canvas.height = h;
  const ctx = canvas.getContext('2d');
  if (!ctx) return '';

  const textCol = options.textColor || '#faf6ed';

  // Rich paper/cloth gradient base
  const grad = ctx.createLinearGradient(0, 0, w * 0.4, h);
  grad.addColorStop(0, options.bgTop);
  grad.addColorStop(1, options.bgBottom);
  ctx.fillStyle = grad;
  ctx.fillRect(0, 0, w, h);

  // Subtle woven linen / fine paper grain
  for (let y = 0; y < h; y += 3) {
    ctx.fillStyle = y % 6 === 0 ? 'rgba(255,255,255,0.025)' : 'rgba(0,0,0,0.03)';
    ctx.fillRect(0, y, w, 1);
  }
  for (let x = 0; x < w; x += 4) {
    ctx.fillStyle = 'rgba(255,255,255,0.015)';
    ctx.fillRect(x, 0, 1, h);
  }

  // Subtle foil framing border
  ctx.strokeStyle = options.accent;
  ctx.lineWidth = 4;
  ctx.strokeRect(58, 58, w - 116, h - 116);
  ctx.globalAlpha = 0.45;
  ctx.lineWidth = 1.5;
  ctx.strokeRect(72, 72, w - 144, h - 144);
  ctx.globalAlpha = 1;

  // Center illustration motif
  ctx.save();
  const cx = w / 2;
  const cy = h * 0.54;

  if (options.motif === 'sun') {
    // Alchemist / desert sun & geometric dunes
    const sunGrad = ctx.createRadialGradient(cx, cy - 30, 10, cx, cy - 30, 210);
    sunGrad.addColorStop(0, options.accent);
    sunGrad.addColorStop(0.6, 'rgba(229,180,82,0.35)');
    sunGrad.addColorStop(1, 'rgba(229,180,82,0)');
    ctx.fillStyle = sunGrad;
    ctx.beginPath();
    ctx.arc(cx, cy - 30, 210, 0, Math.PI * 2);
    ctx.fill();

    ctx.strokeStyle = options.accent;
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.arc(cx, cy - 30, 120, 0, Math.PI * 2);
    ctx.stroke();

    // Rays
    for (let i = 0; i < 16; i++) {
      const a = (i * Math.PI * 2) / 16;
      ctx.beginPath();
      ctx.moveTo(cx + Math.cos(a) * 135, cy - 30 + Math.sin(a) * 135);
      ctx.lineTo(cx + Math.cos(a) * 175, cy - 30 + Math.sin(a) * 175);
      ctx.stroke();
    }
    // Horizon dune curve
    ctx.beginPath();
    ctx.moveTo(140, cy + 160);
    ctx.quadraticCurveTo(cx - 110, cy + 75, cx + 40, cy + 145);
    ctx.quadraticCurveTo(cx + 210, cy + 205, w - 140, cy + 135);
    ctx.stroke();
  } else if (options.motif === 'cosmos') {
    // Celestial orbits
    ctx.strokeStyle = options.accent;
    ctx.lineWidth = 2;
    [90, 155, 225].forEach((r, idx) => {
      ctx.beginPath();
      ctx.ellipse(cx, cy, r, r * (0.45 + idx * 0.16), 0.35 * idx, 0, Math.PI * 2);
      ctx.stroke();
    });
    ctx.fillStyle = options.accent;
    ctx.beginPath();
    ctx.arc(cx, cy, 24, 0, Math.PI * 2);
    ctx.fill();
    // Stars
    const starCoords = [
      [-210, -180], [220, -150], [-180, 170], [190, 195], [0, -240], [-250, 20], [260, -20],
    ];
    starCoords.forEach(([dx, dy]) => {
      ctx.beginPath();
      ctx.arc(cx + dx, cy + dy, 4, 0, Math.PI * 2);
      ctx.fill();
    });
  } else if (options.motif === 'botanical') {
    // Minimal botanical leaf stem emblem
    ctx.strokeStyle = options.accent;
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.moveTo(cx, cy + 210);
    ctx.quadraticCurveTo(cx - 18, cy, cx + 10, cy - 200);
    ctx.stroke();
    for (let i = -2; i <= 2; i++) {
      const ly = cy + i * 68;
      const side = i % 2 === 0 ? 1 : -1;
      ctx.beginPath();
      ctx.moveTo(cx, ly);
      ctx.quadraticCurveTo(cx + side * 95, ly - 55, cx + side * 125, ly - 15);
      ctx.quadraticCurveTo(cx + side * 75, ly + 25, cx, ly);
      ctx.stroke();
    }
  } else if (options.motif === 'swiss') {
    // Swiss editorial bold geometry
    ctx.fillStyle = options.accent;
    ctx.beginPath();
    ctx.arc(cx, cy, 170, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = options.bgTop;
    ctx.fillRect(cx - 170, cy - 12, 340, 24);
  } else {
    // Classical architectural arch / medallion
    ctx.strokeStyle = options.accent;
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.arc(cx, cy - 30, 145, Math.PI, 0);
    ctx.lineTo(cx + 145, cy + 165);
    ctx.lineTo(cx - 145, cy + 165);
    ctx.closePath();
    ctx.stroke();
    ctx.beginPath();
    ctx.arc(cx, cy - 30, 95, 0, Math.PI * 2);
    ctx.stroke();
  }
  ctx.restore();

  // Typography
  ctx.save();
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';

  ctx.fillStyle = options.accent;
  ctx.font = '600 28px Georgia, serif';
  ctx.fillText((options.subtitle || 'COLLECTOR HARDCOVER EDITION').toUpperCase(), cx, 168);

  // Title wrapping
  ctx.fillStyle = textCol;
  const words = options.title.toUpperCase().split(' ');
  const lines: string[] = [];
  let cur = '';
  for (const word of words) {
    const test = cur ? `${cur} ${word}` : word;
    if (test.length > 14 && cur) {
      lines.push(cur);
      cur = word;
    } else {
      cur = test;
    }
  }
  if (cur) lines.push(cur);

  ctx.font = '700 76px Georgia, serif';
  lines.slice(0, 3).forEach((line, idx) => {
    ctx.fillText(line, cx, 290 + idx * 88);
  });

  // Bottom author & publisher mark
  ctx.fillStyle = options.accent;
  ctx.fillRect(cx - 60, h - 255, 120, 2.5);

  ctx.fillStyle = textCol;
  ctx.font = '500 38px Georgia, serif';
  ctx.fillText(options.author.toUpperCase(), cx, h - 190);

  ctx.fillStyle = options.accent;
  ctx.font = '500 22px Georgia, serif';
  ctx.fillText('ARCHIVAL PRESS • MCMXXIV', cx, h - 125);
  ctx.restore();

  return canvas.toDataURL('image/png');
}

/**
 * Compute center-crop UV repeat/offset so any uploaded/custom cover image
 * preserves its aspect ratio cleanly on the front board (object-fit: cover).
 */
function applyAspectCoverFit(tex: THREE.Texture, targetAspect: number) {
  const img = tex.image as { width?: number; height?: number } | undefined;
  if (!img || !img.width || !img.height) return;

  const imgAspect = img.width / img.height;
  if (Math.abs(imgAspect - targetAspect) < 0.015) {
    tex.repeat.set(1, 1);
    tex.offset.set(0, 0);
  } else if (imgAspect > targetAspect) {
    // Wider image: crop left/right horizontally
    const scaleX = targetAspect / imgAspect;
    tex.repeat.set(scaleX, 1);
    tex.offset.set((1 - scaleX) / 2, 0);
  } else {
    // Taller image: crop top/bottom vertically
    const scaleY = imgAspect / targetAspect;
    tex.repeat.set(1, scaleY);
    tex.offset.set(0, (1 - scaleY) / 2);
  }
}

export function AdvancedBook3D({
  coverUrl,
  spineColor = '#252f42',
  title = 'The Alchemist',
  author = 'Paulo Coelho',
  position = [0, 0, 0],
  rotation = [0, 0, 0],
  scale = 1.0,
  interactive = true,
  onClick,
}: AdvancedBook3DProps) {
  const groupRef = useRef<THREE.Group>(null!);
  const [hovered, setHovered] = useState(false);
  const [loadedCoverTexture, setLoadedCoverTexture] = useState<THREE.Texture | null>(null);
  const [sampledBackColor, setSampledBackColor] = useState<string | null>(null);

  // Authentic royal trade hardcover proportions
  const bookW = 0.165;       // Total board width (X: -0.0825 to +0.0825)
  const bookH = 0.245;       // Total board height (Y: -0.1225 to +0.1225)
  const bookT = 0.044;       // Total thickness (Z: -0.022 to +0.022)
  const boardThick = 0.0032; // Rigid binder board thickness (3.2 mm)
  const overhang = 0.0055;   // Squares overhang past paper block (5.5 mm)

  const spinePaperX = -bookW / 2 + 0.0022;  // Nestled cleanly behind convex spine
  const forePaperX = bookW / 2 - overhang;  // Fore-edge recessed 5.5 mm
  const pageH = bookH - overhang * 2;
  // Exact flush thickness between inner board faces (no overlap, no gap)
  const pageT = bookT - boardThick * 2;

  // =========================================================================
  // 1. BUILT-IN HIGH-FIDELITY EDITORIAL COVER FALLBACK
  // =========================================================================
  const fallbackCoverTexture = useMemo(() => {
    if (typeof window === 'undefined') return undefined;
    const dataUrl = createEditorialCoverDataUrl({
      title,
      author,
      bgTop: '#1d2b44',
      bgBottom: '#101829',
      accent: '#e5c158',
      motif: 'arch',
    });
    const img = new Image();
    const tex = new THREE.Texture(img);
    tex.colorSpace = THREE.SRGBColorSpace;
    img.onload = () => {
      tex.needsUpdate = true;
    };
    img.src = dataUrl;
    return tex;
  }, [title, author]);

  // =========================================================================
  // 2. DYNAMIC COVER IMAGE LOADER (Supports URLs, Data URLs, Blob Uploads)
  // =========================================================================
  useEffect(() => {
    if (!coverUrl) {
      setLoadedCoverTexture(null);
      setSampledBackColor(null);
      return;
    }

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
        applyAspectCoverFit(tex, bookW / bookH);
        tex.needsUpdate = true;
        setLoadedCoverTexture(tex);

        // Try sampling the left border of the image to harmonize spine/back cover
        try {
          const img = tex.image as HTMLImageElement;
          if (img && img.width && img.height) {
            const sampleCanvas = document.createElement('canvas');
            sampleCanvas.width = 16;
            sampleCanvas.height = 16;
            const sCtx = sampleCanvas.getContext('2d');
            if (sCtx) {
              sCtx.drawImage(img, 0, Math.floor(img.height * 0.25), 4, Math.floor(img.height * 0.5), 0, 0, 16, 16);
              const data = sCtx.getImageData(4, 8, 1, 1).data;
              // Keep spine rich & readable (prevent pitch black)
              const r = Math.max(28, Math.min(210, data[0]));
              const g = Math.max(32, Math.min(210, data[1]));
              const b = Math.max(38, Math.min(210, data[2]));
              setSampledBackColor(`rgb(${r}, ${g}, ${b})`);
            }
          }
        } catch {
          setSampledBackColor(null);
        }
      },
      undefined,
      (err) => {
        console.warn('Cover image failed to load, using editorial fallback:', err);
        if (active) {
          setLoadedCoverTexture(null);
          setSampledBackColor(null);
        }
      }
    );

    return () => {
      active = false;
    };
  }, [coverUrl, bookW, bookH]);

  // =========================================================================
  // 3. REALISTIC PAPER LEAF EDGE & WOVEN CLOTH MICRO-TEXTURES
  // =========================================================================
  // Page lines stack along Z (mapped to UV.v) so lines run parallel to page sheets!
  const paperEdgeTexture = useMemo(() => {
    if (typeof window === 'undefined') return undefined;
    const canvas = document.createElement('canvas');
    canvas.width = 256;
    canvas.height = 1024;
    const ctx = canvas.getContext('2d');
    if (!ctx) return undefined;

    ctx.fillStyle = '#f8f2e4';
    ctx.fillRect(0, 0, 256, 1024);

    // Hundreds of crisp paper leaf striations along V (mapped across thickness Z)
    for (let y = 0; y < 1024; y += 3) {
      const shade = (Math.sin(y * 0.37) + 1) * 0.5;
      ctx.fillStyle = shade > 0.5 ? 'rgba(135, 112, 82, 0.22)' : 'rgba(180, 158, 125, 0.14)';
      ctx.fillRect(0, y, 256, 1.2);
    }
    // Signature gathering subtle darker intervals
    for (let y = 0; y < 1024; y += 32) {
      ctx.fillStyle = 'rgba(95, 75, 50, 0.16)';
      ctx.fillRect(0, y, 256, 1.5);
    }

    const tex = new THREE.CanvasTexture(canvas);
    tex.colorSpace = THREE.SRGBColorSpace;
    tex.wrapS = THREE.RepeatWrapping;
    tex.wrapT = THREE.RepeatWrapping;
    return tex;
  }, []);

  // Subtle woven linen/matte paper bump texture for realistic hardcover tactile sheen
  const clothBumpTexture = useMemo(() => {
    if (typeof window === 'undefined') return undefined;
    const canvas = document.createElement('canvas');
    canvas.width = 256;
    canvas.height = 256;
    const ctx = canvas.getContext('2d');
    if (!ctx) return undefined;

    ctx.fillStyle = '#808080';
    ctx.fillRect(0, 0, 256, 256);
    for (let y = 0; y < 256; y += 2) {
      ctx.fillStyle = y % 4 === 0 ? '#929292' : '#6e6e6e';
      ctx.fillRect(0, y, 256, 1);
    }
    for (let x = 0; x < 256; x += 2) {
      ctx.fillStyle = x % 4 === 0 ? 'rgba(255,255,255,0.12)' : 'rgba(0,0,0,0.12)';
      ctx.fillRect(x, 0, 1, 256);
    }

    const tex = new THREE.CanvasTexture(canvas);
    tex.wrapS = THREE.RepeatWrapping;
    tex.wrapT = THREE.RepeatWrapping;
    tex.repeat.set(6, 9);
    return tex;
  }, []);

  // Woven striped headband texture (cream & burgundy/gold heritage trim)
  const headbandTexture = useMemo(() => {
    if (typeof window === 'undefined') return undefined;
    const canvas = document.createElement('canvas');
    canvas.width = 128;
    canvas.height = 64;
    const ctx = canvas.getContext('2d');
    if (!ctx) return undefined;

    for (let x = 0; x < 128; x += 8) {
      ctx.fillStyle = (x / 8) % 2 === 0 ? '#d8b454' : '#7b242c';
      ctx.fillRect(x, 0, 8, 64);
    }
    const tex = new THREE.CanvasTexture(canvas);
    tex.colorSpace = THREE.SRGBColorSpace;
    tex.wrapS = THREE.RepeatWrapping;
    tex.wrapT = THREE.RepeatWrapping;
    tex.repeat.set(3, 1);
    return tex;
  }, []);

  // =========================================================================
  // 4. MATERIALS
  // =========================================================================
  const materials = useMemo(() => {
    const activeCover = loadedCoverTexture || fallbackCoverTexture;
    const activeClothColor = sampledBackColor || spineColor;

    // Front cover artwork with subtle physical matte paper/cloth micro-grain
    const frontCoverMat = new THREE.MeshStandardMaterial({
      map: activeCover,
      bumpMap: clothBumpTexture,
      bumpScale: 0.00025,
      roughness: 0.42,
      metalness: 0.02,
    });

    // Harmonized tactile bookcloth for spine & back cover
    const bookClothMat = new THREE.MeshStandardMaterial({
      color: activeClothColor,
      bumpMap: clothBumpTexture,
      bumpScale: 0.00045,
      roughness: 0.58,
      metalness: 0.03,
    });

    // Inner cream endpaper pastedowns inside board overhang
    const endpaperMat = new THREE.MeshStandardMaterial({
      color: '#efe7d6',
      roughness: 0.82,
      metalness: 0.0,
    });

    // Striated natural paper text block
    const paperMat = new THREE.MeshStandardMaterial({
      map: paperEdgeTexture,
      color: '#fcf7eb',
      roughness: 0.88,
      metalness: 0.01,
    });

    // Woven striped headband cloth
    const headbandMat = new THREE.MeshStandardMaterial({
      map: headbandTexture,
      roughness: 0.55,
      metalness: 0.08,
    });

    return {
      frontCoverMat,
      bookClothMat,
      endpaperMat,
      paperMat,
      headbandMat,
    };
  }, [
    loadedCoverTexture,
    fallbackCoverTexture,
    sampledBackColor,
    spineColor,
    paperEdgeTexture,
    clothBumpTexture,
    headbandTexture,
  ]);

  // =========================================================================
  // 5. WATERTIGHT 3D CONCAVE PAPER TEXT BLOCK (CORRECT OUTWARD WINDING!)
  // =========================================================================
  const concavePaperGeo = useMemo(() => {
    const xSegs = 16;
    const ySegs = 20;
    const zSegs = 24;

    const halfPH = pageH / 2;
    const halfPT = pageT / 2;
    const concavity = 0.0065; // 6.5mm natural fore-edge crescent curve

    const verts: number[] = [];
    const normals: number[] = [];
    const uvs: number[] = [];
    const indices: number[] = [];

    // Helper: (v1 - v0) x (v2 - v0) defines front-face outward normal
    function addQuad(v0: number, v1: number, v2: number, v3: number) {
      indices.push(v0, v1, v2, v1, v3, v2);
    }

    // A. Fore-edge (+X curved face) -> (v1-v0)=+Y, (v2-v0)=+Z => (+Y)x(+Z) = +X (OUTWARD)
    const foreStart = verts.length / 3;
    for (let iy = 0; iy <= ySegs; iy++) {
      const yNorm = iy / ySegs;
      const y = -halfPH + yNorm * pageH;
      for (let iz = 0; iz <= zSegs; iz++) {
        const zNorm = iz / zSegs;
        const z = -halfPT + zNorm * pageT;
        const normZ = z / halfPT;
        const curveX = forePaperX - concavity * (1.0 - normZ * normZ);

        verts.push(curveX, y, z);
        const dXdz = (2 * concavity * normZ) / halfPT;
        const n = new THREE.Vector3(1, 0, -dXdz).normalize();
        normals.push(n.x, n.y, n.z);
        // v = zNorm * 2 repeats fine vertical leaf striations across thickness Z!
        uvs.push(yNorm, zNorm * 1.8);
      }
    }
    for (let iy = 0; iy < ySegs; iy++) {
      for (let iz = 0; iz < zSegs; iz++) {
        const row1 = foreStart + iy * (zSegs + 1);
        const row2 = foreStart + (iy + 1) * (zSegs + 1);
        addQuad(row1 + iz, row2 + iz, row1 + iz + 1, row2 + iz + 1);
      }
    }

    // B. Top head (+Y face) -> (v1-v0)=+Z, (v2-v0)=+X => (+Z)x(+X) = +Y (OUTWARD)
    const topStart = verts.length / 3;
    for (let ix = 0; ix <= xSegs; ix++) {
      const xNorm = ix / xSegs;
      for (let iz = 0; iz <= zSegs; iz++) {
        const zNorm = iz / zSegs;
        const z = -halfPT + zNorm * pageT;
        const normZ = z / halfPT;
        const endX = forePaperX - concavity * (1.0 - normZ * normZ);
        const x = spinePaperX + xNorm * (endX - spinePaperX);

        verts.push(x, halfPH, z);
        normals.push(0, 1, 0);
        uvs.push(xNorm, zNorm * 1.8);
      }
    }
    for (let ix = 0; ix < xSegs; ix++) {
      for (let iz = 0; iz < zSegs; iz++) {
        const row1 = topStart + ix * (zSegs + 1);
        const row2 = topStart + (ix + 1) * (zSegs + 1);
        addQuad(row1 + iz, row1 + iz + 1, row2 + iz, row2 + iz + 1);
      }
    }

    // C. Bottom tail (-Y face) -> (v1-v0)=+X, (v2-v0)=+Z => (+X)x(+Z) = -Y (OUTWARD)
    const botStart = verts.length / 3;
    for (let ix = 0; ix <= xSegs; ix++) {
      const xNorm = ix / xSegs;
      for (let iz = 0; iz <= zSegs; iz++) {
        const zNorm = iz / zSegs;
        const z = -halfPT + zNorm * pageT;
        const normZ = z / halfPT;
        const endX = forePaperX - concavity * (1.0 - normZ * normZ);
        const x = spinePaperX + xNorm * (endX - spinePaperX);

        verts.push(x, -halfPH, z);
        normals.push(0, -1, 0);
        uvs.push(xNorm, zNorm * 1.8);
      }
    }
    for (let ix = 0; ix < xSegs; ix++) {
      for (let iz = 0; iz < zSegs; iz++) {
        const row1 = botStart + ix * (zSegs + 1);
        const row2 = botStart + (ix + 1) * (zSegs + 1);
        addQuad(row1 + iz, row2 + iz, row1 + iz + 1, row2 + iz + 1);
      }
    }

    // D. Spine inner face (-X) -> (v1-v0)=+Z, (v2-v0)=+Y => (+Z)x(+Y) = -X (OUTWARD)
    const spineStart = verts.length / 3;
    for (let iy = 0; iy <= ySegs; iy++) {
      const yNorm = iy / ySegs;
      const y = -halfPH + yNorm * pageH;
      for (let iz = 0; iz <= zSegs; iz++) {
        const zNorm = iz / zSegs;
        const z = -halfPT + zNorm * pageT;
        verts.push(spinePaperX, y, z);
        normals.push(-1, 0, 0);
        uvs.push(yNorm, zNorm);
      }
    }
    for (let iy = 0; iy < ySegs; iy++) {
      for (let iz = 0; iz < zSegs; iz++) {
        const row1 = spineStart + iy * (zSegs + 1);
        const row2 = spineStart + (iy + 1) * (zSegs + 1);
        addQuad(row1 + iz, row1 + iz + 1, row2 + iz, row2 + iz + 1);
      }
    }

    // Internal +Z / -Z faces omitted because boards sit flush at ±halfPT (zero coplanar z-fighting)

    const geo = new THREE.BufferGeometry();
    geo.setAttribute('position', new THREE.Float32BufferAttribute(verts, 3));
    geo.setAttribute('normal', new THREE.Float32BufferAttribute(normals, 3));
    geo.setAttribute('uv', new THREE.Float32BufferAttribute(uvs, 2));
    geo.setIndex(indices);
    return geo;
  }, [pageH, pageT, spinePaperX, forePaperX]);

  // Helper: split an ExtrudeGeometry into 2 non-overlapping material groups:
  // Group 0 = outer face + bevels + rim edges; Group 1 = flat inner pastedown face
  function splitBoardMaterialGroups(geo: THREE.BufferGeometry, innerNormalSignZ: 1 | -1) {
    const pos = geo.attributes.position;
    const norm = geo.attributes.normal;
    const uv = geo.attributes.uv;
    const triCount = pos.count / 3;

    const outerVerts: number[] = [];
    const outerNorms: number[] = [];
    const outerUvs: number[] = [];
    const innerVerts: number[] = [];
    const innerNorms: number[] = [];
    const innerUvs: number[] = [];

    for (let t = 0; t < triCount; t++) {
      const i0 = t * 3;
      const nz = (norm.getZ(i0) + norm.getZ(i0 + 1) + norm.getZ(i0 + 2)) / 3;
      const isInner = innerNormalSignZ < 0 ? nz < -0.9 : nz > 0.9;
      const targetPos = isInner ? innerVerts : outerVerts;
      const targetNorm = isInner ? innerNorms : outerNorms;
      const targetUv = isInner ? innerUvs : outerUvs;

      for (let k = 0; k < 3; k++) {
        const idx = i0 + k;
        targetPos.push(pos.getX(idx), pos.getY(idx), pos.getZ(idx));
        targetNorm.push(norm.getX(idx), norm.getY(idx), norm.getZ(idx));
        targetUv.push(uv.getX(idx), uv.getY(idx));
      }
    }

    const combinedPos = new Float32Array([...outerVerts, ...innerVerts]);
    const combinedNorm = new Float32Array([...outerNorms, ...innerNorms]);
    const combinedUv = new Float32Array([...outerUvs, ...innerUvs]);

    const outGeo = new THREE.BufferGeometry();
    outGeo.setAttribute('position', new THREE.BufferAttribute(combinedPos, 3));
    outGeo.setAttribute('normal', new THREE.BufferAttribute(combinedNorm, 3));
    outGeo.setAttribute('uv', new THREE.BufferAttribute(combinedUv, 2));
    outGeo.clearGroups();
    outGeo.addGroup(0, outerVerts.length / 3, 0);
    outGeo.addGroup(outerVerts.length / 3, innerVerts.length / 3, 1);
    return outGeo;
  }

  // =========================================================================
  // 6. SCULPTED BEVELED FRONT COVER BOARD WITH SMOOTH HINGE INDENT & CLEAN UVs
  // Exact outer dimensions bookW x bookH x boardThick (zero coplanar planes)
  // =========================================================================
  const frontCoverGeo = useMemo(() => {
    const bevelSize = 0.0008;
    const bevelThick = 0.0007;
    const cornerR = 0.0028;
    const xMin = -bookW / 2 + bevelSize;
    const xMax = bookW / 2 - bevelSize;
    const yMin = -bookH / 2 + bevelSize;
    const yMax = bookH / 2 - bevelSize;

    const shape = new THREE.Shape();
    shape.moveTo(xMin, yMin);
    shape.lineTo(xMin, yMax);
    shape.lineTo(xMax - cornerR, yMax);
    shape.quadraticCurveTo(xMax, yMax, xMax, yMax - cornerR);
    shape.lineTo(xMax, yMin + cornerR);
    shape.quadraticCurveTo(xMax, yMin, xMax - cornerR, yMin);
    shape.lineTo(xMin, yMin);

    const rawGeo = new THREE.ExtrudeGeometry(shape, {
      steps: 1,
      depth: boardThick - bevelThick * 2,
      bevelEnabled: true,
      bevelThickness: bevelThick,
      bevelSize,
      bevelSegments: 4,
      curveSegments: 8,
    });
    rawGeo.center();

    const pos = rawGeo.attributes.position;
    const uv = rawGeo.attributes.uv;
    const grooveX = -bookW / 2 + 0.0115;

    for (let i = 0; i < pos.count; i++) {
      const x = pos.getX(i);
      const y = pos.getY(i);
      const z = pos.getZ(i);

      if (z > 0) {
        const dist = (x - grooveX) / 0.0022;
        pos.setZ(i, z - 0.00055 * Math.exp(-dist * dist));
      }

      const u = THREE.MathUtils.clamp((x + bookW / 2) / bookW, 0, 1);
      const v = THREE.MathUtils.clamp((y + bookH / 2) / bookH, 0, 1);
      uv.setXY(i, u, v);
    }
    rawGeo.computeVertexNormals();
    return splitBoardMaterialGroups(rawGeo, -1);
  }, [bookW, bookH, boardThick]);

  // =========================================================================
  // 7. BEVELED BACK COVER BOARD (with single-surface inner endpaper group)
  // =========================================================================
  const backBoardGeo = useMemo(() => {
    const bevelSize = 0.0008;
    const bevelThick = 0.0007;
    const cornerR = 0.0028;
    const xMin = -bookW / 2 + bevelSize;
    const xMax = bookW / 2 - bevelSize;
    const yMin = -bookH / 2 + bevelSize;
    const yMax = bookH / 2 - bevelSize;

    const shape = new THREE.Shape();
    shape.moveTo(xMin, yMin);
    shape.lineTo(xMin, yMax);
    shape.lineTo(xMax - cornerR, yMax);
    shape.quadraticCurveTo(xMax, yMax, xMax, yMax - cornerR);
    shape.lineTo(xMax, yMin + cornerR);
    shape.quadraticCurveTo(xMax, yMin, xMax - cornerR, yMin);
    shape.lineTo(xMin, yMin);

    const rawGeo = new THREE.ExtrudeGeometry(shape, {
      steps: 1,
      depth: boardThick - bevelThick * 2,
      bevelEnabled: true,
      bevelThickness: bevelThick,
      bevelSize,
      bevelSegments: 4,
      curveSegments: 8,
    });
    rawGeo.center();

    const pos = rawGeo.attributes.position;
    const grooveX = -bookW / 2 + 0.0115;
    for (let i = 0; i < pos.count; i++) {
      const x = pos.getX(i);
      const z = pos.getZ(i);
      if (z < 0) {
        const dist = (x - grooveX) / 0.0022;
        pos.setZ(i, z + 0.00055 * Math.exp(-dist * dist));
      }
    }
    rawGeo.computeVertexNormals();
    return splitBoardMaterialGroups(rawGeo, 1);
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
      {/* 1. WATERTIGHT 3D CONCAVE PAPER TEXT BLOCK */}
      <mesh
        geometry={concavePaperGeo}
        material={materials.paperMat}
        castShadow
        receiveShadow
      />

      {/* 2. BEVELED FRONT COVER BOARD (+Z) WITH INNER ENDPAPER MATERIAL GROUP */}
      <mesh
        geometry={frontCoverGeo}
        position={[0, 0, bookT / 2 - boardThick / 2]}
        material={[materials.frontCoverMat, materials.endpaperMat]}
        castShadow
        receiveShadow
      />

      {/* 3. BEVELED BACK COVER BOARD (-Z) WITH INNER ENDPAPER MATERIAL GROUP */}
      <mesh
        geometry={backBoardGeo}
        position={[0, 0, -bookT / 2 + boardThick / 2]}
        material={[materials.bookClothMat, materials.endpaperMat]}
        castShadow
        receiveShadow
      />

      {/* 4. CONTINUOUS CLOSED CONVEX SPINE ON LEFT (-X) EDGE */}
      {/* Positioned cleanly at x = -bookW / 2 so zero volume overlaps the cover boards */}
      <group position={[-bookW / 2, 0, 0]}>
        <mesh
          scale={[0.42, 1, 1]}
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
              Math.PI,
              Math.PI,
            ]}
          />
        </mesh>

        {/* Woven Striped Headband & Tailband Collars seated cleanly against paper spine */}
        <mesh
          position={[0.0011, pageH / 2 + 0.0014, 0]}
          material={materials.headbandMat}
        >
          <boxGeometry args={[0.0020, 0.0026, pageT - 0.0015]} />
        </mesh>
        <mesh
          position={[0.0011, -pageH / 2 - 0.0014, 0]}
          material={materials.headbandMat}
        >
          <boxGeometry args={[0.0020, 0.0026, pageT - 0.0015]} />
        </mesh>
      </group>

      {/* 5. Interactive Hover Tooltip */}
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
