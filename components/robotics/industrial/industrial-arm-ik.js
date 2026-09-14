// ---------------------------------------------------------------------------
// Inverse kinematics for the industrial arm: "put the gripper here".
//
// The arm is a turntable plus a planar two-link arm (lower arm, forearm) with a
// wrist that keeps the gripper pointing straight down. So a target splits into
// a heading (base rotation), and a reach and height in the arm's own plane,
// which the classic two-link solution handles exactly.
//
// Lengths and rest angles are measured from the model's joint pivots (see
// industrial-arm.js). A few small offsets are not worth modelling by hand — the
// gripper sits 7.6 cm to the side of the arm's plane — so the analytic answer is
// refined against the real forward kinematics a few times, which lands the
// gripper within a millimetre.
// ---------------------------------------------------------------------------
import { HOME, solve } from "./industrial-arm";

const DEG = 180 / Math.PI;

/** The turntable's axis, in model space (x, z). */
export const BASE_AXIS = { x: -0.05, z: 0 };

// In the arm's plane: r is reach forward from the base axis, h is height.
const SHOULDER = { r: -0.203, h: 0.842 };
const LOWER = { r: -0.999 - -0.203, h: 1.633 - 0.842 }; // shoulder → elbow
const UPPER = { r: 0.751 - -0.999, h: 1.66 - 1.633 }; //   elbow → wrist
const L1 = Math.hypot(LOWER.r, LOWER.h);
const L2 = Math.hypot(UPPER.r, UPPER.h);
const REST1 = Math.atan2(LOWER.h, LOWER.r) * DEG;
const REST2 = Math.atan2(UPPER.h, UPPER.r) * DEG;
/** Wrist pivot to the gripper's tool point, with the gripper pointing down. */
const TOOL_DROP = 0.333;

const clamp = (v, lo, hi) => Math.min(hi, Math.max(lo, v));
const wrap = (deg) => ((((deg + 180) % 360) + 360) % 360) - 180;

/** Shoulder and elbow angles that put the tool point at (r, h) in the arm plane. */
function planar(r, h) {
  const dr = r - SHOULDER.r;
  const dh = h + TOOL_DROP - SHOULDER.h;
  const d = clamp(Math.hypot(dr, dh), Math.abs(L1 - L2) + 1e-3, L1 + L2 - 1e-3);
  // Elbow up and behind, as the arm is built.
  const t1 = Math.atan2(dh, dr) + Math.acos(clamp((L1 * L1 + d * d - L2 * L2) / (2 * L1 * d), -1, 1));
  const er = SHOULDER.r + L1 * Math.cos(t1);
  const eh = SHOULDER.h + L1 * Math.sin(t1);
  const t2 = Math.atan2(dh + SHOULDER.h - eh, dr + SHOULDER.r - er);
  const shoulder = REST1 - t1 * DEG;
  const elbow = t2 * DEG - REST2 + shoulder;
  return { shoulder, elbow };
}

function polarPose(heading, r, h, extra) {
  const { shoulder, elbow } = planar(r, h);
  return { ...HOME, ...extra, base: heading, shoulder, elbow, wrist: shoulder - elbow };
}

/** Where the tool point actually is, as heading / reach / height. */
export function toolPolar(tool) {
  const dx = tool.x - BASE_AXIS.x;
  const dz = tool.z - BASE_AXIS.z;
  return { heading: Math.atan2(-dx, -dz) * DEG, r: Math.hypot(dx, dz), h: tool.y };
}

/**
 * A pose that puts the gripper's tool point at `heading` degrees (0 = straight
 * ahead, toward -z), `r` metres out from the base axis and `h` metres up, with
 * the gripper pointing down. `extra` carries grip and gripper rotation through.
 * The heading is kept continuous — it is never wrapped — so an animation can
 * swing through 180° without the base spinning the long way round.
 */
export function reachPolar(heading, r, h, extra = {}) {
  let ah = heading;
  let ar = r;
  let ay = h;
  let pose = polarPose(ah, ar, ay, extra);
  for (let i = 0; i < 4; i++) {
    const got = toolPolar(solve(pose).tool);
    ah += wrap(heading - got.heading);
    ar += r - got.r;
    ay += h - got.h;
    pose = polarPose(ah, ar, ay, extra);
  }
  return pose;
}

/** World position (model space) of a point at heading / reach / height. */
export function polarToWorld(heading, r, h) {
  const a = heading / DEG;
  return { x: BASE_AXIS.x - Math.sin(a) * r, y: h, z: BASE_AXIS.z - Math.cos(a) * r };
}
