// app/chairman/budgets/[id]/page.tsx
'use client';

import { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import Link from 'next/link';
import { getCurrentUser } from '@/lib/auth';

interface BudgetDetail {
  id: string;
  project_code: string;
  project_name: string;
  category: string;
  implementing_authority: string;
  responsible_official: string;
  approval_date: string | null;
  start_date: string | null;
  expected_completion_date: string | null;
  total_allocated_amount: number;
  status: string;
  remarks: string | null;
  ward: string | null;
  union_id: number;
  created_by: string;
  record_hash: string;
  prev_hash: string | null;
  created_at: string;
  updated_at: string;
  created_by_user: {
    id: string;
    name: string;
    role: string;
  };
  union: {
    id: number;
    union_name: string;
    upazila_name: string;
    district_name: string;
  };
  flag_count: number;
  flag_ratio: number;
  total_citizens: number;
  is_escalated: boolean;
  escalation_date: string | null;
  hash_verified: boolean;
  hash_message: string;
  flags: Array<{
    id: string;
    reason: string;
    created_at: string;
    user_name: string;
    user_phone: string | null;
  }>;
}

export default function BudgetDetailPage() {
  const router = useRouter();
  const params = useParams();
  const budgetId = params.id as string;



  const [user, setUser] = useState<any>(null);
  const [budget, setBudget] = useState<BudgetDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const currentUser = getCurrentUser();
    if (!currentUser || currentUser.role !== 'chairman') {
      router.push('/login');
      return;
    }
    setUser(currentUser);
    fetchBudget();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [budgetId]);

  async function fetchBudget() {
    try {
      const response = await fetch(`/api/budgets/${budgetId}`);
      const data = await response.json();

      if (data.success) {
        setBudget(data.budget);
      } else {
        setError(data.error || 'বাজেট খুঁজে পাওয়া যায়নি');
      }
    } catch (err) {
      console.error('Fetch budget error:', err);
      setError('বাজেট লোড করতে সমস্যা হয়েছে');
    } finally {
      setLoading(false);
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50">
        <div className="text-lg font-semibold text-slate-700">লোড হচ্ছে...</div>
      </div>
    );
  }

  if (error || !budget) {
    return (
      <div className="min-h-screen bg-slate-50">
        <nav className="bg-emerald-900 text-white shadow-lg">
          <div className="container mx-auto px-4 py-4">
            <Link href="/chairman/dashboard" className="flex items-center space-x-3">
              <div className="h-10 w-10 rounded-xl bg-white/10 border border-white/10 flex items-center justify-center font-black">
                শে
              </div>
              <div>
                <h1 className="text-xl font-extrabold">শেবার জানালা</h1>
                <p className="text-xs text-emerald-100">বাজেট বিস্তারিত</p>
              </div>
            </Link>
          </div>
        </nav>

        <div className="container mx-auto px-4 py-8">
          <div className="max-w-4xl mx-auto">
            <div className="bg-red-50 border border-red-200 rounded-2xl p-8 text-center">
              <div className="text-lg font-extrabold text-red-900">{error}</div>
              <Link
                href="/chairman/dashboard"
                className="inline-block mt-4 text-blue-700 font-bold hover:underline"
              >
                ← ড্যাশবোর্ডে ফিরে যান
              </Link>
            </div>
          </div>
        </div>
      </div>
    );
  }

  const categoryBn: Record<string, string> = {
    infrastructure: 'অবকাঠামো',
    education: 'শিক্ষা',
    health: 'স্বাস্থ্য',
    agriculture: 'কৃষি',
    sanitation: 'পয়ঃনিষ্কাশন',
    social_welfare: 'সমাজকল্যাণ',
    other: 'অন্যান্য',
  };

  const statusBn: Record<string, string> = {
    planned: 'পরিকল্পিত',
    ongoing: 'চলমান',
    completed: 'সমাপ্ত',
  };

  return (
    <div className="min-h-screen bg-slate-50">
      {/* Header */}
      <nav className="bg-emerald-900 text-white shadow-lg">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <Link href="/chairman/dashboard" className="flex items-center space-x-3">
              <div className="h-10 w-10 rounded-xl bg-white/10 border border-white/10 flex items-center justify-center font-black">
                শে
              </div>
              <div>
                <h1 className="text-xl font-extrabold">শেবার জানালা</h1>
                <p className="text-xs text-emerald-100">বাজেট বিস্তারিত</p>
              </div>
            </Link>

            <Link
              href="/chairman/dashboard"
              className="bg-white text-emerald-900 px-4 py-2 rounded-lg font-extrabold hover:bg-emerald-50 transition"
            >
              ← ড্যাশবোর্ড
            </Link>
          </div>
        </div>
      </nav>

      {/* Content */}
      <div className="container mx-auto px-4 py-8">
        <div className="max-w-5xl mx-auto space-y-6">
          {/* Escalation Alert */}
          {budget.is_escalated && (
            <div className="bg-red-50 border-2 border-red-300 rounded-2xl p-6">
              <div className="flex items-start gap-4">
                <div className="text-4xl">🚨</div>
                <div className="flex-1">
                  <h3 className="text-xl font-extrabold text-red-900 mb-2">
                    এই বাজেট স্বয়ংক্রিয়ভাবে এসকেলেট করা হয়েছে
                  </h3>
                  <p className="text-sm text-red-800 font-semibold">
                    {budget.flag_ratio}% নাগরিক ({budget.flag_count}/{budget.total_citizens}) এই বাজেটকে সন্দেহজনক হিসেবে চিহ্নিত করেছেন।
                    অবিলম্বে পর্যালোচনা করুন এবং প্রয়োজনীয় ব্যবস্থা নিন।
                  </p>
                  {budget.escalation_date && (
                    <p className="text-xs text-red-700 font-bold mt-2">
                      এসকেলেশন তারিখ: {new Date(budget.escalation_date).toLocaleDateString('bn-BD')}
                    </p>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* Main Info Card */}
          <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
            {/* Header */}
            <div className="bg-emerald-50 border-b border-emerald-100 p-6">
              <div className="flex items-start justify-between gap-4 mb-4">
                <div className="min-w-0">
                  <h1 className="text-3xl font-extrabold text-slate-900 break-words">
                    {budget.project_name}
                  </h1>
                  <p className="text-sm text-slate-600 mt-2 font-semibold">
                    প্রকল্প কোড: <span className="font-extrabold text-slate-900">{budget.project_code}</span>
                  </p>
                </div>

                <span
                  className={`shrink-0 px-4 py-2 rounded-full text-sm font-extrabold border ${
                    budget.status === 'completed'
                      ? 'bg-emerald-100 text-emerald-900 border-emerald-200'
                      : budget.status === 'ongoing'
                      ? 'bg-sky-100 text-sky-900 border-sky-200'
                      : 'bg-amber-100 text-amber-900 border-amber-200'
                  }`}
                >
                  {statusBn[budget.status] || budget.status}
                </span>
              </div>

              <div className="flex flex-wrap gap-2">
                <span className="inline-flex items-center bg-white border border-emerald-200 text-emerald-900 px-3 py-1 rounded-full text-xs font-extrabold">
                  {categoryBn[budget.category] || budget.category}
                </span>
                {budget.ward && (
                  <span className="inline-flex items-center bg-white border border-sky-200 text-sky-900 px-3 py-1 rounded-full text-xs font-extrabold">
                    ওয়ার্ড: {budget.ward}
                  </span>
                )}
                <span className="inline-flex items-center bg-white border border-slate-300 text-slate-900 px-3 py-1 rounded-full text-xs font-extrabold">
                  {budget.union.union_name} • {budget.union.district_name}
                </span>
              </div>
            </div>

            {/* Budget Amount - Prominent */}
            <div className="bg-gradient-to-br from-emerald-50 to-white border-b border-slate-200 p-8">
              <div className="text-center">
                <div className="text-sm font-extrabold text-slate-600 mb-2">মোট বরাদ্দকৃত অর্থ</div>
                <div className="text-5xl font-extrabold text-emerald-800">
                  ৳{Number(budget.total_allocated_amount).toLocaleString('bn-BD')}
                </div>
              </div>
            </div>

            {/* Details Grid */}
            <div className="p-6 space-y-6">
              {/* Authority Info */}
              <div>
                <h3 className="text-lg font-extrabold text-slate-900 mb-4">বাস্তবায়ন তথ্য</h3>
                <div className="grid md:grid-cols-2 gap-4">
                  <div className="bg-slate-50 border border-slate-200 rounded-xl p-4">
                    <div className="text-xs text-slate-500 font-extrabold mb-1">বাস্তবায়নকারী কর্তৃপক্ষ</div>
                    <div className="text-base font-bold text-slate-900">{budget.implementing_authority}</div>
                  </div>
                  <div className="bg-slate-50 border border-slate-200 rounded-xl p-4">
                    <div className="text-xs text-slate-500 font-extrabold mb-1">দায়িত্বপ্রাপ্ত কর্মকর্তা</div>
                    <div className="text-base font-bold text-slate-900">{budget.responsible_official}</div>
                  </div>
                </div>
              </div>

              {/* Timeline */}
              <div>
                <h3 className="text-lg font-extrabold text-slate-900 mb-4">প্রকল্প সময়সীমা</h3>
                <div className="grid md:grid-cols-3 gap-4">
                  <div className="bg-slate-50 border border-slate-200 rounded-xl p-4">
                    <div className="text-xs text-slate-500 font-extrabold mb-1">অনুমোদনের তারিখ</div>
                    <div className="text-sm font-bold text-slate-900">
                      {budget.approval_date
                        ? new Date(budget.approval_date).toLocaleDateString('bn-BD')
                        : '—'}
                    </div>
                  </div>
                  <div className="bg-slate-50 border border-slate-200 rounded-xl p-4">
                    <div className="text-xs text-slate-500 font-extrabold mb-1">শুরুর তারিখ</div>
                    <div className="text-sm font-bold text-slate-900">
                      {budget.start_date
                        ? new Date(budget.start_date).toLocaleDateString('bn-BD')
                        : '—'}
                    </div>
                  </div>
                  <div className="bg-slate-50 border border-slate-200 rounded-xl p-4">
                    <div className="text-xs text-slate-500 font-extrabold mb-1">সমাপ্তির তারিখ</div>
                    <div className="text-sm font-bold text-slate-900">
                      {budget.expected_completion_date
                        ? new Date(budget.expected_completion_date).toLocaleDateString('bn-BD')
                        : '—'}
                    </div>
                  </div>
                </div>
              </div>

              {/* Remarks */}
              {budget.remarks && (
                <div>
                  <h3 className="text-lg font-extrabold text-slate-900 mb-3">মন্তব্য</h3>
                  <div className="bg-slate-50 border border-slate-200 rounded-xl p-4">
                    <p className="text-sm text-slate-800 leading-relaxed">{budget.remarks}</p>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Hash Chain Verification */}
          <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-6">
            <div className="flex items-start gap-4 mb-4">
              <div className="text-3xl">🔒</div>
              <div className="flex-1">
                <h3 className="text-xl font-extrabold text-slate-900 mb-1">
                  ব্লকচেইন-স্টাইল হ্যাশ চেইন যাচাইকরণ
                </h3>
                <p className="text-sm text-slate-600">
                  এই রেকর্ডটি ক্রিপ্টোগ্রাফিক হ্যাশ দ্বারা সুরক্ষিত। কোনো পরিবর্তন সনাক্ত করা যাবে।
                </p>
              </div>
              <div
                className={`shrink-0 px-4 py-2 rounded-xl font-extrabold ${
                  budget.hash_verified
                    ? 'bg-emerald-50 text-emerald-800 border border-emerald-200'
                    : 'bg-red-50 text-red-800 border border-red-200'
                }`}
              >
                {budget.hash_message}
              </div>
            </div>

            <div className="space-y-3">
              <div className="bg-slate-50 border border-slate-200 rounded-xl p-4">
                <div className="text-xs text-slate-500 font-extrabold mb-2">বর্তমান রেকর্ড হ্যাশ (SHA-256)</div>
                <div className="font-mono text-xs text-slate-800 break-all bg-white border border-slate-200 rounded p-3">
                  {budget.record_hash}
                </div>
              </div>

              {budget.prev_hash && (
                <div className="bg-slate-50 border border-slate-200 rounded-xl p-4">
                  <div className="text-xs text-slate-500 font-extrabold mb-2">পূর্ববর্তী রেকর্ড হ্যাশ (চেইন লিংক)</div>
                  <div className="font-mono text-xs text-slate-700 break-all bg-white border border-slate-200 rounded p-3">
                    {budget.prev_hash}
                  </div>
                </div>
              )}

              {!budget.prev_hash && (
                <div className="bg-blue-50 border border-blue-200 rounded-xl p-4">
                  <div className="text-xs font-bold text-blue-900">
                    ℹ️ এটি এই ইউনিয়নের প্রথম বাজেট রেকর্ড (পূর্ববর্তী হ্যাশ নেই)
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Flags Section */}
          <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-6">
            <div className="flex items-start gap-4 mb-4">
              <div className="text-3xl">{budget.flags.length > 0 ? '⚠️' : '✅'}</div>
              <div className="flex-1">
                <h3 className="text-xl font-extrabold text-slate-900 mb-1">নাগরিক ফ্ল্যাগ</h3>
                <p className="text-sm text-slate-600">
                  {budget.flags.length > 0
                    ? `${budget.flag_count} জন নাগরিক (${budget.flag_ratio}%) এই বাজেটকে সন্দেহজনক হিসেবে চিহ্নিত করেছেন`
                    : 'কোনো নাগরিক এই বাজেটকে চিহ্নিত করেননি'}
                </p>
              </div>

              {budget.flags.length > 0 && (
                <div className="shrink-0 bg-amber-50 border border-amber-200 rounded-xl px-4 py-2">
                  <div className="text-xs font-extrabold text-amber-900">মোট ফ্ল্যাগ</div>
                  <div className="text-2xl font-extrabold text-amber-800">{budget.flag_count}</div>
                </div>
              )}
            </div>

            {budget.flags.length === 0 ? (
              <div className="bg-emerald-50 border border-emerald-200 rounded-xl p-6 text-center">
                <div className="text-sm font-bold text-emerald-900">
                  ✓ এই বাজেট রেকর্ডটি স্বাভাবিক অবস্থায় আছে
                </div>
              </div>
            ) : (
              <div className="space-y-3">
                {budget.flags.map((flag, idx) => (
                  <div
                    key={flag.id}
                    className="bg-amber-50 border border-amber-200 rounded-xl p-4"
                  >
                    <div className="flex items-start justify-between gap-3 mb-3">
                      <div>
                        <div className="font-extrabold text-slate-900 text-sm">{flag.user_name}</div>
                        {flag.user_phone && (
                          <div className="text-xs text-slate-600 font-semibold mt-0.5">
                            ফোন: {flag.user_phone}
                          </div>
                        )}
                      </div>
                      <div className="text-xs text-slate-500 font-semibold">
                        {new Date(flag.created_at).toLocaleDateString('bn-BD')}
                      </div>
                    </div>

                    <div className="bg-white border border-amber-200 rounded-lg p-3">
                      <div className="text-xs font-extrabold text-amber-900 mb-1">কারণ:</div>
                      <p className="text-sm text-slate-800 leading-relaxed">{flag.reason}</p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Metadata */}
          <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-6">
            <h3 className="text-lg font-extrabold text-slate-900 mb-4">রেকর্ড মেটাডেটা</h3>
            <div className="grid md:grid-cols-2 gap-4 text-sm">
              <div className="flex justify-between">
                <span className="text-slate-600 font-semibold">তৈরি করেছেন:</span>
                <span className="font-bold text-slate-900">{budget.created_by_user.name}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-600 font-semibold">ভূমিকা:</span>
                <span className="font-bold text-slate-900">
                  {budget.created_by_user.role === 'chairman' ? 'চেয়ারম্যান' : budget.created_by_user.role}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-600 font-semibold">তৈরির তারিখ:</span>
                <span className="font-bold text-slate-900">
                  {new Date(budget.created_at).toLocaleString('bn-BD')}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-600 font-semibold">শেষ আপডেট:</span>
                <span className="font-bold text-slate-900">
                  {new Date(budget.updated_at).toLocaleString('bn-BD')}
                </span>
              </div>
              <div className="flex justify-between md:col-span-2">
                <span className="text-slate-600 font-semibold">রেকর্ড আইডি:</span>
                <span className="font-mono text-xs text-slate-900">{budget.id}</span>
              </div>
            </div>
          </div>

          {/* Actions */}
          <div className="flex flex-col sm:flex-row gap-3">
            <Link
              href="/chairman/dashboard"
              className="flex-1 bg-emerald-700 text-white py-4 rounded-xl font-extrabold text-center hover:bg-emerald-800 transition shadow-sm"
            >
              ← ড্যাশবোর্ডে ফিরে যান
            </Link>

            {budget.is_escalated && (
              <button
                className="flex-1 bg-red-600 text-white py-4 rounded-xl font-extrabold hover:bg-red-700 transition shadow-sm"
              >
                উর্ধ্বতন কর্তৃপক্ষকে ফরওয়ার্ড করুন
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}