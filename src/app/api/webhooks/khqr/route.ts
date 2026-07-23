import { NextRequest, NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { notifyAdminNewSale } from '@/lib/telegram';
import { checkTransactionByMD5 } from '@/lib/bakong';

export async function POST(request: NextRequest) {
  try {
    // Verify webhook secret
    const webhookSecret = request.headers.get('x-webhook-secret');
    if (
      process.env.KHQR_WEBHOOK_SECRET &&
      webhookSecret !== process.env.KHQR_WEBHOOK_SECRET
    ) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();

    // Extract transaction details from webhook payload
    // Adapt field names to your bank's webhook format
    const {
      billNumber,
      amount,
      currency,
      transactionId,
      status,
    } = body;

    if (!billNumber || status !== 'SUCCESS') {
      return NextResponse.json(
        { error: 'Invalid payload' },
        { status: 400 }
      );
    }

    const supabase = createAdminClient();
    const orderId = billNumber;

    // Find the pending order
    const { data: order, error: orderError } = await supabase
      .from('orders')
      .select('*')
      .eq('id', orderId)
      .eq('payment_status', 'pending')
      .single();

    if (orderError || !order) {
      console.error('Order not found for webhook:', orderId);
      return NextResponse.json(
        { error: 'Order not found or already processed' },
        { status: 404 }
      );
    }

    // Verify via Bakong API using the MD5 hash to guarantee authenticity
    if (order.khqr_md5) {
      const verifyResult = await checkTransactionByMD5(order.khqr_md5);
      if (!verifyResult.paid) {
        console.error('Webhook payload claimed SUCCESS, but Bakong API MD5 check returned unpaid for order:', orderId);
        return NextResponse.json(
          { error: 'Payment verification failed with bank' },
          { status: 400 }
        );
      }
    }

    // Verify amount matches
    if (amount && Number(amount) !== Number(order.total_usd)) {
      console.error('Amount mismatch:', { expected: order.total_usd, received: amount });
      return NextResponse.json(
        { error: 'Amount mismatch' },
        { status: 400 }
      );
    }

    // Get order items
    const { data: orderItems } = await supabase
      .from('order_items')
      .select('*, products(title)')
      .eq('order_id', orderId);

    if (!orderItems || orderItems.length === 0) {
      return NextResponse.json(
        { error: 'No order items found' },
        { status: 400 }
      );
    }

    // Assign license keys to each order item
    const assignedKeys: { product_title: string; key_code: string }[] = [];

    for (const item of orderItems) {
      // Get an available key for this product
      const { data: key, error: keyError } = await supabase
        .from('license_keys')
        .select('*')
        .eq('product_id', item.product_id)
        .eq('is_sold', false)
        .limit(1)
        .single();

      if (keyError || !key) {
        console.error('No available key for product:', item.product_id);
        continue;
      }

      // Mark key as sold and assign to order
      await supabase
        .from('license_keys')
        .update({ is_sold: true, order_id: orderId })
        .eq('id', key.id);

      // Link key to order item
      await supabase
        .from('order_items')
        .update({ key_id: key.id })
        .eq('id', item.id);

      const productData = item.products as { title: string } | null;
      assignedKeys.push({
        product_title: productData?.title || 'Unknown Product',
        key_code: key.key_code,
      });
    }

    // Update order status to paid
    await supabase
      .from('orders')
      .update({ payment_status: 'paid' })
      .eq('id', orderId);

    // Send Telegram notification
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
      keysAssigned: assignedKeys.length,
    });
  } catch (error) {
    console.error('Webhook error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
