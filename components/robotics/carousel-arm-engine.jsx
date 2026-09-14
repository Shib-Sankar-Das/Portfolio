"use client";

import { Component, Suspense, useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Canvas, advance } from "@react-three/fiber";
import * as THREE from "three";
import IndustrialArmModel, { Studio } from "./industrial/industrial-arm-scene";
import { reachPolar } from "./industrial/industrial-arm-ik";

/**
 * The 3D half of the project carousel: the industrial arm, drawn on a
 * transparent canvas between the cards behind it and the cards in front.
 *
 * It never animates on its own. The carousel owns the clock: every frame it
 * calls `engine.render(timestamp, task)` with where the gripper should be, and
 * this solves the joint angles, renders that exact pose synchronously, and
 * returns where the gripper tip actually is — so a card being carried is placed
 * against the very frame the arm was drawn in.
 *
 * Loaded lazily and fenced off by an error boundary: if WebGL or the model is
 * unavailable, `onEngine` is simply never called and the cards carry on alone.
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

function Bridge({ onEngine }) {
  const pose = useRef(null);
  const tool = useRef(null);
  const [ready, setReady] = useState(false);

  const getPose = useCallback(() => pose.current ?? reachPolar(0, 0.85, 1.5), []);
  const onFrame = useCallback((solved) => {
    tool.current = solved.tool;
  }, []);
  const onReady = useCallback(() => setReady(true), []);

  useEffect(() => {
    if (!ready) return;
    onEngine({
      render(timestamp, task) {
        pose.current = reachPolar(task.heading, task.r, task.h, { grip: task.grip, roll: task.roll });
        advance(timestamp);
        return tool.current;
      },
    });
    return () => onEngine(null);
  }, [ready, onEngine]);

  return <IndustrialArmModel getPose={getPose} shadows={false} onReady={onReady} onFrame={onFrame} />;
}

export default function CarouselArmEngine({ camera, onEngine }) {
  const cam = useMemo(() => new THREE.PerspectiveCamera(camera.fov, 1, 0.05, 60), [camera.fov]);

  useEffect(() => {
    cam.position.set(...camera.position);
    cam.lookAt(...camera.target);
    cam.updateProjectionMatrix();
  }, [cam, camera]);

  return (
    <Boundary>
      <Canvas
        camera={cam}
        frameloop="never"
        dpr={[1, 1.75]}
        gl={{ alpha: true, antialias: true, powerPreference: "high-performance" }}
        // r3f's container turns pointer events back on for itself; the cards
        // behind the arm are under this canvas and must still take clicks.
        style={{ background: "transparent", pointerEvents: "none" }}
        aria-hidden
      >
        <Studio intensity={0.85} />
        <hemisphereLight args={["#f8fafc", "#334155", 0.7]} />
        <directionalLight position={[2.5, 5, -4]} intensity={2.1} />
        <directionalLight position={[-3, 2.5, 3]} intensity={0.9} color="#bae6fd" />
        <Suspense fallback={null}>
          <Bridge onEngine={onEngine} />
        </Suspense>
      </Canvas>
    </Boundary>
  );
}
