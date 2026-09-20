"use client";

import dynamic from "next/dynamic";
import { useCallback, useEffect, useLayoutEffect, useRef, useState } from "react";
import { SectionHeading } from "@/components/sections";

// The fleet is loaded on its own, after the page: the skills cards are ordinary
// page content and read perfectly well without it.
const DroneFleet = dynamic(() => import("./drone-fleet"), { ssr: false });

// ---------------------------------------------------------------------------
// Drones fly the skill cards in and then hold them.
//
// The cards stay in their normal grid — that is what sets the section's height
// and keeps the text selectable — and are nudged by transform only: in from
// off-screen on arrival, then a slow hover. Each drone is placed above its own
// card by converting the card's position on screen into the world position that
// lands there, so the layout can reflow freely and the drones follow.
// ---------------------------------------------------------------------------
const CAMERA = { fov: 32, distance: 6 };

const LOOK = {
  large: { drone: 168, cable: 74, bob: 5, sway: 3 },
  small: { drone: 118, cable: 52, bob: 4, sway: 2 },
};

const FLY_MS = 1150;
const STAGGER_MS = 110;
/** If the fleet has not arrived by then, the cards settle in on their own. */
const PATIENCE_MS = 1400;

const ease = (t) => 1 - Math.pow(1 - t, 3);
const clamp = (v, lo, hi) => Math.min(hi, Math.max(lo, v));

export default function DroneSkills({ groups, eyebrow = "Technical Skills", title = "My Toolbox" }) {
  const [small, setSmall] = useState(false);
  const [reduced, setReduced] = useState(false);
  const [visible, setVisible] = useState(false);
  const [flying, setFlying] = useState(false);

  const deck = useRef(null);
  const cards = useRef([]);
  const cables = useRef([]);
  const engine = useRef(null);
  // Until the flight starts, every card is parked off-stage.
  const started = useRef(Infinity);
  const motion = useRef(true);
  const look = useRef(LOOK.large);
  const previous = useRef([]);

  const count = groups.length;

  useEffect(() => {
    look.current = small ? LOOK.small : LOOK.large;
  }, [small]);

  useEffect(() => {
    const mq = window.matchMedia("(prefers-reduced-motion: reduce)");
    const sync = () => setReduced(mq.matches);
    sync();
    mq.addEventListener("change", sync);
    return () => mq.removeEventListener("change", sync);
  }, []);

  useEffect(() => {
    motion.current = !reduced;
  }, [reduced]);

  useEffect(() => {
    const el = deck.current;
    if (!el) return;
    const ro = new ResizeObserver(([entry]) => setSmall(entry.contentRect.width < 700));
    ro.observe(el);
    // Both ways: the flight starts when the section arrives, and the frame loop
    // stops again once it leaves — nothing renders off-screen.
    const io = new IntersectionObserver(([e]) => setVisible(e.isIntersecting), {
      rootMargin: "0px 0px -10% 0px",
    });
    io.observe(el);
    return () => {
      ro.disconnect();
      io.disconnect();
    };
  }, []);

  const onEngine = useCallback((value) => {
    engine.current = value;
  }, []);

  // The flight starts once the section is in view — with or without the fleet —
  // and in any case before long, so the cards can never be left parked off-stage.
  useEffect(() => {
    if (reduced) return;
    if (visible) {
      if (!Number.isFinite(started.current)) started.current = performance.now();
      setFlying(true);
      return;
    }
    const id = setTimeout(() => {
      started.current = performance.now();
      setFlying(true);
    }, PATIENCE_MS * 4);
    return () => clearTimeout(id);
  }, [visible, reduced]);

  /** One frame: place every card, then the drone holding it. */
  const frame = useCallback((now) => {
    const box = deck.current;
    if (!box || !motion.current) return;
    const w = box.clientWidth;
    const h = box.clientHeight;
    const L = look.current;

    // Screen pixels to world units, on the plane the drones fly in.
    const halfHeight = Math.tan((CAMERA.fov * Math.PI) / 360) * CAMERA.distance;
    const pxPerUnit = h / (2 * halfHeight);
    const toWorld = (px, py) => ({
      x: (px / w - 0.5) * 2 * halfHeight * (w / h),
      y: -(py / h - 0.5) * 2 * halfHeight,
    });

    const t = now / 1000;
    const drones = [];

    for (let i = 0; i < count; i++) {
      const card = cards.current[i];
      if (!card) continue;
      const cw = card.offsetWidth;
      const left = card.offsetLeft;
      const top = card.offsetTop;

      // Arrival: in from the side it was carried from, and from above.
      const elapsed = now - started.current - i * STAGGER_MS;
      const p = clamp(elapsed / FLY_MS, 0, 1);
      const k = 1 - ease(p);
      const side = i % 2 ? 1 : -1;
      let dx = side * (w * 0.6 + cw) * k;
      let dy = -(h * 0.45) * k;

      // Held: the card sways under its drone.
      const settled = p >= 1 ? 1 : p;
      dx += Math.sin(t * 0.8 + i * 1.7) * L.sway * settled;
      dy += Math.sin(t * 1.15 + i * 0.9) * L.bob * settled;

      card.style.transform = `translate3d(${dx.toFixed(1)}px, ${dy.toFixed(1)}px, 0)`;
      card.style.opacity = String(clamp(p * 1.6, 0, 1));

      const centreX = left + cw / 2 + dx;
      const cardTop = top + dy;
      const droneY = cardTop - L.cable;
      const world = toWorld(centreX, droneY);
      const was = previous.current[i] ?? centreX;
      previous.current[i] = centreX;

      drones.push({
        ...world,
        z: 0,
        scale: L.drone / pxPerUnit,
        // Banks into its drift, and noses down a little as it flies in.
        roll: clamp((centreX - was) * -0.012, -0.5, 0.5),
        pitch: clamp(k * 0.35, 0, 0.35),
        yaw: Math.sin(t * 0.5 + i) * 0.08,
      });

      // Two lines from the drone's skids to the card's top corners.
      const pair = cables.current[i];
      if (pair) {
        const anchor = L.drone * 0.17;
        const grip = cw * 0.3;
        pair[0]?.setAttribute("x1", centreX - anchor);
        pair[0]?.setAttribute("y1", droneY + L.drone * 0.12);
        pair[0]?.setAttribute("x2", centreX - grip);
        pair[0]?.setAttribute("y2", cardTop + 2);
        pair[1]?.setAttribute("x1", centreX + anchor);
        pair[1]?.setAttribute("y1", droneY + L.drone * 0.12);
        pair[1]?.setAttribute("x2", centreX + grip);
        pair[1]?.setAttribute("y2", cardTop + 2);
      }
    }

    engine.current?.render(now, drones);
  }, [count]);

  // Park the cards off-stage before the first paint, so they fly in rather than
  // appearing and then jumping.
  useLayoutEffect(() => {
    if (reduced) {
      for (const card of cards.current) {
        if (!card) continue;
        card.style.transform = "";
        card.style.opacity = "";
      }
      return;
    }
    if (!flying) frame(performance.now());
  }, [reduced, flying, frame]);

  useEffect(() => {
    if (!flying || reduced || !visible) return;
    let raf = requestAnimationFrame(function loop(now) {
      frame(now);
      raf = requestAnimationFrame(loop);
    });
    return () => cancelAnimationFrame(raf);
  }, [flying, reduced, visible, frame]);

  const animated = !reduced;

  return (
    <section id="skills" className="relative overflow-hidden bg-bg-soft">
      <div className="relative z-10 mx-auto w-full max-w-6xl px-4 py-20 sm:px-6 sm:py-24">
        <SectionHeading
          eyebrow={eyebrow}
          title={title}
          description="The languages, frameworks and platforms I use to take ideas from prototype to production — flown in by the fleet."
        />

        <div ref={deck} className="relative">
          {/* The fleet flies over the cards. */}
          {animated && (
            <div className="pointer-events-none absolute inset-0 z-20" aria-hidden>
              <DroneFleet camera={CAMERA} count={count} onEngine={onEngine} />
            </div>
          )}
          {animated && (
            <svg className="pointer-events-none absolute inset-0 z-10 h-full w-full" aria-hidden>
              {groups.map((g, i) => (
                <g key={g.group} stroke="currentColor" className="text-muted/50" strokeWidth="1">
                  <line ref={(el) => ((cables.current[i] ??= [])[0] = el)} />
                  <line ref={(el) => ((cables.current[i] ??= [])[1] = el)} />
                </g>
              ))}
            </svg>
          )}

          {/* Airspace: every card needs room above it for the drone holding it
              — a drone is about 70px tall and hangs 74px above its card — with
              the first row's drones clear of the heading too. */}
          <div className="grid gap-5 gap-y-40 pt-36 sm:grid-cols-2 lg:grid-cols-3">
            {groups.map((g, i) => (
              <div
                key={g.group}
                ref={(el) => (cards.current[i] = el)}
                data-skill-card={i}
                className="card-hover h-full rounded-2xl border border-line bg-card p-6 will-change-transform"
              >
                <h3 className="mb-4 text-sm font-bold uppercase tracking-wider text-accent">
                  {g.group}
                </h3>
                <div className="flex flex-wrap gap-2">
                  {g.items.map((item) => (
                    <span
                      key={item}
                      className="rounded-lg border border-line bg-bg-soft px-3 py-1.5 text-xs font-medium transition-colors hover:border-accent hover:text-accent"
                    >
                      {item}
                    </span>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
