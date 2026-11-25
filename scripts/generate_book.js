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

function splitBoardMaterialGroups(geo, innerNormalSignZ) {
  const pos = geo.attributes.position;
  const norm = geo.attributes.normal;
  const uv = geo.attributes.uv;
  const triCount = pos.count / 3;

  const outerVerts = [];
  const outerNorms = [];
  const outerUvs = [];
  const innerVerts = [];
  const innerNorms = [];
  const innerUvs = [];

  for (let t = 0; t < triCount; t++) {
    const i0 = t * 3;
    const nz = (norm.getZ(i0) + norm.getZ(i0 + 1) + norm.getZ(i0 + 2)) / 3;
    const isInner = innerNormalSignZ < 0 ? nz < -0.9 : nz > 0.9;
    const targetPos = isInner ? innerVerts : outerVerts;
    const targetNorm = isInner ? innerNorms : outerNorms;
    const targetUv = isInner ? innerUvs : outerUvs;

    for (let k = 0; k < 3; k++) {
      const idx = i0 + k;
      targetPos.push(pos.getX(idx), pos.getY(idx), pos.getZ(idx));
      targetNorm.push(norm.getX(idx), norm.getY(idx), norm.getZ(idx));
      targetUv.push(uv.getX(idx), uv.getY(idx));
    }
  }

  const combinedPos = new Float32Array([...outerVerts, ...innerVerts]);
  const combinedNorm = new Float32Array([...outerNorms, ...innerNorms]);
  const combinedUv = new Float32Array([...outerUvs, ...innerUvs]);

  const outGeo = new THREE.BufferGeometry();
  outGeo.setAttribute('position', new THREE.BufferAttribute(combinedPos, 3));
  outGeo.setAttribute('normal', new THREE.BufferAttribute(combinedNorm, 3));
  outGeo.setAttribute('uv', new THREE.BufferAttribute(combinedUv, 2));
  outGeo.clearGroups();
  outGeo.addGroup(0, outerVerts.length / 3, 0);
  outGeo.addGroup(outerVerts.length / 3, innerVerts.length / 3, 1);
  return outGeo;
}

async function generateUltraRealisticBook() {
  console.log('Generating Watertight, Zero-Z-Fighting 3D Hardcover Book...');

  const scene = new THREE.Scene();
  scene.name = 'Ultra_Realistic_3D_Hardcover_Book';

  const bookW = 0.165;
  const bookH = 0.245;
  const bookT = 0.044;
  const boardThick = 0.0032;
  const overhang = 0.0055;

  const spinePaperX = -bookW / 2 + 0.0022;
  const forePaperX = bookW / 2 - overhang;
  const pageH = bookH - overhang * 2;
  const pageT = bookT - boardThick * 2;

  const frontCoverMat = new THREE.MeshStandardMaterial({
    name: 'Front_Cover_Artwork',
    color: new THREE.Color('#ffffff'),
    roughness: 0.42,
    metalness: 0.02,
  });

  const bookClothMat = new THREE.MeshStandardMaterial({
    name: 'Premium_Bookcloth_Wrap',
    color: new THREE.Color('#252f42'),
    roughness: 0.58,
    metalness: 0.03,
  });

  const endpaperMat = new THREE.MeshStandardMaterial({
    name: 'Inner_Endpaper',
    color: new THREE.Color('#efe7d6'),
    roughness: 0.82,
    metalness: 0.0,
  });

  const paperBlockMat = new THREE.MeshStandardMaterial({
    name: 'Natural_Paper_TextBlock',
    color: new THREE.Color('#fcf7eb'),
    roughness: 0.88,
    metalness: 0.01,
  });

  const headbandMat = new THREE.MeshStandardMaterial({
    name: 'Woven_Headband_Fabric',
    color: new THREE.Color('#d4af37'),
    roughness: 0.52,
    metalness: 0.12,
  });

  const bookRoot = new THREE.Group();
  bookRoot.name = 'Book_Root';

  // 1. WATERTIGHT CONCAVE PAPER BLOCK (No hidden internal Z-caps z-fighting boards)
  const xSegs = 16;
  const ySegs = 20;
  const zSegs = 24;
  const halfPH = pageH / 2;
  const halfPT = pageT / 2;
  const concavity = 0.0065;

  const paperVerts = [];
  const paperNormals = [];
  const paperUVs = [];
  const paperIndices = [];

  function addQuad(v0, v1, v2, v3) {
    paperIndices.push(v0, v1, v2, v1, v3, v2);
  }

  // Fore-edge (+X)
  const foreStart = paperVerts.length / 3;
  for (let iy = 0; iy <= ySegs; iy++) {
    const yNorm = iy / ySegs;
    const y = -halfPH + yNorm * pageH;
    for (let iz = 0; iz <= zSegs; iz++) {
      const zNorm = iz / zSegs;
      const z = -halfPT + zNorm * pageT;
      const normZ = z / halfPT;
      const curveX = forePaperX - concavity * (1.0 - normZ * normZ);

      paperVerts.push(curveX, y, z);
      const dXdz = (2 * concavity * normZ) / halfPT;
      const n = new THREE.Vector3(1, 0, -dXdz).normalize();
      paperNormals.push(n.x, n.y, n.z);
      paperUVs.push(yNorm, zNorm * 1.8);
    }
  }
  for (let iy = 0; iy < ySegs; iy++) {
    for (let iz = 0; iz < zSegs; iz++) {
      const row1 = foreStart + iy * (zSegs + 1);
      const row2 = foreStart + (iy + 1) * (zSegs + 1);
      addQuad(row1 + iz, row2 + iz, row1 + iz + 1, row2 + iz + 1);
    }
  }

  // Top head (+Y)
  const topStart = paperVerts.length / 3;
  for (let ix = 0; ix <= xSegs; ix++) {
    const xNorm = ix / xSegs;
    for (let iz = 0; iz <= zSegs; iz++) {
      const zNorm = iz / zSegs;
      const z = -halfPT + zNorm * pageT;
      const normZ = z / halfPT;
      const endX = forePaperX - concavity * (1.0 - normZ * normZ);
      const x = spinePaperX + xNorm * (endX - spinePaperX);

      paperVerts.push(x, halfPH, z);
      paperNormals.push(0, 1, 0);
      paperUVs.push(xNorm, zNorm * 1.8);
    }
  }
  for (let ix = 0; ix < xSegs; ix++) {
    for (let iz = 0; iz < zSegs; iz++) {
      const row1 = topStart + ix * (zSegs + 1);
      const row2 = topStart + (ix + 1) * (zSegs + 1);
      addQuad(row1 + iz, row1 + iz + 1, row2 + iz, row2 + iz + 1);
    }
  }

  // Bottom tail (-Y)
  const botStart = paperVerts.length / 3;
  for (let ix = 0; ix <= xSegs; ix++) {
    const xNorm = ix / xSegs;
    for (let iz = 0; iz <= zSegs; iz++) {
      const zNorm = iz / zSegs;
      const z = -halfPT + zNorm * pageT;
      const normZ = z / halfPT;
      const endX = forePaperX - concavity * (1.0 - normZ * normZ);
      const x = spinePaperX + xNorm * (endX - spinePaperX);

      paperVerts.push(x, -halfPH, z);
      paperNormals.push(0, -1, 0);
      paperUVs.push(xNorm, zNorm * 1.8);
    }
  }
  for (let ix = 0; ix < xSegs; ix++) {
    for (let iz = 0; iz < zSegs; iz++) {
      const row1 = botStart + ix * (zSegs + 1);
      const row2 = botStart + (ix + 1) * (zSegs + 1);
      addQuad(row1 + iz, row2 + iz, row1 + iz + 1, row2 + iz + 1);
    }
  }

  // Spine face (-X)
  const spineStart = paperVerts.length / 3;
  for (let iy = 0; iy <= ySegs; iy++) {
    const yNorm = iy / ySegs;
    const y = -halfPH + yNorm * pageH;
    for (let iz = 0; iz <= zSegs; iz++) {
      const zNorm = iz / zSegs;
      const z = -halfPT + zNorm * pageT;
      paperVerts.push(spinePaperX, y, z);
      paperNormals.push(-1, 0, 0);
      paperUVs.push(yNorm, zNorm);
    }
  }
  for (let iy = 0; iy < ySegs; iy++) {
    for (let iz = 0; iz < zSegs; iz++) {
      const row1 = spineStart + iy * (zSegs + 1);
      const row2 = spineStart + (iy + 1) * (zSegs + 1);
      addQuad(row1 + iz, row1 + iz + 1, row2 + iz, row2 + iz + 1);
    }
  }

  const paperBlockGeo = new THREE.BufferGeometry();
  paperBlockGeo.setAttribute('position', new THREE.Float32BufferAttribute(paperVerts, 3));
  paperBlockGeo.setAttribute('normal', new THREE.Float32BufferAttribute(paperNormals, 3));
  paperBlockGeo.setAttribute('uv', new THREE.Float32BufferAttribute(paperUVs, 2));
  paperBlockGeo.setIndex(paperIndices);

  const paperBlockMesh = new THREE.Mesh(paperBlockGeo, paperBlockMat);
  paperBlockMesh.castShadow = true;
  paperBlockMesh.receiveShadow = true;
  paperBlockMesh.name = 'Concave_Paper_Text_Block';
  bookRoot.add(paperBlockMesh);

  // 2. BEVELED COVER BOARDS (Exact outer size bookW x bookH x boardThick)
  const bevelSize = 0.0008;
  const bevelThick = 0.0007;
  const cornerR = 0.0028;
  const xMin = -bookW / 2 + bevelSize;
  const xMax = bookW / 2 - bevelSize;
  const yMin = -bookH / 2 + bevelSize;
  const yMax = bookH / 2 - bevelSize;

  const boardShape = new THREE.Shape();
  boardShape.moveTo(xMin, yMin);
  boardShape.lineTo(xMin, yMax);
  boardShape.lineTo(xMax - cornerR, yMax);
  boardShape.quadraticCurveTo(xMax, yMax, xMax, yMax - cornerR);
  boardShape.lineTo(xMax, yMin + cornerR);
  boardShape.quadraticCurveTo(xMax, yMin, xMax - cornerR, yMin);
  boardShape.lineTo(xMin, yMin);

  const extrudeSettings = {
    steps: 1,
    depth: boardThick - bevelThick * 2,
    bevelEnabled: true,
    bevelThickness: bevelThick,
    bevelSize,
    bevelSegments: 4,
    curveSegments: 8,
  };

  const grooveX = -bookW / 2 + 0.0115;

  const rawFrontGeo = new THREE.ExtrudeGeometry(boardShape, extrudeSettings);
  rawFrontGeo.center();
  const fPos = rawFrontGeo.attributes.position;
  const fUv = rawFrontGeo.attributes.uv;
  for (let i = 0; i < fPos.count; i++) {
    const x = fPos.getX(i);
    const y = fPos.getY(i);
    const z = fPos.getZ(i);
    if (z > 0) {
      const dist = (x - grooveX) / 0.0022;
      fPos.setZ(i, z - 0.00055 * Math.exp(-dist * dist));
    }
    fUv.setXY(
      i,
      THREE.MathUtils.clamp((x + bookW / 2) / bookW, 0, 1),
      THREE.MathUtils.clamp((y + bookH / 2) / bookH, 0, 1)
    );
  }
  rawFrontGeo.computeVertexNormals();
  const frontBoardGeo = splitBoardMaterialGroups(rawFrontGeo, -1);

  const frontBoardMesh = new THREE.Mesh(frontBoardGeo, [frontCoverMat, endpaperMat]);
  frontBoardMesh.position.set(0, 0, bookT / 2 - boardThick / 2);
  frontBoardMesh.castShadow = true;
  frontBoardMesh.receiveShadow = true;
  frontBoardMesh.name = 'Front_Cover_Board';
  bookRoot.add(frontBoardMesh);

  const rawBackGeo = new THREE.ExtrudeGeometry(boardShape, extrudeSettings);
  rawBackGeo.center();
  const bPos = rawBackGeo.attributes.position;
  for (let i = 0; i < bPos.count; i++) {
    const x = bPos.getX(i);
    const z = bPos.getZ(i);
    if (z < 0) {
      const dist = (x - grooveX) / 0.0022;
      bPos.setZ(i, z + 0.00055 * Math.exp(-dist * dist));
    }
  }
  rawBackGeo.computeVertexNormals();
  const backBoardGeo = splitBoardMaterialGroups(rawBackGeo, 1);

  const backBoardMesh = new THREE.Mesh(backBoardGeo, [bookClothMat, endpaperMat]);
  backBoardMesh.position.set(0, 0, -bookT / 2 + boardThick / 2);
  backBoardMesh.castShadow = true;
  backBoardMesh.receiveShadow = true;
  backBoardMesh.name = 'Back_Cover_Board';
  bookRoot.add(backBoardMesh);

  // 3. CONTINUOUS CLOSED CONVEX SPINE AT x = -bookW / 2 (zero board overlap)
  const spineGeo = new THREE.CylinderGeometry(
    bookT / 2,
    bookT / 2,
    bookH,
    32,
    1,
    false,
    Math.PI,
    Math.PI
  );
  spineGeo.scale(0.42, 1, 1);
  const spineMesh = new THREE.Mesh(spineGeo, bookClothMat);
  spineMesh.position.set(-bookW / 2, 0, 0);
  spineMesh.castShadow = true;
  spineMesh.receiveShadow = true;
  spineMesh.name = 'Convex_Spine';
  bookRoot.add(spineMesh);

  const headbandGeo = new THREE.BoxGeometry(0.0020, 0.0026, pageT - 0.0015);
  const topHeadband = new THREE.Mesh(headbandGeo, headbandMat);
  topHeadband.position.set(-bookW / 2 + 0.0011, pageH / 2 + 0.0014, 0);
  topHeadband.name = 'Top_Headband';
  bookRoot.add(topHeadband);

  const bottomHeadband = new THREE.Mesh(headbandGeo, headbandMat);
  bottomHeadband.position.set(-bookW / 2 + 0.0011, -pageH / 2 - 0.0014, 0);
  bottomHeadband.name = 'Bottom_Headband';
  bookRoot.add(bottomHeadband);

  scene.add(bookRoot);

  // 4. EXPORT GLB & GLTF
  const exporter = new GLTFExporter();
  const publicModelsDir = path.join(__dirname, '..', 'public', 'models');
  const savedModelsDir = path.join(__dirname, '..', 'saved_models', 'book');

  if (!fs.existsSync(publicModelsDir)) fs.mkdirSync(publicModelsDir, { recursive: true });
  if (!fs.existsSync(savedModelsDir)) fs.mkdirSync(savedModelsDir, { recursive: true });

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
    (err) => console.error('Error generating GLB:', err),
    { binary: true }
  );

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
    (err) => console.error('Error generating GLTF:', err),
    { binary: false }
  );
}

generateUltraRealisticBook();
