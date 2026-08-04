'use client';

import { useEffect } from 'react';
import { useAuth } from '@/context/AuthContext';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

export default function RegisterPage() {
  const { isAuthenticated, loading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!loading && isAuthenticated) {
      router.replace('/dashboard');
    }
  }, [isAuthenticated, loading, router]);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[70vh]">
        <div className="w-10 h-10 border-4 border-maroon-200 border-t-maroon-700 animate-spin rounded-full" />
      </div>
    );
  }

  return (
    <div className="flex items-center justify-center min-h-[85vh] p-4">
      <div className="w-full max-w-md bg-white border border-maroon-300 p-8 shadow-maroon-md text-center">
        <div className="flex justify-center mb-6">
          <img src="/logo.png" alt="AMC Logo" className="h-20 w-auto object-contain" />
        </div>
        <div className="w-12 h-12 bg-amber-50 border border-amber-200 text-amber-700 text-2xl flex items-center justify-center mx-auto mb-4">
          🔒
        </div>
        <h1 className="text-2xl font-extrabold text-stone-900 tracking-tight">Registration Restricted</h1>
        <p className="text-sm text-stone-600 my-4 leading-relaxed">
          Public self-registration is disabled. New user accounts can only be created by an authorized <strong>System Administrator</strong> via the Admin Panel.
        </p>

        <div className="pt-4 border-t border-maroon-100">
          <Link
            href="/login"
            className="block w-full py-3 px-4 bg-maroon-700 hover:bg-maroon-800 text-white font-bold text-sm transition-colors cursor-pointer"
          >
            Return to Login Page
          </Link>
        </div>
      </div>
    </div>
  );
}
