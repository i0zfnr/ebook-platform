import React from 'react';
import { QrCode, ExternalLink, FileSpreadsheet } from 'lucide-react';

interface QrWidgetProps {
  targetUrl?: string;
  label?: string;
  title: string;
  description?: string;
}

export const QrWidget: React.FC<QrWidgetProps> = ({
  targetUrl = 'https://forms.google.com',
  label = 'Open Assessment / Attendance Form',
  title,
  description,
}) => {
  // Free dynamic QR code API
  const qrCodeImgUrl = `https://api.qrserver.com/v1/create-qr-code/?size=240x240&data=${encodeURIComponent(
    targetUrl
  )}&bgcolor=ffffff&color=7c3aed&margin=10`;

  return (
    <div className="space-y-6 text-slate-800 dark:text-[#f8fafc]">
      <div className="border-b border-slate-200/60 dark:border-white/10 pb-3">
        <div className="flex items-center gap-2">
          <span className="liquid-pill text-[10px] py-0.5 px-2.5 font-bold text-violet-500">
            <QrCode className="h-3 w-3 inline mr-1" />
            Interactive QR & Google Form
          </span>
        </div>
        <h3 className="text-lg font-extrabold text-slate-900 dark:text-[#f8fafc] mt-2">
          {title}
        </h3>
        {description && (
          <p className="text-xs text-slate-500 dark:text-[#94a3b8] mt-1">{description}</p>
        )}
      </div>

      {/* QR Code Card */}
      <div className="flex flex-col sm:flex-row items-center gap-6 p-6 liquid-glass rounded-3xl border border-slate-200/50 dark:border-white/10">
        <div className="relative h-44 w-44 shrink-0 rounded-2xl overflow-hidden bg-white p-2.5 shadow-xl border border-slate-200/80">
          <img src={qrCodeImgUrl} alt="QR Code" className="h-full w-full object-contain" />
        </div>

        <div className="space-y-3 text-center sm:text-left">
          <div className="inline-flex items-center gap-1.5 liquid-pill text-[10px] py-0.5 px-2.5">
            <FileSpreadsheet className="h-3 w-3 text-emerald-500" />
            <span>Politeknik Besut Cloud Activity</span>
          </div>

          <h4 className="text-sm font-bold text-slate-900 dark:text-[#f8fafc]">
            Scan with your Phone Camera
          </h4>
          <p className="text-xs text-slate-500 dark:text-[#94a3b8] leading-relaxed">
            Scan this QR code using your smartphone to instantly access the online attendance sheet, Google Form, or assignment submission portal.
          </p>

          <div className="pt-1">
            <a
              href={targetUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="liquid-btn-primary inline-flex items-center gap-2 px-5 py-2 text-xs font-bold shadow-md"
            >
              <span>{label}</span>
              <ExternalLink className="h-3.5 w-3.5" />
            </a>
          </div>
        </div>
      </div>
    </div>
  );
};
