import { NextRequest, NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/admin';

/**
 * GET /api/admin/users
 * Returns list of all users, their profiles, roles, and order counts.
 */
export async function GET() {
  try {
    const supabase = createAdminClient();

    // 1. Fetch users from auth.users via admin API
    const { data: authData, error: authError } = await supabase.auth.admin.listUsers();
    if (authError) {
      console.error('[Admin Users API] Error listing auth users:', authError);
      return NextResponse.json({ error: 'Failed to fetch auth users' }, { status: 500 });
    }

    // 2. Fetch profiles
    const { data: profiles, error: profilesError } = await supabase
      .from('profiles')
      .select('*');

    if (profilesError) {
      console.error('[Admin Users API] Error fetching profiles:', profilesError);
    }

    // 3. Fetch order counts per user
    const { data: orders } = await supabase
      .from('orders')
      .select('user_id, customer_email, payment_status');

    // Create a lookup for profiles and order counts
    const profileMap = new Map((profiles || []).map((p) => [p.id, p]));
    const orderCountMap = new Map<string, number>();

    (orders || []).forEach((order) => {
      if (order.user_id) {
        orderCountMap.set(order.user_id, (orderCountMap.get(order.user_id) || 0) + 1);
      }
    });

    const userList = authData.users.map((user) => {
      const profile = profileMap.get(user.id);
      return {
        id: user.id,
        email: user.email || profile?.email || 'N/A',
        full_name: profile?.full_name || user.user_metadata?.full_name || 'N/A',
        role: profile?.role || 'customer',
        created_at: user.created_at,
        last_sign_in_at: user.last_sign_in_at || null,
        order_count: orderCountMap.get(user.id) || 0,
      };
    });

    return NextResponse.json({ users: userList });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : String(error);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

/**
 * PATCH /api/admin/users
 * Updates a user's profile info (role, name, email).
 */
export async function PATCH(request: NextRequest) {
  try {
    const body = await request.json();
    const { userId, role, fullName, email } = body;

    if (!userId) {
      return NextResponse.json({ error: 'Missing userId' }, { status: 400 });
    }

    const supabase = createAdminClient();

    // 1. Update profiles table
    const updates: Record<string, unknown> = {};
    if (role) updates.role = role;
    if (fullName) updates.full_name = fullName;
    if (email) updates.email = email;

    const { error: profileError } = await supabase
      .from('profiles')
      .upsert({ id: userId, ...updates });

    if (profileError) {
      console.error('[Admin Users API] Error updating profile:', profileError);
      return NextResponse.json({ error: profileError.message }, { status: 500 });
    }

    // 2. If email changed, update in Auth too
    if (email) {
      await supabase.auth.admin.updateUserById(userId, { email });
    }

    return NextResponse.json({ success: true, message: 'User updated successfully' });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : String(error);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

/**
 * POST /api/admin/users
 * Handles Password Reset / Set Password for a user.
 * Body options:
 * - action: 'set_password' (requires userId and newPassword)
 * - action: 'send_recovery' (requires user email)
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { action, userId, newPassword, email } = body;

    const supabase = createAdminClient();

    if (action === 'set_password') {
      if (!userId || !newPassword) {
        return NextResponse.json({ error: 'userId and newPassword are required' }, { status: 400 });
      }

      if (newPassword.length < 6) {
        return NextResponse.json({ error: 'Password must be at least 6 characters' }, { status: 400 });
      }

      const { error } = await supabase.auth.admin.updateUserById(userId, {
        password: newPassword,
      });

      if (error) {
        return NextResponse.json({ error: error.message }, { status: 500 });
      }

      return NextResponse.json({ success: true, message: 'Password updated successfully!' });
    }

    if (action === 'send_recovery') {
      if (!email) {
        return NextResponse.json({ error: 'Email is required' }, { status: 400 });
      }

      const { data, error } = await supabase.auth.admin.generateLink({
        type: 'recovery',
        email,
      });

      if (error) {
        return NextResponse.json({ error: error.message }, { status: 500 });
      }

      return NextResponse.json({
        success: true,
        message: 'Password reset link generated successfully',
        recoveryLink: data.properties?.action_link,
      });
    }

    return NextResponse.json({ error: 'Invalid action' }, { status: 400 });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : String(error);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
