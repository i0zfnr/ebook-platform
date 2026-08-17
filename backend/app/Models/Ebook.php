<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Str;

class Ebook extends Model
{
    use HasFactory;

    /**
     * The attributes that are mass assignable.
     *
     * @var array<int, string>
     */
    protected $fillable = [
        'title',
        'slug',
        'author',
        'description',
        'pdf_path',
        'cover_path',
        'original_filename',
        'file_size',
        'total_pages',
        'status',
        'interactive_elements',
    ];

    /**
     * The accessors to append to the model's array form.
     *
     * @var array<int, string>
     */
    protected $appends = [
        'pdf_url',
        'cover_url',
    ];

    /**
     * Get the attributes that should be cast.
     *
     * @return array<string, string>
     */
    protected function casts(): array
    {
        return [
            'file_size' => 'integer',
            'total_pages' => 'integer',
            'interactive_elements' => 'array',
        ];
    }

    /**
     * Get the full URL for the PDF file.
     */
    public function getPdfUrlAttribute(): ?string
    {
        if (!$this->pdf_path) {
            return null;
        }

        return url('/api/ebooks/' . ($this->slug ?: $this->id) . '/file');
    }

    /**
     * Get the full URL for the cover image.
     */
    public function getCoverUrlAttribute(): ?string
    {
        if (!$this->cover_path) {
            return null;
        }

        return url('/api/ebooks/' . ($this->slug ?: $this->id) . '/cover');
    }

    /**
     * Automatically generate a unique slug.
     */
    public static function generateUniqueSlug(string $title, ?int $ignoreId = null): string
    {
        $baseSlug = Str::slug($title);
        if (empty($baseSlug)) {
            $baseSlug = 'ebook-' . Str::lower(Str::random(6));
        }

        $slug = $baseSlug;
        $counter = 1;

        while (static::where('slug', $slug)
            ->when($ignoreId, fn ($query) => $query->where('id', '!=', $ignoreId))
            ->exists()
        ) {
            $slug = "{$baseSlug}-{$counter}";
            $counter++;
        }

        return $slug;
    }
}
