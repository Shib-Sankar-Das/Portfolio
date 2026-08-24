"use client";

import Link from "next/link";
import { m } from "framer-motion";
import {
  ArrowRight,
  Award,
  BrainCircuit,
  Briefcase,
  Code,
  Cpu,
  ExternalLink,
  GraduationCap,
  Mail,
  MapPin,
  Phone,
} from "lucide-react";
import { Github, Linkedin } from "./brand-icons";
import ProfilePhoto from "./profile-photo";
import { education, experience, profile } from "@/lib/data";
import { Parallax, Reveal, StaggerGroup, StaggerItem } from "./motion";

const domainIcons = { brain: BrainCircuit, cpu: Cpu, code: Code };

export function SectionHeading({ eyebrow, title, description, id }) {
  return (
    <Reveal className="mx-auto mb-12 max-w-2xl text-center" id={id}>
      <p className="mb-3 text-xs font-semibold uppercase tracking-[0.2em] text-accent">
        {eyebrow}
      </p>
      <h2 className="text-3xl font-bold tracking-tight sm:text-4xl">{title}</h2>
      {description && (
        <p className="mt-4 text-sm leading-relaxed text-muted sm:text-base">{description}</p>
      )}
    </Reveal>
  );
}

function SectionShell({ id, children, soft = false }) {
  return (
    <section id={id} className={`cv-auto relative overflow-hidden ${soft ? "bg-bg-soft" : ""}`}>
      <div className="relative z-10 mx-auto w-full max-w-6xl px-4 py-20 sm:px-6 sm:py-24">
        {children}
      </div>
    </section>
  );
}

/* ------------------------------- About -------------------------------- */

export function About({ summary, highlights }) {
  return (
    <SectionShell id="about" soft>
      <Parallax speed={30} className="glow-blob right-[-6%] top-0 h-64 w-64" />
      <div className="grid items-center gap-10 lg:grid-cols-[1fr_1.4fr]">
        <Reveal>
          <ProfilePhoto />
        </Reveal>
        <div>
          <SectionHeadingLeft eyebrow="About Me" title="Building intelligence, end to end" />
          <Reveal delay={0.1}>
            <p className="text-sm leading-relaxed text-muted sm:text-base">{summary}</p>
          </Reveal>
          {highlights && (
            <StaggerGroup className="mt-6 flex flex-wrap gap-2.5">
              {highlights.map((h) => (
                <StaggerItem key={h}>
                  <span className="inline-block rounded-full border border-line bg-card px-4 py-1.5 text-xs font-medium text-fg shadow-sm">
                    {h}
                  </span>
                </StaggerItem>
              ))}
            </StaggerGroup>
          )}
        </div>
      </div>
    </SectionShell>
  );
}

function SectionHeadingLeft({ eyebrow, title }) {
  return (
    <Reveal className="mb-6">
      <p className="mb-2 text-xs font-semibold uppercase tracking-[0.2em] text-accent">{eyebrow}</p>
      <h2 className="text-3xl font-bold tracking-tight sm:text-4xl">{title}</h2>
    </Reveal>
  );
}

/* ---------------------------- Domain cards ----------------------------- */

export function DomainCards({
  domains,
  eyebrow = "Specializations",
  title = "Explore My Domains",
  description = "One engineer, multiple depths. Each domain has its own dedicated showcase — dive into the one you're hiring for.",
}) {
  return (
    <SectionShell id="domains">
      <Parallax speed={40} className="glow-blob left-[-8%] top-[20%] h-72 w-72" />
      <SectionHeading eyebrow={eyebrow} title={title} description={description} />
      <StaggerGroup
        className={`grid gap-6 md:grid-cols-2 ${domains.length >= 3 ? "xl:grid-cols-3" : ""}`}
      >
        {domains.map((d) => {
          const Icon = domainIcons[d.icon] ?? BrainCircuit;
          return (
            <StaggerItem key={d.slug}>
              <Link
                href={`/${d.slug}`}
                className={`card-hover group relative block h-full overflow-hidden rounded-3xl border border-line bg-card p-7 sm:p-8 ${d.themeClass}`}
              >
                <div className="glow-blob -right-16 -top-16 h-48 w-48 opacity-0 transition-opacity duration-500 group-hover:opacity-100" />
                <div className="relative">
                  <span className="mb-5 inline-flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-br from-accent to-accent-2 text-white shadow-lg">
                    <Icon size={26} />
                  </span>
                  <h3 className="text-xl font-bold sm:text-2xl">{d.title}</h3>
                  <p className="mt-2 text-sm text-muted">{d.tagline}</p>
                  <div className="mt-5 flex flex-wrap gap-2">
                    {d.highlights.map((h) => (
                      <span
                        key={h}
                        className="rounded-full bg-accent-soft px-3 py-1 text-xs font-medium text-accent"
                      >
                        {h}
                      </span>
                    ))}
                  </div>
                  <span className="mt-6 inline-flex items-center gap-2 text-sm font-semibold text-accent">
                    Explore domain
                    <ArrowRight size={16} className="transition-transform group-hover:translate-x-1.5" />
                  </span>
                </div>
              </Link>
            </StaggerItem>
          );
        })}
      </StaggerGroup>
    </SectionShell>
  );
}

/* ------------------------------- Skills -------------------------------- */

export function Skills({ groups, eyebrow = "Technical Skills", title = "My Toolbox" }) {
  return (
    <SectionShell id="skills" soft>
      <SectionHeading
        eyebrow={eyebrow}
        title={title}
        description="The languages, frameworks and platforms I use to take ideas from prototype to production."
      />
      <StaggerGroup className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
        {groups.map((g) => (
          <StaggerItem key={g.group} className="h-full">
            <div className="card-hover h-full rounded-2xl border border-line bg-card p-6">
              <h3 className="mb-4 text-sm font-bold uppercase tracking-wider text-accent">
                {g.group}
              </h3>
              <div className="flex flex-wrap gap-2">
                {g.items.map((item) => (
                  <span
                    key={item}
                    className="rounded-lg border border-line bg-bg-soft px-3 py-1.5 text-xs font-medium transition-colors hover:border-accent hover:text-accent"
                  >
                    {item}
                  </span>
                ))}
              </div>
            </div>
          </StaggerItem>
        ))}
      </StaggerGroup>
    </SectionShell>
  );
}

/* ----------------------------- Experience ------------------------------ */

export function Experience() {
  return (
    <SectionShell id="experience">
      <Parallax speed={35} className="glow-blob right-[-10%] top-[30%] h-72 w-72" />
      <SectionHeading
        eyebrow="Work Experience"
        title="Where I've Worked"
        description="Internships across AI, data science and research — shipping real systems, not toy demos."
      />
      {/* From xl up the timeline shifts left of center to make room for the
          larger leaning character on its right. Below xl the timeline
          reserves headroom (pt-52) for the table character instead. */}
      <div className="relative mx-auto max-w-3xl pt-64 xl:mx-0 xl:ml-24 xl:pt-0">
        {/* Mobile/tablet: the character rests his hands on the top border of
            the first experience card (the card edge plays the table). His
            image bottom (the hands) sits exactly at the reserved headroom's
            end, where the first card begins. */}
        <div
          className="pointer-events-none absolute inset-x-0 top-0 flex justify-center xl:hidden"
          aria-hidden
        >
          <m.img
            src="/anim/character-table-hi.webp"
            alt=""
            loading="lazy"
            decoding="async"
            initial={{ opacity: 0, y: 24 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-60px" }}
            transition={{ duration: 0.7, ease: [0.21, 0.65, 0.32, 0.95] }}
            className="h-64 w-auto select-none drop-shadow-xl motion-reduce:hidden"
          />
        </div>
        {/* Animated character leaning against the timeline's right edge
            (the cards play the role of the wall in his animation). Only
            shown from xl up, where the section's side margin fits him. */}
        <m.img
          src="/anim/character-hi.webp"
          alt=""
          aria-hidden
          loading="lazy"
          decoding="async"
          initial={{ opacity: 0, x: 56 }}
          whileInView={{ opacity: 1, x: 0 }}
          viewport={{ once: true, margin: "-120px" }}
          transition={{ duration: 0.8, ease: [0.21, 0.65, 0.32, 0.95] }}
          className="pointer-events-none absolute bottom-0 z-10 hidden w-72 select-none drop-shadow-2xl motion-reduce:hidden xl:-right-56 xl:block"
        />
        <div
          className="absolute bottom-2 left-[11px] top-64 w-px bg-gradient-to-b from-accent via-accent-2 to-transparent sm:left-[13px] xl:top-2"
          aria-hidden
        />
        <div className="space-y-10">
          {experience.map((job, i) => (
            <Reveal key={job.company} delay={i * 0.08} className="relative pl-10 sm:pl-12">
              <span className="absolute left-0 top-1.5 flex h-6 w-6 items-center justify-center rounded-full border-2 border-accent bg-bg sm:h-7 sm:w-7">
                <Briefcase size={12} className="text-accent" />
              </span>
              <div className="card-hover rounded-2xl border border-line bg-card p-6">
                <div className="flex flex-wrap items-baseline justify-between gap-2">
                  <h3 className="text-lg font-bold">{job.role}</h3>
                  <span className="rounded-full bg-accent-soft px-3 py-1 text-xs font-medium text-accent">
                    {job.period}
                  </span>
                </div>
                <p className="mt-1 text-sm font-medium text-muted">{job.company}</p>
                <ul className="mt-4 space-y-2">
                  {job.points.map((p) => (
                    <li key={p} className="flex gap-2.5 text-sm leading-relaxed text-muted">
                      <span className="mt-2 h-1 w-1 shrink-0 rounded-full bg-accent" />
                      {p}
                    </li>
                  ))}
                </ul>
              </div>
            </Reveal>
          ))}
        </div>
      </div>
    </SectionShell>
  );
}

/* ------------------------------ Projects ------------------------------- */

export function Projects({ projects, description }) {
  return (
    <SectionShell id="projects" soft>
      <SectionHeading
        eyebrow="Featured Projects"
        title="Things I've Built"
        description={description}
      />
      <StaggerGroup className="grid gap-6 md:grid-cols-2 xl:grid-cols-3">
        {projects.map((p) => (
          <StaggerItem key={p.name} className="h-full">
            <article className="card-hover group relative flex h-full flex-col overflow-hidden rounded-3xl border border-line bg-card p-6 sm:p-7">
              <div className="glow-blob -right-20 -top-20 h-44 w-44 opacity-0 transition-opacity duration-500 group-hover:opacity-100" />
              <div className="relative flex flex-1 flex-col">
                <div className="mb-4 flex items-start justify-between gap-3">
                  <h3 className="text-lg font-bold leading-snug">{p.name}</h3>
                  {p.github && (
                    <a
                      href={p.github}
                      target="_blank"
                      rel="noreferrer"
                      aria-label={`${p.name} on GitHub`}
                      className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full border border-line bg-bg-soft transition-colors hover:border-accent hover:text-accent"
                    >
                      <Github size={15} />
                    </a>
                  )}
                </div>
                <div className="mb-4 flex flex-wrap gap-2">
                  {p.stack.map((s) => (
                    <span
                      key={s}
                      className="rounded-full bg-accent-soft px-2.5 py-1 text-[11px] font-semibold text-accent"
                    >
                      {s}
                    </span>
                  ))}
                </div>
                <ul className="space-y-2">
                  {p.points.map((pt) => (
                    <li key={pt} className="flex gap-2.5 text-sm leading-relaxed text-muted">
                      <span className="mt-2 h-1 w-1 shrink-0 rounded-full bg-accent" />
                      {pt}
                    </li>
                  ))}
                </ul>
              </div>
            </article>
          </StaggerItem>
        ))}
      </StaggerGroup>
    </SectionShell>
  );
}

/* ------------------------ Education & Certifications ------------------- */

export function EducationCerts({ certifications }) {
  return (
    <SectionShell id="education">
      <div className="grid gap-14 lg:grid-cols-2 lg:gap-10">
        <div>
          <SectionHeadingLeft eyebrow="Education" title="Academic Background" />
          <StaggerGroup className="space-y-4">
            {education.map((e) => (
              <StaggerItem key={e.degree}>
                <div className="card-hover flex items-start gap-4 rounded-2xl border border-line bg-card p-5">
                  <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-accent-soft text-accent">
                    <GraduationCap size={20} />
                  </span>
                  <div className="min-w-0">
                    <h3 className="font-bold leading-snug">{e.degree}</h3>
                    <p className="mt-0.5 text-sm text-muted">{e.school}</p>
                    <p className="mt-1.5 text-xs text-muted">
                      {e.period} · <span className="font-semibold text-accent">{e.score}</span>
                    </p>
                  </div>
                </div>
              </StaggerItem>
            ))}
          </StaggerGroup>
        </div>
        <div>
          <SectionHeadingLeft eyebrow="Certifications" title="Credentials" />
          {/* Cards lift on hover, so keep them clear of one another. */}
          <StaggerGroup className="space-y-5">
            {certifications.map((c) => (
              <StaggerItem key={c.slug ?? c.name}>
                <Link
                  href={`/certificates/${c.slug}`}
                  className="card-hover group flex items-start gap-4 rounded-2xl border border-line bg-card p-5"
                >
                  <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-accent-soft text-accent">
                    <Award size={20} />
                  </span>
                  <div className="min-w-0 flex-1">
                    <h3 className="font-bold leading-snug">{c.name}</h3>
                    <p className="mt-1.5 text-xs text-muted">
                      {c.org} · {c.date}
                    </p>
                  </div>
                  <ArrowRight
                    size={15}
                    className="mt-1 shrink-0 text-muted transition-all group-hover:translate-x-1 group-hover:text-accent"
                  />
                </Link>
              </StaggerItem>
            ))}
          </StaggerGroup>

          <Reveal delay={0.15}>
            <Link
              href="/certificates"
              className="group mt-5 inline-flex items-center gap-2 rounded-full border border-line bg-card px-5 py-2.5 text-sm font-semibold transition-colors hover:border-accent hover:text-accent"
            >
              <Award size={15} className="text-accent" />
              Other Certificates
              <ArrowRight size={14} className="transition-transform group-hover:translate-x-1" />
            </Link>
          </Reveal>
        </div>
      </div>
    </SectionShell>
  );
}

/* ------------------------------- Contact ------------------------------- */

export function Contact() {
  return (
    <SectionShell id="contact" soft>
      <Parallax speed={30} className="glow-blob left-[10%] bottom-0 h-64 w-64" />
      <SectionHeading
        eyebrow="Contact"
        title="Let's Build Something"
        description="Open to internships, freelance projects and full-time roles. The fastest way to reach me is email."
      />
      <Reveal className="mx-auto max-w-3xl">
        <div className="rounded-3xl border border-line bg-card p-8 shadow-xl sm:p-10">
          <div className="grid gap-6 sm:grid-cols-3">
            <a href={`mailto:${profile.email}`} className="group flex flex-col items-center gap-3 text-center">
              <span className="flex h-12 w-12 items-center justify-center rounded-2xl bg-accent-soft text-accent transition-transform group-hover:scale-110">
                <Mail size={20} />
              </span>
              <span className="break-all text-sm text-muted group-hover:text-accent">{profile.email}</span>
            </a>
            <a href={`tel:${profile.phone.replace(/\s/g, "")}`} className="group flex flex-col items-center gap-3 text-center">
              <span className="flex h-12 w-12 items-center justify-center rounded-2xl bg-accent-soft text-accent transition-transform group-hover:scale-110">
                <Phone size={20} />
              </span>
              <span className="text-sm text-muted group-hover:text-accent">{profile.phone}</span>
            </a>
            <div className="flex flex-col items-center gap-3 text-center">
              <span className="flex h-12 w-12 items-center justify-center rounded-2xl bg-accent-soft text-accent">
                <MapPin size={20} />
              </span>
              <span className="text-sm text-muted">{profile.location}</span>
            </div>
          </div>
          <div className="mt-8 flex justify-center gap-3 border-t border-line pt-8">
            <a
              href={profile.links.github}
              target="_blank"
              rel="noreferrer"
              aria-label="GitHub"
              className="flex h-11 w-11 items-center justify-center rounded-full border border-line transition-colors hover:border-accent hover:text-accent"
            >
              <Github size={17} />
            </a>
            <a
              href={profile.links.linkedin}
              target="_blank"
              rel="noreferrer"
              aria-label="LinkedIn"
              className="flex h-11 w-11 items-center justify-center rounded-full border border-line transition-colors hover:border-accent hover:text-accent"
            >
              <Linkedin size={17} />
            </a>
            <a
              href={`mailto:${profile.email}`}
              className="inline-flex items-center gap-2 rounded-full bg-gradient-to-r from-accent to-accent-2 px-6 text-sm font-semibold text-white transition-transform hover:scale-[1.04]"
            >
              Say Hello
            </a>
          </div>
        </div>
      </Reveal>
    </SectionShell>
  );
}
