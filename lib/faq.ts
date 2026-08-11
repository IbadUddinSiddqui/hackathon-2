// lib/faq.ts
// P4-15 — FAQ knowledge base for the storefront chat widget. Ships with a
// sensible DEFAULT set so the widget works out of the box with ZERO cost.
// P4-17 (human): replace `DEFAULT_FAQS` with the client's ~20 real Q&As —
// the matching logic below does not change.
//
// Matching is pure keyword scoring (no LLM call) so every answer is free and
// instant; the widget always shows a clear "talk to a human" path.

export type FaqEntry = {
  id: string;
  keywords: string[]; // lowercase; ANY hit scores the entry
  question: string;
  answer: string;
};

export const DEFAULT_FAQS: FaqEntry[] = [
  {
    id: "shipping-time",
    keywords: ["shipping", "delivery", "deliver", "how long", "when", "arrive", "courier"],
    question: "How long does delivery take?",
    answer:
      "We deliver nationwide in Pakistan. Major cities (Karachi, Lahore, Islamabad) arrive in 2–4 working days; other cities take 3–6 working days. You'll get a tracking update once your order ships.",
  },
  {
    id: "delivery-fee",
    keywords: ["fee", "cost", "charge", "shipping price", "delivery charges", "expensive"],
    question: "How much is delivery?",
    answer:
      "Delivery is a flat fee added at checkout (shown before you pay). Orders are never charged more than the amount you confirm on the payment page.",
  },
  {
    id: "returns",
    keywords: ["return", "refund", "exchange", "replace", "money back", "change size"],
    question: "What is your return policy?",
    answer:
      "Unworn items with tags attached can be returned or exchanged within 7 days of delivery. Contact us on WhatsApp or email with your order number and we'll arrange the pickup.",
  },
  {
    id: "sizing",
    keywords: ["size", "sizing", "fit", "measurement", "measurements", "chart", "small", "large"],
    question: "How do I find my size?",
    answer:
      "Every product page has a 'Find my size' quiz — enter your height, weight, chest and waist and it recommends the right size from the product's size chart. When in doubt, size up for a relaxed fit.",
  },
  {
    id: "payment-methods",
    keywords: ["payment", "pay", "card", "debit", "credit", "cod", "cash", "safepay", "method"],
    question: "What payment methods do you accept?",
    answer:
      "We accept card payments through Safepay (Visa/Mastercard) and Cash on Delivery (COD) nationwide. Card payments are processed securely on Safepay's hosted page.",
  },
  {
    id: "cod",
    keywords: ["cash on delivery", "cod", "pay at door", "cash on hand"],
    question: "Do you offer Cash on Delivery?",
    answer:
      "Yes — COD is available nationwide. Simply choose 'Cash on Delivery' at checkout; our rider collects payment when your order arrives.",
  },
  {
    id: "track-order",
    keywords: ["track", "status", "where is my order", "order status", "shipped", "processing"],
    question: "How do I track my order?",
    answer:
      "Log in to your account and check the order status, or reply to your order confirmation email. For anything urgent, WhatsApp us your order number and we'll check for you.",
  },
  {
    id: "cancel-order",
    keywords: ["cancel", "cancel order", "change order", "modify", "edit order"],
    question: "Can I cancel or change my order?",
    answer:
      "Orders can be cancelled before they're marked paid/dispatched. Contact us on WhatsApp as soon as possible with your order number and we'll try to cancel it for you.",
  },
  {
    id: "contact",
    keywords: ["contact", "phone", "email", "whatsapp", "call", "reach", "support", "help", "human", "agent"],
    question: "How do I talk to a real person?",
    answer:
      "We're one message away — tap the WhatsApp button below (fastest) or email us and we'll reply within 24 hours. Include your order number for a quicker answer.",
  },
  {
    id: "product-care",
    keywords: ["wash", "care", "fabric", "material", "quality", "shrink", "fade"],
    question: "How should I care for my clothes?",
    answer:
      "Wash inside-out in cold water, avoid bleach, and air-dry in shade. Each product's description lists its fabric — follow the care label sewn into the garment.",
  },
  {
    id: "discounts",
    keywords: ["discount", "coupon", "code", "promo", "offer", "voucher", "deal", "sale"],
    question: "Do you have discount codes?",
    answer:
      "Yes! Apply a discount code at checkout and the amount is shown before you pay. Watch our socials and sign up for the newsletter to get new codes.",
  },
  {
    id: "stock",
    keywords: ["stock", "out of stock", "restock", "available", "sold out", "back in"],
    question: "An item is out of stock — will it be back?",
    answer:
      "Most items restock within a few weeks. Add it to your wishlist and check back, or WhatsApp us and we'll let you know when it's back.",
  },
];

/** Score a query against the knowledge base (pure keyword matching). */
export function matchFaq(query: string, faqs: FaqEntry[] = DEFAULT_FAQS): FaqEntry | null {
  const q = String(query || "").toLowerCase().trim();
  if (!q) return null;

  let best: FaqEntry | null = null;
  let bestScore = 0;
  for (const faq of faqs) {
    let score = 0;
    for (const kw of faq.keywords) {
      if (q.includes(kw)) score += kw.length;
    }
    if (score > bestScore) {
      bestScore = score;
      best = faq;
    }
  }
  return bestScore > 0 ? best : null;
}

/** Trivial yes/no intent detection for a few shortcuts. */
export function detectIntent(query: string): "greeting" | "thanks" | "order" | "other" {
  const q = String(query || "").toLowerCase();
  if (/(hi|hello|salam|assalam|hey|yo)\b/.test(q)) return "greeting";
  if (/(thank|thanks|shukriya|jazak)/.test(q)) return "thanks";
  if (/\b(order|order id|track|status)\b/.test(q)) return "order";
  return "other";
}

export const GREETING = "Assalam-o-Alaikum! 👋 How can we help you today?";
export const THANKS_REPLY = "You're welcome! 💛 Anything else we can help with?";
export const NO_MATCH_REPLY =
  "I couldn't find that in our FAQ — but our team can! Tap the WhatsApp button below and we'll answer personally. 🙏";
