<?php

namespace Database\Seeders;

use App\Models\Ebook;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Str;

class EbookSeeder extends Seeder
{
    /**
     * Run the database seeds.
     */
    public function run(): void
    {
        // Ensure directories exist
        Storage::disk('public')->makeDirectory('ebooks');
        Storage::disk('public')->makeDirectory('covers');

        // Create a simple valid 4-page sample PDF
        $samplePdfContent = $this->generateSamplePdf();
        $pdfFileName = Str::uuid() . '.pdf';
        Storage::disk('public')->put('ebooks/' . $pdfFileName, $samplePdfContent);

        Ebook::updateOrCreate(
            ['slug' => 'the-art-of-digital-reading'],
            [
                'title' => 'The Art of Digital Reading',
                'slug' => 'the-art-of-digital-reading',
                'author' => 'Alexander Wright',
                'description' => 'An illustrated introduction to modern digital publishing, interactive flipbooks, and typography in the digital era.',
                'pdf_path' => 'ebooks/' . $pdfFileName,
                'cover_path' => null,
                'original_filename' => 'art-of-digital-reading.pdf',
                'file_size' => strlen($samplePdfContent),
                'total_pages' => 4,
                'status' => 'published',
            ]
        );
    }

    /**
     * Generate a minimal valid 4-page PDF document
     */
    private function generateSamplePdf(): string
    {
        $pagesContent = [
            "BT /F1 28 Tf 50 720 Td (The Art of Digital Reading) Tj /F1 14 Tf 50 680 Td (By Alexander Wright) Tj /F1 12 Tf 50 620 Td (Welcome to the future of digital publishing.) Tj 50 590 Td (This is an interactive demonstration flipbook.) Tj ET",
            "BT /F1 20 Tf 50 720 Td (Chapter 1: The Tactical Experience) Tj /F1 12 Tf 50 670 Td (Digital reading is not merely about displaying static text.) Tj 50 645 Td (It is about creating an immersive, fluid, and natural sensation.) Tj 50 620 Td (Page turn physics evoke the feeling of holding a real book.) Tj ET",
            "BT /F1 20 Tf 50 720 Td (Chapter 2: Typography & Spacing) Tj /F1 12 Tf 50 670 Td (Clean font hierarchies and ample whitespace reduce eye strain.) Tj 50 645 Td (Vector-based canvas rendering preserves sharpness at all zoom levels.) Tj 50 620 Td (Readers can navigate seamlessly via keyboard, touch, or mouse.) Tj ET",
            "BT /F1 20 Tf 50 720 Td (Chapter 3: Self-Hosted Freedom) Tj /F1 12 Tf 50 670 Td (Keep your literature private, ad-free, and independently hosted.) Tj 50 645 Td (Enjoy complete control over your publishing platform.) Tj 50 600 Td (Thank you for reading!) Tj ET",
        ];

        $pdf = "%PDF-1.4\n";
        $offsets = [];

        // 1: Catalog
        $offsets[1] = strlen($pdf);
        $pdf .= "1 0 obj\n<< /Type /Catalog /Pages 2 0 R >>\nendobj\n";

        // 2: Pages
        $offsets[2] = strlen($pdf);
        $pdf .= "2 0 obj\n<< /Type /Pages /Kids [3 0 R 4 0 R 5 0 R 6 0 R] /Count 4 >>\nendobj\n";

        // Font
        $offsets[7] = strlen($pdf);
        $pdf .= "7 0 obj\n<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica >>\nendobj\n";

        // Content Streams
        for ($i = 0; $i < 4; $i++) {
            $streamObjNum = 8 + $i;
            $pageObjNum = 3 + $i;

            $offsets[$streamObjNum] = strlen($pdf);
            $stream = $pagesContent[$i];
            $streamLen = strlen($stream);
            $pdf .= "{$streamObjNum} 0 obj\n<< /Length {$streamLen} >>\nstream\n{$stream}\nendstream\nendobj\n";

            $offsets[$pageObjNum] = strlen($pdf);
            $pdf .= "{$pageObjNum} 0 obj\n<< /Type /Page /Parent 2 0 R /MediaBox [0 0 595 842] /Resources << /Font << /F1 7 0 R >> >> /Contents {$streamObjNum} 0 R >>\nendobj\n";
        }

        // XRef Table
        $xrefOffset = strlen($pdf);
        $maxObj = 11;
        $pdf .= "xref\n0 " . ($maxObj + 1) . "\n";
        $pdf .= "0000000000 65535 f \n";
        for ($i = 1; $i <= $maxObj; $i++) {
            $offset = $offsets[$i] ?? 0;
            $pdf .= sprintf("%010d 00000 n \n", $offset);
        }

        $pdf .= "trailer\n<< /Size " . ($maxObj + 1) . " /Root 1 0 R >>\nstartxref\n{$xrefOffset}\n%%EOF";

        return $pdf;
    }
}
