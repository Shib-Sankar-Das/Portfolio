"use client";

import { useEffect, useRef, useState } from "react";
import dynamic from "next/dynamic";
import { AnimatePresence, m, useScroll, useTransform } from "framer-motion";
import { ArrowRight, ChevronDown, Mail, MapPin } from "lucide-react";
import { Github, Linkedin } from "./brand-icons";
import { profile } from "@/lib/data";

const HeroCanvas = dynamic(() => import("./hero-canvas"), { ssr: false });

/**
 * Defers work the hero doesn't need for first paint:
 * - mounts the 3D canvas only after the browser goes idle (keeps Three.js
 *   out of the critical path for LCP/TBT);
 * - reports whether the hero is on screen so the render loop can be paused
 *   entirely once the user scrolls past it.
 */
function useDeferredCanvas(ref) {
  const [mountCanvas, setMountCanvas] = useState(false);
  const [visible, setVisible] = useState(true);

  useEffect(() => {
    const idle = window.requestIdleCallback ?? ((cb) => setTimeout(cb, 200));
    const cancel = window.cancelIdleCallback ?? clearTimeout;
    const handle = idle(() => setMountCanvas(true));
    return () => cancel(handle);
  }, []);

  useEffect(() => {
    const node = ref.current;
    if (!node || typeof IntersectionObserver === "undefined") return;
    const observer = new IntersectionObserver(
      ([entry]) => setVisible(entry.isIntersecting),
      { rootMargin: "80px" }
    );
    observer.observe(node);
    return () => observer.disconnect();
  }, [ref]);

  return { mountCanvas, visible };
}

function RotatingRoles({ roles }) {
  const [index, setIndex] = useState(0);

  useEffect(() => {
    const id = setInterval(() => setIndex((i) => (i + 1) % roles.length), 2600);
    return () => clearInterval(id);
  }, [roles.length]);

  return (
    <span className="relative inline-flex h-[1.4em] overflow-hidden align-bottom">
      <AnimatePresence mode="wait">
        <m.span
          key={roles[index]}
          initial={{ y: "100%", opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          exit={{ y: "-100%", opacity: 0 }}
          transition={{ duration: 0.45, ease: [0.21, 0.65, 0.32, 0.95] }}
          className="text-gradient font-semibold"
        >
          {roles[index]}
        </m.span>
      </AnimatePresence>
    </span>
  );
}

/**
 * Full-screen hero with a Three.js backdrop and scroll parallax:
 * the 3D scene, headline and glow blobs each move at different speeds.
 */
export default function Hero({
  eyebrow,
  title,
  roles,
  description,
  primaryCta = { href: "#projects", label: "View Projects" },
  canvasColors,
  compact = false,
}) {
  const ref = useRef(null);
  const { scrollYProgress } = useScroll({
    target: ref,
    offset: ["start start", "end start"],
  });
  const canvasY = useTransform(scrollYProgress, [0, 1], ["0%", "28%"]);
  const contentY = useTransform(scrollYProgress, [0, 1], ["0%", "62%"]);
  const fade = useTransform(scrollYProgress, [0, 0.75], [1, 0]);
  const { mountCanvas, visible } = useDeferredCanvas(ref);

  return (
    <section
      ref={ref}
      className={`relative flex ${compact ? "min-h-[86svh]" : "min-h-svh"} items-center overflow-hidden`}
    >
      {/* Layer 0: grid + glow blobs (slowest) */}
      <div className="bg-grid absolute inset-0" aria-hidden />
      <div className="glow-blob left-[-10%] top-[8%] h-72 w-72 sm:h-96 sm:w-96" aria-hidden />
      <div className="glow-blob bottom-[5%] right-[-8%] h-64 w-64 sm:h-80 sm:w-80" aria-hidden />

      {/* Layer 1: 3D canvas (slow parallax) */}
      <m.div style={{ y: canvasY }} className="absolute inset-0" aria-hidden>
        <div className="absolute inset-0 md:left-[30%]">
          {mountCanvas && (
            <HeroCanvas
              primary={canvasColors?.primary}
              secondary={canvasColors?.secondary}
              active={visible}
            />
          )}
        </div>
      </m.div>

      {/* Layer 2: content (fast parallax) */}
      <m.div
        style={{ y: contentY, opacity: fade }}
        // On phones the bottom ~40svh belongs to the 3D character, so the
        // copy pads down to keep out of its way; from md up they share width.
        className="relative z-10 mx-auto w-full max-w-6xl px-4 pt-24 pb-[42svh] sm:px-6 md:pb-16"
      >
        <m.p
          initial={{ opacity: 0, y: 18 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.55 }}
          className="mb-4 inline-flex items-center gap-2 rounded-full border border-line bg-card/60 px-4 py-1.5 text-xs font-medium tracking-wider text-muted uppercase backdrop-blur"
        >
          <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-accent" />
          {eyebrow}
        </m.p>

        <m.h1
          initial={{ opacity: 0, y: 26 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.65, delay: 0.08 }}
          className="max-w-3xl text-4xl font-bold leading-tight tracking-tight sm:text-5xl lg:text-6xl"
        >
          {title}
        </m.h1>

        {roles && (
          <m.p
            initial={{ opacity: 0, y: 22 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.18 }}
            className="mt-4 text-xl sm:text-2xl"
          >
            I am a <RotatingRoles roles={roles} />
          </m.p>
        )}

        <m.p
          initial={{ opacity: 0, y: 22 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.26 }}
          className="mt-5 max-w-2xl text-sm leading-relaxed text-muted sm:text-base"
        >
          {description}
        </m.p>

        <m.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.34 }}
          className="mt-8 flex flex-wrap items-center gap-3"
        >
          <a
            href={primaryCta.href}
            className="group inline-flex items-center gap-2 rounded-full bg-gradient-to-r from-accent to-accent-2 px-6 py-3 text-sm font-semibold text-white shadow-lg transition-transform hover:scale-[1.04]"
          >
            {primaryCta.label}
            <ArrowRight size={16} className="transition-transform group-hover:translate-x-1" />
          </a>
          <a
            href={`mailto:${profile.email}`}
            className="inline-flex items-center gap-2 rounded-full border border-line bg-card/70 px-6 py-3 text-sm font-medium backdrop-blur transition-colors hover:border-accent hover:text-accent"
          >
            <Mail size={16} /> Hire Me
          </a>
          <div className="flex items-center gap-2">
            <a
              href={profile.links.github}
              target="_blank"
              rel="noreferrer"
              aria-label="GitHub"
              className="flex h-11 w-11 items-center justify-center rounded-full border border-line bg-card/70 backdrop-blur transition-colors hover:border-accent hover:text-accent"
            >
              <Github size={17} />
            </a>
            <a
              href={profile.links.linkedin}
              target="_blank"
              rel="noreferrer"
              aria-label="LinkedIn"
              className="flex h-11 w-11 items-center justify-center rounded-full border border-line bg-card/70 backdrop-blur transition-colors hover:border-accent hover:text-accent"
            >
              <Linkedin size={17} />
            </a>
          </div>
        </m.div>

        <m.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.6, delay: 0.45 }}
          className="mt-6 inline-flex items-center gap-1.5 text-xs text-muted"
        >
          <MapPin size={13} className="text-accent" /> {profile.location}
        </m.p>
      </m.div>

      {/* Scroll hint */}
      <div className="absolute bottom-6 left-1/2 z-10 -translate-x-1/2" aria-hidden>
        <ChevronDown size={22} className="animate-scroll-hint text-muted" />
      </div>
    </section>
  );
}
