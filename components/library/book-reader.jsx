"use client";

import { useCallback, useEffect, useLayoutEffect, useRef, useState } from "react";
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
  const bookRef = useRef(null);
  useEffect(() => setMounted(true), []);

  const pages = book.pages ?? [];
  // A scanned book carries page images; a written one carries text pages.
  const isScanned = book.kind === "images";

  // One page's width ÷ height, worked out server-side from the book's real
  // measurements, its cover scan or its pages — whichever is known. The open
  // spread is two of those side by side.
  const pageAspect = book.pageAspect || 0.68;
  const openRatio = Math.round(pageAspect * 2 * 1000) / 1000;
  const contentLeaves = Math.ceil(Math.max(pages.length - 1, 0) / 2);

  const leaf = (page, n) => (page ? { page, n } : null);

  const leaves = [
    { front: COVER, back: leaf(pages[0], 1) },
    ...Array.from({ length: contentLeaves }, (_, k) => {
      const i = k + 1;
      return {
        front: leaf(pages[2 * i - 1], 2 * i),
        back: leaf(pages[2 * i], 2 * i + 1),
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

  const isOpen = showLeftPage && showRightPage;

  const forward = useCallback(() => setTurned((t) => Math.min(t + 1, total)), [total]);
  const back = useCallback(() => setTurned((t) => Math.max(t - 1, 0)), []);

  /**
   * Fit the type to the book — narrow screens only.
   *
   * Every page and both covers are in the DOM at once, so the fullest of each
   * can be measured and a single size chosen that makes them all fit. One size
   * per role keeps pages consistent with pages and covers with covers, rather
   * than each one picking its own scale. Desktop keeps the stylesheet defaults.
   */
  useLayoutEffect(() => {
    const root = bookRef.current;
    if (!root || !mounted) return;

    /** Shrinks `variable` until every `measure`d element fits. */
    function shrinkToFit(variable, base, min, measure) {
      let size = base;
      for (let pass = 0; pass < 16; pass++) {
        root.style.setProperty(variable, `${size}px`);
        // Reading layout here forces the reflow needed before comparing.
        const worst = measure();
        if (worst <= 1.001 || size <= min) break;
        size = Math.max(min, size * 0.94);
      }
    }

    function fit() {
      const narrow = window.matchMedia("(max-width: 639px)").matches;
      if (!narrow) {
        root.style.removeProperty("--page-font");
        root.style.removeProperty("--cover-font");
        return;
      }

      // Page bodies scroll, so compare content against their own viewport.
      shrinkToFit("--page-font", 14, 9, () => {
        let worst = 1;
        for (const body of root.querySelectorAll("[data-page-body]")) {
          if (body.clientHeight > 0) {
            worst = Math.max(worst, body.scrollHeight / body.clientHeight);
          }
        }
        return worst;
      });

      // Covers are centred and must fit outright, so compare the content block
      // against the space left inside its padded parent.
      shrinkToFit("--cover-font", 24, 11, () => {
        let worst = 1;
        for (const body of root.querySelectorAll("[data-cover-body]")) {
          const parent = body.parentElement;
          const style = getComputedStyle(parent);
          const available =
            parent.clientHeight -
            parseFloat(style.paddingTop) -
            parseFloat(style.paddingBottom);
          if (available > 0) worst = Math.max(worst, body.scrollHeight / available);
        }
        return worst;
      });
    }

    fit();
    window.addEventListener("resize", fit);
    window.addEventListener("orientationchange", fit);
    return () => {
      window.removeEventListener("resize", fit);
      window.removeEventListener("orientationchange", fit);
    };
  }, [mounted, book.id]);

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
      className="fixed inset-0 z-[110] flex flex-col items-center justify-center bg-black/80 p-3 backdrop-blur-sm sm:p-4"
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
          ref={bookRef}
          // This book's own proportions — see --book-open-ratio in globals.css.
          className="book-frame relative mx-auto"
          style={{ transformStyle: "preserve-3d", "--book-open-ratio": openRatio }}
        >
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
                    isScanned ? (
                      <ScanPage page={leaf.front.page} number={leaf.front.n} />
                    ) : (
                      <Page page={leaf.front.page} number={leaf.front.n} />
                    )
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
                    isScanned ? (
                      <ScanPage page={leaf.back.page} number={leaf.back.n} />
                    ) : (
                      <Page page={leaf.back.page} number={leaf.back.n} />
                    )
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

/**
 * A scanned page. The image is cropped and tone-corrected server-side, so it
 * arrives ready to display and simply fills its half of the spread.
 */
function ScanPage({ page, number }) {
  return (
    <div className="relative h-full w-full overflow-hidden bg-[#f7f1e3]">
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src={page.src}
        alt={page.label ? `${page.label}` : `Page ${number}`}
        className="h-full w-full select-none object-contain"
        loading={number <= 4 ? "eager" : "lazy"}
        draggable={false}
        onContextMenu={(e) => e.preventDefault()}
      />
      <span className="absolute bottom-1.5 right-2 rounded bg-white/70 px-1 text-[9px] text-stone-500">
        {number}
      </span>
    </div>
  );
}

/**
 * A cover photograph in its half of the frame.
 *
 * The frame is already built to this book's proportions, so `contain` normally
 * fills it edge to edge. When a cover is a slightly different shape from the
 * book — a scan with a border, a measurement taken from the real object — the
 * remainder is filled with a blurred enlargement of the cover itself rather
 * than a flat band, so the sliver that is left reads as depth, not as a gap.
 */
function CoverImage({ src, alt, fit, side }) {
  const round = side === "front" ? "rounded-r-md" : "rounded-l-md";
  return (
    <div className={`relative h-full w-full overflow-hidden bg-stone-900 ${round}`}>
      {fit === "contain" && (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={src}
          alt=""
          aria-hidden
          className="absolute inset-0 h-full w-full scale-110 select-none object-cover blur-xl brightness-[0.55]"
          draggable={false}
        />
      )}
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src={src}
        alt={alt}
        className="relative h-full w-full select-none"
        style={{ objectFit: fit }}
        draggable={false}
        onContextMenu={(e) => e.preventDefault()}
      />
    </div>
  );
}

function Cover({ book }) {
  // A scanned book shows its real cover photograph.
  if (book.coverFront) {
    return (
      <CoverImage
        src={book.coverFront}
        alt={`${book.title} — front cover`}
        fit={book.coverFit ?? "contain"}
        side="front"
      />
    );
  }

  return (
    <div
      className="flex h-full w-full items-center justify-center overflow-hidden rounded-r-md px-6 py-6 sm:px-8"
      style={{ background: `linear-gradient(150deg, ${book.spine}, ${book.spine}dd 60%, #1c1917)` }}
    >
      {/* Measured by the auto-fit pass: gaps are in em so they shrink with the
          type instead of squeezing a long title into a sliver. */}
      <div
        data-cover-body
        className="flex w-full flex-col items-center gap-[0.42em] text-center"
      >
        <p className="cover-meta uppercase tracking-[0.3em] text-white/60">{book.section}</p>
        <h2 className="cover-title font-bold leading-tight text-white">{book.title}</h2>
        <div className="my-[0.2em] h-px w-[3em] bg-white/40" />
        <p className="cover-author text-white/80">{book.author}</p>
        <p className="cover-year text-white/50">{book.year}</p>
        <p className="cover-meta mt-[0.8em] uppercase tracking-[0.2em] text-white/40">
          Click to open
        </p>
      </div>
    </div>
  );
}

function BackCover({ book }) {
  if (book.coverBack) {
    return (
      <CoverImage
        src={book.coverBack}
        alt={`${book.title} — back cover`}
        fit={book.coverFit ?? "contain"}
        side="back"
      />
    );
  }

  return (
    <div
      className="flex h-full w-full items-center justify-center overflow-hidden rounded-l-md px-6 py-6 sm:px-8"
      style={{ background: `linear-gradient(210deg, ${book.spine}, ${book.spine}dd 60%, #1c1917)` }}
    >
      <div
        data-cover-body
        className="flex w-full flex-col items-center gap-[0.5em] text-center"
      >
        <div className="h-px w-[3em] bg-white/30" />
        <p className="cover-author font-semibold text-white/85">{book.title}</p>
        <p className="cover-year text-white/60">{book.author}</p>
        <div className="h-px w-[3em] bg-white/30" />
        <p className="cover-meta mt-[0.6em] uppercase tracking-[0.2em] text-white/40">
          Click to reopen
        </p>
      </div>
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
    // Type scales with the viewport so a half-page barely 180px wide on a phone
    // stays readable, and the body scrolls rather than being clipped — a scroll
    // gesture doesn't fire a click, so it never turns the page by accident.
    <div className="flex h-full w-full flex-col px-4 py-4 sm:px-10 sm:py-10">
      <h3 className="page-heading mb-2 shrink-0 font-serif font-bold leading-snug text-stone-900">
        {page.heading}
      </h3>

      {/* Measured by the auto-fit pass above; scrolling is only a safety net
          for the rare page that still runs long at the minimum size. */}
      <div
        data-page-body
        className="min-h-0 flex-1 space-y-[0.7em] overflow-y-auto overscroll-contain pr-1"
      >
        {page.body.map((paragraph) => (
          <p key={paragraph} className="page-body font-serif leading-relaxed text-stone-700">
            {paragraph}
          </p>
        ))}
        {page.quote && (
          <blockquote className="page-quote mt-[1em] border-l-2 border-stone-400 pl-2.5 font-serif italic leading-relaxed text-stone-600 sm:pl-3">
            “{page.quote}”
          </blockquote>
        )}
      </div>

      <span className="mt-2 shrink-0 text-[10px] text-stone-400">{number}</span>
    </div>
  );
}
