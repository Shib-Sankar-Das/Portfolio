// ---------------------------------------------------------------------------
// SQLite persistence for certificates. SERVER ONLY — never import from a
// client component (it pulls in node:sqlite and node:fs).
//
// The database file lives in db/ at the project root (DATABASE_PATH in
// .env.local). On first connection the schema is created and seeded from
// lib/seed-certificates.js, so an empty checkout still renders the site.
// ---------------------------------------------------------------------------

import { DatabaseSync } from "node:sqlite";
import fs from "node:fs";
import path from "node:path";
import { seedCertificates, seedDomainMap } from "./seed-certificates";
import { shelves as seedShelves } from "./seed-library";

const SCHEMA = `
CREATE TABLE IF NOT EXISTS certificates (
  id              INTEGER PRIMARY KEY AUTOINCREMENT,
  slug            TEXT    NOT NULL UNIQUE,
  name            TEXT    NOT NULL,
  short_name      TEXT    NOT NULL,
  org             TEXT    NOT NULL,
  org_url         TEXT    NOT NULL DEFAULT '',
  org_color       TEXT    NOT NULL DEFAULT '#7C3AED',
  kind            TEXT    NOT NULL DEFAULT '',
  credential_id   TEXT    NOT NULL DEFAULT '',
  issued          TEXT    NOT NULL,
  expires         TEXT,
  renewable       INTEGER NOT NULL DEFAULT 0,
  verify_url      TEXT    NOT NULL DEFAULT '',
  summary         TEXT    NOT NULL DEFAULT '',
  description     TEXT    NOT NULL DEFAULT '',
  skills          TEXT    NOT NULL DEFAULT '[]',
  highlights      TEXT    NOT NULL DEFAULT '[]',
  asset_url       TEXT,
  asset_public_id TEXT,
  asset_format    TEXT,
  asset_kind      TEXT,
  preview_url     TEXT,
  page_count      INTEGER NOT NULL DEFAULT 1,
  published       INTEGER NOT NULL DEFAULT 1,
  created_at      TEXT    NOT NULL,
  updated_at      TEXT    NOT NULL
);

CREATE TABLE IF NOT EXISTS certificate_domains (
  certificate_id INTEGER NOT NULL,
  domain_slug    TEXT    NOT NULL,
  position       INTEGER NOT NULL DEFAULT 0,
  PRIMARY KEY (certificate_id, domain_slug),
  FOREIGN KEY (certificate_id) REFERENCES certificates(id) ON DELETE CASCADE
);

-- Some programmes award several documents at once (a completion certificate,
-- a signed certificate, an acknowledgement letter...). Those extra documents
-- live here; a certificate with 2+ rows is rendered as a "bundle".
CREATE TABLE IF NOT EXISTS certificate_items (
  id              INTEGER PRIMARY KEY AUTOINCREMENT,
  certificate_id  INTEGER NOT NULL,
  title           TEXT    NOT NULL,
  note            TEXT    NOT NULL DEFAULT '',
  asset_url       TEXT,
  asset_public_id TEXT,
  asset_format    TEXT,
  asset_kind      TEXT,
  preview_url     TEXT,
  page_count      INTEGER NOT NULL DEFAULT 1,
  position        INTEGER NOT NULL DEFAULT 0,
  created_at      TEXT    NOT NULL,
  updated_at      TEXT    NOT NULL,
  FOREIGN KEY (certificate_id) REFERENCES certificates(id) ON DELETE CASCADE
);

-- ------------------------------ the library -------------------------------
-- One shelf per section. Books and research papers both hang off a section.
CREATE TABLE IF NOT EXISTS library_sections (
  id              INTEGER PRIMARY KEY AUTOINCREMENT,
  slug            TEXT    NOT NULL UNIQUE,
  title           TEXT    NOT NULL,
  tagline         TEXT    NOT NULL DEFAULT '',
  accent          TEXT    NOT NULL DEFAULT '#7C3AED',
  bundle_title    TEXT    NOT NULL DEFAULT '',
  bundle_subtitle TEXT    NOT NULL DEFAULT '',
  position        INTEGER NOT NULL DEFAULT 0,
  published       INTEGER NOT NULL DEFAULT 1,
  created_at      TEXT    NOT NULL,
  updated_at      TEXT    NOT NULL
);

CREATE TABLE IF NOT EXISTS library_books (
  id           INTEGER PRIMARY KEY AUTOINCREMENT,
  section_id   INTEGER NOT NULL,
  slug         TEXT    NOT NULL UNIQUE,
  title        TEXT    NOT NULL,
  author       TEXT    NOT NULL DEFAULT '',
  year         TEXT    NOT NULL DEFAULT '',
  spine_color  TEXT    NOT NULL DEFAULT '#7C3AED',
  thick        INTEGER NOT NULL DEFAULT 0,
  position     INTEGER NOT NULL DEFAULT 0,
  published    INTEGER NOT NULL DEFAULT 1,
  created_at   TEXT    NOT NULL,
  updated_at   TEXT    NOT NULL,
  FOREIGN KEY (section_id) REFERENCES library_sections(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS library_book_pages (
  id         INTEGER PRIMARY KEY AUTOINCREMENT,
  book_id    INTEGER NOT NULL,
  position   INTEGER NOT NULL DEFAULT 0,
  heading    TEXT    NOT NULL DEFAULT '',
  body       TEXT    NOT NULL DEFAULT '[]',
  quote      TEXT,
  FOREIGN KEY (book_id) REFERENCES library_books(id) ON DELETE CASCADE
);

-- A research paper: the source PDF lives on Cloudinary under authenticated
-- delivery and is read as rendered page images, never as the file itself.
CREATE TABLE IF NOT EXISTS library_papers (
  id              INTEGER PRIMARY KEY AUTOINCREMENT,
  section_id      INTEGER NOT NULL,
  title           TEXT    NOT NULL,
  authors         TEXT    NOT NULL DEFAULT '',
  venue           TEXT    NOT NULL DEFAULT '',
  year            TEXT    NOT NULL DEFAULT '',
  abstract        TEXT    NOT NULL DEFAULT '',
  contributions   TEXT    NOT NULL DEFAULT '[]',
  asset_public_id TEXT,
  asset_format    TEXT,
  page_count      INTEGER NOT NULL DEFAULT 0,
  asset_width     INTEGER,
  asset_height    INTEGER,
  position        INTEGER NOT NULL DEFAULT 0,
  published       INTEGER NOT NULL DEFAULT 1,
  created_at      TEXT    NOT NULL,
  updated_at      TEXT    NOT NULL,
  FOREIGN KEY (section_id) REFERENCES library_sections(id) ON DELETE CASCADE
);

-- A paper can live in several places at once: DOI, arXiv, publisher, code…
CREATE TABLE IF NOT EXISTS library_paper_links (
  id       INTEGER PRIMARY KEY AUTOINCREMENT,
  paper_id INTEGER NOT NULL,
  kind     TEXT    NOT NULL DEFAULT 'other',
  label    TEXT    NOT NULL DEFAULT '',
  url      TEXT    NOT NULL,
  position INTEGER NOT NULL DEFAULT 0,
  FOREIGN KEY (paper_id) REFERENCES library_papers(id) ON DELETE CASCADE
);

-- ------------------------------ the gallery -------------------------------
-- One photograph on the wall. Written by portfolio_admin; read here.
CREATE TABLE IF NOT EXISTS gallery_photos (
  id           INTEGER PRIMARY KEY AUTOINCREMENT,
  slug         TEXT    NOT NULL UNIQUE,
  title        TEXT    NOT NULL,
  country      TEXT    NOT NULL DEFAULT '',
  place        TEXT    NOT NULL DEFAULT '',
  event        TEXT    NOT NULL DEFAULT '',
  taken_on     TEXT    NOT NULL DEFAULT '',
  story        TEXT    NOT NULL DEFAULT '',
  public_id    TEXT,
  image_format TEXT    NOT NULL DEFAULT '',
  width        INTEGER,
  height       INTEGER,
  crop         TEXT,
  filters      TEXT,
  featured     INTEGER NOT NULL DEFAULT 0,
  published    INTEGER NOT NULL DEFAULT 1,
  created_at   TEXT    NOT NULL,
  updated_at   TEXT    NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_gallery_taken ON gallery_photos(taken_on DESC);
CREATE INDEX IF NOT EXISTS idx_cert_issued ON certificates(issued DESC);
CREATE INDEX IF NOT EXISTS idx_cert_domain ON certificate_domains(domain_slug);
CREATE INDEX IF NOT EXISTS idx_cert_items ON certificate_items(certificate_id, position);
CREATE INDEX IF NOT EXISTS idx_lib_books ON library_books(section_id, position);
CREATE INDEX IF NOT EXISTS idx_lib_pages ON library_book_pages(book_id, position);
CREATE INDEX IF NOT EXISTS idx_lib_papers ON library_papers(section_id, position);
CREATE INDEX IF NOT EXISTS idx_lib_links ON library_paper_links(paper_id, position);
`;

// Reuse one handle across dev hot reloads.
const globalForDb = globalThis;

/**
 * Absolute path of the SQLite file. Relative DATABASE_PATH values resolve from
 * this project's root, so `../db/portfolio.db` points at the folder shared
 * with the portfolio app.
 */
export function databaseFile() {
  const relative = process.env.DATABASE_PATH || "../db/portfolio.db";
  // The path comes from the environment, so the bundler can't trace it —
  // that is intentional.
  return path.isAbsolute(relative)
    ? relative
    : path.resolve(/* turbopackIgnore: true */ process.cwd(), relative);
}

function connect() {
  const file = databaseFile();
  fs.mkdirSync(path.dirname(file), { recursive: true });

  const db = new DatabaseSync(file);
  db.exec("PRAGMA journal_mode = WAL");
  db.exec("PRAGMA foreign_keys = ON");
  db.exec(SCHEMA);
  migrate(db);
  seedIfEmpty(db);
  seedLibraryIfEmpty(db);
  return db;
}

/** Additive migrations for databases created by an earlier version. */
function migrate(db) {
  const addColumn = (table, column, definition) => {
    const exists = db
      .prepare(`SELECT COUNT(*) AS n FROM pragma_table_info(?) WHERE name = ?`)
      .get(table, column).n;
    if (!exists) db.exec(`ALTER TABLE ${table} ADD COLUMN ${column} ${definition}`);
  };

  // How many pages the stored document has — the viewer renders one image per
  // page, so it needs the count up front.
  addColumn("certificates", "page_count", "INTEGER NOT NULL DEFAULT 1");
  addColumn("certificate_items", "page_count", "INTEGER NOT NULL DEFAULT 1");

  // Page dimensions, so a portrait letter can be shown at its own aspect ratio
  // instead of being cropped into a landscape frame.
  for (const table of ["certificates", "certificate_items"]) {
    addColumn(table, "asset_width", "INTEGER");
    addColumn(table, "asset_height", "INTEGER");
  }
}

/** Aspect ratio of a stored page, or null when the size is unknown. */
function aspectRatio(width, height) {
  if (!width || !height) return null;
  return Math.round((width / height) * 1000) / 1000;
}

export function getDb() {
  if (!globalForDb.__portfolioDb) globalForDb.__portfolioDb = connect();
  return globalForDb.__portfolioDb;
}

function seedIfEmpty(db) {
  const { count } = db.prepare("SELECT COUNT(*) AS count FROM certificates").get();
  if (count > 0) return;

  const now = new Date().toISOString();
  const insert = db.prepare(`
    INSERT INTO certificates
      (slug, name, short_name, org, org_url, org_color, kind, credential_id,
       issued, expires, renewable, verify_url, summary, description, skills,
       highlights, created_at, updated_at)
    VALUES
      (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `);
  const linkDomain = db.prepare(
    "INSERT OR IGNORE INTO certificate_domains (certificate_id, domain_slug, position) VALUES (?, ?, ?)"
  );

  for (const c of seedCertificates) {
    const { lastInsertRowid } = insert.run(
      c.slug, c.name, c.shortName, c.org, c.orgUrl, c.orgColor, c.kind,
      c.credentialId ?? "", c.issued, c.expires ?? null, c.renewable ? 1 : 0,
      c.verifyUrl ?? "", c.summary, c.description,
      JSON.stringify(c.skills), JSON.stringify(c.highlights), now, now
    );

    for (const [domainSlug, slugs] of Object.entries(seedDomainMap)) {
      const position = slugs.indexOf(c.slug);
      if (position !== -1) linkDomain.run(lastInsertRowid, domainSlug, position);
    }
  }
}

/**
 * Seeds the library from lib/seed-library.js the first time, so a fresh
 * checkout has a populated shelf. After that the database is the source of
 * truth and everything is edited through the admin panel.
 */
function seedLibraryIfEmpty(db) {
  const { count } = db.prepare("SELECT COUNT(*) AS count FROM library_sections").get();
  if (count > 0) return;

  const now = new Date().toISOString();
  const insertSection = db.prepare(`
    INSERT INTO library_sections
      (slug, title, tagline, accent, bundle_title, bundle_subtitle, position, created_at, updated_at)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
  `);
  const insertBook = db.prepare(`
    INSERT INTO library_books
      (section_id, slug, title, author, year, spine_color, thick, position, created_at, updated_at)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `);
  const insertPage = db.prepare(`
    INSERT INTO library_book_pages (book_id, position, heading, body, quote)
    VALUES (?, ?, ?, ?, ?)
  `);
  const insertPaper = db.prepare(`
    INSERT INTO library_papers
      (section_id, title, authors, venue, year, abstract, contributions, position, created_at, updated_at)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `);
  const insertLink = db.prepare(`
    INSERT INTO library_paper_links (paper_id, kind, label, url, position) VALUES (?, ?, ?, ?, ?)
  `);

  seedShelves.forEach((shelf, si) => {
    const bundle = shelf.bundles?.[0];
    const { lastInsertRowid: sectionId } = insertSection.run(
      shelf.slug, shelf.title, shelf.tagline, shelf.accent,
      bundle?.title ?? "", bundle?.subtitle ?? "", si, now, now
    );

    shelf.books.forEach((book, bi) => {
      const { lastInsertRowid: bookId } = insertBook.run(
        Number(sectionId), book.id, book.title, book.author, String(book.year),
        book.spine, book.thick ? 1 : 0, bi, now, now
      );
      book.pages.forEach((page, pi) =>
        insertPage.run(Number(bookId), pi, page.heading, JSON.stringify(page.body), page.quote ?? null)
      );
    });

    (bundle?.papers ?? []).forEach((paper, pi) => {
      const { lastInsertRowid: paperId } = insertPaper.run(
        Number(sectionId), paper.title, paper.authors, paper.venue, String(paper.year),
        paper.abstract, JSON.stringify(paper.contributions), pi, now, now
      );
      if (paper.link) {
        const kind = paper.link.includes("arxiv.org") ? "arxiv" : "publisher";
        insertLink.run(Number(paperId), kind, "", paper.link, 0);
      }
    });
  });
}

// --------------------------------- mapping ---------------------------------

function safeParse(json, fallback) {
  try {
    const parsed = JSON.parse(json);
    return Array.isArray(parsed) ? parsed : fallback;
  } catch {
    return fallback;
  }
}

/**
 * Documents are stored on Cloudinary with authenticated delivery, so their real
 * URLs return 401 without a server-generated signature. Everything the browser
 * sees points at our own /api/certificate-media proxy instead, which signs the
 * request server-side and streams back a rendered page image. The original file
 * is never exposed.
 */
export function mediaUrl(kind, id, { page = 1, width = 1200 } = {}) {
  return `/api/certificate-media/${kind}/${id}?p=${page}&w=${width}`;
}

function toItem(row) {
  const hasAsset = !!row.asset_public_id;
  return {
    id: row.id,
    certificateId: row.certificate_id,
    title: row.title,
    note: row.note,
    image: hasAsset ? mediaUrl("item", row.id) : null,
    pageCount: row.page_count ?? 1,
    aspectRatio: aspectRatio(row.asset_width, row.asset_height),
    hasAsset,
    assetUrl: row.asset_url,
    assetPublicId: row.asset_public_id,
    assetFormat: row.asset_format,
    assetKind: row.asset_kind,
    position: row.position,
  };
}

export function getCertificateItem(id) {
  const row = getDb().prepare("SELECT * FROM certificate_items WHERE id = ?").get(Number(id));
  return row ? toItem(row) : null;
}

/** The documents bundled under a certificate, in display order. */
export function listCertificateItems(certificateId) {
  return getDb()
    .prepare("SELECT * FROM certificate_items WHERE certificate_id = ? ORDER BY position, id")
    .all(Number(certificateId))
    .map(toItem);
}

/**
 * DB row -> the plain object shape the UI components expect, with any bundled
 * documents attached. `isBundle` is true when the credential awarded more than
 * one document, which the wall and detail page render differently.
 */
function toCertificate(row) {
  if (!row) return null;
  const items = listCertificateItems(row.id);
  const cover = items.find((i) => i.image)?.image ?? null;
  return {
    items,
    isBundle: items.length > 1,
    documentCount: items.length > 1 ? items.length : 1,
    coverImage: cover,
    id: row.id,
    slug: row.slug,
    name: row.name,
    shortName: row.short_name,
    org: row.org,
    orgUrl: row.org_url,
    orgColor: row.org_color,
    kind: row.kind,
    credentialId: row.credential_id,
    issued: row.issued,
    date: new Date(row.issued).toLocaleDateString("en-US", {
      month: "short",
      year: "numeric",
      timeZone: "UTC",
    }),
    expires: row.expires,
    renewable: !!row.renewable,
    verifyUrl: row.verify_url,
    summary: row.summary,
    description: row.description,
    skills: safeParse(row.skills, []),
    highlights: safeParse(row.highlights, []),
    // `image` is what the frame components render: this certificate's own
    // cover if it has one, otherwise the first bundled document's page 1.
    // Both are proxied, never raw Cloudinary URLs.
    image: row.asset_public_id ? mediaUrl("cert", row.id) : cover,
    pageCount: row.page_count ?? 1,
    aspectRatio:
      aspectRatio(row.asset_width, row.asset_height) ??
      (row.asset_public_id ? null : items.find((i) => i.image)?.aspectRatio ?? null),
    hasAsset: !!row.asset_public_id,
    assetUrl: row.asset_url,
    assetPublicId: row.asset_public_id,
    assetFormat: row.asset_format,
    assetKind: row.asset_kind,
    published: !!row.published,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

// --------------------------------- queries ---------------------------------

/** Published certificates, newest first — what the public site shows. */
export function listCertificates() {
  return getDb()
    .prepare("SELECT * FROM certificates WHERE published = 1 ORDER BY issued DESC, id DESC")
    .all()
    .map(toCertificate);
}

/** Every certificate including drafts — for the admin panel. */
export function listAllCertificates() {
  return getDb()
    .prepare("SELECT * FROM certificates ORDER BY issued DESC, id DESC")
    .all()
    .map(toCertificate);
}

export function getCertificateBySlug(slug) {
  return toCertificate(
    getDb().prepare("SELECT * FROM certificates WHERE slug = ?").get(slug)
  );
}

export function getCertificateById(id) {
  return toCertificate(
    getDb().prepare("SELECT * FROM certificates WHERE id = ?").get(Number(id))
  );
}

/** Published certificates featured on a domain route, in the chosen order. */
export function listCertificatesForDomain(domainSlug) {
  return getDb()
    .prepare(
      `SELECT c.* FROM certificates c
       JOIN certificate_domains d ON d.certificate_id = c.id
       WHERE d.domain_slug = ? AND c.published = 1
       ORDER BY d.position ASC, c.issued DESC`
    )
    .all(domainSlug)
    .map(toCertificate);
}

/** Domain slugs a certificate is featured on. */
export function domainsForCertificate(certificateId) {
  return getDb()
    .prepare("SELECT domain_slug FROM certificate_domains WHERE certificate_id = ? ORDER BY position")
    .all(Number(certificateId))
    .map((r) => r.domain_slug);
}

export function slugExists(slug, exceptId = null) {
  const row = exceptId
    ? getDb().prepare("SELECT id FROM certificates WHERE slug = ? AND id != ?").get(slug, Number(exceptId))
    : getDb().prepare("SELECT id FROM certificates WHERE slug = ?").get(slug);
  return !!row;
}

// ---------------------------------------------------------------------------
// Writes live in the portfolio_admin project, which owns this database.
// This app is read-only: it renders whatever the admin has published.
// If the schema above changes, mirror it from portfolio_admin/lib/db.js.
// ---------------------------------------------------------------------------
