import { Box } from "lucide-react";
import Navbar from "@/components/navbar";
import ArmRigClient from "@/components/robotics/rig/arm-rig-client";
import { getDomain } from "@/lib/data";

// A demo route for inspecting the rebuilt robotic arm: a 360° view and a
// control for every joint. Not linked from anywhere on the site and kept out of
// search results.
export const metadata = {
  title: "Robotic arm rig",
  robots: { index: false, follow: false },
};

export default function ArmRigPage() {
  const robotics = getDomain("robotics-embedded");

  return (
    <div className={robotics.themeClass}>
      <Navbar />
      <main className="pt-16">
        <div className="mx-auto w-full max-w-[96rem] px-4 py-8 sm:px-6">
          <div className="mb-6">
            <p className="mb-3 inline-flex items-center gap-2 rounded-full border border-line bg-card/60 px-4 py-1.5 text-xs font-medium uppercase tracking-wider text-muted">
              <Box size={13} className="text-accent" />
              Demo route
            </p>
            <h1 className="text-3xl font-bold tracking-tight sm:text-4xl">
              Robotic arm — <span className="text-gradient">rebuilt rig</span>
            </h1>
            <p className="mt-3 max-w-3xl text-sm leading-relaxed text-muted">
              Exported straight from the original .blend, with every part kept, and driven by a
              rebuilt mechanism: move a joint and everything linked to it follows. Orbit around
              it, hide parts to inspect them, and watch the integrity check.
            </p>
          </div>
          <ArmRigClient />
        </div>
      </main>
    </div>
  );
}
