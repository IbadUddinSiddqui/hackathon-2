import Typesense, { Client } from 'typesense';

// Configuration comes from environment variables — never hardcode keys.
// NEXT_PUBLIC_* are inlined into the browser bundle (search key is public by design).
// TYPESENSE_ADMIN_KEY stays server-side only (used by scripts/syncProducts.ts).
const clientConfig = {
  nodes: [{
    host: process.env.NEXT_PUBLIC_TYPESENSE_HOST || '',
    port: Number(process.env.NEXT_PUBLIC_TYPESENSE_PORT) || 443,
    protocol: (process.env.NEXT_PUBLIC_TYPESENSE_PROTOCOL as 'http' | 'https') || 'https'
  }],
  apiKey: process.env.TYPESENSE_ADMIN_KEY || '',
};

export const searchClient = new Typesense.Client({
  ...clientConfig,
  apiKey: process.env.NEXT_PUBLIC_TYPESENSE_SEARCH_KEY || '',
});

export const adminClient: Client = new Typesense.Client(clientConfig);
