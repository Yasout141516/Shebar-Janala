// app/admin/dashboard/page.tsx
'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { getCurrentUser, logout } from '@/lib/auth';
import { User, Issue } from '@/types';

type TabType = 'pending' | 'all' | 'stats';

interface DashboardStats {
  total_issues: number;
  pending_issues: number;
  approved_issues: number;
  rejected_issues: number;
  total_users: number;
  total_budgets: number;
}

export default function AdminDashboard() {
  const router = useRouter();
  const [user, setUser] = useState<User | null>(null);
  const [activeTab, setActiveTab] = useState<TabType>('pending');
  const [loading, setLoading] = useState(true);

  // Data states
  const [pendingIssues, setPendingIssues] = useState<Issue[]>([]);
  const [allIssues, setAllIssues] = useState<Issue[]>([]);
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [actionLoading, setActionLoading] = useState<string | null>(null);

  useEffect(() => {
    const currentUser = getCurrentUser();
    if (!currentUser || currentUser.role !== 'admin') {
      router.push('/login');
      return;
    }
    setUser(currentUser);
    fetchData(currentUser);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [router]);

  async function fetchData(u: User) {
    try {
      // Fetch pending issues
      const pendingRes = await fetch(`/api/issues?union_id=${u.union_id}&status=pending`);
      const pendingData = await pendingRes.json();
      if (pendingData.success) setPendingIssues(pendingData.issues || []);

      // Fetch all issues
      const allRes = await fetch(`/api/issues?union_id=${u.union_id}`);
      const allData = await allRes.json();
      if (allData.success) setAllIssues(allData.issues || []);

      // Fetch stats
      const statsRes = await fetch(`/api/admin/stats?union_id=${u.union_id}`);
      const statsData = await statsRes.json();
      if (statsData.success) setStats(statsData.stats);
    } catch (err) {
      console.error('Failed to fetch data:', err);
    } finally {
      setLoading(false);
    }
  }

  async function handleIssueAction(issueId: string, action: 'approve' | 'reject') {
    if (!user) return;

    setActionLoading(issueId);

    try {
      const response = await fetch(`/api/issues/${issueId}/${action}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ admin_id: user.id }),
      });

      const data = await response.json();

      if (data.success) {
        // Remove from pending list
        setPendingIssues(prev => prev.filter(i => i.id !== issueId));
        
        // Refresh all issues
        const allRes = await fetch(`/api/issues?union_id=${user.union_id}`);
        const allData = await allRes.json();
        if (allData.success) setAllIssues(allData.issues || []);

        alert(action === 'approve' ? 'সমস্যাটি অনুমোদিত হয়েছে' : 'সমস্যাটি প্রত্যাখ্যাত হয়েছে');
      } else {
        alert(data.error || 'কার্যকর করা যায়নি');
      }
    } catch (err) {
      console.error('Action error:', err);
      alert('একটি ত্রুটি ঘটেছে');
    } finally {
      setActionLoading(null);
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
      {/* Navbar */}
      <nav className="bg-blue-900 text-white shadow-lg">
        <div className="container mx-auto px-4">
          <div className="flex items-center justify-between py-4">
            {/* Logo */}
            <div className="flex items-center space-x-3">
              <div className="h-10 w-10 rounded-xl bg-white/10 border border-white/10 flex items-center justify-center font-black">
                শে
              </div>
              <div className="ml-3">
                <h1 className="text-xl sm:text-2xl font-extrabold tracking-tight">শেবার জানালা</h1>
                <p className="text-xs sm:text-sm text-blue-100">অ্যাডমিন ড্যাশবোর্ড</p>
              </div>
            </div>

            {/* Tabs - Desktop */}
            <div className="hidden md:flex items-center space-x-1 bg-white/10 rounded-xl p-1 border border-white/10">
              <button
                onClick={() => setActiveTab('pending')}
                className={`px-5 py-2 rounded-lg font-bold transition-all ${
                  activeTab === 'pending'
                    ? 'bg-white text-blue-900 shadow'
                    : 'text-blue-100 hover:text-white hover:bg-white/10'
                }`}
              >
                অপেক্ষমাণ সমস্যা
              </button>
              <button
                onClick={() => setActiveTab('all')}
                className={`px-5 py-2 rounded-lg font-bold transition-all ${
                  activeTab === 'all'
                    ? 'bg-white text-blue-900 shadow'
                    : 'text-blue-100 hover:text-white hover:bg-white/10'
                }`}
              >
                সকল সমস্যা
              </button>
              <button
                onClick={() => setActiveTab('stats')}
                className={`px-5 py-2 rounded-lg font-bold transition-all ${
                  activeTab === 'stats'
                    ? 'bg-white text-blue-900 shadow'
                    : 'text-blue-100 hover:text-white hover:bg-white/10'
                }`}
              >
                পরিসংখ্যান
              </button>
            </div>

            {/* User Info */}
            <div className="flex items-center space-x-4">
              <div className="text-right hidden sm:block">
                <div className="font-bold">{user?.name}</div>
                <div className="text-xs text-blue-100">অ্যাডমিন</div>
              </div>
              <button
                onClick={handleLogout}
                className="bg-white text-blue-900 px-4 py-2 rounded-lg font-extrabold hover:bg-blue-50 transition border border-white/20"
              >
                লগআউট
              </button>
            </div>
          </div>

          {/* Mobile Tabs */}
          <div className="md:hidden pb-3 grid grid-cols-3 gap-2">
            <button
              onClick={() => setActiveTab('pending')}
              className={`px-3 py-2 rounded-xl font-extrabold transition-all border text-xs ${
                activeTab === 'pending'
                  ? 'bg-white text-blue-900 border-white'
                  : 'bg-white/10 text-blue-100 border-white/10'
              }`}
            >
              অপেক্ষমাণ
            </button>
            <button
              onClick={() => setActiveTab('all')}
              className={`px-3 py-2 rounded-xl font-extrabold transition-all border text-xs ${
                activeTab === 'all'
                  ? 'bg-white text-blue-900 border-white'
                  : 'bg-white/10 text-blue-100 border-white/10'
              }`}
            >
              সকল সমস্যা
            </button>
            <button
              onClick={() => setActiveTab('stats')}
              className={`px-3 py-2 rounded-xl font-extrabold transition-all border text-xs ${
                activeTab === 'stats'
                  ? 'bg-white text-blue-900 border-white'
                  : 'bg-white/10 text-blue-100 border-white/10'
              }`}
            >
              পরিসংখ্যান
            </button>
          </div>
        </div>
      </nav>

      {/* Content */}
      <div className="container mx-auto px-4 py-8">
        <div className="max-w-6xl mx-auto">
          {/* PENDING ISSUES TAB */}
          {activeTab === 'pending' && (
            <div>
              <div className="flex items-end justify-between mb-6">
                <div>
                  <h2 className="text-3xl font-extrabold text-slate-900">অপেক্ষমাণ সমস্যা</h2>
                  <p className="text-sm text-slate-600 mt-1">
                    নাগরিকদের জমা দেওয়া সমস্যা পর্যালোচনা করে অনুমোদন বা প্রত্যাখ্যান করুন
                  </p>
                </div>
                <div className="text-sm font-bold text-amber-700 bg-amber-50 border border-amber-200 rounded-xl px-4 py-2">
                  মোট: {pendingIssues.length}
                </div>
              </div>

              {pendingIssues.length === 0 ? (
                <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-10 text-center">
                  <div className="text-lg font-extrabold text-emerald-800 mb-2">
                    ✅ কোনো অপেক্ষমাণ সমস্যা নেই
                  </div>
                  <div className="text-sm text-slate-600">সকল সমস্যা পর্যালোচনা করা হয়েছে।</div>
                </div>
              ) : (
                <div className="space-y-4">
                  {pendingIssues.map((issue) => (
                    <div
                      key={issue.id}
                      className="bg-white rounded-2xl shadow-sm border border-amber-200 p-6"
                    >
                      <div className="flex items-start justify-between gap-4 mb-4">
                        <div className="flex-1 min-w-0">
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
                            <span className="inline-flex bg-amber-50 text-amber-800 border border-amber-100 px-3 py-1 rounded-full text-xs font-extrabold">
                              অবস্থা: পর্যালোচনাধীন
                            </span>
                          </div>
                        </div>
                      </div>

                      <div className="flex items-center justify-between pt-4 border-t border-slate-200">
                        <div className="text-sm text-slate-600">
                          জমাদানকারী:{' '}
                          <span className="font-bold text-slate-900">
                            {issue.created_by_user?.name || 'অজানা'}
                          </span>
                          {' • '}
                          <span className="text-xs">
                            {new Date(issue.created_at).toLocaleDateString('bn-BD')}
                          </span>
                        </div>

                        <div className="flex gap-3">
                          <button
                            onClick={() => handleIssueAction(issue.id, 'reject')}
                            disabled={actionLoading === issue.id}
                            className={`px-5 py-2.5 rounded-xl font-extrabold transition shadow-sm ${
                              actionLoading === issue.id
                                ? 'bg-gray-400 text-white cursor-not-allowed'
                                : 'bg-red-600 text-white hover:bg-red-700'
                            }`}
                          >
                            {actionLoading === issue.id ? 'অপেক্ষা করুন...' : '✕ প্রত্যাখ্যান'}
                          </button>

                          <button
                            onClick={() => handleIssueAction(issue.id, 'approve')}
                            disabled={actionLoading === issue.id}
                            className={`px-5 py-2.5 rounded-xl font-extrabold transition shadow-sm ${
                              actionLoading === issue.id
                                ? 'bg-gray-400 text-white cursor-not-allowed'
                                : 'bg-emerald-600 text-white hover:bg-emerald-700'
                            }`}
                          >
                            {actionLoading === issue.id ? 'অপেক্ষা করুন...' : '✓ অনুমোদন'}
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* ALL ISSUES TAB */}
          {activeTab === 'all' && (
            <div>
              <div className="flex items-end justify-between mb-6">
                <div>
                  <h2 className="text-3xl font-extrabold text-slate-900">সকল সমস্যা</h2>
                  <p className="text-sm text-slate-600 mt-1">ইউনিয়নের সকল সমস্যার তালিকা</p>
                </div>
                <div className="text-sm font-bold text-slate-700 bg-white border border-slate-200 rounded-xl px-4 py-2">
                  মোট: {allIssues.length}
                </div>
              </div>

              {allIssues.length === 0 ? (
                <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-10 text-center">
                  <div className="text-lg font-extrabold text-slate-900">কোনো সমস্যা নেই</div>
                </div>
              ) : (
                <div className="space-y-4">
                  {allIssues.map((issue) => (
                    <div
                      key={issue.id}
                      className="bg-white rounded-2xl shadow-sm border border-slate-200 p-6"
                    >
                      <div className="flex items-start justify-between gap-4 mb-4">
                        <div className="flex-1 min-w-0">
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
                          className={`shrink-0 px-3 py-1.5 rounded-full text-xs font-extrabold border whitespace-nowrap ${
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
                          <span className="font-bold text-slate-900">
                            {issue.created_by_user?.name || 'অজানা'}
                          </span>
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

          {/* STATS TAB */}
          {activeTab === 'stats' && (
            <div>
              <h2 className="text-3xl font-extrabold text-slate-900 mb-6">ড্যাশবোর্ড পরিসংখ্যান</h2>

              {stats && (
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-6">
                    <div className="text-xs font-extrabold text-slate-500 mb-2">মোট সমস্যা</div>
                    <div className="text-4xl font-extrabold text-slate-900 mb-4">
                      {stats.total_issues}
                    </div>
                    <div className="space-y-2">
                      <div className="flex justify-between text-sm">
                        <span className="text-amber-700 font-bold">অপেক্ষমাণ</span>
                        <span className="font-extrabold">{stats.pending_issues}</span>
                      </div>
                      <div className="flex justify-between text-sm">
                        <span className="text-emerald-700 font-bold">অনুমোদিত</span>
                        <span className="font-extrabold">{stats.approved_issues}</span>
                      </div>
                      <div className="flex justify-between text-sm">
                        <span className="text-red-700 font-bold">প্রত্যাখ্যাত</span>
                        <span className="font-extrabold">{stats.rejected_issues}</span>
                      </div>
                    </div>
                  </div>

                  <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-6">
                    <div className="text-xs font-extrabold text-slate-500 mb-2">মোট ব্যবহারকারী</div>
                    <div className="text-4xl font-extrabold text-slate-900 mb-4">
                      {stats.total_users}
                    </div>
                    <div className="text-sm text-slate-600">
                      ইউনিয়নে নিবন্ধিত সকল ব্যবহারকারী
                    </div>
                  </div>

                  <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-6">
                    <div className="text-xs font-extrabold text-slate-500 mb-2">মোট বাজেট রেকর্ড</div>
                    <div className="text-4xl font-extrabold text-slate-900 mb-4">
                      {stats.total_budgets}
                    </div>
                    <div className="text-sm text-slate-600">
                      চেয়ারম্যান কর্তৃক তৈরিকৃত বাজেট
                    </div>
                  </div>
                </div>
              )}

              {/* Quick Info */}
              <div className="mt-8 bg-blue-50 border border-blue-200 rounded-2xl p-6">
                <h3 className="text-lg font-extrabold text-blue-900 mb-3">অ্যাডমিন দায়িত্ব</h3>
                <ul className="space-y-2 text-sm text-blue-800">
                  <li className="flex items-start">
                    <span className="mr-2">•</span>
                    <span>নাগরিকদের জমা দেওয়া সমস্যা পর্যালোচনা ও অনুমোদন/প্রত্যাখ্যান করুন</span>
                  </li>
                  <li className="flex items-start">
                    <span className="mr-2">•</span>
                    <span>অনুমোদিত সমস্যা সকল নাগরিক দেখতে পারবেন</span>
                  </li>
                  <li className="flex items-start">
                    <span className="mr-2">•</span>
                    <span>ইউনিয়নের স্বচ্ছতা ও সেবা নিশ্চিত করুন</span>
                  </li>
                </ul>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}