import { NextRequest, NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/admin';

// GET: Check if any admin account exists
export async function GET() {
  try {
    const supabase = createAdminClient();

    const { data: admins, error } = await supabase
      .from('profiles')
      .select('id')
      .eq('role', 'admin')
      .limit(1);

    if (error) {
      console.error('Error checking existing admins:', error);
      return NextResponse.json({ error: 'Failed to verify admin status' }, { status: 500 });
    }

    const adminExists = admins && admins.length > 0;
    return NextResponse.json({ adminExists });
  } catch (error: any) {
    return NextResponse.json({ error: error.message || 'Internal server error' }, { status: 500 });
  }
}

// POST: Create the initial admin account (only runs if no admin exists)
export async function POST(request: NextRequest) {
  try {
    const supabase = createAdminClient();

    // Check if any admin already exists in the profiles table
    const { data: admins, error: countError } = await supabase
      .from('profiles')
      .select('id')
      .eq('role', 'admin')
      .limit(1);

    if (countError) {
      console.error('Error checking existing admins:', countError);
      return NextResponse.json(
        { error: 'Failed to verify admin status' },
        { status: 500 }
      );
    }

    if (admins && admins.length > 0) {
      return NextResponse.json(
        { error: 'Setup already completed. An admin account already exists.' },
        { status: 403 }
      );
    }

    const body = await request.json().catch(() => ({}));
    const { email, password, fullName } = body;

    if (!email || !password) {
      return NextResponse.json(
        { error: 'Email and password are required.' },
        { status: 400 }
      );
    }

    if (password.length < 6) {
      return NextResponse.json(
        { error: 'Password must be at least 6 characters.' },
        { status: 400 }
      );
    }

    // Create the auth user with auto-confirmed email
    const { data: authData, error: authError } = await supabase.auth.admin.createUser({
      email,
      password,
      email_confirm: true,
      user_metadata: { full_name: fullName || 'Admin' }
    });

    if (authError || !authData.user) {
      console.error('Failed to create auth user:', authError);
      return NextResponse.json(
        { error: authError?.message || 'Failed to create user' },
        { status: 500 }
      );
    }

    // Give the database a brief moment for the user signup trigger to run
    await new Promise((resolve) => setTimeout(resolve, 200));

    // Upsert the profile to guarantee the role is set to 'admin'
    const { error: profileError } = await supabase
      .from('profiles')
      .upsert({
        id: authData.user.id,
        role: 'admin',
        full_name: fullName || 'Admin',
        email: email,
      });

    if (profileError) {
      console.error('Failed to upsert profile to admin:', profileError);
      // Clean up the created auth user to avoid orphan accounts
      await supabase.auth.admin.deleteUser(authData.user.id);
      return NextResponse.json(
        { error: 'Failed to configure admin profile roles.' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      message: 'Admin account created successfully.',
    });
  } catch (error: any) {
    console.error('Admin setup error:', error);
    return NextResponse.json(
      { error: error.message || 'Internal server error' },
      { status: 500 }
    );
  }
}
