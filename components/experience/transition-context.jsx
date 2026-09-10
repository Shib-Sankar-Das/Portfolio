"use client";

import { createContext, useContext, useRef } from "react";

/**
 * Carries where a badge was standing when it was clicked, across the route
 * change into that role's page.
 *
 * This lives in `app/experience/layout.js`, which wraps both the wall and the
 * detail pages — so navigating between them keeps this mounted and the value
 * survives, where component state on either page would not.
 *
 * It is a ref rather than state on purpose: writing it must not re-render the
 * page that is on its way out.
 */
const FlightOrigin = createContext(null);

export function ExperienceTransition({ children }) {
  const origin = useRef(null); // { slug, rect, at }
  return <FlightOrigin.Provider value={origin}>{children}</FlightOrigin.Provider>;
}

export function useFlightOrigin() {
  return useContext(FlightOrigin);
}

/** Stale origins are ignored, so a bookmark or a reload never replays a flight. */
export const ORIGIN_TTL = 1500;
