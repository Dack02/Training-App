import { useState, useEffect, useCallback } from 'react';
import storage from './utils/storage';
import { createFOHDocument } from './utils/seedData';
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
  const [users, setUsers] = useState([]);
  const [currentUserId, setCurrentUserId] = useState(null);
  const [currentView, setCurrentView] = useState('dashboard');
  const [documents, setDocuments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Load initial data + seed FOH document on first run
  useEffect(() => {
    try {
      const storedUsers = storage.get('users') || [];
      const storedCurrentUser = storage.get('current-user', { shared: false });
      setUsers(storedUsers);
      if (storedCurrentUser && storedUsers.some((u) => u.id === storedCurrentUser)) {
        setCurrentUserId(storedCurrentUser);
      }

      // Load documents
      let storedDocs = storage.get('documents');
      if (storedDocs === null) {
        // First run — seed the FOH Basic Tasks document
        const fohDoc = createFOHDocument();
        storedDocs = [{ id: fohDoc.id, title: fohDoc.title, createdAt: fohDoc.createdAt, groups: fohDoc.groups }];
        storage.set('documents', storedDocs);
        storage.set(`doc:${fohDoc.id}`, fohDoc);
      }
      setDocuments(storedDocs);
    } catch (err) {
      setError('Failed to load app data. Please try refreshing the page.');
    } finally {
      setLoading(false);
    }
  }, []);

  const currentUser = users.find((u) => u.id === currentUserId) || null;

  const handleCreateUser = useCallback(
    (newUser) => {
      const updated = [...users, newUser];
      storage.set('users', updated);
      setUsers(updated);
    },
    [users]
  );

  const handleLogin = useCallback((userId) => {
    storage.set('current-user', userId, { shared: false });
    setCurrentUserId(userId);
    setCurrentView('dashboard');
  }, []);

  const handleLogout = useCallback(() => {
    storage.delete('current-user', { shared: false });
    setCurrentUserId(null);
    setCurrentView('dashboard');
  }, []);

  const handleSaveDocuments = useCallback((docs) => {
    storage.set('documents', docs);
    setDocuments(docs);
  }, []);

  const handleSaveDoc = useCallback((doc) => {
    storage.set(`doc:${doc.id}`, doc);
    // Also update the documents list with the latest group info
    setDocuments((prev) => {
      const updated = prev.map((d) =>
        d.id === doc.id ? { ...d, title: doc.title, groups: doc.groups } : d
      );
      // If it's a new doc not yet in the list, add it
      if (!updated.some((d) => d.id === doc.id)) {
        updated.push({ id: doc.id, title: doc.title, createdAt: doc.createdAt, groups: doc.groups });
      }
      storage.set('documents', updated);
      return updated;
    });
  }, []);

  // Loading state
  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <div className="text-center">
          <div className="w-8 h-8 border-3 border-teal-600 border-t-transparent rounded-full animate-spin mx-auto mb-3" />
          <p className="text-slate-500">Loading...</p>
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
            onClick={() => window.location.reload()}
            className="px-6 py-2.5 bg-teal-600 text-white rounded-lg hover:bg-teal-700 transition-colors"
          >
            Refresh Page
          </button>
        </div>
      </div>
    );
  }

  // Login screen
  if (!currentUser) {
    return (
      <LoginScreen
        users={users}
        onLogin={handleLogin}
        onCreateUser={handleCreateUser}
      />
    );
  }

  // Main app with sidebar
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
              onSaveDocuments={handleSaveDocuments}
              onSaveDoc={handleSaveDoc}
              users={users}
              onSaveUsers={(updated) => { storage.set('users', updated); setUsers(updated); }}
              onNavigate={setCurrentView}
            />
          </div>
        </main>
      </div>
    </ToastProvider>
  );
}

function MainContent({ currentView, currentUser, documents, onSaveDocuments, onSaveDoc, users, onSaveUsers, onNavigate }) {
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
          onSaveDocuments={onSaveDocuments}
          onSaveDoc={onSaveDoc}
          currentUser={currentUser}
        />
      );
    case 'manage-users':
      return (
        <ManageUsers
          users={users}
          currentUser={currentUser}
          onSaveUsers={onSaveUsers}
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
