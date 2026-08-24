"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { AnimatePresence, m } from "framer-motion";
import {
  ChevronLeft,
  ChevronRight,
  Loader2,
  Maximize2,
  Minus,
  Plus,
  RotateCcw,
  X,
} from "lucide-react";

const MIN_ZOOM = 0.6;
const MAX_ZOOM = 4;
const STEP = 0.25;

/**
 * In-page document viewer.
 *
 * Pages are fetched from /api/certificate-media, which signs an authenticated
 * Cloudinary URL server-side and streams back a rendered image. The original
 * file is never delivered, so there is nothing here to download — the reader
 * gets a zoomable, pannable view of each page instead.
 */
export default function DocumentViewer({ open, onClose, title, mediaSrc, pageCount = 1 }) {
  const [zoom, setZoom] = useState(1);
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(true);
  const [mounted, setMounted] = useState(false);
  const scrollRef = useRef(null);
  const dragRef = useRef(null);

  useEffect(() => setMounted(true), []);

  // Reset whenever a different document is opened.
  useEffect(() => {
    if (open) {
      setZoom(1);
      setPage(1);
      setLoading(true);
    }
  }, [open, mediaSrc]);

  const zoomBy = useCallback((delta) => {
    setZoom((z) => Math.min(MAX_ZOOM, Math.max(MIN_ZOOM, Math.round((z + delta) * 100) / 100)));
  }, []);

  // Keyboard: Esc closes, +/- zoom, arrows page through.
  useEffect(() => {
    if (!open) return;
    function onKey(e) {
      if (e.key === "Escape") onClose();
      else if (e.key === "+" || e.key === "=") { e.preventDefault(); zoomBy(STEP); }
      else if (e.key === "-" || e.key === "_") { e.preventDefault(); zoomBy(-STEP); }
      else if (e.key === "0") setZoom(1);
      else if (e.key === "ArrowRight") setPage((p) => Math.min(pageCount, p + 1));
      else if (e.key === "ArrowLeft") setPage((p) => Math.max(1, p - 1));
    }
    window.addEventListener("keydown", onKey);
    // Freeze the page behind the modal.
    const previous = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      window.removeEventListener("keydown", onKey);
      document.body.style.overflow = previous;
    };
  }, [open, onClose, zoomBy, pageCount]);

  // Ctrl/⌘ + wheel zooms, like a native document viewer.
  function handleWheel(e) {
    if (!e.ctrlKey && !e.metaKey) return;
    e.preventDefault();
    zoomBy(e.deltaY > 0 ? -STEP : STEP);
  }

  // Drag to pan when zoomed in.
  function startDrag(e) {
    const node = scrollRef.current;
    if (!node || zoom <= 1) return;
    dragRef.current = { x: e.clientX, y: e.clientY, left: node.scrollLeft, top: node.scrollTop };
    node.setPointerCapture?.(e.pointerId);
  }
  function onDrag(e) {
    const node = scrollRef.current;
    const start = dragRef.current;
    if (!node || !start) return;
    node.scrollLeft = start.left - (e.clientX - start.x);
    node.scrollTop = start.top - (e.clientY - start.y);
  }
  function endDrag(e) {
    dragRef.current = null;
    scrollRef.current?.releasePointerCapture?.(e.pointerId);
  }

  // Ask the proxy for a resolution that suits the zoom level. `mediaSrc`
  // already carries default p/w values, so rebuild the query rather than
  // appending — duplicate params would leave the server reading the first one.
  const width = zoom > 2 ? 2600 : zoom > 1.2 ? 2000 : 1600;
  const src = `${mediaSrc.split("?")[0]}?p=${page}&w=${width}`;

  if (!mounted) return null;

  // Rendered into <body>: the showcase frame sits inside transformed, sticky
  // ancestors, and a transformed ancestor makes `position: fixed` resolve
  // against that element instead of the viewport — which left the overlay
  // trapped inside the left column.
  return createPortal(
    <AnimatePresence>
      {open && (
        <m.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.2 }}
          className="fixed inset-0 z-[100] flex flex-col bg-black/85 backdrop-blur-sm"
          role="dialog"
          aria-modal="true"
          aria-label={title}
          onClick={(e) => e.target === e.currentTarget && onClose()}
        >
          {/* Toolbar */}
          <div className="flex flex-wrap items-center justify-between gap-3 border-b border-white/10 px-4 py-3 sm:px-6">
            <p className="min-w-0 flex-1 truncate text-sm font-semibold text-white">{title}</p>

            <div className="flex items-center gap-1.5">
              {pageCount > 1 && (
                <div className="mr-2 flex items-center gap-1 rounded-full bg-white/10 px-1 py-1">
                  <button
                    type="button"
                    onClick={() => setPage((p) => Math.max(1, p - 1))}
                    disabled={page === 1}
                    aria-label="Previous page"
                    className="flex h-7 w-7 items-center justify-center rounded-full text-white transition-colors hover:bg-white/15 disabled:opacity-35"
                  >
                    <ChevronLeft size={15} />
                  </button>
                  <span className="px-1 text-xs font-medium tabular-nums text-white">
                    {page} / {pageCount}
                  </span>
                  <button
                    type="button"
                    onClick={() => setPage((p) => Math.min(pageCount, p + 1))}
                    disabled={page === pageCount}
                    aria-label="Next page"
                    className="flex h-7 w-7 items-center justify-center rounded-full text-white transition-colors hover:bg-white/15 disabled:opacity-35"
                  >
                    <ChevronRight size={15} />
                  </button>
                </div>
              )}

              <div className="flex items-center gap-1 rounded-full bg-white/10 px-1 py-1">
                <button
                  type="button"
                  onClick={() => zoomBy(-STEP)}
                  disabled={zoom <= MIN_ZOOM}
                  aria-label="Zoom out"
                  className="flex h-7 w-7 items-center justify-center rounded-full text-white transition-colors hover:bg-white/15 disabled:opacity-35"
                >
                  <Minus size={15} />
                </button>
                <span className="w-12 text-center text-xs font-medium tabular-nums text-white">
                  {Math.round(zoom * 100)}%
                </span>
                <button
                  type="button"
                  onClick={() => zoomBy(STEP)}
                  disabled={zoom >= MAX_ZOOM}
                  aria-label="Zoom in"
                  className="flex h-7 w-7 items-center justify-center rounded-full text-white transition-colors hover:bg-white/15 disabled:opacity-35"
                >
                  <Plus size={15} />
                </button>
              </div>

              <button
                type="button"
                onClick={() => setZoom(1)}
                aria-label="Reset zoom"
                className="flex h-9 w-9 items-center justify-center rounded-full bg-white/10 text-white transition-colors hover:bg-white/15"
              >
                <RotateCcw size={15} />
              </button>
              <button
                type="button"
                onClick={() => setZoom(2)}
                aria-label="Fit width"
                className="hidden h-9 w-9 items-center justify-center rounded-full bg-white/10 text-white transition-colors hover:bg-white/15 sm:flex"
              >
                <Maximize2 size={15} />
              </button>
              <button
                type="button"
                onClick={onClose}
                aria-label="Close viewer"
                className="flex h-9 w-9 items-center justify-center rounded-full bg-white/10 text-white transition-colors hover:bg-rose-500"
              >
                <X size={16} />
              </button>
            </div>
          </div>

          {/* Page surface */}
          <div
            ref={scrollRef}
            onWheel={handleWheel}
            onPointerDown={startDrag}
            onPointerMove={onDrag}
            onPointerUp={endDrag}
            onPointerCancel={endDrag}
            className={`flex-1 overflow-auto p-4 sm:p-8 ${zoom > 1 ? "cursor-grab active:cursor-grabbing" : ""}`}
          >
            <div className="mx-auto flex min-h-full w-fit items-start justify-center">
              <div
                className="relative origin-top rounded-lg bg-white shadow-2xl transition-transform duration-200"
                style={{ transform: `scale(${zoom})` }}
              >
                {loading && (
                  <div className="absolute inset-0 flex items-center justify-center">
                    <Loader2 size={26} className="animate-spin text-neutral-400" />
                  </div>
                )}
                {/* Rendered page image — not the source document. */}
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  key={src}
                  src={src}
                  alt={`${title} — page ${page}`}
                  onLoad={() => setLoading(false)}
                  onContextMenu={(e) => e.preventDefault()}
                  draggable={false}
                  className="block max-w-[min(92vw,1100px)] select-none rounded-lg"
                />
              </div>
            </div>
          </div>

          <p className="border-t border-white/10 px-4 py-2.5 text-center text-[11px] text-white/50">
            Rendered page view · zoom with the controls, Ctrl/⌘ + scroll, or +/− · Esc to close
          </p>
        </m.div>
      )}
    </AnimatePresence>,
    document.body
  );
}
