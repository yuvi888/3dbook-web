'use client';

import { useMemo } from 'react';
import * as THREE from 'three';

// Define the curve for the tunnel with an elegant, smooth turn
export const TUNNEL_CURVE_POINTS = [
  new THREE.Vector3(0, 0, 8),
  new THREE.Vector3(0, 0, -12),
  new THREE.Vector3(1.5, 0, -28),
  new THREE.Vector3(7.0, 0, -45),
  new THREE.Vector3(16.5, 0, -64),
  new THREE.Vector3(28.0, 0, -82),
  new THREE.Vector3(38.0, 0, -102),
  new THREE.Vector3(44.0, 0, -118),
];

export const tunnelCurve = new THREE.CatmullRomCurve3(
  TUNNEL_CURVE_POINTS,
  false,
  'catmullrom',
  0.5
);

const TUNNEL_WIDTH = 6.8;
const TUNNEL_HEIGHT = 4.6;
const SAMPLES = 140;

export function CurvedCorridor() {
  // Generate continuous extruded ribbon geometries for Floor, Ceiling, and Outer Walls along the curve
  const { floorGeo, ceilingGeo, leftWallGeo, rightWallGeo, ceilingLightGeo } = useMemo(() => {
    const halfW = TUNNEL_WIDTH / 2;
    const halfH = TUNNEL_HEIGHT / 2;
    const lightStripHalfW = 0.4; // Subtle recessed linear ceiling light

    const floorVerts: number[] = [];
    const floorUVs: number[] = [];
    const floorIndices: number[] = [];

    const ceilingVerts: number[] = [];
    const ceilingUVs: number[] = [];
    const ceilingIndices: number[] = [];

    const leftWallVerts: number[] = [];
    const leftWallUVs: number[] = [];
    const leftWallIndices: number[] = [];

    const rightWallVerts: number[] = [];
    const rightWallUVs: number[] = [];
    const rightWallIndices: number[] = [];

    const lightVerts: number[] = [];
    const lightUVs: number[] = [];
    const lightIndices: number[] = [];

    for (let i = 0; i <= SAMPLES; i++) {
      const t = i / SAMPLES;
      const pt = tunnelCurve.getPointAt(t);
      const tangent = tunnelCurve.getTangentAt(t).normalize();
      const normal = new THREE.Vector3(-tangent.z, 0, tangent.x).normalize();

      // Floor vertices (left & right)
      const flL = pt.clone().add(normal.clone().multiplyScalar(-halfW));
      flL.y = -halfH;
      const flR = pt.clone().add(normal.clone().multiplyScalar(halfW));
      flR.y = -halfH;

      // Ceiling vertices (left & right)
      const ceL = pt.clone().add(normal.clone().multiplyScalar(-halfW));
      ceL.y = halfH;
      const ceR = pt.clone().add(normal.clone().multiplyScalar(halfW));
      ceR.y = halfH;

      // Center recessed ceiling light strip
      const clL = pt.clone().add(normal.clone().multiplyScalar(-lightStripHalfW));
      clL.y = halfH - 0.02;
      const clR = pt.clone().add(normal.clone().multiplyScalar(lightStripHalfW));
      clR.y = halfH - 0.02;

      // Push vertices & UVs
      floorVerts.push(flL.x, flL.y, flL.z, flR.x, flR.y, flR.z);
      floorUVs.push(0, t * 24, 1, t * 24);

      ceilingVerts.push(ceL.x, ceL.y, ceL.z, ceR.x, ceR.y, ceR.z);
      ceilingUVs.push(0, t * 24, 1, t * 24);

      leftWallVerts.push(flL.x, flL.y, flL.z, ceL.x, ceL.y, ceL.z);
      leftWallUVs.push(0, t * 24, 1, t * 24);

      rightWallVerts.push(flR.x, flR.y, flR.z, ceR.x, ceR.y, ceR.z);
      rightWallUVs.push(0, t * 24, 1, t * 24);

      lightVerts.push(clL.x, clL.y, clL.z, clR.x, clR.y, clR.z);
      lightUVs.push(0, t * 10, 1, t * 10);

      // Quad strip indices
      if (i < SAMPLES) {
        const v0 = i * 2;
        const v1 = i * 2 + 1;
        const v2 = (i + 1) * 2;
        const v3 = (i + 1) * 2 + 1;

        floorIndices.push(v0, v1, v2, v1, v3, v2);
        ceilingIndices.push(v0, v2, v1, v1, v2, v3);
        leftWallIndices.push(v0, v1, v2, v1, v3, v2);
        rightWallIndices.push(v0, v2, v1, v1, v2, v3);
        lightIndices.push(v0, v2, v1, v1, v2, v3);
      }
    }

    const fGeo = new THREE.BufferGeometry();
    fGeo.setAttribute('position', new THREE.Float32BufferAttribute(floorVerts, 3));
    fGeo.setAttribute('uv', new THREE.Float32BufferAttribute(floorUVs, 2));
    fGeo.setIndex(floorIndices);
    fGeo.computeVertexNormals();

    const cGeo = new THREE.BufferGeometry();
    cGeo.setAttribute('position', new THREE.Float32BufferAttribute(ceilingVerts, 3));
    cGeo.setAttribute('uv', new THREE.Float32BufferAttribute(ceilingUVs, 2));
    cGeo.setIndex(ceilingIndices);
    cGeo.computeVertexNormals();

    const lwGeo = new THREE.BufferGeometry();
    lwGeo.setAttribute('position', new THREE.Float32BufferAttribute(leftWallVerts, 3));
    lwGeo.setAttribute('uv', new THREE.Float32BufferAttribute(leftWallUVs, 2));
    lwGeo.setIndex(leftWallIndices);
    lwGeo.computeVertexNormals();

    const rwGeo = new THREE.BufferGeometry();
    rwGeo.setAttribute('position', new THREE.Float32BufferAttribute(rightWallVerts, 3));
    rwGeo.setAttribute('uv', new THREE.Float32BufferAttribute(rightWallUVs, 2));
    rwGeo.setIndex(rightWallIndices);
    rwGeo.computeVertexNormals();

    const clGeo = new THREE.BufferGeometry();
    clGeo.setAttribute('position', new THREE.Float32BufferAttribute(lightVerts, 3));
    clGeo.setAttribute('uv', new THREE.Float32BufferAttribute(lightUVs, 2));
    clGeo.setIndex(lightIndices);
    clGeo.computeVertexNormals();

    return {
      floorGeo: fGeo,
      ceilingGeo: cGeo,
      leftWallGeo: lwGeo,
      rightWallGeo: rwGeo,
      ceilingLightGeo: clGeo,
    };
  }, []);

  // Soft subtle tile texture for the clean minimalist gallery floor
  const floorGridTex = useMemo(() => {
    if (typeof window === 'undefined') return undefined;
    const canvas = document.createElement('canvas');
    canvas.width = 512;
    canvas.height = 512;
    const ctx = canvas.getContext('2d');
    if (!ctx) return undefined;

    ctx.fillStyle = '#f8fafc';
    ctx.fillRect(0, 0, 512, 512);

    // Clean fine gallery tile seams
    ctx.strokeStyle = '#e2e8f0';
    ctx.lineWidth = 1;
    ctx.strokeRect(0, 0, 512, 512);

    const tex = new THREE.CanvasTexture(canvas);
    tex.wrapS = THREE.RepeatWrapping;
    tex.wrapT = THREE.RepeatWrapping;
    tex.repeat.set(4, 30);
    return tex;
  }, []);

  // Pristine white minimalist gallery wall & ceiling material
  const wallMaterial = useMemo(
    () =>
      new THREE.MeshStandardMaterial({
        color: '#f8fafc',
        roughness: 0.8,
        metalness: 0.05,
        side: THREE.DoubleSide,
      }),
    []
  );

  const floorMaterial = useMemo(
    () =>
      new THREE.MeshStandardMaterial({
        map: floorGridTex,
        color: '#f1f5f9',
        roughness: 0.35,
        metalness: 0.12,
        side: THREE.DoubleSide,
      }),
    [floorGridTex]
  );

  const ceilingLightMaterial = useMemo(
    () =>
      new THREE.MeshBasicMaterial({
        color: '#ffffff',
      }),
    []
  );

  return (
    <group>
      {/* Clean Minimal Curved Floor */}
      <mesh geometry={floorGeo} material={floorMaterial} receiveShadow />

      {/* Clean Minimal Curved Ceiling */}
      <mesh geometry={ceilingGeo} material={wallMaterial} />

      {/* Recessed Linear Ceiling Glow Strip Running Along the Entire Curve */}
      <mesh geometry={ceilingLightGeo} material={ceilingLightMaterial} />

      {/* Smooth Seamless Left Wall */}
      <mesh geometry={leftWallGeo} material={wallMaterial} receiveShadow />

      {/* Smooth Seamless Right Wall */}
      <mesh geometry={rightWallGeo} material={wallMaterial} receiveShadow />

      {/* Soft Gallery Lights Spaced Generously Along the Turn */}
      {[0.05, 0.18, 0.32, 0.48, 0.62, 0.78, 0.92].map((tVal, idx) => {
        const pt = tunnelCurve.getPointAt(tVal);
        return (
          <pointLight
            key={idx}
            position={[pt.x, 1.9, pt.z]}
            intensity={0.7}
            distance={18}
            color="#fffdf5"
            castShadow={false}
          />
        );
      })}
    </group>
  );
}
