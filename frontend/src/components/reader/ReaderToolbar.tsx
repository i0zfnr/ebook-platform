import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import {
  ArrowLeft,
  ChevronLeft,
  ChevronRight,
  Maximize,
  Minimize,
  ZoomIn,
  ZoomOut,
  RotateCcw,
  LayoutGrid,
  FileText,
  Columns2,
  List,
  Search,
  Bookmark,
  BookmarkCheck,
  Sparkles,
  Bot,
} from 'lucide-react';
import { ThemeToggle } from '../common/ThemeToggle';
import { BrandLogo } from '../common/BrandLogo';

interface ReaderToolbarProps {
  title: string;
  currentPage: number;
  totalPages: number;
  onPrevPage: () => void;
  onNextPage: () => void;
  onPageChange: (page: number) => void;
  zoom?: number;
  onZoomIn?: () => void;
  onZoomOut?: () => void;
  onResetZoom?: () => void;
  onToggleFullscreen: () => void;
  isFullscreen: boolean;
  onToggleThumbnails: () => void;
  showThumbnails: boolean;
  onToggleToc?: () => void;
  showToc?: boolean;
  onToggleSearch?: () => void;
  showSearch?: boolean;
  isBookmarked?: boolean;
  onToggleBookmark?: () => void;
  spreadMode?: 'auto' | 'single' | 'double';
  onToggleSpreadMode?: () => void;
  bookIdOrSlug?: string | number;
  onToggleAiHub?: () => void;
  showAiHub?: boolean;
  aiCount?: number;
  onToggleAiChat?: () => void;
  showAiChat?: boolean;
}

export const ReaderToolbar: React.FC<ReaderToolbarProps> = ({
  title,
  currentPage,
  totalPages,
  onPrevPage,
  onNextPage,
  onPageChange,
  zoom = 1,
  onZoomIn,
  onZoomOut,
  onResetZoom,
  onToggleFullscreen,
  isFullscreen,
  onToggleThumbnails,
  showThumbnails,
  onToggleToc,
  showToc = false,
  onToggleSearch,
  showSearch = false,
  isBookmarked = false,
  onToggleBookmark,
  spreadMode = 'auto',
  onToggleSpreadMode,
  bookIdOrSlug,
  onToggleAiHub,
  showAiHub = false,
  aiCount = 0,
  onToggleAiChat,
  showAiChat = false,
}) => {
  const [inputPage, setInputPage] = useState<string>(String(currentPage));

  useEffect(() => {
    setInputPage(String(currentPage));
  }, [currentPage]);

  const handleInputSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const pageNum = parseInt(inputPage, 10);
    if (!isNaN(pageNum) && pageNum >= 1 && pageNum <= totalPages) {
      onPageChange(pageNum);
    } else {
      setInputPage(String(currentPage));
    }
  };

  const zoomPercentage = Math.round(zoom * 100);

  return (
    <div className="z-30 flex flex-wrap items-center justify-between gap-3 px-4 py-2.5 liquid-nav text-slate-700 dark:text-[#94a3b8] select-none transition-colors duration-200 font-sans">
      {/* Left: Back Navigation & Title */}
      <div className="flex items-center gap-3 min-w-0">
        <Link
          to={bookIdOrSlug ? `/book/${bookIdOrSlug}` : '/library'}
          className="liquid-btn-secondary flex items-center gap-1.5 px-3 py-1.5 text-xs font-mono-code font-bold shadow-sm"
          title="Back"
        >
          <ArrowLeft className="h-3.5 w-3.5" />
          <span className="hidden sm:inline">Back</span>
        </Link>

        <div className="flex items-center gap-2 truncate">
          <BrandLogo size="sm" className="hidden sm:flex" />
          <h1 className="truncate text-sm font-bold text-slate-900 dark:text-[#f8fafc]" title={title}>
            {title}
          </h1>
        </div>
      </div>

      {/* Center: Page Controls */}
      <div className="flex items-center gap-2 font-mono-code">
        <button
          onClick={onPrevPage}
          disabled={currentPage <= 1}
          className="liquid-glass flex h-8 w-8 items-center justify-center rounded-xl text-slate-700 dark:text-[#f8fafc] disabled:opacity-30 disabled:pointer-events-none transition-colors cursor-pointer"
          title="Previous Page (Left Arrow)"
          aria-label="Previous Page"
        >
          <ChevronLeft className="h-4 w-4" />
        </button>

        {/* Direct page jump input */}
        <form onSubmit={handleInputSubmit} className="flex items-center gap-1.5 text-xs font-medium">
          <input
            type="text"
            value={inputPage}
            onChange={(e) => setInputPage(e.target.value)}
            onBlur={handleInputSubmit}
            className="liquid-input h-8 w-12 text-center text-xs font-bold text-slate-900 dark:text-[#f8fafc]"
            aria-label="Page number"
          />
          <span className="text-slate-400 dark:text-slate-500 font-normal">/</span>
          <span className="text-slate-600 dark:text-[#94a3b8] font-bold">{totalPages || '--'}</span>
        </form>

        <button
          onClick={onNextPage}
          disabled={currentPage >= totalPages}
          className="liquid-glass flex h-8 w-8 items-center justify-center rounded-xl text-slate-700 dark:text-[#f8fafc] disabled:opacity-30 disabled:pointer-events-none transition-colors cursor-pointer"
          title="Next Page (Right Arrow)"
          aria-label="Next Page"
        >
          <ChevronRight className="h-4 w-4" />
        </button>
      </div>

      {/* Right: Tools & AI Learning Suite */}
      <div className="flex items-center gap-1.5">
        {/* Prominent AI Learning Suite Button */}
        {onToggleAiHub && (
          <button
            onClick={onToggleAiHub}
            className={`flex h-8 items-center gap-1.5 px-3 rounded-xl transition-all cursor-pointer border ${
              showAiHub
                ? 'bg-gradient-to-r from-violet-600 to-indigo-600 text-white font-bold shadow-lg shadow-violet-600/40 border-violet-400/50'
                : 'liquid-glass bg-violet-500/10 text-violet-700 dark:text-[#c4b5fd] border-violet-500/30 hover:bg-violet-600 hover:text-white shadow-sm'
            }`}
            title="Open AI Interactive Suite (Quizzes, Games, Videos)"
          >
            <Sparkles className="h-3.5 w-3.5 text-amber-400 animate-pulse" />
            <span className="text-xs font-bold font-mono-code hidden sm:inline">AI Suite</span>
            {aiCount > 0 && (
              <span className="rounded-full bg-violet-600 text-white dark:bg-white dark:text-violet-900 text-[10px] px-1.5 py-0.2 font-mono-code font-bold">
                {aiCount}
              </span>
            )}
          </button>
        )}

        {/* AI Tutor Chat Companion Button */}
        {onToggleAiChat && (
          <button
            onClick={onToggleAiChat}
            className={`flex h-8 items-center gap-1.5 px-3 rounded-xl transition-all cursor-pointer border ${
              showAiChat
                ? 'bg-gradient-to-r from-purple-600 to-pink-600 text-white font-bold shadow-lg shadow-purple-600/40 border-purple-400/50'
                : 'liquid-glass bg-purple-500/10 text-purple-700 dark:text-[#f472b6] border-purple-500/30 hover:bg-purple-600 hover:text-white shadow-sm'
            }`}
            title="Chat with Aura AI Tutor about this page"
          >
            <Bot className="h-3.5 w-3.5" />
            <span className="text-xs font-bold font-mono-code hidden sm:inline">AI Tutor</span>
          </button>
        )}

        {/* Table of Contents & Bookmarks Drawer Toggle */}
        {onToggleToc && (
          <button
            onClick={onToggleToc}
            className={`flex h-8 items-center gap-1.5 px-2.5 rounded-xl transition-all cursor-pointer ${
              showToc
                ? 'bg-violet-600 text-white shadow-lg shadow-violet-600/30 font-bold'
                : 'liquid-glass text-slate-700 hover:text-violet-600 dark:text-[#94a3b8] dark:hover:text-white'
            }`}
            title="Table of Contents & Bookmarks"
          >
            <List className="h-4 w-4" />
            <span className="hidden md:inline text-xs font-mono-code">Index</span>
          </button>
        )}

        {/* Full-Text Search Drawer Toggle */}
        {onToggleSearch && (
          <button
            onClick={onToggleSearch}
            className={`flex h-8 w-8 items-center justify-center rounded-xl transition-all cursor-pointer ${
              showSearch
                ? 'bg-violet-600 text-white shadow-lg shadow-violet-600/30'
                : 'liquid-glass text-slate-700 hover:text-violet-600 dark:text-[#94a3b8] dark:hover:text-white'
            }`}
            title="Search inside book"
          >
            <Search className="h-4 w-4" />
          </button>
        )}

        {/* Quick Bookmark Toggle */}
        {onToggleBookmark && (
          <button
            onClick={onToggleBookmark}
            className={`flex h-8 w-8 items-center justify-center rounded-xl transition-all cursor-pointer ${
              isBookmarked
                ? 'bg-amber-500/20 text-amber-500 border border-amber-500/40 shadow-sm'
                : 'liquid-glass text-slate-700 hover:text-violet-600 dark:text-[#94a3b8] dark:hover:text-white'
            }`}
            title={isBookmarked ? 'Remove bookmark' : 'Bookmark this page'}
          >
            {isBookmarked ? <BookmarkCheck className="h-4 w-4" /> : <Bookmark className="h-4 w-4" />}
          </button>
        )}

        {/* Spread Mode Toggle */}
        {onToggleSpreadMode && (
          <button
            onClick={onToggleSpreadMode}
            className="liquid-glass hidden lg:flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-mono-code font-bold text-slate-700 dark:text-[#94a3b8] hover:text-violet-600 dark:hover:text-white transition-colors cursor-pointer"
            title={`View: ${spreadMode === 'single' ? 'Single Page' : spreadMode === 'double' ? 'Two-Page Spread' : 'Auto'}`}
          >
            {spreadMode === 'single' ? (
              <>
                <FileText className="h-3.5 w-3.5 text-violet-600 dark:text-[#a78bfa]" />
                <span>Single</span>
              </>
            ) : spreadMode === 'double' ? (
              <>
                <Columns2 className="h-3.5 w-3.5 text-violet-600 dark:text-[#a78bfa]" />
                <span>2-Page</span>
              </>
            ) : (
              <>
                <Columns2 className="h-3.5 w-3.5 text-slate-500 dark:text-[#94a3b8]" />
                <span>Auto</span>
              </>
            )}
          </button>
        )}

        {/* Zoom Controls */}
        <div className="liquid-glass flex items-center rounded-xl p-0.5 font-mono-code">
          {onZoomOut && (
            <button
              onClick={onZoomOut}
              disabled={zoom <= 0.6}
              className="flex h-7 w-7 items-center justify-center rounded-lg text-slate-700 hover:bg-white/40 dark:text-[#94a3b8] dark:hover:bg-white/10 dark:hover:text-white disabled:opacity-30 transition-colors cursor-pointer"
              title="Zoom Out"
              aria-label="Zoom Out"
            >
              <ZoomOut className="h-3.5 w-3.5" />
            </button>
          )}

          {onResetZoom && (
            <button
              onClick={onResetZoom}
              className="px-2 text-[11px] font-bold text-slate-800 hover:text-violet-600 dark:text-[#94a3b8] dark:hover:text-[#a78bfa] transition-colors cursor-pointer"
              title="Reset Zoom (100%)"
            >
              {zoomPercentage}%
            </button>
          )}

          {onZoomIn && (
            <button
              onClick={onZoomIn}
              disabled={zoom >= 3.5}
              className="flex h-7 w-7 items-center justify-center rounded-lg text-slate-700 hover:bg-white/40 dark:text-[#94a3b8] dark:hover:bg-white/10 dark:hover:text-white disabled:opacity-30 transition-colors cursor-pointer"
              title="Zoom In (up to 350%)"
              aria-label="Zoom In"
            >
              <ZoomIn className="h-3.5 w-3.5" />
            </button>
          )}
        </div>

        {onResetZoom && zoom !== 1 && (
          <button
            onClick={onResetZoom}
            className="liquid-glass hidden sm:flex h-8 w-8 items-center justify-center rounded-xl text-slate-600 hover:text-violet-600 dark:text-[#94a3b8] dark:hover:text-white transition-colors cursor-pointer"
            title="Reset Zoom"
            aria-label="Reset Zoom"
          >
            <RotateCcw className="h-3.5 w-3.5" />
          </button>
        )}

        <button
          onClick={onToggleThumbnails}
          className={`flex h-8 w-8 items-center justify-center rounded-xl transition-all cursor-pointer ${
            showThumbnails
              ? 'bg-violet-600 text-white shadow-lg shadow-violet-600/30'
              : 'liquid-glass text-slate-700 hover:text-violet-600 dark:text-[#94a3b8] dark:hover:text-white'
          }`}
          title="Toggle Page Thumbnails"
          aria-label="Toggle Page Thumbnails"
        >
          <LayoutGrid className="h-4 w-4" />
        </button>

        {/* Theme Toggle */}
        <ThemeToggle />

        <button
          onClick={onToggleFullscreen}
          className="liquid-glass flex h-8 w-8 items-center justify-center rounded-xl text-slate-700 hover:text-violet-600 dark:text-[#94a3b8] dark:hover:text-white transition-colors cursor-pointer"
          title={isFullscreen ? 'Exit Fullscreen' : 'Fullscreen'}
          aria-label="Toggle Fullscreen"
        >
          {isFullscreen ? <Minimize className="h-4 w-4" /> : <Maximize className="h-4 w-4" />}
        </button>
      </div>
    </div>
  );
};
