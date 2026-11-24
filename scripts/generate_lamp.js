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

async function generateRealisticLampModel() {
  console.log('Generating Modern Minimalist Sculptural Bookshelf Table Lamp 3D Model...');

  const scene = new THREE.Scene();
  scene.name = 'Modern_Minimalist_Sculptural_Bookshelf_Lamp';

  // =========================================================================
  // 1. PBR MATERIALS
  // =========================================================================

  // Brushed Champagne / Antique Brass (Base, Stem, Collar, Finial)
  const brushedBrassMat = new THREE.MeshStandardMaterial({
    name: 'Brushed_Champagne_Brass',
    color: new THREE.Color('#d4af37'),
    roughness: 0.22,
    metalness: 0.88,
  });

  // Polished Gold Accent (Dimmer Knob, Trim Rings)
  const polishedGoldMat = new THREE.MeshStandardMaterial({
    name: 'Polished_Gold_Trim',
    color: new THREE.Color('#f5d77f'),
    roughness: 0.12,
    metalness: 0.95,
  });

  // Matte Architectural Warm White Enamel / Satin Ceramic (Dome Shade Outer)
  const matteWhiteEnamelMat = new THREE.MeshStandardMaterial({
    name: 'Matte_Warm_White_Enamel',
    color: new THREE.Color('#faf8f5'),
    roughness: 0.32,
    metalness: 0.04,
  });

  // Glowing Opal Glass LED Diffuser (Underside of Dome)
  const opalDiffuserMat = new THREE.MeshStandardMaterial({
    name: 'Opal_Glass_LED_Diffuser',
    color: new THREE.Color('#fffbf0'),
    emissive: new THREE.Color('#ffdfa0'),
    emissiveIntensity: 1.85,
    roughness: 0.15,
    metalness: 0.0,
  });

  // Dark Anti-scratch Felt Base Ring
  const feltBaseMat = new THREE.MeshStandardMaterial({
    name: 'Felt_NonSlip_Base_Ring',
    color: new THREE.Color('#1c1917'),
    roughness: 0.92,
    metalness: 0.0,
  });

  // Root lamp container group
  const lampGroup = new THREE.Group();
  lampGroup.name = 'Lamp_Root';

  // Proportions scaled to fit shelf niches:
  // Total Height: ~0.26m (26cm)
  // Shade Diameter: ~0.18m (18cm)
  // Base Diameter: ~0.11m (11cm)

  // =========================================================================
  // 2. PEDESTAL BASE & CONTROLS
  // =========================================================================
  // A. Felt base padding (bottom-most disc)
  const feltGeo = new THREE.CylinderGeometry(0.052, 0.052, 0.003, 32);
  const feltMesh = new THREE.Mesh(feltGeo, feltBaseMat);
  feltMesh.position.y = 0.0015;
  feltMesh.name = 'Felt_Bottom_Pad';
  lampGroup.add(feltMesh);

  // B. Main Weighted Heavy Brass Plinth Base
  const basePlinthGeo = new THREE.CylinderGeometry(0.05, 0.054, 0.022, 36);
  const basePlinth = new THREE.Mesh(basePlinthGeo, brushedBrassMat);
  basePlinth.position.y = 0.014;
  basePlinth.castShadow = true;
  basePlinth.receiveShadow = true;
  basePlinth.name = 'Plinth_Brass_Base';
  lampGroup.add(basePlinth);

  // Stepped upper base bevel
  const baseBevelGeo = new THREE.CylinderGeometry(0.044, 0.05, 0.008, 36);
  const baseBevel = new THREE.Mesh(baseBevelGeo, brushedBrassMat);
  baseBevel.position.y = 0.029;
  baseBevel.castShadow = true;
  baseBevel.name = 'Base_Upper_Bevel';
  lampGroup.add(baseBevel);

  // C. Tactile Knurled Dimmer Button / Switch Dial on front of base
  const knobGeo = new THREE.CylinderGeometry(0.005, 0.005, 0.006, 20);
  const knobMesh = new THREE.Mesh(knobGeo, polishedGoldMat);
  knobMesh.rotation.x = Math.PI / 2;
  knobMesh.position.set(0, 0.018, 0.051);
  knobMesh.name = 'Tactile_Dimmer_Knob';
  lampGroup.add(knobMesh);

  // Small indicator ring around knob
  const knobRingGeo = new THREE.TorusGeometry(0.0065, 0.001, 16, 24);
  const knobRingMesh = new THREE.Mesh(knobRingGeo, polishedGoldMat);
  knobRingMesh.position.set(0, 0.018, 0.051);
  knobRingMesh.name = 'Dimmer_Trim_Ring';
  lampGroup.add(knobRingMesh);

  // =========================================================================
  // 3. SLENDER CENTRAL COLUMN STEM
  // =========================================================================
  // Lower collar ring
  const lowerCollarGeo = new THREE.CylinderGeometry(0.014, 0.018, 0.01, 28);
  const lowerCollar = new THREE.Mesh(lowerCollarGeo, polishedGoldMat);
  lowerCollar.position.y = 0.038;
  lowerCollar.name = 'Stem_Lower_Collar';
  lampGroup.add(lowerCollar);

  // Slender vertical column stem (gently tapering upward)
  const stemGeo = new THREE.CylinderGeometry(0.009, 0.012, 0.135, 28);
  const stemMesh = new THREE.Mesh(stemGeo, brushedBrassMat);
  stemMesh.position.y = 0.11;
  stemMesh.castShadow = true;
  stemMesh.name = 'Central_Stem_Column';
  lampGroup.add(stemMesh);

  // Upper neck collar below shade
  const upperCollarGeo = new THREE.CylinderGeometry(0.016, 0.01, 0.014, 28);
  const upperCollar = new THREE.Mesh(upperCollarGeo, polishedGoldMat);
  upperCollar.position.y = 0.184;
  upperCollar.name = 'Stem_Upper_Collar';
  lampGroup.add(upperCollar);

  // =========================================================================
  // 4. SCULPTURAL MUSHROOM DOME SHADE (Outer Shell + Inner Diffuser)
  // =========================================================================
  // Outer Dome Shell using half-sphere / curved silhouette
  // Sphere radius 0.09, clipped to top hemisphere with gentle flared skirt
  const domeGeo = new THREE.SphereGeometry(
    0.09,
    36,
    24,
    0,
    Math.PI * 2,
    0,
    Math.PI * 0.52
  );
  // Scale vertically to create a graceful elliptical mushroom cap
  domeGeo.scale(1, 0.65, 1);
  const domeMesh = new THREE.Mesh(domeGeo, matteWhiteEnamelMat);
  domeMesh.position.y = 0.205;
  domeMesh.castShadow = true;
  domeMesh.receiveShadow = true;
  domeMesh.name = 'Mushroom_Dome_Outer_Shade';
  lampGroup.add(domeMesh);

  // Dome lower rim lip (polished brass edge ring)
  const rimRingGeo = new THREE.TorusGeometry(0.0895, 0.0025, 16, 48);
  const rimRingMesh = new THREE.Mesh(rimRingGeo, polishedGoldMat);
  rimRingMesh.rotation.x = Math.PI / 2;
  rimRingMesh.position.y = 0.203;
  rimRingMesh.name = 'Shade_Brass_Rim_Lip';
  lampGroup.add(rimRingMesh);

  // Underside Frosted Opal Glass Diffuser Disc
  const diffuserGeo = new THREE.CylinderGeometry(0.086, 0.086, 0.004, 36);
  const diffuserMesh = new THREE.Mesh(diffuserGeo, opalDiffuserMat);
  diffuserMesh.position.y = 0.205;
  diffuserMesh.name = 'Opal_Glass_Diffuser_Disc';
  lampGroup.add(diffuserMesh);

  // Central under-shade brass socket cap
  const socketCapGeo = new THREE.CylinderGeometry(0.02, 0.014, 0.018, 24);
  const socketCap = new THREE.Mesh(socketCapGeo, brushedBrassMat);
  socketCap.position.y = 0.198;
  socketCap.name = 'Under_Socket_Cap';
  lampGroup.add(socketCap);

  // =========================================================================
  // 5. APEX FINIAL CAP (Top of Dome)
  // =========================================================================
  const finialBevelGeo = new THREE.CylinderGeometry(0.014, 0.018, 0.006, 24);
  const finialBevel = new THREE.Mesh(finialBevelGeo, polishedGoldMat);
  finialBevel.position.y = 0.264;
  finialBevel.name = 'Finial_Base_Bevel';
  lampGroup.add(finialBevel);

  const finialSphereGeo = new THREE.SphereGeometry(0.009, 20, 20);
  const finialSphere = new THREE.Mesh(finialSphereGeo, brushedBrassMat);
  finialSphere.position.y = 0.274;
  finialSphere.castShadow = true;
  finialSphere.name = 'Finial_Apex_Knob';
  lampGroup.add(finialSphere);

  scene.add(lampGroup);

  // =========================================================================
  // 6. EXPORT TO GLB & GLTF
  // =========================================================================
  const exporter = new GLTFExporter();

  const publicModelsDir = path.join(__dirname, '..', 'public', 'models');
  const savedModelsDir = path.join(__dirname, '..', 'saved_models', 'table_lamp');

  if (!fs.existsSync(publicModelsDir)) fs.mkdirSync(publicModelsDir, { recursive: true });
  if (!fs.existsSync(savedModelsDir)) fs.mkdirSync(savedModelsDir, { recursive: true });

  // Export Binary GLB
  exporter.parse(
    scene,
    (glbArrayBuffer) => {
      const buffer = Buffer.from(glbArrayBuffer);
      const pubGlbPath = path.join(publicModelsDir, 'table_lamp_realistic.glb');
      const savedGlbPath = path.join(savedModelsDir, 'table_lamp_realistic.glb');

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
      const pubGltfPath = path.join(publicModelsDir, 'table_lamp_realistic.gltf');
      const savedGltfPath = path.join(savedModelsDir, 'table_lamp_realistic.gltf');

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

generateRealisticLampModel();
