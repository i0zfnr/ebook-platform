<?php

use App\Http\Controllers\Api\EbookController;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Route;

Route::get('/user', function (Request $request) {
    return $request->user();
})->middleware('auth:sanctum');

// Specific asset streaming and AI routes
Route::get('ebooks/{ebook}/file', [EbookController::class, 'file'])->name('ebooks.file');
Route::get('ebooks/{ebook}/cover', [EbookController::class, 'cover'])->name('ebooks.cover');
Route::post('ebooks/{ebook}/generate-ai', [EbookController::class, 'generateAi'])->name('ebooks.generateAi');
Route::post('generate-ai', [EbookController::class, 'generateAiStandalone'])->name('generateAiStandalone');
Route::post('ai/chat', [\App\Http\Controllers\Api\AiChatController::class, 'chat'])->name('ai.chat');

// E-Book REST API routes
Route::apiResource('ebooks', EbookController::class);
