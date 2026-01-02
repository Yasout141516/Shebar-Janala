// app/login/page.tsx
'use client';

import { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase';
import { setCurrentUser } from '@/lib/auth';
import { Union, User } from '@/types';

type RoleFilter = 'citizen' | 'chairman' | 'admin';

export default function LoginPage() {
  const router = useRouter();

  const [unions, setUnions] = useState<Union[]>([]);
  const [users, setUsers] = useState<User[]>([]);

  const [dataLoading, setDataLoading] = useState(true);
  const [loading, setLoading] = useState(false);

  const [selectedUnionId, setSelectedUnionId] = useState<number | ''>('');
  const [role, setRole] = useState<RoleFilter>('citizen');
  const [selectedUserId, setSelectedUserId] = useState<string>('');
  const [error, setError] = useState('');

  useEffect(() => {
    let alive = true;

    async function fetchData() {
      setDataLoading(true);
      setError('');

      try {
        const { data: unionsData, error: unionsErr } = await supabase
          .from('unions')
          .select('*')
          .order('id');

        if (unionsErr) throw unionsErr;

        const { data: usersData, error: usersErr } = await supabase
          .from('users')
          .select('*')
          .order('union_id')
          .order('role')
          .order('name');

        if (usersErr) throw usersErr;

        if (!alive) return;

        const uList = (unionsData || []) as Union[];
        const usrList = (usersData || []) as User[];

        setUnions(uList);
        setUsers(usrList);

        if (uList.length > 0) setSelectedUnionId(uList[0].id);
      } catch (e) {
        console.error(e);
        if (!alive) return;
        setError('তথ্য লোড হচ্ছে না। ইন্টারনেট/ডাটাবেস দেখুন।');
      } finally {
        if (!alive) return;
        setDataLoading(false);
      }
    }

    fetchData();
    return () => {
      alive = false;
    };
  }, []);

  const unionLabel = useMemo(() => {
    const u = unions.find((x) => x.id === selectedUnionId);
    return u ? `${u.union_name} - ${u.district_name}` : '';
  }, [unions, selectedUnionId]);

  const filteredUsers = useMemo(() => {
    if (!selectedUnionId) return [];
    return users.filter((u) => u.union_id === selectedUnionId && u.role === role);
  }, [users, selectedUnionId, role]);

  const selectedUser = useMemo(
    () => users.find((u) => u.id === selectedUserId),
    [users, selectedUserId]
  );

  function roleBn(r: RoleFilter) {
    if (r === 'chairman') return 'চেয়ারম্যান';
    if (r === 'admin') return 'অ্যাডমিন';
    return 'নাগরিক';
  }

  async function handleLogin(e: React.FormEvent) {
    e.preventDefault();

    if (!selectedUnionId) {
      setError('আগে ইউনিয়ন নির্বাচন করুন।');
      return;
    }
    if (!selectedUserId) {
      setError('আপনার নাম নির্বাচন করুন।');
      return;
    }

    setLoading(true);
    setError('');

    try {
      const user = users.find((u) => u.id === selectedUserId);
      if (!user) {
        setError('অ্যাকাউন্ট পাওয়া যায়নি। আবার নির্বাচন করুন।');
        return;
      }

      setCurrentUser(user);

      if (user.role === 'chairman') router.push('/chairman/dashboard');
      else if (user.role === 'admin') router.push('/admin/dashboard');
      else router.push('/citizen/dashboard');
    } catch (e) {
      console.error(e);
      setError('সমস্যা হয়েছে। আবার চেষ্টা করুন।');
    } finally {
      setLoading(false);
    }
  }

  // Dashboard-like layout primitives
  const sectionCard = 'bg-white rounded-2xl shadow-sm border border-slate-200 p-6';
  const stepHeaderRow = 'flex items-start gap-3';
  const stepBar = 'w-2 rounded-full bg-emerald-800 self-stretch';
  const stepTitle = 'text-xl sm:text-2xl font-extrabold text-slate-900';
  const stepHint = 'mt-1 text-sm sm:text-base font-bold text-slate-700';

  function RoleButton({
    value,
    title,
    subtitle,
  }: {
    value: RoleFilter;
    title: string;
    subtitle: string;
  }) {
    const active = role === value;
    return (
      <button
        type="button"
        onClick={() => {
          setRole(value);
          setSelectedUserId('');
        }}
        className={`w-full rounded-2xl border-2 px-5 py-5 text-left transition-all ${
          active
            ? 'border-emerald-700 bg-emerald-50'
            : 'border-slate-200 bg-white hover:border-slate-300'
        }`}
      >
        <div className="flex items-start justify-between gap-4">
          <div>
            <div className={`text-lg sm:text-xl font-extrabold ${active ? 'text-emerald-900' : 'text-slate-900'}`}>
              {title}
            </div>
            <div className={`mt-1 text-sm font-bold ${active ? 'text-emerald-800' : 'text-slate-600'}`}>
              {subtitle}
            </div>
          </div>

          {/* Simple check mark (no emoji) */}
          {active ? (
            <div className="shrink-0 mt-1 flex items-center justify-center h-8 w-8 rounded-xl bg-emerald-700 text-white font-black">
              ✓
            </div>
          ) : (
            <div className="shrink-0 mt-1 h-8 w-8 rounded-xl border border-slate-200" />
          )}
        </div>
      </button>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50">
      {/* Navbar (match dashboard) */}
      <nav className="bg-emerald-900 text-white shadow-lg">
        <div className="container mx-auto px-4">
          <div className="flex items-center justify-between py-4">
            <div className="flex items-center">
              <div className="h-10 w-10 rounded-xl bg-white/10 border border-white/10 flex items-center justify-center font-black">
                শে
              </div>
              <div className="ml-3">
                <h1 className="text-xl sm:text-2xl font-extrabold tracking-tight">শেবার জানালা</h1>
                <p className="text-xs sm:text-sm text-emerald-100">ইউনিয়ন পরিষদ সেবা ও স্বচ্ছতা পোর্টাল</p>
              </div>
            </div>

            <div className="hidden sm:flex items-center gap-3">
              <Link href="/admin-login" className="bg-white text-emerald-900 px-4 py-2 rounded-lg font-extrabold hover:bg-emerald-50 transition border border-white/20">
                অ্যাডমিন লগইন
              </Link>
            </div>
          </div>
        </div>
      </nav>

      {/* Content */}
      <div className="container mx-auto px-4 py-8">
        <div className="max-w-3xl mx-auto space-y-6">
          {/* Intro card (dashboard style) */}
          <div className={sectionCard}>
            <div className="flex items-start gap-3">
              <div className="w-2 rounded-full bg-emerald-800 self-stretch" />
              <div className="min-w-0">
                <h2 className="text-2xl sm:text-3xl font-extrabold text-slate-900">লগইন</h2>
                <p className="mt-1 text-sm sm:text-base text-slate-700 font-semibold">
                  ৩টি ধাপ — ইউনিয়ন নির্বাচন, আপনি কে, আপনার নাম নির্বাচন।
                </p>
                <p className="mt-2 text-xs sm:text-sm text-slate-600 font-bold">
                  এটি ডেমো। পাসওয়ার্ড/এনআইডি লাগবে না।
                </p>
              </div>
            </div>
          </div>

          {/* Main login steps */}
          <div className={sectionCard}>
            {dataLoading ? (
              <div className="py-10 text-center">
                <div className="text-lg font-extrabold text-slate-800">লোড হচ্ছে...</div>
                <div className="mt-2 text-sm font-semibold text-slate-600">কিছুক্ষণ অপেক্ষা করুন</div>
              </div>
            ) : (
              <form onSubmit={handleLogin} className="space-y-6">
                {/* STEP 1 */}
                <div className="rounded-2xl border border-slate-200 p-5 bg-white">
                  <div className={stepHeaderRow}>
                    <div className={stepBar} />
                    <div>
                      <div className={stepTitle}>ধাপ ১: আপনার ইউনিয়ন নির্বাচন করুন</div>
                      <div className={stepHint}>ড্রপডাউনে চাপ দিন, তারপর ইউনিয়ন বাছুন</div>
                    </div>
                  </div>

                  <div className="mt-4">
                    <select
                      value={selectedUnionId}
                      onChange={(e) => {
                        setSelectedUnionId(Number(e.target.value));
                        setSelectedUserId('');
                      }}
                      className="w-full rounded-xl border-2 border-slate-200 px-5 py-4 text-lg font-extrabold focus:outline-none focus:ring-2 focus:ring-emerald-700 focus:border-transparent"
                    >
                      {unions.map((u) => (
                        <option key={u.id} value={u.id}>
                          {u.union_name} - {u.district_name}
                        </option>
                      ))}
                    </select>

                    <div className="mt-2 text-sm text-slate-700 font-bold">
                      নির্বাচিত ইউনিয়ন: <span className="font-extrabold text-slate-900">{unionLabel || '—'}</span>
                    </div>
                  </div>
                </div>

                {/* STEP 2 */}
                <div className="rounded-2xl border border-slate-200 p-5 bg-white">
                  <div className={stepHeaderRow}>
                    <div className={stepBar} />
                    <div>
                      <div className={stepTitle}>ধাপ ২: আপনি কে?</div>
                      <div className={stepHint}>বাটনে চাপ দিন (নাগরিক / চেয়ারম্যান / অ্যাডমিন)</div>
                    </div>
                  </div>

                  <div className="mt-4 space-y-3">
                    <RoleButton value="citizen" title="নাগরিক" subtitle="সমস্যা দেখবেন ও সমর্থন দেবেন" />
                    <RoleButton value="chairman" title="চেয়ারম্যান" subtitle="আপনার ইউনিয়নের কার্যক্রম দেখবেন" />
                    <RoleButton value="admin" title="অ্যাডমিন" subtitle="যাচাই/অনুমোদন করবেন" />
                  </div>
                </div>

                {/* STEP 3 */}
                <div className="rounded-2xl border border-slate-200 p-5 bg-white">
                  <div className={stepHeaderRow}>
                    <div className={stepBar} />
                    <div>
                      <div className={stepTitle}>ধাপ ৩: আপনার নাম নির্বাচন করুন</div>
                      <div className={stepHint}>তালিকা থেকে আপনার নাম বাছুন</div>
                    </div>
                  </div>

                  <div className="mt-4">
                    <select
                      value={selectedUserId}
                      onChange={(e) => setSelectedUserId(e.target.value)}
                      className="w-full rounded-xl border-2 border-slate-200 px-5 py-4 text-lg font-extrabold focus:outline-none focus:ring-2 focus:ring-emerald-700 focus:border-transparent"
                    >
                      <option value="">নাম নির্বাচন করুন...</option>
                      {filteredUsers.map((u) => (
                        <option key={u.id} value={u.id}>
                          {u.name} ({roleBn(u.role as RoleFilter)})
                        </option>
                      ))}
                    </select>

                    {!selectedUnionId && (
                      <div className="mt-2 text-sm font-bold text-red-700">আগে ইউনিয়ন নির্বাচন করুন।</div>
                    )}

                    {selectedUnionId && filteredUsers.length === 0 && (
                      <div className="mt-2 text-sm font-bold text-amber-800">
                        এই ইউনিয়নে এই ভূমিকার কোনো ব্যবহারকারী নেই।
                      </div>
                    )}
                  </div>
                </div>

                {/* Confirmation (dashboard-like highlight) */}
                <div className="rounded-2xl border border-emerald-200 bg-emerald-50 p-5">
                  <div className="text-sm font-extrabold text-emerald-900 mb-2">নিশ্চিত করুন:</div>
                  {selectedUser ? (
                    <div>
                      <div className="text-2xl font-extrabold text-slate-900">{selectedUser.name}</div>
                      <div className="text-sm font-bold text-slate-700">
                        {roleBn(selectedUser.role as RoleFilter)} • {unionLabel || '—'}
                      </div>
                    </div>
                  ) : (
                    <div className="text-sm font-bold text-slate-700">এখনও নাম নির্বাচন হয়নি।</div>
                  )}
                </div>

                {error && (
                  <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-red-800 font-extrabold">
                    {error}
                  </div>
                )}

                {/* Primary action (match dashboard buttons) */}
                <button
                  type="submit"
                  disabled={loading || !selectedUnionId || !selectedUserId}
                  className={`w-full py-4 rounded-xl font-extrabold text-white transition shadow-sm ${
                    loading || !selectedUnionId || !selectedUserId
                      ? 'bg-gray-400 cursor-not-allowed'
                      : 'bg-emerald-700 hover:bg-emerald-800'
                  }`}
                >
                  {loading ? 'লগইন হচ্ছে...' : 'লগইন করুন'}
                </button>

                {/* Mobile admin link */}
                <div className="sm:hidden text-center pt-2">
                  <Link href="/admin-login" className="text-blue-700 underline font-extrabold">
                    অ্যাডমিন লগইন
                  </Link>
                </div>
              </form>
            )}
          </div>

          <div className="text-center text-sm text-slate-500 font-semibold">
            স্বচ্ছতা • জবাবদিহিতা • সেবা
          </div>
        </div>
      </div>
    </div>
  );
}
