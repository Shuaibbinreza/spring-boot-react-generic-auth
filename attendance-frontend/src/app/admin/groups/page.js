'use client';

import { useState, useEffect, useCallback } from 'react';
import ProtectedRoute from '@/components/ProtectedRoute';
import {
  getAdminGroups,
  createGroup,
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

  // Create Group State
  const [newGroup, setNewGroup] = useState({ name: '', description: '' });
  const [creating, setCreating] = useState(false);

  // Selected Group for Member Management Modal / View
  const [activeGroup, setActiveGroup] = useState(null);
  const [selectedUserId, setSelectedUserId] = useState('');
  const [addingMember, setAddingMember] = useState(false);

  const loadData = useCallback(async () => {
    setLoading(true);
    try {
      const [groupsRes, usersRes] = await Promise.all([
        getAdminGroups(),
        getAllUsers(),
      ]);
      setGroups(groupsRes.data || []);
      setUsers(usersRes.data || []);

      if (activeGroup) {
        const updatedActive = (groupsRes.data || []).find((g) => g.id === activeGroup.id);
        setActiveGroup(updatedActive || null);
      }
    } catch (err) {
      setMessage({ type: 'error', text: err.message || 'Failed to load group and user data' });
    } finally {
      setLoading(false);
    }
  }, [activeGroup]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const handleCreateGroup = async (e) => {
    e.preventDefault();
    if (!newGroup.name.trim()) return;

    setCreating(true);
    setMessage({ type: '', text: '' });

    try {
      await createGroup(newGroup);
      setNewGroup({ name: '', description: '' });
      setMessage({ type: 'success', text: 'Group created successfully!' });
      await loadData();
    } catch (err) {
      setMessage({ type: 'error', text: err.message || 'Failed to create group' });
    } finally {
      setCreating(false);
    }
  };

  const handleDeleteGroup = async (id, name) => {
    if (!window.confirm(`Are you sure you want to delete group "${name}"?`)) return;

    try {
      await deleteGroup(id);
      setMessage({ type: 'success', text: `Group "${name}" deleted successfully.` });
      if (activeGroup?.id === id) setActiveGroup(null);
      await loadData();
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
      const res = await addUserToGroup(activeGroup.id, selectedUserId);
      setActiveGroup(res.data);
      setSelectedUserId('');
      setMessage({ type: 'success', text: 'Member added to group successfully!' });
      await loadData();
    } catch (err) {
      setMessage({ type: 'error', text: err.message || 'Failed to add member to group' });
    } finally {
      setAddingMember(false);
    }
  };

  const handleRemoveMember = async (groupId, userId, username) => {
    if (!window.confirm(`Remove user "${username}" from group?`)) return;

    try {
      const res = await removeUserFromGroup(groupId, userId);
      if (activeGroup?.id === groupId) {
        setActiveGroup(res.data);
      }
      setMessage({ type: 'success', text: `User "${username}" removed from group.` });
      await loadData();
    } catch (err) {
      setMessage({ type: 'error', text: err.message || 'Failed to remove member' });
    }
  };

  return (
    <div className="space-y-6">
      <div className="border-b border-maroon-200 pb-4">
        <h1 className="text-3xl font-extrabold text-maroon-700 tracking-tight">Group Management</h1>
        <p className="text-base text-stone-600 mt-1">
          Create groups, manage member assignments, and organize teams for attendance tracking.
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
        {/* Create Group Card */}
        <div className="bg-white border border-maroon-300 p-6 shadow-maroon-sm lg:col-span-1">
          <div className="text-sm font-semibold text-stone-500 uppercase tracking-wider mb-4 flex items-center gap-2">
            <span>➕</span> Create New Group
          </div>

          <form onSubmit={handleCreateGroup} className="space-y-4">
            <div>
              <label htmlFor="groupName" className="block text-xs font-bold text-stone-700 uppercase tracking-wider mb-1.5">
                Group Name
              </label>
              <input
                type="text"
                id="groupName"
                placeholder="e.g. Engineering Team, Operations, HR"
                value={newGroup.name}
                onChange={(e) => setNewGroup({ ...newGroup, name: e.target.value })}
                required
                className="w-full px-4 py-2.5 bg-white border border-maroon-300 text-stone-900 text-base focus:outline-none focus:border-maroon-700 focus:ring-1 focus:ring-maroon-700"
              />
            </div>

            <div>
              <label htmlFor="groupDesc" className="block text-xs font-bold text-stone-700 uppercase tracking-wider mb-1.5">
                Description
              </label>
              <textarea
                id="groupDesc"
                rows="3"
                placeholder="Brief description of team or department responsibilities..."
                value={newGroup.description}
                onChange={(e) => setNewGroup({ ...newGroup, description: e.target.value })}
                className="w-full px-4 py-2.5 bg-white border border-maroon-300 text-stone-900 text-base focus:outline-none focus:border-maroon-700 focus:ring-1 focus:ring-maroon-700 resize-none"
              />
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

        {/* Existing Groups List Card */}
        <div className="bg-white border border-maroon-300 p-6 shadow-maroon-sm lg:col-span-2">
          <div className="text-sm font-semibold text-stone-500 uppercase tracking-wider mb-4 flex items-center gap-2">
            <span>🏢</span> Existing Groups ({groups.length})
          </div>

          {loading ? (
            <p className="text-sm text-stone-500">Loading groups...</p>
          ) : groups.length === 0 ? (
            <p className="text-base text-stone-500 py-6 text-center">No groups created yet. Create a group above.</p>
          ) : (
            <div className="space-y-4">
              {groups.map((group) => (
                <div
                  key={group.id}
                  className={`p-4.5 border transition-colors ${
                    activeGroup?.id === group.id
                      ? 'bg-maroon-50 border-maroon-700'
                      : 'bg-white border-maroon-300 hover:bg-maroon-100/40'
                  }`}
                >
                  <div className="flex items-start justify-between gap-4 mb-3">
                    <div>
                      <h3 className="text-lg font-extrabold text-stone-900">{group.name}</h3>
                      <p className="text-sm text-stone-600 mt-0.5">{group.description || 'No description provided'}</p>
                    </div>
                    <span className="px-3 py-1 text-xs font-bold bg-stone-100 text-stone-700 border border-stone-200 whitespace-nowrap">
                      👥 {group.memberCount} member{group.memberCount !== 1 ? 's' : ''}
                    </span>
                  </div>

                  <div className="flex items-center gap-3">
                    <button
                      className="px-3.5 py-1.5 text-xs font-bold bg-maroon-50 text-maroon-700 border border-maroon-300 hover:bg-maroon-200 transition-colors cursor-pointer"
                      onClick={() => setActiveGroup(group)}
                    >
                      ⚙️ Manage Members
                    </button>
                    <button
                      className="px-3.5 py-1.5 text-xs font-bold bg-red-50 text-red-600 border border-red-200 hover:bg-red-100 transition-colors cursor-pointer"
                      onClick={() => handleDeleteGroup(group.id, group.name)}
                    >
                      🗑️ Delete
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Member Management Section */}
      {activeGroup && (
        <div className="bg-white border border-maroon-300 p-6 shadow-maroon-sm">
          <div className="flex items-center justify-between border-b border-maroon-200 pb-3 mb-4">
            <h3 className="text-sm font-bold text-stone-700 uppercase tracking-wider flex items-center gap-2">
              <span>👥</span> Manage Members for "{activeGroup.name}"
            </h3>
            <button
              className="text-xs font-bold text-stone-500 hover:text-stone-900 cursor-pointer"
              onClick={() => setActiveGroup(null)}
            >
              ✖ Close
            </button>
          </div>

          {/* Add User to Group Form */}
          <form onSubmit={handleAddMember} className="flex gap-3 mb-6">
            <select
              value={selectedUserId}
              onChange={(e) => setSelectedUserId(e.target.value)}
              required
              className="flex-1 px-4 py-2.5 bg-white border border-maroon-300 text-stone-900 text-base focus:outline-none focus:border-maroon-700"
            >
              <option value="">Select a user to add...</option>
              {users
                .filter(
                  (u) => !activeGroup.members?.some((m) => m.id === u.id)
                )
                .map((u) => (
                  <option key={u.id} value={u.id}>
                    {u.fullName || u.username} ({u.email})
                  </option>
                ))}
            </select>

            <button
              type="submit"
              disabled={addingMember || !selectedUserId}
              className="px-5 py-2.5 bg-maroon-700 hover:bg-maroon-800 text-white font-bold text-sm whitespace-nowrap disabled:opacity-50 cursor-pointer transition-colors"
            >
              {addingMember ? 'Adding...' : '➕ Add to Group'}
            </button>
          </form>

          {/* Group Member List */}
          <div>
            <h4 className="text-xs font-bold text-stone-500 uppercase tracking-wider mb-2">
              Current Members ({activeGroup.members?.length || 0})
            </h4>
            {!activeGroup.members || activeGroup.members.length === 0 ? (
              <p className="text-base text-stone-500 py-4 text-center">No members in this group yet.</p>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left text-base">
                  <thead>
                    <tr className="border-b border-maroon-300 text-stone-500 text-xs font-bold uppercase tracking-wider">
                      <th className="py-3 px-3">User</th>
                      <th className="py-3 px-3">Email</th>
                      <th className="py-3 px-3">Action</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-maroon-100">
                    {activeGroup.members.map((member) => (
                      <tr key={member.id} className="hover:bg-maroon-100/50 transition-colors">
                        <td className="py-3 px-3">
                          <strong className="text-stone-900 font-bold">{member.fullName || member.username}</strong>
                          <div className="text-xs text-stone-500">@{member.username}</div>
                        </td>
                        <td className="py-3 px-3 text-stone-700">{member.email}</td>
                        <td className="py-3 px-3">
                          <button
                            className="px-3 py-1 text-xs font-semibold bg-red-50 text-red-600 border border-red-200 hover:bg-red-100 transition-colors cursor-pointer"
                            onClick={() => handleRemoveMember(activeGroup.id, member.id, member.username)}
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
        </div>
      )}
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
