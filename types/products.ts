// types.ts
export interface Product {
    _id: string;
    name: string;
    ratings?: number;
    price: number;
    images?: Array<{
      asset: {
        _ref: string;
      };
    }>;
    category_slug: string;
    slug?: {
      current: string;
    };
    brand?: string;
    size?: string[];
    tags?: string[];
  }