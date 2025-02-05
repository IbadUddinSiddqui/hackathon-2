import { adminClient } from "@/lib/typesense";
import { createClient } from '@sanity/client';
import { HTTPError } from "typesense/lib/Typesense/Errors";
 
interface SanityProduct {
  _id: string;
  name: string;
  description?: string;
  price: number;
  stock: number;
  category: string;
  category_slug: string;
  images: Array<{ asset: { _ref: string; url?: string } }>; // Add url as optional
  size: string[];
  qcom_availability: boolean;
  brand?: string;
  tags?: string[];
  ratings?: number;
  created_at: string;
}

interface TypesenseProduct {
  id: string;
  name: string;
  description?: string;
  price: number;
  stock: number;
  category: string;
  category_slug: string;
  images: string[];
  size: string[];
  qcom_availability: boolean;
  brand?: string;
  tags?: string[];
  ratings?: number;
  created_at: number;
}

const sanity = createClient({
  projectId: "xphvex0e",
  dataset: "production",
  token:"skwCgoxZFlLNZ4pJvHGxBL4HwxACC2BWjzLOdLShub9MUTiTjDJqf3MZVipfrn4bxvoG3v8kWSWponB4lrdSH08kYflsjXTAG3TI4aIGSxogwN5y3mcOojsD3LFZDf5CYEpYrrspXa3beHAiGY9obhivS48gAMi8w67AS7y6UoLzW0mEvPfp",
  apiVersion:  '2025-01-27',
  useCdn: false,
});

async function syncProducts() {
  try {
    // Check if collection exists first
    let collectionExists = true;
    try {
      await adminClient.collections('products').retrieve();
    } catch (error) {
      if ((error as HTTPError).httpStatus === 404) {
        collectionExists = false;
      } else {
        throw error;
      }
    }

    // Only create collection if it doesn't exist
    if (!collectionExists) {
      await adminClient.collections().create({
        name: 'products',
        fields: [
          { name: 'id', type: 'string' },
          { name: 'name', type: 'string' },
          { name: 'description', type: 'string' },
          { name: 'price', type: 'float' },
          { name: 'stock', type: 'int32' },
          { name: 'category', type: 'string' },
          { name: 'category_slug', type: 'string' },
          { name: 'images', type: 'string[]' },
          { name: 'size', type: 'string[]' },
          { name: 'qcom_availability', type: 'bool' },
          { name: 'brand', type: 'string' },
          { name: 'tags', type: 'string[]' },
          { name: 'ratings', type: 'float' },
          { name: 'created_at', type: 'int64' }
        ],
        default_sorting_field: 'created_at'
      });
    }

    // Fetch products from Sanity with proper typing
    const products = await sanity.fetch<SanityProduct[]>(`
      *[_type == "product"]{
        _id,
        name,
        description,
        price,
        stock,
        category,
        category_slug,
        images[] {
          asset-> {
            url
          }
        },
        size,
        qcom_availability,
        brand,
        tags,
        ratings,
        created_at
      }
    `);

    // Transform with proper error handling
    const documents: TypesenseProduct[] = products.map(product => {
      if (!product.images || product.images.length === 0) {
        console.warn(`Product ${product._id} has no images, skipping`);
        return null;
      }

      return {
        id: product._id,
        name: product.name,
        description: product.description || '',
        price: product.price,
        stock: product.stock,
        category: product.category,
        category_slug: product.category_slug,
        images: product.images
          .map(img => img?.asset?.url)
          .filter((url): url is string => !!url),
        size: product.size,
        qcom_availability: product.qcom_availability,
        brand: product.brand || '',
        tags: product.tags || [],
        ratings: product.ratings || 0,
        created_at: Math.floor(new Date(product.created_at).getTime() / 1000)
      };
    }).filter(Boolean) as TypesenseProduct[];

    // Upsert documents instead of create
    const result = await adminClient.collections('products').documents().import(
      documents, 
      { action: 'upsert' } // Update existing documents
    );

    console.log('Sync successful:', result);
  } catch (error) {
    console.error('Sync failed:', error);
    process.exit(1);
  }
}

syncProducts();