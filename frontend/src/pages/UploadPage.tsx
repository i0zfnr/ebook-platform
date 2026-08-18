import React, { useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  UploadCloud,
  FileText,
  Image as ImageIcon,
  CheckCircle2,
  AlertCircle,
  Loader2,
  X,
  Sparkles,
  HelpCircle,
  Gamepad2,
  Play,
  QrCode,
  RotateCcw,
  Check,
  GraduationCap,
} from 'lucide-react';
import { ebookService, formatBytes } from '../services/ebookService';
import { loadPdfDocument, cacheUploadedPdf } from '../services/pdfService';
import { generateAiLive, saveInteractiveElements } from '../services/aiGeneratorService';
import { localBookStorage } from '../services/localBookStorage';
import type { Ebook } from '../types/ebook';
import type { InteractiveElement } from '../types/interactive';

export const UploadPage: React.FC = () => {
  const navigate = useNavigate();

  const [title, setTitle] = useState('');
  const [author, setAuthor] = useState('');
  const [description, setDescription] = useState('');
  const [totalPages, setTotalPages] = useState<number | undefined>(undefined);

  const [pdfFile, setPdfFile] = useState<File | null>(null);
  const [coverFile, setCoverFile] = useState<File | null>(null);
  const [coverPreview, setCoverPreview] = useState<string | null>(null);

  const [uploadProgress, setUploadProgress] = useState<number>(0);
  const [isUploading, setIsUploading] = useState<boolean>(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [fieldErrors, setFieldErrors] = useState<Record<string, string[]>>({});

  // AI Generation Pipeline States
  const [isAiProcessing, setIsAiProcessing] = useState<boolean>(false);
  const [aiStepText, setAiStepText] = useState<string>('');
  const [aiProgressPercent, setAiProgressPercent] = useState<number>(0);
  const [generatedElements, setGeneratedElements] = useState<InteractiveElement[]>([]);
  const [aiComplete, setAiComplete] = useState<boolean>(false);

  const pdfInputRef = useRef<HTMLInputElement | null>(null);
  const coverInputRef = useRef<HTMLInputElement | null>(null);

  // Trigger AI Pipeline for a loaded PDF
  const runAiPipeline = async (file: File, bookTitle: string) => {
    setIsAiProcessing(true);
    setAiComplete(false);
    setAiProgressPercent(10);
    setAiStepText('Opening document & scanning vector structure...');

    try {
      const fileUrl = URL.createObjectURL(file);
      const pdf = await loadPdfDocument(fileUrl);
      setTotalPages(pdf.numPages);
      setAiProgressPercent(30);

      const elements = await generateAiLive(
        pdf,
        bookTitle || file.name.replace(/\.pdf$/i, ''),
        (step, pct) => {
          setAiStepText(step);
          setAiProgressPercent(pct);
        }
      );

      setGeneratedElements(elements);
      setAiComplete(true);
      setAiStepText('Interactive Learning Suite Ready!');
      URL.revokeObjectURL(fileUrl);
    } catch (err) {
      console.warn('AI pipeline error:', err);
      setAiStepText('AI Heuristic ready');
      setAiComplete(true);
    } finally {
      setIsAiProcessing(false);
    }
  };

  // Handle PDF Selection & Auto-detect metadata + trigger AI pipeline
  const handlePdfChange = async (file: File) => {
    if (file.type !== 'application/pdf' && !file.name.toLowerCase().endsWith('.pdf')) {
      setErrorMessage('Please select a valid PDF file.');
      return;
    }

    if (file.size > 100 * 1024 * 1024) {
      setErrorMessage('PDF file exceeds the 100 MB limit.');
      return;
    }

    setErrorMessage(null);
    setPdfFile(file);

    // Auto-fill title from filename if title is empty
    let detectedTitle = title;
    if (!title.trim()) {
      detectedTitle = file.name.replace(/\.pdf$/i, '').replace(/[-_]/g, ' ');
      setTitle(detectedTitle);
    }

    // Run active AI Generation pipeline immediately on file attach!
    runAiPipeline(file, detectedTitle);
  };

  // Handle Cover image selection
  const handleCoverChange = (file: File) => {
    const validTypes = ['image/jpeg', 'image/png', 'image/webp', 'image/jpg'];
    if (!validTypes.includes(file.type)) {
      setErrorMessage('Cover image must be a JPG, PNG, or WebP file.');
      return;
    }

    if (file.size > 10 * 1024 * 1024) {
      setErrorMessage('Cover image exceeds the 10 MB limit.');
      return;
    }

    setCoverFile(file);
    const previewUrl = URL.createObjectURL(file);
    setCoverPreview(previewUrl);
  };

  const removeCover = () => {
    setCoverFile(null);
    if (coverPreview) {
      URL.revokeObjectURL(coverPreview);
      setCoverPreview(null);
    }
    if (coverInputRef.current) {
      coverInputRef.current.value = '';
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!pdfFile) {
      setErrorMessage('Please upload a PDF document.');
      return;
    }

    if (!title.trim()) {
      setErrorMessage('Please provide a title for your e-book.');
      return;
    }

    setIsUploading(true);
    setUploadProgress(0);
    setErrorMessage(null);
    setFieldErrors({});

    try {
      const formData = new FormData();
      formData.append('title', title.trim());
      if (author.trim()) formData.append('author', author.trim());
      if (description.trim()) formData.append('description', description.trim());
      formData.append('pdf', pdfFile);
      if (coverFile) formData.append('cover', coverFile);
      if (totalPages) formData.append('total_pages', String(totalPages));
      formData.append('status', 'published');

      // Attach generated AI Interactive Suite to database payload
      if (generatedElements.length > 0) {
        formData.append('interactive_elements', JSON.stringify(generatedElements));
      }

      let result: Ebook;
      try {
        result = await ebookService.uploadEbook(formData, (progress) => {
          setUploadProgress(progress);
        });
      } catch (err: any) {
        console.warn('Backend upload failed/offline, creating local IndexedDB book entry...', err);
        const localSlug = title
          .toLowerCase()
          .replace(/[^a-z0-9]+/g, '-')
          .replace(/(^-|-$)+/g, '') || `ebook-${Date.now()}`;

        result = {
          id: Date.now(),
          title: title.trim(),
          slug: localSlug,
          author: author.trim() || 'Politeknik Besut Lecturer',
          description: description.trim(),
          pdf_path: `ebooks/${localSlug}.pdf`,
          pdf_url: `/api/ebooks/${localSlug}/file`,
          cover_path: null,
          cover_url: coverPreview || null,
          original_filename: pdfFile.name,
          file_size: pdfFile.size,
          total_pages: totalPages || null,
          status: 'published',
          interactive_elements: generatedElements.length > 0 ? generatedElements : undefined,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        };

        await localBookStorage.saveBook(result, pdfFile);
      }

      // Cache PDF in memory for instant 0ms reader opening
      if (pdfFile) {
        if (result.slug) cacheUploadedPdf(result.slug, pdfFile);
        if (result.id) cacheUploadedPdf(result.id, pdfFile);
      }

      // Save to client localStorage cache for instant fast loading
      if (generatedElements.length > 0) {
        saveInteractiveElements(result.slug || result.id, generatedElements);
        saveInteractiveElements(result.id, generatedElements);
      }

      navigate(`/read/${result.slug || result.id}`);
    } catch (err: any) {
      if (err.response?.data?.errors) {
        setFieldErrors(err.response.data.errors);
      }
      setErrorMessage(
        err.response?.data?.message || 'Failed to process e-book. Please verify file format.'
      );
    } finally {
      setIsUploading(false);
    }
  };

  return (
    <div className="min-h-screen text-slate-900 dark:text-[#f8fafc] py-12 transition-colors duration-300">
      <div className="mx-auto max-w-3xl px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="text-center mb-10">
          <div className="inline-flex items-center gap-1.5 liquid-pill mb-3">
            <Sparkles className="h-3.5 w-3.5 text-violet-600 dark:text-[#a78bfa]" />
            <span>Publishing Portal</span>
          </div>
          <h1 className="text-3xl sm:text-4xl font-extrabold text-slate-900 dark:text-[#f8fafc] tracking-tight">
            Upload Your E-Book
          </h1>
          <p className="mt-2 text-sm text-slate-600 dark:text-[#94a3b8]">
            Attach your course PDF and watch AI build the interactive learning suite automatically.
          </p>
        </div>

        {/* Liquid Glass Form Box */}
        <div className="liquid-glass rounded-3xl p-6 sm:p-10 shadow-2xl">
          {errorMessage && (
            <div className="mb-6 flex items-start gap-3 rounded-2xl border border-red-500/25 bg-red-50/80 dark:bg-red-950/40 p-4 text-sm text-red-600 dark:text-red-300">
              <AlertCircle className="h-5 w-5 text-red-500 dark:text-red-400 shrink-0 mt-0.5" />
              <div>
                <p className="font-bold text-red-700 dark:text-red-200">Upload Error</p>
                <p className="mt-0.5 text-xs text-red-600/90 dark:text-red-300/90">{errorMessage}</p>
              </div>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-6">
            {/* PDF Upload Dropzone */}
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider font-mono-code text-slate-700 dark:text-[#f8fafc] mb-2">
                PDF Document <span className="text-violet-600 dark:text-[#a78bfa]">*</span>
              </label>

              {!pdfFile ? (
                <div
                  onClick={() => pdfInputRef.current?.click()}
                  onDragOver={(e) => e.preventDefault()}
                  onDrop={(e) => {
                    e.preventDefault();
                    if (e.dataTransfer.files?.[0]) {
                      handlePdfChange(e.dataTransfer.files[0]);
                    }
                  }}
                  className="flex flex-col items-center justify-center rounded-2xl border-2 border-dashed border-violet-500/30 bg-violet-50/30 dark:border-violet-400/20 dark:bg-white/[0.02] p-8 text-center hover:border-violet-500 hover:bg-violet-50/60 dark:hover:border-violet-400/50 dark:hover:bg-white/[0.05] transition-all duration-200 cursor-pointer group shadow-inner"
                >
                  <div className="flex h-14 w-14 items-center justify-center rounded-2xl liquid-glass text-violet-600 dark:text-[#a78bfa] group-hover:scale-110 group-hover:bg-violet-600 group-hover:text-white transition-all duration-200 shadow-md">
                    <UploadCloud className="h-7 w-7" />
                  </div>
                  <p className="mt-4 text-sm font-bold text-slate-900 dark:text-[#f8fafc]">
                    Click to browse or drag and drop your PDF
                  </p>
                  <p className="mt-1 text-xs text-slate-500 dark:text-[#94a3b8] font-mono-code">PDF files up to 100 MB</p>
                </div>
              ) : (
                <div className="flex items-center justify-between rounded-2xl liquid-glass p-4 border border-violet-500/30">
                  <div className="flex items-center gap-3.5">
                    <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-violet-600/20 text-violet-700 dark:text-[#c4b5fd]">
                      <FileText className="h-6 w-6" />
                    </div>
                    <div>
                      <p className="text-sm font-bold text-slate-900 dark:text-[#f8fafc] line-clamp-1">{pdfFile.name}</p>
                      <div className="flex items-center gap-3 text-xs font-mono-code text-slate-500 dark:text-[#94a3b8] mt-0.5">
                        <span>{formatBytes(pdfFile.size)}</span>
                        {totalPages && (
                          <span className="text-emerald-600 dark:text-emerald-400 font-semibold">
                            {totalPages} pages detected
                          </span>
                        )}
                      </div>
                    </div>
                  </div>

                  <button
                    type="button"
                    onClick={() => {
                      setPdfFile(null);
                      setTotalPages(undefined);
                      setGeneratedElements([]);
                      setAiComplete(false);
                      if (pdfInputRef.current) pdfInputRef.current.value = '';
                    }}
                    className="rounded-xl p-2 text-slate-400 hover:bg-white/40 dark:hover:bg-white/10 dark:hover:text-white transition-colors cursor-pointer"
                    title="Remove file"
                  >
                    <X className="h-4 w-4" />
                  </button>
                </div>
              )}

              <input
                ref={pdfInputRef}
                type="file"
                accept="application/pdf"
                className="hidden"
                onChange={(e) => {
                  if (e.target.files?.[0]) handlePdfChange(e.target.files[0]);
                }}
              />
              {fieldErrors.pdf && (
                <p className="mt-1.5 text-xs text-red-500 dark:text-red-400 font-mono-code">{fieldErrors.pdf[0]}</p>
              )}
            </div>

            {/* AI Real-time Interactive Learning Suite Generation Box */}
            {pdfFile && (
              <div className="rounded-2xl liquid-glass p-5 border border-violet-500/40 bg-gradient-to-b from-violet-500/10 to-indigo-500/5 space-y-4 shadow-lg animate-in fade-in duration-300">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2.5">
                    <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-violet-600 text-white shadow-md shadow-violet-600/30">
                      <Sparkles className={`h-4 w-4 ${isAiProcessing ? 'animate-spin' : ''}`} />
                    </div>
                    <div>
                      <h4 className="text-xs font-extrabold text-slate-900 dark:text-[#f8fafc] flex items-center gap-2">
                        <span>AI Interactive Learning Suite Engine</span>
                        {aiComplete && (
                          <span className="liquid-pill text-[9px] py-0.2 px-2 font-mono-code text-emerald-500 font-bold flex items-center gap-1">
                            <Check className="h-3 w-3" /> Ready
                          </span>
                        )}
                      </h4>
                      <p className="text-[11px] text-slate-500 dark:text-[#94a3b8]">
                        {aiStepText || 'Analyzing document context...'}
                      </p>
                    </div>
                  </div>

                  {pdfFile && !isAiProcessing && (
                    <button
                      type="button"
                      onClick={() => runAiPipeline(pdfFile, title)}
                      className="liquid-btn-secondary px-2.5 py-1 text-[11px] font-mono-code font-bold flex items-center gap-1 cursor-pointer"
                      title="Re-run AI Generation"
                    >
                      <RotateCcw className="h-3 w-3" />
                      <span>Re-analyze</span>
                    </button>
                  )}
                </div>

                {/* Progress Bar during AI Generation */}
                {isAiProcessing && (
                  <div className="space-y-1.5">
                    <div className="flex items-center justify-between text-[11px] font-mono-code text-violet-700 dark:text-[#c4b5fd]">
                      <span className="flex items-center gap-1.5">
                        <Loader2 className="h-3 w-3 animate-spin" />
                        {aiStepText}
                      </span>
                      <span className="font-bold">{aiProgressPercent}%</span>
                    </div>
                    <div className="h-2 w-full overflow-hidden rounded-full bg-slate-200/60 dark:bg-black/40">
                      <div
                        className="h-full bg-gradient-to-r from-violet-600 via-indigo-500 to-purple-600 transition-all duration-300"
                        style={{ width: `${aiProgressPercent}%` }}
                      />
                    </div>
                  </div>
                )}

                {/* Real-time Generated Activities Preview */}
                {generatedElements.length > 0 && (
                  <div className="space-y-2 pt-2 border-t border-slate-200/50 dark:border-white/10">
                    <div className="flex items-center justify-between text-[11px] font-mono-code font-bold text-slate-600 dark:text-[#94a3b8]">
                      <span>Generated Interactive Elements ({generatedElements.length})</span>
                      <span className="text-emerald-500">Auto-embedded to pages</span>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                      {generatedElements.map((el) => {
                        const isQuiz = el.type === 'quiz';
                        const isFlash = el.type === 'flashcards';
                        const isVid = el.type === 'video';
                        const isQr = el.type === 'qr_link';

                        return (
                          <div
                            key={el.id}
                            className="flex items-center gap-2.5 p-2.5 rounded-xl liquid-glass border border-slate-200/60 dark:border-white/10 text-left"
                          >
                            <div
                              className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-lg text-white text-xs ${
                                isQuiz
                                  ? 'bg-violet-600 shadow-sm shadow-violet-600/30'
                                  : isFlash
                                  ? 'bg-amber-500 shadow-sm shadow-amber-500/30'
                                  : isVid
                                  ? 'bg-rose-600 shadow-sm shadow-rose-600/30'
                                  : 'bg-emerald-600 shadow-sm shadow-emerald-600/30'
                              }`}
                            >
                              {isQuiz && <HelpCircle className="h-4 w-4" />}
                              {isFlash && <Gamepad2 className="h-4 w-4" />}
                              {isVid && <Play className="h-4 w-4 fill-white" />}
                              {isQr && <QrCode className="h-4 w-4" />}
                            </div>

                            <div className="flex-1 min-w-0">
                              <div className="flex items-center justify-between">
                                <span className="text-[9px] uppercase font-mono-code font-bold text-violet-600 dark:text-[#a78bfa]">
                                  {isFlash ? 'Recall Match Game' : el.type}
                                </span>
                                <span className="text-[9px] font-mono-code text-slate-400">
                                  Page {el.pageNumber}
                                </span>
                              </div>
                              <p className="text-xs font-bold text-slate-900 dark:text-[#f8fafc] truncate">
                                {el.title}
                              </p>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* Title */}
            <div>
              <label htmlFor="title" className="block text-xs font-bold uppercase tracking-wider font-mono-code text-slate-700 dark:text-[#f8fafc] mb-2">
                Book Title <span className="text-violet-600 dark:text-[#a78bfa]">*</span>
              </label>
              <input
                id="title"
                type="text"
                required
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="e.g., Introduction to Statistics and Probability"
                className="liquid-input w-full px-4 py-3 text-sm font-medium placeholder-slate-400 dark:placeholder-slate-500"
              />
              {fieldErrors.title && (
                <p className="mt-1.5 text-xs text-red-500 dark:text-red-400 font-mono-code">{fieldErrors.title[0]}</p>
              )}
            </div>

            {/* Author */}
            <div>
              <label htmlFor="author" className="block text-xs font-bold uppercase tracking-wider font-mono-code text-slate-700 dark:text-[#f8fafc] mb-2">
                Author Name <span className="text-slate-400 dark:text-[#94a3b8] text-[11px] font-normal lowercase">(optional)</span>
              </label>
              <input
                id="author"
                type="text"
                value={author}
                onChange={(e) => setAuthor(e.target.value)}
                placeholder="e.g., Politeknik Besut"
                className="liquid-input w-full px-4 py-3 text-sm font-medium placeholder-slate-400 dark:placeholder-slate-500"
              />
              {fieldErrors.author && (
                <p className="mt-1.5 text-xs text-red-500 dark:text-red-400 font-mono-code">{fieldErrors.author[0]}</p>
              )}
            </div>

            {/* Description */}
            <div>
              <label htmlFor="description" className="block text-xs font-bold uppercase tracking-wider font-mono-code text-slate-700 dark:text-[#f8fafc] mb-2">
                Description <span className="text-slate-400 dark:text-[#94a3b8] text-[11px] font-normal lowercase">(optional)</span>
              </label>
              <textarea
                id="description"
                rows={3}
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="A brief overview or synopsis of the course module..."
                className="liquid-input w-full px-4 py-3 text-sm font-medium placeholder-slate-400 dark:placeholder-slate-500 resize-none"
              />
              {fieldErrors.description && (
                <p className="mt-1.5 text-xs text-red-500 dark:text-red-400 font-mono-code">{fieldErrors.description[0]}</p>
              )}
            </div>

            {/* Cover Image Upload */}
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider font-mono-code text-slate-700 dark:text-[#f8fafc] mb-2">
                Custom Cover Image{' '}
                <span className="text-slate-400 dark:text-[#94a3b8] text-[11px] font-normal lowercase">
                  (optional — auto-extracts page 1 by default)
                </span>
              </label>

              {!coverPreview ? (
                <div
                  onClick={() => coverInputRef.current?.click()}
                  className="flex items-center gap-4 rounded-2xl border border-dashed border-slate-300 dark:border-white/10 bg-white/40 dark:bg-white/[0.02] p-4 hover:border-violet-500 hover:bg-violet-50/20 dark:hover:border-violet-400/40 dark:hover:bg-white/[0.05] transition-all cursor-pointer shadow-sm"
                >
                  <div className="flex h-10 w-10 items-center justify-center rounded-xl liquid-glass text-violet-600 dark:text-[#a78bfa]">
                    <ImageIcon className="h-5 w-5" />
                  </div>
                  <div>
                    <p className="text-xs font-bold text-slate-800 dark:text-[#f8fafc]">Upload custom cover</p>
                    <p className="text-[11px] font-mono-code text-slate-500 dark:text-[#94a3b8]">JPG, PNG, or WebP up to 10 MB</p>
                  </div>
                </div>
              ) : (
                <div className="flex items-center gap-4 rounded-2xl liquid-glass p-3">
                  <img
                    src={coverPreview}
                    alt="Cover preview"
                    className="h-16 w-12 rounded-xl object-cover border border-slate-300/60 dark:border-white/10 shadow-sm"
                  />
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-bold text-slate-900 dark:text-[#f8fafc] truncate">{coverFile?.name}</p>
                    <p className="text-[11px] font-mono-code text-slate-500 dark:text-[#94a3b8]">{formatBytes(coverFile?.size)}</p>
                  </div>
                  <button
                    type="button"
                    onClick={removeCover}
                    className="rounded-xl p-2 text-slate-400 hover:bg-white/40 dark:hover:bg-white/10 dark:hover:text-white cursor-pointer"
                  >
                    <X className="h-4 w-4" />
                  </button>
                </div>
              )}

              <input
                ref={coverInputRef}
                type="file"
                accept="image/jpeg,image/png,image/webp"
                className="hidden"
                onChange={(e) => {
                  if (e.target.files?.[0]) handleCoverChange(e.target.files[0]);
                }}
              />
              {fieldErrors.cover && (
                <p className="mt-1.5 text-xs text-red-500 dark:text-red-400 font-mono-code">{fieldErrors.cover[0]}</p>
              )}
            </div>

            {/* AI Interactive Suite Badge & Settings */}
            <div className="rounded-2xl liquid-glass p-5 border border-violet-500/30 space-y-3 bg-violet-500/5">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2.5">
                  <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-violet-600/20 text-violet-600 dark:text-[#a78bfa]">
                    <Sparkles className="h-4 w-4" />
                  </div>
                  <div>
                    <h4 className="text-xs font-bold text-slate-900 dark:text-[#f8fafc]">
                      AI Interactive Learning Suite
                    </h4>
                    <p className="text-[11px] text-slate-500 dark:text-[#94a3b8]">
                      AI automatically attaches interactive widgets to your document
                    </p>
                  </div>
                </div>
                <span className="liquid-pill text-[10px] py-0.5 px-2 font-mono-code text-emerald-500 font-bold">
                  Enabled
                </span>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 pt-1">
                <div className="p-2.5 rounded-xl liquid-glass text-center text-[10px] font-bold space-y-1">
                  <div className="flex items-center justify-center gap-1.5 text-violet-600 dark:text-[#a78bfa]">
                    <HelpCircle className="h-3.5 w-3.5" />
                    <span>Quizzes</span>
                  </div>
                  <span className="text-slate-400 text-[9px] block">MCQ Checks</span>
                </div>
                <div className="p-2.5 rounded-xl liquid-glass text-center text-[10px] font-bold space-y-1">
                  <div className="flex items-center justify-center gap-1.5 text-rose-500">
                    <Play className="h-3.5 w-3.5 fill-rose-500" />
                    <span>Videos</span>
                  </div>
                  <span className="text-slate-400 text-[9px] block">YouTube Embeds</span>
                </div>
                <div className="p-2.5 rounded-xl liquid-glass text-center text-[10px] font-bold space-y-1">
                  <div className="flex items-center justify-center gap-1.5 text-amber-500">
                    <Gamepad2 className="h-3.5 w-3.5" />
                    <span>Flashcards</span>
                  </div>
                  <span className="text-slate-400 text-[9px] block">Recall Games</span>
                </div>
                <div className="p-2.5 rounded-xl liquid-glass text-center text-[10px] font-bold space-y-1">
                  <div className="flex items-center justify-center gap-1.5 text-emerald-500">
                    <GraduationCap className="h-3.5 w-3.5" />
                    <span>AI Tutor</span>
                  </div>
                  <span className="text-slate-400 text-[9px] block">Study Copilot</span>
                </div>
              </div>
            </div>

            {/* Upload Progress Bar */}
            {isUploading && (
              <div className="space-y-2 rounded-2xl liquid-glass p-4 border border-violet-500/30">
                <div className="flex items-center justify-between text-xs font-mono-code font-bold">
                  <span className="flex items-center gap-2 text-violet-700 dark:text-[#c4b5fd]">
                    <Loader2 className="h-3.5 w-3.5 animate-spin" />
                    Publishing e-book & saving interactive suite to cloud...
                  </span>
                  <span className="text-slate-900 dark:text-white">{uploadProgress}%</span>
                </div>
                <div className="h-2 w-full overflow-hidden rounded-full bg-slate-200/60 dark:bg-black/40">
                  <div
                    className="h-full bg-gradient-to-r from-violet-600 via-indigo-500 to-purple-600 transition-all duration-200"
                    style={{ width: `${uploadProgress}%` }}
                  />
                </div>
              </div>
            )}

            {/* Submit Button */}
            <button
              type="submit"
              disabled={isUploading || !pdfFile || !title.trim()}
              className="liquid-btn-primary flex w-full items-center justify-center gap-2 py-4 px-6 text-sm font-extrabold disabled:opacity-50 disabled:pointer-events-none cursor-pointer shadow-xl"
            >
              {isUploading ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Publishing E-Book & Interactive Suite...
                </>
              ) : (
                <>
                  <CheckCircle2 className="h-4 w-4" />
                  Publish E-Book Now
                </>
              )}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
};
