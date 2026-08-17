export type InteractiveElementType = 'quiz' | 'video' | 'flashcards' | 'qr_link';

export interface QuizQuestion {
  id: string;
  question: string;
  options: string[];
  correctIndex: number;
  explanation: string;
}

export interface Flashcard {
  id: string;
  term: string;
  definition: string;
}

export interface InteractiveElement {
  id: string;
  pageNumber: number;
  type: InteractiveElementType;
  title: string;
  description?: string;
  data: {
    // Quiz
    questions?: QuizQuestion[];
    // Video
    youtubeUrl?: string;
    videoId?: string;
    videoTitle?: string;
    // Flashcards
    cards?: Flashcard[];
    // QR Code / Form Link
    targetUrl?: string;
    label?: string;
    formType?: 'google_form' | 'attendance' | 'resource';
  };
}

export interface StudentQuizResult {
  score: number;
  totalQuestions: number;
  percent: number;
  answers: Record<number, number>; // questionIndex -> selectedIndex
  completedAt: number;
}
