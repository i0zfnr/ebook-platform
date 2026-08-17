import React from 'react';
import { Sun, Moon } from 'lucide-react';
import { useTheme } from '../../context/ThemeContext';

interface ThemeToggleProps {
  className?: string;
}

export const ThemeToggle: React.FC<ThemeToggleProps> = ({ className = '' }) => {
  const { theme, toggleTheme } = useTheme();

  return (
    <button
      className={`liquid-glass group relative flex h-9 w-9 items-center justify-center rounded-xl text-slate-700 dark:text-[#f8fafc] hover:text-violet-600 dark:hover:text-[#a78bfa] hover:scale-105 active:scale-95 transition-all duration-200 cursor-pointer ${className}`}
      type="button"
      onClick={toggleTheme}
      aria-label={`Switch to ${theme === 'light' ? 'dark' : 'light'} theme`}
      title={`Switch to ${theme === 'light' ? 'dark' : 'light'} theme`}
    >
      {theme === 'light' ? (
        <Moon className="h-4 w-4 transition-transform duration-300 group-hover:-rotate-12 group-hover:scale-110" />
      ) : (
        <Sun className="h-4 w-4 transition-transform duration-300 group-hover:rotate-45 group-hover:scale-110 text-amber-400" />
      )}
    </button>
  );
};
