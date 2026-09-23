"use client";

import dynamic from "next/dynamic";
import { useCallback, useEffect, useLayoutEffect, useRef, useState } from "react";
import { X } from "lucide-react";
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
//
// The cards are also handled. Knock one — click anywhere that is not a skill —
// and it swings on its cables like a hanging signboard. Click a skill and that
// card is carried forward: it lifts and grows, its drone flies toward the
// camera with it, the rest of the deck falls back, and the skill opens with its
// icon on the left and what it is on the right.
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

/** How the knocked card swings: degrees, decay and speed. */
const SWING = { amplitude: 7.5, decay: 3.4, speed: 9.2, seconds: 2.4 };

/** How far forward the held card and its drone come, and how fast. */
const FORWARD = {
  cardScale: 0.09, // added to 1
  cardLift: 14, // px
  otherScale: 0.03, // taken off 1
  otherFade: 0.55,
  droneZ: 1.7, // world units toward the camera
  tau: 0.13, // seconds; the smoothing of the whole move
};

/** Roughly how tall an open skill panel is, before it is measured. */
const PANEL_HEIGHT = 340;

const ease = (t) => 1 - Math.pow(1 - t, 3);
const clamp = (v, lo, hi) => Math.min(hi, Math.max(lo, v));

export default function DroneSkills({
  groups,
  eyebrow = "Technical Skills",
  title = "My Toolbox",
  skillIcons = {},
}) {
  const [small, setSmall] = useState(false);
  const [reduced, setReduced] = useState(false);
  const [visible, setVisible] = useState(false);
  const [flying, setFlying] = useState(false);
  /** Which skill is open: { card, skill, anchor, place } or null. */
  const [open, setOpen] = useState(null);

  const deck = useRef(null);
  const cards = useRef([]);
  const cables = useRef([]);
  const engine = useRef(null);
  // Until the flight starts, every card is parked off-stage.
  const started = useRef(Infinity);
  const motion = useRef(true);
  const look = useRef(LOOK.large);
  const previous = useRef([]);
  // Read by the frame loop, which must not be rebuilt when either changes.
  const focused = useRef(-1);
  const forward = useRef(0);
  const swings = useRef([]);
  const last = useRef(0);

  const count = groups.length;

  useEffect(() => {
    look.current = small ? LOOK.small : LOOK.large;
  }, [small]);

  useEffect(() => {
    focused.current = open ? open.card : -1;
  }, [open]);

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
    const dt = last.current ? clamp((now - last.current) / 1000, 0, 0.05) : 0.016;
    last.current = now;

    // One eased number carries the whole move forward and back.
    const target = focused.current >= 0 ? 1 : 0;
    forward.current += (target - forward.current) * (1 - Math.exp(-dt / FORWARD.tau));
    const f = forward.current < 0.001 ? 0 : forward.current;

    const drones = [];

    for (let i = 0; i < count; i++) {
      const card = cards.current[i];
      if (!card) continue;
      const cw = card.offsetWidth;
      const left = card.offsetLeft;
      const top = card.offsetTop;
      const isHeld = i === focused.current;

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

      // Knocked: a damped swing about the point the cables hold, which is why
      // the card's transform-origin is its top edge.
      const knock = swings.current[i];
      let angle = 0;
      if (knock) {
        const age = (now - knock) / 1000;
        if (age > SWING.seconds) swings.current[i] = 0;
        else {
          angle =
            SWING.amplitude * Math.exp(-SWING.decay * age) * Math.cos(SWING.speed * age);
        }
      }

      // Carried forward, or fallen back to let the held one through.
      const scale = isHeld ? 1 + FORWARD.cardScale * f : 1 - FORWARD.otherScale * f;
      if (isHeld) dy -= FORWARD.cardLift * f;

      card.style.transform =
        `translate3d(${dx.toFixed(1)}px, ${dy.toFixed(1)}px, 0)` +
        (angle ? ` perspective(900px) rotateX(${angle.toFixed(2)}deg)` : "") +
        (scale === 1 ? "" : ` scale(${scale.toFixed(4)})`);
      card.style.opacity = String(
        clamp(p * 1.6, 0, 1) * (isHeld || !f ? 1 : 1 - FORWARD.otherFade * f)
      );
      card.style.zIndex = isHeld ? "30" : "";

      const centreX = left + cw / 2 + dx;
      const cardTop = top + dy;
      const droneY = cardTop - L.cable;
      const world = toWorld(centreX, droneY);
      const was = previous.current[i] ?? centreX;
      previous.current[i] = centreX;

      // The drone flies forward with the card it is holding: moving it toward
      // the camera and pulling x and y in by the same ratio keeps it exactly
      // above the card while perspective makes it grow.
      const dz = isHeld ? FORWARD.droneZ * f : 0;
      const near = (CAMERA.distance - dz) / CAMERA.distance;

      drones.push({
        x: world.x * near,
        y: world.y * near,
        z: dz,
        scale: L.drone / pxPerUnit,
        // Banks into its drift, and noses down a little as it flies in.
        roll: clamp((centreX - was) * -0.012, -0.5, 0.5),
        pitch: clamp(k * 0.35, 0, 0.35),
        yaw: Math.sin(t * 0.5 + i) * 0.08,
      });

      // Two lines from the drone's skids to the card's top corners. The drone
      // is nearer when it is carrying, so its skids are further apart on screen.
      const pair = cables.current[i];
      if (pair) {
        const anchor = (L.drone / near) * 0.17;
        const grip = cw * 0.3 * scale;
        pair[0]?.setAttribute("x1", centreX - anchor);
        pair[0]?.setAttribute("y1", droneY + (L.drone / near) * 0.12);
        pair[0]?.setAttribute("x2", centreX - grip);
        pair[0]?.setAttribute("y2", cardTop + 2);
        pair[1]?.setAttribute("x1", centreX + anchor);
        pair[1]?.setAttribute("y1", droneY + (L.drone / near) * 0.12);
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

  // ------------------------------- handling -------------------------------

  /** Where an open panel fits around card `i`, measured rather than guessed. */
  const placeFor = useCallback((i) => {
    const box = deck.current;
    const card = cards.current[i];
    if (!box || !card) return { anchor: "centre", place: "below" };
    const centre = card.offsetLeft + card.offsetWidth / 2;
    const third = box.clientWidth / 3;
    const anchor = centre < third ? "left" : centre > box.clientWidth - third ? "right" : "centre";
    const below = box.clientHeight - (card.offsetTop + card.offsetHeight);
    return { anchor, place: below < PANEL_HEIGHT && card.offsetTop > PANEL_HEIGHT ? "above" : "below" };
  }, []);

  const openSkill = useCallback(
    (card, skill) => {
      setOpen((current) =>
        current && current.card === card && current.skill === skill
          ? null
          : { card, skill, ...placeFor(card) }
      );
    },
    [placeFor]
  );

  /** A knock on the blank part of a card sets it swinging. */
  const knock = useCallback(
    (i) => {
      if (reduced) return;
      swings.current[i] = performance.now();
    },
    [reduced]
  );

  useEffect(() => {
    if (!open) return;
    const onKey = (e) => e.key === "Escape" && setOpen(null);
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open]);

  // A resize moves the cards, so an open panel is re-placed against them.
  useEffect(() => {
    if (!open) return;
    const onResize = () => setOpen((c) => (c ? { ...c, ...placeFor(c.card) } : c));
    window.addEventListener("resize", onResize);
    return () => window.removeEventListener("resize", onResize);
  }, [open, placeFor]);

  const animated = !reduced;
  const detail = open ? skillIcons[open.skill] : null;

  return (
    <section id="skills" className="relative overflow-hidden bg-bg-soft">
      <div className="relative z-10 mx-auto w-full max-w-6xl px-4 py-20 sm:px-6 sm:py-24">
        <SectionHeading
          eyebrow={eyebrow}
          title={title}
          description="The languages, frameworks and platforms I use to take ideas from prototype to production — flown in by the fleet. Knock a card to set it swinging, or pick a skill and the fleet will bring it forward."
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
            {groups.map((g, i) => {
              const held = open?.card === i;
              return (
                <div
                  key={g.group}
                  ref={(el) => (cards.current[i] = el)}
                  data-skill-card={i}
                  onClick={(e) => {
                    // Only a knock on the card itself; a skill or the panel
                    // handles its own click.
                    if (e.target.closest("[data-skill],[data-skill-panel]")) return;
                    knock(i);
                    if (open) setOpen(null);
                  }}
                  className={`card-hover relative h-full origin-top rounded-2xl border bg-card p-6 will-change-transform ${
                    held
                      ? "border-accent shadow-[0_24px_60px_-20px_rgba(0,0,0,0.55)]"
                      : "border-line"
                  }`}
                >
                  <h3 className="mb-4 text-sm font-bold uppercase tracking-wider text-accent">
                    {g.group}
                  </h3>
                  <div className="flex flex-wrap gap-2">
                    {g.items.map((item) => {
                      const active = held && open.skill === item;
                      return (
                        <button
                          key={item}
                          type="button"
                          data-skill={item}
                          aria-pressed={active}
                          onClick={() => openSkill(i, item)}
                          className={`rounded-lg border px-3 py-1.5 text-xs font-medium transition-colors ${
                            active
                              ? "border-accent bg-accent-soft text-accent"
                              : "border-line bg-bg-soft hover:border-accent hover:text-accent"
                          }`}
                        >
                          {item}
                        </button>
                      );
                    })}
                  </div>

                  {/* The open skill. Absolutely placed, so opening one never
                      moves a single other card. */}
                  {held && (
                    <div
                      data-skill-panel
                      style={{
                        // Centre-anchored panels carry their own shift, which
                        // the opening animation has to keep — hence the custom
                        // property rather than a utility class.
                        transform: open.anchor === "centre" ? "translateX(-50%)" : undefined,
                        "--skill-shift":
                          open.anchor === "centre" ? "translateX(-50%)" : "translate(0, 0)",
                        transformOrigin: `${
                          open.anchor === "centre" ? "center" : open.anchor
                        } ${open.place === "above" ? "bottom" : "top"}`,
                      }}
                      className={`animate-skill-open absolute z-40 w-[min(34rem,calc(100vw-3rem))] rounded-2xl border border-accent/40 bg-card p-5 shadow-[0_30px_70px_-24px_rgba(0,0,0,0.65)] ${
                        open.place === "above" ? "bottom-[calc(100%+0.75rem)]" : "top-[calc(100%+0.75rem)]"
                      } ${
                        open.anchor === "left" ? "left-0" : open.anchor === "right" ? "right-0" : "left-1/2"
                      }`}
                    >
                      <button
                        type="button"
                        onClick={() => setOpen(null)}
                        aria-label={`Close ${open.skill}`}
                        className="absolute right-3 top-3 rounded-full border border-line p-1.5 text-muted transition-colors hover:border-accent hover:text-accent"
                      >
                        <X size={13} />
                      </button>

                      <div className="flex gap-5">
                        {/* Left: the icon, from the set kept in the admin. */}
                        <div className="w-24 shrink-0 text-center">
                          <span className="flex h-24 w-24 items-center justify-center rounded-2xl border border-line bg-bg-soft p-3">
                            {detail?.iconUrl ? (
                              // eslint-disable-next-line @next/next/no-img-element
                              <img
                                src={detail.iconUrl}
                                alt=""
                                className="max-h-full max-w-full object-contain"
                              />
                            ) : (
                              <span className="text-2xl font-bold text-muted">
                                {open.skill.slice(0, 2)}
                              </span>
                            )}
                          </span>
                          <p className="mt-2 text-[11px] font-semibold uppercase tracking-[0.12em] text-muted">
                            {g.group}
                          </p>
                        </div>

                        {/* Right: what it is. */}
                        <div className="min-w-0 flex-1">
                          <h4 className="pr-8 text-base font-bold tracking-tight">
                            {detail?.label || open.skill}
                          </h4>
                          {detail ? (
                            <>
                              <p className="mt-1.5 text-xs font-medium text-accent">
                                {detail.short}
                              </p>
                              <p className="mt-2 max-h-44 overflow-y-auto text-xs leading-relaxed text-muted">
                                {detail.detailed}
                              </p>
                              {detail.points.length > 0 && (
                                <ul className="mt-2.5 space-y-1 border-t border-line pt-2.5">
                                  {detail.points.slice(0, 3).map((point) => (
                                    <li
                                      key={point}
                                      className="flex gap-2 text-[11px] leading-relaxed text-muted"
                                    >
                                      <span className="mt-1.5 h-1 w-1 shrink-0 rounded-full bg-accent" />
                                      {point}
                                    </li>
                                  ))}
                                </ul>
                              )}
                            </>
                          ) : (
                            <p className="mt-2 text-xs leading-relaxed text-muted">
                              Part of my {g.group.toLowerCase()} toolkit. No write-up for this one
                              yet.
                            </p>
                          )}
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </section>
  );
}
