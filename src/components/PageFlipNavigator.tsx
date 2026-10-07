import React, { useEffect } from 'react';
import { ChevronLeft, ChevronRight, Shuffle, Bookmark, Home, Calendar, Sparkles } from 'lucide-react';

interface PageFlipNavigatorProps {
  currentPageIndex: number;
  totalEntries: number;
  onPrev: () => void;
  onNext: () => void;
  onGoToCover: () => void;
  onOpenRandom: () => void;
  onOpenArchive: () => void;
  onOpenMemories: () => void;
  onOpenBookmark: () => void;
  hasBookmark: boolean;
  bookmarkPageNumber: number | null;
}

export const PageFlipNavigator: React.FC<PageFlipNavigatorProps> = ({
  currentPageIndex,
  totalEntries,
  onPrev,
  onNext,
  onGoToCover,
  onOpenRandom,
  onOpenArchive,
  onOpenMemories,
  onOpenBookmark,
  hasBookmark,
  bookmarkPageNumber,
}) => {
  const canGoPrev = currentPageIndex > 0;
  const canGoNext = currentPageIndex < totalEntries - 1;

  return (
    <nav
      aria-label="Diary page navigation"
      className="fixed bottom-4 sm:bottom-6 left-1/2 -translate-x-1/2 z-40 w-auto max-w-[95vw] px-3 sm:px-5 py-2.5 rounded-full border shadow-xl backdrop-blur-md flex items-center gap-1 sm:gap-2.5 transition-all paper-texture diary-book-shadow select-none"
      style={{
        borderColor: 'var(--paper-border)',
        color: 'var(--ink-primary)',
      }}
    >
      {/* Return to Cover */}
      <button
        onClick={onGoToCover}
        className="p-2 rounded-full hover:bg-stone-200/50 dark:hover:bg-stone-800/50 transition-colors cursor-pointer text-stone-500 hover:text-stone-900 dark:hover:text-stone-100"
        title="Close Diary (Return to Cover)"
        aria-label="Return to diary cover"
      >
        <Home size={17} />
      </button>

      <div className="w-px h-5 bg-stone-300 dark:bg-stone-700 mx-0.5" />

      {/* Previous Page */}
      <button
        onClick={onPrev}
        disabled={!canGoPrev}
        className="flex items-center gap-1 px-2.5 sm:px-3 py-1.5 rounded-full text-xs font-garamond uppercase tracking-wider transition-all disabled:opacity-30 disabled:pointer-events-none hover:bg-stone-200/50 dark:hover:bg-stone-800/50 cursor-pointer"
        aria-label="Previous Page (Left Arrow)"
        title="Previous Page (←)"
      >
        <ChevronLeft size={16} />
        <span className="hidden sm:inline">Previous</span>
      </button>

      {/* Page Progress Stamp */}
      <div className="px-2 text-xs font-mono font-medium tracking-wide text-stone-500 whitespace-nowrap letterpress-text">
        {currentPageIndex + 1} / {totalEntries}
      </div>

      {/* Next Page */}
      <button
        onClick={onNext}
        disabled={!canGoNext}
        className="flex items-center gap-1 px-2.5 sm:px-3 py-1.5 rounded-full text-xs font-garamond uppercase tracking-wider transition-all disabled:opacity-30 disabled:pointer-events-none hover:bg-stone-200/50 dark:hover:bg-stone-800/50 cursor-pointer"
        aria-label="Next Page (Right Arrow)"
        title="Next Page (→)"
      >
        <span className="hidden sm:inline">Next</span>
        <ChevronRight size={16} />
      </button>

      <div className="w-px h-5 bg-stone-300 dark:bg-stone-700 mx-0.5" />

      {/* Random Page */}
      <button
        onClick={onOpenRandom}
        className="p-2 rounded-full hover:bg-stone-200/50 dark:hover:bg-stone-800/50 transition-colors cursor-pointer text-stone-500 hover:text-stone-900 dark:hover:text-stone-100"
        title="Open a Random Page (Press R)"
        aria-label="Open a random page"
      >
        <Shuffle size={16} />
      </button>

      {/* Memories (On This Day) */}
      <button
        onClick={onOpenMemories}
        className="p-2 rounded-full hover:bg-stone-200/50 dark:hover:bg-stone-800/50 transition-colors cursor-pointer text-amber-700 dark:text-amber-400"
        title="Memories on this Date (On This Day)"
        aria-label="Memories"
      >
        <Sparkles size={16} />
      </button>

      {/* Archive Index */}
      <button
        onClick={onOpenArchive}
        className="p-2 rounded-full hover:bg-stone-200/50 dark:hover:bg-stone-800/50 transition-colors cursor-pointer text-stone-500 hover:text-stone-900 dark:hover:text-stone-100"
        title="Table of Contents / Archive Index"
        aria-label="Open Table of Contents"
      >
        <Calendar size={16} />
      </button>

      {/* Bookmark */}
      {hasBookmark && (
        <button
          onClick={onOpenBookmark}
          className="p-2 rounded-full transition-colors cursor-pointer text-amber-700 dark:text-amber-400 hover:bg-stone-200/50 dark:hover:bg-stone-800/50"
          title={`Jump to saved Bookmark (Page ${bookmarkPageNumber})`}
          aria-label={`Jump to bookmark page ${bookmarkPageNumber}`}
        >
          <Bookmark size={16} className="fill-current" />
        </button>
      )}
    </nav>
  );
};
