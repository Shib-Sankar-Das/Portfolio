"use client";

import { Suspense, useCallback, useMemo, useRef, useState } from "react";
import { Canvas } from "@react-three/fiber";
import Orbit from "../rig/orbit-controls";
import IndustrialArmModel, { Studio } from "./industrial-arm-scene";
import { HOME, JOINTS, PARTS, PRESETS, demoPose } from "./industrial-arm";

function Arm({ target, playing, showJoints, hidden, onReady, onStatus }) {
  const current = useRef({ ...HOME });
  const clock = useRef(0);
  const markers = useRef([]);
  const lastReport = useRef(0);
  const floor = useRef(0);

  // Always eased, so a slider jump or a preset still moves like a machine. A
  // plain function on purpose: it advances the easing, and useFrame always calls
  // the latest one.
  const getPose = (step) => {
    let want = target.current;
    if (playing) {
      clock.current += step;
      want = demoPose(clock.current);
    }
    const k = Math.min(1, step * (playing ? 14 : 6));
    for (const { key } of JOINTS) current.current[key] += (want[key] - current.current[key]) * k;
    return current.current;
  };

  const onFrame = useCallback(
    (solved) => {
      solved.joints.forEach((p, i) => markers.current[i]?.position.copy(p));
      const now = performance.now();
      if (now - lastReport.current > 120) {
        lastReport.current = now;
        onStatus?.({
          pose: { ...current.current },
          tool: [solved.tool.x, solved.tool.y - floor.current, solved.tool.z],
        });
      }
    },
    [onStatus]
  );

  const ready = useCallback(
    (info) => {
      floor.current = info.floor;
      onReady?.(info);
    },
    [onReady]
  );

  return (
    <group>
      <IndustrialArmModel getPose={getPose} hidden={hidden} onReady={ready} onFrame={onFrame} />
      {Array.from({ length: 7 }, (_, i) => (
        <mesh key={i} ref={(el) => (markers.current[i] = el)} visible={showJoints} renderOrder={10}>
          <sphereGeometry args={[0.028, 16, 12]} />
          <meshBasicMaterial color="#22d3ee" depthTest={false} transparent opacity={0.9} />
        </mesh>
      ))}
    </group>
  );
}

const VIEWS = [
  ["front", "Front"],
  ["right", "Side"],
  ["back", "Back"],
  ["top", "Top"],
  ["threeQuarter", "3/4"],
];

const button =
  "rounded-full border border-line px-3 py-1 text-xs font-semibold transition-colors hover:border-accent hover:text-accent aria-pressed:border-accent aria-pressed:text-accent disabled:opacity-50";

export default function IndustrialArmViewer() {
  const [pose, setPose] = useState({ ...HOME });
  const target = useRef({ ...HOME });
  const [playing, setPlaying] = useState(false);
  const [autoRotate, setAutoRotate] = useState(false);
  const [showJoints, setShowJoints] = useState(false);
  const [hidden, setHidden] = useState({});
  const [view, setView] = useState(null);
  const [info, setInfo] = useState(null);
  const [status, setStatus] = useState(null);

  // The arm spans from its elbow ~1 m behind the base to the gripper ~0.75 m in
  // front, and stands 1.9 m tall: aim at the middle of that and stand well back.
  const orbitTarget = useMemo(() => [0, 0.95, 0.1], []);
  const distance = 4.8;

  const apply = (next) => {
    setPlaying(false);
    setPose(next);
    target.current = next;
  };
  const shown = playing && status ? status.pose : pose;

  return (
    <div className="grid gap-5 lg:grid-cols-[minmax(0,1fr)_22rem]">
      <div className="relative h-[62vh] min-h-105 overflow-hidden rounded-3xl border border-line bg-[#e9edf3] dark:bg-[#0b1020] lg:h-[calc(100vh-10rem)]">
        <Canvas
          shadows="percentage"
          dpr={[1, 1.75]}
          camera={{ position: [2.4, 1.8, 2.9], fov: 38, near: 0.01, far: 100 }}
          gl={{ antialias: true }}
        >
          <Studio />
          <hemisphereLight args={["#ffffff", "#475569", 0.6]} />
          <directionalLight
            position={[3, 5, 3.5]}
            intensity={2.2}
            castShadow
            shadow-mapSize={[2048, 2048]}
            shadow-camera-left={-2.5}
            shadow-camera-right={2.5}
            shadow-camera-top={2.5}
            shadow-camera-bottom={-2.5}
          />
          <gridHelper args={[6, 30, "#64748b", "#94a3b8"]} position-y={0.001} />
          <mesh rotation-x={-Math.PI / 2} receiveShadow>
            <planeGeometry args={[6, 6]} />
            <shadowMaterial opacity={0.28} />
          </mesh>
          <Suspense fallback={null}>
            <Arm
              target={target}
              playing={playing}
              showJoints={showJoints}
              hidden={hidden}
              onReady={setInfo}
              onStatus={setStatus}
            />
          </Suspense>
          <Orbit target={orbitTarget} distance={distance} autoRotate={autoRotate} view={view} />
        </Canvas>

        {!info && (
          <div className="pointer-events-none absolute inset-0 flex items-center justify-center text-sm text-muted">
            Loading the arm…
          </div>
        )}
        <div className="pointer-events-none absolute left-4 top-4 rounded-xl bg-black/55 px-3 py-2 text-[11px] text-slate-200 backdrop-blur">
          Drag to orbit · scroll to zoom · right-drag to pan
        </div>
        <div className="absolute bottom-4 left-4 right-4 flex flex-wrap gap-2">
          {VIEWS.map(([name, label]) => (
            <button
              key={name}
              type="button"
              onClick={() => setView({ name, id: Date.now() })}
              className="rounded-full border border-white/20 bg-black/55 px-3 py-1.5 text-xs font-medium text-slate-100 backdrop-blur transition-colors hover:border-amber-400 hover:text-amber-300"
            >
              {label}
            </button>
          ))}
          <button
            type="button"
            onClick={() => setAutoRotate((v) => !v)}
            aria-pressed={autoRotate}
            className="rounded-full border border-white/20 bg-black/55 px-3 py-1.5 text-xs font-medium text-slate-100 backdrop-blur transition-colors hover:border-amber-400 aria-pressed:border-amber-400 aria-pressed:text-amber-300"
          >
            360° spin
          </button>
        </div>
      </div>

      <aside className="space-y-4">
        <section className="rounded-2xl border border-line bg-card p-5">
          <div className="flex items-center justify-between gap-3">
            <h2 className="text-sm font-bold uppercase tracking-[0.14em]">Joints</h2>
            <div className="flex gap-2">
              <button type="button" onClick={() => setPlaying((v) => !v)} aria-pressed={playing} className={button}>
                {playing ? "Stop demo" : "Pick & place demo"}
              </button>
            </div>
          </div>
          <div className="mt-4 space-y-4">
            {JOINTS.map((j) => {
              const value = Math.round(shown[j.key]);
              return (
                <label key={j.key} className="block">
                  <span className="flex items-baseline justify-between text-xs">
                    <span className="font-medium">{j.label}</span>
                    <span className="font-mono text-muted">
                      {value}
                      {j.unit}
                    </span>
                  </span>
                  <input
                    type="range"
                    min={j.min}
                    max={j.max}
                    step={1}
                    value={value}
                    disabled={playing}
                    aria-label={j.label}
                    onChange={(e) => apply({ ...pose, [j.key]: Number(e.target.value) })}
                    className="mt-1.5 w-full accent-amber-400 disabled:opacity-50"
                  />
                </label>
              );
            })}
          </div>
          <div className="mt-5 flex flex-wrap gap-2">
            {PRESETS.map((p) => (
              <button key={p.name} type="button" onClick={() => apply({ ...p.pose })} className={button}>
                {p.name}
              </button>
            ))}
          </div>
        </section>

        <section className="rounded-2xl border border-line bg-card p-5">
          <h2 className="text-sm font-bold uppercase tracking-[0.14em]">Status</h2>
          <p className="mt-3 text-xs text-muted" data-testid="arm-parts">
            {info
              ? `${info.parts.length} parts loaded${info.missing.length ? ` · missing: ${info.missing.join(", ")}` : ""} · ${info.height.toFixed(2)} m tall`
              : "Loading…"}
          </p>
          {status && (
            <p className="mt-1 font-mono text-xs" data-testid="arm-tool">
              Gripper at x {status.tool[0].toFixed(2)} · y {status.tool[1].toFixed(2)} · z{" "}
              {status.tool[2].toFixed(2)} m
            </p>
          )}
          <label className="mt-3 flex items-center gap-2 text-xs">
            <input type="checkbox" checked={showJoints} onChange={(e) => setShowJoints(e.target.checked)} className="accent-cyan-400" />
            Show joint pivots
          </label>
        </section>

        <section className="rounded-2xl border border-line bg-card p-5">
          <h2 className="text-sm font-bold uppercase tracking-[0.14em]">Parts</h2>
          <p className="mt-1 text-xs text-muted">Hide parts to inspect each one on its own.</p>
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
