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
  console.log('Generating Modern White Bookshelf with Center Compartment Cut in Half...');

  const scene = new THREE.Scene();
  scene.name = 'Modern_White_Bookshelf_Collection';

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

  // Overall Dimensions
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
  // 2. TOP CROWN & SOLID CEILING (Seamless interior ceiling with zero gap)
  // =========================================================================
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

  const headerFascia = new THREE.Mesh(
    new THREE.BoxGeometry(innerW, 0.036, boardThick),
    whiteLacquer
  );
  headerFascia.position.set(0, crownBottomY - 0.018, depth / 2 - boardThick / 2);
  crownGroup.add(headerFascia);

  shelfGroup.add(crownGroup);

  // Solid interior ceiling board
  const topCeilingGeo = new THREE.BoxGeometry(innerW, boardThick, depth - 0.01);
  const topCeiling = new THREE.Mesh(topCeilingGeo, whiteLacquer);
  topCeiling.name = 'Solid_Interior_Ceiling_Board';
  topCeiling.position.set(0, crownBottomY - boardThick / 2, 0.005);
  shelfGroup.add(topCeiling);

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
  // 4. SIDE PANELS & AIRTIGHT RECESSED BACKBOARD
  // =========================================================================
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

  const backPanelGeo = new THREE.BoxGeometry(innerW, interiorHeight + 0.02, 0.018);
  const backPanel = new THREE.Mesh(backPanelGeo, backboardMat);
  backPanel.name = 'Recessed_Backboard';
  backPanel.position.set(0, interiorCenterY, -depth / 2 + 0.009);
  shelfGroup.add(backPanel);

  // =========================================================================
  // 5. HELPER: MICRO-LED COVE STRIP ASSEMBLY
  // =========================================================================
  function createLedStripAssembly(width, xPos, yPos, namePrefix) {
    const stripGroup = new THREE.Group();
    stripGroup.name = `${namePrefix}_LED_Assembly`;

    const channelGeo = new THREE.BoxGeometry(width, 0.006, 0.02);
    const channel = new THREE.Mesh(channelGeo, channelMat);
    channel.name = `${namePrefix}_Channel`;
    channel.position.set(xPos, yPos, rearStripZ);
    stripGroup.add(channel);

    const pcbGeo = new THREE.BoxGeometry(width - 0.01, 0.002, 0.014);
    const pcb = new THREE.Mesh(pcbGeo, pcbMat);
    pcb.name = `${namePrefix}_PCB`;
    pcb.position.set(xPos, yPos - 0.003, rearStripZ);
    stripGroup.add(pcb);

    const diodeCount = Math.max(12, Math.floor(width / 0.04));
    const startX = xPos - (width - 0.04) / 2;
    const stepX = (width - 0.04) / (diodeCount - 1);

    const diodeGeo = new THREE.BoxGeometry(0.006, 0.002, 0.006);
    const diodesGroup = new THREE.Group();
    diodesGroup.name = `${namePrefix}_Micro_Diodes`;

    for (let d = 0; d < diodeCount; d++) {
      const diode = new THREE.Mesh(diodeGeo, ledDiodeMat);
      diode.position.set(startX + d * stepX, yPos - 0.004, rearStripZ);
      diodesGroup.add(diode);
    }
    stripGroup.add(diodesGroup);

    const diffuserGeo = new THREE.BoxGeometry(width, 0.004, 0.018);
    const diffuser = new THREE.Mesh(diffuserGeo, diffuserMat);
    diffuser.name = `${namePrefix}_Diffuser`;
    diffuser.position.set(xPos, yPos - 0.0055, rearStripZ);
    stripGroup.add(diffuser);

    return stripGroup;
  }

  // =========================================================================
  // 6. MODERN SHELVING: STRAIGHT CLEAN SHELVES & CENTER COMPARTMENTS CUT IN HALF
  // =========================================================================
  const shelfCount = 3;
  const usableHeight = ceilingBottomY - plinthTopY; // 1.932m
  const tierHeight = (usableHeight - shelfCount * boardThick) / (shelfCount + 1); // 0.456m

  // Shelf Y elevations
  const shelf1Y = plinthTopY + tierHeight + boardThick / 2; // -0.504m (bottom shelf)
  const shelf2Y = shelf1Y + boardThick + tierHeight; // -0.012m (middle center shelf)
  const shelf3Y = shelf2Y + boardThick + tierHeight; // +0.480m (top shelf)

  // Straight, smooth satin white lacquer shelf boards
  const fullShelfGeo = new THREE.BoxGeometry(innerW, boardThick, depth - 0.015);

  // Shelf 1 (Bottom Shelf, y = -0.504m)
  const shelf1 = new THREE.Mesh(fullShelfGeo, whiteLacquer);
  shelf1.name = 'Shelf_Tier_1_Board';
  shelf1.position.set(0, shelf1Y, 0.005);
  shelfGroup.add(shelf1);

  // Shelf 2 (Middle Center Shelf, y = -0.012m)
  const shelf2 = new THREE.Mesh(fullShelfGeo, whiteLacquer);
  shelf2.name = 'Shelf_Tier_2_Middle_Board';
  shelf2.position.set(0, shelf2Y, 0.005);
  shelfGroup.add(shelf2);

  // Shelf 3 (Top Shelf, y = +0.480m)
  const shelf3 = new THREE.Mesh(fullShelfGeo, whiteLacquer);
  shelf3.name = 'Shelf_Tier_3_Top_Board';
  shelf3.position.set(0, shelf3Y, 0.005);
  shelfGroup.add(shelf3);

  // -------------------------------------------------------------------------
  // MODERN STYLING: CUTTING THE CENTER COMPARTMENT IN HALF (Left & Right Niches)
  // -------------------------------------------------------------------------
  const halfNicheWidth = (innerW - boardThick) / 2; // 0.826m
  const leftNicheCenterX = -innerW / 4 - boardThick / 4; // -0.431m
  const rightNicheCenterX = innerW / 4 + boardThick / 4; // +0.431m

  // Vertical divider in Compartment 2 (Upper-center, between Shelf 3 and Shelf 2)
  const dividerGeo = new THREE.BoxGeometry(boardThick, tierHeight - 0.002, depth - 0.02);
  const dividerUpperCenter = new THREE.Mesh(dividerGeo, whiteLacquer);
  dividerUpperCenter.name = 'Center_Compartment_Vertical_Divider_Upper';
  dividerUpperCenter.position.set(0, shelf2Y + boardThick / 2 + tierHeight / 2, 0.005);
  shelfGroup.add(dividerUpperCenter);

  // Vertical divider in Compartment 3 (Lower-center, between Shelf 2 and Shelf 1)
  const dividerLowerCenter = new THREE.Mesh(dividerGeo, whiteLacquer);
  dividerLowerCenter.name = 'Center_Compartment_Vertical_Divider_Lower';
  dividerLowerCenter.position.set(0, shelf1Y + boardThick / 2 + tierHeight / 2, 0.005);
  shelfGroup.add(dividerLowerCenter);

  // -------------------------------------------------------------------------
  // INTEGRATED COVE STRIP LIGHTING FOR ALL COMPARTMENTS
  // -------------------------------------------------------------------------
  // 1. Top compartment (full width, under ceiling board)
  const topStripY = ceilingBottomY - 0.004;
  shelfGroup.add(createLedStripAssembly(innerW * 0.94, 0, topStripY, 'Top_Compartment'));

  // 2. Upper-center compartments (Left & Right half niches under Shelf 3)
  const tier2StripY = shelf3Y - boardThick / 2 - 0.003;
  shelfGroup.add(createLedStripAssembly(halfNicheWidth * 0.92, leftNicheCenterX, tier2StripY, 'Tier_2_Left_Niche'));
  shelfGroup.add(createLedStripAssembly(halfNicheWidth * 0.92, rightNicheCenterX, tier2StripY, 'Tier_2_Right_Niche'));

  // 3. Lower-center compartments (Left & Right half niches under Shelf 2)
  const tier3StripY = shelf2Y - boardThick / 2 - 0.003;
  shelfGroup.add(createLedStripAssembly(halfNicheWidth * 0.92, leftNicheCenterX, tier3StripY, 'Tier_3_Left_Niche'));
  shelfGroup.add(createLedStripAssembly(halfNicheWidth * 0.92, rightNicheCenterX, tier3StripY, 'Tier_3_Right_Niche'));

  // 4. Bottom compartment (full width, under Shelf 1)
  const tier4StripY = shelf1Y - boardThick / 2 - 0.003;
  shelfGroup.add(createLedStripAssembly(innerW * 0.94, 0, tier4StripY, 'Bottom_Compartment'));

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

  console.log('Modern White Bookshelf Generated Successfully!');
}

generateBookshelfModel().catch(console.error);
