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
| `/experience` | Every role as an ID badge hanging on a rail |
| `/experience/[slug]` | The badge, pinned left, with that role's details beside it |
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
- `experience` — the timeline on every route *and* the `/experience` pages. Each
  role needs a `slug`, `start`/`end` (`YYYY-MM`) and an `accent`; everything
  else (`summary`, `focus`, `work`, `achievements`, `stack`, `links`,
  `location`) is optional and its section hides when empty, so a role can carry
  as much or as little as you have. Helpers next to it — `experienceByDate`,
  `getExperience`, `experienceNeighbours`, `experienceDuration` — do the
  ordering, lookup and "3 months" arithmetic.
- `education` — shared across every route.
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

## The drone fleet (robotics skills)

On `/robotics-embedded` only, the skills cards are flown in and held by a fleet
of quadcopters ([drone-skills.jsx](components/robotics/drone-skills.jsx),
[drone-fleet.jsx](components/robotics/drone-fleet.jsx)). Every other route keeps
the plain skills grid.

Each card gets its own drone. When the section arrives, the cards fly in from
off-stage, staggered, and from then on each one hangs from its drone on two
cables, swaying gently while the rotors turn.

**The cards are ordinary page content.** They sit in the normal grid — that is
what sets the section's height and keeps the text selectable — and are nudged by
`transform` only. Each drone is then placed *above its own card* by converting
the card's position on screen into the world position that lands there, so the
layout can reflow freely and the fleet follows. Nothing depends on the 3D: under
`prefers-reduced-motion`, or if WebGL or the model is unavailable, the cards
simply sit in their grid.

**The fleet is instanced.** A drone is 36 parts; eight of them would be ~290 draw
calls a frame. On load the model is merged by material into a handful of
geometries, baked into one normalised space (one unit across the rotors, centred
on itself), and drawn as one `InstancedMesh` per material plus one per rotor —
about a dozen draw calls for the whole fleet, however many drones there are. The
rotors stay separate so they can spin, alternating direction per corner.

**Both 3D sections render only while on screen.** The drones' frame loop stops
when the skills section leaves the viewport, and the arm's does the same (it has
no `rootMargin`), so the two canvases never draw at once.

**The model.** Seven files came with the drone; `Drone_fb.FBX` was chosen. The
`.max` needs 3ds Max, the `.IGS` is CAD data and the `.ABC` is a geometry cache;
of the two usable FBX models it is half the weight of the DJI Phantom (631k
triangles against 1.36M), keeps its materials (the Phantom has none and renders
white), and names its rotors `GEO_Propeller_01`–`04`. Its own
materials are not used: one is a translucent olive that made the whole aircraft
look gold, so on load every part is repainted by role — a light grey shell, dark
grey detail (camera, gimbal, wiring, mounts) and near-black rotors — which also
reduces the fleet to two merged materials plus the rotors, and keeps the drones
legible on both the dark and the light theme. Rebuild with
`npm run model -- assets/3d-source/drone.fbx drone --simplify 0.03 --max-texture 1024`
→ `public/models/drone.glb` (50k triangles, 405 KB).

---

## The robotic arm carousel

On `/robotics-embedded` only, the projects section is a ring of cards worked by
an industrial robot arm ([components/robotics/](components/robotics/)). Every
other route keeps the plain project grid.

**A circular queue.** The projects sit evenly spaced on a ring around the arm;
the card after the last is the first again. The front card faces the viewer, the
rest wait round the ring, and the ring turns to bring each one forward.

- **Hover or focus an arrow:** the arm turns that way and opens its gripper,
  ready.
- **Press an arrow:** the arm turns to the next card on the ring, lowers onto it,
  grips it and lifts it, then carries it round to the front while the rest of the
  ring turns one place, sets it down and lets go.
- **Click a card:** a side card is fetched to the front first; then the arm grips
  the front card, lifts it off the ring and brings it toward the viewer, and the
  write-up opens out of it. Closing the write-up has the arm put it back.

**How it fits together.**

- [project-carousel.jsx](components/robotics/project-carousel.jsx) owns the
  scene, the clock and the choreography, and never imports three.js. Cards are
  ordinary DOM buttons placed every frame by projecting their spot on the ring
  (in the arm model's own metres) through a camera, with plain maths. The
  choreography is written as "gripper here, this open" — heading, reach, height,
  grip — and tweened.
- [carousel-arm-engine.jsx](components/robotics/carousel-arm-engine.jsx) is the
  3D half, loaded lazily on a transparent canvas. Each frame the carousel calls
  `engine.render(timestamp, task)`; it solves the joint angles with
  [industrial-arm-ik.js](components/robotics/industrial/industrial-arm-ik.js),
  renders that pose synchronously (r3f `frameloop="never"` + `advance`), and
  returns where the gripper tip actually is. A carried card is placed against
  that exact frame, so card and gripper never drift apart. Pick-up and set-down
  are short blends between ring slot and gripper.
- **The IK is exact.** Turntable plus a two-link planar arm with the wrist kept
  level, refined against the real forward kinematics: across 1,672 targets all
  round the arm the gripper lands within 0.01 mm, pointing straight down.
- **Depth is real.** Cards in front of the arm sit above the canvas, cards behind
  it sit below, so the arm hides what it should. The canvas takes no pointer
  events, so cards behind the arm are still clickable.

The arm is decoration and is `aria-hidden`. The frame loop runs only while the
section is on screen or mid-move. If WebGL or the model is unavailable, the
ring still turns and every write-up still opens. Under `prefers-reduced-motion`,
cards jump instead of travelling and write-ups open straight away.

The section is not `cv-auto`: letting the browser skip laying out a live canvas
and the cards positioned against it is asking for trouble. It has to survive
StrictMode (dev mounts everything twice), so the "unmounted" ref is reset on
mount — test changes on `npm run dev`, not only a production build.

**Test route: `/arm-demo`.** The same carousel with five cards (the robotics
projects topped up with clearly-marked placeholders) and a status panel showing
WebGL support, whether the 3D arm has loaded, the reduced-motion setting, the
current card, and a live log of every pose, pickup and release. It also has a
switch to play the animation even when the system asks for reduced motion.
It is not linked from the site and is marked `noindex`
([app/arm-demo/page.js](app/arm-demo/page.js),
[components/robotics/arm-demo.jsx](components/robotics/arm-demo.jsx)).

### The rebuilt rig — `/arm-rig` (demo route)

A second, rebuilt version of the arm lives on `/arm-rig`: a 360° orbit view,
a slider for every joint, camera presets, joint markers, per-part visibility
toggles, a looping demo, and a live integrity check ("All 10 joints
connected"). It is not linked from the site and is marked `noindex`.

**Why it exists.** The FBX route loses parts of this model: FBX2glTF drops both
balancer rods (`w-pistonBob`) and leaves the base, body and pistons as loose
objects at the scene root, so the arm comes apart the moment anything moves.
The `.blend` holds the arm together with Blender constraints (Track To, IK,
Child Of) that glTF cannot carry at all — and they don't survive base rotation
even inside Blender.

**How it is built.**

1. Export straight from the `.blend` with Blender's own glTF exporter, which
   keeps every object:
   `blender -b Done_2nd-try.blend --python scripts/blender/export_arm_rig.py -- arm.glb`
2. Optimise: `npm run model -- arm.glb robotic-arm-rig --simplify 0.35` →
   `public/models/robotic-arm-rig.glb` (551 KB; every part within 0.03 units of
   Blender's placement).
3. The mechanism is rebuilt in code in
   [arm-kinematics.js](components/robotics/rig/arm-kinematics.js). Five inputs
   — base rotation, lower arm, upper arm, gripper rotation, claw opening — drive
   everything else through the machine's two parallelograms (lower arm + rear
   rod keep the elbow crank level; upper arm + top bar keep the head level) and
   the balancer, whose cylinder and rod both aim along the line between their
   anchors. Pivot points come from the bone heads and empties in the `.blend`.
4. [arm-rig-viewer.jsx](components/robotics/rig/arm-rig-viewer.jsx) takes each
   part out of the exported hierarchy and places it every frame as
   *solved transform × rest placement*. The claw finger is baked into the
   gripper mesh, so it is cut out on load into its own mesh and hinged. In the
   `.blend` it is modelled closed; the old FBX export had it standing wide open.

Across 10,935 poses covering every joint's full range, the largest gap at any
joint is 0.15 units on a 170-unit arm. The head and crank never tilt.


### The industrial robot arm — `/industrial-arm` (demo route)

A second demo arm: a six-part industrial robot with a two-finger gripper
(source in [assets/3d-source/industrial-robot-arm/](assets/3d-source/industrial-robot-arm/)).
The route has a 360° orbit view, a slider for each joint (base, shoulder, elbow,
wrist, gripper rotation, gripper closed), pose presets, a looping pick-and-place
demo, camera presets, joint pivot markers, a live gripper-position readout, and
per-part visibility toggles. It is not linked from the site and is marked
`noindex`.

**Unlike the palletiser, this model needed no mechanism rebuilt.** It is a clean
chain of parented objects (base → turntable → lower arm → upper arm → wrist →
gripper → fingers) with no bones or constraints, and its author put every
object's origin on its joint. Rotating each part about its own origin in Blender
confirmed every joint turns in place.

**How it is built.**

1. Export from the `.blend` with
   [export_arm_rig.py](scripts/blender/export_arm_rig.py), then
   `npm run model -- arm.glb industrial-robot-arm --max-texture 2048`. The model
   ships with 4K colour, normal and roughness maps; `--max-texture` caps all of
   them (the default only caps colour maps). The result is 3.6 MB, and every
   part is within 0.04 mm of Blender's placement.
2. [industrial-arm.js](components/robotics/industrial/industrial-arm.js) holds the
   joints, presets and demo, and does forward kinematics down the chain. Pivots
   are the object origins from the `.blend`, not the GLB's node origins:
   optimising moves meshes onto new child nodes and shifted the finger nodes by
   7.5 cm, so node origins are not reliable pivots.
3. [industrial-arm-viewer.jsx](components/robotics/industrial/industrial-arm-viewer.jsx)
   places every part as *solved transform × rest placement*, so a part can't come
   away from its parent.

Joint limits are chosen so no single joint drives the gripper into the floor or
the base. The presets and every moment of the demo cycle were checked the same
way; the demo's lowest point is 0.52 m up and 1.06 m out from the base. Reaching
low means leaning the shoulder forward, not dropping the elbow: the lower arm
rests leaning back, so the forearm's tilt is shoulder − elbow.

---

---

## Work experience

The timeline section that appears on the home page and all three profile routes
is the short version: role, company, period and a few bullets. Each card links
through to that role's own page, and the section ends with an **Explore More**
button to `/experience`.

`/experience` hangs one **ID badge** per role from a rail: the profile
photograph, and the name, role, employer and dates printed on a punched card
([components/experience/id-card.jsx](components/experience/id-card.jsx)). Each
badge sways gently, out of phase with its neighbours.

The lanyard is a single SVG
([lanyard.jsx](components/experience/lanyard.jsx)) rather than a few CSS boxes,
because the parts have to *connect*. It is one unbroken run of metal: the fabric
ribbons stop inside a crimp, the crimp hides the top of a swivel barrel, and the
barrel carries a hook that drops down the card's face and curls into its slot.

Three things make that read as hardware rather than as shapes:

- **Each piece is painted over the one it joins**, so the ribbon ends, the
  barrel's top and the hook's shoulder are all hidden inside their neighbour.
- **The hook is drawn twice** — once normally, and once clipped to the slot and
  dimmed. Above the slot it lies on the card; inside the slot it is seen through
  the opening; below it nothing is drawn, because it has gone behind the card. A
  second clip stops the metal dead at the slot's lower lip.
- **One light for all of it.** The metal gradient is anchored in user space
  rather than to each shape's own box; per-shape gradients made the thin hook
  come out nearly white beside the crimp.

The SVG is painted over the card's blank top strip, which is what lets the slot
be cut into the card at all.

`/experience/<slug>` is the same badge held to the left, with that role's details
beside it: what was worked on as numbered pieces, achievements when there are
any, the tools used, and links to the roles either side.

The badge is **sticky inside its own column**, not fixed. That matters: a fixed
badge has nothing to stop it and rides on over the contact section and the
footer. Sticky releases it at the foot of the details, which is where it should
stop. Two things are load-bearing for that — the column must not be
`items-start`, or it never stretches and the sticky child has no room to travel;
and nothing above it may set `overflow: hidden`, which switches sticky off
entirely. The section is padded by exactly `PIN_TOP`, so at scroll 0 the flowed
position and the stuck position are the same and nothing shifts on arrival.

### The badge and the details arrive together

Clicking a badge records where it was standing and hands straight over to that
role's page, which carries the movement on. **Both halves run on one timeline**:
the badge travels left from exactly where it was clicked while the details slide
in from the right, at the same time.

That is the whole reason for
[transition-context.jsx](components/experience/transition-context.jsx) and
[app/experience/layout.js](app/experience/layout.js). The origin is held in a
ref in a layout that wraps *both* pages, so it survives the route change where
component state on either page would not. Animating on the wall first and
navigating afterwards — the obvious approach — puts the route change *between*
the two halves, and they can never overlap.

Reading the origin decides where the badge starts; an origin that is stale, for
another role, or absent (a direct link, a reload, the back button) is ignored
and the page simply renders in place.

Measured over eight runs: the route swap lands at **+76ms**, then **21 frames
where the badge and the details are both moving**, with a median of **1 dropped
frame out of 73**.

Three things were needed to get there, each found by measuring rather than by
looking:

- **The animation waits two frames** after the page mounts. Starting it in the
  same breath as rendering and rasterising a whole new page competed with that
  work. Waiting costs nothing visually — the badge is sitting exactly where it
  was on the wall, so those frames read as the click landing.
- **Both halves are single promoted layers.** Staggering the cards inside the
  details meant several unpromoted subtrees animating within another animating
  subtree; they now arrive with the column that carries them.
- **The sway is held square** until the badge lands, so it matches the badge
  just left behind on the wall.

Both sides read [card-geometry.js](components/experience/card-geometry.js) for
where the badge comes to rest, so the start of the movement lines up with where
the badge actually was: measured offset **0–1px**.

Below 1024px there is no room for a column beside a 288px badge, so the badge
sits at the top with the details underneath and the click navigates plainly.
The same applies under `prefers-reduced-motion`.

Both pages are prerendered at build time from `experience` in
[lib/data.js](lib/data.js) — `generateStaticParams` enumerates the slugs and
`dynamicParams = false`, so only real roles resolve.

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

## The technology icon set

The shared database also carries a `tech_icons` table: 452 images on Cloudinary —
logos of languages, frameworks, databases, tools and protocols, plus photographs
of the microcontroller boards the robotics work runs on — each with a written
description at three lengths: one line, two or three lines, and an introduction
followed by at least three points (`long_description`, JSON). Nothing on the site
renders it yet; it is there for skill chips, stack lists and tool detail panels
to draw on.

Unlike certificates, papers and photographs, **these icons are public**: they are
vendor logos rather than documents of mine, so they sit under ordinary Cloudinary
delivery and `icon_url` can be used directly in an `<img>` or as a CSS
background — no signing, no media proxy. Most carry transparency; five
(`langchain`, `langgraph`, `nordic-nrf`, `rag`, `wifi`) are black line art and
will need inverting in dark mode.

The set is uploaded and written by `portfolio_admin` (`npm run icons:upload`,
`npm run icons:seed`); this app only reads it. The schema is duplicated in
[lib/db.js](lib/db.js), as with every other table.

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
  pipeline into optimised GLB in `public/models`; `--simplify <ratio>` adds
  error-bounded triangle collapse, which is worth it for hard-surface models
  whose detail is far denser than the size they are drawn at.

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
