import React, { useEffect, useState, useRef } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import type * as pdfjsLib from 'pdfjs-dist';
import { ArrowLeft, AlertCircle, Loader2, Gamepad2, UploadCloud, Trash2 } from 'lucide-react';
import type { Ebook } from '../types/ebook';
import type { InteractiveElement } from '../types/interactive';
import { ebookService } from '../services/ebookService';
import { localBookStorage } from '../services/localBookStorage';
import {
  loadPdfDocument,
  cacheUploadedPdf,
  extractPdfOutline,
  type PdfOutlineItem,
  saveReadingProgress,
  getReadingProgress,
  getBookmarks,
  toggleBookmark,
  type BookmarkItem,
} from '../services/pdfService';
import {
  generateAIInteractiveElements,
  getSavedInteractiveElements,
} from '../services/aiGeneratorService';
import { ReaderToolbar } from '../components/reader/ReaderToolbar';
import { FlipBook } from '../components/reader/FlipBook';
import { ThumbnailSidebar } from '../components/reader/ThumbnailSidebar';
import { TableOfContentsDrawer } from '../components/reader/TableOfContentsDrawer';
import { SearchDrawer } from '../components/reader/SearchDrawer';
import { AiLearningHubDrawer } from '../components/reader/AiLearningHubDrawer';
import { AiChatDrawer } from '../components/reader/AiChatDrawer';
import { InteractivePageHotspots } from '../components/reader/InteractivePageHotspots';
import { InteractiveOverlayModal } from '../components/interactive/InteractiveOverlayModal';

export const ReaderPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const readerContainerRef = useRef<HTMLDivElement | null>(null);
  const recoveryInputRef = useRef<HTMLInputElement | null>(null);

  const [ebook, setEbook] = useState<Ebook | null>(null);
  const [pdfDoc, setPdfDoc] = useState<pdfjsLib.PDFDocumentProxy | null>(null);
  const [totalPages, setTotalPages] = useState<number>(0);
  const [currentPage, setCurrentPage] = useState<number>(1);

  const [outline, setOutline] = useState<PdfOutlineItem[]>([]);
  const [bookmarks, setBookmarks] = useState<BookmarkItem[]>([]);
  const [interactiveElements, setInteractiveElements] = useState<InteractiveElement[]>([]);
  const [activeModalElement, setActiveModalElement] = useState<InteractiveElement | null>(null);

  const [loading, setLoading] = useState<boolean>(true);
  const [loadingProgressText, setLoadingProgressText] = useState<string>('Fetching e-book details...');
  const [error, setError] = useState<string | null>(null);

  const [zoom, setZoom] = useState<number>(1);
  const [isFullscreen, setIsFullscreen] = useState<boolean>(false);
  const [showThumbnails, setShowThumbnails] = useState<boolean>(false);
  const [showToc, setShowToc] = useState<boolean>(false);
  const [showSearch, setShowSearch] = useState<boolean>(false);
  const [showAiHub, setShowAiHub] = useState<boolean>(false);
  const [showAiChat, setShowAiChat] = useState<boolean>(false);
  const [spreadMode, setSpreadMode] = useState<'auto' | 'single' | 'double'>('auto');

  // 1. Fetch Ebook details, load PDF, resume saved page, extract outline & load AI interactive elements
  useEffect(() => {
    if (!id) return;
    let isCancelled = false;

    setLoading(true);
    setError(null);
    setLoadingProgressText('Fetching e-book details...');

    ebookService
      .getEbook(id)
      .then(async (book) => {
        if (isCancelled) return;
        setEbook(book);
        setLoadingProgressText('Loading PDF document...');

        try {
          const doc = await loadPdfDocument(book.pdf_url, book.slug || book.id);
          if (isCancelled) return;
          setPdfDoc(doc);
          setTotalPages(doc.numPages);

          // Resume last reading position if available
          const savedProgress = getReadingProgress(book.slug || book.id);
          const initialPage = savedProgress && savedProgress.currentPage <= doc.numPages
            ? savedProgress.currentPage
            : 1;
          setCurrentPage(initialPage);

          // Load bookmarks
          setBookmarks(getBookmarks(book.slug || book.id));

          // Load or AI-generate interactive quizzes/videos/games
          const existingInteractive = getSavedInteractiveElements(book.slug || book.id);
          if (existingInteractive.length > 0) {
            setInteractiveElements(existingInteractive);
          } else if (book.interactive_elements && book.interactive_elements.length > 0) {
            setInteractiveElements(book.interactive_elements);
          } else {
            generateAIInteractiveElements(doc, book.title, book.slug || book.id, book.interactive_elements)
              .then((generated) => {
                if (!isCancelled) setInteractiveElements(generated);
              })
              .catch(() => {});
          }

          // Extract outline chapters asynchronously
          extractPdfOutline(doc).then((extractedOutline) => {
            if (!isCancelled) setOutline(extractedOutline);
          }).catch(() => {});

          setLoading(false);
        } catch {
          if (isCancelled) return;
          setError(
            'Failed to parse PDF document. The file might be corrupted or cross-origin blocked.'
          );
          setLoading(false);
        }
      })
      .catch((err: any) => {
        if (isCancelled) return;
        setError(err.response?.data?.message || 'E-Book not found');
        setLoading(false);
      });

    return () => {
      isCancelled = true;
    };
  }, [id]);

  // 2. Persist reading progress on page flip
  useEffect(() => {
    if (ebook && currentPage > 0 && totalPages > 0) {
      saveReadingProgress(
        ebook.slug || ebook.id,
        currentPage,
        totalPages,
        ebook.title,
        ebook.cover_url,
        ebook.slug
      );
    }
  }, [currentPage, totalPages, ebook]);

  // 3. Sync fullscreen state changes
  useEffect(() => {
    const handleFullscreenChange = () => {
      setIsFullscreen(!!document.fullscreenElement);
    };
    document.addEventListener('fullscreenchange', handleFullscreenChange);
    return () => {
      document.removeEventListener('fullscreenchange', handleFullscreenChange);
    };
  }, []);

  // 4. Keyboard Shortcuts: Arrow keys, F, Esc, B, +, -
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (
        document.activeElement?.tagName === 'INPUT' ||
        document.activeElement?.tagName === 'TEXTAREA' ||
        activeModalElement !== null
      ) {
        return;
      }

      if (e.key === 'ArrowRight' || e.key === 'PageDown' || e.key === ' ') {
        e.preventDefault();
        handleNextPage();
      } else if (e.key === 'ArrowLeft' || e.key === 'PageUp') {
        e.preventDefault();
        handlePrevPage();
      } else if (e.key === 'f' || e.key === 'F') {
        e.preventDefault();
        handleToggleFullscreen();
      } else if (e.key === 'b' || e.key === 'B') {
        e.preventDefault();
        handleToggleBookmark();
      } else if (e.key === '+' || e.key === '=') {
        e.preventDefault();
        handleZoomIn();
      } else if (e.key === '-') {
        e.preventDefault();
        handleZoomOut();
      } else if (e.key === 'Escape') {
        setShowThumbnails(false);
        setShowToc(false);
        setShowSearch(false);
        setShowAiHub(false);
        setActiveModalElement(null);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [currentPage, totalPages, isFullscreen, zoom, activeModalElement, spreadMode]);

  // Navigation handlers
  const handlePrevPage = () => {
    const step = spreadMode === 'single' ? 1 : 2;
    setCurrentPage((prev) => Math.max(1, prev - step));
  };

  const handleNextPage = () => {
    const step = spreadMode === 'single' ? 1 : 2;
    setCurrentPage((prev) => Math.min(totalPages, prev + step));
  };

  const handleZoomIn = () => {
    setZoom((prev) => Math.min(2.5, parseFloat((prev + 0.15).toFixed(2))));
  };

  const handleZoomOut = () => {
    setZoom((prev) => Math.max(0.5, parseFloat((prev - 0.15).toFixed(2))));
  };

  const handleZoomReset = () => {
    setZoom(1);
  };

  const handleToggleFullscreen = () => {
    if (!readerContainerRef.current) return;
    if (!document.fullscreenElement) {
      readerContainerRef.current.requestFullscreen().catch(() => {});
    } else {
      document.exitFullscreen().catch(() => {});
    }
  };

  const handleToggleBookmark = () => {
    if (!ebook) return;
    const updated = toggleBookmark(ebook.slug || ebook.id, currentPage);
    setBookmarks(updated);
  };

  const handleToggleSpreadMode = () => {
    setSpreadMode((prev) => {
      if (prev === 'auto') return 'single';
      if (prev === 'single') return 'double';
      return 'auto';
    });
  };

  const isCurrentBookmarked = bookmarks.some((b) => b.pageNumber === currentPage);

  // Loading Screen
  if (loading) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center bg-slate-900 text-white space-y-4">
        <div className="relative flex h-16 w-16 items-center justify-center">
          <Loader2 className="h-12 w-12 animate-spin text-violet-500" />
          <div className="absolute h-8 w-8 rounded-full bg-violet-600/30 blur-md" />
        </div>
        <p className="text-sm font-mono-code tracking-wide text-slate-400 animate-pulse">
          {loadingProgressText}
        </p>
      </div>
    );
  }

  // Handler to recover/attach local PDF file
  const handleAttachPdfFile = async (file: File) => {
    if (!file) return;
    setLoading(true);
    setError(null);
    setLoadingProgressText('Attaching and parsing PDF file...');

    try {
      if (id) {
        cacheUploadedPdf(id, file);
      }
      if (ebook?.slug) {
        cacheUploadedPdf(ebook.slug, file);
      }

      if (ebook) {
        await localBookStorage.saveBook(ebook, file);
      }

      const doc = await loadPdfDocument(ebook?.pdf_url || '', id);
      setPdfDoc(doc);
      setTotalPages(doc.numPages);
      setLoading(false);
    } catch (err: any) {
      setError(err?.message || 'Failed to load PDF file.');
      setLoading(false);
    }
  };

  // Handler to delete corrupted book
  const handleDeleteCorruptedBook = async () => {
    if (!id) return;
    if (confirm('Delete this e-book from your library?')) {
      await ebookService.deleteEbook(id);
      navigate('/library');
    }
  };

  // Error Screen with Recovery Options
  if (error || !ebook || !pdfDoc) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center bg-slate-950 px-4 text-center">
        <div className="glass-card max-w-md p-8 border-rose-500/30 space-y-5">
          <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-rose-500/10 text-rose-400">
            <AlertCircle className="h-7 w-7" />
          </div>
          <div>
            <h2 className="text-xl font-bold text-white">Cannot Open E-Book</h2>
            <p className="text-xs text-slate-400 mt-1">{error || 'PDF document is not cached or reachable.'}</p>
          </div>

          <div className="flex flex-col gap-2.5 pt-2">
            <input
              ref={recoveryInputRef}
              type="file"
              accept="application/pdf"
              className="hidden"
              onChange={(e) => {
                if (e.target.files?.[0]) handleAttachPdfFile(e.target.files[0]);
              }}
            />

            <button
              type="button"
              onClick={() => recoveryInputRef.current?.click()}
              className="inline-flex items-center justify-center gap-2 rounded-xl bg-violet-600 px-5 py-2.5 text-xs font-bold text-white hover:bg-violet-500 transition-all cursor-pointer shadow-lg shadow-violet-600/30"
            >
              <UploadCloud className="h-4 w-4" />
              <span>Attach / Pick PDF File to Read</span>
            </button>

            <div className="flex items-center justify-center gap-2 pt-1">
              <Link
                to="/library"
                className="inline-flex items-center gap-1.5 rounded-xl border border-white/10 bg-white/5 px-4 py-2 text-xs font-bold text-slate-300 hover:bg-white/10 hover:text-white transition-colors cursor-pointer"
              >
                <ArrowLeft className="h-3.5 w-3.5" />
                <span>Library</span>
              </Link>

              <button
                type="button"
                onClick={handleDeleteCorruptedBook}
                className="inline-flex items-center gap-1.5 rounded-xl border border-rose-500/20 bg-rose-500/10 px-4 py-2 text-xs font-bold text-rose-400 hover:bg-rose-500/20 transition-colors cursor-pointer"
              >
                <Trash2 className="h-3.5 w-3.5" />
                <span>Delete Book</span>
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div
      ref={readerContainerRef}
      className="relative flex h-screen w-screen flex-col overflow-hidden bg-slate-950 select-none"
    >
      {/* Top Floating Glass Toolbar */}
      <ReaderToolbar
        title={ebook.title}
        currentPage={currentPage}
        totalPages={totalPages}
        zoom={zoom}
        isFullscreen={isFullscreen}
        isBookmarked={isCurrentBookmarked}
        aiCount={interactiveElements.length}
        showAiHub={showAiHub}
        showThumbnails={showThumbnails}
        showToc={showToc}
        showSearch={showSearch}
        onPrevPage={handlePrevPage}
        onNextPage={handleNextPage}
        onPageChange={(page: number) => setCurrentPage(page)}
        onZoomIn={handleZoomIn}
        onZoomOut={handleZoomOut}
        onResetZoom={handleZoomReset}
        onToggleFullscreen={handleToggleFullscreen}
        onToggleBookmark={handleToggleBookmark}
        onToggleThumbnails={() => {
          setShowThumbnails(!showThumbnails);
          setShowToc(false);
          setShowSearch(false);
          setShowAiHub(false);
        }}
        onToggleToc={() => {
          setShowToc(!showToc);
          setShowThumbnails(false);
          setShowSearch(false);
          setShowAiHub(false);
        }}
        onToggleSearch={() => {
          setShowSearch(!showSearch);
          setShowThumbnails(false);
          setShowToc(false);
          setShowAiHub(false);
        }}
        onToggleAiHub={() => {
          setShowAiHub(!showAiHub);
          setShowThumbnails(false);
          setShowToc(false);
          setShowSearch(false);
          setShowAiChat(false);
        }}
        onToggleAiChat={() => {
          setShowAiChat(!showAiChat);
          setShowThumbnails(false);
          setShowToc(false);
          setShowSearch(false);
          setShowAiHub(false);
        }}
        showAiChat={showAiChat}
        spreadMode={spreadMode}
        onToggleSpreadMode={handleToggleSpreadMode}
        bookIdOrSlug={ebook.slug || ebook.id}
      />

      {/* Main Reading Stage */}
      <div className="relative flex flex-1 items-center justify-center overflow-auto bg-slate-200/60 dark:bg-gradient-to-b dark:from-slate-950 dark:via-slate-900/40 dark:to-slate-950 transition-colors duration-200">
        {pdfDoc && (
          <FlipBook
            pdfDoc={pdfDoc}
            totalPages={totalPages}
            currentPage={currentPage}
            onPageFlip={(page) => setCurrentPage(page)}
            zoom={zoom}
            spreadMode={spreadMode}
          />
        )}

        {/* Floating AI Interactive Page Hotspots (contextual to current flipped page) */}
        <InteractivePageHotspots
          currentPage={currentPage}
          interactiveElements={interactiveElements}
          onOpenElement={(el) => setActiveModalElement(el)}
        />

        {/* Persistent Floating AI Learning Hub Launcher (Always visible on any page) */}
        {interactiveElements.length > 0 && !showAiHub && (
          <button
            type="button"
            onClick={() => setShowAiHub(true)}
            className="fixed bottom-6 right-6 z-30 flex items-center gap-2.5 px-4 py-2.5 rounded-2xl bg-gradient-to-r from-violet-600 via-purple-600 to-indigo-600 text-white font-extrabold text-xs shadow-2xl shadow-violet-600/40 hover:scale-105 active:scale-95 border border-violet-400/40 cursor-pointer animate-in slide-in-from-bottom-4 group transition-all"
            title="Open AI Questions & Games Hub"
          >
            <div className="flex h-6 w-6 items-center justify-center rounded-xl bg-white/20 group-hover:rotate-12 transition-transform">
              <Gamepad2 className="h-3.5 w-3.5" />
            </div>
            <span>AI Questions & Games</span>
            <span className="rounded-full bg-white text-violet-900 text-[10px] px-1.5 py-0.2 font-mono-code font-bold">
              {interactiveElements.length}
            </span>
          </button>
        )}

        {/* Thumbnail Sidebar Drawer */}
        <ThumbnailSidebar
          pdfDoc={pdfDoc}
          totalPages={totalPages}
          currentPage={currentPage}
          isOpen={showThumbnails}
          onClose={() => setShowThumbnails(false)}
          onSelectPage={(pageNum) => {
            setCurrentPage(pageNum);
            setShowThumbnails(false);
          }}
        />

        {/* Table of Contents & AI Activities Drawer */}
        <TableOfContentsDrawer
          isOpen={showToc}
          onClose={() => setShowToc(false)}
          outline={outline}
          currentPage={currentPage}
          onSelectPage={(pageNum) => {
            setCurrentPage(pageNum);
            setShowToc(false);
          }}
          bookmarks={bookmarks}
          onToggleBookmark={handleToggleBookmark}
          interactiveElements={interactiveElements}
          onOpenInteractiveElement={(el) => setActiveModalElement(el)}
        />

        {/* AI Learning Hub All-in-One Drawer */}
        <AiLearningHubDrawer
          isOpen={showAiHub}
          onClose={() => setShowAiHub(false)}
          interactiveElements={interactiveElements}
          onOpenElement={(el) => setActiveModalElement(el)}
          onSelectPage={(pageNum) => setCurrentPage(pageNum)}
          title={ebook.title}
        />

        {/* AI Study Tutor Chat Companion Drawer */}
        <AiChatDrawer
          isOpen={showAiChat}
          onClose={() => setShowAiChat(false)}
          bookTitle={ebook.title}
          currentPage={currentPage}
        />

        {/* Full-Text Search Drawer */}
        <SearchDrawer
          isOpen={showSearch}
          onClose={() => setShowSearch(false)}
          pdfDoc={pdfDoc}
          onSelectPage={(pageNum) => {
            setCurrentPage(pageNum);
            setShowSearch(false);
          }}
        />

        {/* Interactive Overlay Modal (Quiz, Video, Flashcards & Match Game) */}
        <InteractiveOverlayModal
          isOpen={!!activeModalElement}
          onClose={() => setActiveModalElement(null)}
          element={activeModalElement}
          bookId={ebook.slug || ebook.id}
        />
      </div>
    </div>
  );
};
