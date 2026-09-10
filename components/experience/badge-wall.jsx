"use client";

import { useCallback, useRef } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import IdCard from "./id-card";
import { SIDE_BY_SIDE } from "./card-geometry";
import { useFlightOrigin } from "./transition-context";

/**
 * The badges, hanging in a row.
 *
 * Clicking one records where it is standing and hands straight over to that
 * role's page, which carries the movement on: the badge travels to the left
 * from exactly this spot while the details arrive on the right *at the same
 * time*. Animating here first and navigating afterwards is what made the two
 * halves happen one after the other — the route change sat between them, so
 * they could never overlap.
 *
 * Below the side-by-side breakpoint, and under reduced motion, the click is an
 * ordinary link.
 */
export default function BadgeWall({ roles, name }) {
  const router = useRouter();
  const origin = useFlightOrigin();
  const wrappers = useRef(new Map());

  const prefetch = useCallback(
    (slug) => router.prefetch(`/experience/${slug}`),
    [router]
  );

  const open = useCallback(
    (event, job) => {
      const canFly =
        window.innerWidth >= SIDE_BY_SIDE &&
        !window.matchMedia("(prefers-reduced-motion: reduce)").matches;
      const el = wrappers.current.get(job.slug);
      if (!canFly || !el || !origin) return; // an ordinary link

      // The wrapper is measured, not the badge inside it: the hover lift and
      // the sway are transforms on a descendant, and a transform does not move
      // an ancestor's box — so this is the badge's true resting place.
      origin.current = { slug: job.slug, rect: el.getBoundingClientRect(), at: Date.now() };

      // Let the link navigate normally from here; the next page does the rest.
    },
    [origin]
  );

  return (
    <ul className="flex flex-wrap justify-center gap-x-10 gap-y-14 sm:gap-x-14">
      {roles.map((job, i) => (
        <li key={job.slug}>
          <Link
            href={`/experience/${job.slug}`}
            onClick={(e) => open(e, job)}
            onPointerEnter={() => prefetch(job.slug)}
            onFocus={() => prefetch(job.slug)}
            aria-label={`${job.role} at ${job.company} — read the details`}
            className="idcard-pick block rounded-2xl focus:outline-none focus-visible:outline-2 focus-visible:outline-offset-8 focus-visible:outline-accent"
          >
            <div
              ref={(el) => {
                if (el) wrappers.current.set(job.slug, el);
                else wrappers.current.delete(job.slug);
              }}
            >
              <IdCard job={job} name={name} swayDelay={i * 0.9} />
            </div>
          </Link>
        </li>
      ))}
    </ul>
  );
}
