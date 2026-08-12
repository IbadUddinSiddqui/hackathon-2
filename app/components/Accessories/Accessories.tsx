"use client";
import React from "react";
import ProductsGrid from "../ProductsGrid/ProductsGrid";
import { useLocale } from "@/lib/locale-provider";
import { t } from "@/lib/i18n";

// "On Sale" — a REAL sale query (products flagged on_sale with a lower
// sale_price), not a hardcoded category grid.
const TopSale = () => {
  const { locale } = useLocale();
  return (
    <>
      <div id="on-sale" className="text-center mb-10">
        <h2 className="text-3xl font-bold tracking-tight sm:text-4xl mb-4">
          {t(locale, "home.topSale")}
        </h2>
      </div>
      <div>
        <ProductsGrid mode="sale" hideWhenEmpty />
      </div>
    </>
  );
};

export default TopSale;
