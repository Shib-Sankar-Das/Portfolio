import { Briefcase, Building2, Clock } from "lucide-react";
import Navbar from "@/components/navbar";
import Footer from "@/components/footer";
import { Contact } from "@/components/sections";
import { Reveal } from "@/components/motion";
import BadgeWall from "@/components/experience/badge-wall";
import { experienceByDate, experienceMonths, profile } from "@/lib/data";

export const metadata = {
  title: "Work Experience",
  description:
    "Every role in full — what each one covered, what got built, and the tools it was built with.",
};

export default function ExperiencePage() {
  const roles = experienceByDate();
  const totalMonths = roles.reduce((sum, job) => sum + (experienceMonths(job) ?? 0), 0);
  const organisations = new Set(roles.map((job) => job.company)).size;

  const stats = [
    { icon: Briefcase, value: roles.length, label: roles.length === 1 ? "Role" : "Roles" },
    {
      icon: Building2,
      value: organisations,
      label: organisations === 1 ? "Organisation" : "Organisations",
    },
    { icon: Clock, value: totalMonths, label: "Months on the job" },
  ];

  return (
    <>
      <Navbar />
      <main>
        {/* Header */}
        <section className="relative overflow-hidden pt-16">
          <div className="bg-grid absolute inset-0" aria-hidden />
          <div className="glow-blob left-[-6%] top-[14%] h-72 w-72" aria-hidden />

          <div className="relative z-10 mx-auto w-full max-w-6xl px-4 py-14 text-center sm:px-6 sm:py-16">
            <Reveal>
              <p className="mb-4 inline-flex items-center gap-2 rounded-full border border-line bg-card/60 px-4 py-1.5 text-xs font-medium uppercase tracking-wider text-muted backdrop-blur">
                <Briefcase size={13} className="text-accent" />
                Work Experience
              </p>
              <h1 className="mx-auto max-w-3xl text-4xl font-bold leading-tight tracking-tight sm:text-5xl">
                Every badge I&rsquo;ve <span className="text-gradient">worn</span>
              </h1>
              <p className="mx-auto mt-5 max-w-2xl text-sm leading-relaxed text-muted sm:text-base">
                One pass for each role. Take a badge off the rail to read what it
                covered, what actually got built, and the tools it was built with.
              </p>
            </Reveal>

            <Reveal delay={0.12} className="mt-8 flex flex-wrap justify-center gap-3">
              {stats.map(({ icon: Icon, value, label }) => (
                <div
                  key={label}
                  className="flex items-center gap-2.5 rounded-2xl border border-line bg-card/70 px-4 py-2.5 backdrop-blur"
                >
                  <Icon size={15} className="text-accent" />
                  <span className="text-lg font-bold">{value}</span>
                  <span className="text-[11px] uppercase tracking-[0.14em] text-muted">
                    {label}
                  </span>
                </div>
              ))}
            </Reveal>
          </div>
        </section>

        {/* The badges, hanging from a rail */}
        <section className="relative overflow-hidden bg-bg-soft">
          {/* The rail they hang from */}
          <div
            className="absolute inset-x-0 top-0 h-1.5 bg-gradient-to-b from-fg/25 to-transparent"
            aria-hidden
          />
          <div className="mx-auto w-full max-w-6xl px-4 pb-20 pt-10 sm:px-6 sm:pb-24">
            <BadgeWall roles={roles} name={profile.name} />
          </div>
        </section>

        <Contact />
      </main>
      <Footer />
    </>
  );
}
