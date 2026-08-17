import React from 'react';
import { Play, ExternalLink } from 'lucide-react';

interface VideoWidgetProps {
  videoId?: string;
  youtubeUrl?: string;
  videoTitle?: string;
  description?: string;
}

export const VideoWidget: React.FC<VideoWidgetProps> = ({
  videoId = 'LMSyiAJ8k9o',
  youtubeUrl,
  videoTitle = 'Educational Video Lecture',
  description,
}) => {
  const embedUrl = `https://www.youtube.com/embed/${videoId}?autoplay=0&rel=0`;

  return (
    <div className="space-y-4 text-slate-800 dark:text-[#f8fafc]">
      <div className="border-b border-slate-200/60 dark:border-white/10 pb-3">
        <div className="flex items-center gap-2">
          <span className="liquid-pill text-[10px] py-0.5 px-2.5 font-bold text-red-500">
            <Play className="h-3 w-3 inline mr-1" />
            Video Lecture
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
        <iframe
          src={embedUrl}
          title={videoTitle}
          className="absolute inset-0 h-full w-full border-0"
          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
          allowFullScreen
        />
      </div>

      {youtubeUrl && (
        <div className="flex justify-end pt-2">
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
