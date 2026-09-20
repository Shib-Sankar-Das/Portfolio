"use client";

import { Component, Suspense, useCallback, useEffect, useMemo, useRef } from "react";
import { Canvas, advance, useLoader, useThree } from "@react-three/fiber";
import * as THREE from "three";
import { GLTFLoader } from "three/examples/jsm/loaders/GLTFLoader.js";
import { MeshoptDecoder } from "three/examples/jsm/libs/meshopt_decoder.module.js";
import { RoomEnvironment } from "three/examples/jsm/environments/RoomEnvironment.js";
import { mergeGeometries } from "three/examples/jsm/utils/BufferGeometryUtils.js";

export const DRONE_URL = "/models/drone.glb";
const configureLoader = (loader) => loader.setMeshoptDecoder(MeshoptDecoder);

/**
 * The 3D half of the skills section: a fleet of drones on a transparent canvas
 * over the cards.
 *
 * Like the project carousel's arm, it never animates on its own. The section
 * owns the clock and the layout: every frame it calls `engine.render(timestamp,
 * drones)` with where each drone should be, in world units, and this places
 * them, spins the rotors and draws that exact frame.
 *
 * Fenced off by an error boundary: if WebGL or the model is unavailable,
 * `onEngine` is never called and the skills cards simply sit in their grid.
 */
class Boundary extends Component {
  state = { failed: false };
  static getDerivedStateFromError() {
    return { failed: true };
  }
  render() {
    return this.state.failed ? null : this.props.children;
  }
}

function Studio() {
  const { gl, scene } = useThree();
  useEffect(() => {
    const pmrem = new THREE.PMREMGenerator(gl);
    const env = pmrem.fromScene(new RoomEnvironment(), 0.04).texture;
    /* eslint-disable react-hooks/immutability */
    scene.environment = env;
    scene.environmentIntensity = 0.9;
    /* eslint-enable react-hooks/immutability */
    return () => {
      scene.environment = null;
      env.dispose();
      pmrem.dispose();
    };
  }, [gl, scene]);
  return null;
}

/** How fast the rotors turn, in radians per second. */
const ROTOR_SPEED = 26;

const isRotor = (name) => /propeller|rotor|blade/i.test(name);
/** Camera, gimbal, wiring and mounts — the dark detail against the shell. */
const isDetail = (name) => /wire|lens|camera|gimbal|motor|sensor|antenna|battery|support|lathe/i.test(name);

/**
 * The drone is repainted on load.
 *
 * Its own materials are a mixed bag — one of them a translucent olive that made
 * the whole aircraft look gold. These three read as a real machine and, more to
 * the point, stay legible on both themes: a light grey shell that stands out on
 * a dark page, with dark grey detail and near-black rotors that hold their shape
 * on a light one.
 */
const SKIN = {
  body: new THREE.MeshStandardMaterial({ color: "#ccd3de", metalness: 0.25, roughness: 0.42 }),
  detail: new THREE.MeshStandardMaterial({ color: "#3d4450", metalness: 0.35, roughness: 0.5 }),
  rotor: new THREE.MeshStandardMaterial({ color: "#272c35", metalness: 0.15, roughness: 0.55 }),
};

/**
 * Prepares the fleet: one drone's parts, repainted, merged by material and baked
 * into a single normalised space (one unit across the rotors, centred on
 * itself).
 *
 * Every drone then draws from the same few meshes — the shell and the detail as
 * one instanced mesh each, plus one per rotor — so the whole fleet costs about
 * half a dozen draw calls rather than a dozen per drone.
 */
function prepare(gltf) {
  const model = gltf.scene.clone(true);
  model.updateMatrixWorld(true);
  const box = new THREE.Box3().setFromObject(model);
  const size = box.getSize(new THREE.Vector3());
  const centre = box.getCenter(new THREE.Vector3());
  const unit = 1 / Math.max(size.x, size.z);
  const normalise = new THREE.Matrix4()
    .makeScale(unit, unit, unit)
    .multiply(new THREE.Matrix4().makeTranslation(-centre.x, -centre.y, -centre.z));

  const statics = new Map();
  const rotors = [];
  model.traverse((o) => {
    if (!o.isMesh) return;
    // Position and normal only: the skin carries no maps, and merging needs
    // every geometry to hold the same attributes.
    const geometry = o.geometry.index ? o.geometry.toNonIndexed() : o.geometry.clone();
    for (const name of Object.keys(geometry.attributes)) {
      if (name !== "position" && name !== "normal") geometry.deleteAttribute(name);
    }
    if (!geometry.getAttribute("normal")) geometry.computeVertexNormals();

    if (isRotor(o.name)) {
      const turn = new THREE.Quaternion();
      o.getWorldQuaternion(turn);
      rotors.push({
        geometry,
        material: SKIN.rotor,
        rest: new THREE.Matrix4().multiplyMatrices(normalise, o.matrixWorld),
        // However the rotor is built, it turns about the world's up axis.
        axis: new THREE.Vector3(0, 1, 0).applyQuaternion(turn.invert()).normalize(),
      });
      return;
    }
    geometry.applyMatrix4(new THREE.Matrix4().multiplyMatrices(normalise, o.matrixWorld));
    const role = isDetail(o.name) ? "detail" : "body";
    const list = statics.get(role) ?? [];
    list.push(geometry);
    statics.set(role, list);
  });

  const merged = [...statics.entries()].map(([role, list]) => ({
    material: SKIN[role],
    geometry: list.length > 1 ? mergeGeometries(list, false) : list[0],
  }));
  return { merged, rotors };
}

function Fleet({ count, onEngine }) {
  const gltf = useLoader(GLTFLoader, DRONE_URL, configureLoader);
  const rig = useMemo(() => prepare(gltf), [gltf]);
  const bodies = useRef([]);
  const blades = useRef([]);
  const spin = useRef(0);
  const last = useRef(0);
  const scratch = useMemo(
    () => ({
      matrix: new THREE.Matrix4(),
      blade: new THREE.Matrix4(),
      turn: new THREE.Matrix4(),
      quaternion: new THREE.Quaternion(),
      euler: new THREE.Euler(),
      position: new THREE.Vector3(),
      scale: new THREE.Vector3(),
      hidden: new THREE.Matrix4().makeScale(0, 0, 0),
    }),
    []
  );

  const render = useCallback(
    (timestamp, drones) => {
      const dt = last.current ? Math.min(0.05, (timestamp - last.current) / 1000) : 0.016;
      last.current = timestamp;
      spin.current += dt * ROTOR_SPEED;
      const s = scratch;

      for (let i = 0; i < count; i++) {
        const want = drones[i];
        if (!want) {
          for (const mesh of bodies.current) mesh?.setMatrixAt(i, s.hidden);
          for (const mesh of blades.current) mesh?.setMatrixAt(i, s.hidden);
          continue;
        }
        s.euler.set(want.pitch ?? 0, want.yaw ?? 0, want.roll ?? 0);
        s.quaternion.setFromEuler(s.euler);
        s.position.set(want.x, want.y, want.z ?? 0);
        s.scale.setScalar(want.scale);
        s.matrix.compose(s.position, s.quaternion, s.scale);

        for (const mesh of bodies.current) mesh?.setMatrixAt(i, s.matrix);
        rig.rotors.forEach((rotor, r) => {
          // Rotors alternate direction, as they do on a real quadcopter.
          s.turn.makeRotationAxis(rotor.axis, spin.current * (r % 2 ? -1 : 1));
          s.blade.multiplyMatrices(s.matrix, rotor.rest).multiply(s.turn);
          blades.current[r]?.setMatrixAt(i, s.blade);
        });
      }
      for (const mesh of [...bodies.current, ...blades.current]) {
        if (mesh) mesh.instanceMatrix.needsUpdate = true;
      }
      advance(timestamp);
    },
    [count, rig, scratch]
  );

  useEffect(() => {
    onEngine({ render });
    return () => onEngine(null);
  }, [render, onEngine]);

  return (
    <>
      {rig.merged.map((part, i) => (
        <instancedMesh
          key={`body-${i}`}
          ref={(el) => (bodies.current[i] = el)}
          args={[part.geometry, part.material, count]}
          frustumCulled={false}
        />
      ))}
      {rig.rotors.map((rotor, i) => (
        <instancedMesh
          key={`rotor-${i}`}
          ref={(el) => (blades.current[i] = el)}
          args={[rotor.geometry, rotor.material, count]}
          frustumCulled={false}
        />
      ))}
    </>
  );
}

export default function DroneFleet({ camera, count, onEngine }) {
  const cam = useMemo(() => new THREE.PerspectiveCamera(camera.fov, 1, 0.1, 100), [camera.fov]);

  useEffect(() => {
    cam.position.set(0, 0, camera.distance);
    cam.lookAt(0, 0, 0);
    cam.updateProjectionMatrix();
  }, [cam, camera]);

  return (
    <Boundary>
      <Canvas
        camera={cam}
        frameloop="never"
        // A decorative fleet: no need for full retina pixels.
        dpr={[1, 1.4]}
        gl={{ alpha: true, antialias: true, powerPreference: "high-performance" }}
        style={{ background: "transparent", pointerEvents: "none" }}
        aria-hidden
      >
        <Studio />
        <hemisphereLight args={["#f8fafc", "#334155", 0.8]} />
        <directionalLight position={[2, 4, 5]} intensity={2} />
        <directionalLight position={[-3, 1, 2]} intensity={0.7} color="#bae6fd" />
        <Suspense fallback={null}>
          <Fleet count={count} onEngine={onEngine} />
        </Suspense>
      </Canvas>
    </Boundary>
  );
}
