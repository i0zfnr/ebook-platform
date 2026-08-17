import React, { useEffect, useState, useMemo } from 'react';
import { Search, X, SlidersHorizontal, Sparkles } from 'lucide-react';
import type { Ebook } from '../types/ebook';
import { ebookService } from '../services/ebookService';
import { BookGrid } from '../components/books/BookGrid';

export const LibraryPage: React.FC = () => {
  const [ebooks, setEbooks] = useState<Ebook[]>([]);
  const [searchTerm, setSearchTerm] = useState<string>('');
  const [sortBy, setSortBy] = useState<'newest' | 'oldest' | 'title'>('newest');
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  const fetchBooks = async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await ebookService.getEbooks();
      setEbooks(data);
    } catch (err: any) {
      setError(
        err.response?.data?.message ||
        'Could not connect to the backend server. Please make sure Laravel is running.'
      );
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchBooks();
  }, []);

  // Filter & Sort books locally for instantaneous UI responsiveness
  const filteredAndSortedBooks = useMemo(() => {
    let result = [...ebooks];

    if (searchTerm.trim()) {
      const query = searchTerm.toLowerCase().trim();
      result = result.filter(
        (b) =>
          b.title.toLowerCase().includes(query) ||
          (b.author && b.author.toLowerCase().includes(query)) ||
          (b.description && b.description.toLowerCase().includes(query))
      );
    }

    if (sortBy === 'newest') {
      result.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
    } else if (sortBy === 'oldest') {
      result.sort((a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime());
    } else if (sortBy === 'title') {
      result.sort((a, b) => a.title.localeCompare(b.title));
    }

    return result;
  }, [ebooks, searchTerm, sortBy]);

  return (
    <div className="min-h-screen text-slate-900 dark:text-[#f8fafc] py-12 transition-colors duration-300">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        {/* Page Header */}
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 pb-8 border-b border-slate-200/50 dark:border-white/10">
          <div>
            {/* VisionOS Style Liquid Pill */}
            <div className="inline-flex items-center gap-1.5 liquid-pill mb-3">
              <Sparkles className="h-3.5 w-3.5 text-violet-600 dark:text-[#a78bfa]" />
              <span>Digital Catalog & Library</span>
            </div>
            <h1 className="text-3xl sm:text-4xl font-extrabold text-slate-900 dark:text-[#f8fafc] tracking-tight">
              E-Book Library
            </h1>
            <p className="mt-1.5 text-sm text-slate-600 dark:text-[#94a3b8]">
              Browse and read all interactive flipbooks in your personal library collection.
            </p>
          </div>

          {/* Book count badge */}
          <div className="flex items-center gap-2">
            <span className="liquid-glass rounded-2xl px-4 py-2 text-xs font-mono-code font-bold text-slate-700 dark:text-[#f8fafc] shadow-sm">
              <span className="text-violet-600 dark:text-[#a78bfa]">{filteredAndSortedBooks.length}</span> {filteredAndSortedBooks.length === 1 ? 'Book' : 'Books'} Available
            </span>
          </div>
        </div>

        {/* Filter and Search Bar */}
        <div className="mt-8 flex flex-col sm:flex-row items-center justify-between gap-4">
          {/* Liquid Search Input */}
          <div className="relative w-full sm:max-w-md">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400 dark:text-[#94a3b8]" />
            <input
              type="text"
              placeholder="Search by title, author, or keywords..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="liquid-input w-full pl-11 pr-10 py-3 text-sm font-medium placeholder-slate-400 dark:placeholder-slate-500"
            />
            {searchTerm && (
              <button
                onClick={() => setSearchTerm('')}
                className="absolute right-3.5 top-1/2 -translate-y-1/2 rounded-full p-1 text-slate-400 hover:bg-white/40 dark:hover:bg-white/10 dark:hover:text-white"
                aria-label="Clear search"
              >
                <X className="h-3.5 w-3.5" />
              </button>
            )}
          </div>

          {/* Sort Selector with Liquid Glass Surface */}
          <div className="flex items-center gap-2 w-full sm:w-auto justify-end">
            <div className="liquid-glass flex items-center gap-2 rounded-2xl px-4 py-2.5 text-xs font-medium text-slate-700 dark:text-[#94a3b8] shadow-sm">
              <SlidersHorizontal className="h-3.5 w-3.5 text-violet-600 dark:text-[#a78bfa]" />
              <span className="font-mono-code font-bold">Sort:</span>
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value as 'newest' | 'oldest' | 'title')}
                className="bg-transparent text-xs font-bold text-slate-900 dark:text-[#f8fafc] focus:outline-none cursor-pointer"
              >
                <option value="newest" className="bg-white text-slate-900 dark:bg-[#171225] dark:text-[#f8fafc]">Newest First</option>
                <option value="oldest" className="bg-white text-slate-900 dark:bg-[#171225] dark:text-[#f8fafc]">Oldest First</option>
                <option value="title" className="bg-white text-slate-900 dark:bg-[#171225] dark:text-[#f8fafc]">Title (A-Z)</option>
              </select>
            </div>
          </div>
        </div>

        {/* Book Grid */}
        <div className="mt-10">
          <BookGrid
            ebooks={filteredAndSortedBooks}
            loading={loading}
            error={error}
            onRetry={fetchBooks}
            emptyTitle={searchTerm ? 'No books match your search' : 'No e-books uploaded yet'}
            emptyDescription={
              searchTerm
                ? `We couldn't find any books matching "${searchTerm}". Try a different keyword.`
                : 'Upload your first PDF to begin building your interactive digital library.'
            }
          />
        </div>
      </div>
    </div>
  );
};
