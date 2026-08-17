import React, { useEffect, useRef, useState, useCallback } from 'react';
import { PageFlip } from 'page-flip';
import type * as pdfjsLib from 'pdfjs-dist';
import { renderAllPdfPages } from '../../services/pdfService';
import { Sparkles, BookOpen } from 'lucide-react';

interface FlipBookProps {
  pdfDoc: pdfjsLib.PDFDocumentProxy;
  totalPages: number;
  currentPage: number;
  onPageFlip: (page: number) => void;
  zoom?: number;
  spreadMode?: 'auto' | 'single' | 'double';
}

export const FlipBook: React.FC<FlipBookProps> = ({
  pdfDoc,
  totalPages: _totalPages,
  currentPage,
  onPageFlip,
  zoom = 1,
  spreadMode = 'auto',
}) => {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const bookMountWrapperRef = useRef<HTMLDivElement | null>(null);
  const pageFlipInstance = useRef<PageFlip | null>(null);
  const onPageFlipRef = useRef(onPageFlip);
  onPageFlipRef.current = onPageFlip;

  const [pageImages, setPageImages] = useState<string[]>([]);
  const [renderProgress, setRenderProgress] = useState<number>(0);
  const [isRendered, setIsRendered] = useState<boolean>(false);

  const [aspectRatio, setAspectRatio] = useState<number>(0.707);
  const [dimensions, setDimensions] = useState<{ width: number; height: number }>({
    width: 600,
    height: 850,
  });
  const [isSinglePage, setIsSinglePage] = useState<boolean>(false);

  // 1. Fast & Non-Blocking PDF page rendering
  useEffect(() => {
    let isCancelled = false;
    let createdUrls: string[] = [];
    setIsRendered(false);
    setRenderProgress(0);

    pdfDoc.getPage(1).then((firstPage) => {
      if (isCancelled) return;
      const vp = firstPage.getViewport({ scale: 1 });
      const ratio = vp.width / vp.height;
      if (ratio > 0.3 && ratio < 3) {
        setAspectRatio(ratio);
      }
    }).catch(() => {});

    renderAllPdfPages(pdfDoc, 1600, (percent) => {
      if (!isCancelled) setRenderProgress(percent);
    })
      .then((images) => {
        if (!isCancelled) {
          createdUrls = images;
          setPageImages(images);
          setIsRendered(true);
        }
      })
      .catch(() => {});

    return () => {
      isCancelled = true;
      // Revoke blob URLs to free memory
      createdUrls.forEach((url) => {
        if (url.startsWith('blob:')) URL.revokeObjectURL(url);
      });
    };
  }, [pdfDoc]);

  // 2. Measure viewport and compute precise pixel-perfect dimensions without canvas margins
  const updateDimensions = useCallback(() => {
    if (!containerRef.current) return;
    const { clientWidth, clientHeight } = containerRef.current;
    if (clientWidth === 0 || clientHeight === 0) return;

    const isMobile = clientWidth < 768;
    const isLandscapeDoc = aspectRatio > 1.15;
    const forceSingle = spreadMode === 'single' || (spreadMode === 'auto' && (isMobile || isLandscapeDoc));
    const forceDouble = spreadMode === 'double' && !isMobile;
    const singleMode = forceDouble ? false : forceSingle;
    setIsSinglePage(singleMode);

    const marginX = isMobile ? 16 : 32;
    const marginY = isMobile ? 16 : 32;
    const maxAvailableWidth = Math.max(clientWidth - marginX, 280);
    const maxAvailableHeight = Math.max(clientHeight - marginY, 320);

    let finalPageWidth: number;
    let finalPageHeight: number;

    if (singleMode) {
      finalPageHeight = maxAvailableHeight;
      finalPageWidth = finalPageHeight * aspectRatio;

      if (finalPageWidth > maxAvailableWidth) {
        finalPageWidth = maxAvailableWidth;
        finalPageHeight = finalPageWidth / aspectRatio;
      }
    } else {
      const halfAvailableWidth = maxAvailableWidth / 2;
      finalPageHeight = maxAvailableHeight;
      finalPageWidth = finalPageHeight * aspectRatio;

      if (finalPageWidth > halfAvailableWidth) {
        finalPageWidth = halfAvailableWidth;
        finalPageHeight = finalPageWidth / aspectRatio;
      }
    }

    finalPageWidth = Math.max(Math.floor(finalPageWidth), 200);
    finalPageHeight = Math.max(Math.floor(finalPageHeight), 280);

    setDimensions({
      width: finalPageWidth,
      height: finalPageHeight,
    });
  }, [aspectRatio, spreadMode]);

  useEffect(() => {
    updateDimensions();
    window.addEventListener('resize', updateDimensions);
    return () => window.removeEventListener('resize', updateDimensions);
  }, [updateDimensions]);

  // 3. Initialize / update PageFlip instance with loadFromImages
  useEffect(() => {
    if (!isRendered || pageImages.length === 0 || !bookMountWrapperRef.current) return;

    const mountEl = bookMountWrapperRef.current;
    mountEl.innerHTML = '';

    const flipContainer = document.createElement('div');
    flipContainer.className = 'page-flip-book';
    mountEl.appendChild(flipContainer);

    try {
      const pageFlip = new PageFlip(flipContainer, {
        width: dimensions.width,
        height: dimensions.height,
        size: 'fixed',
        minWidth: 200,
        maxWidth: 2400,
        minHeight: 280,
        maxHeight: 2400,
        showCover: true,
        usePortrait: isSinglePage,
        startPage: Math.max(0, currentPage - 1),
        drawShadow: true,
        flippingTime: 550,
        useMouseEvents: true,
        swipeDistance: 25,
        maxShadowOpacity: 0.35,
        showPageCorners: true,
        disableFlipByClick: false,
      });

      pageFlip.loadFromImages(pageImages);

      pageFlip.on('flip', (e: { data: number }) => {
        const newPage = e.data + 1;
        onPageFlipRef.current(newPage);
      });

      pageFlipInstance.current = pageFlip;
    } catch {
      // Handle fallback silently
    }

    return () => {
      if (pageFlipInstance.current) {
        try {
          pageFlipInstance.current.destroy();
        } catch {}
        pageFlipInstance.current = null;
      }
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isRendered, pageImages, dimensions.width, dimensions.height, isSinglePage]);

  // 4. Synchronize page changes from toolbar navigation
  useEffect(() => {
    if (!pageFlipInstance.current) return;
    const currentInstancePage = pageFlipInstance.current.getCurrentPageIndex() + 1;
    if (currentInstancePage !== currentPage) {
      const targetIndex = Math.max(0, currentPage - 1);
      try {
        pageFlipInstance.current.turnToPage(targetIndex);
      } catch {}
    }
  }, [currentPage]);

  // Keyboard navigation
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (['input', 'textarea'].includes((e.target as HTMLElement)?.tagName?.toLowerCase())) {
        return;
      }
      if (e.key === 'ArrowLeft') {
        e.preventDefault();
        pageFlipInstance.current?.flipPrev();
      } else if (e.key === 'ArrowRight') {
        e.preventDefault();
        pageFlipInstance.current?.flipNext();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  return (
    <div
      ref={containerRef}
      className="relative flex h-full w-full items-center justify-center overflow-auto p-4 select-none"
    >
      {/* Zoomable FlipBook Stage */}
      <div
        ref={bookMountWrapperRef}
        className="mx-auto flex items-center justify-center rounded-2xl shadow-2xl overflow-hidden will-change-transform"
        style={{
          display: isRendered ? 'flex' : 'none',
          transform: `scale(${zoom})`,
          transformOrigin: 'center center',
          transition: 'transform 0.18s cubic-bezier(0.16, 1, 0.3, 1)',
        }}
      />

      {/* Apple Liquid Glass Loading Screen */}
      {!isRendered && (
        <div className="liquid-glass flex flex-col items-center justify-center gap-5 rounded-3xl p-8 sm:p-10 shadow-2xl text-slate-800 dark:text-[#f8fafc] max-w-sm w-full mx-4">
          <div className="flex h-14 w-14 items-center justify-center rounded-2xl liquid-glass text-violet-600 dark:text-[#a78bfa] shadow-md animate-pulse">
            <BookOpen className="h-7 w-7" />
          </div>
          
          <div className="text-center space-y-1">
            <div className="inline-flex items-center gap-1.5 liquid-pill text-[10px] py-0.5 px-2.5">
              <Sparkles className="h-3 w-3 text-violet-600 dark:text-[#a78bfa]" />
              <span>Optimizing Vector Pages</span>
            </div>
            <h3 className="text-base font-extrabold text-slate-900 dark:text-[#f8fafc] tracking-tight">
              Loading Flipbook
            </h3>
            <p className="text-xs font-mono-code text-slate-500 dark:text-[#94a3b8]">
              Rendering retina pages ({renderProgress}%)
            </p>
          </div>

          <div className="h-2 w-full overflow-hidden rounded-full bg-slate-200/60 dark:bg-black/40 shadow-inner">
            <div
              className="h-full bg-gradient-to-r from-violet-600 via-indigo-500 to-purple-600 transition-all duration-200"
              style={{ width: `${renderProgress}%` }}
            />
          </div>
        </div>
      )}
    </div>
  );
};
