import { useState, useEffect, useCallback, useRef, memo } from 'react';
import {
  ChevronDown,
  ChevronRight,
  FileText,
  StickyNote,
  Paperclip,
  Clock,
  ArrowLeft,
  Award,
} from 'lucide-react';
import storage from '../utils/storage';
import { GRADES, getGrade, isCompleted } from '../utils/grades';
import Attachments, { AttachmentCountBadge } from './Attachments';

export default function DocumentView({ documents, currentUser }) {
  const [selectedDocId, setSelectedDocId] = useState(null);
  const selectedDoc = documents.find((d) => d.id === selectedDocId);

  if (selectedDoc) {
    return (
      <DocumentDetail
        doc={selectedDoc}
        currentUser={currentUser}
        onBack={() => setSelectedDocId(null)}
      />
    );
  }

  return (
    <div>
      <h2 className="text-2xl font-bold text-slate-800 mb-1">Training Documents</h2>
      <p className="text-slate-500 mb-6">Select a document to view your training progress</p>

      {documents.length === 0 ? (
        <div className="text-center py-16">
          <FileText className="w-12 h-12 text-slate-300 mx-auto mb-3" />
          <p className="text-slate-500">No training documents available</p>
          <p className="text-slate-400 text-sm mt-1">Ask a manager to create one</p>
        </div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2">
          {documents.map((doc) => (
            <DocumentCard
              key={doc.id}
              doc={doc}
              userId={currentUser.id}
              onClick={() => setSelectedDocId(doc.id)}
            />
          ))}
        </div>
      )}
    </div>
  );
}

/**
 * Card showing a document with aggregate progress
 */
function DocumentCard({ doc, userId, onClick }) {
  const [progress, setProgress] = useState(null);
  const [signedOffCount, setSignedOffCount] = useState(0);

  useEffect(() => {
    const data = storage.get(`progress:${doc.id}:${userId}`);
    setProgress(data);

    // Count active signoffs
    const signoffs = storage.get(`signoffs:${doc.id}:${userId}`) || [];
    const activeMap = {};
    for (const s of signoffs) {
      if (s.revokedAt) {
        delete activeMap[s.processId];
      } else {
        activeMap[s.processId] = true;
      }
    }
    setSignedOffCount(Object.keys(activeMap).length);
  }, [doc.id, userId]);

  const totalProcesses = (doc.groups || []).reduce((sum, g) => sum + (g.processes?.length || 0), 0);
  let completedCount = 0;
  let startedCount = 0;

  if (progress?.processes) {
    for (const g of doc.groups || []) {
      for (const p of g.processes || []) {
        const pg = progress.processes[p.id];
        if (pg) {
          if (isCompleted(pg.grade)) completedCount++;
          if (pg.grade !== 'not_started') startedCount++;
        }
      }
    }
  }

  const pct = totalProcesses > 0 ? Math.round((completedCount / totalProcesses) * 100) : 0;

  return (
    <button
      onClick={onClick}
      className="bg-white rounded-lg border border-slate-200 p-5 text-left hover:border-teal-300 hover:shadow-sm transition-all"
    >
      <div className="flex items-start justify-between mb-3">
        <h3 className="font-semibold text-slate-800 text-lg">{doc.title}</h3>
        <span className="text-2xl font-bold text-teal-600">{pct}%</span>
      </div>
      <div className="text-sm text-slate-500 mb-3">
        {doc.groups?.length || 0} groups &middot; {totalProcesses} processes
      </div>
      {/* Progress bar */}
      <div className="w-full bg-slate-100 rounded-full h-2 mb-2">
        <div
          className="bg-teal-500 h-2 rounded-full transition-all duration-300"
          style={{ width: `${pct}%` }}
        />
      </div>
      <div className="text-xs text-slate-400">
        {completedCount} of {totalProcesses} completed
        {startedCount > completedCount && ` · ${startedCount - completedCount} in progress`}
      </div>
      {signedOffCount > 0 && (
        <div className="flex items-center gap-1 mt-2 text-xs text-purple-500 font-medium">
          <Award className="w-3.5 h-3.5" />
          {signedOffCount} of {totalProcesses} signed off by manager
        </div>
      )}
    </button>
  );
}

/**
 * Full document detail with groups, processes, and inline progress editing
 */
function DocumentDetail({ doc, currentUser, onBack }) {
  const [progress, setProgress] = useState({ docId: doc.id, userId: currentUser.id, processes: {} });
  const [signoffs, setSignoffs] = useState([]);
  const [expandedGroups, setExpandedGroups] = useState(new Set());
  const [expandedProcess, setExpandedProcess] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const key = `progress:${doc.id}:${currentUser.id}`;
    const stored = storage.get(key);
    if (stored) {
      setProgress(stored);
    }
    // Load signoffs
    const storedSignoffs = storage.get(`signoffs:${doc.id}:${currentUser.id}`);
    if (storedSignoffs) setSignoffs(storedSignoffs);
    setLoading(false);
    // Expand all groups by default
    setExpandedGroups(new Set((doc.groups || []).map((g) => g.id)));
  }, [doc.id, currentUser.id]);

  // Build active signoff map
  const signoffMap = {};
  for (const s of signoffs) {
    if (!s.revokedAt) signoffMap[s.processId] = s;
  }

  const saveProgress = useCallback(
    (updated) => {
      setProgress(updated);
      storage.set(`progress:${doc.id}:${currentUser.id}`, updated);
    },
    [doc.id, currentUser.id]
  );

  const handleGradeChange = useCallback(
    (processId, grade) => {
      setProgress((prev) => {
        const updated = {
          ...prev,
          processes: {
            ...prev.processes,
            [processId]: {
              ...(prev.processes[processId] || {}),
              grade,
              lastUpdated: new Date().toISOString(),
            },
          },
        };
        storage.set(`progress:${doc.id}:${currentUser.id}`, updated);
        return updated;
      });
    },
    [doc.id, currentUser.id]
  );

  const handleNotesChange = useCallback(
    (processId, notes) => {
      setProgress((prev) => {
        const updated = {
          ...prev,
          processes: {
            ...prev.processes,
            [processId]: {
              ...(prev.processes[processId] || {}),
              notes,
              lastUpdated: new Date().toISOString(),
            },
          },
        };
        storage.set(`progress:${doc.id}:${currentUser.id}`, updated);
        return updated;
      });
    },
    [doc.id, currentUser.id]
  );

  function toggleGroup(groupId) {
    setExpandedGroups((prev) => {
      const next = new Set(prev);
      if (next.has(groupId)) next.delete(groupId);
      else next.add(groupId);
      return next;
    });
  }

  // Calculate overall stats
  const totalProcesses = (doc.groups || []).reduce((sum, g) => sum + (g.processes?.length || 0), 0);
  let overallCompleted = 0;
  let overallStarted = 0;
  let overallSignedOff = 0;

  for (const g of doc.groups || []) {
    for (const p of g.processes || []) {
      const pg = progress.processes[p.id];
      if (pg) {
        if (isCompleted(pg.grade)) overallCompleted++;
        if (pg.grade && pg.grade !== 'not_started') overallStarted++;
      }
      if (signoffMap[p.id]) overallSignedOff++;
    }
  }

  const overallPct = totalProcesses > 0 ? Math.round((overallCompleted / totalProcesses) * 100) : 0;

  if (loading) {
    return <div className="text-slate-500">Loading...</div>;
  }

  return (
    <div>
      {/* Header */}
      <div className="flex items-center gap-3 mb-2">
        <button
          onClick={onBack}
          className="p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-lg transition-colors"
        >
          <ArrowLeft className="w-5 h-5" />
        </button>
        <div className="flex-1">
          <h2 className="text-2xl font-bold text-slate-800">{doc.title}</h2>
        </div>
        <div className="text-right">
          <div className="text-3xl font-bold text-teal-600">{overallPct}%</div>
          <div className="text-xs text-slate-400">
            {overallCompleted}/{totalProcesses} completed
            {overallSignedOff > 0 && (
              <span className="flex items-center gap-1 justify-end mt-0.5 text-purple-500">
                <Award className="w-3 h-3" />
                {overallSignedOff} signed off
              </span>
            )}
          </div>
        </div>
      </div>

      {/* Overall progress bar */}
      <div className="w-full bg-slate-100 rounded-full h-2.5 mb-6">
        <div
          className="bg-teal-500 h-2.5 rounded-full transition-all duration-500"
          style={{ width: `${overallPct}%` }}
        />
      </div>

      {/* Groups */}
      <div className="space-y-3">
        {(doc.groups || []).map((group) => {
          const isExpanded = expandedGroups.has(group.id);
          // Group-level stats
          const groupTotal = group.processes?.length || 0;
          let groupCompleted = 0;
          let groupSignedOff = 0;
          for (const p of group.processes || []) {
            const pg = progress.processes[p.id];
            if (pg && isCompleted(pg.grade)) groupCompleted++;
            if (signoffMap[p.id]) groupSignedOff++;
          }
          const groupPct = groupTotal > 0 ? Math.round((groupCompleted / groupTotal) * 100) : 0;

          return (
            <div key={group.id} className="bg-white rounded-lg border border-slate-200 overflow-hidden">
              {/* Group header */}
              <button
                onClick={() => toggleGroup(group.id)}
                className="w-full flex items-center gap-3 p-4 hover:bg-slate-50 transition-colors text-left"
              >
                {isExpanded ? (
                  <ChevronDown className="w-5 h-5 text-slate-400 shrink-0" />
                ) : (
                  <ChevronRight className="w-5 h-5 text-slate-400 shrink-0" />
                )}
                <div className="flex-1 min-w-0">
                  <div className="font-semibold text-slate-700">{group.title}</div>
                  <div className="text-xs text-slate-400 mt-0.5 flex gap-3">
                    <span>{groupCompleted}/{groupTotal} completed</span>
                    {groupSignedOff > 0 && (
                      <span className="flex items-center gap-0.5 text-purple-500">
                        <Award className="w-3 h-3" />{groupSignedOff} signed off
                      </span>
                    )}
                  </div>
                </div>
                {/* Mini progress bar */}
                <div className="w-24 shrink-0">
                  <div className="w-full bg-slate-100 rounded-full h-1.5">
                    <div
                      className="bg-teal-500 h-1.5 rounded-full transition-all duration-300"
                      style={{ width: `${groupPct}%` }}
                    />
                  </div>
                </div>
                <span className="text-sm font-semibold text-teal-600 w-10 text-right shrink-0">{groupPct}%</span>
              </button>

              {/* Process list */}
              {isExpanded && (
                <div className="border-t border-slate-100">
                  {(group.processes || []).map((proc) => (
                    <ProcessCard
                      key={proc.id}
                      process={proc}
                      progress={progress.processes[proc.id]}
                      signoff={signoffMap[proc.id]}
                      isExpanded={expandedProcess === proc.id}
                      onToggle={() =>
                        setExpandedProcess((prev) => (prev === proc.id ? null : proc.id))
                      }
                      onGradeChange={(grade) => handleGradeChange(proc.id, grade)}
                      onNotesChange={(notes) => handleNotesChange(proc.id, notes)}
                      docId={doc.id}
                      currentUser={currentUser}
                    />
                  ))}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}

/**
 * Individual process card with grade badge and expandable detail
 */
const ProcessCard = memo(function ProcessCard({
  process,
  progress,
  signoff,
  isExpanded,
  onToggle,
  onGradeChange,
  onNotesChange,
  docId,
  currentUser,
}) {
  const grade = getGrade(progress?.grade);
  const notes = progress?.notes || '';
  const lastUpdated = progress?.lastUpdated;
  const isSignedOff = !!signoff;

  return (
    <div className={`border-l-4 ${isSignedOff ? 'border-purple-400' : grade.borderClass} transition-colors`}>
      {/* Compact view */}
      <button
        onClick={onToggle}
        className="w-full flex items-center gap-3 px-4 py-3 hover:bg-slate-50 transition-colors text-left"
      >
        <div className="flex-1 min-w-0">
          <p className="text-sm text-slate-700 leading-relaxed line-clamp-2">{process.description}</p>
        </div>
        <div className="flex items-center gap-2 shrink-0">
          {notes && <StickyNote className="w-3.5 h-3.5 text-slate-400" />}
          <AttachmentCountBadge docId={docId} processId={process.id} />
          {isSignedOff ? (
            <span className="flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-semibold bg-purple-50 text-purple-600">
              <Award className="w-3 h-3" />
              Signed Off
            </span>
          ) : (
            <span
              className={`px-2 py-0.5 rounded-full text-xs font-semibold ${grade.bgClass} ${grade.textClass}`}
            >
              {grade.shortLabel}
            </span>
          )}
          {isExpanded ? (
            <ChevronDown className="w-4 h-4 text-slate-400" />
          ) : (
            <ChevronRight className="w-4 h-4 text-slate-400" />
          )}
        </div>
      </button>

      {/* Expanded detail */}
      {isExpanded && (
        <ProcessDetail
          process={process}
          currentGrade={progress?.grade || 'not_started'}
          notes={notes}
          lastUpdated={lastUpdated}
          signoff={signoff}
          onGradeChange={onGradeChange}
          onNotesChange={onNotesChange}
          docId={docId}
          currentUser={currentUser}
        />
      )}
    </div>
  );
});

/**
 * Expanded process detail panel with grade selector and notes
 */
function ProcessDetail({ process, currentGrade, notes, lastUpdated, signoff, onGradeChange, onNotesChange, docId, currentUser }) {
  const [localNotes, setLocalNotes] = useState(notes);
  const debounceRef = useRef(null);

  // Sync external notes changes
  useEffect(() => {
    setLocalNotes(notes);
  }, [notes]);

  function handleNotesInput(e) {
    const val = e.target.value;
    setLocalNotes(val);
    // Debounce save — 500ms after last keystroke
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => {
      onNotesChange(val);
    }, 500);
  }

  function handleNotesBlur() {
    // Save immediately on blur
    if (debounceRef.current) clearTimeout(debounceRef.current);
    onNotesChange(localNotes);
  }

  return (
    <div className="px-4 pb-4 bg-slate-50/50 border-t border-slate-100">
      {/* Full description */}
      <div className="py-3 mb-3 border-b border-slate-100">
        <p className="text-sm text-slate-700 leading-relaxed">{process.description}</p>
        {/* Guidance bullet points */}
        {process.bulletPoints?.length > 0 && (
          <div className="mt-3 pl-1">
            <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-1.5">What Good Looks Like</p>
            <ul className="space-y-1">
              {process.bulletPoints.map((bp, i) => (
                <li key={i} className="flex items-start gap-2">
                  <span className="text-teal-500 mt-0.5 shrink-0 text-xs">&bull;</span>
                  <span className="text-sm text-slate-600 leading-relaxed">{bp}</span>
                </li>
              ))}
            </ul>
          </div>
        )}
      </div>

      {/* Grade selector */}
      <div className="mb-4">
        <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wide mb-2">
          Self-Assessment
        </label>
        <div className="flex flex-wrap gap-2">
          {GRADES.map((g) => {
            const isSelected = currentGrade === g.key;
            return (
              <button
                key={g.key}
                onClick={() => onGradeChange(g.key)}
                className={`px-3 py-2 rounded-lg text-sm font-medium transition-all border-2 ${
                  isSelected
                    ? `${g.bgClass} ${g.textClass} border-current`
                    : 'bg-white border-slate-200 text-slate-500 hover:border-slate-300'
                }`}
                title={g.description}
              >
                {g.label}
                {g.description && (
                  <span className="block text-xs font-normal opacity-70 mt-0.5">{g.description}</span>
                )}
              </button>
            );
          })}
        </div>
      </div>

      {/* Notes */}
      <div className="mb-3">
        <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wide mb-2">
          Notes
        </label>
        <textarea
          value={localNotes}
          onChange={handleNotesInput}
          onBlur={handleNotesBlur}
          placeholder="Add your notes here... (auto-saves)"
          rows={3}
          className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-transparent resize-y"
        />
      </div>

      {/* Reference Materials (attached by managers, viewable by all) */}
      <div className="mb-3">
        <Attachments
          docId={docId}
          processId={process.id}
          uploaderName={currentUser.name}
          readOnly={currentUser.role !== 'manager'}
        />
      </div>

      {/* Sign-off status */}
      {signoff && (
        <div className="mb-3 p-3 bg-purple-50 border border-purple-100 rounded-lg">
          <div className="flex items-center gap-2 mb-1">
            <Award className="w-4 h-4 text-purple-500" />
            <span className="text-sm font-semibold text-purple-700">Signed Off</span>
          </div>
          <div className="text-xs text-purple-600 space-y-0.5">
            <p>By {signoff.managerName} on {new Date(signoff.signedOffAt).toLocaleDateString()}</p>
            {signoff.comment && <p className="italic">&ldquo;{signoff.comment}&rdquo;</p>}
          </div>
        </div>
      )}

      {/* Timestamp */}
      {lastUpdated && (
        <div className="flex items-center gap-1.5 text-xs text-slate-400">
          <Clock className="w-3 h-3" />
          Last updated: {new Date(lastUpdated).toLocaleString()}
        </div>
      )}
    </div>
  );
}
