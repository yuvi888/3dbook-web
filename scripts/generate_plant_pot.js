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

async function generatePhotorealisticPlantPot() {
  console.log('Generating Photorealistic Trailing Pothos Plant Pot 3D Model...');

  const scene = new THREE.Scene();
  scene.name = 'Photorealistic_Botanical_Pothos_Planter';

  // =========================================================================
  // 1. PBR MATERIALS
  // =========================================================================
  // Modern Minimalist White Porcelain Ceramic (matching reference photo)
  const ceramicPotMat = new THREE.MeshStandardMaterial({
    name: 'Minimalist_White_Ceramic',
    color: new THREE.Color('#faf8f5'),
    roughness: 0.32,
    metalness: 0.02,
  });

  // Dark Organic Peat Soil (rich, deep, matte)
  const soilMat = new THREE.MeshStandardMaterial({
    name: 'Organic_Potting_Soil',
    color: new THREE.Color('#1c140e'),
    roughness: 0.95,
    metalness: 0.0,
  });

  // Slender Botanical Vine & Petiole Stems (natural olive/sap green)
  const stemMat = new THREE.MeshStandardMaterial({
    name: 'Botanical_Vine_Stem',
    color: new THREE.Color('#517e3e'),
    roughness: 0.42,
    metalness: 0.0,
  });

  // Raised Central Leaf Midrib Vein
  const veinMat = new THREE.MeshStandardMaterial({
    name: 'Leaf_Midrib_Vein',
    color: new THREE.Color('#5c8f47'),
    roughness: 0.40,
    metalness: 0.0,
  });

  // Mature Botanical Leaf Blade (Rich satin emerald green, waxy sheen)
  const matureLeafMat = new THREE.MeshStandardMaterial({
    name: 'Pothos_Mature_Leaf',
    color: new THREE.Color('#275c2b'),
    roughness: 0.28,
    metalness: 0.02,
    side: THREE.DoubleSide,
  });

  // Mid-Canopy Leaf Blade (Lush botanical green)
  const midLeafMat = new THREE.MeshStandardMaterial({
    name: 'Pothos_Mid_Leaf',
    color: new THREE.Color('#336e35'),
    roughness: 0.30,
    metalness: 0.02,
    side: THREE.DoubleSide,
  });

  // Fresh Sprouting / Vine Tip Leaf Blade (Vibrant tender sap green)
  const youngLeafMat = new THREE.MeshStandardMaterial({
    name: 'Pothos_Young_Leaf',
    color: new THREE.Color('#499443'),
    roughness: 0.34,
    metalness: 0.01,
    side: THREE.DoubleSide,
  });

  // Root Planter Group
  const plantPotGroup = new THREE.Group();
  plantPotGroup.name = 'Realistic_Plant_Pot_Assembly';

  // =========================================================================
  // 2. MINIMALIST CERAMIC CYLINDER POT (Matching reference photo)
  // =========================================================================
  const potRadius = 0.068; // 13.6 cm diameter
  const potHeight = 0.125; // 12.5 cm tall

  // Main Pot Cylinder Body
  const potBodyGeo = new THREE.CylinderGeometry(potRadius, potRadius * 0.94, potHeight, 48, 1, true);
  const potBody = new THREE.Mesh(potBodyGeo, ceramicPotMat);
  potBody.name = 'Ceramic_Pot_Body';
  potBody.position.set(0, potHeight / 2, 0);
  potBody.castShadow = true;
  potBody.receiveShadow = true;
  plantPotGroup.add(potBody);

  // Soft Rounded Rim Lip at the top of the pot
  const rimGeo = new THREE.TorusGeometry(potRadius - 0.002, 0.004, 16, 48);
  rimGeo.rotateX(Math.PI / 2);
  const rim = new THREE.Mesh(rimGeo, ceramicPotMat);
  rim.name = 'Ceramic_Pot_Rim';
  rim.position.set(0, potHeight, 0);
  plantPotGroup.add(rim);

  // Soft Rounded Bottom Bevel
  const bottomBevelGeo = new THREE.TorusGeometry(potRadius * 0.94 - 0.002, 0.0035, 14, 48);
  bottomBevelGeo.rotateX(Math.PI / 2);
  const bottomBevel = new THREE.Mesh(bottomBevelGeo, ceramicPotMat);
  bottomBevel.name = 'Ceramic_Pot_Bottom_Bevel';
  bottomBevel.position.set(0, 0.0035, 0);
  plantPotGroup.add(bottomBevel);

  // =========================================================================
  // 3. ORGANIC POTTING SOIL (Mounded surface recessed below rim)
  // =========================================================================
  const soilY = potHeight - 0.012; // 1.2 cm below rim
  const soilRadius = potRadius - 0.006;
  const soilGeo = new THREE.CylinderGeometry(soilRadius, soilRadius - 0.006, 0.016, 36);
  const soil = new THREE.Mesh(soilGeo, soilMat);
  soil.name = 'Organic_Potting_Soil';
  soil.position.set(0, soilY, 0);
  soil.receiveShadow = true;
  plantPotGroup.add(soil);

  // =========================================================================
  // 4. PARAMETRIC CURVED BOTANICAL LEAF GENERATOR
  // Creates smooth heart/oval leaf blades with 3D cupping, droop, and central vein
  // =========================================================================
  function createLeafMesh(length, width, cupAmount, droopAmount, material) {
    const leafGroup = new THREE.Group();

    // 1. Organic Bezier Contour Shape
    const shape = new THREE.Shape();
    shape.moveTo(0, 0);
    // Left heart/oval curve
    shape.bezierCurveTo(-width * 0.45, length * 0.15, -width * 0.55, length * 0.55, -width * 0.35, length * 0.85);
    shape.bezierCurveTo(-width * 0.18, length * 0.96, -width * 0.04, length * 0.99, 0, length);
    // Right heart/oval curve (symmetric)
    shape.bezierCurveTo(width * 0.04, length * 0.99, width * 0.18, length * 0.96, width * 0.35, length * 0.85);
    shape.bezierCurveTo(width * 0.55, length * 0.55, width * 0.45, length * 0.15, 0, 0);

    const geo = new THREE.ShapeGeometry(shape, 18);
    const pos = geo.attributes.position;

    // Displace vertices into 3D natural leaf curvature
    for (let i = 0; i < pos.count; i++) {
      const x = pos.getX(i);
      const y = pos.getY(i);
      const normY = y / length;
      const distFromSpine = Math.abs(x) / (width / 2);

      // Cupping: leaf wings curve upwards away from spine
      const cupZ = Math.pow(distFromSpine, 1.3) * (width * cupAmount);

      // Droop: natural gravity curve along leaf length
      const droopZ = -Math.sin(normY * Math.PI * 0.78) * (length * droopAmount);

      pos.setZ(i, cupZ + droopZ);
    }
    geo.computeVertexNormals();

    const bladeMesh = new THREE.Mesh(geo, material);
    bladeMesh.castShadow = true;
    leafGroup.add(bladeMesh);

    // 2. Raised 3D Central Midrib Vein
    const veinCurve = new THREE.LineCurve3(
      new THREE.Vector3(0, 0, 0),
      new THREE.Vector3(0, length * 0.95, -length * droopAmount * 0.7)
    );
    const veinGeo = new THREE.TubeGeometry(veinCurve, 10, 0.0009, 6, false);
    const veinMesh = new THREE.Mesh(veinGeo, veinMat);
    leafGroup.add(veinMesh);

    return leafGroup;
  }

  // =========================================================================
  // 5. NATURAL CROWN FOLIAGE (38 Bulk Leaves forming a dense, bushy dome)
  // =========================================================================
  const foliageGroup = new THREE.Group();
  foliageGroup.name = 'Foliage_Assembly';

  // --- Tier 1: Center Sprouting Core (6 leaves) ---
  for (let i = 0; i < 6; i++) {
    const angle = (i * Math.PI * 2) / 6 + 0.2;
    const rRoot = 0.010 + (i % 2) * 0.005;
    const rBase = 0.018 + (i % 3) * 0.005;
    const yBase = soilY + 0.032 + (i % 3) * 0.006;

    const leafUnit = new THREE.Group();
    leafUnit.name = `Core_Leaf_${i + 1}`;

    const stemStart = new THREE.Vector3(rRoot * Math.cos(angle), soilY + 0.002, rRoot * Math.sin(angle));
    const stemEnd = new THREE.Vector3(rBase * Math.cos(angle + 0.15), yBase, rBase * Math.sin(angle + 0.15));
    const stemMid = new THREE.Vector3(
      (stemStart.x + stemEnd.x) / 2,
      Math.max(stemStart.y, stemEnd.y) + 0.004,
      (stemStart.z + stemEnd.z) / 2
    );

    const stemCurve = new THREE.CatmullRomCurve3([stemStart, stemMid, stemEnd]);
    const stemGeo = new THREE.TubeGeometry(stemCurve, 6, 0.0013, 6, false);
    const stemMesh = new THREE.Mesh(stemGeo, stemMat);
    leafUnit.add(stemMesh);

    const leafMesh = createLeafMesh(0.060, 0.042, 0.22, 0.18, youngLeafMat);
    leafMesh.position.copy(stemEnd);
    leafMesh.rotation.y = -angle - Math.PI / 2;
    leafMesh.rotation.x = 0.38;
    leafMesh.rotation.z = ((i % 3) - 1) * 0.12;

    leafUnit.add(leafMesh);
    foliageGroup.add(leafUnit);
  }

  // --- Tier 2: Inner Canopy (10 leaves, spreading at 45°) ---
  for (let i = 0; i < 10; i++) {
    const angle = (i * Math.PI * 2) / 10 + 0.4;
    const rRoot = 0.018 + (i % 2) * 0.006;
    const rBase = 0.036 + (i % 3) * 0.006;
    const yBase = soilY + 0.026 + (i % 2) * 0.006;

    const leafUnit = new THREE.Group();
    leafUnit.name = `Inner_Leaf_${i + 1}`;

    const stemStart = new THREE.Vector3(rRoot * Math.cos(angle), soilY + 0.002, rRoot * Math.sin(angle));
    const stemEnd = new THREE.Vector3(rBase * Math.cos(angle + 0.1), yBase, rBase * Math.sin(angle + 0.1));
    const stemMid = new THREE.Vector3(
      (stemStart.x + stemEnd.x) / 2,
      Math.max(stemStart.y, stemEnd.y) + 0.005,
      (stemStart.z + stemEnd.z) / 2
    );

    const stemCurve = new THREE.CatmullRomCurve3([stemStart, stemMid, stemEnd]);
    const stemGeo = new THREE.TubeGeometry(stemCurve, 6, 0.0014, 6, false);
    const stemMesh = new THREE.Mesh(stemGeo, stemMat);
    leafUnit.add(stemMesh);

    const leafMesh = createLeafMesh(0.074, 0.052, 0.24, 0.22, i % 2 === 0 ? midLeafMat : matureLeafMat);
    leafMesh.position.copy(stemEnd);
    leafMesh.rotation.y = -angle - Math.PI / 2;
    leafMesh.rotation.x = 0.68;
    leafMesh.rotation.z = ((i % 4) - 1.5) * 0.14;

    leafUnit.add(leafMesh);
    foliageGroup.add(leafUnit);
  }

  // --- Tier 3: Mid-Rim Canopy (12 leaves, concealing opening) ---
  for (let i = 0; i < 12; i++) {
    const angle = (i * Math.PI * 2) / 12 + 0.15;
    const rRoot = 0.025 + (i % 3) * 0.006;
    const rBase = 0.054 + (i % 3) * 0.005;
    const yBase = soilY + 0.020 + (i % 2) * 0.005;

    const leafUnit = new THREE.Group();
    leafUnit.name = `Mid_Leaf_${i + 1}`;

    const stemStart = new THREE.Vector3(rRoot * Math.cos(angle), soilY + 0.002, rRoot * Math.sin(angle));
    const stemEnd = new THREE.Vector3(rBase * Math.cos(angle + 0.08), yBase, rBase * Math.sin(angle + 0.08));
    const stemMid = new THREE.Vector3(
      (stemStart.x + stemEnd.x) / 2,
      Math.max(stemStart.y, stemEnd.y) + 0.006,
      (stemStart.z + stemEnd.z) / 2
    );

    const stemCurve = new THREE.CatmullRomCurve3([stemStart, stemMid, stemEnd]);
    const stemGeo = new THREE.TubeGeometry(stemCurve, 6, 0.0014, 6, false);
    const stemMesh = new THREE.Mesh(stemGeo, stemMat);
    leafUnit.add(stemMesh);

    const leafMesh = createLeafMesh(0.082, 0.058, 0.25, 0.25, matureLeafMat);
    leafMesh.position.copy(stemEnd);
    leafMesh.rotation.y = -angle - Math.PI / 2;
    leafMesh.rotation.x = 0.95;
    leafMesh.rotation.z = ((i % 5) - 2) * 0.15;

    leafUnit.add(leafMesh);
    foliageGroup.add(leafUnit);
  }

  // --- Tier 4: Outer Lip-Softening Canopy (10 leaves draping over rim) ---
  for (let i = 0; i < 10; i++) {
    const angle = (i * Math.PI * 2) / 10 + 0.3;
    const rRoot = 0.030 + (i % 2) * 0.006;
    const rBase = 0.072 + (i % 3) * 0.004;
    const yBase = soilY + 0.016 + (i % 2) * 0.004;

    const leafUnit = new THREE.Group();
    leafUnit.name = `Outer_Leaf_${i + 1}`;

    const stemStart = new THREE.Vector3(rRoot * Math.cos(angle), soilY + 0.002, rRoot * Math.sin(angle));
    const stemEnd = new THREE.Vector3(rBase * Math.cos(angle + 0.05), yBase, rBase * Math.sin(angle + 0.05));
    const stemMid = new THREE.Vector3(
      (stemStart.x + stemEnd.x) / 2,
      Math.max(stemStart.y, stemEnd.y) + 0.008,
      (stemStart.z + stemEnd.z) / 2
    );

    const stemCurve = new THREE.CatmullRomCurve3([stemStart, stemMid, stemEnd]);
    const stemGeo = new THREE.TubeGeometry(stemCurve, 6, 0.0015, 6, false);
    const stemMesh = new THREE.Mesh(stemGeo, stemMat);
    leafUnit.add(stemMesh);

    const leafMesh = createLeafMesh(0.086, 0.062, 0.26, 0.28, matureLeafMat);
    leafMesh.position.copy(stemEnd);
    leafMesh.rotation.y = -angle - Math.PI / 2;
    leafMesh.rotation.x = 1.25;
    leafMesh.rotation.z = ((i % 3) - 1) * 0.18;

    leafUnit.add(leafMesh);
    foliageGroup.add(leafUnit);
  }

  // =========================================================================
  // 6. REALISTIC TRAILING VINES (3 Cascading Runners, Zero Pot Penetration)
  // =========================================================================
  function createTrailingVine(phi, len, count, namePrefix) {
    const vineGroup = new THREE.Group();
    vineGroup.name = namePrefix;

    const points = [
      new THREE.Vector3(0.024 * Math.cos(phi - 0.2), soilY + 0.002, 0.024 * Math.sin(phi - 0.2)),
      new THREE.Vector3(0.048 * Math.cos(phi - 0.08), 0.122, 0.048 * Math.sin(phi - 0.08)),
      new THREE.Vector3(0.074 * Math.cos(phi), 0.134, 0.074 * Math.sin(phi)), // Crest over rim
      new THREE.Vector3(0.080 * Math.cos(phi + 0.03), 0.098 * len + (1 - len) * 0.115, 0.080 * Math.sin(phi + 0.03)),
      new THREE.Vector3(0.084 * Math.cos(phi + 0.06), 0.062 * len + (1 - len) * 0.110, 0.084 * Math.sin(phi + 0.06)),
      new THREE.Vector3(0.086 * Math.cos(phi + 0.08), 0.026 * len + (1 - len) * 0.105, 0.086 * Math.sin(phi + 0.08)),
      new THREE.Vector3(0.084 * Math.cos(phi + 0.10), -0.008 * len + (1 - len) * 0.100, 0.084 * Math.sin(phi + 0.10)),
    ];

    const curve = new THREE.CatmullRomCurve3(points);
    const vineGeo = new THREE.TubeGeometry(curve, 32, 0.0018, 8, false);
    const vineMesh = new THREE.Mesh(vineGeo, stemMat);
    vineMesh.castShadow = true;
    vineGroup.add(vineMesh);

    for (let i = 0; i < count; i++) {
      const t = 0.28 + (i / (count - 1)) * 0.68;
      const pOnVine = curve.getPointAt(t);
      const tangent = curve.getTangentAt(t);

      const normal = new THREE.Vector3(pOnVine.x, 0, pOnVine.z).normalize();
      const isLeft = i % 2 === 0;

      const sideDir = new THREE.Vector3().crossVectors(tangent, normal).normalize();
      const leafPos = pOnVine
        .clone()
        .add(normal.clone().multiplyScalar(0.006))
        .add(sideDir.clone().multiplyScalar(isLeft ? 0.005 : -0.005));

      const leafLen = 0.080 - (i / count) * 0.025;
      const leafW = 0.058 - (i / count) * 0.018;
      const leafMat = i === count - 1 ? youngLeafMat : isLeft ? matureLeafMat : midLeafMat;

      const leafMesh = createLeafMesh(leafLen, leafW, 0.24, 0.28, leafMat);
      leafMesh.position.copy(leafPos);

      const az = Math.atan2(normal.z, normal.x);
      leafMesh.rotation.y = -az - Math.PI / 2 + (isLeft ? 0.25 : -0.25);
      leafMesh.rotation.x = 1.40 + (1 - t) * 0.20;
      leafMesh.rotation.z = isLeft ? 0.18 : -0.18;

      vineGroup.add(leafMesh);
    }

    return vineGroup;
  }

  foliageGroup.add(createTrailingVine(2.15, 1.0, 7, 'Trailing_Vine_Front_Left'));
  foliageGroup.add(createTrailingVine(-0.70, 0.85, 5, 'Trailing_Vine_Right'));
  foliageGroup.add(createTrailingVine(1.15, 0.65, 4, 'Trailing_Vine_Front'));

  plantPotGroup.add(foliageGroup);
  scene.add(plantPotGroup);

  // =========================================================================
  // 7. EXPORT TO BINARY .GLB AND READABLE .GLTF
  // =========================================================================
  const outputDir = path.join(__dirname, '..', 'public', 'models');
  fs.mkdirSync(outputDir, { recursive: true });

  const exporter = new GLTFExporter();

  console.log('Exporting realistic trailing pothos plant pot .glb file...');
  const glbBuffer = await exporter.parseAsync(scene, { binary: true });
  const glbPath = path.join(outputDir, 'plant_pot_realistic.glb');
  fs.writeFileSync(glbPath, Buffer.from(glbBuffer));
  const glbSize = (fs.statSync(glbPath).size / 1024).toFixed(1);
  console.log(`Saved ${glbPath} (${glbSize} KB)`);

  console.log('Exporting readable plant pot .gltf file...');
  const gltfJson = await exporter.parseAsync(scene, { binary: false });
  const gltfPath = path.join(outputDir, 'plant_pot_realistic.gltf');
  fs.writeFileSync(gltfPath, JSON.stringify(gltfJson, null, 2));
  const gltfSize = (fs.statSync(gltfPath).size / 1024).toFixed(1);
  console.log(`Saved ${gltfPath} (${gltfSize} KB)`);

  console.log('Photorealistic Trailing Pothos Plant Pot Generated Successfully!');
}

generatePhotorealisticPlantPot().catch(console.error);
