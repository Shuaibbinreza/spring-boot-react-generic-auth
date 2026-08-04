'use client';

import { useState, useEffect, useCallback } from 'react';
import ProtectedRoute from '@/components/ProtectedRoute';
import {
  getAdminGroups,
  createGroup,
  updateGroup,
  deleteGroup,
  getAllUsers,
  addUserToGroup,
  removeUserFromGroup,
} from '@/lib/api';

function GroupsContent() {
  const [groups, setGroups] = useState([]);
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState({ type: '', text: '' });

  // Create Group State with Schedule Configuration
  const [newGroup, setNewGroup] = useState({
    name: '',
    description: '',
    weekdayCheckInTime: '08:00',
    saturdayCheckInTime: '09:00',
    weekendDays: 'FRIDAY',
  });
  const [creating, setCreating] = useState(false);

  // Edit Group State
  const [editingGroup, setEditingGroup] = useState(null);
  const [updating, setUpdating] = useState(false);

  // Selected Group ID for Member Management View
  const [activeGroupId, setActiveGroupId] = useState(null);
  const [selectedUserId, setSelectedUserId] = useState('');
  const [addingMember, setAddingMember] = useState(false);

  const activeGroup = groups.find((g) => g.id === activeGroupId) || null;

  const loadData = useCallback(async (showLoading = true) => {
    if (showLoading) setLoading(true);
    try {
      const [groupsRes, usersRes] = await Promise.all([
        getAdminGroups(),
        getAllUsers(),
      ]);
      setGroups(groupsRes.data || []);
      setUsers(usersRes.data || []);
    } catch (err) {
      setMessage({ type: 'error', text: err.message || 'Failed to load group and user data' });
    } finally {
      if (showLoading) setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadData(true);
  }, [loadData]);

  const handleCreateGroup = async (e) => {
    e.preventDefault();
    if (!newGroup.name.trim()) return;

    setCreating(true);
    setMessage({ type: '', text: '' });

    try {
      await createGroup(newGroup);
      setNewGroup({
        name: '',
        description: '',
        weekdayCheckInTime: '08:00',
        saturdayCheckInTime: '09:00',
        weekendDays: 'FRIDAY',
      });
      setMessage({ type: 'success', text: 'Group created with check-in schedule successfully!' });
      await loadData(false);
    } catch (err) {
      setMessage({ type: 'error', text: err.message || 'Failed to create group' });
    } finally {
      setCreating(false);
    }
  };

  const handleStartEdit = (group) => {
    setEditingGroup({
      id: group.id,
      name: group.name || '',
      description: group.description || '',
      weekdayCheckInTime: group.weekdayCheckInTime || '08:00',
      saturdayCheckInTime: group.saturdayCheckInTime || '09:00',
      weekendDays: group.weekendDays || 'FRIDAY',
    });
  };

  const handleUpdateGroup = async (e) => {
    e.preventDefault();
    if (!editingGroup || !editingGroup.name.trim()) return;

    setUpdating(true);
    setMessage({ type: '', text: '' });

    try {
      await updateGroup(editingGroup.id, {
        name: editingGroup.name,
        description: editingGroup.description,
        weekdayCheckInTime: editingGroup.weekdayCheckInTime,
        saturdayCheckInTime: editingGroup.saturdayCheckInTime,
        weekendDays: editingGroup.weekendDays,
      });
      setMessage({ type: 'success', text: `Group "${editingGroup.name}" updated successfully!` });
      setEditingGroup(null);
      await loadData(false);
    } catch (err) {
      setMessage({ type: 'error', text: err.message || 'Failed to update group' });
    } finally {
      setUpdating(false);
    }
  };

  const handleDeleteGroup = async (id, name) => {
    if (!window.confirm(`Are you sure you want to delete group "${name}"?`)) return;

    try {
      await deleteGroup(id);
      setMessage({ type: 'success', text: `Group "${name}" deleted successfully.` });
      if (activeGroupId === id) setActiveGroupId(null);
      if (editingGroup?.id === id) setEditingGroup(null);
      await loadData(false);
    } catch (err) {
      setMessage({ type: 'error', text: err.message || 'Failed to delete group' });
    }
  };

  const handleAddMember = async (e) => {
    e.preventDefault();
    if (!activeGroup || !selectedUserId) return;

    setAddingMember(true);
    setMessage({ type: '', text: '' });

    try {
      await addUserToGroup(activeGroup.id, selectedUserId);
      setSelectedUserId('');
      setMessage({ type: 'success', text: 'Member added to group successfully!' });
      await loadData(false);
    } catch (err) {
      setMessage({ type: 'error', text: err.message || 'Failed to add member to group' });
    } finally {
      setAddingMember(false);
    }
  };

  const handleRemoveMember = async (groupId, userId, username) => {
    if (!window.confirm(`Remove user "${username}" from group?`)) return;

    try {
      await removeUserFromGroup(groupId, userId);
      setMessage({ type: 'success', text: `User "${username}" removed from group.` });
      await loadData(false);
    } catch (err) {
      setMessage({ type: 'error', text: err.message || 'Failed to remove member' });
    }
  };

  return (
    <div className="space-y-6">
      <div className="border-b border-maroon-200 pb-4">
        <h1 className="text-3xl font-extrabold text-maroon-700 tracking-tight">Group & Schedule Management</h1>
        <p className="text-base text-stone-600 mt-1">
          Create groups, update group schedule rules, and manage member assignments.
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
        {/* Create Group Form Card */}
        <div className="bg-white border border-maroon-300 p-6 shadow-maroon-sm lg:col-span-1 space-y-4">
          <div className="text-sm font-semibold text-stone-500 uppercase tracking-wider mb-2 flex items-center gap-2">
            <span>➕</span> Create New Group
          </div>

          <form onSubmit={handleCreateGroup} className="space-y-4">
            <div>
              <label htmlFor="groupName" className="block text-xs font-bold text-stone-700 uppercase tracking-wider mb-1.5">
                Group Name *
              </label>
              <input
                type="text"
                id="groupName"
                placeholder="e.g. Engineering Team, Operations"
                value={newGroup.name}
                onChange={(e) => setNewGroup({ ...newGroup, name: e.target.value })}
                required
                className="w-full px-4 py-2.5 bg-white border border-maroon-300 text-stone-900 text-base focus:outline-none focus:border-maroon-700"
              />
            </div>

            <div>
              <label htmlFor="groupDesc" className="block text-xs font-bold text-stone-700 uppercase tracking-wider mb-1.5">
                Description
              </label>
              <textarea
                id="groupDesc"
                rows="2"
                placeholder="Brief description..."
                value={newGroup.description}
                onChange={(e) => setNewGroup({ ...newGroup, description: e.target.value })}
                className="w-full px-4 py-2.5 bg-white border border-maroon-300 text-stone-900 text-base focus:outline-none focus:border-maroon-700 resize-none"
              />
            </div>

            {/* Schedule Configuration Fields */}
            <div className="bg-maroon-50/60 p-4 border border-maroon-200 space-y-3">
              <div className="text-xs font-extrabold text-maroon-800 uppercase tracking-wider flex items-center gap-1.5">
                <span>⏰</span> Attendance Schedule Rules
              </div>

              <div>
                <label htmlFor="weekdayCheckInTime" className="block text-xs font-bold text-stone-700 mb-1">
                  Sun – Thu Check-in Cutoff Time
                </label>
                <input
                  type="time"
                  id="weekdayCheckInTime"
                  value={newGroup.weekdayCheckInTime}
                  onChange={(e) => setNewGroup({ ...newGroup, weekdayCheckInTime: e.target.value })}
                  required
                  className="w-full px-3 py-2 bg-white border border-maroon-300 text-stone-900 text-sm font-semibold focus:outline-none focus:border-maroon-700"
                />
                <p className="text-[11px] text-stone-500 mt-0.5">Submissions after this time are marked LATE (default: 08:00 AM)</p>
              </div>

              <div>
                <label htmlFor="saturdayCheckInTime" className="block text-xs font-bold text-stone-700 mb-1">
                  Saturday Check-in Cutoff Time
                </label>
                <input
                  type="time"
                  id="saturdayCheckInTime"
                  value={newGroup.saturdayCheckInTime}
                  onChange={(e) => setNewGroup({ ...newGroup, saturdayCheckInTime: e.target.value })}
                  required
                  className="w-full px-3 py-2 bg-white border border-maroon-300 text-stone-900 text-sm font-semibold focus:outline-none focus:border-maroon-700"
                />
                <p className="text-[11px] text-stone-500 mt-0.5">Saturday late cutoff (default: 09:00 AM)</p>
              </div>

              <div>
                <label htmlFor="weekendDays" className="block text-xs font-bold text-stone-700 mb-1">
                  Weekend / Off Day
                </label>
                <select
                  id="weekendDays"
                  value={newGroup.weekendDays}
                  onChange={(e) => setNewGroup({ ...newGroup, weekendDays: e.target.value })}
                  className="w-full px-3 py-2 bg-white border border-maroon-300 text-stone-900 text-sm font-semibold focus:outline-none focus:border-maroon-700"
                >
                  <option value="FRIDAY">Friday Only (Standard)</option>
                  <option value="FRIDAY_SATURDAY">Friday & Saturday</option>
                  <option value="SATURDAY_SUNDAY">Saturday & Sunday</option>
                </select>
              </div>
            </div>

            <button
              type="submit"
              disabled={creating}
              className="w-full py-3 px-4 bg-maroon-700 hover:bg-maroon-800 text-white font-bold text-base transition-colors shadow-sm disabled:opacity-50 cursor-pointer mt-2"
            >
              {creating ? 'Creating...' : 'Create Group'}
            </button>
          </form>
        </div>

        {/* Existing Groups List & Update Section */}
        <div className="bg-white border border-maroon-300 p-6 shadow-maroon-sm lg:col-span-2 space-y-6">
          <div className="text-sm font-semibold text-stone-500 uppercase tracking-wider flex items-center justify-between">
            <span className="flex items-center gap-2">
              <span>🏢</span> Existing Groups ({groups.length})
            </span>
          </div>

          {loading ? (
            <p className="text-sm text-stone-500">Loading groups...</p>
          ) : groups.length === 0 ? (
            <p className="text-base text-stone-500 py-6 text-center">No groups created yet. Create one to manage members.</p>
          ) : (
            <div className="space-y-4">
              {groups.map((group) => (
                <div
                  key={group.id}
                  className={`p-5 border transition-all ${
                    editingGroup?.id === group.id
                      ? 'border-maroon-700 bg-amber-50/30 ring-2 ring-maroon-700'
                      : activeGroupId === group.id
                      ? 'border-maroon-700 bg-maroon-50/40 shadow-maroon-sm'
                      : 'border-maroon-200 bg-white hover:border-maroon-400'
                  }`}
                >
                  <div className="flex items-start justify-between gap-4 flex-wrap">
                    <div>
                      <div className="flex items-center gap-2 flex-wrap">
                        <h3 className="text-lg font-bold text-stone-900">{group.name}</h3>
                        <span className="px-2.5 py-0.5 text-xs font-bold bg-maroon-100 text-maroon-800 border border-maroon-200">
                          {group.memberCount} Members
                        </span>
                      </div>
                      <p className="text-sm text-stone-600 mt-1">{group.description || 'No description provided.'}</p>
                    </div>

                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        onClick={() => handleStartEdit(group)}
                        className="px-3.5 py-1.5 text-xs font-bold bg-amber-50 text-amber-800 border border-amber-300 hover:bg-amber-100 transition-colors cursor-pointer"
                      >
                        ✏️ Edit Group
                      </button>

                      <button
                        type="button"
                        onClick={() => setActiveGroupId(activeGroupId === group.id ? null : group.id)}
                        className={`px-3.5 py-1.5 text-xs font-bold transition-colors cursor-pointer border ${
                          activeGroupId === group.id
                            ? 'bg-maroon-700 text-white border-maroon-700'
                            : 'bg-white text-maroon-700 border-maroon-300 hover:bg-maroon-50'
                        }`}
                      >
                        {activeGroupId === group.id ? 'Close Members' : '👥 Manage Members'}
                      </button>

                      <button
                        type="button"
                        onClick={() => handleDeleteGroup(group.id, group.name)}
                        className="px-3.5 py-1.5 text-xs font-bold bg-red-50 text-red-700 border border-red-200 hover:bg-red-100 transition-colors cursor-pointer"
                      >
                        🗑️ Delete
                      </button>
                    </div>
                  </div>

                  {/* Schedule badges */}
                  <div className="mt-3 pt-3 border-t border-maroon-100 flex items-center gap-2 text-xs font-semibold text-stone-600 flex-wrap">
                    <span className="text-maroon-800 font-bold">Schedule:</span>
                    <span className="px-2 py-0.5 bg-stone-100 border border-stone-300">
                      Sun–Thu Cutoff: <strong>{group.weekdayCheckInTime || '08:00'} AM</strong>
                    </span>
                    <span className="px-2 py-0.5 bg-stone-100 border border-stone-300">
                      Saturday Cutoff: <strong>{group.saturdayCheckInTime || '09:00'} AM</strong>
                    </span>
                    <span className="px-2 py-0.5 bg-purple-50 text-purple-800 border border-purple-200">
                      Off Day: <strong>{group.weekendDays || 'FRIDAY'}</strong>
                    </span>
                  </div>

                  {/* INLINE EDIT GROUP FORM */}
                  {editingGroup?.id === group.id && (
                    <form onSubmit={handleUpdateGroup} className="mt-4 p-4 bg-white border-2 border-amber-400 space-y-4">
                      <div className="flex items-center justify-between border-b border-amber-200 pb-2">
                        <h4 className="text-sm font-extrabold text-amber-900 uppercase tracking-wider flex items-center gap-1.5">
                          <span>✏️</span> Edit Group & Schedule Details
                        </h4>
                        <button
                          type="button"
                          onClick={() => setEditingGroup(null)}
                          className="text-xs text-stone-500 hover:text-stone-800 font-bold cursor-pointer"
                        >
                          ✕ Cancel
                        </button>
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                          <label className="block text-xs font-bold text-stone-700 uppercase tracking-wider mb-1">
                            Group Name *
                          </label>
                          <input
                            type="text"
                            value={editingGroup.name}
                            onChange={(e) => setEditingGroup({ ...editingGroup, name: e.target.value })}
                            required
                            className="w-full px-3 py-2 bg-white border border-maroon-300 text-stone-900 text-sm font-semibold focus:outline-none focus:border-maroon-700"
                          />
                        </div>

                        <div>
                          <label className="block text-xs font-bold text-stone-700 uppercase tracking-wider mb-1">
                            Description
                          </label>
                          <input
                            type="text"
                            value={editingGroup.description}
                            onChange={(e) => setEditingGroup({ ...editingGroup, description: e.target.value })}
                            className="w-full px-3 py-2 bg-white border border-maroon-300 text-stone-900 text-sm focus:outline-none focus:border-maroon-700"
                          />
                        </div>

                        <div>
                          <label className="block text-xs font-bold text-stone-700 mb-1">
                            Sun – Thu Check-in Cutoff Time
                          </label>
                          <input
                            type="time"
                            value={editingGroup.weekdayCheckInTime}
                            onChange={(e) => setEditingGroup({ ...editingGroup, weekdayCheckInTime: e.target.value })}
                            required
                            className="w-full px-3 py-2 bg-white border border-maroon-300 text-stone-900 text-sm font-semibold focus:outline-none focus:border-maroon-700"
                          />
                        </div>

                        <div>
                          <label className="block text-xs font-bold text-stone-700 mb-1">
                            Saturday Check-in Cutoff Time
                          </label>
                          <input
                            type="time"
                            value={editingGroup.saturdayCheckInTime}
                            onChange={(e) => setEditingGroup({ ...editingGroup, saturdayCheckInTime: e.target.value })}
                            required
                            className="w-full px-3 py-2 bg-white border border-maroon-300 text-stone-900 text-sm font-semibold focus:outline-none focus:border-maroon-700"
                          />
                        </div>

                        <div className="md:col-span-2">
                          <label className="block text-xs font-bold text-stone-700 mb-1">
                            Weekend / Off Day
                          </label>
                          <select
                            value={editingGroup.weekendDays}
                            onChange={(e) => setEditingGroup({ ...editingGroup, weekendDays: e.target.value })}
                            className="w-full px-3 py-2 bg-white border border-maroon-300 text-stone-900 text-sm font-semibold focus:outline-none focus:border-maroon-700"
                          >
                            <option value="FRIDAY">Friday Only (Standard)</option>
                            <option value="FRIDAY_SATURDAY">Friday & Saturday</option>
                            <option value="SATURDAY_SUNDAY">Saturday & Sunday</option>
                          </select>
                        </div>
                      </div>

                      <div className="flex items-center gap-3 justify-end pt-2">
                        <button
                          type="button"
                          onClick={() => setEditingGroup(null)}
                          className="px-4 py-2 text-xs font-bold text-stone-600 hover:text-stone-900 border border-stone-300 cursor-pointer"
                        >
                          Cancel
                        </button>
                        <button
                          type="submit"
                          disabled={updating}
                          className="px-5 py-2 bg-maroon-700 hover:bg-maroon-800 text-white font-bold text-xs transition-colors cursor-pointer disabled:opacity-50"
                        >
                          {updating ? 'Saving...' : '💾 Save Changes'}
                        </button>
                      </div>
                    </form>
                  )}

                  {/* Member Management Section */}
                  {activeGroupId === group.id && (
                    <div className="mt-5 pt-5 border-t-2 border-maroon-200 space-y-4">
                      <h4 className="text-sm font-bold text-stone-800 uppercase tracking-wider flex items-center gap-2">
                        <span>👥</span> Group Members for "{group.name}"
                      </h4>

                      {/* Add Member Form */}
                      <form onSubmit={handleAddMember} className="flex items-center gap-3">
                        <select
                          value={selectedUserId}
                          onChange={(e) => setSelectedUserId(e.target.value)}
                          className="flex-1 px-4 py-2 bg-white border border-maroon-300 text-stone-900 text-sm font-medium focus:outline-none focus:border-maroon-700"
                        >
                          <option value="">-- Select user to add to group --</option>
                          {users
                            .filter((u) => !group.members?.some((m) => m.id === u.id))
                            .map((u) => (
                              <option key={u.id} value={u.id}>
                                {u.fullName ? `${u.fullName} (@${u.username})` : u.username} ({u.email})
                              </option>
                            ))}
                        </select>

                        <button
                          type="submit"
                          disabled={addingMember || !selectedUserId}
                          className="py-2 px-5 bg-maroon-700 hover:bg-maroon-800 text-white font-bold text-xs transition-colors cursor-pointer disabled:opacity-50 whitespace-nowrap"
                        >
                          {addingMember ? 'Adding...' : '➕ Add to Group'}
                        </button>
                      </form>

                      {/* Member List Table */}
                      {!group.members || group.members.length === 0 ? (
                        <p className="text-sm text-stone-500 py-3 italic">No members assigned to this group yet.</p>
                      ) : (
                        <div className="overflow-x-auto border border-maroon-200">
                          <table className="w-full text-left text-sm">
                            <thead className="bg-maroon-50 text-stone-700 text-xs font-bold uppercase border-b border-maroon-200">
                              <tr>
                                <th className="py-2.5 px-3">Name / Username</th>
                                <th className="py-2.5 px-3">Email</th>
                                <th className="py-2.5 px-3 text-right">Action</th>
                              </tr>
                            </thead>
                            <tbody className="divide-y divide-maroon-100">
                              {group.members.map((member) => (
                                <tr key={member.id} className="hover:bg-maroon-50/50">
                                  <td className="py-2.5 px-3">
                                    <strong className="text-stone-900">{member.fullName || member.username}</strong>
                                    <div className="text-xs text-stone-500">@{member.username}</div>
                                  </td>
                                  <td className="py-2.5 px-3 text-stone-600">{member.email}</td>
                                  <td className="py-2.5 px-3 text-right">
                                    <button
                                      type="button"
                                      onClick={() => handleRemoveMember(group.id, member.id, member.username)}
                                      className="text-xs font-bold text-red-600 hover:text-red-800 underline cursor-pointer"
                                    >
                                      Remove
                                    </button>
                                  </td>
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default function AdminGroupsPage() {
  return (
    <ProtectedRoute>
      <GroupsContent />
    </ProtectedRoute>
  );
}
