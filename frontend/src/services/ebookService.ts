import api from './api';
import type { ApiResponse, Ebook } from '../types/ebook';
import type { AxiosProgressEvent } from 'axios';
import { localBookStorage } from './localBookStorage';

export const ebookService = {
  /**
   * Fetch all ebooks, merging backend data and local IndexedDB books
   */
  async getEbooks(search?: string, status?: string): Promise<Ebook[]> {
    const localBooks = localBookStorage.getLocalEbooksSync();
    let backendBooks: Ebook[] = [];

    try {
      const params: Record<string, string> = {};
      if (search && search.trim()) params.search = search.trim();
      if (status) params.status = status;

      const response = await api.get<ApiResponse<Ebook[]>>('/ebooks', {
        params,
        timeout: 5000,
      });

      // Verify response is valid JSON array and not HTML SPA fallback
      if (response.data && Array.isArray(response.data.data)) {
        backendBooks = response.data.data;
      }
    } catch {
      // Backend unavailable, use local storage
    }

    // Merge unique books (by ID and slug)
    const combined = [...localBooks];
    for (const b of backendBooks) {
      if (!combined.some((item) => item.id === b.id || item.slug === b.slug)) {
        combined.push(b);
      }
    }

    if (search && search.trim()) {
      const q = search.toLowerCase();
      return combined.filter(
        (b) => b.title.toLowerCase().includes(q) || (b.author && b.author.toLowerCase().includes(q))
      );
    }

    return combined;
  },

  /**
   * Fetch single ebook by ID or Slug with seamless local fallback
   */
  async getEbook(idOrSlug: string | number): Promise<Ebook> {
    // 1. Check local storage first
    const localBook = localBookStorage.getLocalEbookSync(idOrSlug);

    try {
      const response = await api.get<ApiResponse<Ebook>>(`/ebooks/${idOrSlug}`, {
        timeout: 5000,
      });

      if (response.data && response.data.data && typeof response.data.data === 'object' && response.data.data.title) {
        return response.data.data;
      }
    } catch {
      // Backend error or route fallback to HTML
    }

    if (localBook) {
      return localBook;
    }

    // Synthesize readable metadata fallback
    return {
      id: typeof idOrSlug === 'number' ? idOrSlug : Date.now(),
      title: String(idOrSlug).replace(/-/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase()),
      slug: String(idOrSlug),
      author: 'Lecturer',
      description: '',
      pdf_path: `ebooks/${idOrSlug}.pdf`,
      pdf_url: `/storage/ebooks/${idOrSlug}.pdf`,
      cover_path: null,
      cover_url: null,
      original_filename: `${idOrSlug}.pdf`,
      file_size: null,
      total_pages: null,
      status: 'published',
      interactive_elements: undefined,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };
  },

  /**
   * Upload a new ebook with multipart form data and progress callback
   */
  async uploadEbook(
    formData: FormData,
    onProgress?: (progress: number) => void
  ): Promise<Ebook> {
    const title = (formData.get('title') as string) || 'Untitled E-Book';
    const author = (formData.get('author') as string) || 'Lecturer';
    const description = (formData.get('description') as string) || '';
    const pdfFile = formData.get('pdf') as File;
    const coverFile = formData.get('cover') as File | null;
    const totalPagesStr = formData.get('total_pages') as string;
    const interactiveStr = formData.get('interactive_elements') as string;

    const slug = title
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/(^-|-$)+/g, '') || `ebook-${Date.now()}`;

    const newLocalBook: Ebook = {
      id: Date.now(),
      title,
      slug,
      author,
      description,
      pdf_path: `ebooks/${slug}.pdf`,
      pdf_url: `/api/ebooks/${slug}/file`,
      cover_path: coverFile ? `covers/${slug}.jpg` : null,
      cover_url: coverFile ? URL.createObjectURL(coverFile) : null,
      original_filename: pdfFile ? pdfFile.name : `${slug}.pdf`,
      file_size: pdfFile ? pdfFile.size : null,
      total_pages: totalPagesStr ? parseInt(totalPagesStr, 10) : null,
      status: 'published',
      interactive_elements: interactiveStr ? JSON.parse(interactiveStr) : null,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };

    // Save to IndexedDB immediately
    if (pdfFile) {
      await localBookStorage.saveBook(newLocalBook, pdfFile);
    }

    // Post to server backend with generous timeout for large educational PDFs
    const response = await api.post<ApiResponse<Ebook>>('/ebooks', formData, {
      onUploadProgress: (progressEvent: AxiosProgressEvent) => {
        if (progressEvent.total && onProgress) {
          const percent = Math.round((progressEvent.loaded * 100) / progressEvent.total);
          onProgress(percent);
        }
      },
      timeout: 300000, // 5 minutes for large PDFs
    });

    if (response.data?.data) {
      if (pdfFile) {
        await localBookStorage.saveBook(response.data.data, pdfFile);
      }
      return response.data.data;
    }

    return newLocalBook;
  },

  /**
   * Update ebook details
   */
  async updateEbook(idOrSlug: string | number, formData: FormData): Promise<Ebook> {
    formData.append('_method', 'PUT');
    try {
      const response = await api.post<ApiResponse<Ebook>>(`/ebooks/${idOrSlug}`, formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      return response.data.data;
    } catch {
      return this.getEbook(idOrSlug);
    }
  },

  /**
   * Delete an ebook and its files
   */
  async deleteEbook(idOrSlug: string | number): Promise<void> {
    // 1. Delete from local IndexedDB and localStorage
    await localBookStorage.deleteBook(idOrSlug);

    // 2. Try deleting from backend if connected
    try {
      await api.delete(`/ebooks/${idOrSlug}`, { timeout: 4000 });
    } catch {}
  },
};

/**
 * Format bytes into human-readable size.
 */
export function formatBytes(bytes?: number | null, decimals = 1): string {
  if (bytes === null || bytes === undefined || bytes === 0) return '0 B';
  const k = 1024;
  const dm = decimals < 0 ? 0 : decimals;
  const sizes = ['B', 'KB', 'MB', 'GB', 'TB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return `${parseFloat((bytes / Math.pow(k, i)).toFixed(dm))} ${sizes[i]}`;
}

/**
 * Format date string.
 */
export function formatDate(dateString: string): string {
  if (!dateString) return '';
  const date = new Date(dateString);
  return date.toLocaleDateString(undefined, {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  });
}
