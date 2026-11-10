<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

/**
 * Model Message — satu pesan dalam sebuah conversation.
 *
 * Relasi:
 * - conversation() → belongsTo Conversation
 * - sender()       → belongsTo User (bisa customer atau tenant)
 *
 * Catatan tentang read_at:
 * - null    = pesan belum dibaca oleh penerima
 * - timestamp = pesan sudah dibaca
 * - Hanya pesan dari lawan bicara yang perlu di-mark read
 *   (pesan milik sendiri tidak perlu di-mark)
 */
class Message extends Model
{
    use HasFactory;

    protected $fillable = [
        'conversation_id',
        'sender_id',
        'body',
        'read_at',
    ];

    protected $casts = [
        // Cast read_at ke Carbon supaya bisa diformat dengan mudah di resource
        'read_at' => 'datetime',
    ];

    // ─── Relasi ──────────────────────────────────────────────────────────────

    /**
     * Conversation tempat pesan ini berada.
     */
    public function conversation()
    {
        return $this->belongsTo(Conversation::class);
    }

    /**
     * User yang mengirim pesan ini.
     */
    public function sender()
    {
        return $this->belongsTo(User::class, 'sender_id');
    }
}
