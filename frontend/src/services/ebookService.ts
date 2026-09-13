import api from './api';
import type { ApiResponse, Ebook } from '../types/ebook';
import type { AxiosProgressEvent } from 'axios';
import { localBookStorage } from './localBookStorage';

export const ebookService = {
  /**
   * Fetch all ebooks directly from cloud MySQL database with local IndexedDB fallback
   */
  async getEbooks(search?: string, status?: string): Promise<Ebook[]> {
    let cloudBooks: Ebook[] = [];
    try {
      const params: Record<string, string> = {};
      if (search && search.trim()) params.search = search.trim();
      if (status) params.status = status;

      const response = await api.get<ApiResponse<Ebook[]>>('/ebooks', {
        params,
        timeout: 6000,
      });

      if (response.data && Array.isArray(response.data.data)) {
        cloudBooks = response.data.data;
      }
    } catch (err) {
      console.warn('Backend API /ebooks unreachable, relying on local storage library:', err);
    }

    // Merge seamlessly with local IndexedDB and localStorage books
    const localBooks = localBookStorage.getLocalEbooksSync();
    const merged: Ebook[] = [...cloudBooks];
    for (const lb of localBooks) {
      const exists = merged.some(
        (b) => (lb.id && b.id === lb.id) || (lb.slug && b.slug === lb.slug)
      );
      if (!exists) {
        merged.unshift(lb);
      }
    }

    if (search && search.trim()) {
      const q = search.trim().toLowerCase();
      return merged.filter(
        (b) =>
          b.title.toLowerCase().includes(q) ||
          (b.author && b.author.toLowerCase().includes(q)) ||
          (b.description && b.description.toLowerCase().includes(q))
      );
    }

    return merged;
  },

  /**
   * Fetch single ebook by ID or Slug directly from cloud MySQL database or local storage
   */
  async getEbook(idOrSlug: string | number): Promise<Ebook> {
    try {
      const response = await api.get<ApiResponse<Ebook>>(`/ebooks/${idOrSlug}`, {
        timeout: 6000,
      });

      if (
        response.data &&
        response.data.data &&
        typeof response.data.data === 'object' &&
        response.data.data.title
      ) {
        return response.data.data;
      }
    } catch (err) {
      console.warn(`Cloud getEbook(${idOrSlug}) failed, checking local storage:`, err);
    }

    // Check local storage fallback
    const local = localBookStorage.getLocalEbookSync(idOrSlug);
    if (local) {
      return local;
    }

    throw new Error('E-Book not found in database or local storage.');
  },

  /**
   * Upload PDF directly to Cloud Server & MySQL database
   */
  async uploadEbook(formData: FormData, onProgress?: (progress: number) => void): Promise<Ebook> {
    // Post directly to cloud backend with 25s timeout
    const response = await api.post<ApiResponse<Ebook>>('/ebooks', formData, {
      onUploadProgress: (progressEvent: AxiosProgressEvent) => {
        if (progressEvent.total && onProgress) {
          const percent = Math.round((progressEvent.loaded * 100) / progressEvent.total);
          onProgress(percent);
        }
      },
      timeout: 25000, // 25 seconds timeout to avoid hanging when static server rejects
    });

    if (response.data?.data) {
      return response.data.data;
    }

    throw new Error(response.data?.message || 'Server failed to save e-book to database.');
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
