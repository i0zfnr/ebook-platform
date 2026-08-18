<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Ebook;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Str;

class EbookController extends Controller
{
    /**
     * Display a listing of the ebooks.
     */
    public function index(Request $request): JsonResponse
    {
        $query = Ebook::query();

        if ($search = $request->input('search', $request->input('q'))) {
            $query->where(function ($q) use ($search) {
                $q->where('title', 'like', "%{$search}%")
                  ->orWhere('author', 'like', "%{$search}%")
                  ->orWhere('description', 'like', "%{$search}%");
            });
        }

        if ($status = $request->input('status')) {
            $query->where('status', $status);
        }

        $ebooks = $query->orderBy('created_at', 'desc')->get();

        return response()->json([
            'success' => true,
            'data' => $ebooks,
            'total' => $ebooks->count(),
        ]);
    }

    /**
     * Store a newly created ebook in storage.
     */
    public function store(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'title' => 'required|string|max:255',
            'author' => 'nullable|string|max:255',
            'description' => 'nullable|string|max:5000',
            'pdf' => 'required|file|mimes:pdf|max:102400', // 100MB
            'cover' => 'nullable|image|mimes:jpeg,png,jpg,webp|max:10240', // 10MB
            'total_pages' => 'nullable|integer|min:1',
            'status' => 'nullable|string|in:published,draft,archived',
            'interactive_elements' => 'nullable',
        ]);

        $pdfFile = $request->file('pdf');
        $originalFilename = $pdfFile->getClientOriginalName();
        $fileSize = $pdfFile->getSize();

        // Generate unique filename for PDF
        $pdfFileName = Str::uuid() . '.' . $pdfFile->getClientOriginalExtension();
        $pdfPath = $pdfFile->storeAs('ebooks', $pdfFileName, 'public');

        // Handle optional cover image
        $coverPath = null;
        if ($request->hasFile('cover')) {
            $coverFile = $request->file('cover');
            $coverFileName = Str::uuid() . '.' . $coverFile->getClientOriginalExtension();
            $coverPath = $coverFile->storeAs('covers', $coverFileName, 'public');
        }

        $slug = Ebook::generateUniqueSlug($validated['title']);

        $interactiveElements = null;
        if (!empty($validated['interactive_elements'])) {
            $interactiveElements = is_string($validated['interactive_elements'])
                ? json_decode($validated['interactive_elements'], true)
                : $validated['interactive_elements'];
        }

        $ebook = Ebook::create([
            'title' => $validated['title'],
            'slug' => $slug,
            'author' => $validated['author'] ?? null,
            'description' => $validated['description'] ?? null,
            'pdf_path' => $pdfPath,
            'cover_path' => $coverPath,
            'original_filename' => $originalFilename,
            'file_size' => $fileSize,
            'total_pages' => $validated['total_pages'] ?? null,
            'status' => $validated['status'] ?? 'published',
            'interactive_elements' => $interactiveElements,
        ]);

        return response()->json([
            'success' => true,
            'message' => 'E-Book uploaded successfully.',
            'data' => $ebook,
        ], 201);
    }

    /**
     * Display the specified ebook.
     */
    public function show(string $idOrSlug): JsonResponse
    {
        $ebook = is_numeric($idOrSlug)
            ? Ebook::find($idOrSlug)
            : Ebook::where('slug', $idOrSlug)->first();

        if (!$ebook) {
            return response()->json([
                'success' => false,
                'message' => 'E-Book not found.',
            ], 404);
        }

        return response()->json([
            'success' => true,
            'data' => $ebook,
        ]);
    }

    /**
     * Update the specified ebook in storage.
     */
    public function update(Request $request, string $idOrSlug): JsonResponse
    {
        $ebook = is_numeric($idOrSlug)
            ? Ebook::find($idOrSlug)
            : Ebook::where('slug', $idOrSlug)->first();

        if (!$ebook) {
            return response()->json([
                'success' => false,
                'message' => 'E-Book not found.',
            ], 404);
        }

        $validated = $request->validate([
            'title' => 'sometimes|required|string|max:255',
            'author' => 'nullable|string|max:255',
            'description' => 'nullable|string|max:5000',
            'cover' => 'nullable|image|mimes:jpeg,png,jpg,webp|max:10240',
            'total_pages' => 'nullable|integer|min:1',
            'status' => 'nullable|string|in:published,draft,archived',
        ]);

        if (isset($validated['title']) && $validated['title'] !== $ebook->title) {
            $ebook->slug = Ebook::generateUniqueSlug($validated['title'], $ebook->id);
            $ebook->title = $validated['title'];
        }

        if (array_key_exists('author', $validated)) {
            $ebook->author = $validated['author'];
        }

        if (array_key_exists('description', $validated)) {
            $ebook->description = $validated['description'];
        }

        if (array_key_exists('total_pages', $validated)) {
            $ebook->total_pages = $validated['total_pages'];
        }

        if (array_key_exists('status', $validated)) {
            $ebook->status = $validated['status'];
        }

        if ($request->hasFile('cover')) {
            // Remove old cover if exists
            if ($ebook->cover_path && Storage::disk('public')->exists($ebook->cover_path)) {
                Storage::disk('public')->delete($ebook->cover_path);
            }

            $coverFile = $request->file('cover');
            $coverFileName = Str::uuid() . '.' . $coverFile->getClientOriginalExtension();
            $ebook->cover_path = $coverFile->storeAs('covers', $coverFileName, 'public');
        }

        $ebook->save();

        return response()->json([
            'success' => true,
            'message' => 'E-Book updated successfully.',
            'data' => $ebook,
        ]);
    }

    /**
     * Remove the specified ebook from storage.
     */
    public function destroy(string $idOrSlug): JsonResponse
    {
        $ebook = is_numeric($idOrSlug)
            ? Ebook::find($idOrSlug)
            : Ebook::where('slug', $idOrSlug)->first();

        if (!$ebook) {
            return response()->json([
                'success' => false,
                'message' => 'E-Book not found.',
            ], 404);
        }

        // Delete PDF file from storage
        if ($ebook->pdf_path && Storage::disk('public')->exists($ebook->pdf_path)) {
            Storage::disk('public')->delete($ebook->pdf_path);
        }

        // Delete Cover file from storage
        if ($ebook->cover_path && Storage::disk('public')->exists($ebook->cover_path)) {
            Storage::disk('public')->delete($ebook->cover_path);
        }

        $ebook->delete();

        return response()->json([
            'success' => true,
            'message' => 'E-Book and associated files deleted successfully.',
        ]);
    }

    /**
     * Stream the PDF file with explicit CORS and content-type headers.
     */
    public function file(string $ebook)
    {
        $idOrSlug = $ebook;
        $ebookModel = is_numeric($idOrSlug)
            ? Ebook::find($idOrSlug)
            : Ebook::where('slug', $idOrSlug)->first();

        if (!$ebookModel || !$ebookModel->pdf_path || !Storage::disk('public')->exists($ebookModel->pdf_path)) {
            return response()->json(['message' => 'PDF document not found.'], 404);
        }

        return Storage::disk('public')->response($ebookModel->pdf_path, $ebookModel->original_filename ?? 'ebook.pdf', [
            'Content-Type' => 'application/pdf',
            'Access-Control-Allow-Origin' => '*',
            'Access-Control-Allow-Methods' => 'GET, HEAD, OPTIONS',
            'Access-Control-Allow-Headers' => '*',
            'Access-Control-Expose-Headers' => 'Content-Length, Content-Range, Accept-Ranges',
        ]);
    }

    /**
     * Stream the Cover image file with explicit CORS headers.
     */
    public function cover(string $ebook)
    {
        $idOrSlug = $ebook;
        $ebookModel = is_numeric($idOrSlug)
            ? Ebook::find($idOrSlug)
            : Ebook::where('slug', $idOrSlug)->first();

        if (!$ebookModel || !$ebookModel->cover_path || !Storage::disk('public')->exists($ebookModel->cover_path)) {
            return response()->json(['message' => 'Cover image not found.'], 404);
        }

        return Storage::disk('public')->response($ebookModel->cover_path, 'cover.jpg', [
            'Access-Control-Allow-Origin' => '*',
            'Access-Control-Allow-Methods' => 'GET, HEAD, OPTIONS',
            'Access-Control-Allow-Headers' => '*',
        ]);
    }

    /**
     * Generate AI interactive learning suite using Google Gemini on the backend.
     */
    public function generateAi(Request $request, string $idOrSlug, \App\Services\GeminiService $geminiService): JsonResponse
    {
        $ebook = is_numeric($idOrSlug)
            ? Ebook::find($idOrSlug)
            : Ebook::where('slug', $idOrSlug)->first();

        if (!$ebook) {
            return response()->json(['message' => 'E-Book not found.'], 404);
        }

        $textSample = $request->input('text_sample', '');
        $totalPages = $ebook->total_pages ?: $request->input('total_pages', 10);

        $elements = $geminiService->generateInteractiveElements($ebook->title, $totalPages, $textSample);

        // Persist to database
        $ebook->interactive_elements = $elements;
        $ebook->save();

        return response()->json([
            'success' => true,
            'data' => $elements,
        ]);
    }

    /**
     * Standalone AI generation endpoint for live preview during upload before book creation.
     */
    public function generateAiStandalone(Request $request, \App\Services\GeminiService $geminiService): JsonResponse
    {
        $validated = $request->validate([
            'title' => 'nullable|string|max:255',
            'total_pages' => 'nullable|integer|min:1',
            'text_sample' => 'nullable|string',
        ]);

        $title = !empty($validated['title']) ? $validated['title'] : 'Course Textbook';
        $totalPages = $validated['total_pages'] ?? 10;
        $textSample = $validated['text_sample'] ?? '';

        $elements = $geminiService->generateInteractiveElements($title, $totalPages, $textSample);

        return response()->json([
            'success' => true,
            'data' => $elements,
        ]);
    }
}
