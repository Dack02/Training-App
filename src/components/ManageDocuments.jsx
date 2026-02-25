import { useState } from 'react';
import {
  Plus,
  Pencil,
  Trash2,
  ChevronDown,
  ChevronRight,
  ArrowUp,
  ArrowDown,
  FileText,
  FolderOpen,
  Upload,
  X,
  Check,
  AlertTriangle,
  GripVertical,
  Paperclip,
  ImagePlus,
  List,
  CircleDot,
} from 'lucide-react';
import { generateId } from '../utils/ids';
import { parseBulkText } from '../utils/seedData';
import Attachments, { AttachmentCountBadge } from './Attachments';
import { useToast } from './Toast';

export default function ManageDocuments({ documents, onSaveDocuments, onSaveDoc, currentUser }) {
  const [selectedDocId, setSelectedDocId] = useState(null);
  const [showCreateDoc, setShowCreateDoc] = useState(false);
  const [newDocTitle, setNewDocTitle] = useState('');
  const [editingDocId, setEditingDocId] = useState(null);
  const [editDocTitle, setEditDocTitle] = useState('');
  const [deleteConfirm, setDeleteConfirm] = useState(null);
  const toast = useToast();

  const selectedDoc = documents.find((d) => d.id === selectedDocId);

  function handleCreateDoc(e) {
    e.preventDefault();
    const title = newDocTitle.trim();
    if (!title) return;
    const newDoc = {
      id: generateId(),
      title,
      createdAt: new Date().toISOString(),
      groups: [],
    };
    onSaveDocuments([...documents, newDoc]);
    onSaveDoc(newDoc);
    setNewDocTitle('');
    setShowCreateDoc(false);
    setSelectedDocId(newDoc.id);
    toast('Document created', 'success');
  }

  function handleEditDocTitle(docId) {
    const title = editDocTitle.trim();
    if (!title) return;
    const updated = documents.map((d) => (d.id === docId ? { ...d, title } : d));
    onSaveDocuments(updated);
    const doc = documents.find((d) => d.id === docId);
    if (doc) onSaveDoc({ ...doc, title });
    setEditingDocId(null);
    setEditDocTitle('');
    toast('Document renamed', 'success');
  }

  function handleDeleteDoc(docId) {
    const updated = documents.filter((d) => d.id !== docId);
    onSaveDocuments(updated);
    if (selectedDocId === docId) setSelectedDocId(null);
    setDeleteConfirm(null);
    toast('Document deleted', 'info');
  }

  // If a document is selected, show its detail editor
  if (selectedDoc) {
    return (
      <DocumentEditor
        doc={selectedDoc}
        onBack={() => setSelectedDocId(null)}
        onSaveDoc={onSaveDoc}
        onUpdateDocList={(updatedDoc) => {
          const updated = documents.map((d) => (d.id === updatedDoc.id ? updatedDoc : d));
          onSaveDocuments(updated);
        }}
        currentUser={currentUser}
      />
    );
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-2xl font-bold text-slate-800">Manage Documents</h2>
          <p className="text-slate-500 mt-1">Create and organise training documents</p>
        </div>
        <button
          onClick={() => setShowCreateDoc(true)}
          className="flex items-center gap-2 px-4 py-2.5 bg-teal-600 text-white rounded-lg hover:bg-teal-700 transition-colors font-medium"
        >
          <Plus className="w-4 h-4" />
          New Document
        </button>
      </div>

      {/* Create document form */}
      {showCreateDoc && (
        <form onSubmit={handleCreateDoc} className="bg-white rounded-lg border border-slate-200 p-4 mb-4">
          <label className="block text-sm font-medium text-slate-600 mb-1">Document Title</label>
          <div className="flex gap-2">
            <input
              type="text"
              value={newDocTitle}
              onChange={(e) => setNewDocTitle(e.target.value)}
              placeholder="e.g. FOH Basic Tasks"
              autoFocus
              className="flex-1 px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-transparent"
            />
            <button type="submit" className="px-4 py-2 bg-teal-600 text-white rounded-lg hover:bg-teal-700 transition-colors">
              Create
            </button>
            <button
              type="button"
              onClick={() => { setShowCreateDoc(false); setNewDocTitle(''); }}
              className="px-4 py-2 border border-slate-300 text-slate-600 rounded-lg hover:bg-slate-50 transition-colors"
            >
              Cancel
            </button>
          </div>
        </form>
      )}

      {/* Document list */}
      {documents.length === 0 ? (
        <div className="text-center py-16">
          <FileText className="w-12 h-12 text-slate-300 mx-auto mb-3" />
          <p className="text-slate-500 mb-1">No documents yet</p>
          <p className="text-slate-400 text-sm">Create a document to start building your training programme</p>
        </div>
      ) : (
        <div className="space-y-2">
          {documents.map((doc) => (
            <div key={doc.id} className="bg-white rounded-lg border border-slate-200 hover:border-slate-300 transition-colors">
              <div className="flex items-center gap-3 p-4">
                <FolderOpen className="w-5 h-5 text-teal-600 shrink-0" />
                {editingDocId === doc.id ? (
                  <div className="flex-1 flex gap-2">
                    <input
                      type="text"
                      value={editDocTitle}
                      onChange={(e) => setEditDocTitle(e.target.value)}
                      autoFocus
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') handleEditDocTitle(doc.id);
                        if (e.key === 'Escape') setEditingDocId(null);
                      }}
                      className="flex-1 px-3 py-1.5 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500 text-sm"
                    />
                    <button
                      onClick={() => handleEditDocTitle(doc.id)}
                      className="p-1.5 text-teal-600 hover:bg-teal-50 rounded"
                    >
                      <Check className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => setEditingDocId(null)}
                      className="p-1.5 text-slate-400 hover:bg-slate-50 rounded"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>
                ) : (
                  <>
                    <button
                      onClick={() => setSelectedDocId(doc.id)}
                      className="flex-1 text-left"
                    >
                      <span className="font-medium text-slate-800">{doc.title}</span>
                      <span className="text-slate-400 text-sm ml-2">
                        {doc.groups?.length || 0} groups
                      </span>
                    </button>
                    <button
                      onClick={() => { setEditingDocId(doc.id); setEditDocTitle(doc.title); }}
                      className="p-1.5 text-slate-400 hover:text-slate-600 hover:bg-slate-50 rounded"
                      title="Edit title"
                    >
                      <Pencil className="w-4 h-4" />
                    </button>
                    {deleteConfirm === doc.id ? (
                      <div className="flex items-center gap-1">
                        <span className="text-xs text-red-600 mr-1">Delete?</span>
                        <button
                          onClick={() => handleDeleteDoc(doc.id)}
                          className="p-1.5 text-red-600 hover:bg-red-50 rounded"
                        >
                          <Check className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => setDeleteConfirm(null)}
                          className="p-1.5 text-slate-400 hover:bg-slate-50 rounded"
                        >
                          <X className="w-4 h-4" />
                        </button>
                      </div>
                    ) : (
                      <button
                        onClick={() => setDeleteConfirm(doc.id)}
                        className="p-1.5 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded"
                        title="Delete document"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    )}
                  </>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

/**
 * Document Editor — manages groups and processes within a single document
 */
function DocumentEditor({ doc, onBack, onSaveDoc, onUpdateDocList, currentUser }) {
  const [groups, setGroups] = useState(doc.groups || []);
  const [expandedGroups, setExpandedGroups] = useState(new Set());
  const [showBulkImport, setShowBulkImport] = useState(false);
  const [bulkText, setBulkText] = useState('');

  // Group editing state
  const [addingGroup, setAddingGroup] = useState(false);
  const [newGroupTitle, setNewGroupTitle] = useState('');
  const [editingGroupId, setEditingGroupId] = useState(null);
  const [editGroupTitle, setEditGroupTitle] = useState('');
  const [deleteGroupConfirm, setDeleteGroupConfirm] = useState(null);

  // Process editing state
  const [addingProcessGroupId, setAddingProcessGroupId] = useState(null);
  const [newProcessDesc, setNewProcessDesc] = useState('');
  const [editingProcessId, setEditingProcessId] = useState(null);
  const [editProcessDesc, setEditProcessDesc] = useState('');
  const [deleteProcessConfirm, setDeleteProcessConfirm] = useState(null);
  const [expandedProcessId, setExpandedProcessId] = useState(null);

  function saveGroups(updatedGroups) {
    setGroups(updatedGroups);
    const updatedDoc = { ...doc, groups: updatedGroups };
    onSaveDoc(updatedDoc);
    onUpdateDocList(updatedDoc);
  }

  function toggleGroup(groupId) {
    setExpandedGroups((prev) => {
      const next = new Set(prev);
      if (next.has(groupId)) next.delete(groupId);
      else next.add(groupId);
      return next;
    });
  }

  // --- Group operations ---
  function handleAddGroup(e) {
    e.preventDefault();
    const title = newGroupTitle.trim();
    if (!title) return;
    const newGroup = {
      id: generateId(),
      title,
      order: groups.length,
      processes: [],
    };
    saveGroups([...groups, newGroup]);
    setNewGroupTitle('');
    setAddingGroup(false);
    setExpandedGroups((prev) => new Set(prev).add(newGroup.id));
  }

  function handleEditGroupTitle(groupId) {
    const title = editGroupTitle.trim();
    if (!title) return;
    saveGroups(groups.map((g) => (g.id === groupId ? { ...g, title } : g)));
    setEditingGroupId(null);
  }

  function handleDeleteGroup(groupId) {
    saveGroups(groups.filter((g) => g.id !== groupId).map((g, i) => ({ ...g, order: i })));
    setDeleteGroupConfirm(null);
  }

  function handleMoveGroup(groupId, direction) {
    const idx = groups.findIndex((g) => g.id === groupId);
    if ((direction === -1 && idx <= 0) || (direction === 1 && idx >= groups.length - 1)) return;
    const newGroups = [...groups];
    const [moved] = newGroups.splice(idx, 1);
    newGroups.splice(idx + direction, 0, moved);
    saveGroups(newGroups.map((g, i) => ({ ...g, order: i })));
  }

  // --- Process operations ---
  function handleAddProcess(groupId, e) {
    e.preventDefault();
    const desc = newProcessDesc.trim();
    if (!desc) return;
    const newProcess = { id: generateId(), description: desc, order: 0, bulletPoints: [] };
    saveGroups(
      groups.map((g) => {
        if (g.id !== groupId) return g;
        const processes = [...g.processes, newProcess].map((p, i) => ({ ...p, order: i }));
        return { ...g, processes };
      })
    );
    setNewProcessDesc('');
    // Keep the add form open for rapid entry
  }

  function handleEditProcess(groupId, processId) {
    const desc = editProcessDesc.trim();
    if (!desc) return;
    saveGroups(
      groups.map((g) => {
        if (g.id !== groupId) return g;
        return {
          ...g,
          processes: g.processes.map((p) => (p.id === processId ? { ...p, description: desc } : p)),
        };
      })
    );
    setEditingProcessId(null);
  }

  function handleDeleteProcess(groupId, processId) {
    saveGroups(
      groups.map((g) => {
        if (g.id !== groupId) return g;
        return {
          ...g,
          processes: g.processes.filter((p) => p.id !== processId).map((p, i) => ({ ...p, order: i })),
        };
      })
    );
    setDeleteProcessConfirm(null);
  }

  function handleMoveProcess(groupId, processId, direction) {
    saveGroups(
      groups.map((g) => {
        if (g.id !== groupId) return g;
        const idx = g.processes.findIndex((p) => p.id === processId);
        if ((direction === -1 && idx <= 0) || (direction === 1 && idx >= g.processes.length - 1)) return g;
        const procs = [...g.processes];
        const [moved] = procs.splice(idx, 1);
        procs.splice(idx + direction, 0, moved);
        return { ...g, processes: procs.map((p, i) => ({ ...p, order: i })) };
      })
    );
  }

  // --- Bullet point operations ---
  function handleSaveBulletPoints(groupId, processId, bulletPoints) {
    saveGroups(
      groups.map((g) => {
        if (g.id !== groupId) return g;
        return {
          ...g,
          processes: g.processes.map((p) =>
            p.id === processId ? { ...p, bulletPoints } : p
          ),
        };
      })
    );
  }

  // --- Bulk Import ---
  function handleBulkImport() {
    const parsed = parseBulkText(bulkText);
    if (parsed.length === 0) return;
    const newGroups = parsed.map((g, gi) => ({
      id: generateId(),
      title: g.title,
      order: groups.length + gi,
      processes: g.processes.map((desc, pi) => ({
        id: generateId(),
        description: desc,
        order: pi,
      })),
    }));
    saveGroups([...groups, ...newGroups]);
    setBulkText('');
    setShowBulkImport(false);
    // Expand the new groups
    setExpandedGroups((prev) => {
      const next = new Set(prev);
      newGroups.forEach((g) => next.add(g.id));
      return next;
    });
  }

  return (
    <div>
      {/* Header */}
      <div className="flex items-center gap-3 mb-6">
        <button
          onClick={onBack}
          className="p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-lg transition-colors"
        >
          <ChevronRight className="w-5 h-5 rotate-180" />
        </button>
        <div className="flex-1">
          <h2 className="text-2xl font-bold text-slate-800">{doc.title}</h2>
          <p className="text-slate-500 text-sm">{groups.length} groups, {groups.reduce((sum, g) => sum + g.processes.length, 0)} processes</p>
        </div>
        <button
          onClick={() => setShowBulkImport(true)}
          className="flex items-center gap-2 px-3 py-2 border border-slate-300 text-slate-700 rounded-lg hover:bg-slate-50 transition-colors text-sm"
        >
          <Upload className="w-4 h-4" />
          Bulk Import
        </button>
        <button
          onClick={() => setAddingGroup(true)}
          className="flex items-center gap-2 px-4 py-2 bg-teal-600 text-white rounded-lg hover:bg-teal-700 transition-colors text-sm font-medium"
        >
          <Plus className="w-4 h-4" />
          Add Group
        </button>
      </div>

      {/* Bulk Import Modal */}
      {showBulkImport && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-xl shadow-xl max-w-2xl w-full max-h-[80vh] flex flex-col">
            <div className="flex items-center justify-between p-4 border-b">
              <h3 className="text-lg font-semibold text-slate-800">Bulk Import</h3>
              <button onClick={() => setShowBulkImport(false)} className="p-1 text-slate-400 hover:text-slate-600">
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="p-4 flex-1 overflow-auto">
              <p className="text-sm text-slate-500 mb-3">
                Paste your text below. Plain lines become <strong>group headers</strong>.
                Lines starting with <code className="bg-slate-100 px-1 rounded">-</code>, <code className="bg-slate-100 px-1 rounded">*</code>, or <code className="bg-slate-100 px-1 rounded">&bull;</code> become <strong>processes</strong> under the preceding group.
              </p>
              <textarea
                value={bulkText}
                onChange={(e) => setBulkText(e.target.value)}
                placeholder={`Bookings & Initial Contact\n- Take bookings and actively listen\n- Ask clarifying questions\n\nEstimates & Scheduling\n- Create estimates promptly\n- Send online authorisation`}
                rows={12}
                className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500 text-sm font-mono"
              />
              {bulkText.trim() && (
                <p className="text-xs text-slate-400 mt-2">
                  Preview: {parseBulkText(bulkText).length} groups, {parseBulkText(bulkText).reduce((s, g) => s + g.processes.length, 0)} processes detected
                </p>
              )}
            </div>
            <div className="flex justify-end gap-2 p-4 border-t">
              <button
                onClick={() => { setShowBulkImport(false); setBulkText(''); }}
                className="px-4 py-2 border border-slate-300 text-slate-700 rounded-lg hover:bg-slate-50 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleBulkImport}
                disabled={!bulkText.trim()}
                className="px-4 py-2 bg-teal-600 text-white rounded-lg hover:bg-teal-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Import
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Add Group Form */}
      {addingGroup && (
        <form onSubmit={handleAddGroup} className="bg-white rounded-lg border border-teal-200 p-4 mb-4">
          <label className="block text-sm font-medium text-slate-600 mb-1">Group Title</label>
          <div className="flex gap-2">
            <input
              type="text"
              value={newGroupTitle}
              onChange={(e) => setNewGroupTitle(e.target.value)}
              placeholder="e.g. Bookings & Initial Contact"
              autoFocus
              className="flex-1 px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500 text-sm"
            />
            <button type="submit" className="px-4 py-2 bg-teal-600 text-white rounded-lg hover:bg-teal-700 text-sm">
              Add
            </button>
            <button
              type="button"
              onClick={() => { setAddingGroup(false); setNewGroupTitle(''); }}
              className="px-4 py-2 border border-slate-300 text-slate-600 rounded-lg hover:bg-slate-50 text-sm"
            >
              Cancel
            </button>
          </div>
        </form>
      )}

      {/* Groups */}
      {groups.length === 0 ? (
        <div className="text-center py-16">
          <FolderOpen className="w-12 h-12 text-slate-300 mx-auto mb-3" />
          <p className="text-slate-500 mb-1">No groups yet</p>
          <p className="text-slate-400 text-sm">Add a group or use bulk import to get started</p>
        </div>
      ) : (
        <div className="space-y-3">
          {groups.map((group, gi) => {
            const isExpanded = expandedGroups.has(group.id);
            return (
              <div key={group.id} className="bg-white rounded-lg border border-slate-200 overflow-hidden">
                {/* Group header */}
                <div className="flex items-center gap-2 p-3 bg-slate-50 border-b border-slate-200">
                  <button
                    onClick={() => toggleGroup(group.id)}
                    className="p-1 text-slate-400 hover:text-slate-600"
                  >
                    {isExpanded ? <ChevronDown className="w-4 h-4" /> : <ChevronRight className="w-4 h-4" />}
                  </button>

                  {editingGroupId === group.id ? (
                    <div className="flex-1 flex gap-2">
                      <input
                        type="text"
                        value={editGroupTitle}
                        onChange={(e) => setEditGroupTitle(e.target.value)}
                        autoFocus
                        onKeyDown={(e) => {
                          if (e.key === 'Enter') handleEditGroupTitle(group.id);
                          if (e.key === 'Escape') setEditingGroupId(null);
                        }}
                        className="flex-1 px-2 py-1 border border-slate-300 rounded text-sm focus:outline-none focus:ring-2 focus:ring-teal-500"
                      />
                      <button onClick={() => handleEditGroupTitle(group.id)} className="p-1 text-teal-600 hover:bg-teal-50 rounded">
                        <Check className="w-4 h-4" />
                      </button>
                      <button onClick={() => setEditingGroupId(null)} className="p-1 text-slate-400 hover:bg-slate-100 rounded">
                        <X className="w-4 h-4" />
                      </button>
                    </div>
                  ) : (
                    <>
                      <button onClick={() => toggleGroup(group.id)} className="flex-1 text-left">
                        <span className="font-semibold text-slate-700 text-sm">{group.title}</span>
                        <span className="text-slate-400 text-xs ml-2">{group.processes.length} processes</span>
                      </button>
                      <div className="flex items-center gap-0.5">
                        <button
                          onClick={() => handleMoveGroup(group.id, -1)}
                          disabled={gi === 0}
                          className="p-1 text-slate-400 hover:text-slate-600 disabled:opacity-30 disabled:cursor-not-allowed rounded hover:bg-slate-100"
                          title="Move up"
                        >
                          <ArrowUp className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={() => handleMoveGroup(group.id, 1)}
                          disabled={gi === groups.length - 1}
                          className="p-1 text-slate-400 hover:text-slate-600 disabled:opacity-30 disabled:cursor-not-allowed rounded hover:bg-slate-100"
                          title="Move down"
                        >
                          <ArrowDown className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={() => { setEditingGroupId(group.id); setEditGroupTitle(group.title); }}
                          className="p-1 text-slate-400 hover:text-slate-600 rounded hover:bg-slate-100"
                          title="Edit"
                        >
                          <Pencil className="w-3.5 h-3.5" />
                        </button>
                        {deleteGroupConfirm === group.id ? (
                          <div className="flex items-center gap-0.5 ml-1">
                            {group.processes.length > 0 && (
                              <span className="text-xs text-amber-600 flex items-center gap-1 mr-1">
                                <AlertTriangle className="w-3 h-3" />
                                {group.processes.length} processes
                              </span>
                            )}
                            <button onClick={() => handleDeleteGroup(group.id)} className="p-1 text-red-600 hover:bg-red-50 rounded">
                              <Check className="w-3.5 h-3.5" />
                            </button>
                            <button onClick={() => setDeleteGroupConfirm(null)} className="p-1 text-slate-400 hover:bg-slate-100 rounded">
                              <X className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        ) : (
                          <button
                            onClick={() => setDeleteGroupConfirm(group.id)}
                            className="p-1 text-slate-400 hover:text-red-600 rounded hover:bg-red-50"
                            title="Delete"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        )}
                      </div>
                    </>
                  )}
                </div>

                {/* Process list */}
                {isExpanded && (
                  <div className="p-3">
                    {group.processes.length === 0 ? (
                      <p className="text-slate-400 text-sm text-center py-4">No processes in this group</p>
                    ) : (
                      <div className="space-y-2 mb-3">
                        {group.processes.map((proc, pi) => (
                          <div key={proc.id} className="rounded-lg hover:bg-slate-50 group/proc">
                            <div className="flex items-start gap-2 p-2">
                              <GripVertical className="w-4 h-4 text-slate-300 mt-0.5 shrink-0" />
                              {editingProcessId === proc.id ? (
                                <div className="flex-1">
                                  <textarea
                                    value={editProcessDesc}
                                    onChange={(e) => setEditProcessDesc(e.target.value)}
                                    autoFocus
                                    rows={3}
                                    onKeyDown={(e) => {
                                      if (e.key === 'Escape') setEditingProcessId(null);
                                    }}
                                    className="w-full px-2 py-1.5 border border-slate-300 rounded text-sm focus:outline-none focus:ring-2 focus:ring-teal-500"
                                  />
                                  <div className="flex gap-1 mt-1">
                                    <button
                                      onClick={() => handleEditProcess(group.id, proc.id)}
                                      className="px-2 py-1 text-xs bg-teal-600 text-white rounded hover:bg-teal-700"
                                    >
                                      Save
                                    </button>
                                    <button
                                      onClick={() => setEditingProcessId(null)}
                                      className="px-2 py-1 text-xs border border-slate-300 text-slate-600 rounded hover:bg-slate-50"
                                    >
                                      Cancel
                                    </button>
                                  </div>
                                </div>
                              ) : (
                                <>
                                  <div className="flex-1 min-w-0">
                                    <p className="text-sm text-slate-700 leading-relaxed">{proc.description}</p>
                                    {(proc.bulletPoints?.length > 0) && (
                                      <span className="text-xs text-slate-400 flex items-center gap-1 mt-0.5">
                                        <CircleDot className="w-3 h-3" />
                                        {proc.bulletPoints.length} guidance point{proc.bulletPoints.length !== 1 ? 's' : ''}
                                      </span>
                                    )}
                                  </div>
                                  <div className="flex items-center gap-0.5 opacity-0 group-hover/proc:opacity-100 transition-opacity shrink-0">
                                    <button
                                      onClick={() => setExpandedProcessId(
                                        expandedProcessId === proc.id ? null : proc.id
                                      )}
                                      className={`p-1 rounded hover:bg-slate-100 ${
                                        expandedProcessId === proc.id ? 'text-teal-600' : 'text-slate-400 hover:text-slate-600'
                                      }`}
                                      title="Guidance & reference materials"
                                    >
                                      <List className="w-3 h-3" />
                                    </button>
                                    <AttachmentCountBadge docId={doc.id} processId={proc.id} />
                                    <button
                                      onClick={() => handleMoveProcess(group.id, proc.id, -1)}
                                      disabled={pi === 0}
                                      className="p-1 text-slate-400 hover:text-slate-600 disabled:opacity-30 rounded hover:bg-slate-100"
                                    >
                                      <ArrowUp className="w-3 h-3" />
                                    </button>
                                    <button
                                      onClick={() => handleMoveProcess(group.id, proc.id, 1)}
                                      disabled={pi === group.processes.length - 1}
                                      className="p-1 text-slate-400 hover:text-slate-600 disabled:opacity-30 rounded hover:bg-slate-100"
                                    >
                                      <ArrowDown className="w-3 h-3" />
                                    </button>
                                    <button
                                      onClick={() => { setEditingProcessId(proc.id); setEditProcessDesc(proc.description); }}
                                      className="p-1 text-slate-400 hover:text-slate-600 rounded hover:bg-slate-100"
                                    >
                                      <Pencil className="w-3 h-3" />
                                    </button>
                                    {deleteProcessConfirm === proc.id ? (
                                      <>
                                        <button onClick={() => handleDeleteProcess(group.id, proc.id)} className="p-1 text-red-600 hover:bg-red-50 rounded">
                                          <Check className="w-3 h-3" />
                                        </button>
                                        <button onClick={() => setDeleteProcessConfirm(null)} className="p-1 text-slate-400 hover:bg-slate-100 rounded">
                                          <X className="w-3 h-3" />
                                        </button>
                                      </>
                                    ) : (
                                      <button
                                        onClick={() => setDeleteProcessConfirm(proc.id)}
                                        className="p-1 text-slate-400 hover:text-red-600 rounded hover:bg-red-50"
                                      >
                                        <Trash2 className="w-3 h-3" />
                                      </button>
                                    )}
                                  </div>
                                </>
                              )}
                            </div>
                            {/* Expanded panel: guidance bullet points + attachments */}
                            {expandedProcessId === proc.id && (
                              <div className="px-8 pb-3 space-y-4">
                                <BulletPointEditor
                                  bulletPoints={proc.bulletPoints || []}
                                  onSave={(bps) => handleSaveBulletPoints(group.id, proc.id, bps)}
                                />
                                <Attachments
                                  docId={doc.id}
                                  processId={proc.id}
                                  uploaderName={currentUser.name}
                                  label="Reference Materials"
                                />
                              </div>
                            )}
                          </div>
                        ))}
                      </div>
                    )}

                    {/* Add process form */}
                    {addingProcessGroupId === group.id ? (
                      <form onSubmit={(e) => handleAddProcess(group.id, e)} className="border border-teal-200 rounded-lg p-3">
                        <textarea
                          value={newProcessDesc}
                          onChange={(e) => setNewProcessDesc(e.target.value)}
                          placeholder="Describe the process..."
                          rows={2}
                          autoFocus
                          className="w-full px-2 py-1.5 border border-slate-300 rounded text-sm focus:outline-none focus:ring-2 focus:ring-teal-500 mb-2"
                        />
                        <div className="flex gap-2">
                          <button type="submit" className="px-3 py-1.5 bg-teal-600 text-white rounded text-xs hover:bg-teal-700">
                            Add Process
                          </button>
                          <button
                            type="button"
                            onClick={() => { setAddingProcessGroupId(null); setNewProcessDesc(''); }}
                            className="px-3 py-1.5 border border-slate-300 text-slate-600 rounded text-xs hover:bg-slate-50"
                          >
                            Done
                          </button>
                        </div>
                      </form>
                    ) : (
                      <button
                        onClick={() => { setAddingProcessGroupId(group.id); setNewProcessDesc(''); }}
                        className="flex items-center gap-1.5 text-sm text-teal-600 hover:text-teal-700 font-medium"
                      >
                        <Plus className="w-3.5 h-3.5" />
                        Add Process
                      </button>
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

/**
 * Inline editor for guidance bullet points on a process.
 * "What good looks like" — manager adds sub-points that trainees can see.
 */
function BulletPointEditor({ bulletPoints, onSave }) {
  const [items, setItems] = useState(bulletPoints);
  const [newItem, setNewItem] = useState('');
  const [editingIdx, setEditingIdx] = useState(null);
  const [editText, setEditText] = useState('');

  function handleAdd(e) {
    e.preventDefault();
    const text = newItem.trim();
    if (!text) return;
    const updated = [...items, text];
    setItems(updated);
    onSave(updated);
    setNewItem('');
  }

  function handleDelete(idx) {
    const updated = items.filter((_, i) => i !== idx);
    setItems(updated);
    onSave(updated);
  }

  function handleEditSave(idx) {
    const text = editText.trim();
    if (!text) return;
    const updated = items.map((item, i) => (i === idx ? text : item));
    setItems(updated);
    onSave(updated);
    setEditingIdx(null);
  }

  function handleMove(idx, direction) {
    if ((direction === -1 && idx <= 0) || (direction === 1 && idx >= items.length - 1)) return;
    const updated = [...items];
    const [moved] = updated.splice(idx, 1);
    updated.splice(idx + direction, 0, moved);
    setItems(updated);
    onSave(updated);
  }

  return (
    <div>
      <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wide mb-2">
        Guidance — What Good Looks Like {items.length > 0 && `(${items.length})`}
      </label>

      {items.length > 0 && (
        <ul className="space-y-1.5 mb-3">
          {items.map((item, idx) => (
            <li key={idx} className="flex items-start gap-2 group/bp">
              <span className="text-teal-500 mt-1 shrink-0 text-sm">&bull;</span>
              {editingIdx === idx ? (
                <div className="flex-1">
                  <input
                    type="text"
                    value={editText}
                    onChange={(e) => setEditText(e.target.value)}
                    autoFocus
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') handleEditSave(idx);
                      if (e.key === 'Escape') setEditingIdx(null);
                    }}
                    className="w-full px-2 py-1 border border-slate-300 rounded text-sm focus:outline-none focus:ring-2 focus:ring-teal-500"
                  />
                  <div className="flex gap-1 mt-1">
                    <button onClick={() => handleEditSave(idx)} className="px-2 py-0.5 text-xs bg-teal-600 text-white rounded hover:bg-teal-700">Save</button>
                    <button onClick={() => setEditingIdx(null)} className="px-2 py-0.5 text-xs border border-slate-300 text-slate-600 rounded hover:bg-slate-50">Cancel</button>
                  </div>
                </div>
              ) : (
                <>
                  <span className="flex-1 text-sm text-slate-600 leading-relaxed">{item}</span>
                  <div className="flex items-center gap-0.5 opacity-0 group-hover/bp:opacity-100 transition-opacity shrink-0">
                    <button onClick={() => handleMove(idx, -1)} disabled={idx === 0} className="p-0.5 text-slate-400 hover:text-slate-600 disabled:opacity-30 rounded">
                      <ArrowUp className="w-3 h-3" />
                    </button>
                    <button onClick={() => handleMove(idx, 1)} disabled={idx === items.length - 1} className="p-0.5 text-slate-400 hover:text-slate-600 disabled:opacity-30 rounded">
                      <ArrowDown className="w-3 h-3" />
                    </button>
                    <button onClick={() => { setEditingIdx(idx); setEditText(item); }} className="p-0.5 text-slate-400 hover:text-slate-600 rounded">
                      <Pencil className="w-3 h-3" />
                    </button>
                    <button onClick={() => handleDelete(idx)} className="p-0.5 text-slate-400 hover:text-red-600 rounded">
                      <Trash2 className="w-3 h-3" />
                    </button>
                  </div>
                </>
              )}
            </li>
          ))}
        </ul>
      )}

      <form onSubmit={handleAdd} className="flex gap-2">
        <input
          type="text"
          value={newItem}
          onChange={(e) => setNewItem(e.target.value)}
          placeholder="Add a guidance point..."
          className="flex-1 px-2 py-1.5 border border-slate-200 rounded text-sm focus:outline-none focus:ring-2 focus:ring-teal-500 placeholder:text-slate-400"
        />
        <button
          type="submit"
          disabled={!newItem.trim()}
          className="px-3 py-1.5 bg-teal-600 text-white rounded text-xs hover:bg-teal-700 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          Add
        </button>
      </form>
    </div>
  );
}
