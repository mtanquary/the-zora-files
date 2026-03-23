"use client";

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

  return (
    <header className="border-b border-rule px-6 py-4">
      <nav className="mx-auto flex max-w-[780px] items-center justify-between">
        <Link
          href="/"
          className="font-display-ornate text-base tracking-wide text-zora-amber"
        >
          the zora files
        </Link>

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
      </nav>
    </header>
  );
}
