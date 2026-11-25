const { THREE, exportSceneModels } = require('./botanical_geo_node');

function buildCurvedVistaGeometry(width, height, curveDepth = 0.08) {
  const geo = new THREE.PlaneGeometry(width, height, 24, 1);
  const pos = geo.attributes.position;
  for (let i = 0; i < pos.count; i++) {
    const x = pos.getX(i);
    const normX = x / (width * 0.5);
    pos.setZ(i, curveDepth * normX * normX);
  }
  geo.computeVertexNormals();
  return geo;
}

async function buildWindowModel(variant) {
  const scene = new THREE.Scene();
  scene.name =
    variant === 'right'
      ? 'Architectural_Glass_Window_Right_Sea_Clouds'
      : 'Architectural_Glass_Window_Left_Sky_Grass';

  const winW = 1.24;
  const winH = 1.62;
  const frameD = 0.14;
  const innerW = winW - 0.11;
  const innerH = winH - 0.11;
  const transomY = 0.40;
  const sashW = innerW / 2 - 0.012;
  const lowerH = transomY - (-innerH / 2) - 0.02;
  const upperH = innerH / 2 - transomY - 0.02;
  const lowerCenterY = (-innerH / 2 + transomY) / 2;
  const upperCenterY = (innerH / 2 + transomY) / 2;

  const timberMat = new THREE.MeshStandardMaterial({ color: '#f2eee6', roughness: 0.42, metalness: 0.02 });
  const brassMat = new THREE.MeshStandardMaterial({ color: '#c89f4e', roughness: 0.24, metalness: 0.88 });
  const sillMat = new THREE.MeshStandardMaterial({ color: '#e6dfd3', roughness: 0.56, metalness: 0.02 });
  const glassMat = new THREE.MeshPhysicalMaterial({
    color: '#e2f2f8',
    transparent: true,
    opacity: 0.22,
    roughness: 0.03,
    metalness: 0.12,
    ior: 1.52,
    side: THREE.DoubleSide,
  });
  const vistaMat = new THREE.MeshStandardMaterial({
    color: variant === 'right' ? '#2c88a8' : '#78b4d8',
    roughness: 0.85,
  });

  const root = new THREE.Group();

  const addBox = (w, h, d, x, y, z, mat) => {
    const m = new THREE.Mesh(new THREE.BoxGeometry(w, h, d), mat);
    m.position.set(x, y, z);
    root.add(m);
  };

  // Outdoor scenery plane contained flush inside recessed exterior reveal box (-Z)
  const stuccoMat = new THREE.MeshStandardMaterial({ color: '#d8d2c6', roughness: 0.78 });
  const vista = new THREE.Mesh(buildCurvedVistaGeometry(1.16, 1.54, 0.035), vistaMat);
  vista.position.set(0, 0, -0.24);
  root.add(vista);
  addBox(1.22, 1.60, 0.016, 0, 0, -0.252, stuccoMat);
  addBox(0.04, 1.60, 0.22, -0.59, 0, -0.15, stuccoMat);
  addBox(0.04, 1.60, 0.22, 0.59, 0, -0.15, stuccoMat);
  addBox(1.22, 0.04, 0.22, 0, 0.78, -0.15, stuccoMat);
  addBox(1.22, 0.04, 0.22, 0, -0.78, -0.15, stuccoMat);

  // Jambs, architraves, crown & sill
  addBox(0.056, winH, frameD, -winW / 2 + 0.028, 0, 0, timberMat);
  addBox(0.056, winH, frameD, winW / 2 - 0.028, 0, 0, timberMat);
  addBox(winW, 0.056, frameD, 0, winH / 2 - 0.028, 0, timberMat);
  addBox(0.075, winH + 0.04, 0.022, -winW / 2 - 0.02, 0, frameD / 2 + 0.008, timberMat);
  addBox(0.075, winH + 0.04, 0.022, winW / 2 + 0.02, 0, frameD / 2 + 0.008, timberMat);
  addBox(winW + 0.14, 0.068, 0.036, 0, winH / 2 + 0.032, frameD / 2 + 0.012, timberMat);
  addBox(winW + 0.19, 0.026, 0.054, 0, winH / 2 + 0.074, frameD / 2 + 0.022, timberMat);
  addBox(winW + 0.18, 0.042, frameD + 0.095, 0, -winH / 2 + 0.012, 0.015, sillMat);
  addBox(winW + 0.10, 0.052, 0.024, 0, -winH / 2 - 0.034, frameD / 2 + 0.006, timberMat);

  // Transom & mullion
  addBox(innerW + 0.02, 0.048, frameD * 0.72, 0, transomY, 0, timberMat);
  addBox(0.046, innerH + 0.02, frameD * 0.62, 0, 0, 0, timberMat);

  [-1, 1].forEach((side) => {
    const cx = side * (sashW / 2 + 0.014);
    addBox(sashW, 0.036, 0.055, cx, -innerH / 2 + 0.022, 0, timberMat);
    addBox(sashW, 0.032, 0.055, cx, transomY - 0.036, 0, timberMat);
    addBox(0.032, lowerH, 0.055, cx - sashW / 2 + 0.016, lowerCenterY, 0, timberMat);
    addBox(0.032, lowerH, 0.055, cx + sashW / 2 - 0.016, lowerCenterY, 0, timberMat);
    addBox(sashW - 0.02, 0.022, 0.034, cx, lowerCenterY - 0.02, 0, timberMat);

    addBox(sashW, 0.028, 0.055, cx, transomY + 0.034, 0, timberMat);
    addBox(sashW, 0.032, 0.055, cx, innerH / 2 - 0.022, 0, timberMat);
    addBox(0.032, upperH, 0.055, cx - sashW / 2 + 0.016, upperCenterY, 0, timberMat);
    addBox(0.032, upperH, 0.055, cx + sashW / 2 - 0.016, upperCenterY, 0, timberMat);

    const g1 = new THREE.Mesh(new THREE.PlaneGeometry(sashW - 0.058, lowerH - 0.052), glassMat);
    g1.position.set(cx, lowerCenterY, 0.009);
    root.add(g1);
    const g2 = new THREE.Mesh(new THREE.PlaneGeometry(sashW - 0.058, upperH - 0.048), glassMat);
    g2.position.set(cx, upperCenterY, 0.009);
    root.add(g2);
  });

  // Brass handle & hinges
  addBox(0.024, 0.088, 0.008, 0.022, -0.18, 0.036, brassMat);
  const handle = new THREE.Mesh(new THREE.CapsuleGeometry(0.007, 0.076, 6, 10), brassMat);
  handle.position.set(0.022, -0.20, 0.072);
  root.add(handle);

  [-0.64, -0.22, 0.24].forEach((hy) => {
    const hL = new THREE.Mesh(new THREE.CylinderGeometry(0.006, 0.006, 0.048, 10), brassMat);
    hL.position.set(-winW / 2 + 0.056, hy, 0.032);
    root.add(hL);
    const hR = new THREE.Mesh(new THREE.CylinderGeometry(0.006, 0.006, 0.048, 10), brassMat);
    hR.position.set(winW / 2 - 0.056, hy, 0.032);
    root.add(hR);
  });

  scene.add(root);
  if (variant === 'right') {
    await exportSceneModels(scene, 'window_glass_sea_realistic', 'glass_window_sea');
  } else {
    await exportSceneModels(scene, 'window_glass_outdoor_realistic', 'glass_window');
  }
}

async function generateGlassWindows() {
  await buildWindowModel('left');
  await buildWindowModel('right');
}

generateGlassWindows().catch(console.error);
