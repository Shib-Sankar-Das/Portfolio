"use client";

import { useState } from "react";
import { AnimatePresence, m } from "framer-motion";
import { Files } from "lucide-react";
import { spineBackground, spineMetrics } from "@/lib/book-media";
import BookReader from "./book-reader";
import PaperReader from "./paper-reader";

/**
 * The bookshelf.
 *
 * One plank per section, books standing spine-out and sorted so tall/thick
 * volumes anchor the row. Clicking a book lifts it out of the shelf and opens
 * it; clicking a stapled bundle opens it as loose sheets instead.
 */
export default function Bookshelf({ shelves }) {
  const [openBook, setOpenBook] = useState(null);
  const [openBundle, setOpenBundle] = useState(null);

  return (
    <div className="space-y-14">
      {shelves.map((shelf, shelfIndex) => (
        <section key={shelf.slug} id={shelf.slug} className="scroll-mt-24">
          {/* Section heading */}
          <div className="mb-4 flex flex-wrap items-baseline justify-between gap-2">
            <div>
              <h2 className="text-xl font-bold tracking-tight sm:text-2xl">
                <span
                  className="mr-2.5 inline-block h-2.5 w-2.5 rounded-full align-middle"
                  style={{ backgroundColor: shelf.accent }}
                  aria-hidden
                />
                {shelf.title}
              </h2>
              <p className="mt-1 text-sm text-muted">{shelf.tagline}</p>
            </div>
            <p className="text-[11px] uppercase tracking-[0.14em] text-muted">
              {shelf.books.length} books
              {shelf.bundles?.length
                ? ` · ${shelf.bundles.reduce((n, b) => n + b.papers.length, 0)} papers`
                : ""}
            </p>
          </div>

          {/* Shelf recess */}
          <div className="relative overflow-hidden rounded-t-xl border border-b-0 border-line">
            <div className="shelf-back absolute inset-0" aria-hidden />

            <m.ul
              initial="hidden"
              whileInView="show"
              viewport={{ once: true, margin: "-60px" }}
              variants={{ hidden: {}, show: { transition: { staggerChildren: 0.05 } } }}
              // Inner row is `w-max mx-auto`: centred when the books fit, and
              // scrolling from the left (not clipped) when they don't.
              className="relative overflow-x-auto px-4 pb-0 pt-10 sm:px-6 sm:pt-14"
            >
              <div className="mx-auto flex w-max items-end gap-2 sm:gap-2.5">
              {shelf.books.map((book) => (
                <m.li
                  key={book.id}
                  variants={{
                    hidden: { opacity: 0, y: 24 },
                    show: { opacity: 1, y: 0, transition: { duration: 0.45 } },
                  }}
                  className="shrink-0"
                >
                  <BookSpine
                    book={book}
                    section={shelf.title}
                    onOpen={() => setOpenBook({ ...book, section: shelf.title })}
                  />
                </m.li>
              ))}

              {shelf.bundles?.map((bundle) => (
                <m.li
                  key={bundle.id}
                  variants={{
                    hidden: { opacity: 0, y: 24 },
                    show: { opacity: 1, y: 0, transition: { duration: 0.45 } },
                  }}
                  className="shrink-0"
                >
                  <PaperStack bundle={bundle} onOpen={() => setOpenBundle(bundle)} />
                </m.li>
              ))}

              </div>
            </m.ul>
          </div>

          {/* The plank */}
          <div className="shelf-plank h-4 rounded-b-xl sm:h-5" aria-hidden />
          <div
            className="mx-auto h-3 w-[97%] rounded-b-lg opacity-40 blur-[3px]"
            style={{ background: "linear-gradient(180deg, rgba(0,0,0,0.5), transparent)" }}
            aria-hidden
          />
        </section>
      ))}

      <AnimatePresence>
        {openBook && <BookReader book={openBook} onClose={() => setOpenBook(null)} />}
      </AnimatePresence>
      <AnimatePresence>
        {openBundle && <PaperReader bundle={openBundle} onClose={() => setOpenBundle(null)} />}
      </AnimatePresence>
    </div>
  );
}

/**
 * One book standing on the shelf, spine facing out.
 *
 * A book measured in the admin gets its true proportions: spine thickness and
 * height come from its real centimetres, so a slim paperback and a thick
 * hardback genuinely differ. Its designed spine (solid or gradient, with the
 * title rotated or stacked) is rendered here.
 */
function BookSpine({ book, section, onOpen }) {
  const design = book.spineDesign;
  const measured = book.heightCm && book.spineCm;

  const { width, height } = measured
    ? spineMetrics({ heightCm: book.heightCm, spineCm: book.spineCm }, "sm")
    : { width: book.thick ? 54 : 40, height: book.thick ? 240 : 216 };

  const background = design
    ? spineBackground(design)
    : `linear-gradient(90deg, rgba(255,255,255,0.14) 0%, ${book.spine} 14%, ${book.spine} 68%, rgba(0,0,0,0.34) 100%)`;

  const title = design?.title ?? null;
  const text = title?.text || book.title;
  const stacked = title?.mode === "stack";

  return (
    <button
      type="button"
      onClick={onOpen}
      className="book-spine flex flex-col items-center justify-between overflow-hidden py-3 focus:outline-none focus-visible:ring-2 focus-visible:ring-accent"
      style={{ width, height, background }}
      aria-label={`Open ${book.title}${book.author ? ` by ${book.author}` : ""}`}
      title={`${book.title}${book.author ? ` — ${book.author}` : ""}`}
    >
      <span className="h-[3px] w-[62%] rounded-full bg-white/45" aria-hidden />

      <span
        className={stacked ? "flex-1 py-2 text-center leading-none" : "spine-title flex-1 py-2 leading-tight"}
        style={{
          color: title?.color ?? "rgba(255,255,255,0.95)",
          fontSize: title?.size ?? 11,
          fontWeight: 600,
          letterSpacing: stacked ? 0 : "0.02em",
          wordBreak: stacked ? "break-all" : undefined,
          overflow: "hidden",
          // A left-rotated spine reads bottom-to-top, the usual convention.
          transform: !stacked && title?.rotation === 90 ? "rotate(180deg)" : undefined,
        }}
      >
        {text}
      </span>

      <span className="flex flex-col items-center gap-1.5">
        <span className="h-[3px] w-[62%] rounded-full bg-white/45" aria-hidden />
        {book.year && (
          <span className="text-[8px] uppercase tracking-wider text-white/60">{book.year}</span>
        )}
      </span>
      <span className="sr-only">{section}</span>
    </button>
  );
}

/** A stapled bundle of papers, leaning against the books. */
function PaperStack({ bundle, onOpen }) {
  return (
    <button
      type="button"
      onClick={onOpen}
      className="group relative focus:outline-none focus-visible:ring-2 focus-visible:ring-accent"
      style={{ width: 74, height: 200 }}
      aria-label={`Open ${bundle.title} — ${bundle.papers.length} research papers`}
      title={`${bundle.title} — ${bundle.papers.length} papers`}
    >
      {/* Loose sheets fanned behind the top one */}
      <span
        className="paper-bundle absolute bottom-0 left-1 h-[96%] w-[92%] rounded-sm"
        style={{ transform: "rotate(-3.5deg)" }}
        aria-hidden
      />
      <span
        className="paper-bundle absolute bottom-0 left-0 h-[97%] w-[92%] rounded-sm"
        style={{ transform: "rotate(1.5deg)" }}
        aria-hidden
      />

      <span className="paper-bundle absolute bottom-0 left-0.5 flex h-full w-[93%] flex-col items-center rounded-sm px-1.5 pt-4">
        {/* Staple in the corner */}
        <span
          className="absolute left-[7px] top-[7px] h-[14px] w-[2.5px] rotate-45 rounded-sm bg-stone-500"
          aria-hidden
        />
        <Files size={16} className="text-stone-500" />
        <span className="spine-title mt-2 flex-1 text-[9.5px] font-semibold leading-tight text-stone-700">
          {bundle.title}
        </span>
        <span className="mb-3 rounded-full bg-stone-700 px-1.5 py-0.5 text-[8px] font-bold text-white">
          {bundle.papers.length}
        </span>
      </span>
    </button>
  );
}
