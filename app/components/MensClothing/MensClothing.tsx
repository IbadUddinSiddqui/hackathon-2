"use client";
import React from "react";
import ProductsGrid from "../ProductsGrid/ProductsGrid";
import { useLocale } from "@/lib/locale-provider";
import { t } from "@/lib/i18n";

// "New Arrivals" — a REAL recency query (products created within the last
// 30 days, newest first), not a hardcoded category grid.
const NewArrivals = () => {
  const { locale } = useLocale();
  return (
    <>
      <div id="new-arrivals" className="text-center mt-12 md:mt-24 mb-10">
        <h2 className="text-3xl font-bold tracking-tight sm:text-4xl mb-4">
          {t(locale, "home.newArrivals")}
        </h2>
      </div>
      <div>
        <ProductsGrid mode="new" hideWhenEmpty />
      </div>
    </>
  );
};

export default NewArrivals;
