import React, { useState, useMemo } from 'react';
import {
  Search,
  BookOpen,
  Calendar,
  Heart,
  FileText,
  Sparkles,
  ArrowLeft,
  Moon,
  Sun,
  Feather,
  Settings,
  KeyRound,
  Image as ImageIcon,
  Check,
} from 'lucide-react';
import { DiaryEntry, MOOD_OPTIONS } from '../types';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import { parseDateSafe, compareEntriesDescending } from '../utils/date';

interface ArchiveIndexViewProps {
  entries: DiaryEntry[];
  onSelectEntry: (entry: DiaryEntry) => void;
  onGoBack: () => void;
  onGoToCover: () => void;
  onOpenMemories?: () => void;
  onOpenNewEntry?: () => void;
  onOpenSettings?: () => void;
  onOpenLogin?: () => void;
  isModal?: boolean;
  onCloseModal?: () => void;
}

export const ArchiveIndexView: React.FC<ArchiveIndexViewProps> = ({
  entries = [],
  onSelectEntry,
  onGoBack,
  onGoToCover,
  onOpenMemories,
  onOpenNewEntry,
  onOpenSettings,
  onOpenLogin,
  isModal = false,
  onCloseModal,
}) => {
  const { isAuthenticated } = useAuth();
  const { theme, toggleTheme } = useTheme();

  const [searchQuery, setSearchQuery] = useState('');
  const [selectedMood, setSelectedMood] = useState<string>('all');
  const [showDraftsOnly, setShowDraftsOnly] = useState(false);
  const searchInputRef = React.useRef<HTMLInputElement>(null);

  // Focus search input with '/' keyboard shortcut
  React.useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (
        document.activeElement?.tagName === 'INPUT' ||
        document.activeElement?.tagName === 'TEXTAREA'
      ) {
        return;
      }
      if (e.key === '/') {
        e.preventDefault();
        searchInputRef.current?.focus();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  // Safe entries list
  const safeEntries = useMemo(() => {
    return Array.isArray(entries) ? entries : [];
  }, [entries]);

  // Filter entries based on query, mood, and drafts
  const filteredEntries = useMemo(() => {
    return safeEntries.filter((entry) => {
      if (!entry) return false;

      // Draft permissions
      if (entry.isDraft) {
        if (!isAuthenticated) return false; // Never show drafts to public
        if (!showDraftsOnly && selectedMood !== 'all') {
          // If specific mood selected, check mood
        }
      } else if (showDraftsOnly) {
        return false;
      }

      // Mood filter
      if (selectedMood !== 'all') {
        if (!entry.mood || !entry.mood.toLowerCase().includes(selectedMood.toLowerCase())) {
          return false;
        }
      }

      // Search query filter
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase().trim();
        const inTitle = (entry.title || '').toLowerCase().includes(q);
        const inContent = (entry.content || '').toLowerCase().includes(q);
        const inDate = (entry.date || '').toLowerCase().includes(q);
        const inMood = (entry.mood || '').toLowerCase().includes(q);
        const inPage = entry.pageNumber ? `page ${entry.pageNumber}`.includes(q) : false;
        return inTitle || inContent || inDate || inMood || inPage;
      }

      return true;
    });
  }, [safeEntries, searchQuery, selectedMood, showDraftsOnly, isAuthenticated]);

  // Group entries by Year → Month
  const groupedEntries = useMemo(() => {
    // Sort descending (newest first)
    const sorted = [...filteredEntries].sort(compareEntriesDescending);

    const groups: Record<string, Record<string, DiaryEntry[]>> = {};

    sorted.forEach((entry) => {
      const parsed = parseDateSafe(entry.date);
      const year = parsed.year;
      const month = parsed.month;

      if (!groups[year]) groups[year] = {};
      if (!groups[year][month]) groups[year][month] = [];
      groups[year][month].push(entry);
    });

    return groups;
  }, [filteredEntries]);

  const totalPublished = useMemo(() => {
    return safeEntries.filter((e) => !e.isDraft).length;
  }, [safeEntries]);

  const draftCount = useMemo(() => {
    return safeEntries.filter((e) => e.isDraft).length;
  }, [safeEntries]);

  return (
    <div
      className={`min-h-screen flex flex-col transition-colors ${
        isModal ? 'p-0' : 'pb-24'
      }`}
      style={{
        backgroundColor: 'var(--paper-bg)',
        color: 'var(--ink-primary)',
      }}
    >
      {/* Top Header Navigation */}
      <header
        className="sticky top-0 z-30 px-4 sm:px-8 py-3.5 backdrop-blur-md border-b flex items-center justify-between transition-colors paper-texture"
        style={{
          borderColor: 'var(--paper-border)',
        }}
      >
        <button
          onClick={isModal ? onCloseModal : onGoToCover}
          className="flex items-center gap-2 text-xs font-display uppercase tracking-widest hover:opacity-75 transition-opacity cursor-pointer"
          style={{ color: 'var(--ink-accent)' }}
          aria-label="Back to front page"
        >
          <ArrowLeft size={16} />
          <span>{isModal ? 'Close Index' : 'Back to Cover'}</span>
        </button>

        <div className="flex items-center gap-2 sm:gap-3">
          {onOpenMemories && (
            <button
              onClick={onOpenMemories}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-full border text-xs font-garamond text-amber-700 dark:text-amber-400 hover:bg-stone-200/50 dark:hover:bg-stone-800/50 transition-colors cursor-pointer"
              style={{ borderColor: 'var(--paper-border)' }}
              title="Memories on this Date (On This Day)"
            >
              <Sparkles size={12} />
              <span className="hidden sm:inline">Memories</span>
            </button>
          )}

          {isAuthenticated && onOpenNewEntry && (
            <button
              onClick={onOpenNewEntry}
              className="px-3 py-1.5 rounded-full text-xs font-garamond uppercase tracking-wider text-white shadow-xs transition-transform hover:scale-105 cursor-pointer flex items-center gap-1.5"
              style={{ backgroundColor: 'var(--ink-accent)' }}
            >
              <Feather size={12} />
              <span className="hidden sm:inline">Write Page</span>
            </button>
          )}

          {isAuthenticated && onOpenSettings && (
            <button
              onClick={onOpenSettings}
              className="p-2 rounded-full hover:bg-stone-200/50 dark:hover:bg-stone-800/50 transition-colors cursor-pointer text-stone-500 hover:text-stone-800"
              title="Author Settings"
            >
              <Settings size={16} />
            </button>
          )}

          {/* Theme Toggle */}
          <button
            onClick={toggleTheme}
            className="p-2 rounded-full hover:bg-stone-200/50 dark:hover:bg-stone-800/50 transition-colors cursor-pointer text-stone-500 hover:text-stone-800"
            title="Toggle Light/Dark Theme"
            aria-label="Toggle theme"
          >
            {theme === 'light' ? <Moon size={16} /> : <Sun size={16} />}
          </button>

          {!isAuthenticated && onOpenLogin && (
            <button
              onClick={onOpenLogin}
              className="p-2 rounded-full opacity-60 hover:opacity-100 hover:bg-stone-200/50 dark:hover:bg-stone-800/50 transition-colors cursor-pointer text-stone-500 hover:text-stone-800"
              title="Author Sign In"
            >
              <KeyRound size={15} />
            </button>
          )}
        </div>
      </header>

      {/* Main Container */}
      <main className="flex-1 max-w-4xl w-full mx-auto p-4 sm:p-8 md:p-12">
        {/* Title & Decorative Flourish */}
        <div className="text-center mb-8">
          <div
            className="text-xs uppercase tracking-[0.25em] font-display mb-2 opacity-75"
            style={{ color: 'var(--ink-accent)' }}
          >
            Table of Contents
          </div>
          <h1 className="text-3xl sm:text-5xl font-display font-bold tracking-wider mb-2">
            Archive Index
          </h1>
          <p className="text-xs sm:text-sm font-garamond italic text-stone-500 max-w-md mx-auto">
            Chronological records of memories, thoughts, and reflections
          </p>
          <div className="flex items-center gap-3 my-4 w-36 mx-auto opacity-50">
            <div className="flex-1 h-px bg-current" />
            <span className="text-xs font-display text-amber-700 dark:text-amber-400">❖</span>
            <div className="flex-1 h-px bg-current" />
          </div>
        </div>

        {/* Search Bar & Filter Options */}
        <div
          className="rounded-2xl p-4 sm:p-6 border shadow-sm mb-10 paper-texture"
          style={{
            borderColor: 'var(--paper-border)',
          }}
        >
          {/* Search Input */}
          <div className="relative mb-4">
            <Search
              size={17}
              className="absolute left-3.5 top-1/2 -translate-y-1/2 text-stone-400 pointer-events-none"
            />
            <input
              ref={searchInputRef}
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search memories, Bengali words, dates, or page numbers... (Press / to focus)"
              className="w-full pl-10 pr-10 py-2.5 rounded-xl border text-sm font-serif focus:outline-hidden transition-all"
              style={{
                backgroundColor: 'var(--paper-page-alt)',
                borderColor: 'var(--paper-border)',
                color: 'var(--ink-primary)',
              }}
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery('')}
                className="absolute right-3.5 top-1/2 -translate-y-1/2 text-xs text-stone-400 hover:text-stone-700 dark:hover:text-stone-200 cursor-pointer"
                title="Clear search"
              >
                Clear
              </button>
            )}
          </div>

          {/* Filter Pills */}
          <div className="flex flex-wrap items-center justify-between gap-3 text-xs font-garamond">
            <div className="flex items-center gap-1.5 overflow-x-auto pb-1 max-w-full">
              <span className="text-stone-400 uppercase tracking-wider text-[11px] mr-1 shrink-0">
                Filter:
              </span>

              <button
                onClick={() => {
                  setSelectedMood('all');
                  setShowDraftsOnly(false);
                }}
                className={`px-3 py-1 rounded-lg transition-all cursor-pointer border ${
                  selectedMood === 'all' && !showDraftsOnly
                    ? 'font-semibold shadow-xs'
                    : 'opacity-70 hover:opacity-100 border-transparent'
                }`}
                style={{
                  backgroundColor:
                    selectedMood === 'all' && !showDraftsOnly
                      ? 'var(--paper-page-alt)'
                      : 'transparent',
                  borderColor:
                    selectedMood === 'all' && !showDraftsOnly
                      ? 'var(--ink-accent)'
                      : 'transparent',
                  color:
                    selectedMood === 'all' && !showDraftsOnly
                      ? 'var(--ink-accent)'
                      : 'var(--ink-primary)',
                }}
              >
                All Pages ({totalPublished})
              </button>

              {MOOD_OPTIONS.slice(0, 6).map((m) => {
                const isActive = selectedMood === m.label && !showDraftsOnly;
                return (
                  <button
                    key={m.id}
                    onClick={() => {
                      setSelectedMood(m.label);
                      setShowDraftsOnly(false);
                    }}
                    className={`px-3 py-1 rounded-lg transition-all cursor-pointer border whitespace-nowrap flex items-center gap-1.5 ${
                      isActive ? 'font-semibold shadow-xs' : 'opacity-70 hover:opacity-100 border-transparent'
                    }`}
                    style={{
                      backgroundColor: isActive ? 'var(--paper-page-alt)' : 'transparent',
                      borderColor: isActive ? 'var(--ink-accent)' : 'transparent',
                      color: isActive ? 'var(--ink-accent)' : 'var(--ink-primary)',
                    }}
                  >
                    <span>{m.icon}</span>
                    <span>{m.label}</span>
                  </button>
                );
              })}

              {isAuthenticated && draftCount > 0 && (
                <button
                  onClick={() => {
                    setShowDraftsOnly(true);
                    setSelectedMood('all');
                  }}
                  className={`px-3 py-1 rounded-lg transition-all cursor-pointer border flex items-center gap-1.5 ${
                    showDraftsOnly ? 'font-semibold shadow-xs' : 'opacity-75 hover:opacity-100 border-transparent'
                  }`}
                  style={{
                    backgroundColor: showDraftsOnly ? 'var(--paper-page-alt)' : 'transparent',
                    borderColor: showDraftsOnly ? '#d97706' : 'transparent',
                    color: '#d97706',
                  }}
                >
                  <FileText size={12} />
                  <span>Drafts ({draftCount})</span>
                </button>
              )}
            </div>

            <div className="text-stone-400 text-xs">
              Showing {filteredEntries.length}{' '}
              {filteredEntries.length === 1 ? 'entry' : 'entries'}
            </div>
          </div>
        </div>

        {/* Entries Grouped by Year → Month */}
        <div className="space-y-12">
          {Object.keys(groupedEntries).length === 0 ? (
            /* Proper Empty State */
            <div
              className="py-16 px-6 rounded-2xl border text-center paper-texture diary-book-shadow"
              style={{
                borderColor: 'var(--paper-border)',
                backgroundColor: 'var(--paper-page)',
              }}
            >
              <BookOpen
                size={44}
                className="mx-auto mb-4 opacity-30 text-amber-700 dark:text-amber-400"
              />
              <h2 className="text-xl font-display font-semibold mb-2">
                {searchQuery || selectedMood !== 'all' || showDraftsOnly
                  ? 'No Diary Pages Match Your Search'
                  : 'The Archive is Awaiting Its First Words'}
              </h2>
              <p className="text-sm font-garamond italic text-stone-500 max-w-md mx-auto mb-6">
                {searchQuery || selectedMood !== 'all' || showDraftsOnly
                  ? 'Try clearing your search terms or filters to browse all inscribed entries.'
                  : 'There are no published diary pages yet in Ash’s Archive. As memories are recorded, they will appear here in chronological order.'}
              </p>

              <div className="flex flex-wrap items-center justify-center gap-3">
                {searchQuery || selectedMood !== 'all' || showDraftsOnly ? (
                  <button
                    onClick={() => {
                      setSearchQuery('');
                      setSelectedMood('all');
                      setShowDraftsOnly(false);
                    }}
                    className="px-5 py-2.5 rounded-xl text-xs font-garamond uppercase tracking-wider text-white shadow-md cursor-pointer"
                    style={{ backgroundColor: 'var(--ink-accent)' }}
                  >
                    View All Pages
                  </button>
                ) : (
                  isAuthenticated && onOpenNewEntry && (
                    <button
                      onClick={onOpenNewEntry}
                      className="px-5 py-2.5 rounded-xl text-xs font-garamond uppercase tracking-wider text-white shadow-md cursor-pointer flex items-center gap-1.5"
                      style={{ backgroundColor: 'var(--ink-accent)' }}
                    >
                      <Feather size={14} />
                      <span>Write First Page</span>
                    </button>
                  )
                )}

                <button
                  onClick={onGoToCover}
                  className="px-5 py-2.5 rounded-xl text-xs font-garamond uppercase tracking-wider border cursor-pointer hover:bg-stone-200/40 dark:hover:bg-stone-800/40"
                  style={{
                    borderColor: 'var(--paper-border)',
                    color: 'var(--ink-secondary)',
                  }}
                >
                  Return to Front Page
                </button>
              </div>
            </div>
          ) : (
            Object.entries(groupedEntries).map(([year, months]) => (
              <section key={year} aria-labelledby={`year-heading-${year}`} className="space-y-6">
                {/* Year Header */}
                <div className="flex items-center gap-4">
                  <h2
                    id={`year-heading-${year}`}
                    className="text-2xl sm:text-3xl font-display font-bold tracking-widest text-stone-400 dark:text-stone-500"
                  >
                    {year}
                  </h2>
                  <div
                    className="flex-1 h-px"
                    style={{ backgroundColor: 'var(--paper-border)' }}
                  />
                </div>

                {/* Months Under Year */}
                {Object.entries(months).map(([month, monthEntries]) => (
                  <div key={month} className="pl-2 sm:pl-6 space-y-3">
                    <h3
                      className="text-xs uppercase tracking-widest font-semibold font-garamond flex items-center gap-2"
                      style={{ color: 'var(--ink-accent)' }}
                    >
                      <Calendar size={13} />
                      <span>{month}</span>
                    </h3>

                    {/* Entry Cards List */}
                    <div
                      className="space-y-2.5 pl-3 sm:pl-4 border-l-2"
                      style={{ borderColor: 'var(--paper-border)' }}
                    >
                      {monthEntries.map((entry) => {
                        const dateInfo = parseDateSafe(entry.date);
                        return (
                          <div
                            key={entry.id}
                            onClick={() => onSelectEntry(entry)}
                            className="group relative p-3 sm:p-4 rounded-xl border paper-texture transition-all duration-200 hover:shadow-md hover:-translate-y-0.5 cursor-pointer flex flex-col sm:flex-row sm:items-center justify-between gap-2.5"
                            style={{
                              borderColor: 'var(--paper-border)',
                            }}
                          >
                            {/* Left Side: Page Number, Title, Date */}
                            <div className="flex items-baseline gap-3 flex-1 min-w-0">
                              {/* Page Number Badge */}
                              <span
                                className="text-xs font-mono font-semibold tracking-wider px-2 py-0.5 rounded border shrink-0 text-stone-600 dark:text-stone-400"
                                style={{
                                  backgroundColor: 'var(--paper-page-alt)',
                                  borderColor: 'var(--paper-border)',
                                }}
                              >
                                {entry.isDraft ? 'Draft' : `Page ${entry.pageNumber}`}
                              </span>

                              <div className="min-w-0 flex-1">
                                <h4
                                  className="text-base sm:text-lg font-bengali font-medium group-hover:underline truncate"
                                  style={{ color: 'var(--ink-primary)' }}
                                >
                                  {entry.title || entry.content.slice(0, 50) + '...'}
                                </h4>

                                <div className="flex flex-wrap items-center gap-2 mt-0.5 text-xs text-stone-500 font-garamond">
                                  <span>{dateInfo.shortFormatted}</span>
                                  {entry.time && (
                                    <>
                                      <span aria-hidden="true">·</span>
                                      <span>{entry.time}</span>
                                    </>
                                  )}
                                  {entry.images && entry.images.length > 0 && (
                                    <>
                                      <span aria-hidden="true">·</span>
                                      <span className="flex items-center gap-1 text-stone-400">
                                        <ImageIcon size={11} />
                                        <span>
                                          {entry.images.length}{' '}
                                          {entry.images.length === 1 ? 'photo' : 'photos'}
                                        </span>
                                      </span>
                                    </>
                                  )}
                                </div>
                              </div>
                            </div>

                            {/* Right Side: Mood Tag & Love Count */}
                            <div className="flex items-center gap-3 self-end sm:self-auto shrink-0 text-xs font-garamond">
                              {entry.mood && (
                                <span className="text-[11px] px-2 py-0.5 rounded italic text-stone-600 dark:text-stone-400 bg-stone-200/40 dark:bg-stone-800/40">
                                  {entry.mood}
                                </span>
                              )}

                              <div className="flex items-center gap-1 text-rose-500">
                                <Heart size={13} className="fill-current" />
                                <span className="font-mono text-xs">{entry.loves || 0}</span>
                              </div>

                              <span className="text-xs font-garamond uppercase tracking-wider text-stone-400 group-hover:text-stone-800 dark:group-hover:text-stone-200 ml-1">
                                Read →
                              </span>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                ))}
              </section>
            ))
          )}
        </div>

        {/* Bottom Navigation */}
        <div
          className="mt-14 pt-8 border-t flex flex-wrap items-center justify-between gap-4"
          style={{ borderColor: 'var(--paper-border)' }}
        >
          <button
            onClick={isModal ? onCloseModal : onGoToCover}
            className="px-5 py-2.5 rounded-xl text-xs font-garamond uppercase tracking-wider border cursor-pointer hover:bg-stone-200/40 dark:hover:bg-stone-800/40 flex items-center gap-2"
            style={{
              borderColor: 'var(--paper-border)',
              color: 'var(--ink-secondary)',
            }}
          >
            <ArrowLeft size={14} />
            <span>Return to Cover</span>
          </button>

          {totalPublished > 0 && (
            <button
              onClick={() => {
                const firstPublished = safeEntries.find((e) => !e.isDraft);
                if (firstPublished) onSelectEntry(firstPublished);
              }}
              className="px-6 py-2.5 rounded-xl text-xs font-garamond uppercase tracking-wider text-white shadow-md cursor-pointer flex items-center gap-2"
              style={{ backgroundColor: 'var(--ink-accent)' }}
            >
              <BookOpen size={14} />
              <span>Read from Page 1</span>
            </button>
          )}
        </div>
      </main>
    </div>
  );
};
