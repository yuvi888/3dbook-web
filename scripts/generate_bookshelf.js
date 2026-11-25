const { THREE, exportSceneModels } = require('./botanical_geo_node');

function addRoundedRectPath(path, w, h, r, cw) {
  const hw = w / 2;
  const hh = h / 2;
  const rad = Math.min(r, hw * 0.45, hh * 0.45);
  if (!cw) {
    path.moveTo(-hw + rad, -hh);
    path.lineTo(hw - rad, -hh);
    path.quadraticCurveTo(hw, -hh, hw, -hh + rad);
    path.lineTo(hw, hh - rad);
    path.quadraticCurveTo(hw, hh, hw - rad, hh);
    path.lineTo(-hw + rad, hh);
    path.quadraticCurveTo(-hw, hh, -hw, hh - rad);
    path.lineTo(-hw, -hh + rad);
    path.quadraticCurveTo(-hw, -hh, -hw + rad, -hh);
  } else {
    path.moveTo(-hw + rad, -hh);
    path.quadraticCurveTo(-hw, -hh, -hw, -hh + rad);
    path.lineTo(-hw, hh - rad);
    path.quadraticCurveTo(-hw, hh, -hw + rad, hh);
    path.lineTo(hw - rad, hh);
    path.quadraticCurveTo(hw, hh, hw, hh - rad);
    path.lineTo(hw, -hh + rad);
    path.quadraticCurveTo(hw, -hh, hw - rad, -hh);
    path.lineTo(-hw + rad, -hh);
  }
}

function buildHollowRoundedFrameGeometry(outerW, outerH, innerW, innerH, depth, outerR, innerR, bevel = 0.004) {
  const outer = new THREE.Shape();
  addRoundedRectPath(outer, outerW - bevel * 2, outerH - bevel * 2, outerR, false);
  const inner = new THREE.Path();
  addRoundedRectPath(inner, innerW + bevel * 2, innerH + bevel * 2, innerR, true);
  outer.holes.push(inner);

  const innerDepth = Math.max(0.002, depth - bevel * 2);
  const geo = new THREE.ExtrudeGeometry(outer, {
    steps: 1,
    depth: innerDepth,
    bevelEnabled: bevel > 0,
    bevelThickness: bevel,
    bevelSize: bevel,
    bevelSegments: 3,
    curveSegments: 16,
  });
  geo.translate(0, 0, -innerDepth / 2);
  geo.computeVertexNormals();
  return geo;
}

function buildKnifeEdgeShelfGeometry(width, thickness, zBack, zFront) {
  const halfH = thickness / 2;
  const s = new THREE.Shape();
  s.moveTo(zBack, -halfH);
  s.lineTo(zFront - 0.044, -halfH);
  s.lineTo(zFront, -0.003);
  s.lineTo(zFront, halfH - 0.003);
  s.lineTo(zFront - 0.003, halfH);
  s.lineTo(zBack, halfH);
  s.closePath();

  const geo = new THREE.ExtrudeGeometry(s, { steps: 1, depth: width, bevelEnabled: false });
  geo.translate(0, 0, -width / 2);
  geo.rotateY(-Math.PI / 2);
  geo.computeVertexNormals();
  return geo;
}

function buildChamferedDividerGeometry(thickness, height, zBack, zFront) {
  const halfT = thickness / 2;
  const s = new THREE.Shape();
  s.moveTo(zBack, -halfT);
  s.lineTo(zFront - 0.006, -halfT);
  s.lineTo(zFront, -halfT + 0.004);
  s.lineTo(zFront, halfT - 0.004);
  s.lineTo(zFront - 0.006, halfT);
  s.lineTo(zBack, halfT);
  s.closePath();

  const geo = new THREE.ExtrudeGeometry(s, { steps: 1, depth: height, bevelEnabled: false });
  geo.translate(0, 0, -height / 2);
  geo.rotateY(-Math.PI / 2);
  geo.rotateZ(-Math.PI / 2);
  geo.computeVertexNormals();
  return geo;
}

function buildFlutedOffWhiteBackGeometry(width, height, depth) {
  const geo = new THREE.BoxGeometry(width, height, depth, 260, 1, 1);
  const pos = geo.attributes.position;
  const period = 0.032;
  for (let i = 0; i < pos.count; i++) {
    const z = pos.getZ(i);
    if (z > 0) {
      const x = pos.getX(i);
      const wave = 0.5 + 0.5 * Math.cos((x / period) * Math.PI * 2);
      const reed = Math.pow(wave, 0.72) * 0.0036;
      pos.setZ(i, z + reed);
    }
  }
  pos.needsUpdate = true;
  geo.computeVertexNormals();
  return geo;
}

async function generateModernWhiteBookshelf() {
  const scene = new THREE.Scene();
  scene.name = 'Modern_White_Fluted_Illuminated_Bookshelf';

  const whiteMat = new THREE.MeshStandardMaterial({ color: '#faf9f5', roughness: 0.30, metalness: 0.02 });
  const offWhiteFlutedMat = new THREE.MeshStandardMaterial({ color: '#edeae2', roughness: 0.62, metalness: 0.02 });
  const rearOffWhiteMat = new THREE.MeshStandardMaterial({ color: '#f1efe8', roughness: 0.52, metalness: 0.01 });
  const champagneMat = new THREE.MeshStandardMaterial({ color: '#d2c2a3', roughness: 0.28, metalness: 0.82 });
  const mountMat = new THREE.MeshStandardMaterial({ color: '#d5d1c8', roughness: 0.36, metalness: 0.45 });
  const ledMat = new THREE.MeshStandardMaterial({ color: '#fff9ed', emissive: '#ffe09e', emissiveIntensity: 2.2 });

  const root = new THREE.Group();
  const add = (geo, mat, x, y, z) => {
    const m = new THREE.Mesh(geo, mat);
    m.position.set(x, y, z);
    root.add(m);
  };

  // Fluted Warm Off-White Interior Back Panel & Clean Off-White Exterior Casing
  add(buildFlutedOffWhiteBackGeometry(1.622, 1.362, 0.018), offWhiteFlutedMat, 0, 0, -0.134);
  add(new THREE.BoxGeometry(1.618, 1.358, 0.014), rearOffWhiteMat, 0, 0, -0.150);

  // Rear Concealed Aluminum French Cleats
  [0.44, -0.38].forEach((my) => add(new THREE.BoxGeometry(1.44, 0.044, 0.012), mountMat, 0, my, -0.163));
  [-0.68, 0.68].forEach((kx) => add(new THREE.BoxGeometry(0.040, 0.056, 0.010), mountMat, kx, 0.52, -0.162));

  // Rounded Outer Architectural Portal & Champagne Inlay Frame
  add(buildHollowRoundedFrameGeometry(1.700, 1.440, 1.616, 1.356, 0.320, 0.044, 0.016, 0.004), whiteMat, 0, 0, 0);
  add(buildHollowRoundedFrameGeometry(1.636, 1.376, 1.614, 1.354, 0.007, 0.020, 0.016, 0.001), champagneMat, 0, 0, 0.157);

  // Knife-Edge Shelves & Champagne Pinstripe Reveals
  add(buildKnifeEdgeShelfGeometry(1.620, 0.028, -0.128, 0.150), whiteMat, 0.0, 0.360, 0.0);
  add(buildKnifeEdgeShelfGeometry(1.196, 0.028, -0.128, 0.150), whiteMat, 0.214, 0.025, 0.0);
  add(buildKnifeEdgeShelfGeometry(1.216, 0.028, -0.128, 0.150), whiteMat, -0.204, -0.320, 0.0);

  add(new THREE.BoxGeometry(1.612, 0.0025, 0.0025), champagneMat, 0.0, 0.364, 0.150);
  add(new THREE.BoxGeometry(1.186, 0.0025, 0.0025), champagneMat, 0.214, 0.029, 0.150);
  add(new THREE.BoxGeometry(1.206, 0.0025, 0.0025), champagneMat, -0.204, -0.316, 0.150);

  // Recessed Vertical Partitions (100% Empty 9-Compartment Layout)
  add(buildChamferedDividerGeometry(0.024, 0.320, -0.128, 0.138), whiteMat, 0.08, 0.522, 0.0);
  add(buildChamferedDividerGeometry(0.024, 0.676, -0.128, 0.138), whiteMat, -0.38, 0.020, 0.0);
  add(buildChamferedDividerGeometry(0.024, 0.706, -0.128, 0.138), whiteMat, 0.40, -0.329, 0.0);
  add(buildChamferedDividerGeometry(0.024, 0.330, -0.128, 0.138), whiteMat, 0.26, 0.193, 0.0);
  add(buildChamferedDividerGeometry(0.024, 0.358, -0.128, 0.138), whiteMat, -0.22, -0.501, 0.0);

  // Bright Linear Compartment LED Diffusers + Tall-Bay Vertical Accent LEDs
  [
    [-0.36, 0.676, 0.025, 0.80, 0.005, 0.014],
    [0.44, 0.676, 0.025, 0.64, 0.005, 0.014],
    [-0.59, 0.344, 0.025, 0.36, 0.005, 0.014],
    [-0.06, 0.344, 0.025, 0.56, 0.005, 0.014],
    [0.53, 0.344, 0.025, 0.47, 0.005, 0.014],
    [0.01, 0.009, 0.025, 0.70, 0.005, 0.014],
    [0.60, 0.009, 0.025, 0.34, 0.005, 0.014],
    [-0.51, -0.336, 0.025, 0.52, 0.005, 0.014],
    [0.09, -0.336, 0.025, 0.54, 0.005, 0.014],
    [-0.804, 0.020, -0.095, 0.006, 0.58, 0.010],
    [0.804, -0.330, -0.095, 0.006, 0.60, 0.010],
  ].forEach(([lx, ly, lz, w, h, d]) => add(new THREE.BoxGeometry(w, h, d), ledMat, lx, ly, lz));

  scene.add(root);
  await exportSceneModels(scene, 'bookshelf_minimal_white', 'bookshelf');
}

generateModernWhiteBookshelf().catch(console.error);
