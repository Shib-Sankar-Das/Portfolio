// ---------------------------------------------------------------------------
// Delivery rules for book page images and covers.
//
// Crops and filters are *not* baked into the stored file. They are recorded as
// numbers and replayed as Cloudinary transformations when a page is fetched,
// so every edit stays reversible and re-croppng never degrades the original.
// This module is shared verbatim by both apps.
// ---------------------------------------------------------------------------

/**
 * A short fingerprint of everything that affects how an image renders.
 *
 * Media URLs carry this as `v`, so the moment a crop or filter changes the URL
 * changes with it and the browser fetches the new render. Without it the same
 * URL keeps serving the cached pre-edit image and edits appear to do nothing.
 */
export function mediaVersion(...parts) {
  const text = parts.map((p) => (p == null ? "" : typeof p === "string" ? p : JSON.stringify(p))).join("|");
  let hash = 2166136261;
  for (let i = 0; i < text.length; i++) {
    hash ^= text.charCodeAt(i);
    hash = Math.imul(hash, 16777619);
  }
  return (hash >>> 0).toString(36);
}

/** Filter ranges the editor exposes. Cloudinary's own scales, clamped. */
export const FILTER_RANGES = {
  brightness: { min: -60, max: 60, step: 1, default: 0 },
  contrast: { min: -60, max: 60, step: 1, default: 0 },
  saturation: { min: -100, max: 60, step: 1, default: 0 },
  sharpen: { min: 0, max: 800, step: 20, default: 0 },
};

export const DEFAULT_FILTERS = {
  brightness: 0,
  contrast: 0,
  saturation: 0,
  sharpen: 0,
  autoLevels: false, // e_improve — lifts washed-out scans
  grayscale: false,
};

export function normaliseFilters(input) {
  const f = { ...DEFAULT_FILTERS, ...(input ?? {}) };
  for (const [key, range] of Object.entries(FILTER_RANGES)) {
    const n = Number(f[key]);
    f[key] = Number.isFinite(n) ? Math.min(range.max, Math.max(range.min, n)) : range.default;
  }
  f.autoLevels = Boolean(f.autoLevels);
  f.grayscale = Boolean(f.grayscale);
  return f;
}

/**
 * A crop rectangle in the *original image's* pixel space. Stored that way so it
 * survives any change in how the page is displayed.
 */
export function normaliseCrop(crop, imageWidth, imageHeight) {
  if (!crop || !imageWidth || !imageHeight) return null;
  const x = Math.max(0, Math.round(Number(crop.x) || 0));
  const y = Math.max(0, Math.round(Number(crop.y) || 0));
  const w = Math.round(Number(crop.w) || 0);
  const h = Math.round(Number(crop.h) || 0);
  if (w < 8 || h < 8) return null;
  return {
    x: Math.min(x, imageWidth - 8),
    y: Math.min(y, imageHeight - 8),
    w: Math.min(w, imageWidth - x),
    h: Math.min(h, imageHeight - y),
  };
}

/**
 * Builds the Cloudinary transformation chain for one page: crop first (so the
 * filters act on what's actually shown), then tone adjustments, then resize.
 */
export function pageTransformation({ crop, filters, width }) {
  const chain = [];

  if (crop) {
    chain.push({ crop: "crop", x: crop.x, y: crop.y, width: crop.w, height: crop.h });
  }

  const f = normaliseFilters(filters);
  const effects = [];
  if (f.autoLevels) effects.push("improve");
  if (f.grayscale) effects.push("grayscale");
  if (f.brightness) effects.push(`brightness:${f.brightness}`);
  if (f.contrast) effects.push(`contrast:${f.contrast}`);
  if (f.saturation) effects.push(`saturation:${f.saturation}`);
  if (f.sharpen) effects.push(`sharpen:${f.sharpen}`);
  for (const effect of effects) chain.push({ effect });

  chain.push({ width: Number(width) || 1200, crop: "limit", quality: "auto", fetch_format: "auto" });
  return chain;
}

// --------------------------- shape of the book -----------------------------

/**
 * How a cover image sits inside its half of the spread.
 *
 * `contain` shows the whole cover, letterboxed if its shape differs from the
 * page; `cover` fills the page and lets the edges be trimmed; `fill` stretches.
 * Once the page ratio is taken from the cover itself the three look identical —
 * the option only matters when a book's cover and pages are different shapes.
 */
export const COVER_FITS = [
  { id: "contain", label: "Fit the whole cover", css: "contain" },
  { id: "cover", label: "Fill the page (may trim edges)", css: "cover" },
  { id: "fill", label: "Stretch to the page", css: "fill" },
];

export function coverFitCss(fit) {
  return COVER_FITS.find((f) => f.id === fit)?.css ?? "contain";
}

/**
 * Where the reading view takes the book's proportions from.
 *
 * `auto` prefers the cover scan, because the cover is the thing the reader
 * actually looks at — matching it means the image fills its page exactly, with
 * nothing trimmed and no bars. Measurements come next (they also drive the
 * spine on the shelf), then the page scans, then a generic paperback.
 */
export const RATIO_SOURCES = [
  { id: "auto", label: "Automatic — cover scan, then measurements, then pages" },
  { id: "cover", label: "Front cover pixels" },
  { id: "cm", label: "Measured width & height" },
  { id: "pages", label: "Page scans" },
  { id: "custom", label: "A ratio I type in" },
];

/** The order `auto` walks. */
const AUTO_ORDER = ["cover", "cm", "pages"];

/** A generic trade paperback, used only when nothing at all is known. */
export const DEFAULT_PAGE_RATIO = 0.68;

/** Ratios outside this range stop being a book and start being a bookmark. */
const RATIO_MIN = 0.4;
const RATIO_MAX = 1.6;

export function clampRatio(value) {
  const n = Number(value);
  if (!Number.isFinite(n) || n <= 0) return null;
  return Math.min(RATIO_MAX, Math.max(RATIO_MIN, Math.round(n * 1000) / 1000));
}

function ratioOf(width, height) {
  return width && height ? clampRatio(width / height) : null;
}

/**
 * The width-to-height ratio of ONE page of this book, and where it came from.
 *
 * Everything downstream is derived from this: the closed book is exactly this
 * shape, the open spread is twice as wide, and a cover set to `contain` fits
 * without a letterbox because the frame already matches it.
 */
export function resolvePageAspect({
  source = "auto",
  custom = null,
  cm = null, // { widthCm, heightCm }
  cover = null, // { width, height, crop }
  page = null, // { width, height, crop }
} = {}) {
  const fromCm = ratioOf(cm?.widthCm, cm?.heightCm);
  // A crop is what actually gets shown, so it wins over the stored file's size.
  const fromCover = cover?.crop
    ? ratioOf(cover.crop.w, cover.crop.h)
    : ratioOf(cover?.width, cover?.height);
  const fromPage = page?.crop
    ? ratioOf(page.crop.w, page.crop.h)
    : ratioOf(page?.width, page?.height);
  const fromCustom = clampRatio(custom);

  const candidates = {
    cm: fromCm,
    cover: fromCover,
    pages: fromPage,
    custom: fromCustom,
  };

  if (source !== "auto" && candidates[source]) {
    return { aspect: candidates[source], from: source };
  }

  for (const key of AUTO_ORDER) {
    if (candidates[key]) return { aspect: candidates[key], from: key };
  }
  return { aspect: DEFAULT_PAGE_RATIO, from: "default" };
}

// ------------------------- physical size → pixels --------------------------

/**
 * How many screen pixels represent one centimetre of book, per breakpoint.
 * Tuned so a typical 21 cm paperback stands about as tall as the shelf allows.
 */
export const CM_TO_PX = { base: 8.2, sm: 10.4, lg: 11.6 };

/** Sensible defaults when a book's real size hasn't been measured. */
export const DEFAULT_BOOK_CM = { width: 14, height: 21.5, spine: 2 };

/**
 * Converts a book's real dimensions into the spine footprint on the shelf.
 * Clamped so an unusually thin or huge book still sits sensibly next to others.
 */
export function spineMetrics({ heightCm, spineCm }, breakpoint = "sm") {
  const scale = CM_TO_PX[breakpoint] ?? CM_TO_PX.sm;
  const height = Math.round(Math.min(320, Math.max(150, (heightCm || DEFAULT_BOOK_CM.height) * scale)));
  const width = Math.round(Math.min(96, Math.max(22, (spineCm || DEFAULT_BOOK_CM.spine) * scale)));
  return { width, height };
}

// ------------------------------ spine design -------------------------------

export const DEFAULT_SPINE = {
  mode: "solid", // 'solid' | 'gradient'
  color: "#1e293b",
  gradient: { angle: 180, stops: ["#1e293b", "#0f172a"] },
  title: { text: "", mode: "rotate", rotation: -90, color: "#ffffff", size: 12, weight: 600 },
  overlay: null, // { publicId, rotation, scale, offsetY }
};

export function normaliseSpine(config) {
  const c = { ...DEFAULT_SPINE, ...(config ?? {}) };
  c.gradient = { ...DEFAULT_SPINE.gradient, ...(config?.gradient ?? {}) };
  c.title = { ...DEFAULT_SPINE.title, ...(config?.title ?? {}) };
  if (!Array.isArray(c.gradient.stops) || c.gradient.stops.length < 2) {
    c.gradient.stops = [...DEFAULT_SPINE.gradient.stops];
  }
  return c;
}

/** The CSS background for a designed spine. */
export function spineBackground(config) {
  const c = normaliseSpine(config);
  if (c.mode === "gradient") {
    return `linear-gradient(${c.gradient.angle}deg, ${c.gradient.stops.join(", ")})`;
  }
  return c.color;
}
