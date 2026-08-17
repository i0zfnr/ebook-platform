import React, { useState, useEffect, useRef } from 'react';
import {
  Sparkles,
  User,
  Send,
  HelpCircle,
  Trash2,
  Loader2,
  CheckCircle2,
  GraduationCap,
} from 'lucide-react';
import { ebookService } from '../services/ebookService';
import { aiChatService, type ChatMessage } from '../services/aiChatService';
import type { Ebook } from '../types/ebook';

/**
 * Format markdown text with bolding, code tags, lists, and headers
 */
function renderFormattedMessage(content: string) {
  const lines = content.split('\n');
  return lines.map((line, idx) => {
    // Header 3
    if (line.startsWith('### ')) {
      return (
        <h4 key={idx} className="font-extrabold text-sm text-violet-700 dark:text-violet-300 mt-3 mb-1.5 flex items-center gap-1.5">
          <Sparkles className="h-3.5 w-3.5 text-amber-400 inline" />
          <span>{line.replace('### ', '')}</span>
        </h4>
      );
    }
    // Header 2
    if (line.startsWith('## ')) {
      return (
        <h3 key={idx} className="font-extrabold text-base text-slate-900 dark:text-white mt-4 mb-2">
          {line.replace('## ', '')}
        </h3>
      );
    }
    // Bullet point
    if (line.startsWith('- ') || line.startsWith('* ')) {
      return (
        <li key={idx} className="ml-4 list-disc text-slate-700 dark:text-slate-200 my-0.5">
          {renderInlineFormatting(line.substring(2))}
        </li>
      );
    }
    // Numbered list
    const numMatch = line.match(/^(\d+)\.\s+(.*)$/);
    if (numMatch) {
      return (
        <li key={idx} className="ml-4 list-decimal text-slate-700 dark:text-slate-200 my-0.5">
          {renderInlineFormatting(numMatch[2])}
        </li>
      );
    }
    // Regular text
    if (!line.trim()) {
      return <div key={idx} className="h-2" />;
    }
    return (
      <p key={idx} className="my-1 text-slate-800 dark:text-slate-200">
        {renderInlineFormatting(line)}
      </p>
    );
  });
}

function renderInlineFormatting(text: string): React.ReactNode {
  // Split by bold (**text**) and inline code (`code`)
  const parts = text.split(/(\*\*.*?\*\*|`.*?`)/g);
  return parts.map((part, i) => {
    if (part.startsWith('**') && part.endsWith('**')) {
      return (
        <strong key={i} className="font-bold text-slate-900 dark:text-white">
          {part.slice(2, -2)}
        </strong>
      );
    }
    if (part.startsWith('`') && part.endsWith('`')) {
      return (
        <code key={i} className="rounded-md bg-violet-500/15 text-violet-700 dark:text-violet-300 font-mono-code px-1.5 py-0.5 text-[11px] font-bold">
          {part.slice(1, -1)}
        </code>
      );
    }
    return part;
  });
}

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
    <div className="relative min-h-[calc(100vh-4.5rem)] flex flex-col max-w-5xl mx-auto px-3 sm:px-6 pt-4 pb-2">
      {/* Top Header Card */}
      <div className="liquid-glass rounded-3xl p-4 sm:p-5 mb-3 flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-xl border border-white/20 shrink-0">
        <div className="flex items-center gap-3">
          <div className="relative flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-tr from-violet-600 via-purple-600 to-indigo-600 text-white shadow-xl shadow-violet-600/30">
            <GraduationCap className="h-6 w-6" />
            <span className="absolute -bottom-0.5 -right-0.5 flex h-3.5 w-3.5 items-center justify-center rounded-full bg-emerald-500 ring-2 ring-white dark:ring-slate-900">
              <span className="h-1.5 w-1.5 rounded-full bg-white animate-pulse" />
            </span>
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-base sm:text-lg font-extrabold text-slate-900 dark:text-white">
                Aura AI Study Tutor
              </h1>
              <span className="liquid-pill text-[10px] py-0.5 px-2.5 font-mono-code font-bold text-violet-600 dark:text-[#a78bfa]">
                Gemini 3.6 Flash
              </span>
            </div>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Step-by-step mathematical reasoning & academic concept tutor
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
            className="liquid-btn-secondary px-3 py-1.5 text-xs font-bold rounded-xl text-slate-800 dark:text-slate-200 border border-slate-300 dark:border-white/10 bg-transparent cursor-pointer focus:outline-none max-w-[200px] truncate"
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
      <div className="flex items-center gap-2 overflow-x-auto pb-2 shrink-0 no-scrollbar">
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
          className="liquid-pill text-[11px] py-1 px-3 font-bold whitespace-nowrap text-violet-600 dark:text-violet-400 hover:scale-105 active:scale-95 transition-transform flex items-center gap-1.5 cursor-pointer"
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
          className="liquid-pill text-[11px] py-1 px-3 font-bold whitespace-nowrap text-amber-500 hover:scale-105 active:scale-95 transition-transform flex items-center gap-1.5 cursor-pointer"
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
          className="liquid-pill text-[11px] py-1 px-3 font-bold whitespace-nowrap text-emerald-500 hover:scale-105 active:scale-95 transition-transform flex items-center gap-1.5 cursor-pointer"
        >
          <CheckCircle2 className="h-3.5 w-3.5" />
          <span>Revision Summary</span>
        </button>
      </div>

      {/* Messages Scrollable Stage */}
      <div className="flex-1 overflow-y-auto space-y-4 pr-1 mb-2 select-text min-h-[350px]">
        {messages.map((msg) => {
          const isUser = msg.role === 'user';
          return (
            <div
              key={msg.id}
              className={`flex items-start gap-3 ${isUser ? 'flex-row-reverse' : 'flex-row'}`}
            >
              {/* Professional Avatar Icon */}
              <div
                className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-2xl text-white text-xs shadow-md ${
                  isUser
                    ? 'bg-gradient-to-tr from-violet-600 to-indigo-600 shadow-violet-600/30'
                    : 'bg-gradient-to-tr from-purple-600 via-violet-600 to-pink-500 shadow-purple-600/30 ring-2 ring-violet-400/20'
                }`}
              >
                {isUser ? (
                  <User className="h-4 w-4" />
                ) : (
                  <GraduationCap className="h-4 w-4 text-white" />
                )}
              </div>

              {/* Message Bubble with Liquid Glass Styling */}
              <div
                className={`max-w-[85%] rounded-3xl p-4 text-xs sm:text-sm leading-relaxed shadow-lg ${
                  isUser
                    ? 'bg-gradient-to-r from-violet-600 to-indigo-600 text-white rounded-tr-none'
                    : 'liquid-glass border border-slate-200/70 dark:border-white/10 text-slate-800 dark:text-[#f8fafc] rounded-tl-none'
                }`}
              >
                <div className="font-sans leading-relaxed">
                  {renderFormattedMessage(msg.content)}
                </div>
                <span className="block text-[9px] font-mono-code opacity-50 mt-2 text-right">
                  {new Date(msg.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                </span>
              </div>
            </div>
          );
        })}

        {isLoading && (
          <div className="flex items-start gap-3">
            <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-tr from-purple-600 to-pink-500 text-white shadow-md">
              <GraduationCap className="h-4 w-4" />
            </div>
            <div className="liquid-glass border border-slate-200/60 dark:border-white/10 rounded-3xl rounded-tl-none p-4 flex items-center gap-2.5 text-xs text-violet-600 dark:text-violet-400 shadow-md">
              <Loader2 className="h-4 w-4 animate-spin" />
              <span className="font-mono-code font-bold animate-pulse">
                Aura is analyzing and preparing tutor explanation...
              </span>
            </div>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* Sticky Bottom Docked Chat Box */}
      <div className="sticky bottom-0 z-30 pt-2 pb-1 bg-gradient-to-t from-slate-100 via-slate-100/90 to-transparent dark:from-slate-950 dark:via-slate-950/90 dark:to-transparent">
        <form
          onSubmit={(e) => {
            e.preventDefault();
            handleSendMessage();
          }}
          className="liquid-glass p-1.5 sm:p-2 rounded-2xl sm:rounded-3xl border border-slate-300/80 dark:border-white/20 shadow-2xl flex items-center gap-2 backdrop-blur-xl"
        >
          <input
            type="text"
            value={inputMessage}
            onChange={(e) => setInputMessage(e.target.value)}
            placeholder={`Ask Aura anything about ${selectedBook?.title || 'your studies'}...`}
            disabled={isLoading}
            className="flex-1 bg-transparent px-4 py-3 text-xs sm:text-sm text-slate-900 dark:text-white placeholder:text-slate-400 focus:outline-none"
          />
          <button
            type="submit"
            disabled={isLoading || !inputMessage.trim()}
            className="flex h-10 w-10 sm:h-11 sm:w-11 shrink-0 items-center justify-center rounded-xl sm:rounded-2xl bg-gradient-to-r from-violet-600 via-purple-600 to-indigo-600 text-white disabled:opacity-40 hover:scale-105 active:scale-95 transition-all shadow-lg shadow-violet-600/40 cursor-pointer"
            aria-label="Send message"
          >
            <Send className="h-4 w-4 sm:h-5 sm:w-5" />
          </button>
        </form>
      </div>
    </div>
  );
};
