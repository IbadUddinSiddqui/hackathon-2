import React from 'react'
import type { Metadata } from 'next'
import ProductSearch from '../components/ProductSearch/ProductSearch'
import Header from '../components/Header/Header'
import Footer from '../components/Footer/Footer'

export const metadata: Metadata = {
  title: 'Search Products',
  description: 'Search the catalog by name, brand or tag.',
}

// P11 — the search page previously rendered the header dropdown component
// with no Header/Footer (a known gap). Now it's a real page: full chrome +
// the ProductSearch `page` variant (inline results grid).
function page() {
  return (
    <div className="flex min-h-screen flex-col bg-brand-surface text-brand-ink dark:bg-brand-ink dark:text-brand-ink-inverse">
      <Header />
      <div className="flex-1">
        <ProductSearch variant="page" />
      </div>
      <Footer />
    </div>
  )
}

export default page
