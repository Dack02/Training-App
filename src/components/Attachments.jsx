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
import storage from '../utils/storage';
import { generateId } from '../utils/ids';

const ACCEPTED_TYPES = ['image/jpeg', 'image/png', 'image/webp', 'application/pdf'];
const MAX_SIZE = 2 * 1024 * 1024; // 2MB

function formatFileSize(bytes) {
  if (bytes < 1024) return bytes + ' B';
  if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
  return (bytes / (1024 * 1024)).toFixed(1) + ' MB';
}

function isImage(mimeType) {
  return mimeType.startsWith('image/');
}

/**
 * Attachments component — reference files attached to a process (shared, not per-user).
 *
 * Props:
 *   docId, processId — identifies the process
 *   uploaderName — name of the person uploading (for metadata)
 *   readOnly — if true, hides upload/delete controls (trainee view)
 *   label — optional custom label
 */
export default function Attachments({ docId, processId, uploaderName, readOnly = false, label }) {
  const [attachments, setAttachments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [lightboxIdx, setLightboxIdx] = useState(null);
  const [deleteConfirm, setDeleteConfirm] = useState(null);
  const fileInputRef = useRef(null);

  const storageKey = `attachments:${docId}:${processId}`;

  useEffect(() => {
    try {
      const stored = storage.get(storageKey) || [];
      setAttachments(stored);
    } catch {
      setError('Failed to load attachments');
    } finally {
      setLoading(false);
    }
  }, [storageKey]);

  function saveAttachments(updated) {
    try {
      storage.set(storageKey, updated);
      setAttachments(updated);
      setError('');
    } catch {
      setError('Failed to save attachment. Storage may be full.');
    }
  }

  function handleFileSelect(e) {
    const files = Array.from(e.target.files || []);
    if (files.length === 0) return;

    for (const file of files) {
      if (!ACCEPTED_TYPES.includes(file.type)) {
        setError(`"${file.name}" is not a supported file type. Use JPG, PNG, WebP, or PDF.`);
        continue;
      }
      if (file.size > MAX_SIZE) {
        setError(`"${file.name}" is too large (${formatFileSize(file.size)}). Maximum size is 2MB.`);
        continue;
      }

      const reader = new FileReader();
      reader.onload = () => {
        const base64 = reader.result;
        const newAttachment = {
          id: generateId(),
          filename: file.name,
          mimeType: file.type,
          size: file.size,
          data: base64,
          uploadedAt: new Date().toISOString(),
          uploadedBy: uploaderName || 'Unknown',
        };
        setAttachments((prev) => {
          const updated = [...prev, newAttachment];
          try {
            storage.set(storageKey, updated);
            setError('');
          } catch {
            setError('Failed to save attachment. Storage may be full.');
          }
          return updated;
        });
      };
      reader.readAsDataURL(file);
    }

    e.target.value = '';
  }

  function handleDelete(attachmentId) {
    const updated = attachments.filter((a) => a.id !== attachmentId);
    saveAttachments(updated);
    setDeleteConfirm(null);
  }

  function handleDownload(attachment) {
    const link = document.createElement('a');
    link.href = attachment.data;
    link.download = attachment.filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  }

  const imageAttachments = attachments.filter((a) => isImage(a.mimeType));
  const fileAttachments = attachments.filter((a) => !isImage(a.mimeType));

  if (loading) return null;

  // If read-only and no attachments, show nothing
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
              className="flex items-center gap-1.5 text-xs font-medium text-teal-600 hover:text-teal-700 transition-colors"
            >
              <Upload className="w-3.5 h-3.5" />
              Upload
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
          {/* Image grid */}
          {imageAttachments.length > 0 && (
            <div className="grid grid-cols-3 sm:grid-cols-4 gap-2">
              {imageAttachments.map((att, idx) => (
                <div key={att.id} className="relative group aspect-square rounded-lg overflow-hidden bg-slate-100 border border-slate-200">
                  <img
                    src={att.data}
                    alt={att.filename}
                    className="w-full h-full object-cover"
                  />
                  <div className="absolute inset-0 bg-black/0 group-hover:bg-black/40 transition-colors flex items-center justify-center gap-1 opacity-0 group-hover:opacity-100">
                    <button
                      onClick={() => setLightboxIdx(idx)}
                      className="p-1.5 bg-white/90 rounded-lg text-slate-700 hover:bg-white"
                      title="View full size"
                    >
                      <ZoomIn className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => handleDownload(att)}
                      className="p-1.5 bg-white/90 rounded-lg text-slate-700 hover:bg-white"
                      title="Download"
                    >
                      <Download className="w-4 h-4" />
                    </button>
                    {!readOnly && (
                      deleteConfirm === att.id ? (
                        <button
                          onClick={() => handleDelete(att.id)}
                          className="p-1.5 bg-red-500 rounded-lg text-white hover:bg-red-600"
                          title="Confirm delete"
                        >
                          <Check className="w-4 h-4" />
                        </button>
                      ) : (
                        <button
                          onClick={() => setDeleteConfirm(att.id)}
                          className="p-1.5 bg-white/90 rounded-lg text-red-500 hover:bg-white"
                          title="Delete"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      )
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Non-image files list */}
          {fileAttachments.map((att) => (
            <div
              key={att.id}
              className="flex items-center gap-3 p-2.5 rounded-lg border border-slate-200 bg-white"
            >
              <div className="w-9 h-9 bg-red-50 rounded-lg flex items-center justify-center shrink-0">
                <FileText className="w-4 h-4 text-red-500" />
              </div>
              <div className="flex-1 min-w-0">
                <div className="text-sm font-medium text-slate-700 truncate">{att.filename}</div>
                <div className="text-xs text-slate-400">{formatFileSize(att.size)}</div>
              </div>
              <button
                onClick={() => handleDownload(att)}
                className="p-1.5 text-slate-400 hover:text-slate-600 hover:bg-slate-50 rounded"
                title="Download"
              >
                <Download className="w-4 h-4" />
              </button>
              {!readOnly && (
                deleteConfirm === att.id ? (
                  <div className="flex gap-0.5">
                    <button
                      onClick={() => handleDelete(att.id)}
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
                    onClick={() => setDeleteConfirm(att.id)}
                    className="p-1.5 text-slate-400 hover:text-red-500 hover:bg-red-50 rounded"
                    title="Delete"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                )
              )}
            </div>
          ))}
        </div>
      ) : null}

      {/* Lightbox */}
      {lightboxIdx !== null && imageAttachments[lightboxIdx] && (
        <div
          className="fixed inset-0 bg-black/80 z-50 flex items-center justify-center p-4"
          onClick={() => setLightboxIdx(null)}
        >
          <button
            className="absolute top-4 right-4 p-2 text-white/80 hover:text-white bg-black/30 rounded-full"
            onClick={() => setLightboxIdx(null)}
          >
            <X className="w-6 h-6" />
          </button>
          <img
            src={imageAttachments[lightboxIdx].data}
            alt={imageAttachments[lightboxIdx].filename}
            className="max-w-full max-h-[90vh] object-contain rounded-lg"
            onClick={(e) => e.stopPropagation()}
          />
          <div className="absolute bottom-4 text-white/70 text-sm">
            {imageAttachments[lightboxIdx].filename}
          </div>
        </div>
      )}
    </div>
  );
}

/**
 * Small badge showing attachment count for a process card.
 * Uses shared process-level key (not per-user).
 */
export function AttachmentCountBadge({ docId, processId }) {
  const [count, setCount] = useState(0);

  useEffect(() => {
    try {
      const stored = storage.get(`attachments:${docId}:${processId}`);
      if (stored?.length) setCount(stored.length);
    } catch {
      // ignore
    }
  }, [docId, processId]);

  if (count === 0) return null;

  return (
    <span className="flex items-center gap-0.5 text-slate-400">
      <Paperclip className="w-3.5 h-3.5" />
      <span className="text-xs">{count}</span>
    </span>
  );
}
