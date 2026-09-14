"use client";

import { SectionHeading } from "@/components/sections";
import ProjectCarousel from "./project-carousel";

/**
 * The robotics route's projects section: the same content as everywhere else,
 * shown on a carousel that a robotic arm works.
 *
 * A client component only because the carousel is; the section around it is
 * the same shell every other route uses.
 */
export default function ArmProjects({ projects, description, accent }) {
  return (
    // No `cv-auto` here, unlike the other sections: content-visibility lets the
    // browser skip laying out and painting the section while it is off-screen,
    // which is the wrong thing for a live WebGL canvas that measures itself and
    // an arm that is positioned against the deck's measured layout. Without it
    // this section behaves exactly as it does on the /arm-demo test route.
    <section id="projects" className="relative overflow-hidden bg-bg-soft">
      <div className="relative z-10 mx-auto w-full max-w-6xl px-4 py-20 sm:px-6 sm:py-24">
        <SectionHeading
          eyebrow="Featured Projects"
          title="Things I've Built"
          description={description}
        />
        <ProjectCarousel projects={projects} accent={accent} />
      </div>
    </section>
  );
}
