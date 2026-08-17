import React, { useState } from 'react';
import { ChevronLeft, ChevronRight, RotateCw, Sparkles, Check, Gamepad2, Layers } from 'lucide-react';
import type { Flashcard } from '../../types/interactive';
import { WordMatchGame } from './WordMatchGame';

interface FlashcardWidgetProps {
  cards: Flashcard[];
  title: string;
}

export const FlashcardWidget: React.FC<FlashcardWidgetProps> = ({ cards, title }) => {
  const [viewMode, setViewMode] = useState<'flashcards' | 'game'>('flashcards');
  const [currentIndex, setCurrentIndex] = useState<number>(0);
  const [isFlipped, setIsFlipped] = useState<boolean>(false);
  const [mastered, setMastered] = useState<Set<number>>(new Set());

  const currentCard = cards[currentIndex] || cards[0];

  const handleNext = () => {
    setIsFlipped(false);
    setCurrentIndex((prev) => (prev + 1) % cards.length);
  };

  const handlePrev = () => {
    setIsFlipped(false);
    setCurrentIndex((prev) => (prev - 1 + cards.length) % cards.length);
  };

  const handleToggleMastered = () => {
    setMastered((prev) => {
      const next = new Set(prev);
      if (next.has(currentIndex)) {
        next.delete(currentIndex);
      } else {
        next.add(currentIndex);
      }
      return next;
    });
  };

  if (!cards || cards.length === 0) return null;

  return (
    <div className="space-y-6 text-slate-800 dark:text-[#f8fafc]">
      {/* Top Mode Selector */}
      <div className="flex items-center justify-between border-b border-slate-200/60 dark:border-white/10 pb-3">
        <div className="flex items-center gap-1.5 p-1 rounded-xl liquid-glass text-xs font-mono-code font-bold">
          <button
            type="button"
            onClick={() => setViewMode('flashcards')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg transition-all cursor-pointer ${
              viewMode === 'flashcards'
                ? 'bg-violet-600 text-white shadow-md'
                : 'text-slate-600 dark:text-[#94a3b8] hover:text-slate-900 dark:hover:text-white'
            }`}
          >
            <Layers className="h-3.5 w-3.5" />
            <span>3D Flashcards</span>
          </button>

          <button
            type="button"
            onClick={() => setViewMode('game')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg transition-all cursor-pointer ${
              viewMode === 'game'
                ? 'bg-amber-500 text-white shadow-md'
                : 'text-slate-600 dark:text-[#94a3b8] hover:text-slate-900 dark:hover:text-white'
            }`}
          >
            <Gamepad2 className="h-3.5 w-3.5" />
            <span>Speed Match Game</span>
          </button>
        </div>

        {viewMode === 'flashcards' && (
          <span className="text-xs font-mono-code font-bold text-violet-600 dark:text-[#a78bfa]">
            Card {currentIndex + 1} of {cards.length}
          </span>
        )}
      </div>

      {viewMode === 'game' ? (
        <WordMatchGame cards={cards} title={title} />
      ) : (
        <div className="space-y-6">
          <div>
            <div className="flex items-center gap-2">
              <span className="liquid-pill text-[10px] py-0.5 px-2.5 font-bold text-amber-500">
                <Sparkles className="h-3 w-3 inline mr-1" />
                Concept Mastery
              </span>
            </div>
            <h3 className="text-lg font-extrabold text-slate-900 dark:text-[#f8fafc] mt-1.5">
              {title}
            </h3>
          </div>

          {/* 3D Flip Card */}
          <div
            onClick={() => setIsFlipped(!isFlipped)}
            className="relative h-64 w-full cursor-pointer perspective-1000 group"
          >
            <div
              className={`liquid-glass relative flex h-full w-full flex-col items-center justify-center p-8 text-center rounded-3xl border transition-all duration-500 shadow-2xl ${
                isFlipped
                  ? 'border-violet-500/60 bg-violet-600/10'
                  : 'border-slate-300 dark:border-white/10 hover:border-violet-400'
              }`}
            >
              <span className="absolute top-4 left-4 liquid-pill text-[10px] py-0.5 px-2 font-bold font-mono-code">
                {isFlipped ? 'DEFINITION / EXPLANATION' : 'ACADEMIC TERM / CONCEPT'}
              </span>

              <div className="space-y-3">
                <h4
                  className={`font-extrabold tracking-tight transition-all ${
                    isFlipped
                      ? 'text-sm sm:text-base text-slate-700 dark:text-[#c4b5fd] font-normal leading-relaxed'
                      : 'text-2xl sm:text-3xl text-slate-900 dark:text-[#f8fafc]'
                  }`}
                >
                  {isFlipped ? currentCard.definition : currentCard.term}
                </h4>
              </div>

              <div className="absolute bottom-4 flex items-center gap-1.5 text-[11px] font-mono-code text-slate-400 group-hover:text-violet-500 transition-colors">
                <RotateCw className="h-3 w-3" />
                <span>Click card to {isFlipped ? 'reveal term' : 'flip definition'}</span>
              </div>
            </div>
          </div>

          {/* Controls & Mastery Tracker */}
          <div className="flex items-center justify-between pt-2">
            <button
              onClick={handlePrev}
              className="liquid-btn-secondary flex items-center gap-1.5 px-4 py-2 text-xs font-bold shadow-sm cursor-pointer"
            >
              <ChevronLeft className="h-4 w-4" />
              <span>Previous</span>
            </button>

            <button
              onClick={handleToggleMastered}
              className={`flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                mastered.has(currentIndex)
                  ? 'bg-emerald-500/20 text-emerald-600 border border-emerald-500/40 shadow-sm'
                  : 'liquid-glass text-slate-600 dark:text-[#94a3b8] hover:text-emerald-500'
              }`}
            >
              <Check className="h-3.5 w-3.5" />
              <span>{mastered.has(currentIndex) ? 'Mastered ✓' : 'Mark as Mastered'}</span>
            </button>

            <button
              onClick={handleNext}
              className="liquid-btn-primary flex items-center gap-1.5 px-4 py-2 text-xs font-bold shadow-md cursor-pointer"
            >
              <span>Next Card</span>
              <ChevronRight className="h-4 w-4" />
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
