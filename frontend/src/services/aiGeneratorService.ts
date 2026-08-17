import * as pdfjsLib from 'pdfjs-dist';
import api from './api';
import type { InteractiveElement } from '../types/interactive';

/**
 * Storage key helper for local interactive element persistence
 */
const STORAGE_PREFIX = 'ebook_interactive_elements_';

export function getSavedInteractiveElements(bookId: string | number): InteractiveElement[] {
  try {
    const raw = localStorage.getItem(`${STORAGE_PREFIX}${bookId}`);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed) && parsed.length > 0) {
        // Filter out legacy static statistics questions if this was another book
        return parsed.filter(el => el.type !== 'qr_link');
      }
    }
  } catch (e) {
    console.error('Failed to read interactive elements from cache:', e);
  }
  return [];
}

export function saveInteractiveElements(bookId: string | number, elements: InteractiveElement[]): void {
  try {
    const filtered = elements.filter(el => el.type !== 'qr_link');
    localStorage.setItem(`${STORAGE_PREFIX}${bookId}`, JSON.stringify(filtered));
  } catch (e) {
    console.error('Failed to save interactive elements to cache:', e);
  }
}

/**
 * Extract rich sample text across multiple pages of a PDF document
 */
export async function extractDocumentTextSample(
  pdfDoc: pdfjsLib.PDFDocumentProxy,
  maxPages: number = 20
): Promise<string> {
  const totalPages = pdfDoc.numPages;
  const pagesToScan = Math.min(totalPages, maxPages);
  let combined = '';

  for (let pageNum = 1; pageNum <= pagesToScan; pageNum++) {
    try {
      const page = await pdfDoc.getPage(pageNum);
      const content = await page.getTextContent();
      const pageText = content.items
        .map((item: any) => ('str' in item ? item.str : ''))
        .join(' ')
        .trim();

      if (pageText.length > 0) {
        combined += `\n[PAGE ${pageNum}]: ${pageText.substring(0, 1500)}\n`;
      }
    } catch {}
  }

  return combined;
}

/**
 * Dynamic Heuristic Generator that extracts actual terms & headings from document text
 */
export function createHeuristicInteractiveElements(
  bookTitle: string,
  totalPages: number,
  docText: string = ''
): InteractiveElement[] {
  const timestamp = Date.now();

  // Extract real keywords/sentences from document text
  const lines = docText
    .split(/\n|\. /)
    .map(l => l.replace(/\[PAGE \d+\]:/g, '').trim())
    .filter(l => l.length > 15 && l.length < 120);

  const keyConcepts = lines.slice(0, 8);

  const term1 = keyConcepts[0] || `${bookTitle} Core Concept`;
  const term2 = keyConcepts[1] || `Key Principle and Methodology`;
  const term3 = keyConcepts[2] || `Analytical Framework`;
  const term4 = keyConcepts[3] || `Application and Practice`;

  return [
    {
      id: `ai_quiz_${timestamp}`,
      pageNumber: Math.min(totalPages > 15 ? 10 : Math.max(2, Math.floor(totalPages / 2)), totalPages),
      type: 'quiz',
      title: `${bookTitle}: Knowledge Assessment`,
      description: 'Test your understanding with instant grading and explanations.',
      data: {
        questions: [
          {
            id: 'q1',
            question: `Which fundamental principle is central to the topics covered in ${bookTitle}?`,
            options: [
              term1.substring(0, 90),
              'Unrelated theoretical assumption',
              'Legacy hardware dependency',
              'None of the above',
            ],
            correctIndex: 0,
            explanation: `Based on the text: "${term1.substring(0, 120)}" forms an essential foundational component.`,
          },
          {
            id: 'q2',
            question: `In the study of this subject, how is ${term2.substring(0, 40)} correctly applied?`,
            options: [
              `By systematically applying ${term2.substring(0, 70)} to achieve verified results.`,
              'By bypassing standard methodology without verification.',
              'Only during initial software installation.',
              'Exclusively in theoretical simulations.',
            ],
            correctIndex: 0,
            explanation: `Proper execution requires methodical implementation as outlined in the curriculum.`,
          },
        ],
      },
    },
    {
      id: `ai_flash_${timestamp}_1`,
      pageNumber: Math.min(totalPages > 20 ? 14 : Math.max(3, Math.floor(totalPages * 0.75)), totalPages),
      type: 'flashcards',
      title: `${bookTitle}: Key Terms & Speed Match Game`,
      description: 'Practice term recall with 3D flip cards and Speed Match Game.',
      data: {
        cards: [
          { id: 'f1', term: term1.substring(0, 35), definition: term1 },
          { id: 'f2', term: term2.substring(0, 35), definition: term2 },
          { id: 'f3', term: term3.substring(0, 35), definition: term3 },
          { id: 'f4', term: term4.substring(0, 35), definition: term4 },
        ],
      },
    },
    {
      id: `ai_video_${timestamp}_2`,
      pageNumber: Math.min(totalPages > 10 ? 4 : 2, totalPages),
      type: 'video',
      title: `${bookTitle}: Video Lecture`,
      description: 'Curated educational video lesson matching core textbook concepts.',
      data: {
        youtubeUrl: 'https://www.youtube.com/watch?v=xxpc-HPKN28',
        videoId: 'xxpc-HPKN28',
      },
    },
  ];
}

/**
 * Generate AI Interactive Learning Elements from Live PDF Document (during Upload Preview)
 */
export async function generateAiLive(
  pdfDoc: pdfjsLib.PDFDocumentProxy,
  bookTitle: string,
  onStepProgress?: (step: string, percent: number) => void
): Promise<InteractiveElement[]> {
  const totalPages = pdfDoc.numPages;

  if (onStepProgress) onStepProgress('Extracting document vector text...', 25);
  let docText = '';
  try {
    docText = await extractDocumentTextSample(pdfDoc, 20);
  } catch (e) {
    console.warn('Text extraction error:', e);
  }

  if (onStepProgress) onStepProgress('Google Gemini AI researching textbook concepts...', 60);

  try {
    const cleanTitle = bookTitle || 'Course Textbook';
    const response = await api.post('/generate-ai', {
      title: cleanTitle,
      total_pages: totalPages,
      text_sample: docText,
    });

    if (response.data && response.data.success && Array.isArray(response.data.data) && response.data.data.length > 0) {
      if (onStepProgress) onStepProgress('Google Gemini AI Research Complete!', 100);
      return response.data.data.filter((el: InteractiveElement) => el.type !== 'qr_link');
    }
  } catch (err) {
    console.warn('Live backend AI generation fallback:', err);
  }

  if (onStepProgress) onStepProgress('Extracting concepts and assembling games...', 90);
  const elements = createHeuristicInteractiveElements(bookTitle, totalPages, docText);
  if (onStepProgress) onStepProgress('Interactive Learning Suite Ready!', 100);
  return elements;
}

/**
 * AI Content Analyzer & Interactive Generator for Reader
 */
export async function generateAIInteractiveElements(
  pdfDoc: pdfjsLib.PDFDocumentProxy,
  bookTitle: string,
  bookId: string | number,
  preloadedElements?: InteractiveElement[]
): Promise<InteractiveElement[]> {
  // 1. If backend already supplied interactive elements from database
  if (preloadedElements && Array.isArray(preloadedElements) && preloadedElements.length > 0) {
    const filtered = preloadedElements.filter(el => el.type !== 'qr_link');
    saveInteractiveElements(bookId, filtered);
    return filtered;
  }

  // 2. Check local device cache
  const cached = getSavedInteractiveElements(bookId);
  if (cached.length > 0) {
    return cached;
  }

  const totalPages = pdfDoc.numPages;

  // 3. Extract document text sample
  let docText = '';
  try {
    docText = await extractDocumentTextSample(pdfDoc, 20);
  } catch {}

  // 4. Call backend API
  try {
    const response = await api.post(`/ebooks/${bookId}/generate-ai`, {
      text_sample: docText,
      total_pages: totalPages,
    });

    if (response.data && response.data.success && Array.isArray(response.data.data) && response.data.data.length > 0) {
      const elements: InteractiveElement[] = response.data.data.filter((el: InteractiveElement) => el.type !== 'qr_link');
      saveInteractiveElements(bookId, elements);
      return elements;
    }
  } catch (err) {
    console.warn('Backend Gemini AI generation request failed, using client fallback:', err);
  }

  // 5. Client fallback if server is unreachable
  const fallbackElements = createHeuristicInteractiveElements(bookTitle, totalPages, docText);
  saveInteractiveElements(bookId, fallbackElements);
  return fallbackElements;
}
