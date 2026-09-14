import { Bot } from "lucide-react";
import Navbar from "@/components/navbar";
import IndustrialArmClient from "@/components/robotics/industrial/industrial-arm-client";
import { getDomain } from "@/lib/data";

// A demo route for the industrial robot arm: a 360° view and a control for
// every joint. Not linked from anywhere on the site and kept out of search
// results.
export const metadata = {
  title: "Industrial robot arm",
  robots: { index: false, follow: false },
};

export default function IndustrialArmPage() {
  const robotics = getDomain("robotics-embedded");

  return (
    <div className={robotics.themeClass}>
      <Navbar />
      <main className="pt-16">
        <div className="mx-auto w-full max-w-[96rem] px-4 py-8 sm:px-6">
          <div className="mb-6">
            <p className="mb-3 inline-flex items-center gap-2 rounded-full border border-line bg-card/60 px-4 py-1.5 text-xs font-medium uppercase tracking-wider text-muted">
              <Bot size={13} className="text-accent" />
              Demo route
            </p>
            <h1 className="text-3xl font-bold tracking-tight sm:text-4xl">
              Industrial robot arm — <span className="text-gradient">360° rig</span>
            </h1>
            <p className="mt-3 max-w-3xl text-sm leading-relaxed text-muted">
              A six-part industrial arm with a two-finger gripper, exported from its original
              .blend. Orbit around it, drive each joint, try the presets, or run the pick-and-place
              cycle.
            </p>
          </div>
          <IndustrialArmClient />
        </div>
      </main>
    </div>
  );
}
