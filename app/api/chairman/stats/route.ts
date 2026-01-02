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

    // Get total budgets
    const { count: totalBudgets } = await supabase
      .from('budget_records')
      .select('*', { count: 'exact', head: true })
      .eq('union_id', union_id);

    // Get all budget IDs
    const { data: budgets } = await supabase
      .from('budget_records')
      .select('id')
      .eq('union_id', union_id);

    const budgetIds = budgets?.map(b => b.id) || [];

    // Get flagged budgets count
    let flaggedBudgetsCount = 0;
    if (budgetIds.length > 0) {
      const { data: flaggedBudgets } = await supabase
        .from('flags')
        .select('budget_record_id')
        .in('budget_record_id', budgetIds);

      const uniqueFlaggedBudgets = new Set(flaggedBudgets?.map(f => f.budget_record_id) || []);
      flaggedBudgetsCount = uniqueFlaggedBudgets.size;
    }

    // Get escalated budgets count
    let escalatedBudgetsCount = 0;
    if (budgetIds.length > 0) {
      const { count: escalatedCount } = await supabase
        .from('escalations')
        .select('*', { count: 'exact', head: true })
        .in('budget_record_id', budgetIds)
        .eq('status', 'pending');

      escalatedBudgetsCount = escalatedCount || 0;
    }

    // Get total citizens
    const { count: totalCitizens } = await supabase
      .from('users')
      .select('*', { count: 'exact', head: true })
      .eq('union_id', union_id)
      .eq('role', 'citizen');

    return NextResponse.json({
      success: true,
      stats: {
        total_issues: totalIssues || 0,
        pending_issues: pendingIssues || 0,
        approved_issues: approvedIssues || 0,
        total_budgets: totalBudgets || 0,
        flagged_budgets: flaggedBudgetsCount,
        escalated_budgets: escalatedBudgetsCount,
        total_citizens: totalCitizens || 0,
      },
    });
  } catch (error) {
    console.error('Stats fetch error:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch stats' },
      { status: 500 }
    );
  }
}