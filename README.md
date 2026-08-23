# Shib Sankar Das — Portfolio

Multi-domain portfolio built with **Next.js 16**, **Tailwind CSS v4**, **Three.js (react-three-fiber)** and **Framer Motion**.

- `/` — primary route covering all skill profiles
- `/ai-data-science` — AI Engineering & Data Science showcase
- `/robotics-embedded` — Robotics & Embedded Systems showcase

## Run it

```bash
npm install
npm run dev      # http://localhost:3000
npm run build    # production build (all routes are statically generated)
```

## Editing content

Everything on the site is driven by [lib/data.js](lib/data.js):

- `profile` — name, contact info, social links (**update the placeholder LinkedIn/GitHub URLs here**), hero roles and summary.
- `experience` / `education` — shared across every route.
- `domains` — one entry per specialized route.
- `combinedSkills` — the merged skill grid on the home page.

Project GitHub links and certification links are placeholders (`https://github.com/`, `#`) — replace them with the real URLs.

## Adding a new domain route (3 remaining profiles)

Add one object to the `domains` array in `lib/data.js`. The dynamic route
(`app/[domain]/page.js`), the navbar and the home-page domain cards all pick it
up automatically — no other code changes needed.

Required fields:

```js
{
  slug: "my-new-domain",          // becomes the URL: /my-new-domain
  themeClass: "theme-mynew",      // accent colors, see below
  icon: "brain",                  // key in `domainIcons` (components/sections.jsx)
  title: "...", shortTitle: "...", tagline: "...",
  heroColors: { primary: "#hex", secondary: "#hex" },  // 3D scene colors
  summary: "...",
  highlights: ["...", "..."],     // rotating words + hero chips
  skills: [{ group: "...", items: ["..."] }],
  projects: [{ name, stack: [], github, points: [] }],
  certifications: [{ name, org, date, link }],
}
```

Then define the accent palette in [app/globals.css](app/globals.css) next to
`.theme-ai` / `.theme-robotics` (a light block and a `.dark` block), and — if you
want a new card icon — add it to `domainIcons` in
[components/sections.jsx](components/sections.jsx).

## Certificates come from the admin app

Certificates are **not** edited in this project. They live in a shared SQLite
database and are managed by the sibling **`portfolio_admin`** app, which owns
all writes — this app only reads.

```
D:\Portfolio\
├── db\portfolio.db     ← shared database
├── portfolio_admin\    ← admin panel (localhost:3001) — creates/edits certificates
└── protfolio\          ← this app    (localhost:3000) — reads and renders them
```

To add or edit a certificate, run the admin app (`npm run dev` in
`../portfolio_admin`) and open <http://localhost:3001>.

### Where the data lives

| Data | Location |
| --- | --- |
| Certificate text, dates, skills, links | SQLite at `../db/portfolio.db` |
| Certificate visuals (PDF/PNG/JPG) | Cloudinary — uploaded by the admin app |
| Everything else (projects, skills, experience) | [lib/data.js](lib/data.js) |

The database is created and seeded from [lib/seed-certificates.js](lib/seed-certificates.js)
on first run, so a fresh checkout renders even before the admin app has been
started. It lives outside both projects and is not tracked in git.

### How documents are served

Certificate documents live on Cloudinary under **authenticated delivery** — a
direct URL returns 401. This app signs read URLs server-side in
[lib/media.js](lib/media.js) and streams *rendered page images* through
[app/api/certificate-media](app/api/certificate-media), which only serves
documents belonging to a published certificate. The browser therefore never
receives a Cloudinary URL and the source PDF is never delivered; readers open
documents in [components/document-viewer.jsx](components/document-viewer.jsx),
an in-page viewer with zoom, panning and page navigation.

This is why the portfolio needs read-only `CLOUDINARY_*` credentials: to sign,
never to upload.

### Bundled certificates

A credential that awarded several documents (rows in `certificate_items`) is
rendered differently: on the wall it hangs as a **stacked frame** with a
document-count badge, and its detail page gains a document browser
([components/certificate-documents.jsx](components/certificate-documents.jsx))
listing each document with its own note and a link to the original file. The
flag is `cert.isBundle`, set whenever a certificate has more than one document.
Bundles are created and edited in the admin app.

### How admin edits reach this app

After a save the admin app posts to `POST /api/revalidate`
([app/api/revalidate/route.js](app/api/revalidate/route.js)) with a shared
secret, and this app revalidates its cached pages. Certificate changes appear
without a rebuild. If this app isn't running when a save happens, it simply
picks up the new data the next time it renders.

### Environment variables

Copy `.env.example` to `.env.local`:

```
DATABASE_PATH=../db/portfolio.db   # the shared database
REVALIDATE_SECRET=…                # must match portfolio_admin's value
```

Cloudinary credentials and the admin password belong to `portfolio_admin`, not
here — this app never uploads anything.

### Deployment note

Certificate pages read a local SQLite file, so this app needs a **persistent
filesystem** reachable by both projects: a VPS, or containers sharing a volume.
It does *not* work as-is on serverless platforms with ephemeral disks (Vercel,
Netlify Functions) — the database would reset on every deploy. To deploy there,
swap [lib/db.js](lib/db.js) for a hosted database (Postgres, Turso/libSQL) in
both projects; the query functions it exports are the only surface the rest of
the app depends on.

## Performance

Applied optimizations:

- **Code splitting + deferred 3D** — Three.js (~870 KB, the largest chunk) is
  split out via `next/dynamic` and only mounted after the browser goes idle
  (`requestIdleCallback`), so it never blocks first paint. The render loop is
  **paused entirely** (`frameloop="never"`) when the hero scrolls off screen,
  via IntersectionObserver.
- **Web Worker offloading** — particle positions for the 3D scene are generated
  off the main thread ([components/hero-canvas.jsx](components/hero-canvas.jsx)).
- **Adaptive quality** — fewer particles, lower DPR and no antialiasing on
  small screens; near-static scene under `prefers-reduced-motion`.
- **LazyMotion** — Framer Motion is loaded through `LazyMotion` +
  `domAnimation` with `strict` mode (only `m.*` components), shipping the
  animation subset instead of the full library.
- **Reduced dependencies** — `@react-three/drei` was removed; its `Float` and
  `Sparkles` effects are hand-rolled in ~20 lines each.
- **content-visibility** — every below-fold section uses
  `content-visibility: auto`, so the browser skips layout/paint for off-screen
  content (the no-JS equivalent of list virtualization for a page like this).
- **Static generation** — every route is prerendered at build time (SSG); no
  server work at request time.
- **Images** — `next.config.mjs` is set to serve AVIF → WebP via `next/image`
  (Next.js compresses with sharp automatically). When you add real photos, use
  `<Image>` — never raw `<img>` — to get responsive `srcset` for free.

Not applied, deliberately:

- **Draco / KTX2 / glTF-Transform** — the 3D scene is procedural (no glTF
  assets to compress). If you add a model: compress it with
  `npx @gltf-transform/cli optimize model.glb out.glb --compress draco --texture-compress ktx2`
  and load it with a `GLTFLoader` + `DRACOLoader` behind the same deferred mount.
- **Zustand / Jotai** — the only shared state is the theme (next-themes);
  a store would be dead weight.
- **TanStack Query** — the site fetches no runtime data; everything is static.
- **Qwik / Solid resumability** — Next.js RSC already ships zero JS for the
  static parts; switching frameworks would rewrite the site for marginal gain.

## Theming

- Light/dark mode via `next-themes` (class strategy); toggle is in the navbar; defaults to dark and respects the system preference.
- All colors flow through CSS variables (`--accent`, `--accent-2`, …) defined in `globals.css`, so each domain route gets its own accent while sharing one base theme.
