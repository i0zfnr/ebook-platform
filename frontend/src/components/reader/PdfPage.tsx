import React, { useEffect, useRef, useState } from 'react';
import type * as pdfjsLib from 'pdfjs-dist';

interface PdfPageProps {
  pdfDoc: pdfjsLib.PDFDocumentProxy;
  pageNumber: number;
  currentPage: number;
  width?: number;
  height?: number;
  scale?: number;
}

export const PdfPage: React.FC<PdfPageProps> = ({
  pdfDoc,
  pageNumber,
  currentPage,
  width = 500,
  height = 700,
}) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const [rendered, setRendered] = useState<boolean>(false);
  const [hasRenderedOnce, setHasRenderedOnce] = useState<boolean>(false);

  // Render current page and adjacent pages (+/- 4 pages)
  const isNearCurrentPage = Math.abs(pageNumber - currentPage) <= 4;
  const shouldRender = isNearCurrentPage || hasRenderedOnce;

  useEffect(() => {
    if (!shouldRender || rendered) return;

    let isCancelled = false;
    let renderTask: any = null;

    const render = async () => {
      try {
        const page = await pdfDoc.getPage(pageNumber);
        if (isCancelled || !canvasRef.current) return;

        const viewport = page.getViewport({ scale: 1 });
        const canvas = canvasRef.current;
        const context = canvas.getContext('2d', { alpha: false });
        if (!context) return;

        // Calculate scaling
        const dpr = window.devicePixelRatio || 1;
        const scaleX = (width * dpr) / viewport.width;
        const scaleY = (height * dpr) / viewport.height;
        const finalScale = Math.min(scaleX, scaleY);

        const scaledViewport = page.getViewport({ scale: Math.max(finalScale, 1) });

        canvas.width = scaledViewport.width;
        canvas.height = scaledViewport.height;

        renderTask = (page as any).render({
          canvasContext: context,
          viewport: scaledViewport,
        });

        await renderTask.promise;

        if (!isCancelled) {
          setRendered(true);
          setHasRenderedOnce(true);
        }
      } catch (err: any) {
        if (!isCancelled && err?.name !== 'RenderingCancelledException') {
          // silently handle cancel
        }
      }
    };

    render();

    return () => {
      isCancelled = true;
      if (renderTask && renderTask.cancel) {
        try {
          renderTask.cancel();
        } catch {
          // ignore
        }
      }
    };
  }, [shouldRender, rendered, pdfDoc, pageNumber, width, height]);

  return (
    <div className="relative h-full w-full bg-white flex items-center justify-center overflow-hidden select-none">
      <canvas
        ref={canvasRef}
        className="h-full w-full object-contain"
        style={{
          display: rendered ? 'block' : 'none',
        }}
      />
      {!rendered && (
        <div className="absolute inset-0 flex flex-col items-center justify-center bg-white text-slate-400 gap-2 p-4">
          <div className="h-5 w-5 rounded-full border-2 border-slate-200 border-t-blue-600 animate-spin" />
          <span className="text-xs font-semibold text-slate-500">Page {pageNumber}</span>
        </div>
      )}
    </div>
  );
};
