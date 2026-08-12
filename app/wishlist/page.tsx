"use client";
import { useWishlistStore } from '@/lib/stores/wishlistStore';
import { useCartStore } from '@/lib/stores/cartStore';
import { Button } from "@/components/ui/button";
import Header from '../components/Header/Header';
import Footer from '../components/Footer/Footer';
import ProductCard from '../components/ProductCard/ProductCard';
import { useLocale } from '@/lib/locale-provider';
import { t } from '@/lib/i18n';

export default function WishlistPage() {
  const { items, clearWishlist } = useWishlistStore();
  const { addItem } = useCartStore();
  const { locale } = useLocale();

  return (
    <>
      <Header />
      <div className="min-h-screen bg-brand-surface text-brand-ink dark:bg-brand-ink dark:text-brand-ink-inverse">
        <div className="mx-auto w-full max-w-7xl px-4 py-12 lg:px-8">
          <div className="mb-12 flex flex-col items-start justify-between gap-6 sm:flex-row sm:items-end">
            <div>
              <p className="text-eyebrow mb-3 text-brand-muted">Saved</p>
              <h1 className="text-3xl font-bold tracking-tight sm:text-4xl">
                {t(locale, 'nav.wishlist')}
              </h1>
            </div>
            {items.length > 0 && (
              <button
                onClick={clearWishlist}
                className="text-sm font-medium text-brand-muted underline decoration-brand-line-strong underline-offset-4 transition-colors hover:text-brand-bad hover:decoration-brand-bad"
              >
                {t(locale, 'cart.remove')} all
              </button>
            )}
          </div>

          <div className="grid grid-cols-2 gap-x-4 gap-y-10 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 lg:gap-x-6">
            {items.map((product) => (
              <ProductCard key={product._id} product={product} />
            ))}
          </div>

          {items.length === 0 && (
            <div className="border-y border-brand-line py-20 text-center">
              <p className="text-xl text-brand-muted">{t(locale, 'cart.empty')}</p>
            </div>
          )}

          {items.length > 0 && (
            <div className="mt-14 text-center">
              <Button
                onClick={() => items.forEach((p) => addItem(p))}
                className="rounded-none bg-brand-ink px-8 py-4 text-sm font-semibold uppercase tracking-[0.15em] text-brand-ink-inverse hover:bg-brand-ink-soft dark:bg-brand-ink-inverse dark:text-brand-ink"
              >
                {t(locale, 'product.addToCart')} — all
              </Button>
            </div>
          )}
        </div>
      </div>
      <Footer />
    </>
  );
}
