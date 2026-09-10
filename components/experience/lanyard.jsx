import { CARD_W, STRAP_H } from "./card-geometry";

/**
 * The lanyard, drawn as one piece.
 *
 * Built as a single SVG rather than as separate boxes, because the whole point
 * is that the parts connect: the two fabric ribbons run *into* a metal crimp,
 * the crimp carries a split ring, and the ring passes *through* the slot
 * punched in the card. Drawing them separately is what makes a badge look like
 * three things resting near each other instead of one thing hanging.
 *
 * The overlap onto the card is deliberate — the SVG paints on top of it, so
 * the slot can be cut into the card and the ring threaded through it.
 */

/** Where the card's top edge falls inside the SVG's own coordinate space. */
const CARD_TOP = STRAP_H;
const OVERLAP = 30;
const H = STRAP_H + OVERLAP;

const MID = CARD_W / 2;

/**
 * One unbroken run of metal from the fabric to the card. Everything overlaps
 * its neighbour, because that is what makes it read as connected rather than
 * stacked:
 *
 *   ribbons  0 → 70   run *into* the crimp and stop inside it
 *   crimp   62 → 80   painted over the ribbon ends and the barrel's top
 *   barrel  78 → 94   the swivel the hook turns on
 *   hook    90 → 105  drops out of the barrel and into the slot
 *   card    88 →      the hook crosses its face on the way down
 *   slot    96 → 106  the hook's belly is redrawn inside this opening
 */
const RIBBON_END_Y = 64;
const CRIMP = { x: MID - 17, y: 56, w: 34, h: 17, r: 4 };
const BARREL = { x: MID - 9, y: 70, w: 18, h: 18, r: 7 };
const SLOT = { x: MID - 21, y: 96, w: 42, h: 12, r: 6 };

/**
 * The hook: straight down out of the barrel, round the bottom, and back up so
 * the tip finishes inside the slot. Stroked with a round cap rather than
 * filled, which is what gives it the heft of a bent rod.
 *
 * Nothing is drawn below the slot's lower lip — that is where it has passed
 * behind the card — so the whole path is clipped to that line.
 */
const HOOK = `M ${MID} 86 L ${MID} 100 Q ${MID} 107 ${MID + 8} 105.5 Q ${MID + 14} 104 ${MID + 13} 99`;
const HOOK_W = 6.5;
const HOOK_FLOOR = SLOT.y + SLOT.h;

export default function Lanyard({ id }) {
  const g = (name) => `${name}-${id}`;

  return (
    <svg
      className="idcard-lanyard"
      viewBox={`0 0 ${CARD_W} ${H}`}
      width={CARD_W}
      height={H}
      fill="none"
      aria-hidden
      focusable="false"
    >
      <defs>
        {/* Fabric: a fold of light down the middle of each ribbon. */}
        <linearGradient id={g("weave")} x1="0" y1="0" x2="1" y2="0">
          <stop offset="0%" stopColor="#000" stopOpacity="0.34" />
          <stop offset="38%" stopColor="#fff" stopOpacity="0.16" />
          <stop offset="62%" stopColor="#fff" stopOpacity="0.05" />
          <stop offset="100%" stopColor="#000" stopOpacity="0.28" />
        </linearGradient>

        {/* Brushed metal, lit from the top left. Anchored in user space rather
            than to each shape's own box, so the crimp, the barrel and the hook
            are lit by one light and read as a single run of metal — per-shape
            gradients make the thin hook come out nearly white beside them. */}
        <linearGradient
          id={g("metal")}
          gradientUnits="userSpaceOnUse"
          x1={MID - 22}
          y1={54}
          x2={MID + 20}
          y2={110}
        >
          <stop offset="0%" stopColor="#f2f5f9" />
          <stop offset="30%" stopColor="#c6cddA" />
          <stop offset="52%" stopColor="#98a2b1" />
          <stop offset="74%" stopColor="#b6bfcb" />
          <stop offset="100%" stopColor="#727c8a" />
        </linearGradient>

        {/* The same metal, one step darker, for the stretch inside the slot. */}
        <linearGradient
          id={g("ring")}
          gradientUnits="userSpaceOnUse"
          x1={MID - 22}
          y1={54}
          x2={MID + 20}
          y2={110}
        >
          <stop offset="0%" stopColor="#d5dbe4" />
          <stop offset="52%" stopColor="#828c9b" />
          <stop offset="100%" stopColor="#5f6875" />
        </linearGradient>

        {/* Softens the shadow the hardware casts onto the card. */}
        <filter id={g("drop")} x="-60%" y="-60%" width="220%" height="220%">
          <feDropShadow dy="2" stdDeviation="2" floodColor="#000" floodOpacity="0.42" />
        </filter>

        {/* The opening the hook is threaded through. */}
        <clipPath id={g("slot")}>
          <rect x={SLOT.x} y={SLOT.y} width={SLOT.w} height={SLOT.h} rx={SLOT.r} />
        </clipPath>

        {/* Stops the metal at the slot's lower lip, where it goes behind. */}
        <clipPath id={g("floor")}>
          <rect x="0" y="0" width={CARD_W} height={HOOK_FLOOR} />
        </clipPath>
      </defs>

      {/* ------------------------------- ribbons ---------------------------- */}
      {/* Left and right bands, each running from the top edge into the crimp,
          so the fabric visibly terminates inside the metal rather than at it. */}
      {[
        `M ${MID - 52} 0 L ${MID - 32} 0 L ${MID + 1} ${RIBBON_END_Y} L ${MID - 13} ${RIBBON_END_Y} Z`,
        `M ${MID + 32} 0 L ${MID + 52} 0 L ${MID + 13} ${RIBBON_END_Y} L ${MID - 1} ${RIBBON_END_Y} Z`,
      ].map((d, i) => (
        <g key={i}>
          <path d={d} className="idcard-ribbon-fill" />
          <path d={d} fill={`url(#${g("weave")})`} />
        </g>
      ))}

      {/* Stitching down each ribbon's edge. */}
      <g className="idcard-stitch">
        <path d={`M ${MID - 48} 0 L ${MID - 9.5} ${RIBBON_END_Y}`} />
        <path d={`M ${MID - 36} 0 L ${MID - 2.5} ${RIBBON_END_Y}`} />
        <path d={`M ${MID + 48} 0 L ${MID + 9.5} ${RIBBON_END_Y}`} />
        <path d={`M ${MID + 36} 0 L ${MID + 2.5} ${RIBBON_END_Y}`} />
      </g>

      {/* ------------------------- swivel barrel + hook ---------------------- */}
      {/* Drawn before the crimp and the slot so both can be painted over it —
          the crimp hides where it hangs from, the card's slot swallows where it
          ends. What stays visible is the run that crosses the card. */}
      <g filter={`url(#${g("drop")})`} clipPath={`url(#${g("floor")})`}>
        {/* The barrel a real hook swivels on, tucked under the crimp. */}
        <rect
          x={BARREL.x}
          y={BARREL.y}
          width={BARREL.w}
          height={BARREL.h}
          rx={BARREL.r}
          fill={`url(#${g("metal")})`}
          stroke="#414a57"
          strokeOpacity="0.55"
          strokeWidth="0.8"
        />
        {/* The hook: a bent rod out of the barrel, curling up into the slot.
            Its dark edge is laid down first and the metal drawn over it, so the
            bend stays legible against whatever is behind it. */}
        <path
          d={HOOK}
          stroke="#3c434f"
          strokeOpacity="0.7"
          strokeWidth={HOOK_W + 1.4}
          strokeLinecap="round"
        />
        <path
          d={HOOK}
          stroke={`url(#${g("metal")})`}
          strokeWidth={HOOK_W}
          strokeLinecap="round"
        />
      </g>

      {/* Light down the barrel and the hook's shank. */}
      <path
        d={`M ${BARREL.x + 4.5} ${BARREL.y + 4} V ${BARREL.y + BARREL.h - 4}`}
        stroke="#fdfdff"
        strokeOpacity="0.6"
        strokeWidth="1.5"
        strokeLinecap="round"
      />
      <path
        d={`M ${MID - 1.5} 88 L ${MID - 1.5} 99`}
        stroke="#fdfdff"
        strokeOpacity="0.5"
        strokeWidth="1.2"
        strokeLinecap="round"
      />

      {/* -------------------------------- crimp ----------------------------- */}
      {/* The metal sleeve clamping both ribbon ends, and the hole the ring
          hangs from — the ring's top disappears behind it. */}
      <g filter={`url(#${g("drop")})`}>
        <rect
          x={CRIMP.x}
          y={CRIMP.y}
          width={CRIMP.w}
          height={CRIMP.h}
          rx={CRIMP.r}
          fill={`url(#${g("metal")})`}
        />
        {/* Crimped seam across the middle, and the two press marks. */}
        <path
          d={`M ${CRIMP.x + 4} ${CRIMP.y + 9} H ${CRIMP.x + CRIMP.w - 4}`}
          stroke="#5b6472"
          strokeOpacity="0.55"
          strokeWidth="1"
        />
        <circle cx={CRIMP.x + 8} cy={CRIMP.y + 4.5} r="1.1" fill="#5b6472" fillOpacity="0.5" />
        <circle
          cx={CRIMP.x + CRIMP.w - 8}
          cy={CRIMP.y + 4.5}
          r="1.1"
          fill="#5b6472"
          fillOpacity="0.5"
        />
        <rect
          x={CRIMP.x}
          y={CRIMP.y}
          width={CRIMP.w}
          height={CRIMP.h}
          rx={CRIMP.r}
          stroke="#414a57"
          strokeOpacity="0.6"
          strokeWidth="0.8"
        />
      </g>

      {/* ------------------------------- the slot ---------------------------- */}
      {/* Punched through the card. Filled with the page behind it and then
          darkened, because a hole in a card is in shadow — without that it
          reads as a printed shape rather than an opening. */}
      <rect
        x={SLOT.x}
        y={SLOT.y}
        width={SLOT.w}
        height={SLOT.h}
        rx={SLOT.r}
        className="idcard-slot"
      />
      <rect
        x={SLOT.x}
        y={SLOT.y}
        width={SLOT.w}
        height={SLOT.h}
        rx={SLOT.r}
        className="idcard-slot-shade"
      />
      {/* The card's thickness, cut through: dark under the top lip. */}
      <path
        d={`M ${SLOT.x + 4} ${SLOT.y + 1.1} H ${SLOT.x + SLOT.w - 4}`}
        className="idcard-slot-cut"
        strokeWidth="1.6"
        strokeLinecap="round"
      />

      {/* The hook, re-drawn inside the opening only. This is the whole trick:
          above the slot the hook lies on the card, inside the slot it is seen
          through the hole, and there is nothing below because the bend has
          gone behind the card. */}
      <g clipPath={`url(#${g("slot")})`}>
        <path
          d={HOOK}
          stroke={`url(#${g("ring")})`}
          strokeWidth={HOOK_W}
          strokeLinecap="round"
        />
        {/* Dimmed, because inside the slot it sits in the card's shadow. */}
        <path
          d={HOOK}
          stroke="#000"
          strokeOpacity="0.4"
          strokeWidth={HOOK_W}
          strokeLinecap="round"
        />
      </g>

      {/* The cut edge of the card catches light along the slot's lower lip,
          in front of the ring, which sets the ring behind the card. */}
      <path
        d={`M ${SLOT.x + 4} ${SLOT.y + SLOT.h - 0.7} H ${SLOT.x + SLOT.w - 4}`}
        className="idcard-slot-lip"
        strokeWidth="1.1"
        strokeLinecap="round"
      />
    </svg>
  );
}

export { CARD_TOP, H as LANYARD_H };
