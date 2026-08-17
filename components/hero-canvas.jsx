"use client";

import { Suspense, useEffect, useMemo, useRef, useState } from "react";
import { Canvas, useFrame, useThree } from "@react-three/fiber";
import * as THREE from "three";
import AvatarModel, { preloadAvatar } from "./avatar-model";

const AVATAR_URL = "/models/standing-greeting.glb";

// Start downloading the model as soon as this (already idle-deferred) chunk
// loads, so the character is usually ready by the time the canvas paints.
if (typeof window !== "undefined") preloadAvatar(AVATAR_URL);

// ---------------------------------------------------------------------------
// Particle positions are generated off the main thread in a Web Worker so the
// hero never blocks first paint. The worker is built from a Blob so no bundler
// integration is required; generation falls back to inline if Workers fail.
// ---------------------------------------------------------------------------

function generatePositions(count, radius) {
  const arr = new Float32Array(count * 3);
  for (let i = 0; i < count; i++) {
    // Uniformly distributed points inside a sphere
    const r = radius * Math.cbrt(Math.random());
    const theta = Math.random() * Math.PI * 2;
    const phi = Math.acos(2 * Math.random() - 1);
    arr[i * 3] = r * Math.sin(phi) * Math.cos(theta);
    arr[i * 3 + 1] = r * Math.sin(phi) * Math.sin(theta);
    arr[i * 3 + 2] = r * Math.cos(phi);
  }
  return arr;
}

const WORKER_SOURCE = `
  const generate = ${generatePositions.toString()};
  self.onmessage = (e) => {
    const { count, radius } = e.data;
    const arr = generate(count, radius);
    self.postMessage(arr, [arr.buffer]);
  };
`;

function useWorkerPositions(count, radius) {
  const [positions, setPositions] = useState(null);

  useEffect(() => {
    let worker;
    let cancelled = false;
    try {
      const url = URL.createObjectURL(
        new Blob([WORKER_SOURCE], { type: "application/javascript" })
      );
      worker = new Worker(url);
      URL.revokeObjectURL(url);
      worker.onmessage = (e) => {
        if (!cancelled) setPositions(e.data);
      };
      worker.onerror = () => {
        if (!cancelled) setPositions(generatePositions(count, radius));
      };
      worker.postMessage({ count, radius });
    } catch {
      setPositions(generatePositions(count, radius));
    }
    return () => {
      cancelled = true;
      worker?.terminate();
    };
  }, [count, radius]);

  return positions;
}

function ParticleSphere({ color, count, radius = 3.4, size = 0.02, opacity = 0.65, speed = 1 }) {
  const ref = useRef(null);
  const positions = useWorkerPositions(count, radius);

  useFrame((state, delta) => {
    if (!ref.current) return;
    ref.current.rotation.y += delta * 0.045 * speed;
    ref.current.rotation.x += delta * 0.012 * speed;
  });

  if (!positions) return null;

  return (
    <points ref={ref}>
      <bufferGeometry>
        <bufferAttribute
          attach="attributes-position"
          count={count}
          array={positions}
          itemSize={3}
        />
      </bufferGeometry>
      <pointsMaterial
        size={size}
        color={color}
        transparent
        opacity={opacity}
        sizeAttenuation
        depthWrite={false}
      />
    </points>
  );
}

/** Accent dust (replaces drei's <Sparkles/>): sparser, larger, counter-rotating cloud. */
function SparkleDust({ color, count }) {
  return (
    <ParticleSphere color={color} count={count} radius={3.6} size={0.05} opacity={0.4} speed={-0.6} />
  );
}

/** Sizes and grounds the greeting character responsively from the viewport. */
function HeroAvatar({ animated, small }) {
  const viewport = useThree((s) => s.viewport);
  // Desktop: a large grounded figure on the right. Mobile: fully visible in
  // its own band at the bottom of the hero (the copy reserves that space via
  // padding), never wider than the screen.
  const height = small
    ? Math.min(viewport.height * 0.3, viewport.width * 1.1)
    : Math.min(4.6, viewport.height * 0.8);
  // Feet slightly above the bottom edge of the canvas.
  const y = -viewport.height / 2 + height / 2 + (small ? 0.38 : 0.15);
  return (
    <AvatarModel
      url={AVATAR_URL}
      height={height}
      position={[0, y, 0]}
      animated={animated}
    />
  );
}

/** Gently steers the whole scene toward the pointer for a parallax feel. */
function PointerRig({ children }) {
  const ref = useRef(null);
  useFrame((state, delta) => {
    if (!ref.current) return;
    const targetX = state.pointer.y * 0.22;
    const targetY = state.pointer.x * 0.35;
    ref.current.rotation.x = THREE.MathUtils.damp(ref.current.rotation.x, targetX, 2.5, delta);
    ref.current.rotation.y = THREE.MathUtils.damp(ref.current.rotation.y, targetY, 2.5, delta);
  });
  return <group ref={ref}>{children}</group>;
}

export default function HeroCanvas({
  primary = "#a78bfa",
  secondary = "#f472b6",
  active = true,
}) {
  // Adaptive quality: fewer particles and lower DPR on small screens,
  // near-static scene when the user prefers reduced motion.
  const { small, reducedMotion } = useMemo(() => {
    if (typeof window === "undefined") return { small: false, reducedMotion: false };
    return {
      small: window.matchMedia("(max-width: 768px)").matches,
      reducedMotion: window.matchMedia("(prefers-reduced-motion: reduce)").matches,
    };
  }, []);

  // Off-screen or reduced motion => stop the render loop entirely.
  const frameloop = reducedMotion ? "demand" : active ? "always" : "never";

  return (
    <Canvas
      dpr={small ? [1, 1.5] : [1, 1.8]}
      camera={{ position: [0, 0, 5.4], fov: 55 }}
      gl={{ antialias: !small, alpha: true, powerPreference: "high-performance" }}
      frameloop={frameloop}
      style={{ background: "transparent" }}
    >
      {/* Cheap four-light studio setup for the PBR character; no shadows.
          The front fill is what keeps the face out of shadow. */}
      <hemisphereLight intensity={1.6} color="#ffffff" groundColor="#5c5288" />
      <directionalLight position={[2.5, 3, 4]} intensity={2.8} />
      <directionalLight position={[0, 0.5, 6]} intensity={1.3} color="#fff4e6" />
      <directionalLight position={[-3, 1.5, -2.5]} intensity={1.1} color={secondary} />

      <PointerRig>
        <ParticleSphere color={primary} count={small ? 1200 : 2600} />
        <Suspense fallback={null}>
          <HeroAvatar animated={!reducedMotion} small={small} />
        </Suspense>
        <SparkleDust color={primary} count={small ? 60 : 110} />
      </PointerRig>
    </Canvas>
  );
}
