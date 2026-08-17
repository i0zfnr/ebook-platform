import React from 'react';
import { Link } from 'react-router-dom';
import {
  ShieldAlert,
  ShieldCheck,
  Sparkles,
  BookOpen,
  Terminal,
  Smartphone,
  Bot,
  Gamepad2,
  GraduationCap,
  Cpu,
  Layers,
  ExternalLink,
} from 'lucide-react';
import { BrandLogo } from '../components/common/BrandLogo';

export const AboutPage: React.FC = () => {
  return (
    <div className="flex flex-col min-h-screen text-slate-900 dark:text-[#f8fafc] py-16 sm:py-24">
      <div className="mx-auto max-w-5xl px-4 sm:px-6 lg:px-8 space-y-20">
        {/* Hero Section */}
        <div className="text-center space-y-4">
          <div className="inline-flex items-center gap-2 liquid-pill mb-2">
            <Sparkles className="h-3.5 w-3.5 text-violet-600 dark:text-[#a78bfa]" />
            <span>Story & Vision • Politeknik Besut</span>
          </div>

          <h1 className="text-4xl sm:text-5xl lg:text-6xl font-extrabold tracking-tight text-slate-900 dark:text-[#f8fafc] max-w-3xl mx-auto leading-tight">
            Next-Gen E-Books Powered by{' '}
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-violet-600 via-indigo-500 to-purple-600 dark:from-[#a78bfa] dark:via-[#c4b5fd] dark:to-[#818cf8]">
              Gemini AI
            </span>{' '}
            & Pure Interactive Learning.
          </h1>

          <p className="max-w-2xl mx-auto text-base sm:text-lg text-slate-600 dark:text-[#94a3b8] leading-relaxed">
            An innovative open-source educational platform engineered by <strong className="text-slate-900 dark:text-[#f8fafc]">Hafizul Irfan</strong>, student of Diploma in Information Technology (DIT) at Politeknik Besut, combining smooth 3D flipbook reading with real-time AI pedagogical tutoring.
          </p>
        </div>

        {/* AI Innovation Showcase */}
        <div className="liquid-glass rounded-3xl p-8 sm:p-10 shadow-2xl border border-violet-500/30 dark:border-violet-500/20 relative overflow-hidden space-y-8">
          <div className="absolute top-0 right-0 w-96 h-96 bg-violet-600/10 rounded-full blur-3xl pointer-events-none" />

          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="flex items-center gap-3.5">
              <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-tr from-violet-600 via-purple-600 to-indigo-600 text-white shadow-xl shadow-violet-600/30">
                <Bot className="h-6 w-6" />
              </div>
              <div>
                <h2 className="text-xl sm:text-2xl font-extrabold text-slate-900 dark:text-white">
                  The Google Gemini 3.6 Flash AI Engine
                </h2>
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  Active document research & interactive learning automation
                </p>
              </div>
            </div>
            <span className="liquid-pill text-[11px] py-1 px-3 font-mono-code font-bold text-violet-600 dark:text-violet-400">
              Live AI Integration
            </span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
            <div className="liquid-card p-5 space-y-2.5">
              <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-violet-600/10 text-violet-600 dark:text-[#a78bfa]">
                <Cpu className="h-5 w-5" />
              </div>
              <h3 className="text-sm font-bold text-slate-900 dark:text-white">Active Research & Quizzes</h3>
              <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed">
                When a textbook is uploaded, Gemini deep-dives into mathematical theorems, formulas, and technical chapters to formulate curriculum-grade quizzes with step-by-step solutions.
              </p>
            </div>

            <div className="liquid-card p-5 space-y-2.5">
              <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-purple-600/10 text-purple-600 dark:text-[#c084fc]">
                <Gamepad2 className="h-5 w-5" />
              </div>
              <h3 className="text-sm font-bold text-slate-900 dark:text-white">Speed Match Game & 3D Cards</h3>
              <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed">
                Gamified learning suite featuring 3D interactive flashcards and an arcade Speed Match Game testing term recall directly embedded on relevant flipped pages.
              </p>
            </div>

            <div className="liquid-card p-5 space-y-2.5">
              <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-indigo-600/10 text-indigo-600 dark:text-[#818cf8]">
                <GraduationCap className="h-5 w-5" />
              </div>
              <h3 className="text-sm font-bold text-slate-900 dark:text-white">Aura AI Academic Tutor</h3>
              <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed">
                A 1-on-1 pedagogical companion available both as a page-aware slide-out drawer inside the reader and as a full-page dedicated study room.
              </p>
            </div>
          </div>
        </div>

        {/* Why this was built: The Problem vs Solution */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* The Annoying Commercial Platforms */}
          <div className="liquid-card p-8 border-red-500/20 bg-red-50/20 dark:bg-red-950/10 space-y-5">
            <div className="flex items-center gap-3">
              <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-red-500/10 text-red-500 border border-red-500/20 shadow-sm">
                <ShieldAlert className="h-6 w-6" />
              </div>
              <div>
                <h3 className="text-lg font-bold text-slate-900 dark:text-[#f8fafc]">The Problem with Commercial Viewers</h3>
                <p className="text-xs text-slate-500 dark:text-[#94a3b8]">Why standard flipbook sites are frustrating</p>
              </div>
            </div>

            <ul className="space-y-3.5 text-xs sm:text-sm text-slate-600 dark:text-[#94a3b8]">
              <li className="flex items-start gap-2.5">
                <span className="text-red-500 font-bold shrink-0">✕</span>
                <span><strong>Annoying Advertisements:</strong> Constant video popups, banner ads, and intrusive trackers that ruin the reading flow.</span>
              </li>
              <li className="flex items-start gap-2.5">
                <span className="text-red-500 font-bold shrink-0">✕</span>
                <span><strong>Forced Paywalls & Subscriptions:</strong> You have to pay monthly fees just to remove ads or share full PDFs.</span>
              </li>
              <li className="flex items-start gap-2.5">
                <span className="text-red-500 font-bold shrink-0">✕</span>
                <span><strong>Account Fatigue:</strong> Requiring mandatory sign-ups and passwords before a student can even view lecture slides.</span>
              </li>
            </ul>
          </div>

          {/* Our FlipBook Solution */}
          <div className="liquid-card p-8 border-violet-500/30 bg-violet-50/20 dark:bg-violet-950/10 space-y-5">
            <div className="flex items-center gap-3">
              <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-violet-600/10 text-violet-600 dark:text-[#a78bfa] border border-violet-500/20 shadow-sm">
                <ShieldCheck className="h-6 w-6" />
              </div>
              <div>
                <h3 className="text-lg font-bold text-slate-900 dark:text-[#f8fafc]">The FlipBook Advantage</h3>
                <p className="text-xs text-slate-500 dark:text-[#94a3b8]">Free, clean, and built for education</p>
              </div>
            </div>

            <ul className="space-y-3.5 text-xs sm:text-sm text-slate-600 dark:text-[#94a3b8]">
              <li className="flex items-start gap-2.5">
                <span className="text-emerald-500 font-bold shrink-0">✓</span>
                <span><strong>100% Ad-Free Forever:</strong> Zero commercial ads, zero tracking scripts, and zero distractions during lectures.</span>
              </li>
              <li className="flex items-start gap-2.5">
                <span className="text-emerald-500 font-bold shrink-0">✓</span>
                <span><strong>Free for Politeknik Besut:</strong> Openly accessible for all lecturers to upload educational modules and notes up to 512MB.</span>
              </li>
              <li className="flex items-start gap-2.5">
                <span className="text-emerald-500 font-bold shrink-0">✓</span>
                <span><strong>No Student Login Required:</strong> Seamless reading where progress and bookmarks are saved straight to your device.</span>
              </li>
            </ul>
          </div>
        </div>

        {/* Device Session Architecture (No Student Login) */}
        <div className="liquid-glass rounded-3xl p-8 sm:p-10 shadow-2xl space-y-6">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div className="flex items-center gap-3.5">
              <div className="flex h-12 w-12 items-center justify-center rounded-2xl liquid-glass text-violet-600 dark:text-[#a78bfa] shadow-md">
                <Smartphone className="h-6 w-6" />
              </div>
              <div>
                <h2 className="text-xl font-bold text-slate-900 dark:text-[#f8fafc]">
                  Device-Level Session Technology
                </h2>
                <p className="text-xs text-slate-500 dark:text-[#94a3b8]">
                  How students get a personalized experience without accounts
                </p>
              </div>
            </div>
            <span className="liquid-pill text-[11px] py-1 px-3">
              Zero Signup Barrier
            </span>
          </div>

          <p className="text-sm text-slate-600 dark:text-[#94a3b8] leading-relaxed">
            Students shouldn't have to remember another username or password just to review course notes. This platform uses hardware-accelerated local device persistence (<code className="font-mono-code text-violet-600 dark:text-[#c4b5fd]">localStorage</code>). When you read on your laptop, iPad, or smartphone, your last-read page, chapter positions, and personal bookmarks are saved locally and restore instantly.
          </p>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-2">
            <div className="liquid-glass p-4 rounded-2xl space-y-1">
              <span className="text-xs font-mono-code font-bold text-violet-600 dark:text-[#a78bfa]">01. 0ms Latency</span>
              <p className="text-xs text-slate-500 dark:text-[#94a3b8]">Your bookmarks and progress load instantaneously from device memory.</p>
            </div>
            <div className="liquid-glass p-4 rounded-2xl space-y-1">
              <span className="text-xs font-mono-code font-bold text-violet-600 dark:text-[#a78bfa]">02. 100% Privacy</span>
              <p className="text-xs text-slate-500 dark:text-[#94a3b8]">No tracking cookies or personal credentials collected.</p>
            </div>
            <div className="liquid-glass p-4 rounded-2xl space-y-1">
              <span className="text-xs font-mono-code font-bold text-violet-600 dark:text-[#a78bfa]">03. Cross-Session</span>
              <p className="text-xs text-slate-500 dark:text-[#94a3b8]">Pick up right where you left off even after closing the browser.</p>
            </div>
          </div>
        </div>

        {/* Tech Stack Matrix */}
        <div className="space-y-6">
          <div className="text-center space-y-2">
            <div className="inline-flex items-center gap-1.5 liquid-pill text-[10px] py-0.5 px-2.5">
              <Layers className="h-3 w-3 text-violet-600 dark:text-[#a78bfa]" />
              Modern Architecture
            </div>
            <h2 className="text-2xl sm:text-3xl font-extrabold text-slate-900 dark:text-[#f8fafc]">
              Built with Modern Engineering
            </h2>
            <p className="text-xs text-slate-500 dark:text-[#94a3b8]">
              High-performance technologies engineered for speed and reliability
            </p>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 pt-2">
            <div className="liquid-card p-4 text-center space-y-1.5">
              <p className="text-xs font-extrabold text-slate-900 dark:text-white">React 18 + Vite</p>
              <p className="text-[11px] text-slate-500 dark:text-slate-400">Ultra-fast frontend with TypeScript</p>
            </div>
            <div className="liquid-card p-4 text-center space-y-1.5">
              <p className="text-xs font-extrabold text-slate-900 dark:text-white">Laravel 11 REST API</p>
              <p className="text-[11px] text-slate-500 dark:text-slate-400">Robust backend with 512MB uploads</p>
            </div>
            <div className="liquid-card p-4 text-center space-y-1.5">
              <p className="text-xs font-extrabold text-slate-900 dark:text-white">Gemini 3.6 Flash</p>
              <p className="text-[11px] text-slate-500 dark:text-slate-400">Generative academic research AI</p>
            </div>
            <div className="liquid-card p-4 text-center space-y-1.5">
              <p className="text-xs font-extrabold text-slate-900 dark:text-white">Liquid Glassmorphism</p>
              <p className="text-[11px] text-slate-500 dark:text-slate-400">Apple-grade dark & light UI system</p>
            </div>
          </div>
        </div>

        {/* Creator & Academic Bio Card */}
        <div className="liquid-glass rounded-3xl p-8 sm:p-12 shadow-2xl flex flex-col md:flex-row items-center justify-between gap-8 border border-white/20">
          <div className="flex flex-col sm:flex-row items-center gap-5 text-center sm:text-left">
            <BrandLogo size="lg" />
            <div className="space-y-1">
              <h3 className="text-xl font-bold text-slate-900 dark:text-[#f8fafc]">
                Hafizul Irfan
              </h3>
              <p className="text-xs text-violet-600 dark:text-[#a78bfa] font-mono-code font-bold">
                Student DIT • Politeknik Besut, Terengganu
              </p>
              <p className="text-xs text-slate-500 dark:text-[#94a3b8] max-w-md pt-1 leading-relaxed">
                Passionate about engineering state-of-the-art web applications, intuitive UI/UX design systems, and generative AI tools that empower higher-education learning.
              </p>
            </div>
          </div>

          <div className="flex flex-col sm:flex-row items-center gap-3 shrink-0">
            <a
              href="https://github.com/i0zfnr/ebook-platform"
              target="_blank"
              rel="noopener noreferrer"
              className="liquid-btn-primary flex items-center gap-2 px-5 py-2.5 text-xs font-bold shadow-lg shadow-violet-600/30"
            >
              <Terminal className="h-4 w-4" />
              <span>GitHub Repo</span>
              <ExternalLink className="h-3 w-3 opacity-70" />
            </a>
            <Link
              to="/library"
              className="liquid-btn-secondary flex items-center gap-2 px-5 py-2.5 text-xs font-bold"
            >
              <BookOpen className="h-4 w-4" />
              <span>Explore Library</span>
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
};
