import { BookOpen, FileText, Layers, Library as LibraryIcon } from "lucide-react";
import Navbar from "@/components/navbar";
import Footer from "@/components/footer";
import { Contact } from "@/components/sections";
import { Reveal } from "@/components/motion";
import Bookshelf from "@/components/library/bookshelf";
import { buildShelves, libraryStats } from "@/lib/library-db";

export const metadata = {
  title: "Library",
  description:
    "A shelf of the books and research papers behind the work — literature, computer science, robotics and artificial intelligence.",
};

export default function LibraryPage() {
  // The shelf is built from the database the admin panel writes to.
  const shelves = buildShelves();
  const counts = libraryStats();
  const stats = [
    { icon: BookOpen, value: counts.books, label: "Books" },
    { icon: FileText, value: counts.papers, label: "Papers" },
    { icon: Layers, value: counts.sections, label: "Sections" },
  ];

  return (
    <>
      <Navbar />
      <main>
        {/* Header */}
        <section className="relative overflow-hidden pt-16">
          <div className="bg-grid absolute inset-0" aria-hidden />
          <div className="glow-blob left-[-6%] top-[12%] h-72 w-72" aria-hidden />
          <div className="glow-blob bottom-[-14%] right-[-6%] h-72 w-72" aria-hidden />

          <div className="relative z-10 mx-auto w-full max-w-6xl px-4 py-16 sm:px-6 sm:py-20">
            <Reveal>
              <p className="mb-4 inline-flex items-center gap-2 rounded-full border border-line bg-card/60 px-4 py-1.5 text-xs font-medium uppercase tracking-wider text-muted backdrop-blur">
                <LibraryIcon size={13} className="text-accent" />
                The Library
              </p>
              <h1 className="max-w-3xl text-4xl font-bold leading-tight tracking-tight sm:text-5xl">
                What I read to <span className="text-gradient">build what I build</span>
              </h1>
              <p className="mt-5 max-w-2xl text-sm leading-relaxed text-muted sm:text-base">
                A shelf of the books and papers behind the work. Pull a book off the shelf
                to open and read it, or lift a stapled bundle to flip through the research
                papers inside.
              </p>
            </Reveal>

            <Reveal delay={0.12} className="mt-9 flex flex-wrap gap-3">
              {stats.map(({ icon: Icon, value, label }) => (
                <div
                  key={label}
                  className="flex items-center gap-2.5 rounded-2xl border border-line bg-card/70 px-4 py-2.5 backdrop-blur"
                >
                  <Icon size={15} className="text-accent" />
                  <span className="text-lg font-bold">{value}</span>
                  <span className="text-[11px] uppercase tracking-[0.14em] text-muted">{label}</span>
                </div>
              ))}
            </Reveal>

            {/* Jump links */}
            <Reveal delay={0.18} className="mt-5 flex flex-wrap gap-2">
              {shelves.map((shelf) => (
                <a
                  key={shelf.slug}
                  href={`#${shelf.slug}`}
                  className="rounded-full border border-line bg-card px-3.5 py-1.5 text-xs font-medium text-muted transition-colors hover:border-accent hover:text-accent"
                >
                  {shelf.title}
                </a>
              ))}
            </Reveal>
          </div>
        </section>

        {/* Shelves */}
        <section className="relative bg-bg-soft">
          <div className="mx-auto w-full max-w-6xl px-4 py-14 sm:px-6 sm:py-16">
            <Bookshelf shelves={shelves} />
          </div>
        </section>

        <Contact />
      </main>
      <Footer />
    </>
  );
}
