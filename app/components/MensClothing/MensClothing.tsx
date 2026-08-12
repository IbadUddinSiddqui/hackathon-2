"use client";
import React from "react";
import ProductsGrid from "../ProductsGrid/ProductsGrid";
import SectionHead from "../SectionHead/SectionHead";
import { useLocale } from "@/lib/locale-provider";
import { t } from "@/lib/i18n";

// "New Arrivals" — a REAL recency query (products created within the last
// 30 days, newest first), not a hardcoded category grid.
const NewArrivals = () => {
  const { locale } = useLocale();
  return (
    <section id="new-arrivals" className="mx-auto w-full max-w-7xl px-4 py-16 sm:px-6 lg:px-8">
      <SectionHead
        eyebrow={t(locale, "home.newArrivalsEyebrow")}
        title={t(locale, "home.newArrivals")}
      />
      <ProductsGrid mode="new" hideWhenEmpty />
    </section>
  );
};

export default NewArrivals;
