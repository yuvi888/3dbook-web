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

function buildCarvedCorbelGeometry() {
  const s = new THREE.Shape();
  s.moveTo(0, 0);
  s.lineTo(0.20, 0);
  s.lineTo(0.20, -0.024);
  s.bezierCurveTo(0.14, -0.032, 0.13, -0.088, 0.085, -0.105);
  s.bezierCurveTo(0.045, -0.120, 0.042, -0.158, 0.015, -0.172);
  s.lineTo(0, -0.175);
  s.closePath();

  const geo = new THREE.ExtrudeGeometry(s, {
    steps: 1,
    depth: 0.042,
    bevelEnabled: true,
    bevelThickness: 0.004,
    bevelSize: 0.004,
    bevelSegments: 3,
    curveSegments: 16,
  });
  geo.translate(0, 0, -0.021);
  geo.rotateY(-Math.PI / 2);
  geo.computeVertexNormals();
  return geo;
}

function buildArchSpandrelGeometry(spanW, archHeight, depth) {
  const hw = spanW / 2;
  const r = hw * 0.88;
  const shape = new THREE.Shape();

  shape.moveTo(-hw, 0);
  shape.lineTo(-hw, archHeight);
  shape.lineTo(hw, archHeight);
  shape.lineTo(hw, 0);
  shape.lineTo(r, 0);
  shape.absarc(0, 0, r, 0, Math.PI, false);
  shape.lineTo(-hw, 0);

  const geo = new THREE.ExtrudeGeometry(shape, {
    steps: 1,
    depth,
    bevelEnabled: true,
    bevelThickness: 0.003,
    bevelSize: 0.003,
    bevelSegments: 3,
    curveSegments: 28,
  });
  geo.translate(0, 0, -depth / 2);
  geo.computeVertexNormals();
  return geo;
}

function buildFlutedPilasterGeometry(width, height, depth) {
  const geo = new THREE.BoxGeometry(width, height, depth, 18, 1, 1);
  const pos = geo.attributes.position;
  for (let i = 0; i < pos.count; i++) {
    const x = pos.getX(i);
    const y = pos.getY(i);
    const z = pos.getZ(i);
    if (z > depth * 0.45 && Math.abs(y) < height * 0.44) {
      const normX = x / (width * 0.36);
      if (Math.abs(normX) <= 1.0) {
        const fluteWave = Math.cos(normX * Math.PI * 3);
        if (fluteWave > 0) {
          pos.setZ(i, z - fluteWave * 0.0035);
        }
      }
    }
  }
  geo.computeVertexNormals();
  return geo;
}

async function generateWoodenWallBookshelf() {
  console.log('Generating Wall-Mounted Classic Aged Walnut Architectural Bookshelf...');

  const scene = new THREE.Scene();
  scene.name = 'Wall_Mounted_Aged_Wood_Bookshelf';

  const agedWalnutMat = new THREE.MeshStandardMaterial({
    name: 'Aged_Heritage_Walnut',
    color: new THREE.Color('#6c472d'),
    roughness: 0.48,
    metalness: 0.03,
  });

  const plankBackMat = new THREE.MeshStandardMaterial({
    name: 'Tongue_Groove_Aged_Backboard',
    color: new THREE.Color('#563823'),
    roughness: 0.56,
    metalness: 0.02,
  });

  const agedBrassMat = new THREE.MeshStandardMaterial({
    name: 'Aged_Patinated_Brass',
    color: new THREE.Color('#b69148'),
    roughness: 0.32,
    metalness: 0.86,
  });

  const shelfGroup = new THREE.Group();
  shelfGroup.name = 'Bookshelf_Root';

  const totalW = 1.66;
  const totalH = 1.24;
  const depth = 0.34;
  const boardT = 0.030;
  const crownH = 0.072;
  const apronH = 0.044;

  const innerW = totalW - boardT * 2;
  const topShelfY = totalH / 2 - crownH - boardT / 2;
  const botShelfY = -totalH / 2 + apronH + boardT / 2;
  const interiorTop = topShelfY - boardT / 2;
  const interiorBot = botShelfY + boardT / 2;
  const interiorH = interiorTop - interiorBot;
  const interiorCenterY = (interiorTop + interiorBot) / 2;

  const divThick = 0.032;
  const leftDivX = -0.336;
  const rightDivX = 0.336;
  const leftBayW = leftDivX - divThick / 2 - (-innerW / 2);
  const leftBayCenterX = (-innerW / 2 + (leftDivX - divThick / 2)) / 2;
  const centerBayW = rightDivX - leftDivX - divThick;
  const rightBayW = innerW / 2 - (rightDivX + divThick / 2);
  const rightBayCenterX = (rightDivX + divThick / 2 + innerW / 2) / 2;

  const shelfDepth = depth - 0.024;
  const shelfZ = -0.004;

  // 1. Crown Cornice & Casework Top/Bottom
  const crownTop = new THREE.Mesh(new THREE.BoxGeometry(totalW + 0.088, 0.028, depth + 0.044), agedWalnutMat);
  crownTop.position.set(0, totalH / 2 - 0.014, 0.022);
  shelfGroup.add(crownTop);

  const crownMid = new THREE.Mesh(new THREE.BoxGeometry(totalW + 0.046, 0.022, depth + 0.024), agedWalnutMat);
  crownMid.position.set(0, totalH / 2 - 0.038, 0.012);
  shelfGroup.add(crownMid);

  const frieze = new THREE.Mesh(new THREE.BoxGeometry(totalW + 0.016, 0.020, depth + 0.010), agedWalnutMat);
  frieze.position.set(0, totalH / 2 - 0.059, 0.005);
  shelfGroup.add(frieze);

  const topBoard = new THREE.Mesh(new THREE.BoxGeometry(totalW, boardT, depth), agedWalnutMat);
  topBoard.position.set(0, topShelfY, 0);
  shelfGroup.add(topBoard);

  const botBoard = new THREE.Mesh(new THREE.BoxGeometry(totalW, boardT, depth), agedWalnutMat);
  botBoard.position.set(0, botShelfY, 0);
  shelfGroup.add(botBoard);

  const botNosing = new THREE.Mesh(new THREE.BoxGeometry(totalW + 0.01, boardT + 0.008, 0.012), agedWalnutMat);
  botNosing.position.set(0, botShelfY, depth / 2 + 0.005);
  shelfGroup.add(botNosing);

  // 2. Wall-Mounted Lower Apron & 3 Carved Timber Corbels
  const apron = new THREE.Mesh(new THREE.BoxGeometry(totalW - 0.016, apronH, depth - 0.012), agedWalnutMat);
  apron.position.set(0, -totalH / 2 + apronH / 2, -0.005);
  shelfGroup.add(apron);

  const corbelGeo = buildCarvedCorbelGeometry();
  [-0.64, 0, 0.64].forEach((cx, idx) => {
    const corbel = new THREE.Mesh(corbelGeo, agedWalnutMat);
    corbel.position.set(cx, -totalH / 2 + 0.002, -depth / 2);
    corbel.name = `Wall_Corbel_${idx + 1}`;
    shelfGroup.add(corbel);
  });

  // 3. Outer Walls, Backboard & Rear French-Cleat Mounts
  const leftSide = new THREE.Mesh(new THREE.BoxGeometry(boardT, interiorH, depth), agedWalnutMat);
  leftSide.position.set(-totalW / 2 + boardT / 2, interiorCenterY, 0);
  shelfGroup.add(leftSide);

  const rightSide = new THREE.Mesh(new THREE.BoxGeometry(boardT, interiorH, depth), agedWalnutMat);
  rightSide.position.set(totalW / 2 - boardT / 2, interiorCenterY, 0);
  shelfGroup.add(rightSide);

  const backBoard = new THREE.Mesh(new THREE.BoxGeometry(innerW, interiorH + 0.01, 0.018), plankBackMat);
  backBoard.position.set(0, interiorCenterY, -depth / 2 + 0.009);
  shelfGroup.add(backBoard);

  [0.34, -0.34].forEach((cy, idx) => {
    const cleat = new THREE.Mesh(new THREE.BoxGeometry(totalW - 0.14, 0.055, 0.014), agedWalnutMat);
    cleat.position.set(0, cy, -depth / 2 - 0.006);
    cleat.name = `French_Cleat_Rail_${idx + 1}`;
    shelfGroup.add(cleat);
  });

  [-0.68, 0.68].forEach((kx, idx) => {
    const plate = new THREE.Mesh(new THREE.BoxGeometry(0.038, 0.072, 0.004), agedBrassMat);
    plate.position.set(kx, 0.44, -depth / 2 - 0.008);
    plate.name = `Brass_Keyhole_Plate_${idx + 1}`;
    shelfGroup.add(plate);
  });

  // 4. Fluted Pilasters & Bay Dividers
  [leftDivX, rightDivX].forEach((dx) => {
    const div = new THREE.Mesh(new THREE.BoxGeometry(divThick, interiorH, shelfDepth), agedWalnutMat);
    div.position.set(dx, interiorCenterY, shelfZ);
    shelfGroup.add(div);
  });

  const pilasterOuterGeo = buildFlutedPilasterGeometry(0.044, interiorH + boardT * 2, 0.020);
  const pilasterInnerGeo = buildFlutedPilasterGeometry(0.042, interiorH, 0.020);

  [-totalW / 2 + 0.022, totalW / 2 - 0.022].forEach((px) => {
    const p = new THREE.Mesh(pilasterOuterGeo, agedWalnutMat);
    p.position.set(px, interiorCenterY, depth / 2 + 0.006);
    shelfGroup.add(p);
  });
  [leftDivX, rightDivX].forEach((px) => {
    const p = new THREE.Mesh(pilasterInnerGeo, agedWalnutMat);
    p.position.set(px, interiorCenterY, depth / 2 + 0.004);
    shelfGroup.add(p);
  });

  // 5. Internal Architectural Shelves, Arched Gallery & Wainscot Panel
  function addShelf(w, x, y) {
    const board = new THREE.Mesh(new THREE.BoxGeometry(w, boardT, shelfDepth), agedWalnutMat);
    board.position.set(x, y, shelfZ);
    shelfGroup.add(board);

    const nose = new THREE.Mesh(new THREE.BoxGeometry(w, boardT + 0.006, 0.012), agedWalnutMat);
    nose.position.set(x, y, shelfZ + shelfDepth / 2 + 0.005);
    shelfGroup.add(nose);
  }

  addShelf(leftBayW, leftBayCenterX, 0.21);
  addShelf(leftBayW, leftBayCenterX, -0.24);
  addShelf(centerBayW, 0, -0.18);
  addShelf(rightBayW, rightBayCenterX, 0.14);
  addShelf(rightBayW, rightBayCenterX, -0.20);

  const arch = new THREE.Mesh(buildArchSpandrelGeometry(centerBayW, 0.25, 0.028), agedWalnutMat);
  arch.position.set(0, interiorTop - 0.25, depth / 2 - 0.026);
  arch.name = 'Center_Arch_Spandrel';
  shelfGroup.add(arch);

  const keystone = new THREE.Mesh(new THREE.BoxGeometry(0.054, 0.056, 0.018), agedWalnutMat);
  keystone.position.set(0, interiorTop - 0.024, depth / 2 - 0.008);
  shelfGroup.add(keystone);

  const wainscot = new THREE.Mesh(new THREE.BoxGeometry(0.46, 0.48, 0.010), agedWalnutMat);
  wainscot.position.set(0, 0.13, -depth / 2 + 0.022);
  shelfGroup.add(wainscot);

  const rail = new THREE.Mesh(new THREE.CylinderGeometry(0.004, 0.004, 0.52, 12), agedBrassMat);
  rail.rotation.z = Math.PI / 2;
  rail.position.set(0, -0.14, -depth / 2 + 0.036);
  shelfGroup.add(rail);

  const lowerCenterDiv = new THREE.Mesh(new THREE.BoxGeometry(0.026, -0.18 - boardT / 2 - interiorBot, shelfDepth), agedWalnutMat);
  lowerCenterDiv.position.set(0, (interiorBot + (-0.18 - boardT / 2)) / 2, shelfZ);
  shelfGroup.add(lowerCenterDiv);

  const rightSubDiv = new THREE.Mesh(new THREE.BoxGeometry(0.024, 0.34 - boardT, shelfDepth), agedWalnutMat);
  rightSubDiv.position.set(rightBayCenterX - 0.075, -0.03, shelfZ);
  shelfGroup.add(rightSubDiv);

  scene.add(shelfGroup);

  const exporter = new GLTFExporter();
  const outputDir = path.join(__dirname, '..', 'public', 'models');
  const savedDir = path.join(__dirname, '..', 'saved_models', 'bookshelf');
  fs.mkdirSync(outputDir, { recursive: true });
  fs.mkdirSync(savedDir, { recursive: true });

  const glbBuffer = await exporter.parseAsync(scene, { binary: true });
  fs.writeFileSync(path.join(outputDir, 'bookshelf_wood_architectural.glb'), Buffer.from(glbBuffer));
  fs.writeFileSync(path.join(savedDir, 'bookshelf_wood_architectural.glb'), Buffer.from(glbBuffer));

  const gltfJson = await exporter.parseAsync(scene, { binary: false });
  fs.writeFileSync(path.join(outputDir, 'bookshelf_wood_architectural.gltf'), JSON.stringify(gltfJson, null, 2));
  fs.writeFileSync(path.join(savedDir, 'bookshelf_wood_architectural.gltf'), JSON.stringify(gltfJson, null, 2));

  console.log('✅ Wall-Mounted Classic Aged Wood Bookshelf GLB & GLTF exported successfully!');
}

generateWoodenWallBookshelf().catch(console.error);
