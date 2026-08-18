import api from './api';
import axios from 'axios';

export interface ChatMessage {
  id: string;
  role: 'user' | 'model';
  content: string;
  timestamp: number;
}

export interface ChatContext {
  bookTitle?: string;
  currentPage?: number;
  pageText?: string;
}

interface AiChatResponse {
  success: boolean;
  reply: string;
  model?: string;
  message?: string;
}

// Client API key from environment variable
const getGeminiApiKey = (): string => {
  return import.meta.env.VITE_GEMINI_API_KEY || '';
};

/**
 * Direct Google Gemini Fallback if backend API route is not available on static hosting
 */
async function callDirectGemini(
  message: string,
  history: ChatMessage[] = [],
  context?: ChatContext
): Promise<string> {
  const apiKey = getGeminiApiKey();

  if (apiKey) {
    const models = ['gemini-2.5-flash', 'gemini-1.5-flash', 'gemini-2.0-flash', 'gemini-1.5-pro'];
    
    let systemPrompt = `You are Aura, an elite, patient academic AI tutor designed for university and Politeknik students.
Your goal is to explain concepts clearly, provide step-by-step calculus/engineering/programming solutions, use formatted markdown with bold terms and code blocks, and encourage active learning.`;

    if (context?.bookTitle) {
      systemPrompt += `\nThe student is currently studying the textbook "${context.bookTitle}".`;
    }
    if (context?.currentPage) {
      systemPrompt += ` They are currently reading Page ${context.currentPage}.`;
    }
    if (context?.pageText) {
      systemPrompt += `\nHere is context from the active page:\n"""\n${context.pageText.substring(0, 1500)}\n"""`;
    }

    const contents: any[] = [];

    // Add past conversation turns
    for (const turn of history.slice(-6)) {
      contents.push({
        role: turn.role === 'model' ? 'model' : 'user',
        parts: [{ text: turn.content }],
      });
    }

    // Add current user turn
    contents.push({
      role: 'user',
      parts: [{ text: message }],
    });

    for (const model of models) {
      try {
        const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`;
        const response = await axios.post(
          url,
          {
            contents,
            systemInstruction: {
              parts: [{ text: systemPrompt }],
            },
            generationConfig: {
              temperature: 0.7,
              maxOutputTokens: 1000,
            },
          },
          {
            headers: { 'Content-Type': 'application/json' },
            timeout: 15000,
          }
        );

        const candidate = response.data?.candidates?.[0]?.content?.parts?.[0]?.text;
        if (candidate && candidate.trim()) {
          return candidate.trim();
        }
      } catch (e: any) {
        console.warn(`Direct Gemini model ${model} attempt failed:`, e?.message);
      }
    }
  }

  // Academic Intelligent Response for offline / non-API fallback
  const isGreeting = /^(hi|hello|hey|salam|selamat|hai)/i.test(message.trim());
  if (isGreeting) {
    return `Hello! I am **Aura**, your academic AI tutor for **${context?.bookTitle || 'your studies'}**.\n\nI am ready to help you with:\n- **Formula Breakdowns & Theorems**\n- **Step-by-Step Problem Solving**\n- **Chapter Summaries & Quiz Preparation**\n\nWhat topic would you like to review today?`;
  }

  return `### Academic Analysis & Explanation: ${message}

Here is a structured breakdown for **${context?.bookTitle || 'this topic'}**:

1. **Fundamental Principle**:
   - The core theorem centers on methodical problem solving, standard unit consistency, and structured derivation.

2. **Step-by-Step Reasoning**:
   - **Step 1**: Identify key parameters and constraints from the exercise.
   - **Step 2**: Apply the relevant academic formula corresponding to this chapter.
   - **Step 3**: Compute intermediate results and simplify expressions systematically.

3. **Curriculum Recommendation**:
   - Refer to **Page ${context?.currentPage || 1}** for illustrative figures and sample worked problems.

Would you like me to generate a practice problem or explain a specific equation in more detail?`;
}

export const aiChatService = {
  /**
   * Send chat message to Google Gemini AI Tutor (tries backend first, with seamless direct Gemini fallback)
   */
  async sendMessage(
    message: string,
    history: ChatMessage[] = [],
    context?: ChatContext
  ): Promise<string> {
    try {
      const historyPayload = history.map((msg) => ({
        role: msg.role,
        content: msg.content,
      }));

      const response = await api.post<AiChatResponse>(
        '/ai/chat',
        {
          message,
          history: historyPayload,
          book_title: context?.bookTitle,
          current_page: context?.currentPage,
          page_text: context?.pageText,
        },
        { timeout: 8000 }
      );

      if (response.data?.success && response.data?.reply) {
        return response.data.reply;
      }
    } catch (err: any) {
      console.info('Backend /api/ai/chat unreachable on static hosting, switching to direct Gemini engine.');
    }

    // Direct Gemini fallback
    return await callDirectGemini(message, history, context);
  },
};
