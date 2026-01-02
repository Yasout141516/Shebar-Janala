import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';

/**
 * GET /api/budgets/with-flags
 * Get all budgets with flag counts, escalation status, and user flag status
 * Query params: union_id (required), user_id (optional)
 */
export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const union_id = searchParams.get('union_id');
    const user_id = searchParams.get('user_id');

    if (!union_id) {
      return NextResponse.json(
        { success: false, error: 'union_id is required' },
        { status: 400 }
      );
    }

    // Get all budgets for the union
    const { data: budgets, error: budgetsError } = await supabase
      .from('budget_records')
      .select('*, created_by_user:users!budget_records_created_by_fkey(id, name, role)')
      .eq('union_id', union_id)
      .order('created_at', { ascending: false });

    if (budgetsError) {
      console.error('Budgets fetch error:', budgetsError);
      return NextResponse.json(
        { success: false, error: 'Failed to fetch budgets' },
        { status: 500 }
      );
    }

    // Get total citizens count for the union
    const { count: totalCitizens, error: citizensError } = await supabase
      .from('users')
      .select('*', { count: 'exact', head: true })
      .eq('union_id', union_id)
      .eq('role', 'citizen');

    if (citizensError) {
      console.error('Citizens count error:', citizensError);
    }

    const budgetIds = budgets?.map((b: any) => b.id) || [];
    
    // Get flag counts for all budgets
    let flagCountMap = new Map<string, number>();
    if (budgetIds.length > 0) {
      const { data: flagCounts, error: flagsError } = await supabase
        .from('flags')
        .select('budget_record_id')
        .in('budget_record_id', budgetIds);

      if (!flagsError && flagCounts) {
        flagCounts.forEach((flag: any) => {
          const count = flagCountMap.get(flag.budget_record_id) || 0;
          flagCountMap.set(flag.budget_record_id, count + 1);
        });
      }
    }

    // Get user's flags if user_id provided
    let userFlags: string[] = [];
    if (user_id && budgetIds.length > 0) {
      const { data: userFlagData, error: userFlagsError } = await supabase
        .from('flags')
        .select('budget_record_id')
        .eq('user_id', user_id)
        .in('budget_record_id', budgetIds);

      if (!userFlagsError && userFlagData) {
        userFlags = userFlagData.map((f: any) => f.budget_record_id);
      }
    }

    // Get escalation status for all budgets
    let escalatedBudgets = new Set<string>();
    if (budgetIds.length > 0) {
      const { data: escalations, error: escalationsError } = await supabase
        .from('escalations')
        .select('budget_record_id, status')
        .in('budget_record_id', budgetIds)
        .eq('status', 'pending');

      if (!escalationsError && escalations) {
        escalations.forEach((e: any) => {
          escalatedBudgets.add(e.budget_record_id);
        });
      }
    }

    // Enrich budgets with flag data
    const enrichedBudgets = budgets?.map((budget: any) => {
      const flagCount = flagCountMap.get(budget.id) || 0;
      const flagRatio = totalCitizens ? (flagCount / totalCitizens) * 100 : 0;
      
      return {
        ...budget,
        flag_count: flagCount,
        total_citizens: totalCitizens || 0,
        flag_ratio: Math.round(flagRatio * 100) / 100,
        is_escalated: escalatedBudgets.has(budget.id),
        user_has_flagged: userFlags.includes(budget.id),
      };
    });

    return NextResponse.json({
      success: true,
      budgets: enrichedBudgets || [],
    });
  } catch (error) {
    console.error('Error fetching budgets with flags:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch budgets' },
      { status: 500 }
    );
  }
}