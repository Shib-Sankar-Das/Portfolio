"use client";

import dynamic from "next/dynamic";
import { useCallback, useEffect, useLayoutEffect, useRef, useState } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import ProjectCard from "./project-card";
import ProjectDetail from "./project-detail";

// The arm is loaded on its own, after the page: the carousel works — cards,
// ring, write-ups — whether or not it ever arrives.
const ArmEngine = dynamic(() => import("./carousel-arm-engine"), { ssr: false });

// ---------------------------------------------------------------------------
// The scene, in the arm model's own units (metres, Y up, the arm facing -z).
//
// The projects sit evenly spaced on a ring around the arm — a circular queue:
// the card after the last is the first again, and the ring turns to bring each
// one to the front. The arm stands in the middle on its turntable, reaches out
// to a card, lifts it, and carries it round to the front slot.
// ---------------------------------------------------------------------------
const BASE = { x: -0.05, z: 0 };
/** Height of a card's top edge where it rests on the ring. */
const CARD_Y = 0.7;
const HOVER_Y = CARD_Y + 0.3;
const GRIP_Y = CARD_Y + 0.03;
const LIFT_Y = CARD_Y + 0.38;
/**
 * Parked turned a little aside. Pointing straight at the camera the arm is
 * seen end-on and reads as a pole; turned, its shoulder-elbow-wrist shape shows.
 */
const IDLE = { heading: -38, r: 0.95, h: 1.45, grip: 44, roll: 0 };

// Looking down on the ring at about 20°, so it reads as a ring — front card
// low, the ones behind the arm higher — with the whole arm, base to raised
// gripper, in frame and the front card's full height inside the stage.
//
// The ring is an oval: `rz` is how far the front card stands from the arm, `rx`
// how far the side cards spread. `rx` is the most it may be — each frame it is
// narrowed, if need be, so every card still fits the stage (see fitRing).
const LAYOUT = {
  large: {
    camera: { position: [-0.05, 3.5, -9.2], target: [-0.05, 0.48, 0], fov: 32 },
    card: 360,
    stage: 880,
    // The arm never rises into the top of the stage — measured across every
    // pose it reaches, at its highest, 178px down — so that band is cropped
    // off, leaving ~25px of headroom and no gap under the section heading.
    trim: 152,
    ring: { rx: 2.2, rz: 1.5 },
  },
  small: {
    camera: { position: [-0.05, 3.7, -12.6], target: [-0.05, 0.42, 0], fov: 32 },
    card: 210,
    stage: 760,
    trim: 182,
    ring: { rx: 1.45, rz: 1.3 },
  },
};

const DEG = Math.PI / 180;
const wrapDeg = (a) => ((((a + 180) % 360) + 360) % 360) - 180;
const mod = (i, n) => ((i % n) + n) % n;
const ease = (t) => (t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2);
const lerp = (a, b, t) => a + (b - a) * t;

/** Perspective projection matching three.js's camera, without three.js. */
function projector(camera, width, height) {
  const [px, py, pz] = camera.position;
  const [tx, ty, tz] = camera.target;
  let f = [tx - px, ty - py, tz - pz];
  const fl = Math.hypot(...f);
  f = f.map((v) => v / fl);
  let r = [f[1] * 0 - f[2] * 1, f[2] * 0 - f[0] * 0, f[0] * 1 - f[1] * 0]; // f × up
  const rl = Math.hypot(...r);
  r = r.map((v) => v / rl);
  const u = [r[1] * f[2] - r[2] * f[1], r[2] * f[0] - r[0] * f[2], r[0] * f[1] - r[1] * f[0]];
  const t = Math.tan((camera.fov * DEG) / 2);
  const aspect = width / Math.max(1, height);
  return ({ x, y, z }) => {
    const d = [x - px, y - py, z - pz];
    const cx = d[0] * r[0] + d[1] * r[1] + d[2] * r[2];
    const cy = d[0] * u[0] + d[1] * u[1] + d[2] * u[2];
    const depth = d[0] * f[0] + d[1] * f[1] + d[2] * f[2];
    return {
      x: width / 2 + (cx / (depth * t * aspect)) * (width / 2),
      y: height / 2 - (cy / (depth * t)) * (height / 2),
      depth,
    };
  };
}

const onRing = (headingDeg, ring, y = CARD_Y) => ({
  x: BASE.x - Math.sin(headingDeg * DEG) * ring.rx,
  y,
  z: BASE.z - Math.cos(headingDeg * DEG) * ring.rz,
});

/** How far out from the arm's base a point on the ring is. */
const reachOf = (headingDeg, ring) => {
  const p = onRing(headingDeg, ring);
  return Math.hypot(p.x - BASE.x, p.z - BASE.z);
};

/**
 * The widest the ring can run on this stage with every card still inside it.
 * A card's depth depends only on the ring's front-to-back size, so its on-screen
 * spread is exactly proportional to `rx` and can be solved for directly.
 */
function fitRing(L, n, w, h) {
  const project = projector(L.camera, w, h);
  const frontDepth = project(onRing(0, L.ring)).depth;
  const tan = Math.tan((L.camera.fov * DEG) / 2);
  let rx = L.ring.rx;
  for (let k = 1; k < n; k++) {
    const a = (k * 360) / n;
    const side = Math.abs(Math.sin(a * DEG));
    if (side < 0.2) continue;
    const depth = project({ x: BASE.x, y: CARD_Y, z: BASE.z - Math.cos(a * DEG) * L.ring.rz }).depth;
    const pxPerMetre = h / 2 / (depth * tan);
    const halfCard = (L.card / 2) * (frontDepth / depth);
    rx = Math.min(rx, (w / 2 - 12 - halfCard) / (side * pxPerMetre));
  }
  // The floor is low enough for the narrowest phones, where the ring ends up
  // deeper than it is wide and the side cards tuck in close behind the front one.
  return { rx: Math.max(0.7, rx), rz: L.ring.rz };
}

const BLEND_MS = 240;
const wait = (ms) => new Promise((r) => setTimeout(r, ms));

/**
 * The robotics project carousel: a ring of cards worked by an industrial arm.
 *
 * `forceMotion` plays the animation even under reduced motion and `onStatus`
 * reports what the carousel is doing — both are for the /arm-demo test route.
 */
export default function ProjectCarousel({ projects, accent = "#fbbf24", forceMotion = false, onStatus }) {
  const count = projects.length;
  const [index, setIndex] = useState(0);
  const [busy, setBusy] = useState(false);
  const [open, setOpen] = useState(null);
  const [visible, setVisible] = useState(false);
  const [small, setSmall] = useState(false);
  const [reduced, setReduced] = useState(false);

  const stage = useRef(null);
  const cards = useRef([]);
  const size = useRef({ w: 1, h: 1 });
  const engine = useRef(null);
  const report = useRef(onStatus);
  const gone = useRef(false);
  const motion = useRef(true);
  const layoutKey = small ? "small" : "large";
  const layout = LAYOUT[layoutKey];
  const layoutRef = useRef(layout);

  // Everything the frame loop reads lives here, outside React.
  const sim = useRef({
    task: { ...IDLE },
    tween: null,
    ring: 0,
    ringTween: null,
    carry: null,
    forward: 0,
    forwardTween: null,
    shape: LAYOUT.large.ring,
    count,
  });

  useEffect(() => {
    report.current = onStatus;
    layoutRef.current = layout;
    sim.current.count = count;
    motion.current = forceMotion || !reduced;
  });

  useEffect(() => {
    gone.current = false;
    return () => {
      gone.current = true;
    };
  }, []);

  useEffect(() => {
    report.current?.({ type: "state", index, busy, count });
  }, [index, busy, count]);

  useEffect(() => {
    const mq = window.matchMedia("(prefers-reduced-motion: reduce)");
    const sync = () => setReduced(mq.matches);
    sync();
    mq.addEventListener("change", sync);
    return () => mq.removeEventListener("change", sync);
  }, []);

  useEffect(() => {
    const el = stage.current;
    if (!el) return;
    const ro = new ResizeObserver(([entry]) => {
      size.current = { w: entry.contentRect.width, h: entry.contentRect.height };
      setSmall(entry.contentRect.width < 640);
      // Place the cards for the new size straight away, even off-screen.
      frameRef.current?.(performance.now());
    });
    ro.observe(el);
    const io = new IntersectionObserver(([e]) => setVisible(e.isIntersecting), { rootMargin: "200px" });
    io.observe(el);
    return () => {
      ro.disconnect();
      io.disconnect();
    };
  }, []);

  const frameRef = useRef(null);

  const onEngine = useCallback((value) => {
    engine.current = value;
    if (value) report.current?.({ type: "arm-ready" });
  }, []);

  // ------------------------------------------------------------ simulation --

  /** Moves the gripper toward `to` over `ms`, from wherever it is now. */
  const moveTo = useCallback((to, ms, name) => {
    const s = sim.current;
    if (name) report.current?.({ type: "pose", pose: name });
    if (!motion.current || !engine.current) {
      s.task = { ...s.task, ...to };
      s.tween = null;
      return Promise.resolve();
    }
    s.tween?.resolve();
    return new Promise((resolve) => {
      s.tween = { from: { ...s.task }, to: { ...s.task, ...to }, t0: performance.now(), ms, resolve };
    });
  }, []);

  const turnRing = useCallback((to, ms) => {
    const s = sim.current;
    if (!motion.current || ms <= 0) {
      s.ring = to;
      s.ringTween = null;
      return;
    }
    s.ringTween = { from: s.ring, to, t0: performance.now(), ms };
  }, []);

  const setForward = useCallback((to, ms) => {
    const s = sim.current;
    const animate = motion.current && ms > 0;
    s.forwardTween = animate ? { from: s.forward, to, t0: performance.now(), ms } : null;
    if (!animate) s.forward = to;
  }, []);

  /** One frame: advance the tweens, render the arm, place every card. */
  const frame = useCallback((now) => {
    const s = sim.current;
    const n = s.count;
    const { w, h } = size.current;
    const L = layoutRef.current;

    if (s.tween) {
      const k = Math.min(1, (now - s.tween.t0) / s.tween.ms);
      const e = ease(k);
      for (const key of Object.keys(s.tween.to)) s.task[key] = lerp(s.tween.from[key], s.tween.to[key], e);
      if (k >= 1) {
        const done = s.tween.resolve;
        s.tween = null;
        done();
      }
    }
    for (const [key, target] of [["ring", "ringTween"], ["forward", "forwardTween"]]) {
      const tw = s[target];
      if (!tw) continue;
      const k = Math.min(1, (now - tw.t0) / tw.ms);
      s[key] = lerp(tw.from, tw.to, ease(k));
      if (k >= 1) s[target] = null;
    }

    // A machine at rest is never quite still.
    const idle = !s.tween && motion.current ? Math.sin(now / 900) * 0.012 : 0;
    const tool = engine.current?.render(now, { ...s.task, h: s.task.h + idle }) ?? null;

    const project = projector(L.camera, w, h);
    const ring = fitRing(L, n, w, h);
    s.shape = ring;
    const baseDepth = project({ x: BASE.x, y: CARD_Y, z: BASE.z }).depth;
    const frontDepth = project(onRing(0, ring)).depth;
    const step = 360 / n;

    for (let i = 0; i < n; i++) {
      const el = cards.current[i];
      if (!el) continue;
      const angle = wrapDeg((i - s.ring) * step);
      const slot = project(onRing(angle, ring));
      let x = slot.x;
      let y = slot.y;
      let depth = slot.depth;
      let lift = 0;

      const c = s.carry;
      if (c && c.i === i && tool) {
        const held = project({ x: tool.x, y: tool.y - 0.02, z: tool.z });
        const t = Math.min(1, (now - c.t0) / BLEND_MS);
        const k = c.phase === "drop" ? 1 - ease(t) : ease(t);
        x = lerp(slot.x, held.x, k);
        y = lerp(slot.y, held.y, k);
        depth = lerp(slot.depth, held.depth, k);
        lift = k;
        if (c.phase === "drop" && t >= 1) s.carry = null;
      }

      const scale = (frontDepth / depth) * (c && c.i === i ? 1 + 0.3 * s.forward : 1);
      const cos = Math.cos(angle * DEG);
      const opacity = lift > 0 ? 1 : 0.42 + 0.58 * ((cos + 1) / 2) ** 1.4;
      // In front of the arm, a card is drawn over the canvas; behind it, under —
      // so the arm hides what it should.
      const front = depth < baseDepth;
      el.style.transform = `translate3d(${x - L.card / 2}px, ${y}px, 0) scale(${scale})`;
      el.style.opacity = String(opacity);
      el.style.zIndex = String(front ? 30 + Math.round((baseDepth - depth) * 10) : Math.max(1, 9 - Math.round((depth - baseDepth) * 2)));
      el.dataset.carried = c && c.i === i ? c.phase : "";
    }
  }, []);

  // Place the cards before first paint and whenever the layout changes.
  useLayoutEffect(() => {
    frameRef.current = frame;
    frame(performance.now());
  }, [frame, layoutKey, index, count]);

  useEffect(() => {
    if (!visible && !busy) return;
    let raf = requestAnimationFrame(function loop(now) {
      frame(now);
      raf = requestAnimationFrame(loop);
    });
    return () => cancelAnimationFrame(raf);
  }, [visible, busy, frame]);

  // ----------------------------------------------------------- choreography --

  const take = (i) => {
    report.current?.({ type: "take", name: projects[i].name });
    sim.current.carry = { i, phase: "take", t0: performance.now() };
  };
  const drop = () => {
    const c = sim.current.carry;
    if (!c) return;
    report.current?.({ type: "drop", name: projects[c.i].name });
    sim.current.carry = { ...c, phase: "drop", t0: performance.now() };
  };

  /** Fetches the card `dir` places round and carries it to the front. */
  const fetchCard = async (dir) => {
    const n = count;
    const incoming = mod(index + dir, n);
    const step = (360 / n) * dir;
    const animate = motion.current && engine.current;

    if (!animate) {
      // No arm (still loading, or no WebGL): the ring still turns on its own —
      // unless reduced motion is asked for, when it simply jumps.
      const ms = motion.current ? 700 : 0;
      turnRing(sim.current.ring + dir, ms);
      setIndex(incoming);
      if (ms) await wait(ms);
      return;
    }
    await moveTo({ heading: step, r: reachOf(step, sim.current.shape), h: HOVER_Y, grip: 0 }, 620, "reach");
    await moveTo({ h: GRIP_Y }, 260, "lower");
    await moveTo({ grip: 100 }, 190, "grip");
    take(incoming);
    await moveTo({ h: LIFT_Y }, 240, "lift");
    if (gone.current) return;
    // The queue turns as the arm carries its card round to the front.
    turnRing(sim.current.ring + dir, 820);
    setIndex(incoming);
    await moveTo({ heading: 0, r: sim.current.shape.rz }, 820, "carry");
    await moveTo({ h: GRIP_Y }, 260, "place");
    await moveTo({ grip: 0 }, 170, "release");
    drop();
    await moveTo(IDLE, 560, "idle");
  };

  const onArrow = async (dir) => {
    if (busy || count < 2) return;
    setBusy(true);
    await fetchCard(dir);
    if (!gone.current) setBusy(false);
  };

  const pick = async (i) => {
    if (busy) return;
    let offset = mod(i - index, count);
    if (offset > count / 2) offset -= count;
    if (Math.abs(offset) > 1) return;
    setBusy(true);
    if (offset !== 0) await fetchCard(offset);
    if (gone.current) return;
    const project = projects[i];

    if (!(motion.current && engine.current)) {
      report.current?.({ type: "open", name: project.name });
      setOpen(project);
      return;
    }
    await moveTo({ heading: 0, r: sim.current.shape.rz, h: HOVER_Y, grip: 0 }, 420, "reach");
    await moveTo({ h: GRIP_Y }, 240, "lower");
    await moveTo({ grip: 100 }, 180, "grip");
    take(i);
    // Lifted off the ring and brought toward the viewer, then the write-up opens
    // out of the card.
    setForward(1, 700);
    await moveTo({ r: sim.current.shape.rz + 0.5, h: CARD_Y + 0.75 }, 700, "present");
    await wait(120);
    if (gone.current) return;
    report.current?.({ type: "open", name: project.name });
    setOpen(project);
  };

  const close = async () => {
    report.current?.({ type: "close" });
    setOpen(null);
    if (motion.current && engine.current && sim.current.carry) {
      setForward(0, 520);
      await moveTo({ r: sim.current.shape.rz, h: GRIP_Y }, 520, "place");
      await moveTo({ grip: 0 }, 170, "release");
      drop();
      await moveTo(IDLE, 520, "idle");
    } else {
      sim.current.carry = null;
      sim.current.forward = 0;
    }
    if (!gone.current) setBusy(false);
  };

  const prepare = (dir) => {
    if (busy) return;
    if (dir === 0) moveTo(IDLE, 460, "idle");
    else moveTo({ heading: (360 / count) * dir * 0.42, r: 1.0, h: 1.38, grip: 0 }, 440, dir > 0 ? "readyRight" : "readyLeft");
  };

  const offsetOf = (i) => {
    let d = mod(i - index, count);
    if (d > count / 2) d -= count;
    return d;
  };

  return (
    <div>
      {/* The stage keeps its full height — the camera, ring and card positions
          are all fitted against it — and the empty band above the arm is
          cropped by this box. */}
      <div className="relative overflow-hidden" style={{ height: layout.stage - layout.trim }}>
      <div
        ref={stage}
        className="relative isolate mx-auto w-full"
        style={{ height: layout.stage, marginTop: -layout.trim }}
      >
        <div className="pointer-events-none absolute inset-0 z-10" aria-hidden>
          <ArmEngine camera={layout.camera} onEngine={onEngine} />
        </div>

        {projects.map((project, i) => {
          const offset = offsetOf(i);
          const reachable = Math.abs(offset) <= 1;
          return (
            <div
              key={project.name}
              ref={(el) => (cards.current[i] = el)}
              data-card-index={i}
              className="absolute left-0 top-0 will-change-transform"
              style={{ width: layout.card, transformOrigin: "50% 0" }}
            >
              <button
                type="button"
                onClick={() => pick(i)}
                // The cards either side of the front one get the arrows' hover:
                // the arm turns toward the card and opens its gripper, ready.
                onPointerEnter={() => reachable && offset !== 0 && prepare(offset)}
                onPointerLeave={() => reachable && offset !== 0 && prepare(0)}
                onFocus={() => reachable && offset !== 0 && prepare(offset)}
                onBlur={() => reachable && offset !== 0 && prepare(0)}
                disabled={busy || !reachable}
                aria-hidden={!reachable}
                tabIndex={reachable ? 0 : -1}
                className="group block w-full cursor-pointer text-left focus:outline-none focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-accent disabled:cursor-default"
              >
                <ProjectCard
                  project={project}
                  index={i}
                  count={count}
                  accent={accent}
                  // No room for the hint line on a phone, where tapping the
                  // front card is obvious enough.
                  hint={offset === 0 && !busy && !small}
                  // A phone has no room for every point at full length.
                  points={small ? 2 : project.points.length}
                  clamp={small ? 2 : 0}
                />
              </button>
            </div>
          );
        })}
      </div>
      </div>

      <div className="mt-4 flex items-center justify-center gap-4">
        <button
          type="button"
          onClick={() => onArrow(-1)}
          onPointerEnter={() => prepare(-1)}
          onPointerLeave={() => prepare(0)}
          onFocus={() => prepare(-1)}
          onBlur={() => prepare(0)}
          disabled={busy || count < 2}
          aria-label="Previous project"
          className="rc-arrow"
        >
          <ChevronLeft size={19} />
        </button>
        <div className="flex items-center gap-1.5" aria-hidden>
          {projects.map((p, i) => (
            <span
              key={p.name}
              className="h-1.5 rounded-full transition-all duration-500"
              style={{ width: i === index ? 22 : 6, background: i === index ? accent : "var(--line)" }}
            />
          ))}
        </div>
        <button
          type="button"
          onClick={() => onArrow(1)}
          onPointerEnter={() => prepare(1)}
          onPointerLeave={() => prepare(0)}
          onFocus={() => prepare(1)}
          onBlur={() => prepare(0)}
          disabled={busy || count < 2}
          aria-label="Next project"
          className="rc-arrow"
        >
          <ChevronRight size={19} />
        </button>
      </div>

      <ProjectDetail
        project={open}
        accent={accent}
        from={open ? cards.current[projects.indexOf(open)] : null}
        onClose={close}
      />
    </div>
  );
}
