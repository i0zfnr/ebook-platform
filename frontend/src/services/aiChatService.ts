import api from './api';

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

export const aiChatService = {
  /**
   * Send chat message to Google Gemini AI Tutor
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

      const response = await api.post('/ai/chat', {
        message,
        history: historyPayload,
        book_title: context?.bookTitle,
        current_page: context?.currentPage,
        page_text: context?.pageText,
      });

      if (response.data && response.data.success && response.data.reply) {
        return response.data.reply;
      }
      return 'I received your message, but no response was generated. Please try again.';
    } catch (err: any) {
      console.error('AI Chat request failed:', err);
      const msg = err.response?.data?.message || err.message;
      return `⚠️ Unable to connect to AI Tutor service (${msg}). Please ensure the backend server is running.`;
    }
  },
};
