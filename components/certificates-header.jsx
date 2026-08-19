"use client";

import { useEffect, useRef, useState } from "react";
import { m } from "framer-motion";
import { BadgeCheck, ChevronDown } from "lucide-react";

/** Counts up to `value` once the element scrolls into view. */
function CountUp({ value, duration = 1100 }) {
  const ref = useRef(null);
  const [shown, setShown] = useState(0);

  useEffect(() => {
    const node = ref.current;
    if (!node) return;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      setShown(value);
      return;
    }

    let frame;
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (!entry.isIntersecting) return;
        observer.disconnect();
        const start = performance.now();
        const tick = (now) => {
          const t = Math.min((now - start) / duration, 1);
          setShown(Math.round(value * (1 - Math.pow(1 - t, 3)))); // easeOutCubic
          if (t < 1) frame = requestAnimationFrame(tick);
        };
        frame = requestAnimationFrame(tick);
      },
      { threshold: 0.4 }
    );
    observer.observe(node);
    return () => {
      observer.disconnect();
      if (frame) cancelAnimationFrame(frame);
    };
  }, [value, duration]);

  return <span ref={ref}>{shown}</span>;
}

export default function CertificatesHeader({ stats }) {
  return (
    <section className="relative flex min-h-[64svh] items-center overflow-hidden pt-16">
      <div className="bg-grid absolute inset-0" aria-hidden />
      <div className="glow-blob left-[-8%] top-[10%] h-72 w-72" aria-hidden />
      <div className="glow-blob bottom-[-10%] right-[-6%] h-80 w-80" aria-hidden />

      {/* Empty frames drifting behind the title */}
      <div className="pointer-events-none absolute inset-0 hidden lg:block" aria-hidden>
        <m.div
          className="absolute right-[8%] top-[16%] h-40 w-32 rounded border border-line"
          animate={{ y: [0, -16, 0], rotate: [3, 5, 3] }}
          transition={{ duration: 9, repeat: Infinity, ease: "easeInOut" }}
        />
        <m.div
          className="absolute right-[20%] top-[44%] h-28 w-36 rounded border border-line"
          animate={{ y: [0, 14, 0], rotate: [-4, -2, -4] }}
          transition={{ duration: 11, repeat: Infinity, ease: "easeInOut" }}
        />
        <m.div
          className="absolute bottom-[14%] right-[4%] h-32 w-28 rounded border border-line"
          animate={{ y: [0, -12, 0], rotate: [-2, 1, -2] }}
          transition={{ duration: 13, repeat: Infinity, ease: "easeInOut" }}
        />
      </div>

      <div className="relative z-10 mx-auto w-full max-w-6xl px-4 py-20 sm:px-6">
        <m.p
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="mb-4 inline-flex items-center gap-2 rounded-full border border-line bg-card/60 px-4 py-1.5 text-xs font-medium uppercase tracking-wider text-muted backdrop-blur"
        >
          <BadgeCheck size={13} className="text-accent" />
          Verified Credentials
        </m.p>

        <m.h1
          initial={{ opacity: 0, y: 24 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.08 }}
          className="max-w-3xl text-4xl font-bold leading-tight tracking-tight sm:text-5xl lg:text-6xl"
        >
          The <span className="text-gradient">Certificate Wall</span>
        </m.h1>

        <m.p
          initial={{ opacity: 0, y: 22 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.18 }}
          className="mt-5 max-w-2xl text-sm leading-relaxed text-muted sm:text-base"
        >
          Every credential I&apos;ve earned, hung in one gallery. Filter by issuing
          organisation or skill, sort by date, and open any frame for the full story —
          what it covers, when I earned it, whether it expires, and where to verify it.
        </m.p>

        <m.dl
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.28 }}
          className="mt-10 grid max-w-2xl grid-cols-2 gap-4 sm:grid-cols-4"
        >
          {stats.map((s) => (
            <div
              key={s.label}
              className="rounded-2xl border border-line bg-card/70 px-4 py-4 backdrop-blur"
            >
              <dt className="sr-only">{s.label}</dt>
              <dd>
                <span className="text-gradient block text-3xl font-bold">
                  <CountUp value={s.value} />
                </span>
                <span className="mt-1 block text-[11px] uppercase tracking-[0.14em] text-muted">
                  {s.label}
                </span>
              </dd>
            </div>
          ))}
        </m.dl>
      </div>

      <div className="absolute bottom-6 left-1/2 z-10 -translate-x-1/2" aria-hidden>
        <ChevronDown size={22} className="animate-scroll-hint text-muted" />
      </div>
    </section>
  );
}
