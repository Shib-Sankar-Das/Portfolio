"use client";

import { useEffect, useMemo } from "react";
import { useFrame, useLoader, useThree } from "@react-three/fiber";
import * as THREE from "three";
import { GLTFLoader } from "three/examples/jsm/loaders/GLTFLoader.js";
import { MeshoptDecoder } from "three/examples/jsm/libs/meshopt_decoder.module.js";
import { RoomEnvironment } from "three/examples/jsm/environments/RoomEnvironment.js";
import { MODEL_URL, PARTS, solve } from "./industrial-arm";

const loose = (name) => name.replace(/[^a-z0-9]/gi, "").toLowerCase();
const configureLoader = (loader) => loader.setMeshoptDecoder(MeshoptDecoder);

export function preloadIndustrialArm() {
  useLoader.preload(GLTFLoader, MODEL_URL, configureLoader);
}

/** Soft studio reflections, so the painted metal and rubber read properly. */
export function Studio({ intensity = 1 }) {
  const { gl, scene } = useThree();
  useEffect(() => {
    const pmrem = new THREE.PMREMGenerator(gl);
    const env = pmrem.fromScene(new RoomEnvironment(), 0.04).texture;
    // Setting the r3f scene's environment is imperative three.js, not React state.
    /* eslint-disable react-hooks/immutability */
    scene.environment = env;
    scene.environmentIntensity = intensity;
    /* eslint-enable react-hooks/immutability */
    return () => {
      scene.environment = null;
      env.dispose();
      pmrem.dispose();
    };
  }, [gl, scene, intensity]);
  return null;
}

/**
 * Takes every part out of the exported hierarchy and parents it to one group,
 * keeping its rest placement: each frame it is placed as solved × rest. A part
 * therefore cannot come away from its parent, and parts can be hidden one at a
 * time without hiding everything below them.
 */
function buildArm(gltf, shadows) {
  const scene = gltf.scene.clone(true);
  scene.updateMatrixWorld(true);
  const byName = new Map();
  scene.traverse((o) => o.name && byName.set(loose(o.name), o));

  const parts = {};
  const missing = [];
  for (const [key, { name }] of Object.entries(PARTS)) {
    const obj = byName.get(loose(name));
    if (obj) parts[key] = { object: obj, rest: obj.matrixWorld.clone() };
    else missing.push(name);
  }

  const root = new THREE.Group();
  for (const part of Object.values(parts)) {
    part.object.removeFromParent();
    part.object.matrixAutoUpdate = false;
    part.object.matrix.copy(part.rest);
    root.add(part.object);
  }
  root.traverse((o) => {
    if (o.isMesh) {
      o.castShadow = shadows;
      o.receiveShadow = shadows;
    }
  });
  root.updateMatrixWorld(true);
  const bounds = new THREE.Box3().setFromObject(root);
  return { root, parts, missing, floor: bounds.min.y, height: bounds.max.y - bounds.min.y };
}

/**
 * The industrial arm, posed every frame.
 *
 * `getPose(dt)` is called once per rendered frame and returns the joint pose to
 * draw — the caller owns all easing and choreography. `onFrame(solved)` gets the
 * solved kinematics for that same frame (joint pivots, tool point).
 */
export default function IndustrialArmModel({ getPose, hidden, shadows = true, onReady, onFrame }) {
  const gltf = useLoader(GLTFLoader, MODEL_URL, configureLoader);
  const arm = useMemo(() => buildArm(gltf, shadows), [gltf, shadows]);

  useEffect(() => {
    onReady?.({ parts: Object.keys(arm.parts), missing: arm.missing, height: arm.height, floor: arm.floor });
  }, [arm, onReady]);

  useEffect(() => {
    for (const [key, part] of Object.entries(arm.parts)) part.object.visible = !hidden?.[key];
  }, [arm, hidden]);

  useFrame((_, dt) => {
    const solved = solve(getPose(Math.min(dt, 0.05)));
    for (const [key, part] of Object.entries(arm.parts)) {
      part.object.matrix.multiplyMatrices(solved.parts[key], part.rest);
      part.object.matrixWorldNeedsUpdate = true;
    }
    onFrame?.(solved, arm);
  });

  return <primitive object={arm.root} />;
}
