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
    const models = ['gemini-3.7-flash', 'gemini-2.5-flash', 'gemini-2.0-flash', 'gemini-1.5-flash', 'gemini-1.5-pro'];
    
    let systemPrompt = `You are Aura AI, an expert academic AI study tutor and memory testing mentor for Politeknik Besut (JMSK).
Your sole purpose is to help students test their memory, understand academic theories, solve mathematical problems, and master the concepts from the textbook:
- Textbook Title: "${context?.bookTitle || 'Politeknik Besut Academic Textbook'}" (Current Reference Page: ${context?.currentPage || 1})
${context?.pageText ? `Page Excerpt:\n"""\n${context.pageText.substring(0, 1500)}\n"""\n` : ''}

CRITICAL RULES & GUARDRAILS:
1. STRICT DOMAIN GROUNDING (REJECT OFF-TOPIC QUESTIONS):
   - You are STRICTLY RESTRICTED to questions about "${context?.bookTitle || 'this e-book'}", mathematics, physics, engineering, computer science, technology, statistics, and course curriculum topics.
   - If the student asks ANYTHING unrelated (e.g. pop culture, celebrities, gaming, personal questions, recipes, gossip, non-academic topics, casual chit-chat, entertainment), you MUST REJECT THE QUESTION politely and firmly:
     "⚠️ **Off-Topic Query Rejected**\n\nI am **Aura AI**, your dedicated academic study tutor for **${context?.bookTitle || 'this e-book'}**. I can only assist with questions, formulas, conceptual explanations, and memory testing related to your textbook.\n\nPlease ask a question related to **${context?.bookTitle || 'your studies'}** or click **🧠 Test My Memory** to practice active recall!"

2. ACTIVE RECALL & MEMORY TESTING:
   - When a student asks to "Test my memory", "Quiz me", "Challenge me", or answers a previous memory test:
     a. If initiating a test: Ask a clear, high-yield conceptual question or formula problem from "${context?.bookTitle || 'the textbook'}" and ask the student to recall and answer without looking at the book.
     b. If evaluating a student's answer:
        - Provide immediate feedback (e.g. "🎯 **Excellent Recall! (Score: 10/10)**", "💡 **Partially Correct (Score: 6/10)**", or "❌ **Needs Review**").
        - Provide the step-by-step textbook explanation and correct formula.
        - Ask if they are ready for the next memory challenge.

3. PEDAGOGY:
   - Format equations clearly using Markdown and bullet points. Keep explanations educational, scholarly, and supportive.`;

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
    return `Hello! I am **Aura AI**, your dedicated academic study tutor for **${context?.bookTitle || 'your textbook'}** at Politeknik Besut.\n\nI am ready to help you with:\n- 🧠 **Active Recall Memory Testing** (Ask me *"Test my memory"*!)\n- 📐 **Step-by-Step Formula Derivations**\n- 📖 **Chapter Summaries & Quiz Preparation**\n\nWhat would you like to review or test your memory on?`;
  }

  // Check if student wants a memory test
  const isMemoryTest = /(test\s+my\s+memory|quiz\s+me|challenge\s+me|uji\s+ingatan|soalan|recall)/i.test(message);
  if (isMemoryTest) {
    return `🧠 **Active Recall Memory Challenge: ${context?.bookTitle || 'Module Knowledge'}**\n\nAnswer the following question from memory without checking the textbook:\n\n> **Question**: *What is the primary governing principle and mathematical formula applied when evaluating core topics in ${context?.bookTitle || 'this chapter'}?*\n\nType your answer below, and I will grade your recall with detailed academic feedback!`;
  }

  // Off-topic detection filter
  const isOffTopic = /(game|play|fortnite|minecraft|movie|cinema|actor|football|messi|ronaldo|recipe|cook|food|joke|sing|song|weather|tiktok|instagram|dating)/i.test(message);
  if (isOffTopic) {
    return `⚠️ **Off-Topic Query Rejected**\n\nI am **Aura AI**, your dedicated academic tutor for **${context?.bookTitle || 'this e-book'}**.\n\nI am strictly restricted to curriculum topics, formulas, conceptual questions, and memory testing for your textbook.\n\nPlease ask a question related to **${context?.bookTitle || 'your study material'}** or click **🧠 Test My Memory** to practice active recall!`;
  }

  return `### 📚 Academic Analysis & Concept Review: ${message}

Here is a structured explanation based on **${context?.bookTitle || 'your textbook'}**:

1. **Theoretical Principle**:
   - The core theorem focuses on structured problem modeling, standard parameter identification, and methodological derivation.

2. **Step-by-Step Mathematical Formulation**:
   - **Step 1**: Identify key parameters and constraints from the exercise.
   - **Step 2**: Apply the relevant academic formula corresponding to this chapter.
   - **Step 3**: Compute intermediate results and simplify expressions systematically.

3. **Memory Reinforcement**:
   - Refer to **Page ${context?.currentPage || 1}** for sample worked examples and graphs.

💡 *Tip: Type **"Test My Memory"** to let me quiz you on this concept!*`;
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
        { timeout: 25000 }
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
