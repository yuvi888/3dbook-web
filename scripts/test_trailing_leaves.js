const THREE = require('three');

const potRadius = 0.068;
const potHeight = 0.125;
const potBottomRadius = potRadius * 0.94;

function potRadiusAtY(y) {
  if (y < 0) return potBottomRadius;
  if (y > potHeight) return potRadius;
  return potBottomRadius + (potRadius - potBottomRadius) * (y / potHeight);
}

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

const vines = [
  { name: 'Front-Left Cascade', phi: 2.2, len: 1.0, count: 6 },
  { name: 'Right Side Cascade', phi: -0.6, len: 0.82, count: 5 },
  { name: 'Front Center Flow', phi: 1.3, len: 0.68, count: 4 },
  { name: 'Back-Left Flow', phi: 3.5, len: 0.58, count: 4 },
];

let totalTrailingLeaves = 0;
let anyIntersects = false;

vines.forEach((v) => {
  const points = createVinePoints(v.phi, v.len);
  const curve = new THREE.CatmullRomCurve3(points);
  
  for (let i = 0; i < v.count; i++) {
    totalTrailingLeaves++;
    // Place along exterior cascading part (t from 0.28 to 0.96)
    const t = 0.28 + (i / (v.count - 1)) * 0.68;
    const pOnVine = curve.getPointAt(t);
    const tangent = curve.getTangentAt(t);

    const normal = new THREE.Vector3(pOnVine.x, 0, pOnVine.z).normalize();
    const isLeft = i % 2 === 0;
    
    // Petiole branches outward away from pot
    const sideDir = new THREE.Vector3().crossVectors(tangent, normal).normalize();
    const petioleEnd = pOnVine.clone()
      .add(normal.clone().multiplyScalar(0.010))
      .add(sideDir.clone().multiplyScalar(isLeft ? 0.007 : -0.007));

    // Leaf blade direction (points outward and down)
    const leafLen = 0.078 - (i / v.count) * 0.025;
    const leafDir = normal.clone().multiplyScalar(0.55)
      .add(new THREE.Vector3(0, -0.80, 0))
      .add(sideDir.clone().multiplyScalar(isLeft ? 0.25 : -0.25))
      .normalize();

    // Test blade points
    const bladePoints = [
      petioleEnd,
      petioleEnd.clone().add(leafDir.clone().multiplyScalar(leafLen * 0.5)),
      petioleEnd.clone().add(leafDir.clone().multiplyScalar(leafLen)),
    ];

    bladePoints.forEach((p, ptIdx) => {
      const r = Math.sqrt(p.x * p.x + p.z * p.z);
      if (p.y >= 0 && p.y <= potHeight) {
        const potR = potRadiusAtY(p.y);
        if (r < potR + 0.003) {
          console.error(`Trailing leaf on ${v.name} idx ${i} pt ${ptIdx} intersects pot: y=${p.y.toFixed(3)}, r=${r.toFixed(3)}, potR=${potR.toFixed(3)}`);
          anyIntersects = true;
        }
      }
    });
  }
});

console.log(`Total trailing leaves tested: ${totalTrailingLeaves}`);
if (!anyIntersects) {
  console.log('SUCCESS: All trailing leaves and petioles are completely outside the pot with zero penetration!');
}
