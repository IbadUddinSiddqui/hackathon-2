
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
  addItem: (product: SanityProduct) => void;
  removeItem: (productId: string) => void;
  updateQuantity: (productId: string, quantity: number) => void;
  clearCart: () => void;
};

export const useCartStore = create<CartState>()(
  persist(
    (set) => ({
      items: [],
      
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
            )
          };
        }

        // Add new item to cart
        return {
          items: [...state.items, {
            ...product,
            quantity: 1,
            imageUrl: urlFor(product.images[0]).url()
          }]
        };
      }),

      removeItem: (productId) => set((state) => ({
        items: state.items.filter(item => item._id !== productId)
      })),

      updateQuantity: (productId, quantity) => set((state) => ({
        items: state.items.map(item => {
          if (item._id === productId) {
            // Clamp quantity between 1 and available stock
            const clamped = Math.max(1, Math.min(quantity, item.stock));
            return { ...item, quantity: clamped };
          }
          return item;
        })
      })),

      clearCart: () => set({ items: [] }),
    }),
    {
      name: 'sanity-cart-storage',
      storage: createJSONStorage(() => localStorage),
      partialize: (state) => ({ items: state.items }),
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