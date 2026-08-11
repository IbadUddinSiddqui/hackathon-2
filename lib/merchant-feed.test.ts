import { describe, it, expect } from "vitest";
import { escapeXml, priceString, buildFeedXml, type FeedProduct } from "./merchant-feed";

const product: FeedProduct = {
  id: "p1",
  name: "Classic Tee & <Sale>",
  description: "100% cotton",
  link: "https://anks.com/products/all/p1",
  image: "https://cdn.example.com/tee.jpg",
  price: "1499.00 PKR",
  availability: "in stock",
  brand: "AnK's",
  condition: "new",
};

describe("escapeXml", () => {
  it("escapes XML special chars", () => {
    expect(escapeXml(`a & b < c > d "e" 'f'`)).toBe(
      "a &amp; b &lt; c &gt; d &quot;e&quot; &apos;f&apos;"
    );
  });
});

describe("priceString", () => {
  it("formats with currency code", () => {
    expect(priceString(1499)).toBe("1499.00 PKR");
    expect(priceString(0)).toBe("0.00 PKR");
  });
});

describe("buildFeedXml", () => {
  it("emits a valid RSS envelope with a g: item", () => {
    const xml = buildFeedXml([product]);
    expect(xml).toContain('<?xml version="1.0" encoding="UTF-8"?>');
    expect(xml).toContain('<rss version="2.0" xmlns:g="http://base.google.com/ns/1.0">');
    expect(xml).toContain("<g:id>p1</g:id>");
    expect(xml).toContain("<g:price>1499.00 PKR</g:price>");
    // Title is escaped.
    expect(xml).toContain("<g:title>Classic Tee &amp; &lt;Sale&gt;</g:title>");
  });

  it("handles an empty catalog", () => {
    const xml = buildFeedXml([]);
    expect(xml).toContain("<channel>");
    expect(xml).not.toContain("<item>");
  });
});
