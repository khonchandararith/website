import { NextRequest, NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/admin';

// Bulk import license keys
export async function POST(request: NextRequest) {
  try {
    const supabase = createAdminClient();
    const body = await request.json();
    const { productId, keys } = body as { productId: string; keys: string[] };

    if (!productId || !keys || keys.length === 0) {
      return NextResponse.json(
        { error: 'Product ID and keys are required' },
        { status: 400 }
      );
    }

    // Verify product exists
    const { data: product } = await supabase
      .from('products')
      .select('id')
      .eq('id', productId)
      .single();

    if (!product) {
      return NextResponse.json(
        { error: 'Product not found' },
        { status: 404 }
      );
    }

    // Insert keys
    const insertData = keys.map((key: string) => ({
      product_id: productId,
      key_code: key.trim(),
      is_sold: false,
    }));

    const { data, error } = await supabase
      .from('license_keys')
      .insert(insertData)
      .select();

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({
      success: true,
      imported: data?.length || 0,
    });
  } catch (error) {
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
