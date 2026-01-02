// types/index.ts

// Database Types matching your Supabase schema
export interface Union {
  id: number;
  union_name: string;
  upazila_name: string;
  district_name: string;
}

export interface User {
  id: string;
  name: string;
  role: 'citizen' | 'chairman' | 'admin';
  phone: string;
  nid_hash: string;
  union_id: number;
  created_at: string;
  updated_at: string;
}

export interface Issue {
  id: string;
  title: string;
  description: string;
  image_url?: string;
  status: 'pending' | 'approved' | 'rejected';
  union_id: number;
  ward?: string;
  created_by: string;
  upvote_count: number;
  moderated_by?: string;
  moderated_at?: string;
  created_at: string;
  updated_at: string;
  // Joined from API
  created_by_user?: {
    id: string;
    name: string;
    role: string;
  };
}

export interface BudgetRecord {
  id: string;
  project_code: string;
  project_name: string;
  category: 'infrastructure' | 'health' | 'education' | 'agriculture' | 'sanitation' | 'other';
  implementing_authority: string;
  responsible_official: string;
  approval_date?: string;
  start_date?: string;
  expected_completion_date?: string;
  total_allocated_amount: number;
  status: 'planned' | 'ongoing' | 'completed' | 'stalled' | 'cancelled';
  remarks?: string;
  union_id: number;
  ward?: string;
  created_by: string;
  prev_hash?: string;
  record_hash: string;
  created_at: string;
  updated_at: string;
  // Joined from API
  created_by_user?: {
    id: string;
    name: string;
    role: string;
  };
  // Flag data (NEW)
  flag_count?: number;
  total_citizens?: number;
  flag_ratio?: number;
  is_escalated?: boolean;
  user_has_flagged?: boolean;
}

export interface Vote {
  id: string;
  issue_id: string;
  user_id: string;
  created_at: string;
}

export interface Flag {
  id: string;
  budget_record_id: string;
  user_id: string;
  reason?: string;
  created_at: string;
}

export interface Escalation {
  id: string;
  budget_record_id: string;
  flag_count: number;
  flag_ratio: number;
  status: 'pending' | 'notified' | 'reviewed';
  reviewed_by?: string;
  reviewed_at?: string;
  notes?: string;
  triggered_at: string;
}

// API Request/Response Types
export interface CreateIssueRequest {
  title: string;
  description: string;
  image_url?: string;
  union_id: number;
  ward?: string;
  created_by: string;
}

export interface CreateBudgetRequest {
  project_code: string;
  project_name: string;
  category: BudgetRecord['category'];
  implementing_authority: string;
  responsible_official: string;
  approval_date?: string;
  start_date?: string;
  expected_completion_date?: string;
  total_allocated_amount: number;
  status: BudgetRecord['status'];
  remarks?: string;
  union_id: number;
  ward?: string;
  created_by: string;
}

export interface FlagBudgetRequest {
  budget_record_id: string;
  user_id: string;
  reason?: string;
}

export interface LoginRequest {
  role: User['role'];
  union_id: number;
  name?: string;
  phone?: string;
}