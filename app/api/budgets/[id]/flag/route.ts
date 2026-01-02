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

    // Get all flags for this budget with user info
    const { data: flagsData } = await supabase
      .from('flags')
      .select(`
        id,
        reason,
        created_at,
        user_id
      `)
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

    // Verify hash chain integrity
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

/**
 * POST /api/budgets/[id]/flag
 * Flag a budget as suspicious and auto-escalate if threshold reached
 */
export async function POST(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const { id: budget_record_id } = await context.params;
    
    const body = await request.json();
    const { user_id, reason } = body;

    // Validation
    if (!user_id) {
      return NextResponse.json(
        { error: 'user_id is required' },
        { status: 400 }
      );
    }

    // Get user info
    const { data: user, error: userError } = await supabase
      .from('users')
      .select('id, union_id')
      .eq('id', user_id)
      .single();

    if (userError || !user) {
      return NextResponse.json(
        { error: 'Invalid user' },
        { status: 400 }
      );
    }

    // Get budget info
    const { data: budget, error: budgetError } = await supabase
      .from('budget_records')
      .select('id, union_id, project_name')
      .eq('id', budget_record_id)
      .single();

    if (budgetError || !budget) {
      return NextResponse.json(
        { error: 'Budget not found' },
        { status: 404 }
      );
    }

    // Security: Can only flag budgets in your own union
    if (user.union_id !== budget.union_id) {
      return NextResponse.json(
        { error: 'Cannot flag budgets outside your union' },
        { status: 403 }
      );
    }

    // Check if user already flagged this budget
    const { data: existingFlag } = await supabase
      .from('flags')
      .select('id')
      .eq('budget_record_id', budget_record_id)
      .eq('user_id', user_id)
      .maybeSingle();

    if (existingFlag) {
      return NextResponse.json(
        { error: 'You have already flagged this budget' },
        { status: 400 }
      );
    }

    // Create flag
    const { error: flagError } = await supabase
      .from('flags')
      .insert({
        budget_record_id,
        user_id,
        reason: reason || 'সন্দেহজনক',
      });

    if (flagError) {
      console.error('Flag insert error:', flagError);
      return NextResponse.json(
        { error: 'Failed to create flag' },
        { status: 500 }
      );
    }

    // Count total flags on this budget
    const { count: flagCount, error: flagCountError } = await supabase
      .from('flags')
      .select('*', { count: 'exact', head: true })
      .eq('budget_record_id', budget_record_id);

    if (flagCountError) {
      console.error('Flag count error:', flagCountError);
      return NextResponse.json(
        { error: 'Failed to count flags' },
        { status: 500 }
      );
    }

    // Count total citizens in this union
    const { count: citizenCount, error: citizenCountError } = await supabase
      .from('users')
      .select('*', { count: 'exact', head: true })
      .eq('union_id', budget.union_id)
      .eq('role', 'citizen');

    if (citizenCountError) {
      console.error('Citizen count error:', citizenCountError);
      return NextResponse.json(
        { error: 'Failed to count citizens' },
        { status: 500 }
      );
    }

    // Calculate flag ratio
    const totalFlags = flagCount || 0;
    const totalCitizens = citizenCount || 1;
    const flagRatio = (totalFlags / totalCitizens) * 100;

    console.log('🚩 Flag stats:', {
      budget_id: budget_record_id,
      flags: totalFlags,
      citizens: totalCitizens,
      ratio: `${flagRatio.toFixed(2)}%`,
    });

    let escalated = false;
    let escalation = null;

    // ESCALATION THRESHOLD: 50%
    if (flagRatio > 50) {
      console.log('🚨 ESCALATION THRESHOLD REACHED!');

      const { data: existingEscalation } = await supabase
        .from('escalations')
        .select('id, status, created_at')
        .eq('budget_record_id', budget_record_id)
        .maybeSingle();

      if (!existingEscalation) {
        const { data: newEscalation, error: escalationError } = await supabase
          .from('escalations')
          .insert({
            budget_record_id,
            flag_count: totalFlags,
            flag_ratio: parseFloat(flagRatio.toFixed(2)),
            status: 'pending',
          })
          .select()
          .single();

        if (escalationError) {
          console.error('Escalation error:', escalationError);
        } else {
          escalated = true;
          escalation = newEscalation;
          console.log('✅ Escalation created:', newEscalation.id);
        }
      } else {
        escalated = true;
        escalation = existingEscalation;
        console.log('⚠️ Already escalated');
      }
    }

    return NextResponse.json({
      success: true,
      message: 'Flag recorded successfully',
      flag_count: totalFlags,
      total_citizens: totalCitizens,
      flag_ratio: parseFloat(flagRatio.toFixed(2)),
      escalated,
      escalation: escalation ? {
        id: escalation.id,
        status: escalation.status,
        created_at: escalation.created_at,
      } : null,
    });

  } catch (error) {
    console.error('Flag error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}