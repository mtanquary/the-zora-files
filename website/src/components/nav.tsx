"use client";

import { useState, useRef, useEffect } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { BrandLockup } from "@/components/park";

/** Primary, nature-first destinations. */
const primaryLinks = [
  { href: "/lookouts", label: "Lookouts" },
  { href: "/expeditions", label: "Expeditions" },
  { href: "/gallery", label: "Gallery" },
  { href: "/field-guide", label: "Field guide" },
  { href: "/finding-zora/map", label: "Map" },
];

/** Finding Zora: the sunrise game, now its own series section. */
const findingZoraLinks = [
  { href: "/finding-zora", label: "Series overview" },
  { href: "/finding-zora/episodes", label: "Scored episodes" },
  { href: "/finding-zora/eos-index", label: "Eos index" },
  { href: "/finding-zora/discovery-log", label: "Discovery log" },
  { href: "/finding-zora/records", label: "Records" },
  { href: "/finding-zora/archives", label: "Sunrise archives" },
  { href: "/finding-zora/rules", label: "How the game works" },
  { href: "/finding-zora/score", label: "Score your sunrise" },
];

function isActive(pathname: string, href: string) {
  if (href === "/") return pathname === "/";
  if (href === "/finding-zora") return pathname === "/finding-zora";
  return pathname === href || pathname.startsWith(href + "/");
}

export function Nav() {
  const pathname = usePathname();
  const [mobileOpen, setMobileOpen] = useState(false);
  const [fzOpen, setFzOpen] = useState(false);
  const [signedIn, setSignedIn] = useState<boolean | null>(null);
  const fzRef = useRef<HTMLLIElement>(null);

  // The map is promoted to the main nav, so it doesn't light up the series tab.
  const inFindingZora =
    pathname.startsWith("/finding-zora") && !pathname.startsWith("/finding-zora/map");

  // Track member auth state for the account / sign-in link.
  useEffect(() => {
    const supabase = createClient();
    supabase.auth.getSession().then(({ data }) => setSignedIn(!!data.session));
    const { data: sub } = supabase.auth.onAuthStateChange((_event, session) => {
      setSignedIn(!!session);
    });
    return () => sub.subscription.unsubscribe();
  }, []);

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

  // Close menus on route change (adjust state during render, no effect needed)
  const [lastPath, setLastPath] = useState(pathname);
  if (lastPath !== pathname) {
    setLastPath(pathname);
    setFzOpen(false);
    setMobileOpen(false);
  }

  const linkClass = (active: boolean) =>
    `font-park-sans text-[0.95rem] font-semibold transition-colors border-b-2 pb-0.5 ${
      active
        ? "text-park-paper border-park-amber"
        : "text-park-paper/75 border-transparent hover:text-park-paper hover:border-park-amber/60"
    }`;

  const accountHref = signedIn ? "/account" : "/login";
  const accountLabel = signedIn ? "Account" : "Sign in";

  return (
    <header className="sticky top-0 z-40 bg-blue-hour shadow-[0_3px_0_var(--first-light)] print:hidden">
      <nav className="mx-auto flex max-w-[1080px] items-center justify-between gap-6 px-6 py-2.5">
        <Link href="/" className="flex shrink-0 items-center gap-3" aria-label="Finding Zora, The Zora Files home">
          <BrandLockup height={52} reverse />
          <span className="hidden border-l border-bone/25 pl-3 font-park-sans text-[0.7rem] font-semibold uppercase leading-tight tracking-[0.16em] text-night-muted sm:block">
            The Zora
            <br />
            Files
          </span>
        </Link>

        {/* Desktop nav */}
        <ul className="hidden items-center gap-6 lg:flex">
          {primaryLinks.map(({ href, label }) => (
            <li key={href}>
              <Link href={href} className={linkClass(isActive(pathname, href))}>
                {label}
              </Link>
            </li>
          ))}

          {/* Finding Zora dropdown: keeps the game's own pre-dawn look */}
          <li ref={fzRef} className="relative">
            <button
              onClick={() => setFzOpen(!fzOpen)}
              aria-expanded={fzOpen}
              className={linkClass(inFindingZora)}
            >
              The game
              <span
                className={`ml-1 inline-block text-[0.6rem] transition-transform ${fzOpen ? "rotate-180" : ""}`}
              >
                ▾
              </span>
            </button>

            {fzOpen && (
              <div className="absolute right-0 top-full z-50 mt-3 min-w-[230px] overflow-hidden rounded-sm border border-night-rule bg-blue-hour shadow-lg shadow-char/40">
                <p className="border-b border-night-rule px-4 py-2 font-mono text-[0.62rem] uppercase tracking-[0.16em] text-night-muted">
                  Finding Zora, the game
                </p>
                {findingZoraLinks.map(({ href, label }) => (
                  <Link
                    key={href}
                    href={href}
                    className={`block px-4 py-2 font-park-sans text-sm transition-colors hover:bg-night-slab hover:text-park-amber ${
                      isActive(pathname, href) ? "text-park-amber" : "text-bone"
                    }`}
                  >
                    {label}
                  </Link>
                ))}
              </div>
            )}
          </li>

          <li>
            <Link href="/about" className={linkClass(isActive(pathname, "/about"))}>
              About
            </Link>
          </li>

          {signedIn !== null && (
            <li>
              <Link
                href={accountHref}
                className="rounded-full border border-park-paper/40 px-3 py-1 font-park-sans text-sm font-semibold text-park-paper/85 transition-colors hover:border-park-amber hover:text-park-paper"
              >
                {accountLabel}
              </Link>
            </li>
          )}
        </ul>

        {/* Mobile hamburger */}
        <button
          onClick={() => setMobileOpen(!mobileOpen)}
          className="flex flex-col gap-1.5 p-2 lg:hidden"
          aria-label="Toggle menu"
          aria-expanded={mobileOpen}
        >
          <span
            className={`block h-0.5 w-6 bg-park-paper transition-all duration-200 ${
              mobileOpen ? "translate-y-[8px] rotate-45" : ""
            }`}
          />
          <span
            className={`block h-0.5 w-6 bg-park-paper transition-all duration-200 ${
              mobileOpen ? "opacity-0" : ""
            }`}
          />
          <span
            className={`block h-0.5 w-6 bg-park-paper transition-all duration-200 ${
              mobileOpen ? "-translate-y-[8px] -rotate-45" : ""
            }`}
          />
        </button>
      </nav>

      {/* Mobile menu */}
      {mobileOpen && (
        <div className="max-h-[calc(100vh-64px)] overflow-y-auto border-t border-park-paper/10 px-6 pb-6 pt-4 lg:hidden">
          <ul className="mx-auto flex max-w-[1080px] flex-col gap-3">
            {[{ href: "/", label: "Home" }, ...primaryLinks, { href: "/about", label: "About" }].map(
              ({ href, label }) => (
                <li key={href}>
                  <Link href={href} className={linkClass(isActive(pathname, href))}>
                    {label}
                  </Link>
                </li>
              )
            )}
            {signedIn !== null && (
              <li>
                <Link href={accountHref} className={linkClass(isActive(pathname, accountHref))}>
                  {accountLabel}
                </Link>
              </li>
            )}
            <li className="mt-3 border-t border-park-paper/10 pt-3">
              <p className="font-park-sans text-[0.68rem] font-semibold uppercase tracking-[0.2em] text-park-amber/90">
                Finding Zora, the game
              </p>
              <ul className="mt-2 grid grid-cols-2 gap-x-4 gap-y-2">
                {findingZoraLinks.map(({ href, label }) => (
                  <li key={href}>
                    <Link
                      href={href}
                      className={`font-park-sans text-sm transition-colors hover:text-park-paper ${
                        isActive(pathname, href) ? "text-park-amber" : "text-park-paper/65"
                      }`}
                    >
                      {label}
                    </Link>
                  </li>
                ))}
              </ul>
            </li>
          </ul>
        </div>
      )}
    </header>
  );
}
