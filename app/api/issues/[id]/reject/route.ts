// app/api/issues/[id]/reject/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';

export async function POST(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const { id: issueId } = await context.params;
    const body = await request.json();
    const { admin_id } = body;

    if (!admin_id) {
      return NextResponse.json(
        { success: false, error: 'admin_id is required' },
        { status: 400 }
      );
    }

    // Verify admin exists
    const { data: admin, error: adminError } = await supabase
      .from('users')
      .select('id, role')
      .eq('id', admin_id)
      .single();

    if (adminError || !admin || admin.role !== 'admin') {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 403 }
      );
    }

    // Update issue status to rejected
    const { error: updateError } = await supabase
      .from('issues')
      .update({
        status: 'rejected',
        updated_at: new Date().toISOString(),
      })
      .eq('id', issueId);

    if (updateError) {
      console.error('Reject issue error:', updateError);
      return NextResponse.json(
        { success: false, error: 'Failed to reject issue' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      message: 'Issue rejected successfully',
    });
  } catch (error) {
    console.error('Reject issue error:', error);
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}
