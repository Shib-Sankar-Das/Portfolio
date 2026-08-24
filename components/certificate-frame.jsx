import Image from "next/image";
import { certificateStatus } from "@/lib/certificate-utils";

/**
 * The artwork inside a frame. If a real scan exists at `cert.image` it is
 * shown; otherwise a certificate is composed from the metadata, so the wall
 * looks complete before any scans are uploaded. Sizing uses container query
 * units (cqw) so one design scales from thumbnail to full-page showcase.
 */
export function CertificateArtwork({ cert, priority = false, fit = "contain" }) {
  if (cert.image) {
    return (
      // `contain` keeps portrait letters and landscape certificates whole;
      // `cover` is only for uniform thumbnails where cropping is acceptable.
      <Image
        src={cert.image}
        alt={`${cert.name} certificate`}
        fill
        sizes="(max-width: 640px) 90vw, (max-width: 1024px) 45vw, 30vw"
        className={fit === "cover" ? "object-cover" : "object-contain"}
        priority={priority}
      />
    );
  }

  return (
    <div
      className="relative flex h-full w-full flex-col items-center justify-center overflow-hidden bg-[#fbf9f4] px-[7%] py-[6%] text-center"
      style={{ "--org": cert.orgColor }}
    >
      {/* Double rule border + guilloché hatching */}
      <div
        className="pointer-events-none absolute inset-[3.5%] rounded-[2px] border"
        style={{ borderColor: "color-mix(in srgb, var(--org) 34%, transparent)" }}
      />
      <div
        className="pointer-events-none absolute inset-[5.5%] rounded-[2px] border"
        style={{ borderColor: "color-mix(in srgb, var(--org) 16%, transparent)" }}
      />
      <div
        className="pointer-events-none absolute inset-0 opacity-[0.06]"
        style={{
          backgroundImage:
            "repeating-linear-gradient(45deg, var(--org) 0 1px, transparent 1px 7px)",
        }}
      />

      <p
        className="relative text-[clamp(0.5rem,1.5cqw,0.72rem)] font-bold uppercase tracking-[0.28em]"
        style={{ color: "var(--org)" }}
      >
        {cert.org}
      </p>
      <p className="relative mt-[3%] text-[clamp(0.42rem,1.15cqw,0.6rem)] uppercase tracking-[0.2em] text-neutral-500">
        {cert.kind}
      </p>

      <div
        className="relative my-[5%] h-px w-[38%]"
        style={{ background: "color-mix(in srgb, var(--org) 45%, transparent)" }}
      />

      <h3 className="relative line-clamp-4 text-[clamp(0.68rem,2.35cqw,1.15rem)] font-semibold leading-snug text-neutral-800">
        {cert.shortName}
      </h3>

      <p className="relative mt-[5%] text-[clamp(0.42rem,1.1cqw,0.58rem)] uppercase tracking-[0.18em] text-neutral-500">
        Issued {cert.date}
      </p>

      {/* Wax-seal emblem */}
      <div
        className="relative mt-[6%] flex h-[clamp(1.4rem,5cqw,2.4rem)] w-[clamp(1.4rem,5cqw,2.4rem)] items-center justify-center rounded-full text-[clamp(0.45rem,1.5cqw,0.8rem)] font-bold text-white shadow-sm"
        style={{
          background: `radial-gradient(circle at 34% 30%, color-mix(in srgb, ${cert.orgColor} 72%, white), ${cert.orgColor})`,
        }}
      >
        {cert.org.slice(0, 1)}
      </div>
    </div>
  );
}

const STATUS_STYLES = {
  active: { label: "Active", className: "bg-emerald-500/15 text-emerald-600 dark:text-emerald-400" },
  expiring: { label: "Renewing soon", className: "bg-amber-500/15 text-amber-600 dark:text-amber-400" },
  expired: { label: "Renewal due", className: "bg-rose-500/15 text-rose-600 dark:text-rose-400" },
  lifetime: { label: "No expiry", className: "bg-sky-500/15 text-sky-600 dark:text-sky-400" },
};

export function StatusBadge({ cert, className = "" }) {
  const status = STATUS_STYLES[certificateStatus(cert)] ?? STATUS_STYLES.lifetime;
  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[11px] font-semibold ${status.className} ${className}`}
    >
      <span className="h-1.5 w-1.5 rounded-full bg-current" />
      {status.label}
    </span>
  );
}
