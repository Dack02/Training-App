import { supabase } from './supabase';

// ─── Profiles ──────────────────────────────────────────

export async function fetchProfiles() {
  const { data, error } = await supabase
    .from('profiles')
    .select('*')
    .order('name');
  if (error) throw error;
  return data;
}

export async function fetchProfile(userId) {
  const { data, error } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', userId)
    .single();
  if (error) throw error;
  return data;
}

export async function updateProfile(userId, updates) {
  const { data, error } = await supabase
    .from('profiles')
    .update(updates)
    .eq('id', userId)
    .select()
    .single();
  if (error) throw error;
  return data;
}

// ─── Documents ─────────────────────────────────────────

export async function fetchDocuments() {
  const { data, error } = await supabase
    .from('documents')
    .select('*')
    .order('created_at');
  if (error) throw error;
  return data;
}

export async function fetchDocumentWithChildren(docId) {
  const [docRes, groupsRes, processesRes] = await Promise.all([
    supabase.from('documents').select('*').eq('id', docId).single(),
    supabase.from('process_groups').select('*').eq('document_id', docId).order('sort_order'),
    supabase.from('processes').select('*').eq('document_id', docId).order('sort_order'),
  ]);
  if (docRes.error) throw docRes.error;
  if (groupsRes.error) throw groupsRes.error;
  if (processesRes.error) throw processesRes.error;

  const processMap = {};
  for (const p of processesRes.data) {
    if (!processMap[p.group_id]) processMap[p.group_id] = [];
    processMap[p.group_id].push(p);
  }

  return {
    ...docRes.data,
    groups: groupsRes.data.map((g) => ({
      ...g,
      processes: processMap[g.id] || [],
    })),
  };
}

/** Fetch all documents with their groups and processes in one shot */
export async function fetchAllDocumentsWithChildren() {
  const [docsRes, groupsRes, processesRes] = await Promise.all([
    supabase.from('documents').select('*').order('created_at'),
    supabase.from('process_groups').select('*').order('sort_order'),
    supabase.from('processes').select('*').order('sort_order'),
  ]);
  if (docsRes.error) throw docsRes.error;
  if (groupsRes.error) throw groupsRes.error;
  if (processesRes.error) throw processesRes.error;

  const processMap = {};
  for (const p of processesRes.data) {
    if (!processMap[p.group_id]) processMap[p.group_id] = [];
    processMap[p.group_id].push(p);
  }

  const groupMap = {};
  for (const g of groupsRes.data) {
    if (!groupMap[g.document_id]) groupMap[g.document_id] = [];
    groupMap[g.document_id].push({ ...g, processes: processMap[g.id] || [] });
  }

  return docsRes.data.map((doc) => ({
    ...doc,
    groups: groupMap[doc.id] || [],
  }));
}

export async function createDocument(title, createdBy) {
  const { data, error } = await supabase
    .from('documents')
    .insert({ title, created_by: createdBy })
    .select()
    .single();
  if (error) throw error;
  return data;
}

export async function updateDocument(docId, updates) {
  const { data, error } = await supabase
    .from('documents')
    .update(updates)
    .eq('id', docId)
    .select()
    .single();
  if (error) throw error;
  return data;
}

export async function deleteDocument(docId) {
  const { error } = await supabase.from('documents').delete().eq('id', docId);
  if (error) throw error;
}

// ─── Process Groups ────────────────────────────────────

export async function createGroup(documentId, title, sortOrder) {
  const { data, error } = await supabase
    .from('process_groups')
    .insert({ document_id: documentId, title, sort_order: sortOrder })
    .select()
    .single();
  if (error) throw error;
  return data;
}

export async function updateGroup(groupId, updates) {
  const { data, error } = await supabase
    .from('process_groups')
    .update(updates)
    .eq('id', groupId)
    .select()
    .single();
  if (error) throw error;
  return data;
}

export async function deleteGroup(groupId) {
  const { error } = await supabase.from('process_groups').delete().eq('id', groupId);
  if (error) throw error;
}

export async function reorderGroups(groups) {
  // Batch update sort orders
  const promises = groups.map((g, i) =>
    supabase.from('process_groups').update({ sort_order: i }).eq('id', g.id)
  );
  const results = await Promise.all(promises);
  for (const r of results) {
    if (r.error) throw r.error;
  }
}

// ─── Processes ─────────────────────────────────────────

export async function createProcess(groupId, documentId, description, sortOrder, bulletPoints = []) {
  const { data, error } = await supabase
    .from('processes')
    .insert({
      group_id: groupId,
      document_id: documentId,
      description,
      sort_order: sortOrder,
      bullet_points: bulletPoints,
    })
    .select()
    .single();
  if (error) throw error;
  return data;
}

export async function updateProcess(processId, updates) {
  const { data, error } = await supabase
    .from('processes')
    .update(updates)
    .eq('id', processId)
    .select()
    .single();
  if (error) throw error;
  return data;
}

export async function deleteProcess(processId) {
  const { error } = await supabase.from('processes').delete().eq('id', processId);
  if (error) throw error;
}

export async function reorderProcesses(processes) {
  const promises = processes.map((p, i) =>
    supabase.from('processes').update({ sort_order: i }).eq('id', p.id)
  );
  const results = await Promise.all(promises);
  for (const r of results) {
    if (r.error) throw r.error;
  }
}

/** Bulk-create groups and processes (for bulk import) */
export async function bulkImportGroups(documentId, groupsData) {
  const created = [];
  for (let gi = 0; gi < groupsData.length; gi++) {
    const g = groupsData[gi];
    const group = await createGroup(documentId, g.title, gi);
    const processes = [];
    for (let pi = 0; pi < g.processes.length; pi++) {
      const desc = typeof g.processes[pi] === 'string' ? g.processes[pi] : g.processes[pi].description;
      const proc = await createProcess(group.id, documentId, desc, pi);
      processes.push(proc);
    }
    created.push({ ...group, processes });
  }
  return created;
}

// ─── Progress ──────────────────────────────────────────

export async function fetchProgressForDoc(documentId, userId) {
  const { data, error } = await supabase
    .from('progress')
    .select('*')
    .eq('document_id', documentId)
    .eq('user_id', userId);
  if (error) throw error;
  return data;
}

export async function fetchAllProgressForDoc(documentId) {
  const { data, error } = await supabase
    .from('progress')
    .select('*')
    .eq('document_id', documentId);
  if (error) throw error;
  return data;
}

/**
 * Convert a progress row array into the map shape components expect:
 * { [processId]: { grade, notes, updated_at } }
 */
export function progressArrayToMap(rows) {
  const map = {};
  for (const row of rows) {
    map[row.process_id] = {
      grade: row.grade,
      notes: row.notes,
      updated_at: row.updated_at,
    };
  }
  return map;
}

export async function upsertProgress(processId, userId, documentId, grade, notes) {
  const { data, error } = await supabase
    .from('progress')
    .upsert(
      {
        process_id: processId,
        user_id: userId,
        document_id: documentId,
        grade,
        notes: notes || '',
        updated_at: new Date().toISOString(),
      },
      { onConflict: 'process_id,user_id' }
    )
    .select()
    .single();
  if (error) throw error;
  return data;
}

// ─── Signoffs ──────────────────────────────────────────

export async function fetchSignoffsForDoc(documentId, userId) {
  const { data, error } = await supabase
    .from('signoffs')
    .select('*')
    .eq('document_id', documentId)
    .eq('user_id', userId)
    .order('signed_off_at');
  if (error) throw error;
  return data;
}

export async function fetchAllSignoffsForDoc(documentId) {
  const { data, error } = await supabase
    .from('signoffs')
    .select('*, manager:profiles!signoffs_manager_id_fkey(name)')
    .eq('document_id', documentId)
    .order('signed_off_at');
  if (error) throw error;
  return data;
}

/**
 * Build a signoff map: { [processId]: signoffRecord } for the latest non-revoked entry
 */
export function signoffArrayToMap(rows) {
  const map = {};
  for (const row of rows) {
    if (row.revoked_at) {
      delete map[row.process_id];
    } else {
      map[row.process_id] = row;
    }
  }
  return map;
}

export async function createSignoff(processId, userId, documentId, managerId, comment) {
  const { data, error } = await supabase
    .from('signoffs')
    .insert({
      process_id: processId,
      user_id: userId,
      document_id: documentId,
      manager_id: managerId,
      comment: comment || null,
    })
    .select('*, manager:profiles!signoffs_manager_id_fkey(name)')
    .single();
  if (error) throw error;
  return data;
}

export async function revokeSignoff(signoffId, reason) {
  const { data, error } = await supabase
    .from('signoffs')
    .update({
      revoked_at: new Date().toISOString(),
      revoke_reason: reason || null,
    })
    .eq('id', signoffId)
    .select()
    .single();
  if (error) throw error;
  return data;
}

// ─── Attachments ───────────────────────────────────────

export async function fetchAttachments(processId) {
  const { data, error } = await supabase
    .from('attachments')
    .select('*')
    .eq('process_id', processId)
    .order('created_at');
  if (error) throw error;
  return data;
}

export async function fetchAttachmentCount(processId) {
  const { count, error } = await supabase
    .from('attachments')
    .select('*', { count: 'exact', head: true })
    .eq('process_id', processId);
  if (error) throw error;
  return count || 0;
}

export async function uploadAttachment(file, processId, documentId, uploadedBy) {
  const ext = file.name.split('.').pop();
  const storagePath = `${documentId}/${processId}/${crypto.randomUUID()}.${ext}`;

  // Upload to Storage
  const { error: uploadError } = await supabase.storage
    .from('attachments')
    .upload(storagePath, file, { contentType: file.type });
  if (uploadError) throw uploadError;

  // Insert metadata row
  const { data, error: insertError } = await supabase
    .from('attachments')
    .insert({
      process_id: processId,
      document_id: documentId,
      filename: file.name,
      storage_path: storagePath,
      mime_type: file.type,
      size_bytes: file.size,
      uploaded_by: uploadedBy,
    })
    .select()
    .single();
  if (insertError) throw insertError;
  return data;
}

export async function deleteAttachment(attachmentId, storagePath) {
  // Delete from storage
  const { error: storageErr } = await supabase.storage
    .from('attachments')
    .remove([storagePath]);
  if (storageErr) throw storageErr;

  // Delete metadata row
  const { error: dbErr } = await supabase
    .from('attachments')
    .delete()
    .eq('id', attachmentId);
  if (dbErr) throw dbErr;
}

export async function getAttachmentUrl(storagePath) {
  const { data, error } = await supabase.storage
    .from('attachments')
    .createSignedUrl(storagePath, 3600); // 1 hour expiry
  if (error) throw error;
  return data.signedUrl;
}
