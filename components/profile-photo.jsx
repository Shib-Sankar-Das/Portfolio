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
 * 1. accent glow — theme-colored radial wash behind the card (the original
 *    photo background is never shown, only the cutout subject);
 * 2. .about-photo-frame — glass slab (backdrop-filter) with layered shadows,
 *    recessed in 3D space;
 * 3. .about-photo-subject — alpha-matted cutout (public/images/profile-cutout.png,
 *    generated with rembg) raised toward the viewer, head overlapping the frame.
 * The stack tilts toward the pointer (perspective + preserve-3d), so the
 * subject visibly parallaxes over the recessed frame.
 */
export default function ProfilePhoto() {
  const ref = useRef(null);
  const rotateX = useSpring(useMotionValue(REST_X), SPRING);
  const rotateY = useSpring(useMotionValue(REST_Y), SPRING);

  function handleMove(e) {
    const node = ref.current;
    if (!node) return;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    const rect = node.getBoundingClientRect();
    const px = (e.clientX - rect.left) / rect.width - 0.5;
    const py = (e.clientY - rect.top) / rect.height - 0.5;
    rotateY.set(REST_Y + px * 16);
    rotateX.set(REST_X - py * 16);
  }

  function handleLeave() {
    rotateX.set(REST_X);
    rotateY.set(REST_Y);
  }

  return (
    <div
      className="mx-auto w-full max-w-[270px] sm:max-w-[320px] lg:max-w-[360px]"
      style={{ perspective: "1100px" }}
    >
      <m.div
        ref={ref}
        onPointerMove={handleMove}
        onPointerLeave={handleLeave}
        whileHover={{ scale: 1.03 }}
        transition={{ type: "spring", stiffness: 220, damping: 20 }}
        style={{ rotateX, rotateY, transformStyle: "preserve-3d" }}
        className="relative aspect-[4/5]"
      >
        {/* Accent glow behind the card (theme-colored, no photo background) */}
        <div
          className="absolute inset-0 -z-10 rounded-[3rem]"
          style={{ background: "radial-gradient(circle at 50% 45%, var(--glow), transparent 72%)", filter: "blur(30px)", transform: "scale(1.15)" }}
          aria-hidden
        />

        {/* Glass slab behind the subject (recessed in 3D space) */}
        <div
          className="about-photo-frame absolute inset-x-0 bottom-0 top-[22%] rounded-[2rem] border border-line"
          style={{ transform: "translateZ(-40px)" }}
          aria-hidden
        />

        {/* Alpha-matted subject — pops out over the frame */}
        <div
          className="about-photo-subject absolute inset-0"
          style={{ transform: "translateZ(30px)" }}
        >
          <Image
            src={CUTOUT}
            alt={`Portrait of ${profile.name}`}
            fill
            sizes="(max-width: 640px) 270px, (max-width: 1024px) 320px, 360px"
            className="object-cover object-top"
          />
        </div>
      </m.div>
    </div>
  );
}
