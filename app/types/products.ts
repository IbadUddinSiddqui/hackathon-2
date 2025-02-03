export interface ProductDocument {
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
  
  export interface SanityProduct {
    _id: string;
    name: string;
    description?: string;
    price: number;
    stock: number;
    category: string;
    category_slug: string;
    images: Array<{ asset: { url: string } }>;
    size: string[];
    qcom_availability: boolean;
    brand?: string;
    tags?: string[];
    ratings?: number;
    created_at: string;
  }