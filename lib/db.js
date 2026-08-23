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

CREATE INDEX IF NOT EXISTS idx_cert_issued ON certificates(issued DESC);
CREATE INDEX IF NOT EXISTS idx_cert_domain ON certificate_domains(domain_slug);
`;

// Reuse one handle across dev hot reloads.
const globalForDb = globalThis;

function connect() {
  const relative = process.env.DATABASE_PATH || "db/portfolio.db";
  // The path comes from the environment, so the bundler can't trace it — that
  // is intentional here; it always resolves under the project's db/ folder.
  const file = path.isAbsolute(relative)
    ? relative
    : path.join(/* turbopackIgnore: true */ process.cwd(), relative);
  fs.mkdirSync(path.dirname(file), { recursive: true });

  const db = new DatabaseSync(file);
  db.exec("PRAGMA journal_mode = WAL");
  db.exec("PRAGMA foreign_keys = ON");
  db.exec(SCHEMA);
  seedIfEmpty(db);
  return db;
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

// --------------------------------- mapping ---------------------------------

function safeParse(json, fallback) {
  try {
    const parsed = JSON.parse(json);
    return Array.isArray(parsed) ? parsed : fallback;
  } catch {
    return fallback;
  }
}

/** DB row -> the plain object shape the UI components already expect. */
function toCertificate(row) {
  if (!row) return null;
  return {
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
    // `image` is what the frame components render; prefer the derived preview
    // (PDFs get a rendered first page) and fall back to the raw asset.
    image: row.preview_url || row.asset_url || null,
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

// ---------------------------------------------------------------------------
// Writes live in the portfolio_admin project, which owns this database.
// This app is read-only: it renders whatever the admin has published.
// If the schema above changes, mirror it in portfolio_admin/lib/db.js.
// ---------------------------------------------------------------------------