// components/AddToCartButton.tsx
"use client";
import { useCartStore } from '@/lib/stores/cartStore';
import { SanityProduct } from '@/lib/sanity/product';
import { motion } from 'framer-motion';
import { ShoppingCart, PackageCheck, Info } from 'lucide-react';
import { cn } from '@/lib/utils'; // Assume you have a cn utility

export default function AddToCartButton({ product }: { product: SanityProduct }) {
  const { addItem, items } = useCartStore();
  const cartItem = items.find(item => item._id === product._id);
  const availableStock = product.stock - (cartItem?.quantity || 0);

  return (
    <div className="space-y-4">
      <motion.button
        whileHover={{ scale: 1.05, y: -2 }}
        whileTap={{ scale: 0.98 }}
        onClick={() => addItem(product)}
        disabled={availableStock <= 0}
        className={cn(
          "relative w-[12rem] py-3 px-8 rounded-xl font-bold text-lg transition-all",
          "bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700",
          "disabled:opacity-50 disabled:cursor-not-allowed disabled:bg-gray-400 disabled:bg-none",
          "shadow-lg hover:shadow-xl"
        )}
      >
        <div className="flex items-center justify-center gap-2">
          <ShoppingCart className="w-5 h-5" />
          {availableStock > 0 ? 'Add to Cart' : 'Out of Stock'}
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