import React from 'react';
import { Link } from 'react-router-dom';
import { Home } from 'lucide-react';
import { BrandLogo } from '../components/common/BrandLogo';

export const NotFoundPage: React.FC = () => {
  return (
    <div className="flex min-h-[75vh] flex-col items-center justify-center text-slate-900 dark:text-[#f8fafc] p-6 text-center">
      <BrandLogo size="lg" className="mb-6" />
      <h1 className="text-6xl font-extrabold font-mono-code text-transparent bg-clip-text bg-gradient-to-r from-violet-600 to-indigo-600 dark:from-[#a78bfa] dark:to-[#c4b5fd]">
        404
      </h1>
      <h2 className="mt-2 text-xl font-bold text-slate-800 dark:text-[#f8fafc]">Page Not Found</h2>
      <p className="mt-2 text-sm text-slate-500 dark:text-[#94a3b8] max-w-sm">
        The page or e-book you are looking for does not exist or has been moved.
      </p>
      <Link
        to="/"
        className="liquid-btn-primary mt-8 flex items-center gap-2 px-6 py-2.5 text-xs font-mono-code font-bold shadow-lg"
      >
        <Home className="h-4 w-4" />
        Return to Home
      </Link>
    </div>
  );
};
