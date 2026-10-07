import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
  X,
  Upload,
  Trash2,
  Image as ImageIcon,
  AlertCircle,
  Save,
  Check,
  Calendar,
  Clock,
  Smile,
  Sparkles,
  RefreshCw,
  Eye,
  FileText,
} from 'lucide-react';
import { DiaryEntry, DiaryImage, MOOD_OPTIONS } from '../types';
import { useAuth } from '../context/AuthContext';

interface EntryEditorModalProps {
  isOpen: boolean;
  onClose: () => void;
  entryToEdit?: DiaryEntry | null;
  onSaved: (savedEntry: DiaryEntry) => void;
  onDeleted?: (deletedId: string) => void;
}

export const EntryEditorModal: React.FC<EntryEditorModalProps> = ({
  isOpen,
  onClose,
  entryToEdit,
  onSaved,
  onDeleted,
}) => {
  const { token } = useAuth();

  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [date, setDate] = useState('');
  const [time, setTime] = useState('');
  const [mood, setMood] = useState<string>('');
  const [images, setImages] = useState<DiaryImage[]>([]);

  // Status & states
  const [isDraft, setIsDraft] = useState(false);
  const [saving, setSaving] = useState(false);
  const [saveStatus, setSaveStatus] = useState<'idle' | 'saving' | 'saved' | 'error' | 'autosaved'>('idle');
  const [lastSavedTime, setLastSavedTime] = useState<string | null>(null);

  const [deleting, setDeleting] = useState(false);
  const [uploadingImage, setUploadingImage] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const [saveError, setSaveError] = useState<string | null>(null);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [showExitConfirm, setShowExitConfirm] = useState(false);
  const [isDirty, setIsDirty] = useState(false);

  const fileInputRef = useRef<HTMLInputElement>(null);
  const autosaveTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Initialize or reset state when modal opens or entryToEdit changes
  useEffect(() => {
    if (!isOpen) return;

    if (entryToEdit) {
      setTitle(entryToEdit.title || '');
      setContent(entryToEdit.content || '');
      setDate(entryToEdit.date || new Date().toISOString().split('T')[0]);
      setTime(entryToEdit.time || new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }));
      setMood(entryToEdit.mood || '');
      setImages(entryToEdit.images || []);
      setIsDraft(Boolean(entryToEdit.isDraft));
      setIsDirty(false);
      setSaveStatus('idle');
    } else {
      // Check for autosaved new draft in localStorage
      const autosaved = localStorage.getItem('ash_archive_new_draft');
      const now = new Date();
      const today = now.toISOString().split('T')[0];
      const currentTime = now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

      if (autosaved) {
        try {
          const parsed = JSON.parse(autosaved);
          setTitle(parsed.title || '');
          setContent(parsed.content || '');
          setDate(parsed.date || today);
          setTime(parsed.time || currentTime);
          setMood(parsed.mood || '');
          setImages(parsed.images || []);
          setIsDraft(true);
          setIsDirty(Boolean(parsed.content || parsed.title));
          setSaveStatus('autosaved');
          setLastSavedTime('Recovered local draft');
        } catch {
          setTitle('');
          setContent('');
          setDate(today);
          setTime(currentTime);
          setMood('');
          setImages([]);
          setIsDraft(false);
          setIsDirty(false);
          setSaveStatus('idle');
        }
      } else {
        setTitle('');
        setContent('');
        setDate(today);
        setTime(currentTime);
        setMood('');
        setImages([]);
        setIsDraft(false);
        setIsDirty(false);
        setSaveStatus('idle');
      }
    }

    setUploadError(null);
    setSaveError(null);
    setShowDeleteConfirm(false);
    setShowExitConfirm(false);
  }, [isOpen, entryToEdit]);

  // Window beforeunload listener to prevent accidental loss
  useEffect(() => {
    const handleBeforeUnload = (e: BeforeUnloadEvent) => {
      if (isOpen && isDirty && content.trim()) {
        e.preventDefault();
        e.returnValue = 'You have unsaved diary writing. Leave without saving?';
        return e.returnValue;
      }
    };

    window.addEventListener('beforeunload', handleBeforeUnload);
    return () => window.removeEventListener('beforeunload', handleBeforeUnload);
  }, [isOpen, isDirty, content]);

  // Local autosave timer (debounced 1000ms)
  useEffect(() => {
    if (!isOpen) return;

    if (autosaveTimeoutRef.current) {
      clearTimeout(autosaveTimeoutRef.current);
    }

    if (isDirty && (content || title)) {
      autosaveTimeoutRef.current = setTimeout(() => {
        try {
          const key = entryToEdit
            ? `ash_archive_draft_edit_${entryToEdit.id}`
            : 'ash_archive_new_draft';

          localStorage.setItem(
            key,
            JSON.stringify({ title, content, date, time, mood, images, isDraft })
          );

          setSaveStatus('autosaved');
          setLastSavedTime(new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }));
        } catch (e) {
          console.warn('LocalStorage draft save error', e);
        }
      }, 1000);
    }

    return () => {
      if (autosaveTimeoutRef.current) clearTimeout(autosaveTimeoutRef.current);
    };
  }, [title, content, date, time, mood, images, isDraft, isDirty, entryToEdit, isOpen]);

  // Content change tracker
  const handleContentChange = (val: string) => {
    setContent(val);
    setIsDirty(true);
    setSaveStatus('saving');
  };

  const handleTitleChange = (val: string) => {
    setTitle(val);
    setIsDirty(true);
    setSaveStatus('saving');
  };

  if (!isOpen) return null;

  // Handle uploading persistent images via /api/upload
  const handleImageFiles = async (files: FileList | null) => {
    if (!files || files.length === 0) return;

    setUploadingImage(true);
    setUploadError(null);

    const uploadedList: DiaryImage[] = [];
    const errors: string[] = [];

    for (let i = 0; i < files.length; i++) {
      const file = files[i];

      // Validate file size (max 10MB)
      if (file.size > 10 * 1024 * 1024) {
        errors.push(`${file.name}: Image exceeds 10MB limit`);
        continue;
      }

      try {
        const base64Data = await new Promise<string>((resolve, reject) => {
          const reader = new FileReader();
          reader.onload = () => resolve(reader.result as string);
          reader.onerror = () => reject(new Error('Failed to read file'));
          reader.readAsDataURL(file);
        });

        const res = await fetch('/api/upload', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            ...(token ? { Authorization: `Bearer ${token}` } : {}),
          },
          body: JSON.stringify({
            image: base64Data,
            filename: file.name,
          }),
        });

        const data = await res.json();
        if (res.ok && data.url) {
          uploadedList.push({
            id: data.id || 'img_' + Date.now() + '_' + i,
            url: data.url,
            caption: '',
          });
        } else {
          errors.push(`${file.name}: ${data.error || 'Upload error'}`);
        }
      } catch (err) {
        console.error('Image upload failed:', err);
        errors.push(`${file.name}: Network failure while uploading`);
      }
    }

    if (uploadedList.length > 0) {
      setImages((prev) => [...prev, ...uploadedList]);
      setIsDirty(true);
    }

    if (errors.length > 0) {
      setUploadError(errors.join('. '));
    }

    setUploadingImage(false);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const handleRemoveImage = (index: number) => {
    setImages((prev) => prev.filter((_, i) => i !== index));
    setIsDirty(true);
  };

  const handleImageCaptionChange = (index: number, caption: string) => {
    setImages((prev) =>
      prev.map((img, i) => (i === index ? { ...img, caption } : img))
    );
    setIsDirty(true);
  };

  // Perform Save / Publish
  const handleSave = async (asDraftState: boolean) => {
    if (!content.trim()) {
      setSaveError('Please write some words before saving.');
      return;
    }

    setSaving(true);
    setSaveStatus('saving');
    setSaveError(null);

    const payload = {
      title: title.trim(),
      content: content.trim(),
      date: date || new Date().toISOString().split('T')[0],
      time: time || new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      mood: mood || undefined,
      images,
      isDraft: asDraftState,
    };

    try {
      let res: Response;
      if (entryToEdit) {
        res = await fetch(`/api/entries/${entryToEdit.id}`, {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify(payload),
        });
      } else {
        res = await fetch('/api/entries', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify(payload),
        });
      }

      const data = await res.json();
      if (res.ok && data.id) {
        // Clear local autosave
        try {
          if (entryToEdit) {
            localStorage.removeItem(`ash_archive_draft_edit_${entryToEdit.id}`);
          } else {
            localStorage.removeItem('ash_archive_new_draft');
          }
        } catch {
          // ignore
        }

        setIsDirty(false);
        setSaveStatus('saved');
        onSaved(data);
        onClose();
      } else {
        setSaveStatus('error');
        setSaveError(
          data.error || 'Server could not save entry. Your written words are safely preserved. Please retry.'
        );
      }
    } catch (err) {
      console.error('Save failed:', err);
      setSaveStatus('error');
      setSaveError(
        'Connection failure while saving. Your writing remains completely intact. Please retry.'
      );
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!entryToEdit || !token) return;

    setDeleting(true);
    setSaveError(null);

    try {
      const res = await fetch(`/api/entries/${entryToEdit.id}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();

      if (res.ok && data.success) {
        try {
          localStorage.removeItem(`ash_archive_draft_edit_${entryToEdit.id}`);
        } catch {
          // ignore
        }
        if (onDeleted) onDeleted(entryToEdit.id);
        onClose();
      } else {
        setSaveError(data.error || 'Failed to delete entry');
      }
    } catch {
      setSaveError('Network error while deleting entry');
    } finally {
      setDeleting(false);
    }
  };

  // Safe close with dirty warning
  const requestClose = () => {
    if (isDirty && content.trim().length > 10) {
      setShowExitConfirm(true);
    } else {
      onClose();
    }
  };

  const wordCount = content.trim() ? content.trim().split(/\s+/).length : 0;
  const charCount = content.length;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 backdrop-blur-xs p-2 sm:p-4 md:p-6 animate-in fade-in duration-200"
      onClick={requestClose}
    >
      <div
        className="relative w-full max-w-4xl max-h-[96vh] flex flex-col rounded-2xl border shadow-2xl overflow-hidden paper-texture diary-book-shadow transition-all"
        style={{
          borderColor: 'var(--paper-border)',
          color: 'var(--ink-primary)',
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Book spine simulation on left border */}
        <div
          className="absolute left-0 top-0 bottom-0 w-3 pointer-events-none book-gutter-left opacity-70 z-20"
          aria-hidden="true"
        />

        {/* Header Bar */}
        <div
          className="flex items-center justify-between px-6 py-4 border-b shrink-0 select-none z-10"
          style={{ borderColor: 'var(--paper-border)' }}
        >
          <div className="flex items-center gap-3">
            <h2
              className="text-base sm:text-lg font-display font-semibold tracking-wide flex items-center gap-2"
              style={{ color: 'var(--ink-accent)' }}
            >
              <FileText size={18} />
              <span>{entryToEdit ? 'Inscribe Memory' : 'New Journal Entry'}</span>
            </h2>

            {/* Subtle Save Status Indicator */}
            <div className="hidden sm:flex items-center gap-1.5 text-xs font-garamond text-stone-500 italic">
              {saveStatus === 'saving' && (
                <span className="flex items-center gap-1 text-amber-700 dark:text-amber-400">
                  <RefreshCw size={11} className="animate-spin" />
                  <span>Saving…</span>
                </span>
              )}
              {saveStatus === 'saved' && (
                <span className="flex items-center gap-1 text-emerald-700 dark:text-emerald-400">
                  <Check size={12} />
                  <span>Changes saved</span>
                </span>
              )}
              {saveStatus === 'autosaved' && (
                <span className="flex items-center gap-1 text-stone-400">
                  <Sparkles size={11} className="text-amber-600" />
                  <span>
                    Saved locally {lastSavedTime ? `at ${lastSavedTime}` : 'just now'}
                  </span>
                </span>
              )}
              {saveStatus === 'error' && (
                <span className="text-red-600 dark:text-red-400 flex items-center gap-1 font-semibold">
                  <AlertCircle size={12} />
                  <span>Unsaved changes (local draft kept)</span>
                </span>
              )}
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={requestClose}
              className="p-1.5 rounded-full text-stone-500 hover:text-stone-800 dark:hover:text-stone-200 transition-colors cursor-pointer"
              aria-label="Close editor"
            >
              <X size={20} />
            </button>
          </div>
        </div>

        {/* Exit Confirmation Dialog Banner */}
        {showExitConfirm && (
          <div className="px-6 py-3 bg-amber-500/10 border-b border-amber-600/30 flex items-center justify-between text-xs font-garamond animate-in slide-in-from-top-2">
            <span className="text-stone-700 dark:text-stone-300">
              You have unsaved writing. Your text is backed up locally. Are you sure you want to exit?
            </span>
            <div className="flex items-center gap-2">
              <button
                onClick={onClose}
                className="px-3 py-1 rounded bg-amber-700 text-white font-medium hover:bg-amber-800 transition-colors cursor-pointer"
              >
                Exit
              </button>
              <button
                onClick={() => setShowExitConfirm(false)}
                className="px-3 py-1 rounded border border-stone-400 text-stone-600 dark:text-stone-300 hover:bg-stone-200/40 cursor-pointer"
              >
                Keep Writing
              </button>
            </div>
          </div>
        )}

        {/* Scrollable Writing Form */}
        <div className="flex-1 overflow-y-auto px-6 sm:px-10 py-6 space-y-6">
          {saveError && (
            <div className="p-3.5 rounded-xl bg-red-950/20 border border-red-800/40 text-red-600 dark:text-red-400 text-xs flex items-center justify-between animate-in fade-in">
              <div className="flex items-center gap-2">
                <AlertCircle size={16} className="shrink-0" />
                <span>{saveError}</span>
              </div>
              <button
                onClick={() => handleSave(isDraft)}
                className="px-2.5 py-1 rounded bg-red-600 text-white text-xs hover:bg-red-700 transition-colors cursor-pointer shrink-0 ml-3"
              >
                Retry Save
              </button>
            </div>
          )}

          {/* Title & Date/Time Row */}
          <div className="grid grid-cols-1 md:grid-cols-12 gap-4">
            <div className="md:col-span-7">
              <label className="block text-xs uppercase tracking-wider text-stone-400 mb-1.5 font-garamond">
                Title (Optional)
              </label>
              <input
                type="text"
                value={title}
                onChange={(e) => handleTitleChange(e.target.value)}
                placeholder="e.g. বৃষ্টির রাতে কিছু না-বলা কথা..."
                className="w-full px-4 py-2.5 rounded-xl border text-base sm:text-lg font-serif focus:outline-hidden transition-all"
                style={{
                  backgroundColor: 'var(--paper-page-alt)',
                  borderColor: 'var(--paper-border)',
                  color: 'var(--ink-primary)',
                }}
              />
            </div>

            <div className="md:col-span-3">
              <label className="block text-xs uppercase tracking-wider text-stone-400 mb-1.5 font-garamond flex items-center gap-1">
                <Calendar size={12} /> Date
              </label>
              <input
                type="date"
                value={date}
                onChange={(e) => {
                  setDate(e.target.value);
                  setIsDirty(true);
                }}
                className="w-full px-3 py-2.5 rounded-xl border text-xs font-serif focus:outline-hidden"
                style={{
                  backgroundColor: 'var(--paper-page-alt)',
                  borderColor: 'var(--paper-border)',
                  color: 'var(--ink-primary)',
                }}
              />
            </div>

            <div className="md:col-span-2">
              <label className="block text-xs uppercase tracking-wider text-stone-400 mb-1.5 font-garamond flex items-center gap-1">
                <Clock size={12} /> Time
              </label>
              <input
                type="text"
                value={time}
                onChange={(e) => {
                  setTime(e.target.value);
                  setIsDirty(true);
                }}
                placeholder="11:42 PM"
                className="w-full px-3 py-2.5 rounded-xl border text-xs font-serif focus:outline-hidden"
                style={{
                  backgroundColor: 'var(--paper-page-alt)',
                  borderColor: 'var(--paper-border)',
                  color: 'var(--ink-primary)',
                }}
              />
            </div>
          </div>

          {/* Mood Selector */}
          <div>
            <label className="block text-xs uppercase tracking-wider text-stone-400 mb-2 font-garamond flex items-center gap-1">
              <Smile size={12} /> Tone / Mood (Optional)
            </label>
            <div className="flex flex-wrap gap-2">
              <button
                type="button"
                onClick={() => {
                  setMood('');
                  setIsDirty(true);
                }}
                className={`px-3 py-1.5 text-xs rounded-lg border font-garamond transition-all cursor-pointer ${
                  !mood ? 'font-semibold shadow-xs' : 'opacity-70 hover:opacity-100'
                }`}
                style={{
                  backgroundColor: !mood ? 'var(--paper-page-alt)' : 'transparent',
                  borderColor: !mood ? 'var(--ink-accent)' : 'var(--paper-border)',
                  color: !mood ? 'var(--ink-accent)' : 'var(--ink-muted)',
                }}
              >
                None
              </button>
              {MOOD_OPTIONS.map((m) => {
                const isSelected = mood === `${m.label} · ${m.bengali}`;
                return (
                  <button
                    key={m.id}
                    type="button"
                    onClick={() => {
                      setMood(`${m.label} · ${m.bengali}`);
                      setIsDirty(true);
                    }}
                    className={`px-3 py-1.5 text-xs rounded-lg border font-garamond transition-all cursor-pointer flex items-center gap-1.5 ${
                      isSelected ? 'font-semibold shadow-xs' : 'opacity-75 hover:opacity-100'
                    }`}
                    style={{
                      backgroundColor: isSelected ? 'var(--paper-page-alt)' : 'transparent',
                      borderColor: isSelected ? 'var(--ink-accent)' : 'var(--paper-border)',
                      color: isSelected ? 'var(--ink-accent)' : 'var(--ink-primary)',
                    }}
                  >
                    <span>{m.icon}</span>
                    <span>{m.label}</span>
                    <span className="text-[11px] opacity-70">({m.bengali})</span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Calm, Distraction-Free Diary Writing Area */}
          <div>
            <div className="flex items-center justify-between mb-1.5 select-none">
              <label className="text-xs uppercase tracking-wider text-stone-400 font-garamond">
                Diary Content (Bangla / English)
              </label>
              <div className="text-[11px] text-stone-400 font-garamond">
                {wordCount} words · {charCount} characters
              </div>
            </div>

            <div
              className="relative rounded-xl border p-1 transition-all focus-within:ring-1"
              style={{
                borderColor: 'var(--paper-border)',
                backgroundColor: 'var(--paper-page-alt)',
              }}
            >
              <textarea
                rows={14}
                value={content}
                onChange={(e) => handleContentChange(e.target.value)}
                placeholder="আজকের দিনলিপিতে কী লিখে রাখতে চান? আপনার অনুভূতি, স্মৃতি বা না-বলা ভাবনা..."
                className="w-full p-4 bg-transparent border-0 text-base sm:text-lg font-bengali leading-loose focus:outline-hidden resize-y min-h-[260px]"
                style={{
                  lineHeight: '2.1',
                  color: 'var(--ink-primary)',
                }}
              />
            </div>
          </div>

          {/* Attached Memories / Images */}
          <div className="pt-4 border-t" style={{ borderColor: 'var(--paper-border)' }}>
            <div className="flex items-center justify-between mb-3 select-none">
              <div>
                <h3 className="text-xs uppercase tracking-wider text-stone-400 font-garamond flex items-center gap-1.5">
                  <ImageIcon size={14} /> Attached Photographs & Memories
                </h3>
                <p className="text-[11px] text-stone-400 font-garamond italic">
                  Persistent object storage — remains in your journal archive long-term
                </p>
              </div>

              <div>
                <input
                  type="file"
                  ref={fileInputRef}
                  accept="image/*"
                  multiple
                  onChange={(e) => handleImageFiles(e.target.files)}
                  className="hidden"
                />
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  disabled={uploadingImage}
                  className="px-3.5 py-1.5 text-xs rounded-lg border font-garamond uppercase tracking-wider flex items-center gap-1.5 hover:bg-stone-200/40 dark:hover:bg-stone-800/40 transition-colors cursor-pointer disabled:opacity-50"
                  style={{ borderColor: 'var(--paper-border)' }}
                >
                  <Upload size={13} />
                  <span>{uploadingImage ? 'Uploading…' : 'Add Images'}</span>
                </button>
              </div>
            </div>

            {uploadError && (
              <div className="mb-3 p-2.5 rounded-lg bg-amber-950/20 border border-amber-800/40 text-amber-700 dark:text-amber-400 text-xs flex items-center gap-2">
                <AlertCircle size={14} className="shrink-0" />
                <span>{uploadError}</span>
              </div>
            )}

            {images.length > 0 ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
                {images.map((img, idx) => (
                  <div
                    key={img.id || idx}
                    className="p-2.5 rounded-xl border shadow-xs relative group flex flex-col gap-2"
                    style={{
                      backgroundColor: 'var(--paper-page)',
                      borderColor: 'var(--paper-border)',
                    }}
                  >
                    <div className="relative aspect-4/3 w-full rounded-lg overflow-hidden bg-stone-900/10">
                      <img
                        src={img.url}
                        alt="Memory preview"
                        className="w-full h-full object-cover"
                      />
                      <button
                        type="button"
                        onClick={() => handleRemoveImage(idx)}
                        className="absolute top-1.5 right-1.5 p-1 rounded-full bg-red-600 text-white opacity-85 hover:opacity-100 hover:bg-red-700 transition-opacity cursor-pointer shadow-md"
                        title="Remove image"
                        aria-label="Remove image"
                      >
                        <Trash2 size={13} />
                      </button>
                    </div>

                    <input
                      type="text"
                      value={img.caption || ''}
                      onChange={(e) => handleImageCaptionChange(idx, e.target.value)}
                      placeholder="Add caption…"
                      className="w-full px-2.5 py-1 text-xs rounded-md border font-garamond italic focus:outline-hidden"
                      style={{
                        backgroundColor: 'var(--paper-page-alt)',
                        borderColor: 'var(--paper-border)',
                        color: 'var(--ink-secondary)',
                      }}
                    />
                  </div>
                ))}
              </div>
            ) : (
              <div
                onClick={() => fileInputRef.current?.click()}
                className="py-6 px-4 rounded-xl border-2 border-dashed flex flex-col items-center justify-center text-center cursor-pointer transition-colors hover:border-amber-700/50"
                style={{ borderColor: 'var(--paper-border)', color: 'var(--ink-muted)' }}
              >
                <ImageIcon size={26} className="mb-1.5 opacity-40" />
                <p className="text-xs font-garamond">
                  Click to tuck photographs into this page
                </p>
                <p className="text-[10px] text-stone-400 font-garamond italic mt-0.5">
                  Supports JPG, PNG, WEBP (up to 10MB each)
                </p>
              </div>
            )}
          </div>
        </div>

        {/* Footer Actions */}
        <div
          className="px-6 py-4 border-t flex flex-wrap items-center justify-between gap-3 shrink-0 select-none z-10"
          style={{ borderColor: 'var(--paper-border)' }}
        >
          <div>
            {entryToEdit && (
              <>
                {showDeleteConfirm ? (
                  <div className="flex items-center gap-2">
                    <span className="text-xs text-red-600 dark:text-red-400 font-garamond">
                      Delete this page forever?
                    </span>
                    <button
                      type="button"
                      onClick={handleDelete}
                      disabled={deleting}
                      className="px-2.5 py-1 text-xs rounded bg-red-600 text-white hover:bg-red-700 transition-colors cursor-pointer"
                    >
                      {deleting ? 'Deleting…' : 'Yes, Delete'}
                    </button>
                    <button
                      type="button"
                      onClick={() => setShowDeleteConfirm(false)}
                      className="px-2 py-1 text-xs text-stone-500 hover:text-stone-800 transition-colors cursor-pointer"
                    >
                      Cancel
                    </button>
                  </div>
                ) : (
                  <button
                    type="button"
                    onClick={() => setShowDeleteConfirm(true)}
                    className="flex items-center gap-1.5 text-xs text-red-600/80 hover:text-red-700 transition-colors cursor-pointer font-garamond uppercase tracking-wider"
                  >
                    <Trash2 size={13} />
                    <span>Delete Entry</span>
                  </button>
                )}
              </>
            )}
          </div>

          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={requestClose}
              className="px-4 py-2 text-xs font-garamond uppercase tracking-wider text-stone-500 hover:text-stone-800 transition-colors cursor-pointer"
            >
              Cancel
            </button>

            <button
              type="button"
              onClick={() => handleSave(true)}
              disabled={saving}
              className="px-4 py-2 text-xs font-garamond uppercase tracking-wider rounded-xl border hover:bg-stone-200/40 dark:hover:bg-stone-800/40 transition-colors cursor-pointer disabled:opacity-50"
              style={{ borderColor: 'var(--paper-border)', color: 'var(--ink-secondary)' }}
            >
              Save as Draft
            </button>

            <button
              type="button"
              onClick={() => handleSave(false)}
              disabled={saving || !content.trim()}
              className="px-6 py-2 text-xs font-garamond uppercase tracking-wider rounded-xl text-white transition-opacity disabled:opacity-50 cursor-pointer shadow-md flex items-center gap-1.5"
              style={{ backgroundColor: 'var(--ink-accent)' }}
            >
              <Save size={13} />
              <span>{saving ? 'Inscribing…' : 'Publish to Diary'}</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
