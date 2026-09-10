// ---------------------------------------------------------------------------
// The one place the badge's size and its resting spot are defined.
//
// The list page flies a clicked badge to `pinnedRect()`, and the detail page
// pins its badge at exactly the same coordinates. Both read these numbers, so
// the badge lands where the next page is already going to draw it and the
// route change happens underneath a picture that has not moved.
// ---------------------------------------------------------------------------

/** Badge body, in px. Identical on both pages, so the flight never scales. */
export const CARD_W = 288;
export const CARD_H = 408;

/** The lanyard drawn above the body. */
export const STRAP_H = 88;

/** Everything, strap included. */
export const HANG_H = STRAP_H + CARD_H;

/** Below this the layout stacks and the flight is replaced by a fade. */
export const SIDE_BY_SIDE = 1024;

/** Gap between the pinned badge and the details beside it. */
export const COLUMN_GAP = 72;

/** Content container: max-w-6xl (72rem) with px-6, matching the pages. */
const MAX_W = 1152;
const PAD_X = 24;

/**
 * How far below the viewport top the badge rests: clear of the 64px navbar,
 * with room to breathe. The detail page pads its first section by exactly this
 * and sticks the badge at it, so at scroll 0 the sticky position and the flowed
 * position are the same and nothing shifts on arrival.
 */
export const PIN_TOP = 112;

/**
 * Where the badge comes to rest on a detail page.
 *
 * This has to *predict* what that page's CSS will do, because the wall needs
 * the coordinates before that page exists. It is the content-box left edge of a
 * centred `max-w-6xl px-6` container — which is where the detail page's left
 * column starts.
 */
export function pinnedRect(viewportWidth) {
  const container = Math.min(viewportWidth, MAX_W);
  return {
    left: Math.round((viewportWidth - container) / 2) + PAD_X,
    top: PIN_TOP,
    width: CARD_W,
  };
}
