"use client";

// app/components/Recommendations/CartRecommendations.tsx
// P4-12 — "Complete your look": recommendations seeded from the first cart
// item, shown on the cart page. Renders nothing when the cart is empty.

import React from "react";
import { useCartStore } from "@/lib/stores/cartStore";
import Recommendations from "./Recommendations";

export default function CartRecommendations() {
  const { items } = useCartStore();
  if (items.length === 0) return null;
  const seed = items[0];
  return (
    <Recommendations
      productId={seed._id}
      categorySlug={seed.category_slug}
      titleKey="product.completeYourLook"
    />
  );
}
