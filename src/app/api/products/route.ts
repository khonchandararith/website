import { NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/admin';

/**
 * GET /api/products
 * Public API to fetch active products with accurate available (unsold) stock count.
 */
export async function GET() {
  try {
    const supabase = createAdminClient();

    // Fetch active categories
    const { data: categories } = await supabase
      .from('categories')
      .select('*')
      .order('name');

    // Fetch active products
    const { data: products, error: productsError } = await supabase
      .from('products')
      .select('*, categories(id, name, slug)')
      .eq('is_active', true)
      .order('created_at', { ascending: false });

    if (productsError) {
      console.error('[Public Products API] Error:', productsError);
      return NextResponse.json({ error: productsError.message }, { status: 500 });
    }

    // Fetch available (unsold) keys count per product
    const { data: unsoldKeys } = await supabase
      .from('license_keys')
      .select('product_id')
      .eq('is_sold', false);

    const stockMap = new Map<string, number>();
    (unsoldKeys || []).forEach((k) => {
      stockMap.set(k.product_id, (stockMap.get(k.product_id) || 0) + 1);
    });

    const mappedProducts = (products || []).map((p) => ({
      ...p,
      category: Array.isArray(p.categories) ? p.categories[0] : p.categories,
      stock_count: stockMap.get(p.id) || 0,
    }));

    return NextResponse.json({
      categories: categories || [],
      products: mappedProducts,
    });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : String(error);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
