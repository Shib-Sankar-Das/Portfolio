import { notFound } from "next/navigation";
import { CalendarDays, Clock } from "lucide-react";
import Navbar from "@/components/navbar";
import Footer from "@/components/footer";
import { Contact } from "@/components/sections";
import RoleDetail, {
  AchievementList,
  RoleLinks,
  ToolList,
  WorkList,
} from "@/components/experience/role-detail";
import { PIN_TOP } from "@/components/experience/card-geometry";
import {
  experience,
  experienceDuration,
  experienceNeighbours,
  getExperience,
  profile,
} from "@/lib/data";

// Every role is known at build time, so nothing else can be requested.
export const dynamicParams = false;

export function generateStaticParams() {
  return experience.map((job) => ({ slug: job.slug }));
}

export async function generateMetadata({ params }) {
  const { slug } = await params;
  const job = getExperience(slug);
  if (!job) return { title: "Not found" };
  return { title: `${job.role} · ${job.company}`, description: job.summary };
}

export default async function ExperienceDetailPage({ params }) {
  const { slug } = await params;
  const job = getExperience(slug);
  if (!job) notFound();

  const duration = experienceDuration(job);
  const { newer, older } = experienceNeighbours(slug);

  return (
    <>
      <Navbar />
      {/* No `overflow-hidden` anywhere above the badge: it would stop the
          sticky column from sticking at all. */}
      <main className="relative">
        {/* The role's own colour washes the top of its own page. */}
        <div
          className="pointer-events-none absolute inset-x-0 top-0 h-[30rem] opacity-20"
          style={{
            background: `radial-gradient(ellipse 60% 100% at 22% 0%, ${job.accent}, transparent 70%)`,
          }}
          aria-hidden
        />

        {/* Padded by exactly PIN_TOP, so at scroll 0 the badge's flowed
            position and its stuck position are the same and it does not shift
            the instant the page is scrolled. */}
        <div className="relative z-10 pb-16" style={{ paddingTop: PIN_TOP }}>
          <RoleDetail job={job} name={profile.name} newer={newer} older={older}>
            {/* ---------------------------- the header --------------------- */}
            <div className="flex flex-wrap items-center gap-2">
              <span
                className="rounded-full px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.16em]"
                style={{ color: job.accent, backgroundColor: `${job.accent}1f` }}
              >
                {job.type}
              </span>
              <span className="inline-flex items-center gap-1.5 rounded-full border border-line bg-card/60 px-3 py-1 text-[11px] font-medium text-muted backdrop-blur">
                <CalendarDays size={11} /> {job.period}
              </span>
              {duration && (
                <span className="inline-flex items-center gap-1.5 rounded-full border border-line bg-card/60 px-3 py-1 text-[11px] font-medium text-muted backdrop-blur">
                  <Clock size={11} /> {duration}
                </span>
              )}
            </div>

            <h1 className="mt-5 text-4xl font-bold leading-tight tracking-tight sm:text-5xl">
              {job.role}
            </h1>
            <p className="mt-3 text-lg font-medium text-muted">
              {job.company}
              {job.location ? ` · ${job.location}` : ""}
            </p>

            {job.summary && (
              <p className="mt-6 max-w-2xl text-sm leading-relaxed text-muted sm:text-base">
                {job.summary}
              </p>
            )}

            {job.focus?.length > 0 && (
              <div className="mt-7 flex flex-wrap gap-2">
                {job.focus.map((f) => (
                  <span
                    key={f}
                    className="rounded-full border border-line bg-card/60 px-3.5 py-1.5 text-xs font-medium backdrop-blur"
                  >
                    {f}
                  </span>
                ))}
              </div>
            )}

            {/* ----------------------------- the work ----------------------- */}
            <h2 className="mt-14 text-xs font-bold uppercase tracking-[0.18em] text-accent">
              What I worked on
            </h2>
            <WorkList items={job.work} accent={job.accent} />

            {/* Only appears once there is something to put in it. */}
            {job.achievements?.length > 0 && (
              <>
                <h2 className="mt-14 text-xs font-bold uppercase tracking-[0.18em] text-accent">
                  Achievements
                </h2>
                <AchievementList items={job.achievements} accent={job.accent} />
              </>
            )}

            {job.stack?.length > 0 && <ToolList tools={job.stack} />}
            {job.links?.length > 0 && <RoleLinks links={job.links} />}
          </RoleDetail>
        </div>

        <Contact />
      </main>
      <Footer />
    </>
  );
}
