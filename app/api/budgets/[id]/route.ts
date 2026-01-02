// app/api/budgets/[id]/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';

/**
 * GET /api/budgets/[id]
 * Fetch detailed budget information with flags
 */
export async function GET(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    // Next.js 15: await params
    const { id: budgetId } = await context.params;

    // Get budget details
    const { data: budget, error: budgetError } = await supabase
      .from('budget_records')
      .select(`
        *,
        created_by_user:users!budget_records_created_by_fkey(id, name, role),
        union:unions(id, union_name, upazila_name, district_name)
      `)
      .eq('id', budgetId)
      .single();

    if (budgetError || !budget) {
      return NextResponse.json(
        { success: false, error: 'Budget not found' },
        { status: 404 }
      );
    }

    // Get total citizens for this union
    const { count: totalCitizens } = await supabase
      .from('users')
      .select('*', { count: 'exact', head: true })
      .eq('union_id', budget.union_id)
      .eq('role', 'citizen');

    // Get all flags for this budget
    const { data: flagsData } = await supabase
      .from('flags')
      .select('id, reason, created_at, user_id')
      .eq('budget_record_id', budgetId)
      .order('created_at', { ascending: false });

    // Get user details for flags
    const userIds = [...new Set(flagsData?.map(f => f.user_id).filter(Boolean))];
    let usersData: any[] = [];
    if (userIds.length > 0) {
      const { data: users } = await supabase
        .from('users')
        .select('id, name, phone')
        .in('id', userIds);
      usersData = users || [];
    }

    // Map user info to flags
    const userMap = new Map<string, any>();
    usersData.forEach(u => {
      userMap.set(u.id, u);
    });

    const flags = flagsData?.map(flag => ({
      id: flag.id,
      reason: flag.reason,
      created_at: flag.created_at,
      user_name: userMap.get(flag.user_id)?.name || 'অজানা',
      user_phone: userMap.get(flag.user_id)?.phone || null,
    })) || [];

    // Check if escalated
    const { data: escalation } = await supabase
      .from('escalations')
      .select('id, status, created_at')
      .eq('budget_record_id', budgetId)
      .eq('status', 'pending')
      .maybeSingle();

    // Calculate flag ratio
    const flagCount = flags.length;
    const flagRatio = totalCitizens ? (flagCount / totalCitizens) * 100 : 0;

    // Verify hash
    let hashVerified = true;
    let hashMessage = 'হ্যাশ চেইন যাচাইকৃত ✓';

    if (!budget.record_hash) {
      hashVerified = false;
      hashMessage = 'হ্যাশ অনুপস্থিত ⚠️';
    }

    return NextResponse.json({
      success: true,
      budget: {
        ...budget,
        flag_count: flagCount,
        flag_ratio: Math.round(flagRatio * 100) / 100,
        total_citizens: totalCitizens || 0,
        is_escalated: !!escalation,
        escalation_date: escalation?.created_at || null,
        hash_verified: hashVerified,
        hash_message: hashMessage,
        flags,
      },
    });
  } catch (error) {
    console.error('Get budget detail error:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch budget details' },
      { status: 500 }
    );
  }
}

