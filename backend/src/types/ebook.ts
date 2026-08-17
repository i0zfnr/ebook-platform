export interface Ebook {
  id: number;
  title: string;
  slug: string;
  author: string | null;
  description: string | null;
  pdf_path: string;
  cover_path: string | null;
  original_filename: string | null;
  file_size: number | null;
  total_pages: number | null;
  status: 'published' | 'draft' | 'archived' | string;
  pdf_url: string;
  cover_url: string | null;
  created_at: string;
  updated_at: string;
}

export interface ApiResponse<T> {
  success: boolean;
  message?: string;
  data: T;
  total?: number;
}

export interface EbookUploadForm {
  title: string;
  author: string;
  description: string;
  pdf: File | null;
  cover: File | null;
  total_pages?: number;
  status?: string;
}

export interface EbookUpdateForm {
  title?: string;
  author?: string;
  description?: string;
  cover?: File | null;
  total_pages?: number;
  status?: string;
}
