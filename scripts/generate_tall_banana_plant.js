const { THREE, buildTaperedTube, buildSoilMoundGeometry, orientLeafSkyward, exportSceneModels } = require('./botanical_geo_node');

function buildBananaLeafGeometry(width, length, droop, seed, splits = []) {
  const uSegs = 18;
  const vSegs = 28;
  const verts = [];
  const uvs = [];
  const indices = [];

  for (let iv = 0; iv <= vSegs; iv++) {
    const v = iv / vSegs;
    const profile = v < 0.04 ? 0.08 + v * 6 : Math.pow(Math.sin(Math.pow(v, 0.76) * Math.PI), 0.52);
    for (let iu = 0; iu <= uSegs; iu++) {
      const u = (iu / uSegs) * 2 - 1;
      const absU = Math.abs(u);
      const x = u * (width * 0.5) * profile;

      let splitGapY = 0;
      let splitDroop = 0;
      for (const sp of splits) {
        if (Math.sign(u) === sp.side && absU > 0.22) {
          const distV = v - sp.vPos;
          if (Math.abs(distV) < 0.055) splitGapY += (distV >= 0 ? 0.012 : -0.012) * Math.min(1, (absU - 0.22) * 2.5);
          if (distV > 0 && distV < 0.14) splitDroop -= 0.018 * Math.sin((distV / 0.14) * Math.PI) * Math.pow(absU, 1.3);
        }
      }

      const y = v * length + splitGapY;
      const midribKeel = -width * 0.055 * Math.exp(-Math.pow(u / 0.13, 2)) * (1 - v * 0.45);
      const wingArch = Math.sin(v * Math.PI) * Math.pow(absU, 1.2) * (width * 0.14);
      const droopZ = -Math.pow(v, 1.65) * (length * droop);
      const ruffle = Math.sin(v * Math.PI * 5.2 + seed * 2.3) * Math.pow(absU, 1.55) * (width * 0.055);
      verts.push(x, y, midribKeel + wingArch + droopZ + ruffle + splitDroop);
      uvs.push(u * 0.5 + 0.5, v);
    }
  }

  for (let iv = 0; iv < vSegs; iv++) {
    const vMid = (iv + 0.5) / vSegs;
    for (let iu = 0; iu < uSegs; iu++) {
      const uMid = ((iu + 0.5) / uSegs) * 2 - 1;
      if (splits.some((sp) => Math.sign(uMid) === sp.side && Math.abs(uMid) > 0.25 && Math.abs(vMid - sp.vPos) < 0.022)) continue;
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

async function generateTallBananaPlant() {
  const scene = new THREE.Scene();
  scene.name = 'Tall_Banana_Leaf_Corridor_Planter';

  const potRadius = 0.175;
  const potHeight = 0.44;
  const soilY = potHeight - 0.045;
  const wall = 0.014;
  const baseR = potRadius * 0.78;

  const potMat = new THREE.MeshStandardMaterial({ color: '#f3f0e8', roughness: 0.45, metalness: 0.01 });
  const potInMat = new THREE.MeshStandardMaterial({ color: '#e0dbd0', roughness: 0.68 });
  const soilMat = new THREE.MeshStandardMaterial({ color: '#3b271a', roughness: 0.94 });
  const stemMat = new THREE.MeshStandardMaterial({ color: '#4d7332', roughness: 0.48 });
  const leafMats = {
    mature: new THREE.MeshStandardMaterial({ color: '#1f5b24', roughness: 0.32, side: THREE.DoubleSide }),
    fresh: new THREE.MeshStandardMaterial({ color: '#2e722d', roughness: 0.32, side: THREE.DoubleSide }),
    young: new THREE.MeshStandardMaterial({ color: '#5fa03c', roughness: 0.34, side: THREE.DoubleSide }),
  };

  const root = new THREE.Group();
  const outerPts = [
    new THREE.Vector2(0, 0.008),
    new THREE.Vector2(baseR - 0.01, 0.008),
    new THREE.Vector2(baseR, 0),
    new THREE.Vector2(baseR + 0.004, 0.025),
    new THREE.Vector2(potRadius - 0.006, potHeight * 0.55),
    new THREE.Vector2(potRadius, potHeight - 0.022),
    new THREE.Vector2(potRadius + 0.003, potHeight - 0.010),
    new THREE.Vector2(potRadius - wall * 0.4, potHeight + 0.006),
    new THREE.Vector2(potRadius - wall, potHeight),
  ];
  root.add(new THREE.Mesh(new THREE.LatheGeometry(outerPts, 64).rotateY(Math.PI), potMat));
  root.add(
    new THREE.Mesh(
      new THREE.LatheGeometry([new THREE.Vector2(potRadius - wall, potHeight), new THREE.Vector2(potRadius - wall - 0.004, soilY - 0.05)], 48).rotateY(Math.PI),
      potInMat
    )
  );
  const soil = new THREE.Mesh(buildSoilMoundGeometry(potRadius - wall + 0.002, 0.022), soilMat);
  soil.position.y = soilY;
  root.add(soil);

  const stalks = [
    { root: new THREE.Vector3(-0.022, soilY - 0.01, 0.015), top: new THREE.Vector3(-0.035, 0.92, 0.025), rB: 0.032, rT: 0.017 },
    { root: new THREE.Vector3(0.032, soilY - 0.01, -0.012), top: new THREE.Vector3(0.048, 0.78, -0.018), rB: 0.026, rT: 0.014 },
    { root: new THREE.Vector3(-0.010, soilY - 0.01, -0.030), top: new THREE.Vector3(-0.015, 0.64, -0.042), rB: 0.022, rT: 0.012 },
  ];
  stalks.forEach((s) => {
    const mid = s.root.clone().lerp(s.top, 0.5).add(new THREE.Vector3(0.008, 0, 0.008));
    root.add(new THREE.Mesh(buildTaperedTube([s.root, mid, s.top], 14, s.rB, s.rT, 10, false), stemMat));
  });

  const leafSpecs = [
    { stalk: 0, hFrac: 0.98, angle: 0.5, reach: 0.16, hLift: 0.28, w: 0.22, len: 0.56, droop: 0.24, dirY: 0.76, tone: 'young', splits: [] },
    { stalk: 0, hFrac: 0.94, angle: 2.7, reach: 0.22, hLift: 0.22, w: 0.26, len: 0.62, droop: 0.30, dirY: 0.62, tone: 'fresh', splits: [{ vPos: 0.62, side: 1 }] },
    { stalk: 0, hFrac: 0.88, angle: 4.9, reach: 0.25, hLift: 0.16, w: 0.28, len: 0.66, droop: 0.34, dirY: 0.50, tone: 'fresh', splits: [{ vPos: 0.48, side: -1 }] },
    { stalk: 0, hFrac: 0.78, angle: 1.5, reach: 0.26, hLift: 0.10, w: 0.29, len: 0.68, droop: 0.38, dirY: 0.36, tone: 'mature', splits: [{ vPos: 0.38, side: 1 }, { vPos: 0.70, side: -1 }] },
    { stalk: 0, hFrac: 0.68, angle: 3.8, reach: 0.24, hLift: 0.05, w: 0.27, len: 0.62, droop: 0.42, dirY: 0.24, tone: 'mature', splits: [{ vPos: 0.55, side: 1 }] },
    { stalk: 1, hFrac: 0.96, angle: -0.4, reach: 0.18, hLift: 0.22, w: 0.23, len: 0.54, droop: 0.28, dirY: 0.68, tone: 'young', splits: [] },
    { stalk: 1, hFrac: 0.88, angle: 0.9, reach: 0.22, hLift: 0.14, w: 0.26, len: 0.60, droop: 0.34, dirY: 0.48, tone: 'fresh', splits: [{ vPos: 0.52, side: -1 }] },
    { stalk: 1, hFrac: 0.76, angle: -1.6, reach: 0.24, hLift: 0.08, w: 0.27, len: 0.62, droop: 0.38, dirY: 0.32, tone: 'mature', splits: [{ vPos: 0.42, side: 1 }] },
    { stalk: 1, hFrac: 0.68, angle: 5.5, reach: 0.22, hLift: 0.11, w: 0.24, len: 0.55, droop: 0.32, dirY: 0.38, tone: 'mature', splits: [{ vPos: 0.62, side: -1 }] },
    { stalk: 2, hFrac: 0.96, angle: 3.3, reach: 0.16, hLift: 0.18, w: 0.21, len: 0.48, droop: 0.28, dirY: 0.62, tone: 'fresh', splits: [] },
    { stalk: 2, hFrac: 0.86, angle: 4.3, reach: 0.20, hLift: 0.10, w: 0.24, len: 0.52, droop: 0.34, dirY: 0.42, tone: 'mature', splits: [{ vPos: 0.46, side: 1 }] },
    { stalk: 2, hFrac: 0.74, angle: 2.3, reach: 0.20, hLift: 0.06, w: 0.23, len: 0.50, droop: 0.38, dirY: 0.28, tone: 'mature', splits: [{ vPos: 0.58, side: -1 }] },
  ];

  leafSpecs.forEach((sp, idx) => {
    const s = stalks[sp.stalk];
    const stemOrigin = s.root.clone().lerp(s.top, sp.hFrac);
    const leafBase = new THREE.Vector3(stemOrigin.x + Math.cos(sp.angle) * sp.reach, stemOrigin.y + sp.hLift, stemOrigin.z + Math.sin(sp.angle) * sp.reach);
    const dirVec = new THREE.Vector3(Math.cos(sp.angle), sp.dirY, Math.sin(sp.angle)).normalize();
    const petioleMid = stemOrigin.clone().lerp(leafBase, 0.5).add(new THREE.Vector3(0, 0.04, 0));
    const petiolePre = leafBase.clone().sub(dirVec.clone().multiplyScalar(0.05));
    root.add(new THREE.Mesh(buildTaperedTube([stemOrigin, petioleMid, petiolePre, leafBase], 12, 0.011, 0.0055, 7), stemMat));

    const lMesh = new THREE.Mesh(buildBananaLeafGeometry(sp.w, sp.len, sp.droop, 17 + idx * 11, sp.splits), leafMats[sp.tone]);
    lMesh.position.copy(leafBase);
    lMesh.quaternion.copy(orientLeafSkyward(dirVec, ((idx % 3) - 1) * 0.16));
    root.add(lMesh);
  });

  scene.add(root);
  await exportSceneModels(scene, 'tall_banana_plant_realistic', 'tall_banana_plant');
}

generateTallBananaPlant().catch(console.error);
