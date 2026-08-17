import React, { useEffect, useRef } from 'react';
import { X } from 'lucide-react';
import type * as pdfjsLib from 'pdfjs-dist';

interface ThumbnailSidebarProps {
  pdfDoc: pdfjsLib.PDFDocumentProxy | null;
  totalPages: number;
  currentPage: number;
  isOpen: boolean;
  onClose: () => void;
  onSelectPage: (page: number) => void;
}

const ThumbnailItem: React.FC<{
  pdfDoc: pdfjsLib.PDFDocumentProxy;
  pageNumber: number;
  isActive: boolean;
  onSelect: () => void;
}> = ({ pdfDoc, pageNumber, isActive, onSelect }) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  useEffect(() => {
    let isCancelled = false;

    const renderThumbnail = async () => {
      try {
        const page = await pdfDoc.getPage(pageNumber);
        if (isCancelled || !canvasRef.current) return;

        const viewport = page.getViewport({ scale: 0.25 });
        const canvas = canvasRef.current;
        const context = canvas.getContext('2d');
        if (!context) return;

        canvas.width = viewport.width;
        canvas.height = viewport.height;

        // @ts-expect-error - Render parameters
        await page.render({ canvasContext: context, viewport }).promise;
      } catch {
        // Thumbnail render error ignored
      }
    };

    renderThumbnail();

    return () => {
      isCancelled = true;
    };
  }, [pdfDoc, pageNumber]);

  return (
    <button
      onClick={onSelect}
      className={`group flex flex-col items-center gap-1.5 rounded-lg p-2 transition-all ${
        isActive
          ? 'bg-blue-600/10 border-2 border-blue-500 shadow-md dark:bg-blue-600/20'
          : 'hover:bg-slate-100 dark:hover:bg-slate-800 border border-slate-200 dark:border-slate-800/60'
      }`}
    >
      <div className="relative aspect-[1/1.414] w-28 overflow-hidden rounded bg-slate-100 dark:bg-slate-900 shadow-sm flex items-center justify-center border border-slate-200 dark:border-slate-800">
        <canvas ref={canvasRef} className="h-full w-full object-contain" />
      </div>
      <span
        className={`text-[11px] font-semibold ${
          isActive ? 'text-blue-600 dark:text-blue-400' : 'text-slate-600 dark:text-slate-400 group-hover:text-slate-900 dark:group-hover:text-slate-200'
        }`}
      >
        Page {pageNumber}
      </span>
    </button>
  );
};

export const ThumbnailSidebar: React.FC<ThumbnailSidebarProps> = ({
  pdfDoc,
  totalPages,
  currentPage,
  isOpen,
  onClose,
  onSelectPage,
}) => {
  if (!isOpen || !pdfDoc) return null;

  return (
    <div className="fixed inset-y-0 right-0 z-40 flex w-72 flex-col border-l border-slate-200 bg-white/95 dark:border-slate-800 dark:bg-slate-950/95 backdrop-blur-md shadow-2xl transition-all duration-300">
      {/* Header */}
      <div className="flex items-center justify-between border-b border-slate-200 dark:border-slate-800 px-4 py-3">
        <h3 className="text-sm font-semibold text-slate-900 dark:text-white">Pages ({totalPages})</h3>
        <button
          onClick={onClose}
          className="rounded-lg p-1.5 text-slate-500 hover:bg-slate-100 hover:text-slate-900 dark:text-slate-400 dark:hover:bg-slate-800 dark:hover:text-white transition-colors"
          aria-label="Close page thumbnails"
        >
          <X className="h-4 w-4" />
        </button>
      </div>

      {/* Thumbnails Grid */}
      <div className="flex-1 overflow-y-auto p-4">
        <div className="flex flex-col items-center gap-3">
          {Array.from({ length: totalPages }, (_, i) => i + 1).map((pageNum) => (
            <ThumbnailItem
              key={pageNum}
              pdfDoc={pdfDoc}
              pageNumber={pageNum}
              isActive={currentPage === pageNum}
              onSelect={() => {
                onSelectPage(pageNum);
              }}
            />
          ))}
        </div>
      </div>
    </div>
  );
};
