
"use client";
import { useWishlistStore } from '@/lib/stores/wishlistStore';
import { useCartStore } from '@/lib/stores/cartStore';
import Image from 'next/image';
import { Button } from "@/components/ui/button";
import { urlFor } from '@/sanity/lib/image';

export default function WishlistPage() {
  const { items, removeFromWishlist, clearWishlist } = useWishlistStore();
  const { addItem } = useCartStore();

  return (
    <div className="container mx-auto px-4 py-12">
      <div className="text-center mb-10">
        <h1 className="text-5xl font-extrabold mb-4">Your Wishlist</h1>
        {items.length > 0 && (
          <Button 
            onClick={clearWishlist}
            variant="outline"
            className="mb-4"
          >
            Clear Wishlist
          </Button>
        )}
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-8">
        {items.map((product) => (
          <div key={product._id} className="group relative border p-4 rounded-lg">
            <div className="bg-[#F0EEED] h-56 w-full rounded-md p-4 flex items-center justify-center">
              {product.images?.[0] && (
                <Image
                  src={urlFor(product.images[0]).url()}
                  alt={product.name}
                  width={200}
                  height={200}
                  className="object-contain h-40 w-40"
                />
              )}
            </div>
            
            <div className="mt-4">
              <h3 className="text-lg font-semibold">{product.name}</h3>
              <p className="text-gray-500 mt-2">${product.price.toFixed(2)}</p>
              
              <div className="flex gap-2 mt-4">
                <Button
                  onClick={() => addItem(product)}
                  className="w-full"
                >
                  Add to Cart
                </Button>
                <Button
                  variant="outline"
                  onClick={() => removeFromWishlist(product._id)}
                  className="w-full"
                >
                  Remove
                </Button>
              </div>
            </div>
          </div>
        ))}
        
        {items.length === 0 && (
          <div className="col-span-full text-center py-12">
            <p className="text-gray-500 text-xl">Your wishlist is empty</p>
          </div>
        )}
      </div>
    </div>
  );
}