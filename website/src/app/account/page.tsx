import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { Ornament } from "@/components/atmosphere";
import { SignOutButton } from "@/components/sign-out-button";
import { getMemberOverview, getMemberSubmissions } from "@/lib/member";

export const metadata: Metadata = { title: "account" };
export const dynamic = "force-dynamic";

export default async function AccountPage() {
  const overview = await getMemberOverview();
  if (!overview) redirect("/login?next=/account");

  const submissions = await getMemberSubmissions(30);
  const resetDate = new Date(overview.resetsAt).toLocaleDateString("en-US", {
    month: "long",
    day: "numeric",
    timeZone: "UTC",
  });

  return (
    <div className="max-w-[780px] mx-auto px-8 py-16">
      <h1 className="font-display-ornate text-3xl text-zora-amber mb-2">account</h1>
      <p className="text-mist-dim">
        {overview.fullName ? `${overview.fullName} · ` : ""}
        {overview.email}
      </p>

      <Ornament label="This month" />

      <div className="bg-pre-dawn-mid border border-rule rounded-md p-6">
        <div className="flex items-end justify-between">
          <div>
            <p className="font-mono text-[0.6rem] uppercase tracking-wider text-mist-dim/60">
              free scores remaining
            </p>
            <p className="font-display text-3xl text-eos-teal mt-1">
              {overview.remaining}
              <span className="text-mist-dim/50 text-lg"> / {overview.limit}</span>
            </p>
          </div>
          <Link
            href="/finding-zora/score"
            className="rounded-md bg-zora-amber px-4 py-2 text-sm font-medium text-pre-dawn transition-colors hover:bg-zora-amber/90"
          >
            score a sunrise
          </Link>
        </div>
        <p className="text-xs text-mist-dim mt-4">
          {overview.usedThisMonth} used this month · resets {resetDate}.
        </p>
      </div>

      <Ornament label="Your scored sunrises" />

      {submissions.length === 0 ? (
        <div className="bg-pre-dawn-mid border border-dashed border-rule rounded-md px-5 py-6 text-center">
          <p className="text-sm text-dawn-mist/50">No sunrises scored yet.</p>
          <p className="text-xs text-dawn-mist/30 mt-1">
            <Link
              href="/finding-zora/score"
              className="text-zora-amber/70 hover:text-zora-amber underline-offset-2 hover:underline"
            >
              Score your first one.
            </Link>
          </p>
        </div>
      ) : (
        <div className="grid gap-3 sm:grid-cols-2">
          {submissions.map((s) => (
            <div
              key={s.id}
              className="bg-pre-dawn-mid border border-rule rounded-md overflow-hidden"
            >
              {s.photo_url && (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={s.photo_url}
                  alt={s.location ?? "Scored sunrise"}
                  className="w-full aspect-video object-cover bg-pre-dawn-light"
                />
              )}
              <div className="p-4 flex items-center justify-between">
                <div>
                  <p className="text-sm text-dawn-mist">
                    {s.location || "Untitled sunrise"}
                  </p>
                  <p className="text-[0.6rem] font-mono uppercase tracking-wider text-mist-dim/50 mt-0.5">
                    {new Date(s.created_at).toLocaleDateString("en-US", {
                      year: "numeric",
                      month: "short",
                      day: "numeric",
                    })}
                  </p>
                </div>
                <span className="font-display text-2xl text-eos-teal">{s.eos_total}</span>
              </div>
            </div>
          ))}
        </div>
      )}

      <Ornament label="Settings" />

      <div className="bg-pre-dawn-mid border border-rule rounded-md p-6 flex items-center justify-between">
        <Link
          href="/account/password"
          className="font-mono text-[0.6rem] uppercase tracking-wider text-mist-dim hover:text-zora-amber transition-colors"
        >
          change password
        </Link>
        <SignOutButton />
      </div>
    </div>
  );
}
