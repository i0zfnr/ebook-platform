import React, { useState, useRef, useEffect } from 'react';
import {
  X,
  Send,
  User,
  Sparkles,
  Loader2,
  Trash2,
  HelpCircle,
  Calculator,
  GraduationCap,
} from 'lucide-react';
import { aiChatService, type ChatMessage } from '../../services/aiChatService';

interface AiChatDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  bookTitle: string;
  currentPage: number;
  pageText?: string;
}

/**
 * Format markdown text with bolding, code tags, lists, and headers
 */
function renderFormattedMessage(content: string) {
  const lines = content.split('\n');
  return lines.map((line, idx) => {
    // Header 3
    if (line.startsWith('### ')) {
      return (
        <h4 key={idx} className="font-extrabold text-xs text-violet-700 dark:text-violet-300 mt-2.5 mb-1 flex items-center gap-1">
          <Sparkles className="h-3 w-3 text-amber-400 inline" />
          <span>{line.replace('### ', '')}</span>
        </h4>
      );
    }
    // Header 2
    if (line.startsWith('## ')) {
      return (
        <h3 key={idx} className="font-extrabold text-sm text-slate-900 dark:text-white mt-3 mb-1.5">
          {line.replace('## ', '')}
        </h3>
      );
    }
    // Bullet point
    if (line.startsWith('- ') || line.startsWith('* ')) {
      return (
        <li key={idx} className="ml-3 list-disc text-slate-700 dark:text-slate-200 my-0.5">
          {renderInlineFormatting(line.substring(2))}
        </li>
      );
    }
    // Numbered list
    const numMatch = line.match(/^(\d+)\.\s+(.*)$/);
    if (numMatch) {
      return (
        <li key={idx} className="ml-3 list-decimal text-slate-700 dark:text-slate-200 my-0.5">
          {renderInlineFormatting(numMatch[2])}
        </li>
      );
    }
    // Regular text
    if (!line.trim()) {
      return <div key={idx} className="h-1.5" />;
    }
    return (
      <p key={idx} className="my-0.5 text-slate-800 dark:text-slate-200">
        {renderInlineFormatting(line)}
      </p>
    );
  });
}

function renderInlineFormatting(text: string): React.ReactNode {
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
        <code key={i} className="rounded-md bg-violet-500/15 text-violet-700 dark:text-violet-300 font-mono-code px-1 py-0.2 text-[10px] font-bold">
          {part.slice(1, -1)}
        </code>
      );
    }
    return part;
  });
}

export const AiChatDrawer: React.FC<AiChatDrawerProps> = ({
  isOpen,
  onClose,
  bookTitle,
  currentPage,
  pageText,
}) => {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [inputMessage, setInputMessage] = useState<string>('');
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const messagesEndRef = useRef<HTMLDivElement | null>(null);

  // Initialize with greeting if empty
  useEffect(() => {
    if (messages.length === 0 && isOpen) {
      setMessages([
        {
          id: 'welcome',
          role: 'model',
          content: `Hi! I am **Aura**, your AI Study Companion for **${bookTitle}**.\n\nYou are currently on **Page ${currentPage}**. How can I help you understand this chapter?`,
          timestamp: Date.now(),
        },
      ]);
    }
  }, [isOpen, bookTitle, currentPage, messages.length]);

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
      const reply = await aiChatService.sendMessage(
        text,
        messages,
        {
          bookTitle,
          currentPage,
          pageText,
        }
      );

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
          content: 'Sorry, I encountered an error answering your question. Please try again.',
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
        id: 'reset',
        role: 'model',
        content: `Chat cleared! Ask me anything about **${bookTitle}** (Page ${currentPage}).`,
        timestamp: Date.now(),
      },
    ]);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-y-0 right-0 z-50 flex w-96 max-w-[92vw] flex-col liquid-nav shadow-2xl transition-all duration-300 border-l border-slate-200/50 dark:border-white/10 select-none animate-in slide-in-from-right-4">
      {/* Header */}
      <div className="flex items-center justify-between border-b border-slate-200/50 dark:border-white/10 px-4 py-3.5 shrink-0">
        <div className="flex items-center gap-2.5">
          <div className="relative flex h-9 w-9 items-center justify-center rounded-2xl bg-gradient-to-tr from-violet-600 via-purple-600 to-indigo-600 text-white shadow-lg shadow-violet-600/30">
            <GraduationCap className="h-5 w-5" />
            <span className="absolute -bottom-0.5 -right-0.5 flex h-3 w-3 items-center justify-center rounded-full bg-emerald-500 ring-2 ring-white dark:ring-slate-900">
              <span className="h-1 w-1 rounded-full bg-white animate-pulse" />
            </span>
          </div>
          <div>
            <div className="flex items-center gap-1.5">
              <h3 className="text-sm font-extrabold text-slate-900 dark:text-white">
                Aura AI Tutor
              </h3>
              <span className="liquid-pill text-[9px] py-0.2 px-2 font-mono-code font-bold text-violet-600 dark:text-violet-400">
                Page {currentPage}
              </span>
            </div>
            <p className="text-[11px] text-slate-500 dark:text-slate-400 truncate max-w-[180px]">
              {bookTitle}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-1">
          <button
            type="button"
            onClick={handleClearChat}
            className="p-2 rounded-xl text-slate-400 hover:text-rose-500 hover:bg-rose-500/10 transition-colors cursor-pointer"
            title="Clear conversation"
          >
            <Trash2 className="h-4 w-4" />
          </button>
          <button
            type="button"
            onClick={onClose}
            className="p-2 rounded-xl text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-white/20 transition-colors cursor-pointer"
            aria-label="Close drawer"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
      </div>

      {/* Suggested Quick Prompt Chips */}
      <div className="flex items-center gap-2 overflow-x-auto p-2.5 border-b border-slate-200/40 dark:border-white/5 no-scrollbar shrink-0">
        <button
          type="button"
          onClick={() => handleSendMessage(`Explain what is covered on Page ${currentPage} in simple terms.`)}
          disabled={isLoading}
          className="liquid-pill text-[10px] py-1 px-2.5 font-bold whitespace-nowrap text-violet-600 dark:text-violet-400 hover:scale-105 active:scale-95 transition-transform flex items-center gap-1 cursor-pointer"
        >
          <Sparkles className="h-3 w-3" />
          <span>Explain Page {currentPage}</span>
        </button>

        <button
          type="button"
          onClick={() => handleSendMessage(`Give me a practice problem based on Page ${currentPage} to test my understanding.`)}
          disabled={isLoading}
          className="liquid-pill text-[10px] py-1 px-2.5 font-bold whitespace-nowrap text-amber-500 hover:scale-105 active:scale-95 transition-transform flex items-center gap-1 cursor-pointer"
        >
          <HelpCircle className="h-3 w-3" />
          <span>Practice Problem</span>
        </button>

        <button
          type="button"
          onClick={() => handleSendMessage(`Summarize the key formulas or rules on Page ${currentPage}.`)}
          disabled={isLoading}
          className="liquid-pill text-[10px] py-1 px-2.5 font-bold whitespace-nowrap text-emerald-500 hover:scale-105 active:scale-95 transition-transform flex items-center gap-1 cursor-pointer"
        >
          <Calculator className="h-3 w-3" />
          <span>Key Formulas</span>
        </button>
      </div>

      {/* Messages Feed */}
      <div className="flex-1 overflow-y-auto p-4 space-y-3 select-text">
        {messages.map((msg) => {
          const isUser = msg.role === 'user';
          return (
            <div
              key={msg.id}
              className={`flex items-start gap-2.5 ${isUser ? 'flex-row-reverse' : 'flex-row'}`}
            >
              <div
                className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-xl text-white text-xs ${
                  isUser
                    ? 'bg-gradient-to-tr from-violet-600 to-indigo-600 shadow-md shadow-violet-600/30'
                    : 'bg-gradient-to-tr from-purple-600 via-violet-600 to-pink-500 shadow-md shadow-purple-600/30 ring-1 ring-violet-400/20'
                }`}
              >
                {isUser ? <User className="h-3.5 w-3.5" /> : <GraduationCap className="h-3.5 w-3.5" />}
              </div>

              <div
                className={`max-w-[84%] rounded-2xl p-3 text-xs leading-relaxed shadow-sm ${
                  isUser
                    ? 'bg-gradient-to-r from-violet-600 to-indigo-600 text-white rounded-tr-none'
                    : 'liquid-glass border border-slate-200/60 dark:border-white/10 text-slate-800 dark:text-[#f8fafc] rounded-tl-none'
                }`}
              >
                <div className="font-sans leading-relaxed">{renderFormattedMessage(msg.content)}</div>
                <span className="block text-[9px] font-mono-code opacity-50 mt-1 text-right">
                  {new Date(msg.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                </span>
              </div>
            </div>
          );
        })}

        {isLoading && (
          <div className="flex items-start gap-2.5">
            <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-xl bg-gradient-to-tr from-purple-600 to-pink-500 text-white shadow-md">
              <GraduationCap className="h-3.5 w-3.5" />
            </div>
            <div className="liquid-glass border border-slate-200/60 dark:border-white/10 rounded-2xl rounded-tl-none p-3 flex items-center gap-2 text-xs text-violet-600 dark:text-violet-400">
              <Loader2 className="h-3.5 w-3.5 animate-spin" />
              <span className="font-mono-code animate-pulse">Aura is thinking...</span>
            </div>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* Sticky Bottom Docked Chat Box */}
      <div className="sticky bottom-0 z-30 p-2.5 border-t border-slate-200/50 dark:border-white/10 bg-white/70 dark:bg-slate-900/80 backdrop-blur-xl shrink-0">
        <form
          onSubmit={(e) => {
            e.preventDefault();
            handleSendMessage();
          }}
          className="liquid-glass p-1 rounded-2xl border border-slate-300 dark:border-white/15 flex items-center gap-1.5 shadow-md"
        >
          <input
            type="text"
            value={inputMessage}
            onChange={(e) => setInputMessage(e.target.value)}
            placeholder={`Ask Aura about Page ${currentPage}...`}
            disabled={isLoading}
            className="flex-1 bg-transparent px-3 py-2 text-xs text-slate-900 dark:text-white placeholder:text-slate-400 focus:outline-none"
          />
          <button
            type="submit"
            disabled={isLoading || !inputMessage.trim()}
            className="flex h-8 w-8 shrink-0 items-center justify-center rounded-xl bg-gradient-to-r from-violet-600 via-purple-600 to-indigo-600 text-white disabled:opacity-40 hover:scale-105 active:scale-95 transition-all shadow-md shadow-violet-600/30 cursor-pointer"
            aria-label="Send message"
          >
            <Send className="h-3.5 w-3.5" />
          </button>
        </form>
      </div>
    </div>
  );
};
