// types.ts
export interface Product {
    _id: string;
    name: string;
    ratings?: number;
    price: number;
    // Sanity docs store asset refs; Typesense docs store CDN URL strings.
    images?: Array<
      | {
          asset?: {
            _ref?: string;
          } | null;
        }
      | string
    >;
    category_slug: string;
    slug?: {
      current: string;
    };
    brand?: string;
    size?: string[];
    tags?: string[];
    // Fields the standardized product card needs (may be absent on
    // Typesense-only docs).
    stock?: number | null;
    on_sale?: boolean;
    sale_price?: number | null;
  }