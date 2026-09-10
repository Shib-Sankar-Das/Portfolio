import Image from "next/image";
import Lanyard from "./lanyard";
import { CARD_H, CARD_W, STRAP_H } from "./card-geometry";

// Same cutout the About section uses; the version query is what invalidates
// the optimizer when the file behind the name changes.
const PHOTO = "/images/profile-cutout.png?v=3";

/**
 * One role, drawn as the ID badge you would have been given on the first day:
 * a lanyard, a clip, a punched card with a photograph, and the role, employer
 * and dates printed on it.
 *
 * Presentational and server-renderable — both the wall of badges and the detail
 * page render this same component, which is why a badge can appear to travel
 * between the two pages without changing at all.
 */
export default function IdCard({
  job,
  name,
  swayDelay = 0,
  still = false,
  // The badge in flight is a second copy of one already in the DOM; this keeps
  // the gradient ids inside its lanyard from colliding with the original's.
  variant = "",
}) {
  return (
    <div
      className={`idcard-hang${still ? " is-still" : ""}`}
      style={{ "--badge": job.accent, "--sway-delay": `${swayDelay}s` }}
    >
      {/* The card sits below the strap's height; the lanyard is painted over
          the top of it, which is what lets the ring thread through the slot. */}
      <div className="idcard-rig" style={{ paddingTop: STRAP_H }}>
        <Lanyard id={variant ? `${job.slug}-${variant}` : job.slug} />

        {/* ------------------------------ the card -------------------------- */}
        <div
          className={`idcard-body${variant === "flight" ? " is-flying" : ""}`}
          style={{ width: CARD_W, height: CARD_H }}
        >
        {/* Employer band across the top, in the role's own colour */}
        <div className="idcard-band">
          <span className="truncate">{job.company}</span>
        </div>

        {/* Photograph */}
        <div className="idcard-photo">
          <Image
            src={PHOTO}
            alt={name}
            width={CARD_W}
            height={CARD_W}
            sizes="288px"
            className="h-full w-full object-cover object-top"
            priority
          />
        </div>

        {/* Printed details */}
        <div className="idcard-print">
          <p className="idcard-name">{name}</p>
          <p className="idcard-role">{job.role}</p>

          <div className="idcard-rule" aria-hidden />

          <dl className="idcard-meta">
            <div>
              <dt>Employer</dt>
              <dd className="truncate">{job.company}</dd>
            </div>
            <div>
              <dt>Dates</dt>
              <dd className="font-mono text-[11px]">{job.period}</dd>
            </div>
          </dl>
        </div>

          {/* The strip every real badge has along the bottom */}
          <div className="idcard-footer">
            <span className="idcard-barcode" aria-hidden />
            <span className="idcard-type">{job.type}</span>
          </div>
        </div>
      </div>
    </div>
  );
}
