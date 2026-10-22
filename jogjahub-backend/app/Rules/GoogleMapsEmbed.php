<?php

namespace App\Rules;

use Closure;
use Illuminate\Contracts\Validation\ValidationRule;

/**
 * Validasi input Google Maps Embed.
 *
 * Menerima dua format:
 *  1. HTML mentah dari "Sematkan peta": <iframe src="https://www.google.com/maps/embed?pb=..." ...></iframe>
 *  2. URL src-nya langsung: https://www.google.com/maps/embed?pb=...
 *
 * Yang disimpan ke database adalah URL src-nya saja (bukan tag <iframe> penuh).
 * Ekstraksi dilakukan di sini supaya controller tidak perlu tahu format asli inputnya.
 */
class GoogleMapsEmbed implements ValidationRule
{
    public function validate(string $attribute, mixed $value, Closure $fail): void
    {
        $url = $this->extractSrc($value);

        if (!$url) {
            $fail('Format :attribute tidak valid. Paste HTML dari tombol "Sematkan peta" Google Maps, atau URL embed-nya langsung.');
            return;
        }

        $host = parse_url($url, PHP_URL_HOST);
        $allowedHosts = ['www.google.com', 'maps.google.com', 'google.com'];

        if (!in_array($host, $allowedHosts)) {
            $fail(':attribute harus berasal dari Google Maps (google.com).');
            return;
        }

        // URL embed Google Maps selalu mengandung /maps/embed atau output=embed
        $path  = parse_url($url, PHP_URL_PATH) ?? '';
        $query = parse_url($url, PHP_URL_QUERY) ?? '';

        if (!str_contains($path, 'maps/embed') && !str_contains($query, 'output=embed')) {
            $fail(':attribute harus berupa link embed Google Maps, bukan link biasa. Gunakan "Sematkan peta" bukan "Salin link".');
        }
    }

    /**
     * Ekstrak URL dari tag <iframe> jika input berupa HTML,
     * atau kembalikan apa adanya jika sudah berupa URL.
     */
    public function extractSrc(string $value): ?string
    {
        $value = trim($value);

        // Kalau mengandung tag <iframe>, ambil nilai src="..."
        if (str_contains($value, '<iframe')) {
            preg_match('/src=["\']([^"\']+)["\']/', $value, $matches);
            return $matches[1] ?? null;
        }

        // Kalau sudah berupa URL langsung
        return filter_var($value, FILTER_VALIDATE_URL) ? $value : null;
    }
}

