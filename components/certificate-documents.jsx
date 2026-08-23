"use client";

import { useState } from "react";
import { m } from "framer-motion";
import { Expand, FileText, Layers, ShieldCheck } from "lucide-react";
import { Reveal } from "./motion";
import { useBundle } from "./bundle-context";
import DocumentViewer from "./document-viewer";

/**
 * The documents that make up a bundled credential, each with the significance
 * of that particular document. Selecting one drives the showcase frame on the
 * left as well (shared through BundleProvider). Documents open in the in-page
 * viewer — there is no link to the underlying file.
 */
export default function CertificateDocuments() {
  const bundle = useBundle();
  const [viewerFor, setViewerFor] = useState(null);

  if (!bundle?.isBundle) return null;

  const { items, active, setActive } = bundle;
  const current = items[active];

  return (
    <Reveal className="mt-9">
      <h2 className="mb-2 flex items-center gap-2 text-sm font-bold uppercase tracking-[0.16em] text-accent">
        <Layers size={14} /> {items.length} documents in this credential
      </h2>
      <p className="mb-5 text-sm text-muted">
        This programme awarded more than one document. Pick any to preview it in the
        frame alongside, or open it full size in the viewer.
      </p>

      <div className="mb-5 flex flex-wrap gap-2">
        {items.map((item, i) => (
          <button
            key={item.id}
            type="button"
            onClick={() => setActive(i)}
            aria-pressed={i === active}
            className={`inline-flex items-center gap-1.5 rounded-full border px-3.5 py-2 text-xs font-medium transition-colors ${
              i === active
                ? "border-transparent bg-accent text-white shadow-md"
                : "border-line bg-card text-muted hover:border-accent hover:text-accent"
            }`}
          >
            <FileText size={12} />
            {item.title}
          </button>
        ))}
      </div>

      {/* Details of the selected document */}
      <m.div
        key={current.id}
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.32, ease: [0.21, 0.65, 0.32, 0.95] }}
        className="rounded-2xl border border-line bg-card p-6"
      >
        <div className="flex items-start justify-between gap-4">
          <div className="min-w-0">
            <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-accent">
              Document {active + 1} of {items.length}
            </p>
            <h3 className="mt-1 text-lg font-bold leading-snug">{current.title}</h3>
          </div>
          {current.image && (
            <button
              type="button"
              onClick={() => setViewerFor(current)}
              className="inline-flex shrink-0 items-center gap-2 rounded-full bg-gradient-to-r from-accent to-accent-2 px-4 py-2 text-xs font-semibold text-white shadow-md transition-transform hover:scale-[1.04]"
            >
              <Expand size={13} /> Open viewer
            </button>
          )}
        </div>

        {current.note && (
          <p className="mt-3 text-sm leading-relaxed text-muted">{current.note}</p>
        )}

        {current.pageCount > 1 && (
          <p className="mt-3 text-xs text-muted">{current.pageCount} pages</p>
        )}
      </m.div>

      {/* All documents at a glance */}
      <ol className="mt-5 space-y-2.5">
        {items.map((item, i) => (
          <li key={item.id}>
            <button
              type="button"
              onClick={() => setActive(i)}
              className={`flex w-full items-start gap-3 rounded-xl border p-4 text-left transition-colors ${
                i === active ? "border-accent bg-accent-soft" : "border-line bg-card hover:border-accent"
              }`}
            >
              <span className="mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-accent text-[11px] font-bold text-white">
                {i + 1}
              </span>
              <span className="min-w-0">
                <span className="block text-sm font-semibold">{item.title}</span>
                {item.note && (
                  <span className="mt-1 block text-xs leading-relaxed text-muted">{item.note}</span>
                )}
              </span>
            </button>
          </li>
        ))}
      </ol>

      <p className="mt-4 flex items-center gap-1.5 text-[11px] text-muted">
        <ShieldCheck size={12} className="text-accent" />
        Documents are stored privately and shown as rendered pages — the source files
        are not published.
      </p>

      {viewerFor && (
        <DocumentViewer
          open
          onClose={() => setViewerFor(null)}
          title={viewerFor.title}
          mediaSrc={viewerFor.image}
          pageCount={viewerFor.pageCount ?? 1}
        />
      )}
    </Reveal>
  );
}
