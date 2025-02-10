import { NextRequest, NextResponse } from "next/server";
import { getToken } from "next-auth/jwt";

export async function middleware(req: NextRequest) {
  console.log("🔍 Middleware Running on:", req.nextUrl.pathname); // Debug log

  if (req.nextUrl.pathname.startsWith("/adminpanel")) {
    console.log("🛡️ Protecting Admin Route");

    const token = await getToken({ req, secret: process.env.AUTH_SECRET });

    console.log("🔑 Token:", token); // Log the token in production

    if (!token) {
      console.log("🚫 No Token Found, Redirecting...");
      return NextResponse.redirect(new URL("/denied", req.url));
    }

    if (token.role !== "admin") {
      console.log("⚠️ Not Admin Role, Redirecting...");
      return NextResponse.redirect(new URL("/denied", req.url));
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/adminpanel/:path*"],
};
