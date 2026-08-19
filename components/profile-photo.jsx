"use client";

import { useRef } from "react";
import Image from "next/image";
import { m, useMotionValue, useSpring } from "framer-motion";
import { profile } from "@/lib/data";

// Resting pose: a subtle off-axis rotation so the card reads as 3D even
// before the pointer interacts with it.
const REST_X = 4;
const REST_Y = -7;
const SPRING = { stiffness: 160, damping: 18, mass: 0.6 };

// Bump this whenever profile-cutout.png is replaced — the filename stays the
// same, so the version query is what invalidates the image-optimizer and
// browser caches.
const IMG_VERSION = "?v=3";
const CUTOUT = `/images/profile-cutout.png${IMG_VERSION}`;

/**
 * About-section portrait with a pop-out effect, layered back-to-front:
 * 1. accent glow — theme-colored radial wash behind the card;
 * 2. .about-photo-frame — glass slab (backdrop-filter) with layered shadows;
 * 3. .about-photo-subject — alpha-matted cutout (public/images/profile-cutout.png,
 *    generated with rembg), head overlapping the frame.
 * The pointer is tracked on the whole area, but ONLY the glow + frame group
 * tilts and scales toward it — the subject stays perfectly still, so the box
 * appears to swivel behind a steady portrait.
 */
export default function ProfilePhoto() {
  const ref = useRef(null);
  const rotateX = useSpring(useMotionValue(REST_X), SPRING);
  const rotateY = useSpring(useMotionValue(REST_Y), SPRING);
  const scale = useSpring(useMotionValue(1), { stiffness: 220, damping: 20 });

  function reducedMotion() {
    return window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  }

  function handleMove(e) {
    const node = ref.current;
    if (!node || reducedMotion()) return;
    const rect = node.getBoundingClientRect();
    const px = (e.clientX - rect.left) / rect.width - 0.5;
    const py = (e.clientY - rect.top) / rect.height - 0.5;
    rotateY.set(REST_Y + px * 16);
    rotateX.set(REST_X - py * 16);
  }

  function handleEnter() {
    if (reducedMotion()) return;
    scale.set(1.04);
  }

  function handleLeave() {
    rotateX.set(REST_X);
    rotateY.set(REST_Y);
    scale.set(1);
  }

  return (
    <div
      ref={ref}
      onPointerMove={handleMove}
      onPointerEnter={handleEnter}
      onPointerLeave={handleLeave}
      className="mx-auto w-full max-w-[270px] sm:max-w-[320px] lg:max-w-[360px]"
      style={{ perspective: "1100px" }}
    >
      <div className="relative aspect-[4/5]">
        {/* Interactive box: glow + glass frame tilt toward the pointer */}
        <m.div
          style={{ rotateX, rotateY, scale, transformStyle: "preserve-3d" }}
          className="absolute inset-0"
          aria-hidden
        >
          {/* Accent glow behind the card (theme-colored) */}
          <div
            className="absolute inset-0 -z-10 rounded-[3rem]"
            style={{ background: "radial-gradient(circle at 50% 45%, var(--glow), transparent 72%)", filter: "blur(30px)", transform: "scale(1.15)" }}
          />

          {/* Glass slab with layered shadows (recessed in 3D space) */}
          <div
            className="about-photo-frame absolute inset-x-0 bottom-0 top-[22%] rounded-[2rem] border border-line"
            style={{ transform: "translateZ(-40px)" }}
          />
        </m.div>

        {/* Alpha-matted subject — static, never affected by the tilt */}
        <div className="about-photo-subject absolute inset-0">
          <Image
            src={CUTOUT}
            alt={`Portrait of ${profile.name}`}
            fill
            sizes="(max-width: 640px) 270px, (max-width: 1024px) 320px, 360px"
            className="object-cover object-top"
          />
        </div>
      </div>
    </div>
  );
}
