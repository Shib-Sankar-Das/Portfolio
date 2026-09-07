import { Camera, Globe2, Image as ImageIcon } from "lucide-react";
import Navbar from "@/components/navbar";
import Footer from "@/components/footer";
import { Contact } from "@/components/sections";
import { Reveal } from "@/components/motion";
import GalleryWall from "@/components/gallery/gallery-wall";
import { galleryCountries, wallPhotos } from "@/lib/gallery-db";

const galleryIntro = {
  eyebrow: "The Gallery",
  title: "Places, people and the",
  titleAccent: "moments in between",
  lead: "A wall of photographs from the road — festivals, workshops, campuses and quiet corners. Click any frame to step up to it.",
};

export const metadata = {
  title: "Gallery",
  description:
    "A wall of photographs from the road — festivals, workshops, campuses and the moments in between.",
};

export default function GalleryPage() {
  // The wall is built from the shared database the admin app writes to. Each
  // row carries the picture's own pixel size, so every frame is cut to it.
  const photos = wallPhotos();
  const countries = galleryCountries();

  const stats = [
    { icon: ImageIcon, value: photos.length, label: "Photographs" },
    ...(countries.length
      ? [{ icon: Globe2, value: countries.length, label: countries.length === 1 ? "Country" : "Countries" }]
      : []),
  ];

  return (
    <>
      <Navbar />
      <main>
        {/* Header */}
        <section className="relative overflow-hidden pt-16">
          <div className="bg-grid absolute inset-0" aria-hidden />
          <div className="glow-blob right-[-8%] top-[8%] h-72 w-72" aria-hidden />
          <div className="glow-blob bottom-[-16%] left-[-6%] h-72 w-72" aria-hidden />

          <div className="relative z-10 mx-auto w-full max-w-6xl px-4 py-16 sm:px-6 sm:py-20">
            <Reveal>
              <p className="mb-4 inline-flex items-center gap-2 rounded-full border border-line bg-card/60 px-4 py-1.5 text-xs font-medium uppercase tracking-wider text-muted backdrop-blur">
                <Camera size={13} className="text-accent" />
                {galleryIntro.eyebrow}
              </p>
              <h1 className="max-w-3xl text-4xl font-bold leading-tight tracking-tight sm:text-5xl">
                {galleryIntro.title}{" "}
                <span className="text-gradient">{galleryIntro.titleAccent}</span>
              </h1>
              <p className="mt-5 max-w-2xl text-sm leading-relaxed text-muted sm:text-base">
                {galleryIntro.lead}
              </p>
            </Reveal>

            {stats.length > 0 && (
              <Reveal delay={0.12} className="mt-9 flex flex-wrap gap-3">
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
            )}

            {countries.length > 1 && (
              <Reveal delay={0.18} className="mt-5 flex flex-wrap items-center gap-x-5 gap-y-2">
                {countries.map(({ country, count }) => (
                  <span key={country} className="text-xs text-muted">
                    {country}
                    <span className="ml-1.5 font-mono text-[10px] text-muted/60">{count}</span>
                  </span>
                ))}
              </Reveal>
            )}
          </div>
        </section>

        {/* The wall */}
        <section className="gal-wall relative">
          {/* Picture rail the hang sits under */}
          <div className="gal-rail h-2 w-full" aria-hidden />

          <div className="mx-auto w-full max-w-[100rem] px-4 py-12 sm:px-8 sm:py-16 lg:px-12">
            {photos.length === 0 ? (
              <div className="mx-auto max-w-md rounded-2xl border border-dashed border-line bg-card/70 px-6 py-16 text-center backdrop-blur">
                <Camera size={26} className="mx-auto text-accent" />
                <p className="mt-3 font-semibold">The wall is empty</p>
                <p className="mt-1.5 text-sm text-muted">
                  Photographs are added in the admin panel, under{" "}
                  <span className="font-medium text-fg">Gallery → Add photograph</span>.
                  Each one hangs here as soon as it is published.
                </p>
              </div>
            ) : (
              <GalleryWall photos={photos} />
            )}
          </div>
        </section>

        <Contact />
      </main>
      <Footer />
    </>
  );
}
