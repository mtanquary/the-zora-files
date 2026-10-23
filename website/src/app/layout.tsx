import type { Metadata } from "next";
import Link from "next/link";
import { Nav } from "@/components/nav";
import { ZoraMark } from "@/components/park";
import "./globals.css";

export const metadata: Metadata = {
  metadataBase: new URL("https://thezorafiles.com"),
  title: {
    default: "Finding Zora · The Zora Files",
    template: "%s · The Zora Files",
  },
  description:
    "The sunrise is the excuse. Fire lookouts, places worth the drive, photographs, field notes, and Finding Zora, the show.",
};

const footerColumns = [
  {
    title: "Explore",
    links: [
      { href: "/expeditions", label: "Expeditions" },
      { href: "/lookouts", label: "Fire lookouts" },
      { href: "/gallery", label: "Gallery" },
      { href: "/field-guide", label: "Field guide" },
      { href: "/finding-zora/map", label: "Map" },
    ],
  },
  {
    title: "Finding Zora",
    links: [
      { href: "/finding-zora", label: "The game" },
      { href: "/finding-zora/eos-index", label: "Eos index" },
      { href: "/finding-zora/records", label: "Records" },
      { href: "/finding-zora/score", label: "Score your sunrise" },
    ],
  },
  {
    title: "Follow along",
    links: [
      { href: "https://www.youtube.com/@TheZoraFiles", label: "YouTube" },
      { href: "https://www.instagram.com/thezorafiles", label: "Instagram" },
      { href: "https://www.tiktok.com/@thezorafiles", label: "TikTok" },
      { href: "/about", label: "About the host" },
    ],
  },
];

function SiteFooter() {
  return (
    <footer className="border-t-[3px] border-first-light bg-blue-hour text-bone print:hidden">
      <div className="mx-auto grid max-w-[1080px] gap-10 px-6 pb-8 pt-12 md:grid-cols-[1.3fr_1fr_1fr_1fr]">
        <div>
          <ZoraMark size={64} variant="reverse" />
          <p className="mt-5 font-park-display text-3xl font-extrabold uppercase leading-none tracking-[0.04em]">
            The sunrise
            <br />
            is the excuse.
          </p>
          <p className="mt-4 max-w-[300px] font-park-sans text-sm leading-relaxed text-night-muted">
            Lookouts, photographs, field notes, and the show. The Zora Files is home base for all of it.
          </p>
        </div>
        {footerColumns.map((col) => (
          <div key={col.title}>
            <p className="font-park-sans text-[0.72rem] font-semibold uppercase tracking-[0.18em] text-night-muted">
              {col.title}
            </p>
            <ul className="mt-3 space-y-2">
              {col.links.map((l) => (
                <li key={l.href}>
                  {l.href.startsWith("http") ? (
                    <a
                      href={l.href}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="font-park-sans text-sm text-bone/85 transition-colors hover:text-first-light"
                    >
                      {l.label}
                    </a>
                  ) : (
                    <Link
                      href={l.href}
                      className="font-park-sans text-sm text-bone/85 transition-colors hover:text-first-light"
                    >
                      {l.label}
                    </Link>
                  )}
                </li>
              ))}
            </ul>
          </div>
        ))}
      </div>
      <div className="border-t border-night-rule">
        <p className="stamp mx-auto flex max-w-[1080px] flex-wrap justify-between gap-2 px-6 py-4 text-[0.7rem] text-night-muted">
          <span>thezorafiles.com · #findingzora #thezorafiles</span>
          <span>Zora found.</span>
        </p>
      </div>
    </footer>
  );
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="h-full antialiased">
      <body className="min-h-full flex flex-col bg-background text-foreground font-body">
        <Nav />
        <main className="flex-1">{children}</main>
        <SiteFooter />
      </body>
    </html>
  );
}
