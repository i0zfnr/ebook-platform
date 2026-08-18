import React from 'react';
import { Link } from 'react-router-dom';
import { BookOpen, UploadCloud, AlertCircle, RefreshCw } from 'lucide-react';
import type { Ebook } from '../../types/ebook';
import { BookCard } from './BookCard';

interface BookGridProps {
  ebooks: Ebook[];
  loading?: boolean;
  error?: string | null;
  onRetry?: () => void;
  onDelete?: (idOrSlug: string | number) => Promise<void> | void;
  emptyTitle?: string;
  emptyDescription?: string;
}

export const BookGrid: React.FC<BookGridProps> = ({
  ebooks,
  loading = false,
  error = null,
  onRetry,
  onDelete,
  emptyTitle = 'No e-books yet',
  emptyDescription = 'Upload your first PDF to start building your interactive digital library.',
}) => {
  if (loading) {
    return (
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4 sm:gap-6">
        {[...Array(10)].map((_, i) => (
          <div
            key={i}
            className="animate-pulse flex flex-col rounded-xl border border-slate-200 bg-white dark:border-slate-800 dark:bg-slate-900/40 p-3.5 space-y-3"
          >
            <div className="aspect-[1/1.414] w-full rounded-lg bg-slate-200 dark:bg-slate-800/80" />
            <div className="h-4 w-3/4 rounded bg-slate-200 dark:bg-slate-800" />
            <div className="h-3 w-1/2 rounded bg-slate-200/80 dark:bg-slate-800/60" />
            <div className="h-8 w-full rounded bg-slate-100 dark:bg-slate-800/50 pt-2" />
          </div>
        ))}
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center rounded-2xl border border-red-500/20 bg-red-50/50 dark:bg-red-950/20 p-8 text-center sm:p-12 my-6">
        <div className="flex h-12 w-12 items-center justify-center rounded-full bg-red-500/10 text-red-500 dark:text-red-400 mb-4 border border-red-500/20">
          <AlertCircle className="h-6 w-6" />
        </div>
        <h3 className="text-lg font-semibold text-slate-900 dark:text-white">Failed to load e-books</h3>
        <p className="mt-1 max-w-md text-sm text-slate-600 dark:text-slate-400">{error}</p>
        {onRetry && (
          <button
            onClick={onRetry}
            className="mt-5 flex items-center gap-2 rounded-lg bg-slate-900 text-white dark:bg-slate-800 px-4 py-2 text-sm font-medium hover:bg-slate-800 dark:hover:bg-slate-700 transition-colors"
          >
            <RefreshCw className="h-4 w-4" />
            Retry
          </button>
        )}
      </div>
    );
  }

  if (ebooks.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-slate-300 bg-white/60 dark:border-slate-800 dark:bg-slate-900/30 p-10 text-center sm:p-16 my-6 shadow-sm">
        <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-blue-600/10 text-blue-600 dark:text-blue-400 mb-4 border border-blue-500/20 shadow-inner">
          <BookOpen className="h-8 w-8" />
        </div>
        <h3 className="text-xl font-bold text-slate-900 dark:text-white">{emptyTitle}</h3>
        <p className="mt-2 max-w-sm text-sm text-slate-600 dark:text-slate-400 leading-relaxed">
          {emptyDescription}
        </p>
        <Link
          to="/upload"
          className="mt-6 flex items-center gap-2 rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 px-6 py-2.5 text-sm font-semibold text-white shadow-lg shadow-blue-600/20 hover:from-blue-500 hover:to-indigo-500 transition-all active:scale-95"
        >
          <UploadCloud className="h-4 w-4" />
          Upload E-Book
        </Link>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4 sm:gap-6">
      {ebooks.map((ebook) => (
        <BookCard key={ebook.id} ebook={ebook} onDelete={onDelete} />
      ))}
    </div>
  );
};
