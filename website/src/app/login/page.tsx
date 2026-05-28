"use client";

import { Suspense, useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import {
  AuthCard,
  authInputClass,
  authLabelClass,
  authPrimaryButtonClass,
} from "@/components/auth-card";
import { GoogleButton } from "@/components/google-button";

function safeNext(value: string | null): string {
  if (value && value.startsWith("/") && !value.startsWith("//")) return value;
  return "/finding-zora/score";
}

function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const next = safeNext(searchParams.get("next"));
  const linkError = searchParams.get("error");

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(
    linkError ? "That link was invalid or expired. Please sign in." : null
  );
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);
    const supabase = createClient();
    const { error } = await supabase.auth.signInWithPassword({
      email: email.trim(),
      password,
    });
    setLoading(false);
    if (error) {
      setError(error.message);
      return;
    }
    router.push(next);
    router.refresh();
  };

  return (
    <AuthCard title="sign in" subtitle="Welcome back.">
      <div className="space-y-4">
        <GoogleButton next={next} />

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
          <div>
            <div className="flex items-center justify-between mb-1">
              <label className={authLabelClass + " mb-0"}>password</label>
              <Link
                href="/reset-password"
                className="font-mono text-[0.55rem] uppercase tracking-wider text-mist-dim/60 hover:text-zora-amber"
              >
                forgot?
              </Link>
            </div>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              autoComplete="current-password"
              className={authInputClass}
            />
          </div>

          {error && <p className="text-sm text-sunrise-orange">{error}</p>}

          <button type="submit" disabled={loading} className={authPrimaryButtonClass}>
            {loading ? "…" : "sign in"}
          </button>
        </form>

        <p className="text-center text-xs text-mist-dim">
          New here?{" "}
          <Link href="/signup" className="text-zora-amber hover:underline underline-offset-2">
            create an account
          </Link>
        </p>
      </div>
    </AuthCard>
  );
}

export default function LoginPage() {
  return (
    <Suspense>
      <LoginForm />
    </Suspense>
  );
}
