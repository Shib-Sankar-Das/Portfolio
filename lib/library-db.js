// ---------------------------------------------------------------------------
// Library persistence: shelf sections, books and research papers. SERVER ONLY.
//
// Schema and seeding live in lib/db.js; this module is the query surface.
// Reads come first; everything below the "mutations" marker writes, and the
// portfolio project is given a copy trimmed at that line.
// ---------------------------------------------------------------------------

import { getDb } from "./db";
import { bookForReader, getBook } from "./book-db";

/** Where a paper can live. `doi` is treated as the canonical citation link. */
export const LINK_KINDS = [
  { id: "doi", label: "DOI" },
  { id: "arxiv", label: "arXiv" },
  { id: "publisher", label: "Publisher" },
  { id: "pdf", label: "PDF" },
  { id: "code", label: "Code / repo" },
  { id: "semantic-scholar", label: "Semantic Scholar" },
  { id: "researchgate", label: "ResearchGate" },
  { id: "other", label: "Other" },
];

export function linkKindLabel(kind) {
  return LINK_KINDS.find((k) => k.id === kind)?.label ?? "Link";
}

/**
 * Paper pages are served as rendered images through the app's own proxy, which
 * signs the authenticated Cloudinary URL server-side. The source PDF is never
 * delivered to a browser.
 */
export function paperPageUrl(paperId, { page = 1, width = 1400 } = {}) {
  return `/api/library-media/paper/${paperId}?p=${page}&w=${width}`;
}

function safeParse(json, fallback) {
  try {
    const v = JSON.parse(json);
    return Array.isArray(v) ? v : fallback;
  } catch {
    return fallback;
  }
}

// --------------------------------- mapping ---------------------------------

function toSection(row) {
  if (!row) return null;
  return {
    id: row.id,
    slug: row.slug,
    title: row.title,
    tagline: row.tagline,
    accent: row.accent,
    bundleTitle: row.bundle_title,
    bundleSubtitle: row.bundle_subtitle,
    position: row.position,
    published: !!row.published,
  };
}

function toBook(row) {
  if (!row) return null;
  return {
    id: row.id,
    sectionId: row.section_id,
    slug: row.slug,
    title: row.title,
    author: row.author,
    year: row.year,
    spine: row.spine_color,
    thick: !!row.thick,
    position: row.position,
    published: !!row.published,
  };
}

function toPaper(row) {
  if (!row) return null;
  return {
    id: row.id,
    sectionId: row.section_id,
    title: row.title,
    authors: row.authors,
    venue: row.venue,
    year: row.year,
    abstract: row.abstract,
    contributions: safeParse(row.contributions, []),
    assetPublicId: row.asset_public_id,
    assetFormat: row.asset_format,
    pageCount: row.page_count,
    hasScan: !!row.asset_public_id && row.page_count > 0,
    position: row.position,
    published: !!row.published,
  };
}

// ---------------------------------- reads ----------------------------------

export function listSections({ includeHidden = false } = {}) {
  const where = includeHidden ? "" : "WHERE published = 1";
  return getDb()
    .prepare(`SELECT * FROM library_sections ${where} ORDER BY position, id`)
    .all()
    .map(toSection);
}

export function getSection(id) {
  return toSection(
    getDb().prepare("SELECT * FROM library_sections WHERE id = ?").get(Number(id))
  );
}

export function sectionSlugExists(slug, exceptId = null) {
  const row = exceptId
    ? getDb()
        .prepare("SELECT id FROM library_sections WHERE slug = ? AND id != ?")
        .get(slug, Number(exceptId))
    : getDb().prepare("SELECT id FROM library_sections WHERE slug = ?").get(slug);
  return !!row;
}

export function listBooks(sectionId, { includeHidden = false } = {}) {
  const where = includeHidden ? "" : "AND published = 1";
  return getDb()
    .prepare(`SELECT * FROM library_books WHERE section_id = ? ${where} ORDER BY position, id`)
    .all(Number(sectionId))
    .map(toBook);
}

export function listBookPages(bookId) {
  return getDb()
    .prepare("SELECT * FROM library_book_pages WHERE book_id = ? ORDER BY position, id")
    .all(Number(bookId))
    .map((r) => ({ heading: r.heading, body: safeParse(r.body, []), quote: r.quote }));
}

export function listPapers(sectionId, { includeHidden = false } = {}) {
  const where = includeHidden ? "" : "AND published = 1";
  return getDb()
    .prepare(`SELECT * FROM library_papers WHERE section_id = ? ${where} ORDER BY position, id`)
    .all(Number(sectionId))
    .map(toPaper);
}

export function getPaper(id) {
  return toPaper(getDb().prepare("SELECT * FROM library_papers WHERE id = ?").get(Number(id)));
}

export function listPaperLinks(paperId) {
  return getDb()
    .prepare("SELECT * FROM library_paper_links WHERE paper_id = ? ORDER BY position, id")
    .all(Number(paperId))
    .map((r) => ({
      id: r.id,
      kind: r.kind,
      label: r.label || linkKindLabel(r.kind),
      url: r.url,
      position: r.position,
    }));
}

/**
 * The whole shelf, shaped the way the portfolio's bookshelf expects it.
 * Papers in a section are presented as one stapled bundle.
 */
export function buildShelves({ includeHidden = false } = {}) {
  return listSections({ includeHidden }).map((section) => {
    // A book is either written in the admin (text pages) or built from scanned
    // page images; `bookForReader` returns whichever shape applies.
    const books = listBooks(section.id, { includeHidden }).map((row) =>
      bookForReader(getBook(row.id))
    );

    const papers = listPapers(section.id, { includeHidden }).map((paper) => ({
      id: paper.id,
      title: paper.title,
      authors: paper.authors,
      venue: paper.venue,
      year: paper.year,
      abstract: paper.abstract,
      contributions: paper.contributions,
      pageCount: paper.pageCount,
      hasScan: paper.hasScan,
      // Page 1 drives the preview; the reader asks for the rest by number.
      media: paper.hasScan ? paperPageUrl(paper.id) : null,
      links: listPaperLinks(paper.id),
    }));

    return {
      slug: section.slug,
      title: section.title,
      tagline: section.tagline,
      accent: section.accent,
      books,
      bundles: papers.length
        ? [
            {
              id: `${section.slug}-papers`,
              title: section.bundleTitle || `${section.title} papers`,
              subtitle: section.bundleSubtitle || "Research papers",
              accent: section.accent,
              papers,
            },
          ]
        : [],
    };
  });
}

export function libraryStats() {
  const db = getDb();
  return {
    sections: db.prepare("SELECT COUNT(*) AS n FROM library_sections").get().n,
    books: db.prepare("SELECT COUNT(*) AS n FROM library_books").get().n,
    papers: db.prepare("SELECT COUNT(*) AS n FROM library_papers").get().n,
    scans: db
      .prepare("SELECT COUNT(*) AS n FROM library_papers WHERE asset_public_id IS NOT NULL")
      .get().n,
  };
}

// ---------------------------------------------------------------------------
// Writes live in the portfolio_admin project, which owns this database.
// This app is read-only. Mirror changes from portfolio_admin/lib/library-db.js.
// ---------------------------------------------------------------------------
