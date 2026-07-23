import { NextRequest, NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/admin';

/**
 * GET /api/products/[slug]
 * Public API to fetch a single product by slug with accurate available (unsold) stock count.
 */
export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ slug: string }> }
) {
  try {
    const { slug } = await params;
    const supabase = createAdminClient();

    const { data: product, error } = await supabase
      .from('products')
      .select('*, categories(id, name, slug)')
      .eq('slug', slug)
      .eq('is_active', true)
      .single();

    if (error || !product) {
      return NextResponse.json({ error: 'Product not found' }, { status: 404 });
    }

    // Count unsold keys for this product
    const { count } = await supabase
      .from('license_keys')
      .select('*', { count: 'exact', head: true })
      .eq('product_id', product.id)
      .eq('is_sold', false);

    const mappedProduct = {
      ...product,
      category: Array.isArray(product.categories) ? product.categories[0] : product.categories,
      stock_count: count || 0,
    };

    return NextResponse.json({ product: mappedProduct });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : String(error);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
