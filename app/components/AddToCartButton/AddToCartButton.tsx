// components/AddToCartButton.tsx
"use client";
import { useCartStore } from '@/lib/stores/cartStore';
import { SanityProduct } from '@/lib/sanity/product';
import { motion } from 'framer-motion';
import { ShoppingCart, PackageCheck, Info } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useLocale } from '@/lib/locale-provider';
import { t } from '@/lib/i18n';
import { salePriceFor } from '@/lib/product-sale';
import { useTenant } from '@/lib/tenant-provider';

export default function AddToCartButton({ product }: { product: SanityProduct }) {
  const { addItem, items } = useCartStore();
  const { locale } = useLocale();
  // P4-05 + P10 — the primary CTA uses the tenant accent (same system as the
  // hero headline span, cart badge and category underline), but RESTRAINED:
  // sharp corners, no glow shadow, a small spring — the accent signals the
  // action without dominating the page.
  const { tenant } = useTenant();
  const accent = tenant.accentColor || '#000000';
  const cartItem = items.find(item => item._id === product._id);
  const availableStock = product.stock - (cartItem?.quantity || 0);
  // The cart always receives the EFFECTIVE price (sale when on sale) so the
  // cart/checkout never show a price the customer isn't charged.
  const salePrice = salePriceFor(product);
  const addPayload = salePrice !== null ? { ...product, price: salePrice } : product;

  return (
    <div className="space-y-4">
      <motion.button
        whileHover={{ y: -2 }}
        whileTap={{ scale: 0.98 }}
        onClick={() => addItem(addPayload)}
        disabled={availableStock <= 0}
        className={cn(
          "relative w-[13rem] py-3.5 px-8 text-sm font-semibold uppercase tracking-[0.15em] text-white transition-all",
          "disabled:opacity-50 disabled:cursor-not-allowed",
          "focus:outline-none focus-visible:ring-2 focus-visible:ring-brand-ink focus-visible:ring-offset-2"
        )}
        style={{ backgroundColor: accent }}
      >
        <div className="flex items-center justify-center gap-2">
          <ShoppingCart className="h-4 w-4" />
          {availableStock > 0 ? t(locale, 'product.addToCart') : t(locale, 'product.outOfStock')}
        </div>

        {/* Animated quantity indicator — brand-ok, sharp */}
        {cartItem && (
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            className="absolute -right-2 -top-2"
          >
            <div className="relative">
              <div className="absolute inset-0 animate-ping rounded-none bg-brand-ok/40"></div>
              <div className="relative flex h-6 w-6 items-center justify-center bg-brand-ok text-xs font-bold text-white">
                {cartItem.quantity}
              </div>
            </div>
          </motion.div>
        )}
      </motion.button>

      {cartItem && (
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="space-y-2 border-l-2 border-brand-line p-3 pl-4"
        >
          <div className="flex items-center justify-between text-sm">
            <div className="flex items-center gap-2 text-brand-muted">
              <PackageCheck className="h-4 w-4" />
              <span>{cartItem.quantity} {t(locale, 'cart.title').toLowerCase()}</span>
            </div>
            <div className="flex items-center gap-2 text-brand-ok">
              <div className="h-1 w-16 overflow-hidden bg-brand-line">
                <div
                  className="h-full bg-brand-ok transition-all duration-500"
                  style={{ width: `${(availableStock / product.stock) * 100}%` }}
                ></div>
              </div>
              <span>{availableStock} {t(locale, 'product.left')}</span>
            </div>
          </div>
          {availableStock < 3 && (
            <div className="flex items-center gap-2 text-xs text-brand-warn">
              <Info className="h-4 w-4" />
              <span>{t(locale, 'product.outOfStock')} — {availableStock} {t(locale, 'product.left')}</span>
            </div>
          )}
        </motion.div>
      )}
    </div>
  );
}
