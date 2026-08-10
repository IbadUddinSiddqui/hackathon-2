// app/api/auth/[...nextauth]/route.ts
// Single NextAuth instance lives in auth.ts — this route just exposes its
// handlers, with a rate-limit guard on credential sign-in (the classic
// brute-force target). /api/auth/callback/* is where credentials are verified.
import { handlers } from "@/auth";
import { NextRequest } from "next/server";
import { enforceRateLimit } from "@/lib/rate-limit";

export const GET = handlers.GET;

export async function POST(request: NextRequest) {
  const url = new URL(request.url);
  if (url.pathname.includes("/callback/")) {
    const limited = enforceRateLimit(request, {
      key: "auth-callback",
      limit: 15,
      windowMs: 60_000,
    });
    if (limited) return limited;
  }

  return handlers.POST(request);
}
