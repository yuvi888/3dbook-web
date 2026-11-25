const { THREE, buildTaperedTube, buildSoilMoundGeometry, orientLeafSkyward, exportSceneModels } = require('./botanical_geo_node');

function buildFiddleLeafGeometry(width, length, droop, seed) {
  const uSegs = 14;
  const vSegs = 22;
  const verts = [];
  const uvs = [];
  const indices = [];

  for (let iv = 0; iv <= vSegs; iv++) {
    const v = iv / vSegs;
    const baseLobe = 0.28 * Math.exp(-Math.pow((v - 0.14) / 0.12, 2));
    const upperCrown = 0.52 * Math.exp(-Math.pow((v - 0.70) / 0.24, 2));
    const waistPinch = -0.10 * Math.exp(-Math.pow((v - 0.32) / 0.10, 2));
    const endTaper = v < 0.04 ? v * 25 : v > 0.92 ? Math.max(0.05, (1 - v) * 12.5) : 1.0;
    const profile = Math.max(0.03, (0.16 + baseLobe + upperCrown + waistPinch) * endTaper);

    for (let iu = 0; iu <= uSegs; iu++) {
      const u = (iu / uSegs) * 2 - 1;
      const absU = Math.abs(u);
      const x = u * width * profile;
      const y = v * length;
      const midribGroove = -width * 0.038 * Math.exp(-Math.pow(u / 0.15, 2)) * (1 - v * 0.5);
      const cup = Math.sin(v * Math.PI) * Math.pow(absU, 1.3) * (width * 0.16);
      const droopZ = -Math.pow(v, 1.55) * (length * droop);
      const crinkle = Math.sin(v * Math.PI * 5.8 + seed * 2.1) * Math.pow(absU, 1.4) * (width * 0.052);
      verts.push(x, y, midribGroove + cup + droopZ + crinkle);
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

function buildFlutedTallPlanter(radius, height) {
  const radialSegs = 96;
  const profile = [
    [0.008, radius * 0.78],
    [0.014, radius * 0.80],
    [height * 0.5, radius * 0.90],
    [height - 0.02, radius],
    [height, radius + 0.002],
  ];
  const spline = new THREE.SplineCurve(profile.map(([y, r]) => new THREE.Vector2(r, y)));
  const ySteps = 22;
  const verts = [];
  const uvs = [];
  const indices = [];

  for (let iy = 0; iy <= ySteps; iy++) {
    const v = iy / ySteps;
    const pt = spline.getPointAt(v);
    const fade = Math.sin(Math.min(1, Math.max(0, (v - 0.06) / 0.84)) * Math.PI);
    const amp = 0.0025 * Math.pow(fade, 0.7);
    for (let ir = 0; ir <= radialSegs; ir++) {
      const u = ir / radialSegs;
      const theta = u * Math.PI * 2 + Math.PI;
      const r = pt.x + amp * Math.cos(u * Math.PI * 2 * 36);
      verts.push(r * Math.sin(theta), pt.y, r * Math.cos(theta));
      uvs.push(u * 2, v);
    }
  }

  for (let iy = 0; iy < ySteps; iy++) {
    for (let ir = 0; ir < radialSegs; ir++) {
      const a = iy * (radialSegs + 1) + ir;
      const b = a + 1;
      const c = a + (radialSegs + 1);
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

async function generateTallFiddleFig() {
  const scene = new THREE.Scene();
  scene.name = 'Tall_Fiddle_Leaf_Fig_Corridor_Planter';

  const potRadius = 0.168;
  const potHeight = 0.43;
  const soilY = potHeight - 0.042;
  const wall = 0.014;

  const potMat = new THREE.MeshStandardMaterial({ color: '#ebe3d4', roughness: 0.48 });
  const potInMat = new THREE.MeshStandardMaterial({ color: '#d5cbb8', roughness: 0.72 });
  const soilMat = new THREE.MeshStandardMaterial({ color: '#3b271a', roughness: 0.94 });
  const barkMat = new THREE.MeshStandardMaterial({ color: '#6f5c4a', roughness: 0.84 });
  const leafMats = {
    mature: new THREE.MeshStandardMaterial({ color: '#1d5220', roughness: 0.30, side: THREE.DoubleSide }),
    young: new THREE.MeshStandardMaterial({ color: '#4c8e33', roughness: 0.32, side: THREE.DoubleSide }),
  };

  const root = new THREE.Group();
  root.add(new THREE.Mesh(buildFlutedTallPlanter(potRadius, potHeight), potMat));
  const rim = new THREE.Mesh(new THREE.TorusGeometry(potRadius - wall * 0.45, wall * 0.55, 12, 64).rotateX(Math.PI / 2), potMat);
  rim.position.y = potHeight;
  root.add(rim);
  root.add(
    new THREE.Mesh(
      new THREE.LatheGeometry([new THREE.Vector2(potRadius - wall, potHeight), new THREE.Vector2(potRadius - wall - 0.004, soilY - 0.05)], 48).rotateY(Math.PI),
      potInMat
    )
  );
  const soil = new THREE.Mesh(buildSoilMoundGeometry(potRadius - wall + 0.002, 0.020), soilMat);
  soil.position.y = soilY;
  root.add(soil);

  const mainTrunkPts = [
    new THREE.Vector3(0.0, soilY - 0.02, 0.0),
    new THREE.Vector3(-0.018, 0.65, 0.015),
    new THREE.Vector3(0.012, 0.92, -0.012),
    new THREE.Vector3(-0.008, 1.16, 0.008),
  ];
  const branch1Pts = [
    new THREE.Vector3(0.005, 0.88, -0.008),
    new THREE.Vector3(0.095, 1.08, 0.065),
    new THREE.Vector3(0.145, 1.32, 0.105),
  ];
  const branch2Pts = [
    new THREE.Vector3(-0.006, 0.98, 0.005),
    new THREE.Vector3(-0.105, 1.18, -0.055),
    new THREE.Vector3(-0.155, 1.40, -0.085),
  ];
  const branch3Pts = [
    new THREE.Vector3(-0.008, 1.15, 0.008),
    new THREE.Vector3(-0.025, 1.34, 0.055),
    new THREE.Vector3(0.012, 1.54, 0.020),
  ];

  root.add(new THREE.Mesh(buildTaperedTube(mainTrunkPts, 20, 0.024, 0.013, 9, true), barkMat));
  root.add(new THREE.Mesh(buildTaperedTube(branch1Pts, 14, 0.013, 0.007, 7, true), barkMat));
  root.add(new THREE.Mesh(buildTaperedTube(branch2Pts, 14, 0.013, 0.007, 7, true), barkMat));
  root.add(new THREE.Mesh(buildTaperedTube(branch3Pts, 12, 0.012, 0.006, 7, true), barkMat));

  const branchCurves = [
    { curve: new THREE.CatmullRomCurve3(branch3Pts), count: 11, scale: 0.95 },
    { curve: new THREE.CatmullRomCurve3(branch1Pts), count: 10, scale: 1.0 },
    { curve: new THREE.CatmullRomCurve3(branch2Pts), count: 9, scale: 1.0 },
  ];

  branchCurves.forEach((bc, bIdx) => {
    for (let i = 0; i < bc.count; i++) {
      const t = 0.25 + (i / (bc.count - 1)) * 0.74;
      const bPt = bc.curve.getPointAt(t);
      const az = bIdx * 2.1 + i * 2.39996;
      const reach = (0.045 + (1 - t) * 0.045) * bc.scale;
      const lift = 0.035 + t * 0.03;
      const leafBase = new THREE.Vector3(bPt.x + Math.cos(az) * reach, bPt.y + lift, bPt.z + Math.sin(az) * reach);
      const dirVec = new THREE.Vector3(Math.cos(az), 0.25 + t * 0.58, Math.sin(az)).normalize();
      const pMid = bPt.clone().lerp(leafBase, 0.55).add(new THREE.Vector3(0, 0.012, 0));
      const pPre = leafBase.clone().sub(dirVec.clone().multiplyScalar(0.018));

      root.add(new THREE.Mesh(buildTaperedTube([bPt, pMid, pPre, leafBase], 7, 0.005, 0.003, 5), barkMat));

      const w = (0.16 - t * 0.04) * bc.scale;
      const len = (0.28 - t * 0.06) * bc.scale;
      const lMesh = new THREE.Mesh(buildFiddleLeafGeometry(w, len, 0.26 - t * 0.08, 30 + bIdx * 19 + i * 7), t > 0.80 ? leafMats.young : leafMats.mature);
      lMesh.position.copy(leafBase);
      lMesh.quaternion.copy(orientLeafSkyward(dirVec, ((i % 3) - 1) * 0.18));
      root.add(lMesh);
    }
  });

  scene.add(root);
  await exportSceneModels(scene, 'tall_fiddle_fig_realistic', 'tall_fiddle_fig');
}

generateTallFiddleFig().catch(console.error);
