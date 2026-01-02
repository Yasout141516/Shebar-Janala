'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { getCurrentUser, logout } from '@/lib/auth';
import { User } from '@/types';

export default function SubmitIssuePage() {
  const router = useRouter();
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const [formData, setFormData] = useState({
    title: '',
    description: '',
    ward: '',
  });

  useEffect(() => {
    const currentUser = getCurrentUser();
    if (!currentUser || currentUser.role !== 'citizen') {
      router.push('/login');
      return;
    }
    setUser(currentUser);
  }, [router]);

  function handleChange(
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>
  ) {
    setFormData((prev) => ({
      ...prev,
      [e.target.name]: e.target.value,
    }));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();

    if (!user) return;

    if (!formData.title.trim() || !formData.description.trim()) {
      setError('শিরোনাম ও বিস্তারিত বিবরণ বাধ্যতামূলক।');
      return;
    }

    setLoading(true);
    setError('');

    try {
      const response = await fetch('/api/issues', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: formData.title.trim(),
          description: formData.description.trim(),
          ward: formData.ward || undefined,
          union_id: user.union_id,
          created_by: user.id,
        }),
      });

      const data = await response.json();

      if (data.success) {
        alert('অভিযোগ/সমস্যা সফলভাবে জমা হয়েছে। প্রশাসনিক যাচাই শেষে এটি প্রকাশ করা হবে।');
        router.push('/citizen/dashboard');
      } else {
        setError(data.error || 'সমস্যা জমা দিতে ব্যর্থ হয়েছে। অনুগ্রহ করে আবার চেষ্টা করুন।');
      }
    } catch {
      setError('একটি ত্রুটি ঘটেছে। অনুগ্রহ করে কিছুক্ষণ পর আবার চেষ্টা করুন।');
    } finally {
      setLoading(false);
    }
  }

  function handleLogout() {
    logout();
    router.push('/login');
  }

  if (!user) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50">
        <div className="text-lg font-semibold text-slate-700">লোড হচ্ছে...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50">
      {/* Navbar */}
      <nav className="bg-emerald-900 text-white shadow-lg">
        <div className="container mx-auto px-4">
          <div className="flex items-center justify-between py-4">
            {/* Brand */}
            <div className="flex items-center">
              <Link href="/citizen/dashboard" className="flex items-center">
                <div className="h-10 w-10 rounded-xl bg-white/10 border border-white/10 flex items-center justify-center font-black">
                  শে
                </div>
                <div className="ml-3">
                  <h1 className="text-xl sm:text-2xl font-extrabold tracking-tight">শেবার জানালা</h1>
                  <p className="text-xs sm:text-sm text-emerald-100">
                    ইউনিয়ন পরিষদ সেবা ও স্বচ্ছতা পোর্টাল
                  </p>
                </div>
              </Link>
            </div>

            {/* User + Logout */}
            <div className="flex items-center space-x-4">
              <div className="text-right hidden sm:block">
                <div className="font-bold">{user.name}</div>
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
        </div>
      </nav>

      {/* Main Content */}
      <div className="container mx-auto px-4 py-8">
        <div className="max-w-3xl mx-auto">
          {/* Header Card */}
          <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-6 mb-6">
            <Link
              href="/citizen/dashboard"
              className="inline-flex items-center text-emerald-700 hover:text-emerald-800 font-bold"
            >
              <span className="mr-2">←</span>
              ড্যাশবোর্ডে ফিরে যান
            </Link>

            <div className="mt-4">
              <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900">
                নতুন অভিযোগ/সমস্যা জমা দিন
              </h1>
              <p className="text-sm text-slate-600 mt-2">
                অনুগ্রহ করে আপনার এলাকার সমস্যা বা অভিযোগ নির্ভুলভাবে উল্লেখ করুন। জমাকৃত তথ্য প্রশাসনিক যাচাই শেষে
                প্রকাশ করা হবে।
              </p>
            </div>
          </div>

          {/* Form Card */}
          <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-6 sm:p-8">
            <form onSubmit={handleSubmit} className="space-y-6">
              {/* Title */}
              <div>
                <label htmlFor="title" className="block text-sm font-extrabold text-slate-900 mb-2">
                  অভিযোগ/সমস্যার শিরোনাম <span className="text-red-600">*</span>
                </label>
                <input
                  type="text"
                  id="title"
                  name="title"
                  value={formData.title}
                  onChange={handleChange}
                  placeholder="উদাহরণ: বিদ্যালয়ের সামনে সড়ক ক্ষতিগ্রস্ত"
                  maxLength={200}
                  required
                  className="w-full px-4 py-3 border border-slate-300 rounded-xl focus:ring-2 focus:ring-emerald-700 focus:border-transparent"
                />
                <div className="text-xs text-slate-500 mt-1 font-semibold">
                  সর্বোচ্চ ২০০ অক্ষর ({formData.title.length}/200)
                </div>
              </div>

              {/* Description */}
              <div>
                <label htmlFor="description" className="block text-sm font-extrabold text-slate-900 mb-2">
                  বিস্তারিত বিবরণ <span className="text-red-600">*</span>
                </label>
                <textarea
                  id="description"
                  name="description"
                  value={formData.description}
                  onChange={handleChange}
                  placeholder="সমস্যাটি কোথায়, কবে থেকে, কী ধরনের ক্ষতি/ভোগান্তি হচ্ছে—এসব বিস্তারিত লিখুন..."
                  rows={7}
                  required
                  className="w-full px-4 py-3 border border-slate-300 rounded-xl focus:ring-2 focus:ring-emerald-700 focus:border-transparent resize-none"
                />
              </div>

              {/* Ward */}
              <div>
                <label htmlFor="ward" className="block text-sm font-extrabold text-slate-900 mb-2">
                  ওয়ার্ড (ঐচ্ছিক)
                </label>
                <select
                  id="ward"
                  name="ward"
                  value={formData.ward}
                  onChange={handleChange}
                  className="w-full px-4 py-3 border border-slate-300 rounded-xl focus:ring-2 focus:ring-emerald-700 focus:border-transparent"
                >
                  <option value="">ওয়ার্ড নির্বাচন করুন...</option>
                  <option value="Ward 1">ওয়ার্ড ১</option>
                  <option value="Ward 2">ওয়ার্ড ২</option>
                  <option value="Ward 3">ওয়ার্ড ৩</option>
                  <option value="Ward 4">ওয়ার্ড ৪</option>
                  <option value="Ward 5">ওয়ার্ড ৫</option>
                  <option value="Ward 6">ওয়ার্ড ৬</option>
                  <option value="Ward 7">ওয়ার্ড ৭</option>
                  <option value="Ward 8">ওয়ার্ড ৮</option>
                  <option value="Ward 9">ওয়ার্ড ৯</option>
                </select>
              </div>

              {/* Error */}
              {error && (
                <div className="bg-red-50 border border-red-200 text-red-800 px-4 py-3 rounded-xl font-semibold">
                  {error}
                </div>
              )}

              {/* Info Box */}
              <div className="bg-slate-50 border border-slate-200 rounded-2xl p-5">
                <div className="flex">
                  <div className="flex-shrink-0">
                    <svg className="h-5 w-5 text-slate-600" fill="currentColor" viewBox="0 0 20 20">
                      <path
                        fillRule="evenodd"
                        d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z"
                        clipRule="evenodd"
                      />
                    </svg>
                  </div>
                  <div className="ml-3">
                    <h3 className="text-sm font-extrabold text-slate-900">পরবর্তী ধাপ কী?</h3>
                    <div className="mt-2 text-sm text-slate-700">
                      <ul className="list-disc list-inside space-y-1">
                        <li>আপনার জমাকৃত অভিযোগ/সমস্যা প্রশাসক যাচাই করবেন</li>
                        <li>অনুমোদিত হলে এটি কমিউনিটি ফিডে প্রকাশ হবে</li>
                        <li>অন্যান্য নাগরিক ভোট দিয়ে সমর্থন জানাতে পারবেন</li>
                        <li>বেশি সমর্থনপ্রাপ্ত সমস্যাগুলো কর্তৃপক্ষের নজরে দ্রুত আসে</li>
                      </ul>
                    </div>
                    <p className="mt-3 text-xs text-slate-600 font-semibold">
                      তথ্যের সত্যতা নিশ্চিত করুন। ইচ্ছাকৃত ভুল তথ্য প্রদান করলে অভিযোগ বাতিল হতে পারে।
                    </p>
                  </div>
                </div>
              </div>

              {/* Buttons */}
              <div className="flex flex-col sm:flex-row gap-3 sm:gap-4">
                <button
                  type="submit"
                  disabled={loading}
                  className={`flex-1 py-3 px-6 rounded-xl font-extrabold transition-all shadow-sm ${
                    loading
                      ? 'bg-slate-300 cursor-not-allowed text-slate-700'
                      : 'bg-emerald-700 hover:bg-emerald-800 text-white'
                  }`}
                >
                  {loading ? 'জমা দেওয়া হচ্ছে...' : 'জমা দিন'}
                </button>

                <Link
                  href="/citizen/dashboard"
                  className="flex-1 sm:flex-none text-center px-6 py-3 border border-slate-300 rounded-xl font-extrabold text-slate-900 hover:bg-slate-50 transition"
                >
                  বাতিল
                </Link>
              </div>
            </form>

            <div className="mt-6 text-xs text-slate-500">
              <p className="font-semibold">
                এটি একটি ডেমো সংস্করণ। বাস্তব ব্যবহারে জাতীয় পরিচয়পত্র/পরিচয় যাচাইকরণ এবং যাচাইযোগ্য প্রমাণ যুক্ত করার
                ব্যবস্থা থাকতে পারে।
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
