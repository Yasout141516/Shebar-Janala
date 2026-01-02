// app/api/auth/login/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';
import { User } from '@/types';

/**
 * POST /api/auth/login
 * Mock login - finds or creates a user
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { role, union_id, phone, name } = body;

    // Validation
    if (!role || !union_id) {
      return NextResponse.json(
        { error: 'Role and union_id are required' },
        { status: 400 }
      );
    }

    // Validate role
    if (!['citizen', 'chairman', 'admin'].includes(role)) {
      return NextResponse.json(
        { error: 'Invalid role. Must be citizen, chairman, or admin' },
        { status: 400 }
      );
    }

    // Check if union exists
    const { data: union, error: unionError } = await supabase
      .from('unions')
      .select('id')
      .eq('id', union_id)
      .single();

    if (unionError || !union) {
      return NextResponse.json(
        { error: 'Invalid union_id' },
        { status: 400 }
      );
    }

    // For MVP: Find existing user by role and union
    // In production, you'd use phone/NID for real authentication
    const { data: existingUsers, error: fetchError } = await supabase
      .from('users')
      .select('*')
      .eq('role', role)
      .eq('union_id', union_id)
      .limit(1);

    if (fetchError) {
      console.error('Database error:', fetchError);
      return NextResponse.json(
        { error: 'Database error' },
        { status: 500 }
      );
    }

    let user: User;

    if (existingUsers && existingUsers.length > 0) {
      // User exists - return it
      user = existingUsers[0] as User;
    } else {
      // User doesn't exist - create new one (for demo purposes)
      const { data: newUser, error: createError } = await supabase
        .from('users')
        .insert({
          name: name || `${role.charAt(0).toUpperCase() + role.slice(1)} User`,
          role,
          phone: phone || `0191234567${Math.floor(Math.random() * 10)}`,
          nid_hash: `demo_nid_${Date.now()}`,
          union_id,
        })
        .select()
        .single();

      if (createError || !newUser) {
        console.error('Create user error:', createError);
        return NextResponse.json(
          { error: 'Failed to create user' },
          { status: 500 }
        );
      }

      user = newUser as User;
    }

    // Return user data
    return NextResponse.json({
      success: true,
      user: {
        id: user.id,
        name: user.name,
        role: user.role,
        phone: user.phone,
        union_id: user.union_id,
      },
    });

  } catch (error) {
    console.error('Login error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}