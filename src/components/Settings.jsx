import { useState } from 'react';
import { LogOut, Info } from 'lucide-react';
import { signOut } from '../lib/auth';
import { useAuth } from '../contexts/AuthContext';

export default function Settings() {
  const { profile } = useAuth();
  const [signingOut, setSigningOut] = useState(false);

  async function handleSignOut() {
    setSigningOut(true);
    try {
      await signOut();
    } catch {
      setSigningOut(false);
    }
  }

  return (
    <div>
      <h2 className="text-2xl font-bold text-slate-800 mb-1">Settings</h2>
      <p className="text-slate-500 mb-6">Account and application settings</p>

      <div className="space-y-4">
        {/* Account info */}
        <div className="bg-white rounded-lg border border-slate-200 p-5">
          <h3 className="font-semibold text-slate-800 mb-3 flex items-center gap-2">
            <Info className="w-4 h-4 text-slate-500" />
            Account
          </h3>
          <div className="space-y-2 text-sm">
            <div className="flex justify-between">
              <span className="text-slate-500">Name</span>
              <span className="text-slate-800 font-medium">{profile?.name}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-500">Role</span>
              <span className={`font-semibold uppercase text-xs tracking-wide ${
                profile?.role === 'manager' ? 'text-purple-600' : 'text-blue-600'
              }`}>{profile?.role}</span>
            </div>
          </div>
        </div>

        {/* Sign out */}
        <div className="bg-white rounded-lg border border-slate-200 p-5">
          <h3 className="font-semibold text-slate-800 mb-1 flex items-center gap-2">
            <LogOut className="w-4 h-4 text-slate-500" />
            Sign Out
          </h3>
          <p className="text-sm text-slate-500 mb-4">
            Sign out of your account on this device.
          </p>
          <button
            onClick={handleSignOut}
            disabled={signingOut}
            className="flex items-center gap-2 px-4 py-2.5 bg-slate-100 text-slate-700 border border-slate-200 rounded-lg hover:bg-slate-200 transition-colors text-sm font-medium disabled:opacity-50"
          >
            <LogOut className="w-4 h-4" />
            {signingOut ? 'Signing out...' : 'Sign Out'}
          </button>
        </div>
      </div>
    </div>
  );
}
