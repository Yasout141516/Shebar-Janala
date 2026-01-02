import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';

/**
 * GET /api/flags/my-flags
 * Get all flags created by a specific user with budget details
 * Query params: user_id (required)
 */
export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const user_id = searchParams.get('user_id');

    if (!user_id) {
      return NextResponse.json(
        { success: false, error: 'user_id is required' },
        { status: 400 }
      );
    }

    // Fetch all flags by this user with budget details
    const { data: flags, error: flagsError } = await supabase
      .from('flags')
      .select(`
        id,
        reason,
        created_at,
        budget_record:budget_records(
          id,
          project_code,
          project_name,
          category,
          total_allocated_amount,
          status,
          implementing_authority,
          responsible_official,
          ward,
          record_hash,
          prev_hash,
          created_at
        )
      `)
      .eq('user_id', user_id)
      .order('created_at', { ascending: false });

    if (flagsError) {
      console.error('Database error:', flagsError);
      return NextResponse.json(
        { success: false, error: 'Failed to fetch flags' },
        { status: 500 }
      );
    }

    // For each budget, get current flag count and escalation status
    const budgetIds = flags?.map((f: any) => f.budget_record?.id).filter(Boolean) || [];
    
    let flagCountMap = new Map<string, number>();
    let escalatedBudgets = new Set<string>();
    let totalCitizens = 0;

    if (budgetIds.length > 0) {
      // Get flag counts
      const { data: allFlags, error: countError } = await supabase
        .from('flags')
        .select('budget_record_id')
        .in('budget_record_id', budgetIds);

      if (!countError && allFlags) {
        allFlags.forEach((flag: any) => {
          const count = flagCountMap.get(flag.budget_record_id) || 0;
          flagCountMap.set(flag.budget_record_id, count + 1);
        });
      }

      // Get escalation status
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

      // Get total citizens count (assuming same union for all budgets)
      if (flags && flags.length > 0 && flags[0].budget_record) {
        const { data: unionData } = await supabase
          .from('budget_records')
          .select('union_id')
          .eq('id', budgetIds[0])
          .single();

        if (unionData) {
          const { count } = await supabase
            .from('users')
            .select('*', { count: 'exact', head: true })
            .eq('union_id', unionData.union_id)
            .eq('role', 'citizen');

          totalCitizens = count || 0;
        }
      }
    }

    // Enrich flags with current status
    const enrichedFlags = flags?.map((flag: any) => {
      if (!flag.budget_record) return null;

      const budgetId = flag.budget_record.id;
      const flagCount = flagCountMap.get(budgetId) || 0;
      const flagRatio = totalCitizens ? (flagCount / totalCitizens) * 100 : 0;

      return {
        id: flag.id,
        reason: flag.reason,
        flagged_at: flag.created_at,
        budget: {
          ...flag.budget_record,
          flag_count: flagCount,
          total_citizens: totalCitizens,
          flag_ratio: Math.round(flagRatio * 100) / 100,
          is_escalated: escalatedBudgets.has(budgetId),
        },
      };
    }).filter(Boolean);

    return NextResponse.json({
      success: true,
      flags: enrichedFlags || [],
      count: enrichedFlags?.length || 0,
    });

  } catch (error) {
    console.error('Get my flags error:', error);
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}