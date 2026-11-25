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

function buildFlutedTravertinePedestal() {
  const radialSegs = 96;
  const profile = [
    [0.011, 0.049],
    [0.014, 0.052],
    [0.025, 0.055],
    [0.048, 0.056],
    [0.075, 0.052],
    [0.102, 0.043],
    [0.125, 0.031],
    [0.142, 0.021],
    [0.150, 0.019],
    [0.155, 0.021],
  ];

  const curvePts = profile.map(([y, r]) => new THREE.Vector2(r, y));
  const spline = new THREE.SplineCurve(curvePts);
  const ySteps = 36;

  const verts = [];
  const uvs = [];
  const indices = [];

  for (let iy = 0; iy <= ySteps; iy++) {
    const v = iy / ySteps;
    const pt = spline.getPointAt(v);
    const y = pt.y;
    const baseR = pt.x;
    const fluteFade = Math.sin(Math.min(1, Math.max(0, (v - 0.05) / 0.85)) * Math.PI);
    const amp = 0.0018 * Math.pow(fluteFade, 0.7);

    for (let ir = 0; ir <= radialSegs; ir++) {
      const u = ir / radialSegs;
      const theta = u * Math.PI * 2 + Math.PI;
      const flute = Math.cos(u * Math.PI * 2 * 32);
      const r = baseR + amp * flute;

      verts.push(r * Math.sin(theta), y, r * Math.cos(theta));
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

async function generateRealisticLampModel() {
  console.log('Generating Architectural Fluted Travertine & Linen Table Lamp 3D Model...');

  const scene = new THREE.Scene();
  scene.name = 'Fluted_Travertine_Linen_Table_Lamp';

  const travertineMat = new THREE.MeshStandardMaterial({
    name: 'Honed_Crema_Travertine',
    color: new THREE.Color('#e5dbc9'),
    roughness: 0.48,
    metalness: 0.02,
  });

  const brushedBrassMat = new THREE.MeshStandardMaterial({
    name: 'Brushed_Antique_Brass',
    color: new THREE.Color('#c89f4e'),
    roughness: 0.28,
    metalness: 0.88,
  });

  const polishedBrassMat = new THREE.MeshStandardMaterial({
    name: 'Polished_Brass_Accents',
    color: new THREE.Color('#dfb965'),
    roughness: 0.16,
    metalness: 0.94,
  });

  const linenShadeMat = new THREE.MeshStandardMaterial({
    name: 'Woven_Oatmeal_Linen_Shade',
    color: new THREE.Color('#efe7d6'),
    emissive: new THREE.Color('#ffcf78'),
    emissiveIntensity: 0.0,
    roughness: 0.88,
    side: THREE.DoubleSide,
  });

  const bulbGlassMat = new THREE.MeshStandardMaterial({
    name: 'A19_Glass_Bulb',
    color: new THREE.Color('#fff9ec'),
    transparent: true,
    opacity: 0.45,
    roughness: 0.08,
  });

  const filamentMat = new THREE.MeshStandardMaterial({
    name: 'Warm_Tungsten_Filament',
    color: new THREE.Color('#6c5a4a'),
    emissive: new THREE.Color('#ffab38'),
    emissiveIntensity: 0.0,
  });

  const feltMat = new THREE.MeshStandardMaterial({
    name: 'Felt_Base_Pad',
    color: new THREE.Color('#1f1b18'),
    roughness: 0.94,
  });

  const lampGroup = new THREE.Group();
  lampGroup.name = 'Lamp_Root';

  // 1. Felt Base & Brass Plinth
  const feltMesh = new THREE.Mesh(new THREE.CylinderGeometry(0.055, 0.055, 0.003, 48), feltMat);
  feltMesh.position.y = 0.0015;
  feltMesh.name = 'Felt_Base_Pad';
  lampGroup.add(feltMesh);

  const footPts = [
    new THREE.Vector2(0.053, 0.0025),
    new THREE.Vector2(0.058, 0.003),
    new THREE.Vector2(0.059, 0.007),
    new THREE.Vector2(0.055, 0.0105),
    new THREE.Vector2(0.049, 0.012),
  ];
  const footPlinth = new THREE.Mesh(new THREE.LatheGeometry(footPts, 64).rotateY(Math.PI), brushedBrassMat);
  footPlinth.castShadow = true;
  footPlinth.name = 'Turned_Brass_Plinth';
  lampGroup.add(footPlinth);

  // 2. 32-Flute Travertine Stone Pedestal
  const travPedestal = new THREE.Mesh(buildFlutedTravertinePedestal(), travertineMat);
  travPedestal.castShadow = true;
  travPedestal.receiveShadow = true;
  travPedestal.name = 'Fluted_Travertine_Pedestal';
  lampGroup.add(travPedestal);

  // 3. Neck Collar, E26 Socket Cup & Rotary Dimmer Paddle (Wireless pedestal)
  const collar = new THREE.Mesh(new THREE.CylinderGeometry(0.014, 0.022, 0.013, 36), polishedBrassMat);
  collar.position.y = 0.161;
  collar.name = 'Neck_Collar';
  lampGroup.add(collar);

  const saddle = new THREE.Mesh(new THREE.BoxGeometry(0.032, 0.004, 0.009), brushedBrassMat);
  saddle.position.y = 0.171;
  saddle.name = 'Harp_Saddle';
  lampGroup.add(saddle);

  const socket = new THREE.Mesh(new THREE.CylinderGeometry(0.0155, 0.0145, 0.036, 32), brushedBrassMat);
  socket.position.y = 0.191;
  socket.name = 'E26_Socket_Cup';
  lampGroup.add(socket);

  const socketRing = new THREE.Mesh(new THREE.CylinderGeometry(0.0165, 0.0165, 0.005, 32), polishedBrassMat);
  socketRing.position.y = 0.207;
  lampGroup.add(socketRing);

  const switchShaft = new THREE.Mesh(new THREE.CylinderGeometry(0.0018, 0.0018, 0.012, 12), polishedBrassMat);
  switchShaft.rotation.z = Math.PI / 2;
  switchShaft.position.set(0.020, 0.188, 0);
  lampGroup.add(switchShaft);

  const switchPaddle = new THREE.Mesh(new THREE.BoxGeometry(0.009, 0.0075, 0.0022), polishedBrassMat);
  switchPaddle.position.set(0.027, 0.188, 0);
  switchPaddle.name = 'Rotary_Dimmer_Key';
  lampGroup.add(switchPaddle);

  // 5. Harp Arms, Spider Wires & Brass Finial
  [-1, 1].forEach((sign) => {
    const armCurve = new THREE.CatmullRomCurve3([
      new THREE.Vector3(sign * 0.015, 0.172, 0),
      new THREE.Vector3(sign * 0.046, 0.186, 0),
      new THREE.Vector3(sign * 0.052, 0.232, 0),
      new THREE.Vector3(sign * 0.036, 0.272, 0),
      new THREE.Vector3(sign * 0.008, 0.286, 0),
    ]);
    const arm = new THREE.Mesh(new THREE.TubeGeometry(armCurve, 24, 0.0017, 8, false), polishedBrassMat);
    arm.name = sign < 0 ? 'Harp_Arm_Left' : 'Harp_Arm_Right';
    lampGroup.add(arm);
  });

  const harpCap = new THREE.Mesh(new THREE.CylinderGeometry(0.009, 0.009, 0.005, 24), polishedBrassMat);
  harpCap.position.y = 0.286;
  lampGroup.add(harpCap);

  [0, (Math.PI * 2) / 3, (Math.PI * 4) / 3].forEach((ang, idx) => {
    const spoke = new THREE.Mesh(new THREE.CylinderGeometry(0.0011, 0.0011, 0.074, 8), polishedBrassMat);
    spoke.position.set(Math.cos(ang) * 0.042, 0.285, Math.sin(ang) * 0.042);
    spoke.rotation.set(0, -ang, Math.PI / 2);
    spoke.name = `Spider_Wire_${idx + 1}`;
    lampGroup.add(spoke);
  });

  const finialNeck = new THREE.Mesh(new THREE.CylinderGeometry(0.005, 0.007, 0.007, 20), polishedBrassMat);
  finialNeck.position.y = 0.293;
  lampGroup.add(finialNeck);

  const finialBall = new THREE.Mesh(new THREE.SphereGeometry(0.0075, 24, 18), polishedBrassMat);
  finialBall.position.y = 0.301;
  finialBall.name = 'Brass_Ball_Finial';
  lampGroup.add(finialBall);

  // 6. Glowing Glass A19 Bulb & Tungsten Filament
  const bulbBase = new THREE.Mesh(new THREE.CylinderGeometry(0.0085, 0.009, 0.006, 20), polishedBrassMat);
  bulbBase.position.y = 0.211;
  lampGroup.add(bulbBase);

  const bulbPts = [
    new THREE.Vector2(0.008, 0.210),
    new THREE.Vector2(0.012, 0.220),
    new THREE.Vector2(0.021, 0.236),
    new THREE.Vector2(0.022, 0.249),
    new THREE.Vector2(0.016, 0.261),
    new THREE.Vector2(0.006, 0.267),
    new THREE.Vector2(0.0, 0.268),
  ];
  const bulbMesh = new THREE.Mesh(new THREE.LatheGeometry(bulbPts, 32), bulbGlassMat);
  bulbMesh.name = 'Clear_Glass_A19_Bulb';
  lampGroup.add(bulbMesh);

  const filPts = [];
  for (let i = 0; i <= 24; i++) {
    const t = i / 24;
    const angle = t * Math.PI * 1.4 - Math.PI * 0.2;
    filPts.push(
      new THREE.Vector3(
        Math.sin(angle) * 0.0085,
        0.238 + Math.cos(angle) * 0.009 + Math.sin(t * Math.PI * 10) * 0.0012,
        Math.cos(t * Math.PI * 10) * 0.0012
      )
    );
  }
  const filMesh = new THREE.Mesh(
    new THREE.TubeGeometry(new THREE.CatmullRomCurve3(filPts), 36, 0.00055, 6, false),
    filamentMat
  );
  filMesh.name = 'Glowing_Tungsten_Filament';
  lampGroup.add(filMesh);

  // 7. Open-Bottom & Open-Top Empire Linen Shade
  const shadePts = [
    new THREE.Vector2(0.076, 0.289),
    new THREE.Vector2(0.078, 0.291),
    new THREE.Vector2(0.079, 0.288),
    new THREE.Vector2(0.090, 0.232),
    new THREE.Vector2(0.101, 0.176),
    new THREE.Vector2(0.102, 0.172),
    new THREE.Vector2(0.100, 0.171),
  ];
  const shadeMesh = new THREE.Mesh(new THREE.LatheGeometry(shadePts, 72).rotateY(Math.PI), linenShadeMat);
  shadeMesh.castShadow = true;
  shadeMesh.receiveShadow = true;
  shadeMesh.name = 'Woven_Linen_Empire_Shade';
  lampGroup.add(shadeMesh);

  scene.add(lampGroup);

  const exporter = new GLTFExporter();
  const publicModelsDir = path.join(__dirname, '..', 'public', 'models');
  const savedModelsDir = path.join(__dirname, '..', 'saved_models', 'table_lamp');

  if (!fs.existsSync(publicModelsDir)) fs.mkdirSync(publicModelsDir, { recursive: true });
  if (!fs.existsSync(savedModelsDir)) fs.mkdirSync(savedModelsDir, { recursive: true });

  exporter.parse(
    scene,
    (glbArrayBuffer) => {
      const buffer = Buffer.from(glbArrayBuffer);
      fs.writeFileSync(path.join(publicModelsDir, 'table_lamp_realistic.glb'), buffer);
      fs.writeFileSync(path.join(savedModelsDir, 'table_lamp_realistic.glb'), buffer);
      console.log(`✅ Binary GLB saved successfully (${(buffer.length / 1024).toFixed(1)} KB)`);
    },
    (err) => console.error('Error generating GLB:', err),
    { binary: true }
  );

  exporter.parse(
    scene,
    (gltf) => {
      const jsonStr = JSON.stringify(gltf, null, 2);
      fs.writeFileSync(path.join(publicModelsDir, 'table_lamp_realistic.gltf'), jsonStr, 'utf8');
      fs.writeFileSync(path.join(savedModelsDir, 'table_lamp_realistic.gltf'), jsonStr, 'utf8');
      console.log('✅ Text GLTF saved successfully');
    },
    (err) => console.error('Error generating GLTF:', err),
    { binary: false }
  );
}

generateRealisticLampModel();
