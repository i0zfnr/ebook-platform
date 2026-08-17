import type { InteractiveElement } from '../types/interactive';
import type * as pdfjsLib from 'pdfjs-dist';
import api from './api';

export function getInteractiveElementsStorageKey(bookId: string | number): string {
  return `flipbook_interactive_${bookId}`;
}

export function getSavedInteractiveElements(bookId: string | number): InteractiveElement[] {
  try {
    const raw = localStorage.getItem(getInteractiveElementsStorageKey(bookId));
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

export function saveInteractiveElements(bookId: string | number, elements: InteractiveElement[]): void {
  try {
    localStorage.setItem(getInteractiveElementsStorageKey(bookId), JSON.stringify(elements));
  } catch {}
}

/**
 * Extract readable text from PDF pages to provide real context for Google Gemini
 */
async function extractDocumentTextSample(
  pdfDoc: pdfjsLib.PDFDocumentProxy,
  maxPages = 15
): Promise<string> {
  const totalPages = pdfDoc.numPages;
  let combined = '';

  const pagesToScan = Math.min(totalPages, maxPages);
  for (let p = 1; p <= pagesToScan; p++) {
    try {
      const page = await pdfDoc.getPage(p);
      const textContent = await page.getTextContent();
      const pageStr = textContent.items
        .map((item: any) => item.str || '')
        .join(' ')
        .trim();

      if (pageStr.length > 20) {
        combined += `\n[PAGE ${p}]: ${pageStr.slice(0, 1000)}\n`;
      }
    } catch {}
  }

  return combined;
}

/**
 * AI Content Analyzer & Interactive Generator
 * Calls Laravel Backend to run Google Gemini AI with secured GEMINI_API_KEY from backend .env
 */
export async function generateAIInteractiveElements(
  pdfDoc: pdfjsLib.PDFDocumentProxy,
  bookTitle: string,
  bookId: string | number
): Promise<InteractiveElement[]> {
  const totalPages = pdfDoc.numPages;

  // 1. Check local device cache first
  const cached = getSavedInteractiveElements(bookId);
  if (cached.length > 0) {
    return cached;
  }

  // 2. Extract document text sample
  let docText = '';
  try {
    docText = await extractDocumentTextSample(pdfDoc, 15);
  } catch {}

  // 3. Call backend API (secured with backend GEMINI_API_KEY)
  try {
    const response = await api.post(`/ebooks/${bookId}/generate-ai`, {
      text_sample: docText,
      total_pages: totalPages,
    });

    if (response.data && response.data.success && Array.isArray(response.data.data)) {
      const elements: InteractiveElement[] = response.data.data;
      saveInteractiveElements(bookId, elements);
      return elements;
    }
  } catch (err) {
    console.warn('Backend Gemini AI generation request failed, using client fallback:', err);
  }

  // 4. Client fallback if server is unreachable
  const timestamp = Date.now();
  const lower = (bookTitle + ' ' + docText).toLowerCase();
  const isStats = lower.includes('statistic') || lower.includes('probability') || lower.includes('data');

  const fallbackElements: InteractiveElement[] = [
    {
      id: `ai_quiz_${timestamp}`,
      pageNumber: Math.min(totalPages > 15 ? 10 : Math.max(2, Math.floor(totalPages / 2)), totalPages),
      type: 'quiz',
      title: 'Chapter Knowledge Check',
      description: 'Self-assessment quiz designed for this course module.',
      data: {
        questions: isStats
          ? [
              {
                id: 'q1',
                question: 'What is the fundamental difference between a population and a sample?',
                options: [
                  'A population includes all individuals under study, whereas a sample is a representative subset.',
                  'A sample is the entire group, while a population is a small group.',
                  'There is no mathematical distinction.',
                  'A population is strictly qualitative data.',
                ],
                correctIndex: 0,
                explanation: 'In statistics, a population is the entire group of interest, while a sample is an examined subset.',
              },
            ]
          : [
              {
                id: 'q1',
                question: `What is the core foundational topic covered in ${bookTitle}?`,
                options: [
                  'Foundational terminology, principles, and practical application',
                  'Hardware maintenance only',
                  'Unrelated trivia',
                  'None of the above',
                ],
                correctIndex: 0,
                explanation: 'Core principles provide the structural foundation for the entire module.',
              },
            ],
      },
    },
    {
      id: `ai_video_${timestamp}_1`,
      pageNumber: Math.min(totalPages > 10 ? 4 : 2, totalPages),
      type: 'video',
      title: isStats ? 'Video Lecture: Introduction to Statistics' : 'Video Tutorial: Practical Overview',
      description: 'Curated video lesson reinforcing key concepts.',
      data: {
        youtubeUrl: isStats
          ? 'https://www.youtube.com/watch?v=LMSyiAJ8k9o'
          : 'https://www.youtube.com/watch?v=gT8w5HqH6_o',
        videoId: isStats ? 'LMSyiAJ8k9o' : 'gT8w5HqH6_o',
      },
    },
    {
      id: `ai_flash_${timestamp}_2`,
      pageNumber: Math.min(totalPages > 20 ? 14 : Math.max(3, Math.floor(totalPages * 0.75)), totalPages),
      type: 'flashcards',
      title: 'Key Terminology Flashcard Mastery',
      description: 'Practice term recall and definitions.',
      data: {
        cards: [
          { id: 'f1', term: 'Core Principle A', definition: 'The primary rule defining how this system functions.' },
          { id: 'f2', term: 'Core Principle B', definition: 'The practical workflow applied in exercises.' },
        ],
      },
    },
    {
      id: `ai_qr_${timestamp}_3`,
      pageNumber: totalPages,
      type: 'qr_link',
      title: 'Class Attendance & Lecturer Reflection',
      description: 'Scan or tap to open the chapter feedback form.',
      data: {
        targetUrl: 'https://forms.google.com',
        label: 'Open Assessment Form',
        formType: 'google_form',
      },
    },
  ];

  saveInteractiveElements(bookId, fallbackElements);
  return fallbackElements;
}
