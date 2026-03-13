import { useState, useRef, useEffect } from 'react';
import {
  Paperclip,
  Upload,
  X,
  Trash2,
  Download,
  FileText,
  Check,
  AlertCircle,
  ZoomIn,
} from 'lucide-react';
import {
  fetchAttachments,
  fetchAttachmentCount,
  uploadAttachment,
  deleteAttachment,
  getAttachmentUrl,
} from '../lib/api';
import { useAuth } from '../contexts/AuthContext';

const ACCEPTED_TYPES = ['image/jpeg', 'image/png', 'image/webp', 'application/pdf'];
const MAX_SIZE = 5 * 1024 * 1024; // 5MB

function formatFileSize(bytes) {
  if (bytes < 1024) return bytes + ' B';
  if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
  return (bytes / (1024 * 1024)).toFixed(1) + ' MB';
}

function isImage(mimeType) {
  return mimeType?.startsWith('image/');
}

export default function Attachments({ processId, documentId, readOnly = false, label }) {
  const { user } = useAuth();
  const [attachments, setAttachments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState('');
  const [lightboxUrl, setLightboxUrl] = useState(null);
  const [deleteConfirm, setDeleteConfirm] = useState(null);
  const fileInputRef = useRef(null);

  useEffect(() => {
    let cancelled = false;
    async function load() {
      try {
        const data = await fetchAttachments(processId);
        if (!cancelled) setAttachments(data);
      } catch {
        if (!cancelled) setError('Failed to load attachments');
      } finally {
        if (!cancelled) setLoading(false);
      }
    }
    load();
    return () => { cancelled = true; };
  }, [processId]);

  async function handleFileSelect(e) {
    const files = Array.from(e.target.files || []);
    if (files.length === 0) return;

    setUploading(true);
    setError('');

    for (const file of files) {
      if (!ACCEPTED_TYPES.includes(file.type)) {
        setError(`"${file.name}" is not a supported file type. Use JPG, PNG, WebP, or PDF.`);
        continue;
      }
      if (file.size > MAX_SIZE) {
        setError(`"${file.name}" is too large (${formatFileSize(file.size)}). Maximum size is 5MB.`);
        continue;
      }

      try {
        const newAtt = await uploadAttachment(file, processId, documentId, user.id);
        setAttachments((prev) => [...prev, newAtt]);
        setError('');
      } catch (err) {
        setError(`Failed to upload "${file.name}": ${err.message}`);
      }
    }

    setUploading(false);
    e.target.value = '';
  }

  async function handleDelete(att) {
    try {
      await deleteAttachment(att.id, att.storage_path);
      setAttachments((prev) => prev.filter((a) => a.id !== att.id));
      setDeleteConfirm(null);
    } catch (err) {
      setError(`Failed to delete: ${err.message}`);
    }
  }

  async function handleDownload(att) {
    try {
      const url = await getAttachmentUrl(att.storage_path);
      const link = document.createElement('a');
      link.href = url;
      link.download = att.filename;
      link.target = '_blank';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    } catch (err) {
      setError(`Failed to download: ${err.message}`);
    }
  }

  async function handleViewImage(att) {
    try {
      const url = await getAttachmentUrl(att.storage_path);
      setLightboxUrl(url);
    } catch (err) {
      setError(`Failed to load image: ${err.message}`);
    }
  }

  const imageAttachments = attachments.filter((a) => isImage(a.mime_type));
  const fileAttachments = attachments.filter((a) => !isImage(a.mime_type));

  if (loading) return null;
  if (readOnly && attachments.length === 0) return null;

  return (
    <div>
      <div className="flex items-center justify-between mb-2">
        <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wide">
          {label || 'Reference Materials'} {attachments.length > 0 && `(${attachments.length})`}
        </label>
        {!readOnly && (
          <>
            <button
              onClick={() => fileInputRef.current?.click()}
              disabled={uploading}
              className="flex items-center gap-1.5 text-xs font-medium text-teal-600 hover:text-teal-700 transition-colors disabled:opacity-50"
            >
              {uploading ? (
                <div className="w-3.5 h-3.5 border-2 border-teal-600 border-t-transparent rounded-full animate-spin" />
              ) : (
                <Upload className="w-3.5 h-3.5" />
              )}
              {uploading ? 'Uploading...' : 'Upload'}
            </button>
            <input
              ref={fileInputRef}
              type="file"
              accept=".jpg,.jpeg,.png,.webp,.pdf"
              multiple
              onChange={handleFileSelect}
              className="hidden"
            />
          </>
        )}
      </div>

      {error && (
        <div className="flex items-center gap-2 text-xs text-red-600 bg-red-50 rounded-lg px-3 py-2 mb-2">
          <AlertCircle className="w-3.5 h-3.5 shrink-0" />
          <span>{error}</span>
          <button onClick={() => setError('')} className="ml-auto p-0.5 hover:bg-red-100 rounded">
            <X className="w-3 h-3" />
          </button>
        </div>
      )}

      {attachments.length === 0 && !readOnly ? (
        <button
          onClick={() => fileInputRef.current?.click()}
          className="w-full border-2 border-dashed border-slate-200 rounded-lg py-4 text-center text-sm text-slate-400 hover:border-teal-300 hover:text-teal-500 transition-colors"
        >
          <Paperclip className="w-5 h-5 mx-auto mb-1" />
          Click to attach reference images or PDFs
        </button>
      ) : attachments.length > 0 ? (
        <div className="space-y-2">
          {imageAttachments.length > 0 && (
            <div className="grid grid-cols-3 sm:grid-cols-4 gap-2">
              {imageAttachments.map((att) => (
                <ImageThumbnail
                  key={att.id}
                  att={att}
                  readOnly={readOnly}
                  deleteConfirm={deleteConfirm}
                  onView={() => handleViewImage(att)}
                  onDownload={() => handleDownload(att)}
                  onDelete={() => handleDelete(att)}
                  onDeleteConfirm={() => setDeleteConfirm(att.id)}
                />
              ))}
            </div>
          )}
          {fileAttachments.map((att) => (
            <div key={att.id} className="flex items-center gap-3 p-2.5 rounded-lg border border-slate-200 bg-white">
              <div className="w-9 h-9 bg-red-50 rounded-lg flex items-center justify-center shrink-0">
                <FileText className="w-4 h-4 text-red-500" />
              </div>
              <div className="flex-1 min-w-0">
                <div className="text-sm font-medium text-slate-700 truncate">{att.filename}</div>
                <div className="text-xs text-slate-400">{formatFileSize(att.size_bytes)}</div>
              </div>
              <button onClick={() => handleDownload(att)} className="p-1.5 text-slate-400 hover:text-slate-600 hover:bg-slate-50 rounded" title="Download">
                <Download className="w-4 h-4" />
              </button>
              {!readOnly && (
                deleteConfirm === att.id ? (
                  <div className="flex gap-0.5">
                    <button onClick={() => handleDelete(att)} className="p-1.5 text-red-600 hover:bg-red-50 rounded"><Check className="w-4 h-4" /></button>
                    <button onClick={() => setDeleteConfirm(null)} className="p-1.5 text-slate-400 hover:bg-slate-50 rounded"><X className="w-4 h-4" /></button>
                  </div>
                ) : (
                  <button onClick={() => setDeleteConfirm(att.id)} className="p-1.5 text-slate-400 hover:text-red-500 hover:bg-red-50 rounded" title="Delete"><Trash2 className="w-4 h-4" /></button>
                )
              )}
            </div>
          ))}
        </div>
      ) : null}

      {lightboxUrl && (
        <div className="fixed inset-0 bg-black/80 z-50 flex items-center justify-center p-4" onClick={() => setLightboxUrl(null)}>
          <button className="absolute top-4 right-4 p-2 text-white/80 hover:text-white bg-black/30 rounded-full" onClick={() => setLightboxUrl(null)}>
            <X className="w-6 h-6" />
          </button>
          <img src={lightboxUrl} alt="Attachment" className="max-w-full max-h-[90vh] object-contain rounded-lg" onClick={(e) => e.stopPropagation()} />
        </div>
      )}
    </div>
  );
}

function ImageThumbnail({ att, readOnly, deleteConfirm, onView, onDownload, onDelete, onDeleteConfirm }) {
  const [thumbUrl, setThumbUrl] = useState(null);

  useEffect(() => {
    let cancelled = false;
    getAttachmentUrl(att.storage_path).then((url) => {
      if (!cancelled) setThumbUrl(url);
    }).catch(() => {});
    return () => { cancelled = true; };
  }, [att.storage_path]);

  return (
    <div className="relative group aspect-square rounded-lg overflow-hidden bg-slate-100 border border-slate-200">
      {thumbUrl ? (
        <img src={thumbUrl} alt={att.filename} className="w-full h-full object-cover" />
      ) : (
        <div className="w-full h-full flex items-center justify-center">
          <div className="w-5 h-5 border-2 border-slate-300 border-t-transparent rounded-full animate-spin" />
        </div>
      )}
      <div className="absolute inset-0 bg-black/0 group-hover:bg-black/40 transition-colors flex items-center justify-center gap-1 opacity-0 group-hover:opacity-100">
        <button onClick={onView} className="p-1.5 bg-white/90 rounded-lg text-slate-700 hover:bg-white" title="View full size">
          <ZoomIn className="w-4 h-4" />
        </button>
        <button onClick={onDownload} className="p-1.5 bg-white/90 rounded-lg text-slate-700 hover:bg-white" title="Download">
          <Download className="w-4 h-4" />
        </button>
        {!readOnly && (
          deleteConfirm === att.id ? (
            <button onClick={onDelete} className="p-1.5 bg-red-500 rounded-lg text-white hover:bg-red-600" title="Confirm delete">
              <Check className="w-4 h-4" />
            </button>
          ) : (
            <button onClick={onDeleteConfirm} className="p-1.5 bg-white/90 rounded-lg text-red-500 hover:bg-white" title="Delete">
              <Trash2 className="w-4 h-4" />
            </button>
          )
        )}
      </div>
    </div>
  );
}

/**
 * Small badge showing attachment count for a process card.
 */
export function AttachmentCountBadge({ processId }) {
  const [count, setCount] = useState(0);

  useEffect(() => {
    let cancelled = false;
    fetchAttachmentCount(processId).then((c) => {
      if (!cancelled) setCount(c);
    }).catch(() => {});
    return () => { cancelled = true; };
  }, [processId]);

  if (count === 0) return null;

  return (
    <span className="flex items-center gap-0.5 text-slate-400">
      <Paperclip className="w-3.5 h-3.5" />
      <span className="text-xs">{count}</span>
    </span>
  );
}
