import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";
import crypto from "crypto";

const COOKIE_NAME = "zora-admin";
const MAX_AGE = 60 * 60 * 24 * 7; // 7 days

/** Create a simple HMAC token from the secret so the cookie value isn't the raw password. */
function makeToken(secret: string): string {
  return crypto.createHmac("sha256", secret).update("zora-admin-session").digest("hex");
}

export async function POST(request: NextRequest) {
  const secret = process.env.ADMIN_SECRET;
  if (!secret) {
    return NextResponse.json(
      { error: "ADMIN_SECRET not configured on the server" },
      { status: 500 }
    );
  }

  const body = await request.json();
  const { password } = body as { password?: string };

  if (!password || password !== secret) {
    return NextResponse.json({ error: "Invalid password" }, { status: 401 });
  }

  const token = makeToken(secret);
  const jar = await cookies();
  jar.set(COOKIE_NAME, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: MAX_AGE,
  });

  return NextResponse.json({ ok: true });
}

export async function DELETE() {
  const jar = await cookies();
  jar.delete(COOKIE_NAME);
  return NextResponse.json({ ok: true });
}
