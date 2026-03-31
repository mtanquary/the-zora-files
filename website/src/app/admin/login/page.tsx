"use client";

import { useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Suspense } from "react";

function LoginForm() {
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const router = useRouter();
  const searchParams = useSearchParams();
  const from = searchParams.get("from") || "/admin";

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!password) return;

    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/admin-auth", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ password }),
      });
      const data = await res.json();
      if (res.ok && data.ok) {
        router.push(from);
        router.refresh();
      } else {
        setError(data.error || "Authentication failed");
      }
    } catch {
      setError("Network error");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center px-4">
      <div className="w-full max-w-sm">
        <div className="text-center mb-8">
          <h1 className="font-display-ornate text-2xl text-zora-amber">
            the zora files
          </h1>
          <p className="text-mist-dim text-sm mt-1">admin access</p>
        </div>

        <form
          onSubmit={handleSubmit}
          className="bg-pre-dawn-mid border border-rule rounded-md p-6 space-y-4"
        >
          <div>
            <label className="block font-mono text-[0.6rem] text-mist-dim/60 uppercase tracking-wider mb-1">
              password
            </label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              autoFocus
              autoComplete="current-password"
              className="w-full rounded-md border border-rule bg-pre-dawn-light px-3 py-2 text-sm text-dawn-mist placeholder:text-mist-dim/30 focus:border-zora-amber/50 focus:outline-none"
            />
          </div>

          {error && (
            <p className="text-sm text-sunrise-orange">{error}</p>
          )}

          <button
            type="submit"
            disabled={loading || !password}
            className="w-full rounded-md bg-eos-teal px-4 py-2.5 text-sm font-medium text-pre-dawn transition-colors hover:bg-eos-teal/90 disabled:opacity-40 disabled:cursor-not-allowed"
          >
            {loading ? "..." : "enter"}
          </button>
        </form>
      </div>
    </div>
  );
}

export default function LoginPage() {
  return (
    <Suspense>
      <LoginForm />
    </Suspense>
  );
}
