const { THREE, buildTaperedTube, buildSoilMoundGeometry, orientLeafSkyward, orientBloomOutward, exportSceneModels } = require('./botanical_geo_node');

function buildLanceLeafGeometry(width, length, droop, seed) {
  const uSegs = 14;
  const vSegs = 20;
  const verts = [];
  const uvs = [];
  const indices = [];

  for (let iv = 0; iv <= vSegs; iv++) {
    const v = iv / vSegs;
    const profile = v === 0 ? 0.02 : Math.pow(Math.sin(Math.pow(v, 0.80) * Math.PI), 0.72);
    for (let iu = 0; iu <= uSegs; iu++) {
      const u = (iu / uSegs) * 2 - 1;
      const absU = Math.abs(u);
      const x = u * (width * 0.5) * profile;
      const y = v * length;
      const midribChannel = -width * 0.04 * Math.exp(-Math.pow(u / 0.16, 2)) * (1 - v * 0.6);
      const cup = Math.sin(v * Math.PI) * Math.pow(absU, 1.35) * (width * 0.19);
      const droopZ = -Math.pow(v, 1.65) * (length * droop);
      const wave = Math.sin(v * Math.PI * 3.2 + seed * 1.9) * Math.pow(absU, 1.5) * (width * 0.055);
      verts.push(x, y, midribChannel + cup + droopZ + wave);
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

function buildFlowerPetalGeometry(width, length, cupDepth) {
  const uSegs = 16;
  const vSegs = 22;
  const verts = [];
  const uvs = [];
  const indices = [];

  for (let iv = 0; iv <= vSegs; iv++) {
    const v = iv / vSegs;
    const profile = v === 0 ? 0.06 : Math.pow(Math.sin(Math.pow(v, 0.78) * Math.PI), 0.68);
    for (let iu = 0; iu <= uSegs; iu++) {
      const u = (iu / uSegs) * 2 - 1;
      const absU = Math.abs(u);
      const x = u * (width * 0.5) * profile;
      const y = v * length;
      const cup = Math.sin(v * Math.PI) * Math.pow(absU, 1.35) * (width * cupDepth);
      const arch = -Math.pow(v, 1.55) * (length * 0.16);
      verts.push(x, y, cup + arch);
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

async function generateSmallFlowerPot() {
  const scene = new THREE.Scene();
  scene.name = 'Small_Flowering_Stoneware_Planter';

  const potRadius = 0.064;
  const potHeight = 0.116;
  const soilY = potHeight - 0.014;
  const wall = 0.005;
  const baseR = potRadius * 0.90;

  const potMat = new THREE.MeshStandardMaterial({ color: '#e5d8c7', roughness: 0.48 });
  const potInMat = new THREE.MeshStandardMaterial({ color: '#d6c6b2', roughness: 0.65 });
  const soilMat = new THREE.MeshStandardMaterial({ color: '#3b271a', roughness: 0.94 });
  const stemMat = new THREE.MeshStandardMaterial({ color: '#3c6b2d', roughness: 0.44 });
  const petalMat = new THREE.MeshStandardMaterial({ color: '#fbf8f0', roughness: 0.42, side: THREE.DoubleSide });
  const stamenMat = new THREE.MeshStandardMaterial({ color: '#e3b84c', roughness: 0.72 });
  const leafMats = {
    deep: new THREE.MeshStandardMaterial({ color: '#1a4c21', roughness: 0.30, side: THREE.DoubleSide }),
    mid: new THREE.MeshStandardMaterial({ color: '#24622a', roughness: 0.30, side: THREE.DoubleSide }),
    young: new THREE.MeshStandardMaterial({ color: '#539738', roughness: 0.32, side: THREE.DoubleSide }),
  };

  const root = new THREE.Group();
  const outerPts = [
    new THREE.Vector2(0.0, 0.003),
    new THREE.Vector2(baseR - 0.007, 0.003),
    new THREE.Vector2(baseR, 0.002),
    new THREE.Vector2(baseR + 0.001, 0.008),
    new THREE.Vector2(potRadius, potHeight - 0.006),
    new THREE.Vector2(potRadius + 0.001, potHeight),
    new THREE.Vector2(potRadius - wall * 0.5, potHeight + 0.003),
    new THREE.Vector2(potRadius - wall, potHeight + 0.001),
  ];
  root.add(new THREE.Mesh(new THREE.LatheGeometry(outerPts, 72).rotateY(Math.PI), potMat));
  root.add(
    new THREE.Mesh(
      new THREE.LatheGeometry([new THREE.Vector2(potRadius - wall, potHeight + 0.001), new THREE.Vector2(potRadius - wall - 0.001, soilY - 0.02)], 64).rotateY(Math.PI),
      potInMat
    )
  );
  const soil = new THREE.Mesh(buildSoilMoundGeometry(potRadius - wall + 0.0005, 0.007), soilMat);
  soil.position.y = soilY;
  root.add(soil);

  const rClust = [
    new THREE.Vector3(-0.011, soilY - 0.003, 0.008),
    new THREE.Vector3(0.012, soilY - 0.003, -0.006),
    new THREE.Vector3(-0.003, soilY - 0.003, -0.012),
  ];

  const addLeaf = (rt, base, dir, w, len, droop, roll, seed, mat) => {
    const dirVec = new THREE.Vector3(...dir).normalize();
    const p1 = new THREE.Vector3(rt.x * 0.65 + base.x * 0.35, Math.max(rt.y, base.y) + 0.004, rt.z * 0.65 + base.z * 0.35);
    const p2 = base.clone().sub(dirVec.clone().multiplyScalar(0.01));
    root.add(new THREE.Mesh(buildTaperedTube([rt, p1, p2, base], 10, 0.0018, 0.0009, 6), stemMat));

    const lMesh = new THREE.Mesh(buildLanceLeafGeometry(w, len, droop, seed), mat);
    lMesh.position.copy(base);
    lMesh.quaternion.copy(orientLeafSkyward(dirVec, roll));
    root.add(lMesh);
  };

  for (let i = 0; i < 8; i++) {
    const a = (i * Math.PI * 2) / 8 + 0.2;
    const rB = 0.014 + (i % 2) * 0.006;
    const yB = soilY + 0.026 + (i % 3) * 0.005;
    addLeaf(rClust[i % 3], new THREE.Vector3(rB * Math.cos(a), yB, rB * Math.sin(a)), [0.42 * Math.cos(a), 0.88, 0.42 * Math.sin(a)], 0.036, 0.095 + (i % 3) * 0.01, 0.22, ((i % 3) - 1) * 0.2, 10 + i * 5, i % 2 === 0 ? leafMats.young : leafMats.mid);
  }
  for (let i = 0; i < 10; i++) {
    const a = (i * Math.PI * 2) / 10 + 0.5;
    const rB = 0.028 + (i % 3) * 0.006;
    const yB = soilY + 0.020 + (i % 2) * 0.004;
    addLeaf(rClust[i % 3], new THREE.Vector3(rB * Math.cos(a), yB, rB * Math.sin(a)), [0.72 * Math.cos(a), 0.65, 0.72 * Math.sin(a)], 0.044, 0.115 + (i % 2) * 0.012, 0.30, ((i % 4) - 1.5) * 0.16, 50 + i * 7, i % 2 === 0 ? leafMats.mid : leafMats.deep);
  }
  for (let i = 0; i < 10; i++) {
    const a = (i * Math.PI * 2) / 10 + 0.15;
    const rB = 0.042 + (i % 2) * 0.005;
    const yB = soilY + 0.024;
    addLeaf(rClust[i % 3], new THREE.Vector3(rB * Math.cos(a), yB, rB * Math.sin(a)), [0.84 * Math.cos(a), 0.34 - (i % 2) * 0.06, 0.84 * Math.sin(a)], 0.048, 0.122 + (i % 3) * 0.008, 0.34, ((i % 3) - 1) * 0.16, 110 + i * 9, leafMats.deep);
  }

  const flowers = [
    { pos: [-0.024, soilY + 0.128, 0.022], root: [-0.008, soilY - 0.002, 0.008], dir: [-0.22, 0.94, 0.24], s: 1.05, spathe: true },
    { pos: [0.032, soilY + 0.115, 0.016], root: [0.010, soilY - 0.002, 0.004], dir: [0.30, 0.92, 0.20], s: 0.96, spathe: false },
    { pos: [-0.008, soilY + 0.145, -0.024], root: [-0.003, soilY - 0.002, -0.009], dir: [-0.08, 0.97, -0.22], s: 1.0, spathe: true },
    { pos: [0.022, soilY + 0.095, -0.034], root: [0.008, soilY - 0.002, -0.010], dir: [0.24, 0.88, -0.38], s: 0.88, spathe: false },
    { pos: [-0.044, soilY + 0.092, -0.010], root: [-0.012, soilY - 0.002, -0.004], dir: [-0.42, 0.88, -0.10], s: 0.92, spathe: true },
  ];

  flowers.forEach((f) => {
    const p0 = new THREE.Vector3(...f.root);
    const p2 = new THREE.Vector3(...f.pos);
    const p1 = new THREE.Vector3((p0.x + p2.x) * 0.45, (p0.y + p2.y) * 0.55, (p0.z + p2.z) * 0.45);
    root.add(new THREE.Mesh(buildTaperedTube([p0, p1, p2], 12, 0.002, 0.0012, 6, false), stemMat));

    const bloom = new THREE.Group();
    bloom.position.copy(p2);
    bloom.quaternion.copy(orientBloomOutward(new THREE.Vector3(...f.dir).normalize(), p2));

    const spadix = new THREE.Mesh(new THREE.CapsuleGeometry(0.0036 * f.s, 0.018 * f.s, 6, 10), stamenMat);
    spadix.position.set(0, 0.017 * f.s, 0.002 * f.s);
    bloom.add(spadix);

    const outerG = buildFlowerPetalGeometry(0.036 * f.s, 0.056 * f.s, f.spathe ? 0.42 : 0.25);
    const innerG = buildFlowerPetalGeometry(0.022 * f.s, 0.042 * f.s, 0.28);

    if (f.spathe) {
      const m1 = new THREE.Mesh(outerG, petalMat);
      m1.position.set(0, 0, -0.003 * f.s);
      m1.rotation.set(0.18, 0, 0);
      bloom.add(m1);
      const m2 = new THREE.Mesh(innerG, petalMat);
      m2.position.set(0, 0, 0.002 * f.s);
      m2.rotation.set(0.55, 2.4, 0.15);
      bloom.add(m2);
    } else {
      for (let p = 0; p < 5; p++) {
        const pm = new THREE.Mesh(innerG, petalMat);
        pm.rotation.set(0.62, (p * Math.PI * 2) / 5, 0);
        bloom.add(pm);
      }
    }
    root.add(bloom);
  });

  scene.add(root);
  await exportSceneModels(scene, 'flower_pot_small_realistic', 'flower_pot_small');
}

generateSmallFlowerPot().catch(console.error);
