"use client";

import { Suspense, useEffect, useMemo, useRef, useState } from "react";
import { Canvas, useFrame, useLoader, useThree } from "@react-three/fiber";
import * as THREE from "three";
import { GLTFLoader } from "three/examples/jsm/loaders/GLTFLoader.js";
import { OrbitControls } from "three/examples/jsm/controls/OrbitControls.js";
import { MeshoptDecoder } from "three/examples/jsm/libs/meshopt_decoder.module.js";
import { CONTROLS, LINKS, PARTS, PIVOTS, REST_POSE, linkGaps, solve } from "./arm-kinematics";

export const RIG_URL = "/models/robotic-arm-rig.glb";

/** The model is ~170 units tall; the scene works in metres-ish units. */
const SCALE = 0.01;

const loose = (name) => name.replace(/[^a-z0-9]/gi, "").toLowerCase();
const configureLoader = (loader) => loader.setMeshoptDecoder(MeshoptDecoder);

// ---------------------------------------------------------------------------
// Building the rig from the GLB
// ---------------------------------------------------------------------------

/**
 * Cuts the claw finger out of the gripper mesh into a mesh of its own, so it can
 * hinge. The finger is baked into the gripper; it is the only part of it that
 * reaches well out to the -x side of the gripper's spin axis. Parts are found by
 * welding vertices that share a position and following triangles.
 */
function splitClaw(mesh, rest) {
  const geometry = mesh.geometry;
  const pos = geometry.getAttribute("position");
  const index = geometry.index;
  if (!pos || !index) return null;
  const n = pos.count;

  const world = new Float32Array(n * 3);
  const v = new THREE.Vector3();
  for (let i = 0; i < n; i++) {
    v.fromBufferAttribute(pos, i).applyMatrix4(rest);
    world[i * 3] = v.x;
    world[i * 3 + 1] = v.y;
    world[i * 3 + 2] = v.z;
  }

  const parent = new Int32Array(n);
  for (let i = 0; i < n; i++) parent[i] = i;
  const find = (i) => {
    while (parent[i] !== i) {
      parent[i] = parent[parent[i]];
      i = parent[i];
    }
    return i;
  };
  const union = (a, b) => {
    const ra = find(a);
    const rb = find(b);
    if (ra !== rb) parent[ra] = rb;
  };
  const seen = new Map();
  for (let i = 0; i < n; i++) {
    const key = `${world[i * 3].toFixed(3)},${world[i * 3 + 1].toFixed(3)},${world[i * 3 + 2].toFixed(3)}`;
    const j = seen.get(key);
    if (j === undefined) seen.set(key, i);
    else union(i, j);
  }
  for (let k = 0; k + 2 < index.count; k += 3) {
    union(index.getX(k), index.getX(k + 1));
    union(index.getX(k), index.getX(k + 2));
  }

  // How far each part reaches out on the -x side of the spin axis.
  const reach = new Float64Array(n).fill(Infinity);
  for (let i = 0; i < n; i++) {
    const r = find(i);
    reach[r] = Math.min(reach[r], world[i * 3]);
  }
  const limit = PIVOTS.gripper[0] - 12;
  const inClaw = new Uint8Array(n);
  let hingeX = -Infinity;
  let hingeY = -Infinity;
  let hingeZ = 0;
  let count = 0;
  for (let i = 0; i < n; i++) {
    if (reach[find(i)] < limit) {
      inClaw[i] = 1;
      count++;
      hingeZ += world[i * 3 + 2];
      hingeX = Math.max(hingeX, world[i * 3]);
      hingeY = Math.max(hingeY, world[i * 3 + 1]);
    }
  }
  if (count === 0) return null;

  const clawTris = [];
  const restTris = [];
  for (let k = 0; k + 2 < index.count; k += 3) {
    const a = index.getX(k);
    const b = index.getX(k + 1);
    const c = index.getX(k + 2);
    (inClaw[a] && inClaw[b] && inClaw[c] ? clawTris : restTris).push(a, b, c);
  }

  const share = (tris) => {
    const g = new THREE.BufferGeometry();
    for (const [name, attr] of Object.entries(geometry.attributes)) g.setAttribute(name, attr);
    g.setIndex(tris);
    g.computeBoundingBox();
    g.computeBoundingSphere();
    return g;
  };
  mesh.geometry = share(restTris);
  const claw = new THREE.Mesh(share(clawTris), mesh.material);
  return { claw, hinge: [hingeX, hingeY, hingeZ / count], vertices: count };
}

function buildRig(gltf) {
  const scene = gltf.scene.clone(true);
  scene.updateMatrixWorld(true);

  const byName = new Map();
  scene.traverse((o) => o.name && byName.set(loose(o.name), o));

  const parts = {};
  const missing = [];
  for (const [key, { name }] of Object.entries(PARTS)) {
    if (!name) continue;
    const obj = byName.get(loose(name));
    if (!obj) {
      missing.push(name);
      continue;
    }
    parts[key] = { object: obj, rest: obj.matrixWorld.clone() };
  }

  // Take every part out of the exported hierarchy and place it by hand: world
  // placement = solved transform × rest placement, every frame.
  const root = new THREE.Group();
  for (const part of Object.values(parts)) {
    part.object.removeFromParent();
    part.object.matrixAutoUpdate = false;
    part.object.matrix.copy(part.rest);
    root.add(part.object);
  }

  let clawHinge = null;
  let clawVertices = 0;
  if (parts.gripper) {
    let target = null;
    parts.gripper.object.traverse((o) => {
      if (o.isMesh && (!target || o.geometry.attributes.position.count > target.geometry.attributes.position.count)) target = o;
    });
    if (target) {
      // The claw's rest placement is the gripper mesh's own world placement.
      target.updateMatrixWorld(true);
      const meshRest = new THREE.Matrix4().multiplyMatrices(parts.gripper.rest, target === parts.gripper.object ? new THREE.Matrix4() : target.matrix);
      const split = splitClaw(target, meshRest);
      if (split) {
        split.claw.matrixAutoUpdate = false;
        split.claw.matrix.copy(meshRest);
        root.add(split.claw);
        parts.claw = { object: split.claw, rest: meshRest.clone() };
        clawHinge = split.hinge;
        clawVertices = split.vertices;
      }
    }
  }

  root.traverse((o) => {
    if (o.isMesh) {
      o.castShadow = true;
      o.receiveShadow = true;
    }
  });

  // The turntable axis: the centre of the fixed base.
  const baseBox = parts.base ? new THREE.Box3().setFromObject(parts.base.object) : null;
  const yawCentre = baseBox ? [(baseBox.min.x + baseBox.max.x) / 2, 0, (baseBox.min.z + baseBox.max.z) / 2] : undefined;

  const bounds = new THREE.Box3().setFromObject(root);
  return { root, parts, missing, clawHinge, clawVertices, yawCentre, bounds };
}

// ---------------------------------------------------------------------------
// Scene pieces
// ---------------------------------------------------------------------------

function Orbit({ target, distance, autoRotate, view }) {
  const { camera, gl } = useThree();
  const controls = useRef(null);

  useEffect(() => {
    const c = new OrbitControls(camera, gl.domElement);
    c.enableDamping = true;
    c.dampingFactor = 0.08;
    c.minDistance = distance * 0.25;
    c.maxDistance = distance * 4;
    c.target.set(...target);
    controls.current = c;
    return () => c.dispose();
  }, [camera, gl, target, distance]);

  useEffect(() => {
    const c = controls.current;
    if (c) c.autoRotate = autoRotate;
  }, [autoRotate]);

  // Camera presets. `view.id` changes on every press, so the same preset can be
  // chosen twice in a row.
  useEffect(() => {
    const c = controls.current;
    if (!c || !view) return;
    const [tx, ty, tz] = target;
    const d = distance;
    const at = {
      front: [tx, ty, tz + d],
      back: [tx, ty, tz - d],
      left: [tx - d, ty, tz],
      right: [tx + d, ty, tz],
      top: [tx, ty + d, tz + 0.001],
      threeQuarter: [tx + d * 0.62, ty + d * 0.38, tz + d * 0.68],
    }[view.name];
    if (!at) return;
    camera.position.set(...at);
    c.target.set(tx, ty, tz);
    c.update();
  }, [view, camera, target, distance]);

  useFrame(() => controls.current?.update());
  return null;
}

function Rig({ targetPose, playing, showJoints, hidden, onReady, onGaps }) {
  const gltf = useLoader(GLTFLoader, RIG_URL, configureLoader);
  const rig = useMemo(() => buildRig(gltf), [gltf]);
  const current = useRef({ ...REST_POSE });
  const clock = useRef(0);
  const markers = useRef([]);
  const lastReport = useRef(0);

  useEffect(() => {
    onReady?.({
      parts: Object.keys(rig.parts),
      missing: rig.missing,
      clawVertices: rig.clawVertices,
      bounds: rig.bounds,
    });
  }, [rig, onReady]);

  useEffect(() => {
    for (const [key, part] of Object.entries(rig.parts)) part.object.visible = !hidden[key];
  }, [rig, hidden]);

  useFrame((_, dt) => {
    const step = Math.min(dt, 0.05);
    let want = targetPose.current;

    if (playing) {
      // A slow working cycle through the whole range of every joint.
      clock.current += step;
      const t = clock.current;
      want = {
        yaw: Math.sin(t * 0.35) * 120,
        lower: Math.sin(t * 0.6) * 22 + 4,
        upper: Math.sin(t * 0.8 + 1.1) * 26 + 2,
        spin: Math.sin(t * 0.5) * 150,
        claw: (Math.sin(t * 1.3) * 0.5 + 0.5) * 100,
      };
    }

    const k = Math.min(1, step * 8);
    for (const c of CONTROLS) {
      current.current[c.key] += ((want[c.key] ?? c.value) - current.current[c.key]) * k;
    }

    const solved = solve(current.current, { yawCentre: rig.yawCentre, clawHinge: rig.clawHinge });
    for (const [key, part] of Object.entries(rig.parts)) {
      part.object.matrix.multiplyMatrices(solved[key], part.rest);
      part.object.matrixWorldNeedsUpdate = true;
    }

    const gaps = linkGaps(solved);
    gaps.forEach((g, i) => markers.current[i]?.position.copy(g.at));

    const now = performance.now();
    if (now - lastReport.current > 150) {
      lastReport.current = now;
      onGaps?.({ pose: { ...current.current }, gaps });
    }
  });

  return (
    <group scale={SCALE}>
      <primitive object={rig.root} />
      {LINKS.map((link, i) => (
        <mesh
          key={link.label}
          ref={(el) => (markers.current[i] = el)}
          visible={showJoints}
          renderOrder={10}
        >
          <sphereGeometry args={[2.4, 16, 12]} />
          <meshBasicMaterial color="#22d3ee" depthTest={false} transparent opacity={0.9} />
        </mesh>
      ))}
    </group>
  );
}

// ---------------------------------------------------------------------------
// The viewer
// ---------------------------------------------------------------------------

const VIEWS = [
  ["front", "Front"],
  ["right", "Side"],
  ["back", "Back"],
  ["top", "Top"],
  ["threeQuarter", "3/4"],
];

export default function ArmRigViewer() {
  const [pose, setPose] = useState({ ...REST_POSE });
  const targetPose = useRef({ ...REST_POSE });
  const [playing, setPlaying] = useState(false);
  const [autoRotate, setAutoRotate] = useState(false);
  const [showJoints, setShowJoints] = useState(false);
  const [hidden, setHidden] = useState({});
  const [view, setView] = useState(null);
  const [info, setInfo] = useState(null);
  const [live, setLive] = useState(null);

  // Camera framing: the model sits with its base on the floor, ~1.7 tall.
  const target = useMemo(() => [-0.2, 0.95, 0], []);
  const distance = 4.2;

  const update = (key, value) => {
    const next = { ...pose, [key]: value };
    setPose(next);
    targetPose.current = next;
  };

  const reset = () => {
    setPlaying(false);
    setPose({ ...REST_POSE });
    targetPose.current = { ...REST_POSE };
  };

  const worstGap = live ? Math.max(...live.gaps.map((g) => g.gap)) : null;
  const shown = playing && live ? live.pose : pose;

  return (
    <div className="grid gap-5 lg:grid-cols-[minmax(0,1fr)_22rem]">
      {/* ------------------------------ canvas ------------------------------ */}
      <div className="relative h-[62vh] min-h-[420px] overflow-hidden rounded-3xl border border-line bg-[#070a13] lg:h-[calc(100vh-10rem)]">
        <Canvas
          // Plain PCF: r3f's default soft-shadow type is deprecated in this
          // three.js and floods the console with a warning every frame it's used.
          shadows="percentage"
          dpr={[1, 1.75]}
          camera={{ position: [2.6, 1.9, 3.1], fov: 38, near: 0.01, far: 100 }}
          gl={{ antialias: true }}
          data-testid="arm-rig-canvas"
        >
          <color attach="background" args={["#070a13"]} />
          <hemisphereLight args={["#e2e8f0", "#1e293b", 1.3]} />
          <ambientLight intensity={0.5} />
          <directionalLight
            position={[3, 5, 4]}
            intensity={2.6}
            castShadow
            shadow-mapSize={[2048, 2048]}
            shadow-camera-left={-2.5}
            shadow-camera-right={2.5}
            shadow-camera-top={2.5}
            shadow-camera-bottom={-2.5}
          />
          <directionalLight position={[-4, 2, -3]} intensity={1.1} color="#7dd3fc" />
          <gridHelper args={[6, 30, "#334155", "#1e293b"]} />
          <mesh rotation-x={-Math.PI / 2} position-y={-0.001} receiveShadow>
            <planeGeometry args={[6, 6]} />
            <shadowMaterial opacity={0.35} />
          </mesh>
          <Suspense fallback={null}>
            <Rig
              targetPose={targetPose}
              playing={playing}
              showJoints={showJoints}
              hidden={hidden}
              onReady={setInfo}
              onGaps={setLive}
            />
          </Suspense>
          <Orbit target={target} distance={distance} autoRotate={autoRotate} view={view} />
        </Canvas>

        {!info && (
          <div className="pointer-events-none absolute inset-0 flex items-center justify-center text-sm text-muted">
            Loading the arm…
          </div>
        )}

        <div className="pointer-events-none absolute left-4 top-4 rounded-xl bg-black/55 px-3 py-2 text-[11px] leading-relaxed text-slate-300 backdrop-blur">
          Drag to orbit · scroll to zoom · right-drag to pan
        </div>

        <div className="absolute bottom-4 left-4 right-4 flex flex-wrap gap-2">
          {VIEWS.map(([name, label]) => (
            <button
              key={name}
              type="button"
              onClick={() => setView({ name, id: Date.now() })}
              className="rounded-full border border-white/15 bg-black/55 px-3 py-1.5 text-xs font-medium text-slate-200 backdrop-blur transition-colors hover:border-amber-400 hover:text-amber-300"
            >
              {label}
            </button>
          ))}
          <button
            type="button"
            onClick={() => setAutoRotate((v) => !v)}
            aria-pressed={autoRotate}
            className="rounded-full border border-white/15 bg-black/55 px-3 py-1.5 text-xs font-medium text-slate-200 backdrop-blur transition-colors hover:border-amber-400 aria-pressed:border-amber-400 aria-pressed:text-amber-300"
          >
            360° spin
          </button>
        </div>
      </div>

      {/* ----------------------------- controls ----------------------------- */}
      <aside className="space-y-4">
        <section className="rounded-2xl border border-line bg-card p-5">
          <div className="flex items-center justify-between gap-3">
            <h2 className="text-sm font-bold uppercase tracking-[0.14em]">Joints</h2>
            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => setPlaying((v) => !v)}
                aria-pressed={playing}
                className="rounded-full border border-line px-3 py-1 text-xs font-semibold transition-colors hover:border-accent hover:text-accent aria-pressed:border-accent aria-pressed:text-accent"
              >
                {playing ? "Stop demo" : "Play demo"}
              </button>
              <button
                type="button"
                onClick={reset}
                className="rounded-full border border-line px-3 py-1 text-xs font-semibold transition-colors hover:border-accent hover:text-accent"
              >
                Reset
              </button>
            </div>
          </div>

          <div className="mt-4 space-y-4">
            {CONTROLS.map((c) => {
              const value = Math.round(shown[c.key]);
              return (
                <label key={c.key} className="block">
                  <span className="flex items-baseline justify-between text-xs">
                    <span className="font-medium">{c.label}</span>
                    <span className="font-mono text-muted">
                      {value}
                      {c.unit}
                    </span>
                  </span>
                  <input
                    type="range"
                    min={c.min}
                    max={c.max}
                    step={c.step}
                    value={value}
                    disabled={playing || (c.key === "claw" && info && !info.clawVertices)}
                    onChange={(e) => update(c.key, Number(e.target.value))}
                    aria-label={c.label}
                    className="mt-1.5 w-full accent-amber-400 disabled:opacity-50"
                  />
                </label>
              );
            })}
          </div>
        </section>

        <section className="rounded-2xl border border-line bg-card p-5">
          <h2 className="text-sm font-bold uppercase tracking-[0.14em]">Integrity</h2>
          <p className="mt-3 text-sm" data-testid="rig-integrity">
            {!live ? (
              <span className="text-muted">Checking…</span>
            ) : worstGap < 1 ? (
              <span className="font-semibold text-emerald-500">
                All {LINKS.length} joints connected
              </span>
            ) : (
              <span className="font-semibold text-rose-500">A joint has come apart</span>
            )}
          </p>
          {live && (
            <p className="mt-1 text-xs text-muted">
              Largest gap {worstGap.toFixed(2)} units, on an arm about 170 units tall.
            </p>
          )}
          {info && (
            <p className="mt-2 text-xs text-muted" data-testid="rig-parts">
              {info.parts.length} parts loaded
              {info.missing.length ? ` · missing: ${info.missing.join(", ")}` : ""}
            </p>
          )}
          <label className="mt-3 flex items-center gap-2 text-xs">
            <input
              type="checkbox"
              checked={showJoints}
              onChange={(e) => setShowJoints(e.target.checked)}
              className="accent-cyan-400"
            />
            Show joint markers
          </label>
        </section>

        <section className="rounded-2xl border border-line bg-card p-5">
          <h2 className="text-sm font-bold uppercase tracking-[0.14em]">Parts</h2>
          <p className="mt-1 text-xs text-muted">Hide parts to check each one on its own.</p>
          <ul className="mt-3 grid grid-cols-2 gap-x-3 gap-y-1.5">
            {Object.entries(PARTS).map(([key, { label }]) => (
              <li key={key}>
                <label className="flex items-center gap-2 text-xs">
                  <input
                    type="checkbox"
                    checked={!hidden[key]}
                    disabled={info ? !info.parts.includes(key) : true}
                    onChange={(e) => setHidden((h) => ({ ...h, [key]: !e.target.checked }))}
                    className="accent-amber-400"
                  />
                  {label}
                </label>
              </li>
            ))}
          </ul>
        </section>
      </aside>
    </div>
  );
}
