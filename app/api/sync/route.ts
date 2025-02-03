import { NextRequest, NextResponse } from 'next/server';
import { adminClient } from '@/lib/typesense';
import { createClient } from '@sanity/client';

const sanity = createClient({
  projectId: process.env.NEXT_PUBLIC_SANITY_PROJECT_ID,
  dataset: process.env.NEXT_PUBLIC_SANITY_DATASET,
  token: process.env.SANITY_API_TOKEN,
  useCdn: false,
});

export async function POST(request: NextRequest) {
  const secret = request.nextUrl.searchParams.get('secret');
  if (secret !== process.env.SANITY_WEBHOOK_SECRET) {
    return NextResponse.json({ error: 'Invalid secret' }, { status: 401 });
  }

  try {
    const body = await request.json();
    const productIds = body.ids;

    const products = await sanity.fetch<
      Array<{
        _id: string;
        name: string;
        price: number;
        images: Array<{ asset: { url: string } }>;
        qcom_availability: boolean;
        stock: number;
        category: string;
        created_at: string;
      }>
    >(`*[_type == "product" && _id in $ids]`, { ids: productIds });

    const operations = products.map(product => ({
      action: 'upsert',
      document: {
        id: product._id,
        name: product.name,
        price: product.price,
        images: product.images.map(img => img.asset.url),
        qcom_availability: product.qcom_availability,
        stock: product.stock,
        category: product.category,
        created_at: Math.floor(new Date(product.created_at).getTime() / 1000)
      }
    }));

    await adminClient.collections('products').documents().import(operations);
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Webhook error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}