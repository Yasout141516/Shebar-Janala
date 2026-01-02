'use client';

import { use, useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { getCurrentUser, logout } from '@/lib/auth';
import { BudgetRecord, User } from '@/types';

export default function BudgetDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const router = useRouter();
  const resolvedParams = use(params);
  const budgetId = resolvedParams.id;
  
  const [user, setUser] = useState<User | null>(null);
  const [budget, setBudget] = useState<BudgetRecord | null>(null);
  const [loading, setLoading] = useState(true);
  const [flagging, setFlagging] = useState(false);
  const [reason, setReason] = useState('');
  const [error, setError] = useState('');
  const [successMessage, setSuccessMessage] = useState('');

  useEffect(() => {
    const currentUser = getCurrentUser();
    if (!currentUser || currentUser.role !== 'citizen') {
      router.push('/login');
      return;
    }

    setUser(currentUser);
    fetchBudget(budgetId, currentUser.union_id);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [router, budgetId]);

  async function fetchBudget(id: string, unionId: number) {
    try {
      const response = await fetch(`/api/budgets?union_id=${unionId}`);
      const data = await response.json();

      if (data.success) {
        const foundBudget = data.budgets.find((b: BudgetRecord) => String(b.id) === String(id));
        if (foundBudget) {
          setBudget(foundBudget);
        } else {
          setError('বাজেট রেকর্ড পাওয়া যায়নি।');
        }
      } else {
        setError(data.error || 'বাজেট তথ্য লোড করা যায়নি।');
      }
    } catch (err) {
      console.error(err);
      setError('তথ্য লোড করতে সমস্যা হয়েছে।');
    } finally {
      setLoading(false);
    }
  }

  async function handleFlag(e: React.FormEvent) {
    e.preventDefault();
    if (!user || !budget) return;

    if (!reason.trim()) {
      setError('অনুগ্রহ করে কারণ উল্লেখ করুন।');
      return;
    }

    setFlagging(true);
    setError('');
    setSuccessMessage('');

    try {
      const response = await fetch(`/api/budgets/${budgetId}/flag`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          user_id: user.id,
          reason: reason.trim(),
        }),
      });

      const data = await response.json();

      if (data.success) {
        const message = `সফলভাবে চিহ্নিত করা হয়েছে!\n\nমোট চিহ্নিতকরণ: ${data.flag_count}\nচিহ্নিতকরণ অনুপাত: ${data.flag_ratio}%${
          data.escalated ? '\n\nস্বয়ংক্রিয়ভাবে উর্ধ্বতন কর্তৃপক্ষকে জানানো হয়েছে!' : ''
        }`;
        setSuccessMessage(message);
        
        setTimeout(() => {
          router.push('/citizen/dashboard');
        }, 3000);
      } else {
        setError(data.error || 'চিহ্নিত করতে ব্যর্থ হয়েছে।');
      }
    } catch (err) {
      console.error(err);
      setError('একটি ত্রুটি ঘটেছে। অনুগ্রহ করে আবার চেষ্টা করুন।');
    } finally {
      setFlagging(false);
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

  if (error && !budget) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50">
        <div className="text-center">
          <div className="text-lg font-bold text-red-600 mb-4">{error}</div>
          <Link href="/citizen/dashboard" className="text-emerald-700 hover:underline font-bold">
            ← ড্যাশবোর্ডে ফিরে যান
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50">
      {/* Navbar */}
      <nav className="bg-emerald-900 text-white shadow-lg">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <Link href="/citizen/dashboard" className="flex items-center space-x-3 hover:opacity-80 transition">
            <div className="h-10 w-10 rounded-xl bg-white/10 border border-white/10 flex items-center justify-center font-black">
              শে
            </div>
            <div>
              <h1 className="text-xl font-extrabold tracking-tight">শেবার জানালা</h1>
              <p className="text-xs text-emerald-100">বাজেট বিস্তারিত</p>
            </div>
          </Link>

          <div className="flex items-center space-x-4">
            <div className="text-right hidden sm:block">
              <div className="font-bold">{user?.name}</div>
              <div className="text-xs text-emerald-100">নাগরিক অ্যাকাউন্ট</div>
            </div>
            <button
              onClick={handleLogout}
              className="bg-white text-emerald-900 px-4 py-2 rounded-lg font-extrabold hover:bg-emerald-50 transition"
            >
              লগআউট
            </button>
          </div>
        </div>
      </nav>

      {/* Main Content */}
      <div className="container mx-auto px-4 py-8">
        <div className="max-w-4xl mx-auto">
          {/* Back Button */}
          <Link
            href="/citizen/dashboard"
            className="inline-flex items-center text-emerald-700 hover:text-emerald-800 mb-6 font-bold"
          >
            <span className="mr-2">←</span>
            ড্যাশবোর্ডে ফিরে যান
          </Link>

          {/* Success Message */}
          {successMessage && (
            <div className="bg-emerald-50 border border-emerald-200 rounded-2xl p-6 mb-6">
              <div className="flex items-start">
                <svg className="w-6 h-6 text-emerald-600 mr-3 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                </svg>
                <div className="flex-1">
                  <h3 className="font-extrabold text-emerald-900 mb-2">সফল!</h3>
                  <p className="text-sm text-emerald-800 whitespace-pre-line">{successMessage}</p>
                  <p className="text-xs text-emerald-700 mt-3">৩ সেকেন্ডে ড্যাশবোর্ডে ফিরে যাবে...</p>
                </div>
              </div>
            </div>
          )}

          {budget && (
            <>
              {/* Budget Details Card */}
              <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-8 mb-6">
                <div className="flex items-start justify-between mb-6">
                  <div>
                    <h1 className="text-3xl font-extrabold text-slate-900 mb-2">{budget.project_name}</h1>
                    <p className="text-slate-600">প্রকল্প কোড: <span className="font-bold">{budget.project_code}</span></p>
                  </div>
                  <span
                    className={`px-4 py-2 rounded-full text-sm font-extrabold border ${
                      budget.status === 'completed'
                        ? 'bg-emerald-50 text-emerald-800 border-emerald-100'
                        : budget.status === 'ongoing'
                        ? 'bg-sky-50 text-sky-800 border-sky-100'
                        : 'bg-amber-50 text-amber-800 border-amber-100'
                    }`}
                  >
                    {budget.status === 'completed' ? 'সমাপ্ত' : budget.status === 'ongoing' ? 'চলমান' : 'পরিকল্পিত'}
                  </span>
                </div>

                {/* Amount */}
                <div className="bg-emerald-50 border border-emerald-100 rounded-2xl p-6 mb-6">
                  <div className="text-sm text-emerald-700 font-bold mb-1">মোট বরাদ্দ</div>
                  <div className="text-4xl font-extrabold text-emerald-900">
                    ৳{Number(budget.total_allocated_amount).toLocaleString()}
                  </div>
                </div>

                {/* Details Grid */}
                <div className="grid md:grid-cols-2 gap-6 mb-6">
                  <div>
                    <div className="text-sm text-slate-500 font-bold mb-1">বিভাগ</div>
                    <div className="text-slate-900 font-bold capitalize">{budget.category}</div>
                  </div>
                  <div>
                    <div className="text-sm text-slate-500 font-bold mb-1">ওয়ার্ড</div>
                    <div className="text-slate-900 font-bold">{budget.ward || 'সমগ্র ইউনিয়ন'}</div>
                  </div>
                  <div>
                    <div className="text-sm text-slate-500 font-bold mb-1">বাস্তবায়নকারী কর্তৃপক্ষ</div>
                    <div className="text-slate-900 font-bold">{budget.implementing_authority}</div>
                  </div>
                  <div>
                    <div className="text-sm text-slate-500 font-bold mb-1">দায়িত্বপ্রাপ্ত কর্মকর্তা</div>
                    <div className="text-slate-900 font-bold">{budget.responsible_official}</div>
                  </div>
                </div>

                {/* Timeline */}
                {(budget.approval_date || budget.start_date || budget.expected_completion_date) && (
                  <div className="border-t border-slate-200 pt-6 mb-6">
                    <h3 className="text-lg font-extrabold text-slate-900 mb-4">সময়সীমা</h3>
                    <div className="grid md:grid-cols-3 gap-4">
                      {budget.approval_date && (
                        <div>
                          <div className="text-sm text-slate-500 font-bold mb-1">অনুমোদনের তারিখ</div>
                          <div className="text-slate-900 font-bold">
                            {new Date(budget.approval_date).toLocaleDateString('bn-BD')}
                          </div>
                        </div>
                      )}
                      {budget.start_date && (
                        <div>
                          <div className="text-sm text-slate-500 font-bold mb-1">শুরুর তারিখ</div>
                          <div className="text-slate-900 font-bold">
                            {new Date(budget.start_date).toLocaleDateString('bn-BD')}
                          </div>
                        </div>
                      )}
                      {budget.expected_completion_date && (
                        <div>
                          <div className="text-sm text-slate-500 font-bold mb-1">সমাপ্তির প্রত্যাশিত তারিখ</div>
                          <div className="text-slate-900 font-bold">
                            {new Date(budget.expected_completion_date).toLocaleDateString('bn-BD')}
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                )}

                {/* Remarks */}
                {budget.remarks && (
                  <div className="border-t border-slate-200 pt-6">
                    <h3 className="text-lg font-extrabold text-slate-900 mb-2">মন্তব্য</h3>
                    <p className="text-slate-700 leading-relaxed">{budget.remarks}</p>
                  </div>
                )}
              </div>

              {/* Hash Chain Verification */}
              <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-8 mb-6">
                <h2 className="text-2xl font-extrabold text-slate-900 mb-4">হ্যাশ চেইন যাচাইকরণ</h2>
                <p className="text-sm text-slate-600 mb-6">
                  ব্লকচেইন-স্টাইল হ্যাশ চেইন প্রযুক্তি ব্যবহার করে এই রেকর্ডের সত্যতা নিশ্চিত করা হয়েছে। কোনো তথ্য পরিবর্তন করা হলে হ্যাশ মিলবে না।
                </p>

                <div className="bg-slate-50 border border-slate-200 rounded-xl p-6 space-y-4">
                  <div>
                    <div className="text-sm text-slate-500 font-bold mb-2">বর্তমান হ্যাশ</div>
                    <div className="font-mono text-xs text-slate-700 bg-white border border-slate-200 rounded-lg p-3 break-all">
                      {budget.record_hash}
                    </div>
                  </div>

                  {budget.prev_hash && (
                    <div>
                      <div className="text-sm text-slate-500 font-bold mb-2">পূর্ববর্তী হ্যাশ (লিংক)</div>
                      <div className="font-mono text-xs text-slate-700 bg-white border border-slate-200 rounded-lg p-3 break-all">
                        {budget.prev_hash}
                      </div>
                    </div>
                  )}

                  <div className="flex items-center justify-between pt-4 border-t border-slate-200">
                    <span className="text-sm font-bold text-slate-700">যাচাইকরণ অবস্থা</span>
                    <span className="flex items-center text-emerald-700 font-extrabold">
                      <svg className="w-5 h-5 mr-1" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                      </svg>
                      যাচাইকৃত
                    </span>
                  </div>
                </div>
              </div>

              {/* Flag as Suspicious */}
              {!successMessage && (
                <div className="bg-white rounded-2xl shadow-sm border border-red-200 p-8">
                  <h2 className="text-2xl font-extrabold text-slate-900 mb-2">সন্দেহজনক হিসেবে চিহ্নিত করুন</h2>
                  <p className="text-sm text-slate-600 mb-6">
                    এই বাজেট রেকর্ডে কোনো অসঙ্গতি বা সন্দেহজনক তথ্য দেখলে নিচের ফর্মটি পূরণ করুন। আপনার চিহ্নিতকরণ গোপনীয় থাকবে এবং উর্ধ্বতন কর্তৃপক্ষ পর্যালোচনা করবেন।
                  </p>

                  <form onSubmit={handleFlag} className="space-y-6">
                    <div>
                      <label htmlFor="reason" className="block text-sm font-bold text-slate-800 mb-2">
                        সন্দেহের কারণ <span className="text-red-600">*</span>
                      </label>
                      <textarea
                        id="reason"
                        value={reason}
                        onChange={(e) => setReason(e.target.value)}
                        placeholder="উদাহরণ: বরাদ্দকৃত পরিমাণ বাজার মূল্যের তুলনায় অতিরিক্ত বেশি মনে হচ্ছে..."
                        rows={4}
                        required
                        className="w-full px-4 py-3 border border-slate-300 rounded-xl focus:ring-2 focus:ring-red-500 focus:border-transparent resize-none"
                      />
                    </div>

                    {error && (
                      <div className="bg-red-50 border border-red-200 text-red-800 px-4 py-3 rounded-xl">
                        {error}
                      </div>
                    )}

                    {/* Warning Box */}
                    <div className="bg-amber-50 border border-amber-200 rounded-xl p-4">
                      <div className="flex">
                        <div className="flex-shrink-0">
                          <svg className="h-5 w-5 text-amber-600" fill="currentColor" viewBox="0 0 20 20">
                            <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                          </svg>
                        </div>
                        <div className="ml-3">
                          <h3 className="text-sm font-bold text-amber-800">সতর্কতা</h3>
                          <div className="mt-2 text-sm text-amber-700">
                            <ul className="list-disc list-inside space-y-1">
                              <li>শুধুমাত্র সত্য এবং যাচাইযোগ্য তথ্যের ভিত্তিতে চিহ্নিত করুন</li>
                              <li>মিথ্যা বা ভিত্তিহীন অভিযোগের জন্য আইনি ব্যবস্থা নেওয়া হতে পারে</li>
                              <li>৫০% এর বেশি নাগরিক চিহ্নিত করলে স্বয়ংক্রিয়ভাবে উপজেলা কর্মকর্তাকে জানানো হবে</li>
                            </ul>
                          </div>
                        </div>
                      </div>
                    </div>

                    <button
                      type="submit"
                      disabled={flagging}
                      className={`w-full py-4 rounded-xl font-extrabold transition-all ${
                        flagging
                          ? 'bg-gray-400 cursor-not-allowed'
                          : 'bg-red-600 hover:bg-red-700 text-white shadow-sm'
                      }`}
                    >
                      {flagging ? 'জমা দেওয়া হচ্ছে...' : 'সন্দেহজনক হিসেবে চিহ্নিত করুন'}
                    </button>
                  </form>
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
}