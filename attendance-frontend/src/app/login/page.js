'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/context/AuthContext';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

export default function LoginPage() {
  const [usernameOrEmail, setUsernameOrEmail] = useState('');
  const [password, setPassword] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [formError, setFormError] = useState('');
  const { login, isAuthenticated, loading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!loading && isAuthenticated) {
      router.replace('/dashboard');
    }
  }, [isAuthenticated, loading, router]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setFormError('');
    setSubmitting(true);

    try {
      await login(usernameOrEmail, password);
      router.push('/dashboard');
    } catch (err) {
      setFormError(err.message || 'Invalid credentials. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[70vh]">
        <div className="w-10 h-10 border-4 border-maroon-200 border-t-maroon-700 animate-spin rounded-full" />
      </div>
    );
  }

  return (
    <div className="flex items-center justify-center min-h-[85vh] p-4">
      <div className="w-full max-w-md bg-white border border-maroon-300 p-8 shadow-maroon-md">
        <div className="flex justify-center mb-6">
          <img src="/logo.png" alt="AMC Logo" className="h-20 w-auto object-contain" />
        </div>
        <h1 className="text-2xl font-bold text-maroon-700 tracking-tight text-center">Welcome Back</h1>
        <p className="text-sm text-stone-500 mb-6 mt-1 text-center">Sign in to your account to continue</p>

        {formError && (
          <div className="p-3 bg-red-50 text-red-700 border border-red-200 text-xs mb-4">
            {formError}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label htmlFor="usernameOrEmail" className="block text-xs font-semibold text-stone-700 uppercase tracking-wider mb-1.5">
              Username or Email
            </label>
            <input
              id="usernameOrEmail"
              type="text"
              placeholder="Enter your username or email"
              value={usernameOrEmail}
              onChange={(e) => setUsernameOrEmail(e.target.value)}
              required
              autoComplete="username"
              className="w-full px-3.5 py-2 bg-white border border-maroon-300 text-stone-900 text-sm focus:outline-none focus:border-maroon-700 focus:ring-1 focus:ring-maroon-700"
            />
          </div>

          <div>
            <label htmlFor="password" className="block text-xs font-semibold text-stone-700 uppercase tracking-wider mb-1.5">
              Password
            </label>
            <input
              id="password"
              type="password"
              placeholder="Enter your password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              autoComplete="current-password"
              className="w-full px-3.5 py-2 bg-white border border-maroon-300 text-stone-900 text-sm focus:outline-none focus:border-maroon-700 focus:ring-1 focus:ring-maroon-700"
            />
          </div>

          <button
            type="submit"
            disabled={submitting}
            className="w-full py-2.5 px-4 bg-maroon-700 hover:bg-maroon-800 text-white font-semibold text-sm transition-colors shadow-sm disabled:opacity-50 cursor-pointer mt-2"
          >
            {submitting ? 'Signing in...' : 'Sign In'}
          </button>
        </form>

        <div className="text-center mt-6 text-xs text-stone-600">
          Don&apos;t have an account?{' '}
          <Link href="/register" className="font-semibold text-maroon-700 hover:underline">
            Create one
          </Link>
        </div>
      </div>
    </div>
  );
}
