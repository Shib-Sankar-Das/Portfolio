"use client";

import { useRef } from "react";
import { m, useScroll, useTransform } from "framer-motion";

/** Fade-and-rise scroll reveal. */
export function Reveal({ children, delay = 0, y = 28, className = "", ...rest }) {
  return (
    <m.div
      initial={{ opacity: 0, y }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-70px" }}
      transition={{ duration: 0.6, delay, ease: [0.21, 0.65, 0.32, 0.95] }}
      className={className}
      {...rest}
    >
      {children}
    </m.div>
  );
}

/**
 * Parallax wrapper — translates children vertically as the element crosses
 * the viewport. Positive `speed` scrolls slower than the page (background
 * feel), negative scrolls faster (foreground feel).
 */
export function Parallax({ children, speed = 60, className = "" }) {
  const ref = useRef(null);
  const { scrollYProgress } = useScroll({
    target: ref,
    offset: ["start end", "end start"],
  });
  const y = useTransform(scrollYProgress, [0, 1], [speed, -speed]);

  return (
    <m.div ref={ref} style={{ y }} className={className}>
      {children}
    </m.div>
  );
}

/** Staggered container + item pair for lists/grids. */
export function StaggerGroup({ children, className = "" }) {
  return (
    <m.div
      initial="hidden"
      whileInView="show"
      viewport={{ once: true, margin: "-60px" }}
      variants={{
        hidden: {},
        show: { transition: { staggerChildren: 0.09 } },
      }}
      className={className}
    >
      {children}
    </m.div>
  );
}

export function StaggerItem({ children, className = "" }) {
  return (
    <m.div
      variants={{
        hidden: { opacity: 0, y: 26 },
        show: {
          opacity: 1,
          y: 0,
          transition: { duration: 0.55, ease: [0.21, 0.65, 0.32, 0.95] },
        },
      }}
      className={className}
    >
      {children}
    </m.div>
  );
}
