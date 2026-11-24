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
  console.log('Generating Real-Scale White Bookshelf with Micro-LED Diodes Strip Lights...');

  const scene = new THREE.Scene();
  scene.name = 'Minimalist_White_Bookshelf_Collection';

  // =========================================================================
  // 1. PBR MATERIALS
  // =========================================================================
  // Pure Architectural White Satin Lacquer (clean, smooth finish matching reference)
  const whiteLacquer = new THREE.MeshStandardMaterial({
    name: 'White_Satin_Lacquer',
    color: new THREE.Color('#faf9f6'),
    roughness: 0.25,
    metalness: 0.01,
  });

  // Warm Ivory / Soft Peach Backboard (matches reference photo ambiance)
  const backboardMat = new THREE.MeshStandardMaterial({
    name: 'Warm_Backboard',
    color: new THREE.Color('#fbf0e2'),
    roughness: 0.45,
    metalness: 0.01,
  });

  // Micro LED Diode Chip (realistic bright warm LED emitter)
  const ledDiodeMat = new THREE.MeshStandardMaterial({
    name: 'Micro_LED_Diode_Chip',
    color: new THREE.Color('#ffffff'),
    emissive: new THREE.Color('#ffdfa0'),
    emissiveIntensity: 2.8,
    roughness: 0.1,
    metalness: 0.0,
  });

  // Translucent Frosted Diffuser Strip (soft warm diffused light)
  const diffuserMat = new THREE.MeshStandardMaterial({
    name: 'Frosted_LED_Diffuser',
    color: new THREE.Color('#fffbf2'),
    emissive: new THREE.Color('#ffdfa8'),
    emissiveIntensity: 0.75,
    roughness: 0.35,
    metalness: 0.0,
    transparent: true,
    opacity: 0.9,
  });

  // PCB Strip Ribbon
  const pcbMat = new THREE.MeshStandardMaterial({
    name: 'LED_PCB_Backing',
    color: new THREE.Color('#ffffff'),
    roughness: 0.6,
    metalness: 0.05,
  });

  // Slim Brushed Aluminum Channel
  const channelMat = new THREE.MeshStandardMaterial({
    name: 'Aluminum_LED_Channel',
    color: new THREE.Color('#dedede'),
    roughness: 0.3,
    metalness: 0.4,
  });

  // Root Bookshelf Group
  const shelfGroup = new THREE.Group();
  shelfGroup.name = 'Bookshelf_Unit';

  // Dimensions matching reference photo
  const totalW = 1.76;
  const totalH = 2.08;
  const depth = 0.38;
  const boardThick = 0.036;

  const innerW = totalW - boardThick * 2;
  const innerH = totalH - boardThick * 2;

  // Rear position for the LED strip (tucked just in front of backboard)
  const rearStripZ = -depth / 2 + 0.038;

  // =========================================================================
  // 2. OUTER CABINET FRAME (Matching reference crown & plinth)
  // =========================================================================
  // Top Crown Molding (Stepped architectural cornice)
  const crownGroup = new THREE.Group();
  crownGroup.name = 'Top_Crown_Assembly';

  const crownTop = new THREE.Mesh(
    new THREE.BoxGeometry(totalW + 0.08, 0.024, depth + 0.05),
    whiteLacquer
  );
  crownTop.position.set(0, totalH / 2 - 0.012, 0.015);
  crownTop.castShadow = true;
  crownGroup.add(crownTop);

  const crownMid = new THREE.Mesh(
    new THREE.BoxGeometry(totalW + 0.04, 0.026, depth + 0.03),
    whiteLacquer
  );
  crownMid.position.set(0, totalH / 2 - 0.037, 0.008);
  crownMid.castShadow = true;
  crownGroup.add(crownMid);

  shelfGroup.add(crownGroup);

  // Bottom Base Plinth (Stepped architectural base)
  const plinthGroup = new THREE.Group();
  plinthGroup.name = 'Base_Plinth_Assembly';

  const plinthBase = new THREE.Mesh(
    new THREE.BoxGeometry(totalW + 0.05, 0.038, depth + 0.03),
    whiteLacquer
  );
  plinthBase.position.set(0, -totalH / 2 + 0.019, 0.01);
  plinthGroup.add(plinthBase);

  const plinthStep = new THREE.Mesh(
    new THREE.BoxGeometry(totalW + 0.02, 0.024, depth + 0.015),
    whiteLacquer
  );
  plinthStep.position.set(0, -totalH / 2 + 0.05, 0.005);
  plinthGroup.add(plinthStep);

  shelfGroup.add(plinthGroup);

  // Left Outer Upright Board
  const leftSideGeo = new THREE.BoxGeometry(boardThick, totalH - 0.12, depth);
  const leftSide = new THREE.Mesh(leftSideGeo, whiteLacquer);
  leftSide.name = 'Left_Upright_Panel';
  leftSide.position.set(-totalW / 2 + boardThick / 2, -0.005, 0);
  leftSide.castShadow = true;
  shelfGroup.add(leftSide);

  // Right Outer Upright Board
  const rightSideGeo = new THREE.BoxGeometry(boardThick, totalH - 0.12, depth);
  const rightSide = new THREE.Mesh(rightSideGeo, whiteLacquer);
  rightSide.name = 'Right_Upright_Panel';
  rightSide.position.set(totalW / 2 - boardThick / 2, -0.005, 0);
  rightSide.castShadow = true;
  shelfGroup.add(rightSide);

  // Recessed Back Panel (clean ivory surface that catches the warm LED glow)
  const backPanelGeo = new THREE.BoxGeometry(innerW, innerH - 0.06, 0.015);
  const backPanel = new THREE.Mesh(backPanelGeo, backboardMat);
  backPanel.name = 'Recessed_Backboard';
  backPanel.position.set(0, -0.005, -depth / 2 + 0.01);
  shelfGroup.add(backPanel);

  // =========================================================================
  // 3. HORIZONTAL SHELVES (3 shelves = 4 spacious open tiers like reference)
  // =========================================================================
  const shelfCount = 3; // 3 shelves = 4 tiers (exact match to reference photo)
  const usableHeight = innerH - 0.1;
  const tierHeight = usableHeight / (shelfCount + 1);

  // Helper to build a complete realistic micro-LED strip assembly with visible diodes
  function createLedStripAssembly(width, yPos, namePrefix) {
    const stripGroup = new THREE.Group();
    stripGroup.name = `${namePrefix}_LED_Assembly`;

    // 1. Aluminum Channel
    const channelGeo = new THREE.BoxGeometry(width, 0.006, 0.02);
    const channel = new THREE.Mesh(channelGeo, channelMat);
    channel.name = `${namePrefix}_Channel`;
    channel.position.set(0, yPos, rearStripZ);
    stripGroup.add(channel);

    // 2. White PCB Ribbon
    const pcbGeo = new THREE.BoxGeometry(width - 0.01, 0.002, 0.014);
    const pcb = new THREE.Mesh(pcbGeo, pcbMat);
    pcb.name = `${namePrefix}_PCB`;
    pcb.position.set(0, yPos - 0.003, rearStripZ);
    stripGroup.add(pcb);

    // 3. Array of Micro-LED Diode Chips along the entire width
    // Spaced every 3.8 cm across the shelf (38 distinct diodes per shelf)
    const diodeCount = 38;
    const startX = -(width - 0.06) / 2;
    const stepX = (width - 0.06) / (diodeCount - 1);

    const diodeGeo = new THREE.BoxGeometry(0.006, 0.002, 0.006);
    const diodesGroup = new THREE.Group();
    diodesGroup.name = `${namePrefix}_Micro_Diodes`;

    for (let d = 0; d < diodeCount; d++) {
      const diode = new THREE.Mesh(diodeGeo, ledDiodeMat);
      diode.position.set(startX + d * stepX, yPos - 0.004, rearStripZ);
      diodesGroup.add(diode);
    }
    stripGroup.add(diodesGroup);

    // 4. Frosted Translucent Silicone Diffuser Cover
    const diffuserGeo = new THREE.BoxGeometry(width, 0.004, 0.018);
    const diffuser = new THREE.Mesh(diffuserGeo, diffuserMat);
    diffuser.name = `${namePrefix}_Diffuser`;
    diffuser.position.set(0, yPos - 0.0055, rearStripZ);
    stripGroup.add(diffuser);

    return stripGroup;
  }

  // Shelf boards & Strips
  for (let i = 0; i < shelfCount; i++) {
    const shelfY = -totalH / 2 + 0.08 + (i + 1) * tierHeight;

    // A. Main Horizontal Shelf Board (clean, smooth white satin lacquer)
    const shelfBoardGeo = new THREE.BoxGeometry(innerW, boardThick, depth - 0.015);
    const shelfBoard = new THREE.Mesh(shelfBoardGeo, whiteLacquer);
    shelfBoard.name = `Shelf_Tier_${i + 1}_Board`;
    shelfBoard.position.set(0, shelfY, 0.005);
    shelfGroup.add(shelfBoard);

    // B. Micro-LED Strip Assembly tucked under the rear edge of this shelf
    const stripUnderShelf = createLedStripAssembly(
      innerW * 0.94,
      shelfY - boardThick / 2 - 0.003,
      `Shelf_Tier_${i + 1}`
    );
    shelfGroup.add(stripUnderShelf);
  }

  // Top Compartment Micro-LED Strip (under the top crown molding at rear)
  const topStripY = totalH / 2 - 0.052;
  const topStripAssembly = createLedStripAssembly(
    innerW * 0.94,
    topStripY,
    'Top_Compartment'
  );
  shelfGroup.add(topStripAssembly);

  scene.add(shelfGroup);

  // =========================================================================
  // 4. EXPORT TO .GLB AND .GLTF
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

  console.log('Done! White Bookshelf with Micro-LED Strips generated successfully.');
}

generateBookshelfModel().catch(console.error);
