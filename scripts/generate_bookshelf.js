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
  console.log('Generating Bookshelf: 3 Main Tiers with Double-Height Split Center...');

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
  // 6. MODERN ARCHITECTURAL LAYOUT:
  // 3 MAIN TIERS WITH DOUBLE-HEIGHT CENTER CUT IN HALF (2 GRAND VERTICAL NICHES)
  // =========================================================================
  const usableHeight = ceilingBottomY - plinthTopY; // 1.932m
  // 2 full horizontal shelves divide the space into:
  // Top tier (1 unit), Center tier (2 units = DOUBLE HEIGHT), Bottom tier (1 unit)
  const unitHeight = (usableHeight - 2 * boardThick) / 4; // 0.465m
  const topTierHeight = unitHeight; // 0.465m
  const bottomTierHeight = unitHeight; // 0.465m
  const centerDoubleHeight = unitHeight * 2; // 0.930m (DOUBLE HEIGHT!)

  // Two horizontal shelves
  const topShelfY = ceilingBottomY - topTierHeight - boardThick / 2; // +0.471m
  const bottomShelfY = plinthTopY + bottomTierHeight + boardThick / 2; // -0.495m

  const fullShelfGeo = new THREE.BoxGeometry(innerW, boardThick, depth - 0.015);

  // Top Shelf (under top compartment)
  const topShelf = new THREE.Mesh(fullShelfGeo, whiteLacquer);
  topShelf.name = 'Top_Horizontal_Shelf';
  topShelf.position.set(0, topShelfY, 0.005);
  shelfGroup.add(topShelf);

  // Bottom Shelf (above bottom compartment)
  const bottomShelf = new THREE.Mesh(fullShelfGeo, whiteLacquer);
  bottomShelf.name = 'Bottom_Horizontal_Shelf';
  bottomShelf.position.set(0, bottomShelfY, 0.005);
  shelfGroup.add(bottomShelf);

  // -------------------------------------------------------------------------
  // VERTICAL CENTER DIVIDER (Cuts the double-height center compartment in half)
  // Creating two magnificent tall gallery display niches for decoration objects!
  // -------------------------------------------------------------------------
  const centerDividerHeight = centerDoubleHeight - 0.002; // 0.928m tall
  const centerDividerCenterY = (topShelfY - boardThick / 2 + bottomShelfY + boardThick / 2) / 2; // -0.012m

  const centerDividerGeo = new THREE.BoxGeometry(boardThick, centerDividerHeight, depth - 0.02);
  const centerDivider = new THREE.Mesh(centerDividerGeo, whiteLacquer);
  centerDivider.name = 'Center_Double_Height_Vertical_Divider';
  centerDivider.position.set(0, centerDividerCenterY, 0.005);
  shelfGroup.add(centerDivider);

  // Dimensions of each half niche in the double-height center:
  const halfNicheWidth = (innerW - boardThick) / 2; // 0.826m wide x 0.930m tall!
  const leftNicheCenterX = -innerW / 4 - boardThick / 4; // -0.431m
  const rightNicheCenterX = innerW / 4 + boardThick / 4; // +0.431m

  // -------------------------------------------------------------------------
  // COVE STRIP LIGHTING FOR THE 3-TIER DOUBLE-HEIGHT LAYOUT
  // -------------------------------------------------------------------------
  // 1. Top compartment (full-width, under ceiling)
  const topStripY = ceilingBottomY - 0.004;
  shelfGroup.add(createLedStripAssembly(innerW * 0.94, 0, topStripY, 'Top_Compartment'));

  // 2. Center Double-Height Niches (Left & Right niches, under Top Shelf)
  const centerStripY = topShelfY - boardThick / 2 - 0.003;
  shelfGroup.add(createLedStripAssembly(halfNicheWidth * 0.92, leftNicheCenterX, centerStripY, 'Center_Left_Double_Height_Niche'));
  shelfGroup.add(createLedStripAssembly(halfNicheWidth * 0.92, rightNicheCenterX, centerStripY, 'Center_Right_Double_Height_Niche'));

  // 3. Bottom compartment (full-width, under Bottom Shelf)
  const bottomStripY = bottomShelfY - boardThick / 2 - 0.003;
  shelfGroup.add(createLedStripAssembly(innerW * 0.94, 0, bottomStripY, 'Bottom_Compartment'));

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

  console.log('Bookshelf with Double-Height Split Center Generated Successfully!');
}

generateBookshelfModel().catch(console.error);
