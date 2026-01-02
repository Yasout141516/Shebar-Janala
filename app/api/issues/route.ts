// app/api/issues/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';
import { Issue } from '@/types';

/**
 * GET /api/issues
 * List issues with filters
 * Query params: union_id (required), status (optional), created_by (optional)
 */
export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const union_id = searchParams.get('union_id');
    const status = searchParams.get('status');
    const created_by = searchParams.get('created_by');

    // Validation: union_id is required
    if (!union_id) {
      return NextResponse.json(
        { error: 'union_id is required' },
        { status: 400 }
      );
    }

    // Build query
    let query = supabase
      .from('issues')
      .select(`
        *,
        created_by_user:users!issues_created_by_fkey(id, name, role)
      `)
      .eq('union_id', union_id);

    // Apply filters
    if (status) {
      query = query.eq('status', status);
    }

    if (created_by) {
      query = query.eq('created_by', created_by);
    }

    // Order by most votes first, then newest
    query = query.order('upvote_count', { ascending: false });
    query = query.order('created_at', { ascending: false });

    const { data: issues, error } = await query;

    if (error) {
      console.error('Database error:', error);
      return NextResponse.json(
        { error: 'Failed to fetch issues' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      issues: issues || [],
      count: issues?.length || 0,
    });

  } catch (error) {
    console.error('Get issues error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

/**
 * POST /api/issues
 * Create a new issue
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { title, description, image_url, union_id, ward, created_by } = body;

    // Validation
    if (!title || !description || !union_id || !created_by) {
      return NextResponse.json(
        { error: 'title, description, union_id, and created_by are required' },
        { status: 400 }
      );
    }

    // Validate title length
    if (title.length > 200) {
      return NextResponse.json(
        { error: 'Title must be 200 characters or less' },
        { status: 400 }
      );
    }

    // Verify user exists and belongs to the union
    const { data: user, error: userError } = await supabase
      .from('users')
      .select('id, union_id')
      .eq('id', created_by)
      .single();

    if (userError || !user) {
      return NextResponse.json(
        { error: 'Invalid user' },
        { status: 400 }
      );
    }

    // Security: Ensure user can only create issues in their own union
    if (user.union_id !== union_id) {
      return NextResponse.json(
        { error: 'Cannot create issues in a different union' },
        { status: 403 }
      );
    }

    // Create the issue
    const { data: newIssue, error: createError } = await supabase
      .from('issues')
      .insert({
        title,
        description,
        image_url,
        union_id,
        ward,
        created_by,
        status: 'pending', // All new issues start as pending
        upvote_count: 0,
      })
      .select(`
        *,
        created_by_user:users!issues_created_by_fkey(id, name, role)
      `)
      .single();

    if (createError || !newIssue) {
      console.error('Create issue error:', createError);
      return NextResponse.json(
        { error: 'Failed to create issue' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      issue: newIssue,
    }, { status: 201 });

  } catch (error) {
    console.error('Create issue error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}