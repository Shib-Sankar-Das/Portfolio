"use client";

import { useCallback, useState, useSyncExternalStore } from "react";
import { MotionConfig } from "framer-motion";
import ProjectCarousel from "./project-carousel";

// ---------------------------------------------------------------------------
// Test harness for the arm carousel.
//
// The carousel below is the exact component the robotics route uses — nothing
// is re-implemented — with a panel above it that says what the browser reports
// and what the carousel is doing, so "it doesn't work" can be pinned down to a
// cause: no WebGL, the model not loading, reduced motion, or the carousel
// itself.
// ---------------------------------------------------------------------------

const REDUCED = "(prefers-reduced-motion: reduce)";

const subscribeReduced = (cb) => {
  const mq = window.matchMedia(REDUCED);
  mq.addEventListener("change", cb);
  return () => mq.removeEventListener("change", cb);
};
const readReduced = () => window.matchMedia(REDUCED).matches;

let webglCache;
const readWebgl = () => {
  if (webglCache === undefined) {
    try {
      const canvas = document.createElement("canvas");
      webglCache = Boolean(canvas.getContext("webgl2") || canvas.getContext("webgl"));
    } catch {
      webglCache = false;
    }
  }
  return webglCache;
};

const noSubscribe = () => () => {};
const onServer = () => null;

const describe = (e) => {
  switch (e.type) {
    case "arm-ready":
      return "3D arm loaded";
    case "pose":
      return `Arm → ${e.pose}`;
    case "take":
      return `Hook took “${e.name}”`;
    case "drop":
      return `Released “${e.name}” in the middle`;
    case "open":
      return `Opened “${e.name}”`;
    case "close":
      return "Closed the write-up";
    default:
      return null;
  }
};

function Stat({ label, value, tone = "muted" }) {
  const colour = {
    good: "text-emerald-500",
    warn: "text-amber-500",
    bad: "text-rose-500",
    muted: "text-muted",
  }[tone];
  return (
    <div className="rounded-xl border border-line bg-card/70 px-3.5 py-2.5">
      <p className="text-[10px] font-semibold uppercase tracking-[0.14em] text-muted">{label}</p>
      <p className={`mt-1 text-sm font-semibold ${colour}`}>{value}</p>
    </div>
  );
}

export default function ArmDemo({ projects, accent }) {
  const reduced = useSyncExternalStore(subscribeReduced, readReduced, onServer);
  const webgl = useSyncExternalStore(noSubscribe, readWebgl, onServer);

  const [forceMotion, setForceMotion] = useState(false);
  const [armReady, setArmReady] = useState(false);
  const [state, setState] = useState({ index: 0, busy: false, count: projects.length });
  const [log, setLog] = useState([]);

  const onStatus = useCallback((e) => {
    if (e.type === "arm-ready") setArmReady(true);
    if (e.type === "state") setState({ index: e.index, busy: e.busy, count: e.count });
    const text = describe(e);
    if (text) {
      const at = (performance.now() / 1000).toFixed(2);
      setLog((l) => [{ at, text }, ...l].slice(0, 12));
    }
  }, []);

  const frozen = reduced && !forceMotion;

  return (
    <div>
      {/* ------------------------------ status ------------------------------ */}
      <div className="grid grid-cols-2 gap-2.5 sm:grid-cols-5">
        <Stat
          label="WebGL"
          value={webgl === null ? "…" : webgl ? "Available" : "Unavailable"}
          tone={webgl === null ? "muted" : webgl ? "good" : "bad"}
        />
        <Stat
          label="3D arm"
          value={armReady ? "Loaded" : webgl === false ? "Cannot load" : "Loading…"}
          tone={armReady ? "good" : webgl === false ? "bad" : "warn"}
        />
        <Stat
          label="Reduced motion"
          value={reduced === null ? "…" : reduced ? (forceMotion ? "On · overridden" : "On · arm frozen") : "Off"}
          tone={reduced ? (forceMotion ? "warn" : "bad") : "good"}
        />
        <Stat label="Card" value={`${state.index + 1} / ${state.count}`} />
        <Stat label="Carousel" value={state.busy ? "Moving…" : "Ready"} tone={state.busy ? "warn" : "good"} />
      </div>

      {frozen && (
        <p className="mt-3 rounded-xl border border-amber-500/40 bg-amber-500/10 px-4 py-3 text-xs leading-relaxed">
          This browser is asking for reduced motion — on Windows that is{" "}
          <span className="font-semibold">Settings → Accessibility → Visual effects → Animation
          effects</span>{" "}
          being off. The site honours it, so the arm holds still and the cards jump instead of
          sliding. Use the switch below to play the animation anyway on this page.
        </p>
      )}

      <div className="mt-3 flex flex-wrap items-center gap-3">
        <button
          type="button"
          onClick={() => setForceMotion((v) => !v)}
          aria-pressed={forceMotion}
          className="rounded-full border border-line bg-card px-4 py-2 text-xs font-semibold transition-colors hover:border-accent hover:text-accent aria-pressed:border-accent aria-pressed:text-accent"
        >
          {forceMotion ? "✓ Playing animations regardless of reduced motion" : "Play animations even with reduced motion"}
        </button>
        <span className="text-xs text-muted">
          Hover an arrow to see the arm get ready · press it to fetch a card · click a card to open it
        </span>
      </div>

      {/* ----------------------------- carousel ----------------------------- */}
      <div className="mt-8">
        <MotionConfig reducedMotion={forceMotion ? "never" : "user"}>
          <ProjectCarousel
            projects={projects}
            accent={accent}
            forceMotion={forceMotion}
            onStatus={onStatus}
          />
        </MotionConfig>
      </div>

      {/* ------------------------------- log -------------------------------- */}
      <div className="mt-10 rounded-2xl border border-line bg-card/70 p-4">
        <p className="text-[10px] font-semibold uppercase tracking-[0.14em] text-muted">
          What just happened
        </p>
        {log.length === 0 ? (
          <p className="mt-2 text-xs text-muted">Nothing yet — hover or press an arrow.</p>
        ) : (
          <ol className="mt-2 space-y-1 font-mono text-[11px]">
            {log.map((entry, i) => (
              <li key={`${entry.at}-${i}`} className={i === 0 ? "text-fg" : "text-muted"}>
                <span className="mr-2 text-muted/70">{entry.at}s</span>
                {entry.text}
              </li>
            ))}
          </ol>
        )}
      </div>
    </div>
  );
}
