// app/api/auth/logout/route.ts
import { NextResponse } from "next/server";
import { auth } from "@/auth";
export async function POST() {
  const session = await auth()
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  return NextResponse.json({ message: "Logged out successfully" });
}