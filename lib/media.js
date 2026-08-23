// ---------------------------------------------------------------------------
// Signed delivery of certificate documents. SERVER ONLY.
//
// Documents are uploaded to Cloudinary with `type: "authenticated"`, so their
// delivery URLs return 401 unless signed with the account secret. Only the
// server can produce that signature, so the browser never receives a usable
// Cloudinary URL — it talks to /api/certificate-media, which streams back a
// rendered page image. The original PDF is never delivered.
// ---------------------------------------------------------------------------

import { v2 as cloudinary } from "cloudinary";

let configured = false;

function configure() {
  if (configured) return;
  cloudinary.config({
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
    api_key: process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET,
    secure: true,
  });
  configured = true;
}

/** Widths the proxy will render, so a caller cannot ask for arbitrary sizes. */
const ALLOWED_WIDTHS = [400, 800, 1200, 1600, 2000, 2600];

export function clampWidth(requested) {
  const width = Number(requested) || 1200;
  return ALLOWED_WIDTHS.reduce((best, w) =>
    Math.abs(w - width) < Math.abs(best - width) ? w : best
  );
}

/**
 * A signed, short-lived URL for one rendered page of a stored document.
 * `page` is 1-based; PDFs render that page, images ignore it.
 */
export function signedPageUrl(publicId, { page = 1, width = 1200, format = "jpg" } = {}) {
  configure();
  return cloudinary.url(publicId, {
    resource_type: "image",
    type: "authenticated",
    sign_url: true,
    secure: true,
    format,
    page,
    transformation: [{ width: clampWidth(width), crop: "limit", quality: "auto" }],
  });
}

/**
 * Fetches a rendered page and returns it as a streaming Response.
 * Errors are surfaced as plain statuses so the route stays thin.
 */
export async function fetchPageImage(publicId, { page, width }) {
  const url = signedPageUrl(publicId, { page, width });
  const upstream = await fetch(url, { cache: "no-store" });

  if (!upstream.ok || !upstream.body) {
    return new Response("Document page unavailable.", { status: 502 });
  }

  return new Response(upstream.body, {
    status: 200,
    headers: {
      "content-type": upstream.headers.get("content-type") ?? "image/jpeg",
      // Private: these are credential documents, not public CDN assets.
      "cache-control": "private, max-age=3600",
      "content-disposition": "inline",
      "x-content-type-options": "nosniff",
    },
  });
}
