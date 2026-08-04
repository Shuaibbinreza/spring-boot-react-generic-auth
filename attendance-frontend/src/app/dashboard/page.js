'use client';

import { useState, useEffect, useCallback } from 'react';
import { useAuth } from '@/context/AuthContext';
import { getCurrentUser, testEndpoint } from '@/lib/api';
import ProtectedRoute from '@/components/ProtectedRoute';

function DashboardContent() {
  const { user } = useAuth();
  const [profile, setProfile] = useState(null);
  const [endpoints, setEndpoints] = useState({
    public: { status: 'pending', message: '' },
    user: { status: 'pending', message: '' },
    admin: { status: 'pending', message: '' },
  });

  useEffect(() => {
    async function loadProfile() {
      try {
        const res = await getCurrentUser();
        setProfile(res.data);
      } catch {
        // Profile may fail if token expired; auth context handles redirect
      }
    }
    loadProfile();
  }, []);

  const testApi = useCallback(async (name) => {
    setEndpoints((prev) => ({
      ...prev,
      [name]: { status: 'pending', message: 'Testing...' },
    }));

    try {
      const res = await testEndpoint(name);
      setEndpoints((prev) => ({
        ...prev,
        [name]: { status: 'success', message: res.message || 'Access granted' },
      }));
    } catch (err) {
      setEndpoints((prev) => ({
        ...prev,
        [name]: {
          status: 'error',
          message: err.status === 403 ? 'Access Denied (403)' : err.status === 401 ? 'Unauthorized (401)' : err.message,
        },
      }));
    }
  }, []);

  const runAllTests = useCallback(() => {
    testApi('public');
    testApi('user');
    testApi('admin');
  }, [testApi]);

  const displayProfile = profile || user;

  const getPrimaryRole = () => {
    if (!displayProfile?.roles) return { label: 'USER', style: 'bg-emerald-50 text-emerald-700 border-emerald-200' };
    const roleStrings = Array.from(displayProfile.roles).map(r => typeof r === 'string' ? r : (r?.name || String(r)));
    if (roleStrings.some(r => r.includes('ADMIN'))) {
      return { label: 'ADMIN', style: 'bg-red-50 text-red-700 border-red-200' };
    }
    if (roleStrings.some(r => r.includes('MODERATOR'))) {
      return { label: 'MODERATOR', style: 'bg-amber-50 text-amber-700 border-amber-200' };
    }
    return { label: 'USER', style: 'bg-emerald-50 text-emerald-700 border-emerald-200' };
  };

  const primaryRole = getPrimaryRole();

  return (
    <div className="space-y-6">
      <div className="border-b border-maroon-200 pb-4">
        <h1 className="text-3xl font-extrabold text-maroon-700 tracking-tight">Dashboard</h1>
        <p className="text-base text-stone-600 mt-1">
          Welcome back, {displayProfile?.rank ? `${displayProfile.rank} ` : ''}{displayProfile?.fullName || displayProfile?.username || 'User'}
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Profile Card */}
        <div className="bg-white border border-maroon-300 p-6 shadow-maroon-sm hover:border-maroon-700 transition-colors">
          <div className="text-sm font-semibold text-stone-500 uppercase tracking-wider mb-4 flex items-center gap-2">
            <span className="text-base">👤</span> Profile Information
          </div>
          <div className="space-y-3 font-medium">
            <div className="flex justify-between items-center py-2 border-b border-maroon-100">
              <span className="text-sm text-stone-500">Username</span>
              <span className="text-base font-semibold text-stone-900">{displayProfile?.username || '—'}</span>
            </div>
            <div className="flex justify-between items-center py-2 border-b border-maroon-100">
              <span className="text-sm text-stone-500">Email</span>
              <span className="text-base font-semibold text-stone-900">{displayProfile?.email || '—'}</span>
            </div>
            <div className="flex justify-between items-center py-2 border-b border-maroon-100">
              <span className="text-sm text-stone-500">Full Name</span>
              <span className="text-base font-semibold text-stone-900">{displayProfile?.fullName || '—'}</span>
            </div>
            {displayProfile?.rank && (
              <div className="flex justify-between items-center py-2 border-b border-maroon-100">
                <span className="text-sm text-stone-500">Rank</span>
                <span className="text-base font-semibold text-maroon-800">{displayProfile.rank}</span>
              </div>
            )}
            {displayProfile?.designation && (
              <div className="flex justify-between items-center py-2 border-b border-maroon-100">
                <span className="text-sm text-stone-500">Designation</span>
                <span className="text-base font-semibold text-stone-900">{displayProfile.designation}</span>
              </div>
            )}
            {displayProfile?.force && (
              <div className="flex justify-between items-center py-2 border-b border-maroon-100">
                <span className="text-sm text-stone-500">Force</span>
                <span className="px-2.5 py-1 text-xs font-bold bg-maroon-50 text-maroon-700 border border-maroon-300">
                  {displayProfile.force}
                </span>
              </div>
            )}
            <div className="flex justify-between items-center py-2 border-b border-maroon-100">
              <span className="text-sm text-stone-500">User Type</span>
              <span className={`px-3 py-1 text-xs font-bold uppercase border ${primaryRole.style}`}>
                {primaryRole.label}
              </span>
            </div>
            {profile?.createdAt && (
              <div className="flex justify-between items-center py-2">
                <span className="text-sm text-stone-500">Member Since</span>
                <span className="text-base font-semibold text-stone-900">
                  {new Date(profile.createdAt).toLocaleDateString('en-US', {
                    year: 'numeric',
                    month: 'long',
                    day: 'numeric',
                  })}
                </span>
              </div>
            )}
          </div>
        </div>

        {/* API Test Card */}
        <div className="bg-white border border-maroon-300 p-6 shadow-maroon-sm hover:border-maroon-700 transition-colors">
          <div className="text-sm font-semibold text-stone-500 uppercase tracking-wider mb-4 flex items-center gap-2">
            <span className="text-base">🔒</span> Role-Based Access Test
          </div>

          <div className="space-y-3.5">
            <div className="flex items-center justify-between p-3 bg-maroon-50 border border-maroon-200">
              <span className="font-mono text-sm font-medium text-stone-800">/api/test/public</span>
              <span className="text-xs font-semibold px-2.5 py-1 border">
                {endpoints.public.status === 'pending'
                  ? '⏳ Pending'
                  : endpoints.public.status === 'success'
                  ? '✅ OK'
                  : '❌ Denied'}
              </span>
            </div>

            <div className="flex items-center justify-between p-3 bg-maroon-50 border border-maroon-200">
              <span className="font-mono text-sm font-medium text-stone-800">/api/test/user</span>
              <span className="text-xs font-semibold px-2.5 py-1 border">
                {endpoints.user.status === 'pending'
                  ? '⏳ Pending'
                  : endpoints.user.status === 'success'
                  ? '✅ OK'
                  : '❌ Denied'}
              </span>
            </div>

            <div className="flex items-center justify-between p-3 bg-maroon-50 border border-maroon-200">
              <span className="font-mono text-sm font-medium text-stone-800">/api/test/admin</span>
              <span className="text-xs font-semibold px-2.5 py-1 border">
                {endpoints.admin.status === 'pending'
                  ? '⏳ Pending'
                  : endpoints.admin.status === 'success'
                  ? '✅ OK'
                  : '❌ Denied'}
              </span>
            </div>
          </div>

          <button
            onClick={runAllTests}
            className="w-full mt-4 py-2.5 px-4 bg-maroon-700 hover:bg-maroon-800 text-white font-semibold text-sm transition-colors cursor-pointer"
          >
            Run All Endpoint Tests
          </button>
        </div>

        {/* Session Card */}
        <div className="bg-white border border-maroon-300 p-6 shadow-maroon-sm hover:border-maroon-700 transition-colors">
          <div className="text-sm font-semibold text-stone-500 uppercase tracking-wider mb-4 flex items-center gap-2">
            <span className="text-base">🔑</span> Session Information
          </div>
          <div className="space-y-3.5">
            <div className="flex justify-between items-center py-2 border-b border-maroon-100">
              <span className="text-sm text-stone-500">Auth Status</span>
              <span className="px-2.5 py-1 text-xs font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
                ✅ Authenticated
              </span>
            </div>
            <div className="flex justify-between items-center py-2 border-b border-maroon-100">
              <span className="text-sm text-stone-500">Token Type</span>
              <span className="text-base font-semibold text-stone-900">JWT Bearer</span>
            </div>
            <div className="flex justify-between items-center py-2 border-b border-maroon-100">
              <span className="text-sm text-stone-500">Storage</span>
              <span className="text-base font-semibold text-stone-900">localStorage</span>
            </div>
            <div className="flex justify-between items-center py-2">
              <span className="text-sm text-stone-500">Access Token</span>
              <span className="text-xs font-mono text-stone-600 truncate max-w-[140px]" title={typeof window !== 'undefined' ? localStorage.getItem('accessToken') : ''}>
                {typeof window !== 'undefined'
                  ? `${(localStorage.getItem('accessToken') || '').substring(0, 16)}...`
                  : '—'}
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function DashboardPage() {
  return (
    <ProtectedRoute>
      <DashboardContent />
    </ProtectedRoute>
  );
}
