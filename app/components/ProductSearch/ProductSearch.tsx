'use client';

import { useState, useEffect, useRef } from 'react';
import Typesense from 'typesense';
import Link from 'next/link';
import { FaSearch } from 'react-icons/fa';
import Image from 'next/image';
import { clientTenantId } from '@/lib/tenant-client';
import { buildSearchParams } from '@/lib/search';
import ProductCard, { ProductCardData } from '@/app/components/ProductCard/ProductCard';
import { useLocale } from '@/lib/locale-provider';
import { t } from '@/lib/i18n';

// 1. Configure Typesense Client (values come from env vars, see .env.local)
const client = new Typesense.Client({
  nodes: [{
    host: process.env.NEXT_PUBLIC_TYPESENSE_HOST || '',
    port: Number(process.env.NEXT_PUBLIC_TYPESENSE_PORT) || 443,
    protocol: (process.env.NEXT_PUBLIC_TYPESENSE_PROTOCOL as 'http' | 'https') || 'https'
  }],
  apiKey: process.env.NEXT_PUBLIC_TYPESENSE_SEARCH_KEY || '', // Search-only key
  connectionTimeoutSeconds: 10
});

type Props = {
  // `page` renders a full search page (inline results grid); the default
  // `header` variant renders the compact dropdown used in the Header.
  variant?: 'header' | 'page';
};

export default function HeaderSearch({ variant = 'header' }: Props) {
  const { locale } = useLocale();
  const isPage = variant === 'page';
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [isOpen, setIsOpen] = useState(false);
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);

  // 2. Search function
  const searchProducts = async (searchQuery: string) => {
    if (!searchQuery.trim()) {
      setIsOpen(false); // Close dropdown if query is empty
      return;
    }

    try {
      setLoading(true);
      // P4-03 — only show the active tenant's products in search results.
      // P4-13 — hybrid (vector) ranking when an embedder is configured, plain
      // text otherwise (the fallback).
      const tenantId = clientTenantId();
      const textParams = {
        q: searchQuery,
        query_by: 'name,description,brand,category,tags',
        filter_by: `tenant_id:=${tenantId}`,
        sort_by: 'ratings:desc,created_at:desc',
        per_page: 12,
      };
      let searchResults;
      try {
        searchResults = await client.collections('products').documents().search(
          buildSearchParams(searchQuery, tenantId, isPage ? 40 : 12)
        );
      } catch {
        // Hybrid can fail when the collection was created before the embedder
        // was configured — retry with plain text search (the fallback).
        searchResults = await client.collections('products').documents().search({
          ...textParams,
          per_page: isPage ? 40 : 12,
        });
      }
      setResults(searchResults.hits || []);
      setIsOpen(true); // Open dropdown with results
    } catch {
      setError('Failed to load products due to');
    } finally {
      setLoading(false);
    }
  };

  // 3. Handle Enter key press
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      searchProducts(query);
    }
  };

  // 4. Handle search button click
  const handleSearchClick = () => {
    searchProducts(query);
  };

  // 5. Reset the auto-close timer
  const resetAutoCloseTimer = () => {
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }
    timeoutRef.current = setTimeout(() => {
      setIsOpen(false); // Close dropdown after 3 seconds
    }, 7000);
  };

  // 6. Trigger auto-close timer on query change or interaction
  useEffect(() => {
    if (isOpen) {
      resetAutoCloseTimer();
    }
  }, [query, isOpen]);

  // 7. Clear timeout on unmount
  useEffect(() => {
    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, []);

  // Map a Typesense hit to the standardized ProductCard shape.
  const toCard = (document: any): ProductCardData => ({
    _id: document.id,
    name: document.name,
    price: Number(document.price || 0),
    images: Array.isArray(document.images) ? document.images : [],
    category_slug: document.category_slug || null,
    slug: null,
    stock: document.stock ?? null,
  });

  // P11 — full page: editorial search bar + inline results grid.
  if (isPage) {
    return (
      <div className="mx-auto w-full max-w-7xl px-4 py-12 lg:px-8">
        <div className="mb-10 max-w-2xl">
          <p className="text-eyebrow mb-3 text-brand-muted">Search</p>
          <h1 className="mb-6 text-3xl font-bold tracking-tight text-brand-ink dark:text-brand-ink-inverse sm:text-4xl">
            {t(locale, 'nav.search')}
          </h1>
          <div className="flex items-center gap-3 border-b-2 border-brand-ink pb-3 dark:border-brand-ink-inverse">
            <FaSearch className="h-5 w-5 shrink-0 text-brand-muted" />
            <input
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder={t(locale, 'common.searchPlaceholder')}
              className="w-full bg-transparent text-lg text-brand-ink placeholder:text-brand-muted focus:outline-none dark:text-brand-ink-inverse"
            />
            <button
              className="shrink-0 text-sm font-semibold uppercase tracking-[0.15em] text-brand-ink transition-opacity hover:opacity-70 dark:text-brand-ink-inverse"
              aria-label={t(locale, 'nav.search')}
              onClick={handleSearchClick}
            >
              <span className="hidden sm:inline">Search</span>
            </button>
          </div>
        </div>

        {loading && <p className="py-8 text-brand-muted">{t(locale, 'common.loading')}</p>}
        {error && <p className="py-8 text-brand-bad">{error}</p>}

        {!loading && !error && query.trim() && (
          results.length === 0 ? (
            <p className="py-8 text-brand-muted">No products found for “{query}”</p>
          ) : (
            <div className="grid grid-cols-2 gap-x-4 gap-y-10 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 lg:gap-x-6">
              {results.map(({ document }) => (
                <ProductCard key={document.id} product={toCard(document)} />
              ))}
            </div>
          )
        )}

        {!query.trim() && (
          <p className="py-8 text-brand-muted">Start typing to search the catalog.</p>
        )}
      </div>
    );
  }

  // Header variant — compact dropdown (P11 restyle: brand tokens, editorial).
  return (
    <div className="relative">
      <div className="flex items-center gap-2 border-b border-brand-line-strong pb-1.5 transition-colors focus-within:border-brand-ink dark:focus-within:border-brand-ink-inverse">
        <input
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onKeyDown={handleKeyDown}
          onFocus={() => setIsOpen(true)} // Open dropdown on focus
          placeholder={t(locale, 'common.searchPlaceholder')}
          className="w-full max-w-md bg-transparent py-0.5 text-sm text-brand-ink placeholder:text-brand-muted focus:outline-none dark:text-brand-ink-inverse"
        />
        <button
          className="p-1 text-brand-muted transition-colors hover:text-brand-ink dark:hover:text-brand-ink-inverse"
          aria-label={t(locale, 'nav.search')}
          onClick={handleSearchClick}
        >
          <FaSearch size={16} />
        </button>
      </div>

      {/* Results Dropdown */}
      {isOpen && (
        <div
          className="absolute left-0 right-0 top-full z-50 mt-3 border border-brand-line bg-brand-surface shadow-brand-3 dark:border-brand-line dark:bg-brand-surface-alt"
          onMouseEnter={() => clearTimeout(timeoutRef.current!)} // Pause auto-close on hover
          onMouseLeave={() => resetAutoCloseTimer()} // Resume auto-close on mouse leave
        >
          {/* Loading & Error States */}
          {loading && (
            <div className="p-4 text-sm text-brand-muted">Searching...</div>
          )}
          {error && (
            <div className="p-4 text-sm text-brand-bad">{error}</div>
          )}

          {/* Results List */}
          <div className="max-h-96 overflow-y-auto">
            {results.map(({ document }) => (
              <Link
                key={document.id}
                href={`/products/${document.category_slug}/${document.id}`}
                className="flex items-center gap-4 border-b border-brand-line p-3 transition-colors last:border-b-0 hover:bg-brand-surface-alt dark:hover:bg-brand-charcoal"
              >
                <Image
                  width={56}
                  height={56}
                  src={document.images[0]}
                  alt={document.name}
                  className="h-14 w-14 shrink-0 object-cover"
                />
                <div className="min-w-0">
                  <h3 className="truncate text-sm font-medium text-brand-ink dark:text-brand-ink-inverse">
                    {document.name}
                  </h3>
                  <p className="text-sm font-semibold tabular-nums text-brand-ink dark:text-brand-ink-inverse">
                    Rs {document.price.toFixed(2)}
                  </p>
                </div>
              </Link>
            ))}
          </div>

          {/* Empty State */}
          {!loading && query && results.length === 0 && (
            <div className="p-4 text-sm text-brand-muted">
              No products found for {query}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
