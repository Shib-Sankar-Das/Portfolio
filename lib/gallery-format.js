// ---------------------------------------------------------------------------
// Pure formatting for gallery labels — no database, no Node built-ins.
// Safe to import from client components, and shared verbatim by both apps.
// ---------------------------------------------------------------------------

/**
 * "2024-10" → "October 2024". A year on its own stays a year, and a full date
 * keeps its day, so a label is only ever as precise as what was recorded.
 */
export function formatCaptionDate(value) {
  if (!value) return null;
  const parts = String(value).split("-");
  const [y, m, d] = parts;
  if (!y) return null;

  const date = new Date(Date.UTC(Number(y), Number(m ?? 1) - 1, Number(d ?? 1)));
  if (Number.isNaN(date.getTime())) return String(value);
  if (parts.length === 1) return y;

  return date.toLocaleDateString("en-GB", {
    timeZone: "UTC",
    year: "numeric",
    month: "long",
    ...(parts.length > 2 ? { day: "numeric" } : {}),
  });
}
