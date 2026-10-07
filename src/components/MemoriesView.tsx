import React, { useState, useMemo } from 'react';
import {
  Calendar,
  Sparkles,
  ArrowLeft,
  BookOpen,
  Heart,
  Image as ImageIcon,
  Clock,
  ChevronLeft,
  ChevronRight,
  Feather,
} from 'lucide-react';
import { DiaryEntry } from '../types';
import { parseDateSafe, compareEntriesDescending } from '../utils/date';
import { useAuth } from '../context/AuthContext';

interface MemoriesViewProps {
  entries: DiaryEntry[];
  onSelectEntry: (entry: DiaryEntry) => void;
  onGoBack: () => void;
  onOpenArchive: () => void;
  onOpenNewEntry?: () => void;
}

const MONTH_NAMES = [
  'January',
  'February',
  'March',
  'April',
  'May',
  'June',
  'July',
  'August',
  'September',
  'October',
  'November',
  'December',
];

export const MemoriesView: React.FC<MemoriesViewProps> = ({
  entries = [],
  onSelectEntry,
  onGoBack,
  onOpenArchive,
  onOpenNewEntry,
}) => {
  const { isAuthenticated } = useAuth();

  // Current calendar date defaults to today
  const today = useMemo(() => new Date(), []);
  const [selectedMonth, setSelectedMonth] = useState<number>(today.getMonth() + 1);
  const [selectedDay, setSelectedDay] = useState<number>(today.getDate());

  const currentYear = today.getFullYear();
  const selectedMonthName = MONTH_NAMES[selectedMonth - 1] || 'October';

  // Only consider published entries
  const publishedEntries = useMemo(() => {
    return (entries || []).filter((e) => e && !e.isDraft);
  }, [entries]);

  // Find memories on this calendar date from previous years (year < currentYear or different year)
  const memoriesByYear = useMemo(() => {
    // Filter matching month and day
    const matching = publishedEntries.filter((entry) => {
      const parsed = parseDateSafe(entry.date);
      // Check month and day
      const entryMonth = MONTH_NAMES.indexOf(parsed.month) + 1;
      const entryDay = parsed.day;
      const entryYear = parseInt(parsed.year, 10);

      // Only previous years (or earlier entries)
      return (
        entryMonth === selectedMonth &&
        entryDay === selectedDay &&
        (!isNaN(entryYear) ? entryYear < currentYear : true)
      );
    });

    // Sort descending by date
    matching.sort(compareEntriesDescending);

    // Group by Year
    const groups: Record<string, DiaryEntry[]> = {};
    matching.forEach((entry) => {
      const parsed = parseDateSafe(entry.date);
      const year = parsed.year;
      if (!groups[year]) groups[year] = [];
      groups[year].push(entry);
    });

    return groups;
  }, [publishedEntries, selectedMonth, selectedDay, currentYear]);

  const totalMemoriesFound = useMemo(() => {
    return Object.values(memoriesByYear).reduce((acc, list) => acc + list.length, 0);
  }, [memoriesByYear]);

  const isToday =
    selectedMonth === today.getMonth() + 1 && selectedDay === today.getDate();

  return (
    <div
      className="min-h-screen flex flex-col pb-24 transition-colors"
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
          onClick={onGoBack}
          className="flex items-center gap-2 text-xs font-display uppercase tracking-widest hover:opacity-75 transition-opacity cursor-pointer"
          style={{ color: 'var(--ink-accent)' }}
          aria-label="Back to previous view"
        >
          <ArrowLeft size={16} />
          <span>Back</span>
        </button>

        <div className="flex items-center gap-2 sm:gap-3 text-xs font-garamond">
          <button
            onClick={onOpenArchive}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-full border text-stone-500 hover:text-stone-800 dark:hover:text-stone-200 transition-colors cursor-pointer"
            style={{ borderColor: 'var(--paper-border)' }}
          >
            <BookOpen size={13} />
            <span>Full Archive</span>
          </button>

          {isAuthenticated && onOpenNewEntry && (
            <button
              onClick={onOpenNewEntry}
              className="px-3 py-1.5 rounded-full text-xs uppercase tracking-wider text-white shadow-xs transition-transform hover:scale-105 cursor-pointer flex items-center gap-1.5"
              style={{ backgroundColor: 'var(--ink-accent)' }}
            >
              <Feather size={12} />
              <span className="hidden sm:inline">Write</span>
            </button>
          )}
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 max-w-3xl w-full mx-auto p-4 sm:p-8 md:p-12">
        {/* Title & Introduction */}
        <div className="text-center mb-8">
          <div
            className="text-xs uppercase tracking-[0.25em] font-display mb-2 opacity-75 flex items-center justify-center gap-1.5"
            style={{ color: 'var(--ink-accent)' }}
          >
            <Sparkles size={13} />
            <span>On This Day</span>
          </div>

          <h1 className="text-3xl sm:text-5xl font-display font-bold tracking-wider mb-2">
            Memories
          </h1>

          <p className="text-xs sm:text-sm font-garamond italic text-stone-500 max-w-md mx-auto">
            Words and quiet echoes written on this date across the passing years
          </p>

          <div className="flex items-center gap-3 my-4 w-36 mx-auto opacity-50">
            <div className="flex-1 h-px bg-current" />
            <span className="text-xs font-display text-amber-700 dark:text-amber-400">❖</span>
            <div className="flex-1 h-px bg-current" />
          </div>
        </div>

        {/* Date Selector Header Bar */}
        <div
          className="rounded-2xl p-5 border shadow-sm mb-10 paper-texture flex flex-col sm:flex-row items-center justify-between gap-4 text-center sm:text-left"
          style={{
            borderColor: 'var(--paper-border)',
          }}
        >
          <div>
            <div className="text-xs font-garamond uppercase tracking-widest text-stone-400 mb-0.5">
              Reflecting on calendar date
            </div>
            <div className="text-xl sm:text-2xl font-display font-semibold" style={{ color: 'var(--ink-primary)' }}>
              {selectedMonthName} {selectedDay}
            </div>
          </div>

          <div className="flex items-center gap-2">
            {!isToday && (
              <button
                onClick={() => {
                  setSelectedMonth(today.getMonth() + 1);
                  setSelectedDay(today.getDate());
                }}
                className="px-3 py-1.5 text-xs font-garamond uppercase tracking-wider rounded-lg border hover:bg-stone-200/40 dark:hover:bg-stone-800/40 transition-colors cursor-pointer"
                style={{ borderColor: 'var(--paper-border)', color: 'var(--ink-accent)' }}
              >
                Today ({today.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })})
              </button>
            )}

            <span className="text-xs font-garamond text-stone-400">
              {totalMemoriesFound} {totalMemoriesFound === 1 ? 'memory' : 'memories'}
            </span>
          </div>
        </div>

        {/* Memories Grouped by Year */}
        {totalMemoriesFound === 0 ? (
          /* Nostalgic Empty State */
          <div
            className="py-16 px-6 rounded-2xl border text-center paper-texture diary-book-shadow"
            style={{
              borderColor: 'var(--paper-border)',
              backgroundColor: 'var(--paper-page)',
            }}
          >
            <Clock
              size={42}
              className="mx-auto mb-4 opacity-30 text-amber-700 dark:text-amber-400"
            />
            <h2 className="text-xl font-display font-semibold mb-2">
              Silence on {selectedMonthName} {selectedDay}
            </h2>
            <p className="text-sm font-garamond italic text-stone-500 max-w-md mx-auto mb-6 leading-relaxed">
              No journal entries were inscribed on this date in previous years. Some calendar days pass without words, held only in silent remembrance.
            </p>

            <div className="flex flex-wrap items-center justify-center gap-3">
              <button
                onClick={onOpenArchive}
                className="px-5 py-2.5 rounded-xl text-xs font-garamond uppercase tracking-wider text-white shadow-md cursor-pointer flex items-center gap-1.5"
                style={{ backgroundColor: 'var(--ink-accent)' }}
              >
                <BookOpen size={14} />
                <span>Browse Full Archive</span>
              </button>

              <button
                onClick={onGoBack}
                className="px-5 py-2.5 rounded-xl text-xs font-garamond uppercase tracking-wider border cursor-pointer hover:bg-stone-200/40 dark:hover:bg-stone-800/40"
                style={{
                  borderColor: 'var(--paper-border)',
                  color: 'var(--ink-secondary)',
                }}
              >
                Return to Reading
              </button>
            </div>
          </div>
        ) : (
          <div className="space-y-12">
            {Object.entries(memoriesByYear).map(([year, yearEntries]) => (
              <div key={year} className="space-y-4">
                {/* Year Header */}
                <div className="flex items-center gap-4">
                  <span className="text-2xl sm:text-3xl font-display font-bold tracking-widest text-amber-800 dark:text-amber-400">
                    {year}
                  </span>
                  <div
                    className="flex-1 h-px"
                    style={{ backgroundColor: 'var(--paper-border)' }}
                  />
                  <span className="text-xs font-garamond italic text-stone-400">
                    {currentYear - parseInt(year, 10)} {currentYear - parseInt(year, 10) === 1 ? 'year ago' : 'years ago'}
                  </span>
                </div>

                {/* Entry Cards for this year */}
                <div className="space-y-4">
                  {yearEntries.map((entry) => (
                    <article
                      key={entry.id}
                      onClick={() => onSelectEntry(entry)}
                      className="group relative p-5 sm:p-7 rounded-2xl border paper-texture transition-all duration-200 hover:shadow-lg hover:-translate-y-0.5 cursor-pointer diary-book-shadow overflow-hidden"
                      style={{
                        borderColor: 'var(--paper-border)',
                      }}
                    >
                      {/* Book spine simulation on left edge */}
                      <div
                        className="absolute left-0 top-0 bottom-0 w-2.5 pointer-events-none book-gutter-left opacity-60"
                        aria-hidden="true"
                      />

                      {/* Top Header */}
                      <div className="flex items-center justify-between text-xs font-garamond text-stone-400 mb-3 border-b pb-2"
                        style={{ borderColor: 'var(--paper-border)' }}
                      >
                        <div className="flex items-center gap-2">
                          <span
                            className="font-mono px-2 py-0.5 rounded border text-[11px] text-stone-600 dark:text-stone-300"
                            style={{
                              backgroundColor: 'var(--paper-page-alt)',
                              borderColor: 'var(--paper-border)',
                            }}
                          >
                            Page {entry.pageNumber}
                          </span>
                          <span>·</span>
                          <span>{entry.time || 'Night'}</span>
                        </div>

                        <div className="flex items-center gap-3">
                          {entry.mood && (
                            <span className="italic text-stone-500">
                              {entry.mood}
                            </span>
                          )}
                          <span className="flex items-center gap-1 text-rose-500 font-mono">
                            <Heart size={11} className="fill-current" />
                            {entry.loves || 0}
                          </span>
                        </div>
                      </div>

                      {/* Title */}
                      <h2
                        className="text-lg sm:text-xl font-display font-semibold mb-2 group-hover:underline text-balance"
                        style={{ color: 'var(--ink-primary)' }}
                      >
                        {entry.title || 'Inscribed Thoughts'}
                      </h2>

                      {/* Memory excerpt */}
                      <p
                        className="font-bengali text-sm sm:text-base leading-relaxed text-stone-700 dark:text-stone-300 line-clamp-3 select-none mb-4"
                        style={{ lineHeight: 1.85 }}
                      >
                        {entry.content}
                      </p>

                      {/* Attached memories indicator */}
                      <div className="flex items-center justify-between pt-2 text-xs font-garamond text-stone-400">
                        {entry.images && entry.images.length > 0 ? (
                          <span className="flex items-center gap-1 text-amber-800 dark:text-amber-400">
                            <ImageIcon size={12} />
                            <span>{entry.images.length} {entry.images.length === 1 ? 'photograph' : 'photographs'} tucked inside</span>
                          </span>
                        ) : (
                          <span />
                        )}

                        <span
                          className="font-garamond uppercase tracking-wider text-xs flex items-center gap-1 font-semibold group-hover:translate-x-1 transition-transform"
                          style={{ color: 'var(--ink-accent)' }}
                        >
                          <span>Open this page</span>
                          <span>→</span>
                        </span>
                      </div>
                    </article>
                  ))}
                </div>
              </div>
            ))}
          </div>
        )}
      </main>
    </div>
  );
};
