import { useState } from 'react';
import { UserPlus, Shield, User, Pencil, Trash2, Check, X, KeyRound } from 'lucide-react';
import { generateId } from '../utils/ids';

export default function ManageUsers({ users, currentUser, onSaveUsers }) {
  const [showCreate, setShowCreate] = useState(false);
  const [name, setName] = useState('');
  const [role, setRole] = useState('trainee');
  const [pin, setPin] = useState('');
  const [editingId, setEditingId] = useState(null);
  const [editName, setEditName] = useState('');
  const [editRole, setEditRole] = useState('trainee');
  const [editPin, setEditPin] = useState('');
  const [deleteConfirm, setDeleteConfirm] = useState(null);
  const [error, setError] = useState('');

  function handleCreate(e) {
    e.preventDefault();
    const trimmed = name.trim();
    if (!trimmed) { setError('Name is required'); return; }
    if (pin && !/^\d{4}$/.test(pin)) { setError('PIN must be exactly 4 digits'); return; }
    const newUser = { id: generateId(), name: trimmed, role, pin: pin || undefined };
    onSaveUsers([...users, newUser]);
    setName(''); setRole('trainee'); setPin(''); setShowCreate(false); setError('');
  }

  function handleEdit(userId) {
    const trimmed = editName.trim();
    if (!trimmed) return;
    if (editPin && !/^\d{4}$/.test(editPin)) return;
    onSaveUsers(
      users.map((u) =>
        u.id === userId ? { ...u, name: trimmed, role: editRole, pin: editPin || undefined } : u
      )
    );
    setEditingId(null);
  }

  function handleDelete(userId) {
    onSaveUsers(users.filter((u) => u.id !== userId));
    setDeleteConfirm(null);
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-2xl font-bold text-slate-800">Manage Users</h2>
          <p className="text-slate-500 mt-1">{users.length} users</p>
        </div>
        <button
          onClick={() => setShowCreate(true)}
          className="flex items-center gap-2 px-4 py-2.5 bg-teal-600 text-white rounded-lg hover:bg-teal-700 transition-colors font-medium"
        >
          <UserPlus className="w-4 h-4" />
          Add User
        </button>
      </div>

      {showCreate && (
        <form onSubmit={handleCreate} className="bg-white rounded-lg border border-slate-200 p-4 mb-4">
          <h3 className="font-semibold text-slate-700 mb-3">New User</h3>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div>
              <label className="block text-xs font-medium text-slate-500 mb-1">Name</label>
              <input
                type="text"
                value={name}
                onChange={(e) => { setName(e.target.value); setError(''); }}
                autoFocus
                className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-teal-500"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-500 mb-1">Role</label>
              <select
                value={role}
                onChange={(e) => setRole(e.target.value)}
                className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-teal-500"
              >
                <option value="trainee">Trainee</option>
                <option value="manager">Manager</option>
              </select>
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-500 mb-1">PIN (optional)</label>
              <input
                type="password"
                maxLength={4}
                value={pin}
                onChange={(e) => setPin(e.target.value.replace(/\D/g, '').slice(0, 4))}
                placeholder="4 digits"
                className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-teal-500"
              />
            </div>
          </div>
          {error && <p className="text-red-500 text-sm mt-2">{error}</p>}
          <div className="flex gap-2 mt-3">
            <button type="submit" className="px-4 py-2 bg-teal-600 text-white rounded-lg hover:bg-teal-700 text-sm">Create</button>
            <button type="button" onClick={() => { setShowCreate(false); setError(''); }} className="px-4 py-2 border border-slate-300 text-slate-600 rounded-lg hover:bg-slate-50 text-sm">Cancel</button>
          </div>
        </form>
      )}

      <div className="space-y-2">
        {users.map((user) => (
          <div key={user.id} className="bg-white rounded-lg border border-slate-200 p-4">
            {editingId === user.id ? (
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
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
                <input
                  type="password"
                  maxLength={4}
                  value={editPin}
                  onChange={(e) => setEditPin(e.target.value.replace(/\D/g, '').slice(0, 4))}
                  placeholder="New PIN (optional)"
                  className="px-3 py-2 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-teal-500"
                />
                <div className="flex gap-2 sm:col-span-3">
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
                  <div className="flex items-center gap-2">
                    <span className={`text-xs font-semibold uppercase tracking-wide ${
                      user.role === 'manager' ? 'text-purple-600' : 'text-blue-600'
                    }`}>{user.role}</span>
                    {user.pin && <KeyRound className="w-3 h-3 text-slate-400" />}
                  </div>
                </div>
                <button
                  onClick={() => { setEditingId(user.id); setEditName(user.name); setEditRole(user.role); setEditPin(user.pin || ''); }}
                  className="p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-50 rounded-lg"
                >
                  <Pencil className="w-4 h-4" />
                </button>
                {user.id !== currentUser.id && (
                  deleteConfirm === user.id ? (
                    <div className="flex items-center gap-1">
                      <span className="text-xs text-red-600 mr-1">Delete?</span>
                      <button onClick={() => handleDelete(user.id)} className="p-1.5 text-red-600 hover:bg-red-50 rounded"><Check className="w-4 h-4" /></button>
                      <button onClick={() => setDeleteConfirm(null)} className="p-1.5 text-slate-400 hover:bg-slate-50 rounded"><X className="w-4 h-4" /></button>
                    </div>
                  ) : (
                    <button
                      onClick={() => setDeleteConfirm(user.id)}
                      className="p-2 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  )
                )}
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
