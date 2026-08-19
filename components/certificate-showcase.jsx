"use client";

import { useRef } from "react";
import { m, useMotionValue, useSpring } from "framer-motion";
import { CertificateArtwork } from "./certificate-frame";

const SPRING = { stiffness: 150, damping: 18, mass: 0.6 };

/**
 * The hero frame on a certificate detail page: tilts toward the pointer in 3D
 * while the glazing sheen sweeps across the glass.
 */
export default function CertificateShowcase({ cert }) {
  const ref = useRef(null);
  const rotateX = useSpring(useMotionValue(0), SPRING);
  const rotateY = useSpring(useMotionValue(0), SPRING);

  function handleMove(e) {
    const node = ref.current;
    if (!node) return;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    const rect = node.getBoundingClientRect();
    rotateY.set(((e.clientX - rect.left) / rect.width - 0.5) * 14);
    rotateX.set(-((e.clientY - rect.top) / rect.height - 0.5) * 14);
  }

  function reset() {
    rotateX.set(0);
    rotateY.set(0);
  }

  return (
    <div
      ref={ref}
      onPointerMove={handleMove}
      onPointerLeave={reset}
      style={{ perspective: "1200px" }}
      className="group"
    >
      <div className="cert-picture-light pointer-events-none h-10 w-full opacity-40" aria-hidden />
      <m.div
        style={{ rotateX, rotateY, transformStyle: "preserve-3d" }}
        className="cert-frame"
      >
        <div className="cert-mat">
          <div
            className="cert-glass relative aspect-[4/3] overflow-hidden"
            style={{ containerType: "inline-size" }}
          >
            <CertificateArtwork cert={cert} priority />
          </div>
        </div>
      </m.div>
    </div>
  );
}
