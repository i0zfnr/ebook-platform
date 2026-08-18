import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { BookOpen, Info, FileText, Trash2, Loader2 } from 'lucide-react';
import type { Ebook } from '../../types/ebook';
import { BookCover } from './BookCover';
import { formatBytes } from '../../services/ebookService';

interface BookCardProps {
  ebook: Ebook;
  onDelete?: (idOrSlug: string | number) => Promise<void> | void;
}

export const BookCard: React.FC<BookCardProps> = ({ ebook, onDelete }) => {
  const [isDeleting, setIsDeleting] = useState<boolean>(false);

  const handleDelete = async (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (window.confirm(`Are you sure you want to permanently delete "${ebook.title}"?`)) {
      setIsDeleting(true);
      try {
        if (onDelete) {
          await onDelete(ebook.slug || ebook.id);
        }
      } catch (err) {
        console.error('Delete error:', err);
      } finally {
        setIsDeleting(false);
      }
    }
  };

  return (
    <div className="liquid-card group relative flex flex-col p-3.5 transition-all duration-300">
      {/* Cover Image with Link to Reader */}
      <Link to={`/read/${ebook.slug || ebook.id}`} className="relative block overflow-hidden rounded-2xl">
        <BookCover
          coverUrl={ebook.cover_url}
          pdfUrl={ebook.pdf_url}
          title={ebook.title}
          author={ebook.author}
        />
        {/* Hover Read Overlay with Liquid Blur */}
        <div className="absolute inset-0 flex items-center justify-center bg-slate-950/50 opacity-0 backdrop-blur-md transition-opacity duration-300 group-hover:opacity-100">
          <span className="liquid-btn-primary flex items-center gap-2 px-4 py-2 text-xs font-bold text-white shadow-xl transform translate-y-2 group-hover:translate-y-0 transition-transform duration-200">
            <BookOpen className="h-4 w-4" />
            Open Flipbook
          </span>
        </div>
      </Link>

      {/* Book Metadata */}
      <div className="mt-3.5 flex flex-1 flex-col">
        <div className="flex items-center justify-between text-[11px] font-mono-code text-slate-500 dark:text-[#94a3b8] mb-1.5">
          <span className="flex items-center gap-1 font-medium">
            <FileText className="h-3 w-3 text-violet-600 dark:text-[#a78bfa]" />
            {ebook.total_pages ? `${ebook.total_pages} Pages` : 'PDF E-Book'}
          </span>
          <span>{formatBytes(ebook.file_size)}</span>
        </div>

        <Link
          to={`/book/${ebook.slug || ebook.id}`}
          className="line-clamp-1 text-base font-bold text-slate-900 hover:text-violet-600 dark:text-[#f8fafc] dark:hover:text-[#a78bfa] transition-colors"
          title={ebook.title}
        >
          {ebook.title}
        </Link>

        <p className="mt-0.5 line-clamp-1 text-xs text-slate-500 dark:text-[#94a3b8] font-medium">
          {ebook.author ? `By ${ebook.author}` : 'Unknown Author'}
        </p>

        {ebook.description && (
          <p className="mt-2 line-clamp-2 text-xs text-slate-600 dark:text-[#94a3b8]/80 leading-relaxed">
            {ebook.description}
          </p>
        )}

        {/* Action Buttons */}
        <div className="mt-4 flex items-center gap-2 pt-2 border-t border-slate-200/50 dark:border-white/10">
          <Link
            to={`/read/${ebook.slug || ebook.id}`}
            className="flex flex-1 items-center justify-center gap-1.5 rounded-xl bg-violet-500/10 py-2 px-3 text-xs font-bold text-violet-700 hover:bg-violet-600 hover:text-white dark:bg-violet-500/20 dark:text-[#c4b5fd] dark:hover:bg-violet-600 dark:hover:text-white transition-all duration-200 shadow-sm"
          >
            <BookOpen className="h-3.5 w-3.5" />
            Read
          </Link>
          <Link
            to={`/book/${ebook.slug || ebook.id}`}
            className="liquid-glass flex items-center justify-center rounded-xl p-2 text-slate-700 hover:text-violet-700 dark:text-[#94a3b8] dark:hover:text-white transition-all duration-200"
            title="Book Details"
            aria-label="Book Details"
          >
            <Info className="h-3.5 w-3.5" />
          </Link>
          {onDelete && (
            <button
              type="button"
              onClick={handleDelete}
              disabled={isDeleting}
              className="flex items-center justify-center rounded-xl p-2 text-slate-400 hover:text-red-600 hover:bg-red-500/10 dark:hover:text-red-400 dark:hover:bg-red-500/20 transition-colors cursor-pointer"
              title="Delete E-Book"
              aria-label="Delete E-Book"
            >
              {isDeleting ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Trash2 className="h-3.5 w-3.5" />}
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

