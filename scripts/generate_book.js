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

async function generateUltraRealisticBook() {
  console.log('Generating Ultra-Realistic 3D Hardcover Book (Concave Fore-Edge, Beveled Boards, No Red Stripe)...');

  const scene = new THREE.Scene();
  scene.name = 'Ultra_Realistic_3D_Hardcover_Book';

  // =========================================================================
  // 1. DIMENSIONS & RATIOS (Trade Royal Hardcover: ~16cm x 24cm x 4.6cm)
  // =========================================================================
  const bookW = 0.165;      // Width across page block (X axis)
  const bookH = 0.245;      // Height (Y axis)
  const bookT = 0.046;      // Total thickness (Z axis)
  const boardThick = 0.0035;// Binder board thickness (3.5 mm)
  const overhang = 0.006;   // Squares overhang past paper (6 mm)

  // Paper text block dimensions
  const pageW = bookW - overhang;
  const pageH = bookH - overhang * 2;
  const pageT = bookT - boardThick * 2 - 0.003;

  // =========================================================================
  // 2. PBR MATERIALS
  // =========================================================================
  // Front cover material with clean UVs for dynamic network cover images
  const frontCoverMat = new THREE.MeshStandardMaterial({
    name: 'Front_Cover_Artwork',
    color: new THREE.Color('#ffffff'),
    roughness: 0.36,
    metalness: 0.03,
  });

  // Back cover & cloth binding wrap (Premium deep indigo/charcoal bookcloth)
  const bookClothMat = new THREE.MeshStandardMaterial({
    name: 'Premium_Bookcloth_Wrap',
    color: new THREE.Color('#141c2b'),
    roughness: 0.52,
    metalness: 0.02,
  });

  // Natural warm cream / ivory uncoated book paper
  const paperBlockMat = new THREE.MeshStandardMaterial({
    name: 'Natural_Paper_TextBlock',
    color: new THREE.Color('#fcf8ee'),
    roughness: 0.85,
    metalness: 0.01,
  });

  // Woven dual-tone headband cloth at spine top and bottom
  const headbandMat = new THREE.MeshStandardMaterial({
    name: 'Woven_Headband_Fabric',
    color: new THREE.Color('#d4af37'),
    roughness: 0.38,
    metalness: 0.35,
  });

  const bookRoot = new THREE.Group();
  bookRoot.name = 'Book_Root';

  // =========================================================================
  // 3. FULLY 3D CONCAVE PAPER TEXT BLOCK (Realistic Gutter Curvature)
  // Real books have a crescent concave fore-edge following the convex spine!
  // =========================================================================
  const xSegs = 16;
  const ySegs = 20;
  const zSegs = 16;

  const halfPW = pageW / 2;
  const halfPH = pageH / 2;
  const halfPT = pageT / 2;
  const concavity = 0.007; // 7mm inward curvature on fore-edge

  // Generate parametric vertex grid for concave page block
  const paperVerts = [];
  const paperNormals = [];
  const paperUVs = [];
  const paperIndices = [];

  // Generate 6 faces of the paper block with curved fore-edge
  // Helper to push quad
  function addQuad(v0, v1, v2, v3) {
    paperIndices.push(v0, v1, v2, v1, v3, v2);
  }

  // A. Fore-edge (+X curved face)
  const foreStart = paperVerts.length / 3;
  for (let iy = 0; iy <= ySegs; iy++) {
    const v = iy / ySegs;
    const y = -halfPH + v * pageH;
    for (let iz = 0; iz <= zSegs; iz++) {
      const u = iz / zSegs;
      const z = -halfPT + u * pageT;
      // Parabolic concave curve inward on X
      const normZ = (z / halfPT);
      const curveX = halfPW - concavity * (1.0 - normZ * normZ);

      paperVerts.push(curveX, y, z);
      // Normal points generally +X, angled with curve
      const dXdz = (2 * concavity * normZ) / halfPT;
      const n = new THREE.Vector3(1, 0, -dXdz).normalize();
      paperNormals.push(n.x, n.y, n.z);
      paperUVs.push(u, v * 12); // fine leaf striations
    }
  }
  for (let iy = 0; iy < ySegs; iy++) {
    for (let iz = 0; iz < zSegs; iz++) {
      const row1 = foreStart + iy * (zSegs + 1);
      const row2 = foreStart + (iy + 1) * (zSegs + 1);
      addQuad(row1 + iz, row1 + iz + 1, row2 + iz, row2 + iz + 1);
    }
  }

  // B. Top head face (+Y)
  const topStart = paperVerts.length / 3;
  for (let ix = 0; ix <= xSegs; ix++) {
    const u = ix / xSegs;
    for (let iz = 0; iz <= zSegs; iz++) {
      const v = iz / zSegs;
      const z = -halfPT + v * pageT;
      const normZ = z / halfPT;
      const endX = halfPW - concavity * (1.0 - normZ * normZ);
      const startX = -halfPW;
      const x = startX + u * (endX - startX);

      paperVerts.push(x, halfPH, z);
      paperNormals.push(0, 1, 0);
      paperUVs.push(u, v);
    }
  }
  for (let ix = 0; ix < xSegs; ix++) {
    for (let iz = 0; iz < zSegs; iz++) {
      const row1 = topStart + ix * (zSegs + 1);
      const row2 = topStart + (ix + 1) * (zSegs + 1);
      addQuad(row1 + iz, row2 + iz, row1 + iz + 1, row2 + iz + 1);
    }
  }

  // C. Bottom tail face (-Y)
  const botStart = paperVerts.length / 3;
  for (let ix = 0; ix <= xSegs; ix++) {
    const u = ix / xSegs;
    for (let iz = 0; iz <= zSegs; iz++) {
      const v = iz / zSegs;
      const z = -halfPT + v * pageT;
      const normZ = z / halfPT;
      const endX = halfPW - concavity * (1.0 - normZ * normZ);
      const startX = -halfPW;
      const x = startX + u * (endX - startX);

      paperVerts.push(x, -halfPH, z);
      paperNormals.push(0, -1, 0);
      paperUVs.push(u, v);
    }
  }
  for (let ix = 0; ix < xSegs; ix++) {
    for (let iz = 0; iz < zSegs; iz++) {
      const row1 = botStart + ix * (zSegs + 1);
      const row2 = botStart + (ix + 1) * (zSegs + 1);
      addQuad(row1 + iz, row1 + iz + 1, row2 + iz, row2 + iz + 1);
    }
  }

  // D. Spine inner face (-X)
  const spineStart = paperVerts.length / 3;
  for (let iy = 0; iy <= ySegs; iy++) {
    const v = iy / ySegs;
    const y = -halfPH + v * pageH;
    for (let iz = 0; iz <= zSegs; iz++) {
      const u = iz / zSegs;
      const z = -halfPT + u * pageT;
      paperVerts.push(-halfPW, y, z);
      paperNormals.push(-1, 0, 0);
      paperUVs.push(u, v);
    }
  }
  for (let iy = 0; iy < ySegs; iy++) {
    for (let iz = 0; iz < zSegs; iz++) {
      const row1 = spineStart + iy * (zSegs + 1);
      const row2 = spineStart + (iy + 1) * (zSegs + 1);
      addQuad(row1 + iz, row2 + iz, row1 + iz + 1, row2 + iz + 1);
    }
  }

  // E. Front leaf (+Z) & Back leaf (-Z)
  const frontPageStart = paperVerts.length / 3;
  paperVerts.push(-halfPW, -halfPH, halfPT, halfPW, -halfPH, halfPT, -halfPW, halfPH, halfPT, halfPW, halfPH, halfPT);
  paperNormals.push(0, 0, 1, 0, 0, 1, 0, 0, 1, 0, 0, 1);
  paperUVs.push(0, 0, 1, 0, 0, 1, 1, 1);
  addQuad(frontPageStart, frontPageStart + 1, frontPageStart + 2, frontPageStart + 3);

  const backPageStart = paperVerts.length / 3;
  paperVerts.push(-halfPW, -halfPH, -halfPT, -halfPW, halfPH, -halfPT, halfPW, -halfPH, -halfPT, halfPW, halfPH, -halfPT);
  paperNormals.push(0, 0, -1, 0, 0, -1, 0, 0, -1, 0, 0, -1);
  paperUVs.push(0, 0, 0, 1, 1, 0, 1, 1);
  addQuad(backPageStart, backPageStart + 1, backPageStart + 2, backPageStart + 3);

  const paperBlockGeo = new THREE.BufferGeometry();
  paperBlockGeo.setAttribute('position', new THREE.Float32BufferAttribute(paperVerts, 3));
  paperBlockGeo.setAttribute('normal', new THREE.Float32BufferAttribute(paperNormals, 3));
  paperBlockGeo.setAttribute('uv', new THREE.Float32BufferAttribute(paperUVs, 2));
  paperBlockGeo.setIndex(paperIndices);
  paperBlockGeo.computeVertexNormals();

  const paperBlockMesh = new THREE.Mesh(paperBlockGeo, paperBlockMat);
  paperBlockMesh.position.set(overhang / 2, 0, 0);
  paperBlockMesh.castShadow = true;
  paperBlockMesh.receiveShadow = true;
  paperBlockMesh.name = 'Concave_Paper_Text_Block';
  bookRoot.add(paperBlockMesh);

  // =========================================================================
  // 4. BEVELED HARDCOVER BOARDS (Front & Back Boards)
  // Real boards have smooth filleted/rounded outer rim edges
  // =========================================================================
  const boardShape = new THREE.Shape();
  const cornerR = 0.003; // 3mm rounded corners
  const bW = bookW;
  const bH = bookH;

  boardShape.moveTo(-bW / 2, -bH / 2 + cornerR);
  boardShape.lineTo(-bW / 2, bH / 2 - cornerR);
  boardShape.quadraticCurveTo(-bW / 2, bH / 2, -bW / 2 + cornerR, bH / 2);
  boardShape.lineTo(bW / 2 - cornerR, bH / 2);
  boardShape.quadraticCurveTo(bW / 2, bH / 2, bW / 2, bH / 2 - cornerR);
  boardShape.lineTo(bW / 2, -bH / 2 + cornerR);
  boardShape.quadraticCurveTo(bW / 2, -bH / 2, bW / 2 - cornerR, -bH / 2);
  boardShape.lineTo(-bW / 2 + cornerR, -bH / 2);
  boardShape.quadraticCurveTo(-bW / 2, -bH / 2, -bW / 2, -bH / 2 + cornerR);

  const extrudeSettings = {
    steps: 1,
    depth: boardThick,
    bevelEnabled: true,
    bevelThickness: 0.001,
    bevelSize: 0.001,
    bevelSegments: 3,
  };

  const boardGeo = new THREE.ExtrudeGeometry(boardShape, extrudeSettings);
  boardGeo.center();

  // A. Back Cover Board (-Z Face)
  const backBoardMesh = new THREE.Mesh(boardGeo, bookClothMat);
  backBoardMesh.position.set(0, 0, -bookT / 2 + boardThick / 2);
  backBoardMesh.castShadow = true;
  backBoardMesh.receiveShadow = true;
  backBoardMesh.name = 'Back_Cover_Board';
  bookRoot.add(backBoardMesh);

  // B. Front Cover Board (+Z Face)
  // We apply the frontCoverMat to the front (+Z) face with perfect planar UVs
  const frontBoardGeo = new THREE.BoxGeometry(bW, bH, boardThick);
  const frontMaterials = [
    bookClothMat, // +X fore-edge
    bookClothMat, // -X spine edge
    bookClothMat, // +Y top
    bookClothMat, // -Y bottom
    frontCoverMat,// +Z FRONT COVER (USER NETWORK IMAGE)
    bookClothMat, // -Z inner paste-down
  ];
  const frontBoardMesh = new THREE.Mesh(frontBoardGeo, frontMaterials);
  frontBoardMesh.position.set(0, 0, bookT / 2 - boardThick / 2);
  frontBoardMesh.castShadow = true;
  frontBoardMesh.receiveShadow = true;
  frontBoardMesh.name = 'Front_Cover_Board';
  bookRoot.add(frontBoardMesh);

  // =========================================================================
  // 5. DEBOSSED FRENCH GROOVE HINGE VALLEYS (Dual Hinge Joints)
  // Deep longitudinal grooves running parallel to spine catching rich shadow
  // =========================================================================
  const grooveX = -bW / 2 + 0.016;
  const grooveGeo = new THREE.BoxGeometry(0.0028, bH - 0.002, 0.002);

  const frontGroove = new THREE.Mesh(grooveGeo, bookClothMat);
  frontGroove.position.set(grooveX, 0, bookT / 2 + 0.0006);
  frontGroove.name = 'Front_French_Groove';
  bookRoot.add(frontGroove);

  const backGroove = new THREE.Mesh(grooveGeo, bookClothMat);
  backGroove.position.set(grooveX, 0, -bookT / 2 - 0.0006);
  backGroove.name = 'Back_French_Groove';
  bookRoot.add(backGroove);

  // =========================================================================
  // 6. CONTINUOUS CONVEX ROUNDED SPINE WITH TURN-IN CAPS
  // =========================================================================
  const spineR = bookT / 2;
  const spineGeo = new THREE.CylinderGeometry(
    spineR,
    spineR,
    bH,
    32,
    1,
    false,
    Math.PI / 2,
    Math.PI
  );
  spineGeo.scale(0.52, 1, 1);
  const spineMesh = new THREE.Mesh(spineGeo, bookClothMat);
  spineMesh.position.set(-bW / 2 + 0.003, 0, 0);
  spineMesh.castShadow = true;
  spineMesh.name = 'Convex_Spine';
  bookRoot.add(spineMesh);

  // Woven Headband and Tailband cloth collars
  const headbandGeo = new THREE.BoxGeometry(0.008, 0.007, bookT - 0.008);
  const topHeadband = new THREE.Mesh(headbandGeo, headbandMat);
  topHeadband.position.set(-bW / 2 + 0.007, bH / 2 - 0.0035, 0);
  topHeadband.name = 'Top_Headband';
  bookRoot.add(topHeadband);

  const bottomHeadband = new THREE.Mesh(headbandGeo, headbandMat);
  bottomHeadband.position.set(-bW / 2 + 0.007, -bH / 2 + 0.0035, 0);
  bottomHeadband.name = 'Bottom_Headband';
  bookRoot.add(bottomHeadband);

  // NO RED STRIPE! (Completely omitted as requested by user)

  scene.add(bookRoot);

  // =========================================================================
  // 7. EXPORT GLB & GLTF
  // =========================================================================
  const exporter = new GLTFExporter();

  const publicModelsDir = path.join(__dirname, '..', 'public', 'models');
  const savedModelsDir = path.join(__dirname, '..', 'saved_models', 'book');

  if (!fs.existsSync(publicModelsDir)) fs.mkdirSync(publicModelsDir, { recursive: true });
  if (!fs.existsSync(savedModelsDir)) fs.mkdirSync(savedModelsDir, { recursive: true });

  // Export Binary GLB
  exporter.parse(
    scene,
    (glbArrayBuffer) => {
      const buffer = Buffer.from(glbArrayBuffer);
      const pubGlbPath = path.join(publicModelsDir, 'advanced_book_realistic.glb');
      const savedGlbPath = path.join(savedModelsDir, 'advanced_book_realistic.glb');

      fs.writeFileSync(pubGlbPath, buffer);
      fs.writeFileSync(savedGlbPath, buffer);
      console.log(`✅ Binary GLB saved successfully: ${pubGlbPath} (${(buffer.length / 1024).toFixed(1)} KB)`);
    },
    (err) => {
      console.error('Error generating GLB:', err);
    },
    { binary: true }
  );

  // Export Text GLTF
  exporter.parse(
    scene,
    (gltf) => {
      const jsonStr = JSON.stringify(gltf, null, 2);
      const pubGltfPath = path.join(publicModelsDir, 'advanced_book_realistic.gltf');
      const savedGltfPath = path.join(savedModelsDir, 'advanced_book_realistic.gltf');

      fs.writeFileSync(pubGltfPath, jsonStr, 'utf8');
      fs.writeFileSync(savedGltfPath, jsonStr, 'utf8');
      console.log(`✅ Text GLTF saved successfully: ${pubGltfPath}`);
    },
    (err) => {
      console.error('Error generating GLTF:', err);
    },
    { binary: false }
  );
}

generateUltraRealisticBook();
