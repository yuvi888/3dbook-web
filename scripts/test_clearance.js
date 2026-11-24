const THREE = require('three');

const potRadius = 0.068; // rim radius at y = 0.125
const potHeight = 0.125;
const potBottomRadius = potRadius * 0.94; // 0.06392

function potRadiusAtY(y) {
  if (y < 0 || y > potHeight) return 0;
  const factor = y / potHeight;
  return potBottomRadius + (potRadius - potBottomRadius) * factor;
}

console.log('Testing Botanical Foliage & Pot Clearance...');

// Test Vine Spline Generation
function createVinePoints(phi, lengthScale = 1.0) {
  return [
    new THREE.Vector3(0.024 * Math.cos(phi - 0.2), 0.112, 0.024 * Math.sin(phi - 0.2)),
    new THREE.Vector3(0.048 * Math.cos(phi - 0.08), 0.122, 0.048 * Math.sin(phi - 0.08)),
    new THREE.Vector3(0.074 * Math.cos(phi), 0.135, 0.074 * Math.sin(phi)), // Crest over rim
    new THREE.Vector3(0.080 * Math.cos(phi + 0.04), 0.100 * lengthScale + (1 - lengthScale) * 0.115, 0.080 * Math.sin(phi + 0.04)),
    new THREE.Vector3(0.084 * Math.cos(phi + 0.07), 0.065 * lengthScale + (1 - lengthScale) * 0.110, 0.084 * Math.sin(phi + 0.07)),
    new THREE.Vector3(0.086 * Math.cos(phi + 0.09), 0.028 * lengthScale + (1 - lengthScale) * 0.105, 0.086 * Math.sin(phi + 0.09)),
    new THREE.Vector3(0.084 * Math.cos(phi + 0.10), -0.005 * lengthScale + (1 - lengthScale) * 0.100, 0.084 * Math.sin(phi + 0.10)),
  ];
}

const vineAngles = [
  { name: 'Front-Left Cascade', phi: 2.2, len: 1.0 },
  { name: 'Right Side Cascade', phi: -0.6, len: 0.8 },
  { name: 'Front Center Flow', phi: 1.3, len: 0.65 },
  { name: 'Back-Left Flow', phi: 3.5, len: 0.55 },
];

let allPass = true;

vineAngles.forEach((v) => {
  const points = createVinePoints(v.phi, v.len);
  const curve = new THREE.CatmullRomCurve3(points);
  const samples = 100;
  let minClearance = 999;

  for (let i = 0; i <= samples; i++) {
    const t = i / samples;
    const p = curve.getPointAt(t);
    const r = Math.sqrt(p.x * p.x + p.z * p.z);
    const potR = potRadiusAtY(p.y);

    if (p.y >= 0 && p.y <= potHeight) {
      // Point is in vertical span of pot
      if (t < 0.28) {
        // Should be inside pot
        const clearance = (potR - 0.006) - r;
        if (clearance < 0) {
          console.error(`FAIL: Inside stem intersects wall on ${v.name} at t=${t.toFixed(2)}, y=${p.y.toFixed(3)}, r=${r.toFixed(3)}, potR=${potR.toFixed(3)}`);
          allPass = false;
        }
      } else {
        // Should be outside pot
        const clearance = r - (potR + 0.0035); // 3.5mm safety margin past pot wall
        if (clearance < minClearance) minClearance = clearance;
        if (clearance < 0) {
          console.error(`FAIL: Exterior stem cuts into pot wall on ${v.name} at t=${t.toFixed(2)}, y=${p.y.toFixed(3)}, r=${r.toFixed(3)}, potR=${potR.toFixed(3)}`);
          allPass = false;
        }
      }
    }
  }

  console.log(`Vine "${v.name}": Min exterior clearance past pot wall = ${(minClearance * 1000).toFixed(1)} mm`);
});

if (allPass) {
  console.log('SUCCESS: All vines cleanly clear the pot rim and wall with positive safety margin!');
}
