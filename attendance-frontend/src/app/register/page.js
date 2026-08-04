'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/context/AuthContext';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

export default function RegisterPage() {
  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [fullName, setFullName] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [formError, setFormError] = useState('');
  const { register, isAuthenticated, loading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!loading && isAuthenticated) {
      router.replace('/dashboard');
    }
  }, [isAuthenticated, loading, router]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setFormError('');

    if (password !== confirmPassword) {
      setFormError('Passwords do not match.');
      return;
    }

    if (password.length < 6) {
      setFormError('Password must be at least 6 characters.');
      return;
    }

    setSubmitting(true);

    try {
      await register(username, email, password, fullName);
      router.push('/dashboard');
    } catch (err) {
      setFormError(err.message || 'Registration failed. Please try again.');
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
        <h1 className="text-2xl font-bold text-maroon-700 tracking-tight text-center">Create Account</h1>
        <p className="text-sm text-stone-500 mb-6 mt-1 text-center">Join the attendance system</p>

        {formError && (
          <div className="p-3 bg-red-50 text-red-700 border border-red-200 text-xs mb-4">
            {formError}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label htmlFor="fullName" className="block text-xs font-semibold text-stone-700 uppercase tracking-wider mb-1.5">
              Full Name
            </label>
            <input
              id="fullName"
              type="text"
              placeholder="Enter your full name"
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
              autoComplete="name"
              className="w-full px-3.5 py-2 bg-white border border-maroon-300 text-stone-900 text-sm focus:outline-none focus:border-maroon-700 focus:ring-1 focus:ring-maroon-700"
            />
          </div>

          <div>
            <label htmlFor="username" className="block text-xs font-semibold text-stone-700 uppercase tracking-wider mb-1.5">
              Username
            </label>
            <input
              id="username"
              type="text"
              placeholder="Choose a username"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              required
              autoComplete="username"
              className="w-full px-3.5 py-2 bg-white border border-maroon-300 text-stone-900 text-sm focus:outline-none focus:border-maroon-700 focus:ring-1 focus:ring-maroon-700"
            />
          </div>

          <div>
            <label htmlFor="email" className="block text-xs font-semibold text-stone-700 uppercase tracking-wider mb-1.5">
              Email
            </label>
            <input
              id="email"
              type="email"
              placeholder="Enter your email address"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              autoComplete="email"
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
              placeholder="Create a password (min 6 chars)"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              autoComplete="new-password"
              className="w-full px-3.5 py-2 bg-white border border-maroon-300 text-stone-900 text-sm focus:outline-none focus:border-maroon-700 focus:ring-1 focus:ring-maroon-700"
            />
          </div>

          <div>
            <label htmlFor="confirmPassword" className="block text-xs font-semibold text-stone-700 uppercase tracking-wider mb-1.5">
              Confirm Password
            </label>
            <input
              id="confirmPassword"
              type="password"
              placeholder="Confirm your password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              required
              autoComplete="new-password"
              className="w-full px-3.5 py-2 bg-white border border-maroon-300 text-stone-900 text-sm focus:outline-none focus:border-maroon-700 focus:ring-1 focus:ring-maroon-700"
            />
          </div>

          <button
            type="submit"
            disabled={submitting}
            className="w-full py-2.5 px-4 bg-maroon-700 hover:bg-maroon-800 text-white font-semibold text-sm transition-colors shadow-sm disabled:opacity-50 cursor-pointer mt-2"
          >
            {submitting ? 'Creating account...' : 'Create Account'}
          </button>
        </form>

        <div className="text-center mt-6 text-xs text-stone-600">
          Already have an account?{' '}
          <Link href="/login" className="font-semibold text-maroon-700 hover:underline">
            Sign in
          </Link>
        </div>
      </div>
    </div>
  );
}
