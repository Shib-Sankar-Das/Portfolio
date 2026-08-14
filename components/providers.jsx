"use client";

import { ThemeProvider } from "next-themes";
import { LazyMotion, MotionConfig, domAnimation } from "framer-motion";

export default function Providers({ children }) {
  return (
    <ThemeProvider attribute="class" defaultTheme="dark" enableSystem>
      {/* LazyMotion + m.* components ship only the DOM-animation subset of
          framer-motion; `strict` fails the build if a full motion.* sneaks in. */}
      <LazyMotion features={domAnimation} strict>
        <MotionConfig reducedMotion="user">{children}</MotionConfig>
      </LazyMotion>
    </ThemeProvider>
  );
}
