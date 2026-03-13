import { useState, useEffect, useMemo } from 'react';
import {
  Award,
  Filter,
  Printer,
  FileText,
} from 'lucide-react';
import {
  fetchAllProgressForDoc,
  fetchAllSignoffsForDoc,
  progressArrayToMap,
  signoffArrayToMap,
} from '../lib/api';
import { GRADES, getGrade, isCompleted } from '../utils/grades';

export default function ProgressReport({ documents, users, currentUser }) {
  const trainees = users.filter((u) => u.role === 'trainee');

  const [selectedDocId, setSelectedDocId] = useState(documents[0]?.id || '');
  const [selectedGroupId, setSelectedGroupId] = useState('all');
  const [selectedStatus, setSelectedStatus] = useState('all');
  const [selectedTraineeIds, setSelectedTraineeIds] = useState(new Set(trainees.map((t) => t.id)));
  const [showFilters, setShowFilters] = useState(false);

  const selectedDoc = documents.find((d) => d.id === selectedDocId);

  // { progress: { [userId]: { [processId]: {...} } }, signoffs: { [userId]: { [processId]: {...} } } }
  const [data, setData] = useState({ progress: {}, signoffs: {} });

  useEffect(() => {
    if (!selectedDocId) return;
    let cancelled = false;

    async function load() {
      const [allProgress, allSignoffs] = await Promise.all([
        fetchAllProgressForDoc(selectedDocId),
        fetchAllSignoffsForDoc(selectedDocId),
      ]);
      if (cancelled) return;

      // Group progress by user
      const progressByUser = {};
      for (const row of allProgress) {
        if (!progressByUser[row.user_id]) progressByUser[row.user_id] = [];
        progressByUser[row.user_id].push(row);
      }

      // Group signoffs by user
      const signoffsByUser = {};
      for (const row of allSignoffs) {
        if (!signoffsByUser[row.user_id]) signoffsByUser[row.user_id] = [];
        signoffsByUser[row.user_id].push(row);
      }

      const progress = {};
      const signoffs = {};
      for (const trainee of trainees) {
        progress[trainee.id] = progressArrayToMap(progressByUser[trainee.id] || []);
        signoffs[trainee.id] = signoffArrayToMap(signoffsByUser[trainee.id] || []);
      }

      setData({ progress, signoffs });
    }
    load();
    return () => { cancelled = true; };
  }, [selectedDocId, trainees.length]);

  const groups = selectedDoc?.groups || [];
  const filteredGroups = useMemo(() => {
    if (selectedGroupId === 'all') return groups;
    return groups.filter((g) => g.id === selectedGroupId);
  }, [groups, selectedGroupId]);

  const visibleTrainees = trainees.filter((t) => selectedTraineeIds.has(t.id));

  function matchesStatus(processId, traineeId) {
    if (selectedStatus === 'all') return true;
    const grade = data.progress[traineeId]?.[processId]?.grade || 'not_started';
    const signedOff = !!data.signoffs[traineeId]?.[processId];

    switch (selectedStatus) {
      case 'not_started': return grade === 'not_started';
      case 'in_progress': return grade !== 'not_started' && !isCompleted(grade);
      case 'completed': return isCompleted(grade) && !signedOff;
      case 'signed_off': return signedOff;
      default: return true;
    }
  }

  const filteredProcessList = useMemo(() => {
    const list = [];
    for (const group of filteredGroups) {
      const procs = (group.processes || []).filter((proc) => {
        if (selectedStatus === 'all') return true;
        return visibleTrainees.some((t) => matchesStatus(proc.id, t.id));
      });
      if (procs.length > 0) {
        list.push({ group, processes: procs });
      }
    }
    return list;
  }, [filteredGroups, selectedStatus, visibleTrainees, data]);

  function toggleTrainee(traineeId) {
    setSelectedTraineeIds((prev) => {
      const next = new Set(prev);
      if (next.has(traineeId)) next.delete(traineeId);
      else next.add(traineeId);
      return next;
    });
  }

  function handlePrint() { window.print(); }

  if (documents.length === 0) {
    return (
      <div className="text-center py-16">
        <FileText className="w-12 h-12 text-slate-300 mx-auto mb-3" />
        <p className="text-slate-500">No training documents available</p>
      </div>
    );
  }

  return (
    <div>
      <div className="print:hidden">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h2 className="text-2xl font-bold text-slate-800 mb-1">Progress Report</h2>
            <p className="text-slate-500">Detailed view of trainee progress across processes</p>
          </div>
          <div className="flex gap-2">
            <button
              onClick={() => setShowFilters(!showFilters)}
              className={`flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium transition-colors border ${
                showFilters ? 'bg-teal-50 text-teal-700 border-teal-200' : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-50'
              }`}
            >
              <Filter className="w-4 h-4" />Filters
            </button>
            <button onClick={handlePrint} className="flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium bg-white text-slate-600 border border-slate-200 hover:bg-slate-50 transition-colors">
              <Printer className="w-4 h-4" />Print
            </button>
          </div>
        </div>
        <div className="flex gap-3 mb-4">
          <select
            value={selectedDocId}
            onChange={(e) => { setSelectedDocId(e.target.value); setSelectedGroupId('all'); }}
            className="px-3 py-2 border border-slate-200 rounded-lg text-sm bg-white focus:outline-none focus:ring-2 focus:ring-teal-500"
          >
            {documents.map((doc) => <option key={doc.id} value={doc.id}>{doc.title}</option>)}
          </select>
        </div>
        {showFilters && (
          <div className="bg-white rounded-lg border border-slate-200 p-4 mb-4 space-y-3">
            <div className="grid gap-3 sm:grid-cols-3">
              <div>
                <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wide mb-1">Group</label>
                <select value={selectedGroupId} onChange={(e) => setSelectedGroupId(e.target.value)} className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm bg-white focus:outline-none focus:ring-2 focus:ring-teal-500">
                  <option value="all">All Groups</option>
                  {groups.map((g) => <option key={g.id} value={g.id}>{g.title}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wide mb-1">Status</label>
                <select value={selectedStatus} onChange={(e) => setSelectedStatus(e.target.value)} className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm bg-white focus:outline-none focus:ring-2 focus:ring-teal-500">
                  <option value="all">All Statuses</option>
                  <option value="not_started">Not Started</option>
                  <option value="in_progress">In Progress</option>
                  <option value="completed">Completed (not signed off)</option>
                  <option value="signed_off">Signed Off</option>
                </select>
              </div>
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wide mb-1">Trainees</label>
              <div className="flex flex-wrap gap-2">
                {trainees.map((t) => (
                  <button
                    key={t.id}
                    onClick={() => toggleTrainee(t.id)}
                    className={`px-3 py-1.5 rounded-full text-xs font-medium transition-colors border ${
                      selectedTraineeIds.has(t.id) ? 'bg-teal-50 text-teal-700 border-teal-200' : 'bg-slate-50 text-slate-400 border-slate-200'
                    }`}
                  >{t.name}</button>
                ))}
                <button onClick={() => setSelectedTraineeIds(new Set(trainees.map((t) => t.id)))} className="px-3 py-1.5 rounded-full text-xs font-medium text-slate-500 hover:text-slate-700 border border-slate-200 transition-colors">Select All</button>
              </div>
            </div>
          </div>
        )}
      </div>

      <div className="hidden print:block mb-4">
        <h1 className="text-xl font-bold">Progress Report — {selectedDoc?.title}</h1>
        <p className="text-sm text-gray-500">Printed {new Date().toLocaleDateString()}</p>
      </div>

      {visibleTrainees.length === 0 ? (
        <div className="text-center py-12 bg-white rounded-lg border border-slate-200">
          <p className="text-slate-500">No trainees selected. Use filters to show trainees.</p>
        </div>
      ) : filteredProcessList.length === 0 ? (
        <div className="text-center py-12 bg-white rounded-lg border border-slate-200">
          <p className="text-slate-500">No processes match the current filters.</p>
        </div>
      ) : (
        <div className="bg-white rounded-lg border border-slate-200 overflow-x-auto print:border-0 print:shadow-none">
          <table className="w-full text-sm border-collapse">
            <thead>
              <tr className="border-b border-slate-200">
                <th className="text-left p-3 font-semibold text-slate-600 sticky left-0 bg-white z-10 min-w-[250px]">Process</th>
                {visibleTrainees.map((t) => (
                  <th key={t.id} className="text-center p-3 font-semibold text-slate-600 min-w-[100px]">
                    <span className="block truncate max-w-[100px]">{t.name}</span>
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {filteredProcessList.map(({ group, processes }) => (
                <>
                  <tr key={`group-${group.id}`} className="bg-slate-50">
                    <td colSpan={visibleTrainees.length + 1} className="p-2.5 font-semibold text-slate-700 text-xs uppercase tracking-wide">{group.title}</td>
                  </tr>
                  {processes.map((proc) => (
                    <tr key={proc.id} className="border-b border-slate-100 hover:bg-slate-50/50">
                      <td className="p-2.5 text-slate-700 sticky left-0 bg-white text-xs leading-relaxed">
                        <span className="line-clamp-2">{proc.description}</span>
                      </td>
                      {visibleTrainees.map((t) => {
                        const grade = data.progress[t.id]?.[proc.id]?.grade || 'not_started';
                        const gradeInfo = getGrade(grade);
                        const signedOff = !!data.signoffs[t.id]?.[proc.id];
                        return (
                          <td key={t.id} className="p-2 text-center">
                            <GradeCell grade={gradeInfo} signedOff={signedOff} />
                          </td>
                        );
                      })}
                    </tr>
                  ))}
                </>
              ))}
            </tbody>
          </table>
        </div>
      )}

      <div className="mt-4 flex flex-wrap gap-3 items-center print:mt-2">
        <span className="text-xs font-medium text-slate-500">Legend:</span>
        {GRADES.map((g) => (
          <span key={g.key} className="flex items-center gap-1.5 text-xs">
            <span className={`w-4 h-4 rounded ${g.bgClass} border`} style={{ borderColor: g.color }} />
            <span className="text-slate-600">{g.label}</span>
          </span>
        ))}
        <span className="flex items-center gap-1.5 text-xs">
          <span className="w-4 h-4 rounded bg-purple-100 border border-purple-400 flex items-center justify-center">
            <Award className="w-2.5 h-2.5 text-purple-500" />
          </span>
          <span className="text-slate-600">Signed Off</span>
        </span>
      </div>
    </div>
  );
}

function GradeCell({ grade, signedOff }) {
  if (signedOff) {
    return (
      <span className="inline-flex items-center justify-center w-8 h-8 rounded-lg bg-purple-50 border border-purple-200" title="Signed Off">
        <Award className="w-4 h-4 text-purple-500" />
      </span>
    );
  }
  return (
    <span className={`inline-flex items-center justify-center w-8 h-8 rounded-lg ${grade.bgClass} border`} style={{ borderColor: grade.color + '40' }} title={grade.label}>
      <span className="w-3 h-3 rounded-full" style={{ backgroundColor: grade.color }} />
    </span>
  );
}
