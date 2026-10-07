import React, { useState } from 'react';
import { Heart, Bookmark, Edit3, Trash2, Calendar, Clock, Smile, ZoomIn, Image as ImageIcon } from 'lucide-react';
import { DiaryEntry, DiaryImage } from '../types';
import { useAuth } from '../context/AuthContext';

interface DiaryPageProps {
  entry: DiaryEntry;
  totalPages: number;
  isBookmarked: boolean;
  onToggleBookmark: (pageNumber: number) => void;
  onImageClick: (image: DiaryImage) => void;
  onEditEntry?: (entry: DiaryEntry) => void;
  onLoveReact: (entryId: string) => Promise<{ loved: boolean; count: number }>;
}

export const DiaryPage: React.FC<DiaryPageProps> = ({
  entry,
  totalPages,
  isBookmarked,
  onToggleBookmark,
  onImageClick,
  onEditEntry,
  onLoveReact,
}) => {
  const { isAuthenticated } = useAuth();
  const [loves, setLoves] = useState(entry.loves || 0);
  const [hasLoved, setHasLoved] = useState(() => {
    const lovedEntries = JSON.parse(localStorage.getItem('ash_archive_loves') || '[]');
    return lovedEntries.includes(entry.id);
  });
  const [animatingHeart, setAnimatingHeart] = useState(false);

  // Sync state if entry changes
  React.useEffect(() => {
    setLoves(entry.loves || 0);
    const lovedEntries = JSON.parse(localStorage.getItem('ash_archive_loves') || '[]');
    setHasLoved(lovedEntries.includes(entry.id));
  }, [entry.id, entry.loves]);

  const handleLoveClick = async () => {
    if (hasLoved) return;

    setAnimatingHeart(true);
    setTimeout(() => setAnimatingHeart(false), 1000);

    // Optimistic update
    setLoves((prev) => prev + 1);
    setHasLoved(true);

    const lovedEntries = JSON.parse(localStorage.getItem('ash_archive_loves') || '[]');
    if (!lovedEntries.includes(entry.id)) {
      lovedEntries.push(entry.id);
      localStorage.setItem('ash_archive_loves', JSON.stringify(lovedEntries));
    }

    try {
      const res = await onLoveReact(entry.id);
      if (res && typeof res.count === 'number') {
        setLoves(res.count);
      }
    } catch (err) {
      console.error('Failed to register love reaction:', err);
    }
  };

  // Format date safely without timezone jump or range error
  const formattedDate = React.useMemo(() => {
    if (!entry.date) return 'Undated';
    // Match YYYY-MM-DD
    const match = entry.date.trim().match(/^(\d{4})-(\d{1,2})-(\d{1,2})/);
    if (match) {
      const y = parseInt(match[1], 10);
      const m = parseInt(match[2], 10) - 1;
      const d = parseInt(match[3], 10);
      const dateObj = new Date(y, m, d, 12, 0, 0);
      return dateObj.toLocaleDateString('en-US', {
        weekday: 'long',
        year: 'numeric',
        month: 'long',
        day: 'numeric',
      });
    }
    try {
      const d = new Date(entry.date);
      if (!isNaN(d.getTime())) {
        return d.toLocaleDateString('en-US', {
          weekday: 'long',
          year: 'numeric',
          month: 'long',
          day: 'numeric',
        });
      }
    } catch {
      // Fallback
    }
    return entry.date;
  }, [entry.date]);

  return (
    <article
      className="relative w-full max-w-3xl mx-auto rounded-2xl p-6 sm:p-12 md:p-16 border diary-book-shadow paper-stack-edges transition-all paper-texture overflow-hidden"
      style={{
        borderColor: 'var(--paper-border)',
        color: 'var(--ink-primary)',
      }}
      aria-label={`Diary Page ${entry.pageNumber}`}
    >
      {/* Book Spine Shadow Effect on Left */}
      <div
        className="absolute left-0 top-0 bottom-0 w-8 pointer-events-none book-gutter-left"
        aria-hidden="true"
      />

      {/* Ribbon Bookmark Sticking Out at Top Right */}
      <div
        onClick={() => onToggleBookmark(entry.pageNumber)}
        className={`absolute -top-3 right-10 z-20 w-7 h-18 cursor-pointer transition-transform hover:translate-y-1 ribbon-bookmark ${
          isBookmarked ? 'opacity-100 shadow-md' : 'opacity-35 hover:opacity-85'
        }`}
        style={{
          clipPath: 'polygon(0 0, 100% 0, 100% 85%, 50% 100%, 0 85%)',
        }}
        title={isBookmarked ? 'Page is bookmarked. Click to remove.' : 'Bookmark this page'}
      />

      {/* Top Page Header: Date, Time & Mood */}
      <header className="border-b pb-4 mb-8 flex flex-wrap items-center justify-between gap-3 text-xs font-garamond"
        style={{ borderColor: 'var(--paper-border)' }}
      >
        <div className="flex items-center gap-3 text-stone-500">
          <span className="flex items-center gap-1.5 font-medium tracking-wide">
            <Calendar size={13} style={{ color: 'var(--ink-accent)' }} />
            {formattedDate}
          </span>
          <span aria-hidden="true">·</span>
          <span className="flex items-center gap-1 text-stone-400">
            <Clock size={12} />
            {entry.time || 'Night'}
          </span>
        </div>

        <div className="flex items-center gap-3">
          {entry.mood && (
            <div className="flex items-center gap-1 text-xs italic text-stone-600 dark:text-stone-400">
              <Smile size={12} className="opacity-70" />
              <span>{entry.mood}</span>
            </div>
          )}

          {entry.isDraft && (
            <span className="px-2 py-0.5 rounded text-[10px] bg-amber-200 dark:bg-amber-900/50 text-amber-800 dark:text-amber-200 font-mono">
              Draft
            </span>
          )}

          {isAuthenticated && onEditEntry && (
            <button
              onClick={() => onEditEntry(entry)}
              className="p-1 rounded text-stone-400 hover:text-stone-800 dark:hover:text-stone-200 transition-colors cursor-pointer"
              title="Edit Page"
              aria-label="Edit this diary entry"
            >
              <Edit3 size={14} />
            </button>
          )}
        </div>
      </header>

      {/* Diary Entry Title */}
      {entry.title ? (
        <h2 className="text-2xl sm:text-3xl font-display font-semibold tracking-wide mb-6 text-balance"
          style={{ color: 'var(--ink-primary)' }}
        >
          {entry.title}
        </h2>
      ) : (
        <div className="text-xs uppercase tracking-widest font-display text-stone-400 mb-6 italic">
          — Inscribed Thoughts —
        </div>
      )}

      {/* Diary Main Content (Bangla & English with graceful typography) */}
      <div className="space-y-4 my-6">
        <div
          className="font-bengali text-base sm:text-lg leading-relaxed whitespace-pre-line tracking-normal select-text"
          style={{
            color: 'var(--ink-primary)',
            lineHeight: 1.95,
          }}
        >
          {entry.content}
        </div>
      </div>

      {/* Attached Memories / Images (Polaroid & Diary Scrapbook aesthetic) */}
      {entry.images && entry.images.length > 0 && (
        <div className="my-10 pt-6 border-t" style={{ borderColor: 'var(--paper-border)' }}>
          <div className="text-xs uppercase tracking-widest font-garamond text-stone-400 mb-4 flex items-center gap-1.5">
            <ImageIcon size={13} /> Attached Memories
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
            {entry.images.map((img) => (
              <figure
                key={img.id}
                onClick={() => onImageClick(img)}
                className="group relative p-2.5 rounded-lg border shadow-sm transition-transform hover:-translate-y-1 hover:shadow-md cursor-pointer overflow-hidden"
                style={{
                  backgroundColor: 'var(--paper-page-alt)',
                  borderColor: 'var(--paper-border)',
                }}
              >
                {/* Photo Corner Ribbon Sim */}
                <div className="relative aspect-4/3 overflow-hidden rounded bg-stone-900/10">
                  <img
                    src={img.url}
                    alt={img.caption || 'Memory in diary'}
                    className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-102"
                    loading="lazy"
                  />
                  <div className="absolute inset-0 bg-black/20 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center text-white">
                    <ZoomIn size={22} className="drop-shadow-md" />
                  </div>
                </div>

                {img.caption && (
                  <figcaption className="mt-2 text-center text-xs font-garamond italic text-stone-600 dark:text-stone-400 px-1 truncate">
                    {img.caption}
                  </figcaption>
                )}
              </figure>
            ))}
          </div>
        </div>
      )}

      {/* Page Footer: Love Reaction, Bookmark Indicator & Page Number */}
      <footer className="mt-12 pt-6 border-t flex items-center justify-between gap-4 select-none"
        style={{ borderColor: 'var(--paper-border)' }}
      >
        {/* Love Reaction */}
        <div className="flex items-center gap-2">
          <button
            onClick={handleLoveClick}
            disabled={hasLoved}
            className={`group flex items-center gap-2 px-3.5 py-1.5 rounded-full border transition-all cursor-pointer ${
              hasLoved
                ? 'bg-rose-500/10 border-rose-500/30 text-rose-600 dark:text-rose-400'
                : 'hover:scale-105 hover:border-rose-400/50 text-stone-500 hover:text-rose-500'
            }`}
            style={{
              borderColor: hasLoved ? undefined : 'var(--paper-border)',
            }}
            title={hasLoved ? 'You loved this entry' : 'Send ♥ Love'}
            aria-label={`Love this entry. Currently ${loves} loves.`}
          >
            <div className="relative">
              <Heart
                size={16}
                className={`transition-transform duration-200 ${
                  hasLoved ? 'fill-current text-rose-500' : 'group-hover:scale-110'
                } ${animatingHeart ? 'scale-130' : ''}`}
              />
              {animatingHeart && (
                <span className="absolute -top-4 -right-1 text-xs text-rose-500 animate-ping">
                  ♥
                </span>
              )}
            </div>
            <span className="text-xs font-garamond tracking-wide font-medium">
              {loves}
            </span>
          </button>
        </div>

        {/* Page Number Stamp & Reading Progress */}
        <div className="text-center font-display text-xs tracking-widest text-stone-400 dark:text-stone-500 letterpress-text select-none">
          — Page {entry.pageNumber} / {totalPages} —
        </div>

        {/* Bookmark Quick Action */}
        <div>
          <button
            onClick={() => onToggleBookmark(entry.pageNumber)}
            className={`flex items-center gap-1.5 text-xs font-garamond uppercase tracking-wider transition-colors cursor-pointer ${
              isBookmarked
                ? 'text-amber-700 dark:text-amber-400 font-semibold'
                : 'text-stone-400 hover:text-stone-700 dark:hover:text-stone-300'
            }`}
            title="Toggle Bookmark"
          >
            <Bookmark size={14} className={isBookmarked ? 'fill-current' : ''} />
            <span className="hidden sm:inline">
              {isBookmarked ? 'Bookmarked' : 'Bookmark'}
            </span>
          </button>
        </div>
      </footer>
    </article>
  );
};
