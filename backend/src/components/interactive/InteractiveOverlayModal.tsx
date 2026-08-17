import React from 'react';
import { X } from 'lucide-react';
import type { InteractiveElement } from '../../types/interactive';
import { QuizWidget } from './QuizWidget';
import { VideoWidget } from './VideoWidget';
import { FlashcardWidget } from './FlashcardWidget';
import { QrWidget } from './QrWidget';

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
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 bg-black/60 backdrop-blur-md animate-in fade-in duration-200">
      {/* Modal Container with Apple Liquid Glass */}
      <div className="liquid-glass relative w-full max-w-2xl max-h-[90vh] overflow-y-auto rounded-3xl p-6 sm:p-8 shadow-2xl border border-white/20">
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-5 right-5 p-2 rounded-xl text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-white/20 transition-all cursor-pointer z-10"
          aria-label="Close modal"
        >
          <X className="h-5 w-5" />
        </button>

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

        {element.type === 'qr_link' && (
          <QrWidget
            targetUrl={element.data.targetUrl}
            label={element.data.label}
            title={element.title}
            description={element.description}
          />
        )}
      </div>
    </div>
  );
};
