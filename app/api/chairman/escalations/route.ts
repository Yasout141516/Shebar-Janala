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

    // Get all budget IDs for this union
    const { data: budgets } = await supabase
      .from('budget_records')
      .select('id')
      .eq('union_id', union_id);

    const budgetIds = budgets?.map(b => b.id) || [];

    if (budgetIds.length === 0) {
      return NextResponse.json({
        success: true,
        escalations: [],
      });
    }

    // Get escalated budget IDs
    const { data: escalations } = await supabase
      .from('escalations')
      .select('budget_record_id, created_at')
      .in('budget_record_id', budgetIds)
      .eq('status', 'pending')
      .order('created_at', { ascending: false });

    if (!escalations || escalations.length === 0) {
      return NextResponse.json({
        success: true,
        escalations: [],
      });
    }

    const escalatedBudgetIds = escalations.map(e => e.budget_record_id);

    // Get budget details
    const { data: budgetDetails } = await supabase
      .from('budget_records')
      .select('*')
      .in('id', escalatedBudgetIds);

    // Get total citizens
    const { count: totalCitizens } = await supabase
      .from('users')
      .select('*', { count: 'exact', head: true })
      .eq('union_id', union_id)
      .eq('role', 'citizen');

    // Get all flags for these budgets
    const { data: flagsData } = await supabase
      .from('flags')
      .select('id, budget_record_id, reason, created_at, user_id')
      .in('budget_record_id', escalatedBudgetIds)
      .order('created_at', { ascending: false });

    // Get user details
    const userIds = [...new Set(flagsData?.map(f => f.user_id).filter(Boolean))];
    const { data: usersData } = await supabase
      .from('users')
      .select('id, name')
      .in('id', userIds);

    // Create user map
    const userMap = new Map<string, string>();
    usersData?.forEach(u => {
      userMap.set(u.id, u.name);
    });

    // Group flags by budget
    const flagsByBudget = new Map<string, any[]>();
    flagsData?.forEach(flag => {
      if (!flagsByBudget.has(flag.budget_record_id)) {
        flagsByBudget.set(flag.budget_record_id, []);
      }
      flagsByBudget.get(flag.budget_record_id)?.push({
        id: flag.id,
        user_name: userMap.get(flag.user_id) || 'অজানা',
        reason: flag.reason,
        created_at: flag.created_at,
      });
    });

    // Build response
    const result = budgetDetails?.map(budget => {
      const flags = flagsByBudget.get(budget.id) || [];
      const flagCount = flags.length;
      const flagRatio = totalCitizens ? (flagCount / totalCitizens) * 100 : 0;

      return {
        budget: {
          ...budget,
          flag_count: flagCount,
          flag_ratio: Math.round(flagRatio * 100) / 100,
        },
        flags,
      };
    }) || [];

    return NextResponse.json({
      success: true,
      escalations: result,
    });
  } catch (error) {
    console.error('Escalations fetch error:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch escalations' },
      { status: 500 }
    );
  }
}
