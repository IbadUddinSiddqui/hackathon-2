import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import { urlFor } from '@/sanity/lib/image';
import { useState,useEffect } from 'react';

// Structural subset the store actually reads. The shared ProductCard passes
// the card-friendly shape (not the full SanityProduct), and images may be
// Sanity asset refs OR plain CDN URLs (Typesense). Persisted legacy carts keep
// their extra fields — this type is what the store reads.
export type CartItem = {
  _id: string;
  name: string;
  price: number;
  stock?: number | null;
  images?: Array<{ asset?: { _ref?: string } | null } | string> | null;
  size?: string[];
  color?: string;
  category_slug?: string | null;
  slug?: { current?: string } | null;
  on_sale?: boolean;
  sale_price?: number | null;
  quantity: number;
  imageUrl: string;
};

export type CartItemInput = Omit<CartItem, 'quantity' | 'imageUrl'>;

/** First image as a URL — Sanity asset ref or plain CDN URL (Typesense). */
function resolveCartImage(images?: CartItemInput['images']): string {
  const first = Array.isArray(images) ? images[0] : undefined;
  if (!first) return '';
  if (typeof first === 'string') return first;
  return first?.asset?._ref ? urlFor(first).url() : '';
}

type CartState = {
  items: CartItem[];
  discountCode: string | null;
  discountAmount: number; // validated server-side
  addItem: (product: CartItemInput) => void;
  removeItem: (productId: string) => void;
  updateQuantity: (productId: string, quantity: number) => void;
  setDiscount: (code: string, amount: number) => void;
  clearDiscount: () => void;
  clearCart: () => void;
};

export const useCartStore = create<CartState>()(
  persist(
    (set) => ({
      items: [],
      discountCode: null,
      discountAmount: 0,
      
      addItem: (product) => set((state) => {
        const existingItem = state.items.find(item => item._id === product._id);
        // Unknown stock (Typesense-only docs) is treated as unbounded so the
        // add works — matching the card's in-stock default. Only an explicit
        // 0 (or less) stock blocks the add.
        const currentStock = product.stock ?? Number.MAX_SAFE_INTEGER;
        
        // Prevent adding out-of-stock items
        if (currentStock <= 0) return state;

        // Check if already in cart and quantity would exceed stock
        if (existingItem) {
          const newQuantity = existingItem.quantity + 1;
          if (newQuantity > currentStock) return state;
          
          return {
            items: state.items.map(item => 
              item._id === product._id 
                ? { ...item, quantity: newQuantity }
                : item
            ),
            discountCode: null,
            discountAmount: 0,
          };
        }

        // Add new item to cart
        return {
          items: [...state.items, {
            ...product,
            quantity: 1,
            imageUrl: resolveCartImage(product.images)
          }],
          discountCode: null,
          discountAmount: 0,
        };
      }),

      // Changing the cart invalidates any previously previewed discount — the
      // code stays applied but its amount is recomputed at checkout/payment.
      removeItem: (productId) => set((state) => ({
        items: state.items.filter(item => item._id !== productId),
        discountCode: null,
        discountAmount: 0,
      })),

      updateQuantity: (productId, quantity) => set((state) => ({
        items: state.items.map(item => {
          if (item._id === productId) {
            // Clamp quantity between 1 and available stock (unknown stock
            // means no upper bound)
            const clamped = Math.max(1, Math.min(quantity, item.stock ?? quantity));
            return { ...item, quantity: clamped };
          }
          return item;
        }),
        discountCode: null,
        discountAmount: 0,
      })),

      setDiscount: (code, amount) => set({ discountCode: code, discountAmount: amount }),

      clearDiscount: () => set({ discountCode: null, discountAmount: 0 }),

      clearCart: () => set({ items: [], discountCode: null, discountAmount: 0 }),
    }),
    {
      name: 'sanity-cart-storage',
      storage: createJSONStorage(() => localStorage),
      partialize: (state) => ({
        items: state.items,
        discountCode: state.discountCode,
        discountAmount: state.discountAmount,
      }),
    }
  )
);

// Optional: Hydration fix helper hook
export const useCartHydration = () => {
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    setHydrated(true);
  }, []);

  return hydrated;
};
