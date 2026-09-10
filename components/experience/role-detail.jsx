"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { m } from "framer-motion";
import { ArrowLeft, ArrowRight, Award, ExternalLink, Wrench } from "lucide-react";
import IdCard from "./id-card";
import { CARD_W, COLUMN_GAP, PIN_TOP, pinnedRect } from "./card-geometry";
import { ORIGIN_TTL, useFlightOrigin } from "./transition-context";

/**
 * One movement, not two. The badge travels in from where it was clicked and
 * the details arrive from the right on the same clock, with the same easing —
 * the badge given slightly longer because it has further to go.
 */
const ARRIVAL = { duration: 0.62, ease: [0.22, 0.72, 0.16, 1] };
const DETAILS = { duration: 0.55, ease: [0.22, 0.72, 0.16, 1] };

/**
 * A role, read beside its badge.
 *
 * The badge is pinned at the coordinates the wall flew it to, so arriving here
 * from a click continues a movement that has already happened rather than
 * starting a new one — and because it is fixed rather than flowed, it stays
 * put while the details scroll past it.
 *
 * Narrow screens have no room for a column beside a 288px badge, so there the
 * badge sits at the top of the page in normal flow and everything follows it.
 */
export default function RoleDetail({ job, name, newer, older, children }) {
  const origin = useFlightOrigin();

  // Read during the first render, because it decides where the badge starts.
  // A stale or foreign origin is ignored, so arriving here any other way — a
  // link, a reload, the browser's back button — simply renders in place.
  const [from] = useState(() => {
    const o = origin?.current;
    if (!o || o.slug !== job.slug || Date.now() - o.at > ORIGIN_TTL) return null;
    if (typeof window === "undefined" || window.innerWidth < 1024) return null;
    const target = pinnedRect(window.innerWidth);
    return { x: o.rect.left - target.left, y: o.rect.top - target.top };
  });

  const [arrived, setArrived] = useState(!from);
  const [settled, setSettled] = useState(false);
  const consumed = useRef(false);

  /**
   * Hold both movements for a couple of frames after this page mounts.
   *
   * Arriving here means rendering and rasterising a whole new page, and
   * starting the animation in the same breath means competing with that — it
   * cost several dropped frames right at the start of the move. Waiting costs
   * nothing visually: the badge is sitting exactly where it was on the wall,
   * so those frames look like the click simply landing.
   */
  const [go, setGo] = useState(!from);

  useEffect(() => {
    if (from) {
      const id = requestAnimationFrame(() => requestAnimationFrame(() => setGo(true)));
      return () => cancelAnimationFrame(id);
    }
  }, [from]);

  useEffect(() => {
    // Spend it: going back to the wall and returning must not replay a flight
    // that has already happened.
    if (origin && !consumed.current) {
      origin.current = null;
      consumed.current = true;
    }
  }, [origin]);

  return (
    <div className="mx-auto w-full max-w-6xl px-6">
      {/* Two real columns rather than a floating badge. The badge is sticky
          *inside* its column, so it holds its place while the details scroll
          past and is then released at the foot of them — a fixed badge has
          nothing to stop it and rides on over the contact section and the
          footer, which is exactly what it used to do. */}
      {/* Note the absence of `items-start`: the badge's column has to stretch
          to the height of the details next to it, or the sticky child has no
          room to travel and simply scrolls away with the page. */}
      <div
        className="lg:grid"
        style={{ gridTemplateColumns: `${CARD_W}px minmax(0, 1fr)`, columnGap: COLUMN_GAP }}
      >
        {/* ----------------------------- the badge -------------------------- */}
        <div className="mb-10 flex justify-center lg:mb-0 lg:block">
          <div className="sticky w-[288px]" style={{ top: PIN_TOP }}>
            {/* Travels in from where it was clicked. The transform sits on an
                inner element so the sticky wrapper itself is never transformed
                and goes on sticking normally. */}
            <m.div
              initial={from ? { x: from.x, y: from.y } : false}
              animate={go ? { x: 0, y: 0 } : { x: from.x, y: from.y }}
              transition={ARRIVAL}
              onAnimationComplete={() => setArrived(true)}
              style={
                arrived
                  ? undefined
                  : { willChange: "transform", backfaceVisibility: "hidden" }
              }
            >
              {/* Square while it is travelling, so it matches the badge that
                  was just left behind on the wall; it takes up its sway only
                  once it has landed. */}
              <IdCard job={job} name={name} swayDelay={0.9} still={!arrived} />
            </m.div>

            <m.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.3, duration: 0.4 }}
              className="mt-7 flex justify-center"
            >
              <Link
                href="/experience"
                className="group inline-flex items-center gap-2 rounded-full border border-line bg-card px-4 py-2 text-xs font-medium text-muted transition-colors hover:border-accent hover:text-accent"
              >
                <ArrowLeft
                  size={13}
                  className="transition-transform group-hover:-translate-x-1"
                />
                All work experience
              </Link>
            </m.div>
          </div>
        </div>

        {/* ----------------------------- the details ------------------------ */}
        <m.div
          // Arrives from the right on the same clock as the badge travelling
          // left — no delay, so the two read as one movement opening the page
          // rather than as a card that moves and details that follow it.
          //
          // It comes in as a single promoted layer. Staggering the cards inside
          // it meant several unpromoted subtrees animating within another
          // animating subtree, and that dropped frames right through the move.
          initial={{ opacity: 0, x: 44 }}
          animate={go ? { opacity: 1, x: 0 } : { opacity: 0, x: 44 }}
          transition={DETAILS}
          onAnimationComplete={() => setSettled(true)}
          style={
            settled ? undefined : { willChange: "transform, opacity", backfaceVisibility: "hidden" }
          }
          className="min-w-0 pb-4"
        >
          {children}

        {/* --------------------------- prev / next -------------------------- */}
          {(newer || older) && (
            <div className="mt-14 grid gap-4 border-t border-line pt-8 sm:grid-cols-2">
            {newer ? (
              <Link
                href={`/experience/${newer.slug}`}
                className="card-hover group rounded-2xl border border-line bg-card p-5"
              >
                <p className="flex items-center gap-1.5 text-[11px] uppercase tracking-[0.14em] text-muted">
                  <ArrowLeft
                    size={12}
                    className="transition-transform group-hover:-translate-x-1"
                  />
                  More recent
                </p>
                <p className="mt-2 font-semibold leading-snug">{newer.role}</p>
                <p className="mt-0.5 text-sm text-muted">{newer.company}</p>
              </Link>
            ) : (
              <span />
            )}

            {older && (
              <Link
                href={`/experience/${older.slug}`}
                className="card-hover group rounded-2xl border border-line bg-card p-5 sm:text-right"
              >
                <p className="flex items-center gap-1.5 text-[11px] uppercase tracking-[0.14em] text-muted sm:justify-end">
                  Earlier
                  <ArrowRight
                    size={12}
                    className="transition-transform group-hover:translate-x-1"
                  />
                </p>
                <p className="mt-2 font-semibold leading-snug">{older.role}</p>
                <p className="mt-0.5 text-sm text-muted">{older.company}</p>
              </Link>
            )}
            </div>
          )}
        </m.div>
      </div>
    </div>
  );
}

/**
 * The pieces of work. Not animated individually — they arrive with the column
 * that carries them, which is both smoother and more honest to the movement:
 * the details land as one thing beside the badge.
 */
export function WorkList({ items, accent }) {
  return (
    <ul className="mt-6 space-y-5">
      {items.map((item, i) => (
        <li key={item.title}>
          <article className="card-hover relative overflow-hidden rounded-2xl border border-line bg-card p-6">
            <span
              className="absolute left-6 top-0 h-0.5 w-10 rounded-b"
              style={{ background: accent }}
              aria-hidden
            />
            <div className="flex items-start gap-4">
              <span
                className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg text-xs font-bold"
                style={{ color: accent, backgroundColor: `${accent}1f` }}
              >
                {String(i + 1).padStart(2, "0")}
              </span>
              <div className="min-w-0">
                <h3 className="font-bold leading-snug">{item.title}</h3>
                <p className="mt-2 text-sm leading-relaxed text-muted">{item.detail}</p>
              </div>
            </div>
          </article>
        </li>
      ))}
    </ul>
  );
}

export function AchievementList({ items, accent }) {
  return (
    <ul className="mt-6 space-y-3">
      {items.map((a) => (
        <li
          key={a}
          className="flex items-start gap-3 rounded-2xl border border-line bg-card p-5"
        >
          <Award size={17} className="mt-0.5 shrink-0" style={{ color: accent }} />
          <p className="text-sm leading-relaxed">{a}</p>
        </li>
      ))}
    </ul>
  );
}

export function ToolList({ tools }) {
  return (
    <div className="mt-6 rounded-2xl border border-line bg-card p-6">
      <h2 className="flex items-center gap-2 text-xs font-bold uppercase tracking-[0.18em] text-accent">
        <Wrench size={13} /> Tools used
      </h2>
      <ul className="mt-4 flex flex-wrap gap-2">
        {tools.map((tool) => (
          <li key={tool} className="rounded-lg bg-bg-soft px-3 py-1.5 text-xs font-medium">
            {tool}
          </li>
        ))}
      </ul>
    </div>
  );
}

export function RoleLinks({ links }) {
  return (
    <div className="mt-8 flex flex-wrap gap-3">
      {links.map((link) => (
        <a
          key={link.url}
          href={link.url}
          target="_blank"
          rel="noreferrer"
          className="inline-flex items-center gap-2 rounded-full border border-line bg-card px-5 py-2.5 text-sm font-medium transition-colors hover:border-accent hover:text-accent"
        >
          {link.label}
          <ExternalLink size={13} />
        </a>
      ))}
    </div>
  );
}
