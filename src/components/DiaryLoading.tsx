import React from 'react';

interface DiaryLoadingProps {
  message?: string;
  submessage?: string;
  compact?: boolean;
}

export const DiaryLoading: React.FC<DiaryLoadingProps> = ({
  message = 'Opening Ash’s Archive…',
  submessage = 'Gathering quiet memories',
  compact = false,
}) => {
  if (compact) {
    return (
      <div className="flex items-center gap-3 py-3 px-4 text-stone-500 font-garamond animate-in fade-in duration-200">
        <div className="relative w-6 h-7 rounded-sm border border-stone-400/50 bg-amber-50/60 dark:bg-stone-900/60 shadow-xs overflow-hidden flex items-center justify-center">
          <div className="absolute left-0 top-0 bottom-0 w-1 bg-amber-900/30 dark:bg-stone-700" />
          <div className="w-3 h-0.5 bg-amber-800/40 dark:bg-amber-400/40 rounded-full animate-pulse" />
        </div>
        <span className="text-xs italic tracking-wide">{message}</span>
      </div>
    );
  }

  return (
    <div
      className="min-h-screen flex flex-col items-center justify-center p-6 text-center select-none animate-in fade-in duration-300"
      style={{
        backgroundColor: 'var(--paper-bg, #fdfbf7)',
        color: 'var(--ink-primary, #2d2823)',
      }}
    >
      {/* Handcrafted Physical Diary Book Loading Animation */}
      <div className="relative w-20 h-24 mb-6 perspective-500">
        {/* Book Base (Back cover & stacked paper pages) */}
        <div
          className="absolute inset-0 rounded-r-md rounded-l-xs border shadow-lg paper-texture flex overflow-hidden"
          style={{
            borderColor: 'var(--paper-border, #e6dfd1)',
            backgroundColor: 'var(--paper-page, #fbf8f1)',
            boxShadow:
              '2px 2px 0 rgba(180, 160, 130, 0.2), 4px 4px 0 rgba(180, 160, 130, 0.15), 0 10px 20px -5px rgba(45, 30, 15, 0.15)',
          }}
        >
          {/* Leather Book Spine */}
          <div
            className="w-2.5 h-full shrink-0 border-r"
            style={{
              backgroundColor: 'var(--cover-leather, #2b1f1d)',
              borderColor: 'var(--gold-foil, #c89d56)',
            }}
          />

          {/* Left Page (Static paper lines) */}
          <div className="flex-1 p-2 flex flex-col justify-around opacity-40">
            <div className="h-0.5 w-full bg-stone-400/40 rounded-full" />
            <div className="h-0.5 w-4/5 bg-stone-400/40 rounded-full" />
            <div className="h-0.5 w-full bg-stone-400/40 rounded-full" />
            <div className="h-0.5 w-3/5 bg-stone-400/40 rounded-full" />
          </div>
        </div>

        {/* Flipping Page Animation */}
        <div
          className="absolute right-0 top-0 bottom-0 w-[calc(100%-10px)] rounded-r-md border border-l-0 paper-texture origin-left animate-page-flip shadow-sm"
          style={{
            borderColor: 'var(--paper-border, #e6dfd1)',
            backgroundColor: 'var(--paper-page-alt, #f6f1e6)',
          }}
        >
          <div className="p-2 h-full flex flex-col justify-around opacity-30">
            <div className="h-0.5 w-full bg-stone-400/40 rounded-full" />
            <div className="h-0.5 w-5/6 bg-stone-400/40 rounded-full" />
            <div className="h-0.5 w-full bg-stone-400/40 rounded-full" />
          </div>
        </div>

        {/* Hanging Silk Ribbon Bookmark */}
        <div
          className="absolute -top-1 right-3 w-1.5 h-6 shadow-sm z-10"
          style={{
            backgroundColor: 'var(--ribbon-color, #8b261e)',
            clipPath: 'polygon(0 0, 100% 0, 100% 85%, 50% 100%, 0 85%)',
          }}
        />
      </div>

      {/* Typography & Subtitle */}
      <h2
        className="text-base font-display font-semibold tracking-widest uppercase mb-1.5 drop-shadow-xs"
        style={{ color: 'var(--ink-accent, #8b3a2b)' }}
      >
        {message}
      </h2>

      {submessage && (
        <p className="text-xs font-garamond italic text-stone-500 tracking-wide">
          {submessage}
        </p>
      )}
    </div>
  );
};
