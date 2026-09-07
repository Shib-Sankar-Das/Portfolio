# Shib Sankar Das — Portfolio

A multi-domain personal portfolio built with **Next.js 16** (App Router),
**React 19**, **Tailwind CSS v4**, **Three.js / react-three-fiber** and **Framer
Motion**. One primary route covers every skill profile; each specialised route
shows only its own domain. Alongside them sit two content systems fed by the
admin app — a **certificate wall** and a **library** of books and research
papers.

> **Adding or editing content?** Certificates, books, papers, shelves and gallery
> photographs are all managed in the sibling **`portfolio_admin`** app. The full
> walkthrough is **[../portfolio_admin/GUIDE.md](../portfolio_admin/GUIDE.md)**.

## Routes

| Route | What it is |
| --- | --- |
| `/` | Primary route — every skill profile, the combined skill grid, projects, experience, education |
| `/ai-data-science` | AI Engineering & Data Science |
| `/robotics-embedded` | Robotics & Embedded Systems |
| `/software-developer` | Software Development |
| `/certificates` | The certificate wall — search, filter by organisation or skill, sort |
| `/certificates/[slug]` | One credential: large view, description, skills, timeline, expiry, verification |
| `/library` | The bookshelf — books that open and turn, and stapled bundles of research papers |
| `/gallery` | A salon-hung wall of photographs; clicking one brings it forward, framed, with its label |

Every specialised route is generated from one entry in the `domains` array, so
adding a profile is a data change, not a code change.

## Run it

```bash
npm install
npm run dev      # http://localhost:3000
npm run build    # production build
npm run model    # convert assets/3d-source FBX → optimised GLB in public/models
```

## What is where

| Content | Source |
| --- | --- |
| Profile, skills, projects, experience, education, domains | [lib/data.js](lib/data.js) |
| Certificates (text, dates, skills, links) | Shared SQLite at `../db/portfolio.db` |
| Library sections, books, pages, papers | The same database |
| Gallery photographs and their labels | The same database; images on Cloudinary |
| Certificate and library visuals | Cloudinary, served through this app's signing proxy |
| Theme, accents, book typography | [app/globals.css](app/globals.css) |

### Editing `lib/data.js`

- `profile` — name, contact details, social links, hero roles, summary.
- `experience` / `education` — shared across every route.
- `domains` — one entry per specialised route.
- `combinedSkills` — the merged skill grid on the home page.

### Adding a domain route

Add one object to `domains`. The dynamic route ([app/[domain]/page.js](app/[domain]/page.js)),
the navbar and the home-page domain cards all pick it up automatically:

```js
{
  slug: "my-new-domain",          // becomes the URL: /my-new-domain
  themeClass: "theme-mynew",      // accent colours, see below
  icon: "brain",                  // key in `domainIcons` (components/sections.jsx)
  title: "...", shortTitle: "...", tagline: "...",
  heroColors: { primary: "#hex", secondary: "#hex" },  // 3D scene colours
  summary: "...",
  highlights: ["...", "..."],     // rotating words + hero chips
  skills: [{ group: "...", items: ["..."] }],
  projects: [{ name, stack: [], github, points: [] }],
  certifications: [{ name, org, date, link }],
}
```

Then define the accent palette in [app/globals.css](app/globals.css) next to
`.theme-ai` / `.theme-robotics` (a light block and a `.dark` block), and add a
card icon to `domainIcons` in [components/sections.jsx](components/sections.jsx)
if you want a new one.

---

## The certificate wall

Certificates are **not** edited here. They live in the shared database and are
written only by `portfolio_admin`; this app reads and renders them.

```text
D:\Portfolio\
├── db\portfolio.db     ← shared database
├── portfolio_admin\    ← admin panel (localhost:3001) — creates and edits
└── protfolio\          ← this app    (localhost:3000) — reads and renders
```

The database is created and seeded from
[lib/seed-certificates.js](lib/seed-certificates.js) and
[lib/seed-library.js](lib/seed-library.js) on first run, so a fresh checkout
renders before the admin app has ever been started. It lives outside both
projects and is not tracked in git.

**On the wall** ([components/certificate-wall.jsx](components/certificate-wall.jsx))
each credential hangs as a framed picture under a picture light. Visitors can
search, filter by organisation or by skill — the pills are generated from the
data, with counts — and sort by newest, oldest, organisation or A–Z. A
certificate without an uploaded image is drawn as a **designed frame** built from
its text and the issuer's brand colour, so the wall is never patchy.

**Bundled certificates.** A credential that awarded several documents hangs as a
*stacked* frame with a document-count badge, and its detail page gains a document
browser ([components/certificate-documents.jsx](components/certificate-documents.jsx))
where each document has its own note and its own view. The flag is
`cert.isBundle`, set whenever a certificate has more than one document.

**On the domain routes** the credential list is filtered to that domain and ends
with an **Other certificates** button through to the wall.

---

## The library

`/library` renders as a bookshelf, built from the sections in the database
([components/library/bookshelf.jsx](components/library/bookshelf.jsx)).

### Books

Clicking a spine lifts the book out of the shelf and opens it in the centre of
the screen ([components/library/book-reader.jsx](components/library/book-reader.jsx)).

The book is a stack of **leaves hinged at the spine**, each carrying one page on
its front and the next on its back, so turning a leaf really does take two pages
with it. It behaves like a real book: with nothing turned only the front cover
shows — no blank page beside it — and once every leaf is over, only the back
cover remains. The frame slides sideways as it opens and closes so a shut book
stays centred on screen.

Three details are worth knowing about, because they took care to get right:

- **No flicker.** A `settled` state lags the turn by the animation's duration, so
  a backing half-page only appears once the leaf covering it has landed.
- **No premature glimpse.** The turning leaf is lifted above both stacks for the
  duration of its sweep, so the next page cannot flash into view before the
  rotation starts.
- **Type that fits.** On narrow screens the reader measures the fullest page and
  the fullest cover and shrinks two CSS variables — `--page-font` and
  `--cover-font` — until everything fits. One size for all pages and one for both
  covers, so the book stays internally consistent instead of every page picking
  its own scale. The book's *proportions* are never distorted to make text fit.

**Each book is its own shape.** The reader is built from one number: the page
ratio, resolved by `resolvePageAspect()` in [lib/book-media.js](lib/book-media.js)
from the front cover scan, the book's measured centimetres, the page scans, or a
per-book override. The closed book is exactly that shape and the open spread is
two of them (`--book-open-ratio` in [app/globals.css](app/globals.css)), which is
what lets a cover fill its page with nothing trimmed off the top or bottom. The
frame is height-aware too, so a tall book narrows rather than running off the
bottom of the screen. Where a cover and the page still differ slightly, the
remainder is filled with a blurred enlargement of the cover itself rather than a
flat band.

### Research papers

A section's papers appear as **one stapled bundle** — not a book, but a stack of
sheets stapled at the top-left corner
([components/library/paper-reader.jsx](components/library/paper-reader.jsx)).
Clicking the corner flips a sheet about the staple. Each paper's links are listed
on the blurred backdrop *beneath* the sheet, DOI first, so they never cover it. A
paper with an uploaded PDF is shown as rendered page images; one without still
appears as a typeset sheet built from its title, authors, abstract and
contributions.

---

## The gallery

`/gallery` is a salon hang: a wall of photographs at different sizes, nudged off
the line, the way pictures are actually hung rather than laid out in a grid.

**Photographs are not edited here.** Like certificates and the library, they
live in the shared database and are written only by `portfolio_admin`, which
uploads the image to Cloudinary and records its title, country, place, event,
date and story. This app reads and renders them.

To add one: run the admin app and use **Gallery → Add photograph**. The
walkthrough is in [../portfolio_admin/GUIDE.md](../portfolio_admin/GUIDE.md).

**Every frame is cut to its own picture.** Each row carries the image's real
pixel size, recorded on upload, and its crop if it has one — so the mount takes
the photograph's shape and nothing is ever cropped or stretched to fit. Sizes
vary by shape: a panorama is given the full width of its column, a tall portrait
hangs a little smaller, a photograph can be marked to hang large whatever its
shape, and the hang is offset column by column so the wall has a rhythm. The
wall is ordered by the date taken, newest first.

**Clicking a frame does not open a panel over the wall.** The wall itself falls
back — scaling up, blurring and dimming — while the chosen print travels forward
from exactly where it hung, using its measured rectangle as the starting
transform. It ends framed and centred, sized to the space above a museum label
carrying the country and place, the title, the event and date, and the story.
Arrow keys walk the wall, Esc puts the picture back, and closing flies it home
to its own frame.

The print that travels is the file the wall already had in cache, with the
full-resolution one focusing in over it — an empty mount for the length of the
zoom would give the whole effect away.

This is a deliberately different room from the certificate wall: slim modern
frames and wide bone mounts on warm plaster, versus that page's heavy gilt
mouldings, dark mats, glazing sheen and overhead picture light.

---

## How documents are served

Certificate and library documents live on Cloudinary under **authenticated
delivery** — a direct URL returns 401. This app signs read URLs server-side in
[lib/media.js](lib/media.js) and streams *rendered page images* through its own
routes:

| Route | Serves |
| --- | --- |
| `/api/certificate-media/[kind]/[id]` | A rendered page of a certificate document |
| `/api/library-media/paper/[id]` | A rendered page of a research paper |
| `/api/library-media/page/[id]` | A book page, with its crop and tone applied |
| `/api/library-media/cover/[id]` | A book cover, with its crop and tone applied |
| `/api/gallery-media/[id]` | A gallery photograph, with its crop and tone applied |

Each route serves only content belonging to a **published** record on a published
shelf. The browser never receives a Cloudinary URL and the source PDF is never
delivered, so there is no download path; readers open documents in
[components/document-viewer.jsx](components/document-viewer.jsx), an in-page
viewer with zoom, panning and page navigation.

This is why the portfolio needs read-only `CLOUDINARY_*` credentials: to sign,
never to upload.

**Crops are applied at delivery, not baked in.** A page's crop rectangle and tone
filters are stored as numbers and replayed as a Cloudinary transformation chain
on every request, so originals are never re-encoded and any edit is reversible.
Each URL carries a fingerprint of those values (`?v=…`), so an edit in the admin
changes the URL and a stale image cannot be served from cache.

## How admin edits reach this app

After a save the admin posts to `POST /api/revalidate`
([app/api/revalidate/route.js](app/api/revalidate/route.js)) with a shared secret
(compared in constant time), and this app revalidates its cached pages. Changes
appear without a rebuild. If this app is not running when a save happens, it
simply picks up the new data the next time it renders.

## Environment variables

Copy `.env.example` to `.env.local`:

```ini
DATABASE_PATH=../db/portfolio.db   # the shared database
REVALIDATE_SECRET=…                # must match portfolio_admin's value
CLOUDINARY_CLOUD_NAME=…            # read-only use: signing delivery URLs
CLOUDINARY_API_KEY=…
CLOUDINARY_API_SECRET=…
```

The admin password belongs to `portfolio_admin`, not here — this app never
uploads or writes anything.

## Performance

Applied:

- **Code splitting + deferred 3D** — Three.js (~870 KB, the largest chunk) is
  split out via `next/dynamic` and only mounted after the browser goes idle
  (`requestIdleCallback`), so it never blocks first paint. The render loop is
  **paused entirely** (`frameloop="never"`) when the hero scrolls off screen, via
  IntersectionObserver.
- **Web Worker offloading** — particle positions for the 3D scene are generated
  off the main thread ([components/hero-canvas.jsx](components/hero-canvas.jsx)).
- **Adaptive quality** — fewer particles, lower DPR and no antialiasing on small
  screens; a near-static scene under `prefers-reduced-motion`.
- **LazyMotion** — Framer Motion is loaded through `LazyMotion` + `domAnimation`
  in `strict` mode (only `m.*` components), shipping the animation subset instead
  of the full library.
- **Reduced dependencies** — `@react-three/drei` was removed; its `Float` and
  `Sparkles` effects are hand-rolled in ~20 lines each.
- **content-visibility** — every below-fold section uses
  `content-visibility: auto`, so the browser skips layout and paint for offscreen
  content (the no-JS equivalent of list virtualization for a page like this).
- **Static generation** — the marketing routes are prerendered at build time; only
  the media proxies are dynamic.
- **Media pipeline** — AVIF → WebP via `next/image`; book, certificate and
  gallery images are resized, format-negotiated and quality-tuned by Cloudinary
  at delivery, and fingerprinted URLs are cached immutably. Gallery photographs
  carry their pixel size in the database, so every frame reserves its exact space
  and the wall never shifts as images arrive; each is offered a five-width
  `srcset` so the browser fetches only what it will display.
- **3D assets** — `npm run model` runs FBX sources through the glTF-Transform
  pipeline into optimised GLB in `public/models`.

Not applied, deliberately:

- **Zustand / Jotai** — the only shared client state is the theme (next-themes);
  a store would be dead weight.
- **TanStack Query** — the site fetches no runtime data; content is read on the
  server.
- **Qwik / Solid resumability** — React Server Components already ship zero JS for
  the static parts; switching frameworks would rewrite the site for marginal gain.

## Theming

- Light/dark via `next-themes` (class strategy); the toggle is in the navbar. It
  defaults to dark and respects the system preference.
- All colours flow through CSS variables (`--accent`, `--accent-2`, …) defined in
  `globals.css`, so each domain route gets its own accent while sharing one base
  theme.
- Book typography and geometry are variables too — `--page-font`, `--cover-font`,
  `--book-open-ratio`, `--book-max-h` — which is what lets the reader adapt per
  book and per screen without any layout branching.

## Deployment

Certificate and library pages read a local SQLite file, so this app needs a
**persistent filesystem** reachable by both projects: a VPS, or containers
sharing a volume. It does *not* work as-is on serverless platforms with ephemeral
disks (Vercel, Netlify Functions) — the database would reset on every deploy. To
deploy there, swap [lib/db.js](lib/db.js) for a hosted database (Postgres,
Turso/libSQL) in both projects; the query functions it exports are the only
surface the rest of the app depends on.
