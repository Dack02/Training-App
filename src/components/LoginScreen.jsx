import { useState } from 'react';
import { Users, UserPlus, Shield, User, ArrowRight, KeyRound } from 'lucide-react';
import { generateId } from '../utils/ids';

export default function LoginScreen({ users, onLogin, onCreateUser }) {
  const [showCreate, setShowCreate] = useState(false);
  const [name, setName] = useState('');
  const [role, setRole] = useState('trainee');
  const [pin, setPin] = useState('');
  const [pinInput, setPinInput] = useState('');
  const [selectedUser, setSelectedUser] = useState(null);
  const [error, setError] = useState('');

  function handleCreate(e) {
    e.preventDefault();
    const trimmed = name.trim();
    if (!trimmed) {
      setError('Name is required');
      return;
    }
    if (pin && (pin.length !== 4 || !/^\d{4}$/.test(pin))) {
      setError('PIN must be exactly 4 digits');
      return;
    }
    const newUser = {
      id: generateId(),
      name: trimmed,
      role,
      pin: pin || undefined,
    };
    onCreateUser(newUser);
    setName('');
    setRole('trainee');
    setPin('');
    setShowCreate(false);
    setError('');
  }

  function handleSelectUser(user) {
    if (user.pin) {
      setSelectedUser(user);
      setPinInput('');
      setError('');
    } else {
      onLogin(user.id);
    }
  }

  function handlePinSubmit(e) {
    e.preventDefault();
    if (pinInput === selectedUser.pin) {
      onLogin(selectedUser.id);
      setSelectedUser(null);
      setPinInput('');
      setError('');
    } else {
      setError('Incorrect PIN');
    }
  }

  // PIN entry modal
  if (selectedUser) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4">
        <div className="bg-white rounded-xl shadow-lg p-8 w-full max-w-sm">
          <div className="text-center mb-6">
            <div className="w-16 h-16 bg-slate-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <KeyRound className="w-8 h-8 text-slate-600" />
            </div>
            <h2 className="text-xl font-semibold text-slate-800">Enter PIN</h2>
            <p className="text-slate-500 mt-1">for {selectedUser.name}</p>
          </div>
          <form onSubmit={handlePinSubmit}>
            <input
              type="password"
              maxLength={4}
              value={pinInput}
              onChange={(e) => {
                setPinInput(e.target.value.replace(/\D/g, '').slice(0, 4));
                setError('');
              }}
              placeholder="4-digit PIN"
              autoFocus
              className="w-full px-4 py-3 text-center text-2xl tracking-[0.5em] border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-transparent"
            />
            {error && <p className="text-red-500 text-sm mt-2 text-center">{error}</p>}
            <div className="flex gap-3 mt-6">
              <button
                type="button"
                onClick={() => { setSelectedUser(null); setError(''); }}
                className="flex-1 px-4 py-2.5 border border-slate-300 text-slate-700 rounded-lg hover:bg-slate-50 transition-colors"
              >
                Back
              </button>
              <button
                type="submit"
                className="flex-1 px-4 py-2.5 bg-teal-600 text-white rounded-lg hover:bg-teal-700 transition-colors"
              >
                Unlock
              </button>
            </div>
          </form>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-xl shadow-lg p-8 w-full max-w-md">
        <div className="text-center mb-8">
          <img src="/logo.png" alt="Apex Auto Tech" className="h-12 mx-auto mb-4" />
          <h1 className="text-2xl font-bold text-slate-800">Training Tracker</h1>
          <p className="text-slate-500 mt-1">Select your profile to continue</p>
        </div>

        {/* User list */}
        {users.length > 0 && (
          <div className="space-y-2 mb-6">
            {users.map((user) => (
              <button
                key={user.id}
                onClick={() => handleSelectUser(user)}
                className="w-full flex items-center gap-3 px-4 py-3 rounded-lg border border-slate-200 hover:border-teal-300 hover:bg-teal-50/50 transition-all text-left group"
              >
                <div className={`w-10 h-10 rounded-full flex items-center justify-center ${
                  user.role === 'manager' ? 'bg-purple-100' : 'bg-blue-100'
                }`}>
                  {user.role === 'manager' ? (
                    <Shield className="w-5 h-5 text-purple-600" />
                  ) : (
                    <User className="w-5 h-5 text-blue-600" />
                  )}
                </div>
                <div className="flex-1">
                  <div className="font-medium text-slate-800">{user.name}</div>
                  <div className={`text-xs font-medium uppercase tracking-wide ${
                    user.role === 'manager' ? 'text-purple-600' : 'text-blue-600'
                  }`}>
                    {user.role}
                  </div>
                </div>
                {user.pin && <KeyRound className="w-4 h-4 text-slate-400" />}
                <ArrowRight className="w-4 h-4 text-slate-400 group-hover:text-teal-600 transition-colors" />
              </button>
            ))}
          </div>
        )}

        {users.length === 0 && !showCreate && (
          <div className="text-center py-6 mb-4">
            <p className="text-slate-400 mb-1">No users yet</p>
            <p className="text-slate-400 text-sm">Create a user to get started</p>
          </div>
        )}

        {/* Create user form */}
        {showCreate ? (
          <form onSubmit={handleCreate} className="border border-slate-200 rounded-lg p-4">
            <h3 className="font-semibold text-slate-700 mb-4">Create New User</h3>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-600 mb-1">Name</label>
                <input
                  type="text"
                  value={name}
                  onChange={(e) => { setName(e.target.value); setError(''); }}
                  placeholder="Enter name"
                  autoFocus
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-transparent"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-600 mb-1">Role</label>
                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={() => setRole('trainee')}
                    className={`flex-1 px-3 py-2 rounded-lg border text-sm font-medium transition-colors ${
                      role === 'trainee'
                        ? 'bg-blue-50 border-blue-300 text-blue-700'
                        : 'border-slate-300 text-slate-600 hover:bg-slate-50'
                    }`}
                  >
                    <User className="w-4 h-4 inline mr-1.5 -mt-0.5" />
                    Trainee
                  </button>
                  <button
                    type="button"
                    onClick={() => setRole('manager')}
                    className={`flex-1 px-3 py-2 rounded-lg border text-sm font-medium transition-colors ${
                      role === 'manager'
                        ? 'bg-purple-50 border-purple-300 text-purple-700'
                        : 'border-slate-300 text-slate-600 hover:bg-slate-50'
                    }`}
                  >
                    <Shield className="w-4 h-4 inline mr-1.5 -mt-0.5" />
                    Manager
                  </button>
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-600 mb-1">
                  PIN <span className="text-slate-400 font-normal">(optional, 4 digits)</span>
                </label>
                <input
                  type="password"
                  maxLength={4}
                  value={pin}
                  onChange={(e) => { setPin(e.target.value.replace(/\D/g, '').slice(0, 4)); setError(''); }}
                  placeholder="••••"
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-transparent"
                />
              </div>
              {error && <p className="text-red-500 text-sm">{error}</p>}
              <div className="flex gap-3">
                <button
                  type="button"
                  onClick={() => { setShowCreate(false); setError(''); }}
                  className="flex-1 px-4 py-2.5 border border-slate-300 text-slate-700 rounded-lg hover:bg-slate-50 transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex-1 px-4 py-2.5 bg-teal-600 text-white rounded-lg hover:bg-teal-700 transition-colors font-medium"
                >
                  Create User
                </button>
              </div>
            </div>
          </form>
        ) : (
          <button
            onClick={() => setShowCreate(true)}
            className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-teal-600 text-white rounded-lg hover:bg-teal-700 transition-colors font-medium"
          >
            <UserPlus className="w-5 h-5" />
            Create New User
          </button>
        )}
      </div>
    </div>
  );
}
