import React, { useState, useRef, useEffect } from 'react';
import {
  X,
  Send,
  Bot,
  User,
  Sparkles,
  Loader2,
  Trash2,
  HelpCircle,
  Calculator,
} from 'lucide-react';
import { aiChatService, type ChatMessage } from '../../services/aiChatService';

interface AiChatDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  bookTitle: string;
  currentPage: number;
  pageText?: string;
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
          content: `👋 Hi! I am **Aura**, your AI Study Companion for **${bookTitle}**.\n\nYou are currently on **Page ${currentPage}**. How can I help you understand this chapter?`,
          timestamp: Date.now(),
        },
      ]);
    }
  }, [isOpen, bookTitle, currentPage, messages.length]);

  // Scroll to bottom when messages change
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
      <div className="flex items-center justify-between border-b border-slate-200/50 dark:border-white/10 px-5 py-3.5">
        <div className="flex items-center gap-2.5">
          <div className="flex h-9 w-9 items-center justify-center rounded-2xl bg-gradient-to-tr from-violet-600 to-indigo-600 text-white shadow-lg shadow-violet-600/30">
            <Bot className="h-5 w-5" />
          </div>
          <div>
            <div className="flex items-center gap-1.5">
              <h3 className="text-sm font-extrabold text-slate-900 dark:text-white">
                AI Study Tutor
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
      <div className="flex items-center gap-2 overflow-x-auto p-3 border-b border-slate-200/40 dark:border-white/5 no-scrollbar">
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
      <div className="flex-1 overflow-y-auto p-4 space-y-4 select-text">
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
                    ? 'bg-violet-600 shadow-md shadow-violet-600/30'
                    : 'bg-indigo-600 shadow-md shadow-indigo-600/30'
                }`}
              >
                {isUser ? <User className="h-3.5 w-3.5" /> : <Bot className="h-3.5 w-3.5" />}
              </div>

              <div
                className={`max-w-[82%] rounded-2xl p-3.5 text-xs leading-relaxed shadow-sm ${
                  isUser
                    ? 'bg-gradient-to-r from-violet-600 to-indigo-600 text-white rounded-tr-none'
                    : 'liquid-glass border border-slate-200/60 dark:border-white/10 text-slate-800 dark:text-[#f8fafc] rounded-tl-none'
                }`}
              >
                <div className="whitespace-pre-wrap font-sans">{msg.content}</div>
                <span className="block text-[9px] font-mono-code opacity-50 mt-1 text-right">
                  {new Date(msg.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                </span>
              </div>
            </div>
          );
        })}

        {isLoading && (
          <div className="flex items-start gap-2.5">
            <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-xl bg-indigo-600 text-white shadow-md">
              <Bot className="h-3.5 w-3.5" />
            </div>
            <div className="liquid-glass border border-slate-200/60 dark:border-white/10 rounded-2xl rounded-tl-none p-3.5 flex items-center gap-2 text-xs text-violet-600 dark:text-violet-400">
              <Loader2 className="h-4 w-4 animate-spin" />
              <span className="font-mono-code animate-pulse">Aura is formulating response...</span>
            </div>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* Input Form */}
      <div className="border-t border-slate-200/50 dark:border-white/10 p-3 bg-white/40 dark:bg-slate-900/40 backdrop-blur-md">
        <form
          onSubmit={(e) => {
            e.preventDefault();
            handleSendMessage();
          }}
          className="flex items-center gap-2"
        >
          <input
            type="text"
            value={inputMessage}
            onChange={(e) => setInputMessage(e.target.value)}
            placeholder={`Ask Aura about Page ${currentPage}...`}
            disabled={isLoading}
            className="flex-1 rounded-xl bg-white/80 dark:bg-slate-950/80 border border-slate-300 dark:border-white/15 px-3.5 py-2.5 text-xs text-slate-900 dark:text-white placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-violet-500/50"
          />
          <button
            type="submit"
            disabled={isLoading || !inputMessage.trim()}
            className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-r from-violet-600 to-indigo-600 text-white disabled:opacity-40 hover:scale-105 active:scale-95 transition-all shadow-md shadow-violet-600/30 cursor-pointer"
            aria-label="Send message"
          >
            <Send className="h-4 w-4" />
          </button>
        </form>
      </div>
    </div>
  );
};
