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
  console.log('Generating Modern Designer Bookshelf with Asymmetric Gallery Layout...');

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

    const diodeCount = Math.max(8, Math.floor(width / 0.04));
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
  // 6. MODERN DESIGNER INTERIOR LAYOUT (Asymmetrical Architectural Gallery)
  // =========================================================================
  // Horizontal shelf elevations:
  // Top horizontal shelf dividing Top Tier from Middle section
  const shelfTopY = 0.480;
  // Bottom horizontal shelf dividing Middle section from Bottom Tier
  const shelfBottomY = -0.504;

  // Primary Vertical Divider X coordinate (asymmetric 38% / 62% ratio)
  // Left column width = 0.62m; Right column width = 1.032m
  const colDividerX = -innerW / 2 + 0.62 + boardThick / 2; // -0.206m

  // Left column center X and Right column center X:
  const leftColCenterX = -innerW / 2 + 0.62 / 2; // -0.534m
  const rightColCenterX = colDividerX + boardThick / 2 + 1.032 / 2; // +0.328m

  // -------------------------------------------------------------------------
  // A. FULL HORIZONTAL SHELVES (Top & Bottom spans)
  // -------------------------------------------------------------------------
  const fullShelfGeo = new THREE.BoxGeometry(innerW, boardThick, depth - 0.015);

  const topHorizontalShelf = new THREE.Mesh(fullShelfGeo, whiteLacquer);
  topHorizontalShelf.name = 'Top_Full_Horizontal_Shelf';
  topHorizontalShelf.position.set(0, shelfTopY, 0.005);
  shelfGroup.add(topHorizontalShelf);

  const bottomHorizontalShelf = new THREE.Mesh(fullShelfGeo, whiteLacquer);
  bottomHorizontalShelf.name = 'Bottom_Full_Horizontal_Shelf';
  bottomHorizontalShelf.position.set(0, shelfBottomY, 0.005);
  shelfGroup.add(bottomHorizontalShelf);

  // -------------------------------------------------------------------------
  // B. MAIN ARCHITECTURAL VERTICAL DIVIDER
  // Spans from bottom shelf up to top shelf (height = 0.948m)
  // -------------------------------------------------------------------------
  const middleSectionHeight = shelfTopY - shelfBottomY - boardThick; // 0.948m (DOUBLE HEIGHT!)
  const middleCenterY = (shelfTopY + shelfBottomY) / 2; // -0.012m

  const mainDividerGeo = new THREE.BoxGeometry(boardThick, middleSectionHeight, depth - 0.02);
  const mainDivider = new THREE.Mesh(mainDividerGeo, whiteLacquer);
  mainDivider.name = 'Main_Asymmetric_Vertical_Divider';
  mainDivider.position.set(colDividerX, middleCenterY, 0.005);
  shelfGroup.add(mainDivider);

  // -------------------------------------------------------------------------
  // C. THE HERO DOUBLE-HEIGHT GALLERY SPACE (Left Side)
  // On the LEFT side of the main divider:
  // An uninterrupted 0.948m tall x 0.62m wide DOUBLE-HEIGHT gallery space!
  // Perfect for tall vases, tall sculptures, trailing greenery, or vertical art!
  // NO shelf divides this left space!
  // -------------------------------------------------------------------------

  // -------------------------------------------------------------------------
  // D. RIGHT SIDE DESIGNER COMPARTMENTS
  // On the RIGHT side of the main divider (width = 1.032m):
  // 1. A middle shelf at y = -0.012m divides it horizontally into upper & lower
  // -------------------------------------------------------------------------
  const rightShelfWidth = 1.032;
  const rightShelfGeo = new THREE.BoxGeometry(rightShelfWidth, boardThick, depth - 0.015);
  const rightMiddleShelf = new THREE.Mesh(rightShelfGeo, whiteLacquer);
  rightMiddleShelf.name = 'Right_Middle_Shelf';
  rightMiddleShelf.position.set(rightColCenterX, middleCenterY, 0.005);
  shelfGroup.add(rightMiddleShelf);

  // 2. In the lower-right compartment, add an elegant vertical sub-divider
  // creating two distinct modern book/display cubbies!
  const lowerRightCubbyHeight = middleCenterY - shelfBottomY - boardThick; // ~0.456m
  const lowerRightCubbyCenterY = (middleCenterY + shelfBottomY) / 2; // -0.258m
  const subDividerX = rightColCenterX + 0.06; // slightly offset for modern rhythm (+0.388m)

  const subDividerGeo = new THREE.BoxGeometry(boardThick, lowerRightCubbyHeight, depth - 0.02);
  const subDivider = new THREE.Mesh(subDividerGeo, whiteLacquer);
  subDivider.name = 'Lower_Right_Sub_Divider';
  subDivider.position.set(subDividerX, lowerRightCubbyCenterY, 0.005);
  shelfGroup.add(subDivider);

  // -------------------------------------------------------------------------
  // E. TOP & BOTTOM COMPARTMENTS ACCENTS
  // Add a sleek vertical accent divider in the top compartment (left side)
  // creating an intimate accent niche (0.42m) and a wide panoramic shelf (1.23m)!
  // -------------------------------------------------------------------------
  const topCompartmentHeight = ceilingBottomY - shelfTopY - boardThick / 2; // ~0.456m
  const topCompartmentCenterY = (ceilingBottomY + shelfTopY + boardThick / 2) / 2; // +0.720m
  const topDividerX = colDividerX; // Aligns with main column divider (-0.206m)

  const topDividerGeo = new THREE.BoxGeometry(boardThick, topCompartmentHeight, depth - 0.02);
  const topDivider = new THREE.Mesh(topDividerGeo, whiteLacquer);
  topDivider.name = 'Top_Compartment_Divider';
  topDivider.position.set(topDividerX, topCompartmentCenterY, 0.005);
  shelfGroup.add(topDivider);

  // -------------------------------------------------------------------------
  // F. INTEGRATED COVE STRIP LIGHTING FOR EVERY COMPARTMENT
  // -------------------------------------------------------------------------
  // 1. Top-Left niche (under ceiling, width 0.62m)
  const topStripY = ceilingBottomY - 0.004;
  shelfGroup.add(createLedStripAssembly(0.62 * 0.90, leftColCenterX, topStripY, 'Top_Left_Niche'));

  // 2. Top-Right panoramic shelf (under ceiling, width 1.032m)
  shelfGroup.add(createLedStripAssembly(1.032 * 0.92, rightColCenterX, topStripY, 'Top_Right_Shelf'));

  // 3. Center-Left HERO DOUBLE-HEIGHT GALLERY SPACE (under top shelf, width 0.62m, cascades down 0.95m!)
  const centerStripY = shelfTopY - boardThick / 2 - 0.003;
  shelfGroup.add(createLedStripAssembly(0.62 * 0.90, leftColCenterX, centerStripY, 'Hero_Double_Height_Niche'));

  // 4. Center-Right Upper shelf (under top shelf, width 1.032m)
  shelfGroup.add(createLedStripAssembly(1.032 * 0.92, rightColCenterX, centerStripY, 'Center_Right_Upper_Shelf'));

  // 5. Center-Right Lower cubbies (under middle shelf, y = -0.012m)
  const lowerRightStripY = middleCenterY - boardThick / 2 - 0.003;
  const cubby1W = (subDividerX - boardThick / 2) - (colDividerX + boardThick / 2); // ~0.55m
  const cubby1X = (colDividerX + boardThick / 2 + subDividerX - boardThick / 2) / 2;
  const cubby2W = (rightColCenterX + rightShelfWidth / 2) - (subDividerX + boardThick / 2); // ~0.44m
  const cubby2X = (subDividerX + boardThick / 2 + rightColCenterX + rightShelfWidth / 2) / 2;

  shelfGroup.add(createLedStripAssembly(cubby1W * 0.88, cubby1X, lowerRightStripY, 'Center_Right_Lower_Cubby_1'));
  shelfGroup.add(createLedStripAssembly(cubby2W * 0.88, cubby2X, lowerRightStripY, 'Center_Right_Lower_Cubby_2'));

  // 6. Bottom compartment (under bottom shelf, full width 1.688m)
  const bottomStripY = shelfBottomY - boardThick / 2 - 0.003;
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

  console.log('Modern Designer Bookshelf Generated Successfully!');
}

generateBookshelfModel().catch(console.error);
