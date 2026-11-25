const THREE = require('three');
const { GLTFExporter } = require('three/examples/jsm/exporters/GLTFExporter.js');
const fs = require('fs');
const path = require('path');

// Polyfill FileReader for Node.js GLTFExporter
global.FileReader = class FileReader {
  readAsArrayBuffer(blob) {
    blob.arrayBuffer().then((buf) => {
      this.result = buf;
      if (this.onloadend) this.onloadend();
    });
  }
  readAsDataURL(blob) {
    blob.arrayBuffer().then((buf) => {
      this.result =
        'data:application/octet-stream;base64,' +
        Buffer.from(buf).toString('base64');
      if (this.onloadend) this.onloadend();
    });
  }
};

function buildBotanicalLeafGeometry(width, length, droopAmount, seed) {
  const uSegs = 16;
  const vSegs = 22;
  const verts = [];
  const uvs = [];
  const indices = [];

  for (let iv = 0; iv <= vSegs; iv++) {
    const v = iv / vSegs;
    const profile = v === 0 ? 0.004 : Math.pow(Math.sin(Math.pow(v, 0.56) * Math.PI), 0.70);
    for (let iu = 0; iu <= uSegs; iu++) {
      const u = (iu / uSegs) * 2 - 1;
      const absU = Math.abs(u);
      const x = u * (width * 0.5) * profile;
      const lobeDip = -length * 0.14 * Math.exp(-v * 6.5) * Math.sin(absU * Math.PI * 0.88);
      const y = v * length + lobeDip;

      const midribGroove = -width * 0.028 * Math.exp(-Math.pow(u / 0.14, 2)) * (1 - v * 0.7);
      const cup = Math.sin(v * Math.PI) * Math.pow(absU, 1.35) * (width * 0.16);
      const droop = -Math.pow(v, 1.55) * (length * droopAmount);
      const tipCurl = v > 0.75 ? -Math.pow((v - 0.75) / 0.25, 2) * (length * 0.06) : 0;
      const waveFreq = 2.6 + (seed % 3) * 0.5;
      const marginWave = Math.sin(v * Math.PI * waveFreq + seed * 2.1) * Math.pow(absU, 1.45) * (width * 0.045);

      verts.push(x, y, midribGroove + cup + droop + tipCurl + marginWave);
      uvs.push(u * 0.5 + 0.5, v);
    }
  }

  for (let iv = 0; iv < vSegs; iv++) {
    for (let iu = 0; iu < uSegs; iu++) {
      const a = iv * (uSegs + 1) + iu;
      const b = a + 1;
      const c = a + (uSegs + 1);
      const d = c + 1;
      indices.push(a, b, c, b, d, c);
    }
  }

  const geo = new THREE.BufferGeometry();
  geo.setAttribute('position', new THREE.Float32BufferAttribute(verts, 3));
  geo.setAttribute('uv', new THREE.Float32BufferAttribute(uvs, 2));
  geo.setIndex(indices);
  geo.computeVertexNormals();
  return geo;
}

function buildTaperedStemGeometry(points, tubularSegs, radiusStart, radiusEnd, radialSegs = 7) {
  const curve = new THREE.CatmullRomCurve3(points);
  const frames = curve.computeFrenetFrames(tubularSegs, false);
  const verts = [];
  const normals = [];
  const uvs = [];
  const indices = [];

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

  const tipCenter = curve.getPointAt(1);
  const tipTangent = curve.getTangentAt(1);
  const tipApex = tipCenter.clone().add(tipTangent.multiplyScalar(radiusEnd * 1.6));
  const tipIdx = verts.length / 3;
  verts.push(tipApex.x, tipApex.y, tipApex.z);
  normals.push(tipTangent.x, tipTangent.y, tipTangent.z);
  uvs.push(0.5, 1);

  const lastRingStart = tubularSegs * (radialSegs + 1);
  for (let j = 0; j < radialSegs; j++) {
    indices.push(lastRingStart + j, tipIdx, lastRingStart + j + 1);
  }

  const geo = new THREE.BufferGeometry();
  geo.setAttribute('position', new THREE.Float32BufferAttribute(verts, 3));
  geo.setAttribute('normal', new THREE.Float32BufferAttribute(normals, 3));
  geo.setAttribute('uv', new THREE.Float32BufferAttribute(uvs, 2));
  geo.setIndex(indices);
  return geo;
}

async function generatePhotorealisticPlantPot() {
  console.log('Generating Peak-Detail Sculpted Botanical Pothos Plant Pot 3D Model...');

  const scene = new THREE.Scene();
  scene.name = 'Peak_Detail_Botanical_Pothos_Planter';

  const ceramicPotMat = new THREE.MeshStandardMaterial({
    name: 'Glazed_Stoneware_Ceramic',
    color: new THREE.Color('#f7f4eb'),
    roughness: 0.25,
    metalness: 0.02,
  });

  const ceramicInnerMat = new THREE.MeshStandardMaterial({
    name: 'Stoneware_Inner_Wall',
    color: new THREE.Color('#ebe5d8'),
    roughness: 0.42,
  });

  const soilMat = new THREE.MeshStandardMaterial({
    name: 'Organic_Potting_Mix',
    color: new THREE.Color('#3b281c'),
    roughness: 0.94,
  });

  const stemMat = new THREE.MeshStandardMaterial({
    name: 'Botanical_Vine_Stem',
    color: new THREE.Color('#467632'),
    roughness: 0.42,
  });

  const leafMats = {
    deepEmerald: new THREE.MeshStandardMaterial({
      name: 'Pothos_Deep_Emerald',
      color: new THREE.Color('#215c26'),
      roughness: 0.28,
      metalness: 0.02,
      side: THREE.DoubleSide,
    }),
    variegatedGold: new THREE.MeshStandardMaterial({
      name: 'Pothos_Variegated_Gold',
      color: new THREE.Color('#387735'),
      roughness: 0.28,
      metalness: 0.02,
      side: THREE.DoubleSide,
    }),
    matureOlive: new THREE.MeshStandardMaterial({
      name: 'Pothos_Mature_Olive',
      color: new THREE.Color('#264f27'),
      roughness: 0.30,
      metalness: 0.02,
      side: THREE.DoubleSide,
    }),
    youngShoot: new THREE.MeshStandardMaterial({
      name: 'Pothos_Young_Shoot',
      color: new THREE.Color('#5ca13c'),
      roughness: 0.32,
      metalness: 0.01,
      side: THREE.DoubleSide,
    }),
  };

  const plantPotGroup = new THREE.Group();
  plantPotGroup.name = 'Realistic_Plant_Pot_Assembly';

  const potRadius = 0.068;
  const potHeight = 0.125;
  const soilY = potHeight - 0.015;
  const baseR = potRadius * 0.93;
  const wall = 0.0052;

  // 1. 72-Segment Lathe Stoneware Pot
  const outerPts = [
    new THREE.Vector2(0.0, 0.003),
    new THREE.Vector2(baseR - 0.008, 0.003),
    new THREE.Vector2(baseR - 0.006, 0.0),
    new THREE.Vector2(baseR - 0.001, 0.0),
    new THREE.Vector2(baseR, 0.004),
    new THREE.Vector2(potRadius - 0.002, potHeight - 0.005),
    new THREE.Vector2(potRadius, potHeight - 0.002),
    new THREE.Vector2(potRadius - 0.0005, potHeight + 0.0025),
    new THREE.Vector2(potRadius - wall * 0.5, potHeight + 0.0038),
    new THREE.Vector2(potRadius - wall, potHeight + 0.0015),
  ];
  const outerPot = new THREE.Mesh(new THREE.LatheGeometry(outerPts, 72).rotateY(Math.PI), ceramicPotMat);
  outerPot.name = 'Glazed_Stoneware_Pot';
  outerPot.castShadow = true;
  outerPot.receiveShadow = true;
  plantPotGroup.add(outerPot);

  const innerPts = [
    new THREE.Vector2(potRadius - wall, potHeight + 0.0015),
    new THREE.Vector2(potRadius - wall - 0.001, soilY - 0.025),
  ];
  const innerPot = new THREE.Mesh(new THREE.LatheGeometry(innerPts, 64).rotateY(Math.PI), ceramicInnerMat);
  innerPot.name = 'Pot_Inner_Wall';
  plantPotGroup.add(innerPot);

  // 2. 3D Mounded Soil + River Pebbles
  const soilGeo = new THREE.PlaneGeometry((potRadius - wall) * 2.02, (potRadius - wall) * 2.02, 28, 28);
  soilGeo.rotateX(-Math.PI / 2);
  const sPos = soilGeo.attributes.position;
  const maxR = potRadius - wall + 0.0008;
  for (let i = 0; i < sPos.count; i++) {
    let x = sPos.getX(i);
    let z = sPos.getZ(i);
    const r = Math.sqrt(x * x + z * z);
    if (r > maxR) {
      x *= maxR / r;
      z *= maxR / r;
    }
    const normR = Math.min(1, r / maxR);
    const dome = (1 - normR * normR) * 0.007;
    const bump = 0.002 * Math.sin(x * 85) * Math.cos(z * 85);
    sPos.setXYZ(i, x, dome + bump * (1 - normR * 0.6), z);
  }
  soilGeo.computeVertexNormals();
  const soilMesh = new THREE.Mesh(soilGeo, soilMat);
  soilMesh.position.set(0, soilY, 0);
  soilMesh.receiveShadow = true;
  soilMesh.name = 'Mounded_Potting_Soil';
  plantPotGroup.add(soilMesh);

  const pebbles = [
    [-0.032, soilY + 0.001, 0.025, 0.0085, '#787066'],
    [0.028, soilY + 0.001, -0.026, 0.0072, '#948674'],
    [-0.012, soilY + 0.002, -0.035, 0.0090, '#58534d'],
    [0.036, soilY + 0.001, 0.018, 0.0068, '#847b70'],
    [-0.036, soilY + 0.001, -0.016, 0.0075, '#6b645c'],
    [0.014, soilY + 0.002, 0.038, 0.0078, '#9c8e7c'],
  ];
  pebbles.forEach(([x, y, z, s, col], i) => {
    const pGeo = new THREE.IcosahedronGeometry(s, 2);
    pGeo.scale(1, 0.56, 0.82);
    const pMesh = new THREE.Mesh(pGeo, new THREE.MeshStandardMaterial({ color: col, roughness: 0.68 }));
    pMesh.position.set(x, y, z);
    pMesh.name = `River_Pebble_${i + 1}`;
    plantPotGroup.add(pMesh);
  });

  // 3. Crown Foliage & Trailing Vines
  const rootClusters = [
    new THREE.Vector3(-0.013, soilY - 0.003, 0.010),
    new THREE.Vector3(0.015, soilY - 0.003, -0.008),
    new THREE.Vector3(-0.004, soilY - 0.003, -0.015),
  ];

  const foliageGroup = new THREE.Group();
  foliageGroup.name = 'Foliage_Assembly';

  function addLeafWithStem(root, base, dir, w, len, droop, roll, seed, mat, arch) {
    const dirVec = new THREE.Vector3(...dir).normalize();
    const p1 = new THREE.Vector3(
      root.x * 0.65 + base.x * 0.35,
      Math.max(root.y, base.y) + arch * 0.5,
      root.z * 0.65 + base.z * 0.35
    );
    const p2 = base.clone().sub(dirVec.clone().multiplyScalar(0.011));
    const stemMesh = new THREE.Mesh(buildTaperedStemGeometry([root, p1, p2, base], 10, 0.0019, 0.0009, 6), stemMat);
    stemMesh.castShadow = true;
    foliageGroup.add(stemMesh);

    const leafMesh = new THREE.Mesh(buildBotanicalLeafGeometry(w, len, droop, seed), mat);
    leafMesh.position.copy(base);
    const q = new THREE.Quaternion().setFromUnitVectors(new THREE.Vector3(0, 1, 0), dirVec);
    q.premultiply(new THREE.Quaternion().setFromAxisAngle(dirVec, roll));
    leafMesh.quaternion.copy(q);
    leafMesh.castShadow = true;
    foliageGroup.add(leafMesh);
  }

  // Tier 1-4 Crown (40 leaves)
  for (let i = 0; i < 7; i++) {
    const a = (i * Math.PI * 2) / 7 + 0.25;
    const rB = 0.016 + (i % 3) * 0.006;
    const yB = soilY + 0.028 + (i % 3) * 0.005;
    addLeafWithStem(rootClusters[i % 3], new THREE.Vector3(rB * Math.cos(a), yB, rB * Math.sin(a)), [0.54 * Math.cos(a + 0.14), 0.78 - (i % 2) * 0.06, 0.54 * Math.sin(a + 0.14)], 0.052, 0.068, 0.28, ((i % 3) - 1) * 0.22, 10 + i * 3, leafMats.youngShoot, 0.006);
  }
  for (let i = 0; i < 11; i++) {
    const a = (i * Math.PI * 2) / 11 + 0.48;
    const rB = 0.032 + (i % 3) * 0.006;
    const yB = soilY + 0.024 + (i % 3) * 0.005;
    addLeafWithStem(rootClusters[i % 3], new THREE.Vector3(rB * Math.cos(a), yB, rB * Math.sin(a)), [0.66 * Math.cos(a + 0.08), 0.72, 0.66 * Math.sin(a + 0.08)], 0.066, 0.086, 0.24, ((i % 5) - 2) * 0.14, 40 + i * 5, i % 2 === 0 ? leafMats.variegatedGold : leafMats.deepEmerald, 0.007);
  }
  for (let i = 0; i < 12; i++) {
    const a = (i * Math.PI * 2) / 12 + 0.12;
    const rB = 0.052 + (i % 3) * 0.005;
    const yB = soilY + 0.019 + (i % 2) * 0.004;
    addLeafWithStem(rootClusters[i % 3], new THREE.Vector3(rB * Math.cos(a), yB, rB * Math.sin(a)), [0.84 * Math.cos(a + 0.06), 0.44, 0.84 * Math.sin(a + 0.06)], 0.074, 0.094, 0.28, ((i % 4) - 1.5) * 0.16, 80 + i * 7, i % 2 === 0 ? leafMats.deepEmerald : leafMats.matureOlive, 0.008);
  }
  for (let i = 0; i < 10; i++) {
    const a = (i * Math.PI * 2) / 10 + 0.32;
    const rB = 0.071 + (i % 3) * 0.003;
    const yB = soilY + 0.017 + (i % 2) * 0.003;
    addLeafWithStem(rootClusters[i % 3], new THREE.Vector3(rB * Math.cos(a), yB, rB * Math.sin(a)), [0.92 * Math.cos(a), -0.14, 0.92 * Math.sin(a)], 0.076, 0.096, 0.32, ((i % 3) - 1) * 0.20, 130 + i * 11, leafMats.matureOlive, 0.010);
  }

  // 4 Cascading Vines (cleanly above y=0 floor plane)
  const vineConfigs = [
    { phi: 2.15, len: 0.72, count: 5, rootIdx: 0 },
    { phi: -0.65, len: 0.65, count: 4, rootIdx: 1 },
    { phi: 1.18, len: 0.58, count: 4, rootIdx: 0 },
    { phi: 3.65, len: 0.55, count: 4, rootIdx: 2 },
  ];
  vineConfigs.forEach((cfg, cIdx) => {
    const root = rootClusters[cfg.rootIdx];
    const points = [
      root,
      new THREE.Vector3(0.046 * Math.cos(cfg.phi - 0.08), 0.124, 0.046 * Math.sin(cfg.phi - 0.08)),
      new THREE.Vector3(0.074 * Math.cos(cfg.phi), 0.135, 0.074 * Math.sin(cfg.phi)),
      new THREE.Vector3(0.080 * Math.cos(cfg.phi + 0.04), 0.116 - 0.022 * cfg.len, 0.080 * Math.sin(cfg.phi + 0.04)),
      new THREE.Vector3(0.085 * Math.cos(cfg.phi - 0.02), 0.104 - 0.048 * cfg.len, 0.085 * Math.sin(cfg.phi - 0.02)),
      new THREE.Vector3(0.087 * Math.cos(cfg.phi + 0.05), 0.092 - 0.068 * cfg.len, 0.087 * Math.sin(cfg.phi + 0.05)),
      new THREE.Vector3(0.086 * Math.cos(cfg.phi + 0.09), 0.082 - 0.075 * cfg.len, 0.086 * Math.sin(cfg.phi + 0.09)),
    ];
    const curve = new THREE.CatmullRomCurve3(points);
    const runnerMesh = new THREE.Mesh(buildTaperedStemGeometry(points, 30, 0.0021, 0.0008, 7), stemMat);
    runnerMesh.castShadow = true;
    foliageGroup.add(runnerMesh);

    for (let i = 0; i < cfg.count; i++) {
      const t = 0.30 + (i / cfg.count) * 0.60;
      const pNode = curve.getPointAt(t);
      const tangent = curve.getTangentAt(t);
      const normal = new THREE.Vector3(pNode.x, 0, pNode.z).normalize();
      const sideDir = new THREE.Vector3().crossVectors(tangent, normal).normalize();
      const isLeft = i % 2 === 0;

      const leafBase = pNode.clone().add(tangent.clone().multiplyScalar(0.009)).add(normal.clone().multiplyScalar(0.008)).add(sideDir.clone().multiplyScalar(isLeft ? 0.010 : -0.010));
      const leafDir = normal.clone().multiplyScalar(0.50 + t * 0.28).add(new THREE.Vector3(0, -0.80 + t * 0.22, 0)).add(sideDir.clone().multiplyScalar(isLeft ? 0.30 : -0.30)).normalize();
      const pMid = pNode.clone().lerp(leafBase, 0.55).add(normal.clone().multiplyScalar(0.003));

      foliageGroup.add(new THREE.Mesh(buildTaperedStemGeometry([pNode, pMid, leafBase], 6, 0.0013, 0.0008, 5), stemMat));

      const frac = i / cfg.count;
      const lMesh = new THREE.Mesh(
        buildBotanicalLeafGeometry(0.054 - frac * 0.016, 0.068 - frac * 0.022, 0.28, 200 + cIdx * 23 + i * 7),
        i === cfg.count - 1 ? leafMats.youngShoot : leafMats.variegatedGold
      );
      lMesh.position.copy(leafBase);
      const q = new THREE.Quaternion().setFromUnitVectors(new THREE.Vector3(0, 1, 0), leafDir);
      q.premultiply(new THREE.Quaternion().setFromAxisAngle(leafDir, isLeft ? 0.28 : -0.28));
      lMesh.quaternion.copy(q);
      lMesh.castShadow = true;
      foliageGroup.add(lMesh);
    }
  });

  plantPotGroup.add(foliageGroup);
  scene.add(plantPotGroup);

  const outputDir = path.join(__dirname, '..', 'public', 'models');
  const savedDir = path.join(__dirname, '..', 'saved_models', 'plant_pot');
  fs.mkdirSync(outputDir, { recursive: true });
  fs.mkdirSync(savedDir, { recursive: true });

  const exporter = new GLTFExporter();
  const glbBuffer = await exporter.parseAsync(scene, { binary: true });
  fs.writeFileSync(path.join(outputDir, 'plant_pot_realistic.glb'), Buffer.from(glbBuffer));
  fs.writeFileSync(path.join(savedDir, 'plant_pot_realistic.glb'), Buffer.from(glbBuffer));

  const gltfJson = await exporter.parseAsync(scene, { binary: false });
  fs.writeFileSync(path.join(outputDir, 'plant_pot_realistic.gltf'), JSON.stringify(gltfJson, null, 2));
  fs.writeFileSync(path.join(savedDir, 'plant_pot_realistic.gltf'), JSON.stringify(gltfJson, null, 2));

  console.log('✅ Peak-Detail Plant Pot GLB & GLTF exported successfully!');
}

generatePhotorealisticPlantPot().catch(console.error);
