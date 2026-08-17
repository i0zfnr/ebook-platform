import React, { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { Library, UploadCloud, Home, Info, Menu, X, Sparkles } from 'lucide-react';
import { ThemeToggle } from '../common/ThemeToggle';
import { BrandLogo } from '../common/BrandLogo';

export const Navbar: React.FC = () => {
  const location = useLocation();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const navLinks = [
    { name: 'Home', path: '/', icon: Home },
    { name: 'Library', path: '/library', icon: Library },
    { name: 'Upload', path: '/upload', icon: UploadCloud },
    { name: 'About', path: '/about', icon: Info },
  ];

  const isActive = (path: string) => {
    if (path === '/' && location.pathname === '/') return true;
    if (path !== '/' && location.pathname.startsWith(path)) return true;
    return false;
  };

  return (
    <header className="sticky top-0 z-40 w-full liquid-nav transition-all duration-300">
      <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-3 sm:px-6 lg:px-8">
        {/* Brand Logo with Professional Vector Icon */}
        <Link to="/" className="flex items-center gap-3 group">
          <BrandLogo />
          <div>
            <div className="flex items-center gap-1.5">
              <span className="text-xl font-extrabold tracking-tight text-slate-900 dark:text-[#f8fafc]">
                Flip<span className="text-transparent bg-clip-text bg-gradient-to-r from-violet-600 to-indigo-500 dark:from-[#a78bfa] dark:to-[#c4b5fd]">Book</span>
              </span>
              <span className="liquid-pill text-[10px] px-2 py-0.5">
                AI PRO
              </span>
            </div>
            <p className="text-[11px] text-slate-500 dark:text-[#94a3b8] font-medium hidden sm:block">
              Hafizul Irfan • Politeknik Besut
            </p>
          </div>
        </Link>

        {/* Desktop Navigation Floating Pill Container */}
        <nav className="hidden md:flex items-center gap-1.5 p-1 rounded-2xl liquid-glass">
          {navLinks.map((link) => {
            const Icon = link.icon;
            const active = isActive(link.path);
            return (
              <Link
                key={link.path}
                to={link.path}
                className={`flex items-center gap-2 px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all duration-200 ${
                  active
                    ? 'bg-white text-violet-700 shadow-md shadow-violet-500/10 dark:bg-violet-600/30 dark:text-white dark:border dark:border-violet-400/30'
                    : 'text-slate-600 hover:text-slate-900 hover:bg-white/50 dark:text-[#94a3b8] dark:hover:text-white dark:hover:bg-white/5'
                }`}
              >
                <Icon className={`h-4 w-4 ${active ? 'text-violet-600 dark:text-[#a78bfa]' : 'text-slate-400'}`} />
                {link.name}
              </Link>
            );
          })}
        </nav>

        {/* Action Button & Theme Toggle */}
        <div className="hidden md:flex items-center gap-2.5">
          <ThemeToggle />
          
          <Link
            to="/upload"
            className="liquid-btn-primary flex items-center gap-2 px-4 py-2 text-xs font-extrabold"
          >
            <Sparkles className="h-4 w-4" />
            Publish Book
          </Link>
        </div>

        {/* Mobile menu button & Theme toggle */}
        <div className="flex md:hidden items-center gap-2">
          <ThemeToggle />
          <button
            type="button"
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="rounded-xl p-2 text-slate-600 hover:bg-slate-100 dark:text-slate-300 dark:hover:bg-white/10 focus:outline-none"
            aria-label="Toggle navigation menu"
          >
            {mobileMenuOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
          </button>
        </div>
      </div>

      {/* Mobile menu dropdown */}
      {mobileMenuOpen && (
        <div className="md:hidden border-t border-slate-200/60 dark:border-white/10 px-4 pt-3 pb-5 space-y-2 liquid-glass">
          {navLinks.map((link) => {
            const Icon = link.icon;
            const active = isActive(link.path);
            return (
              <Link
                key={link.path}
                to={link.path}
                onClick={() => setMobileMenuOpen(false)}
                className={`flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-sm font-semibold ${
                  active
                    ? 'bg-violet-500/15 text-violet-700 dark:text-[#a78bfa] border border-violet-500/20 font-bold'
                    : 'text-slate-700 hover:bg-white/40 dark:text-[#94a3b8] dark:hover:bg-white/5 dark:hover:text-white'
                }`}
              >
                <Icon className="h-4 w-4" />
                {link.name}
              </Link>
            );
          })}
          <div className="pt-2">
            <Link
              to="/upload"
              onClick={() => setMobileMenuOpen(false)}
              className="liquid-btn-primary flex w-full items-center justify-center gap-2 py-2.5 text-xs font-bold"
            >
              <Sparkles className="h-4 w-4" />
              Publish Book
            </Link>
          </div>
        </div>
      )}
    </header>
  );
};
