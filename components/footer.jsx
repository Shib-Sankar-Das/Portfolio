import { profile } from "@/lib/data";

export default function Footer() {
  return (
    <footer className="border-t border-line py-8">
      <div className="mx-auto flex w-full max-w-6xl flex-col items-center justify-between gap-3 px-4 text-center text-xs text-muted sm:flex-row sm:px-6 sm:text-left">
        <p>
          © {new Date().getFullYear()} {profile.name}. All rights reserved.
        </p>
        <p>
          Built with <span className="text-accent">Next.js</span>,{" "}
          <span className="text-accent">Three.js</span> &{" "}
          <span className="text-accent">Framer Motion</span>
        </p>
      </div>
    </footer>
  );
}
