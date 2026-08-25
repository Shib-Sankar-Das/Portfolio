"use client";

import { useCallback, useEffect, useState } from "react";
import { createPortal } from "react-dom";
import { m } from "framer-motion";
import { ChevronLeft, ChevronRight, X } from "lucide-react";

const COVER = "cover";
const BACK_COVER = "back-cover";
const FINIS = "finis";

/** How long a leaf takes to swing over; the CSS transition below matches. */
const TURN_MS = 750;

/**
 * A book lifted out of the shelf.
 *
 * The book is a stack of leaves hinged at the centre spine; each leaf carries
 * one page on its front and the next on its back, so turning a leaf really does
 * take two pages with it.
 *
 * It also opens and closes like a book: with nothing turned only the front
 * cover shows (no blank leaf beside it), and once every leaf is turned only the
 * back cover remains. The half-pages behind the leaves are therefore rendered
 * only while there is something stacked on that side.
 */
export default function BookReader({ book, onClose }) {
  const [mounted, setMounted] = useState(false);
  const [turned, setTurned] = useState(0);
  useEffect(() => setMounted(true), []);

  const pages = book.pages ?? [];
  const contentLeaves = Math.ceil(Math.max(pages.length - 1, 0) / 2);

  const leaves = [
    { front: COVER, back: pages[0] ? { page: pages[0], n: 1 } : null },
    ...Array.from({ length: contentLeaves }, (_, k) => {
      const i = k + 1;
      return {
        front: pages[2 * i - 1] ? { page: pages[2 * i - 1], n: 2 * i } : null,
        back: pages[2 * i] ? { page: pages[2 * i], n: 2 * i + 1 } : null,
      };
    }),
    { front: FINIS, back: BACK_COVER },
  ];

  const total = leaves.length;

  // `turned` flips the instant you click, but a leaf takes TURN_MS to swing
  // over. `settled` lags behind by that long, so anything that should only
  // appear once a leaf has *landed* can wait for it — otherwise a blank page
  // pops in on the far side while the cover is still turning.
  const [settled, setSettled] = useState(0);
  useEffect(() => {
    const timer = setTimeout(() => setSettled(turned), TURN_MS + 30);
    return () => clearTimeout(timer);
  }, [turned]);

  // `turned === total` means every leaf is over: the book is shut at the back.
  const canForward = turned < total;
  const canBack = turned > 0;

  // A backing half-page appears only once the leaf that fills it has landed
  // (min/max against `settled`), but vanishes immediately — the turning leaf
  // covers that side until it passes 90°, so there is never a visible gap.
  const showLeftPage = Math.min(turned, settled) > 0;
  const showRightPage = Math.max(turned, settled) < total;

  // Which leaf is mid-sweep: turning forward it is the one just flipped over,
  // turning back it is the one coming home. -1 once everything has settled.
  const turningIndex =
    turned > settled ? turned - 1 : turned < settled ? turned : -1;

  // Where the book is heading — drives the slide and the caption, so both
  // respond the moment you click.
  const atFront = turned === 0;
  const atBack = turned === total;

  // The page-block edge only belongs on a book that has finished shutting.
  const blockFront = atFront && settled === 0;
  const blockBack = atBack && settled === total;
  const isOpen = showLeftPage && showRightPage;

  const forward = useCallback(() => setTurned((t) => Math.min(t + 1, total)), [total]);
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

      <m.div
        initial={{ y: 90, rotateX: 22, scale: 0.86, opacity: 0 }}
        animate={{ y: 0, rotateX: 0, scale: 1, opacity: 1 }}
        exit={{ y: 60, scale: 0.9, opacity: 0 }}
        transition={{ type: "spring", stiffness: 130, damping: 18 }}
        style={{ perspective: "2200px" }}
        className="relative w-full max-w-4xl"
      >
        {/* A shut book sits on one half only, so slide the frame across to keep
            it centred on screen as it opens and closes. */}
        <m.div
          animate={{ x: atFront ? "-25%" : atBack ? "25%" : "0%" }}
          transition={{ duration: TURN_MS / 1000, ease: [0.36, 0.06, 0.2, 1] }}
          className="relative mx-auto aspect-[3/2] w-full max-w-3xl"
          style={{ transformStyle: "preserve-3d" }}
        >
          {/* Page block behind whichever cover is shut — gives the closed book
              visible thickness instead of looking like a flat card. */}
          {blockFront && <PageBlock side="right" />}
          {blockBack && <PageBlock side="left" />}

          {/* Half-pages exist only while leaves are stacked on that side. */}
          {showLeftPage && (
            <div className="book-page book-page-left absolute inset-y-0 left-0 w-1/2 rounded-l-md" />
          )}
          {showRightPage && (
            <div className="book-page book-page-right absolute inset-y-0 right-0 w-1/2 rounded-r-md" />
          )}

          {leaves.map((leaf, i) => {
            const isTurned = i < turned;
            // Resting order: unturned leaves stack downward on the right, turned
            // ones upward on the left. The leaf currently mid-sweep is lifted
            // above both stacks — without this its z-index would drop the
            // instant it was clicked, flashing the next page into view before
            // the rotation had even started.
            const z = i === turningIndex ? total + 20 : isTurned ? i : total - i;
            return (
              <div
                key={i}
                className="absolute inset-y-0 right-0 w-1/2"
                style={{
                  transformStyle: "preserve-3d",
                  transformOrigin: "left center",
                  transform: `rotateY(${isTurned ? -180 : 0}deg)`,
                  transition: `transform ${TURN_MS}ms cubic-bezier(0.36, 0.06, 0.2, 1)`,
                  zIndex: z,
                  pointerEvents: i === turned || i === turned - 1 ? "auto" : "none",
                }}
              >
                {/* Front face: the right-hand page, before this leaf turns. */}
                <button
                  type="button"
                  onClick={forward}
                  disabled={!canForward}
                  className="book-page book-page-right absolute inset-0 w-full cursor-pointer overflow-hidden rounded-r-md text-left disabled:cursor-default"
                  style={{ backfaceVisibility: "hidden" }}
                  aria-label={leaf.front === COVER ? "Open the book" : "Next page"}
                >
                  {leaf.front === COVER ? (
                    <Cover book={book} />
                  ) : leaf.front === FINIS ? (
                    <Finis />
                  ) : leaf.front ? (
                    <Page page={leaf.front.page} number={leaf.front.n} />
                  ) : null}
                </button>

                {/* Back face: becomes the left-hand page once turned. */}
                <button
                  type="button"
                  onClick={back}
                  className="book-page book-page-left absolute inset-0 w-full cursor-pointer overflow-hidden rounded-l-md text-left"
                  style={{ backfaceVisibility: "hidden", transform: "rotateY(180deg)" }}
                  aria-label={leaf.back === BACK_COVER ? "Reopen the book" : "Previous page"}
                >
                  {leaf.back === BACK_COVER ? (
                    <BackCover book={book} />
                  ) : leaf.back ? (
                    <Page page={leaf.back.page} number={leaf.back.n} />
                  ) : (
                    <Finis />
                  )}
                </button>
              </div>
            );
          })}

          {/* Spine shading only makes sense while the book is actually open. */}
          {isOpen && (
            <div
              className="pointer-events-none absolute inset-y-0 left-1/2 w-8 -translate-x-1/2"
              style={{
                zIndex: total + 5,
                background:
                  "linear-gradient(90deg, rgba(0,0,0,0) 0%, rgba(0,0,0,0.28) 45%, rgba(0,0,0,0.28) 55%, rgba(0,0,0,0) 100%)",
              }}
              aria-hidden
            />
          )}
        </m.div>
      </m.div>

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
        <span className="min-w-[8rem] text-center text-xs font-medium text-white/70">
          {atFront
            ? "Front cover"
            : atBack
              ? "Back cover"
              : `Spread ${turned} of ${total - 1}`}
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
        {atFront
          ? "Click the cover to open the book"
          : "Click the page to turn it · ← → to navigate · Esc to close"}
      </p>
    </m.div>,
    document.body
  );
}

/** The stacked paper edge of a shut book. */
function PageBlock({ side }) {
  const right = side === "right";
  return (
    <div
      className="pointer-events-none absolute inset-y-1 w-1/2"
      style={{
        [right ? "right" : "left"]: 0,
        transform: `translateX(${right ? "-6px" : "6px"})`,
        borderRadius: right ? "4px 2px 2px 4px" : "2px 4px 4px 2px",
        background: "repeating-linear-gradient(180deg, #efe7d6 0 2px, #d9cfba 2px 4px)",
        boxShadow: "0 10px 26px -10px rgba(0,0,0,0.7)",
      }}
      aria-hidden
    />
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

function BackCover({ book }) {
  return (
    <div
      className="flex h-full w-full flex-col items-center justify-center gap-4 rounded-l-md px-8 text-center"
      style={{ background: `linear-gradient(210deg, ${book.spine}, ${book.spine}dd 60%, #1c1917)` }}
    >
      <div className="h-px w-16 bg-white/30" />
      <p className="text-sm font-semibold text-white/85">{book.title}</p>
      <p className="text-xs text-white/60">{book.author}</p>
      <div className="h-px w-16 bg-white/30" />
      <p className="mt-3 text-[10px] uppercase tracking-[0.2em] text-white/40">
        Click to reopen
      </p>
    </div>
  );
}

function Finis() {
  return (
    <div className="flex h-full w-full items-center justify-center">
      <p className="text-xs uppercase tracking-[0.28em] text-stone-400">Finis</p>
    </div>
  );
}

function Page({ page, number }) {
  return (
    <div className="flex h-full w-full flex-col px-7 py-8 sm:px-10 sm:py-10">
      <h3 className="mb-3 font-serif text-lg font-bold text-stone-900 sm:text-xl">
        {page.heading}
      </h3>
      <div className="flex-1 space-y-3 overflow-hidden">
        {page.body.map((paragraph) => (
          <p
            key={paragraph}
            className="font-serif text-[13px] leading-relaxed text-stone-700 sm:text-sm"
          >
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
