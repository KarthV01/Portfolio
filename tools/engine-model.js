// Simplified LT6-inspired component illustrations. Not factory CAD.
// Coordinates: crankshaft along Z, two four-cylinder banks at +/-45 degrees.
import * as T from "three";
import { RoundedBoxGeometry } from "three/addons/geometries/RoundedBoxGeometry.js";

const colors = {
  alloy: 0xe8e9e7,
  machined: 0xf5f5f1,
  steel: 0x9ca6ad,
  dark: 0x38434c,
  ceramic: 0xfaf9f2,
  accent: 0x8fa8c5,
  gasket: 0x727d86,
  firing: 0xd8783c,
};
const mat = Object.fromEntries(
  Object.entries(colors).map(([name, color]) => [
    name,
    new T.MeshBasicMaterial({ color: name === "accent" ? 0x244fba : 0x14171d }),
  ]),
);
const ink = new T.LineBasicMaterial({
  color: 0xe2eaff,
  transparent: true,
  opacity: 0.95,
});
const hull = new T.MeshBasicMaterial({ color: 0xb5c9ee, side: T.BackSide });
const Y = new T.Vector3(0, 1, 0);
const vec = (a) => new T.Vector3(...a);
const zs = [-1.53, -0.51, 0.51, 1.53];

function mesh(
  parent,
  geometry,
  material = "alloy",
  pos = [0, 0, 0],
  edges = true,
) {
  const object = new T.Mesh(geometry, mat[material]);
  object.position.set(...pos);
  parent.add(object);
  if (edges)
    object.add(new T.LineSegments(new T.EdgesGeometry(geometry, 32), ink));
  // Inverted surface hulls give curved parts their technical-illustration silhouette.
  const outline = new T.Mesh(geometry, hull);
  outline.scale.setScalar(1.012);
  object.add(outline);
  return object;
}
function box(p, w, h, d, pos, material = "alloy", radius = 0.04) {
  return mesh(
    p,
    new RoundedBoxGeometry(w, h, d, 2, Math.min(radius, w / 4, h / 4, d / 4)),
    material,
    pos,
  );
}
function cyl(p, r, h, pos, material = "machined", rt = r, segments = 48) {
  return mesh(p, new T.CylinderGeometry(rt, r, h, segments), material, pos);
}
function ring(p, r, t, pos, material = "steel", axis = "y") {
  const o = mesh(p, new T.TorusGeometry(r, t, 8, 64), material, pos, false);
  if (axis === "y") o.rotation.x = Math.PI / 2;
  return o;
}
function rod(p, a, b, r, material = "steel") {
  const av = vec(a),
    bv = vec(b),
    delta = bv.clone().sub(av);
  const o = cyl(
    p,
    r,
    delta.length(),
    av.clone().add(bv).multiplyScalar(0.5).toArray(),
    material,
  );
  o.quaternion.setFromUnitVectors(Y, delta.normalize());
  return o;
}
function tube(p, points, r = 0.13, material = "machined") {
  return mesh(
    p,
    new T.TubeGeometry(
      new T.CatmullRomCurve3(points.map(vec)),
      40,
      r,
      12,
      false,
    ),
    material,
    [0, 0, 0],
    false,
  );
}
function bolt(p, pos, axis = "y", size = 0.055) {
  const o = cyl(p, size, 0.055, pos, "steel", size, 6);
  if (axis === "z") o.rotation.x = Math.PI / 2;
  if (axis === "x") o.rotation.z = Math.PI / 2;
  return o;
}
function lathe(p, profile, pos = [0, 0, 0], material = "machined") {
  return mesh(
    p,
    new T.LatheGeometry(
      profile.map(([r, y]) => new T.Vector2(r, y)),
      64,
    ),
    material,
    pos,
  );
}
function bank(parent, side) {
  const g = new T.Group();
  g.rotation.z = (-side * Math.PI) / 4;
  parent.add(g);
  return g;
}
function plateWithBores(parent) {
  const shape = new T.Shape();
  shape.moveTo(-0.63, -2.12);
  shape.lineTo(-0.47, -2.3);
  shape.lineTo(0.47, -2.3);
  shape.lineTo(0.63, -2.12);
  shape.lineTo(0.63, 2.12);
  shape.lineTo(0.47, 2.3);
  shape.lineTo(-0.47, 2.3);
  shape.lineTo(-0.63, 2.12);
  shape.closePath();
  zs.forEach((z) => {
    const hole = new T.Path();
    hole.absarc(0, z, 0.414, 0, Math.PI * 2, true);
    shape.holes.push(hole);
  });
  const g = new T.ExtrudeGeometry(shape, {
    depth: 1.02,
    bevelEnabled: true,
    bevelSize: 0.018,
    bevelThickness: 0.018,
    bevelSegments: 2,
    steps: 1,
    curveSegments: 36,
  });
  g.rotateX(-Math.PI / 2);
  return mesh(parent, g, "alloy", [0, 0.66, 0]);
}

function block() {
  const g = new T.Group();
  box(g, 1.72, 0.88, 4.62, [0, 0.08, 0], "alloy", 0.16);
  box(g, 1.84, 0.12, 4.72, [0, -0.42, 0], "machined");
  box(g, 1.48, 0.49, 4.3, [0, -0.7, 0], "alloy", 0.15);
  for (const side of [-1, 1]) {
    const b = bank(g, side);
    plateWithBores(b);
    zs.forEach((z) => {
      ring(b, 0.418, 0.017, [0, 1.7, z], "steel");
      box(b, 0.11, 0.95, 0.12, [side * 0.67, 1.1, z], "alloy");
      for (const x of [-0.52, 0.52])
        for (const dz of [-0.34, 0.34]) bolt(b, [x, 1.72, z + dz]);
      box(g, 0.13, 0.55, 0.14, [side * 0.87, -0.05, z]);
      bolt(g, [side * 0.83, -0.32, z]);
    });
    for (let z = -2.1; z <= 2.1; z += 0.42) bolt(g, [side * 0.85, -0.47, z]);
    for (let z = -1.9; z <= 1.9; z += 0.38)
      box(g, 0.05, 0.18, 0.08, [side * 0.75, -0.75, z]);
  }
  for (const z of [-2.34, 2.34]) {
    const front = cyl(g, 0.71, 0.14, [0, 0.1, z], "alloy");
    front.rotation.x = Math.PI / 2;
    ring(g, 0.34, 0.06, [0, 0.1, z + Math.sign(z) * 0.08], "steel", "z");
    for (let i = 0; i < 8; i++) {
      const a = (i * Math.PI) / 4;
      bolt(
        g,
        [Math.cos(a) * 0.56, 0.1 + Math.sin(a) * 0.56, z + Math.sign(z) * 0.1],
        "z",
      );
    }
  }
  return g;
}
function heads() {
  const g = new T.Group();
  for (const side of [-1, 1]) {
    const b = bank(g, side);
    box(b, 1.34, 0.27, 4.76, [0, 1.88, 0], "machined");
    box(b, 1.3, 0.09, 4.7, [0, 2.04, 0], "gasket");
    box(b, 1.22, 0.33, 4.6, [0, 2.22, 0], "alloy", 0.12);
    // Twin cam galleries and cast cover ridges.
    for (const x of [-0.35, 0.35]) {
      const cam = cyl(b, 0.22, 4.38, [x, 2.34, 0], "alloy");
      cam.rotation.x = Math.PI / 2;
      for (const z of [-2.2, 2.2]) {
        const cap = cyl(b, 0.245, 0.075, [x, 2.34, z]);
        cap.rotation.x = Math.PI / 2;
      }
    }
    box(b, 0.36, 0.045, 2.9, [0, 2.4, 0], "accent");
    for (let z = -1.8; z <= 1.8; z += 0.15)
      box(b, 0.24, 0.014, 0.022, [0, 2.43, z], "machined", 0.002);
    for (const z of zs) {
      cyl(b, 0.14, 0.14, [0, 2.46, z], "dark");
      for (const x of [-0.56, 0.56]) bolt(b, [x, 2.34, z]);
    }
    const oil = cyl(b, 0.19, 0.16, [0.35, 2.59, 1.7], "dark");
    for (let i = 0; i < 12; i++) {
      const a = (i * Math.PI) / 6;
      box(
        b,
        0.035,
        0.12,
        0.035,
        [0.35 + 0.18 * Math.cos(a), 2.59, 1.7 + 0.18 * Math.sin(a)],
        "steel",
      );
    }
  }
  return g;
}
function plug() {
  const g = new T.Group();
  lathe(g, [
    [0.042, 0],
    [0.052, 0.02],
    [0.052, 0.09],
    [0.055, 0.1],
    [0.055, 0.35],
    [0.1, 0.36],
    [0.1, 0.4],
    [0.08, 0.43],
    [0.07, 0.47],
    [0.062, 0.82],
    [0.045, 0.86],
    [0.045, 0.98],
    [0.034, 1.01],
  ]);
  cyl(g, 0.105, 0.11, [0, 0.4, 0], "steel", 0.105, 6);
  lathe(
    g,
    [
      [0.055, 0.48],
      [0.059, 0.5],
      [0.063, 0.79],
      [0.048, 0.84],
    ],
    [0, 0, 0],
    "ceramic",
  );
  for (let y = 0.53; y < 0.8; y += 0.048)
    ring(g, 0.064, 0.013, [0, y, 0], "ceramic");
  for (let y = 0.1; y < 0.35; y += 0.025)
    ring(g, 0.055, 0.006, [0, y, 0], "steel");
  rod(g, [0, 0, 0], [0, -0.06, 0], 0.015, "steel");
  tube(
    g,
    [
      [0.045, 0.035, 0],
      [0.045, -0.075, 0],
      [0.01, -0.085, 0],
    ],
    0.012,
    "steel",
  );
  ring(g, 0.085, 0.012, [0, 0.35, 0], "gasket");
  return g;
}
function pistonUnit() {
  const g = new T.Group();
  lathe(g, [
    [0.34, -0.23],
    [0.39, -0.18],
    [0.39, 0.16],
    [0.397, 0.2],
    [0.397, 0.23],
    [0.35, 0.245],
    [0.28, 0.215],
    [0, 0.215],
  ]);
  for (const y of [0.08, 0.135, 0.19]) ring(g, 0.395, 0.012, [0, y, 0], "dark");
  const pin = cyl(g, 0.09, 0.78, [0, -0.07, 0], "steel");
  pin.rotation.z = Math.PI / 2;
  // Forged connecting rod: flanged I-section with a bored big end.
  box(g, 0.13, 0.78, 0.11, [0, -0.65, 0], "steel");
  for (const z of [-0.065, 0.065])
    box(g, 0.22, 0.82, 0.035, [0, -0.65, z], "machined");
  ring(g, 0.195, 0.075, [0, -1.08, 0], "machined", "z");
  ring(g, 0.14, 0.018, [0, -1.08, 0.073], "steel", "z");
  box(g, 0.45, 0.105, 0.23, [0, -1.24, 0]);
  for (const x of [-0.2, 0.2]) {
    bolt(g, [x, -1.18, 0]);
    rod(g, [x, -1.34, 0], [x, -1.11, 0], 0.035);
  }
  return g;
}
function crankshaft() {
  const g = new T.Group();
  const shaft = cyl(g, 0.16, 5.45, [0, 0, 0], "steel");
  shaft.rotation.x = Math.PI / 2;
  for (let i = 0; i < 5; i++) {
    const z = -2.04 + i * 1.02;
    const bearing = cyl(g, 0.245, 0.28, [0, 0, z]);
    bearing.rotation.x = Math.PI / 2;
    ring(g, 0.245, 0.012, [0, 0, z + 0.1], "dark", "z");
  }
  zs.forEach((z, i) => {
    const offset = (i === 0 || i === 3 ? 1 : -1) * 0.32;
    for (const dz of [-0.32, 0.32]) {
      // Rounded counterweights opposite each flat-plane throw.
      const w = cyl(g, 0.41, 0.16, [0, -offset * 0.6, z + dz], "steel");
      w.rotation.x = Math.PI / 2;
      box(g, 0.36, 0.55, 0.15, [0, offset * 0.25, z + dz], "steel", 0.07);
    }
    const pin = cyl(g, 0.18, 0.49, [0, offset, z]);
    pin.rotation.x = Math.PI / 2;
    for (const dz of [-0.2, 0.2])
      ring(g, 0.18, 0.01, [0, offset, z + dz], "dark", "z");
  });
  const flange = cyl(g, 0.49, 0.18, [0, 0, 2.68]);
  flange.rotation.x = Math.PI / 2;
  for (let i = 0; i < 8; i++) {
    const a = (i * Math.PI) / 4;
    bolt(g, [0.35 * Math.cos(a), 0.35 * Math.sin(a), 2.79], "z");
  }
  const pulley = cyl(g, 0.55, 0.24, [0, 0, -2.73], "dark");
  pulley.rotation.x = Math.PI / 2;
  for (const z of [-2.85, -2.77, -2.69])
    ring(g, 0.55, 0.018, [0, 0, z], "steel", "z");
  const hub = cyl(g, 0.17, 0.28, [0, 0, -2.78]);
  hub.rotation.x = Math.PI / 2;
  return g;
}
function intake() {
  const g = new T.Group();
  for (const side of [-1, 1]) {
    box(g, 0.68, 0.49, 4.05, [side * 0.46, 2.35, 0], "accent", 0.2);
    for (const z of zs) {
      tube(
        g,
        [
          [side * 0.47, 2.28, z],
          [side * 0.68, 2.12, z],
          [side * 0.98, 1.99, z],
          [side * 1.2, 1.7, z],
        ],
        0.16,
      );
      ring(g, 0.17, 0.027, [side * 1.2, 1.7, z], "steel");
    }
    const throttle = cyl(g, 0.28, 0.45, [side * 0.46, 2.35, 2.2]);
    throttle.rotation.x = Math.PI / 2;
    ring(g, 0.28, 0.04, [side * 0.46, 2.35, 2.44], "steel", "z");
    const opening = cyl(g, 0.235, 0.014, [side * 0.46, 2.35, 2.45], "dark");
    opening.rotation.x = Math.PI / 2;
    for (let z = -1.7; z < 1.8; z += 0.22)
      box(g, 0.45, 0.025, 0.045, [side * 0.46, 2.6, z], "machined");
  }
  tube(
    g,
    [
      [-0.46, 2.35, -1.4],
      [0, 2.45, -1.4],
      [0.46, 2.35, -1.4],
    ],
    0.13,
  );
  return g;
}
function headers() {
  const g = new T.Group();
  for (const side of [-1, 1]) {
    zs.forEach((z, i) => {
      box(g, 0.09, 0.35, 0.48, [side * 1.52, 1.25, z], "steel");
      for (const dz of [-0.18, 0.18]) bolt(g, [side * 1.58, 1.25, z + dz], "x");
      tube(
        g,
        [
          [side * 1.53, 1.25, z],
          [side * 1.93, 1.21, z],
          [side * (2.22 + i * 0.12), 0.72, z + 0.13],
          [side * (2.26 + i * 0.09), 0.07, z + 0.4],
          [side * (i === 0 || i === 3 ? 2.02 : 2.38), -0.16, 2.2],
        ],
        0.135,
      );
    });
    // Pair cylinders 360 crank degrees apart before the final collector.
    for (const x of [2.02, 2.38]) {
      tube(
        g,
        [
          [side * x, -0.16, 2.2],
          [side * x, -0.16, 2.5],
          [side * 2.18, -0.16, 2.85],
        ],
        0.19,
      );
    }
    const collector = cyl(
      g,
      0.3,
      0.63,
      [side * 2.18, -0.16, 3.07],
      "alloy",
      0.21,
    );
    collector.rotation.x = Math.PI / 2;
    ring(g, 0.3, 0.028, [side * 2.18, -0.16, 3.4], "steel", "z");
    const opening = cyl(g, 0.262, 0.018, [side * 2.18, -0.16, 3.41], "dark");
    opening.rotation.x = Math.PI / 2;
    for (let i = 0; i < 3; i++)
      ring(g, 0.292, 0.008, [side * 2.18, -0.16, 2.9 + i * 0.08], "steel", "z");
    rod(g, [side * 2.21, 0.08, 2.6], [side * 2.27, 0.4, 2.6], 0.045, "steel");
  }
  return g;
}
function transmission() {
  const g = new T.Group();
  // Bellhousing and ribbed transaxle case, longitudinal to the crankshaft.
  const bell = cyl(g, 0.63, 1.1, [0, 0, 3.23], "alloy", 0.95);
  bell.rotation.x = Math.PI / 2;
  ring(g, 0.94, 0.045, [0, 0, 2.68], "machined", "z");
  box(g, 1.15, 1.0, 1.7, [0, -0.1, 4.45], "alloy", 0.2);
  for (let z = 3.8; z < 5.2; z += 0.19) {
    box(g, 1.21, 0.055, 0.05, [0, 0.44, z]);
    box(g, 0.055, 1.05, 0.05, [-0.59, -0.08, z]);
    box(g, 0.055, 1.05, 0.05, [0.59, -0.08, z]);
  }
  for (let i = 0; i < 12; i++) {
    const a = (i * Math.PI) / 6;
    bolt(g, [0.86 * Math.cos(a), 0.86 * Math.sin(a), 2.63], "z");
    rod(
      g,
      [0.84 * Math.cos(a), 0.84 * Math.sin(a), 2.77],
      [0.55 * Math.cos(a), 0.55 * Math.sin(a), 3.75],
      0.026,
    );
  }
  for (const side of [-1, 1]) {
    const shaft = cyl(g, 0.18, 0.7, [side * 0.75, -0.12, 4.7], "steel");
    shaft.rotation.z = Math.PI / 2;
    ring(g, 0.24, 0.06, [side * 0.62, -0.12, 4.7], "steel").rotation.z =
      Math.PI / 2;
  }
  return g;
}
function ecu() {
  const g = new T.Group();
  box(g, 1.28, 0.18, 1.72, [0, 0, 0], "alloy");
  box(g, 1.13, 0.07, 1.52, [0, 0.11, 0], "machined");
  for (let x = -0.5; x <= 0.5; x += 0.09)
    box(g, 0.032, 0.08, 1.36, [x, 0.18, 0], "alloy");
  for (const z of [-0.58, 0.04, 0.6]) {
    box(g, 0.34, 0.22, 0.4, [0.75, 0, z], "dark");
    for (let i = 0; i < 4; i++)
      rod(
        g,
        [0.8, 0.04, z - 0.12 + i * 0.08],
        [1.02, 0.04, z - 0.12 + i * 0.08],
        0.016,
        "machined",
      );
  }
  for (const x of [-0.55, 0.55])
    for (const z of [-0.75, 0.75]) bolt(g, [x, 0.16, z]);
  for (let i = 0; i < 5; i++)
    tube(
      g,
      [
        [0.95, -0.04, -0.58 + i * 0.1],
        [1.22, -0.1, -0.4 + i * 0.1],
        [1.37, -0.32, 0.5 + i * 0.1],
        [0.9, -0.45, 1.2 + i * 0.05],
      ],
      0.025,
      "gasket",
    );
  box(g, 0.55, 0.02, 0.55, [-0.1, 0.24, 0], "accent");
  return g;
}

export function createModel() {
  const root = new T.Group(),
    groups = {
      block: block(),
      head: heads(),
      crank: crankshaft(),
      intake: intake(),
      headers: headers(),
      transmission: transmission(),
      ecu: ecu(),
      spark: new T.Group(),
      pistons: new T.Group(),
    };
  const pistonNodes = [];
  for (const side of [-1, 1]) {
    const pb = bank(groups.pistons, side),
      sb = bank(groups.spark, side);
    zs.forEach((z, i) => {
      const p = pistonUnit();
      p.position.set(0, 1.37, z);
      pb.add(p);
      pistonNodes.push({ object: p, i, side });
      const s = plug();
      s.position.set(0, 1.95, z);
      sb.add(s);
    });
  }
  groups.ecu.position.set(-2.3, 0.25, -1.1);
  groups.ecu.rotation.z = Math.PI / 2;
  Object.entries(groups).forEach(([name, g]) => {
    g.name = name;
    root.add(g);
  });
  function pose(phase) {
    groups.crank.rotation.z = phase;
    pistonNodes.forEach(({ object, i, side }) => {
      const theta =
        phase + (i === 0 || i === 3 ? 0 : Math.PI) + (side * Math.PI) / 4;
      object.position.y = 1.37 + 0.2 * Math.cos(theta);
      object.children[0].material =
        Math.cos(theta) > 0.88 ? mat.firing : mat.machined;
    });
  }
  return { root, groups, pose };
}

export function createDisplay(id) {
  const model = createModel();
  if (id === "engine") return { root: model.root, pose: model.pose };
  if (id === "spark") {
    const root = new T.Group(),
      s = plug();
    s.scale.setScalar(2.8);
    s.rotation.z = -0.22;
    root.add(s);
    return { root, pose: () => {} };
  }
  if (id === "pistons") {
    // Exposed eight-piston / flat-plane crank assembly, matching the reference.
    const root = new T.Group();
    root.add(model.groups.pistons, model.groups.crank);
    return { root, pose: model.pose };
  }
  const root = model.groups[id];
  root.position.set(0, 0, 0);
  root.rotation.set(0, 0, 0);
  return {
    root,
    pose: id === "crank" ? (phase) => (root.rotation.z = phase) : () => {},
  };
}
