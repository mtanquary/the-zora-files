"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import {
  AuthCard,
  authInputClass,
  authLabelClass,
  authPrimaryButtonClass,
} from "@/components/auth-card";

function validatePassword(pw: string): string | null {
  if (pw.length < 8) return "Password must be at least 8 characters.";
  if (!/[a-z]/.test(pw)) return "Add a lowercase letter.";
  if (!/[A-Z]/.test(pw)) return "Add an uppercase letter.";
  if (!/[0-9]/.test(pw)) return "Add a number.";
  if (!/[^A-Za-z0-9]/.test(pw)) return "Add a special character.";
  return null;
}

export default function UpdatePasswordPage() {
  const router = useRouter();
  const [ready, setReady] = useState(false);
  const [hasSession, setHasSession] = useState(false);
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [done, setDone] = useState(false);

  useEffect(() => {
    const supabase = createClient();
    supabase.auth.getUser().then(({ data }) => {
      setHasSession(!!data.user);
      setReady(true);
    });
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    const pwErr = validatePassword(password);
    if (pwErr) {
      setError(pwErr);
      return;
    }
    setLoading(true);
    const supabase = createClient();
    const { error } = await supabase.auth.updateUser({ password });
    setLoading(false);
    if (error) {
      setError(error.message);
      return;
    }
    setDone(true);
    setTimeout(() => router.push("/account"), 1200);
  };

  return (
    <AuthCard title="set a new password">
      {!ready ? (
        <p className="text-center text-sm text-mist-dim">…</p>
      ) : done ? (
        <div className="bg-pre-dawn-mid border border-rule rounded-md p-6 text-sm text-mist-dim">
          Password updated. Taking you to your account…
        </div>
      ) : !hasSession ? (
        <div className="bg-pre-dawn-mid border border-rule rounded-md p-6 text-sm text-mist-dim space-y-3">
          <p>This page needs an active session.</p>
          <p className="text-xs text-mist-dim/70">
            Open the reset link from your email, or{" "}
            <Link href="/reset-password" className="text-zora-amber hover:underline underline-offset-2">
              request a new one
            </Link>
            .
          </p>
        </div>
      ) : (
        <form
          onSubmit={handleSubmit}
          className="bg-pre-dawn-mid border border-rule rounded-md p-6 space-y-4"
        >
          <div>
            <label className={authLabelClass}>new password</label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              autoComplete="new-password"
              autoFocus
              className={authInputClass}
            />
            <p className="text-[0.6rem] text-mist-dim/50 mt-1">
              At least 8 characters, with upper + lower case, a number, and a symbol.
            </p>
          </div>
          {error && <p className="text-sm text-sunrise-orange">{error}</p>}
          <button type="submit" disabled={loading} className={authPrimaryButtonClass}>
            {loading ? "…" : "update password"}
          </button>
        </form>
      )}
    </AuthCard>
  );
}
