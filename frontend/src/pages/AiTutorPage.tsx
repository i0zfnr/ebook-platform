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
  Sparkle,
  BookOpen,
  ChevronDown,
  Check,
  Brain,
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
      <p key={idx} className="my-1 text-slate-800 dark:text-slate-200 leading-relaxed">
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
  const [isBookDropdownOpen, setIsBookDropdownOpen] = useState<boolean>(false);
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      id: 'init',
      role: 'model',
      content:
        'Welcome to the **Aura AI Study & Memory Room**! 🎓✨\n\nI am your dedicated academic AI tutor for **Politeknik Besut (JMSK)**.\n\nHere is how I can assist you:\n- 🧠 **Active Recall Memory Testing**: Click **"Test My Memory"** and I will quiz you on key formulas, concepts, and theorems from your textbook.\n- 📐 **Step-by-Step Problem Solving**: Ask me to explain any equation, derivation, or chapter topic.\n- 🛡️ **Curriculum Focused**: I only answer questions and conduct memory tests based on your selected e-book (off-topic queries are rejected).\n\nSelect a textbook above or click a memory challenge below to begin!',
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
    <div className="relative flex-1 flex flex-col h-[calc(100vh-4rem)] max-w-5xl mx-auto w-full px-3 sm:px-6 pt-3">
      {/* Top Header Card */}
      <div className="bg-white/90 dark:bg-slate-900/90 rounded-3xl p-4 sm:p-5 mb-3 flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-xl border border-slate-200/80 dark:border-white/10 backdrop-blur-xl shrink-0">
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
                Gemini 3.7 Flash
              </span>
            </div>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Step-by-step mathematical reasoning & academic concept tutor
            </p>
          </div>
        </div>

        {/* Custom Professional Book Context Selector */}
        <div className="relative flex items-center gap-2">
          <span className="text-xs font-mono-code text-slate-400 hidden md:inline">Focus Book:</span>
          
          <div className="relative">
            <button
              type="button"
              onClick={() => setIsBookDropdownOpen(!isBookDropdownOpen)}
              className="liquid-btn-secondary flex items-center gap-2 px-3.5 py-2 text-xs font-bold rounded-xl text-slate-800 dark:text-slate-200 border border-slate-300 dark:border-white/10 bg-white/70 dark:bg-slate-800/70 hover:bg-white dark:hover:bg-slate-800 cursor-pointer shadow-sm max-w-[240px] transition-all"
            >
              <BookOpen className="h-4 w-4 text-violet-600 dark:text-violet-400 shrink-0" />
              <span className="truncate">
                {selectedBook ? selectedBook.title : 'General Academic Tutor'}
              </span>
              <ChevronDown className={`h-3.5 w-3.5 text-slate-400 shrink-0 transition-transform ${isBookDropdownOpen ? 'rotate-180' : ''}`} />
            </button>

            {/* Floating Dropdown Menu */}
            {isBookDropdownOpen && (
              <>
                <div
                  className="fixed inset-0 z-40"
                  onClick={() => setIsBookDropdownOpen(false)}
                />
                <div className="absolute right-0 top-full mt-2 w-72 max-h-72 overflow-y-auto rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-white/15 shadow-2xl p-1.5 z-50 animate-in fade-in zoom-in-95">
                  <div className="px-3 py-1.5 text-[10px] font-mono-code font-bold text-slate-400 uppercase tracking-wider">
                    Select Study Material
                  </div>
                  
                  <button
                    type="button"
                    onClick={() => {
                      setSelectedBook(null);
                      setIsBookDropdownOpen(false);
                    }}
                    className={`flex items-center gap-2.5 w-full text-left px-3 py-2.5 rounded-xl text-xs transition-colors cursor-pointer ${
                      !selectedBook
                        ? 'bg-violet-600/10 text-violet-700 dark:text-violet-300 font-bold'
                        : 'text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-white/5'
                    }`}
                  >
                    <Sparkles className="h-4 w-4 text-violet-500 shrink-0" />
                    <span className="flex-1 truncate">General Academic Tutor</span>
                    {!selectedBook && <Check className="h-4 w-4 text-violet-600 shrink-0" />}
                  </button>

                  {ebooks.map((b) => {
                    const isSelected = selectedBook?.id === b.id;
                    return (
                      <button
                        key={b.id}
                        type="button"
                        onClick={() => {
                          setSelectedBook(b);
                          setIsBookDropdownOpen(false);
                        }}
                        className={`flex items-center gap-2.5 w-full text-left px-3 py-2.5 rounded-xl text-xs transition-colors cursor-pointer ${
                          isSelected
                            ? 'bg-violet-600/10 text-violet-700 dark:text-violet-300 font-bold'
                            : 'text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-white/5'
                        }`}
                      >
                        <BookOpen className="h-4 w-4 text-violet-500 shrink-0" />
                        <div className="flex-1 min-w-0">
                          <p className="truncate">{b.title}</p>
                          {b.author && <p className="text-[10px] text-slate-400 truncate">{b.author}</p>}
                        </div>
                        {isSelected && <Check className="h-4 w-4 text-violet-600 shrink-0" />}
                      </button>
                    );
                  })}
                </div>
              </>
            )}
          </div>

          <button
            type="button"
            onClick={handleClearChat}
            className="p-2 rounded-xl text-slate-400 hover:text-rose-500 hover:bg-rose-500/10 transition-colors cursor-pointer border border-transparent hover:border-rose-500/20"
            title="Reset conversation"
          >
            <Trash2 className="h-4 w-4" />
          </button>
        </div>
      </div>

      {/* Suggested Active Recall & Memory Testing Prompts */}
      <div className="flex items-center gap-2 overflow-x-auto pb-2 shrink-0 no-scrollbar">
        <button
          type="button"
          onClick={() =>
            handleSendMessage(
              selectedBook
                ? `Please test my memory on "${selectedBook.title}". Ask me a challenging conceptual question or formula problem from this textbook, and wait for my answer before revealing the solution!`
                : 'Please test my memory with a challenging question from our syllabus, and wait for my answer!'
            )
          }
          disabled={isLoading}
          className="liquid-pill text-[11px] py-1 px-3 font-bold whitespace-nowrap text-violet-600 dark:text-[#a78bfa] hover:scale-105 active:scale-95 transition-transform flex items-center gap-1.5 cursor-pointer shadow-sm border border-violet-500/30"
        >
          <Brain className="h-3.5 w-3.5 text-violet-500" />
          <span>🧠 Test My Memory (Active Recall)</span>
        </button>

        <button
          type="button"
          onClick={() =>
            handleSendMessage(
              selectedBook
                ? `Give me a formula calculation problem from "${selectedBook.title}" to test if I can recall and solve it step-by-step from memory.`
                : 'Give me a formula problem from the curriculum to test my memory.'
            )
          }
          disabled={isLoading}
          className="liquid-pill text-[11px] py-1 px-3 font-bold whitespace-nowrap text-amber-500 hover:scale-105 active:scale-95 transition-transform flex items-center gap-1.5 cursor-pointer shadow-sm"
        >
          <HelpCircle className="h-3.5 w-3.5" />
          <span>📐 Formula Challenge</span>
        </button>

        <button
          type="button"
          onClick={() =>
            handleSendMessage(
              selectedBook
                ? `Quiz my memory on the 3 most important definitions and academic terms from "${selectedBook.title}" without giving the answers.`
                : 'Quiz my memory on 3 core definitions from this subject.'
            )
          }
          disabled={isLoading}
          className="liquid-pill text-[11px] py-1 px-3 font-bold whitespace-nowrap text-emerald-500 hover:scale-105 active:scale-95 transition-transform flex items-center gap-1.5 cursor-pointer shadow-sm"
        >
          <CheckCircle2 className="h-3.5 w-3.5" />
          <span>📝 Key Terms Recall</span>
        </button>

        <button
          type="button"
          onClick={() =>
            handleSendMessage(
              selectedBook
                ? `Give me a tricky True/False statement about concepts in "${selectedBook.title}" to test my conceptual memory.`
                : 'Give me a True/False statement to test my conceptual recall.'
            )
          }
          disabled={isLoading}
          className="liquid-pill text-[11px] py-1 px-3 font-bold whitespace-nowrap text-indigo-500 hover:scale-105 active:scale-95 transition-transform flex items-center gap-1.5 cursor-pointer shadow-sm"
        >
          <Sparkles className="h-3.5 w-3.5" />
          <span>⚡ True/False Test</span>
        </button>
      </div>

      {/* Messages Scrollable Stage */}
      <div className="flex-1 overflow-y-auto overflow-x-hidden space-y-5 px-3 sm:px-6 py-3 select-text min-h-0">
        {messages.map((msg) => {
          const isUser = msg.role === 'user';
          return (
            <div
              key={msg.id}
              className={`flex items-start gap-3.5 ${isUser ? 'flex-row-reverse' : 'flex-row'}`}
            >
              {/* Professional Avatar Icon */}
              <div
                className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl text-white text-xs shadow-lg transition-transform hover:scale-105 ${
                  isUser
                    ? 'bg-gradient-to-tr from-slate-700 to-slate-900 dark:from-slate-800 dark:to-slate-950 border border-white/20 shadow-slate-900/20'
                    : 'bg-gradient-to-tr from-violet-600 via-purple-600 to-indigo-600 border border-white/25 shadow-violet-600/30'
                }`}
              >
                {isUser ? (
                  <User className="h-4.5 w-4.5 text-white" />
                ) : (
                  <GraduationCap className="h-5 w-5 text-white" />
                )}
              </div>

              {/* Message Bubble */}
              <div
                className={`max-w-[85%] sm:max-w-[80%] rounded-3xl p-4 sm:p-5 text-xs sm:text-sm leading-relaxed shadow-lg ${
                  isUser
                    ? 'bg-gradient-to-r from-violet-600 to-indigo-600 text-white rounded-tr-none shadow-violet-600/20'
                    : 'bg-white dark:bg-slate-900 border border-slate-200/90 dark:border-white/10 text-slate-800 dark:text-[#f8fafc] rounded-tl-none shadow-slate-200/50 dark:shadow-none'
                }`}
              >
                <div className="font-sans leading-relaxed">
                  {renderFormattedMessage(msg.content)}
                </div>
                <span className="block text-[9px] font-mono-code opacity-50 mt-2.5 text-right">
                  {new Date(msg.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                </span>
              </div>
            </div>
          );
        })}

        {isLoading && (
          <div className="flex items-start gap-3.5">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-tr from-violet-600 via-purple-600 to-indigo-600 text-white shadow-lg shadow-violet-600/30 border border-white/25">
              <GraduationCap className="h-5 w-5" />
            </div>
            <div className="bg-white dark:bg-slate-900 border border-slate-200/90 dark:border-white/10 rounded-3xl rounded-tl-none p-4 flex items-center gap-3 text-xs text-violet-600 dark:text-violet-400 shadow-md">
              <Loader2 className="h-4 w-4 animate-spin" />
              <span className="font-mono-code font-bold animate-pulse">
                Aura is analyzing and formulating explanation...
              </span>
            </div>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* Sticky Bottom Docked Chat Box */}
      <div className="sticky bottom-0 z-30 pt-1 pb-3 sm:pb-5 w-full max-w-4xl mx-auto px-2 shrink-0">
        <form
          onSubmit={(e) => {
            e.preventDefault();
            handleSendMessage();
          }}
          className="flex items-center gap-3 bg-white dark:bg-slate-900 rounded-full border border-slate-300 dark:border-slate-700/80 px-4 py-2 sm:py-2.5 shadow-xl hover:border-violet-400/80 dark:hover:border-violet-500/80 focus-within:border-violet-500 dark:focus-within:border-violet-500 focus-within:ring-2 focus-within:ring-violet-500/20 transition-all duration-200"
        >
          <input
            type="text"
            value={inputMessage}
            onChange={(e) => setInputMessage(e.target.value)}
            placeholder={`Ask Aura anything about ${selectedBook?.title || 'your studies'}...`}
            disabled={isLoading}
            className="flex-1 bg-transparent text-xs sm:text-sm text-slate-900 dark:text-white placeholder:text-slate-400 dark:placeholder:text-slate-500 focus:outline-none pl-1"
          />
          <button
            type="submit"
            disabled={isLoading || !inputMessage.trim()}
            className="flex h-9 w-9 sm:h-10 sm:w-10 shrink-0 items-center justify-center rounded-full bg-gradient-to-r from-violet-600 to-indigo-600 text-white disabled:opacity-30 disabled:cursor-not-allowed hover:opacity-90 active:scale-95 transition-all shadow-md shadow-violet-600/30 cursor-pointer"
            aria-label="Send message"
          >
            <Send className="h-4 w-4 text-white" />
          </button>
        </form>

        <p className="text-[10px] font-mono-code text-center text-slate-400 dark:text-slate-500 mt-2 flex items-center justify-center gap-1.5">
          <Sparkle className="h-3 w-3 text-violet-500 inline" />
          <span>Powered by Google Gemini 3.7 Flash • Politeknik Besut Academic AI Companion</span>
        </p>
      </div>
    </div>
  );
};
