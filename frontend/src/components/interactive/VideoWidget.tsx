import React, { useState } from 'react';
import { Play, ExternalLink, AlertCircle } from 'lucide-react';

interface VideoWidgetProps {
  videoId?: string;
  youtubeUrl?: string;
  videoTitle?: string;
  description?: string;
}

export const VideoWidget: React.FC<VideoWidgetProps> = ({
  videoId = 'xxpc-HPKN28',
  youtubeUrl = 'https://www.youtube.com/watch?v=xxpc-HPKN28',
  videoTitle = 'Educational Video Lecture',
  description,
}) => {
  const [loadError, setLoadError] = useState<boolean>(false);
  const activeVideoId = videoId || 'xxpc-HPKN28';
  const embedUrl = `https://www.youtube.com/embed/${activeVideoId}?autoplay=0&rel=0`;

  return (
    <div className="space-y-4 text-slate-800 dark:text-[#f8fafc]">
      <div className="border-b border-slate-200/60 dark:border-white/10 pb-3">
        <div className="flex items-center gap-2">
          <span className="liquid-pill text-[10px] py-0.5 px-2.5 font-bold text-red-500">
            <Play className="h-3 w-3 inline mr-1" />
            Curated Video Lecture
          </span>
        </div>
        <h3 className="text-lg font-extrabold text-slate-900 dark:text-[#f8fafc] mt-2">
          {videoTitle}
        </h3>
        {description && (
          <p className="text-xs text-slate-500 dark:text-[#94a3b8] mt-1">{description}</p>
        )}
      </div>

      {/* Video Responsive Embed */}
      <div className="relative aspect-video w-full overflow-hidden rounded-2xl bg-black shadow-2xl border border-slate-700/50">
        {!loadError ? (
          <iframe
            src={embedUrl}
            title={videoTitle}
            className="absolute inset-0 h-full w-full border-0"
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
            allowFullScreen
            onError={() => setLoadError(true)}
          />
        ) : (
          <div className="flex h-full w-full flex-col items-center justify-center p-6 text-center space-y-3 bg-slate-900 text-white">
            <AlertCircle className="h-8 w-8 text-amber-400" />
            <p className="text-xs">Direct embed playback restricted by YouTube.</p>
            {youtubeUrl && (
              <a
                href={youtubeUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="liquid-btn-primary px-4 py-2 text-xs font-bold flex items-center gap-1.5"
              >
                <span>Watch Directly on YouTube</span>
                <ExternalLink className="h-3.5 w-3.5" />
              </a>
            )}
          </div>
        )}
      </div>

      {youtubeUrl && (
        <div className="flex justify-end pt-1">
          <a
            href={youtubeUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-1.5 text-xs font-mono-code font-bold text-violet-600 dark:text-[#a78bfa] hover:underline"
          >
            <span>Watch on YouTube</span>
            <ExternalLink className="h-3.5 w-3.5" />
          </a>
        </div>
      )}
    </div>
  );
};
