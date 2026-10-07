import React, { useState, useEffect, useRef, useCallback } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { DiaryEntry, DiaryImage, ViewMode } from './types';
import { DiaryCover } from './components/DiaryCover';
import { DiaryPage } from './components/DiaryPage';
import { PageFlipNavigator } from './components/PageFlipNavigator';
import { ArchiveIndexView } from './components/ArchiveIndexView';
import { MemoriesView } from './components/MemoriesView';
import { EntryEditorModal } from './components/EntryEditorModal';
import { AuthorSettingsModal } from './components/AuthorSettingsModal';
import { AuthorLoginModal } from './components/AuthorLoginModal';
import { ImageLightbox } from './components/ImageLightbox';
import { DiaryLoading } from './components/DiaryLoading';
import { ErrorBoundary } from './components/ErrorBoundary';
import { ThemeProvider, useTheme } from './context/ThemeContext';
import { AuthProvider, useAuth } from './context/AuthContext';
import {
  Moon,
  Sun,
  Feather,
  Settings,
  BookOpen,
  KeyRound,
  ArrowLeft,
  RefreshCw,
  AlertCircle,
  Sparkles,
} from 'lucide-react';

function DiaryApp() {
  const { author, isAuthenticated, refreshProfile } = useAuth();
  const { theme, toggleTheme } = useTheme();

  // State
  const [entries, setEntries] = useState<DiaryEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // View state: 'cover' | 'archive' | 'memories' | 'page'
  const [viewMode, setViewMode] = useState<ViewMode>('cover');
  const [previousViewMode, setPreviousViewMode] = useState<ViewMode>('cover');
  const [currentIndex, setCurrentIndex] = useState(0);
  const [flipDirection, setFlipDirection] = useState<'next' | 'prev' | 'jump'>('next');

  // Bookmark state (persisted in localStorage)
  const [bookmarkPage, setBookmarkPage] = useState<number | null>(() => {
    try {
      const saved = localStorage.getItem('ash_archive_bookmark');
      return saved ? parseInt(saved, 10) : null;
    } catch {
      return null;
    }
  });

  // "On This Day" entries for cover highlight
  const [onThisDayEntries, setOnThisDayEntries] = useState<DiaryEntry[]>([]);

  // Modals state
  const [isEditorOpen, setIsEditorOpen] = useState(false);
  const [entryToEdit, setEntryToEdit] = useState<DiaryEntry | null>(null);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [isLoginOpen, setIsLoginOpen] = useState(false);
  const [lightboxImage, setLightboxImage] = useState<DiaryImage | null>(null);

  // Touch gesture state for mobile page flipping
  const touchStartX = useRef<number | null>(null);
  const touchStartY = useRef<number | null>(null);

  // Load entries from API
  const loadEntries = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const token = localStorage.getItem('ash_archive_auth_token');
      const headers: Record<string, string> = {};
      if (token) {
        headers['Authorization'] = `Bearer ${token}`;
      }

      const res = await fetch('/api/entries', { headers });
      if (!res.ok) {
        throw new Error('Failed to load archive entries');
      }
      const data = await res.json();
      if (Array.isArray(data)) {
        setEntries(data);
      } else {
        setEntries([]);
      }

      // Check on this day memories
      try {
        const onThisDayRes = await fetch('/api/on-this-day');
        if (onThisDayRes.ok) {
          const onThisDayData = await onThisDayRes.json();
          if (Array.isArray(onThisDayData)) {
            setOnThisDayEntries(onThisDayData);
          }
        }
      } catch (e) {
        console.warn('Failed to load on-this-day memories', e);
      }
    } catch (err) {
      console.error('Error fetching entries:', err);
      setError('Could not connect to Ash’s Archive. Please check your network connection.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadEntries();
  }, [loadEntries, isAuthenticated]);

  // Turn page navigation
  const handlePrevPage = useCallback(() => {
    if (currentIndex > 0) {
      setFlipDirection('prev');
      setCurrentIndex((prev) => prev - 1);
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  }, [currentIndex]);

  const handleNextPage = useCallback(() => {
    if (currentIndex < entries.length - 1) {
      setFlipDirection('next');
      setCurrentIndex((prev) => prev + 1);
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  }, [currentIndex, entries.length]);

  const handleGoToCover = useCallback(() => {
    setPreviousViewMode(viewMode);
    setViewMode('cover');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }, [viewMode]);

  const handleOpenFirstPage = () => {
    if (entries.length > 0) {
      setCurrentIndex(0);
      setPreviousViewMode('cover');
      setViewMode('page');
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  };

  const handleOpenRandomPage = useCallback(() => {
    const published = entries.filter((e) => !e.isDraft);
    const pool = published.length > 0 ? published : entries;
    if (pool.length === 0) return;

    let randomEntry = pool[Math.floor(Math.random() * pool.length)];
    if (pool.length > 1 && randomEntry.id === entries[currentIndex]?.id && viewMode === 'page') {
      const altPool = pool.filter((e) => e.id !== randomEntry.id);
      randomEntry = altPool[Math.floor(Math.random() * altPool.length)];
    }

    const targetIdx = entries.findIndex((e) => e.id === randomEntry.id);
    if (targetIdx !== -1) {
      setFlipDirection('jump');
      setCurrentIndex(targetIdx);
      setPreviousViewMode(viewMode);
      setViewMode('page');
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  }, [entries, currentIndex, viewMode]);

  const handleOpenBookmark = () => {
    if (!bookmarkPage) return;
    const foundIdx = entries.findIndex((e) => e.pageNumber === bookmarkPage);
    if (foundIdx !== -1) {
      setFlipDirection('jump');
      setCurrentIndex(foundIdx);
      setPreviousViewMode('cover');
      setViewMode('page');
      window.scrollTo({ top: 0, behavior: 'smooth' });
    } else {
      handleOpenFirstPage();
    }
  };

  // Open Index / Archive View
  const handleOpenArchive = useCallback(() => {
    setPreviousViewMode(viewMode);
    setViewMode('archive');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }, [viewMode]);

  // Open Memories View
  const handleOpenMemories = useCallback(() => {
    setPreviousViewMode(viewMode);
    setViewMode('memories');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }, [viewMode]);

  // Back button handler from Diary Reader Page
  const handleBackFromPage = useCallback(() => {
    if (previousViewMode === 'memories') {
      setViewMode('memories');
    } else if (previousViewMode === 'archive') {
      setViewMode('archive');
    } else {
      setViewMode('cover');
    }
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }, [previousViewMode]);

  // Back button handler from Memories View
  const handleBackFromMemories = useCallback(() => {
    if (previousViewMode === 'page') {
      setViewMode('page');
    } else if (previousViewMode === 'archive') {
      setViewMode('archive');
    } else {
      setViewMode('cover');
    }
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }, [previousViewMode]);

  // Select an entry from Index or Memories
  const handleSelectEntryFromNav = (entry: DiaryEntry, source: ViewMode) => {
    const idx = entries.findIndex((e) => e.id === entry.id);
    if (idx !== -1) {
      setFlipDirection('jump');
      setCurrentIndex(idx);
      setPreviousViewMode(source);
      setViewMode('page');
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  };

  // Keyboard Shortcuts (Item 5)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Do not trigger while typing in any input, textarea, or contentEditable
      const target = document.activeElement;
      if (
        target?.tagName === 'INPUT' ||
        target?.tagName === 'TEXTAREA' ||
        target?.getAttribute('contenteditable') === 'true'
      ) {
        return;
      }

      // If a modal is open, Esc closes the modal
      if (isEditorOpen || isSettingsOpen || isLoginOpen || lightboxImage) {
        if (e.key === 'Escape') {
          setIsEditorOpen(false);
          setIsSettingsOpen(false);
          setIsLoginOpen(false);
          setLightboxImage(null);
        }
        return;
      }

      // ← Previous diary page
      if (e.key === 'ArrowLeft') {
        if (viewMode === 'page') {
          e.preventDefault();
          handlePrevPage();
        }
      }
      // → Next diary page
      else if (e.key === 'ArrowRight') {
        if (viewMode === 'page') {
          e.preventDefault();
          handleNextPage();
        }
      }
      // Esc Return to previous/archive view
      else if (e.key === 'Escape') {
        e.preventDefault();
        if (viewMode === 'page') {
          handleBackFromPage();
        } else if (viewMode === 'memories') {
          handleBackFromMemories();
        } else if (viewMode === 'archive') {
          setViewMode('cover');
        }
      }
      // R Open a random published page
      else if (e.key === 'r' || e.key === 'R') {
        e.preventDefault();
        handleOpenRandomPage();
      }
      // / Focus search (opens Archive index with search focus)
      else if (e.key === '/') {
        if (viewMode !== 'archive') {
          e.preventDefault();
          setPreviousViewMode(viewMode);
          setViewMode('archive');
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [
    viewMode,
    isEditorOpen,
    isSettingsOpen,
    isLoginOpen,
    lightboxImage,
    handlePrevPage,
    handleNextPage,
    handleBackFromPage,
    handleBackFromMemories,
    handleOpenRandomPage,
  ]);

  const handleToggleBookmark = (pageNumber: number) => {
    try {
      if (bookmarkPage === pageNumber) {
        setBookmarkPage(null);
        localStorage.removeItem('ash_archive_bookmark');
      } else {
        setBookmarkPage(pageNumber);
        localStorage.setItem('ash_archive_bookmark', pageNumber.toString());
      }
    } catch (e) {
      console.warn('Failed to update bookmark in localStorage', e);
    }
  };

  // Love reaction handler
  const handleLoveReact = async (entryId: string) => {
    try {
      const res = await fetch(`/api/entries/${entryId}/love`, {
        method: 'POST',
      });
      const data = await res.json();
      return {
        loved: Boolean(data.loved),
        count: typeof data.loves === 'number' ? data.loves : 0,
      };
    } catch (err) {
      console.error('Failed to register love reaction:', err);
      return { loved: false, count: 0 };
    }
  };

  // Touch gesture handlers for mobile swipe
  const handleTouchStart = (e: React.TouchEvent) => {
    touchStartX.current = e.touches[0].clientX;
    touchStartY.current = e.touches[0].clientY;
  };

  const handleTouchEnd = (e: React.TouchEvent) => {
    if (touchStartX.current === null || touchStartY.current === null) return;
    const deltaX = e.changedTouches[0].clientX - touchStartX.current;
    const deltaY = e.changedTouches[0].clientY - touchStartY.current;

    // Trigger if horizontal swipe is prominent
    if (Math.abs(deltaX) > 60 && Math.abs(deltaX) > Math.abs(deltaY) * 1.5) {
      if (deltaX < 0) {
        handleNextPage();
      } else {
        handlePrevPage();
      }
    }

    touchStartX.current = null;
    touchStartY.current = null;
  };

  // Callback when entry is saved by author
  const handleEntrySaved = (saved: DiaryEntry) => {
    loadEntries();
    refreshProfile();
    if (!saved.isDraft) {
      setViewMode('page');
    }
  };

  const handleEntryDeleted = (deletedId: string) => {
    setEntries((prev) => prev.filter((e) => e.id !== deletedId));
    if (currentIndex >= entries.length - 1 && currentIndex > 0) {
      setCurrentIndex((prev) => prev - 1);
    }
    loadEntries();
    refreshProfile();
  };

  // Animation variants for realistic paper turn
  const pageVariants = {
    initial: (dir: 'next' | 'prev' | 'jump') => ({
      rotateY: dir === 'next' ? 25 : dir === 'prev' ? -25 : 0,
      opacity: 0,
      transformOrigin: dir === 'next' ? 'left center' : 'right center',
      scale: 0.98,
    }),
    animate: {
      rotateY: 0,
      opacity: 1,
      scale: 1,
      transition: {
        duration: 0.45,
        ease: [0.25, 1, 0.5, 1] as const,
      },
    },
    exit: (dir: 'next' | 'prev' | 'jump') => ({
      rotateY: dir === 'next' ? -20 : dir === 'prev' ? 20 : 0,
      opacity: 0,
      scale: 0.98,
      transition: {
        duration: 0.35,
        ease: [0.25, 1, 0.5, 1] as const,
      },
    }),
  };

  const currentEntry = entries[currentIndex];

  // Beautiful Custom Loading Experience (Item 7)
  if (loading && entries.length === 0) {
    return <DiaryLoading message="Opening Ash’s Archive…" submessage="Gathering quiet memories" />;
  }

  // Graceful Error State
  if (error && entries.length === 0) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center p-6 text-center">
        <div className="max-w-md p-8 rounded-2xl border diary-book-shadow paper-texture">
          <AlertCircle size={32} className="mx-auto text-amber-700 mb-3" />
          <h2 className="text-xl font-display font-semibold mb-2">Unable to Open Journal</h2>
          <p className="text-sm font-garamond text-stone-500 mb-6">{error}</p>
          <button
            onClick={() => loadEntries()}
            className="px-6 py-2.5 rounded-xl text-xs font-garamond uppercase tracking-wider text-white shadow-md cursor-pointer flex items-center gap-2 mx-auto"
            style={{ backgroundColor: 'var(--ink-accent)' }}
          >
            <RefreshCw size={14} />
            <span>Retry Connection</span>
          </button>
        </div>
      </div>
    );
  }

  return (
    <div
      className="min-h-screen flex flex-col transition-colors selection:bg-amber-200 selection:text-amber-950 dark:selection:bg-amber-900/60 dark:selection:text-amber-100"
      onTouchStart={viewMode === 'page' ? handleTouchStart : undefined}
      onTouchEnd={viewMode === 'page' ? handleTouchEnd : undefined}
    >
      <ErrorBoundary onReset={() => setViewMode('cover')}>
        {viewMode === 'cover' ? (
          /* --- VIEW 1: FRONT PAGE COVER --- */
          <DiaryCover
            author={author}
            entries={entries}
            onOpenFirstPage={handleOpenFirstPage}
            onOpenRandomPage={handleOpenRandomPage}
            onOpenArchive={handleOpenArchive}
            onOpenBookmark={handleOpenBookmark}
            onOpenEntry={(entry) => handleSelectEntryFromNav(entry, 'cover')}
            bookmarkPageNumber={bookmarkPage}
            onOpenLogin={() => setIsLoginOpen(true)}
            onOpenSettings={() => setIsSettingsOpen(true)}
            onOpenEditor={() => {
              setEntryToEdit(null);
              setIsEditorOpen(true);
            }}
            onThisDayEntries={onThisDayEntries}
          />
        ) : viewMode === 'archive' ? (
          /* --- VIEW 2: ARCHIVE / INDEX PAGE --- */
          <ArchiveIndexView
            entries={entries}
            onSelectEntry={(entry) => handleSelectEntryFromNav(entry, 'archive')}
            onGoBack={() => setViewMode('cover')}
            onGoToCover={handleGoToCover}
            onOpenMemories={handleOpenMemories}
            onOpenNewEntry={
              isAuthenticated
                ? () => {
                    setEntryToEdit(null);
                    setIsEditorOpen(true);
                  }
                : undefined
            }
            onOpenSettings={() => setIsSettingsOpen(true)}
            onOpenLogin={() => setIsLoginOpen(true)}
          />
        ) : viewMode === 'memories' ? (
          /* --- VIEW 3: MEMORIES PAGE (ITEM 2) --- */
          <MemoriesView
            entries={entries}
            onSelectEntry={(entry) => handleSelectEntryFromNav(entry, 'memories')}
            onGoBack={handleBackFromMemories}
            onOpenArchive={handleOpenArchive}
            onOpenNewEntry={
              isAuthenticated
                ? () => {
                    setEntryToEdit(null);
                    setIsEditorOpen(true);
                  }
                : undefined
            }
          />
        ) : (
          /* --- VIEW 4: DIARY READER PAGE --- */
          <div className="relative min-h-screen flex flex-col pb-28">
            {/* Top Sticky Header for Reader Mode */}
            <header
              className="sticky top-0 z-30 px-4 sm:px-8 py-3.5 backdrop-blur-md border-b flex items-center justify-between transition-colors paper-texture"
              style={{
                borderColor: 'var(--paper-border)',
              }}
            >
              <button
                onClick={handleBackFromPage}
                className="flex items-center gap-2 text-xs font-display uppercase tracking-widest hover:opacity-75 transition-opacity cursor-pointer"
                style={{ color: 'var(--ink-accent)' }}
                aria-label={
                  previousViewMode === 'memories'
                    ? 'Back to Memories'
                    : previousViewMode === 'archive'
                    ? 'Back to Index'
                    : 'Back to Cover'
                }
              >
                <ArrowLeft size={16} />
                <span>
                  {previousViewMode === 'memories'
                    ? 'Memories'
                    : previousViewMode === 'archive'
                    ? 'Index'
                    : 'Ash’s Archive'}
                </span>
              </button>

              <div className="flex items-center gap-2 sm:gap-3">
                {/* Memories Option in Navigation */}
                <button
                  onClick={handleOpenMemories}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-full border text-xs font-garamond text-amber-700 dark:text-amber-400 hover:bg-stone-200/50 dark:hover:bg-stone-800/50 transition-colors cursor-pointer"
                  style={{ borderColor: 'var(--paper-border)' }}
                  title="Memories on this Date (On This Day)"
                  aria-label="Memories"
                >
                  <Sparkles size={13} />
                  <span className="hidden sm:inline">Memories</span>
                </button>

                {/* Archive Index Button */}
                <button
                  onClick={handleOpenArchive}
                  className="p-2 rounded-full hover:bg-stone-200/50 dark:hover:bg-stone-800/50 transition-colors cursor-pointer text-stone-500 hover:text-stone-800"
                  title="Table of Contents / Archive Index"
                  aria-label="Table of Contents"
                >
                  <BookOpen size={16} />
                </button>

                {/* Author Actions */}
                {isAuthenticated && (
                  <>
                    <button
                      onClick={() => {
                        setEntryToEdit(null);
                        setIsEditorOpen(true);
                      }}
                      className="px-3 py-1.5 rounded-full text-xs font-garamond uppercase tracking-wider text-white shadow-xs transition-transform hover:scale-105 cursor-pointer flex items-center gap-1.5"
                      style={{ backgroundColor: 'var(--ink-accent)' }}
                    >
                      <Feather size={12} />
                      <span className="hidden sm:inline">New Page</span>
                    </button>
                    <button
                      onClick={() => setIsSettingsOpen(true)}
                      className="p-2 rounded-full hover:bg-stone-200/50 dark:hover:bg-stone-800/50 transition-colors cursor-pointer text-stone-500 hover:text-stone-800"
                      title="Author Settings"
                    >
                      <Settings size={16} />
                    </button>
                  </>
                )}

                {/* Theme Toggle */}
                <button
                  onClick={toggleTheme}
                  className="p-2 rounded-full hover:bg-stone-200/50 dark:hover:bg-stone-800/50 transition-colors cursor-pointer text-stone-500 hover:text-stone-800"
                  title="Toggle Theme"
                >
                  {theme === 'light' ? <Moon size={16} /> : <Sun size={16} />}
                </button>

                {!isAuthenticated && (
                  <button
                    onClick={() => setIsLoginOpen(true)}
                    className="p-2 rounded-full opacity-60 hover:opacity-100 hover:bg-stone-200/50 dark:hover:bg-stone-800/50 transition-colors cursor-pointer text-stone-500 hover:text-stone-800"
                    title="Author Sign In"
                  >
                    <KeyRound size={15} />
                  </button>
                )}
              </div>
            </header>

            {/* Diary Page Stage Container with 3D Flip Perspective */}
            <main className="flex-1 max-w-4xl w-full mx-auto p-4 sm:p-8 flex items-center justify-center page-flip-container">
              {currentEntry ? (
                <AnimatePresence mode="wait" custom={flipDirection}>
                  <motion.div
                    key={currentEntry.id}
                    custom={flipDirection}
                    variants={pageVariants}
                    initial="initial"
                    animate="animate"
                    exit="exit"
                    className="w-full"
                  >
                    <DiaryPage
                      entry={currentEntry}
                      totalPages={entries.filter((e) => !e.isDraft).length || entries.length}
                      isBookmarked={bookmarkPage === currentEntry.pageNumber}
                      onToggleBookmark={handleToggleBookmark}
                      onImageClick={(img) => setLightboxImage(img)}
                      onEditEntry={(entry) => {
                        setEntryToEdit(entry);
                        setIsEditorOpen(true);
                      }}
                      onLoveReact={handleLoveReact}
                    />
                  </motion.div>
                </AnimatePresence>
              ) : (
                <div className="py-20 text-center font-garamond text-stone-400">
                  <p className="text-lg">No diary pages found in archive.</p>
                  <div className="flex items-center justify-center gap-3 mt-4">
                    <button
                      onClick={handleGoToCover}
                      className="px-4 py-2 rounded-lg text-xs uppercase tracking-wider border cursor-pointer"
                      style={{ borderColor: 'var(--paper-border)' }}
                    >
                      Return to Cover
                    </button>
                    {isAuthenticated && (
                      <button
                        onClick={() => {
                          setEntryToEdit(null);
                          setIsEditorOpen(true);
                        }}
                        className="px-5 py-2 rounded-lg text-xs uppercase tracking-wider text-white shadow-md cursor-pointer"
                        style={{ backgroundColor: 'var(--ink-accent)' }}
                      >
                        Inscribe First Page
                      </button>
                    )}
                  </div>
                </div>
              )}
            </main>

            {/* Bottom Floating Page Turn Navigator */}
            {entries.length > 0 && (
              <PageFlipNavigator
                currentPageIndex={currentIndex}
                totalEntries={entries.length}
                onPrev={handlePrevPage}
                onNext={handleNextPage}
                onGoToCover={handleGoToCover}
                onOpenRandom={handleOpenRandomPage}
                onOpenArchive={handleOpenArchive}
                onOpenMemories={handleOpenMemories}
                onOpenBookmark={handleOpenBookmark}
                hasBookmark={Boolean(bookmarkPage)}
                bookmarkPageNumber={bookmarkPage}
              />
            )}
          </div>
        )}
      </ErrorBoundary>

      {/* --- MODALS --- */}

      {/* 1. Entry Editor / Compose / Edit */}
      <EntryEditorModal
        isOpen={isEditorOpen}
        onClose={() => {
          setIsEditorOpen(false);
          setEntryToEdit(null);
        }}
        entryToEdit={entryToEdit}
        onSaved={handleEntrySaved}
        onDeleted={handleEntryDeleted}
      />

      {/* 2. Author Settings (Profile, Bio, Quote, Password) */}
      <AuthorSettingsModal
        isOpen={isSettingsOpen}
        onClose={() => setIsSettingsOpen(false)}
      />

      {/* 3. Author Login */}
      <AuthorLoginModal
        isOpen={isLoginOpen}
        onClose={() => setIsLoginOpen(false)}
        onSuccess={() => {
          setIsLoginOpen(false);
          refreshProfile();
          loadEntries();
        }}
      />

      {/* 4. Memory Image Lightbox */}
      <ImageLightbox
        image={lightboxImage}
        onClose={() => setLightboxImage(null)}
      />
    </div>
  );
}

export default function App() {
  return (
    <ErrorBoundary>
      <ThemeProvider>
        <AuthProvider>
          <DiaryApp />
        </AuthProvider>
      </ThemeProvider>
    </ErrorBoundary>
  );
}
