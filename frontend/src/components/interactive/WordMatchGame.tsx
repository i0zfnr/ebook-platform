import React, { useState, useEffect } from 'react';
import { Sparkles, RotateCcw, Trophy, Clock, Zap, CheckCircle2 } from 'lucide-react';
import type { Flashcard } from '../../types/interactive';

interface WordMatchGameProps {
  cards: Flashcard[];
  title?: string;
  onComplete?: (score: number, timeElapsed: number) => void;
}

interface MatchCardItem {
  id: string;
  originalId: string;
  text: string;
  type: 'term' | 'definition';
  isMatched: boolean;
}

export const WordMatchGame: React.FC<WordMatchGameProps> = ({ cards, title }) => {
  const [gameCards, setGameCards] = useState<MatchCardItem[]>([]);
  const [selectedCard, setSelectedCard] = useState<MatchCardItem | null>(null);
  const [wrongMatchId, setWrongMatchId] = useState<string | null>(null);
  const [score, setScore] = useState<number>(0);
  const [streak, setStreak] = useState<number>(0);
  const [timerSeconds, setTimerSeconds] = useState<number>(0);
  const [isGameOver, setIsGameOver] = useState<boolean>(false);
  const [isStarted, setIsStarted] = useState<boolean>(false);

  // Initialize and shuffle cards
  const initGame = () => {
    const termCards: MatchCardItem[] = cards.map((c) => ({
      id: `term_${c.id}`,
      originalId: c.id,
      text: c.term,
      type: 'term',
      isMatched: false,
    }));

    const defCards: MatchCardItem[] = cards.map((c) => ({
      id: `def_${c.id}`,
      originalId: c.id,
      text: c.definition,
      type: 'definition',
      isMatched: false,
    }));

    // Random shuffle both
    const combined = [...termCards, ...defCards].sort(() => Math.random() - 0.5);

    setGameCards(combined);
    setSelectedCard(null);
    setWrongMatchId(null);
    setScore(0);
    setStreak(0);
    setTimerSeconds(0);
    setIsGameOver(false);
    setIsStarted(true);
  };

  useEffect(() => {
    if (cards.length > 0) {
      initGame();
    }
  }, [cards]);

  // Timer loop
  useEffect(() => {
    if (!isStarted || isGameOver) return;
    const interval = setInterval(() => {
      setTimerSeconds((prev) => prev + 1);
    }, 1000);
    return () => clearInterval(interval);
  }, [isStarted, isGameOver]);

  const handleCardClick = (card: MatchCardItem) => {
    if (card.isMatched || isGameOver) return;

    // First card selected
    if (!selectedCard) {
      setSelectedCard(card);
      return;
    }

    // Clicked same card
    if (selectedCard.id === card.id) {
      setSelectedCard(null);
      return;
    }

    // Must be opposite types (term + definition)
    if (selectedCard.type === card.type) {
      setSelectedCard(card);
      return;
    }

    // Check Match
    if (selectedCard.originalId === card.originalId) {
      // MATCH!
      const nextStreak = streak + 1;
      setStreak(nextStreak);
      const points = 100 * nextStreak;
      setScore((prev) => prev + points);

      const updated = gameCards.map((c) => {
        if (c.originalId === card.originalId) {
          return { ...c, isMatched: true };
        }
        return c;
      });

      setGameCards(updated);
      setSelectedCard(null);

      // Check if all matched
      const allMatched = updated.every((c) => c.isMatched);
      if (allMatched) {
        setIsGameOver(true);
      }
    } else {
      // MISMATCH
      setStreak(0);
      setWrongMatchId(card.id);
      setTimeout(() => {
        setWrongMatchId(null);
        setSelectedCard(null);
      }, 700);
    }
  };

  const formatTimer = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs < 10 ? '0' : ''}${secs}`;
  };

  return (
    <div className="space-y-6 text-slate-800 dark:text-[#f8fafc] select-none">
      {/* Header & Stats Bar */}
      <div className="border-b border-slate-200/60 dark:border-white/10 pb-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="liquid-pill text-[10px] py-0.5 px-2.5 font-bold text-amber-500">
              <Sparkles className="h-3 w-3 inline mr-1" />
              Recall Speed Challenge
            </span>
            {streak > 1 && (
              <span className="liquid-pill text-[10px] py-0.5 px-2 font-bold text-violet-500 animate-bounce">
                <Zap className="h-3 w-3 inline" /> {streak}x Streak!
              </span>
            )}
          </div>

          <button
            onClick={initGame}
            className="flex items-center gap-1 text-xs font-bold text-violet-600 dark:text-[#a78bfa] hover:underline"
          >
            <RotateCcw className="h-3.5 w-3.5" />
            Restart Game
          </button>
        </div>

        <div className="flex items-center justify-between mt-3">
          <h3 className="text-base font-extrabold text-slate-900 dark:text-[#f8fafc] truncate">
            {title || 'Match Terms with Definitions'}
          </h3>

          <div className="flex items-center gap-4 text-xs font-mono-code font-bold">
            <div className="flex items-center gap-1 text-slate-500 dark:text-[#94a3b8]">
              <Clock className="h-3.5 w-3.5" />
              <span>{formatTimer(timerSeconds)}</span>
            </div>
            <div className="flex items-center gap-1 text-amber-600 dark:text-amber-400">
              <Trophy className="h-3.5 w-3.5" />
              <span>{score} PTS</span>
            </div>
          </div>
        </div>
      </div>

      {/* Win Celebration Screen */}
      {isGameOver ? (
        <div className="liquid-glass rounded-3xl p-8 text-center space-y-4 border border-emerald-500/40 bg-emerald-500/10 shadow-2xl animate-in zoom-in-95 duration-300">
          <div className="flex h-16 w-16 mx-auto items-center justify-center rounded-3xl bg-emerald-500 text-white shadow-xl shadow-emerald-500/30 text-3xl">
            🏆
          </div>
          <div>
            <h3 className="text-xl font-extrabold text-slate-900 dark:text-[#f8fafc]">
              Challenge Mastered!
            </h3>
            <p className="text-xs text-slate-500 dark:text-[#94a3b8] mt-1">
              You matched all {cards.length} academic concepts in{' '}
              <strong className="text-emerald-500">{formatTimer(timerSeconds)}</strong> with a score of{' '}
              <strong className="text-amber-500">{score} Points</strong>!
            </p>
          </div>

          <div className="pt-2">
            <button
              onClick={initGame}
              className="liquid-btn-primary px-6 py-2.5 text-xs font-extrabold shadow-lg inline-flex items-center gap-2"
            >
              <RotateCcw className="h-4 w-4" />
              Play Again
            </button>
          </div>
        </div>
      ) : (
        /* Game Match Board */
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
          {gameCards.map((card) => {
            const isSelected = selectedCard?.id === card.id;
            const isWrong = wrongMatchId === card.id;

            return (
              <button
                key={card.id}
                type="button"
                disabled={card.isMatched}
                onClick={() => handleCardClick(card)}
                className={`relative min-h-[90px] p-3.5 rounded-2xl text-left text-xs font-medium transition-all duration-200 flex flex-col justify-between border cursor-pointer ${
                  card.isMatched
                    ? 'opacity-40 bg-emerald-500/10 border-emerald-500/30 line-through pointer-events-none scale-95'
                    : isWrong
                    ? 'bg-red-500/20 border-red-500 text-red-700 dark:text-red-300 animate-shake shadow-lg'
                    : isSelected
                    ? 'bg-violet-600 text-white border-violet-400 shadow-xl scale-105 ring-2 ring-violet-400/50'
                    : card.type === 'term'
                    ? 'liquid-glass hover:border-violet-500/60 hover:scale-[1.02] text-slate-900 dark:text-[#f8fafc] font-bold shadow-sm'
                    : 'liquid-glass bg-white/40 dark:bg-white/[0.02] hover:border-amber-500/60 hover:scale-[1.02] text-slate-600 dark:text-[#94a3b8] text-[11px] shadow-sm'
                }`}
              >
                <div className="flex items-center justify-between w-full mb-1.5">
                  <span
                    className={`text-[9px] uppercase font-mono-code font-bold px-1.5 py-0.5 rounded-md ${
                      isSelected
                        ? 'bg-white/20 text-white'
                        : card.type === 'term'
                        ? 'bg-violet-500/15 text-violet-700 dark:text-[#c4b5fd]'
                        : 'bg-amber-500/15 text-amber-700 dark:text-amber-300'
                    }`}
                  >
                    {card.type === 'term' ? 'Concept' : 'Definition'}
                  </span>

                  {card.isMatched && <CheckCircle2 className="h-3.5 w-3.5 text-emerald-500" />}
                </div>

                <p className="line-clamp-3 leading-snug">{card.text}</p>
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
};
