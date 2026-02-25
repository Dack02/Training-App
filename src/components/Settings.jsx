import { useState } from 'react';
import { AlertTriangle, Trash2, RotateCcw } from 'lucide-react';
import storage from '../utils/storage';
import { useToast } from './Toast';

export default function Settings() {
  const [step, setStep] = useState(0); // 0=idle, 1=first confirm, 2=final confirm
  const toast = useToast();

  function handleReset() {
    storage.clearAll();
    toast('All data cleared. Reloading...', 'info', 2000);
    setTimeout(() => window.location.reload(), 1500);
  }

  return (
    <div>
      <h2 className="text-2xl font-bold text-slate-800 mb-1">Settings</h2>
      <p className="text-slate-500 mb-6">Application settings and data management</p>

      <div className="bg-white rounded-lg border border-slate-200 overflow-hidden">
        {/* Data Management Section */}
        <div className="p-5">
          <h3 className="font-semibold text-slate-800 mb-1 flex items-center gap-2">
            <Trash2 className="w-4 h-4 text-slate-500" />
            Data Management
          </h3>
          <p className="text-sm text-slate-500 mb-4">
            Clear all application data including users, documents, progress, and sign-offs. This cannot be undone.
          </p>

          {step === 0 && (
            <button
              onClick={() => setStep(1)}
              className="flex items-center gap-2 px-4 py-2.5 bg-red-50 text-red-600 border border-red-200 rounded-lg hover:bg-red-100 transition-colors text-sm font-medium"
            >
              <RotateCcw className="w-4 h-4" />
              Reset All Data
            </button>
          )}

          {step === 1 && (
            <div className="bg-amber-50 border border-amber-200 rounded-lg p-4">
              <div className="flex items-start gap-3 mb-3">
                <AlertTriangle className="w-5 h-5 text-amber-500 shrink-0 mt-0.5" />
                <div>
                  <p className="font-medium text-amber-800">Are you sure?</p>
                  <p className="text-sm text-amber-700 mt-1">
                    This will permanently delete all users, training documents, progress data, sign-offs, and attachments.
                  </p>
                </div>
              </div>
              <div className="flex gap-2 ml-8">
                <button
                  onClick={() => setStep(2)}
                  className="px-4 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600 transition-colors text-sm font-medium"
                >
                  Yes, continue
                </button>
                <button
                  onClick={() => setStep(0)}
                  className="px-4 py-2 border border-slate-300 text-slate-700 rounded-lg hover:bg-slate-50 transition-colors text-sm"
                >
                  Cancel
                </button>
              </div>
            </div>
          )}

          {step === 2 && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-4">
              <div className="flex items-start gap-3 mb-3">
                <AlertTriangle className="w-5 h-5 text-red-500 shrink-0 mt-0.5" />
                <div>
                  <p className="font-medium text-red-800">Final confirmation</p>
                  <p className="text-sm text-red-700 mt-1">
                    This action is irreversible. All data will be permanently erased and the app will reload with a fresh state.
                  </p>
                </div>
              </div>
              <div className="flex gap-2 ml-8">
                <button
                  onClick={handleReset}
                  className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors text-sm font-medium"
                >
                  Permanently Delete Everything
                </button>
                <button
                  onClick={() => setStep(0)}
                  className="px-4 py-2 border border-slate-300 text-slate-700 rounded-lg hover:bg-slate-50 transition-colors text-sm"
                >
                  Cancel
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
