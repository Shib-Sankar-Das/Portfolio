"use client";

import { useMemo, useRef, useState } from "react";
import Link from "next/link";
import {
  AnimatePresence,
  m,
  useMotionTemplate,
  useMotionValue,
  useSpring,
} from "framer-motion";
import {
  ArrowUpRight,
  Building2,
  CalendarDays,
  Layers,
  Search,
  SlidersHorizontal,
  Sparkles,
  X,
} from "lucide-react";
import { CertificateArtwork } from "./certificate-frame";

const SORTS = [
  { id: "newest", label: "Newest first" },
  { id: "oldest", label: "Oldest first" },
  { id: "org", label: "Organisation" },
  { id: "name", label: "A – Z" },
];

function FilterPill({ active, onClick, children, count }) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={active}
      className={`inline-flex items-center gap-1.5 rounded-full border px-3.5 py-1.5 text-xs font-medium transition-colors ${
        active
          ? "border-transparent bg-accent text-white shadow-md"
          : "border-line bg-card text-muted hover:border-accent hover:text-accent"
      }`}
    >
      {children}
      {count != null && <span className={active ? "opacity-80" : "opacity-60"}>{count}</span>}
    </button>
  );
}

/** One framed certificate hanging on the wall. */
function FramedCertificate({ cert, index }) {
  return (
    <m.div
      variants={{
        hidden: { opacity: 0, y: 34 },
        show: {
          opacity: 1,
          y: 0,
          transition: { duration: 0.55, ease: [0.21, 0.65, 0.32, 0.95] },
        },
      }}
      className="cert-frame-hover group"
    >
      <Link href={`/certificates/${cert.slug}`} className="block rounded-lg focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-accent">
        {/* Picture light above the frame */}
        <div className="cert-picture-light pointer-events-none h-8 w-full" aria-hidden />

        <div className="relative">
          {/* Bundles hang as a stack, so the extra documents read at a glance. */}
          {cert.isBundle && (
            <>
              <div className="cert-stack-layer cert-stack-layer-1" aria-hidden />
              <div className="cert-stack-layer cert-stack-layer-2" aria-hidden />
            </>
          )}

          <div className="cert-frame relative">
            <div className="cert-mat">
              <div
                className="cert-glass relative aspect-[4/3] overflow-hidden"
                style={{ containerType: "inline-size" }}
              >
                <CertificateArtwork cert={cert} priority={index < 3} />
              </div>
            </div>
          </div>

          {cert.isBundle && (
            <span className="cert-stack-badge absolute -right-2 -top-2 z-10 inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-[11px] font-bold text-white">
              <Layers size={11} />
              {cert.items.length}
            </span>
          )}
        </div>

        {/* Engraved museum plaque */}
        <div className="cert-plaque mx-auto -mt-1 w-[86%] rounded-b-lg border border-t-0 border-line px-4 py-3 text-center">
          <p className="line-clamp-2 text-sm font-semibold leading-snug transition-colors group-hover:text-accent">
            {cert.shortName}
          </p>
          <p className="mt-1 text-[11px] uppercase tracking-[0.14em] text-muted">
            {cert.org} · {cert.date}
          </p>
          {cert.isBundle && (
            <p className="mt-1.5 inline-flex items-center gap-1 text-[11px] font-semibold text-accent">
              <Layers size={11} /> {cert.items.length} documents in this credential
            </p>
          )}
          <span className="mt-2.5 inline-flex items-center gap-1 text-[11px] font-semibold text-accent opacity-0 transition-opacity group-hover:opacity-100">
            {cert.isBundle ? "View all documents" : "View certificate"} <ArrowUpRight size={12} />
          </span>
        </div>
      </Link>
    </m.div>
  );
}

export default function CertificateWall({ certificates, orgs, skills }) {
  const [org, setOrg] = useState("all");
  const [skill, setSkill] = useState("all");
  const [sort, setSort] = useState("newest");
  const [query, setQuery] = useState("");
  const [showAllSkills, setShowAllSkills] = useState(false);

  // Cursor-tracked spotlight across the wall.
  const wallRef = useRef(null);
  const mx = useSpring(useMotionValue(50), { stiffness: 120, damping: 24 });
  const my = useSpring(useMotionValue(30), { stiffness: 120, damping: 24 });
  const spotlight = useMotionTemplate`radial-gradient(620px circle at ${mx}% ${my}%, color-mix(in srgb, var(--accent) 16%, transparent), transparent 70%)`;

  function handleWallMove(e) {
    const node = wallRef.current;
    if (!node) return;
    const rect = node.getBoundingClientRect();
    mx.set(((e.clientX - rect.left) / rect.width) * 100);
    my.set(((e.clientY - rect.top) / rect.height) * 100);
  }

  const visible = useMemo(() => {
    const q = query.trim().toLowerCase();
    const filtered = certificates.filter((c) => {
      if (org !== "all" && c.org !== org) return false;
      if (skill !== "all" && !c.skills.includes(skill)) return false;
      if (q && !`${c.name} ${c.org} ${c.kind} ${c.skills.join(" ")}`.toLowerCase().includes(q)) {
        return false;
      }
      return true;
    });

    const sorted = [...filtered];
    if (sort === "newest") sorted.sort((a, b) => b.issued.localeCompare(a.issued));
    if (sort === "oldest") sorted.sort((a, b) => a.issued.localeCompare(b.issued));
    if (sort === "org") sorted.sort((a, b) => a.org.localeCompare(b.org) || b.issued.localeCompare(a.issued));
    if (sort === "name") sorted.sort((a, b) => a.shortName.localeCompare(b.shortName));
    return sorted;
  }, [certificates, org, skill, sort, query]);

  const filtersActive = org !== "all" || skill !== "all" || query.trim() !== "";
  const shownSkills = showAllSkills ? skills : skills.slice(0, 10);

  function resetFilters() {
    setOrg("all");
    setSkill("all");
    setQuery("");
  }

  return (
    <div>
      {/* ---------------------------- Controls ---------------------------- */}
      <div className="mx-auto mb-6 max-w-4xl">
        <div className="rounded-3xl border border-line bg-card/70 p-5 shadow-lg backdrop-blur sm:p-6">
          <div className="flex flex-col gap-3 sm:flex-row">
            <div className="relative flex-1">
              <Search
                size={16}
                className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-muted"
              />
              <input
                type="search"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Search certificates, skills or issuers…"
                aria-label="Search certificates"
                className="w-full rounded-full border border-line bg-bg-soft py-2.5 pl-11 pr-4 text-sm outline-none transition-colors placeholder:text-muted focus:border-accent"
              />
            </div>
            <div className="relative">
              <SlidersHorizontal
                size={15}
                className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-muted"
              />
              <select
                value={sort}
                onChange={(e) => setSort(e.target.value)}
                aria-label="Sort certificates"
                className="w-full appearance-none rounded-full border border-line bg-bg-soft py-2.5 pl-10 pr-9 text-sm outline-none transition-colors focus:border-accent sm:w-52"
              >
                {SORTS.map((s) => (
                  <option key={s.id} value={s.id}>
                    {s.label}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="mt-5">
            <p className="mb-2.5 flex items-center gap-1.5 text-[11px] font-semibold uppercase tracking-[0.16em] text-muted">
              <Building2 size={12} /> Issuing organisation
            </p>
            <div className="flex flex-wrap gap-2">
              <FilterPill active={org === "all"} onClick={() => setOrg("all")} count={certificates.length}>
                All
              </FilterPill>
              {orgs.map((o) => (
                <FilterPill
                  key={o.org}
                  active={org === o.org}
                  onClick={() => setOrg(org === o.org ? "all" : o.org)}
                  count={o.count}
                >
                  {o.org}
                </FilterPill>
              ))}
            </div>
          </div>

          <div className="mt-5">
            <p className="mb-2.5 flex items-center gap-1.5 text-[11px] font-semibold uppercase tracking-[0.16em] text-muted">
              <Sparkles size={12} /> Skill
            </p>
            <div className="flex flex-wrap gap-2">
              <FilterPill active={skill === "all"} onClick={() => setSkill("all")}>
                All skills
              </FilterPill>
              {shownSkills.map((s) => (
                <FilterPill
                  key={s.skill}
                  active={skill === s.skill}
                  onClick={() => setSkill(skill === s.skill ? "all" : s.skill)}
                  count={s.count}
                >
                  {s.skill}
                </FilterPill>
              ))}
              {skills.length > 10 && (
                <button
                  type="button"
                  onClick={() => setShowAllSkills((v) => !v)}
                  className="rounded-full px-3 py-1.5 text-xs font-semibold text-accent underline-offset-4 hover:underline"
                >
                  {showAllSkills ? "Show fewer" : `+${skills.length - 10} more`}
                </button>
              )}
            </div>
          </div>

          <div className="mt-5 flex items-center justify-between border-t border-line pt-4">
            <p className="text-xs text-muted">
              Showing <span className="font-semibold text-fg">{visible.length}</span> of{" "}
              {certificates.length} certificates
            </p>
            <AnimatePresence>
              {filtersActive && (
                <m.button
                  type="button"
                  onClick={resetFilters}
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.9 }}
                  className="inline-flex items-center gap-1.5 rounded-full border border-line px-3 py-1.5 text-xs font-medium text-muted transition-colors hover:border-accent hover:text-accent"
                >
                  <X size={12} /> Clear filters
                </m.button>
              )}
            </AnimatePresence>
          </div>
        </div>
      </div>

      {/* ------------------------------ Wall ------------------------------ */}
      <div
        ref={wallRef}
        onPointerMove={handleWallMove}
        className="relative -mx-4 rounded-[2rem] px-4 pb-8 pt-6 sm:-mx-6 sm:px-6 sm:pb-12 sm:pt-8"
      >
        <m.div
          className="pointer-events-none absolute inset-0 rounded-[2rem]"
          style={{ background: spotlight }}
          aria-hidden
        />

        {visible.length === 0 ? (
          <m.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            className="relative mx-auto max-w-md rounded-2xl border border-dashed border-line bg-card/60 p-10 text-center"
          >
            <CalendarDays size={26} className="mx-auto mb-3 text-muted" />
            <p className="font-semibold">No certificates match those filters</p>
            <p className="mt-1.5 text-sm text-muted">Try a different skill or organisation.</p>
            <button
              type="button"
              onClick={resetFilters}
              className="mt-5 rounded-full bg-accent px-5 py-2 text-sm font-semibold text-white"
            >
              Clear filters
            </button>
          </m.div>
        ) : (
          <m.div
            // Remounting on filter change replays the stagger.
            key={`${org}|${skill}|${sort}|${query}`}
            initial="hidden"
            animate="show"
            variants={{ hidden: {}, show: { transition: { staggerChildren: 0.08 } } }}
            className="relative grid gap-x-7 gap-y-12 sm:grid-cols-2 xl:grid-cols-3"
          >
            {visible.map((cert, i) => (
              <FramedCertificate key={cert.slug} cert={cert} index={i} />
            ))}
          </m.div>
        )}
      </div>
    </div>
  );
}
