import React from 'react';
import {
  X,
  Sparkles,
  HelpCircle,
  Play,
  Gamepad2,
  BookOpen,
  ArrowRight,
  Award,
} from 'lucide-react';
import type { InteractiveElement } from '../../types/interactive';

interface AiLearningHubDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  interactiveElements: InteractiveElement[];
  onOpenElement: (element: InteractiveElement) => void;
  onSelectPage: (page: number) => void;
  title: string;
}

export const AiLearningHubDrawer: React.FC<AiLearningHubDrawerProps> = ({
  isOpen,
  onClose,
  interactiveElements,
  onOpenElement,
  onSelectPage,
  title,
}) => {
  if (!isOpen) return null;

  const quizzes = interactiveElements.filter((el) => el.type === 'quiz');
  const flashcards = interactiveElements.filter((el) => el.type === 'flashcards');
  const videos = interactiveElements.filter((el) => el.type === 'video');

  return (
    <div className="fixed inset-y-0 right-0 z-50 flex w-88 sm:w-96 flex-col liquid-nav shadow-2xl transition-all duration-300 border-l border-slate-200/50 dark:border-white/10 select-none">
      {/* Header */}
      <div className="flex items-center justify-between border-b border-slate-200/50 dark:border-white/10 px-5 py-4">
        <div className="flex items-center gap-2.5">
          <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-tr from-violet-600 to-indigo-600 text-white shadow-lg shadow-violet-500/25">
            <Sparkles className="h-5 w-5 animate-pulse" />
          </div>
          <div>
            <h3 className="text-sm font-extrabold text-slate-900 dark:text-[#f8fafc]">
              AI Learning Suite
            </h3>
            <p className="text-[11px] font-mono-code text-slate-500 dark:text-[#94a3b8]">
              {interactiveElements.length} Interactive Activities
            </p>
          </div>
        </div>

        <button
          onClick={onClose}
          className="rounded-xl p-2 text-slate-400 hover:bg-white/40 dark:hover:bg-white/10 dark:hover:text-white transition-colors cursor-pointer"
          aria-label="Close drawer"
        >
          <X className="h-4 w-4" />
        </button>
      </div>

      {/* Body */}
      <div className="flex-1 overflow-y-auto p-4 space-y-6">
        {/* Banner */}
        <div className="rounded-2xl liquid-glass p-4 border border-violet-500/30 bg-violet-600/5 space-y-2">
          <div className="flex items-center gap-2 text-xs font-bold text-violet-700 dark:text-[#c4b5fd]">
            <Award className="h-4 w-4" />
            <span>Interactive Gamified Module</span>
          </div>
          <p className="text-[11px] text-slate-600 dark:text-[#94a3b8] leading-relaxed">
            AI has analyzed <strong className="text-slate-900 dark:text-white">"{title}"</strong> and created personalized quizzes, recall match games, and video explanations.
          </p>
        </div>

        {/* Section: Quizzes & Knowledge Checks */}
        {quizzes.length > 0 && (
          <div className="space-y-2.5">
            <div className="flex items-center justify-between px-1">
              <span className="text-xs font-bold uppercase tracking-wider font-mono-code text-violet-600 dark:text-[#a78bfa] flex items-center gap-1.5">
                <HelpCircle className="h-3.5 w-3.5" />
                <span>Knowledge Quizzes ({quizzes.length})</span>
              </span>
            </div>

            {quizzes.map((quiz) => (
              <button
                key={quiz.id}
                type="button"
                onClick={() => {
                  onSelectPage(quiz.pageNumber);
                  onOpenElement(quiz);
                  onClose();
                }}
                className="w-full flex items-start gap-3 p-3.5 rounded-2xl liquid-glass border border-violet-500/20 hover:border-violet-500 hover:scale-[1.01] transition-all text-left shadow-sm group cursor-pointer"
              >
                <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-violet-600 text-white shadow-md shadow-violet-600/30 group-hover:scale-110 transition-transform">
                  <HelpCircle className="h-5 w-5" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between">
                    <span className="liquid-pill text-[9px] py-0.2 px-2 font-mono-code font-bold text-violet-600 dark:text-[#a78bfa]">
                      Page {quiz.pageNumber}
                    </span>
                    <span className="text-[10px] font-mono-code text-slate-400">
                      {quiz.data.questions?.length || 0} MCQs
                    </span>
                  </div>
                  <h4 className="text-xs font-extrabold text-slate-900 dark:text-[#f8fafc] truncate mt-1">
                    {quiz.title}
                  </h4>
                  <p className="text-[11px] text-slate-500 dark:text-[#94a3b8] line-clamp-1 mt-0.5">
                    {quiz.description || 'Test your understanding with instant grading.'}
                  </p>
                </div>
                <ArrowRight className="h-4 w-4 text-slate-400 group-hover:text-violet-500 group-hover:translate-x-0.5 transition-all shrink-0 mt-2.5" />
              </button>
            ))}
          </div>
        )}

        {/* Section: Flashcards & Match Game */}
        {flashcards.length > 0 && (
          <div className="space-y-2.5">
            <div className="flex items-center justify-between px-1">
              <span className="text-xs font-bold uppercase tracking-wider font-mono-code text-amber-600 dark:text-amber-400 flex items-center gap-1.5">
                <Gamepad2 className="h-3.5 w-3.5" />
                <span>Recall Games & Flashcards ({flashcards.length})</span>
              </span>
            </div>

            {flashcards.map((fc) => (
              <button
                key={fc.id}
                type="button"
                onClick={() => {
                  onSelectPage(fc.pageNumber);
                  onOpenElement(fc);
                  onClose();
                }}
                className="w-full flex items-start gap-3 p-3.5 rounded-2xl liquid-glass border border-amber-500/20 hover:border-amber-500 hover:scale-[1.01] transition-all text-left shadow-sm group cursor-pointer"
              >
                <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-gradient-to-tr from-amber-500 to-orange-500 text-white shadow-md shadow-amber-500/30 group-hover:scale-110 transition-transform">
                  <Gamepad2 className="h-5 w-5" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between">
                    <span className="liquid-pill text-[9px] py-0.2 px-2 font-mono-code font-bold text-amber-600 dark:text-amber-400">
                      Page {fc.pageNumber}
                    </span>
                    <span className="text-[10px] font-mono-code text-slate-400">
                      {fc.data.cards?.length || 0} Terms & Match Game
                    </span>
                  </div>
                  <h4 className="text-xs font-extrabold text-slate-900 dark:text-[#f8fafc] truncate mt-1">
                    {fc.title}
                  </h4>
                  <p className="text-[11px] text-slate-500 dark:text-[#94a3b8] line-clamp-1 mt-0.5">
                    {fc.description || 'Master key terms with 3D cards & Speed Match Game.'}
                  </p>
                </div>
                <ArrowRight className="h-4 w-4 text-slate-400 group-hover:text-amber-500 group-hover:translate-x-0.5 transition-all shrink-0 mt-2.5" />
              </button>
            ))}
          </div>
        )}

        {/* Section: Video Lectures */}
        {videos.length > 0 && (
          <div className="space-y-2.5">
            <div className="flex items-center justify-between px-1">
              <span className="text-xs font-bold uppercase tracking-wider font-mono-code text-rose-600 dark:text-rose-400 flex items-center gap-1.5">
                <Play className="h-3.5 w-3.5" />
                <span>Video Lectures ({videos.length})</span>
              </span>
            </div>

            {videos.map((vid) => (
              <button
                key={vid.id}
                type="button"
                onClick={() => {
                  onSelectPage(vid.pageNumber);
                  onOpenElement(vid);
                  onClose();
                }}
                className="w-full flex items-start gap-3 p-3.5 rounded-2xl liquid-glass border border-rose-500/20 hover:border-rose-500 hover:scale-[1.01] transition-all text-left shadow-sm group cursor-pointer"
              >
                <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-rose-600 text-white shadow-md shadow-rose-600/30 group-hover:scale-110 transition-transform">
                  <Play className="h-5 w-5 fill-white" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between">
                    <span className="liquid-pill text-[9px] py-0.2 px-2 font-mono-code font-bold text-rose-600 dark:text-rose-400">
                      Page {vid.pageNumber}
                    </span>
                    <span className="text-[10px] font-mono-code text-slate-400">YouTube</span>
                  </div>
                  <h4 className="text-xs font-extrabold text-slate-900 dark:text-[#f8fafc] truncate mt-1">
                    {vid.title}
                  </h4>
                  <p className="text-[11px] text-slate-500 dark:text-[#94a3b8] line-clamp-1 mt-0.5">
                    {vid.description || 'Watch topic lecture embed.'}
                  </p>
                </div>
                <ArrowRight className="h-4 w-4 text-slate-400 group-hover:text-rose-500 group-hover:translate-x-0.5 transition-all shrink-0 mt-2.5" />
              </button>
            ))}
          </div>
        )}

        {interactiveElements.length === 0 && (
          <div className="py-16 text-center text-slate-400 space-y-3">
            <BookOpen className="h-10 w-10 mx-auto opacity-30 animate-pulse" />
            <p className="text-xs">No interactive elements generated yet.</p>
          </div>
        )}
      </div>
    </div>
  );
};
