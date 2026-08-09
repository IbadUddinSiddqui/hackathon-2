import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import { SanityProduct } from '../sanity/product';
import { urlFor } from '@/sanity/lib/image';
import { useState,useEffect } from 'react';
 
export type CartItem = SanityProduct & {
  quantity: number;
  imageUrl: string;
};

type CartState = {
  items: CartItem[];
  discountCode: string | null;
  discountAmount: number; // dollars, validated server-side
  addItem: (product: SanityProduct) => void;
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
        const currentStock = product.stock;
        
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
            imageUrl: urlFor(product.images[0]).url()
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
            // Clamp quantity between 1 and available stock
            const clamped = Math.max(1, Math.min(quantity, item.stock));
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
