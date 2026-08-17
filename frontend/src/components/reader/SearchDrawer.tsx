import React, { useState, useEffect } from 'react';
import { Search, X, Loader2, ArrowRight } from 'lucide-react';
import type * as pdfjsLib from 'pdfjs-dist';
import { searchPdfText, type PdfSearchResult } from '../../services/pdfService';

interface SearchDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  pdfDoc: pdfjsLib.PDFDocumentProxy | null;
  onSelectPage: (page: number) => void;
}

export const SearchDrawer: React.FC<SearchDrawerProps> = ({
  isOpen,
  onClose,
  pdfDoc,
  onSelectPage,
}) => {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<PdfSearchResult[]>([]);
  const [searching, setSearching] = useState(false);
  const [hasSearched, setHasSearched] = useState(false);

  useEffect(() => {
    if (!isOpen || !pdfDoc || !query.trim() || query.trim().length < 2) {
      setResults([]);
      setHasSearched(false);
      return;
    }

    const timer = setTimeout(async () => {
      setSearching(true);
      try {
        const matches = await searchPdfText(pdfDoc, query);
        setResults(matches);
        setHasSearched(true);
      } catch {
        setResults([]);
      } finally {
        setSearching(false);
      }
    }, 250);

    return () => clearTimeout(timer);
  }, [query, isOpen, pdfDoc]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-y-0 right-0 z-50 flex w-80 sm:w-96 flex-col liquid-nav shadow-2xl transition-all duration-300">
      {/* Search Header */}
      <div className="flex items-center justify-between border-b border-slate-200/50 dark:border-white/10 px-5 py-4">
        <h3 className="text-sm font-bold text-slate-900 dark:text-[#f8fafc]">Search Document</h3>
        <button
          onClick={onClose}
          className="rounded-xl p-2 text-slate-400 hover:bg-white/40 dark:hover:bg-white/10 dark:hover:text-white transition-colors"
          aria-label="Close search"
        >
          <X className="h-4 w-4" />
        </button>
      </div>

      {/* Search Input Bar */}
      <div className="p-4 border-b border-slate-200/50 dark:border-white/10">
        <div className="relative">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400 dark:text-[#94a3b8]" />
          <input
            type="text"
            autoFocus
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Type word or phrase to search..."
            className="liquid-input w-full pl-10 pr-9 py-2.5 text-xs font-medium placeholder-slate-400 dark:placeholder-slate-500"
          />
          {query && (
            <button
              onClick={() => setQuery('')}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-700 dark:hover:text-white p-0.5"
            >
              <X className="h-3.5 w-3.5" />
            </button>
          )}
        </div>
      </div>

      {/* Search Results List */}
      <div className="flex-1 overflow-y-auto p-4 space-y-2">
        {searching ? (
          <div className="py-12 flex flex-col items-center justify-center gap-2 text-slate-400 text-xs font-mono-code">
            <Loader2 className="h-6 w-6 animate-spin text-violet-600 dark:text-[#a78bfa]" />
            <span>Searching pages...</span>
          </div>
        ) : hasSearched && results.length === 0 ? (
          <div className="py-12 text-center text-xs text-slate-500 dark:text-[#94a3b8]">
            <p>No matches found for "{query}".</p>
            <p className="mt-1 text-[11px] opacity-70">Try searching for a different keyword.</p>
          </div>
        ) : (
          results.map((res, idx) => (
            <button
              key={idx}
              onClick={() => {
                onSelectPage(res.pageNumber);
                onClose();
              }}
              className="w-full text-left p-3.5 rounded-2xl liquid-glass hover:scale-[1.01] transition-all space-y-1.5 shadow-sm group cursor-pointer"
            >
              <div className="flex items-center justify-between">
                <span className="liquid-pill text-[10px] py-0.5 px-2">
                  Page {res.pageNumber}
                </span>
                <span className="text-[11px] font-mono-code text-violet-600 dark:text-[#a78bfa] font-bold flex items-center gap-1 group-hover:translate-x-0.5 transition-transform">
                  {res.matchCount} {res.matchCount === 1 ? 'match' : 'matches'}
                  <ArrowRight className="h-3 w-3" />
                </span>
              </div>
              <p className="text-xs text-slate-600 dark:text-[#94a3b8] leading-relaxed line-clamp-3">
                {res.snippet}
              </p>
            </button>
          ))
        )}
      </div>
    </div>
  );
};
