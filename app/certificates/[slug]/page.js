import Link from "next/link";
import { notFound } from "next/navigation";
import {
  ArrowLeft,
  ArrowRight,
  BadgeCheck,
  CalendarCheck,
  CalendarClock,
  ExternalLink,
  Globe,
  Hash,
  Infinity as InfinityIcon,
  ShieldCheck,
  Sparkles,
} from "lucide-react";
import Navbar from "@/components/navbar";
import Footer from "@/components/footer";
import CertificateShowcase from "@/components/certificate-showcase";
import { StatusBadge } from "@/components/certificate-frame";
import { Reveal, StaggerGroup, StaggerItem } from "@/components/motion";
import {
  certificateNeighbours,
  certificateStatus,
  certificates,
  formatMonthYear,
  getCertificate,
} from "@/lib/certificates";
import { domains } from "@/lib/data";

export const dynamicParams = false;

export function generateStaticParams() {
  return certificates.map((c) => ({ slug: c.slug }));
}

export async function generateMetadata({ params }) {
  const { slug } = await params;
  const cert = getCertificate(slug);
  if (!cert) return {};
  return { title: cert.shortName, description: cert.summary };
}

/** Percentage of the validity window already elapsed (null when lifetime). */
function validityProgress(cert) {
  if (!cert.expires) return null;
  const start = new Date(cert.issued).getTime();
  const end = new Date(cert.expires).getTime();
  const now = Date.now();
  return Math.max(0, Math.min(100, ((now - start) / (end - start)) * 100));
}

export default async function CertificateDetailPage({ params }) {
  const { slug } = await params;
  const cert = getCertificate(slug);
  if (!cert) notFound();

  const { prev, next } = certificateNeighbours(slug);
  const status = certificateStatus(cert);
  const progress = validityProgress(cert);
  const featuredIn = domains.filter((d) => d.certificateSlugs?.includes(slug));
  const hasVerifyLink = cert.verifyUrl && cert.verifyUrl !== "#";

  return (
    <>
      <Navbar />
      <main className="cert-wall min-h-svh">
        <div className="mx-auto w-full max-w-6xl px-4 pb-20 pt-28 sm:px-6 sm:pt-32">
          <Reveal>
            <Link
              href="/certificates"
              className="inline-flex items-center gap-2 text-sm font-medium text-muted transition-colors hover:text-accent"
            >
              <ArrowLeft size={15} /> Back to the wall
            </Link>
          </Reveal>

          <div className="mt-8 grid gap-10 lg:grid-cols-[minmax(0,1fr)_minmax(0,1.05fr)] lg:gap-14">
            {/* ------------------------- The frame ------------------------- */}
            <Reveal className="lg:sticky lg:top-28 lg:self-start">
              <CertificateShowcase cert={cert} />
              {!cert.image && (
                <p className="mt-5 text-center text-xs text-muted">
                  Rendered from credential data — the original certificate is available
                  through the verification links.
                </p>
              )}
            </Reveal>

            {/* ------------------------- The details ----------------------- */}
            <div>
              <Reveal>
                <div className="flex flex-wrap items-center gap-2.5">
                  <span
                    className="inline-flex items-center gap-2 rounded-full px-3 py-1.5 text-xs font-bold text-white"
                    style={{ backgroundColor: cert.orgColor }}
                  >
                    {cert.org}
                  </span>
                  <span className="rounded-full border border-line bg-card px-3 py-1.5 text-xs font-medium text-muted">
                    {cert.kind}
                  </span>
                  <StatusBadge cert={cert} />
                </div>

                <h1 className="mt-5 text-3xl font-bold leading-tight tracking-tight sm:text-4xl">
                  {cert.name}
                </h1>

                <p className="mt-4 text-base leading-relaxed text-muted">{cert.summary}</p>
              </Reveal>

              {/* Timeline */}
              <Reveal delay={0.08} className="mt-9">
                <h2 className="mb-4 flex items-center gap-2 text-sm font-bold uppercase tracking-[0.16em] text-accent">
                  <CalendarCheck size={14} /> Timeline
                </h2>
                <div className="rounded-2xl border border-line bg-card p-6">
                  <div className="flex items-start justify-between gap-4">
                    <div>
                      <p className="text-[11px] uppercase tracking-[0.14em] text-muted">Earned</p>
                      <p className="mt-1 text-lg font-bold">{formatMonthYear(cert.issued)}</p>
                    </div>
                    <div className="text-right">
                      <p className="text-[11px] uppercase tracking-[0.14em] text-muted">
                        {cert.expires ? "Valid through" : "Validity"}
                      </p>
                      <p className="mt-1 flex items-center justify-end gap-1.5 text-lg font-bold">
                        {cert.expires ? (
                          formatMonthYear(cert.expires)
                        ) : (
                          <>
                            <InfinityIcon size={18} className="text-accent" /> Lifetime
                          </>
                        )}
                      </p>
                    </div>
                  </div>

                  {/* Progress rail */}
                  <div className="relative mt-5 h-2 rounded-full bg-bg-soft">
                    <div
                      className="absolute inset-y-0 left-0 rounded-full bg-gradient-to-r from-accent to-accent-2"
                      style={{ width: progress == null ? "100%" : `${progress}%` }}
                    />
                    <span className="absolute -top-1 left-0 h-4 w-4 rounded-full border-2 border-accent bg-bg" />
                    <span
                      className={`absolute -top-1 right-0 h-4 w-4 rounded-full border-2 bg-bg ${
                        cert.expires ? "border-line" : "border-accent"
                      }`}
                    />
                  </div>

                  <p className="mt-4 flex items-center gap-2 text-xs text-muted">
                    {cert.expires ? (
                      <>
                        <CalendarClock size={13} className="shrink-0 text-accent" />
                        {status === "expired"
                          ? "This credential is past its renewal date."
                          : `Expires ${formatMonthYear(cert.expires)}${
                              cert.renewable ? " and is renewable." : "."
                            }`}
                      </>
                    ) : (
                      <>
                        <ShieldCheck size={13} className="shrink-0 text-accent" />
                        This credential does not expire — once earned, it stays valid.
                      </>
                    )}
                  </p>

                  {cert.credentialId && (
                    <p className="mt-3 flex items-center gap-2 text-xs text-muted">
                      <Hash size={13} className="shrink-0 text-accent" />
                      Credential ID: <span className="font-mono">{cert.credentialId}</span>
                    </p>
                  )}
                </div>
              </Reveal>

              {/* About */}
              <Reveal delay={0.12} className="mt-9">
                <h2 className="mb-4 flex items-center gap-2 text-sm font-bold uppercase tracking-[0.16em] text-accent">
                  <BadgeCheck size={14} /> About this credential
                </h2>
                <p className="text-sm leading-relaxed text-muted">{cert.description}</p>
                <ul className="mt-5 space-y-2.5">
                  {cert.highlights.map((h) => (
                    <li key={h} className="flex gap-3 text-sm leading-relaxed text-muted">
                      <span className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-accent" />
                      {h}
                    </li>
                  ))}
                </ul>
              </Reveal>

              {/* Skills */}
              <Reveal delay={0.16} className="mt-9">
                <h2 className="mb-4 flex items-center gap-2 text-sm font-bold uppercase tracking-[0.16em] text-accent">
                  <Sparkles size={14} /> Skills gained
                </h2>
                <StaggerGroup className="flex flex-wrap gap-2.5">
                  {cert.skills.map((s) => (
                    <StaggerItem key={s}>
                      <span className="inline-block rounded-full border border-line bg-card px-4 py-2 text-xs font-medium shadow-sm transition-colors hover:border-accent hover:text-accent">
                        {s}
                      </span>
                    </StaggerItem>
                  ))}
                </StaggerGroup>
              </Reveal>

              {/* Verification */}
              <Reveal delay={0.2} className="mt-9">
                <h2 className="mb-4 flex items-center gap-2 text-sm font-bold uppercase tracking-[0.16em] text-accent">
                  <ShieldCheck size={14} /> Verify this certificate
                </h2>
                <div className="rounded-2xl border border-line bg-card p-6">
                  <p className="text-sm text-muted">
                    {hasVerifyLink
                      ? "Confirm this credential directly with the issuing organisation."
                      : "The public verification link for this credential is being added. In the meantime you can confirm it through the issuer's credential portal."}
                  </p>
                  <div className="mt-5 flex flex-wrap gap-3">
                    {hasVerifyLink && (
                      <a
                        href={cert.verifyUrl}
                        target="_blank"
                        rel="noreferrer"
                        className="inline-flex items-center gap-2 rounded-full bg-gradient-to-r from-accent to-accent-2 px-5 py-2.5 text-sm font-semibold text-white shadow-md transition-transform hover:scale-[1.04]"
                      >
                        <ShieldCheck size={15} /> Verify credential
                      </a>
                    )}
                    <a
                      href={cert.orgUrl}
                      target="_blank"
                      rel="noreferrer"
                      className="inline-flex items-center gap-2 rounded-full border border-line px-5 py-2.5 text-sm font-medium transition-colors hover:border-accent hover:text-accent"
                    >
                      <Globe size={15} /> {cert.org} credential portal
                      <ExternalLink size={13} className="opacity-60" />
                    </a>
                  </div>
                </div>
              </Reveal>

              {/* Featured in */}
              {featuredIn.length > 0 && (
                <Reveal delay={0.24} className="mt-9">
                  <h2 className="mb-4 text-sm font-bold uppercase tracking-[0.16em] text-accent">
                    Featured in
                  </h2>
                  <div className="flex flex-wrap gap-3">
                    {featuredIn.map((d) => (
                      <Link
                        key={d.slug}
                        href={`/${d.slug}`}
                        className="inline-flex items-center gap-2 rounded-full border border-line bg-card px-4 py-2 text-xs font-medium transition-colors hover:border-accent hover:text-accent"
                      >
                        {d.shortTitle} <ArrowRight size={13} />
                      </Link>
                    ))}
                  </div>
                </Reveal>
              )}
            </div>
          </div>

          {/* --------------------- Prev / next navigation -------------------- */}
          <Reveal className="mt-20 grid gap-4 border-t border-line pt-8 sm:grid-cols-2">
            {prev ? (
              <Link
                href={`/certificates/${prev.slug}`}
                className="card-hover group rounded-2xl border border-line bg-card p-5"
              >
                <p className="flex items-center gap-1.5 text-[11px] uppercase tracking-[0.14em] text-muted">
                  <ArrowLeft size={12} /> Newer
                </p>
                <p className="mt-2 font-semibold leading-snug transition-colors group-hover:text-accent">
                  {prev.shortName}
                </p>
              </Link>
            ) : (
              <div />
            )}
            {next && (
              <Link
                href={`/certificates/${next.slug}`}
                className="card-hover group rounded-2xl border border-line bg-card p-5 sm:text-right"
              >
                <p className="flex items-center gap-1.5 text-[11px] uppercase tracking-[0.14em] text-muted sm:justify-end">
                  Older <ArrowRight size={12} />
                </p>
                <p className="mt-2 font-semibold leading-snug transition-colors group-hover:text-accent">
                  {next.shortName}
                </p>
              </Link>
            )}
          </Reveal>
        </div>
      </main>
      <Footer />
    </>
  );
}
