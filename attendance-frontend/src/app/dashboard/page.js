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

  const getRoleBadgeClasses = (role) => {
    if (role.includes('ADMIN')) return 'bg-red-50 text-red-700 border-red-200';
    if (role.includes('MODERATOR')) return 'bg-amber-50 text-amber-700 border-amber-200';
    return 'bg-emerald-50 text-emerald-700 border-emerald-200';
  };

  return (
    <div className="space-y-6">
      <div className="border-b border-maroon-200 pb-4">
        <h1 className="text-2xl font-bold text-maroon-700 tracking-tight">Dashboard</h1>
        <p className="text-sm text-stone-600 mt-1">
          Welcome back, {displayProfile?.fullName || displayProfile?.username || 'User'}
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Profile Card */}
        <div className="bg-white border border-maroon-300 p-6 shadow-maroon-sm hover:border-maroon-700 transition-colors">
          <div className="text-xs font-semibold text-stone-500 uppercase tracking-wider mb-4 flex items-center gap-2">
            <span>👤</span> Profile Information
          </div>
          <div className="space-y-3">
            <div className="flex justify-between items-center py-1.5 border-b border-maroon-100">
              <span className="text-xs text-stone-500">Username</span>
              <span className="text-sm font-medium text-stone-900">{displayProfile?.username || '—'}</span>
            </div>
            <div className="flex justify-between items-center py-1.5 border-b border-maroon-100">
              <span className="text-xs text-stone-500">Email</span>
              <span className="text-sm font-medium text-stone-900">{displayProfile?.email || '—'}</span>
            </div>
            <div className="flex justify-between items-center py-1.5 border-b border-maroon-100">
              <span className="text-xs text-stone-500">Full Name</span>
              <span className="text-sm font-medium text-stone-900">{displayProfile?.fullName || '—'}</span>
            </div>
            <div className="flex justify-between items-center py-1.5 border-b border-maroon-100">
              <span className="text-xs text-stone-500">Roles</span>
              <div className="flex gap-1">
                {displayProfile?.roles
                  ? Array.from(displayProfile.roles).map((role) => {
                      const roleStr = typeof role === 'string' ? role : (role?.name || String(role));
                      return (
                        <span key={roleStr} className={`px-2 py-0.5 text-[10px] font-bold uppercase border ${getRoleBadgeClasses(roleStr)}`}>
                          {roleStr.replace('ROLE_', '')}
                        </span>
                      );
                    })
                  : '—'}
              </div>
            </div>
            {profile?.createdAt && (
              <div className="flex justify-between items-center py-1.5">
                <span className="text-xs text-stone-500">Member Since</span>
                <span className="text-sm font-medium text-stone-900">
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
          <div className="text-xs font-semibold text-stone-500 uppercase tracking-wider mb-4 flex items-center gap-2">
            <span>🔒</span> Role-Based Access Test
          </div>

          <div className="space-y-3">
            <div className="flex items-center justify-between p-2.5 bg-maroon-50 border border-maroon-200">
              <span className="font-mono text-xs text-stone-800">/api/test/public</span>
              <span className="text-xs font-medium px-2 py-0.5 border">
                {endpoints.public.status === 'pending'
                  ? '⏳ Pending'
                  : endpoints.public.status === 'success'
                  ? '✅ OK'
                  : '❌ Denied'}
              </span>
            </div>

            <div className="flex items-center justify-between p-2.5 bg-maroon-50 border border-maroon-200">
              <span className="font-mono text-xs text-stone-800">/api/test/user</span>
              <span className="text-xs font-medium px-2 py-0.5 border">
                {endpoints.user.status === 'pending'
                  ? '⏳ Pending'
                  : endpoints.user.status === 'success'
                  ? '✅ OK'
                  : '❌ Denied'}
              </span>
            </div>

            <div className="flex items-center justify-between p-2.5 bg-maroon-50 border border-maroon-200">
              <span className="font-mono text-xs text-stone-800">/api/test/admin</span>
              <span className="text-xs font-medium px-2 py-0.5 border">
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
            className="w-full mt-4 py-2 px-3 bg-maroon-700 hover:bg-maroon-800 text-white font-semibold text-xs transition-colors cursor-pointer"
          >
            Run All Endpoint Tests
          </button>
        </div>

        {/* Session Card */}
        <div className="bg-white border border-maroon-300 p-6 shadow-maroon-sm hover:border-maroon-700 transition-colors">
          <div className="text-xs font-semibold text-stone-500 uppercase tracking-wider mb-4 flex items-center gap-2">
            <span>🔑</span> Session Information
          </div>
          <div className="space-y-3">
            <div className="flex justify-between items-center py-1.5 border-b border-maroon-100">
              <span className="text-xs text-stone-500">Auth Status</span>
              <span className="px-2 py-0.5 text-xs font-medium bg-emerald-50 text-emerald-700 border border-emerald-200">
                ✅ Authenticated
              </span>
            </div>
            <div className="flex justify-between items-center py-1.5 border-b border-maroon-100">
              <span className="text-xs text-stone-500">Token Type</span>
              <span className="text-sm font-medium text-stone-900">JWT Bearer</span>
            </div>
            <div className="flex justify-between items-center py-1.5 border-b border-maroon-100">
              <span className="text-xs text-stone-500">Storage</span>
              <span className="text-sm font-medium text-stone-900">localStorage</span>
            </div>
            <div className="flex justify-between items-center py-1.5">
              <span className="text-xs text-stone-500">Access Token</span>
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
