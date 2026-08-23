"use client";

import { useState } from "react";
import { m } from "framer-motion";
import { ExternalLink, FileText, Layers } from "lucide-react";
import { Reveal } from "./motion";

/**
 * The documents that make up a bundled credential. One programme can award
 * several — a completion certificate, a signed certificate, an acknowledgement
 * letter — each with its own significance. Selecting a document swaps the large
 * preview; every document keeps a direct link to the original file.
 */
export default function CertificateDocuments({ items }) {
  const [active, setActive] = useState(0);
  const current = items[active];

  return (
    <Reveal className="mt-9">
      <h2 className="mb-2 flex items-center gap-2 text-sm font-bold uppercase tracking-[0.16em] text-accent">
        <Layers size={14} /> {items.length} documents in this credential
      </h2>
      <p className="mb-5 text-sm text-muted">
        This programme awarded more than one document. Each is listed below with what
        it certifies.
      </p>

      {/* Selector */}
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

      {/* Active document */}
      <m.div
        key={current.id}
        initial={{ opacity: 0, y: 14 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.35, ease: [0.21, 0.65, 0.32, 0.95] }}
        className="overflow-hidden rounded-2xl border border-line bg-card"
      >
        {current.image && (
          <div className="cert-mat border-b border-line">
            <div className="cert-glass relative aspect-[4/3] overflow-hidden rounded-sm">
              {/* Cloudinary-hosted; sized by the container. */}
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={current.image}
                alt={current.title}
                className="h-full w-full object-contain"
                loading="lazy"
              />
            </div>
          </div>
        )}

        <div className="p-6">
          <h3 className="text-lg font-bold leading-snug">{current.title}</h3>
          {current.note && (
            <p className="mt-2.5 text-sm leading-relaxed text-muted">{current.note}</p>
          )}
          {current.assetUrl && (
            <a
              href={current.assetUrl}
              target="_blank"
              rel="noreferrer"
              className="mt-5 inline-flex items-center gap-2 rounded-full border border-line px-4 py-2 text-xs font-semibold transition-colors hover:border-accent hover:text-accent"
            >
              <FileText size={13} />
              Open {current.assetFormat?.toUpperCase() || "document"}
              <ExternalLink size={12} className="opacity-60" />
            </a>
          )}
        </div>
      </m.div>

      {/* Everything at a glance */}
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
    </Reveal>
  );
}
