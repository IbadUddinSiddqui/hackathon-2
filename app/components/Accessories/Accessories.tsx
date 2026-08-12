"use client";
import React from "react";
import ProductsGrid from "../ProductsGrid/ProductsGrid";
import SectionHead from "../SectionHead/SectionHead";
import { useLocale } from "@/lib/locale-provider";
import { t } from "@/lib/i18n";

// "On Sale" — a REAL sale query (products flagged on_sale with a lower
// sale_price), not a hardcoded category grid.
const TopSale = () => {
  const { locale } = useLocale();
  return (
    <section id="on-sale" className="mx-auto w-full max-w-7xl px-4 py-16 sm:px-6 lg:px-8">
      <SectionHead
        eyebrow={t(locale, "home.topSaleEyebrow")}
        title={t(locale, "home.topSale")}
      />
      <ProductsGrid mode="sale" hideWhenEmpty />
    </section>
  );
};

export default TopSale;
