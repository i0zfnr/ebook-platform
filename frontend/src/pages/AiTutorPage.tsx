import React, { useState, useEffect, useRef } from 'react';
import {
  Bot,
  User,
  Send,
  Sparkles,
  HelpCircle,
  Trash2,
  Loader2,
  CheckCircle2,
} from 'lucide-react';
import { ebookService } from '../services/ebookService';
import { aiChatService, type ChatMessage } from '../services/aiChatService';
import type { Ebook } from '../types/ebook';

export const AiTutorPage: React.FC = () => {
  const [ebooks, setEbooks] = useState<Ebook[]>([]);
  const [selectedBook, setSelectedBook] = useState<Ebook | null>(null);
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      id: 'init',
      role: 'model',
      content:
        '👋 Welcome to the **AI Study Room**! I am **Aura**, your academic AI tutor.\n\nSelect a textbook from the dropdown above or ask me any question about your curriculum, formulas, programming, or course topics.',
      timestamp: Date.now(),
    },
  ]);
  const [inputMessage, setInputMessage] = useState<string>('');
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const messagesEndRef = useRef<HTMLDivElement | null>(null);

  // Load available ebooks for context
  useEffect(() => {
    ebookService
      .getEbooks()
      .then((data) => {
        setEbooks(data);
        if (data.length > 0) {
          setSelectedBook(data[0]);
        }
      })
      .catch(() => {});
  }, []);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isLoading]);

  const handleSendMessage = async (textToSend?: string) => {
    const text = (textToSend || inputMessage).trim();
    if (!text || isLoading) return;

    const userMsg: ChatMessage = {
      id: `u_${Date.now()}`,
      role: 'user',
      content: text,
      timestamp: Date.now(),
    };

    setMessages((prev) => [...prev, userMsg]);
    if (!textToSend) setInputMessage('');
    setIsLoading(true);

    try {
      const reply = await aiChatService.sendMessage(text, messages, {
        bookTitle: selectedBook?.title,
      });

      const botMsg: ChatMessage = {
        id: `m_${Date.now()}`,
        role: 'model',
        content: reply,
        timestamp: Date.now(),
      };

      setMessages((prev) => [...prev, botMsg]);
    } catch {
      setMessages((prev) => [
        ...prev,
        {
          id: `err_${Date.now()}`,
          role: 'model',
          content: 'Sorry, I encountered an issue processing your request. Please try again.',
          timestamp: Date.now(),
        },
      ]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleClearChat = () => {
    setMessages([
      {
        id: 'init_reset',
        role: 'model',
        content: `Conversation reset! What would you like to study in **${selectedBook?.title || 'your courses'}**?`,
        timestamp: Date.now(),
      },
    ]);
  };

  return (
    <div className="min-h-screen pt-24 pb-16 px-4 sm:px-6 max-w-5xl mx-auto flex flex-col h-[calc(100vh-2rem)]">
      {/* Top Header Card */}
      <div className="glass-card p-4 sm:p-6 mb-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-tr from-violet-600 to-indigo-600 text-white shadow-xl shadow-violet-600/30">
            <Bot className="h-6 w-6" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-lg sm:text-xl font-extrabold text-slate-900 dark:text-white">
                Aura AI Academic Tutor
              </h1>
              <span className="liquid-pill text-[10px] py-0.5 px-2.5 font-mono-code font-bold text-violet-600 dark:text-[#a78bfa]">
                Gemini 3.6
              </span>
            </div>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Interactive 1-on-1 pedagogical tutoring & step-by-step problem solver
            </p>
          </div>
        </div>

        {/* Book Context Selector */}
        <div className="flex items-center gap-2">
          <span className="text-xs font-mono-code text-slate-400 hidden md:inline">Focus Book:</span>
          <select
            value={selectedBook?.id || ''}
            onChange={(e) => {
              const b = ebooks.find((item) => String(item.id) === e.target.value);
              setSelectedBook(b || null);
            }}
            className="liquid-btn-secondary px-3 py-1.5 text-xs font-bold rounded-xl text-slate-800 dark:text-slate-200 border border-slate-300 dark:border-white/10 bg-transparent cursor-pointer focus:outline-none"
          >
            <option value="" className="dark:bg-slate-900 text-slate-900 dark:text-white">
              General Academic Tutor
            </option>
            {ebooks.map((b) => (
              <option key={b.id} value={b.id} className="dark:bg-slate-900 text-slate-900 dark:text-white">
                📖 {b.title}
              </option>
            ))}
          </select>

          <button
            type="button"
            onClick={handleClearChat}
            className="p-2 rounded-xl text-slate-400 hover:text-rose-500 hover:bg-rose-500/10 transition-colors cursor-pointer"
            title="Reset conversation"
          >
            <Trash2 className="h-4 w-4" />
          </button>
        </div>
      </div>

      {/* Suggested Starter Prompts */}
      <div className="flex items-center gap-2 overflow-x-auto pb-3 mb-2 no-scrollbar">
        <button
          type="button"
          onClick={() =>
            handleSendMessage(
              selectedBook
                ? `Provide a step-by-step breakdown of the most important formula or chapter in ${selectedBook.title}.`
                : 'Explain the fundamental concepts of differentiation and integration with clear examples.'
            )
          }
          disabled={isLoading}
          className="liquid-pill text-[11px] py-1.5 px-3 font-bold whitespace-nowrap text-violet-600 dark:text-violet-400 hover:scale-105 active:scale-95 transition-transform flex items-center gap-1.5 cursor-pointer"
        >
          <Sparkles className="h-3.5 w-3.5" />
          <span>Formula Breakdown</span>
        </button>

        <button
          type="button"
          onClick={() =>
            handleSendMessage(
              selectedBook
                ? `Generate a challenging practice exam question based on ${selectedBook.title} and test my answer.`
                : 'Give me a challenging practice engineering math problem to solve.'
            )
          }
          disabled={isLoading}
          className="liquid-pill text-[11px] py-1.5 px-3 font-bold whitespace-nowrap text-amber-500 hover:scale-105 active:scale-95 transition-transform flex items-center gap-1.5 cursor-pointer"
        >
          <HelpCircle className="h-3.5 w-3.5" />
          <span>Practice Problem</span>
        </button>

        <button
          type="button"
          onClick={() =>
            handleSendMessage(
              selectedBook
                ? `Summarize the top 5 key takeaways from ${selectedBook.title} for my exam revision.`
                : 'Summarize the core syllabus takeaways for fast exam revision.'
            )
          }
          disabled={isLoading}
          className="liquid-pill text-[11px] py-1.5 px-3 font-bold whitespace-nowrap text-emerald-500 hover:scale-105 active:scale-95 transition-transform flex items-center gap-1.5 cursor-pointer"
        >
          <CheckCircle2 className="h-3.5 w-3.5" />
          <span>Revision Summary</span>
        </button>
      </div>

      {/* Chat Messages Card */}
      <div className="glass-card flex-1 overflow-y-auto p-4 sm:p-6 space-y-5 rounded-3xl mb-4 select-text">
        {messages.map((msg) => {
          const isUser = msg.role === 'user';
          return (
            <div
              key={msg.id}
              className={`flex items-start gap-3 ${isUser ? 'flex-row-reverse' : 'flex-row'}`}
            >
              <div
                className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-2xl text-white text-xs ${
                  isUser
                    ? 'bg-gradient-to-tr from-violet-600 to-indigo-600 shadow-md shadow-violet-600/30'
                    : 'bg-gradient-to-tr from-purple-600 to-pink-600 shadow-md shadow-purple-600/30'
                }`}
              >
                {isUser ? <User className="h-4 w-4" /> : <Bot className="h-4 w-4" />}
              </div>

              <div
                className={`max-w-[85%] rounded-3xl p-4 text-xs sm:text-sm leading-relaxed shadow-sm ${
                  isUser
                    ? 'bg-gradient-to-r from-violet-600 to-indigo-600 text-white rounded-tr-none'
                    : 'liquid-glass border border-slate-200/60 dark:border-white/10 text-slate-800 dark:text-[#f8fafc] rounded-tl-none'
                }`}
              >
                <div className="whitespace-pre-wrap font-sans leading-relaxed">{msg.content}</div>
                <span className="block text-[9px] font-mono-code opacity-50 mt-1.5 text-right">
                  {new Date(msg.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                </span>
              </div>
            </div>
          );
        })}

        {isLoading && (
          <div className="flex items-start gap-3">
            <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-tr from-purple-600 to-pink-600 text-white shadow-md">
              <Bot className="h-4 w-4" />
            </div>
            <div className="liquid-glass border border-slate-200/60 dark:border-white/10 rounded-3xl rounded-tl-none p-4 flex items-center gap-2.5 text-xs text-violet-600 dark:text-violet-400">
              <Loader2 className="h-4 w-4 animate-spin" />
              <span className="font-mono-code font-bold animate-pulse">
                Aura is analyzing and preparing tutor explanation...
              </span>
            </div>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* Input Message Form */}
      <form
        onSubmit={(e) => {
          e.preventDefault();
          handleSendMessage();
        }}
        className="relative flex items-center gap-2"
      >
        <input
          type="text"
          value={inputMessage}
          onChange={(e) => setInputMessage(e.target.value)}
          placeholder={`Ask Aura anything about ${selectedBook?.title || 'your studies'}...`}
          disabled={isLoading}
          className="flex-1 rounded-2xl bg-white/90 dark:bg-slate-900/90 border border-slate-300 dark:border-white/15 px-5 py-3.5 text-xs sm:text-sm text-slate-900 dark:text-white placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-violet-500/50 shadow-xl backdrop-blur-md"
        />
        <button
          type="submit"
          disabled={isLoading || !inputMessage.trim()}
          className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-r from-violet-600 to-indigo-600 text-white disabled:opacity-40 hover:scale-105 active:scale-95 transition-all shadow-xl shadow-violet-600/30 cursor-pointer"
          aria-label="Send message"
        >
          <Send className="h-5 w-5" />
        </button>
      </form>
    </div>
  );
};
