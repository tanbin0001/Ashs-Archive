import React from 'react';
import { DiaryEntry } from '../types';
import { ArchiveIndexView } from './ArchiveIndexView';

interface ArchiveIndexModalProps {
  isOpen: boolean;
  onClose: () => void;
  entries: DiaryEntry[];
  onSelectEntry: (entry: DiaryEntry) => void;
  onNewEntryClick?: () => void;
}

export const ArchiveIndexModal: React.FC<ArchiveIndexModalProps> = ({
  isOpen,
  onClose,
  entries,
  onSelectEntry,
  onNewEntryClick,
}) => {
  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 z-50 overflow-y-auto bg-black/75 backdrop-blur-xs p-2 sm:p-6 animate-in fade-in duration-200"
      onClick={onClose}
    >
      <div
        className="relative w-full max-w-4xl mx-auto rounded-2xl border shadow-2xl overflow-hidden my-4 sm:my-8"
        onClick={(e) => e.stopPropagation()}
        style={{
          backgroundColor: 'var(--paper-bg)',
          borderColor: 'var(--paper-border)',
        }}
      >
        <ArchiveIndexView
          entries={entries}
          onSelectEntry={(entry) => {
            onSelectEntry(entry);
            onClose();
          }}
          onGoBack={onClose}
          onGoToCover={onClose}
          onOpenNewEntry={
            onNewEntryClick
              ? () => {
                  onClose();
                  onNewEntryClick();
                }
              : undefined
          }
          isModal={true}
          onCloseModal={onClose}
        />
      </div>
    </div>
  );
};
