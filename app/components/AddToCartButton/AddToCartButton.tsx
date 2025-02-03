// components/AddToCartButton.tsx
"use client";
import { useCartStore } from '@/lib/stores/cartStore';
import { SanityProduct } from '@/lib/sanity/product';

export default function AddToCartButton({ product }: { product: SanityProduct }) {
  const { addItem, items } = useCartStore();
  const cartItem = items.find(item => item._id === product._id);
  const availableStock = product.stock - (cartItem?.quantity || 0);

  return (
    <div className="space-y-4">
      <button
        onClick={() => addItem(product)}
        disabled={availableStock <= 0}
        className="bg-black w-44 md:w-72 text-white rounded-full mt-1"
      >
        {availableStock > 0 ? 'Add to Cart' : 'Out of Stock'}
      </button>
      
      {cartItem && (
        <div className="text-sm text-gray-500">
          <p>{cartItem.quantity} in cart</p>
          <p>{availableStock} available remaining</p>
        </div>
      )}
    </div>
  );
}