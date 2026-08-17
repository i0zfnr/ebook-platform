import React from 'react';
import { GraduationCap, Code2, Sparkles, ShieldCheck, Terminal } from 'lucide-react';
import { Link } from 'react-router-dom';
import { BrandLogo } from '../common/BrandLogo';

export const Footer: React.FC = () => {
  return (
    <footer className="relative z-10 border-t border-slate-200/60 dark:border-white/10 liquid-glass text-slate-500 dark:text-[#94a3b8] py-14 mt-auto transition-colors duration-300">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 md:grid-cols-12 gap-8 pb-10 border-b border-slate-200/50 dark:border-white/10">
          {/* Brand & Author Identity */}
          <div className="md:col-span-6 space-y-3">
            <div className="flex items-center gap-3">
              <BrandLogo />
              <div>
                <div className="flex items-center gap-2">
                  <span className="text-base font-extrabold tracking-tight text-slate-900 dark:text-[#f8fafc]">
                    Flip<span className="text-violet-600 dark:text-[#a78bfa]">Book</span>
                  </span>
                  <span className="liquid-pill text-[10px] py-0.5 px-2">
                    by Hafizul Irfan
                  </span>
                </div>
                <p className="text-xs text-slate-500 dark:text-[#94a3b8] mt-0.5 font-medium">
                  Self-Hosted Digital Publishing & Interactive Flipbook Platform
                </p>
              </div>
            </div>

            <p className="text-xs text-slate-600 dark:text-[#94a3b8] leading-relaxed max-w-md">
              Developed as a standalone personal digital publishing product for hosting, viewing, and sharing interactive flipbooks with realistic physics and ultra-crisp vector clarity.
            </p>

            {/* Academic Credential Pill */}
            <div className="inline-flex items-center gap-2 liquid-pill text-xs py-1 px-3.5">
              <GraduationCap className="h-3.5 w-3.5" />
              <span>Hafizul Irfan • Student DIT, Politeknik Besut</span>
            </div>
          </div>

          {/* Quick Navigation Links */}
          <div className="md:col-span-3 space-y-3">
            <h4 className="text-xs font-bold uppercase tracking-wider text-slate-900 dark:text-[#f8fafc] font-mono-code">
              Navigation
            </h4>
            <ul className="space-y-2 text-xs font-medium">
              <li>
                <Link to="/" className="hover:text-violet-600 dark:hover:text-[#a78bfa] transition-colors flex items-center gap-1.5">
                  <span>Home</span>
                </Link>
              </li>
              <li>
                <Link to="/library" className="hover:text-violet-600 dark:hover:text-[#a78bfa] transition-colors flex items-center gap-1.5">
                  <span>E-Book Library</span>
                </Link>
              </li>
              <li>
                <Link to="/upload" className="hover:text-violet-600 dark:hover:text-[#a78bfa] transition-colors flex items-center gap-1.5">
                  <Sparkles className="h-3 w-3 text-violet-500" />
                  <span>Publish New E-Book</span>
                </Link>
              </li>
              <li>
                <Link to="/about" className="hover:text-violet-600 dark:hover:text-[#a78bfa] transition-colors flex items-center gap-1.5">
                  <span>About Platform</span>
                </Link>
              </li>
            </ul>
          </div>

          {/* Project & Portfolio Links */}
          <div className="md:col-span-3 space-y-3">
            <h4 className="text-xs font-bold uppercase tracking-wider text-slate-900 dark:text-[#f8fafc] font-mono-code">
              Developer Info
            </h4>
            <div className="space-y-2 text-xs">
              <a
                href="https://github.com/i0zfnr/my-portfolio.git"
                target="_blank"
                rel="noopener noreferrer"
                className="liquid-btn-secondary inline-flex items-center gap-2 px-3.5 py-2 text-xs font-semibold shadow-sm"
              >
                <Terminal className="h-4 w-4 text-violet-600 dark:text-[#a78bfa]" />
                <span>Hafizul Irfan's Portfolio</span>
              </a>

              <div className="flex items-center gap-1.5 text-[11px] text-slate-500 dark:text-[#94a3b8] pt-1">
                <ShieldCheck className="h-3.5 w-3.5 text-emerald-500 dark:text-emerald-400" />
                <span>Diploma in Information Technology</span>
              </div>
            </div>
          </div>
        </div>

        {/* Bottom Credits & Copyright */}
        <div className="pt-8 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs">
          <div className="flex items-center gap-2 text-slate-600 dark:text-[#94a3b8]">
            <span>© {new Date().getFullYear()} FlipBook Platform.</span>
            <span>•</span>
            <span className="font-semibold text-slate-900 dark:text-[#f8fafc]">Product of Hafizul Irfan</span>
            <span>•</span>
            <span className="font-mono-code text-[11px]">DIT Politeknik Besut</span>
          </div>

          <div className="flex items-center gap-1.5 text-slate-500 dark:text-[#94a3b8]">
            <span>Engineered by</span>
            <span className="liquid-pill text-xs py-0.5 px-2 text-slate-900 dark:text-[#f8fafc]">
              <Code2 className="h-3.5 w-3.5 text-violet-600 dark:text-[#a78bfa]" />
              Hafizul Irfan
            </span>
          </div>
        </div>
      </div>
    </footer>
  );
};
