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
 * A signed URL for an image with an explicit transformation chain — used for
 * book pages, where a crop rectangle and tone filters are replayed at delivery
 * time rather than baked into the stored file.
 */
export function signedTransformedUrl(publicId, transformation) {
  configure();
  return cloudinary.url(publicId, {
    resource_type: "image",
    type: "authenticated",
    sign_url: true,
    secure: true,
    transformation,
  });
}

/**
 * Streams whatever a signed URL returns, with private cache headers.
 *
 * A request carrying a `v` fingerprint describes exactly one crop/tone
 * combination, so it can be cached hard — a later edit changes `v` and so
 * changes the URL. Without a fingerprint the same URL has to keep returning
 * whatever the current edit says, so it must not be cached at all; that is what
 * kept stale renders on screen after a crop was saved.
 */
export async function fetchSignedImage(publicId, transformation, { versioned = false } = {}) {
  const upstream = await fetch(signedTransformedUrl(publicId, transformation), {
    cache: "no-store",
  });
  if (!upstream.ok || !upstream.body) {
    return new Response("Image unavailable.", { status: 502 });
  }
  return new Response(upstream.body, {
    status: 200,
    headers: {
      "content-type": upstream.headers.get("content-type") ?? "image/jpeg",
      "cache-control": versioned
        ? "private, max-age=31536000, immutable"
        : "private, no-store, must-revalidate",
      "content-disposition": "inline",
      "x-content-type-options": "nosniff",
    },
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
