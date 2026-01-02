// app/page.tsx
'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';

export default function HomePage() {
  const router = useRouter();

  useEffect(() => {
    // Redirect to login page
    router.replace('/login');
  }, [router]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-emerald-50 via-white to-emerald-50">
      <div className="text-center">
        <div className="inline-flex items-center justify-center h-20 w-20 rounded-2xl bg-emerald-900 text-white text-4xl font-black mb-4 shadow-lg animate-pulse">
          শে
        </div>
        <div className="text-xl font-bold text-slate-700">শেবার জানালায় স্বাগতম...</div>
      </div>
    </div>
  );
}