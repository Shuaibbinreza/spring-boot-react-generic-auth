'use client';

import { useState, useEffect, useCallback } from 'react';
import ProtectedRoute from '@/components/ProtectedRoute';
import { submitAttendance, getTodayAttendance, getMyAttendanceHistory } from '@/lib/api';

function AttendanceContent() {
  const [todayRecord, setTodayRecord] = useState(null);
  const [history, setHistory] = useState([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [message, setMessage] = useState({ type: '', text: '' });

  const [form, setForm] = useState({
    attendanceDate: new Date().toISOString().split('T')[0],
    status: 'PRESENT',
    notes: '',
  });

  const loadAttendanceData = useCallback(async () => {
    setLoading(true);
    try {
      const [todayRes, historyRes] = await Promise.all([
        getTodayAttendance().catch(() => null),
        getMyAttendanceHistory().catch(() => null),
      ]);

      if (todayRes && todayRes.data) {
        setTodayRecord(todayRes.data);
        setForm((prev) => ({
          ...prev,
          status: todayRes.data.status || 'PRESENT',
          notes: todayRes.data.notes || '',
        }));
      }
      if (historyRes && historyRes.data) {
        setHistory(historyRes.data);
      }
    } catch {
      setMessage({ type: 'error', text: 'Failed to load attendance records' });
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadAttendanceData();
  }, [loadAttendanceData]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    setMessage({ type: '', text: '' });

    try {
      const res = await submitAttendance(form);
      setMessage({ type: 'success', text: res.message || 'Attendance submitted successfully!' });
      await loadAttendanceData();
    } catch (err) {
      setMessage({ type: 'error', text: err.message || 'Failed to submit attendance' });
    } finally {
      setSubmitting(false);
    }
  };

  const getStatusBadge = (status) => {
    switch (status) {
      case 'PRESENT':
        return <span className="px-2 py-0.5 text-xs font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">✅ Present</span>;
      case 'LATE':
        return <span className="px-2 py-0.5 text-xs font-semibold bg-amber-50 text-amber-700 border border-amber-200">⚠️ Late</span>;
      case 'ON_LEAVE':
        return <span className="px-2 py-0.5 text-xs font-semibold bg-purple-50 text-purple-700 border border-purple-200">✈️ On Leave</span>;
      case 'ABSENT':
        return <span className="px-2 py-0.5 text-xs font-semibold bg-red-50 text-red-700 border border-red-200">❌ Absent</span>;
      default:
        return <span className="px-2 py-0.5 text-xs font-semibold bg-stone-50 text-stone-700 border border-stone-200">{status}</span>;
    }
  };

  return (
    <div className="space-y-6">
      <div className="border-b border-maroon-200 pb-4">
        <h1 className="text-2xl font-bold text-maroon-700 tracking-tight">Submit Attendance</h1>
        <p className="text-sm text-stone-600 mt-1">Record your daily attendance status and review your historical submissions.</p>
      </div>

      {message.text && (
        <div className={`p-4 text-xs font-medium border flex items-center gap-2 ${
          message.type === 'success' ? 'bg-emerald-50 text-emerald-800 border-emerald-200' : 'bg-red-50 text-red-800 border-red-200'
        }`}>
          <span>{message.type === 'success' ? '✅' : '⚠️'}</span>
          <span>{message.text}</span>
        </div>
      )}

      {/* Today's Status Banner */}
      <div className="bg-white border border-maroon-300 p-6 shadow-maroon-sm">
        <div className="text-xs font-semibold text-stone-500 uppercase tracking-wider mb-3 flex items-center gap-2">
          <span>📅</span> Today's Attendance Overview ({new Date().toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })})
        </div>
        {loading ? (
          <p className="text-xs text-stone-500">Loading today's status...</p>
        ) : todayRecord ? (
          <div className="flex flex-wrap items-center gap-6 text-sm text-stone-800">
            <div>
              <span className="text-xs text-stone-500 mr-2">Status:</span> {getStatusBadge(todayRecord.status)}
            </div>
            <div>
              <span className="text-xs text-stone-500 mr-2">Check-in Time:</span>{' '}
              <span className="font-semibold text-stone-900">
                {new Date(todayRecord.checkInTime).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })}
              </span>
            </div>
            {todayRecord.groupName && (
              <div>
                <span className="text-xs text-stone-500 mr-2">Group:</span>{' '}
                <span className="px-2 py-0.5 text-xs font-semibold bg-maroon-50 text-maroon-700 border border-maroon-300">
                  {todayRecord.groupName}
                </span>
              </div>
            )}
            {todayRecord.notes && (
              <div>
                <span className="text-xs text-stone-500 mr-2">Notes:</span>{' '}
                <em className="text-stone-700">"{todayRecord.notes}"</em>
              </div>
            )}
          </div>
        ) : (
          <div className="text-amber-700 text-sm font-medium">
            ⚠️ You have not submitted attendance for today yet.
          </div>
        )}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Attendance Submission Form */}
        <div className="bg-white border border-maroon-300 p-6 shadow-maroon-sm lg:col-span-1">
          <div className="text-xs font-semibold text-stone-500 uppercase tracking-wider mb-4 flex items-center gap-2">
            <span>✍️</span> {todayRecord ? 'Update Attendance' : 'Mark Attendance'}
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label htmlFor="attendanceDate" className="block text-xs font-semibold text-stone-700 uppercase tracking-wider mb-1.5">
                Date
              </label>
              <input
                type="date"
                id="attendanceDate"
                value={form.attendanceDate}
                onChange={(e) => setForm({ ...form, attendanceDate: e.target.value })}
                required
                className="w-full px-3.5 py-2 bg-white border border-maroon-300 text-stone-900 text-sm focus:outline-none focus:border-maroon-700 focus:ring-1 focus:ring-maroon-700"
              />
            </div>

            <div>
              <label htmlFor="status" className="block text-xs font-semibold text-stone-700 uppercase tracking-wider mb-1.5">
                Attendance Status
              </label>
              <select
                id="status"
                value={form.status}
                onChange={(e) => setForm({ ...form, status: e.target.value })}
                required
                className="w-full px-3.5 py-2 bg-white border border-maroon-300 text-stone-900 text-sm focus:outline-none focus:border-maroon-700 focus:ring-1 focus:ring-maroon-700"
              >
                <option value="PRESENT">Present</option>
                <option value="LATE">Late</option>
                <option value="ON_LEAVE">On Leave</option>
                <option value="ABSENT">Absent</option>
              </select>
            </div>

            <div>
              <label htmlFor="notes" className="block text-xs font-semibold text-stone-700 uppercase tracking-wider mb-1.5">
                Notes / Reason (Optional)
              </label>
              <textarea
                id="notes"
                rows="3"
                placeholder="E.g., Working remotely, doctor appointment, traffic delay..."
                value={form.notes}
                onChange={(e) => setForm({ ...form, notes: e.target.value })}
                maxLength={500}
                className="w-full px-3.5 py-2 bg-white border border-maroon-300 text-stone-900 text-sm focus:outline-none focus:border-maroon-700 focus:ring-1 focus:ring-maroon-700 resize-none"
              />
            </div>

            <button
              type="submit"
              disabled={submitting}
              className="w-full py-2.5 px-4 bg-maroon-700 hover:bg-maroon-800 text-white font-semibold text-sm transition-colors shadow-sm disabled:opacity-50 cursor-pointer mt-2"
            >
              {submitting ? 'Submitting...' : todayRecord ? 'Update Submission' : 'Submit Attendance'}
            </button>
          </form>
        </div>

        {/* Personal Attendance History Table */}
        <div className="bg-white border border-maroon-300 p-6 shadow-maroon-sm lg:col-span-2">
          <div className="text-xs font-semibold text-stone-500 uppercase tracking-wider mb-4 flex items-center gap-2">
            <span>📋</span> Attendance History
          </div>

          {loading ? (
            <p className="text-xs text-stone-500">Loading attendance history...</p>
          ) : history.length === 0 ? (
            <p className="text-sm text-stone-500 py-6 text-center">No attendance records found.</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm">
                <thead>
                  <tr className="border-b border-maroon-300 text-stone-500 text-xs font-semibold uppercase tracking-wider">
                    <th className="py-2.5 px-3">Date</th>
                    <th className="py-2.5 px-3">Status</th>
                    <th className="py-2.5 px-3">Check-in Time</th>
                    <th className="py-2.5 px-3">Group</th>
                    <th className="py-2.5 px-3">Notes</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-maroon-100">
                  {history.map((record) => (
                    <tr key={record.id} className="hover:bg-maroon-100/50 transition-colors">
                      <td className="py-3 px-3 font-semibold text-stone-900">
                        {new Date(record.attendanceDate + 'T00:00:00').toLocaleDateString('en-US', {
                          year: 'numeric',
                          month: 'short',
                          day: 'numeric',
                        })}
                      </td>
                      <td className="py-3 px-3">{getStatusBadge(record.status)}</td>
                      <td className="py-3 px-3 text-stone-700">
                        {new Date(record.checkInTime).toLocaleTimeString('en-US', {
                          hour: '2-digit',
                          minute: '2-digit',
                        })}
                      </td>
                      <td className="py-3 px-3">
                        {record.groupName ? (
                          <span className="px-2 py-0.5 text-xs font-semibold bg-maroon-50 text-maroon-700 border border-maroon-300">
                            {record.groupName}
                          </span>
                        ) : (
                          '—'
                        )}
                      </td>
                      <td className="py-3 px-3 text-stone-600 text-xs">{record.notes || '—'}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default function AttendancePage() {
  return (
    <ProtectedRoute>
      <AttendanceContent />
    </ProtectedRoute>
  );
}
