import {
  LayoutDashboard,
  FileText,
  Settings,
  Users,
  LogOut,
  Menu,
  X,
  Shield,
  User,
  ChevronRight,
  ClipboardCheck,
  BarChart3,
  Wrench,
} from 'lucide-react';
import { useState } from 'react';

const NAV_ITEMS = [
  { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard, roles: ['trainee', 'manager'] },
  { id: 'documents', label: 'Training Documents', icon: FileText, roles: ['trainee', 'manager'] },
  { id: 'review', label: 'Review & Sign Off', icon: ClipboardCheck, roles: ['manager'] },
  { id: 'progress-report', label: 'Progress Report', icon: BarChart3, roles: ['manager'] },
  { id: 'manage-documents', label: 'Manage Documents', icon: Settings, roles: ['manager'] },
  { id: 'manage-users', label: 'Manage Users', icon: Users, roles: ['manager'] },
  { id: 'settings', label: 'Settings', icon: Wrench, roles: ['manager'] },
];

export default function Sidebar({ currentUser, currentView, onNavigate, onLogout }) {
  const [mobileOpen, setMobileOpen] = useState(false);

  const visibleNav = NAV_ITEMS.filter((item) => item.roles.includes(currentUser.role));

  function handleNav(viewId) {
    onNavigate(viewId);
    setMobileOpen(false);
  }

  const sidebarContent = (
    <>
      {/* App header */}
      <div className="p-4 border-b border-slate-700">
        <img src="/logo.png" alt="Apex Auto Tech" className="h-8 mb-2" />
        <p className="text-xs text-slate-400">Training Tracker</p>
      </div>

      {/* User info */}
      <div className="p-4 border-b border-slate-700">
        <div className="flex items-center gap-3">
          <div className={`w-10 h-10 rounded-full flex items-center justify-center shrink-0 ${
            currentUser.role === 'manager' ? 'bg-purple-500/20' : 'bg-blue-500/20'
          }`}>
            {currentUser.role === 'manager' ? (
              <Shield className="w-5 h-5 text-purple-400" />
            ) : (
              <User className="w-5 h-5 text-blue-400" />
            )}
          </div>
          <div className="min-w-0">
            <div className="font-medium text-white truncate">{currentUser.name}</div>
            <span className={`inline-block text-xs font-semibold uppercase tracking-wide px-2 py-0.5 rounded-full ${
              currentUser.role === 'manager'
                ? 'bg-purple-500/20 text-purple-300'
                : 'bg-blue-500/20 text-blue-300'
            }`}>
              {currentUser.role}
            </span>
          </div>
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 p-3 space-y-1 overflow-y-auto">
        {visibleNav.map((item) => {
          const Icon = item.icon;
          const isActive = currentView === item.id;
          return (
            <button
              key={item.id}
              onClick={() => handleNav(item.id)}
              className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors ${
                isActive
                  ? 'bg-teal-600 text-white'
                  : 'text-slate-300 hover:bg-slate-700 hover:text-white'
              }`}
            >
              <Icon className="w-5 h-5 shrink-0" />
              <span className="truncate">{item.label}</span>
              {isActive && <ChevronRight className="w-4 h-4 ml-auto shrink-0" />}
            </button>
          );
        })}
      </nav>

      {/* Logout */}
      <div className="p-3 border-t border-slate-700">
        <button
          onClick={onLogout}
          className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium text-slate-400 hover:bg-slate-700 hover:text-white transition-colors"
        >
          <LogOut className="w-5 h-5" />
          Switch User
        </button>
      </div>
    </>
  );

  return (
    <>
      {/* Mobile hamburger */}
      <button
        onClick={() => setMobileOpen(true)}
        className="lg:hidden fixed top-3 left-3 z-50 p-2 bg-slate-800 text-white rounded-lg shadow-lg"
        aria-label="Open menu"
      >
        <Menu className="w-5 h-5" />
      </button>

      {/* Mobile overlay */}
      {mobileOpen && (
        <div
          className="lg:hidden fixed inset-0 bg-black/50 z-40"
          onClick={() => setMobileOpen(false)}
        />
      )}

      {/* Sidebar - mobile */}
      <aside
        className={`lg:hidden fixed inset-y-0 left-0 z-50 w-64 bg-slate-800 flex flex-col transform transition-transform ${
          mobileOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        <button
          onClick={() => setMobileOpen(false)}
          className="absolute top-3 right-3 p-1 text-slate-400 hover:text-white"
          aria-label="Close menu"
        >
          <X className="w-5 h-5" />
        </button>
        {sidebarContent}
      </aside>

      {/* Sidebar - desktop */}
      <aside className="hidden lg:flex w-64 bg-slate-800 flex-col shrink-0 h-screen sticky top-0">
        {sidebarContent}
      </aside>
    </>
  );
}
