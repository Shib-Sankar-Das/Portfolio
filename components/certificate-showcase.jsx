"use client";

import { useRef, useState } from "react";
import { m, useMotionValue, useSpring } from "framer-motion";
import { Expand, FileText } from "lucide-react";
import { CertificateArtwork } from "./certificate-frame";
import { useBundle } from "./bundle-context";
import DocumentViewer from "./document-viewer";

const SPRING = { stiffness: 150, damping: 18, mass: 0.6 };

/**
 * The hero frame on a certificate detail page. It tilts toward the pointer in
 * 3D, and for a bundled credential it mirrors whichever document is selected
 * in the browser on the right — with its own thumbnail strip so the reader can
 * switch from here too. Clicking opens the page viewer.
 */
export default function CertificateShowcase({ cert }) {
  const bundle = useBundle();
  const [viewerOpen, setViewerOpen] = useState(false);

  const ref = useRef(null);
  const rotateX = useSpring(useMotionValue(0), SPRING);
  const rotateY = useSpring(useMotionValue(0), SPRING);

  const items = bundle?.items ?? [];
  const isBundle = items.length > 1;
  const activeItem = isBundle ? items[bundle.active] : items[0] ?? null;

  // A bundle shows the selected document; a single certificate shows its own.
  const displayed = isBundle
    ? { ...cert, image: activeItem?.image ?? cert.image }
    : cert;

  const viewerSrc = activeItem?.image ?? cert.image;
  const viewerTitle = isBundle ? activeItem?.title ?? cert.name : cert.name;
  const viewerPages = (isBundle ? activeItem?.pageCount : cert.pageCount) ?? 1;
  const canView = Boolean(viewerSrc);

  function handleMove(e) {
    const node = ref.current;
    if (!node) return;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    const rect = node.getBoundingClientRect();
    rotateY.set(((e.clientX - rect.left) / rect.width - 0.5) * 14);
    rotateX.set(-((e.clientY - rect.top) / rect.height - 0.5) * 14);
  }

  function reset() {
    rotateX.set(0);
    rotateY.set(0);
  }

  return (
    <div>
      <div
        ref={ref}
        onPointerMove={handleMove}
        onPointerLeave={reset}
        style={{ perspective: "1200px" }}
        className="group"
      >
        <div className="cert-picture-light pointer-events-none h-10 w-full opacity-40" aria-hidden />
        <m.div
          style={{ rotateX, rotateY, transformStyle: "preserve-3d" }}
          className="cert-frame relative"
        >
          <div className="cert-mat">
            <div
              className="cert-glass relative aspect-[4/3] overflow-hidden"
              style={{ containerType: "inline-size" }}
            >
              <CertificateArtwork cert={displayed} priority />
            </div>
          </div>

          {canView && (
            <button
              type="button"
              onClick={() => setViewerOpen(true)}
              className="absolute inset-0 z-10 flex items-center justify-center rounded-md bg-black/45 opacity-0 transition-opacity focus:opacity-100 focus:outline-none group-hover:opacity-100"
              aria-label={`Open ${viewerTitle} in the document viewer`}
            >
              <span className="inline-flex items-center gap-2 rounded-full bg-white/95 px-5 py-2.5 text-sm font-semibold text-neutral-900 shadow-lg">
                <Expand size={15} /> View document
              </span>
            </button>
          )}
        </m.div>
      </div>

      {/* Thumbnail strip — switch documents without leaving the frame. */}
      {isBundle && (
        <div className="mt-5">
          <p className="mb-2.5 text-[11px] font-semibold uppercase tracking-[0.14em] text-muted">
            Showing document {bundle.active + 1} of {items.length}
          </p>
          <div className="flex flex-wrap gap-2.5">
            {items.map((item, i) => (
              <button
                key={item.id}
                type="button"
                onClick={() => bundle.setActive(i)}
                aria-pressed={i === bundle.active}
                title={item.title}
                className={`relative h-16 w-20 shrink-0 overflow-hidden rounded-lg border-2 transition-colors ${
                  i === bundle.active
                    ? "border-accent shadow-md"
                    : "border-line opacity-65 hover:opacity-100"
                }`}
              >
                {item.image ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={item.image} alt="" className="h-full w-full object-cover" />
                ) : (
                  <span className="flex h-full w-full items-center justify-center bg-bg-soft text-muted">
                    <FileText size={16} />
                  </span>
                )}
                <span className="absolute bottom-0 right-0 rounded-tl bg-black/65 px-1.5 py-0.5 text-[10px] font-bold text-white">
                  {i + 1}
                </span>
              </button>
            ))}
          </div>
        </div>
      )}

      {canView && (
        <DocumentViewer
          open={viewerOpen}
          onClose={() => setViewerOpen(false)}
          title={viewerTitle}
          mediaSrc={viewerSrc}
          pageCount={viewerPages}
        />
      )}
    </div>
  );
}
