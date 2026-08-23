// ---------------------------------------------------------------------------
// Pure certificate helpers — no database, no Node built-ins.
// Safe to import from client components. Anything that touches SQLite lives
// in lib/db.js (server only).
// ---------------------------------------------------------------------------

/** Newest first. */
export function certificatesByDate(list = []) {
  return [...list].sort((a, b) => b.issued.localeCompare(a.issued));
}

/** Unique issuing organisations, with how many certificates each issued. */
export function certificateOrgs(list = []) {
  const map = new Map();
  for (const c of list) map.set(c.org, (map.get(c.org) ?? 0) + 1);
  return [...map.entries()]
    .map(([org, count]) => ({ org, count }))
    .sort((a, b) => b.count - a.count || a.org.localeCompare(b.org));
}

/** Unique skills across the given certificates, most-common first. */
export function certificateSkills(list = []) {
  const map = new Map();
  for (const c of list) {
    for (const s of c.skills ?? []) map.set(s, (map.get(s) ?? 0) + 1);
  }
  return [...map.entries()]
    .map(([skill, count]) => ({ skill, count }))
    .sort((a, b) => b.count - a.count || a.skill.localeCompare(b.skill));
}

/** "lifetime" | "active" | "expiring" | "expired" */
export function certificateStatus(cert, now = new Date()) {
  if (!cert?.expires) return "lifetime";
  const expiry = new Date(cert.expires);
  if (expiry <= now) return "expired";
  const monthsLeft = (expiry - now) / (1000 * 60 * 60 * 24 * 30.44);
  return monthsLeft <= 3 ? "expiring" : "active";
}

export function formatMonthYear(iso) {
  if (!iso) return null;
  return new Date(iso).toLocaleDateString("en-US", {
    month: "short",
    year: "numeric",
    timeZone: "UTC",
  });
}

/** Adjacent certificates (by date) for prev/next navigation. */
export function certificateNeighbours(list, slug) {
  const ordered = certificatesByDate(list);
  const i = ordered.findIndex((c) => c.slug === slug);
  if (i === -1) return { prev: null, next: null };
  return {
    prev: i > 0 ? ordered[i - 1] : null,
    next: i < ordered.length - 1 ? ordered[i + 1] : null,
  };
}

/** URL-safe slug from a certificate name. */
export function slugify(value) {
  return String(value)
    .toLowerCase()
    .replace(/['’]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 80);
}
