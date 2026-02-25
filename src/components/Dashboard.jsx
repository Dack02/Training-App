import { useState, useEffect } from 'react';
import {
  FileText,
  Award,
  TrendingUp,
  AlertTriangle,
  ChevronRight,
  Users,
  CheckCircle2,
  Clock,
  BookOpen,
} from 'lucide-react';
import storage from '../utils/storage';
import { GRADES, getGrade, isCompleted } from '../utils/grades';

/**
 * Dashboard — landing page after login.
 * Trainee: personal progress cards with next actions.
 * Manager: grid of all trainees with progress summaries.
 */
export default function Dashboard({ documents, currentUser, users, onNavigate }) {
  if (currentUser.role === 'manager') {
    return <ManagerDashboard documents={documents} users={users} currentUser={currentUser} onNavigate={onNavigate} />;
  }
  return <TraineeDashboard documents={documents} currentUser={currentUser} onNavigate={onNavigate} />;
}

/* ─── Trainee Dashboard ────────────────────────────── */

function TraineeDashboard({ documents, currentUser, onNavigate }) {
  const [docStats, setDocStats] = useState([]);

  useEffect(() => {
    const stats = documents.map((doc) => {
      const progress = storage.get(`progress:${doc.id}:${currentUser.id}`);
      const signoffs = storage.get(`signoffs:${doc.id}:${currentUser.id}`) || [];

      const totalProcesses = (doc.groups || []).reduce((sum, g) => sum + (g.processes?.length || 0), 0);
      let completed = 0;
      let started = 0;
      let notStarted = 0;
      let nextAction = null;

      // Active signoffs
      const activeSignoffs = {};
      for (const s of signoffs) {
        if (s.revokedAt) delete activeSignoffs[s.processId];
        else activeSignoffs[s.processId] = s;
      }
      const signedOffCount = Object.keys(activeSignoffs).length;

      for (const g of doc.groups || []) {
        for (const p of g.processes || []) {
          const pg = progress?.processes?.[p.id];
          if (pg && isCompleted(pg.grade)) {
            completed++;
          } else if (pg && pg.grade !== 'not_started') {
            started++;
            if (!nextAction) nextAction = { process: p, group: g, grade: pg.grade };
          } else {
            notStarted++;
            if (!nextAction) nextAction = { process: p, group: g, grade: 'not_started' };
          }
        }
      }

      const pct = totalProcesses > 0 ? Math.round((completed / totalProcesses) * 100) : 0;

      return {
        doc,
        totalProcesses,
        completed,
        started,
        notStarted,
        signedOffCount,
        pct,
        nextAction,
      };
    });
    setDocStats(stats);
  }, [documents, currentUser.id]);

  const overallTotal = docStats.reduce((s, d) => s + d.totalProcesses, 0);
  const overallCompleted = docStats.reduce((s, d) => s + d.completed, 0);
  const overallSignedOff = docStats.reduce((s, d) => s + d.signedOffCount, 0);
  const overallPct = overallTotal > 0 ? Math.round((overallCompleted / overallTotal) * 100) : 0;

  return (
    <div>
      <h2 className="text-2xl font-bold text-slate-800 mb-1">Dashboard</h2>
      <p className="text-slate-500 mb-6">Welcome back, {currentUser.name}</p>

      {/* Summary cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-6">
        <SummaryCard
          icon={<TrendingUp className="w-5 h-5 text-teal-500" />}
          label="Overall Progress"
          value={`${overallPct}%`}
          sublabel={`${overallCompleted}/${overallTotal} processes`}
        />
        <SummaryCard
          icon={<BookOpen className="w-5 h-5 text-blue-500" />}
          label="In Progress"
          value={docStats.reduce((s, d) => s + d.started, 0)}
          sublabel="actively learning"
        />
        <SummaryCard
          icon={<CheckCircle2 className="w-5 h-5 text-emerald-500" />}
          label="Completed"
          value={overallCompleted}
          sublabel="confident or mastered"
        />
        <SummaryCard
          icon={<Award className="w-5 h-5 text-purple-500" />}
          label="Signed Off"
          value={overallSignedOff}
          sublabel="by manager"
        />
      </div>

      {/* Document progress cards */}
      {documents.length === 0 ? (
        <div className="text-center py-16 bg-white rounded-xl border border-slate-200">
          <FileText className="w-12 h-12 text-slate-300 mx-auto mb-3" />
          <p className="text-slate-500">No training documents available yet</p>
          <p className="text-slate-400 text-sm mt-1">Ask a manager to create one to get started</p>
        </div>
      ) : (
        <div className="space-y-4">
          <h3 className="text-sm font-semibold text-slate-500 uppercase tracking-wide">Your Training Documents</h3>
          {docStats.map(({ doc, totalProcesses, completed, started, signedOffCount, pct, nextAction }) => (
            <button
              key={doc.id}
              onClick={() => onNavigate('documents')}
              className="w-full bg-white rounded-lg border border-slate-200 p-5 text-left hover:border-teal-300 hover:shadow-sm transition-all"
            >
              <div className="flex items-start justify-between mb-3">
                <div className="flex-1 min-w-0">
                  <h4 className="font-semibold text-slate-800 text-lg">{doc.title}</h4>
                  <p className="text-sm text-slate-500 mt-0.5">
                    {doc.groups?.length || 0} groups &middot; {totalProcesses} processes
                  </p>
                </div>
                <div className="text-right shrink-0 ml-4">
                  <div className="text-2xl font-bold text-teal-600">{pct}%</div>
                  {signedOffCount > 0 && (
                    <div className="flex items-center gap-1 text-xs text-purple-500 font-medium justify-end">
                      <Award className="w-3 h-3" />{signedOffCount} signed off
                    </div>
                  )}
                </div>
              </div>

              {/* Progress bar */}
              <div className="w-full bg-slate-100 rounded-full h-2 mb-3">
                <div
                  className="bg-teal-500 h-2 rounded-full transition-all duration-300"
                  style={{ width: `${pct}%` }}
                />
              </div>

              {/* Stats row */}
              <div className="flex gap-4 text-xs text-slate-400 mb-3">
                <span>{completed} completed</span>
                {started > 0 && <span className="text-blue-500">{started} in progress</span>}
              </div>

              {/* Next action suggestion */}
              {nextAction && (
                <div className="flex items-start gap-2 pt-3 border-t border-slate-100">
                  <Clock className="w-4 h-4 text-amber-500 shrink-0 mt-0.5" />
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-medium text-slate-500">Next up</p>
                    <p className="text-sm text-slate-700 line-clamp-1">{nextAction.process.description}</p>
                    <p className="text-xs text-slate-400 mt-0.5">
                      in {nextAction.group.title} &middot;{' '}
                      <span className={getGrade(nextAction.grade).textClass}>
                        {getGrade(nextAction.grade).label}
                      </span>
                    </p>
                  </div>
                  <ChevronRight className="w-4 h-4 text-slate-300 shrink-0 mt-1" />
                </div>
              )}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

/* ─── Manager Dashboard ────────────────────────────── */

function ManagerDashboard({ documents, users, currentUser, onNavigate }) {
  const trainees = users.filter((u) => u.role === 'trainee');
  const [traineeStats, setTraineeStats] = useState([]);

  useEffect(() => {
    const stats = trainees.map((trainee) => {
      let totalProcesses = 0;
      let totalCompleted = 0;
      let totalSignedOff = 0;
      let lowestPct = 100;
      let needsAttention = false;

      const docDetails = documents.map((doc) => {
        const progress = storage.get(`progress:${doc.id}:${trainee.id}`);
        const signoffs = storage.get(`signoffs:${doc.id}:${trainee.id}`) || [];

        const docTotal = (doc.groups || []).reduce((sum, g) => sum + (g.processes?.length || 0), 0);
        let completed = 0;

        const activeSignoffs = {};
        for (const s of signoffs) {
          if (s.revokedAt) delete activeSignoffs[s.processId];
          else activeSignoffs[s.processId] = s;
        }
        const signedOff = Object.keys(activeSignoffs).length;

        for (const g of doc.groups || []) {
          for (const p of g.processes || []) {
            const pg = progress?.processes?.[p.id];
            if (pg && isCompleted(pg.grade)) completed++;
          }
        }

        const pct = docTotal > 0 ? Math.round((completed / docTotal) * 100) : 0;
        if (pct < lowestPct) lowestPct = pct;

        // Flag: completed but not signed off
        if (completed > signedOff && completed > 0) needsAttention = true;

        totalProcesses += docTotal;
        totalCompleted += completed;
        totalSignedOff += signedOff;

        return { doc, docTotal, completed, signedOff, pct };
      });

      const overallPct = totalProcesses > 0 ? Math.round((totalCompleted / totalProcesses) * 100) : 0;

      return {
        trainee,
        totalProcesses,
        totalCompleted,
        totalSignedOff,
        overallPct,
        needsAttention,
        docDetails,
      };
    });

    // Sort: needs attention first, then by lowest progress
    stats.sort((a, b) => {
      if (a.needsAttention !== b.needsAttention) return a.needsAttention ? -1 : 1;
      return a.overallPct - b.overallPct;
    });

    setTraineeStats(stats);
  }, [documents, trainees]);

  return (
    <div>
      <h2 className="text-2xl font-bold text-slate-800 mb-1">Manager Dashboard</h2>
      <p className="text-slate-500 mb-6">Overview of all trainee progress</p>

      {/* Summary cards */}
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 mb-6">
        <SummaryCard
          icon={<Users className="w-5 h-5 text-blue-500" />}
          label="Trainees"
          value={trainees.length}
          sublabel="active"
        />
        <SummaryCard
          icon={<FileText className="w-5 h-5 text-teal-500" />}
          label="Documents"
          value={documents.length}
          sublabel="training docs"
        />
        <SummaryCard
          icon={<AlertTriangle className="w-5 h-5 text-amber-500" />}
          label="Need Review"
          value={traineeStats.filter((t) => t.needsAttention).length}
          sublabel="awaiting sign-off"
        />
      </div>

      {trainees.length === 0 ? (
        <div className="text-center py-16 bg-white rounded-xl border border-slate-200">
          <Users className="w-12 h-12 text-slate-300 mx-auto mb-3" />
          <p className="text-slate-500">No trainees yet</p>
          <p className="text-slate-400 text-sm mt-1">Create trainee accounts in Manage Users</p>
        </div>
      ) : (
        <div className="space-y-4">
          <h3 className="text-sm font-semibold text-slate-500 uppercase tracking-wide">Trainee Progress</h3>
          {traineeStats.map(({ trainee, totalProcesses, totalCompleted, totalSignedOff, overallPct, needsAttention, docDetails }) => (
            <div
              key={trainee.id}
              className={`bg-white rounded-lg border p-5 ${
                needsAttention ? 'border-amber-200 bg-amber-50/30' : 'border-slate-200'
              }`}
            >
              <div className="flex items-start justify-between mb-3">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-blue-50 flex items-center justify-center shrink-0">
                    <span className="text-sm font-bold text-blue-600">
                      {trainee.name.split(' ').map((n) => n[0]).join('').toUpperCase().slice(0, 2)}
                    </span>
                  </div>
                  <div>
                    <h4 className="font-semibold text-slate-800">{trainee.name}</h4>
                    {needsAttention && (
                      <span className="inline-flex items-center gap-1 text-xs text-amber-600 font-medium">
                        <AlertTriangle className="w-3 h-3" />
                        Has items awaiting sign-off
                      </span>
                    )}
                  </div>
                </div>
                <div className="text-right">
                  <div className="text-xl font-bold text-teal-600">{overallPct}%</div>
                  <div className="text-xs text-slate-400">{totalCompleted}/{totalProcesses}</div>
                </div>
              </div>

              {/* Progress bar */}
              <div className="w-full bg-slate-100 rounded-full h-2 mb-3">
                <div
                  className="bg-teal-500 h-2 rounded-full transition-all duration-300"
                  style={{ width: `${overallPct}%` }}
                />
              </div>

              {/* Per-document breakdown */}
              <div className="grid gap-2 sm:grid-cols-2">
                {docDetails.map(({ doc, docTotal, completed, signedOff, pct }) => (
                  <div key={doc.id} className="flex items-center gap-3 p-2.5 rounded-lg bg-slate-50">
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-slate-700 truncate">{doc.title}</p>
                      <div className="flex gap-2 text-xs text-slate-400">
                        <span>{completed}/{docTotal} completed</span>
                        {signedOff > 0 && (
                          <span className="text-purple-500 flex items-center gap-0.5">
                            <Award className="w-3 h-3" />{signedOff} signed off
                          </span>
                        )}
                      </div>
                    </div>
                    <span className="text-sm font-semibold text-teal-600">{pct}%</span>
                  </div>
                ))}
              </div>

              {/* Quick action */}
              <div className="mt-3 pt-3 border-t border-slate-100">
                <button
                  onClick={() => onNavigate('review')}
                  className="text-sm font-medium text-teal-600 hover:text-teal-700 flex items-center gap-1 transition-colors"
                >
                  Review & Sign Off
                  <ChevronRight className="w-4 h-4" />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

/* ─── Shared Components ────────────────────────────── */

function SummaryCard({ icon, label, value, sublabel }) {
  return (
    <div className="bg-white rounded-lg border border-slate-200 p-4">
      <div className="flex items-center gap-2 mb-2">
        {icon}
        <span className="text-xs font-medium text-slate-500 uppercase tracking-wide">{label}</span>
      </div>
      <div className="text-2xl font-bold text-slate-800">{value}</div>
      <div className="text-xs text-slate-400 mt-0.5">{sublabel}</div>
    </div>
  );
}
