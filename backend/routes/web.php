<?php

use Illuminate\Support\Facades\Route;

/**
 * Catch-all web route: Serves the unified React SPA from public/dist/index.html
 */
Route::get('/{any?}', function () {
    $indexPath = public_path('dist/index.html');
    if (file_exists($indexPath)) {
        return response()->file($indexPath, [
            'Content-Type' => 'text/html; charset=UTF-8',
        ]);
    }

    return response()->json([
        'status' => 'FlipBook API Active',
        'message' => 'React frontend build output not found. Run: npm run build',
    ]);
})->where('any', '^(?!api).*$');
