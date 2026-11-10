<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

/**
 * Tabel messages — isi pesan di dalam sebuah conversation.
 *
 * Desain:
 * - sender_id menunjuk ke users.id — bisa customer atau tenant yang kirim.
 * - body hanya teks (tidak ada attachment di tahap ini).
 * - read_at null = belum dibaca, terisi timestamp = sudah dibaca.
 *   Field ini dipakai untuk menghitung unread badge di frontend.
 * - Index pada (conversation_id, created_at) untuk load pesan dengan pagination
 *   urut waktu secara efisien.
 */
return new class extends Migration
{
    public function up(): void
    {
        Schema::create('messages', function (Blueprint $table) {
            $table->id();

            // Pesan milik conversation mana
            $table->foreignId('conversation_id')
                ->constrained('conversations')
                ->cascadeOnDelete();

            // Siapa yang mengirim pesan (customer atau tenant)
            $table->foreignId('sender_id')
                ->constrained('users')
                ->cascadeOnDelete();

            // Isi pesan — teks saja
            $table->text('body');

            // Null = belum dibaca oleh penerima, terisi = sudah dibaca
            $table->timestamp('read_at')->nullable();

            $table->timestamps();

            // Index untuk load pesan per conversation urut waktu (paginasi)
            $table->index(['conversation_id', 'created_at']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('messages');
    }
};
