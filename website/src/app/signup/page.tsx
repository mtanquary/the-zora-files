"use client";

import { useState } from "react";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";
import {
  AuthCard,
  authInputClass,
  authLabelClass,
  authPrimaryButtonClass,
} from "@/components/auth-card";
import { GoogleButton } from "@/components/google-button";

const NEXT = "/finding-zora/score";

function validatePassword(pw: string): string | null {
  if (pw.length < 8) return "Password must be at least 8 characters.";
  if (!/[a-z]/.test(pw)) return "Add a lowercase letter.";
  if (!/[A-Z]/.test(pw)) return "Add an uppercase letter.";
  if (!/[0-9]/.test(pw)) return "Add a number.";
  if (!/[^A-Za-z0-9]/.test(pw)) return "Add a special character.";
  return null;
}

export default function SignupPage() {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [consent, setConsent] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!name.trim()) {
      setError("Please enter your name.");
      return;
    }
    const pwErr = validatePassword(password);
    if (pwErr) {
      setError(pwErr);
      return;
    }

    setLoading(true);
    const supabase = createClient();
    const { error } = await supabase.auth.signUp({
      email: email.trim(),
      password,
      options: {
        data: { full_name: name.trim(), marketing_consent: consent },
        emailRedirectTo: `${window.location.origin}/auth/confirm?next=${encodeURIComponent(NEXT)}`,
      },
    });
    setLoading(false);

    if (error) {
      setError(error.message);
      return;
    }
    setSent(true);
  };

  if (sent) {
    return (
      <AuthCard
        title="check your email"
        subtitle="One more step to start scoring sunrises."
      >
        <div className="bg-pre-dawn-mid border border-rule rounded-md p-6 text-sm text-mist-dim space-y-3">
          <p>
            We sent a verification link to{" "}
            <span className="text-dawn-mist">{email.trim()}</span>. Click it to
            activate your account, then sign in.
          </p>
          <p className="text-xs text-mist-dim/70">
            Didn&apos;t get it? Check spam, or{" "}
            <button
              onClick={() => setSent(false)}
              className="text-zora-amber hover:underline underline-offset-2"
            >
              try again
            </button>
            .
          </p>
        </div>
        <p className="text-center text-xs text-mist-dim mt-6">
          Already verified?{" "}
          <Link href="/login" className="text-zora-amber hover:underline underline-offset-2">
            sign in
          </Link>
        </p>
      </AuthCard>
    );
  }

  return (
    <AuthCard title="create your account" subtitle="Score your own sunrises, free.">
      <div className="space-y-4">
        <GoogleButton next={NEXT} />

        <div className="flex items-center gap-3">
          <span className="h-px flex-1 bg-rule" />
          <span className="font-mono text-[0.55rem] uppercase tracking-wider text-mist-dim/50">
            or with email
          </span>
          <span className="h-px flex-1 bg-rule" />
        </div>

        <form
          onSubmit={handleSubmit}
          className="bg-pre-dawn-mid border border-rule rounded-md p-6 space-y-4"
        >
          <div>
            <label className={authLabelClass}>name</label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              autoComplete="name"
              className={authInputClass}
            />
          </div>
          <div>
            <label className={authLabelClass}>email</label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              autoComplete="email"
              className={authInputClass}
            />
          </div>
          <div>
            <label className={authLabelClass}>password</label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              autoComplete="new-password"
              className={authInputClass}
            />
            <p className="text-[0.6rem] text-mist-dim/50 mt-1">
              At least 8 characters, with upper + lower case, a number, and a symbol.
            </p>
          </div>

          <label className="flex items-start gap-2 cursor-pointer">
            <input
              type="checkbox"
              checked={consent}
              onChange={(e) => setConsent(e.target.checked)}
              className="mt-0.5 accent-zora-amber"
            />
            <span className="text-xs text-mist-dim">
              Let me know when new episodes drop. Unsubscribe anytime.
            </span>
          </label>

          {error && <p className="text-sm text-sunrise-orange">{error}</p>}

          <button type="submit" disabled={loading} className={authPrimaryButtonClass}>
            {loading ? "…" : "create account"}
          </button>
        </form>

        <p className="text-center text-xs text-mist-dim">
          Already have an account?{" "}
          <Link href="/login" className="text-zora-amber hover:underline underline-offset-2">
            sign in
          </Link>
        </p>
      </div>
    </AuthCard>
  );
}
