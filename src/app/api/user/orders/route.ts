import { NextRequest, NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/admin';

/**
 * GET /api/user/orders
 * Returns all orders and revealed license keys for the authenticated customer.
 * Automatically links any unlinked past orders matching the customer's email.
 */
export async function GET(request: NextRequest) {
  try {
    const authHeader = request.headers.get('Authorization');
    if (!authHeader) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const token = authHeader.replace('Bearer ', '');
    const supabase = createAdminClient();

    // Verify user session
    const { data: { user }, error: authError } = await supabase.auth.getUser(token);
    if (authError || !user) {
      return NextResponse.json({ error: 'Invalid auth token' }, { status: 401 });
    }

    // 1. Auto-link any previous orders created with this email where user_id is null
    if (user.email) {
      await supabase
        .from('orders')
        .update({ user_id: user.id })
        .eq('customer_email', user.email)
        .is('user_id', null);
    }

    // 2. Fetch orders for this user (or email) with items, products, and license keys
    const userEmail = user.email || '';
    let query = supabase
      .from('orders')
      .select(`
        id,
        total_usd,
        total_khr,
        payment_status,
        created_at,
        order_items (
          id,
          price_usd,
          product_id,
          key_id,
          products (title, image_url),
          license_keys (key_code)
        )
      `)
      .order('created_at', { ascending: false });

    if (userEmail) {
      query = query.or(`user_id.eq.${user.id},customer_email.eq.${userEmail}`);
    } else {
      query = query.eq('user_id', user.id);
    }

    const { data: orders, error: ordersError } = await query;

    if (ordersError) {
      console.error('[User Orders API] Error fetching orders:', ordersError);
      return NextResponse.json({ error: 'Failed to fetch orders' }, { status: 500 });
    }

    return NextResponse.json({ orders: orders || [] });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : String(error);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
