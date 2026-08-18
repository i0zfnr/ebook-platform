<?php

namespace App\Services;

use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Log;

class GeminiService
{
    /**
     * Generate interactive elements (quizzes, videos, flashcards, forms) using Google Gemini 2.5 Flash
     */
    public function generateInteractiveElements(string $title, int $totalPages, string $textSample = ''): array
    {
        $apiKey = env('GEMINI_API_KEY') ?: config('services.gemini.key');

        if (!$apiKey) {
            Log::info('GEMINI_API_KEY not found in backend .env, using backend heuristic generator.');
            return $this->getFallbackElements($title, $totalPages, $textSample);
        }

        $model = env('GEMINI_MODEL') ?: 'gemini-3.7-flash';
        $endpoint = "https://generativelanguage.googleapis.com/v1beta/models/{$model}:generateContent?key={$apiKey}";

        $systemPrompt = <<<PROMPT
You are an expert academic curriculum researcher and professor creating interactive learning materials for the textbook titled "{$title}" ({$totalPages} pages).

Analyze this actual extracted text from the uploaded PDF document:
=== DOCUMENT EXCERPT START ===
{$textSample}
=== DOCUMENT EXCERPT END ===

Carefully research the subject matter, chapters, mathematical equations, technical terms, and core concepts presented in the text excerpt.
Generate a comprehensive, curriculum-grade interactive learning suite with at least 10 in-depth quiz questions (distributed into Part 1 and Part 2) and 8 key concept flashcards matching the exact topic of this document.

Output MUST be a valid JSON object matching this schema exactly without markdown formatting:
{
  "quizzes": [
    {
      "pageNumber": 6,
      "title": "Module Knowledge Assessment (Part 1)",
      "questions": [
        {
          "question": "Deep, high-quality multiple choice question based directly on the concepts in the excerpt",
          "options": ["Accurate correct answer", "Plausible distractor 1", "Plausible distractor 2", "Plausible distractor 3"],
          "correctIndex": 0,
          "explanation": "Detailed step-by-step explanation demonstrating why this option is correct."
        },
        {
          "question": "Second analytical question testing understanding of definitions or steps",
          "options": ["Accurate correct answer", "Plausible distractor 1", "Plausible distractor 2", "Plausible distractor 3"],
          "correctIndex": 0,
          "explanation": "Detailed explanation."
        },
        {
          "question": "Third question testing methodology or problem-solving application",
          "options": ["Accurate correct answer", "Plausible distractor 1", "Plausible distractor 2", "Plausible distractor 3"],
          "correctIndex": 0,
          "explanation": "Detailed explanation."
        },
        {
          "question": "Fourth question testing boundary conditions or key principles",
          "options": ["Accurate correct answer", "Plausible distractor 1", "Plausible distractor 2", "Plausible distractor 3"],
          "correctIndex": 0,
          "explanation": "Detailed explanation."
        },
        {
          "question": "Fifth question testing practical scenario or calculation",
          "options": ["Accurate correct answer", "Plausible distractor 1", "Plausible distractor 2", "Plausible distractor 3"],
          "correctIndex": 0,
          "explanation": "Detailed explanation."
        }
      ]
    },
    {
      "pageNumber": 14,
      "title": "Advanced Mastery Assessment (Part 2)",
      "questions": [
        {
          "question": "Sixth advanced question testing synthesis of multiple concepts",
          "options": ["Accurate correct answer", "Plausible distractor 1", "Plausible distractor 2", "Plausible distractor 3"],
          "correctIndex": 0,
          "explanation": "Detailed explanation."
        },
        {
          "question": "Seventh question testing comparative analysis or error identification",
          "options": ["Accurate correct answer", "Plausible distractor 1", "Plausible distractor 2", "Plausible distractor 3"],
          "correctIndex": 0,
          "explanation": "Detailed explanation."
        },
        {
          "question": "Eighth question testing optimization or advanced algorithms",
          "options": ["Accurate correct answer", "Plausible distractor 1", "Plausible distractor 2", "Plausible distractor 3"],
          "correctIndex": 0,
          "explanation": "Detailed explanation."
        },
        {
          "question": "Ninth question testing measurement criteria or verification standards",
          "options": ["Accurate correct answer", "Plausible distractor 1", "Plausible distractor 2", "Plausible distractor 3"],
          "correctIndex": 0,
          "explanation": "Detailed explanation."
        },
        {
          "question": "Tenth comprehensive synthesis question",
          "options": ["Accurate correct answer", "Plausible distractor 1", "Plausible distractor 2", "Plausible distractor 3"],
          "correctIndex": 0,
          "explanation": "Detailed explanation."
        }
      ]
    }
  ],
  "flashcards": [
    {
      "pageNumber": 10,
      "title": "Key Terminology & Speed Match Game (8 Concepts)",
      "cards": [
        {
          "term": "Key Concept 1 Name",
          "definition": "Clear, precise academic definition or formula application."
        },
        {
          "term": "Key Concept 2 Name",
          "definition": "Clear definition."
        },
        {
          "term": "Key Concept 3 Name",
          "definition": "Clear definition."
        },
        {
          "term": "Key Concept 4 Name",
          "definition": "Clear definition."
        },
        {
          "term": "Key Concept 5 Name",
          "definition": "Clear definition."
        },
        {
          "term": "Key Concept 6 Name",
          "definition": "Clear definition."
        },
        {
          "term": "Key Concept 7 Name",
          "definition": "Clear definition."
        },
        {
          "term": "Key Concept 8 Name",
          "definition": "Clear definition."
        }
      ]
    }
  ],
  "video": {
    "pageNumber": 4,
    "title": "Recommended Video Lesson",
    "youtubeUrl": "https://www.youtube.com/watch?v=xxpc-HPKN28",
    "videoId": "xxpc-HPKN28",
    "description": "Video lesson covering fundamental principles from this module."
  }
}

Generate exactly 10 thoughtful, analytical quiz questions (5 in Part 1, 5 in Part 2) and 8 flashcard concept pairs based directly on the text excerpt.
PROMPT;

        try {
            $response = Http::withoutVerifying()->timeout(60)->post($endpoint, [
                'contents' => [
                    [
                        'parts' => [
                            ['text' => $systemPrompt],
                        ],
                    ],
                ],
                'generationConfig' => [
                    'responseMimeType' => 'application/json',
                    'temperature' => 0.2,
                ],
            ]);

            if ($response->successful()) {
                $data = $response->json();
                $rawText = $data['candidates'][0]['content']['parts'][0]['text'] ?? null;
                if ($rawText) {
                    $parsed = json_decode($rawText, true);
                    if ($parsed && !empty($parsed['quizzes'])) {
                        Log::info("Google Gemini AI successfully generated interactive learning suite for '{$title}'");
                        return $this->formatElements($parsed, $totalPages);
                    }
                }
            } else {
                Log::warning('Gemini API call returned non-200: ' . $response->status() . ' Body: ' . $response->body());
            }
        } catch (\Throwable $e) {
            Log::error('Gemini API connection error: ' . $e->getMessage());
        }

        return $this->getFallbackElements($title, $totalPages, $textSample);
    }

    /**
     * Convert Gemini JSON into client-ready InteractiveElement array
     */
    protected function formatElements(array $geminiData, int $totalPages): array
    {
        $elements = [];
        $timestamp = (int) (microtime(true) * 1000);

        // Quizzes
        if (!empty($geminiData['quizzes']) && is_array($geminiData['quizzes'])) {
            foreach ($geminiData['quizzes'] as $idx => $qItem) {
                if (!empty($qItem['questions'])) {
                    $elements[] = [
                        'id' => "ai_quiz_{$timestamp}_{$idx}",
                        'pageNumber' => min(max(1, (int) ($qItem['pageNumber'] ?? 5)), $totalPages),
                        'type' => 'quiz',
                        'title' => $qItem['title'] ?? 'Google Gemini AI Knowledge Check',
                        'description' => 'Researched and generated by Google Gemini AI from your course PDF.',
                        'data' => [
                            'questions' => array_map(function ($q, $qIdx) use ($idx) {
                                return [
                                    'id' => "gq_{$idx}_{$qIdx}",
                                    'question' => $q['question'] ?? 'Question',
                                    'options' => $q['options'] ?? [],
                                    'correctIndex' => (int) ($q['correctIndex'] ?? 0),
                                    'explanation' => $q['explanation'] ?? '',
                                ];
                            }, $qItem['questions'], array_keys($qItem['questions'])),
                        ],
                    ];
                }
            }
        }

        // Flashcards
        if (!empty($geminiData['flashcards']) && is_array($geminiData['flashcards'])) {
            foreach ($geminiData['flashcards'] as $idx => $fItem) {
                if (!empty($fItem['cards'])) {
                    $elements[] = [
                        'id' => "ai_flash_{$timestamp}_{$idx}",
                        'pageNumber' => min(max(1, (int) ($fItem['pageNumber'] ?? 8)), $totalPages),
                        'type' => 'flashcards',
                        'title' => $fItem['title'] ?? 'Key Terminology Flashcards & Match Game',
                        'description' => 'Terms and definitions extracted directly from this document.',
                        'data' => [
                            'cards' => array_map(function ($c, $cIdx) use ($idx) {
                                return [
                                    'id' => "gc_{$idx}_{$cIdx}",
                                    'term' => $c['term'] ?? 'Term',
                                    'definition' => $c['definition'] ?? 'Definition',
                                ];
                            }, $fItem['cards'], array_keys($fItem['cards'])),
                        ],
                    ];
                }
            }
        }

        // Video
        if (!empty($geminiData['video'])) {
            $v = $geminiData['video'];
            $elements[] = [
                'id' => "ai_video_{$timestamp}",
                'pageNumber' => min(max(1, (int) ($v['pageNumber'] ?? 3)), $totalPages),
                'type' => 'video',
                'title' => $v['title'] ?? 'Curated Video Lecture',
                'description' => $v['description'] ?? 'Recommended video lesson matching chapter concepts.',
                'data' => [
                    'youtubeUrl' => $v['youtubeUrl'] ?? 'https://www.youtube.com/watch?v=xxpc-HPKN28',
                    'videoId' => $v['videoId'] ?? 'xxpc-HPKN28',
                    'videoTitle' => $v['title'] ?? 'Video Lecture',
                ],
            ];
        }

        return $elements;
    }

    /**
     * Fallback heuristic generator when offline or key not yet inserted
     */
    protected function getFallbackElements(string $title, int $totalPages, string $textSample): array
    {
        $timestamp = (int) (microtime(true) * 1000);
        $lower = strtolower($title . ' ' . $textSample);
        $isStats = str_contains($lower, 'statistic') || str_contains($lower, 'probability') || str_contains($lower, 'data');

        return [
            [
                'id' => "ai_quiz_{$timestamp}",
                'pageNumber' => min($totalPages > 15 ? 10 : max(2, (int) floor($totalPages / 2)), $totalPages),
                'type' => 'quiz',
                'title' => 'Chapter Knowledge Check (AI Prepared)',
                'description' => 'Self-assessment quiz designed for this course module.',
                'data' => [
                    'questions' => $isStats ? [
                        [
                            'id' => 'q1',
                            'question' => 'What is the fundamental difference between a population and a sample?',
                            'options' => [
                                'A population includes all individuals under study, whereas a sample is a representative subset.',
                                'A sample is the entire group, while a population is a small group.',
                                'There is no mathematical distinction.',
                                'A population is strictly qualitative data.',
                            ],
                            'correctIndex' => 0,
                            'explanation' => 'In statistics, a population is the entire group of interest, while a sample is an examined subset.',
                        ],
                        [
                            'id' => 'q2',
                            'question' => 'Which of the following represents a discrete quantitative variable?',
                            'options' => [
                                'Number of defective computer parts (1, 2, 3...)',
                                'Time taken to complete an algorithm in milliseconds',
                                'Student body weight in kilograms',
                                'Ambient classroom temperature',
                            ],
                            'correctIndex' => 0,
                            'explanation' => 'Discrete variables take countable integer numbers with distinct steps.',
                        ],
                    ] : [
                        [
                            'id' => 'q1',
                            'question' => "What is the core foundational topic covered in {$title}?",
                            'options' => [
                                'Foundational terminology, principles, and practical application',
                                'Hardware maintenance only',
                                'Unrelated trivia',
                                'None of the above',
                            ],
                            'correctIndex' => 0,
                            'explanation' => 'Core principles provide the structural foundation for the entire module.',
                        ],
                    ],
                ],
            ],
            [
                'id' => "ai_video_{$timestamp}_1",
                'pageNumber' => min($totalPages > 10 ? 4 : 2, $totalPages),
                'type' => 'video',
                'title' => $isStats ? 'Video Lecture: Introduction to Statistics' : 'Video Tutorial: Practical Overview',
                'description' => 'Curated video lesson reinforcing key concepts.',
                'data' => [
                    'youtubeUrl' => 'https://www.youtube.com/watch?v=xxpc-HPKN28',
                    'videoId' => 'xxpc-HPKN28',
                ],
            ],
            [
                'id' => "ai_flash_{$timestamp}_2",
                'pageNumber' => min($totalPages > 20 ? 14 : max(3, (int) floor($totalPages * 0.75)), $totalPages),
                'type' => 'flashcards',
                'title' => 'Key Terminology Flashcard Mastery & Speed Match Game',
                'description' => 'Practice term recall and definitions.',
                'data' => [
                    'cards' => [
                        ['id' => 'f1', 'term' => 'Core Principle A', 'definition' => 'The primary rule defining how this system functions.'],
                        ['id' => 'f2', 'term' => 'Core Principle B', 'definition' => 'The practical workflow applied in exercises.'],
                    ],
                ],
            ],
        ];
    }
}
