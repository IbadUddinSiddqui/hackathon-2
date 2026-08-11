// app/api/faq/route.ts
// P4-15 — POST /api/faq { query } → { answer }
// Keyword-matched from the seeded knowledge base (lib/faq.ts). Zero external
// cost. Handles greetings/thanks/no-match with canned replies; the widget
// always renders the WhatsApp/email escalation path.

import { NextResponse } from "next/server";
import { matchFaq, detectIntent, GREETING, THANKS_REPLY, NO_MATCH_REPLY } from "@/lib/faq";
import { enforceRateLimit } from "@/lib/rate-limit";

export async function POST(request: Request) {
  const limited = enforceRateLimit(request, { key: "faq", limit: 30, windowMs: 60_000 });
  if (limited) return limited;

  let body: { query?: string };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid body" }, { status: 400 });
  }

  const query = String(body?.query || "").trim();
  if (!query) {
    return NextResponse.json({ answer: GREETING });
  }

  const intent = detectIntent(query);
  if (intent === "greeting") return NextResponse.json({ answer: GREETING });
  if (intent === "thanks") return NextResponse.json({ answer: THANKS_REPLY });

  const hit = matchFaq(query);
  if (!hit) return NextResponse.json({ answer: NO_MATCH_REPLY });

  return NextResponse.json({
    answer: hit.answer,
    question: hit.question,
    id: hit.id,
  });
}
