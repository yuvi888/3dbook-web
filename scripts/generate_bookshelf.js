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

async function generateBookshelfModel() {
  console.log('Generating 3D Modern White Bookshelf Model...');

  const scene = new THREE.Scene();
  scene.name = 'Modern_White_Bookshelf_Collection';

  // =========================================================================
  // 1. PBR MATERIALS
  // =========================================================================
  // Pure Architectural Satin White Lacquer
  const whiteLacquer = new THREE.MeshStandardMaterial({
    name: 'White_Satin_Lacquer',
    color: new THREE.Color('#faf9f6'),
    roughness: 0.28,
    metalness: 0.02,
  });

  // Soft Warm Off-White Backboard
  const backboardMat = new THREE.MeshStandardMaterial({
    name: 'Warm_Backboard',
    color: new THREE.Color('#f4ede2'),
    roughness: 0.45,
    metalness: 0.01,
  });

  // Minimal Strip Light Material (Very gentle, subtle warm glow — NOT max glow)
  const minimalStripLight = new THREE.MeshStandardMaterial({
    name: 'Minimal_Warm_LED_Strip',
    color: new THREE.Color('#fffbf0'),
    emissive: new THREE.Color('#ffe8ba'),
    emissiveIntensity: 0.35, // Subtle, soft minimal glow
    roughness: 0.5,
    metalness: 0.0,
  });

  // Slim Brushed Brass Accents
  const brassAccent = new THREE.MeshStandardMaterial({
    name: 'Brushed_Brass_Accent',
    color: new THREE.Color('#d4af37'),
    roughness: 0.25,
    metalness: 0.85,
  });

  // Root Bookshelf Group
  const shelfGroup = new THREE.Group();
  shelfGroup.name = 'Bookshelf_Unit';

  // Dimensions
  const totalW = 1.8;
  const totalH = 2.1;
  const depth = 0.38;
  const boardThick = 0.038;

  const innerW = totalW - boardThick * 2;
  const innerH = totalH - boardThick * 2;

  // =========================================================================
  // 2. OUTER CABINET FRAME
  // =========================================================================
  // Top Crown Header (Stepped modern profile)
  const topCrownGeo = new THREE.BoxGeometry(totalW + 0.06, boardThick * 1.3, depth + 0.03);
  const topCrown = new THREE.Mesh(topCrownGeo, whiteLacquer);
  topCrown.name = 'Top_Crown_Molding';
  topCrown.position.set(0, totalH / 2 - boardThick * 0.65, 0.015);
  topCrown.castShadow = true;
  shelfGroup.add(topCrown);

  // Bottom Base Plinth (Recessed clean architectural base)
  const plinthGeo = new THREE.BoxGeometry(totalW + 0.03, boardThick * 1.4, depth + 0.02);
  const plinth = new THREE.Mesh(plinthGeo, whiteLacquer);
  plinth.name = 'Base_Plinth';
  plinth.position.set(0, -totalH / 2 + boardThick * 0.7, 0.01);
  shelfGroup.add(plinth);

  // Left Outer Upright Board
  const leftSideGeo = new THREE.BoxGeometry(boardThick, totalH - boardThick * 2.7, depth);
  const leftSide = new THREE.Mesh(leftSideGeo, whiteLacquer);
  leftSide.name = 'Left_Upright_Panel';
  leftSide.position.set(-totalW / 2 + boardThick / 2, 0, 0);
  leftSide.castShadow = true;
  shelfGroup.add(leftSide);

  // Right Outer Upright Board
  const rightSideGeo = new THREE.BoxGeometry(boardThick, totalH - boardThick * 2.7, depth);
  const rightSide = new THREE.Mesh(rightSideGeo, whiteLacquer);
  rightSide.name = 'Right_Upright_Panel';
  rightSide.position.set(totalW / 2 - boardThick / 2, 0, 0);
  rightSide.castShadow = true;
  shelfGroup.add(rightSide);

  // Recessed Back Panel
  const backPanelGeo = new THREE.BoxGeometry(innerW, innerH - boardThick * 0.7, 0.015);
  const backPanel = new THREE.Mesh(backPanelGeo, backboardMat);
  backPanel.name = 'Recessed_Backboard';
  backPanel.position.set(0, 0, -depth / 2 + 0.01);
  shelfGroup.add(backPanel);

  // =========================================================================
  // 3. HORIZONTAL SHELF TIERS & MINIMAL EMBEDDED STRIP LIGHTS
  // =========================================================================
  const shelfCount = 4; // 4 shelves = 5 display tiers
  const tierHeight = (innerH - boardThick * 0.7) / (shelfCount + 1);

  for (let i = 0; i < shelfCount; i++) {
    const shelfY = -totalH / 2 + boardThick * 1.4 + (i + 1) * tierHeight;

    // A. Main Horizontal Shelf Board
    const shelfBoardGeo = new THREE.BoxGeometry(innerW, boardThick, depth - 0.015);
    const shelfBoard = new THREE.Mesh(shelfBoardGeo, whiteLacquer);
    shelfBoard.name = `Shelf_Tier_${i + 1}_Board`;
    shelfBoard.position.set(0, shelfY, 0.005);
    shelfBoard.castShadow = true;
    shelfBoard.receiveShadow = true;
    shelfGroup.add(shelfBoard);

    // B. Recessed Channel Profile for LED Strip
    const channelGeo = new THREE.BoxGeometry(innerW * 0.92, 0.006, 0.024);
    const channel = new THREE.Mesh(channelGeo, brassAccent);
    channel.name = `Shelf_Tier_${i + 1}_LED_Channel`;
    channel.position.set(0, shelfY - boardThick / 2 - 0.003, depth / 2 - 0.07);
    shelfGroup.add(channel);

    // C. Minimal Warm Glow Strip Light Diffuser (Embedded inside the channel)
    const stripGeo = new THREE.BoxGeometry(innerW * 0.90, 0.003, 0.018);
    const strip = new THREE.Mesh(stripGeo, minimalStripLight);
    strip.name = `Shelf_Tier_${i + 1}_Minimal_Strip_Light`;
    strip.position.set(0, shelfY - boardThick / 2 - 0.006, depth / 2 - 0.07);
    shelfGroup.add(strip);
  }

  // Top Compartment LED Strip (under the top crown header)
  const topStripGeo = new THREE.BoxGeometry(innerW * 0.90, 0.003, 0.018);
  const topStrip = new THREE.Mesh(topStripGeo, minimalStripLight);
  topStrip.name = 'Top_Compartment_Minimal_Strip_Light';
  topStrip.position.set(0, totalH / 2 - boardThick * 1.3 - 0.004, depth / 2 - 0.07);
  shelfGroup.add(topStrip);

  // =========================================================================
  // 4. ELEGANT VERTICAL ASYMMETRIC DIVIDERS (Modern Design Touch)
  // =========================================================================
  // Mid-upper divider
  const midDividerGeo = new THREE.BoxGeometry(boardThick * 0.8, tierHeight - boardThick, depth * 0.85);
  const midDivider = new THREE.Mesh(midDividerGeo, whiteLacquer);
  midDivider.name = 'Asymmetric_Divider_Tier_3';
  midDivider.position.set(0.28, -totalH / 2 + boardThick * 1.4 + 3.5 * tierHeight, 0.01);
  shelfGroup.add(midDivider);

  // Lower-left divider
  const lowDividerGeo = new THREE.BoxGeometry(boardThick * 0.8, tierHeight - boardThick, depth * 0.85);
  const lowDivider = new THREE.Mesh(lowDividerGeo, whiteLacquer);
  lowDivider.name = 'Asymmetric_Divider_Tier_1';
  lowDivider.position.set(-0.35, -totalH / 2 + boardThick * 1.4 + 1.5 * tierHeight, 0.01);
  shelfGroup.add(lowDivider);

  scene.add(shelfGroup);

  // =========================================================================
  // 5. EXPORT AS BINARY .GLB & GLTF
  // =========================================================================
  const outputDir = path.join(__dirname, '..', 'public', 'models');
  fs.mkdirSync(outputDir, { recursive: true });

  const exporter = new GLTFExporter();

  // Export Binary .GLB
  console.log('Exporting binary .glb file...');
  const glbBuffer = await exporter.parseAsync(scene, { binary: true });
  const glbPath = path.join(outputDir, 'bookshelf_minimal_white.glb');
  fs.writeFileSync(glbPath, Buffer.from(glbBuffer));
  const glbSize = (fs.statSync(glbPath).size / 1024).toFixed(1);
  console.log(`Saved ${glbPath} (${glbSize} KB)`);

  // Export Human-Readable .GLTF
  console.log('Exporting readable .gltf file...');
  const gltfJson = await exporter.parseAsync(scene, { binary: false });
  const gltfPath = path.join(outputDir, 'bookshelf_minimal_white.gltf');
  fs.writeFileSync(gltfPath, JSON.stringify(gltfJson, null, 2));
  const gltfSize = (fs.statSync(gltfPath).size / 1024).toFixed(1);
  console.log(`Saved ${gltfPath} (${gltfSize} KB)`);

  console.log('3D Bookshelf Model Generated Successfully!');
}

generateBookshelfModel().catch(console.error);
