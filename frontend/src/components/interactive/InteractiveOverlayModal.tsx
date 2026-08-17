import React from 'react';
import { X, ArrowLeft, BookOpen } from 'lucide-react';
import type { InteractiveElement } from '../../types/interactive';
import { QuizWidget } from './QuizWidget';
import { VideoWidget } from './VideoWidget';
import { FlashcardWidget } from './FlashcardWidget';

interface InteractiveOverlayModalProps {
  isOpen: boolean;
  onClose: () => void;
  element: InteractiveElement | null;
  bookId: string | number;
}

export const InteractiveOverlayModal: React.FC<InteractiveOverlayModalProps> = ({
  isOpen,
  onClose,
  element,
  bookId,
}) => {
  if (!isOpen || !element) return null;

  return (
    <div
      onClick={onClose}
      className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 bg-black/70 backdrop-blur-md animate-in fade-in duration-200"
    >
      {/* Modal Container with Apple Liquid Glass */}
      <div
        onClick={(e) => e.stopPropagation()}
        className="liquid-glass relative w-full max-w-2xl max-h-[90vh] overflow-y-auto rounded-3xl p-6 sm:p-8 shadow-2xl border border-white/20 space-y-6"
      >
        {/* Top Header Bar with Prominent Back to E-Book Button */}
        <div className="flex items-center justify-between pb-3 border-b border-slate-200/50 dark:border-white/10">
          <button
            type="button"
            onClick={onClose}
            className="liquid-btn-secondary flex items-center gap-2 px-3.5 py-1.5 text-xs font-mono-code font-bold shadow-sm cursor-pointer hover:border-violet-500"
          >
            <ArrowLeft className="h-4 w-4" />
            <span>← Back to E-Book</span>
          </button>

          <button
            type="button"
            onClick={onClose}
            className="flex items-center gap-1.5 p-2 rounded-xl text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-white/20 transition-all cursor-pointer"
            aria-label="Close modal"
          >
            <span className="text-xs hidden sm:inline font-mono-code">Close</span>
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* Content Renderers */}
        {element.type === 'quiz' && element.data.questions && (
          <QuizWidget
            questions={element.data.questions}
            bookId={bookId}
            elementId={element.id}
            title={element.title}
          />
        )}

        {element.type === 'video' && (
          <VideoWidget
            videoId={element.data.videoId}
            youtubeUrl={element.data.youtubeUrl}
            videoTitle={element.title}
            description={element.description}
          />
        )}

        {element.type === 'flashcards' && element.data.cards && (
          <FlashcardWidget
            cards={element.data.cards}
            title={element.title}
          />
        )}

        {/* Bottom Footer with Return to E-Book Action */}
        <div className="pt-4 border-t border-slate-200/50 dark:border-white/10 flex items-center justify-between">
          <span className="text-[11px] font-mono-code text-slate-400">
            Page {element.pageNumber} Activity
          </span>

          <button
            type="button"
            onClick={onClose}
            className="liquid-btn-primary flex items-center gap-2 px-5 py-2 text-xs font-extrabold shadow-lg cursor-pointer"
          >
            <BookOpen className="h-3.5 w-3.5" />
            <span>Return to E-Book</span>
          </button>
        </div>
      </div>
    </div>
  );
};
