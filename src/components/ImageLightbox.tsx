import React, { useEffect } from 'react';
import { X, ZoomIn } from 'lucide-react';
import { DiaryImage } from '../types';

interface ImageLightboxProps {
  image: DiaryImage | null;
  onClose: () => void;
}

export const ImageLightbox: React.FC<ImageLightboxProps> = ({ image, onClose }) => {
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [onClose]);

  if (!image) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/85 backdrop-blur-sm p-4 animate-in fade-in duration-200"
      onClick={onClose}
      role="dialog"
      aria-modal="true"
      aria-label="Image Preview"
    >
      <button
        onClick={onClose}
        className="absolute top-6 right-6 p-2 rounded-full bg-stone-900/80 text-stone-300 hover:text-white hover:bg-stone-800 transition-colors cursor-pointer"
        aria-label="Close image viewer"
      >
        <X size={24} />
      </button>

      <div
        className="max-w-4xl max-h-[90vh] flex flex-col items-center p-2"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="relative rounded-lg overflow-hidden border border-stone-800 shadow-2xl bg-stone-950">
          <img
            src={image.url}
            alt={image.caption || 'Diary Memory'}
            className="max-w-full max-h-[75vh] object-contain rounded"
          />
        </div>

        {image.caption && (
          <p className="mt-4 text-center text-sm md:text-base text-stone-300 font-garamond italic px-4 max-w-2xl">
            {image.caption}
          </p>
        )}
      </div>
    </div>
  );
};
