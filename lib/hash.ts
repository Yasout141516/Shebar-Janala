// lib/hash.ts
import crypto from 'crypto';
import { BudgetRecord } from '@/types';

export interface BudgetHashData {
  project_code: string;
  project_name: string;
  category: string;
  implementing_authority: string;
  responsible_official: string;
  approval_date?: string;
  start_date?: string;
  expected_completion_date?: string;
  total_allocated_amount: number;
  status: string;
  union_id: number;
  ward?: string;
  created_by: string;
  prev_hash: string | null | undefined;
  created_at: string;
}

/**
 * Calculate SHA-256 hash for a budget record
 */
export function calculateHash(data: BudgetHashData): string {
  const hashInput = JSON.stringify({
    project_code: data.project_code,
    project_name: data.project_name,
    category: data.category,
    implementing_authority: data.implementing_authority,
    responsible_official: data.responsible_official,
    approval_date: data.approval_date,
    start_date: data.start_date,
    expected_completion_date: data.expected_completion_date,
    total_allocated_amount: data.total_allocated_amount,
    status: data.status,
    union_id: data.union_id,
    ward: data.ward,
    created_by: data.created_by,
    prev_hash: data.prev_hash || '0',
    created_at: data.created_at,
  });

  return crypto.createHash('sha256').update(hashInput).digest('hex');
}

/**
 * Verify the integrity of a budget record chain
 */
export function verifyChain(records: BudgetRecord[]): {
  valid: boolean;
  errors: string[];
} {
  const errors: string[] = [];

  // Sort by created_at to ensure chronological order
  const sortedRecords = [...records].sort(
    (a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime()
  );

  for (let i = 0; i < sortedRecords.length; i++) {
    const record = sortedRecords[i];

    // Check if prev_hash links correctly
    if (i === 0) {
      // First record should have null prev_hash
      if (record.prev_hash !== null) {
        errors.push(`Record ${record.id}: First record should have null prev_hash`);
      }
    } else {
      // Subsequent records should link to previous record's hash
      const expectedPrevHash = sortedRecords[i - 1].record_hash;
      if (record.prev_hash !== expectedPrevHash) {
        errors.push(
          `Record ${record.id}: prev_hash doesn't match previous record's hash`
        );
      }
    }

    // Verify the record's hash
    const calculatedHash = calculateHash({
      project_code: record.project_code,
      project_name: record.project_name,
      category: record.category,
      implementing_authority: record.implementing_authority,
      responsible_official: record.responsible_official,
      approval_date: record.approval_date,
      start_date: record.start_date,
      expected_completion_date: record.expected_completion_date,
      total_allocated_amount: record.total_allocated_amount,
      status: record.status,
      union_id: record.union_id,
      ward: record.ward,
      created_by: record.created_by,
      prev_hash: record.prev_hash,
      created_at: record.created_at,
    });

    if (calculatedHash !== record.record_hash) {
      errors.push(`Record ${record.id}: Hash mismatch - data may have been tampered`);
    }
  }

  return {
    valid: errors.length === 0,
    errors,
  };
}