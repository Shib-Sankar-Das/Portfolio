"use client";

import { useCallback, useEffect, useLayoutEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { AnimatePresence, m } from "framer-motion";
import { ChevronLeft, ChevronRight, MapPin, X } from "lucide-react";
import { formatCaptionDate } from "@/lib/gallery-format";

/** Frame border and mount width, in px, for the opened print. */
const INSET = { open: { frame: 7, mount: 26 }, small: { frame: 5, mount: 14 } };

/**
 * Responsive sizes for the two places a photograph is drawn.
 *
 * Both draw from the same `srcSet`, so the wall's chosen file is already in the
 * cache when the print travels forward — an empty mount for the length of the
 * zoom would give the whole effect away. The larger file the opened view asks
 * for fades in over it as it arrives, which reads as the picture coming into
 * focus rather than as a loading state.
 */
const WALL_SIZES =
  "(min-width: 1440px) 22vw, (min-width: 1024px) 30vw, (min-width: 560px) 45vw, 88vw";
const OPEN_SIZES = "(min-width: 640px) 84vw, 94vw";

/**
 * The print coming forward off the wall.
 *
 * A spring rather than a tween: a tween of a fixed duration has to cover very
 * different distances at the same rate — a small frame in the corner travels
 * three times as far as one already near the middle — and it arrives with the
 * same abrupt stop either way. This is damped just short of critical, so it
 * carries its own weight and settles rather than stopping dead, and it never
 * overshoots, which a hanging picture should not do.
 */
const TRAVEL = { type: "spring", stiffness: 195, damping: 26, mass: 1 };

/** Going back is quicker than coming forward, as a dismissal should be. */
const RETURN = { duration: 0.42, ease: [0.42, 0, 0.3, 1] };

/** Walking to the next print: it resolves in place, it does not travel. */
const CROSSFADE = { duration: 0.34, ease: "easeOut" };

/**
 * A salon-hung wall of photographs.
 *
 * Two things make it a gallery rather than a grid. Every frame is cut to its
 * own photograph — the mount takes the picture's shape, so nothing is ever
 * cropped — and the hang is deliberately uneven: prints are made at different
 * sizes and nudged off the line, the way a real salon wall is hung.
 *
 * Clicking a frame does not open a lightbox on top of the wall; the wall itself
 * falls back and blurs while the chosen print travels forward from exactly
 * where it hung, ending framed and centred with its label underneath.
 */
export default function GalleryWall({ photos }) {
  const [openId, setOpenId] = useState(null);
  const frames = useRef(new Map());

  const index = photos.findIndex((p) => p.id === openId);
  const photo = index >= 0 ? photos[index] : null;

  const open = useCallback((id) => setOpenId(id), []);
  const close = useCallback(() => setOpenId(null), []);
  const step = useCallback(
    (delta) => {
      setOpenId((current) => {
        const i = photos.findIndex((p) => p.id === current);
        if (i === -1) return current;
        return photos[(i + delta + photos.length) % photos.length].id;
      });
    },
    [photos]
  );

  return (
    <>
      {/* The whole hang recedes while a photograph is forward. */}
      <div className={`gal-recede ${photo ? "gal-recede-active" : ""}`} aria-hidden={!!photo}>
        <div className="gal-columns">
          {photos.map((p, i) => (
            <Hang
              key={p.id}
              photo={p}
              index={i}
              onOpen={open}
              register={(el) => {
                if (el) frames.current.set(p.id, el);
                else frames.current.delete(p.id);
              }}
            />
          ))}
        </div>
      </div>

      <AnimatePresence>
        {photo && (
          <Viewer
            photo={photo}
            position={`${index + 1} / ${photos.length}`}
            frames={frames}
            onClose={close}
            onStep={step}
          />
        )}
      </AnimatePresence>
    </>
  );
}

/* -------------------------------------------------------------------------- */
/*  One framed print on the wall                                              */
/* -------------------------------------------------------------------------- */

function Hang({ photo, index, onOpen, register }) {
  // Deterministic variation: prints are made at different sizes, hung a little
  // off the line and not all flush to the same edge. Derived from the index so
  // the wall is identical on the server and in the browser.
  const nudge = ["0rem", "clamp(0.6rem, 2.4vw, 2.1rem)", "clamp(0.3rem, 1.2vw, 1rem)"][index % 3];
  const alignRight = index % 4 === 1 || index % 7 === 3;

  return (
    <div
      className="gal-item relative"
      style={{
        width: `${Math.round(photo.scale * 100)}%`,
        marginTop: nudge,
        marginLeft: alignRight ? "auto" : undefined,
        marginRight: alignRight ? undefined : "auto",
      }}
    >
      <button
        type="button"
        ref={register}
        onClick={() => onOpen(photo.id)}
        aria-label={`View ${photo.title}${photo.country ? ` — ${photo.country}` : ""}`}
        className="gal-hang group block w-full cursor-zoom-in text-left focus:outline-none focus-visible:outline-2 focus-visible:outline-offset-8 focus-visible:outline-accent"
      >
        {/* Wall wash behind the frame */}
        <span className="gal-glow pointer-events-none absolute -inset-8 -z-10 block" aria-hidden />

        <span className="gal-frame block">
          <span className="gal-mount block">
            <span
              className="gal-window relative block overflow-hidden"
              style={{ aspectRatio: photo.aspect }}
            >
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={photo.src}
                srcSet={photo.srcSet}
                sizes={WALL_SIZES}
                alt={photo.title}
                className="absolute inset-0 h-full w-full object-cover"
                loading={index < 4 ? "eager" : "lazy"}
                decoding="async"
                draggable={false}
                onContextMenu={(e) => e.preventDefault()}
              />

              {/* Gallery label, printed over the foot of the print on hover */}
              <span className="gal-caption absolute inset-x-0 bottom-0 block px-3 pb-2.5 pt-8">
                <span className="block truncate text-[13px] font-medium leading-snug text-white">
                  {photo.title}
                </span>
                {(photo.country || photo.date) && (
                  <span className="mt-0.5 block truncate text-[10px] uppercase tracking-[0.18em] text-white/70">
                    {[photo.country, formatCaptionDate(photo.date)].filter(Boolean).join(" · ")}
                  </span>
                )}
              </span>
            </span>
          </span>
        </span>
      </button>
    </div>
  );
}

/* -------------------------------------------------------------------------- */
/*  The opened photograph                                                     */
/* -------------------------------------------------------------------------- */

/**
 * Sizes the framed print to the space above the label, then works out the
 * transform that would put it back exactly where it hangs on the wall. The
 * print animates *from* that transform, so it reads as the room pushing in on
 * the picture rather than a panel appearing over it.
 */
function Viewer({ photo, position, frames, onClose, onStep }) {
  const [box, setBox] = useState(null);
  const [flip, setFlip] = useState(null);
  // Which print is decoded, rather than a boolean — walking to the next
  // photograph must not show its frame as loaded before it actually is.
  const [loadedId, setLoadedId] = useState(null);
  const sharp = loadedId === photo.id;
  // True once the print has finished travelling, so the swap to the
  // full-resolution file never happens mid-flight.
  const [landed, setLanded] = useState(false);
  const stageRef = useRef(null);
  // Which print the viewer was opened on — only that one travels in from the wall.
  const openedOn = useRef(photo.id);
  const firstOpen = openedOn.current === photo.id;

  /**
   * Fits the print to the stage and works out the transform that would put it
   * back exactly where it hangs.
   *
   * This is a layout effect, and the viewer deliberately has no "mounted" gate
   * in front of it: gating on a state flag set in an effect costs two frames
   * before the print is drawn, during which the wall has already begun to
   * recede — the picture appears to arrive late to its own animation. The
   * viewer only ever renders in response to a click, so the document is always
   * there and measuring before the first paint is safe.
   */
  useLayoutEffect(() => {
    const stage = stageRef.current;
    if (!stage) return;

    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

    function fit() {
      const rect = stage.getBoundingClientRect();
      // The stage is padded to keep the arrows off the picture, and that
      // padding is not room the frame can use — measuring the border box here
      // would hand the print a width the flex row then squeezes back out of it,
      // which shows up as a subtly distorted photograph.
      const style = getComputedStyle(stage);
      const availW =
        rect.width - parseFloat(style.paddingLeft) - parseFloat(style.paddingRight);
      const availH =
        rect.height - parseFloat(style.paddingTop) - parseFloat(style.paddingBottom);
      if (availW < 40 || availH < 40) return;

      const { frame, mount } = window.innerWidth < 640 ? INSET.small : INSET.open;
      const inset = frame + mount;

      const scale = Math.min(
        (availW - inset * 2) / photo.width,
        (availH - inset * 2) / photo.height
      );
      const imageW = Math.max(1, photo.width * scale);
      const imageH = Math.max(1, photo.height * scale);
      const next = {
        frame,
        mount,
        imageW,
        imageH,
        width: imageW + inset * 2,
        height: imageH + inset * 2,
      };
      setBox(next);

      // Where the frame will sit, versus where it hangs: the difference is the
      // transform the print starts from.
      const from = frames.current.get(photo.id)?.getBoundingClientRect() ?? null;
      const targetX = rect.left + rect.width / 2;
      const targetY = rect.top + rect.height / 2;
      const onScreen =
        from && from.bottom > 0 && from.top < window.innerHeight && from.width > 0;

      setFlip(
        onScreen && !reduced
          ? {
              x: from.left + from.width / 2 - targetX,
              y: from.top + from.height / 2 - targetY,
              scale: from.width / next.width,
            }
          : { x: 0, y: 0, scale: reduced ? 1 : 0.94 }
      );
    }

    fit();

    // The frame on the wall is still carrying its hover lift when it is
    // measured. Once the pointer has left and that has settled, measure again,
    // so closing lands the print back on its frame rather than 8px above it.
    const settle = setTimeout(fit, 560);

    const observer = new ResizeObserver(fit);
    observer.observe(stage);
    window.addEventListener("resize", fit);
    return () => {
      clearTimeout(settle);
      observer.disconnect();
      window.removeEventListener("resize", fit);
    };
  }, [photo, frames]);

  // The spring's tail is long and visually inert — by this point the print has
  // covered almost all of its distance. Releasing the full-resolution request
  // here keeps the fetch out of the part of the move the eye is actually
  // following, without making the picture wait for the spring to finish
  // settling. It is also the backstop for reduced motion, where there is no
  // travel to complete and onAnimationComplete may never fire at all.
  useEffect(() => {
    const timer = setTimeout(() => setLanded(true), 480);
    return () => clearTimeout(timer);
  }, []);

  useEffect(() => {
    function onKey(e) {
      if (e.key === "Escape") onClose();
      else if (e.key === "ArrowRight") onStep(1);
      else if (e.key === "ArrowLeft") onStep(-1);
    }
    window.addEventListener("keydown", onKey);
    const previous = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      window.removeEventListener("keydown", onKey);
      document.body.style.overflow = previous;
    };
  }, [onClose, onStep]);

  const dateLabel = formatCaptionDate(photo.date);

  return createPortal(
    <m.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0, transition: { duration: 0.3, ease: "easeIn" } }}
      // The room dims at the pace the picture rises, rather than snapping dark
      // first and then moving the print through an already-black frame.
      transition={{ duration: 0.5, ease: "easeOut" }}
      role="dialog"
      aria-modal="true"
      aria-label={photo.title}
      className="fixed inset-0 z-[120] flex flex-col items-center bg-[#0b0a09]/88 px-3 pb-4 pt-14 backdrop-blur-2xl sm:px-8 sm:pb-7 sm:pt-16"
      onClick={(e) => e.target === e.currentTarget && onClose()}
    >
      <button
        type="button"
        onClick={onClose}
        aria-label="Back to the wall"
        className="absolute right-3 top-3 z-30 flex h-10 w-10 items-center justify-center rounded-full bg-white/10 text-white transition-colors hover:bg-white/25 sm:right-6 sm:top-5"
      >
        <X size={18} />
      </button>

      <span className="absolute left-4 top-5 z-30 font-mono text-[11px] tracking-[0.2em] text-white/45 sm:left-8">
        {position}
      </span>

      {/* Stage: everything above the label */}
      {/* Side gutters keep the walk-the-wall arrows off the picture, however
          wide the print is. */}
      <div
        ref={stageRef}
        className="relative flex min-h-0 w-full flex-1 items-center justify-center sm:px-16"
        onClick={(e) => e.target === e.currentTarget && onClose()}
      >
        {box && flip && (
          <m.div
            key={photo.id}
            // The print that was clicked travels from where it hangs; a print
            // reached with the arrow keys simply resolves in place, because the
            // wall behind is already blurred and its origin would read as noise.
            //
            // It starts fully opaque: at the first frame it sits exactly on top
            // of its own frame on the wall, so there is nothing to fade in — the
            // picture simply lifts off. Fading it up from transparent is what
            // makes a zoom look like a dialog opening instead.
            initial={
              firstOpen
                ? { x: flip.x, y: flip.y, scale: flip.scale, opacity: 1 }
                : { scale: 0.965, opacity: 0 }
            }
            animate={{ x: 0, y: 0, scale: 1, opacity: 1 }}
            exit={{
              x: flip.x,
              y: flip.y,
              scale: flip.scale,
              opacity: 0,
              transition: RETURN,
            }}
            transition={firstOpen ? TRAVEL : CROSSFADE}
            onAnimationComplete={() => setLanded(true)}
            style={{
              width: box.width,
              height: box.height,
              padding: box.frame,
              // Its own compositor layer for the length of the move: the frame
              // carries four stacked shadows, and re-rasterising those on every
              // frame of a scale is exactly the kind of work that shows.
              willChange: "transform",
              backfaceVisibility: "hidden",
            }}
            className="gal-frame shrink-0"
          >
            <div className="gal-mount h-full w-full" style={{ padding: box.mount }}>
              <div className="gal-window relative h-full w-full overflow-hidden">
                {/* The wall's own file: already in the cache, so the print is
                    never an empty mount while it travels. */}
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={photo.src}
                  srcSet={photo.srcSet}
                  sizes={WALL_SIZES}
                  alt=""
                  aria-hidden
                  className="absolute inset-0 h-full w-full scale-[1.03] object-cover blur-[1.5px]"
                  draggable={false}
                />
                {/* The full-resolution print, focusing in over it.
                    It is not requested until the travel is over. Fetching and
                    decoding a multi-megapixel image is real main-thread work,
                    and landing it in the middle of the move costs frames right
                    where the eye is following the picture. The wall's own file
                    is already on screen, so nothing is missing meanwhile. */}
                {landed && (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    key={photo.id}
                    src={photo.src}
                    srcSet={photo.srcSet}
                    sizes={OPEN_SIZES}
                    alt={photo.title}
                    decoding="async"
                    onLoad={() => setLoadedId(photo.id)}
                    className={`absolute inset-0 h-full w-full object-cover transition-opacity duration-500 ${
                      sharp ? "opacity-100" : "opacity-0"
                    }`}
                    draggable={false}
                    onContextMenu={(e) => e.preventDefault()}
                  />
                )}
              </div>
            </div>
          </m.div>
        )}

        {/* Walk the wall */}
        <button
          type="button"
          onClick={() => onStep(-1)}
          aria-label="Previous photograph"
          className="absolute left-0 top-1/2 z-20 flex h-11 w-11 -translate-y-1/2 items-center justify-center rounded-full bg-white/10 text-white transition-colors hover:bg-white/25"
        >
          <ChevronLeft size={20} />
        </button>
        <button
          type="button"
          onClick={() => onStep(1)}
          aria-label="Next photograph"
          className="absolute right-0 top-1/2 z-20 flex h-11 w-11 -translate-y-1/2 items-center justify-center rounded-full bg-white/10 text-white transition-colors hover:bg-white/25"
        >
          <ChevronRight size={20} />
        </button>
      </div>

      {/* The label, hung under the picture the way a gallery hangs one */}
      <m.div
        key={photo.id}
        initial={{ opacity: 0, y: 14 }}
        animate={{ opacity: 1, y: 0 }}
        // Hung after the picture has all but arrived, the way a label is read
        // second.
        transition={{ delay: 0.3, duration: 0.42, ease: "easeOut" }}
        // A gallery label is hung to the picture, not to the room: it takes the
        // frame's width, within readable bounds.
        style={box ? { maxWidth: Math.min(Math.max(box.width, 300), 620) } : undefined}
        className="gal-plate mt-4 max-h-[36vh] w-full shrink-0 overflow-y-auto rounded-[3px] px-5 py-3.5 sm:mt-6 sm:px-7 sm:py-4"
      >
        {(photo.country || photo.place) && (
          <p className="flex items-center gap-1.5 text-[10px] font-semibold uppercase tracking-[0.26em] text-stone-500">
            <MapPin size={11} className="shrink-0" />
            {[photo.country, photo.place].filter(Boolean).join(" · ")}
          </p>
        )}

        <h2 className="mt-1.5 text-base font-semibold leading-snug text-stone-900 sm:text-lg">
          {photo.title}
        </h2>

        {(photo.event || dateLabel) && (
          <p className="mt-1 text-[13px] font-medium text-stone-600">
            {[photo.event, dateLabel].filter(Boolean).join(" · ")}
          </p>
        )}

        {photo.story && (
          <p className="mt-2 border-t border-stone-900/10 pt-2 text-[12.5px] leading-relaxed text-stone-600">
            {photo.story}
          </p>
        )}
      </m.div>

      <p className="mt-2.5 shrink-0 text-center text-[11px] text-white/40">
        ← → to walk the wall · Esc to step back
      </p>
    </m.div>,
    document.body
  );
}
