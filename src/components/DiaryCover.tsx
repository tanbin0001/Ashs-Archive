import React from 'react';
import { BookOpen, Shuffle, Bookmark, Feather, Sparkles, Moon, Sun, KeyRound, Settings, Calendar, Heart } from 'lucide-react';
import { AuthorProfile, DiaryEntry } from '../types';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';

interface DiaryCoverProps {
  author: AuthorProfile | null;
  entries: DiaryEntry[];
  onOpenFirstPage: () => void;
  onOpenRandomPage: () => void;
  onOpenArchive: () => void;
  onOpenBookmark: () => void;
  onOpenEntry: (entry: DiaryEntry) => void;
  bookmarkPageNumber: number | null;
  onOpenLogin: () => void;
  onOpenSettings: () => void;
  onOpenEditor: () => void;
  onThisDayEntries: DiaryEntry[];
}

export const DiaryCover: React.FC<DiaryCoverProps> = ({
  author,
  entries,
  onOpenFirstPage,
  onOpenRandomPage,
  onOpenArchive,
  onOpenBookmark,
  onOpenEntry,
  bookmarkPageNumber,
  onOpenLogin,
  onOpenSettings,
  onOpenEditor,
  onThisDayEntries,
}) => {
  const { isAuthenticated } = useAuth();
  const { theme, toggleTheme } = useTheme();

  // Format last written date/time
  const formattedLastWritten = React.useMemo(() => {
    if (!author?.lastWritten) return null;
    try {
      const d = new Date(author.lastWritten);
      if (isNaN(d.getTime())) return null;
      return d.toLocaleDateString(undefined, {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
      });
    } catch {
      return null;
    }
  }, [author?.lastWritten]);

  const authorName = author?.name || 'Ash';
  const authorBio = author?.bio || '';
  const authorAvatar = author?.avatarUrl;
  const authorQuote = author?.coverQuote || `খুব গভীর ধ্যানে মগ্ন ছিলাম,
তাই আর বাস্তবতায় ফিরতে পারি নি
শেষে...`;

  return (
    <div className="relative min-h-screen flex flex-col items-center justify-center p-4 sm:p-8 select-none">
      {/* Top Floating Controls */}
      <div className="fixed top-5 right-5 z-40 flex items-center gap-3">
        {/* Light/Dark Toggle */}
        <button
          onClick={toggleTheme}
          className="p-2.5 rounded-full backdrop-blur-md border shadow-md transition-all cursor-pointer hover:scale-105"
          style={{
            backgroundColor: 'var(--paper-page)',
            borderColor: 'var(--paper-border)',
            color: 'var(--ink-secondary)',
          }}
          title={theme === 'light' ? 'Switch to Dark Mode' : 'Switch to Light Mode'}
          aria-label="Toggle theme"
        >
          {theme === 'light' ? <Moon size={18} /> : <Sun size={18} />}
        </button>

        {/* Author Settings / Login */}
        {isAuthenticated ? (
          <div className="flex items-center gap-2">
            <button
              onClick={onOpenEditor}
              className="px-3.5 py-1.5 rounded-full text-xs font-garamond uppercase tracking-wider text-white shadow-md transition-all hover:scale-105 cursor-pointer flex items-center gap-1.5"
              style={{ backgroundColor: 'var(--ink-accent)' }}
            >
              <Feather size={13} />
              <span className="hidden sm:inline">Write</span>
            </button>
            <button
              onClick={onOpenSettings}
              className="p-2.5 rounded-full backdrop-blur-md border shadow-md transition-all cursor-pointer hover:scale-105"
              style={{
                backgroundColor: 'var(--paper-page)',
                borderColor: 'var(--paper-border)',
                color: 'var(--ink-accent)',
              }}
              title="Author Settings"
              aria-label="Author Settings"
            >
              <Settings size={18} />
            </button>
          </div>
        ) : (
          <button
            onClick={onOpenLogin}
            className="p-2.5 rounded-full backdrop-blur-md border shadow-md transition-all cursor-pointer hover:scale-105 opacity-80 hover:opacity-100"
            style={{
              backgroundColor: 'var(--paper-page)',
              borderColor: 'var(--paper-border)',
              color: 'var(--ink-muted)',
            }}
            title="Author Sign In"
            aria-label="Author Sign In"
          >
            <KeyRound size={17} />
          </button>
        )}
      </div>

      {/* The Physical Diary Book (Vintage Cloth/Leather Bound Aesthetic) */}
      <div className="relative w-full max-w-2xl my-8">
        {/* Bookmark Ribbon Hanging from Top */}
        <div
          onClick={bookmarkPageNumber ? onOpenBookmark : undefined}
          className={`absolute -top-6 right-16 z-30 w-8 h-20 shadow-lg cursor-pointer transition-transform hover:translate-y-1 ${
            bookmarkPageNumber ? 'opacity-100' : 'opacity-70'
          }`}
          style={{
            backgroundColor: 'var(--ribbon-color)',
            clipPath: 'polygon(0 0, 100% 0, 100% 85%, 50% 100%, 0 85%)',
          }}
          title={
            bookmarkPageNumber
              ? `Saved Bookmark: Page ${bookmarkPageNumber}. Click to resume.`
              : 'Diary Bookmark Ribbon'
          }
        >
          {bookmarkPageNumber && (
            <div className="text-[9px] text-white font-mono font-bold text-center pt-2 rotate-90 whitespace-nowrap">
              P.{bookmarkPageNumber}
            </div>
          )}
        </div>

        {/* Outer Cover Container with Rich Border & Realistic Shadow */}
        <div
          className="relative rounded-2xl p-8 sm:p-14 border diary-book-shadow transition-all paper-texture overflow-hidden"
          style={{
            borderColor: 'var(--paper-border)',
          }}
        >
          {/* Subtle Vintage Gold Inset Border Line */}
          <div
            className="absolute inset-4 rounded-xl pointer-events-none border border-dashed opacity-40"
            style={{ borderColor: 'var(--gold-foil)' }}
          />

          {/* Book Spine Simulation on Left Edge */}
          <div
            className="absolute left-0 top-0 bottom-0 w-5 pointer-events-none opacity-50"
            style={{
              background:
                'linear-gradient(to right, rgba(0,0,0,0.18) 0%, rgba(0,0,0,0.06) 40%, transparent 100%)',
            }}
          />

          {/* Header Flourish */}
          <div className="flex flex-col items-center text-center mb-8 relative z-10">
            <div
              className="text-xs uppercase tracking-[0.3em] font-display mb-3 opacity-75"
              style={{ color: 'var(--ink-accent)' }}
            >
              Private Memoir & Journal
            </div>

            {/* Diary Title */}
            <h1
              className="text-4xl sm:text-6xl font-display font-bold tracking-wider mb-2 text-balance drop-shadow-xs"
              style={{ color: 'var(--ink-primary)' }}
            >
              Ash’s Archive
            </h1>

            <div className="flex items-center gap-3 my-4 w-48 mx-auto opacity-60">
              <div className="flex-1 h-px bg-current" />
              <span className="text-sm font-display tracking-widest text-amber-700 dark:text-amber-400">❖</span>
              <div className="flex-1 h-px bg-current" />
            </div>

            {/* The Inscribed Bengali Quote */}
            <div className="my-6 max-w-lg mx-auto px-4 py-4 rounded-xl border border-dashed backdrop-blur-xs relative"
              style={{
                borderColor: 'var(--paper-border)',
                backgroundColor: 'rgba(255, 255, 255, 0.03)',
              }}
            >
              <blockquote className="font-bengali text-lg sm:text-xl font-medium leading-loose text-center whitespace-pre-line tracking-wide"
                style={{ color: 'var(--ink-primary)' }}
              >
                {authorQuote}
              </blockquote>
            </div>

            {/* Author Profile Information (Editable by Author, not hardcoded!) */}
            <div className="mt-4 flex flex-col items-center">
              <div className="flex items-center gap-3 mb-2">
                {authorAvatar ? (
                  <img
                    src={authorAvatar}
                    alt={authorName}
                    className="w-12 h-12 rounded-full object-cover border-2 shadow-sm"
                    style={{ borderColor: 'var(--gold-foil)' }}
                  />
                ) : (
                  <div
                    className="w-12 h-12 rounded-full flex items-center justify-center border font-display font-bold"
                    style={{
                      borderColor: 'var(--gold-foil)',
                      backgroundColor: 'var(--paper-page-alt)',
                      color: 'var(--ink-accent)',
                    }}
                  >
                    {authorName.charAt(0)}
                  </div>
                )}

                <div className="text-left">
                  <div className="font-display font-semibold text-base flex items-center gap-1.5"
                    style={{ color: 'var(--ink-primary)' }}
                  >
                    <span>{authorName}</span>
                    {isAuthenticated && (
                      <button
                        onClick={onOpenSettings}
                        className="text-[11px] underline opacity-70 hover:opacity-100 font-garamond"
                        title="Edit Author Details"
                      >
                        (Edit)
                      </button>
                    )}
                  </div>
                  {author?.authorTitle && (
                    <div className="text-xs font-garamond italic text-stone-500">
                      {author.authorTitle}
                    </div>
                  )}
                </div>
              </div>

              {authorBio && (
                <p className="max-w-md text-xs sm:text-sm font-garamond italic text-stone-600 dark:text-stone-400 text-center leading-relaxed px-4">
                  “{authorBio}”
                </p>
              )}
            </div>
          </div>

          {/* "On This Day" Highlight Card (if matching previous year entry exists) */}
          {onThisDayEntries.length > 0 && (
            <div
              onClick={() => onOpenEntry(onThisDayEntries[0])}
              className="my-6 p-4 rounded-xl border border-amber-800/30 bg-amber-500/5 hover:bg-amber-500/10 transition-all cursor-pointer group shadow-xs relative z-10"
            >
              <div className="flex items-center justify-between text-xs font-garamond mb-1">
                <span className="uppercase tracking-widest font-semibold text-amber-700 dark:text-amber-400 flex items-center gap-1.5">
                  <Sparkles size={13} /> On This Day Memory
                </span>
                <span className="text-stone-400 group-hover:underline">
                  Page {onThisDayEntries[0].pageNumber} →
                </span>
              </div>
              <p className="text-sm font-bengali font-medium truncate" style={{ color: 'var(--ink-primary)' }}>
                {onThisDayEntries[0].title || onThisDayEntries[0].content.slice(0, 45)}
              </p>
              <p className="text-xs font-garamond italic text-stone-500 mt-1">
                {new Date(onThisDayEntries[0].date).toLocaleDateString(undefined, {
                  month: 'long',
                  day: 'numeric',
                  year: 'numeric',
                })}{' '}
                · Written in a previous year
              </p>
            </div>
          )}

          {/* Action Navigation Buttons */}
          <div className="mt-8 flex flex-col sm:flex-row items-center justify-center gap-3 relative z-10">
            <button
              onClick={onOpenFirstPage}
              className="w-full sm:w-auto px-7 py-3 rounded-xl text-xs font-garamond uppercase tracking-widest text-white transition-all hover:scale-105 cursor-pointer shadow-md flex items-center justify-center gap-2"
              style={{ backgroundColor: 'var(--ink-accent)' }}
            >
              <BookOpen size={15} />
              <span>Open Diary</span>
            </button>

            {bookmarkPageNumber && (
              <button
                onClick={onOpenBookmark}
                className="w-full sm:w-auto px-6 py-3 rounded-xl text-xs font-garamond uppercase tracking-widest border transition-all hover:scale-105 cursor-pointer flex items-center justify-center gap-2"
                style={{
                  backgroundColor: 'var(--paper-page-alt)',
                  borderColor: 'var(--ribbon-color)',
                  color: 'var(--ribbon-color)',
                }}
              >
                <Bookmark size={15} />
                <span>Resume (Page {bookmarkPageNumber})</span>
              </button>
            )}

            <button
              onClick={onOpenRandomPage}
              className="w-full sm:w-auto px-6 py-3 rounded-xl text-xs font-garamond uppercase tracking-widest border transition-all hover:scale-105 cursor-pointer flex items-center justify-center gap-2"
              style={{
                backgroundColor: 'var(--paper-page-alt)',
                borderColor: 'var(--paper-border)',
                color: 'var(--ink-primary)',
              }}
            >
              <Shuffle size={14} />
              <span>Random Page</span>
            </button>

            <button
              onClick={onOpenArchive}
              className="w-full sm:w-auto px-6 py-3 rounded-xl text-xs font-garamond uppercase tracking-widest border transition-all hover:scale-105 cursor-pointer flex items-center justify-center gap-2"
              style={{
                backgroundColor: 'var(--paper-page-alt)',
                borderColor: 'var(--paper-border)',
                color: 'var(--ink-secondary)',
              }}
            >
              <Calendar size={14} />
              <span>Index ({(entries || []).filter((e) => !e?.isDraft).length})</span>
            </button>
          </div>

          {/* Last Written Timestamp (Subtle) */}
          <div className="mt-10 pt-4 border-t text-center text-xs text-stone-500 font-garamond italic relative z-10"
            style={{ borderColor: 'var(--paper-border)' }}
          >
            {formattedLastWritten ? (
              <span>Last written: {formattedLastWritten}</span>
            ) : (
              <span>Ash’s Personal Living Archive</span>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
