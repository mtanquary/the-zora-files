import "server-only";
import type { SupabaseClient } from "@supabase/supabase-js";
import { createClient } from "@/lib/supabase/server";
import type { EosIndex } from "@/lib/types";

/** Free Eos scores a member gets per calendar month. */
export const MONTHLY_FREE_LIMIT = 10;

export function startOfMonthUTC(d = new Date()): Date {
  return new Date(Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), 1));
}

export function startOfNextMonthUTC(d = new Date()): Date {
  return new Date(Date.UTC(d.getUTCFullYear(), d.getUTCMonth() + 1, 1));
}

/** Successful scores this member has run since the 1st of the current month (UTC). */
export async function countSubmissionsThisMonth(
  supabase: SupabaseClient,
  userId: string
): Promise<number> {
  const { count } = await supabase
    .from("member_submissions")
    .select("id", { count: "exact", head: true })
    .eq("user_id", userId)
    .gte("created_at", startOfMonthUTC().toISOString());
  return count ?? 0;
}

export interface MemberSubmission {
  id: string;
  photo_url: string | null;
  location: string | null;
  eos_total: number;
  eos_index: EosIndex;
  created_at: string;
}

export interface MemberOverview {
  email: string | null;
  fullName: string;
  marketingConsent: boolean;
  usedThisMonth: number;
  remaining: number;
  limit: number;
  resetsAt: string;
}

/** Profile + monthly-usage summary for the signed-in member, or null if signed out. */
export async function getMemberOverview(): Promise<MemberOverview | null> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return null;

  const [{ data: profile }, used] = await Promise.all([
    supabase
      .from("profiles")
      .select("full_name, email, marketing_consent")
      .eq("id", user.id)
      .maybeSingle(),
    countSubmissionsThisMonth(supabase, user.id),
  ]);

  return {
    email: profile?.email ?? user.email ?? null,
    fullName: profile?.full_name ?? "",
    marketingConsent: profile?.marketing_consent ?? false,
    usedThisMonth: used,
    remaining: Math.max(0, MONTHLY_FREE_LIMIT - used),
    limit: MONTHLY_FREE_LIMIT,
    resetsAt: startOfNextMonthUTC().toISOString(),
  };
}

/** Most recent scored sunrises for the signed-in member (private history). */
export async function getMemberSubmissions(limit = 30): Promise<MemberSubmission[]> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return [];

  const { data } = await supabase
    .from("member_submissions")
    .select("id, photo_url, location, eos_total, eos_index, created_at")
    .eq("user_id", user.id)
    .order("created_at", { ascending: false })
    .limit(limit);

  return (data as MemberSubmission[] | null) ?? [];
}
