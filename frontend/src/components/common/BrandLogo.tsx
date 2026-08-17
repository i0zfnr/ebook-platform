import React from 'react';
import { BookOpen } from 'lucide-react';

interface BrandLogoProps {
  className?: string;
  size?: 'sm' | 'md' | 'lg';
}

export const BrandLogo: React.FC<BrandLogoProps> = ({ className = '', size = 'md' }) => {
  const sizeClasses = {
    sm: 'h-7 w-7 rounded-xl text-xs',
    md: 'h-9 w-9 rounded-2xl text-sm',
    lg: 'h-14 w-14 rounded-3xl text-xl',
  };

  const iconSizes = {
    sm: 'h-3.5 w-3.5',
    md: 'h-4 w-4',
    lg: 'h-7 w-7',
  };

  return (
    <div
      className={`relative flex items-center justify-center bg-gradient-to-br from-violet-600 via-indigo-600 to-purple-700 text-white shadow-lg shadow-violet-600/30 border border-white/30 shrink-0 transition-transform duration-200 group-hover:scale-105 ${sizeClasses[size]} ${className}`}
      style={{
        boxShadow: '0 8px 20px -4px rgba(124, 58, 237, 0.4), inset 0 1px 1.5px rgba(255, 255, 255, 0.6)',
      }}
    >
      <BookOpen className={`${iconSizes[size]} text-white drop-shadow-sm`} />
      {/* Specular Light Reflection Sheen */}
      <div className="absolute inset-0 rounded-[inherit] bg-gradient-to-t from-transparent via-white/10 to-white/30 pointer-events-none" />
    </div>
  );
};
