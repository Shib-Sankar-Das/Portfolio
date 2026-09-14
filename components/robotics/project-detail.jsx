"use client";

import { useEffect, useLayoutEffect, useState } from "react";
import { createPortal } from "react-dom";
import { AnimatePresence, m } from "framer-motion";
import { ArrowUpRight, Cpu, X } from "lucide-react";

/**
 * The write-up, opening out of the card the arm just pushed forward.
 *
 * It starts as that card's own rectangle and grows into the panel, so the
 * movement the arm began carries straight through into the page rather than
 * stopping and being replaced by something else.
 */
export default function ProjectDetail({ project, accent, from, onClose }) {
  const [mounted, setMounted] = useState(false);
  const [start, setStart] = useState(null);

  useEffect(() => setMounted(true), []);

  // Measured before paint, from the card as it actually sits after the arm has
  // drawn it forward — so the panel opens from where the card really is.
  useLayoutEffect(() => {
    if (!project || !from) return setStart(null);
    const r = from.getBoundingClientRect();
    setStart({ x: r.left + r.width / 2 - window.innerWidth / 2, y: r.top + r.height / 2 - window.innerHeight / 2, w: r.width });
  }, [project, from]);

  useEffect(() => {
    if (!project) return;
    const onKey = (e) => e.key === "Escape" && onClose();
    window.addEventListener("keydown", onKey);
    const previous = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      window.removeEventListener("keydown", onKey);
      document.body.style.overflow = previous;
    };
  }, [project, onClose]);

  if (!mounted) return null;

  return createPortal(
    <AnimatePresence>
      {project && (
        <m.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.3 }}
          role="dialog"
          aria-modal="true"
          aria-label={project.name}
          className="fixed inset-0 z-[120] flex items-center justify-center bg-black/78 p-4 backdrop-blur-xl sm:p-6"
          onClick={(e) => e.target === e.currentTarget && onClose()}
        >
          <m.article
            initial={
              start
                ? { x: start.x, y: start.y, scale: Math.max(0.35, start.w / 640), opacity: 0.6 }
                : { scale: 0.94, opacity: 0 }
            }
            animate={{ x: 0, y: 0, scale: 1, opacity: 1 }}
            exit={{ scale: 0.96, opacity: 0, transition: { duration: 0.24 } }}
            transition={{ duration: 0.5, ease: [0.22, 0.72, 0.16, 1] }}
            style={{ willChange: "transform", backfaceVisibility: "hidden" }}
            className="relative max-h-full w-full max-w-2xl overflow-y-auto rounded-3xl border border-line bg-card p-7 shadow-2xl sm:p-9"
          >
            <button
              type="button"
              onClick={onClose}
              aria-label="Close"
              className="absolute right-4 top-4 flex h-9 w-9 items-center justify-center rounded-full border border-line text-muted transition-colors hover:border-rose-400 hover:text-rose-500"
            >
              <X size={16} />
            </button>

            <span
              className="mb-5 inline-flex h-11 w-11 items-center justify-center rounded-xl"
              style={{ color: accent, backgroundColor: `${accent}1f` }}
            >
              <Cpu size={21} />
            </span>

            <h2 className="pr-10 text-2xl font-bold leading-tight tracking-tight sm:text-3xl">
              {project.name}
            </h2>

            <div className="mt-5 flex flex-wrap gap-2">
              {project.stack.map((s) => (
                <span
                  key={s}
                  className="rounded-lg border border-line bg-bg-soft px-3 py-1.5 text-xs font-medium"
                >
                  {s}
                </span>
              ))}
            </div>

            <h3 className="mt-8 text-xs font-bold uppercase tracking-[0.18em]" style={{ color: accent }}>
              What it does
            </h3>
            <ul className="mt-4 space-y-3">
              {project.points.map((p) => (
                <li key={p} className="flex gap-3 text-sm leading-relaxed text-muted">
                  <span
                    className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full"
                    style={{ background: accent }}
                  />
                  {p}
                </li>
              ))}
            </ul>

            {project.github && (
              <a
                href={project.github}
                target="_blank"
                rel="noreferrer"
                className="mt-8 inline-flex items-center gap-2 rounded-full border border-line px-5 py-2.5 text-sm font-medium transition-colors hover:border-accent hover:text-accent"
              >
                View the code <ArrowUpRight size={15} />
              </a>
            )}
          </m.article>
        </m.div>
      )}
    </AnimatePresence>,
    document.body
  );
}
