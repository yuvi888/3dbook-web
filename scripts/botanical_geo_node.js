const THREE = require('three');
const { GLTFExporter } = require('three/examples/jsm/exporters/GLTFExporter.js');
const fs = require('fs');
const path = require('path');

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

function buildTaperedTube(points, tubularSegs, radiusStart, radiusEnd, radialSegs = 8, capTip = true) {
  const curve = new THREE.CatmullRomCurve3(points);
  const frames = curve.computeFrenetFrames(tubularSegs, false);
  const verts = [];
  const normals = [];
  const uvs = [];
  const indices = [];

  for (let i = 0; i <= tubularSegs; i++) {
    const t = i / tubularSegs;
    const p = curve.getPointAt(t);
    const N = frames.normals[i];
    const B = frames.binormals[i];
    const r = radiusStart + (radiusEnd - radiusStart) * t;

    for (let j = 0; j <= radialSegs; j++) {
      const v = (j / radialSegs) * Math.PI * 2;
      const sin = Math.sin(v);
      const cos = -Math.cos(v);
      const nx = cos * N.x + sin * B.x;
      const ny = cos * N.y + sin * B.y;
      const nz = cos * N.z + sin * B.z;

      verts.push(p.x + r * nx, p.y + r * ny, p.z + r * nz);
      normals.push(nx, ny, nz);
      uvs.push(j / radialSegs, t);
    }
  }

  for (let i = 0; i < tubularSegs; i++) {
    for (let j = 0; j < radialSegs; j++) {
      const a = i * (radialSegs + 1) + j;
      const b = (i + 1) * (radialSegs + 1) + j;
      const c = (i + 1) * (radialSegs + 1) + (j + 1);
      const d = i * (radialSegs + 1) + (j + 1);
      indices.push(a, b, d, b, c, d);
    }
  }

  if (capTip) {
    const tipCenter = curve.getPointAt(1);
    const tipTangent = curve.getTangentAt(1);
    const tipApex = tipCenter.clone().add(tipTangent.multiplyScalar(radiusEnd * 1.4));
    const tipIdx = verts.length / 3;
    verts.push(tipApex.x, tipApex.y, tipApex.z);
    normals.push(tipTangent.x, tipTangent.y, tipTangent.z);
    uvs.push(0.5, 1);

    const lastRingStart = tubularSegs * (radialSegs + 1);
    for (let j = 0; j < radialSegs; j++) {
      indices.push(lastRingStart + j, tipIdx, lastRingStart + j + 1);
    }
  }

  const geo = new THREE.BufferGeometry();
  geo.setAttribute('position', new THREE.Float32BufferAttribute(verts, 3));
  geo.setAttribute('normal', new THREE.Float32BufferAttribute(normals, 3));
  geo.setAttribute('uv', new THREE.Float32BufferAttribute(uvs, 2));
  geo.setIndex(indices);
  return geo;
}

function buildSoilMoundGeometry(radius, domeHeight = 0.008) {
  const geo = new THREE.PlaneGeometry(radius * 2.02, radius * 2.02, 24, 24);
  geo.rotateX(-Math.PI / 2);
  const pos = geo.attributes.position;
  for (let i = 0; i < pos.count; i++) {
    let x = pos.getX(i);
    let z = pos.getZ(i);
    const r = Math.sqrt(x * x + z * z);
    if (r > radius) {
      x *= radius / r;
      z *= radius / r;
    }
    const normR = Math.min(1, r / radius);
    const dome = (1 - normR * normR) * domeHeight;
    const bump = domeHeight * 0.25 * Math.sin(x * (7 / radius)) * Math.cos(z * (7 / radius));
    pos.setXYZ(i, x, dome + bump * (1 - normR * 0.6), z);
  }
  geo.computeVertexNormals();
  return geo;
}

async function exportSceneModels(scene, baseName, savedFolder) {
  const exporter = new GLTFExporter();
  const outputDir = path.join(__dirname, '..', 'public', 'models');
  const savedDir = path.join(__dirname, '..', 'saved_models', savedFolder);
  fs.mkdirSync(outputDir, { recursive: true });
  fs.mkdirSync(savedDir, { recursive: true });

  const glbBuffer = await exporter.parseAsync(scene, { binary: true });
  const buf = Buffer.from(glbBuffer);
  fs.writeFileSync(path.join(outputDir, `${baseName}.glb`), buf);
  fs.writeFileSync(path.join(savedDir, `${baseName}.glb`), buf);

  const gltfJson = await exporter.parseAsync(scene, { binary: false });
  const jsonStr = JSON.stringify(gltfJson, null, 2);
  fs.writeFileSync(path.join(outputDir, `${baseName}.gltf`), jsonStr, 'utf8');
  fs.writeFileSync(path.join(savedDir, `${baseName}.gltf`), jsonStr, 'utf8');

  console.log(`✅ Exported ${baseName}.glb (${(buf.length / 1024).toFixed(1)} KB) & .gltf`);
}

function orientLeafSkyward(dirVec, roll = 0) {
  const yAxis = dirVec.clone().normalize();
  const worldUp = new THREE.Vector3(0, 1, 0);
  let xAxis = new THREE.Vector3().crossVectors(yAxis, worldUp);
  if (xAxis.lengthSq() < 1e-4) {
    xAxis = new THREE.Vector3(1, 0, 0);
  } else {
    xAxis.normalize();
  }
  const zAxis = new THREE.Vector3().crossVectors(xAxis, yAxis).normalize();
  const mat = new THREE.Matrix4().makeBasis(xAxis, yAxis, zAxis);
  const q = new THREE.Quaternion().setFromRotationMatrix(mat);
  if (roll !== 0) q.premultiply(new THREE.Quaternion().setFromAxisAngle(yAxis, roll));
  return q;
}

function orientBloomOutward(dirVec, outwardPos) {
  const yAxis = dirVec.clone().normalize();
  const radial = new THREE.Vector3(outwardPos.x, 0.35, outwardPos.z);
  if (radial.lengthSq() < 1e-4) radial.set(0, 0.35, 1);
  let xAxis = new THREE.Vector3().crossVectors(yAxis, radial.normalize());
  if (xAxis.lengthSq() < 1e-4) xAxis = new THREE.Vector3(1, 0, 0);
  else xAxis.normalize();
  const zAxis = new THREE.Vector3().crossVectors(xAxis, yAxis).normalize();
  const mat = new THREE.Matrix4().makeBasis(xAxis, yAxis, zAxis);
  return new THREE.Quaternion().setFromRotationMatrix(mat);
}

module.exports = { THREE, buildTaperedTube, buildSoilMoundGeometry, orientLeafSkyward, orientBloomOutward, exportSceneModels };
