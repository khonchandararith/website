import { NextRequest, NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { checkTransactionByMD5 } from '@/lib/bakong';
import { notifyAdminNewSale } from '@/lib/telegram';

/**
 * GET /api/orders/[id]/check-payment
 * 
 * Polls the Bakong API using your API token to check if payment
 * has been received for this order. Called by the frontend periodically.
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id: orderId } = await params;
  const supabase = createAdminClient();

  // Get order
  const { data: order, error } = await supabase
    .from('orders')
    .select('*')
    .eq('id', orderId)
    .single();

  if (error || !order) {
    return NextResponse.json({ error: 'Order not found' }, { status: 404 });
  }

  // Already paid
  if (order.payment_status === 'paid') {
    return NextResponse.json({ status: 'paid', orderId });
  }

  // Already expired
  if (order.payment_status === 'expired') {
    return NextResponse.json({ status: 'expired', orderId });
  }

  // Check if expired by time
  if (order.expires_at && new Date(order.expires_at) < new Date()) {
    await supabase
      .from('orders')
      .update({ payment_status: 'expired' })
      .eq('id', orderId);
    return NextResponse.json({ status: 'expired', orderId });
  }

  // Check with Bakong API using the KHQR MD5 hash
  if (!order.khqr_md5) {
    return NextResponse.json({ status: 'pending', orderId });
  }

  const result = await checkTransactionByMD5(order.khqr_md5);

  if (!result.paid) {
    return NextResponse.json({ status: 'pending', orderId });
  }

  // Payment confirmed! Assign license keys
  const { data: orderItems } = await supabase
    .from('order_items')
    .select('*, products(title)')
    .eq('order_id', orderId);

  const assignedKeys: { product_title: string; key_code: string }[] = [];

  if (orderItems) {
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
  }

  // Update order to paid
  await supabase
    .from('orders')
    .update({ payment_status: 'paid' })
    .eq('id', orderId);

  // Notify admin via Telegram
  await notifyAdminNewSale({
    id: orderId,
    total_usd: order.total_usd,
    customer_email: order.customer_email,
    customer_name: order.customer_name,
    items: assignedKeys,
  });

  return NextResponse.json({
    status: 'paid',
    orderId,
    keysAssigned: assignedKeys.length,
  });
}
