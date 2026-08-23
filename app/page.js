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
import { combinedSkills, domains, profile } from "@/lib/data";
import { listCertificates } from "@/lib/db";

export default function Home() {
  const featuredProjects = domains.flatMap((d) => d.projects);

  return (
    <>
      <Navbar />
      <main>
        <Hero
          eyebrow="AI · Data Science · Robotics · Embedded"
          title={
            <>
              Hi, I&apos;m <span className="text-gradient">Shib Sankar Das</span>
            </>
          }
          roles={profile.roles}
          description={profile.summary}
          primaryCta={{ href: "#domains", label: "Explore My Domains" }}
        />
        <About
          summary={profile.summary}
          highlights={[
            "End-to-End ML Systems",
            "Agentic AI & RAG",
            "Computer Vision",
            "ROS2 Robotics",
            "Embedded Firmware",
            "IoT Ecosystems",
          ]}
        />
        <DomainCards domains={domains} />
        <Skills groups={combinedSkills} title="The Full Stack of Intelligence" />
        <Experience />
        <Projects
          projects={featuredProjects}
          description="A selection across all my domains — from agentic AI assistants to autonomous robots."
        />
        <EducationCerts certifications={listCertificates()} />
        <Contact />
      </main>
      <Footer />
    </>
  );
}
