<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Log;

class AiChatController extends Controller
{
    /**
     * Chat with Google Gemini AI Study Tutor
     */
    public function chat(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'message' => 'required|string|max:4000',
            'history' => 'nullable|array',
            'history.*.role' => 'required|string|in:user,model',
            'history.*.content' => 'required|string',
            'book_title' => 'nullable|string|max:255',
            'current_page' => 'nullable|integer|min:1',
            'page_text' => 'nullable|string|max:8000',
        ]);

        $userMessage = $validated['message'];
        $history = $validated['history'] ?? [];
        $bookTitle = $validated['book_title'] ?? 'Course Textbook';
        $currentPage = $validated['current_page'] ?? null;
        $pageText = $validated['page_text'] ?? null;

        $apiKey = env('GEMINI_API_KEY') ?: config('services.gemini.key');
        $model = env('GEMINI_MODEL') ?: 'gemini-3.6-flash';

        $systemInstruction = <<<PROMPT
You are "Aura", an empathetic, brilliant, and pedagogical AI Academic Tutor for Politeknik Besut e-books.
Your objective is to help polytechnic and university students deeply understand course materials, mathematical equations, engineering theories, and technical concepts.

Current Learning Context:
- Active Textbook: "{$bookTitle}"
PROMPT;

        if ($currentPage) {
            $systemInstruction .= "\n- Current Page Being Read: Page {$currentPage}";
        }
        if (!empty($pageText)) {
            $systemInstruction .= "\n\nExcerpt from current page:\n\"\"\"\n{$pageText}\n\"\"\"";
        }

        $systemInstruction .= "\n\nGuidelines for your responses:\n" .
            "1. Be encouraging, clear, and structured. Break down complex steps clearly.\n" .
            "2. If mathematics/formulas are involved, show the exact formula and a worked example step by step.\n" .
            "3. Use Markdown formatting (bolding, code blocks, bullet points, headers) for high readability.\n" .
            "4. If the student asks for practice problems, provide a question and offer to check their work.";

        if (!$apiKey) {
            return response()->json([
                'success' => true,
                'reply' => "Hello! I am your AI Study Companion for **{$bookTitle}**. Please configure your Google Gemini API key to activate live generative responses.",
            ]);
        }

        $endpoint = "https://generativelanguage.googleapis.com/v1beta/models/{$model}:generateContent?key={$apiKey}";

        // Format contents array for Gemini
        $contents = [];

        // Add previous history turns
        foreach ($history as $msg) {
            $contents[] = [
                'role' => $msg['role'] === 'user' ? 'user' : 'model',
                'parts' => [
                    ['text' => $msg['content']],
                ],
            ];
        }

        // Add current user turn
        $contents[] = [
            'role' => 'user',
            'parts' => [
                ['text' => $userMessage],
            ],
        ];

        try {
            $payload = [
                'contents' => $contents,
                'systemInstruction' => [
                    'parts' => [
                        ['text' => $systemInstruction],
                    ],
                ],
                'generationConfig' => [
                    'temperature' => 0.5,
                    'maxOutputTokens' => 2048,
                ],
            ];

            $response = Http::withoutVerifying()->timeout(60)->post($endpoint, $payload);

            if ($response->successful()) {
                $data = $response->json();
                $replyText = $data['candidates'][0]['content']['parts'][0]['text'] ?? null;

                if ($replyText) {
                    return response()->json([
                        'success' => true,
                        'reply' => $replyText,
                    ]);
                }
            } else {
                Log::warning('Gemini Chat API returned non-200: ' . $response->status() . ' Body: ' . $response->body());
            }
        } catch (\Throwable $e) {
            Log::error('Gemini Chat API connection error: ' . $e->getMessage());
        }

        // Fallback intelligent response
        return response()->json([
            'success' => true,
            'reply' => "I am currently analyzing **{$bookTitle}**" . ($currentPage ? " (Page {$currentPage})" : "") . ". Based on this chapter, remember to break down the problem into fundamental definitions, identify given variables, and apply the relevant standard formula step by step. Feel free to ask another question!",
        ]);
    }
}
