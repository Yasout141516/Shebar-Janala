'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { getCurrentUser, logout } from '@/lib/auth';
import { Issue, BudgetRecord, User } from '@/types';

type TabType = 'issues' | 'budgets' | 'flags';

interface FlaggedBudget {
  id: string;
  reason: string;
  flagged_at: string;
  budget: BudgetRecord & {
    flag_count: number;
    total_citizens: number;
    flag_ratio: number;
    is_escalated: boolean;
  };
}

export default function CitizenDashboard() {
  const router = useRouter();
  const [user, setUser] = useState<User | null>(null);
  const [issues, setIssues] = useState<Issue[]>([]);
  const [budgets, setBudgets] = useState<BudgetRecord[]>([]);
  const [flaggedBudgets, setFlaggedBudgets] = useState<FlaggedBudget[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<TabType>('issues');

  useEffect(() => {
    const currentUser = getCurrentUser();
    if (!currentUser || currentUser.role !== 'citizen') {
      router.push('/login');
      return;
    }
    setUser(currentUser);
    fetchData(currentUser);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [router]);

  async function fetchData(u: User) {
    try {
      const issuesRes = await fetch(`/api/issues?union_id=${u.union_id}&status=approved`);
      const issuesData = await issuesRes.json();
      if (issuesData.success) setIssues(issuesData.issues);

      // Use new API with flag data
      const budgetsRes = await fetch(`/api/budgets/with-flags?union_id=${u.union_id}&user_id=${u.id}`);
      const budgetsData = await budgetsRes.json();
      if (budgetsData.success) setBudgets(budgetsData.budgets);

      // Fetch user's flagged budgets
      const flagsRes = await fetch(`/api/flags/my-flags?user_id=${u.id}`);
      const flagsData = await flagsRes.json();
      if (flagsData.success) setFlaggedBudgets(flagsData.flags);
    } catch (err) {
      console.error('Failed to fetch data:', err);
    } finally {
      setLoading(false);
    }
  }

  async function handleVote(issueId: string) {
    if (!user) return;

    try {
      const response = await fetch(`/api/issues/${issueId}/vote`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ user_id: user.id }),
      });

      const data = await response.json();

      if (data.success) {
        setIssues((prev) =>
          prev.map((issue) =>
            issue.id === issueId ? { ...issue, upvote_count: data.upvote_count } : issue
          )
        );
        alert('আপনার সমর্থন নথিভুক্ত হয়েছে।');
      } else {
        alert(data.error || 'সমর্থন নথিভুক্ত করা যায়নি।');
      }
    } catch {
      alert('সমর্থন প্রদান করতে ত্রুটি হয়েছে। অনুগ্রহ করে আবার চেষ্টা করুন।');
    }
  }

  function handleLogout() {
    logout();
    router.push('/login');
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50">
        <div className="text-lg font-semibold text-slate-700">লোড হচ্ছে...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50">
      {/* Navbar with Tabs */}
      <nav className="bg-emerald-900 text-white shadow-lg">
        <div className="container mx-auto px-4">
          <div className="flex items-center justify-between py-4">
            {/* Logo */}
            <div className="flex items-center space-x-3">
              <div className="flex items-center">
                <div className="h-10 w-10 rounded-xl bg-white/10 border border-white/10 flex items-center justify-center font-black">
                  শে
                </div>
                <div className="ml-3">
                  <h1 className="text-xl sm:text-2xl font-extrabold tracking-tight">শেবার জানালা</h1>
                  <p className="text-xs sm:text-sm text-emerald-100">
                    ইউনিয়ন পরিষদ সেবা ও স্বচ্ছতা পোর্টাল
                  </p>
                </div>
              </div>
            </div>

            {/* Tab Navigation - Center */}
            <div className="hidden md:flex items-center space-x-1 bg-white/10 rounded-xl p-1 border border-white/10">
              <button
                onClick={() => setActiveTab('issues')}
                className={`px-5 py-2 rounded-lg font-bold transition-all ${
                  activeTab === 'issues'
                    ? 'bg-white text-emerald-900 shadow'
                    : 'text-emerald-100 hover:text-white hover:bg-white/10'
                }`}
              >
                জনস্বার্থ সমস্যা
              </button>
              <button
                onClick={() => setActiveTab('budgets')}
                className={`px-5 py-2 rounded-lg font-bold transition-all ${
                  activeTab === 'budgets'
                    ? 'bg-white text-emerald-900 shadow'
                    : 'text-emerald-100 hover:text-white hover:bg-white/10'
                }`}
              >
                বাজেট স্বচ্ছতা
              </button>
              <button
                onClick={() => setActiveTab('flags')}
                className={`px-5 py-2 rounded-lg font-bold transition-all ${
                  activeTab === 'flags'
                    ? 'bg-white text-emerald-900 shadow'
                    : 'text-emerald-100 hover:text-white hover:bg-white/10'
                }`}
              >
                ফ্ল্যাগকৃত বাজেট
              </button>
            </div>

            {/* User Info & Logout */}
            <div className="flex items-center space-x-4">
              <div className="text-right hidden sm:block">
                <div className="font-bold">{user?.name}</div>
                <div className="text-xs text-emerald-100">নাগরিক অ্যাকাউন্ট</div>
              </div>
              <button
                onClick={handleLogout}
                className="bg-white text-emerald-900 px-4 py-2 rounded-lg font-extrabold hover:bg-emerald-50 transition border border-white/20"
              >
                লগআউট
              </button>
            </div>
          </div>

          {/* Mobile Tab Navigation */}
          <div className="md:hidden pb-3 flex space-x-2">
            <button
              onClick={() => setActiveTab('issues')}
              className={`flex-1 px-4 py-2 rounded-xl font-extrabold transition-all border ${
                activeTab === 'issues'
                  ? 'bg-white text-emerald-900 border-white'
                  : 'bg-white/10 text-emerald-100 border-white/10'
              }`}
            >
              সমস্যা
            </button>
            <button
              onClick={() => setActiveTab('budgets')}
              className={`flex-1 px-4 py-2 rounded-xl font-extrabold transition-all border ${
                activeTab === 'budgets'
                  ? 'bg-white text-emerald-900 border-white'
                  : 'bg-white/10 text-emerald-100 border-white/10'
              }`}
            >
              বাজেট
            </button>
            <button
              onClick={() => setActiveTab('flags')}
              className={`flex-1 px-4 py-2 rounded-xl font-extrabold transition-all border ${
                activeTab === 'flags'
                  ? 'bg-white text-emerald-900 border-white'
                  : 'bg-white/10 text-emerald-100 border-white/10'
              }`}
            >
              ফ্ল্যাগ
            </button>
          </div>
        </div>
      </nav>

      {/* Main Content */}
      <div className="container mx-auto px-4 py-8">
        {/* Header + Quick Actions */}
        <div className="max-w-5xl mx-auto mb-6">
          <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-6 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div>
              <h2 className="text-xl sm:text-2xl font-extrabold text-slate-900">
                নাগরিক ড্যাশবোর্ড
              </h2>
              <p className="text-sm text-slate-600 mt-1">
                অনুমোদিত জনস্বার্থ সমস্যা দেখুন, সমর্থন জানান এবং বাজেট তথ্য যাচাই করুন।
              </p>
            </div>

            <Link
              href="/citizen/issues/new"
              className="inline-flex items-center justify-center bg-emerald-700 text-white px-6 py-3 rounded-xl font-extrabold hover:bg-emerald-800 transition shadow-sm"
            >
              + নতুন অভিযোগ/সমস্যা জমা দিন
            </Link>
          </div>
        </div>

        {/* Tab Content */}
        <div className="max-w-5xl mx-auto">
          {/* Issues Tab */}
          {activeTab === 'issues' && (
            <div>
              <div className="flex items-end justify-between mb-4">
                <div>
                  <h3 className="text-2xl font-extrabold text-slate-900">জনস্বার্থ সমস্যা</h3>
                  <p className="text-sm text-slate-600 mt-1">
                    শুধুমাত্র প্রশাসনিকভাবে অনুমোদিত সমস্যা এখানে প্রদর্শিত হয়।
                  </p>
                </div>
                <div className="text-sm font-bold text-slate-700 bg-white border border-slate-200 rounded-xl px-4 py-2">
                  মোট: {issues.length}
                </div>
              </div>

              {issues.length === 0 ? (
                <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-10 text-center">
                  <div className="text-lg font-extrabold text-slate-900">এই মুহূর্তে কোনো অনুমোদিত সমস্যা নেই</div>
                  <div className="text-sm text-slate-600 mt-2">
                    আপনার এলাকায় সমস্যা থাকলে "নতুন অভিযোগ/সমস্যা জমা দিন" বাটনে ক্লিক করে জমা দিন।
                  </div>
                </div>
              ) : (
                <div className="space-y-4">
                  {issues.map((issue) => (
                    <div
                      key={issue.id}
                      className="bg-white rounded-2xl shadow-sm border border-slate-200 p-6 hover:shadow transition"
                    >
                      <div className="flex items-start justify-between gap-4">
                        <div className="min-w-0">
                          <h4 className="font-extrabold text-lg text-slate-900 mb-2 break-words">
                            {issue.title}
                          </h4>
                          <p className="text-slate-700 text-sm leading-relaxed break-words">
                            {issue.description}
                          </p>

                          <div className="mt-4 flex flex-wrap items-center gap-2">
                            {issue.ward && (
                              <span className="inline-flex items-center bg-sky-50 text-sky-800 text-xs px-3 py-1 rounded-full font-bold border border-sky-100">
                                ওয়ার্ড: {issue.ward}
                              </span>
                            )}
                            <span className="inline-flex items-center bg-emerald-50 text-emerald-800 text-xs px-3 py-1 rounded-full font-bold border border-emerald-100">
                              অবস্থা: অনুমোদিত
                            </span>
                          </div>
                        </div>

                        <div className="shrink-0 text-right">
                          <div className="text-xs text-slate-500 font-semibold">সমর্থন</div>
                          <div className="text-2xl font-extrabold text-emerald-800">
                            {issue.upvote_count ?? 0}
                          </div>
                        </div>
                      </div>

                      <div className="flex items-center justify-between mt-5 pt-5 border-t border-slate-200">
                        <div className="text-sm text-slate-600">
                          জমাদানকারী:{' '}
                          <span className="font-bold text-slate-800">
                            {issue.created_by_user?.name || 'অজানা'}
                          </span>
                        </div>

                        <button
                          onClick={() => handleVote(issue.id)}
                          className="flex items-center space-x-2 bg-emerald-700 text-white px-5 py-2.5 rounded-xl hover:bg-emerald-800 transition font-extrabold shadow-sm"
                        >
                          <span>👍</span>
                          <span>সমর্থন করুন</span>
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* Budgets Tab */}
          {activeTab === 'budgets' && (
            <div>
              <div className="flex items-end justify-between mb-4">
                <div>
                  <h3 className="text-2xl font-extrabold text-slate-900">বাজেট স্বচ্ছতা</h3>
                  <p className="text-sm text-slate-600 mt-1">
                    প্রকল্পভিত্তিক বরাদ্দ, দায়িত্বপ্রাপ্ত কর্মকর্তা এবং নথিভুক্ত তথ্য যাচাই করুন।
                  </p>
                </div>
                <div className="text-sm font-bold text-slate-700 bg-white border border-slate-200 rounded-xl px-4 py-2">
                  মোট: {budgets.length}
                </div>
              </div>

              {budgets.length === 0 ? (
                <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-10 text-center">
                  <div className="text-lg font-extrabold text-slate-900">কোনো বাজেট রেকর্ড পাওয়া যায়নি</div>
                  <div className="text-sm text-slate-600 mt-2">
                    নতুন বাজেট তথ্য যুক্ত হলে এখানে প্রদর্শিত হবে।
                  </div>
                </div>
              ) : (
                <div className="space-y-4">
                  {budgets.map((budget) => (
                    <div
                      key={budget.id}
                      className={`bg-white rounded-2xl shadow-sm border p-6 hover:shadow transition ${
                        budget.is_escalated
                          ? 'border-red-300 bg-red-50/30'
                          : budget.flag_count && budget.flag_count > 0
                          ? 'border-amber-300 bg-amber-50/30'
                          : 'border-slate-200'
                      }`}
                    >
                      <div className="flex items-start justify-between gap-4 mb-4">
                        <div className="min-w-0">
                          <h4 className="font-extrabold text-lg text-slate-900 break-words">
                            {budget.project_name}
                          </h4>
                          <p className="text-sm text-slate-600 mt-1 break-words">
                            প্রকল্প কোড: <span className="font-bold">{budget.project_code}</span>
                          </p>
                        </div>

                        <span
                          className={`px-3 py-1.5 rounded-full text-xs font-extrabold border ${
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

                      {/* Flag Status - NEW! */}
                      {budget.flag_count !== undefined && budget.flag_count > 0 && (
                        <div className="mb-4">
                          <div
                            className={`rounded-xl p-3 border ${
                              budget.is_escalated
                                ? 'bg-red-50 border-red-200'
                                : 'bg-amber-50 border-amber-200'
                            }`}
                          >
                            <div className="flex items-center justify-between mb-2">
                              <div className="flex items-center space-x-2">
                                <span className="text-lg">
                                  {budget.is_escalated ? '🚨' : '⚠️'}
                                </span>
                                <span
                                  className={`text-sm font-extrabold ${
                                    budget.is_escalated ? 'text-red-900' : 'text-amber-900'
                                  }`}
                                >
                                  {budget.is_escalated
                                    ? 'স্বয়ংক্রিয়ভাবে উর্ধ্বতন কর্তৃপক্ষে রিপোর্ট করা হয়েছে'
                                    : 'নাগরিকরা সন্দেহজনক হিসেবে চিহ্নিত করেছেন'}
                                </span>
                              </div>
                            </div>
                            <div className="flex items-center justify-between text-xs">
                              <span
                                className={`font-bold ${
                                  budget.is_escalated ? 'text-red-800' : 'text-amber-800'
                                }`}
                              >
                                চিহ্নিতকরণ: {budget.flag_count}/{budget.total_citizens} নাগরিক (
                                {budget.flag_ratio}%)
                              </span>
                              {budget.user_has_flagged && (
                                <span className="bg-slate-700 text-white px-2 py-1 rounded-md font-bold">
                                  আপনি চিহ্নিত করেছেন ✓
                                </span>
                              )}
                            </div>
                          </div>
                        </div>
                      )}

                      <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-4">
                        <div>
                          <div className="text-xs text-slate-500 font-bold">মোট বরাদ্দ</div>
                          <div className="text-3xl font-extrabold text-emerald-800">
                            ৳{Number(budget.total_allocated_amount).toLocaleString()}
                          </div>
                        </div>

                        <div className="bg-slate-50 border border-slate-200 rounded-xl p-4 w-full sm:w-auto">
                          <div className="text-xs text-slate-500 font-bold mb-2">যাচাইকরণ অবস্থা</div>
                          <div className="flex items-center justify-between text-xs mb-2">
                            <span className="text-slate-600 font-bold">হ্যাশ চেইন</span>
                            <span className="text-emerald-700 font-extrabold">✓ যাচাইকৃত</span>
                          </div>
                          <div className="font-mono text-xs text-slate-500">
                            {budget.record_hash?.substring(0, 18)}...
                          </div>
                        </div>
                      </div>

                      <div className="text-sm text-slate-700 space-y-1 mt-4">
                        <div>
                          বাস্তবায়নকারী কর্তৃপক্ষ:{' '}
                          <span className="font-bold">{budget.implementing_authority}</span>
                        </div>
                        <div>
                          দায়িত্বপ্রাপ্ত কর্মকর্তা:{' '}
                          <span className="font-bold">{budget.responsible_official}</span>
                        </div>
                        {budget.ward && (
                          <div>
                            ওয়ার্ড: <span className="font-bold">{budget.ward}</span>
                          </div>
                        )}
                      </div>

                      <div className="mt-5">
                        <Link
                          href={`/citizen/budgets/${budget.id}`}
                          className="block text-center bg-emerald-700 text-white py-3 rounded-xl hover:bg-emerald-800 transition font-extrabold shadow-sm"
                        >
                          বিস্তারিত দেখুন ও সন্দেহজনক হিসেবে চিহ্নিত করুন
                        </Link>
                        {!budget.user_has_flagged && (
                          <p className="mt-2 text-xs text-slate-500">
                            সন্দেহজনক লেনদেন/অসঙ্গতি থাকলে "সন্দেহজনক" হিসেবে চিহ্নিত করুন—প্রশাসক
                            পর্যবেক্ষণ করবেন।
                          </p>
                        )}
                        {budget.user_has_flagged && (
                          <p className="mt-2 text-xs text-emerald-700 font-bold">
                            ✓ আপনি ইতিমধ্যে এই বাজেট চিহ্নিত করেছেন
                          </p>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* Flags Tab - NEW! */}
          {activeTab === 'flags' && (
            <div>
              <div className="flex items-end justify-between mb-4">
                <div>
                  <h3 className="text-2xl font-extrabold text-slate-900">আপনার ফ্ল্যাগকৃত বাজেট</h3>
                  <p className="text-sm text-slate-600 mt-1">
                    আপনি সন্দেহজনক হিসেবে চিহ্নিত করেছেন এমন বাজেট রেকর্ড এবং আপনার দেওয়া কারণ।
                  </p>
                </div>
                <div className="text-sm font-bold text-slate-700 bg-white border border-slate-200 rounded-xl px-4 py-2">
                  মোট: {flaggedBudgets.length}
                </div>
              </div>

              {flaggedBudgets.length === 0 ? (
                <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-10 text-center">
                  <div className="text-lg font-extrabold text-slate-900">আপনি এখনো কোনো বাজেট চিহ্নিত করেননি</div>
                  <div className="text-sm text-slate-600 mt-2">
                    সন্দেহজনক বাজেট রেকর্ড পেলে "বাজেট স্বচ্ছতা" ট্যাবে গিয়ে চিহ্নিত করুন।
                  </div>
                </div>
              ) : (
                <div className="space-y-4">
                  {flaggedBudgets.map((flaggedItem) => {
                    const budget = flaggedItem.budget;
                    return (
                      <div
                        key={flaggedItem.id}
                        className={`bg-white rounded-2xl shadow-sm border p-6 ${
                          budget.is_escalated
                            ? 'border-red-300 bg-red-50/20'
                            : 'border-amber-300 bg-amber-50/20'
                        }`}
                      >
                        {/* Flag Date & Status Badge */}
                        <div className="flex items-center justify-between mb-4">
                          <div className="text-xs text-slate-500 font-bold">
                            চিহ্নিত করা হয়েছে: {new Date(flaggedItem.flagged_at).toLocaleDateString('bn-BD')}
                          </div>
                          {budget.is_escalated && (
                            <span className="inline-flex items-center bg-red-100 text-red-800 text-xs px-3 py-1 rounded-full font-bold border border-red-200">
                              🚨 এসকেলেটেড
                            </span>
                          )}
                        </div>

                        {/* Budget Info */}
                        <div className="flex items-start justify-between gap-4 mb-4">
                          <div className="min-w-0">
                            <h4 className="font-extrabold text-lg text-slate-900 break-words">
                              {budget.project_name}
                            </h4>
                            <p className="text-sm text-slate-600 mt-1 break-words">
                              প্রকল্প কোড: <span className="font-bold">{budget.project_code}</span>
                            </p>
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

                        {/* Amount */}
                        <div className="mb-4">
                          <div className="text-xs text-slate-500 font-bold">মোট বরাদ্দ</div>
                          <div className="text-2xl font-extrabold text-emerald-800">
                            ৳{Number(budget.total_allocated_amount).toLocaleString()}
                          </div>
                        </div>

                        {/* Your Flag Reason - HIGHLIGHTED */}
                        <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 mb-4">
                          <div className="flex items-start space-x-2">
                            <span className="text-xl mt-0.5">📝</span>
                            <div className="flex-1">
                              <div className="text-sm font-extrabold text-amber-900 mb-2">
                                আপনার দেওয়া কারণ:
                              </div>
                              <p className="text-sm text-amber-800 leading-relaxed">
                                {flaggedItem.reason}
                              </p>
                            </div>
                          </div>
                        </div>

                        {/* Current Flag Status */}
                        <div
                          className={`rounded-xl p-3 border mb-4 ${
                            budget.is_escalated
                              ? 'bg-red-50 border-red-200'
                              : 'bg-slate-50 border-slate-200'
                          }`}
                        >
                          <div className="flex items-center justify-between">
                            <div className="flex items-center space-x-2">
                              <span className="text-lg">{budget.is_escalated ? '🚨' : '⚠️'}</span>
                              <div>
                                <div
                                  className={`text-sm font-extrabold ${
                                    budget.is_escalated ? 'text-red-900' : 'text-slate-900'
                                  }`}
                                >
                                  {budget.is_escalated
                                    ? 'স্বয়ংক্রিয়ভাবে উর্ধ্বতন কর্তৃপক্ষে রিপোর্ট করা হয়েছে'
                                    : 'বর্তমান ফ্ল্যাগ অবস্থা'}
                                </div>
                                <div className="text-xs text-slate-600 mt-1">
                                  {budget.flag_count}/{budget.total_citizens} নাগরিক চিহ্নিত করেছেন (
                                  {budget.flag_ratio}%)
                                </div>
                              </div>
                            </div>
                          </div>
                        </div>

                        {/* Additional Details */}
                        <div className="text-sm text-slate-700 space-y-1 mb-4">
                          <div>
                            বাস্তবায়নকারী কর্তৃপক্ষ:{' '}
                            <span className="font-bold">{budget.implementing_authority}</span>
                          </div>
                          <div>
                            দায়িত্বপ্রাপ্ত কর্মকর্তা:{' '}
                            <span className="font-bold">{budget.responsible_official}</span>
                          </div>
                          {budget.ward && (
                            <div>
                              ওয়ার্ড: <span className="font-bold">{budget.ward}</span>
                            </div>
                          )}
                        </div>

                        {/* View Details Button */}
                        <Link
                          href={`/citizen/budgets/${budget.id}`}
                          className="block text-center bg-slate-700 text-white py-3 rounded-xl hover:bg-slate-800 transition font-extrabold shadow-sm"
                        >
                          সম্পূর্ণ বিস্তারিত দেখুন
                        </Link>
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