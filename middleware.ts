import { NextRequest, NextResponse } from "next/server";
import { getToken } from "next-auth/jwt";

export async function middleware(req:NextRequest) {
  // Only protect routes that start with /admin
  if (req.nextUrl.pathname.startsWith("/admin")) {
    // Get the token from the request. Provide your secret if needed.
    const token = await getToken({ req, secret:"v91WpXgUTFBH9pUD/c0Zx/i8purzacNc+mrcqhoMYh0="});
    
    // If no token is found or the role is not 'admin', redirect to /denied
    if (!token || token.role !== "admin") {
      return NextResponse.redirect(new URL("/denied", req.url));
    }
  }
  
  // Allow the request to proceed
  return NextResponse.next();
}

// Apply this middleware only to /admin routes
export const config = {
  matcher: ["/adminpanel/:path*"],
};
