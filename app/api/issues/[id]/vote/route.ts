// app/api/issues/[id]/vote/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';

/**
 * POST /api/issues/[id]/vote
 * Upvote an issue (union-scoped)
 */
export async function POST(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    // Next.js 15: params is a Promise, must await it
    const { id: issue_id } = await context.params;
    
    const body = await request.json();
    const { user_id } = body;

    // Validation
    if (!user_id) {
      return NextResponse.json(
        { error: 'user_id is required' },
        { status: 400 }
      );
    }

    // Get user info (to check union)
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

    // Get issue info (to check union)
    const { data: issue, error: issueError } = await supabase
      .from('issues')
      .select('id, union_id, upvote_count')
      .eq('id', issue_id)
      .single();

    if (issueError || !issue) {
      return NextResponse.json(
        { error: 'Issue not found' },
        { status: 404 }
      );
    }

    // Security: Can only vote on issues in your own union
    if (user.union_id !== issue.union_id) {
      return NextResponse.json(
        { error: 'Cannot vote on issues outside your union' },
        { status: 403 }
      );
    }

    // Check if user already voted
    const { data: existingVote } = await supabase
      .from('votes')
      .select('id')
      .eq('issue_id', issue_id)
      .eq('user_id', user_id)
      .maybeSingle();

    if (existingVote) {
      return NextResponse.json(
        { error: 'You have already voted on this issue' },
        { status: 400 }
      );
    }

    // Create vote record
    const { error: voteError } = await supabase
      .from('votes')
      .insert({
        issue_id,
        user_id,
      });

    if (voteError) {
      console.error('Vote insert error:', voteError);
      return NextResponse.json(
        { error: 'Failed to create vote' },
        { status: 500 }
      );
    }

    // Increment upvote_count on the issue
    const { data: updatedIssue, error: updateError } = await supabase
      .from('issues')
      .update({ upvote_count: issue.upvote_count + 1 })
      .eq('id', issue_id)
      .select()
      .single();

    if (updateError) {
      console.error('Update issue error:', updateError);
      return NextResponse.json(
        { error: 'Failed to update vote count' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      message: 'Vote recorded successfully',
      upvote_count: updatedIssue.upvote_count,
    });

  } catch (error) {
    console.error('Vote error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}