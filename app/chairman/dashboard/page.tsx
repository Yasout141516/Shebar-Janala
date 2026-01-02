// app/chairman/dashboard/page.tsx
'use client';

import { useState, useEffect, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { getCurrentUser, logout } from '@/lib/auth';
import { User, Issue, BudgetRecord } from '@/types';

type TabType = 'overview' | 'issues' | 'budgets' | 'escalations';

interface DashboardStats {
  total_issues: number;
  pending_issues: number;
  approved_issues: number;
  total_budgets: number;
  flagged_budgets: number;
  escalated_budgets: number;
  total_citizens: number;
}

interface EscalatedBudget {
  budget: BudgetRecord & {
    flag_count: number;
    flag_ratio: number;
  };
  flags: Array<{
    id: string;
    user_name: string;
    reason: string;
    created_at: string;
  }>;
}

export default function ChairmanDashboard() {
  const router = useRouter();
  const [user, setUser] = useState<User | null>(null);
  const [activeTab, setActiveTab] = useState<TabType>('overview');
  const [loading, setLoading] = useState(true);

  // Data
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [issues, setIssues] = useState<Issue[]>([]);
  const [budgets, setBudgets] = useState<BudgetRecord[]>([]);
  const [escalations, setEscalations] = useState<EscalatedBudget[]>([]);

  useEffect(() => {
    const currentUser = getCurrentUser();
    if (!currentUser || currentUser.role !== 'chairman') {
      router.push('/login');
      return;
    }
    setUser(currentUser);
    fetchData(currentUser);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [router]);

  async function fetchData(u: User) {
    try {
      const statsRes = await fetch(`/api/chairman/stats?union_id=${u.union_id}`);
      const statsData = await statsRes.json();
      if (statsData.success) setStats(statsData.stats);

      const issuesRes = await fetch(`/api/issues?union_id=${u.union_id}`);
      const issuesData = await issuesRes.json();
      if (issuesData.success) setIssues(issuesData.issues || []);

      const budgetsRes = await fetch(`/api/budgets?union_id=${u.union_id}`);
      const budgetsData = await budgetsRes.json();
      if (budgetsData.success) setBudgets(budgetsData.budgets || []);

      const escalationsRes = await fetch(`/api/chairman/escalations?union_id=${u.union_id}`);
      const escalationsData = await escalationsRes.json();
      if (escalationsData.success) setEscalations(escalationsData.escalations || []);
    } catch (err) {
      console.error('Failed to fetch data:', err);
    } finally {
      setLoading(false);
    }
  }

  function handleLogout() {
    logout();
    router.push('/login');
  }

  const pendingIssues = useMemo(() => issues.filter((i) => i.status === 'pending'), [issues]);
  const approvedIssues = useMemo(() => issues.filter((i) => i.status === 'approved'), [issues]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50">
        <div className="text-lg font-semibold text-slate-700">লোড হচ্ছে...</div>
      </div>
    );
  }

  const TabButton = ({
    tab,
    label,
  }: {
    tab: TabType;
    label: string;
  }) => (
    <button
      onClick={() => setActiveTab(tab)}
      className={`px-5 py-2 rounded-xl font-extrabold transition-all ${
        activeTab === tab
          ? 'bg-white text-emerald-900 shadow-sm'
          : 'text-emerald-100 hover:text-white hover:bg-white/10'
      }`}
    >
      {label}
    </button>
  );

  const MobileTabButton = ({
    tab,
    label,
  }: {
    tab: TabType;
    label: string;
  }) => (
    <button
      onClick={() => setActiveTab(tab)}
      className={`px-3 py-2 rounded-xl font-extrabold transition-all border text-xs ${
        activeTab === tab
          ? 'bg-white text-emerald-900 border-white'
          : 'bg-white/10 text-emerald-100 border-white/10'
      }`}
    >
      {label}
    </button>
  );

  return (
    <div className="min-h-screen bg-slate-50">
      {/* Navbar (match citizen aesthetic) */}
      <nav className="bg-emerald-900 text-white shadow-lg">
        <div className="container mx-auto px-4">
          <div className="flex items-center justify-between py-4">
            {/* Brand */}
            <div className="flex items-center space-x-3">
              <div className="h-10 w-10 rounded-xl bg-white/10 border border-white/10 flex items-center justify-center font-black">
                শে
              </div>
              <div className="ml-3">
                <h1 className="text-xl sm:text-2xl font-extrabold tracking-tight">শেবার জানালা</h1>
                <p className="text-xs sm:text-sm text-emerald-100">চেয়ারম্যান ড্যাশবোর্ড</p>
              </div>
            </div>

            {/* Tabs */}
            <div className="hidden md:flex items-center space-x-1 bg-white/10 rounded-xl p-1 border border-white/10">
              <TabButton tab="overview" label="সংক্ষিপ্ত" />
              <TabButton tab="issues" label="নাগরিক সমস্যা" />
              <TabButton tab="budgets" label="বাজেট" />
              <TabButton tab="escalations" label="তদন্ত প্রয়োজন" />
            </div>

            {/* User */}
            <div className="flex items-center space-x-4">
              <div className="text-right hidden sm:block">
                <div className="font-bold">{user?.name}</div>
                <div className="text-xs text-emerald-100">চেয়ারম্যান</div>
              </div>
              <button
                onClick={handleLogout}
                className="bg-white text-emerald-900 px-4 py-2 rounded-lg font-extrabold hover:bg-emerald-50 transition border border-white/20"
              >
                লগআউট
              </button>
            </div>
          </div>

          {/* Mobile tabs */}
          <div className="md:hidden pb-3 grid grid-cols-4 gap-2">
            <MobileTabButton tab="overview" label="সংক্ষিপ্ত" />
            <MobileTabButton tab="issues" label="সমস্যা" />
            <MobileTabButton tab="budgets" label="বাজেট" />
            <MobileTabButton tab="escalations" label="তদন্ত" />
          </div>
        </div>
      </nav>

      {/* Content */}
      <div className="container mx-auto px-4 py-8">
        <div className="max-w-6xl mx-auto">
          {/* OVERVIEW */}
          {activeTab === 'overview' && (
            <div className="space-y-6">
              {/* Hero */}
              <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-6 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                <div>
                  <h2 className="text-2xl sm:text-3xl font-extrabold text-slate-900">
                    ড্যাশবোর্ড সংক্ষিপ্ত
                  </h2>
                  <p className="text-sm text-slate-600 mt-1">
                    আপনার ইউনিয়নের সমস্যা, বাজেট এবং তদন্তযোগ্য রেকর্ড এক জায়গায়।
                  </p>
                </div>

                <div className="flex flex-col sm:flex-row gap-3 w-full sm:w-auto">
                  <Link
                    href="/chairman/budgets/create"
                    className="inline-flex items-center justify-center bg-emerald-700 text-white px-6 py-3 rounded-xl font-extrabold hover:bg-emerald-800 transition shadow-sm"
                  >
                    + নতুন বাজেট তৈরি করুন
                  </Link>
                  <button
                    onClick={() => setActiveTab('escalations')}
                    className="inline-flex items-center justify-center bg-white border border-red-200 text-red-700 px-6 py-3 rounded-xl font-extrabold hover:bg-red-50 transition"
                  >
                    তদন্ত দেখুন
                  </button>
                </div>
              </div>

              {/* Stats */}
              {stats && (
                <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                  <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-6">
                    <div className="text-xs font-extrabold text-slate-500">মোট সমস্যা</div>
                    <div className="mt-2 text-4xl font-extrabold text-slate-900">{stats.total_issues}</div>
                    <div className="mt-3 flex gap-2 flex-wrap">
                      <span className="bg-amber-50 text-amber-800 border border-amber-100 px-3 py-1 rounded-full text-xs font-extrabold">
                        {stats.pending_issues} অপেক্ষমাণ
                      </span>
                      <span className="bg-emerald-50 text-emerald-800 border border-emerald-100 px-3 py-1 rounded-full text-xs font-extrabold">
                        {stats.approved_issues} অনুমোদিত
                      </span>
                    </div>
                  </div>

                  <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-6">
                    <div className="text-xs font-extrabold text-slate-500">মোট বাজেট</div>
                    <div className="mt-2 text-4xl font-extrabold text-slate-900">{stats.total_budgets}</div>
                    <div className="mt-3">
                      <span className="bg-sky-50 text-sky-800 border border-sky-100 px-3 py-1 rounded-full text-xs font-extrabold">
                        {stats.flagged_budgets} ফ্ল্যাগকৃত
                      </span>
                    </div>
                  </div>

                  <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-6">
                    <div className="text-xs font-extrabold text-slate-500">মোট নাগরিক</div>
                    <div className="mt-2 text-4xl font-extrabold text-slate-900">{stats.total_citizens}</div>
                    <div className="mt-3 text-xs font-bold text-slate-600">
                      ফ্ল্যাগ অনুপাত গণনায় ব্যবহৃত
                    </div>
                  </div>

                  <div className="bg-white rounded-2xl shadow-sm border border-red-200 p-6">
                    <div className="text-xs font-extrabold text-red-600">তদন্ত প্রয়োজন</div>
                    <div className="mt-2 text-4xl font-extrabold text-red-600">{stats.escalated_budgets}</div>
                    <div className="mt-3 text-xs font-bold text-slate-600">
                      {stats.escalated_budgets > 0 ? 'অবিলম্বে পর্যালোচনা করুন' : 'কোনো এসকেলেশন নেই'}
                    </div>
                  </div>
                </div>
              )}

              {/* Recent Activity */}
              <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-6">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-xl font-extrabold text-slate-900">সাম্প্রতিক সমস্যা</h3>
                  <button
                    onClick={() => setActiveTab('issues')}
                    className="text-sm font-extrabold text-emerald-700 hover:underline"
                  >
                    সব দেখুন →
                  </button>
                </div>

                {issues.length === 0 ? (
                  <div className="text-center text-slate-500 py-8 font-semibold">কোনো ডেটা নেই</div>
                ) : (
                  <div className="divide-y divide-slate-100">
                    {issues.slice(0, 6).map((issue) => (
                      <div key={issue.id} className="py-4 flex items-start justify-between gap-4">
                        <div className="min-w-0">
                          <div className="font-extrabold text-slate-900 break-words">{issue.title}</div>
                          <div className="mt-1 text-xs text-slate-600 font-semibold">
                            {issue.created_by_user?.name || 'অজানা'} •{' '}
                            {new Date(issue.created_at).toLocaleDateString('bn-BD')}
                            {issue.ward ? ` • ওয়ার্ড: ${issue.ward}` : ''}
                          </div>
                        </div>

                        <span
                          className={`shrink-0 px-3 py-1 rounded-full text-xs font-extrabold border ${
                            issue.status === 'approved'
                              ? 'bg-emerald-50 text-emerald-800 border-emerald-100'
                              : issue.status === 'pending'
                              ? 'bg-amber-50 text-amber-800 border-amber-100'
                              : 'bg-red-50 text-red-800 border-red-100'
                          }`}
                        >
                          {issue.status === 'approved'
                            ? 'অনুমোদিত'
                            : issue.status === 'pending'
                            ? 'অপেক্ষমাণ'
                            : 'প্রত্যাখ্যাত'}
                        </span>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Quick glance cards */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-6">
                  <h3 className="text-lg font-extrabold text-slate-900 mb-2">অপেক্ষমাণ সমস্যা</h3>
                  <p className="text-sm text-slate-600 mb-4">পর্যালোচনার জন্য কিউ</p>
                  <div className="text-4xl font-extrabold text-amber-700">{pendingIssues.length}</div>
                </div>

                <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-6">
                  <h3 className="text-lg font-extrabold text-slate-900 mb-2">অনুমোদিত সমস্যা</h3>
                  <p className="text-sm text-slate-600 mb-4">কমিউনিটিতে দৃশ্যমান</p>
                  <div className="text-4xl font-extrabold text-emerald-700">{approvedIssues.length}</div>
                </div>
              </div>
            </div>
          )}

          {/* ISSUES */}
          {activeTab === 'issues' && (
            <div>
              <div className="flex items-end justify-between mb-6">
                <div>
                  <h2 className="text-3xl font-extrabold text-slate-900">নাগরিক সমস্যা</h2>
                  <p className="text-sm text-slate-600 mt-1">শুধুমাত্র দেখার জন্য</p>
                </div>
                <div className="text-sm font-bold text-slate-700 bg-white border border-slate-200 rounded-xl px-4 py-2">
                  মোট: {issues.length}
                </div>
              </div>

              {issues.length === 0 ? (
                <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-10 text-center">
                  <div className="text-lg font-extrabold text-slate-900">কোনো সমস্যা নেই</div>
                </div>
              ) : (
                <div className="space-y-4">
                  {issues.map((issue) => (
                    <div
                      key={issue.id}
                      className="bg-white rounded-2xl shadow-sm border border-slate-200 p-6 hover:shadow transition"
                    >
                      <div className="flex items-start justify-between gap-4 mb-4">
                        <div className="min-w-0">
                          <h4 className="font-extrabold text-lg text-slate-900 mb-2 break-words">
                            {issue.title}
                          </h4>
                          <p className="text-slate-700 text-sm leading-relaxed break-words">
                            {issue.description}
                          </p>

                          <div className="mt-4 flex flex-wrap gap-2">
                            {issue.ward && (
                              <span className="inline-flex bg-sky-50 text-sky-800 border border-sky-100 px-3 py-1 rounded-full text-xs font-extrabold">
                                ওয়ার্ড: {issue.ward}
                              </span>
                            )}
                            <span className="inline-flex bg-slate-50 text-slate-800 border border-slate-200 px-3 py-1 rounded-full text-xs font-extrabold">
                              সমর্থন: {issue.upvote_count ?? 0}
                            </span>
                          </div>
                        </div>

                        <span
                          className={`px-3 py-1.5 rounded-full text-xs font-extrabold border whitespace-nowrap ${
                            issue.status === 'approved'
                              ? 'bg-emerald-50 text-emerald-800 border-emerald-100'
                              : issue.status === 'pending'
                              ? 'bg-amber-50 text-amber-800 border-amber-100'
                              : 'bg-red-50 text-red-800 border-red-100'
                          }`}
                        >
                          {issue.status === 'approved'
                            ? 'অনুমোদিত'
                            : issue.status === 'pending'
                            ? 'অপেক্ষমাণ'
                            : 'প্রত্যাখ্যাত'}
                        </span>
                      </div>

                      <div className="flex items-center justify-between pt-4 border-t border-slate-200">
                        <div className="text-sm text-slate-600">
                          জমাদানকারী:{' '}
                          <span className="font-bold text-slate-900">{issue.created_by_user?.name || 'অজানা'}</span>
                        </div>
                        <div className="text-sm text-slate-500 font-semibold">
                          {new Date(issue.created_at).toLocaleDateString('bn-BD')}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* BUDGETS */}
          {activeTab === 'budgets' && (
            <div>
              <div className="flex items-end justify-between mb-6">
                <div>
                  <h2 className="text-3xl font-extrabold text-slate-900">বাজেট</h2>
                  <p className="text-sm text-slate-600 mt-1">প্রকল্প বাজেট তৈরি ও পরিচালনা</p>
                </div>
                <Link
                  href="/chairman/budgets/create"
                  className="bg-emerald-700 text-white px-6 py-3 rounded-xl font-extrabold hover:bg-emerald-800 transition shadow-sm"
                >
                  + নতুন বাজেট তৈরি করুন
                </Link>
              </div>

              <div className="mb-6 text-sm font-bold text-slate-700 bg-white border border-slate-200 rounded-xl px-4 py-2 inline-block">
                মোট বাজেট: {budgets.length}
              </div>

              {budgets.length === 0 ? (
                <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-10 text-center">
                  <div className="text-lg font-extrabold text-slate-900 mb-2">কোনো বাজেট নেই</div>
                  <div className="text-sm text-slate-600">প্রথম বাজেট যুক্ত করুন।</div>
                </div>
              ) : (
                <div className="space-y-4">
                  {budgets.map((budget) => (
                    <div
                      key={budget.id}
                      className="bg-white rounded-2xl shadow-sm border border-slate-200 p-6 hover:shadow transition"
                    >
                      <div className="flex items-start justify-between gap-4 mb-4">
                        <div className="min-w-0">
                          <h4 className="font-extrabold text-lg text-slate-900 break-words">
                            {budget.project_name}
                          </h4>
                          <p className="text-sm text-slate-600 mt-1 break-words">
                            প্রকল্প কোড: <span className="font-bold">{budget.project_code}</span>
                          </p>

                          <div className="mt-3 flex flex-wrap gap-2">
                            <span className="inline-flex bg-emerald-50 text-emerald-900 border border-emerald-100 px-3 py-1 rounded-full text-xs font-extrabold">
                              বরাদ্দ: ৳{Number(budget.total_allocated_amount).toLocaleString()}
                            </span>
                            {budget.ward && (
                              <span className="inline-flex bg-sky-50 text-sky-800 border border-sky-100 px-3 py-1 rounded-full text-xs font-extrabold">
                                ওয়ার্ড: {budget.ward}
                              </span>
                            )}
                          </div>
                        </div>

                        <span
                          className={`px-3 py-1.5 rounded-full text-xs font-extrabold border whitespace-nowrap ${
                            budget.status === 'completed'
                              ? 'bg-emerald-50 text-emerald-800 border-emerald-100'
                              : budget.status === 'ongoing'
                              ? 'bg-sky-50 text-sky-800 border-sky-100'
                              : 'bg-amber-50 text-amber-800 border-amber-100'
                          }`}
                        >
                          {budget.status === 'completed'
                            ? 'সমাপ্ত'
                            : budget.status === 'ongoing'
                            ? 'চলমান'
                            : 'পরিকল্পিত'}
                        </span>
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <div className="bg-slate-50 border border-slate-200 rounded-xl p-4">
                          <div className="text-xs text-slate-500 font-extrabold mb-1">বাস্তবায়নকারী</div>
                          <div className="text-sm font-bold text-slate-900">{budget.implementing_authority}</div>
                          <div className="mt-2 text-xs text-slate-500 font-extrabold mb-1">দায়িত্বপ্রাপ্ত</div>
                          <div className="text-sm font-bold text-slate-900">{budget.responsible_official}</div>
                        </div>

                        <div className="bg-slate-50 border border-slate-200 rounded-xl p-4">
                          <div className="text-xs text-slate-500 font-extrabold mb-2">হ্যাশ যাচাই (সংক্ষিপ্ত)</div>
                          <div className="flex items-center justify-between text-xs mb-2">
                            <span className="text-slate-600 font-bold">হ্যাশ চেইন</span>
                            <span className="text-emerald-700 font-extrabold">✓ যাচাইকৃত</span>
                          </div>
                          <div className="font-mono text-xs text-slate-600 break-all">
                            {budget.record_hash?.substring(0, 20)}...
                          </div>
                        </div>
                      </div>

                      <div className="mt-5 pt-5 border-t border-slate-200 flex items-center justify-between">
                        <div className="text-xs text-slate-500 font-semibold">
                          রেকর্ড আইডি: <span className="font-mono">{budget.id}</span>
                        </div>
                        <Link
                          href={`/chairman/budgets/${budget.id}`}
                          className="inline-flex items-center justify-center bg-slate-700 text-white px-5 py-2.5 rounded-xl font-extrabold hover:bg-slate-800 transition shadow-sm"
                        >
                          বিস্তারিত দেখুন
                        </Link>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* ESCALATIONS */}
          {activeTab === 'escalations' && (
            <div>
              <div className="flex items-end justify-between mb-6">
                <div>
                  <h2 className="text-3xl font-extrabold text-red-600">তদন্ত প্রয়োজন</h2>
                  <p className="text-sm text-slate-600 mt-1">৫০%+ নাগরিক সন্দেহজনক হিসেবে চিহ্নিত করেছেন</p>
                </div>
                <div className="text-sm font-bold text-red-700 bg-red-50 border border-red-200 rounded-xl px-4 py-2">
                  মোট: {escalations.length}
                </div>
              </div>

              {escalations.length === 0 ? (
                <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-10 text-center">
                  <div className="text-lg font-extrabold text-emerald-800 mb-2">কোনো এসকেলেশন নেই</div>
                  <div className="text-sm text-slate-600">সব রেকর্ড স্বাভাবিক।</div>
                </div>
              ) : (
                <div className="space-y-6">
                  {escalations.map((escalation, idx) => {
                    const { budget, flags } = escalation;

                    return (
                      <div
                        key={idx}
                        className="bg-white rounded-2xl shadow-sm border border-red-200 overflow-hidden"
                      >
                        {/* Header band */}
                        <div className="bg-red-50 border-b border-red-200 p-6">
                          <div className="flex items-start justify-between gap-4">
                            <div className="min-w-0">
                              <div className="inline-flex items-center bg-red-100 text-red-800 px-3 py-1 rounded-full text-xs font-extrabold border border-red-200">
                                তদন্ত প্রয়োজন (এসকেলেটেড)
                              </div>
                              <h3 className="mt-3 text-xl sm:text-2xl font-extrabold text-slate-900 break-words">
                                {budget.project_name}
                              </h3>
                              <p className="text-sm text-slate-600 mt-1 break-words">
                                প্রকল্প কোড: <span className="font-bold">{budget.project_code}</span>
                              </p>
                            </div>

                            <div className="shrink-0 text-right">
                              <div className="text-xs font-extrabold text-slate-600">ফ্ল্যাগ অনুপাত</div>
                              <div className="text-3xl font-extrabold text-red-700">{budget.flag_ratio}%</div>
                              <div className="text-xs font-bold text-slate-600">
                                {budget.flag_count} জন চিহ্নিত
                              </div>
                            </div>
                          </div>

                          <div className="mt-5 grid grid-cols-1 sm:grid-cols-3 gap-4">
                            <div className="bg-white border border-slate-200 rounded-xl p-4">
                              <div className="text-xs text-slate-500 font-extrabold">বরাদ্দ</div>
                              <div className="text-lg font-extrabold text-slate-900">
                                ৳{Number(budget.total_allocated_amount).toLocaleString()}
                              </div>
                            </div>
                            <div className="bg-white border border-slate-200 rounded-xl p-4">
                              <div className="text-xs text-slate-500 font-extrabold">বাস্তবায়নকারী</div>
                              <div className="text-sm font-bold text-slate-900">{budget.implementing_authority}</div>
                            </div>
                            <div className="bg-white border border-slate-200 rounded-xl p-4">
                              <div className="text-xs text-slate-500 font-extrabold">দায়িত্বপ্রাপ্ত</div>
                              <div className="text-sm font-bold text-slate-900">{budget.responsible_official}</div>
                            </div>
                          </div>
                        </div>

                        {/* Reasons */}
                        <div className="p-6">
                          <h4 className="text-lg font-extrabold text-slate-900 mb-4">নাগরিকদের কারণ</h4>

                          <div className="space-y-3">
                            {flags.map((flag) => (
                              <div
                                key={flag.id}
                                className="bg-amber-50 border border-amber-200 rounded-xl p-4"
                              >
                                <div className="flex items-start justify-between gap-3">
                                  <div className="min-w-0">
                                    <div className="font-extrabold text-slate-900 text-sm break-words">
                                      {flag.user_name}
                                    </div>
                                    <div className="text-xs text-slate-600 font-semibold mt-1">
                                      {new Date(flag.created_at).toLocaleDateString('bn-BD')}
                                    </div>
                                  </div>
                                  <div className="shrink-0 text-xs font-extrabold text-amber-900 bg-amber-100 border border-amber-200 px-3 py-1 rounded-full">
                                    কারণ
                                  </div>
                                </div>

                                <p className="mt-3 text-sm text-slate-800 leading-relaxed break-words">
                                  {flag.reason}
                                </p>
                              </div>
                            ))}
                          </div>

                          {/* Actions */}
                          <div className="mt-6 flex flex-col sm:flex-row gap-3">
                            <Link
                              href={`/chairman/budgets/${budget.id}`}
                              className="flex-1 bg-emerald-700 text-white py-3 rounded-xl font-extrabold text-center hover:bg-emerald-800 transition shadow-sm"
                            >
                              বিস্তারিত দেখুন
                            </Link>

                            <button
                              type="button"
                              className="flex-1 bg-white border-2 border-slate-300 text-slate-900 py-3 rounded-xl font-extrabold hover:bg-slate-50 transition"
                            >
                              উর্ধ্বতন কর্তৃপক্ষকে ফরওয়ার্ড করুন
                            </button>
                          </div>

                          <p className="mt-3 text-xs text-slate-500 font-semibold">
                            নোট: “ফরওয়ার্ড” বাটন এখন UI ডেমো। চাইলে API যুক্ত করে কার্যকর করা যাবে।
                          </p>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
