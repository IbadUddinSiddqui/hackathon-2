// components/AddToCartButton.tsx
"use client";
import { useCartStore } from '@/lib/stores/cartStore';
import { SanityProduct } from '@/lib/sanity/product';
import { motion } from 'framer-motion';
import { ShoppingCart, PackageCheck, Info } from 'lucide-react';
import { cn } from '@/lib/utils'; // Assume you have a cn utility
import { useLocale } from '@/lib/locale-provider';
import { t } from '@/lib/i18n';
import { salePriceFor } from '@/lib/product-sale';
import { useTenant } from '@/lib/tenant-provider';

export default function AddToCartButton({ product }: { product: SanityProduct }) {
  const { addItem, items } = useCartStore();
  const { locale } = useLocale();
  // P4-05 — the primary CTA uses the tenant accent (same system as the hero
  // headline span, cart badge and category hover wash) so the detail page
  // speaks the same design language as the rest of the storefront.
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
        whileHover={{ scale: 1.05, y: -2 }}
        whileTap={{ scale: 0.98 }}
        onClick={() => addItem(addPayload)}
        disabled={availableStock <= 0}
        className={cn(
          "relative w-[12rem] py-3 px-8 rounded-xl font-bold text-lg text-white transition-all",
          "shadow-lg hover:shadow-xl hover:brightness-95",
          "disabled:opacity-50 disabled:cursor-not-allowed"
        )}
        style={{ backgroundColor: accent }}
      >
        <div className="flex items-center justify-center gap-2">
          <ShoppingCart className="w-5 h-5" />
          {availableStock > 0 ? t(locale, 'product.addToCart') : t(locale, 'product.outOfStock')}
        </div>
        
        {/* Animated quantity indicator */}
        {cartItem && (
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            className="absolute -top-2 -right-2"
          >
            <div className="relative">
              <div className="absolute inset-0 bg-green-500 rounded-full animate-ping"></div>
              <div className="relative flex items-center justify-center w-6 h-6 bg-green-500 rounded-full text-xs text-white">
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
          className="space-y-2 p-4 bg-white/10 rounded-lg backdrop-blur-sm"
        >
          <div className="flex items-center justify-between text-sm">
            <div className="flex items-center gap-2 text-gray-600">
              <PackageCheck className="w-4 h-4" />
              <span>{cartItem.quantity} in cart</span>
            </div>
            <div className="flex items-center gap-2 text-emerald-600">
              <div className="h-1 w-16 bg-gray-200 rounded-full overflow-hidden">
                <div 
                  className="h-full bg-emerald-400 transition-all duration-500"
                  style={{ width: `${(availableStock / product.stock) * 100}%` }}
                ></div>
              </div>
              <span>{availableStock} left</span>
            </div>
          </div>
          {availableStock < 3 && (
            <div className="flex items-center gap-2 text-xs text-amber-600">
              <Info className="w-4 h-4" />
              <span>Low stock available</span>
            </div>
          )}
        </motion.div>
      )}
    </div>
  );
}