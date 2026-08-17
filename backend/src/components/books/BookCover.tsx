import React, { useState, useEffect } from 'react';
import { Book as BookIcon, Loader2 } from 'lucide-react';
import { extractFirstPageThumbnail } from '../../services/pdfService';

interface BookCoverProps {
  coverUrl?: string | null;
  pdfUrl?: string;
  title: string;
  author?: string | null;
  className?: string;
  aspectRatio?: string;
}

export const BookCover: React.FC<BookCoverProps> = ({
  coverUrl,
  pdfUrl,
  title,
  author,
  className = '',
  aspectRatio = 'aspect-[1/1.414]', // Standard A4 / Book proportion
}) => {
  const [renderedCover, setRenderedCover] = useState<string | null>(coverUrl || null);
  const [loading, setLoading] = useState<boolean>(!coverUrl && !!pdfUrl);
  const [error, setError] = useState<boolean>(false);

  useEffect(() => {
    let isMounted = true;

    if (coverUrl) {
      setRenderedCover(coverUrl);
      setLoading(false);
      return;
    }

    if (pdfUrl && !coverUrl) {
      setLoading(true);
      extractFirstPageThumbnail(pdfUrl, 380)
        .then((thumb) => {
          if (isMounted) {
            setRenderedCover(thumb);
            setLoading(false);
          }
        })
        .catch(() => {
          if (isMounted) {
            setError(true);
            setLoading(false);
          }
        });
    }

    return () => {
      isMounted = false;
    };
  }, [coverUrl, pdfUrl]);

  return (
    <div
      className={`relative w-full ${aspectRatio} overflow-hidden rounded-2xl bg-gradient-to-br from-slate-900 via-slate-800 to-indigo-950 shadow-md border border-slate-700/50 group-hover:shadow-2xl transition-all duration-300 ${className}`}
    >
      {/* 3D Book Spine Effect on Left Edge */}
      <div className="absolute inset-y-0 left-0 w-3 bg-gradient-to-r from-black/40 via-white/10 to-transparent z-10 pointer-events-none" />
      <div className="absolute inset-y-0 left-[2px] w-[1px] bg-white/20 z-10 pointer-events-none" />

      {/* Book Cover Content */}
      {loading ? (
        <div className="absolute inset-0 flex flex-col items-center justify-center bg-slate-900/90 text-slate-400 gap-2 p-4 text-center">
          <Loader2 className="h-5 w-5 animate-spin text-violet-500" />
          <span className="text-[11px] font-mono-code text-slate-400">Loading cover...</span>
        </div>
      ) : renderedCover && !error ? (
        <img
          src={renderedCover}
          alt={title}
          className="h-full w-full object-cover object-top transition-transform duration-500 group-hover:scale-105"
          onError={() => setError(true)}
        />
      ) : (
        /* Fallback Artistic Book Graphic */
        <div className="flex h-full w-full flex-col justify-between p-5 text-white bg-gradient-to-br from-violet-900 via-indigo-950 to-slate-950">
          <div className="space-y-1">
            <div className="inline-flex rounded-full bg-violet-500/20 px-2.5 py-0.5 text-[10px] font-mono-code font-bold text-violet-300 uppercase tracking-wider">
              E-Book
            </div>
            <h4 className="line-clamp-3 text-base font-extrabold text-white leading-snug drop-shadow">
              {title}
            </h4>
          </div>

          <div className="flex items-center justify-between border-t border-white/10 pt-3">
            <p className="line-clamp-1 text-xs text-slate-300 font-medium">
              {author || 'Unknown Author'}
            </p>
            <BookIcon className="h-4 w-4 text-violet-400 opacity-60" />
          </div>
        </div>
      )}
    </div>
  );
};
