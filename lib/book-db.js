// ---------------------------------------------------------------------------
// Books: records, page images and spine design. SERVER ONLY.
//
// Reads first; everything below the "mutations" marker writes, and the
// portfolio is given a copy trimmed at that line.
// ---------------------------------------------------------------------------

import { getDb } from "./db";
import {
  COVER_FITS,
  DEFAULT_BOOK_CM,
  RATIO_SOURCES,
  clampRatio,
  coverFitCss,
  mediaVersion,
  normaliseCrop,
  normaliseFilters,
  normaliseSpine,
  resolvePageAspect,
} from "./book-media";

function parseJson(text, fallback) {
  if (!text) return fallback;
  try {
    return JSON.parse(text) ?? fallback;
  } catch {
    return fallback;
  }
}

/**
 * Page and cover images go through the app's own signing proxy. `v` is a
 * fingerprint of the crop and filters, so an edit produces a different URL and
 * the browser fetches the new render instead of a cached one.
 */
export function bookPageUrl(pageId, { width = 1200, v = "" } = {}) {
  return `/api/library-media/page/${pageId}?w=${width}${v ? `&v=${v}` : ""}`;
}

export function bookCoverUrl(bookId, side, { width = 900, v = "" } = {}) {
  return `/api/library-media/cover/${bookId}?side=${side}&w=${width}${v ? `&v=${v}` : ""}`;
}

// --------------------------------- mapping ---------------------------------

/** One cover's stored id, size, crop and filters. */
function coverOf(row, side) {
  const publicId = row[`cover_${side}_id`];
  if (!publicId) return null;
  const width = row[`cover_${side}_w`];
  const height = row[`cover_${side}_h`];
  const crop = normaliseCrop(parseJson(row[`cover_${side}_crop`], null), width, height);
  const filters = normaliseFilters(parseJson(row[`cover_${side}_filters`], null));
  return {
    side,
    publicId,
    width,
    height,
    crop,
    filters,
    version: mediaVersion(publicId, crop, filters),
  };
}

function toBook(row) {
  if (!row) return null;
  const covers = { front: coverOf(row, "front"), back: coverOf(row, "back") };
  return {
    covers,
    id: row.id,
    sectionId: row.section_id,
    slug: row.slug,
    title: row.title,
    author: row.author,
    year: row.year,
    spineColor: row.spine_color,
    thick: !!row.thick,
    position: row.position,
    published: !!row.published,
    sourceKind: row.source_kind || "text",
    coverFrontId: row.cover_front_id,
    coverBackId: row.cover_back_id,
    // Left null until the admin actually measures the book — a book without
    // measurements keeps the shelf's default proportions rather than being
    // silently resized to a stand-in value.
    widthCm: row.width_cm ?? null,
    heightCm: row.height_cm ?? null,
    spineCm: row.spine_cm ?? null,
    spine: normaliseSpine(parseJson(row.spine_config, {})),
    // How the reading view is shaped: see resolvePageAspect().
    coverFit: row.cover_fit || "contain",
    ratioSource: row.ratio_source || "auto",
    pageRatio: row.page_ratio ?? null,
    // Likewise, only override a book's own spine colour once a spine has
    // genuinely been designed for it.
    hasSpineDesign: !!row.spine_config && row.spine_config !== "{}",
    hasCovers: !!(row.cover_front_id || row.cover_back_id),
  };
}

function toPage(row) {
  if (!row) return null;
  const crop = parseJson(row.crop, null);
  return {
    id: row.id,
    bookId: row.book_id,
    position: row.position,
    label: row.label || "",
    // Text pages keep their written content; image pages carry a scan.
    heading: row.heading,
    body: parseJson(row.body, []),
    quote: row.quote,
    imagePublicId: row.image_public_id,
    imageWidth: row.image_width,
    imageHeight: row.image_height,
    crop: normaliseCrop(crop, row.image_width, row.image_height),
    filters: normaliseFilters(parseJson(row.filters, null)),
    isImage: !!row.image_public_id,
    // Changes whenever the crop or filters change, busting any cached render.
    version: mediaVersion(
      row.image_public_id,
      normaliseCrop(crop, row.image_width, row.image_height),
      normaliseFilters(parseJson(row.filters, null))
    ),
  };
}

// ---------------------------------- reads ----------------------------------

export function getBook(id) {
  return toBook(getDb().prepare("SELECT * FROM library_books WHERE id = ?").get(Number(id)));
}

export function getBookBySlug(slug) {
  return toBook(getDb().prepare("SELECT * FROM library_books WHERE slug = ?").get(slug));
}

export function bookSlugExists(slug, exceptId = null) {
  const row = exceptId
    ? getDb().prepare("SELECT id FROM library_books WHERE slug = ? AND id != ?").get(slug, Number(exceptId))
    : getDb().prepare("SELECT id FROM library_books WHERE slug = ?").get(slug);
  return !!row;
}

export function listPages(bookId) {
  return getDb()
    .prepare("SELECT * FROM library_book_pages WHERE book_id = ? ORDER BY position, id")
    .all(Number(bookId))
    .map(toPage);
}

export function getPage(id) {
  return toPage(getDb().prepare("SELECT * FROM library_book_pages WHERE id = ?").get(Number(id)));
}

/**
 * The proportions of one page of this book, so the reading view can be the
 * shape of the real thing rather than a fixed rectangle every book is squeezed
 * into. Also returned to the admin so it can show what it worked out.
 */
export function pageAspectOf(book, pages = null) {
  const first = (pages ?? listPages(book.id)).find((p) => p.isImage);
  return resolvePageAspect({
    source: book.ratioSource,
    custom: book.pageRatio,
    cm: { widthCm: book.widthCm, heightCm: book.heightCm },
    cover: book.covers.front ?? book.covers.back,
    page: first
      ? { width: first.imageWidth, height: first.imageHeight, crop: first.crop }
      : null,
  });
}

/** Everything the reader needs for one image-based book. */
export function bookForReader(book) {
  const pages = listPages(book.id);
  const imagePages = pages.filter((p) => p.isImage);

  if (book.sourceKind === "text" || imagePages.length === 0) {
    return {
      ...bookSummary(book, pages),
      kind: "text",
      pages: pages.map((p) => ({ heading: p.heading, body: p.body, quote: p.quote })),
    };
  }

  return {
    ...bookSummary(book, pages),
    kind: "images",
    coverFront: book.covers.front
      ? bookCoverUrl(book.id, "front", { v: book.covers.front.version })
      : null,
    coverBack: book.covers.back
      ? bookCoverUrl(book.id, "back", { v: book.covers.back.version })
      : null,
    pages: imagePages.map((p) => ({
      id: p.id,
      label: p.label,
      src: bookPageUrl(p.id, { v: p.version }),
      // Displayed shape follows the crop when there is one.
      ratio: p.crop
        ? Math.round((p.crop.w / p.crop.h) * 1000) / 1000
        : p.imageWidth && p.imageHeight
          ? Math.round((p.imageWidth / p.imageHeight) * 1000) / 1000
          : null,
    })),
  };
}

function bookSummary(book, pages = null) {
  const { aspect, from } = pageAspectOf(book, pages);
  return {
    id: book.slug,
    bookId: book.id,
    title: book.title,
    author: book.author,
    year: book.year,
    spine: book.spineColor,
    spineDesign: book.hasSpineDesign ? book.spine : null,
    widthCm: book.widthCm,
    heightCm: book.heightCm,
    spineCm: book.spineCm,
    thick: book.thick,
    // One page's width ÷ height. The reader builds the whole frame from it.
    pageAspect: aspect,
    aspectFrom: from,
    coverFit: coverFitCss(book.coverFit),
  };
}
