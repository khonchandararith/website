import { NextRequest, NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { generateKHQR } from '@/lib/khqr';
import type { CheckoutRequest } from '@/lib/types';

export async function POST(request: NextRequest) {
  try {
    const body: CheckoutRequest = await request.json();
    const { items, customerEmail, customerName } = body;

    if (!items || items.length === 0) {
      return NextResponse.json(
        { error: 'No items provided' },
        { status: 400 }
      );
    }

    console.log('[Checkout] Starting checkout with', items.length, 'items');

    const supabase = createAdminClient();

    // Validate products and check stock
    let totalUsd = 0;
    let totalKhr = 0;
    const validatedItems: { productId: string; quantity: number; priceUsd: number; priceKhr: number; title: string }[] = [];

    for (const item of items) {
      // Fetch product
      const { data: product, error: productError } = await supabase
        .from('products')
        .select('*')
        .eq('id', item.productId)
        .eq('is_active', true)
        .single();

      if (productError || !product) {
        console.error('[Checkout] Product not found:', item.productId, productError);
        return NextResponse.json(
          { error: `Product not found: ${item.productId}` },
          { status: 400 }
        );
      }

      // Check available stock
      const { count } = await supabase
        .from('license_keys')
        .select('*', { count: 'exact', head: true })
        .eq('product_id', item.productId)
        .eq('is_sold', false);

      if (!count || count < item.quantity) {
        console.error('[Checkout] Insufficient stock for', product.title, 'available:', count);
        return NextResponse.json(
          { error: `Insufficient stock for "${product.title}". Available: ${count || 0}` },
          { status: 400 }
        );
      }

      totalUsd += product.price_usd * item.quantity;
      totalKhr += product.price_khr * item.quantity;
      validatedItems.push({
        productId: item.productId,
        quantity: item.quantity,
        priceUsd: product.price_usd,
        priceKhr: product.price_khr,
        title: product.title,
      });
    }

    console.log('[Checkout] Validated items. Total USD:', totalUsd);

    // Check for authenticated user via cookies
    let userId: string | null = null;
    try {
      const authHeader = request.headers.get('Authorization');
      if (authHeader) {
        const token = authHeader.replace('Bearer ', '');
        const { data: { user } } = await supabase.auth.getUser(token);
        if (user) userId = user.id;
      }
    } catch {
      // Guest checkout
    }

    // Create order
    const expiresAt = new Date(Date.now() + 5 * 60 * 1000).toISOString(); // 5 minutes

    const { data: order, error: orderError } = await supabase
      .from('orders')
      .insert({
        user_id: userId,
        customer_email: customerEmail || null,
        customer_name: customerName || null,
        total_usd: totalUsd,
        total_khr: totalKhr,
        payment_status: 'pending',
        expires_at: expiresAt,
      })
      .select()
      .single();

    if (orderError || !order) {
      console.error('[Checkout] Order creation error:', orderError);
      return NextResponse.json(
        { error: 'Failed to create order' },
        { status: 500 }
      );
    }

    console.log('[Checkout] Order created:', order.id);

    // Create order items (keys will be assigned upon payment confirmation)
    const orderItems = validatedItems.flatMap((item) =>
      Array.from({ length: item.quantity }, () => ({
        order_id: order.id,
        product_id: item.productId,
        price_usd: item.priceUsd,
      }))
    );

    const { error: itemsError } = await supabase
      .from('order_items')
      .insert(orderItems);

    if (itemsError) {
      console.error('[Checkout] Order items error:', itemsError);
      // Clean up order
      await supabase.from('orders').delete().eq('id', order.id);
      return NextResponse.json(
        { error: 'Failed to create order items' },
        { status: 500 }
      );
    }

    console.log('[Checkout] Order items created. Generating KHQR...');

    // Generate KHQR code
    const khqrResult = await generateKHQR(order.id, totalUsd, 'USD');

    console.log('[Checkout] KHQR generated. MD5:', khqrResult.md5);

    // Update order with KHQR data
    await supabase
      .from('orders')
      .update({
        khqr_md5: khqrResult.md5,
        khqr_string: khqrResult.qrString,
      })
      .eq('id', order.id);

    // Build Bakong deep link for mobile app opening
    const deepLink = `https://bakong.nbc.gov.kh/khqr?qr=${encodeURIComponent(khqrResult.qrString)}`;

    return NextResponse.json({
      orderId: order.id,
      qrString: khqrResult.qrString,
      qrDataUrl: khqrResult.qrDataUrl,
      deepLink,
      totalUsd,
      totalKhr,
      expiresAt,
    });
  } catch (error: unknown) {
    console.error('[Checkout] UNHANDLED ERROR:', error);
    const message = error instanceof Error ? error.message : String(error);
    const stack = error instanceof Error ? error.stack : undefined;
    if (stack) console.error('[Checkout] Stack:', stack);
    return NextResponse.json(
      { error: message || 'Internal server error' },
      { status: 500 }
    );
  }
}
