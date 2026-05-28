import { createBrowserClient } from "@supabase/ssr";

/**
 * Browser-side Supabase client for member auth (sign-up, login, OAuth, sign-out).
 * Stores the session in cookies via @supabase/ssr so the server can read it.
 * Separate from the storage-only client in `@/lib/supabase`.
 */
export function createClient() {
  return createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );
}
