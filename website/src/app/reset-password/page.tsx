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

export default function ResetPasswordPage() {
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);
    const supabase = createClient();
    const { error } = await supabase.auth.resetPasswordForEmail(email.trim(), {
      redirectTo: `${window.location.origin}/auth/confirm?next=${encodeURIComponent(
        "/account/password"
      )}`,
    });
    setLoading(false);
    if (error) {
      setError(error.message);
      return;
    }
    setSent(true);
  };

  return (
    <AuthCard title="reset your password" subtitle="We'll email you a link.">
      {sent ? (
        <div className="bg-pre-dawn-mid border border-rule rounded-md p-6 text-sm text-mist-dim">
          If an account exists for{" "}
          <span className="text-dawn-mist">{email.trim()}</span>, a password reset
          link is on its way. Check your inbox.
        </div>
      ) : (
        <form
          onSubmit={handleSubmit}
          className="bg-pre-dawn-mid border border-rule rounded-md p-6 space-y-4"
        >
          <div>
            <label className={authLabelClass}>email</label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              autoComplete="email"
              autoFocus
              className={authInputClass}
            />
          </div>
          {error && <p className="text-sm text-sunrise-orange">{error}</p>}
          <button type="submit" disabled={loading} className={authPrimaryButtonClass}>
            {loading ? "…" : "send reset link"}
          </button>
        </form>
      )}
      <p className="text-center text-xs text-mist-dim mt-6">
        <Link href="/login" className="text-zora-amber hover:underline underline-offset-2">
          back to sign in
        </Link>
      </p>
    </AuthCard>
  );
}
