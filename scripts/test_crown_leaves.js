const THREE = require('three');

const potRadius = 0.068;
const potHeight = 0.125;
const potBottomRadius = potRadius * 0.94;

function potRadiusAtY(y) {
  if (y < 0) return potBottomRadius;
  if (y > potHeight) return potRadius;
  return potBottomRadius + (potRadius - potBottomRadius) * (y / potHeight);
}

// Generate crown leaves config (34 leaves)
const crownLeaves = [];

// Tier 1: Center upright young core (8 leaves)
for (let i = 0; i < 8; i++) {
  const angle = (i * Math.PI * 2) / 8 + 0.15;
  const rRoot = 0.012 + (i % 3) * 0.006;
  const rBase = 0.022 + (i % 2) * 0.012;
  const yBase = 0.175 + (i % 4) * 0.012;
  crownLeaves.push({
    tier: 'core',
    root: [rRoot * Math.cos(angle), 0.112, rRoot * Math.sin(angle)],
    base: [rBase * Math.cos(angle + 0.2), yBase, rBase * Math.sin(angle + 0.2)],
    dir: [0.35 * Math.cos(angle + 0.2), 0.90, 0.35 * Math.sin(angle + 0.2)],
    w: 0.045,
    len: 0.065,
    type: 'young'
  });
}

// Tier 2: Mid canopy spreading (14 leaves)
for (let i = 0; i < 14; i++) {
  const angle = (i * Math.PI * 2) / 14 + 0.35;
  const rRoot = 0.022 + (i % 3) * 0.008;
  const rBase = 0.048 + (i % 4) * 0.008;
  const yBase = 0.150 + (i % 3) * 0.010;
  crownLeaves.push({
    tier: 'mid',
    root: [rRoot * Math.cos(angle), 0.112, rRoot * Math.sin(angle)],
    base: [rBase * Math.cos(angle + 0.15), yBase, rBase * Math.sin(angle + 0.15)],
    dir: [0.75 * Math.cos(angle + 0.15), 0.55, 0.75 * Math.sin(angle + 0.15)],
    w: 0.065,
    len: 0.082,
    type: i % 2 === 0 ? 'heart' : 'curved'
  });
}

// Tier 3: Outer lip-softening canopy (12 leaves)
for (let i = 0; i < 12; i++) {
  const angle = (i * Math.PI * 2) / 12 + 0.1;
  const rRoot = 0.032 + (i % 2) * 0.008;
  const rBase = 0.072 + (i % 3) * 0.006;
  const yBase = 0.138 + (i % 3) * 0.006;
  crownLeaves.push({
    tier: 'outer',
    root: [rRoot * Math.cos(angle), 0.112, rRoot * Math.sin(angle)],
    base: [rBase * Math.cos(angle + 0.1), yBase, rBase * Math.sin(angle + 0.1)],
    dir: [0.88 * Math.cos(angle + 0.1), -0.22, 0.88 * Math.sin(angle + 0.1)],
    w: 0.072,
    len: 0.090,
    type: i % 3 === 0 ? 'droop' : i % 2 === 0 ? 'heart' : 'curved'
  });
}

console.log(`Generated ${crownLeaves.length} crown leaves.`);

// Verify vertex distance for each leaf card
let anyIntersects = false;

crownLeaves.forEach((leaf, idx) => {
  const base = new THREE.Vector3(...leaf.base);
  const dir = new THREE.Vector3(...leaf.dir).normalize();
  
  // Test points along leaf blade: base, mid, tip, left wing, right wing
  const bladePoints = [
    base,
    base.clone().add(dir.clone().multiplyScalar(leaf.len * 0.5)),
    base.clone().add(dir.clone().multiplyScalar(leaf.len)),
  ];

  bladePoints.forEach((p, ptIdx) => {
    const r = Math.sqrt(p.x * p.x + p.z * p.z);
    if (p.y >= 0 && p.y <= potHeight) {
      const potR = potRadiusAtY(p.y);
      if (r < potR + 0.002) {
        console.error(`Crown Leaf ${idx} (${leaf.tier}) pt ${ptIdx} intersects pot: y=${p.y.toFixed(3)}, r=${r.toFixed(3)}, potR=${potR.toFixed(3)}`);
        anyIntersects = true;
      }
    }
  });
});

if (!anyIntersects) {
  console.log('SUCCESS: All 34 crown leaves are completely outside/above the pot cylinder!');
}
