import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import {
  BookOpen,
  UploadCloud,
  Sparkles,
  Layers,
  Smartphone,
  ShieldCheck,
  ArrowRight,
  GraduationCap,
} from 'lucide-react';
import type { Ebook } from '../types/ebook';
import { ebookService } from '../services/ebookService';
import { BookGrid } from '../components/books/BookGrid';
import { BrandLogo } from '../components/common/BrandLogo';

export const HomePage: React.FC = () => {
  const [recentBooks, setRecentBooks] = useState<Ebook[]>([]);
  const [loading, setLoading] = useState<boolean>(true);

  useEffect(() => {
    ebookService
      .getEbooks()
      .then((data) => {
        setRecentBooks(data.slice(0, 5));
      })
      .catch(() => {
        // Handled gracefully in grid
      })
      .finally(() => {
        setLoading(false);
      });
  }, []);

  const features = [
    {
      icon: Layers,
      title: 'Realistic 3D Page Flip',
      description: 'Experience natural book simulation with fluid page-turning physics and authentic specular lighting.',
    },
    {
      icon: ShieldCheck,
      title: '100% Ad-Free & Self-Hosted',
      description: 'Zero third-party trackers or distracting advertisements. Your library remains completely private.',
    },
    {
      icon: Smartphone,
      title: 'Responsive & Mobile Ready',
      description: 'Two-page spread on desktop and smart single-page reading on tablets and smartphones.',
    },
  ];

  return (
    <div className="flex flex-col min-h-screen text-slate-900 dark:text-[#f8fafc]">
      {/* Hero Section with Liquid Glass Ambience */}
      <section className="relative overflow-hidden py-24 sm:py-32">
        <div className="relative mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 text-center">
          {/* VisionOS Style Liquid Pill */}
          <div className="inline-flex items-center gap-2 liquid-pill mb-6">
            <span className="h-2 w-2 rounded-full bg-violet-600 dark:bg-[#a78bfa] animate-ping inline-block" />
            <span>Product by Hafizul Irfan • DIT Politeknik Besut</span>
          </div>

          <h1 className="text-4xl font-extrabold tracking-tight text-slate-900 dark:text-[#f8fafc] sm:text-6xl lg:text-7xl">
            Read. <span className="text-transparent bg-clip-text bg-gradient-to-r from-violet-600 via-indigo-500 to-purple-600 dark:from-[#a78bfa] dark:via-[#c4b5fd] dark:to-[#818cf8]">Flip.</span> Discover.
          </h1>

          <p className="mx-auto mt-6 max-w-2xl text-base text-slate-600 dark:text-[#94a3b8] sm:text-lg leading-relaxed">
            Turn static PDF documents into interactive, tactile flipbooks. Upload, organize, and immerse yourself in digital reading with Ultra-HD vector clarity.
          </p>

          {/* Action Buttons with Liquid Physics */}
          <div className="mt-10 flex flex-wrap items-center justify-center gap-4">
            <Link
              to="/library"
              className="liquid-btn-primary flex items-center gap-2 px-6 py-3.5 text-sm font-bold shadow-xl"
            >
              <BookOpen className="h-4 w-4" />
              Browse Library
            </Link>
            <Link
              to="/upload"
              className="liquid-btn-secondary flex items-center gap-2 px-6 py-3.5 text-sm font-bold shadow-md"
            >
              <UploadCloud className="h-4 w-4 text-violet-600 dark:text-[#a78bfa]" />
              Upload E-Book
            </Link>
          </div>
        </div>
      </section>

      {/* Features Grid with Liquid Cards */}
      <section className="py-16">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {features.map((feature, idx) => {
              const Icon = feature.icon;
              return (
                <div
                  key={idx}
                  className="liquid-card p-8"
                >
                  <div className="flex h-12 w-12 items-center justify-center rounded-2xl liquid-glass text-violet-600 dark:text-[#a78bfa] mb-5 shadow-sm">
                    <Icon className="h-6 w-6" />
                  </div>
                  <h3 className="text-lg font-bold text-slate-900 dark:text-[#f8fafc] mb-2">{feature.title}</h3>
                  <p className="text-sm text-slate-600 dark:text-[#94a3b8] leading-relaxed">{feature.description}</p>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* Recently Uploaded Books */}
      <section className="py-16">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between mb-8">
            <div>
              <div className="inline-flex items-center gap-1.5 liquid-pill text-[10px] py-0.5 px-2.5 mb-2">
                <Sparkles className="h-3 w-3 text-violet-600 dark:text-[#a78bfa]" />
                Featured Shelf
              </div>
              <h2 className="text-2xl sm:text-3xl font-extrabold text-slate-900 dark:text-[#f8fafc] tracking-tight">
                Recently Added Books
              </h2>
              <p className="text-sm text-slate-500 dark:text-[#94a3b8] mt-1">Explore latest additions to the library</p>
            </div>
            <Link
              to="/library"
              className="flex items-center gap-1.5 text-xs font-bold font-mono-code text-violet-600 hover:text-violet-500 dark:text-[#a78bfa] dark:hover:text-[#c4b5fd] transition-colors"
            >
              <span>View All Books</span>
              <ArrowRight className="h-4 w-4" />
            </Link>
          </div>

          <BookGrid
            ebooks={recentBooks}
            loading={loading}
            emptyTitle="Your library is waiting"
            emptyDescription="Upload your first PDF e-book and experience realistic page-flipping instantly."
          />
        </div>
      </section>

      {/* Author Callout Banner with VisionOS Bevel */}
      <section className="pb-20">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="liquid-glass rounded-3xl p-8 sm:p-10 flex flex-col md:flex-row items-center justify-between gap-6 shadow-2xl">
            <div className="flex items-center gap-4">
              <BrandLogo size="md" />
              <div>
                <h3 className="text-lg font-bold text-slate-900 dark:text-[#f8fafc]">
                  Developed by Hafizul Irfan
                </h3>
                <p className="text-xs text-slate-600 dark:text-[#94a3b8] mt-0.5">
                  Student DIT, Politeknik Besut • Full-Stack Web & Software Development
                </p>
              </div>
            </div>

            <a
              href="https://github.com/i0zfnr/my-portfolio.git"
              target="_blank"
              rel="noopener noreferrer"
              className="liquid-btn-primary flex items-center gap-2 px-5 py-2.5 text-xs font-bold"
            >
              <GraduationCap className="h-4 w-4" />
              Visit Portfolio Repository
            </a>
          </div>
        </div>
      </section>
    </div>
  );
};
