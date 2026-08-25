"use client";

import { useCallback, useEffect, useState } from "react";
import { createPortal } from "react-dom";
import { m } from "framer-motion";
import { ChevronLeft, ChevronRight, ExternalLink, X } from "lucide-react";

/**
 * A stapled bundle of research papers.
 *
 * Not a bound book: the sheets are fastened through one staple at the top-left,
 * so a flipped sheet pivots about that corner and swings up and to the left,
 * exactly as a stapled document does. Clicking the corner (or the sheet) turns
 * the page.
 */
export default function PaperReader({ bundle, onClose }) {
  const [mounted, setMounted] = useState(false);
  const [flipped, setFlipped] = useState(0);
  useEffect(() => setMounted(true), []);

  // One title sheet, then one sheet per paper.
  const sheets = [{ kind: "title" }, ...bundle.papers.map((paper) => ({ kind: "paper", paper }))];
  const total = sheets.length;

  const forward = useCallback(() => setFlipped((f) => Math.min(f + 1, total - 1)), [total]);
  const back = useCallback(() => setFlipped((f) => Math.max(f - 1, 0)), []);

  useEffect(() => {
    function onKey(e) {
      if (e.key === "Escape") onClose();
      else if (e.key === "ArrowRight") forward();
      else if (e.key === "ArrowLeft") back();
    }
    window.addEventListener("keydown", onKey);
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      window.removeEventListener("keydown", onKey);
      document.body.style.overflow = prev;
    };
  }, [onClose, forward, back]);

  if (!mounted) return null;

  return createPortal(
    <m.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.25 }}
      className="fixed inset-0 z-[110] flex flex-col items-center justify-center bg-black/80 p-4 backdrop-blur-sm"
      role="dialog"
      aria-modal="true"
      aria-label={bundle.title}
      onClick={(e) => e.target === e.currentTarget && onClose()}
    >
      <button
        type="button"
        onClick={onClose}
        aria-label="Close bundle"
        className="absolute right-4 top-4 z-20 flex h-10 w-10 items-center justify-center rounded-full bg-white/10 text-white transition-colors hover:bg-rose-500"
      >
        <X size={18} />
      </button>

      <m.div
        initial={{ y: 80, scale: 0.88, opacity: 0, rotate: -3 }}
        animate={{ y: 0, scale: 1, opacity: 1, rotate: 0 }}
        exit={{ y: 50, scale: 0.92, opacity: 0 }}
        transition={{ type: "spring", stiffness: 140, damping: 18 }}
        style={{ perspective: "2400px" }}
        className="relative w-full max-w-2xl"
      >
        <div className="relative mx-auto aspect-[1/1.294] w-full max-w-[560px]">
          {/* Sheets still to be read sit slightly offset, giving the stack depth. */}
          <div className="absolute inset-0 translate-x-1.5 translate-y-1.5 rounded-sm bg-stone-300/70" aria-hidden />
          <div className="absolute inset-0 translate-x-1 translate-y-1 rounded-sm bg-stone-200/80" aria-hidden />

          {sheets.map((sheet, i) => {
            const isFlipped = i < flipped;
            const isCurrent = i === flipped;
            return (
              <div
                key={i}
                className="sheet absolute inset-0 origin-[14px_14px] rounded-sm shadow-xl"
                style={{
                  // Pivot about the staple in the top-left corner.
                  transform: isFlipped
                    ? "rotate(-166deg) translateZ(1px)"
                    : "rotate(0deg) translateZ(0)",
                  transition: "transform 0.72s cubic-bezier(0.36, 0.06, 0.2, 1), opacity 0.5s ease",
                  // Only the sheet just turned stays visible as it swings off
                  // the corner; earlier ones fade so the frame stays readable.
                  opacity: isFlipped ? (i === flipped - 1 ? 0.9 : 0) : 1,
                  zIndex: isFlipped ? i : total - i,
                  pointerEvents: isCurrent || i === flipped - 1 ? "auto" : "none",
                  // Flipped sheets hang behind, face-down.
                  backfaceVisibility: "hidden",
                }}
                onClick={isFlipped ? back : forward}
                role="button"
                tabIndex={isCurrent ? 0 : -1}
                onKeyDown={(e) => {
                  if (e.key === "Enter" || e.key === " ") {
                    e.preventDefault();
                    isFlipped ? back() : forward();
                  }
                }}
                aria-label={isFlipped ? "Flip back" : "Flip to next paper"}
              >
                {sheet.kind === "title" ? (
                  <TitleSheet bundle={bundle} />
                ) : (
                  <PaperSheet paper={sheet.paper} index={i} total={total - 1} />
                )}

                {/* The staple, and a corner tab inviting the flip. */}
                <span
                  className="pointer-events-none absolute left-[9px] top-[9px] h-[18px] w-[3px] rotate-45 rounded-sm bg-stone-500 shadow-sm"
                  aria-hidden
                />
                {isCurrent && (
                  <span
                    className="pointer-events-none absolute left-0 top-0 h-16 w-16 rounded-tl-sm"
                    style={{
                      background:
                        "linear-gradient(135deg, rgba(0,0,0,0.10) 0%, rgba(0,0,0,0.03) 45%, transparent 60%)",
                    }}
                    aria-hidden
                  />
                )}
              </div>
            );
          })}
        </div>
      </m.div>

      <div className="relative z-20 mt-6 flex items-center gap-3">
        <button
          type="button"
          onClick={back}
          disabled={flipped === 0}
          className="flex h-10 w-10 items-center justify-center rounded-full bg-white/10 text-white transition-colors hover:bg-white/20 disabled:opacity-30"
          aria-label="Previous sheet"
        >
          <ChevronLeft size={18} />
        </button>
        <span className="min-w-[8rem] text-center text-xs font-medium text-white/70">
          {flipped === 0 ? "Title sheet" : `Paper ${flipped} of ${total - 1}`}
        </span>
        <button
          type="button"
          onClick={forward}
          disabled={flipped >= total - 1}
          className="flex h-10 w-10 items-center justify-center rounded-full bg-white/10 text-white transition-colors hover:bg-white/20 disabled:opacity-30"
          aria-label="Next sheet"
        >
          <ChevronRight size={18} />
        </button>
      </div>
      <p className="relative z-20 mt-3 text-center text-[11px] text-white/45">
        Stapled at the corner — click a sheet to flip it over · ← → to navigate
      </p>
    </m.div>,
    document.body
  );
}

function TitleSheet({ bundle }) {
  return (
    <div className="flex h-full w-full flex-col items-center justify-center px-10 text-center">
      <p className="text-[10px] uppercase tracking-[0.3em] text-stone-500">Collected papers</p>
      <h2 className="mt-4 font-serif text-2xl font-bold text-stone-900 sm:text-3xl">
        {bundle.title}
      </h2>
      <div className="my-4 h-px w-20" style={{ backgroundColor: bundle.accent }} />
      <p className="font-serif text-sm text-stone-600">{bundle.subtitle}</p>
      <p className="mt-8 text-xs text-stone-500">{bundle.papers.length} papers</p>
      <p className="mt-10 text-[10px] uppercase tracking-[0.2em] text-stone-400">
        Flip the corner to read
      </p>
    </div>
  );
}

function PaperSheet({ paper, index, total }) {
  return (
    <div className="sheet-ruled flex h-full w-full flex-col px-8 py-9 sm:px-10">
      <p className="text-[10px] uppercase tracking-[0.2em] text-stone-500">
        {paper.venue} · {paper.year}
      </p>

      <h3 className="mt-2 font-serif text-base font-bold leading-snug text-stone-900 sm:text-lg">
        {paper.title}
      </h3>
      <p className="mt-1.5 font-serif text-[11px] italic leading-snug text-stone-600">
        {paper.authors}
      </p>

      <div className="mt-4 border-t border-stone-300 pt-3">
        <p className="text-[10px] font-bold uppercase tracking-[0.16em] text-stone-500">Abstract</p>
        <p className="mt-1.5 font-serif text-[12px] leading-relaxed text-stone-700 sm:text-[13px]">
          {paper.abstract}
        </p>
      </div>

      <div className="mt-4">
        <p className="text-[10px] font-bold uppercase tracking-[0.16em] text-stone-500">
          Key contributions
        </p>
        <ul className="mt-1.5 space-y-1.5">
          {paper.contributions.map((c) => (
            <li key={c} className="flex gap-2 font-serif text-[12px] leading-relaxed text-stone-700">
              <span className="mt-1.5 h-1 w-1 shrink-0 rounded-full bg-stone-500" />
              {c}
            </li>
          ))}
        </ul>
      </div>

      <div className="mt-auto flex items-end justify-between pt-4">
        {paper.link ? (
          <a
            href={paper.link}
            target="_blank"
            rel="noreferrer"
            onClick={(e) => e.stopPropagation()}
            className="inline-flex items-center gap-1.5 text-[11px] font-medium text-sky-700 hover:underline"
          >
            Read the paper <ExternalLink size={11} />
          </a>
        ) : (
          <span className="text-[11px] text-stone-400">No public link</span>
        )}
        <span className="text-[10px] text-stone-400">
          {index} / {total}
        </span>
      </div>
    </div>
  );
}
