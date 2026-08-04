'use client';

import { useState, useEffect, useCallback } from 'react';
import ProtectedRoute from '@/components/ProtectedRoute';
import { getAllUsers, adminCreateUser } from '@/lib/api';

function AdminUsersContent() {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [message, setMessage] = useState({ type: '', text: '' });

  const [form, setForm] = useState({
    username: '',
    email: '',
    fullName: '',
    password: '',
    role: 'ROLE_USER',
    rank: '',
    designation: '',
    force: '',
  });

  const loadUsers = useCallback(async () => {
    setLoading(true);
    try {
      const res = await getAllUsers();
      setUsers(res.data || []);
    } catch (err) {
      setMessage({ type: 'error', text: err.message || 'Failed to load user directory' });
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadUsers();
  }, [loadUsers]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    setMessage({ type: '', text: '' });

    try {
      await adminCreateUser({
        username: form.username.trim(),
        email: form.email.trim(),
        password: form.password,
        fullName: form.fullName.trim(),
        rank: form.rank.trim() || null,
        designation: form.designation.trim() || null,
        force: form.force || null,
        roles: [form.role],
      });

      setMessage({ type: 'success', text: `User account "${form.username}" created successfully!` });
      setForm({
        username: '',
        email: '',
        fullName: '',
        password: '',
        role: 'ROLE_USER',
        rank: '',
        designation: '',
        force: '',
      });
      await loadUsers();
    } catch (err) {
      setMessage({ type: 'error', text: err.message || 'Failed to create user account' });
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="border-b border-maroon-200 pb-4">
        <h1 className="text-3xl font-extrabold text-maroon-700 tracking-tight">User Management & Registration</h1>
        <p className="text-base text-stone-600 mt-1">
          Register new system users, assign roles, and record rank, designation, or force affiliations.
        </p>
      </div>

      {message.text && (
        <div className={`p-4 text-sm font-semibold border flex items-center gap-2 ${
          message.type === 'success' ? 'bg-emerald-50 text-emerald-800 border-emerald-200' : 'bg-red-50 text-red-800 border-red-200'
        }`}>
          <span>{message.type === 'success' ? '✅' : '⚠️'}</span>
          <span>{message.text}</span>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Admin Register User Form */}
        <div className="bg-white border border-maroon-300 p-6 shadow-maroon-sm lg:col-span-1">
          <div className="text-sm font-semibold text-stone-500 uppercase tracking-wider mb-4 flex items-center gap-2">
            <span>👤</span> Register New User Account
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label htmlFor="fullName" className="block text-xs font-bold text-stone-700 uppercase tracking-wider mb-1.5">
                Full Name <span className="text-red-500">*</span>
              </label>
              <input
                id="fullName"
                type="text"
                placeholder="Enter full name"
                value={form.fullName}
                onChange={(e) => setForm({ ...form, fullName: e.target.value })}
                required
                className="w-full px-4 py-2.5 bg-white border border-maroon-300 text-stone-900 text-base focus:outline-none focus:border-maroon-700 focus:ring-1 focus:ring-maroon-700"
              />
            </div>

            <div>
              <label htmlFor="username" className="block text-xs font-bold text-stone-700 uppercase tracking-wider mb-1.5">
                Username <span className="text-red-500">*</span>
              </label>
              <input
                id="username"
                type="text"
                placeholder="Choose username"
                value={form.username}
                onChange={(e) => setForm({ ...form, username: e.target.value })}
                required
                className="w-full px-4 py-2.5 bg-white border border-maroon-300 text-stone-900 text-base focus:outline-none focus:border-maroon-700 focus:ring-1 focus:ring-maroon-700"
              />
            </div>

            <div>
              <label htmlFor="email" className="block text-xs font-bold text-stone-700 uppercase tracking-wider mb-1.5">
                Email Address <span className="text-red-500">*</span>
              </label>
              <input
                id="email"
                type="email"
                placeholder="Enter email address"
                value={form.email}
                onChange={(e) => setForm({ ...form, email: e.target.value })}
                required
                className="w-full px-4 py-2.5 bg-white border border-maroon-300 text-stone-900 text-base focus:outline-none focus:border-maroon-700 focus:ring-1 focus:ring-maroon-700"
              />
            </div>

            <div>
              <label htmlFor="password" className="block text-xs font-bold text-stone-700 uppercase tracking-wider mb-1.5">
                Initial Password <span className="text-red-500">*</span>
              </label>
              <input
                id="password"
                type="password"
                placeholder="Create password (min 6 chars)"
                value={form.password}
                onChange={(e) => setForm({ ...form, password: e.target.value })}
                required
                minLength={6}
                className="w-full px-4 py-2.5 bg-white border border-maroon-300 text-stone-900 text-base focus:outline-none focus:border-maroon-700 focus:ring-1 focus:ring-maroon-700"
              />
            </div>

            <div>
              <label htmlFor="role" className="block text-xs font-bold text-stone-700 uppercase tracking-wider mb-1.5">
                Assigned Role <span className="text-red-500">*</span>
              </label>
              <select
                id="role"
                value={form.role}
                onChange={(e) => setForm({ ...form, role: e.target.value })}
                className="w-full px-4 py-2.5 bg-white border border-maroon-300 text-stone-900 text-base focus:outline-none focus:border-maroon-700 focus:ring-1 focus:ring-maroon-700"
              >
                <option value="ROLE_USER">Standard User (ROLE_USER)</option>
                <option value="ROLE_ADMIN">Administrator (ROLE_ADMIN)</option>
              </select>
            </div>

            {/* Optional Fields Section */}
            <div className="border-t border-maroon-200 pt-4 mt-2 space-y-4">
              <div className="text-xs font-bold text-maroon-700 uppercase tracking-wider">
                Optional Profile Fields
              </div>

              <div>
                <label htmlFor="rank" className="block text-xs font-bold text-stone-600 uppercase tracking-wider mb-1.5">
                  Rank <span className="text-stone-400 font-normal">(Optional)</span>
                </label>
                <input
                  id="rank"
                  type="text"
                  placeholder="e.g. Major, Captain, Lieutenant, Director"
                  value={form.rank}
                  onChange={(e) => setForm({ ...form, rank: e.target.value })}
                  className="w-full px-4 py-2.5 bg-white border border-maroon-300 text-stone-900 text-base focus:outline-none focus:border-maroon-700 focus:ring-1 focus:ring-maroon-700"
                />
              </div>

              <div>
                <label htmlFor="designation" className="block text-xs font-bold text-stone-600 uppercase tracking-wider mb-1.5">
                  Designation <span className="text-stone-400 font-normal">(Optional)</span>
                </label>
                <input
                  id="designation"
                  type="text"
                  placeholder="e.g. Staff Officer, Executive Assistant, IT Lead"
                  value={form.designation}
                  onChange={(e) => setForm({ ...form, designation: e.target.value })}
                  className="w-full px-4 py-2.5 bg-white border border-maroon-300 text-stone-900 text-base focus:outline-none focus:border-maroon-700 focus:ring-1 focus:ring-maroon-700"
                />
              </div>

              <div>
                <label htmlFor="force" className="block text-xs font-bold text-stone-600 uppercase tracking-wider mb-1.5">
                  Force <span className="text-stone-400 font-normal">(Optional)</span>
                </label>
                <select
                  id="force"
                  value={form.force}
                  onChange={(e) => setForm({ ...form, force: e.target.value })}
                  className="w-full px-4 py-2.5 bg-white border border-maroon-300 text-stone-900 text-base focus:outline-none focus:border-maroon-700 focus:ring-1 focus:ring-maroon-700"
                >
                  <option value="">-- None / Civil --</option>
                  <option value="Army">Army</option>
                  <option value="Navy">Navy</option>
                  <option value="Air Force">Air Force</option>
                  <option value="Civil">Civil</option>
                </select>
              </div>
            </div>

            <button
              type="submit"
              disabled={submitting}
              className="w-full py-3 px-4 bg-maroon-700 hover:bg-maroon-800 text-white font-bold text-base transition-colors shadow-sm disabled:opacity-50 cursor-pointer mt-2"
            >
              {submitting ? 'Creating Account...' : '➕ Register User Account'}
            </button>
          </form>
        </div>

        {/* System User Directory Table */}
        <div className="bg-white border border-maroon-300 p-6 shadow-maroon-sm lg:col-span-2">
          <div className="text-sm font-semibold text-stone-500 uppercase tracking-wider mb-4 flex items-center justify-between">
            <span className="flex items-center gap-2">
              <span>📋</span> Registered System Users ({users.length})
            </span>
          </div>

          {loading ? (
            <p className="text-sm text-stone-500">Loading user directory...</p>
          ) : users.length === 0 ? (
            <p className="text-base text-stone-500 py-6 text-center">No system users found.</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-base">
                <thead>
                  <tr className="border-b border-maroon-300 text-stone-500 text-xs font-bold uppercase tracking-wider">
                    <th className="py-3 px-3">User</th>
                    <th className="py-3 px-3">Rank & Designation</th>
                    <th className="py-3 px-3">Force</th>
                    <th className="py-3 px-3">Email</th>
                    <th className="py-3 px-3">Role</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-maroon-100">
                  {users.map((u) => {
                    const isAdmin = u.roles && Array.from(u.roles).some(r => {
                      const rStr = typeof r === 'string' ? r : r?.name || '';
                      return rStr.includes('ADMIN');
                    });

                    return (
                      <tr key={u.id || u.username} className="hover:bg-maroon-100/50 transition-colors">
                        <td className="py-3.5 px-3">
                          <strong className="text-stone-900 font-bold">{u.fullName || u.username}</strong>
                          <div className="text-xs text-stone-500">@{u.username}</div>
                        </td>
                        <td className="py-3.5 px-3 text-sm text-stone-700">
                          {u.rank || u.designation ? (
                            <div>
                              {u.rank && <span className="font-semibold text-maroon-800">{u.rank}</span>}
                              {u.rank && u.designation && <span className="mx-1 text-stone-400">•</span>}
                              {u.designation && <span className="text-stone-600">{u.designation}</span>}
                            </div>
                          ) : (
                            <span className="text-stone-400">—</span>
                          )}
                        </td>
                        <td className="py-3.5 px-3">
                          {u.force ? (
                            <span className="px-2.5 py-1 text-xs font-bold bg-maroon-50 text-maroon-700 border border-maroon-300">
                              {u.force}
                            </span>
                          ) : (
                            <span className="text-stone-400">—</span>
                          )}
                        </td>
                        <td className="py-3.5 px-3 text-stone-700">{u.email}</td>
                        <td className="py-3.5 px-3">
                          <span className={`px-2.5 py-1 text-xs font-bold ${
                            isAdmin
                              ? 'bg-red-50 text-red-700 border border-red-200'
                              : 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                          }`}>
                            {isAdmin ? 'ADMIN' : 'USER'}
                          </span>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default function AdminUsersPage() {
  return (
    <ProtectedRoute>
      <AdminUsersContent />
    </ProtectedRoute>
  );
}
