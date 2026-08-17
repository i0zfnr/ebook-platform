<?php

namespace Tests\Feature;

use App\Models\Ebook;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Http\UploadedFile;
use Illuminate\Support\Facades\Storage;
use Tests\TestCase;

class EbookApiTest extends TestCase
{
    use RefreshDatabase;

    public function test_can_list_ebooks(): void
    {
        Ebook::create([
            'title' => 'Test Book',
            'slug' => 'test-book',
            'pdf_path' => 'ebooks/test.pdf',
        ]);

        $response = $this->getJson('/api/ebooks');

        $response->assertStatus(200)
            ->assertJsonStructure([
                'success',
                'data',
                'total',
            ]);
    }

    public function test_can_upload_ebook(): void
    {
        Storage::fake('public');

        $pdf = UploadedFile::fake()->create('sample-book.pdf', 1024, 'application/pdf');

        $payload = [
            'title' => 'Test Automation Book',
            'author' => 'Author Tester',
            'description' => 'Test description for the automated ebook.',
            'pdf' => $pdf,
            'total_pages' => 10,
        ];

        $response = $this->postJson('/api/ebooks', $payload);

        $response->assertStatus(201)
            ->assertJson([
                'success' => true,
                'data' => [
                    'title' => 'Test Automation Book',
                    'author' => 'Author Tester',
                    'total_pages' => 10,
                ],
            ]);

        $this->assertDatabaseHas('ebooks', [
            'title' => 'Test Automation Book',
        ]);
    }

    public function test_can_fetch_single_ebook(): void
    {
        $ebook = Ebook::create([
            'title' => 'Specific Test Book',
            'slug' => 'specific-test-book',
            'pdf_path' => 'ebooks/specific.pdf',
        ]);

        $response = $this->getJson('/api/ebooks/' . $ebook->slug);

        $response->assertStatus(200)
            ->assertJson([
                'success' => true,
                'data' => [
                    'id' => $ebook->id,
                    'title' => $ebook->title,
                ],
            ]);
    }

    public function test_can_delete_ebook(): void
    {
        Storage::fake('public');

        $pdfPath = 'ebooks/dummy-to-delete.pdf';
        Storage::disk('public')->put($pdfPath, 'dummy content');

        $ebook = Ebook::create([
            'title' => 'Book To Delete',
            'slug' => 'book-to-delete',
            'pdf_path' => $pdfPath,
        ]);

        $response = $this->deleteJson('/api/ebooks/' . $ebook->id);

        $response->assertStatus(200)
            ->assertJson([
                'success' => true,
            ]);

        $this->assertDatabaseMissing('ebooks', [
            'id' => $ebook->id,
        ]);
    }
}
