import { NextRequest, NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { notifyAdminNewSale } from '@/lib/telegram';

// Development-only: simulate a successful KHQR payment
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id: orderId } = await params;

  if (process.env.NODE_ENV === 'production') {
    return NextResponse.json(
      { error: 'Not available in production' },
      { status: 403 }
    );
  }

  const supabase = createAdminClient();

  // Find order
  const { data: order, error: orderError } = await supabase
    .from('orders')
    .select('*')
    .eq('id', orderId)
    .eq('payment_status', 'pending')
    .single();

  if (orderError || !order) {
    return NextResponse.json(
      { error: 'Pending order not found' },
      { status: 404 }
    );
  }

  // Get order items
  const { data: orderItems } = await supabase
    .from('order_items')
    .select('*, products(title)')
    .eq('order_id', orderId);

  if (!orderItems) {
    return NextResponse.json(
      { error: 'No order items found' },
      { status: 400 }
    );
  }

  // Assign keys
  const assignedKeys: { product_title: string; key_code: string }[] = [];

  for (const item of orderItems) {
    const { data: key } = await supabase
      .from('license_keys')
      .select('*')
      .eq('product_id', item.product_id)
      .eq('is_sold', false)
      .limit(1)
      .single();

    if (key) {
      await supabase
        .from('license_keys')
        .update({ is_sold: true, order_id: orderId })
        .eq('id', key.id);

      await supabase
        .from('order_items')
        .update({ key_id: key.id })
        .eq('id', item.id);

      const productData = item.products as { title: string } | null;
      assignedKeys.push({
        product_title: productData?.title || 'Unknown',
        key_code: key.key_code,
      });
    }
  }

  // Update order status
  await supabase
    .from('orders')
    .update({ payment_status: 'paid' })
    .eq('id', orderId);

  // Notify admin
  await notifyAdminNewSale({
    id: orderId,
    total_usd: order.total_usd,
    customer_email: order.customer_email,
    customer_name: order.customer_name,
    items: assignedKeys,
  });

  return NextResponse.json({
    success: true,
    orderId,
    keys: assignedKeys,
  });
}
