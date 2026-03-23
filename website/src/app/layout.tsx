import type { Metadata } from "next";
import { Nav } from "@/components/nav";
import "./globals.css";

export const metadata: Metadata = {
  title: {
    default: "the zora files",
    template: "%s — the zora files",
  },
  description:
    "Every sunrise gets scored. A pursuit of the perfect dawn, one expedition at a time.",
};

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
        <footer className="border-t border-rule py-6 px-6 text-center">
          <p className="font-mono text-[0.58rem] tracking-[0.14em] text-mist-dim/35 uppercase">
            the zora files · finding zora · thezorafiles.com
          </p>
          <p className="font-mono text-[0.58rem] tracking-[0.1em] text-mist-dim/20 uppercase mt-1">
            Every sunrise belongs to someone. This is the record of one.
          </p>
        </footer>
      </body>
    </html>
  );
}
