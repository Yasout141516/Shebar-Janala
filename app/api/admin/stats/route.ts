// app/api/admin/stats/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const union_id = searchParams.get('union_id');

    if (!union_id) {
      return NextResponse.json(
        { success: false, error: 'union_id is required' },
        { status: 400 }
      );
    }

    // Get total issues
    const { count: totalIssues } = await supabase
      .from('issues')
      .select('*', { count: 'exact', head: true })
      .eq('union_id', union_id);

    // Get pending issues
    const { count: pendingIssues } = await supabase
      .from('issues')
      .select('*', { count: 'exact', head: true })
      .eq('union_id', union_id)
      .eq('status', 'pending');

    // Get approved issues
    const { count: approvedIssues } = await supabase
      .from('issues')
      .select('*', { count: 'exact', head: true })
      .eq('union_id', union_id)
      .eq('status', 'approved');

    // Get rejected issues
    const { count: rejectedIssues } = await supabase
      .from('issues')
      .select('*', { count: 'exact', head: true })
      .eq('union_id', union_id)
      .eq('status', 'rejected');

    // Get total users
    const { count: totalUsers } = await supabase
      .from('users')
      .select('*', { count: 'exact', head: true })
      .eq('union_id', union_id);

    // Get total budgets
    const { count: totalBudgets } = await supabase
      .from('budget_records')
      .select('*', { count: 'exact', head: true })
      .eq('union_id', union_id);

    return NextResponse.json({
      success: true,
      stats: {
        total_issues: totalIssues || 0,
        pending_issues: pendingIssues || 0,
        approved_issues: approvedIssues || 0,
        rejected_issues: rejectedIssues || 0,
        total_users: totalUsers || 0,
        total_budgets: totalBudgets || 0,
      },
    });
  } catch (error) {
    console.error('Admin stats error:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch stats' },
      { status: 500 }
    );
  }
}