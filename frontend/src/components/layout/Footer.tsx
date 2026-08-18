import React from 'react';
import { GraduationCap, Mail, Sparkles, ShieldCheck, Users } from 'lucide-react';
import { Link } from 'react-router-dom';
import { BrandLogo } from '../common/BrandLogo';

export const Footer: React.FC = () => {
  const lecturers = [
    {
      name: 'Farah Hayati Binti Che Lah',
      email: 'farah@polibesut.edu.my',
    },
    {
      name: 'Wan Izyani Binti Wan Jusoh',
      email: 'izyani@polibesut.edu.my',
    },
    {
      name: 'Wee Siew Ping',
      email: 'wee@polibesut.edu.my',
    },
  ];

  return (
    <footer className="relative z-10 border-t border-slate-200/60 dark:border-white/10 liquid-glass text-slate-500 dark:text-[#94a3b8] py-14 mt-auto transition-colors duration-300">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 md:grid-cols-12 gap-8 pb-10 border-b border-slate-200/50 dark:border-white/10">
          {/* Brand & Institution Identity */}
          <div className="md:col-span-5 space-y-3">
            <div className="flex items-center gap-3">
              <BrandLogo />
              <div>
                <div className="flex items-center gap-2">
                  <span className="text-base font-extrabold tracking-tight text-slate-900 dark:text-[#f8fafc]">
                    Flip<span className="text-violet-600 dark:text-[#a78bfa]">Book</span>
                  </span>
                  <span className="liquid-pill text-[10px] py-0.5 px-2">
                    Politeknik Besut
                  </span>
                </div>
                <p className="text-xs text-slate-500 dark:text-[#94a3b8] mt-0.5 font-medium">
                  Interactive Digital Publishing & Educational Flipbook Platform
                </p>
              </div>
            </div>

            <p className="text-xs text-slate-600 dark:text-[#94a3b8] leading-relaxed max-w-md">
              A specialized digital publishing platform for hosting, viewing, and reading academic modules and lecture flipbooks with interactive gamified learning activities.
            </p>

            {/* Academic Institution Pill */}
            <div className="inline-flex items-center gap-2 liquid-pill text-xs py-1 px-3.5">
              <GraduationCap className="h-3.5 w-3.5 text-violet-600 dark:text-[#a78bfa]" />
              <span>Jabatan Matematik, Sains & Komputer (JMSK) • Politeknik Besut</span>
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

          {/* Academic Lecturers / Project Team */}
          <div className="md:col-span-4 space-y-3">
            <h4 className="text-xs font-bold uppercase tracking-wider text-slate-900 dark:text-[#f8fafc] font-mono-code flex items-center gap-1.5">
              <Users className="h-3.5 w-3.5 text-violet-600 dark:text-[#a78bfa]" />
              JMSK Lecturer Team
            </h4>
            <div className="space-y-2 text-xs">
              {lecturers.map((lecturer, idx) => (
                <a
                  key={idx}
                  href={`mailto:${lecturer.email}`}
                  className="liquid-glass rounded-xl p-2.5 flex items-center justify-between gap-2 text-slate-700 hover:text-violet-600 dark:text-[#f8fafc] dark:hover:text-[#a78bfa] transition-colors block group"
                >
                  <div>
                    <p className="font-bold text-xs group-hover:text-violet-600 dark:group-hover:text-[#a78bfa] transition-colors">
                      {lecturer.name}
                    </p>
                    <p className="text-[11px] text-slate-500 dark:text-[#94a3b8] font-mono-code">
                      {lecturer.email}
                    </p>
                  </div>
                  <Mail className="h-3.5 w-3.5 text-slate-400 group-hover:text-violet-600 dark:group-hover:text-[#a78bfa] transition-colors shrink-0" />
                </a>
              ))}

              <div className="flex items-center gap-1.5 text-[11px] text-slate-500 dark:text-[#94a3b8] pt-1">
                <ShieldCheck className="h-3.5 w-3.5 text-emerald-500 dark:text-emerald-400" />
                <span>Jabatan Matematik, Sains dan Komputer (JMSK)</span>
              </div>
            </div>
          </div>
        </div>

        {/* Bottom Credits & Copyright */}
        <div className="pt-8 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs">
          <div className="flex items-center gap-2 text-slate-600 dark:text-[#94a3b8]">
            <span>© {new Date().getFullYear()} FlipBook Platform.</span>
            <span>•</span>
            <span className="font-semibold text-slate-900 dark:text-[#f8fafc]">JMSK Politeknik Besut</span>
          </div>

          <div className="flex items-center gap-1.5 text-slate-500 dark:text-[#94a3b8]">
            <span>Academic Initiative by</span>
            <span className="liquid-pill text-xs py-0.5 px-2 text-slate-900 dark:text-[#f8fafc]">
              JMSK Lecturers
            </span>
          </div>
        </div>
      </div>
    </footer>
  );
};

