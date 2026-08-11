import { describe, it, expect } from "vitest";
import { matchFaq, detectIntent, DEFAULT_FAQS } from "./faq";

describe("matchFaq", () => {
  it("matches a shipping question", () => {
    const hit = matchFaq("how long does delivery take in Karachi?");
    expect(hit?.id).toBe("shipping-time");
  });

  it("matches a returns question", () => {
    const hit = matchFaq("can I return my t-shirt?");
    expect(hit?.id).toBe("returns");
  });

  it("matches a payment question", () => {
    const hit = matchFaq("what payment methods do you accept");
    expect(hit?.id).toBe("payment-methods");
  });

  it("matches a COD question", () => {
    const hit = matchFaq("do you have cash on delivery?");
    expect(hit?.id).toBe("cod");
  });

  it("matches a tracking question", () => {
    const hit = matchFaq("where is my order");
    expect(hit?.id).toBe("track-order");
  });

  it("returns null for a nonsense query", () => {
    expect(matchFaq("asdfghjkl")).toBeNull();
  });

  it("returns null for empty input", () => {
    expect(matchFaq("")).toBeNull();
    expect(matchFaq("   ")).toBeNull();
  });

  it("finds at least a contact match for 'talk to a human'", () => {
    expect(matchFaq("I want to talk to a human")?.id).toBe("contact");
  });
});

describe("detectIntent", () => {
  it("detects greetings and thanks", () => {
    expect(detectIntent("hi there")).toBe("greeting");
    expect(detectIntent("thanks a lot")).toBe("thanks");
  });

  it("detects order-related queries", () => {
    expect(detectIntent("order status")).toBe("order");
  });

  it("defaults to other", () => {
    expect(detectIntent("zzz")).toBe("other");
  });
});

describe("DEFAULT_FAQS", () => {
  it("has a reasonable seeded knowledge base", () => {
    expect(DEFAULT_FAQS.length).toBeGreaterThanOrEqual(10);
    for (const faq of DEFAULT_FAQS) {
      expect(faq.id).toBeTruthy();
      expect(faq.keywords.length).toBeGreaterThan(0);
      expect(faq.answer.length).toBeGreaterThan(20);
    }
  });
});
