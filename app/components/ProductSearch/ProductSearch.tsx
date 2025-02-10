'use client';

import { useState, useEffect, useRef } from 'react';
import Typesense from 'typesense';
import Link from 'next/link';
import { FaSearch } from 'react-icons/fa';
import Image from 'next/image';

// 1. Configure Typesense Client
const client = new Typesense.Client({
  nodes: [{
    host: '015dvlkq3mbheg9zp-1.a1.typesense.net',
    port: 443,
    protocol: 'https'
  }],
  apiKey: 'CceWWxapX00O0AdPIk4y7ahVKxYEoPIG', // Search-only key
  connectionTimeoutSeconds: 10
});

export default function HeaderSearch() {
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
      const searchResults = await client.collections('products').documents().search({
        q: searchQuery,
        query_by: 'name,description,brand,category,tags',
        filter_by: '', // Add filters here if needed
        sort_by: 'ratings:desc,created_at:desc',
        per_page: 12
      });
      setResults(searchResults.hits || []);
      setIsOpen(true); // Open dropdown with results
    } catch  {
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

  return (
    <div className="relative">
      {/* Search Input and Button */}
      <div className="flex items-center gap-2">
        <input
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onKeyDown={handleKeyDown}
          onFocus={() => setIsOpen(true)} // Open dropdown on focus
          placeholder="Search products..."
          className="w-full max-w-md p-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
         <button
                     className="p-2 text-black-2  transition-colors"
                     aria-label="Search"
                     onClick={handleSearchClick}
                   >
                     <FaSearch size={20} />
                   </button>
      </div>

      {/* Results Dropdown */}
      {isOpen && (
        <div
          className="absolute top-full left-0 right-0 mt-2 bg-white/90 backdrop-blur-sm border rounded-lg shadow-lg z-50"
          onMouseEnter={() => clearTimeout(timeoutRef.current!)} // Pause auto-close on hover
          onMouseLeave={() => resetAutoCloseTimer()} // Resume auto-close on mouse leave
        >
          {/* Loading & Error States */}
          {loading && (
            <div className="p-4 text-gray-500">Searching...</div>
          )}
          {error && (
            <div className="p-4 text-red-500">{error}</div>
          )}

          {/* Results List */}
          <div className="max-h-96 overflow-y-auto">
            {results.map(({ document }) => (
              <Link
                key={document.id}
                href={`/products/${document.category_slug}/${document.id}`}
                className="block p-4 hover:bg-gray-100/50 transition-colors"
              >
                <div className="flex items-center gap-4">
                  <Image
                  width={80}
                  height={64}
                    src={document.images[0]}
                    alt={document.name}
                    className="w-16 h-16 object-cover rounded"
                  />
                  <div>
                    <h3 className="font-semibold">{document.name}</h3>
                    <p className="text-sm text-gray-600">${document.price.toFixed(2)}</p>
                    {document.qcom_availability && (
                      <span className="text-xs text-green-800 bg-green-100 px-2 py-1 rounded">
                        QCOM Available
                      </span>
                    )}
                  </div>
                </div>
              </Link>
            ))}
          </div>

          {/* Empty State */}
          {!loading && query && results.length === 0 && (
            <div className="p-4 text-gray-500">
              No products found for {query}
            </div>
          )}
        </div>
      )}
    </div>
  );
}