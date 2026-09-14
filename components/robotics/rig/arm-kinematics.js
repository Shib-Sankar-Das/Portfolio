// ---------------------------------------------------------------------------
// The robotic arm's mechanism, rebuilt for the web.
//
// The model is an industrial palletising arm. Its .blend holds the pieces
// together with Blender constraints (Track To, IK, Child Of) — which glTF cannot
// carry, and which do not hold the arm together under base rotation even in
// Blender. So nothing here depends on them: this file *is* the rig.
//
// The mechanism has five inputs and everything else follows from them:
//
//   yaw     the turntable — everything above the fixed base turns about it
//   lower   the lower arm, pivoting on the body
//   upper   the upper arm, pivoting at the elbow on top of the lower arm
//   spin    the gripper, turning about its vertical axis under the head
//   claw    how far the gripper's hooked finger is swung open
//
// Two parallelograms do the rest, exactly as on the real machine:
//
//   lower arm + rear rod  (pivots P0/Q on the body, E/R at the top) swing
//     together, so the triangular crank at the elbow never changes angle;
//   upper arm + top bar   (pivots E/F on the crank, W/H at the head) swing
//     together, so the head never changes angle.
//
// And the balancer's cylinder (on the body) and rod (on the lower arm) both aim
// along the line between their two anchors.
//
// Coordinates are the exported GLB's own: Y-up, Blender's units (the model is
// about 170 units tall). Pivots come from the .blend — bone heads, and the
// empties its author placed on each joint.
// ---------------------------------------------------------------------------
import * as THREE from "three";

/** Joint pivots, in model space. */
export const PIVOTS = {
  lowerArm: [-17.188, 91.84, 0], //      P0  Empty.Base(main-arm)
  rearRod: [8.548, 110.191, 0], //       Q   Empty.Base(main-arm_parallel)
  elbow: [-17.252, 143.307, 0], //       E   Bone.Main-arm(horizontal) head
  crankRear: [8.548, 161.372, 0.772], // R   Bone.Upper-support_Head head
  crankFront: [-33.399, 154.725, 0], //  F   Empty.Main-upper(viga1)
  wrist: [-68.445, 143.343, 0.772], //   W   Bone.004 head
  headTop: [-84.569, 154.646, 0.268], // H   Empty.Main-upper(viga2).001
  gripper: [-80.181, 131.96, 0], //      K   Empty.Hook(rotor)
  balancerBody: [19.447, 85.436, -10.616], // B  Empty.Base(piston)
  balancerArm: [-8.722, 90.622, -10.459], //  A  Empty.Base(main-arm_piston)
};

/** Every part, by the name of its object in the .blend. */
export const PARTS = {
  base: { name: "jt_obj_9236.005(w-base)", label: "Base" },
  body: { name: "jt_obj_9236(piston)", label: "Turntable body" },
  lowerArm: { name: "jt_obj_9236.003(mid-arm)", label: "Lower arm" },
  rearRod: { name: "jt_obj_9236.001(central-viga)", label: "Rear parallel rod" },
  crank: { name: "jt_obj_9236.002(upper-soport)", label: "Elbow crank" },
  upperArm: { name: "jt_obj_9236.002(upper-arm)", label: "Upper arm" },
  topBar: { name: "jt_obj_9236.001(upper-viga)", label: "Top parallel bar" },
  head: { name: "Head-Cabeza", label: "Head" },
  gripper: { name: "jt_obj_9236.001(w-Hook)", label: "Gripper" },
  claw: { name: null, label: "Claw finger" }, // cut out of the gripper on load
  cylinder: { name: "jt_obj_9236.004(w-pistonBob)", label: "Balancer cylinder" },
  rod: { name: "jt_obj_9236.004(w-pistonBob).001", label: "Balancer rod" },
};

/**
 * The controls. Signs are chosen so positive reads naturally: the lower arm
 * leans out toward the gripper, the upper arm lifts, the claw opens.
 */
export const CONTROLS = [
  { key: "yaw", label: "Base rotation", unit: "°", min: -180, max: 180, step: 1, value: 0 },
  { key: "lower", label: "Lower arm", unit: "°", min: -25, max: 30, step: 1, value: 0 },
  { key: "upper", label: "Upper arm", unit: "°", min: -30, max: 35, step: 1, value: 0 },
  { key: "spin", label: "Gripper rotation", unit: "°", min: -180, max: 180, step: 1, value: 0 },
  { key: "claw", label: "Claw opening", unit: "%", min: 0, max: 100, step: 1, value: 0 },
];

export const REST_POSE = Object.fromEntries(CONTROLS.map((c) => [c.key, c.value]));

/**
 * How far the claw finger swings open at 100%, and which way. In the .blend the
 * finger is modelled closed — hanging down beside the ring under the gripper
 * plate — so 0% is the model exactly as built, and opening turns it out and up
 * about its hinge. (The old FBX export had it standing wide open, which is what
 * made the site's gripper look like a gaping jaw.)
 */
export const CLAW_OPEN_DEG = -40;

/**
 * Points where two or more parts are joined, in rest (model) space. After a
 * solve, each one should land in the same place whichever of its parts carries
 * it — that is what "nothing comes apart" means, and it is what the viewer's
 * readout and the tests measure.
 */
export const LINKS = [
  { at: PIVOTS.lowerArm, parts: ["body", "lowerArm"], label: "Lower arm pivot" },
  { at: PIVOTS.rearRod, parts: ["body", "rearRod"], label: "Rear rod pivot" },
  { at: PIVOTS.elbow, parts: ["lowerArm", "crank", "upperArm"], label: "Elbow" },
  { at: PIVOTS.crankRear, parts: ["rearRod", "crank"], label: "Crank / rear rod" },
  { at: PIVOTS.crankFront, parts: ["crank", "topBar"], label: "Crank / top bar" },
  { at: PIVOTS.wrist, parts: ["upperArm", "head"], label: "Wrist" },
  { at: PIVOTS.headTop, parts: ["topBar", "head"], label: "Top bar / head" },
  { at: PIVOTS.gripper, parts: ["head", "gripper"], label: "Gripper mount" },
  { at: PIVOTS.balancerBody, parts: ["body", "cylinder"], label: "Balancer / body" },
  { at: PIVOTS.balancerArm, parts: ["lowerArm", "rod"], label: "Balancer / lower arm" },
];

const Y_AXIS = new THREE.Vector3(0, 1, 0);
const Z_AXIS = new THREE.Vector3(0, 0, 1);
const RAD = Math.PI / 180;
const vec = (a) => new THREE.Vector3(a[0], a[1], a[2]);

/** Rotation by `deg` about an axis through `pivot`. */
function about(pivot, axis, deg) {
  const p = pivot.isVector3 ? pivot : vec(pivot);
  return new THREE.Matrix4()
    .makeTranslation(p.x, p.y, p.z)
    .multiply(new THREE.Matrix4().makeRotationAxis(axis, deg * RAD))
    .multiply(new THREE.Matrix4().makeTranslation(-p.x, -p.y, -p.z));
}

const shift = (d) => new THREE.Matrix4().makeTranslation(d.x, d.y, d.z);

/**
 * Solves the mechanism for a pose.
 *
 * Returns, for every part, the transform to apply on top of its rest placement
 * (world = result × rest). `options.yawCentre` is the turntable axis (x, z);
 * `options.clawHinge` is where the claw finger meets the gripper plate.
 */
export function solve(pose, options = {}) {
  const { yaw = 0, lower = 0, upper = 0, spin = 0, claw = 0 } = pose;
  const yawCentre = options.yawCentre ?? [0.256, 0, 0];

  const P0 = vec(PIVOTS.lowerArm);
  const Q = vec(PIVOTS.rearRod);
  const E0 = vec(PIVOTS.elbow);
  const F0 = vec(PIVOTS.crankFront);
  const W0 = vec(PIVOTS.wrist);
  const K0 = vec(PIVOTS.gripper);
  const B = vec(PIVOTS.balancerBody);
  const A0 = vec(PIVOTS.balancerArm);

  // Positive "upper" lifts the arm, which is a clockwise turn in this view.
  const lift = -upper;

  // The elbow rides the top of the lower arm.
  const E = E0.clone().sub(P0).applyAxisAngle(Z_AXIS, lower * RAD).add(P0);
  const dE = E.clone().sub(E0);
  // The wrist rides the end of the upper arm.
  const W = W0.clone().sub(E0).applyAxisAngle(Z_AXIS, lift * RAD).add(E);
  const dW = W.clone().sub(W0);
  // The balancer's arm-side anchor rides the lower arm; both halves of the
  // balancer turn to keep pointing along the line between the anchors.
  const A = A0.clone().sub(P0).applyAxisAngle(Z_AXIS, lower * RAD).add(P0);
  const phi =
    (Math.atan2(A.y - B.y, A.x - B.x) - Math.atan2(A0.y - B.y, A0.x - B.x)) / RAD;

  const m = {
    base: new THREE.Matrix4(),
    body: new THREE.Matrix4(),
    lowerArm: about(P0, Z_AXIS, lower),
    rearRod: about(Q, Z_AXIS, lower),
    crank: shift(dE),
    upperArm: shift(dE).multiply(about(E0, Z_AXIS, lift)),
    topBar: shift(dE).multiply(about(F0, Z_AXIS, lift)),
    head: shift(dW),
    gripper: shift(dW).multiply(about(K0, Y_AXIS, spin)),
    cylinder: about(B, Z_AXIS, phi),
    rod: shift(A.clone().sub(A0)).multiply(about(A0, Z_AXIS, phi)),
  };
  m.claw = options.clawHinge
    ? m.gripper.clone().multiply(about(options.clawHinge, Z_AXIS, (claw / 100) * CLAW_OPEN_DEG))
    : m.gripper.clone();

  const turn = about([yawCentre[0], 0, yawCentre[2]], Y_AXIS, yaw);
  for (const key of Object.keys(m)) {
    if (key !== "base") m[key].premultiply(turn);
  }
  return m;
}

/**
 * How far apart each joint's parts have drifted in a solved pose, in model
 * units. Zero would be perfect; the model's own parallelograms are only exact to
 * about 0.3 units (of a 170-unit arm), so that is the floor.
 */
export function linkGaps(solved) {
  return LINKS.map((link) => {
    const points = link.parts.map((p) => vec(link.at).applyMatrix4(solved[p]));
    let gap = 0;
    for (let i = 0; i < points.length; i++) {
      for (let j = i + 1; j < points.length; j++) gap = Math.max(gap, points[i].distanceTo(points[j]));
    }
    return { label: link.label, gap, at: points[0] };
  });
}
