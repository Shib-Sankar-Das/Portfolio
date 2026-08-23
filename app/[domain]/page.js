import { notFound } from "next/navigation";
import Navbar from "@/components/navbar";
import Hero from "@/components/hero";
import Footer from "@/components/footer";
import {
  Contact,
  DomainCards,
  EducationCerts,
  Experience,
  Projects,
  Skills,
} from "@/components/sections";
import { domains, getDomain } from "@/lib/data";
import { listCertificatesForDomain } from "@/lib/db";

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
        <Skills groups={domain.skills} title={`${domain.shortTitle} Toolbox`} />
        <Projects
          projects={domain.projects}
          description={`Hands-on ${domain.shortTitle.toLowerCase()} work — built, measured and shipped.`}
        />
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
