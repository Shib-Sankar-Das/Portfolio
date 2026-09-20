"use client";

import { Cpu } from "lucide-react";

/**
 * One project, as it appears on the arm's ring.
 *
 * Carries the same content as the project cards on the other routes — name,
 * the whole stack, and the points — so a card reads on its own without being
 * opened. `points` caps how many are shown (a phone has less room), and
 * `clamp` cuts each point to that many lines.
 *
 * Split out from the carousel because it is drawn twice: in its slot on the
 * ring, and again on the gripper while the arm is carrying it.
 */
export default function ProjectCard({
  project,
  index,
  count,
  accent,
  hint = false,
  points = project.points.length,
  clamp = 0,
}) {
  // Tailwind needs the whole class name, so these cannot be built from `clamp`.
  const clampClass = { 2: "line-clamp-2", 3: "line-clamp-3" }[clamp];
  return (
    <article
      className="rc-card relative overflow-hidden rounded-2xl border border-line bg-card p-5"
      style={{ "--rc-accent": accent }}
    >
      <span className="rc-card-edge" aria-hidden />
      <div className="mb-3 flex items-start justify-between gap-3">
        <span
          className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg"
          style={{ color: accent, backgroundColor: `${accent}1f` }}
        >
          <Cpu size={17} />
        </span>
        <span className="font-mono text-[10px] uppercase tracking-[0.16em] text-muted">
          {String(index + 1).padStart(2, "0")} / {String(count).padStart(2, "0")}
        </span>
      </div>

      <h3 className="text-base font-bold leading-snug sm:text-lg">{project.name}</h3>

      <div className="mt-3 flex flex-wrap gap-1.5">
        {project.stack.map((s) => (
          <span
            key={s}
            className="rounded-full px-2.5 py-1 text-[11px] font-semibold"
            style={{ color: accent, backgroundColor: `${accent}1a` }}
          >
            {s}
          </span>
        ))}
      </div>

      <ul className="mt-3.5 space-y-2 border-t border-line pt-3.5">
        {project.points.slice(0, points).map((p) => (
          <li key={p} className="flex gap-2 text-xs leading-relaxed text-muted sm:text-[13px]">
            <span
              className="mt-1.5 h-1 w-1 shrink-0 rounded-full"
              style={{ background: accent }}
            />
            <span className={clampClass}>{p}</span>
          </li>
        ))}
      </ul>

      {hint && (
        <p
          className="mt-3.5 text-[11px] font-semibold uppercase tracking-[0.14em]"
          style={{ color: accent }}
        >
          Let the arm bring it forward →
        </p>
      )}
    </article>
  );
}
