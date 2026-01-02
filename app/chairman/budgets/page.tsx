// app/chairman/budgets/new/page.tsx
'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { getCurrentUser } from '@/lib/auth';

// app/chairman/budgets/new/page.tsx
// Replace lines 8-15 with this:

export default function CreateBudgetPage() {
  const router = useRouter();
  const currentUser = getCurrentUser();
  
  // Early return if no user or not chairman
  if (!currentUser || currentUser.role !== 'chairman') {
    router.push('/login');
    return null;
  }

  const [formData, setFormData] = useState({
    project_code: '',
    project_name: '',
    category: 'infrastructure',
    implementing_authority: '',
    responsible_official: '',
    approval_date: '',
    start_date: '',
    expected_completion_date: '',
    total_allocated_amount: '',
    status: 'planned',
    remarks: '',
    ward: '',
  });

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);

  // Now TypeScript knows currentUser is not null
  const user = currentUser;

  if (!user || user.role !== 'chairman') {
    router.push('/login');
    return null;
  }

  function handleChange(e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const response = await fetch('/api/budgets', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...formData,
          total_allocated_amount: Number(formData.total_allocated_amount),
          union_id: user.union_id,
          created_by: user.id,
          ward: formData.ward || null,
        }),
      });

      const data = await response.json();

      if (data.success) {
        setSuccess(true);
        setTimeout(() => {
          router.push('/chairman/dashboard');
        }, 2000);
      } else {
        setError(data.error || 'বাজেট তৈরি করতে ব্যর্থ হয়েছে');
      }
    } catch (err) {
      console.error('Create budget error:', err);
      setError('একটি ত্রুটি ঘটেছে। অনুগ্রহ করে আবার চেষ্টা করুন।');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen bg-slate-50">
      {/* Header */}
      <nav className="bg-blue-900 text-white shadow-lg">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <Link href="/chairman/dashboard" className="flex items-center space-x-3">
              <div className="h-10 w-10 rounded-xl bg-white/10 border border-white/10 flex items-center justify-center font-black">
                শে
              </div>
              <div>
                <h1 className="text-xl font-extrabold">শেবার জানালা</h1>
                <p className="text-xs text-blue-100">নতুন বাজেট তৈরি করুন</p>
              </div>
            </Link>
          </div>
        </div>
      </nav>

      {/* Main Content */}
      <div className="container mx-auto px-4 py-8">
        <div className="max-w-3xl mx-auto">
          {/* Back Button */}
          <Link
            href="/chairman/dashboard"
            className="inline-flex items-center text-blue-700 hover:text-blue-800 mb-6 font-bold"
          >
            <span className="mr-2">←</span>
            ড্যাশবোর্ডে ফিরে যান
          </Link>

          {/* Success Message */}
          {success && (
            <div className="bg-emerald-50 border border-emerald-200 rounded-2xl p-6 mb-6">
              <div className="flex items-center">
                <svg className="w-6 h-6 text-emerald-600 mr-3" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                </svg>
                <div>
                  <h3 className="font-extrabold text-emerald-900">সফল!</h3>
                  <p className="text-sm text-emerald-800 mt-1">বাজেট রেকর্ড সফলভাবে তৈরি হয়েছে। ড্যাশবোর্ডে ফিরে যাচ্ছে...</p>
                </div>
              </div>
            </div>
          )}

          {/* Form Card */}
          <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-8">
            <h2 className="text-3xl font-extrabold text-slate-900 mb-2">নতুন বাজেট রেকর্ড</h2>
            <p className="text-slate-600 mb-6">প্রকল্প বাজেট তথ্য পূরণ করুন (হ্যাশ চেইন স্বয়ংক্রিয়ভাবে তৈরি হবে)</p>

            <form onSubmit={handleSubmit} className="space-y-6">
              {/* Basic Info */}
              <div className="grid md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-bold text-slate-900 mb-2">
                    প্রকল্প কোড <span className="text-red-600">*</span>
                  </label>
                  <input
                    type="text"
                    name="project_code"
                    value={formData.project_code}
                    onChange={handleChange}
                    placeholder="যেমন: UP-2025-001"
                    required
                    className="w-full px-4 py-3 border border-slate-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>

                <div>
                  <label className="block text-sm font-bold text-slate-900 mb-2">
                    ওয়ার্ড (ঐচ্ছিক)
                  </label>
                  <input
                    type="text"
                    name="ward"
                    value={formData.ward}
                    onChange={handleChange}
                    placeholder="যেমন: ওয়ার্ড ১"
                    className="w-full px-4 py-3 border border-slate-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-bold text-slate-900 mb-2">
                  প্রকল্পের নাম <span className="text-red-600">*</span>
                </label>
                <input
                  type="text"
                  name="project_name"
                  value={formData.project_name}
                  onChange={handleChange}
                  placeholder="যেমন: গ্রামীণ রাস্তা নির্মাণ প্রকল্প"
                  required
                  className="w-full px-4 py-3 border border-slate-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>

              <div className="grid md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-bold text-slate-900 mb-2">
                    বিভাগ <span className="text-red-600">*</span>
                  </label>
                  <select
                    name="category"
                    value={formData.category}
                    onChange={handleChange}
                    required
                    className="w-full px-4 py-3 border border-slate-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  >
                    <option value="infrastructure">অবকাঠামো</option>
                    <option value="education">শিক্ষা</option>
                    <option value="health">স্বাস্থ্য</option>
                    <option value="agriculture">কৃষি</option>
                    <option value="sanitation">পয়ঃনিষ্কাশন</option>
                    <option value="social_welfare">সমাজকল্যাণ</option>
                    <option value="other">অন্যান্য</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-bold text-slate-900 mb-2">
                    মোট বরাদ্দ (টাকা) <span className="text-red-600">*</span>
                  </label>
                  <input
                    type="number"
                    name="total_allocated_amount"
                    value={formData.total_allocated_amount}
                    onChange={handleChange}
                    placeholder="যেমন: 500000"
                    required
                    min="0"
                    className="w-full px-4 py-3 border border-slate-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>
              </div>

              {/* Authority Info */}
              <div className="grid md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-bold text-slate-900 mb-2">
                    বাস্তবায়নকারী কর্তৃপক্ষ <span className="text-red-600">*</span>
                  </label>
                  <input
                    type="text"
                    name="implementing_authority"
                    value={formData.implementing_authority}
                    onChange={handleChange}
                    placeholder="যেমন: ইউনিয়ন পরিষদ"
                    required
                    className="w-full px-4 py-3 border border-slate-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>

                <div>
                  <label className="block text-sm font-bold text-slate-900 mb-2">
                    দায়িত্বপ্রাপ্ত কর্মকর্তা <span className="text-red-600">*</span>
                  </label>
                  <input
                    type="text"
                    name="responsible_official"
                    value={formData.responsible_official}
                    onChange={handleChange}
                    placeholder="যেমন: প্রকৌশলী মোঃ রহিম"
                    required
                    className="w-full px-4 py-3 border border-slate-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>
              </div>

              {/* Timeline */}
              <div className="grid md:grid-cols-3 gap-6">
                <div>
                  <label className="block text-sm font-bold text-slate-900 mb-2">অনুমোদনের তারিখ</label>
                  <input
                    type="date"
                    name="approval_date"
                    value={formData.approval_date}
                    onChange={handleChange}
                    className="w-full px-4 py-3 border border-slate-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>

                <div>
                  <label className="block text-sm font-bold text-slate-900 mb-2">শুরুর তারিখ</label>
                  <input
                    type="date"
                    name="start_date"
                    value={formData.start_date}
                    onChange={handleChange}
                    className="w-full px-4 py-3 border border-slate-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>

                <div>
                  <label className="block text-sm font-bold text-slate-900 mb-2">সমাপ্তির তারিখ</label>
                  <input
                    type="date"
                    name="expected_completion_date"
                    value={formData.expected_completion_date}
                    onChange={handleChange}
                    className="w-full px-4 py-3 border border-slate-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-bold text-slate-900 mb-2">অবস্থা</label>
                <select
                  name="status"
                  value={formData.status}
                  onChange={handleChange}
                  className="w-full px-4 py-3 border border-slate-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  <option value="planned">পরিকল্পিত</option>
                  <option value="ongoing">চলমান</option>
                  <option value="completed">সমাপ্ত</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-bold text-slate-900 mb-2">মন্তব্য (ঐচ্ছিক)</label>
                <textarea
                  name="remarks"
                  value={formData.remarks}
                  onChange={handleChange}
                  rows={4}
                  placeholder="অতিরিক্ত তথ্য বা মন্তব্য..."
                  className="w-full px-4 py-3 border border-slate-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
                />
              </div>

              {error && (
                <div className="bg-red-50 border border-red-200 text-red-800 px-4 py-3 rounded-xl">
                  {error}
                </div>
              )}

              {/* Info Box */}
              <div className="bg-blue-50 border border-blue-200 rounded-xl p-4">
                <div className="flex">
                  <div className="flex-shrink-0">
                    <svg className="h-5 w-5 text-blue-600" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
                    </svg>
                  </div>
                  <div className="ml-3">
                    <h3 className="text-sm font-bold text-blue-900">হ্যাশ চেইন স্বয়ংক্রিয়ভাবে তৈরি হবে</h3>
                    <p className="mt-2 text-sm text-blue-800">
                      এই বাজেট রেকর্ড ব্লকচেইন-স্টাইল হ্যাশ চেইনের সাথে যুক্ত হবে যা কোনো তথ্য পরিবর্তন রোধ করবে।
                    </p>
                  </div>
                </div>
              </div>

              {/* Submit Button */}
              <button
                type="submit"
                disabled={loading}
                className={`w-full py-4 rounded-xl font-extrabold text-white transition-all ${
                  loading
                    ? 'bg-gray-400 cursor-not-allowed'
                    : 'bg-blue-600 hover:bg-blue-700 shadow-lg'
                }`}
              >
                {loading ? 'তৈরি করা হচ্ছে...' : 'বাজেট রেকর্ড তৈরি করুন'}
              </button>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
}