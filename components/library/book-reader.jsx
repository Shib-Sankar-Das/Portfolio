"use client";

import { useCallback, useEffect, useState } from "react";
import { createPortal } from "react-dom";
import { AnimatePresence, m } from "framer-motion";
import { ChevronLeft, ChevronRight, X } from "lucide-react";

/**
 * A book opened out of the shelf.
 *
 * The book is a stack of leaves hinged at the centre spine. Each leaf carries
 * one page on its front (the right-hand page) and the next on its back (the
 * left-hand page once turned), so rotating a leaf about the spine reproduces a
 * real page turn — the sheet you flip genuinely carries two pages with it.
 */
export default function BookReader({ book, onClose }) {
  const [mounted, setMounted] = useState(false);
  const [turned, setTurned] = useState(0); // how many leaves lie on the left
  useEffect(() => setMounted(true), []);

  // Leaf 0 is the cover; the rest carry two content pages each.
  const leaves = [
    { front: "cover", back: book.pages[0] ?? null },
    ...Array.from({ length: Math.ceil(Math.max(book.pages.length - 1, 0) / 2) }, (_, i) => ({
      front: book.pages[1 + i * 2] ?? null,
      back: book.pages[2 + i * 2] ?? null,
    })),
    { front: "end", back: null },
  ];

  const total = leaves.length;
  const canForward = turned < total - 1;
  const canBack = turned > 0;

  const forward = useCallback(() => setTurned((t) => Math.min(t + 1, total - 1)), [total]);
  const back = useCallback(() => setTurned((t) => Math.max(t - 1, 0)), []);

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
      aria-label={book.title}
      onClick={(e) => e.target === e.currentTarget && onClose()}
    >
      <button
        type="button"
        onClick={onClose}
        aria-label="Close book"
        className="absolute right-4 top-4 z-20 flex h-10 w-10 items-center justify-center rounded-full bg-white/10 text-white transition-colors hover:bg-rose-500"
      >
        <X size={18} />
      </button>

      {/* The book itself — slides up out of the shelf and opens. */}
      <m.div
        initial={{ y: 90, rotateX: 22, scale: 0.86, opacity: 0 }}
        animate={{ y: 0, rotateX: 0, scale: 1, opacity: 1 }}
        exit={{ y: 60, scale: 0.9, opacity: 0 }}
        transition={{ type: "spring", stiffness: 130, damping: 18 }}
        style={{ perspective: "2200px" }}
        className="relative w-full max-w-4xl"
      >
        <div
          className="relative mx-auto aspect-[3/2] w-full max-w-3xl"
          style={{ transformStyle: "preserve-3d" }}
        >
          {/* Static left half — what has already been read shows through. */}
          <div className="book-page book-page-left absolute inset-y-0 left-0 w-1/2 rounded-l-md" />
          {/* Static right half — the remaining bulk of the book. */}
          <div className="book-page book-page-right absolute inset-y-0 right-0 w-1/2 rounded-r-md" />

          {leaves.map((leaf, i) => {
            const isTurned = i < turned;
            // Unturned leaves stack toward the reader on the right; turned ones
            // stack on the left. Both need the nearest leaf on top.
            const z = isTurned ? i : total - i;
            return (
              <div
                key={i}
                className="absolute inset-y-0 right-0 w-1/2"
                style={{
                  transformStyle: "preserve-3d",
                  transformOrigin: "left center",
                  transform: `rotateY(${isTurned ? -180 : 0}deg)`,
                  transition: "transform 0.75s cubic-bezier(0.36, 0.06, 0.2, 1)",
                  zIndex: z,
                  pointerEvents: i === turned || i === turned - 1 ? "auto" : "none",
                }}
              >
                {/* Front face — the right-hand page before turning. */}
                <button
                  type="button"
                  onClick={forward}
                  disabled={!canForward}
                  className="book-page book-page-right absolute inset-0 w-full cursor-pointer rounded-r-md text-left disabled:cursor-default"
                  style={{ backfaceVisibility: "hidden" }}
                  aria-label="Next page"
                >
                  {leaf.front === "cover" ? (
                    <Cover book={book} />
                  ) : leaf.front === "end" ? (
                    <EndPaper />
                  ) : (
                    <Page page={leaf.front} side="right" number={i * 2} />
                  )}
                </button>

                {/* Back face — becomes the left-hand page once turned. */}
                <button
                  type="button"
                  onClick={back}
                  className="book-page book-page-left absolute inset-0 w-full cursor-pointer rounded-l-md text-left"
                  style={{ backfaceVisibility: "hidden", transform: "rotateY(180deg)" }}
                  aria-label="Previous page"
                >
                  {leaf.back ? (
                    <Page page={leaf.back} side="left" number={i * 2 + 1} />
                  ) : (
                    <EndPaper />
                  )}
                </button>
              </div>
            );
          })}

          {/* Spine shadow sits above the pages. */}
          <div
            className="pointer-events-none absolute inset-y-0 left-1/2 w-8 -translate-x-1/2"
            style={{
              zIndex: total + 5,
              background:
                "linear-gradient(90deg, rgba(0,0,0,0) 0%, rgba(0,0,0,0.28) 45%, rgba(0,0,0,0.28) 55%, rgba(0,0,0,0) 100%)",
            }}
            aria-hidden
          />
        </div>
      </m.div>

      {/* Controls */}
      <div className="relative z-20 mt-6 flex items-center gap-3">
        <button
          type="button"
          onClick={back}
          disabled={!canBack}
          className="flex h-10 w-10 items-center justify-center rounded-full bg-white/10 text-white transition-colors hover:bg-white/20 disabled:opacity-30"
          aria-label="Previous page"
        >
          <ChevronLeft size={18} />
        </button>
        <span className="min-w-[7rem] text-center text-xs font-medium text-white/70">
          {turned === 0
            ? "Cover"
            : turned >= total - 1
              ? "The end"
              : `Spread ${turned} of ${total - 2}`}
        </span>
        <button
          type="button"
          onClick={forward}
          disabled={!canForward}
          className="flex h-10 w-10 items-center justify-center rounded-full bg-white/10 text-white transition-colors hover:bg-white/20 disabled:opacity-30"
          aria-label="Next page"
        >
          <ChevronRight size={18} />
        </button>
      </div>
      <p className="relative z-20 mt-3 text-center text-[11px] text-white/45">
        Click the page to turn it · ← → to navigate · Esc to close
      </p>
    </m.div>,
    document.body
  );
}

function Cover({ book }) {
  return (
    <div
      className="flex h-full w-full flex-col items-center justify-center gap-3 rounded-r-md px-8 text-center"
      style={{ background: `linear-gradient(150deg, ${book.spine}, ${book.spine}dd 60%, #1c1917)` }}
    >
      <p className="text-[10px] uppercase tracking-[0.3em] text-white/60">{book.section}</p>
      <h2 className="text-2xl font-bold leading-tight text-white sm:text-3xl">{book.title}</h2>
      <div className="h-px w-16 bg-white/40" />
      <p className="text-sm text-white/80">{book.author}</p>
      <p className="text-xs text-white/50">{book.year}</p>
      <p className="mt-4 text-[10px] uppercase tracking-[0.2em] text-white/40">Click to open</p>
    </div>
  );
}

function EndPaper() {
  return (
    <div className="flex h-full w-full items-center justify-center">
      <p className="text-xs uppercase tracking-[0.28em] text-stone-400">Finis</p>
    </div>
  );
}

function Page({ page, side, number }) {
  return (
    <div className={`flex h-full w-full flex-col px-7 py-8 sm:px-10 sm:py-10 ${side === "left" ? "items-start" : ""}`}>
      <h3 className="mb-3 font-serif text-lg font-bold text-stone-900 sm:text-xl">
        {page.heading}
      </h3>
      <div className="flex-1 space-y-3 overflow-hidden">
        {page.body.map((paragraph) => (
          <p key={paragraph} className="font-serif text-[13px] leading-relaxed text-stone-700 sm:text-sm">
            {paragraph}
          </p>
        ))}
        {page.quote && (
          <blockquote className="mt-4 border-l-2 border-stone-400 pl-3 font-serif text-[13px] italic leading-relaxed text-stone-600">
            “{page.quote}”
          </blockquote>
        )}
      </div>
      <span className="mt-4 text-[10px] text-stone-400">{number}</span>
    </div>
  );
}
