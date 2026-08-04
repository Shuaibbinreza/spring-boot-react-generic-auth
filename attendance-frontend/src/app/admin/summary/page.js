'use client';

import { useState, useEffect, useCallback } from 'react';
import ProtectedRoute from '@/components/ProtectedRoute';
import { getAdminGroups, getAttendanceSummary } from '@/lib/api';

function SummaryContent() {
  const [groups, setGroups] = useState([]);
  const [summary, setSummary] = useState(null);
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState({ type: '', text: '' });

  // Filter state
  const defaultStart = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];
  const defaultEnd = new Date().toISOString().split('T')[0];

  const [filters, setFilters] = useState({
    groupId: '',
    startDate: defaultStart,
    endDate: defaultEnd,
  });

  const loadSummaryData = useCallback(async (currentFilters) => {
    setLoading(true);
    try {
      const [groupsRes, summaryRes] = await Promise.all([
        getAdminGroups().catch(() => ({ data: [] })),
        getAttendanceSummary(currentFilters).catch((err) => {
          throw err;
        }),
      ]);

      setGroups(groupsRes.data || []);
      setSummary(summaryRes.data || null);
    } catch (err) {
      setMessage({ type: 'error', text: err.message || 'Failed to load summary records' });
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadSummaryData(filters);
  }, []); // Run once on mount

  const handleFilterSubmit = (e) => {
    e.preventDefault();
    setMessage({ type: '', text: '' });
    loadSummaryData(filters);
  };

  const getStatusBadge = (status) => {
    switch (status) {
      case 'PRESENT':
        return <span className="px-2.5 py-1 text-xs font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">✅ Present</span>;
      case 'LATE':
        return <span className="px-2.5 py-1 text-xs font-bold bg-amber-50 text-amber-700 border border-amber-200">⚠️ Late</span>;
      case 'ON_LEAVE':
        return <span className="px-2.5 py-1 text-xs font-bold bg-purple-50 text-purple-700 border border-purple-200">✈️ On Leave</span>;
      case 'ABSENT':
        return <span className="px-2.5 py-1 text-xs font-bold bg-red-50 text-red-700 border border-red-200">❌ Absent</span>;
      default:
        return <span className="px-2.5 py-1 text-xs font-bold bg-stone-50 text-stone-700 border border-stone-200">{status}</span>;
    }
  };

  return (
    <div className="space-y-6">
      <div className="border-b border-maroon-200 pb-4">
        <h1 className="text-3xl font-extrabold text-maroon-700 tracking-tight">Attendance Summary & Analytics</h1>
        <p className="text-base text-stone-600 mt-1">
          Review comprehensive attendance reports, filter by group and date range, and track participation.
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

      {/* Filter Control Bar */}
      <div className="bg-white border border-maroon-300 p-6 shadow-maroon-sm">
        <form onSubmit={handleFilterSubmit} className="flex flex-wrap items-end gap-4">
          <div className="flex-1 min-w-[200px]">
            <label htmlFor="groupFilter" className="block text-xs font-bold text-stone-500 uppercase tracking-wider mb-1.5">
              Group
            </label>
            <select
              id="groupFilter"
              value={filters.groupId}
              onChange={(e) => setFilters({ ...filters, groupId: e.target.value })}
              className="w-full px-4 py-2.5 bg-white border border-maroon-300 text-stone-900 text-base focus:outline-none focus:border-maroon-700"
            >
              <option value="">All Groups</option>
              {groups.map((g) => (
                <option key={g.id} value={g.id}>
                  {g.name}
                </option>
              ))}
            </select>
          </div>

          <div className="flex-1 min-w-[180px]">
            <label htmlFor="startDate" className="block text-xs font-bold text-stone-500 uppercase tracking-wider mb-1.5">
              From Date
            </label>
            <input
              type="date"
              id="startDate"
              value={filters.startDate}
              onChange={(e) => setFilters({ ...filters, startDate: e.target.value })}
              className="w-full px-4 py-2.5 bg-white border border-maroon-300 text-stone-900 text-base focus:outline-none focus:border-maroon-700"
            />
          </div>

          <div className="flex-1 min-w-[180px]">
            <label htmlFor="endDate" className="block text-xs font-bold text-stone-500 uppercase tracking-wider mb-1.5">
              To Date
            </label>
            <input
              type="date"
              id="endDate"
              value={filters.endDate}
              onChange={(e) => setFilters({ ...filters, endDate: e.target.value })}
              className="w-full px-4 py-2.5 bg-white border border-maroon-300 text-stone-900 text-base focus:outline-none focus:border-maroon-700"
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="py-2.5 px-6 bg-maroon-700 hover:bg-maroon-800 text-white font-bold text-sm transition-colors cursor-pointer disabled:opacity-50 whitespace-nowrap h-[46px]"
          >
            {loading ? 'Filtering...' : '🔍 Apply Filters'}
          </button>
        </form>
      </div>

      {/* Stats Summary Grid */}
      {summary && (
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-7 gap-4">
          <div className="bg-white border border-maroon-300 p-5 text-center shadow-maroon-sm">
            <div className="text-2xl mb-1">👥</div>
            <div className="text-3xl font-extrabold text-stone-900">{summary.totalMembers}</div>
            <div className="text-xs font-bold text-stone-500 uppercase tracking-wider mt-1">Total Users</div>
          </div>

          <div className="bg-white border border-maroon-300 p-5 text-center shadow-maroon-sm">
            <div className="text-2xl mb-1">📑</div>
            <div className="text-3xl font-extrabold text-stone-900">{summary.totalRecords}</div>
            <div className="text-xs font-bold text-stone-500 uppercase tracking-wider mt-1">Total Records</div>
          </div>

          <div className="bg-white border border-emerald-300 p-5 text-center shadow-maroon-sm">
            <div className="text-2xl mb-1">✅</div>
            <div className="text-3xl font-extrabold text-emerald-600">{summary.presentCount}</div>
            <div className="text-xs font-bold text-stone-500 uppercase tracking-wider mt-1">Present</div>
          </div>

          <div className="bg-white border border-amber-300 p-5 text-center shadow-maroon-sm">
            <div className="text-2xl mb-1">⚠️</div>
            <div className="text-3xl font-extrabold text-amber-600">{summary.lateCount}</div>
            <div className="text-xs font-bold text-stone-500 uppercase tracking-wider mt-1">Late</div>
          </div>

          <div className="bg-white border border-purple-300 p-5 text-center shadow-maroon-sm">
            <div className="text-2xl mb-1">✈️</div>
            <div className="text-3xl font-extrabold text-purple-600">{summary.leaveCount}</div>
            <div className="text-xs font-bold text-stone-500 uppercase tracking-wider mt-1">On Leave</div>
          </div>

          <div className="bg-white border border-red-300 p-5 text-center shadow-maroon-sm">
            <div className="text-2xl mb-1">❌</div>
            <div className="text-3xl font-extrabold text-red-600">{summary.absentCount}</div>
            <div className="text-xs font-bold text-stone-500 uppercase tracking-wider mt-1">Absent</div>
          </div>

          <div className="bg-white border border-maroon-300 p-5 text-center shadow-maroon-sm col-span-2 sm:col-span-1">
            <div className="text-2xl mb-1">📊</div>
            <div className="text-3xl font-extrabold text-maroon-700">{summary.attendancePercentage}%</div>
            <div className="text-xs font-bold text-stone-500 uppercase tracking-wider mt-1">Attendance Rate</div>
            <div className="w-full h-2 bg-maroon-100 mt-2 overflow-hidden">
              <div
                className="h-full bg-maroon-700 transition-all duration-500"
                style={{ width: `${Math.min(100, Math.max(0, summary.attendancePercentage))}%` }}
              />
            </div>
          </div>
        </div>
      )}

      {/* Detailed Records Table */}
      <div className="bg-white border border-maroon-300 p-6 shadow-maroon-sm">
        <div className="text-sm font-semibold text-stone-500 uppercase tracking-wider mb-4 flex items-center gap-2">
          <span>📜</span> Detailed Attendance Records
          {summary?.groupName && (
            <span className="px-2.5 py-1 text-xs font-bold bg-maroon-50 text-maroon-700 border border-maroon-300 ml-2">
              {summary.groupName}
            </span>
          )}
        </div>

        {loading ? (
          <p className="text-sm text-stone-500">Loading summary records...</p>
        ) : !summary || !summary.records || summary.records.length === 0 ? (
          <p className="text-base text-stone-500 py-6 text-center">No attendance records found matching the selected filter criteria.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-base">
              <thead>
                <tr className="border-b border-maroon-300 text-stone-500 text-xs font-bold uppercase tracking-wider">
                  <th className="py-3 px-3">User</th>
                  <th className="py-3 px-3">Group</th>
                  <th className="py-3 px-3">Date</th>
                  <th className="py-3 px-3">Status</th>
                  <th className="py-3 px-3">Check-in Time</th>
                  <th className="py-3 px-3">Notes</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-maroon-100">
                {summary.records.map((record) => (
                  <tr key={record.id} className="hover:bg-maroon-100/50 transition-colors">
                    <td className="py-3.5 px-3">
                      <strong className="text-stone-900 font-bold">{record.fullName || record.username}</strong>
                      <div className="text-xs text-stone-500">@{record.username}</div>
                    </td>
                    <td className="py-3.5 px-3">
                      {record.groupName ? (
                        <span className="px-2.5 py-1 text-xs font-bold bg-maroon-50 text-maroon-700 border border-maroon-300">
                          {record.groupName}
                        </span>
                      ) : (
                        '—'
                      )}
                    </td>
                    <td className="py-3.5 px-3 font-bold text-stone-900">
                      {new Date(record.attendanceDate + 'T00:00:00').toLocaleDateString('en-US', {
                        year: 'numeric',
                        month: 'short',
                        day: 'numeric',
                      })}
                    </td>
                    <td className="py-3.5 px-3">{getStatusBadge(record.status)}</td>
                    <td className="py-3.5 px-3 text-stone-700">
                      {new Date(record.checkInTime).toLocaleTimeString('en-US', {
                        hour: '2-digit',
                        minute: '2-digit',
                      })}
                    </td>
                    <td className="py-3.5 px-3 text-stone-600 text-sm">{record.notes || '—'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}

export default function AdminSummaryPage() {
  return (
    <ProtectedRoute>
      <SummaryContent />
    </ProtectedRoute>
  );
}
