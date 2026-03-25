"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";

const links = [
  { href: "/", label: "home" },
  { href: "/episodes", label: "episodes" },
  { href: "/eos-index", label: "eos index" },
  { href: "/discovery-log", label: "discoveries" },
  { href: "/records", label: "records" },
  { href: "/rules", label: "rules" },
  { href: "/about", label: "about" },
];

export function Nav() {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);

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
          {links.map(({ href, label }) => {
            const active =
              href === "/" ? pathname === "/" : pathname.startsWith(href);
            return (
              <li key={href}>
                <Link
                  href={href}
                  className={`font-mono text-[0.65rem] tracking-[0.08em] uppercase transition-colors hover:text-zora-amber ${
                    active ? "text-zora-amber" : "text-mist-dim"
                  }`}
                >
                  {label}
                </Link>
              </li>
            );
          })}
        </ul>

        {/* Mobile hamburger */}
        <button
          onClick={() => setOpen(!open)}
          className="md:hidden flex flex-col gap-1.5 p-1"
          aria-label="Toggle menu"
        >
          <span
            className={`block w-5 h-px bg-dawn-mist transition-all duration-200 ${
              open ? "rotate-45 translate-y-[3.5px]" : ""
            }`}
          />
          <span
            className={`block w-5 h-px bg-dawn-mist transition-all duration-200 ${
              open ? "opacity-0" : ""
            }`}
          />
          <span
            className={`block w-5 h-px bg-dawn-mist transition-all duration-200 ${
              open ? "-rotate-45 -translate-y-[3.5px]" : ""
            }`}
          />
        </button>
      </nav>

      {/* Mobile menu */}
      {open && (
        <div className="md:hidden mx-auto max-w-[780px] pt-4 pb-2">
          <ul className="flex flex-col gap-3">
            {links.map(({ href, label }) => {
              const active =
                href === "/" ? pathname === "/" : pathname.startsWith(href);
              return (
                <li key={href}>
                  <Link
                    href={href}
                    onClick={() => setOpen(false)}
                    className={`block font-mono text-[0.7rem] tracking-[0.08em] uppercase transition-colors hover:text-zora-amber ${
                      active ? "text-zora-amber" : "text-mist-dim"
                    }`}
                  >
                    {label}
                  </Link>
                </li>
              );
            })}
          </ul>
        </div>
      )}
    </header>
  );
}
