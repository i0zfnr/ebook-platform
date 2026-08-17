import React from 'react';
import { HelpCircle, Play, Sparkles, QrCode, ArrowRight } from 'lucide-react';
import type { InteractiveElement } from '../../types/interactive';

interface InteractivePageHotspotsProps {
  currentPage: number;
  interactiveElements: InteractiveElement[];
  onOpenElement: (element: InteractiveElement) => void;
}

export const InteractivePageHotspots: React.FC<InteractivePageHotspotsProps> = ({
  currentPage,
  interactiveElements,
  onOpenElement,
}) => {
  // Check if current page (or adjacent page in 2-page spread: currentPage or currentPage+1) has interactive elements
  const currentElements = interactiveElements.filter(
    (el) => el.pageNumber === currentPage || el.pageNumber === currentPage + 1
  );

  if (currentElements.length === 0) return null;

  return (
    <div className="absolute bottom-6 left-1/2 -translate-x-1/2 z-30 flex flex-wrap items-center justify-center gap-3 pointer-events-auto animate-in slide-in-from-bottom-4 duration-300">
      {currentElements.map((el) => {
        const isQuiz = el.type === 'quiz';
        const isVideo = el.type === 'video';
        const isFlashcards = el.type === 'flashcards';
        const isQr = el.type === 'qr_link';

        return (
          <button
            key={el.id}
            onClick={() => onOpenElement(el)}
            className={`group flex items-center gap-2.5 px-4 py-2.5 rounded-2xl font-bold text-xs shadow-2xl transition-all duration-300 hover:scale-105 active:scale-95 cursor-pointer border ${
              isQuiz
                ? 'bg-gradient-to-r from-violet-600 to-indigo-600 text-white border-violet-400/50 shadow-violet-600/40 animate-pulse'
                : isVideo
                ? 'bg-gradient-to-r from-rose-600 to-red-600 text-white border-rose-400/50 shadow-rose-600/40'
                : isFlashcards
                ? 'bg-gradient-to-r from-amber-500 to-orange-600 text-white border-amber-400/50 shadow-amber-600/40'
                : 'bg-gradient-to-r from-emerald-600 to-teal-600 text-white border-emerald-400/50 shadow-emerald-600/40'
            }`}
          >
            {isQuiz && <HelpCircle className="h-4 w-4" />}
            {isVideo && <Play className="h-4 w-4 fill-white" />}
            {isFlashcards && <Sparkles className="h-4 w-4" />}
            {isQr && <QrCode className="h-4 w-4" />}

            <div className="flex flex-col text-left">
              <span className="text-[10px] uppercase font-mono-code font-bold opacity-90">
                Page {el.pageNumber} • Interactive {el.type}
              </span>
              <span className="text-xs font-extrabold truncate max-w-[200px] sm:max-w-[280px]">
                {el.title}
              </span>
            </div>

            <span className="flex h-6 w-6 items-center justify-center rounded-xl bg-white/20 group-hover:translate-x-0.5 transition-transform">
              <ArrowRight className="h-3.5 w-3.5" />
            </span>
          </button>
        );
      })}
    </div>
  );
};
