import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import crypto from "crypto";

const COOKIE_NAME = "zora-admin";

function makeToken(secret: string): string {
  return crypto.createHmac("sha256", secret).update("zora-admin-session").digest("hex");
}

export function proxy(request: NextRequest) {
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

export const config = {
  matcher: [
    // Protect all admin pages except the login page itself
    "/admin/((?!login).*)",
    "/admin",
    // Protect API routes used by admin tools
    "/api/ai-:path*",
    "/api/episodes/:path*",
    "/api/discoveries/:path*",
    "/api/discovery-assist/:path*",
    "/api/eos-score/:path*",
    "/api/upload/:path*",
  ],
};
