import React, { useEffect, useState } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import {
  BookOpen,
  ArrowLeft,
  Calendar,
  FileText,
  HardDrive,
  Trash2,
  AlertTriangle,
  Loader2,
  ExternalLink,
  Sparkles,
  HelpCircle,
  Gamepad2,
  Play,
  QrCode,
  ArrowRight,
} from 'lucide-react';
import type { Ebook } from '../types/ebook';
import type { InteractiveElement } from '../types/interactive';
import { ebookService, formatBytes, formatDate } from '../services/ebookService';
import { getSavedInteractiveElements } from '../services/aiGeneratorService';
import { BookCover } from '../components/books/BookCover';

export const BookDetailsPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();

  const [ebook, setEbook] = useState<Ebook | null>(null);
  const [interactiveItems, setInteractiveItems] = useState<InteractiveElement[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  const [showDeleteModal, setShowDeleteModal] = useState<boolean>(false);
  const [deleting, setDeleting] = useState<boolean>(false);

  useEffect(() => {
    if (!id) return;
    setLoading(true);
    setError(null);

    ebookService
      .getEbook(id)
      .then((data) => {
        setEbook(data);
        // Check saved interactive items
        const local = getSavedInteractiveElements(data.slug || data.id);
        if (local.length > 0) {
          setInteractiveItems(local);
        } else if (data.interactive_elements && data.interactive_elements.length > 0) {
          setInteractiveItems(data.interactive_elements);
        }
      })
      .catch((err: any) => {
        setError(err.response?.data?.message || 'E-Book not found');
      })
      .finally(() => {
        setLoading(false);
      });
  }, [id]);

  const handleDelete = async () => {
    if (!ebook) return;
    setDeleting(true);
    try {
      await ebookService.deleteEbook(ebook.slug || ebook.id);
      navigate('/library');
    } catch {
      alert('Failed to delete e-book. Please try again.');
      setDeleting(false);
      setShowDeleteModal(false);
    }
  };

  if (loading) {
    return (
      <div className="flex min-h-[70vh] items-center justify-center text-slate-500 dark:text-[#94a3b8] gap-3">
        <Loader2 className="h-7 w-7 animate-spin text-violet-600 dark:text-[#a78bfa]" />
        <span className="text-sm font-mono-code">Loading book metadata...</span>
      </div>
    );
  }

  if (error || !ebook) {
    return (
      <div className="flex min-h-[70vh] flex-col items-center justify-center text-slate-900 dark:text-[#f8fafc] p-6 text-center">
        <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-red-500/10 text-red-500 dark:text-red-400 mb-4 border border-red-500/20">
          <AlertTriangle className="h-7 w-7" />
        </div>
        <h2 className="text-xl font-bold">E-Book Not Found</h2>
        <p className="mt-1 text-sm text-slate-500 dark:text-[#94a3b8] max-w-md">
          {error || "The requested book could not be found or has been removed."}
        </p>
        <Link
          to="/library"
          className="liquid-btn-primary mt-6 flex items-center gap-2 px-5 py-2.5 text-xs font-bold"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to Library
        </Link>
      </div>
    );
  }

  return (
    <div className="min-h-screen text-slate-900 dark:text-[#f8fafc] py-12 transition-colors duration-300">
      <div className="mx-auto max-w-5xl px-4 sm:px-6 lg:px-8 space-y-8">
        {/* Navigation Breadcrumb */}
        <div>
          <Link
            to="/library"
            className="inline-flex items-center gap-2 text-xs font-mono-code font-bold text-slate-500 hover:text-violet-600 dark:text-[#94a3b8] dark:hover:text-[#a78bfa] transition-colors"
          >
            <ArrowLeft className="h-4 w-4" />
            <span>← Back to Library</span>
          </Link>
        </div>

        {/* Book Container Card with Liquid Glass */}
        <div className="liquid-glass grid grid-cols-1 md:grid-cols-12 gap-8 lg:gap-12 rounded-3xl p-6 sm:p-10 shadow-2xl">
          {/* Left Column: Book Cover */}
          <div className="md:col-span-5 lg:col-span-4 flex flex-col items-center">
            <div className="w-full max-w-[280px]">
              <BookCover
                coverUrl={ebook.cover_url}
                pdfUrl={ebook.pdf_url}
                title={ebook.title}
                author={ebook.author}
              />
            </div>

            <Link
              to={`/read/${ebook.slug || ebook.id}`}
              className="liquid-btn-primary mt-6 flex w-full max-w-[280px] items-center justify-center gap-2 py-3.5 px-6 text-sm font-extrabold shadow-xl"
            >
              <BookOpen className="h-4 w-4" />
              Read Interactive Flipbook
            </Link>
          </div>

          {/* Right Column: Book Details */}
          <div className="md:col-span-7 lg:col-span-8 flex flex-col justify-between">
            <div className="space-y-6">
              <div>
                <div className="inline-flex items-center gap-1.5 liquid-pill text-xs py-0.5 px-3 mb-3">
                  <Sparkles className="h-3.5 w-3.5 text-violet-600 dark:text-[#a78bfa]" />
                  <span>PDF Interactive E-Book</span>
                </div>
                <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 dark:text-[#f8fafc] tracking-tight">
                  {ebook.title}
                </h1>
                <p className="mt-1 text-base text-slate-500 dark:text-[#94a3b8] font-medium">
                  {ebook.author ? `By ${ebook.author}` : 'Unknown Author'}
                </p>
              </div>

              {/* Description */}
              <div>
                <h3 className="text-xs font-bold uppercase tracking-wider font-mono-code text-slate-700 dark:text-[#f8fafc] mb-2">
                  Overview
                </h3>
                <p className="text-sm text-slate-600 dark:text-[#94a3b8] leading-relaxed whitespace-pre-line liquid-glass rounded-2xl p-4 shadow-inner">
                  {ebook.description || 'No description provided for this e-book.'}
                </p>
              </div>

              {/* Metadata Badges with JetBrains Mono */}
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 font-mono-code">
                <div className="liquid-glass flex items-center gap-2.5 rounded-2xl p-3.5 shadow-sm">
                  <FileText className="h-4 w-4 text-violet-600 dark:text-[#a78bfa] shrink-0" />
                  <div>
                    <p className="text-[10px] uppercase text-slate-400">Pages</p>
                    <p className="text-xs font-bold text-slate-900 dark:text-[#f8fafc]">
                      {ebook.total_pages ? `${ebook.total_pages} Pages` : 'Multi-Page'}
                    </p>
                  </div>
                </div>

                <div className="liquid-glass flex items-center gap-2.5 rounded-2xl p-3.5 shadow-sm">
                  <HardDrive className="h-4 w-4 text-violet-600 dark:text-[#a78bfa] shrink-0" />
                  <div>
                    <p className="text-[10px] uppercase text-slate-400">Size</p>
                    <p className="text-xs font-bold text-slate-900 dark:text-[#f8fafc]">{formatBytes(ebook.file_size)}</p>
                  </div>
                </div>

                <div className="liquid-glass flex items-center gap-2.5 rounded-2xl p-3.5 shadow-sm col-span-2 sm:col-span-1">
                  <Calendar className="h-4 w-4 text-violet-600 dark:text-[#a78bfa] shrink-0" />
                  <div>
                    <p className="text-[10px] uppercase text-slate-400">Uploaded</p>
                    <p className="text-xs font-bold text-slate-900 dark:text-[#f8fafc]">{formatDate(ebook.created_at)}</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Bottom Actions */}
            <div className="mt-8 flex items-center justify-between pt-6 border-t border-slate-200/50 dark:border-white/10">
              <a
                href={ebook.pdf_url}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-1.5 text-xs font-semibold text-slate-600 hover:text-violet-600 dark:text-[#94a3b8] dark:hover:text-[#a78bfa] transition-colors"
              >
                <ExternalLink className="h-3.5 w-3.5" />
                <span>Download / Direct PDF</span>
              </a>

              <button
                type="button"
                onClick={() => setShowDeleteModal(true)}
                className="flex items-center gap-1.5 rounded-xl px-3.5 py-1.5 text-xs font-bold text-red-600 hover:bg-red-500/10 dark:text-red-400 dark:hover:bg-red-500/20 dark:hover:text-red-300 transition-colors cursor-pointer"
              >
                <Trash2 className="h-3.5 w-3.5" />
                <span>Delete E-Book</span>
              </button>
            </div>
          </div>
        </div>

        {/* AI Interactive Learning Suite Activities Card */}
        {interactiveItems.length > 0 && (
          <div className="liquid-glass rounded-3xl p-6 sm:p-8 shadow-2xl border border-violet-500/30 space-y-6">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-gradient-to-tr from-violet-600 to-indigo-600 text-white shadow-lg shadow-violet-600/30">
                  <Sparkles className="h-5 w-5" />
                </div>
                <div>
                  <h3 className="text-base font-extrabold text-slate-900 dark:text-[#f8fafc]">
                    AI Interactive Learning Suite
                  </h3>
                  <p className="text-xs text-slate-500 dark:text-[#94a3b8]">
                    {interactiveItems.length} Gamified Learning Activities attached to this textbook
                  </p>
                </div>
              </div>

              <Link
                to={`/read/${ebook.slug || ebook.id}`}
                className="liquid-btn-primary px-4 py-2 text-xs font-extrabold flex items-center gap-1.5 shadow-md"
              >
                <span>Launch All</span>
                <ArrowRight className="h-3.5 w-3.5" />
              </Link>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              {interactiveItems.map((el) => {
                const isQuiz = el.type === 'quiz';
                const isFlash = el.type === 'flashcards';
                const isVid = el.type === 'video';

                return (
                  <Link
                    key={el.id}
                    to={`/read/${ebook.slug || ebook.id}`}
                    className="flex flex-col justify-between p-4 rounded-2xl liquid-glass border border-slate-200/60 dark:border-white/10 hover:border-violet-500 hover:scale-[1.02] transition-all group shadow-sm"
                  >
                    <div>
                      <div className="flex items-center justify-between mb-3">
                        <div
                          className={`flex h-9 w-9 items-center justify-center rounded-xl text-white ${
                            isQuiz
                              ? 'bg-violet-600 shadow-md shadow-violet-600/30'
                              : isFlash
                              ? 'bg-amber-500 shadow-md shadow-amber-500/30'
                              : isVid
                              ? 'bg-rose-600 shadow-md shadow-rose-600/30'
                              : 'bg-emerald-600 shadow-md shadow-emerald-600/30'
                          }`}
                        >
                          {isQuiz && <HelpCircle className="h-4 w-4" />}
                          {isFlash && <Gamepad2 className="h-4 w-4" />}
                          {isVid && <Play className="h-4 w-4 fill-white" />}
                          {el.type === 'qr_link' && <QrCode className="h-4 w-4" />}
                        </div>

                        <span className="liquid-pill text-[10px] py-0.2 px-2 font-mono-code font-bold">
                          Page {el.pageNumber}
                        </span>
                      </div>

                      <span className="text-[10px] uppercase font-mono-code font-bold text-violet-600 dark:text-[#a78bfa]">
                        {isFlash ? 'Speed Match Game' : el.type}
                      </span>
                      <h4 className="text-xs font-extrabold text-slate-900 dark:text-[#f8fafc] mt-0.5 line-clamp-2">
                        {el.title}
                      </h4>
                    </div>

                    <div className="pt-3 mt-3 border-t border-slate-200/40 dark:border-white/5 flex items-center justify-between text-[11px] font-bold text-violet-600 dark:text-[#a78bfa] group-hover:translate-x-1 transition-transform">
                      <span>Play in Flipbook</span>
                      <ArrowRight className="h-3.5 w-3.5" />
                    </div>
                  </Link>
                );
              })}
            </div>
          </div>
        )}
      </div>

      {/* Delete Confirmation Modal with Liquid Glass */}
      {showDeleteModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/60 backdrop-blur-md p-4">
          <div className="liquid-glass w-full max-w-md rounded-3xl p-6 sm:p-8 shadow-2xl">
            <div className="flex items-center gap-3 text-red-500 dark:text-red-400 mb-3">
              <AlertTriangle className="h-6 w-6" />
              <h3 className="text-lg font-bold text-slate-900 dark:text-[#f8fafc]">Delete E-Book</h3>
            </div>
            <p className="text-sm text-slate-600 dark:text-[#94a3b8] leading-relaxed">
              Are you sure you want to permanently delete <strong className="text-slate-900 dark:text-[#f8fafc]">"{ebook.title}"</strong>?
              This will remove both the database record and its PDF files from storage.
            </p>

            <div className="mt-6 flex items-center justify-end gap-3 font-mono-code text-xs">
              <button
                type="button"
                disabled={deleting}
                onClick={() => setShowDeleteModal(false)}
                className="liquid-btn-secondary px-4 py-2 font-semibold cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={deleting}
                onClick={handleDelete}
                className="flex items-center gap-2 rounded-xl bg-red-600 px-4 py-2 font-bold text-white hover:bg-red-500 disabled:opacity-50 transition-colors shadow-lg shadow-red-600/30 cursor-pointer"
              >
                {deleting ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Trash2 className="h-3.5 w-3.5" />}
                Confirm Delete
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
