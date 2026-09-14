"use client";

import { useEffect, useRef } from "react";
import { useFrame, useThree } from "@react-three/fiber";
import { OrbitControls } from "three/examples/jsm/controls/OrbitControls.js";

/**
 * Orbit camera for the 3D demo routes: drag to orbit, scroll to zoom,
 * right-drag to pan, with optional auto-rotation and camera presets.
 *
 * `view` is `{ name, id }` — `id` changes on every press so the same preset can
 * be chosen twice in a row. `target` must be a stable array.
 */
export default function Orbit({ target, distance, autoRotate = false, view = null }) {
  const { camera, gl } = useThree();
  const controls = useRef(null);

  useEffect(() => {
    const c = new OrbitControls(camera, gl.domElement);
    c.enableDamping = true;
    c.dampingFactor = 0.08;
    c.minDistance = distance * 0.2;
    c.maxDistance = distance * 4;
    c.target.set(...target);
    controls.current = c;
    return () => c.dispose();
  }, [camera, gl, target, distance]);

  useEffect(() => {
    if (controls.current) controls.current.autoRotate = autoRotate;
  }, [autoRotate]);

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
