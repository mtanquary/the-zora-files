import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import crypto from "crypto";
import { updateSession } from "@/lib/supabase/proxy-session";

const COOKIE_NAME = "zora-admin";

function makeToken(secret: string): string {
  return crypto.createHmac("sha256", secret).update("zora-admin-session").digest("hex");
}

/** Paths protected by the shared-password admin gate (host-only tools + their APIs). */
function isAdminGated(path: string): boolean {
  if (path === "/admin") return true;
  if (path.startsWith("/admin/") && !path.startsWith("/admin/login")) return true;
  if (path.startsWith("/api/ai-")) return true;
  if (path === "/api/episodes" || path.startsWith("/api/episodes/")) return true;
  if (path === "/api/discoveries" || path.startsWith("/api/discoveries/")) return true;
  if (path === "/api/discovery-assist" || path.startsWith("/api/discovery-assist/")) return true;
  if (path === "/api/eos-score" || path.startsWith("/api/eos-score/")) return true;
  if (path === "/api/upload" || path.startsWith("/api/upload/")) return true;
  return false;
}

function adminGate(request: NextRequest) {
  const secret = process.env.ADMIN_SECRET;

  // If no ADMIN_SECRET is set, allow everything (dev convenience)
  if (!secret) return NextResponse.next();

  const token = request.cookies.get(COOKIE_NAME)?.value;
  const expected = makeToken(secret);

  if (token === expected) {
    return NextResponse.next();
  }

  // Not authenticated — 401 for API routes, redirect for pages
  if (request.nextUrl.pathname.startsWith("/api/")) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const loginUrl = new URL("/admin/login", request.url);
  loginUrl.searchParams.set("from", request.nextUrl.pathname);
  return NextResponse.redirect(loginUrl);
}

export async function proxy(request: NextRequest) {
  // Host-only admin surface keeps the existing shared-password gate.
  if (isAdminGated(request.nextUrl.pathname)) {
    return adminGate(request);
  }

  // Everything else: refresh the member (Supabase) session cookie so Server
  // Components see current auth state. Member route protection is enforced in
  // the page/route handlers themselves, not here.
  return await updateSession(request);
}

export const config = {
  matcher: [
    // Run on all routes except Next internals and static asset files.
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp|ico|mp4|webm)$).*)",
  ],
};
