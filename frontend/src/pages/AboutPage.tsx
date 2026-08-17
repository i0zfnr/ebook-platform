import React from 'react';
import { Link } from 'react-router-dom';
import {
  ShieldAlert,
  ShieldCheck,
  Sparkles,
  Zap,
  Lock,
  BookOpen,
  Terminal,
  Smartphone,
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
            Built for Fun, Freedom &{' '}
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-violet-600 via-indigo-500 to-purple-600 dark:from-[#a78bfa] dark:via-[#c4b5fd] dark:to-[#818cf8]">
              Distraction-Free
            </span>{' '}
            Learning.
          </h1>

          <p className="max-w-2xl mx-auto text-base sm:text-lg text-slate-600 dark:text-[#94a3b8] leading-relaxed">
            A passion project engineered by <strong className="text-slate-900 dark:text-[#f8fafc]">Hafizul Irfan</strong>, student of Diploma in Information Technology (DIT) at Politeknik Besut, to solve the frustrations of commercial e-book viewers.
          </p>
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
                <h3 className="text-lg font-bold text-slate-900 dark:text-[#f8fafc]">The Problem with Other Platforms</h3>
                <p className="text-xs text-slate-500 dark:text-[#94a3b8]">Why existing flipbook sites are frustrating</p>
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
                <span><strong>Free for Politeknik Besut:</strong> Openly accessible for all lecturers to upload educational modules and notes.</span>
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

        {/* Future Evolution Roadmap */}
        <div className="space-y-6">
          <div className="text-center space-y-2">
            <div className="inline-flex items-center gap-1.5 liquid-pill text-[10px] py-0.5 px-2.5">
              <Zap className="h-3 w-3 text-violet-600 dark:text-[#a78bfa]" />
              Platform Roadmap
            </div>
            <h2 className="text-2xl sm:text-3xl font-extrabold text-slate-900 dark:text-[#f8fafc]">
              The Vision Ahead
            </h2>
            <p className="text-xs text-slate-500 dark:text-[#94a3b8]">
              Continuous evolution crafted for Politeknik Besut
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-4">
            {/* Phase 1 - Current */}
            <div className="liquid-card p-6 space-y-4">
              <div className="flex items-center justify-between">
                <span className="liquid-pill text-[10px] py-0.5 px-2 font-bold">
                  Phase 1 • Active Now
                </span>
                <span className="text-emerald-500 text-xs font-mono-code font-bold">Live</span>
              </div>
              <h3 className="text-base font-bold text-slate-900 dark:text-[#f8fafc]">Frictionless Open Publishing</h3>
              <p className="text-xs text-slate-600 dark:text-[#94a3b8] leading-relaxed">
                Lecturers and creators can immediately publish PDF modules without accounts. Fast vector rendering, high-DPI scaling, table of contents extraction, and in-book text search are fully active.
              </p>
            </div>

            {/* Phase 2 - Upcoming */}
            <div className="liquid-card p-6 space-y-4 border-violet-500/40">
              <div className="flex items-center justify-between">
                <span className="liquid-pill text-[10px] py-0.5 px-2 font-bold text-violet-600 dark:text-[#a78bfa]">
                  Phase 2 • Coming Soon
                </span>
                <span className="text-violet-500 text-xs font-mono-code font-bold">In Development</span>
              </div>
              <h3 className="text-base font-bold text-slate-900 dark:text-[#f8fafc] flex items-center gap-2">
                <Lock className="h-4 w-4 text-violet-600 dark:text-[#a78bfa]" />
                Institutional Poli Email Authentication
              </h3>
              <p className="text-xs text-slate-600 dark:text-[#94a3b8] leading-relaxed">
                A verified portal allowing lecturers to authenticate with their official Politeknik Besut email (<code className="font-mono-code text-violet-600 dark:text-[#c4b5fd]">@politeknik.edu.my</code>) to manage collections, while keeping student reading 100% login-free.
              </p>
            </div>
          </div>
        </div>

        {/* Creator & Academic Bio Card */}
        <div className="liquid-glass rounded-3xl p-8 sm:p-12 shadow-2xl flex flex-col md:flex-row items-center justify-between gap-8">
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
                Passionate about building state-of-the-art web applications, modern UI/UX design systems, and practical tools that enhance student learning experiences.
              </p>
            </div>
          </div>

          <div className="flex flex-col sm:flex-row items-center gap-3 shrink-0">
            <a
              href="https://github.com/i0zfnr/my-portfolio.git"
              target="_blank"
              rel="noopener noreferrer"
              className="liquid-btn-primary flex items-center gap-2 px-5 py-2.5 text-xs font-bold"
            >
              <Terminal className="h-4 w-4" />
              <span>View Portfolio</span>
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
