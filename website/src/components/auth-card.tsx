import Link from "next/link";

export function AuthCard({
  title,
  subtitle,
  children,
}: {
  title: string;
  subtitle?: string;
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen flex items-center justify-center px-4 py-16">
      <div className="w-full max-w-sm">
        <div className="text-center mb-8">
          <Link
            href="/"
            className="font-display-ornate text-2xl text-zora-amber hover:opacity-90"
          >
            the zora files
          </Link>
          <h1 className="font-display text-base text-dawn-mist mt-4">{title}</h1>
          {subtitle && <p className="text-mist-dim text-sm mt-1">{subtitle}</p>}
        </div>
        {children}
      </div>
    </div>
  );
}

export const authInputClass =
  "w-full rounded-md border border-rule bg-pre-dawn-light px-3 py-2 text-sm text-dawn-mist placeholder:text-mist-dim/30 focus:border-zora-amber/50 focus:outline-none";

export const authLabelClass =
  "block font-mono text-[0.6rem] text-mist-dim/60 uppercase tracking-wider mb-1";

export const authPrimaryButtonClass =
  "w-full rounded-md bg-zora-amber px-4 py-2.5 text-sm font-medium text-pre-dawn transition-colors hover:bg-zora-amber/90 disabled:opacity-40 disabled:cursor-not-allowed";
