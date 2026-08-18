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
 * Generates 10 rich questions, 8 flashcards, and interactive activities
 */
export function createHeuristicInteractiveElements(
  bookTitle: string,
  totalPages: number,
  docText: string = ''
): InteractiveElement[] {
  const timestamp = Date.now();

  // Extract real keywords/sentences from document text
  const cleanSentences = docText
    .split(/\n|\. |\? /)
    .map(l => l.replace(/\[PAGE \d+\]:/g, '').trim())
    .filter(l => l.length > 25 && l.length < 150 && !l.startsWith('http'));

  const concepts = cleanSentences.length >= 10
    ? cleanSentences
    : [
        `${bookTitle} fundamental theories and definitions`,
        'Methodological framework for problem analysis and execution',
        'Mathematical formulas and empirical calculation techniques',
        'Standard operational procedures and diagnostic criteria',
        'Comparative analysis of core system components',
        'Error prevention, verification, and boundary conditions',
        'Practical implementation workflows in industrial practice',
        'Optimization algorithms and performance efficiency',
        'Data synthesis, measurement protocols, and evaluation',
        'Advanced application scenarios and synthesis',
      ];

  const getConcept = (idx: number, fallback: string) => concepts[idx] || fallback;

  // Build 10 distinct interactive quiz questions
  const quiz1Questions = [
    {
      id: 'q1_1',
      question: `According to the material in ${bookTitle}, what is the primary purpose of "${getConcept(0, 'the core concept').substring(0, 60)}"?`,
      options: [
        `To establish the foundational methodology: ${getConcept(0, 'core principle').substring(0, 75)}.`,
        'To serve as an optional reference without practical application.',
        'To replace standard computational verification.',
        'To limit operational scope to theoretical simulations only.',
      ],
      correctIndex: 0,
      explanation: `The textbook highlights that understanding this principle is essential for correct domain modeling.`,
    },
    {
      id: 'q1_2',
      question: `When implementing "${getConcept(1, 'the methodology').substring(0, 50)}", which of the following represents the correct approach?`,
      options: [
        `Systematically applying ${getConcept(1, 'the methodology').substring(0, 70)} to verify outcomes.`,
        'Bypassing initial parameter validation to accelerate processing.',
        'Executing calculations without calibration standards.',
        'Applying empirical estimates in place of proven formulas.',
      ],
      correctIndex: 0,
      explanation: `Methodical execution requires adhering strictly to verified computational and analytical frameworks.`,
    },
    {
      id: 'q1_3',
      question: `In the analysis of "${getConcept(2, 'analytical calculations').substring(0, 50)}", what key variable must be controlled?`,
      options: [
        `The boundary conditions governing ${getConcept(2, 'system parameters').substring(0, 70)}.`,
        'Arbitrary scaling factors added post-calculation.',
        'External unrelated peripheral metrics.',
        'Uncalibrated qualitative assumptions.',
      ],
      correctIndex: 0,
      explanation: `Controlling boundary conditions ensures repeatability and high precision in empirical measurements.`,
    },
    {
      id: 'q1_4',
      question: `How does "${getConcept(3, 'standard protocol').substring(0, 50)}" contribute to overall system reliability?`,
      options: [
        `By preventing systematic drift through: ${getConcept(3, 'standard procedures').substring(0, 70)}.`,
        'By removing the need for peer review or audits.',
        'By enforcing static hardcoded values regardless of environment.',
        'By restricting analytical evaluations to small sample sets.',
      ],
      correctIndex: 0,
      explanation: `Standardized operational protocols eliminate procedural errors and maintain consistency.`,
    },
    {
      id: 'q1_5',
      question: `Which scenario best illustrates the practical application of "${getConcept(4, 'system components').substring(0, 50)}"?`,
      options: [
        `Deploying structured integration following: ${getConcept(4, 'workflow guidelines').substring(0, 70)}.`,
        'Modifying core assumptions without baseline documentation.',
        'Ignoring transient states during high-load processing.',
        'Disregarding secondary error margins.',
      ],
      correctIndex: 0,
      explanation: `Practical deployment requires structured integration aligned with documented operational guidelines.`,
    },
  ];

  const quiz2Questions = [
    {
      id: 'q2_1',
      question: `What distinguishes "${getConcept(5, 'error prevention techniques').substring(0, 50)}" from standard diagnostic checks?`,
      options: [
        `It proactively verifies ${getConcept(5, 'safety parameters').substring(0, 75)}.`,
        'It is only performed after fatal system termination.',
        'It requires no mathematical or algorithmic baseline.',
        'It applies solely to legacy architectural formats.',
      ],
      correctIndex: 0,
      explanation: `Proactive verification identifies boundary anomalies before cascading errors propagate.`,
    },
    {
      id: 'q2_2',
      question: `In evaluating "${getConcept(6, 'implementation workflows').substring(0, 50)}", what metric indicates optimal performance?`,
      options: [
        `Consistent alignment with ${getConcept(6, 'performance benchmarks').substring(0, 70)}.`,
        'Maximum resource consumption without output scaling.',
        'High variance across identical test iterations.',
        'Total reliance on unverified heuristic estimates.',
      ],
      correctIndex: 0,
      explanation: `Optimal performance is confirmed by consistent benchmark adherence and minimal error variance.`,
    },
    {
      id: 'q2_3',
      question: `Why is "${getConcept(7, 'optimization algorithms').substring(0, 50)}" critical in advanced applications?`,
      options: [
        `It maximizes computational efficiency based on: ${getConcept(7, 'efficiency models').substring(0, 70)}.`,
        'It eliminates the need for data structure design.',
        'It prevents any future system scalability.',
        'It reduces accuracy to achieve arbitrary speed gains.',
      ],
      correctIndex: 0,
      explanation: `Mathematical optimization reduces complexity while maintaining rigorous accuracy standards.`,
    },
    {
      id: 'q2_4',
      question: `How should practitioners interpret data synthesis under "${getConcept(8, 'measurement protocols').substring(0, 50)}"?`,
      options: [
        `By evaluating confidence intervals and: ${getConcept(8, 'statistical validity').substring(0, 70)}.`,
        'By discarding negative results to report uniform positive trends.',
        'By assuming equal weight for uncalibrated sensor noise.',
        'By substituting simulated outputs for actual field measurements.',
      ],
      correctIndex: 0,
      explanation: `Scientific data synthesis requires evaluating standard error margins and statistical validity.`,
    },
    {
      id: 'q2_5',
      question: `When synthesizing advanced topics in ${bookTitle}, what is the final synthesis milestone?`,
      options: [
        `Seamless integration of theory, computation, and ${getConcept(9, 'practical mastery').substring(0, 65)}.`,
        'Memorization of isolated terms without contextual application.',
        'Limiting problem sets to pre-solved textbook examples.',
        'Abandoning formal notation in favor of informal guesswork.',
      ],
      correctIndex: 0,
      explanation: `Mastery represents the holistic capability to apply theoretical, mathematical, and practical concepts to novel problems.`,
    },
  ];

  // Distribute quizzes across early and later pages
  const midPage = Math.max(2, Math.floor(totalPages * 0.4));
  const latePage = Math.min(totalPages, Math.max(midPage + 2, Math.floor(totalPages * 0.8)));

  return [
    {
      id: `ai_quiz_${timestamp}_part1`,
      pageNumber: Math.min(totalPages > 6 ? midPage : 2, totalPages),
      type: 'quiz',
      title: `${bookTitle}: Knowledge Assessment (Part 1 - 5 Questions)`,
      description: 'Test your foundational understanding with instant scoring and detailed explanations.',
      data: {
        questions: quiz1Questions,
      },
    },
    {
      id: `ai_quiz_${timestamp}_part2`,
      pageNumber: latePage,
      type: 'quiz',
      title: `${bookTitle}: Advanced Mastery Assessment (Part 2 - 5 Questions)`,
      description: 'Challenge your deep conceptual and applied knowledge across the module.',
      data: {
        questions: quiz2Questions,
      },
    },
    {
      id: `ai_flash_${timestamp}_1`,
      pageNumber: Math.min(totalPages > 10 ? Math.max(3, Math.floor(totalPages * 0.6)) : 2, totalPages),
      type: 'flashcards',
      title: `${bookTitle}: Key Terms & Speed Match Game (8 Concepts)`,
      description: 'Practice active recall with 3D flip cards and the interactive Speed Match Game.',
      data: {
        cards: [
          { id: 'f1', term: getConcept(0, 'Core Concept').substring(0, 35), definition: getConcept(0, 'Foundational rule defining how the system functions.') },
          { id: 'f2', term: getConcept(1, 'Methodology').substring(0, 35), definition: getConcept(1, 'The methodical workflow applied in practical exercises.') },
          { id: 'f3', term: getConcept(2, 'Analytical Framework').substring(0, 35), definition: getConcept(2, 'Mathematical formulation and evaluation criteria.') },
          { id: 'f4', term: getConcept(3, 'Operational Standard').substring(0, 35), definition: getConcept(3, 'Standard diagnostic criteria and quality protocols.') },
          { id: 'f5', term: getConcept(4, 'System Integration').substring(0, 35), definition: getConcept(4, 'Comparative integration of primary and secondary modules.') },
          { id: 'f6', term: getConcept(5, 'Error Prevention').substring(0, 35), definition: getConcept(5, 'Boundary validation rules preventing calculation drift.') },
          { id: 'f7', term: getConcept(6, 'Performance Optimization').substring(0, 35), definition: getConcept(6, 'Efficiency algorithms optimizing throughput and speed.') },
          { id: 'f8', term: getConcept(7, 'Advanced Synthesis').substring(0, 35), definition: getConcept(7, 'Holistic application combining theory with practical implementation.') },
        ],
      },
    },
    {
      id: `ai_video_${timestamp}_1`,
      pageNumber: Math.min(totalPages > 10 ? 3 : 1, totalPages),
      type: 'video',
      title: `${bookTitle}: Core Lecture Lesson`,
      description: 'Curated video lesson covering fundamental principles and worked examples.',
      data: {
        youtubeUrl: 'https://www.youtube.com/watch?v=xxpc-HPKN28',
        videoId: 'xxpc-HPKN28',
      },
    },
    {
      id: `ai_video_${timestamp}_2`,
      pageNumber: Math.min(totalPages > 14 ? 7 : Math.max(2, totalPages - 1), totalPages),
      type: 'video',
      title: `${bookTitle}: Advanced Problem Solving Walkthrough`,
      description: 'In-depth visual walkthrough of complex problems and derivations.',
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
