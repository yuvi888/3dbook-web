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
  console.log('Generating Bookshelf with Curved Designer Shelves & Seamless Ceiling...');

  const scene = new THREE.Scene();
  scene.name = 'Minimalist_White_Bookshelf_Collection';

  // =========================================================================
  // 1. PBR MATERIALS
  // =========================================================================
  const whiteLacquer = new THREE.MeshStandardMaterial({
    name: 'White_Satin_Lacquer',
    color: new THREE.Color('#faf9f6'),
    roughness: 0.25,
    metalness: 0.01,
  });

  const backboardMat = new THREE.MeshStandardMaterial({
    name: 'Warm_Backboard',
    color: new THREE.Color('#fbf0e2'),
    roughness: 0.45,
    metalness: 0.01,
  });

  const ledDiodeMat = new THREE.MeshStandardMaterial({
    name: 'Micro_LED_Diode_Chip',
    color: new THREE.Color('#ffffff'),
    emissive: new THREE.Color('#ffdfa0'),
    emissiveIntensity: 2.8,
    roughness: 0.1,
    metalness: 0.0,
  });

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

  const pcbMat = new THREE.MeshStandardMaterial({
    name: 'LED_PCB_Backing',
    color: new THREE.Color('#ffffff'),
    roughness: 0.6,
    metalness: 0.05,
  });

  const channelMat = new THREE.MeshStandardMaterial({
    name: 'Aluminum_LED_Channel',
    color: new THREE.Color('#dedede'),
    roughness: 0.3,
    metalness: 0.4,
  });

  // Root Bookshelf Group
  const shelfGroup = new THREE.Group();
  shelfGroup.name = 'Bookshelf_Unit';

  // Dimensions
  const totalW = 1.76;
  const totalH = 2.08;
  const depth = 0.38;
  const boardThick = 0.036;

  const innerW = totalW - boardThick * 2; // 1.688m
  const rearStripZ = -depth / 2 + 0.038; // -0.152m

  // Key architectural reference levels
  const crownBottomY = totalH / 2 - 0.05; // +0.990m
  const plinthTopY = -totalH / 2 + 0.062; // -0.978m
  const interiorHeight = crownBottomY - plinthTopY; // 1.968m
  const interiorCenterY = (crownBottomY + plinthTopY) / 2; // +0.006m

  // =========================================================================
  // 2. TOP CROWN & SOLID CEILING (Fixes the gap/space at top of shelf 1)
  // =========================================================================
  const crownGroup = new THREE.Group();
  crownGroup.name = 'Top_Crown_Assembly';

  // Cornice upper stepped molding
  const crownTop = new THREE.Mesh(
    new THREE.BoxGeometry(totalW + 0.08, 0.024, depth + 0.05),
    whiteLacquer
  );
  crownTop.position.set(0, totalH / 2 - 0.012, 0.015);
  crownTop.castShadow = true;
  crownGroup.add(crownTop);

  // Cornice middle molding
  const crownMid = new THREE.Mesh(
    new THREE.BoxGeometry(totalW + 0.04, 0.026, depth + 0.03),
    whiteLacquer
  );
  crownMid.position.set(0, totalH / 2 - 0.037, 0.008);
  crownMid.castShadow = true;
  crownGroup.add(crownMid);

  // Front Header Fascia Trim (seamless transition under crown)
  const headerFascia = new THREE.Mesh(
    new THREE.BoxGeometry(innerW, 0.036, boardThick),
    whiteLacquer
  );
  headerFascia.position.set(0, crownBottomY - 0.018, depth / 2 - boardThick / 2);
  crownGroup.add(headerFascia);

  shelfGroup.add(crownGroup);

  // SOLID INTERIOR TOP CEILING BOARD (Completely encloses interior ceiling, zero gap!)
  const topCeilingGeo = new THREE.BoxGeometry(innerW, boardThick, depth - 0.01);
  const topCeiling = new THREE.Mesh(topCeilingGeo, whiteLacquer);
  topCeiling.name = 'Solid_Interior_Ceiling_Board';
  topCeiling.position.set(0, crownBottomY - boardThick / 2, 0.005);
  shelfGroup.add(topCeiling);

  // Bottom face of top ceiling board
  const ceilingBottomY = crownBottomY - boardThick; // +0.954m

  // =========================================================================
  // 3. BASE PLINTH
  // =========================================================================
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

  // =========================================================================
  // 4. SIDE UPRIGHT PANELS & AIRTIGHT RECESSED BACKBOARD
  // =========================================================================
  // Left and Right panels fit perfectly between plinth top and crown bottom
  const uprightGeo = new THREE.BoxGeometry(boardThick, interiorHeight, depth);

  const leftSide = new THREE.Mesh(uprightGeo, whiteLacquer);
  leftSide.name = 'Left_Upright_Panel';
  leftSide.position.set(-totalW / 2 + boardThick / 2, interiorCenterY, 0);
  leftSide.castShadow = true;
  shelfGroup.add(leftSide);

  const rightSide = new THREE.Mesh(uprightGeo, whiteLacquer);
  rightSide.name = 'Right_Upright_Panel';
  rightSide.position.set(totalW / 2 - boardThick / 2, interiorCenterY, 0);
  rightSide.castShadow = true;
  shelfGroup.add(rightSide);

  // Recessed backboard overlaps behind ceiling board and plinth — 100% gap-free!
  const backPanelGeo = new THREE.BoxGeometry(innerW, interiorHeight + 0.02, 0.018);
  const backPanel = new THREE.Mesh(backPanelGeo, backboardMat);
  backPanel.name = 'Recessed_Backboard';
  backPanel.position.set(0, interiorCenterY, -depth / 2 + 0.009);
  shelfGroup.add(backPanel);

  // =========================================================================
  // 5. HELPER: REALISTIC FULL-WIDTH MICRO-LED STRIP LIGHT ASSEMBLY
  // (Maintained exactly as requested - perfect strip lights with diodes)
  // =========================================================================
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

    // 3. Array of 38 Micro-LED Diode Chips across the shelf width
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

  // =========================================================================
  // 6. CURVED DESIGNER SHELVES (3 Shelves with graceful architectural curves)
  // =========================================================================
  const shelfCount = 3;
  const usableHeight = ceilingBottomY - plinthTopY; // 1.932m
  const tierHeight = (usableHeight - shelfCount * boardThick) / (shelfCount + 1); // 0.456m

  // Helper to construct an architectural shelf with an organic curved front edge
  function createCurvedShelfGeometry(width, shelfDepth, curveOffset) {
    const shape = new THREE.Shape();
    const halfW = width / 2;
    const backZ = -shelfDepth / 2 + 0.01; // Straight rear edge fits flush to backboard
    const frontZ = shelfDepth / 2 - 0.01;

    shape.moveTo(-halfW, backZ);
    shape.lineTo(halfW, backZ);
    shape.lineTo(halfW, frontZ);
    // Smooth quadratic curve bowing forward in the center
    shape.quadraticCurveTo(0, frontZ + curveOffset, -halfW, frontZ);
    shape.closePath();

    const extrudeSettings = {
      steps: 1,
      depth: boardThick,
      bevelEnabled: true,
      bevelThickness: 0.004,
      bevelSize: 0.004,
      bevelSegments: 4,
    };

    const geo = new THREE.ExtrudeGeometry(shape, extrudeSettings);
    // Rotate +PI/2 so extrusion depth aligns vertically with Y, back stays at -Z, curve at +Z
    geo.rotateX(Math.PI / 2);
    return geo;
  }

  // Helper to create architectural curved brackets (corbels) under shelf ends
  function createCorbelBracket(isLeft) {
    const shape = new THREE.Shape();
    const h = 0.09;
    const d = 0.16;
    shape.moveTo(0, 0);
    shape.lineTo(0, -h);
    shape.quadraticCurveTo(d * 0.45, -h * 0.4, d, 0);
    shape.closePath();

    const geo = new THREE.ExtrudeGeometry(shape, {
      steps: 1,
      depth: 0.022,
      bevelEnabled: true,
      bevelThickness: 0.002,
      bevelSize: 0.002,
      bevelSegments: 3,
    });
    // Align horizontally
    geo.rotateY(isLeft ? Math.PI / 2 : -Math.PI / 2);
    return geo;
  }

  // Shelf 1 (Bottom Shelf, y = -0.504m) - Gentle bow curve (+3.5cm)
  const shelf1Y = plinthTopY + tierHeight + boardThick / 2; // -0.504m
  const shelf1Geo = createCurvedShelfGeometry(innerW, depth, 0.035);
  const shelf1 = new THREE.Mesh(shelf1Geo, whiteLacquer);
  shelf1.name = 'Shelf_Tier_1_Curved_Board';
  shelf1.position.set(0, shelf1Y + boardThick / 2, 0);
  shelfGroup.add(shelf1);

  const strip1 = createLedStripAssembly(innerW * 0.94, shelf1Y - boardThick / 2 - 0.003, 'Shelf_Tier_1');
  shelfGroup.add(strip1);

  // Shelf 2 (Centerpiece Shelf, y = -0.012m) - Hero sculpted bow curve (+5.5cm) + designer corbel brackets!
  const shelf2Y = shelf1Y + boardThick + tierHeight; // -0.012m
  const shelf2Geo = createCurvedShelfGeometry(innerW, depth, 0.055);
  const shelf2 = new THREE.Mesh(shelf2Geo, whiteLacquer);
  shelf2.name = 'Shelf_Tier_2_Hero_Curved_Board';
  shelf2.position.set(0, shelf2Y + boardThick / 2, 0);
  shelfGroup.add(shelf2);

  // Architectural curved brackets supporting the center hero shelf
  const leftCorbel = new THREE.Mesh(createCorbelBracket(true), whiteLacquer);
  leftCorbel.name = 'Left_Corbel_Bracket';
  leftCorbel.position.set(-innerW / 2 + 0.012, shelf2Y - boardThick / 2, 0.02);
  shelfGroup.add(leftCorbel);

  const rightCorbel = new THREE.Mesh(createCorbelBracket(false), whiteLacquer);
  rightCorbel.name = 'Right_Corbel_Bracket';
  rightCorbel.position.set(innerW / 2 - 0.012, shelf2Y - boardThick / 2, 0.02);
  shelfGroup.add(rightCorbel);

  const strip2 = createLedStripAssembly(innerW * 0.94, shelf2Y - boardThick / 2 - 0.003, 'Shelf_Tier_2');
  shelfGroup.add(strip2);

  // Shelf 3 (Top Shelf, y = +0.480m) - Gentle bow curve (+3.5cm)
  const shelf3Y = shelf2Y + boardThick + tierHeight; // +0.480m
  const shelf3Geo = createCurvedShelfGeometry(innerW, depth, 0.035);
  const shelf3 = new THREE.Mesh(shelf3Geo, whiteLacquer);
  shelf3.name = 'Shelf_Tier_3_Curved_Board';
  shelf3.position.set(0, shelf3Y + boardThick / 2, 0);
  shelfGroup.add(shelf3);

  const strip3 = createLedStripAssembly(innerW * 0.94, shelf3Y - boardThick / 2 - 0.003, 'Shelf_Tier_3');
  shelfGroup.add(strip3);

  // Top Compartment Micro-LED Strip (snug under the solid top ceiling board)
  const topStripY = ceilingBottomY - 0.004;
  const topStripAssembly = createLedStripAssembly(innerW * 0.94, topStripY, 'Top_Compartment');
  shelfGroup.add(topStripAssembly);

  scene.add(shelfGroup);

  // =========================================================================
  // 7. EXPORT TO .GLB AND .GLTF
  // =========================================================================
  const outputDir = path.join(__dirname, '..', 'public', 'models');
  fs.mkdirSync(outputDir, { recursive: true });

  const exporter = new GLTFExporter();

  console.log('Exporting binary .glb file...');
  const glbBuffer = await exporter.parseAsync(scene, { binary: true });
  const glbPath = path.join(outputDir, 'bookshelf_minimal_white.glb');
  fs.writeFileSync(glbPath, Buffer.from(glbBuffer));
  const glbSize = (fs.statSync(glbPath).size / 1024).toFixed(1);
  console.log(`Saved ${glbPath} (${glbSize} KB)`);

  console.log('Exporting readable .gltf file...');
  const gltfJson = await exporter.parseAsync(scene, { binary: false });
  const gltfPath = path.join(outputDir, 'bookshelf_minimal_white.gltf');
  fs.writeFileSync(gltfPath, JSON.stringify(gltfJson, null, 2));
  const gltfSize = (fs.statSync(gltfPath).size / 1024).toFixed(1);
  console.log(`Saved ${gltfPath} (${gltfSize} KB)`);

  console.log('Bookshelf with Designer Curved Shelves Generated Successfully!');
}

generateBookshelfModel().catch(console.error);
