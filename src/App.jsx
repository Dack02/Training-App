import { useState, useEffect, useCallback } from 'react';
import { useAuth } from './contexts/AuthContext';
import { fetchAllDocumentsWithChildren, fetchProfiles } from './lib/api';
import { signOut } from './lib/auth';
import LoginScreen from './components/LoginScreen';
import Sidebar from './components/Sidebar';
import Breadcrumb from './components/Breadcrumb';
import PlaceholderView from './components/PlaceholderView';
import Dashboard from './components/Dashboard';
import ManageDocuments from './components/ManageDocuments';
import ManageUsers from './components/ManageUsers';
import DocumentView from './components/DocumentView';
import ManagerReview from './components/ManagerReview';
import ProgressReport from './components/ProgressReport';
import Settings from './components/Settings';
import { ToastProvider } from './components/Toast';

export default function App() {
  const { user, profile, loading: authLoading } = useAuth();
  const [currentView, setCurrentView] = useState('dashboard');
  const [documents, setDocuments] = useState([]);
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const loadData = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const [docs, profiles] = await Promise.all([
        fetchAllDocumentsWithChildren(),
        fetchProfiles(),
      ]);
      setDocuments(docs);
      setUsers(profiles);
    } catch (err) {
      setError('Failed to load app data: ' + err.message);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (user) {
      loadData();
    } else {
      setLoading(false);
    }
  }, [user, loadData]);

  const handleLogout = useCallback(async () => {
    await signOut();
    setCurrentView('dashboard');
  }, []);

  // Auth still loading
  if (authLoading) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <div className="text-center">
          <div className="w-8 h-8 border-3 border-teal-600 border-t-transparent rounded-full animate-spin mx-auto mb-3" />
          <p className="text-slate-500">Loading...</p>
        </div>
      </div>
    );
  }

  // Not signed in
  if (!user || !profile) {
    return <LoginScreen />;
  }

  // Data loading
  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <div className="text-center">
          <div className="w-8 h-8 border-3 border-teal-600 border-t-transparent rounded-full animate-spin mx-auto mb-3" />
          <p className="text-slate-500">Loading data...</p>
        </div>
      </div>
    );
  }

  // Error state
  if (error) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4">
        <div className="bg-white rounded-xl shadow-lg p-8 max-w-md text-center">
          <div className="text-red-500 text-4xl mb-4">!</div>
          <h2 className="text-xl font-semibold text-slate-800 mb-2">Something went wrong</h2>
          <p className="text-slate-500 mb-6">{error}</p>
          <button
            onClick={loadData}
            className="px-6 py-2.5 bg-teal-600 text-white rounded-lg hover:bg-teal-700 transition-colors"
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  // Build currentUser shape for compatibility with components
  const currentUser = {
    id: profile.id,
    name: profile.name,
    role: profile.role,
  };

  return (
    <ToastProvider>
      <div className="flex min-h-screen bg-slate-50">
        <Sidebar
          currentUser={currentUser}
          currentView={currentView}
          onNavigate={setCurrentView}
          onLogout={handleLogout}
        />
        <main className="flex-1 min-w-0">
          <div className="p-6 lg:p-8 max-w-6xl">
            <Breadcrumb currentView={currentView} />
            <MainContent
              currentView={currentView}
              currentUser={currentUser}
              documents={documents}
              users={users}
              onNavigate={setCurrentView}
              onDataChange={loadData}
            />
          </div>
        </main>
      </div>
    </ToastProvider>
  );
}

function MainContent({ currentView, currentUser, documents, users, onNavigate, onDataChange }) {
  switch (currentView) {
    case 'dashboard':
      return (
        <Dashboard
          documents={documents}
          currentUser={currentUser}
          users={users}
          onNavigate={onNavigate}
        />
      );
    case 'documents':
      return (
        <DocumentView
          documents={documents}
          currentUser={currentUser}
        />
      );
    case 'review':
      return (
        <ManagerReview
          documents={documents}
          users={users}
          currentUser={currentUser}
        />
      );
    case 'progress-report':
      return (
        <ProgressReport
          documents={documents}
          users={users}
          currentUser={currentUser}
        />
      );
    case 'manage-documents':
      return (
        <ManageDocuments
          documents={documents}
          currentUser={currentUser}
          onDataChange={onDataChange}
        />
      );
    case 'manage-users':
      return (
        <ManageUsers
          users={users}
          currentUser={currentUser}
          onDataChange={onDataChange}
        />
      );
    case 'settings':
      return <Settings />;
    default:
      return (
        <PlaceholderView
          title="Not Found"
          description="This page doesn't exist."
        />
      );
  }
}
