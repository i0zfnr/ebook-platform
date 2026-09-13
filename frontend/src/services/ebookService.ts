import api from './api';
import type { ApiResponse, Ebook } from '../types/ebook';
import type { AxiosProgressEvent } from 'axios';

export const ebookService = {
  /**
   * Fetch all ebooks directly from cloud MySQL database
   */
  async getEbooks(search?: string, status?: string): Promise<Ebook[]> {
    try {
      const params: Record<string, string> = {};
      if (search && search.trim()) params.search = search.trim();
      if (status) params.status = status;

      const response = await api.get<ApiResponse<Ebook[]>>('/ebooks', {
        params,
        timeout: 15000,
      });

      if (response.data && Array.isArray(response.data.data)) {
        return response.data.data;
      }
    } catch (err) {
      console.error('Failed to load ebooks from cloud database:', err);
    }

    return [];
  },

  /**
   * Fetch single ebook by ID or Slug directly from cloud MySQL database
   */
  async getEbook(idOrSlug: string | number): Promise<Ebook> {
    const response = await api.get<ApiResponse<Ebook>>(`/ebooks/${idOrSlug}`, {
      timeout: 15000,
    });

    if (
      response.data &&
      response.data.data &&
      typeof response.data.data === 'object' &&
      response.data.data.title
    ) {
      return response.data.data;
    }

    throw new Error('E-Book not found in database.');
  },

  /**
   * Upload PDF directly to Cloud Server & MySQL database
   */
  async uploadEbook(formData: FormData, onProgress?: (progress: number) => void): Promise<Ebook> {
    const response = await api.post<ApiResponse<Ebook>>('/ebooks', formData, {
      onUploadProgress: (progressEvent: AxiosProgressEvent) => {
        if (progressEvent.total && onProgress) {
          const percent = Math.round((progressEvent.loaded * 100) / progressEvent.total);
          onProgress(percent);
        }
      },
      timeout: 120000, // 2 minutes for uploading PDF to server
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
   * Delete an ebook and its files from server
   */
  async deleteEbook(idOrSlug: string | number): Promise<void> {
    try {
      await api.delete(`/ebooks/${idOrSlug}`, { timeout: 8000 });
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
