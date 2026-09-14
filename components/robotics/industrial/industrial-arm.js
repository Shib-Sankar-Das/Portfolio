// ---------------------------------------------------------------------------
// The industrial robot arm ("industrial robot arm.blend"): joints and poses.
//
// Unlike the palletising arm on /arm-rig, this model needs no mechanism
// rebuilt: it is a clean chain of parented objects — base → turntable → lower
// arm → upper arm → wrist → gripper → two fingers — and its author put each
// object's origin exactly on its joint. Rotating each part about its own origin
// in Blender keeps every joint connected.
//
// So this file is forward kinematics down that chain. Pivots are the object
// origins from the .blend, converted to the GLB's Y-up axes
// (Blender x, y, z → x, z, -y). Each part's placement is the product of the
// joint rotations above it applied to its rest placement, which means a part
// cannot come away from its parent whatever the sliders do.
// ---------------------------------------------------------------------------
import * as THREE from "three";

export const MODEL_URL = "/models/industrial-robot-arm.glb";

/** Every part, by its object name in the .blend. */
export const PARTS = {
  base: { name: "robot arm base", label: "Base" },
  body: { name: "robot arm", label: "Turntable" },
  lowerArm: { name: "robot arm large", label: "Lower arm" },
  upperArm: { name: "Robot arm 2", label: "Upper arm" },
  wrist: { name: "robot arm end", label: "Wrist" },
  gripper: { name: "Grabber", label: "Gripper" },
  finger1: { name: "Grabber hand 1", label: "Finger 1" },
  finger2: { name: "Grabber hand 2", label: "Finger 2" },
};

/** Joint pivots (object origins), in model space. */
const PIVOTS = {
  base: [-0.05, 0.14, 0],
  shoulder: [-0.045, 0.842, 0.203],
  elbow: [-0.133, 1.633, 0.999],
  wrist: [-0.126, 1.66, -0.751],
  roll: [-0.126, 1.457, -0.751],
  finger1: [-0.176, 1.42, -0.751],
  finger2: [-0.076, 1.42, -0.751],
};

const X = new THREE.Vector3(1, 0, 0);
const NEG_X = new THREE.Vector3(-1, 0, 0);
const Y = new THREE.Vector3(0, 1, 0);
// The fingers hinge about Blender's Y axis, which is -Z in the GLB.
const NEG_Z = new THREE.Vector3(0, 0, -1);

/**
 * The controls. Signs are chosen so positive reads naturally: the shoulder
 * leans the arm forward, the elbow lifts the forearm, the gripper closes.
 */
export const JOINTS = [
  { key: "base", label: "Base rotation", unit: "°", min: -180, max: 180, value: 0 },
  { key: "shoulder", label: "Shoulder", unit: "°", min: -35, max: 50, value: 0 },
  { key: "elbow", label: "Elbow", unit: "°", min: -20, max: 60, value: 0 },
  { key: "wrist", label: "Wrist", unit: "°", min: -100, max: 100, value: 0 },
  { key: "roll", label: "Gripper rotation", unit: "°", min: -180, max: 180, value: 0 },
  { key: "grip", label: "Gripper closed", unit: "%", min: 0, max: 100, value: 44 },
];

/**
 * Finger angle, open to closed. Each finger pivots on its pin on the gripper
 * bar; the model is built part-open (0°). At -19° the tips meet.
 */
const FINGER_OPEN = 15;
const FINGER_CLOSED = -19;

export const HOME = Object.fromEntries(JOINTS.map((j) => [j.key, j.value]));

/**
 * Wrist angle that keeps the gripper pointing straight down for a given
 * shoulder and elbow — the tool's pitch is the sum of the three joints.
 *
 * Posing notes. At home the lower arm (about 1.12 m) leans back ~45° and the
 * forearm (about 1.75 m to the wrist) is level, so the forearm's tilt below
 * level is shoulder − elbow. Leaning the shoulder forward also tips the forearm
 * down with it: reaching low means shoulder forward with the elbow near zero or
 * lifting, not the elbow dropping — that folds the gripper back into the base.
 * The elbow's lower limit (-20°) keeps the gripper, from home, clear of the
 * base: at -30° it sinks to the base's top while still over it.
 */
export const levelWrist = (shoulder, elbow) => shoulder - elbow;

const pose = (p) => ({ ...HOME, ...p, wrist: p.wrist ?? levelWrist(p.shoulder ?? 0, p.elbow ?? 0) });

export const PRESETS = [
  { name: "Home", pose: HOME },
  { name: "Reach out", pose: pose({ shoulder: 28, elbow: 22, grip: 0 }) },
  // Gripper ~0.5 m off the floor, ~1 m in front of the base.
  { name: "Pick low", pose: pose({ shoulder: 40, elbow: 0, grip: 0 }) },
  // Wrist ~2.4 m up — as high as it goes while staying in frame.
  { name: "Raise high", pose: pose({ shoulder: -10, elbow: 20, grip: 60 }) },
  // Folded up over its own base, gripper closed.
  { name: "Park", pose: pose({ shoulder: -30, elbow: 5, grip: 100 }) },
];

/** A pick-and-place cycle: [pose, seconds to move there, seconds to hold]. */
export const DEMO = [
  [HOME, 1.2, 0.3],
  // Over the pick-up spot, gripper open (~0.85 m up)...
  [pose({ base: -55, shoulder: 30, elbow: 5, grip: 0 }), 1.8, 0.2],
  // ...straight down to it (~0.5 m), close, and lift clear.
  [pose({ base: -55, shoulder: 40, elbow: 0, grip: 0 }), 1.1, 0.25],
  [pose({ base: -55, shoulder: 40, elbow: 0, grip: 100 }), 0.6, 0.35],
  [pose({ base: -55, shoulder: 28, elbow: 8, grip: 100 }), 1.1, 0.1],
  // Swing round, turning the part as it goes, and set it down.
  [pose({ base: 70, shoulder: 28, elbow: 8, roll: 90, grip: 100 }), 2.2, 0.1],
  [pose({ base: 70, shoulder: 40, elbow: 0, roll: 90, grip: 100 }), 1.1, 0.25],
  [pose({ base: 70, shoulder: 40, elbow: 0, roll: 90, grip: 0 }), 0.6, 0.35],
  [pose({ base: 70, shoulder: 25, elbow: 10, roll: 90, grip: 0 }), 1.0, 0.1],
];
export const DEMO_LENGTH = DEMO.reduce((t, [, move, hold]) => t + move + hold, 0);

const ease = (t) => t * t * (3 - 2 * t);

/** The demo pose `seconds` into the looping cycle. */
export function demoPose(seconds) {
  let t = seconds % DEMO_LENGTH;
  for (let i = 0; i < DEMO.length; i++) {
    const [target, move, hold] = DEMO[i];
    const from = DEMO[(i + DEMO.length - 1) % DEMO.length][0];
    if (t < move) {
      const k = ease(t / move);
      return Object.fromEntries(JOINTS.map(({ key }) => [key, from[key] + (target[key] - from[key]) * k]));
    }
    t -= move;
    if (t < hold) return { ...target };
    t -= hold;
  }
  return { ...HOME };
}

const RAD = Math.PI / 180;

function about(pivot, axis, deg) {
  const [x, y, z] = pivot;
  return new THREE.Matrix4()
    .makeTranslation(x, y, z)
    .multiply(new THREE.Matrix4().makeRotationAxis(axis, deg * RAD))
    .multiply(new THREE.Matrix4().makeTranslation(-x, -y, -z));
}

/**
 * Forward kinematics. Returns, for every part, the transform to apply on top of
 * its rest placement (world = result × rest), plus each joint's pivot in world
 * space for markers and the gripper's position.
 */
export function solve(p) {
  const finger = FINGER_OPEN + ((FINGER_CLOSED - FINGER_OPEN) * (p.grip ?? 0)) / 100;

  const body = about(PIVOTS.base, Y, p.base ?? 0);
  const lowerArm = body.clone().multiply(about(PIVOTS.shoulder, NEG_X, p.shoulder ?? 0));
  const upperArm = lowerArm.clone().multiply(about(PIVOTS.elbow, X, p.elbow ?? 0));
  const wrist = upperArm.clone().multiply(about(PIVOTS.wrist, X, p.wrist ?? 0));
  const gripper = wrist.clone().multiply(about(PIVOTS.roll, Y, p.roll ?? 0));
  const finger1 = gripper.clone().multiply(about(PIVOTS.finger1, NEG_Z, finger));
  const finger2 = gripper.clone().multiply(about(PIVOTS.finger2, NEG_Z, -finger));

  const at = (pivot, m) => new THREE.Vector3(...pivot).applyMatrix4(m);
  return {
    parts: { base: new THREE.Matrix4(), body, lowerArm, upperArm, wrist, gripper, finger1, finger2 },
    joints: [
      at(PIVOTS.base, body),
      at(PIVOTS.shoulder, lowerArm),
      at(PIVOTS.elbow, upperArm),
      at(PIVOTS.wrist, wrist),
      at(PIVOTS.roll, gripper),
      at(PIVOTS.finger1, finger1),
      at(PIVOTS.finger2, finger2),
    ],
    tool: at([PIVOTS.roll[0], PIVOTS.roll[1] - 0.13, PIVOTS.roll[2]], gripper),
  };
}
