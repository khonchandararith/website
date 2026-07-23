import { NextRequest, NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/admin';

// Get all products with available (unsold) stock counts
export async function GET() {
  try {
    const supabase = createAdminClient();

    const { data: products, error } = await supabase
      .from('products')
      .select('*, categories(name, slug)')
      .order('created_at', { ascending: false });

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    // Fetch unsold keys count per product
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

    return NextResponse.json(mappedProducts);
  } catch (error) {
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// Create product
export async function POST(request: NextRequest) {
  try {
    const supabase = createAdminClient();
    const body = await request.json();

    const { data, error } = await supabase
      .from('products')
      .insert(body)
      .select()
      .single();

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json(data, { status: 201 });
  } catch (error) {
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
