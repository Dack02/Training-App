import { useState } from 'react';
import { Shield, User, Pencil, Check, X } from 'lucide-react';
import { updateProfile } from '../lib/api';

export default function ManageUsers({ users, currentUser, onDataChange }) {
  const [editingId, setEditingId] = useState(null);
  const [editName, setEditName] = useState('');
  const [editRole, setEditRole] = useState('trainee');
  const [error, setError] = useState('');

  async function handleEdit(userId) {
    const trimmed = editName.trim();
    if (!trimmed) return;
    try {
      await updateProfile(userId, { name: trimmed, role: editRole });
      await onDataChange();
      setEditingId(null);
      setError('');
    } catch (err) {
      setError('Failed to update: ' + err.message);
    }
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-2xl font-bold text-slate-800">Manage Users</h2>
          <p className="text-slate-500 mt-1">{users.length} users</p>
        </div>
        <p className="text-sm text-slate-400">Users sign up via the login page</p>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 rounded-lg px-4 py-3 text-sm mb-4">
          {error}
        </div>
      )}

      <div className="space-y-2">
        {users.map((user) => (
          <div key={user.id} className="bg-white rounded-lg border border-slate-200 p-4">
            {editingId === user.id ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <input
                  type="text"
                  value={editName}
                  onChange={(e) => setEditName(e.target.value)}
                  autoFocus
                  className="px-3 py-2 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-teal-500"
                />
                <select
                  value={editRole}
                  onChange={(e) => setEditRole(e.target.value)}
                  className="px-3 py-2 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-teal-500"
                >
                  <option value="trainee">Trainee</option>
                  <option value="manager">Manager</option>
                </select>
                <div className="flex gap-2 sm:col-span-2">
                  <button onClick={() => handleEdit(user.id)} className="px-3 py-1.5 bg-teal-600 text-white rounded text-sm hover:bg-teal-700">Save</button>
                  <button onClick={() => setEditingId(null)} className="px-3 py-1.5 border border-slate-300 text-slate-600 rounded text-sm hover:bg-slate-50">Cancel</button>
                </div>
              </div>
            ) : (
              <div className="flex items-center gap-3">
                <div className={`w-10 h-10 rounded-full flex items-center justify-center shrink-0 ${
                  user.role === 'manager' ? 'bg-purple-100' : 'bg-blue-100'
                }`}>
                  {user.role === 'manager' ? <Shield className="w-5 h-5 text-purple-600" /> : <User className="w-5 h-5 text-blue-600" />}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="font-medium text-slate-800">
                    {user.name}
                    {user.id === currentUser.id && (
                      <span className="text-xs text-slate-400 ml-2">(you)</span>
                    )}
                  </div>
                  <div className={`text-xs font-semibold uppercase tracking-wide ${
                    user.role === 'manager' ? 'text-purple-600' : 'text-blue-600'
                  }`}>{user.role}</div>
                </div>
                <button
                  onClick={() => { setEditingId(user.id); setEditName(user.name); setEditRole(user.role); }}
                  className="p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-50 rounded-lg"
                >
                  <Pencil className="w-4 h-4" />
                </button>
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
