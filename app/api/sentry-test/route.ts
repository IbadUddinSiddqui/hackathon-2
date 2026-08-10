// P1-12 test endpoint — triggers a Sentry error so the capture pipeline can be
// verified in the Sentry dashboard. Hit GET /api/sentry-test after setting
// SENTRY_DSN + NEXT_PUBLIC_SENTRY_DSN. Safe to keep: only fires when a DSN is
// configured (Sentry no-ops otherwise).
import { NextResponse } from "next/server";
import * as Sentry from "@sentry/nextjs";

export async function GET() {
  try {
    throw new Error("Sentry test error — P1-12 verification");
  } catch (error) {
    Sentry.captureException(error);
  }
  return NextResponse.json({
    ok: true,
    sent: Boolean(process.env.SENTRY_DSN),
    note: "Check the Sentry dashboard for 'Sentry test error — P1-12 verification'",
  });
}
