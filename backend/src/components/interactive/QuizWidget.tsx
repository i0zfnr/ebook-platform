import React, { useState, useEffect } from 'react';
import { CheckCircle2, XCircle, Award, RotateCcw, Sparkles } from 'lucide-react';
import type { QuizQuestion, StudentQuizResult } from '../../types/interactive';

interface QuizWidgetProps {
  questions: QuizQuestion[];
  bookId: string | number;
  elementId: string;
  title: string;
}

export const QuizWidget: React.FC<QuizWidgetProps> = ({
  questions,
  bookId,
  elementId,
  title,
}) => {
  const storageKey = `flipbook_quiz_${bookId}_${elementId}`;
  const [selectedAnswers, setSelectedAnswers] = useState<Record<number, number>>({});
  const [submitted, setSubmitted] = useState<boolean>(false);
  const [result, setResult] = useState<StudentQuizResult | null>(null);

  // Load saved device session attempt
  useEffect(() => {
    try {
      const saved = localStorage.getItem(storageKey);
      if (saved) {
        const parsed: StudentQuizResult = JSON.parse(saved);
        setResult(parsed);
        setSelectedAnswers(parsed.answers);
        setSubmitted(true);
      }
    } catch {}
  }, [storageKey]);

  const handleSelectOption = (qIdx: number, optIdx: number) => {
    if (submitted) return;
    setSelectedAnswers((prev) => ({
      ...prev,
      [qIdx]: optIdx,
    }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (Object.keys(selectedAnswers).length < questions.length) {
      alert(`Please answer all ${questions.length} questions before submitting.`);
      return;
    }

    let correctCount = 0;
    questions.forEach((q, idx) => {
      if (selectedAnswers[idx] === q.correctIndex) {
        correctCount++;
      }
    });

    const finalResult: StudentQuizResult = {
      score: correctCount,
      totalQuestions: questions.length,
      percent: Math.round((correctCount / questions.length) * 100),
      answers: selectedAnswers,
      completedAt: Date.now(),
    };

    setResult(finalResult);
    setSubmitted(true);

    try {
      localStorage.setItem(storageKey, JSON.stringify(finalResult));
    } catch {}
  };

  const handleReset = () => {
    setSubmitted(false);
    setSelectedAnswers({});
    setResult(null);
    try {
      localStorage.removeItem(storageKey);
    } catch {}
  };

  const isAllAnswered = Object.keys(selectedAnswers).length === questions.length;

  return (
    <div className="space-y-6 select-text text-slate-800 dark:text-[#f8fafc]">
      {/* Header */}
      <div className="border-b border-slate-200/60 dark:border-white/10 pb-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="liquid-pill text-[10px] py-0.5 px-2.5 font-bold">
              AI Interactive Quiz
            </span>
            <span className="text-xs font-mono-code text-slate-400">
              {questions.length} Questions
            </span>
          </div>
          {submitted && (
            <button
              onClick={handleReset}
              className="flex items-center gap-1.5 text-xs font-bold text-violet-600 dark:text-[#a78bfa] hover:underline"
            >
              <RotateCcw className="h-3.5 w-3.5" />
              Retake Quiz
            </button>
          )}
        </div>
        <h3 className="text-lg font-extrabold text-slate-900 dark:text-[#f8fafc] mt-2">
          {title}
        </h3>
      </div>

      {/* Score Banner when Submitted */}
      {submitted && result && (
        <div
          className={`p-5 rounded-2xl flex items-center justify-between shadow-lg transition-all ${
            result.percent >= 70
              ? 'bg-emerald-500/15 border border-emerald-500/30 text-emerald-950 dark:text-emerald-200'
              : 'bg-amber-500/15 border border-amber-500/30 text-amber-950 dark:text-amber-200'
          }`}
        >
          <div className="flex items-center gap-3.5">
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-white/20 shadow-sm text-2xl">
              {result.percent >= 70 ? '🎉' : '💡'}
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-sm font-bold">
                  {result.percent >= 70 ? 'Mastery Achieved!' : 'Good Effort! Review & Retry'}
                </span>
                <Award className="h-4 w-4" />
              </div>
              <p className="text-xs opacity-80 mt-0.5">
                Saved to your device session • No login required
              </p>
            </div>
          </div>
          <div className="text-right font-mono-code">
            <span className="text-2xl font-extrabold">{result.score}/{result.totalQuestions}</span>
            <div className="text-[11px] font-bold">{result.percent}%</div>
          </div>
        </div>
      )}

      {/* Questions List */}
      <form onSubmit={handleSubmit} className="space-y-6">
        {questions.map((q, qIdx) => {
          const selectedOpt = selectedAnswers[qIdx];
          const isCorrect = submitted && selectedOpt === q.correctIndex;

          return (
            <div
              key={q.id || qIdx}
              className={`p-5 rounded-2xl liquid-glass space-y-4 border transition-all ${
                submitted
                  ? isCorrect
                    ? 'border-emerald-500/50 bg-emerald-500/5'
                    : 'border-rose-500/50 bg-rose-500/5'
                  : 'border-slate-200/50 dark:border-white/10'
              }`}
            >
              {/* Question Title */}
              <div className="flex items-start gap-3">
                <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-lg bg-violet-600/15 text-violet-700 dark:text-[#a78bfa] text-xs font-mono-code font-bold">
                  {qIdx + 1}
                </span>
                <h4 className="text-sm font-bold text-slate-900 dark:text-[#f8fafc] leading-relaxed pt-0.5">
                  {q.question}
                </h4>
              </div>

              {/* Options */}
              <div className="space-y-2.5 pl-9">
                {q.options.map((opt, optIdx) => {
                  const isSelected = selectedOpt === optIdx;
                  const isThisCorrect = submitted && optIdx === q.correctIndex;
                  const isThisSelectedWrong = submitted && isSelected && !isThisCorrect;
                  const optionLetters = ['A', 'B', 'C', 'D', 'E'];

                  return (
                    <button
                      type="button"
                      key={optIdx}
                      disabled={submitted}
                      onClick={() => handleSelectOption(qIdx, optIdx)}
                      className={`w-full flex items-center justify-between p-3.5 rounded-xl text-left text-xs font-medium transition-all ${
                        isThisCorrect
                          ? 'bg-emerald-500/20 text-emerald-900 dark:text-emerald-200 border-2 border-emerald-500 font-bold shadow-md'
                          : isThisSelectedWrong
                          ? 'bg-rose-500/20 text-rose-900 dark:text-rose-200 border-2 border-rose-500 font-bold'
                          : isSelected
                          ? 'bg-violet-600/15 text-violet-900 dark:text-white border border-violet-500 font-bold shadow-sm'
                          : 'hover:bg-white/50 dark:hover:bg-white/5 text-slate-700 dark:text-[#94a3b8] border border-slate-200/60 dark:border-white/5'
                      }`}
                    >
                      <div className="flex items-center gap-3">
                        <span className="flex h-5 w-5 items-center justify-center rounded-md bg-slate-200/60 dark:bg-black/40 text-[10px] font-mono-code font-bold">
                          {optionLetters[optIdx]}
                        </span>
                        <span>{opt}</span>
                      </div>
                      {isThisCorrect && <CheckCircle2 className="h-4 w-4 text-emerald-500 shrink-0" />}
                      {isThisSelectedWrong && <XCircle className="h-4 w-4 text-rose-500 shrink-0" />}
                    </button>
                  );
                })}
              </div>

              {/* Rationale Explanation */}
              {submitted && (
                <div className="mt-3 pl-9 pt-2 border-t border-slate-200/40 dark:border-white/5 text-xs text-slate-600 dark:text-[#94a3b8] leading-relaxed">
                  <span className="font-bold text-violet-600 dark:text-[#a78bfa]">Explanation: </span>
                  {q.explanation}
                </div>
              )}
            </div>
          );
        })}

        {/* Submit Button */}
        {!submitted && (
          <div className="pt-2">
            <button
              type="submit"
              disabled={!isAllAnswered}
              className="liquid-btn-primary w-full py-3 text-xs font-extrabold flex items-center justify-center gap-2 disabled:opacity-40 disabled:cursor-not-allowed shadow-xl"
            >
              <Sparkles className="h-4 w-4" />
              <span>Submit Answers for Instant Grading</span>
            </button>
          </div>
        )}
      </form>
    </div>
  );
};
