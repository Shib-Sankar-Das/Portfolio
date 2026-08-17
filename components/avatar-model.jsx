"use client";

import { useEffect, useMemo, useRef } from "react";
import { useFrame, useLoader } from "@react-three/fiber";
import * as THREE from "three";
import { GLTFLoader } from "three/examples/jsm/loaders/GLTFLoader.js";
import { MeshoptDecoder } from "three/examples/jsm/libs/meshopt_decoder.module.js";

const configureLoader = (loader) => loader.setMeshoptDecoder(MeshoptDecoder);

/** Kick off the GLB fetch as soon as this chunk loads, ahead of first render. */
export function preloadAvatar(url) {
  useLoader.preload(GLTFLoader, url, configureLoader);
}

/**
 * World-space bounds of the scene as it will actually render. Skinned meshes
 * are measured through their current bone pose (SkinnedMesh.computeBoundingBox
 * skins the vertices) — the raw geometry bounds describe the bind pose, which
 * for animated rigs can sit in a completely different place than any animated
 * frame.
 */
function posedBox(scene) {
  scene.updateMatrixWorld(true);
  // Measure relative to the scene's parent frame so the result is unaffected
  // by any wrapper groups (e.g. the caller's scale group) once mounted.
  const toParent = new THREE.Matrix4();
  if (scene.parent) {
    scene.parent.updateWorldMatrix(true, false);
    toParent.copy(scene.parent.matrixWorld).invert();
  }
  const box = new THREE.Box3();
  const meshBox = new THREE.Box3();
  const relative = new THREE.Matrix4();
  scene.traverse((obj) => {
    let source = null;
    if (obj.isSkinnedMesh) {
      obj.computeBoundingBox();
      source = obj.boundingBox;
    } else if (obj.isMesh) {
      if (!obj.geometry.boundingBox) obj.geometry.computeBoundingBox();
      source = obj.geometry.boundingBox;
    }
    if (source) {
      relative.multiplyMatrices(toParent, obj.matrixWorld);
      meshBox.copy(source).applyMatrix4(relative);
      box.union(meshBox);
    }
  });
  return box;
}

/**
 * Prepares a loaded GLB during render, before its first paint, so there is
 * never a frame with wrong opacity, wrong placement, or culled limbs.
 * Expects the skeleton to already be posed (mixer at frame 0). Normalizes
 * orientation (up-axis corrected to Y), centers the posed bounds at the
 * origin, returns the scale for `height` world units, and sets the starting
 * material state. Recomputes the bounding box after each mutation so the
 * memo stays idempotent under React Strict Mode's double-invoke.
 */
function prepareScene(scene, height, startOpacity, keepTransparent) {
  const materials = new Set();
  scene.traverse((obj) => {
    if (obj.isSkinnedMesh || obj.isMesh) {
      // Skinned verts move outside the frame-0 bounds; culling mid-wave
      // would make limbs vanish at frame edges.
      obj.frustumCulled = false;
      for (const m of Array.isArray(obj.material) ? obj.material : [obj.material]) {
        materials.add(m);
      }
    }
  });
  for (const m of materials) {
    m.transparent = startOpacity < 1 || keepTransparent;
    m.opacity = startOpacity;
  }

  let box = posedBox(scene);
  let size = box.getSize(new THREE.Vector3());

  if (size.z > size.y) {
    // Z-up export (some FBX pipelines): stand the model up.
    scene.rotation.x = -Math.PI / 2;
    box = posedBox(scene);
    size = box.getSize(new THREE.Vector3());
  }

  const center = box.getCenter(new THREE.Vector3());
  scene.position.sub(center);
  return { scale: height / Math.max(size.y, 1e-6), materials: [...materials] };
}

/**
 * Loads a skinned GLB (meshopt-compressed), plays its first animation clip,
 * and fades it in on arrival so it never pops. With `animated` false
 * (reduced motion) it renders a single posed frame and stays still.
 */
export default function AvatarModel({
  url = "/models/standing-greeting.glb",
  height = 3,
  position = [0, 0, 0],
  animated = true,
  /** Cap opacity below 1 to use the model as a dimmed backdrop (mobile). */
  opacity = 1,
}) {
  const gltf = useLoader(GLTFLoader, url, configureLoader);
  const group = useRef(null);
  // Fade starts complete when not animating (reduced motion renders one
  // still frame, so there is nothing to animate the fade with).
  const fade = useRef(animated ? 0 : 1);

  const { scale, materials, mixer } = useMemo(() => {
    // Pose the skeleton at frame 0 of its clip BEFORE measuring: an animated
    // rig can stand far away from its bind pose, and placement must reflect
    // what actually renders.
    const anim = new THREE.AnimationMixer(gltf.scene);
    if (gltf.animations[0]) {
      anim.clipAction(gltf.animations[0]).play();
      anim.update(0);
    }
    const prepared = prepareScene(gltf.scene, height, (animated ? 0 : 1) * opacity, animated);
    return { ...prepared, mixer: anim };
  }, [gltf, height, opacity, animated]);

  useEffect(() => {
    const clip = gltf.animations[0];
    if (!clip) return;
    const action = mixer.clipAction(clip);
    action.play();
    // Reduced motion: apply the pose once so we don't show the raw bind pose.
    if (!animated) mixer.update(0);
    return () => action.stop();
  }, [gltf, mixer, animated]);

  // The frame loop mutates three.js materials imperatively — the standard
  // react-three-fiber pattern, invisible to React state and safe here.
  // eslint-disable-next-line react-hooks/immutability
  useFrame((state, delta) => {
    if (animated) mixer.update(delta);

    if (fade.current < 1) {
      fade.current = Math.min(1, fade.current + delta * 1.4);
      for (const m of materials) {
        // eslint-disable-next-line react-hooks/immutability
        m.opacity = fade.current * opacity;
        // Opaque rendering is cheaper and depth-correct; restore it unless
        // the model is intentionally kept translucent.
        if (fade.current >= 1 && opacity >= 1) m.transparent = false;
      }
    }

    if (group.current && animated) {
      const t = state.clock.elapsedTime;
      group.current.position.y = position[1] + Math.sin(t * 0.7) * 0.06;
      group.current.rotation.y = Math.sin(t * 0.3) * 0.1;
    }
  });

  return (
    <group ref={group} position={position}>
      <group scale={scale}>
        <primitive object={gltf.scene} />
      </group>
    </group>
  );
}
