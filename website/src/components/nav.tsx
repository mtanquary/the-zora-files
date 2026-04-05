"use client";

import { useState, useRef, useEffect } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";

const topLinks = [
  { href: "/", label: "home" },
  { href: "/about", label: "about" },
];

const findingZoraLinks = [
  { href: "/finding-zora", label: "overview" },
  { href: "/finding-zora/episodes", label: "episodes" },
  { href: "/finding-zora/eos-index", label: "eos index" },
  { href: "/finding-zora/discovery-log", label: "discoveries" },
  { href: "/finding-zora/records", label: "records" },
  { href: "/finding-zora/rules", label: "rules" },
  { href: "/finding-zora/archives", label: "archives" },
];

export function Nav() {
  const pathname = usePathname();
  const [mobileOpen, setMobileOpen] = useState(false);
  const [fzOpen, setFzOpen] = useState(false);
  const fzRef = useRef<HTMLLIElement>(null);

  const inFindingZora = pathname.startsWith("/finding-zora");

  // Close desktop dropdown on outside click
  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (fzRef.current && !fzRef.current.contains(e.target as Node)) {
        setFzOpen(false);
      }
    }
    document.addEventListener("click", handleClick);
    return () => document.removeEventListener("click", handleClick);
  }, []);

  // Close dropdown on route change
  useEffect(() => {
    setFzOpen(false);
    setMobileOpen(false);
  }, [pathname]);

  const linkClass = (href: string) => {
    const active =
      href === "/" ? pathname === "/" : pathname.startsWith(href);
    return `font-mono text-[0.65rem] tracking-[0.08em] uppercase transition-colors hover:text-zora-amber ${
      active ? "text-zora-amber" : "text-mist-dim"
    }`;
  };

  return (
    <header className="border-b border-rule px-6 py-4">
      <nav className="mx-auto flex max-w-[780px] items-center justify-between">
        <Link
          href="/"
          className="font-display-ornate text-base tracking-wide text-zora-amber"
        >
          the zora files
        </Link>

        {/* Desktop nav */}
        <ul className="hidden items-center gap-6 md:flex">
          <li>
            <Link href="/" className={linkClass("/")}>
              home
            </Link>
          </li>

          {/* Finding Zora dropdown */}
          <li ref={fzRef} className="relative">
            <button
              onClick={() => setFzOpen(!fzOpen)}
              className={`font-mono text-[0.65rem] tracking-[0.08em] uppercase transition-colors hover:text-zora-amber ${
                inFindingZora ? "text-zora-amber" : "text-mist-dim"
              }`}
            >
              finding zora
              <span className={`ml-1 inline-block transition-transform text-[0.5rem] ${fzOpen ? "rotate-180" : ""}`}>
                ▾
              </span>
            </button>

            {fzOpen && (
              <div className="absolute top-full left-1/2 -translate-x-1/2 mt-3 bg-pre-dawn-mid border border-rule rounded-md py-2 min-w-[160px] z-50 shadow-lg shadow-black/30">
                {findingZoraLinks.map(({ href, label }) => {
                  const active = href === "/finding-zora"
                    ? pathname === "/finding-zora"
                    : pathname.startsWith(href);
                  return (
                    <Link
                      key={href}
                      href={href}
                      className={`block px-4 py-1.5 font-mono text-[0.6rem] tracking-[0.08em] uppercase transition-colors hover:text-zora-amber hover:bg-pre-dawn-light ${
                        active ? "text-zora-amber" : "text-mist-dim"
                      }`}
                    >
                      {label}
                    </Link>
                  );
                })}
              </div>
            )}
          </li>

          <li>
            <Link href="/about" className={linkClass("/about")}>
              about
            </Link>
          </li>
        </ul>

        {/* Mobile hamburger */}
        <button
          onClick={() => setMobileOpen(!mobileOpen)}
          className="md:hidden flex flex-col gap-1.5 p-1"
          aria-label="Toggle menu"
        >
          <span
            className={`block w-5 h-px bg-dawn-mist transition-all duration-200 ${
              mobileOpen ? "rotate-45 translate-y-[3.5px]" : ""
            }`}
          />
          <span
            className={`block w-5 h-px bg-dawn-mist transition-all duration-200 ${
              mobileOpen ? "opacity-0" : ""
            }`}
          />
          <span
            className={`block w-5 h-px bg-dawn-mist transition-all duration-200 ${
              mobileOpen ? "-rotate-45 -translate-y-[3.5px]" : ""
            }`}
          />
        </button>
      </nav>

      {/* Mobile menu */}
      {mobileOpen && (
        <div className="md:hidden mx-auto max-w-[780px] pt-4 pb-2">
          <ul className="flex flex-col gap-3">
            <li>
              <Link
                href="/"
                onClick={() => setMobileOpen(false)}
                className={`block font-mono text-[0.7rem] tracking-[0.08em] uppercase transition-colors hover:text-zora-amber ${
                  pathname === "/" ? "text-zora-amber" : "text-mist-dim"
                }`}
              >
                home
              </Link>
            </li>

            {/* Finding Zora section */}
            <li>
              <p className={`font-mono text-[0.7rem] tracking-[0.08em] uppercase ${
                inFindingZora ? "text-zora-amber" : "text-mist-dim"
              }`}>
                finding zora
              </p>
              <ul className="mt-2 ml-4 flex flex-col gap-2">
                {findingZoraLinks.map(({ href, label }) => {
                  const active = href === "/finding-zora"
                    ? pathname === "/finding-zora"
                    : pathname.startsWith(href);
                  return (
                    <li key={href}>
                      <Link
                        href={href}
                        onClick={() => setMobileOpen(false)}
                        className={`block font-mono text-[0.65rem] tracking-[0.08em] uppercase transition-colors hover:text-zora-amber ${
                          active ? "text-zora-amber" : "text-mist-dim/70"
                        }`}
                      >
                        {label}
                      </Link>
                    </li>
                  );
                })}
              </ul>
            </li>

            <li>
              <Link
                href="/about"
                onClick={() => setMobileOpen(false)}
                className={`block font-mono text-[0.7rem] tracking-[0.08em] uppercase transition-colors hover:text-zora-amber ${
                  pathname === "/about" ? "text-zora-amber" : "text-mist-dim"
                }`}
              >
                about
              </Link>
            </li>
          </ul>
        </div>
      )}
    </header>
  );
}
