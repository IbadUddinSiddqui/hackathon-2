import { NextResponse } from "next/server";
import { serverClient } from "@/sanity/lib/server-client";
import { enforceRateLimit } from "@/lib/rate-limit";
import { getActiveTenantId } from "@/lib/tenants";

// Real newsletter subscription endpoint (replaces the old local-only "success"
// in the footer). Persists the email to Sanity, scoped to the active tenant,
// and is idempotent: the same email can only ever subscribe once per tenant.

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export async function POST(request: Request) {
  const limited = enforceRateLimit(request, { key: "newsletter", limit: 10, windowMs: 60_000 });
  if (limited) return limited;

  try {
    const body = await request.json();
    const email = typeof body?.email === "string" ? body.email.trim().toLowerCase() : "";

    if (!email || !EMAIL_RE.test(email)) {
      return NextResponse.json(
        { ok: false, error: "Enter a valid email address." },
        { status: 400 }
      );
    }

    const tenantId = await getActiveTenantId();

    // Idempotent: an existing subscription is still a "success" for the user.
    const existing = await serverClient.fetch<boolean>(
      `*[_type == "newsletterSubscriber" && email == $email && (!defined(tenantId) || tenantId == $tenantId)][0]._id != null`,
      { email, tenantId }
    );
    if (existing) {
      return NextResponse.json({ ok: true, already: true });
    }

    await serverClient.create({
      _type: "newsletterSubscriber",
      email,
      tenantId,
      source: "footer",
      created_at: new Date().toISOString(),
    });

    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error("Newsletter subscribe error:", error);
    return NextResponse.json(
      { ok: false, error: "Couldn't subscribe right now — please try again." },
      { status: 500 }
    );
  }
}
