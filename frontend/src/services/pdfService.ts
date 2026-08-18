import * as pdfjsLib from 'pdfjs-dist';

// Configure worker URL for Vite and modern browser bundlers
try {
  pdfjsLib.GlobalWorkerOptions.workerSrc = new URL(
    'pdfjs-dist/build/pdf.worker.min.mjs',
    import.meta.url
  ).href;
} catch {
  pdfjsLib.GlobalWorkerOptions.workerSrc = `https://unpkg.com/pdfjs-dist@${pdfjsLib.version}/build/pdf.worker.min.mjs`;
}

/**
 * Normalize PDF URL to avoid Mixed Content (HTTP on HTTPS) and Localhost CORS on production hosting
 */
export function normalizePdfUrl(rawUrl: string): string {
  if (!rawUrl) return rawUrl;
  if (typeof window !== 'undefined') {
    const hostname = window.location.hostname;
    if (hostname !== 'localhost' && hostname !== '127.0.0.1') {
      if (rawUrl.includes('127.0.0.1') || rawUrl.includes('localhost')) {
        const apiIndex = rawUrl.indexOf('/api/');
        if (apiIndex !== -1) {
          return rawUrl.substring(apiIndex);
        }
      }
    }
  }
  return rawUrl;
}

export interface RenderPageOptions {
  pageNumber: number;
  canvas: HTMLCanvasElement;
  scale?: number;
}

export interface PdfDocumentInfo {
  numPages: number;
  pdfDoc: pdfjsLib.PDFDocumentProxy;
}

export interface PdfOutlineItem {
  title: string;
  pageNumber: number;
  items?: PdfOutlineItem[];
}

export interface PdfSearchResult {
  pageNumber: number;
  snippet: string;
  matchCount: number;
}

export interface ReadingProgressData {
  bookId: string | number;
  title: string;
  currentPage: number;
  totalPages: number;
  percent: number;
  lastReadAt: number;
  coverUrl?: string | null;
  slug?: string;
}

export interface BookmarkItem {
  id: string;
  pageNumber: number;
  createdAt: number;
  note?: string;
}

// In-memory global cache for thumbnails and loaded PDF documents
const pdfDocCache = new Map<string, Promise<pdfjsLib.PDFDocumentProxy>>();
const thumbnailCache = new Map<string, string>();
const pageTextCache = new Map<string, string[]>();

import { localBookStorage } from './localBookStorage';

/**
 * Store uploaded PDF file/buffer in memory cache so ReaderPage can open it immediately
 */
export function cacheUploadedPdf(key: string | number, source: File | ArrayBuffer | pdfjsLib.PDFDocumentProxy): void {
  if (!key) return;
  const strKey = String(key);

  if ('numPages' in source) {
    pdfDocCache.set(strKey, Promise.resolve(source));
    return;
  }

  const loadPromise = (async () => {
    const arrayBuffer = source instanceof File ? await source.arrayBuffer() : source;
    const typedArray = new Uint8Array(arrayBuffer);
    const loadingTask = pdfjsLib.getDocument({
      data: typedArray,
      cMapUrl: `https://unpkg.com/pdfjs-dist@${pdfjsLib.version}/cmaps/`,
      cMapPacked: true,
    });
    return await loadingTask.promise;
  })();

  pdfDocCache.set(strKey, loadPromise);
}

/**
 * Load PDF document from URL or IndexedDB (cached promise for zero duplicate network requests)
 */
export function loadPdfDocument(url: string, bookIdentifier?: string | number): Promise<pdfjsLib.PDFDocumentProxy> {
  const finalUrl = normalizePdfUrl(url);

  if (bookIdentifier && pdfDocCache.has(String(bookIdentifier))) {
    return pdfDocCache.get(String(bookIdentifier))!;
  }

  if (pdfDocCache.has(finalUrl)) {
    return pdfDocCache.get(finalUrl)!;
  }

  const loadPromise = (async () => {
    // Attempt 1: Check IndexedDB local storage
    if (bookIdentifier) {
      const localBuffer = await localBookStorage.getPdfBuffer(bookIdentifier);
      if (localBuffer) {
        const typedArray = new Uint8Array(localBuffer);
        const loadingTask = pdfjsLib.getDocument({
          data: typedArray,
          cMapUrl: `https://unpkg.com/pdfjs-dist@${pdfjsLib.version}/cmaps/`,
          cMapPacked: true,
        });
        return await loadingTask.promise;
      }
    }

    // Attempt 2: Fetch through normalized URL (and verify it's actual PDF binary, not HTML)
    try {
      const response = await fetch(finalUrl);
      const contentType = response.headers.get('content-type') || '';
      if (!response.ok || contentType.includes('text/html')) {
        throw new Error(`Invalid PDF response: ${contentType || response.statusText}`);
      }

      const arrayBuffer = await response.arrayBuffer();
      const firstBytes = new Uint8Array(arrayBuffer.slice(0, 5));
      const headerStr = String.fromCharCode(...firstBytes);

      if (headerStr.startsWith('%PDF')) {
        const typedArray = new Uint8Array(arrayBuffer);
        const loadingTask = pdfjsLib.getDocument({
          data: typedArray,
          cMapUrl: `https://unpkg.com/pdfjs-dist@${pdfjsLib.version}/cmaps/`,
          cMapPacked: true,
        });
        return await loadingTask.promise;
      }
    } catch (err) {
      console.warn('Fetch PDF failed or returned HTML fallback, attempting alternate routes...', err);
    }

    // Attempt 3: Direct fallback to /storage/ or sample documents
    if (finalUrl.includes('/api/ebooks/')) {
      const slug = finalUrl.split('/api/ebooks/')[1]?.split('/')[0];
      if (slug) {
        try {
          const fallbackUrl = `/storage/ebooks/${slug}.pdf`;
          const response = await fetch(fallbackUrl);
          const contentType = response.headers.get('content-type') || '';
          if (response.ok && !contentType.includes('text/html')) {
            const arrayBuffer = await response.arrayBuffer();
            const typedArray = new Uint8Array(arrayBuffer);
            const loadingTask = pdfjsLib.getDocument({
              data: typedArray,
              cMapUrl: `https://unpkg.com/pdfjs-dist@${pdfjsLib.version}/cmaps/`,
              cMapPacked: true,
            });
            return await loadingTask.promise;
          }
        } catch {}
      }
    }

    throw new Error(`Failed to load PDF document from ${finalUrl}`);
  })();

  pdfDocCache.set(finalUrl, loadPromise);
  if (bookIdentifier) {
    pdfDocCache.set(String(bookIdentifier), loadPromise);
  }
  return loadPromise;
}

/**
 * Render a specific page from PDFDocumentProxy to an optimized, ultra-sharp ObjectURL / Blob
 */
export async function renderPdfPageToBlobUrl(
  pdfDoc: pdfjsLib.PDFDocumentProxy,
  pageNumber: number,
  targetWidth = 1600
): Promise<string> {
  const page = await pdfDoc.getPage(pageNumber);
  const unscaledViewport = page.getViewport({ scale: 1 });

  const scale = Math.min(Math.max(targetWidth / unscaledViewport.width, 1.8), 2.5);
  const viewport = page.getViewport({ scale });

  const canvas = document.createElement('canvas');
  canvas.width = Math.round(viewport.width);
  canvas.height = Math.round(viewport.height);
  const context = canvas.getContext('2d', { alpha: false });

  if (!context) {
    throw new Error('Canvas 2D context unavailable');
  }

  context.imageSmoothingEnabled = true;
  context.imageSmoothingQuality = 'high';
  context.fillStyle = '#ffffff';
  context.fillRect(0, 0, canvas.width, canvas.height);

  await (page as any).render({
    canvasContext: context,
    viewport: viewport,
  }).promise;

  return new Promise<string>((resolve) => {
    canvas.toBlob(
      (blob) => {
        if (blob) {
          resolve(URL.createObjectURL(blob));
        } else {
          resolve(canvas.toDataURL('image/jpeg', 0.92));
        }
      },
      'image/jpeg',
      0.92
    );
  });
}

/**
 * Render all pages to high resolution image URLs with non-blocking UI frame yielding
 */
export async function renderAllPdfPages(
  pdfDoc: pdfjsLib.PDFDocumentProxy,
  targetWidth = 1600,
  onProgress?: (progressPercent: number) => void
): Promise<string[]> {
  const total = pdfDoc.numPages;
  const imageUrls: string[] = [];

  for (let i = 1; i <= total; i++) {
    const imgUrl = await renderPdfPageToBlobUrl(pdfDoc, i, targetWidth);
    imageUrls.push(imgUrl);
    
    if (onProgress) {
      onProgress(Math.round((i / total) * 100));
    }

    await new Promise((resolve) => requestAnimationFrame(resolve));
  }

  return imageUrls;
}

/**
 * Extract first page as lightweight thumbnail with session storage caching
 */
export async function extractFirstPageThumbnail(
  pdfUrl: string,
  maxWidth = 400
): Promise<string> {
  if (thumbnailCache.has(pdfUrl)) {
    return thumbnailCache.get(pdfUrl)!;
  }

  try {
    const saved = sessionStorage.getItem(`thumb_${pdfUrl}`);
    if (saved) {
      thumbnailCache.set(pdfUrl, saved);
      return saved;
    }
  } catch {}

  const pdfDoc = await loadPdfDocument(pdfUrl);
  const page = await pdfDoc.getPage(1);
  const unscaledViewport = page.getViewport({ scale: 1 });
  const scale = maxWidth / unscaledViewport.width;
  const viewport = page.getViewport({ scale });

  const canvas = document.createElement('canvas');
  canvas.width = Math.round(viewport.width);
  canvas.height = Math.round(viewport.height);
  const context = canvas.getContext('2d', { alpha: false });

  if (!context) throw new Error('No context');

  context.fillStyle = '#ffffff';
  context.fillRect(0, 0, canvas.width, canvas.height);

  await (page as any).render({
    canvasContext: context,
    viewport: viewport,
  }).promise;

  const dataUrl = canvas.toDataURL('image/jpeg', 0.85);
  thumbnailCache.set(pdfUrl, dataUrl);
  try {
    sessionStorage.setItem(`thumb_${pdfUrl}`, dataUrl);
  } catch {}

  return dataUrl;
}

/**
 * Extract Table of Contents (Outline / Bookmarks) from PDF
 */
export async function extractPdfOutline(
  pdfDoc: pdfjsLib.PDFDocumentProxy
): Promise<PdfOutlineItem[]> {
  try {
    const rawOutline = await pdfDoc.getOutline();
    if (!rawOutline || rawOutline.length === 0) {
      // Generate synthetic section items every 5-10 pages if no outline exists
      const total = pdfDoc.numPages;
      const step = total > 20 ? 5 : total > 10 ? 3 : 2;
      const syntheticOutline: PdfOutlineItem[] = [];

      for (let p = 1; p <= total; p += step) {
        syntheticOutline.push({
          title: p === 1 ? 'Cover & Introduction' : `Section • Page ${p}`,
          pageNumber: p,
        });
      }
      return syntheticOutline;
    }

    const parseItems = async (items: any[]): Promise<PdfOutlineItem[]> => {
      const result: PdfOutlineItem[] = [];
      for (const item of items) {
        let pageNumber = 1;
        if (typeof item.dest === 'string') {
          const destObj = await pdfDoc.getDestination(item.dest);
          if (destObj && destObj[0]) {
            const pageIndex = await pdfDoc.getPageIndex(destObj[0]);
            pageNumber = pageIndex + 1;
          }
        } else if (Array.isArray(item.dest) && item.dest[0]) {
          const pageIndex = await pdfDoc.getPageIndex(item.dest[0]);
          pageNumber = pageIndex + 1;
        }

        const subItems = item.items && item.items.length > 0 ? await parseItems(item.items) : undefined;
        result.push({
          title: item.title?.replace(/\0/g, '') || `Page ${pageNumber}`,
          pageNumber,
          items: subItems,
        });
      }
      return result;
    };

    return await parseItems(rawOutline);
  } catch {
    return [];
  }
}

/**
 * Full-Text Search inside PDF
 */
export async function searchPdfText(
  pdfDoc: pdfjsLib.PDFDocumentProxy,
  query: string
): Promise<PdfSearchResult[]> {
  const trimmed = query.trim().toLowerCase();
  if (!trimmed || trimmed.length < 2) return [];

  const results: PdfSearchResult[] = [];
  const total = pdfDoc.numPages;

  // Retrieve cached or extract page text
  const docFingerprint = pdfDoc.fingerprints?.[0] || String(total);
  let allTexts = pageTextCache.get(docFingerprint);

  if (!allTexts) {
    allTexts = [];
    for (let p = 1; p <= total; p++) {
      const page = await pdfDoc.getPage(p);
      const textContent = await page.getTextContent();
      const pageString = textContent.items
        .map((item: any) => item.str || '')
        .join(' ');
      allTexts.push(pageString);
    }
    pageTextCache.set(docFingerprint, allTexts);
  }

  allTexts.forEach((text, idx) => {
    const pageNum = idx + 1;
    const lowerText = text.toLowerCase();
    const index = lowerText.indexOf(trimmed);

    if (index !== -1) {
      // Count total matches on this page
      let count = 0;
      let pos = index;
      while (pos !== -1) {
        count++;
        pos = lowerText.indexOf(trimmed, pos + trimmed.length);
      }

      // Generate snippet excerpt around first match
      const start = Math.max(0, index - 40);
      const end = Math.min(text.length, index + trimmed.length + 50);
      const snippet = (start > 0 ? '...' : '') + text.substring(start, end).trim() + (end < text.length ? '...' : '');

      results.push({
        pageNumber: pageNum,
        snippet,
        matchCount: count,
      });
    }
  });

  return results;
}

/**
 * Reading Progress & Bookmark Local Storage Helpers
 */
export function saveReadingProgress(
  bookId: string | number,
  currentPage: number,
  totalPages: number,
  title: string,
  coverUrl?: string | null,
  slug?: string
) {
  try {
    const data: ReadingProgressData = {
      bookId,
      title,
      currentPage,
      totalPages,
      percent: Math.round((currentPage / totalPages) * 100),
      lastReadAt: Date.now(),
      coverUrl,
      slug,
    };
    localStorage.setItem(`flipbook_progress_${bookId}`, JSON.stringify(data));
  } catch {}
}

export function getReadingProgress(bookId: string | number): ReadingProgressData | null {
  try {
    const raw = localStorage.getItem(`flipbook_progress_${bookId}`);
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

export function getAllRecentProgress(): ReadingProgressData[] {
  const items: ReadingProgressData[] = [];
  try {
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (key && key.startsWith('flipbook_progress_')) {
        const raw = localStorage.getItem(key);
        if (raw) {
          items.push(JSON.parse(raw));
        }
      }
    }
    items.sort((a, b) => b.lastReadAt - a.lastReadAt);
  } catch {}
  return items;
}

export function getBookmarks(bookId: string | number): BookmarkItem[] {
  try {
    const raw = localStorage.getItem(`flipbook_bookmarks_${bookId}`);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

export function toggleBookmark(bookId: string | number, pageNumber: number, note?: string): BookmarkItem[] {
  const existing = getBookmarks(bookId);
  const foundIdx = existing.findIndex((b) => b.pageNumber === pageNumber);

  let updated: BookmarkItem[];
  if (foundIdx !== -1) {
    updated = existing.filter((b) => b.pageNumber !== pageNumber);
  } else {
    updated = [
      ...existing,
      {
        id: `${pageNumber}_${Date.now()}`,
        pageNumber,
        createdAt: Date.now(),
        note: note || `Bookmark at Page ${pageNumber}`,
      },
    ].sort((a, b) => a.pageNumber - b.pageNumber);
  }

  try {
    localStorage.setItem(`flipbook_bookmarks_${bookId}`, JSON.stringify(updated));
  } catch {}
  return updated;
}

export { pdfjsLib };
