import api from './api';
import type { ApiResponse, Ebook } from '../types/ebook';
import type { AxiosProgressEvent } from 'axios';

export const ebookService = {
  /**
   * Fetch all ebooks, optionally filtered by search term.
   */
  async getEbooks(search?: string, status?: string): Promise<Ebook[]> {
    const params: Record<string, string> = {};
    if (search && search.trim()) {
      params.search = search.trim();
    }
    if (status) {
      params.status = status;
    }

    const response = await api.get<ApiResponse<Ebook[]>>('/ebooks', { params });
    return response.data.data;
  },

  /**
   * Fetch single ebook by ID or Slug.
   */
  async getEbook(idOrSlug: string | number): Promise<Ebook> {
    const response = await api.get<ApiResponse<Ebook>>(`/ebooks/${idOrSlug}`);
    return response.data.data;
  },

  /**
   * Upload a new ebook with multipart form data and progress callback.
   */
  async uploadEbook(
    formData: FormData,
    onProgress?: (progress: number) => void
  ): Promise<Ebook> {
    const response = await api.post<ApiResponse<Ebook>>('/ebooks', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
      onUploadProgress: (progressEvent: AxiosProgressEvent) => {
        if (progressEvent.total && onProgress) {
          const percent = Math.round((progressEvent.loaded * 100) / progressEvent.total);
          onProgress(percent);
        }
      },
    });
    return response.data.data;
  },

  /**
   * Update ebook details.
   */
  async updateEbook(idOrSlug: string | number, formData: FormData): Promise<Ebook> {
    // In Laravel, PUT with multipart/form-data can be handled via _method=PUT or POST with spoofing
    formData.append('_method', 'PUT');
    const response = await api.post<ApiResponse<Ebook>>(`/ebooks/${idOrSlug}`, formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
    return response.data.data;
  },

  /**
   * Delete an ebook and its files.
   */
  async deleteEbook(idOrSlug: string | number): Promise<void> {
    await api.delete(`/ebooks/${idOrSlug}`);
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
