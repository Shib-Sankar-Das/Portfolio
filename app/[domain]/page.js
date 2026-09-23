import { notFound } from "next/navigation";
import Navbar from "@/components/navbar";
import Hero from "@/components/hero";
import Footer from "@/components/footer";
import {
  About,
  Contact,
  DomainCards,
  EducationCerts,
  Experience,
  Projects,
  Skills,
} from "@/components/sections";
import ArmProjects from "@/components/robotics/arm-projects";
import DroneSkills from "@/components/robotics/drone-skills";
import { domains, getDomain, profile } from "@/lib/data";
import { listCertificatesForDomain } from "@/lib/db";
import { iconsForSkillGroups } from "@/lib/tech-icons";

export const dynamicParams = false;

export function generateStaticParams() {
  return domains.map((d) => ({ domain: d.slug }));
}

export async function generateMetadata({ params }) {
  const { domain: slug } = await params;
  const domain = getDomain(slug);
  if (!domain) return {};
  return {
    title: domain.title,
    description: domain.summary,
  };
}

export default async function DomainPage({ params }) {
  const { domain: slug } = await params;
  const domain = getDomain(slug);
  if (!domain) notFound();

  const otherDomains = domains.filter((d) => d.slug !== slug);

  return (
    <div className={domain.themeClass}>
      <Navbar />
      <main>
        <Hero
          compact
          eyebrow="Specialized Profile"
          title={<span className="text-gradient">{domain.title}</span>}
          roles={domain.highlights}
          description={domain.summary}
          canvasColors={domain.heroColors}
          primaryCta={{ href: "#projects", label: "View Projects" }}
        />
        {/* The same About as the home page — who I am does not change with the
            route, and the hero above already carries this domain's own summary.
            Untinted here, because the skills section below it is tinted. */}
        <About summary={profile.summary} highlights={profile.aboutHighlights} soft={false} />
        {/* On robotics a fleet of drones flies the skill cards in and holds
            them; every other route shows the same content as a plain grid. */}
        {slug === "robotics-embedded" ? (
          <DroneSkills
            groups={domain.skills}
            title={`${domain.shortTitle} Toolbox`}
            // Icon and write-up per skill, from the set managed in the admin.
            skillIcons={iconsForSkillGroups(domain.skills)}
          />
        ) : (
          <Skills groups={domain.skills} title={`${domain.shortTitle} Toolbox`} />
        )}
        {/* Robotics gets its projects on a carousel worked by a robotic arm;
            every other route shows the same content as a plain grid. */}
        {slug === "robotics-embedded" ? (
          <ArmProjects
            projects={domain.projects}
            accent={domain.heroColors.primary}
            description="Hands-on robotics and embedded work — built, measured and shipped. Use the arm to turn the deck."
          />
        ) : (
          <Projects
            projects={domain.projects}
            description={`Hands-on ${domain.shortTitle.toLowerCase()} work — built, measured and shipped.`}
          />
        )}
        <Experience />
        <EducationCerts certifications={listCertificatesForDomain(slug)} />
        <DomainCards
          domains={otherDomains}
          eyebrow="More Profiles"
          title="Explore Other Domains"
          description="I work across multiple disciplines — here's what else I do."
        />
        <Contact />
      </main>
      <Footer />
    </div>
  );
}
