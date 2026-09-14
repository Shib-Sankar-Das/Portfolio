import { FlaskConical } from "lucide-react";
import Navbar from "@/components/navbar";
import Footer from "@/components/footer";
import ArmDemo from "@/components/robotics/arm-demo";
import { getDomain } from "@/lib/data";

// A test route for the robotic arm carousel. Not linked from anywhere on the
// site and kept out of search results.
export const metadata = {
  title: "Arm carousel test",
  robots: { index: false, follow: false },
};

const CARDS = 5;

/** Clearly-marked filler so the deck always has five cards to work with. */
const placeholder = (n) => ({
  name: `Demo Card ${String(n).padStart(2, "0")} — Test Slot`,
  points: [
    "Placeholder card for testing the arm carousel with more than three projects.",
    "Not real project content — this route is not linked from the site.",
  ],
  stack: ["Test", "Placeholder"],
});

export default function ArmDemoPage() {
  const robotics = getDomain("robotics-embedded");

  // The real robotics projects first, topped up with placeholders to five.
  const projects = robotics.projects.slice(0, CARDS);
  while (projects.length < CARDS) projects.push(placeholder(projects.length + 1));

  return (
    <div className={robotics.themeClass}>
      <Navbar />
      <main className="pt-16">
        <section className="relative overflow-hidden bg-bg-soft">
          <div className="relative z-10 mx-auto w-full max-w-6xl px-4 py-14 sm:px-6 sm:py-20">
            <p className="mb-4 inline-flex items-center gap-2 rounded-full border border-line bg-card/60 px-4 py-1.5 text-xs font-medium uppercase tracking-wider text-muted backdrop-blur">
              <FlaskConical size={13} className="text-accent" />
              Test route
            </p>
            <h1 className="text-3xl font-bold leading-tight tracking-tight sm:text-4xl">
              Robotic arm carousel — <span className="text-gradient">five cards</span>
            </h1>
            <p className="mt-4 max-w-2xl text-sm leading-relaxed text-muted">
              The same component, animation and 3D arm as the projects section on the Robotics
              &amp; Embedded route, with five cards and a live status panel for testing.
            </p>

            <div className="mt-10">
              <ArmDemo projects={projects} accent={robotics.heroColors.primary} />
            </div>
          </div>
        </section>
      </main>
      <Footer />
    </div>
  );
}
