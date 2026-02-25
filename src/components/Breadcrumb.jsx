import { ChevronRight, Home } from 'lucide-react';

const VIEW_LABELS = {
  dashboard: 'Dashboard',
  documents: 'Training Documents',
  review: 'Review & Sign Off',
  'progress-report': 'Progress Report',
  'manage-documents': 'Manage Documents',
  'manage-users': 'Manage Users',
  'settings': 'Settings',
};

export default function Breadcrumb({ currentView, extra }) {
  return (
    <div className="flex items-center gap-1.5 text-sm text-slate-500 mb-6">
      <Home className="w-4 h-4" />
      <ChevronRight className="w-3 h-3" />
      <span className="text-slate-700 font-medium">
        {VIEW_LABELS[currentView] || currentView}
      </span>
      {extra && (
        <>
          <ChevronRight className="w-3 h-3" />
          <span className="text-slate-700 font-medium">{extra}</span>
        </>
      )}
    </div>
  );
}
