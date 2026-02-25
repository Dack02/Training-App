import { useState, useEffect, useCallback } from 'react';
import {
  ChevronDown,
  ChevronRight,
  FileText,
  StickyNote,
  Paperclip,
  Clock,
  ArrowLeft,
  User,
  CheckCircle2,
  XCircle,
  Shield,
  Award,
  MessageSquare,
} from 'lucide-react';
import storage from '../utils/storage';
import { GRADES, getGrade, isCompleted } from '../utils/grades';
import Attachments, { AttachmentCountBadge } from './Attachments';
import { useToast } from './Toast';

export default function ManagerReview({ documents, users, currentUser }) {
  const [selectedDocId, setSelectedDocId] = useState(null);
  const [selectedTraineeId, setSelectedTraineeId] = useState(null);

  const trainees = users.filter((u) => u.role === 'trainee');
  const selectedDoc = documents.find((d) => d.id === selectedDocId);
  const selectedTrainee = users.find((u) => u.id === selectedTraineeId);

  if (selectedDoc && selectedTrainee) {
    return (
      <ReviewDetail
        doc={selectedDoc}
        trainee={selectedTrainee}
        currentUser={currentUser}
        onBack={() => { setSelectedDocId(null); setSelectedTraineeId(null); }}
      />
    );
  }

  return (
    <div>
      <h2 className="text-2xl font-bold text-slate-800 mb-1">Review & Sign Off</h2>
      <p className="text-slate-500 mb-6">Select a trainee and document to review their progress</p>

      {trainees.length === 0 ? (
        <div className="text-center py-16">
          <User className="w-12 h-12 text-slate-300 mx-auto mb-3" />
          <p className="text-slate-500">No trainees to review</p>
          <p className="text-slate-400 text-sm mt-1">Create trainee accounts first</p>
        </div>
      ) : (
        <div className="space-y-6">
          {trainees.map((trainee) => (
            <div key={trainee.id} className="bg-white rounded-lg border border-slate-200">
              <div className="flex items-center gap-3 p-4 border-b border-slate-100">
                <div className="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center">
                  <User className="w-5 h-5 text-blue-600" />
                </div>
                <div>
                  <div className="font-semibold text-slate-800">{trainee.name}</div>
                  <div className="text-xs text-blue-600 font-medium uppercase">Trainee</div>
                </div>
              </div>
              <div className="p-4">
                {documents.length === 0 ? (
                  <p className="text-slate-400 text-sm">No documents available</p>
                ) : (
                  <div className="grid gap-3 sm:grid-cols-2">
                    {documents.map((doc) => (
                      <TraineeDocCard
                        key={doc.id}
                        doc={doc}
                        traineeId={trainee.id}
                        onClick={() => { setSelectedDocId(doc.id); setSelectedTraineeId(trainee.id); }}
                      />
                    ))}
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function TraineeDocCard({ doc, traineeId, onClick }) {
  const [progress, setProgress] = useState(null);
  const [signoffs, setSignoffs] = useState(null);

  useEffect(() => {
    setProgress(storage.get(`progress:${doc.id}:${traineeId}`));
    setSignoffs(storage.get(`signoffs:${doc.id}:${traineeId}`));
  }, [doc.id, traineeId]);

  const totalProcesses = (doc.groups || []).reduce((sum, g) => sum + (g.processes?.length || 0), 0);
  let completedCount = 0;
  let signedOffCount = 0;

  const signoffMap = {};
  if (signoffs) {
    for (const s of signoffs) {
      if (!s.revokedAt) signoffMap[s.processId] = s;
    }
  }

  if (progress?.processes) {
    for (const g of doc.groups || []) {
      for (const p of g.processes || []) {
        const pg = progress.processes[p.id];
        if (pg && isCompleted(pg.grade)) completedCount++;
        if (signoffMap[p.id]) signedOffCount++;
      }
    }
  }

  const pct = totalProcesses > 0 ? Math.round((completedCount / totalProcesses) * 100) : 0;
  const signoffPct = totalProcesses > 0 ? Math.round((signedOffCount / totalProcesses) * 100) : 0;

  return (
    <button
      onClick={onClick}
      className="text-left p-3 rounded-lg border border-slate-200 hover:border-teal-300 hover:shadow-sm transition-all"
    >
      <div className="flex items-center justify-between mb-2">
        <span className="font-medium text-slate-700 text-sm">{doc.title}</span>
        <span className="text-lg font-bold text-teal-600">{pct}%</span>
      </div>
      <div className="w-full bg-slate-100 rounded-full h-1.5 mb-2">
        <div className="bg-teal-500 h-1.5 rounded-full transition-all" style={{ width: `${pct}%` }} />
      </div>
      <div className="flex justify-between text-xs text-slate-400">
        <span>{completedCount}/{totalProcesses} self-assessed</span>
        <span className="flex items-center gap-1">
          <Award className="w-3 h-3 text-purple-500" />
          {signedOffCount} signed off
        </span>
      </div>
    </button>
  );
}

/**
 * Full review detail — manager views trainee progress and can sign off
 */
function ReviewDetail({ doc, trainee, currentUser, onBack }) {
  const [progress, setProgress] = useState({ processes: {} });
  const [signoffs, setSignoffs] = useState([]);
  const [expandedGroups, setExpandedGroups] = useState(new Set());
  const [expandedProcess, setExpandedProcess] = useState(null);
  const [loading, setLoading] = useState(true);
  const toast = useToast();

  const signoffKey = `signoffs:${doc.id}:${trainee.id}`;

  useEffect(() => {
    const storedProgress = storage.get(`progress:${doc.id}:${trainee.id}`);
    const storedSignoffs = storage.get(signoffKey);
    if (storedProgress) setProgress(storedProgress);
    if (storedSignoffs) setSignoffs(storedSignoffs);
    setExpandedGroups(new Set((doc.groups || []).map((g) => g.id)));
    setLoading(false);
  }, [doc.id, trainee.id, signoffKey]);

  // Build active signoff map (latest non-revoked per process)
  const signoffMap = {};
  for (const s of signoffs) {
    if (!s.revokedAt) {
      signoffMap[s.processId] = s;
    }
  }

  const saveSignoffs = useCallback((updated) => {
    setSignoffs(updated);
    storage.set(signoffKey, updated);
  }, [signoffKey]);

  function handleSignOff(processId, comment) {
    const record = {
      processId,
      managerId: currentUser.id,
      managerName: currentUser.name,
      signedOffAt: new Date().toISOString(),
      comment: comment || undefined,
    };
    saveSignoffs([...signoffs, record]);
    toast('Process signed off', 'success');
  }

  function handleRevoke(processId, reason) {
    const updated = signoffs.map((s) => {
      if (s.processId === processId && !s.revokedAt) {
        return { ...s, revokedAt: new Date().toISOString(), revokeReason: reason || undefined };
      }
      return s;
    });
    saveSignoffs(updated);
    toast('Sign-off revoked', 'info');
  }

  function handleBulkSignOff(group) {
    const newRecords = [];
    for (const proc of group.processes || []) {
      const pg = progress.processes[proc.id];
      if (pg && isCompleted(pg.grade) && !signoffMap[proc.id]) {
        newRecords.push({
          processId: proc.id,
          managerId: currentUser.id,
          managerName: currentUser.name,
          signedOffAt: new Date().toISOString(),
        });
      }
    }
    if (newRecords.length > 0) {
      saveSignoffs([...signoffs, ...newRecords]);
      toast(`Signed off ${newRecords.length} processes`, 'success');
    }
  }

  function toggleGroup(groupId) {
    setExpandedGroups((prev) => {
      const next = new Set(prev);
      if (next.has(groupId)) next.delete(groupId);
      else next.add(groupId);
      return next;
    });
  }

  // Overall stats
  const totalProcesses = (doc.groups || []).reduce((sum, g) => sum + (g.processes?.length || 0), 0);
  let overallCompleted = 0;
  let overallSignedOff = 0;

  for (const g of doc.groups || []) {
    for (const p of g.processes || []) {
      const pg = progress.processes[p.id];
      if (pg && isCompleted(pg.grade)) overallCompleted++;
      if (signoffMap[p.id]) overallSignedOff++;
    }
  }

  const completedPct = totalProcesses > 0 ? Math.round((overallCompleted / totalProcesses) * 100) : 0;
  const signoffPct = totalProcesses > 0 ? Math.round((overallSignedOff / totalProcesses) * 100) : 0;

  if (loading) return <div className="text-slate-500">Loading...</div>;

  return (
    <div>
      {/* Header */}
      <div className="flex items-center gap-3 mb-4">
        <button
          onClick={onBack}
          className="p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-lg transition-colors"
        >
          <ArrowLeft className="w-5 h-5" />
        </button>
        <div className="flex-1">
          <h2 className="text-2xl font-bold text-slate-800">{doc.title}</h2>
          <div className="flex items-center gap-2 mt-1">
            <User className="w-4 h-4 text-blue-500" />
            <span className="text-sm text-slate-600">Reviewing: <strong>{trainee.name}</strong></span>
          </div>
        </div>
      </div>

      {/* Stats bar */}
      <div className="bg-white rounded-lg border border-slate-200 p-4 mb-6">
        <div className="grid grid-cols-2 gap-4">
          <div>
            <div className="text-xs text-slate-500 uppercase tracking-wide mb-1">Self-Assessed (Confident+)</div>
            <div className="flex items-center gap-3">
              <div className="text-2xl font-bold text-teal-600">{completedPct}%</div>
              <div className="flex-1">
                <div className="w-full bg-slate-100 rounded-full h-2">
                  <div className="bg-teal-500 h-2 rounded-full transition-all" style={{ width: `${completedPct}%` }} />
                </div>
              </div>
              <span className="text-xs text-slate-400">{overallCompleted}/{totalProcesses}</span>
            </div>
          </div>
          <div>
            <div className="text-xs text-slate-500 uppercase tracking-wide mb-1">Signed Off</div>
            <div className="flex items-center gap-3">
              <div className="text-2xl font-bold text-purple-600">{signoffPct}%</div>
              <div className="flex-1">
                <div className="w-full bg-slate-100 rounded-full h-2">
                  <div className="bg-purple-500 h-2 rounded-full transition-all" style={{ width: `${signoffPct}%` }} />
                </div>
              </div>
              <span className="text-xs text-slate-400">{overallSignedOff}/{totalProcesses}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Groups */}
      <div className="space-y-3">
        {(doc.groups || []).map((group) => {
          const isExpanded = expandedGroups.has(group.id);
          const groupTotal = group.processes?.length || 0;
          let groupCompleted = 0;
          let groupSignedOff = 0;
          let groupEligible = 0;

          for (const p of group.processes || []) {
            const pg = progress.processes[p.id];
            if (pg && isCompleted(pg.grade)) {
              groupCompleted++;
              if (!signoffMap[p.id]) groupEligible++;
            }
            if (signoffMap[p.id]) groupSignedOff++;
          }

          return (
            <div key={group.id} className="bg-white rounded-lg border border-slate-200 overflow-hidden">
              {/* Group header */}
              <div className="flex items-center gap-3 p-4 hover:bg-slate-50 transition-colors">
                <button onClick={() => toggleGroup(group.id)} className="flex items-center gap-3 flex-1 text-left">
                  {isExpanded ? (
                    <ChevronDown className="w-5 h-5 text-slate-400 shrink-0" />
                  ) : (
                    <ChevronRight className="w-5 h-5 text-slate-400 shrink-0" />
                  )}
                  <div className="flex-1 min-w-0">
                    <div className="font-semibold text-slate-700">{group.title}</div>
                    <div className="text-xs text-slate-400 mt-0.5 flex gap-3">
                      <span>{groupCompleted}/{groupTotal} self-assessed</span>
                      <span className="flex items-center gap-1">
                        <Award className="w-3 h-3 text-purple-500" />
                        {groupSignedOff}/{groupTotal} signed off
                      </span>
                    </div>
                  </div>
                </button>
                {/* Bulk sign-off button */}
                {groupEligible > 0 && (
                  <button
                    onClick={() => handleBulkSignOff(group)}
                    className="flex items-center gap-1.5 px-3 py-1.5 bg-purple-50 text-purple-700 rounded-lg text-xs font-medium hover:bg-purple-100 transition-colors shrink-0"
                  >
                    <CheckCircle2 className="w-3.5 h-3.5" />
                    Sign Off All ({groupEligible})
                  </button>
                )}
              </div>

              {/* Process list */}
              {isExpanded && (
                <div className="border-t border-slate-100">
                  {(group.processes || []).map((proc) => (
                    <ReviewProcessCard
                      key={proc.id}
                      process={proc}
                      progress={progress.processes[proc.id]}
                      signoff={signoffMap[proc.id]}
                      isExpanded={expandedProcess === proc.id}
                      onToggle={() => setExpandedProcess((prev) => (prev === proc.id ? null : proc.id))}
                      onSignOff={(comment) => handleSignOff(proc.id, comment)}
                      onRevoke={(reason) => handleRevoke(proc.id, reason)}
                      docId={doc.id}
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

function ReviewProcessCard({ process, progress, signoff, isExpanded, onToggle, onSignOff, onRevoke, docId }) {
  const grade = getGrade(progress?.grade);
  const notes = progress?.notes || '';
  const canSignOff = progress && isCompleted(progress.grade) && !signoff;

  return (
    <div className={`border-l-4 ${signoff ? 'border-l-purple-500' : grade.borderClass} transition-colors`}>
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
          {signoff ? (
            <span className="flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-semibold bg-purple-50 text-purple-700">
              <Award className="w-3 h-3" />
              Signed Off
            </span>
          ) : (
            <span className={`px-2 py-0.5 rounded-full text-xs font-semibold ${grade.bgClass} ${grade.textClass}`}>
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

      {isExpanded && (
        <ReviewProcessDetail
          process={process}
          progress={progress}
          signoff={signoff}
          canSignOff={canSignOff}
          onSignOff={onSignOff}
          onRevoke={onRevoke}
          docId={docId}
        />
      )}
    </div>
  );
}

function ReviewProcessDetail({ process, progress, signoff, canSignOff, onSignOff, onRevoke, docId }) {
  const [signoffComment, setSignoffComment] = useState('');
  const [revokeReason, setRevokeReason] = useState('');
  const [showRevoke, setShowRevoke] = useState(false);
  const grade = getGrade(progress?.grade);

  return (
    <div className="px-4 pb-4 bg-slate-50/50 border-t border-slate-100">
      {/* Process description */}
      <div className="py-3 mb-3 border-b border-slate-100">
        <p className="text-sm text-slate-700 leading-relaxed">{process.description}</p>
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

      {/* Trainee's self-assessment (read-only) */}
      <div className="mb-4">
        <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wide mb-1">
          Trainee's Self-Assessment
        </label>
        <span className={`inline-block px-3 py-1.5 rounded-lg text-sm font-medium ${grade.bgClass} ${grade.textClass}`}>
          {grade.label}
          {grade.description && <span className="text-xs opacity-70 ml-1">— {grade.description}</span>}
        </span>
      </div>

      {/* Trainee's notes (read-only) */}
      {progress?.notes && (
        <div className="mb-4">
          <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wide mb-1">
            Trainee's Notes
          </label>
          <div className="bg-white border border-slate-200 rounded-lg px-3 py-2 text-sm text-slate-700 whitespace-pre-wrap">
            {progress.notes}
          </div>
        </div>
      )}

      {/* Reference materials (read-only) */}
      <div className="mb-4">
        <Attachments
          docId={docId}
          processId={process.id}
          uploaderName=""
          readOnly
        />
      </div>

      {/* Sign-off section */}
      {signoff ? (
        <div className="bg-purple-50 border border-purple-200 rounded-lg p-3">
          <div className="flex items-center gap-2 mb-2">
            <Award className="w-4 h-4 text-purple-600" />
            <span className="text-sm font-semibold text-purple-700">Signed Off</span>
          </div>
          <div className="text-xs text-purple-600 space-y-0.5">
            <div>By: {signoff.managerName}</div>
            <div>Date: {new Date(signoff.signedOffAt).toLocaleString()}</div>
            {signoff.comment && <div className="mt-1 italic">"{signoff.comment}"</div>}
          </div>
          {/* Revoke */}
          {showRevoke ? (
            <div className="mt-3 pt-3 border-t border-purple-200">
              <label className="block text-xs font-medium text-purple-600 mb-1">Reason for revoking (optional)</label>
              <input
                type="text"
                value={revokeReason}
                onChange={(e) => setRevokeReason(e.target.value)}
                placeholder="e.g. Needs more practice on X"
                className="w-full px-2 py-1.5 border border-purple-300 rounded text-sm focus:outline-none focus:ring-2 focus:ring-purple-500 mb-2"
              />
              <div className="flex gap-2">
                <button
                  onClick={() => { onRevoke(revokeReason); setShowRevoke(false); setRevokeReason(''); }}
                  className="px-3 py-1.5 bg-red-500 text-white rounded text-xs hover:bg-red-600"
                >
                  Revoke Sign-Off
                </button>
                <button
                  onClick={() => { setShowRevoke(false); setRevokeReason(''); }}
                  className="px-3 py-1.5 border border-purple-300 text-purple-600 rounded text-xs hover:bg-purple-100"
                >
                  Cancel
                </button>
              </div>
            </div>
          ) : (
            <button
              onClick={() => setShowRevoke(true)}
              className="mt-2 flex items-center gap-1 text-xs text-purple-500 hover:text-purple-700"
            >
              <XCircle className="w-3 h-3" />
              Revoke sign-off
            </button>
          )}
        </div>
      ) : canSignOff ? (
        <div className="bg-teal-50 border border-teal-200 rounded-lg p-3">
          <div className="flex items-center gap-2 mb-2">
            <CheckCircle2 className="w-4 h-4 text-teal-600" />
            <span className="text-sm font-semibold text-teal-700">Ready for Sign-Off</span>
          </div>
          <div className="mb-2">
            <input
              type="text"
              value={signoffComment}
              onChange={(e) => setSignoffComment(e.target.value)}
              placeholder="Add a comment (optional)"
              className="w-full px-2 py-1.5 border border-teal-300 rounded text-sm focus:outline-none focus:ring-2 focus:ring-teal-500"
            />
          </div>
          <button
            onClick={() => { onSignOff(signoffComment); setSignoffComment(''); }}
            className="flex items-center gap-1.5 px-4 py-2 bg-purple-600 text-white rounded-lg text-sm font-medium hover:bg-purple-700 transition-colors"
          >
            <Award className="w-4 h-4" />
            Sign Off This Process
          </button>
        </div>
      ) : (
        <div className="bg-slate-50 border border-slate-200 rounded-lg p-3">
          <div className="flex items-center gap-2">
            <Shield className="w-4 h-4 text-slate-400" />
            <span className="text-sm text-slate-500">
              {!progress || !progress.grade || progress.grade === 'not_started'
                ? 'Trainee has not started this process yet'
                : 'Trainee must be at Confident or Mastered level before sign-off'}
            </span>
          </div>
        </div>
      )}

      {/* Last updated */}
      {progress?.lastUpdated && (
        <div className="flex items-center gap-1.5 text-xs text-slate-400 mt-3">
          <Clock className="w-3 h-3" />
          Last updated by trainee: {new Date(progress.lastUpdated).toLocaleString()}
        </div>
      )}
    </div>
  );
}
