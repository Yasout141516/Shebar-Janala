// app/api/budgets/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';
import { calculateHash, verifyChain } from '@/lib/hash';
import { BudgetRecord } from '@/types';

/**
 * GET /api/budgets
 * List budget records with optional hash verification
 * Query params: union_id (required), verify_chain (optional)
 */
export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const union_id = searchParams.get('union_id');
    const verify_chain = searchParams.get('verify_chain') === 'true';

    // Validation
    if (!union_id) {
      return NextResponse.json(
        { error: 'union_id is required' },
        { status: 400 }
      );
    }

    // Fetch budget records for the union
    const { data: budgets, error } = await supabase
      .from('budget_records')
      .select(`
        *,
        created_by_user:users!budget_records_created_by_fkey(id, name, role)
      `)
      .eq('union_id', union_id)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Database error:', error);
      return NextResponse.json(
        { error: 'Failed to fetch budgets' },
        { status: 500 }
      );
    }

    let chainVerification = null;

    // Optionally verify the hash chain
    if (verify_chain && budgets && budgets.length > 0) {
      chainVerification = verifyChain(budgets as BudgetRecord[]);
    }

    return NextResponse.json({
      success: true,
      budgets: budgets || [],
      count: budgets?.length || 0,
      chain_verification: chainVerification,
    });

  } catch (error) {
    console.error('Get budgets error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

/**
 * POST /api/budgets
 * Create a new budget record with hash chain
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const {
      project_code,
      project_name,
      category,
      implementing_authority,
      responsible_official,
      approval_date,
      start_date,
      expected_completion_date,
      total_allocated_amount,
      status,
      remarks,
      union_id,
      ward,
      created_by,
    } = body;

    // Validation
    if (!project_code || !project_name || !category || !implementing_authority || 
        !responsible_official || !total_allocated_amount || !union_id || !created_by) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }

    // Verify user exists and belongs to the union
    const { data: user, error: userError } = await supabase
      .from('users')
      .select('id, union_id, role')
      .eq('id', created_by)
      .single();

    if (userError || !user) {
      return NextResponse.json(
        { error: 'Invalid user' },
        { status: 400 }
      );
    }

    // Security: Only chairmen can create budgets
    if (user.role !== 'chairman') {
      return NextResponse.json(
        { error: 'Only chairmen can create budget records' },
        { status: 403 }
      );
    }

    // Security: Can only create budgets for their own union
    if (user.union_id !== union_id) {
      return NextResponse.json(
        { error: 'Cannot create budgets for a different union' },
        { status: 403 }
      );
    }

    // Check if project_code already exists
    const { data: existingProject } = await supabase
      .from('budget_records')
      .select('id')
      .eq('project_code', project_code)
      .maybeSingle();

    if (existingProject) {
      return NextResponse.json(
        { error: 'Project code already exists' },
        { status: 400 }
      );
    }

    // Get the last budget record for this union (for hash chain)
    const { data: lastRecord } = await supabase
      .from('budget_records')
      .select('record_hash')
      .eq('union_id', union_id)
      .order('created_at', { ascending: false })
      .limit(1)
      .maybeSingle();

    const prev_hash = lastRecord?.record_hash || null;
    const created_at = new Date().toISOString();

    // Calculate hash for this record
    const record_hash = calculateHash({
      project_code,
      project_name,
      category,
      implementing_authority,
      responsible_official,
      approval_date,
      start_date,
      expected_completion_date,
      total_allocated_amount,
      status: status || 'planned',
      union_id,
      ward,
      created_by,
      prev_hash,
      created_at,
    });

    // Insert the budget record
    const { data: newBudget, error: createError } = await supabase
      .from('budget_records')
      .insert({
        project_code,
        project_name,
        category,
        implementing_authority,
        responsible_official,
        approval_date,
        start_date,
        expected_completion_date,
        total_allocated_amount,
        status: status || 'planned',
        remarks,
        union_id,
        ward,
        created_by,
        prev_hash,
        record_hash,
      })
      .select(`
        *,
        created_by_user:users!budget_records_created_by_fkey(id, name, role)
      `)
      .single();

    if (createError || !newBudget) {
      console.error('Create budget error:', createError);
      return NextResponse.json(
        { error: 'Failed to create budget record' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      budget: newBudget,
      hash_info: {
        prev_hash,
        record_hash,
        chain_position: prev_hash ? 'linked' : 'genesis',
      },
    }, { status: 201 });

  } catch (error) {
    console.error('Create budget error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}