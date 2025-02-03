// lib/stores/wishlistStore.ts
import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';
import { SanityProduct } from '@/lib/sanity/product';

type WishlistState = {
  items: SanityProduct[];
  addToWishlist: (product: SanityProduct) => void;
  removeFromWishlist: (productId: string) => void;
  clearWishlist: () => void;
};

export const useWishlistStore = create<WishlistState>()(
  persist(
    (set) => ({
      items: [],
      addToWishlist: (product) => set((state) => ({
        items: state.items.some(item => item._id === product._id) 
          ? state.items 
          : [...state.items, product]
      })),
      removeFromWishlist: (productId) => set((state) => ({
        items: state.items.filter(item => item._id !== productId)
      })),
      clearWishlist: () => set({ items: [] }),
    }),
    {
      name: 'wishlist-storage',
      storage: createJSONStorage<WishlistState>(() => localStorage), // Changed from getStorage to storage
    }
  )
);