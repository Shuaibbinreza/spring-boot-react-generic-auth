'use client';

import { useState, useEffect, useCallback } from 'react';
import ProtectedRoute from '@/components/ProtectedRoute';
import { getAdminGroups, getAttendanceSummary } from '@/lib/api';

function generateDateList(startStr, endStr) {
  const dates = [];
  if (!startStr || !endStr) return dates;
  let curr = new Date(startStr + 'T00:00:00');
  const end = new Date(endStr + 'T00:00:00');

  let maxDays = 31;
  while (curr <= end && dates.length < maxDays) {
    const year = curr.getFullYear();
    const month = String(curr.getMonth() + 1).padStart(2, '0');
    const day = String(curr.getDate()).padStart(2, '0');
    const isoDate = `${year}-${month}-${day}`;

    const dayNum = curr.getDate();
    const dayOfWeek = curr.toLocaleDateString('en-US', { weekday: 'short' });

    dates.push({
      isoDate,
      dayNum,
      dayOfWeek,
      isWeekend: curr.getDay() === 5,
    });

    curr.setDate(curr.getDate() + 1);
  }
  return dates;
}

function SummaryContent() {
  const [groups, setGroups] = useState([]);
  const [summary, setSummary] = useState(null);
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState({ type: '', text: '' });
  const [viewMode, setViewMode] = useState('matrix'); // 'matrix' or 'list'

  // Current Month Date Range Defaults
  const now = new Date();
  const currentMonthStart = new Date(now.getFullYear(), now.getMonth(), 1).toISOString().split('T')[0];
  const currentMonthEnd = new Date(now.getFullYear(), now.getMonth() + 1, 0).toISOString().split('T')[0];
  const currentMonthName = now.toLocaleDateString('en-US', { month: 'long', year: 'numeric' });

  const [filters, setFilters] = useState({
    groupId: '',
    startDate: currentMonthStart,
    endDate: currentMonthEnd,
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
  }, []);

  const handleGroupSelect = (e) => {
    const selectedGroupId = e.target.value;
    const updatedFilters = { ...filters, groupId: selectedGroupId };
    setFilters(updatedFilters);
    loadSummaryData(updatedFilters);
  };

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

  const formatTime = (timeStr) => {
    if (!timeStr) return '';
    try {
      return new Date(timeStr).toLocaleTimeString('en-US', {
        hour: '2-digit',
        minute: '2-digit',
      });
    } catch {
      return '';
    }
  };

  const getMatrixCell = (record) => {
    if (!record) return <span className="text-stone-300 font-normal text-xs">-</span>;
    const timeDisplay = formatTime(record.checkInTime);

    switch (record.status) {
      case 'PRESENT':
        return (
          <span
            className="inline-flex items-center justify-center px-1.5 py-1 text-[11px] font-extrabold bg-emerald-100 text-emerald-800 border border-emerald-300 shadow-2xs whitespace-nowrap"
            title={`Present (${timeDisplay}${record.notes ? ` - ${record.notes}` : ''})`}
          >
            {timeDisplay || 'Present'}
          </span>
        );
      case 'LATE':
        return (
          <span
            className="inline-flex items-center justify-center px-1.5 py-1 text-[11px] font-extrabold bg-amber-100 text-amber-800 border border-amber-300 shadow-2xs whitespace-nowrap"
            title={`Late (${timeDisplay}${record.notes ? ` - ${record.notes}` : ''}`}
          >
            {timeDisplay || 'Late'}
          </span>
        );
      case 'ON_LEAVE':
        return (
          <span
            className="inline-flex items-center justify-center px-1.5 py-1 text-[11px] font-extrabold bg-purple-100 text-purple-800 border border-purple-300 shadow-2xs whitespace-nowrap"
            title={`On Leave${record.notes ? ` - ${record.notes}` : ''}`}
          >
            Leave
          </span>
        );
      case 'ABSENT':
        return (
          <span
            className="inline-flex items-center justify-center px-1.5 py-1 text-[11px] font-extrabold bg-red-100 text-red-800 border border-red-300 shadow-2xs whitespace-nowrap"
            title={`Absent${record.notes ? ` - ${record.notes}` : ''}`}
          >
            Absent
          </span>
        );
      default:
        return <span className="text-stone-300 font-normal text-xs">-</span>;
    }
  };

  // Matrix generation
  const dateList = generateDateList(filters.startDate, filters.endDate);
  const userMatrix = Object.values(
    (summary?.records || []).reduce((acc, record) => {
      const username = record.username;
      if (!acc[username]) {
        acc[username] = {
          username: record.username,
          fullName: record.fullName,
          recordsByDate: {},
          presentCount: 0,
          lateCount: 0,
          leaveCount: 0,
          absentCount: 0,
        };
      }
      acc[username].recordsByDate[record.attendanceDate] = record;
      if (record.status === 'PRESENT') acc[username].presentCount++;
      if (record.status === 'LATE') acc[username].lateCount++;
      if (record.status === 'ON_LEAVE') acc[username].leaveCount++;
      if (record.status === 'ABSENT') acc[username].absentCount++;
      return acc;
    }, {})
  );

  return (
    <div className="space-y-6">
      <div className="border-b border-maroon-200 pb-4">
        <h1 className="text-3xl font-extrabold text-maroon-700 tracking-tight">Current Month Attendance & Analytics</h1>
        <p className="text-base text-stone-600 mt-1">
          Viewing attendance roster for <strong>{currentMonthName}</strong>. Select a group from the dropdown to inspect user attendance.
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
          <div className="flex-1 min-w-[260px]">
            <label htmlFor="groupFilter" className="block text-xs font-bold text-maroon-800 uppercase tracking-wider mb-1.5 flex items-center gap-1.5">
              <span>🏢</span> Select Group / Department
            </label>
            <select
              id="groupFilter"
              value={filters.groupId}
              onChange={handleGroupSelect}
              className="w-full px-4 py-2.5 bg-white border border-maroon-300 text-stone-900 text-base font-semibold focus:outline-none focus:border-maroon-700"
            >
              <option value="">All Groups (Entire System)</option>
              {groups.map((g) => (
                <option key={g.id} value={g.id}>
                  {g.name} ({g.memberCount || 0} members)
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
            <div className="text-xs font-bold text-stone-500 uppercase tracking-wider mt-1">Group Members</div>
          </div>

          <div className="bg-white border border-maroon-300 p-5 text-center shadow-maroon-sm">
            <div className="text-2xl mb-1">📑</div>
            <div className="text-3xl font-extrabold text-stone-900">{summary.totalRecords}</div>
            <div className="text-xs font-bold text-stone-500 uppercase tracking-wider mt-1">Total Submissions</div>
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

      {/* Main Attendance Table Section */}
      <div className="bg-white border border-maroon-300 p-6 shadow-maroon-sm space-y-4">
        <div className="flex items-center justify-between flex-wrap gap-3 border-b border-maroon-200 pb-3">
          <div className="flex items-center gap-2">
            <h2 className="text-base font-bold text-stone-800 uppercase tracking-wider flex items-center gap-2">
              <span>📅</span> Group Monthly Attendance Roster ({currentMonthName})
            </h2>
            {summary?.groupName && (
              <span className="px-2.5 py-1 text-xs font-bold bg-maroon-50 text-maroon-700 border border-maroon-300">
                {summary.groupName}
              </span>
            )}
          </div>

          <div className="flex items-center gap-3">
            {/* Legend */}
            <div className="hidden md:flex items-center gap-2 text-xs font-bold text-stone-600 mr-2">
              <span className="flex items-center gap-1"><span className="w-3.5 h-3.5 bg-emerald-100 border border-emerald-300 text-emerald-800 text-[10px] flex items-center justify-center">P</span> Present</span>
              <span className="flex items-center gap-1"><span className="w-3.5 h-3.5 bg-amber-100 border border-amber-300 text-amber-800 text-[10px] flex items-center justify-center">L</span> Late</span>
              <span className="flex items-center gap-1"><span className="w-3.5 h-3.5 bg-purple-100 border border-purple-300 text-purple-800 text-[10px] flex items-center justify-center">O</span> Leave</span>
              <span className="flex items-center gap-1"><span className="w-3.5 h-3.5 bg-red-100 border border-red-300 text-red-800 text-[10px] flex items-center justify-center">A</span> Absent</span>
            </div>

            {/* View Mode Toggle */}
            <div className="flex items-center border border-maroon-300 overflow-hidden">
              <button
                type="button"
                onClick={() => setViewMode('matrix')}
                className={`px-3 py-1.5 text-xs font-bold transition-colors cursor-pointer ${
                  viewMode === 'matrix' ? 'bg-maroon-700 text-white' : 'bg-white text-stone-600 hover:bg-maroon-50'
                }`}
              >
                📅 Matrix View
              </button>
              <button
                type="button"
                onClick={() => setViewMode('list')}
                className={`px-3 py-1.5 text-xs font-bold transition-colors cursor-pointer ${
                  viewMode === 'list' ? 'bg-maroon-700 text-white' : 'bg-white text-stone-600 hover:bg-maroon-50'
                }`}
              >
                📜 List View
              </button>
            </div>
          </div>
        </div>

        {loading ? (
          <p className="text-sm text-stone-500 py-4">Loading attendance records...</p>
        ) : !summary || !summary.records || summary.records.length === 0 ? (
          <p className="text-base text-stone-500 py-8 text-center">
            No attendance records found for the selected group in {currentMonthName}.
          </p>
        ) : viewMode === 'matrix' ? (
          /* MATRIX GRID VIEW: Rows = Users, Columns = Dates */
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse min-w-[700px]">
              <thead>
                <tr className="border-b-2 border-maroon-300 bg-maroon-50 text-stone-700 text-xs font-bold uppercase">
                  <th className="py-3 px-3 min-w-[180px] sticky left-0 bg-maroon-50 z-10 border-r border-maroon-200">
                    Group Member / User
                  </th>
                  {dateList.map((d) => (
                    <th
                      key={d.isoDate}
                      className={`py-2 px-1 text-center min-w-[64px] border-r border-maroon-200 ${
                        d.isWeekend ? 'bg-stone-200/60 text-stone-500' : ''
                      }`}
                    >
                      <div className="text-[11px] font-extrabold">{d.dayNum}</div>
                      <div className="text-[9px] text-stone-500 font-semibold uppercase">{d.dayOfWeek}</div>
                    </th>
                  ))}
                  <th className="py-3 px-3 text-center min-w-[140px] bg-maroon-50">
                    Monthly Summary
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-maroon-100 text-sm">
                {userMatrix.map((u) => (
                  <tr key={u.username} className="hover:bg-maroon-50/70 transition-colors">
                    <td className="py-3 px-3 sticky left-0 bg-white z-10 border-r border-maroon-200 font-medium">
                      <div className="font-bold text-stone-900 leading-tight">{u.fullName || u.username}</div>
                      <div className="text-xs text-stone-500">@{u.username}</div>
                    </td>
                    {dateList.map((d) => {
                      const rec = u.recordsByDate[d.isoDate];
                      return (
                        <td
                          key={d.isoDate}
                          className={`py-2 px-0.5 text-center border-r border-maroon-100 ${
                            d.isWeekend ? 'bg-stone-50' : ''
                          }`}
                        >
                          {getMatrixCell(rec)}
                        </td>
                      );
                    })}
                    <td className="py-3 px-3 text-xs font-semibold whitespace-nowrap bg-stone-50 text-stone-700">
                      <div className="flex items-center gap-1.5 justify-center">
                        <span className="text-emerald-700 font-extrabold">P:{u.presentCount}</span>
                        <span>|</span>
                        <span className="text-amber-700 font-extrabold">L:{u.lateCount}</span>
                        <span>|</span>
                        <span className="text-purple-700 font-extrabold">O:{u.leaveCount}</span>
                        <span>|</span>
                        <span className="text-red-700 font-extrabold">A:{u.absentCount}</span>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          /* LIST VIEW */
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
