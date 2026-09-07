// ---------------------------------------------------------------------------
// The photo gallery. SERVER ONLY.
//
// Reads come first; everything below the "mutations" marker writes, and the
// portfolio project is given a copy trimmed at that line.
// ---------------------------------------------------------------------------

import { getDb } from "./db";
import { mediaVersion, normaliseCrop, normaliseFilters } from "./book-media";

function parseJson(text, fallback) {
  if (!text) return fallback;
  try {
    return JSON.parse(text) ?? fallback;
  } catch {
    return fallback;
  }
}

/**
 * A photograph goes through the app's own signing proxy, never a Cloudinary
 * URL. `v` fingerprints the crop and tone, so an edit changes the address and
 * the browser cannot serve the version it had before.
 */
export function photoUrl(id, { width = 1200, v = "" } = {}) {
  return `/api/gallery-media/${id}?w=${width}${v ? `&v=${v}` : ""}`;
}

/** The widths the wall offers the browser to choose between. */
export const PHOTO_WIDTHS = [400, 800, 1200, 1600, 2000];

/** A `srcset` across those widths, for one photograph. */
export function photoSrcSet(photo) {
  return PHOTO_WIDTHS.map(
    (w) => `${photoUrl(photo.id, { width: w, v: photo.version })} ${w}w`
  ).join(", ");
}

// --------------------------------- mapping ---------------------------------

/**
 * How large a frame hangs, relative to its neighbours.
 *
 * A salon hang is not a grid: some pictures are printed big and some small.
 * The default follows the photograph's own shape — a panorama needs width to
 * read at all, a small square can afford to be modest — and marking one as
 * featured promotes it to full width.
 */
function hangScale(aspect, featured) {
  if (featured) return 1;
  if (aspect >= 2) return 1; // panorama: give it the room
  if (aspect >= 1.35) return 0.92; // landscape
  if (aspect <= 0.62) return 0.82; // tall portrait, hung a little smaller
  if (aspect <= 0.85) return 0.88; // portrait
  return 0.84; // square-ish
}

function toPhoto(row) {
  if (!row) return null;

  const crop = normaliseCrop(parseJson(row.crop, null), row.width, row.height);
  const filters = normaliseFilters(parseJson(row.filters, null));

  // What is actually shown is the crop when there is one, so that — not the
  // stored file — is the shape the frame is cut to.
  const shownW = crop?.w ?? row.width ?? 0;
  const shownH = crop?.h ?? row.height ?? 0;
  const aspect = shownW && shownH ? shownW / shownH : 1.5;

  return {
    id: row.id,
    slug: row.slug,
    title: row.title,
    country: row.country ?? "",
    place: row.place ?? "",
    event: row.event ?? "",
    date: row.taken_on ?? "",
    story: row.story ?? "",
    publicId: row.public_id,
    format: row.image_format ?? "",
    width: shownW,
    height: shownH,
    // The stored file's own size, which the crop editor measures against.
    sourceWidth: row.width,
    sourceHeight: row.height,
    crop,
    filters,
    aspect: Math.round(aspect * 1000) / 1000,
    featured: !!row.featured,
    scale: hangScale(aspect, !!row.featured),
    published: !!row.published,
    version: mediaVersion(row.public_id, crop, filters),
    hasImage: !!row.public_id,
  };
}

// ---------------------------------- reads ----------------------------------

/** Newest first; photographs with no date fall to the end. */
const ORDER = `
  ORDER BY CASE WHEN taken_on = '' THEN 1 ELSE 0 END, taken_on DESC, id DESC
`;

export function listPhotos({ includeHidden = false } = {}) {
  const where = includeHidden ? "" : "WHERE published = 1 AND public_id IS NOT NULL";
  return getDb()
    .prepare(`SELECT * FROM gallery_photos ${where} ${ORDER}`)
    .all()
    .map(toPhoto);
}

export function getPhoto(id) {
  return toPhoto(
    getDb().prepare("SELECT * FROM gallery_photos WHERE id = ?").get(Number(id))
  );
}

export function getPhotoBySlug(slug) {
  return toPhoto(getDb().prepare("SELECT * FROM gallery_photos WHERE slug = ?").get(slug));
}

export function photoSlugExists(slug, exceptId = null) {
  const row = exceptId
    ? getDb()
        .prepare("SELECT id FROM gallery_photos WHERE slug = ? AND id != ?")
        .get(slug, Number(exceptId))
    : getDb().prepare("SELECT id FROM gallery_photos WHERE slug = ?").get(slug);
  return !!row;
}

/** Countries represented on the wall, most photographs first. */
export function galleryCountries(photos = listPhotos()) {
  const counts = new Map();
  for (const p of photos) {
    if (p.country) counts.set(p.country, (counts.get(p.country) ?? 0) + 1);
  }
  return [...counts.entries()]
    .map(([country, count]) => ({ country, count }))
    .sort((a, b) => b.count - a.count || a.country.localeCompare(b.country));
}

export function galleryStats() {
  const db = getDb();
  const total = db.prepare("SELECT COUNT(*) AS n FROM gallery_photos").get().n;
  const published = db
    .prepare("SELECT COUNT(*) AS n FROM gallery_photos WHERE published = 1 AND public_id IS NOT NULL")
    .get().n;
  const countries = db
    .prepare("SELECT COUNT(DISTINCT country) AS n FROM gallery_photos WHERE country != ''")
    .get().n;
  return { total, published, countries };
}

/** Everything the public wall needs, and nothing it does not. */
export function wallPhotos() {
  return listPhotos().map((p) => ({
    id: p.slug,
    src: photoUrl(p.id, { width: 1200, v: p.version }),
    srcSet: photoSrcSet(p),
    width: p.width,
    height: p.height,
    aspect: p.aspect,
    scale: p.scale,
    title: p.title,
    country: p.country,
    place: p.place,
    event: p.event,
    date: p.date,
    story: p.story,
  }));
}
