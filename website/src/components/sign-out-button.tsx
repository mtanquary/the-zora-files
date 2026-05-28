"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

export function SignOutButton({ className }: { className?: string }) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  const handleClick = async () => {
    setLoading(true);
    const supabase = createClient();
    await supabase.auth.signOut();
    router.push("/");
    router.refresh();
  };

  return (
    <button
      onClick={handleClick}
      disabled={loading}
      className={
        className ??
        "font-mono text-[0.6rem] uppercase tracking-wider text-mist-dim hover:text-zora-amber transition-colors disabled:opacity-40"
      }
    >
      {loading ? "…" : "sign out"}
    </button>
  );
}
