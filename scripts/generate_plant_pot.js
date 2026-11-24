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
  // 5. NATURAL CROWN FOLIAGE (30 Leaves clustered naturally in pot)
  // =========================================================================
  const foliageGroup = new THREE.Group();
  foliageGroup.name = 'Foliage_Assembly';

  // Seeded leaf configurations for natural organic phyllotaxis
  const crownLeaves = [
    // --- Center Upright Sprouting Leaves ---
    { r: 0.018, angle: 0.2, y: 0.075, len: 0.048, w: 0.034, pitch: 0.45, roll: 0.10, mat: youngLeafMat },
    { r: 0.022, angle: 1.8, y: 0.082, len: 0.052, w: 0.036, pitch: 0.50, roll: -0.15, mat: youngLeafMat },
    { r: 0.016, angle: 3.5, y: 0.088, len: 0.046, w: 0.032, pitch: 0.40, roll: 0.20, mat: youngLeafMat },
    { r: 0.024, angle: 5.1, y: 0.078, len: 0.050, w: 0.035, pitch: 0.48, roll: -0.12, mat: youngLeafMat },

    // --- Mid-Tier Canopy Leaves ---
    { r: 0.042, angle: 0.5, y: 0.068, len: 0.064, w: 0.044, pitch: 0.75, roll: 0.20, mat: midLeafMat },
    { r: 0.046, angle: 1.2, y: 0.062, len: 0.068, w: 0.046, pitch: 0.82, roll: -0.18, mat: midLeafMat },
    { r: 0.040, angle: 2.1, y: 0.070, len: 0.062, w: 0.042, pitch: 0.72, roll: 0.25, mat: midLeafMat },
    { r: 0.048, angle: 2.8, y: 0.058, len: 0.070, w: 0.048, pitch: 0.88, roll: -0.22, mat: midLeafMat },
    { r: 0.044, angle: 3.7, y: 0.065, len: 0.065, w: 0.045, pitch: 0.78, roll: 0.15, mat: midLeafMat },
    { r: 0.047, angle: 4.5, y: 0.060, len: 0.067, w: 0.046, pitch: 0.85, roll: -0.28, mat: midLeafMat },
    { r: 0.041, angle: 5.4, y: 0.066, len: 0.063, w: 0.043, pitch: 0.76, roll: 0.18, mat: midLeafMat },
    { r: 0.045, angle: 6.0, y: 0.063, len: 0.066, w: 0.045, pitch: 0.80, roll: -0.15, mat: midLeafMat },

    // --- Outer Spreading Mature Leaves ---
    { r: 0.062, angle: 0.8, y: 0.048, len: 0.076, w: 0.052, pitch: 1.05, roll: 0.28, mat: matureLeafMat },
    { r: 0.066, angle: 1.6, y: 0.042, len: 0.082, w: 0.056, pitch: 1.15, roll: -0.25, mat: matureLeafMat },
    { r: 0.058, angle: 2.5, y: 0.050, len: 0.074, w: 0.050, pitch: 1.02, roll: 0.32, mat: matureLeafMat },
    { r: 0.068, angle: 3.3, y: 0.038, len: 0.084, w: 0.058, pitch: 1.20, roll: -0.30, mat: matureLeafMat },
    { r: 0.060, angle: 4.1, y: 0.046, len: 0.078, w: 0.054, pitch: 1.08, roll: 0.22, mat: matureLeafMat },
    { r: 0.065, angle: 4.9, y: 0.040, len: 0.080, w: 0.055, pitch: 1.18, roll: -0.35, mat: matureLeafMat },
    { r: 0.059, angle: 5.7, y: 0.047, len: 0.075, w: 0.051, pitch: 1.04, roll: 0.25, mat: matureLeafMat },
  ];

  crownLeaves.forEach((cfg, idx) => {
    const leafUnit = new THREE.Group();
    leafUnit.name = `Crown_Leaf_${idx + 1}`;

    const endX = Math.cos(cfg.angle) * cfg.r;
    const endZ = Math.sin(cfg.angle) * cfg.r;
    const endY = soilY + cfg.y;

    // Slender organic petiole stem
    const stemStart = new THREE.Vector3(endX * 0.2, soilY + 0.002, endZ * 0.2);
    const stemEnd = new THREE.Vector3(endX, endY, endZ);
    const stemMid = new THREE.Vector3(
      (stemStart.x + stemEnd.x) / 2 + Math.cos(cfg.angle) * 0.008,
      (stemStart.y + stemEnd.y) / 2 + 0.012,
      (stemStart.z + stemEnd.z) / 2 + Math.sin(cfg.angle) * 0.008
    );

    const stemCurve = new THREE.CatmullRomCurve3([stemStart, stemMid, stemEnd]);
    const stemGeo = new THREE.TubeGeometry(stemCurve, 8, 0.0014, 6, false);
    const stemMesh = new THREE.Mesh(stemGeo, stemMat);
    leafUnit.add(stemMesh);

    // Parametric leaf blade
    const leafMesh = createLeafMesh(cfg.len, cfg.w, 0.24, 0.22, cfg.mat);
    leafMesh.position.copy(stemEnd);
    leafMesh.rotation.y = -cfg.angle - Math.PI / 2;
    leafMesh.rotation.x = cfg.pitch;
    leafMesh.rotation.z = cfg.roll;

    leafUnit.add(leafMesh);
    foliageGroup.add(leafUnit);
  });

  // =========================================================================
  // 6. REALISTIC TRAILING VINES (Cascading gracefully down pot sides!)
  // Matching the top shelf trailing plant in user's reference photo!
  // =========================================================================
  function createTrailingVine(startAngle, vinePoints, leafCount, namePrefix) {
    const vineGroup = new THREE.Group();
    vineGroup.name = namePrefix;

    // 1. Vine Main Stem Spline
    const curve = new THREE.CatmullRomCurve3(vinePoints);
    const vineGeo = new THREE.TubeGeometry(curve, 24, 0.0016, 6, false);
    const vineMesh = new THREE.Mesh(vineGeo, stemMat);
    vineMesh.castShadow = true;
    vineGroup.add(vineMesh);

    // 2. Cascading Leaves along the vine
    for (let i = 0; i < leafCount; i++) {
      const t = (i + 0.5) / leafCount;
      const pointOnVine = curve.getPointAt(t);
      const tangent = curve.getTangentAt(t);

      // Alternating leaf orientation along vine
      const isLeft = i % 2 === 0;
      const leafLen = 0.065 - t * 0.022; // Leaves get naturally smaller toward vine tip
      const leafW = 0.046 - t * 0.016;
      const leafMat = t > 0.65 ? youngLeafMat : t > 0.3 ? midLeafMat : matureLeafMat;

      const leafMesh = createLeafMesh(leafLen, leafW, 0.22, 0.26, leafMat);

      // Offset slightly from vine stem
      const sideOffset = new THREE.Vector3().crossVectors(tangent, new THREE.Vector3(0, 1, 0)).normalize();
      const petioleVec = sideOffset.clone().multiplyScalar(isLeft ? 0.012 : -0.012);

      leafMesh.position.copy(pointOnVine).add(petioleVec);

      // Natural downward draping angle
      leafMesh.rotation.x = 1.35 + Math.sin(t * Math.PI) * 0.25;
      leafMesh.rotation.y = startAngle + (isLeft ? 0.45 : -0.45);
      leafMesh.rotation.z = isLeft ? 0.25 : -0.25;

      vineGroup.add(leafMesh);
    }

    return vineGroup;
  }

  // --- Vine 1: Long Front-Left Cascading Vine (draping down side of pot) ---
  const vine1Points = [
    new THREE.Vector3(-0.02, soilY + 0.005, 0.02),
    new THREE.Vector3(-0.05, soilY + 0.018, 0.04),
    new THREE.Vector3(-0.074, potHeight - 0.005, 0.055), // Passing over rim
    new THREE.Vector3(-0.088, potHeight - 0.035, 0.060),
    new THREE.Vector3(-0.092, potHeight - 0.075, 0.055),
    new THREE.Vector3(-0.085, potHeight - 0.110, 0.048), // Draping near base
  ];
  foliageGroup.add(createTrailingVine(0.6, vine1Points, 6, 'Trailing_Vine_Front_Left'));

  // --- Vine 2: Right Cascading Vine ---
  const vine2Points = [
    new THREE.Vector3(0.02, soilY + 0.005, 0.01),
    new THREE.Vector3(0.045, soilY + 0.015, 0.025),
    new THREE.Vector3(0.072, potHeight - 0.004, 0.030), // Passing over rim
    new THREE.Vector3(0.084, potHeight - 0.038, 0.025),
    new THREE.Vector3(0.088, potHeight - 0.080, 0.015),
  ];
  foliageGroup.add(createTrailingVine(-0.4, vine2Points, 5, 'Trailing_Vine_Right'));

  // --- Vine 3: Soft Front-Right Droop ---
  const vine3Points = [
    new THREE.Vector3(0.01, soilY + 0.005, 0.02),
    new THREE.Vector3(0.025, soilY + 0.016, 0.045),
    new THREE.Vector3(0.035, potHeight - 0.006, 0.070),
    new THREE.Vector3(0.040, potHeight - 0.045, 0.080),
  ];
  foliageGroup.add(createTrailingVine(1.2, vine3Points, 4, 'Trailing_Vine_Front'));

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
