"use client";

import { Cpu } from "lucide-react";

/**
 * One project, as it appears on the deck.
 *
 * Split out because it is drawn twice: once in its slot, and again on the
 * hook while the arm is carrying it.
 */
export default function ProjectCard({ project, index, count, accent, hint = false, compact = false }) {
  return (
    <article
      className={`rc-card relative overflow-hidden rounded-2xl border border-line bg-card ${compact ? "p-4" : "p-6"}`}
      style={{ "--rc-accent": accent }}
    >
      <span className="rc-card-edge" aria-hidden />
      <div className={`${compact ? "mb-3" : "mb-4"} flex items-start justify-between gap-3`}>
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

      {/* Compact cards (on the arm's ring) leave the detail to the write-up. */}
      {!compact && (
      <ul className="mt-3 space-y-1.5">
        {project.points.slice(0, 2).map((p) => (
          <li key={p} className="flex gap-2 text-xs leading-relaxed text-muted">
            <span
              className="mt-1.5 h-1 w-1 shrink-0 rounded-full"
              style={{ background: accent }}
            />
            <span className="line-clamp-2">{p}</span>
          </li>
        ))}
      </ul>
      )}

      <div className={`${compact ? "mt-3 pt-3" : "mt-4 pt-4"} flex flex-wrap gap-1.5 border-t border-line`}>
        {project.stack.slice(0, 3).map((s) => (
          <span key={s} className="rounded-md bg-bg-soft px-2 py-1 text-[10px] font-medium">
            {s}
          </span>
        ))}
      </div>

      {hint && (
        <p
          className={`${compact ? "mt-3" : "mt-4"} text-[11px] font-semibold uppercase tracking-[0.14em]`}
          style={{ color: accent }}
        >
          Let the arm bring it forward →
        </p>
      )}
    </article>
  );
}
