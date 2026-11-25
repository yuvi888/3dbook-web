'use client';

import * as THREE from 'three';

export function seededRand(seed: number): number {
  const x = Math.sin(seed * 127.1 + 311.7) * 43758.5453123;
  return x - Math.floor(x);
}

export function heightfieldToNormalTexture(
  height: Float32Array,
  size: number,
  strength: number,
  wrap = false
): THREE.CanvasTexture {
  const canvas = document.createElement('canvas');
  canvas.width = size;
  canvas.height = size;
  const ctx = canvas.getContext('2d')!;
  const img = ctx.createImageData(size, size);
  const data = img.data;

  for (let y = 0; y < size; y++) {
    const ym = wrap ? (y - 1 + size) % size : Math.max(0, y - 1);
    const yp = wrap ? (y + 1) % size : Math.min(size - 1, y + 1);
    for (let x = 0; x < size; x++) {
      const xm = wrap ? (x - 1 + size) % size : Math.max(0, x - 1);
      const xp = wrap ? (x + 1) % size : Math.min(size - 1, x + 1);

      const dX = (height[y * size + xp] - height[y * size + xm]) * strength;
      const dY = (height[yp * size + x] - height[ym * size + x]) * strength;

      const nx = -dX;
      const ny = dY;
      const nz = 1.0;
      const len = Math.sqrt(nx * nx + ny * ny + nz * nz);

      const idx = (y * size + x) * 4;
      data[idx] = Math.round(((nx / len) * 0.5 + 0.5) * 255);
      data[idx + 1] = Math.round(((ny / len) * 0.5 + 0.5) * 255);
      data[idx + 2] = Math.round(((nz / len) * 0.5 + 0.5) * 255);
      data[idx + 3] = 255;
    }
  }

  ctx.putImageData(img, 0, 0);
  const tex = new THREE.CanvasTexture(canvas);
  if (wrap) {
    tex.wrapS = THREE.RepeatWrapping;
    tex.wrapT = THREE.RepeatWrapping;
  }
  tex.needsUpdate = true;
  return tex;
}

/**
 * Generates organic bark mulch, dark peat & perlite soil PBR maps.
 */
export function createRichSoilPBR(repeat = 1.6) {
  const size = 256;
  const aCanvas = document.createElement('canvas');
  aCanvas.width = size;
  aCanvas.height = size;
  const aCtx = aCanvas.getContext('2d')!;

  const hCanvas = document.createElement('canvas');
  hCanvas.width = size;
  hCanvas.height = size;
  const hCtx = hCanvas.getContext('2d')!;

  aCtx.fillStyle = '#3b271a';
  aCtx.fillRect(0, 0, size, size);
  hCtx.fillStyle = '#757575';
  hCtx.fillRect(0, 0, size, size);

  for (let i = 0; i < 1100; i++) {
    const x = seededRand(i * 3.1 + 11) * size;
    const y = seededRand(i * 5.3 + 23) * size;
    const rad = 1.0 + seededRand(i * 7.7) * 3.8;
    const tone = seededRand(i * 11.1);
    aCtx.fillStyle = tone > 0.72 ? '#543926' : tone > 0.35 ? '#2d1d13' : '#462f20';
    hCtx.fillStyle = tone > 0.72 ? '#b8b8b8' : '#585858';
    aCtx.beginPath();
    aCtx.arc(x, y, rad, 0, Math.PI * 2);
    aCtx.fill();
    hCtx.beginPath();
    hCtx.arc(x, y, rad, 0, Math.PI * 2);
    hCtx.fill();
  }

  for (let i = 0; i < 80; i++) {
    const x = seededRand(i * 13.3 + 7) * size;
    const y = seededRand(i * 17.9 + 3) * size;
    const w = 4 + seededRand(i * 19.1) * 9;
    const h = 2 + seededRand(i * 23.7) * 3.5;
    const rot = seededRand(i * 29.3) * Math.PI;
    aCtx.save();
    aCtx.translate(x, y);
    aCtx.rotate(rot);
    aCtx.fillStyle = i % 2 === 0 ? '#684830' : '#4a301e';
    aCtx.fillRect(-w / 2, -h / 2, w, h);
    aCtx.restore();

    hCtx.save();
    hCtx.translate(x, y);
    hCtx.rotate(rot);
    hCtx.fillStyle = '#dcdcdc';
    hCtx.fillRect(-w / 2, -h / 2, w, h);
    hCtx.restore();
  }

  for (let i = 0; i < 32; i++) {
    const x = seededRand(i * 31.7 + 41) * size;
    const y = seededRand(i * 37.1 + 59) * size;
    const rad = 1.1 + seededRand(i * 43.3) * 1.8;
    aCtx.fillStyle = '#d8d0c3';
    aCtx.beginPath();
    aCtx.arc(x, y, rad, 0, Math.PI * 2);
    aCtx.fill();
  }

  const hData = hCtx.getImageData(0, 0, size, size).data;
  const hFloat = new Float32Array(size * size);
  for (let i = 0; i < size * size; i++) hFloat[i] = hData[i * 4] / 255;

  const map = new THREE.CanvasTexture(aCanvas);
  map.colorSpace = THREE.SRGBColorSpace;
  map.wrapS = THREE.RepeatWrapping;
  map.wrapT = THREE.RepeatWrapping;
  map.repeat.set(repeat, repeat);

  const normalMap = heightfieldToNormalTexture(hFloat, size, 2.2, true);
  normalMap.repeat.set(repeat, repeat);

  return { map, normalMap };
}

/**
 * Builds a smooth tapered curved stem/trunk tube along CatmullRomCurve3.
 */
export function buildTaperedTube(
  points: THREE.Vector3[],
  tubularSegs: number,
  radiusStart: number,
  radiusEnd: number,
  radialSegs = 8,
  capTip = true
): THREE.BufferGeometry {
  const curve = new THREE.CatmullRomCurve3(points);
  const frames = curve.computeFrenetFrames(tubularSegs, false);

  const verts: number[] = [];
  const normals: number[] = [];
  const uvs: number[] = [];
  const indices: number[] = [];

  for (let i = 0; i <= tubularSegs; i++) {
    const t = i / tubularSegs;
    const p = curve.getPointAt(t);
    const N = frames.normals[i];
    const B = frames.binormals[i];
    const r = radiusStart + (radiusEnd - radiusStart) * t;

    for (let j = 0; j <= radialSegs; j++) {
      const v = (j / radialSegs) * Math.PI * 2;
      const sin = Math.sin(v);
      const cos = -Math.cos(v);
      const nx = cos * N.x + sin * B.x;
      const ny = cos * N.y + sin * B.y;
      const nz = cos * N.z + sin * B.z;

      verts.push(p.x + r * nx, p.y + r * ny, p.z + r * nz);
      normals.push(nx, ny, nz);
      uvs.push(j / radialSegs, t);
    }
  }

  for (let i = 0; i < tubularSegs; i++) {
    for (let j = 0; j < radialSegs; j++) {
      const a = i * (radialSegs + 1) + j;
      const b = (i + 1) * (radialSegs + 1) + j;
      const c = (i + 1) * (radialSegs + 1) + (j + 1);
      const d = i * (radialSegs + 1) + (j + 1);
      indices.push(a, b, d, b, c, d);
    }
  }

  if (capTip) {
    const tipCenter = curve.getPointAt(1);
    const tipTangent = curve.getTangentAt(1);
    const tipApex = tipCenter.clone().add(tipTangent.multiplyScalar(radiusEnd * 1.4));
    const tipIdx = verts.length / 3;
    verts.push(tipApex.x, tipApex.y, tipApex.z);
    normals.push(tipTangent.x, tipTangent.y, tipTangent.z);
    uvs.push(0.5, 1);

    const lastRingStart = tubularSegs * (radialSegs + 1);
    for (let j = 0; j < radialSegs; j++) {
      indices.push(lastRingStart + j, tipIdx, lastRingStart + j + 1);
    }
  }

  const geo = new THREE.BufferGeometry();
  geo.setAttribute('position', new THREE.Float32BufferAttribute(verts, 3));
  geo.setAttribute('normal', new THREE.Float32BufferAttribute(normals, 3));
  geo.setAttribute('uv', new THREE.Float32BufferAttribute(uvs, 2));
  geo.setIndex(indices);
  return geo;
}

/**
 * Builds a displaced mounded organic soil disc inside a pot of given radius.
 */
export function buildSoilMoundGeometry(radius: number, domeHeight = 0.008): THREE.BufferGeometry {
  const geo = new THREE.PlaneGeometry(radius * 2.02, radius * 2.02, 28, 28);
  geo.rotateX(-Math.PI / 2);
  const pos = geo.attributes.position;
  for (let i = 0; i < pos.count; i++) {
    let x = pos.getX(i);
    let z = pos.getZ(i);
    const r = Math.sqrt(x * x + z * z);
    if (r > radius) {
      x *= radius / r;
      z *= radius / r;
    }
    const normR = Math.min(1, r / radius);
    const dome = (1 - normR * normR) * domeHeight;
    const bump =
      domeHeight * 0.28 * Math.sin(x * (7 / radius)) * Math.cos(z * (7 / radius)) +
      domeHeight * 0.14 * Math.sin((x + z) * (11 / radius));
    pos.setXYZ(i, x, dome + bump * (1 - normR * 0.6), z);
  }
  geo.computeVertexNormals();
  return geo;
}

/**
 * Builds a skyward-oriented botanical quaternion whose local +Y points along `dirVec`
 * and whose local +Z (upper face / cup) always faces skyward toward world +Y so leaves
 * never flip edge-on or upside-down at sideways azimuths.
 */
export function orientLeafSkyward(dirVec: THREE.Vector3, roll = 0): THREE.Quaternion {
  const yAxis = dirVec.clone().normalize();
  const worldUp = new THREE.Vector3(0, 1, 0);
  let xAxis = new THREE.Vector3().crossVectors(yAxis, worldUp);
  if (xAxis.lengthSq() < 1e-4) {
    xAxis = new THREE.Vector3(1, 0, 0);
  } else {
    xAxis.normalize();
  }
  const zAxis = new THREE.Vector3().crossVectors(xAxis, yAxis).normalize();
  const mat = new THREE.Matrix4().makeBasis(xAxis, yAxis, zAxis);
  const q = new THREE.Quaternion().setFromRotationMatrix(mat);
  if (roll !== 0) {
    q.premultiply(new THREE.Quaternion().setFromAxisAngle(yAxis, roll));
  }
  return q;
}

/**
 * Orients a hooded spathe flower so local +Y follows `dirVec` while local +Z faces
 * radially outward away from pot center `(0, 0, 0)`.
 */
export function orientBloomOutward(dirVec: THREE.Vector3, outwardPos: THREE.Vector3): THREE.Quaternion {
  const yAxis = dirVec.clone().normalize();
  const radial = new THREE.Vector3(outwardPos.x, 0.35, outwardPos.z);
  if (radial.lengthSq() < 1e-4) radial.set(0, 0.35, 1);
  let xAxis = new THREE.Vector3().crossVectors(yAxis, radial.normalize());
  if (xAxis.lengthSq() < 1e-4) xAxis = new THREE.Vector3(1, 0, 0);
  else xAxis.normalize();
  const zAxis = new THREE.Vector3().crossVectors(xAxis, yAxis).normalize();
  const mat = new THREE.Matrix4().makeBasis(xAxis, yAxis, zAxis);
  return new THREE.Quaternion().setFromRotationMatrix(mat);
}
