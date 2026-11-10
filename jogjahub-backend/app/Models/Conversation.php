<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

/**
 * Model Conversation — satu thread chat antara customer dan tenant.
 *
 * Relasi:
 * - customer()   → User (role customer)
 * - tenant()     → User (role tenant)
 * - messages()   → hasMany Message, urut dari terlama (asc) untuk tampilan chat
 * - latestMessage() → hasOne Message terbaru (untuk preview di daftar inbox)
 *
 * Catatan:
 * - 1 pasangan customer-tenant hanya boleh punya 1 conversation (enforced oleh unique index di DB).
 * - Gunakan firstOrCreate() saat customer memulai chat ke tenant.
 */
class Conversation extends Model
{
    use HasFactory;

    protected $fillable = [
        'customer_id',
        'tenant_id',
    ];

    // ─── Relasi ──────────────────────────────────────────────────────────────

    /**
     * User yang berperan sebagai customer dalam conversation ini.
     */
    public function customer()
    {
        return $this->belongsTo(User::class, 'customer_id');
    }

    /**
     * User yang berperan sebagai tenant dalam conversation ini.
     */
    public function tenant()
    {
        return $this->belongsTo(User::class, 'tenant_id');
    }

    /**
     * Semua pesan dalam conversation ini, urut dari yang terlama.
     * Dipakai saat membuka halaman chat.
     */
    public function messages()
    {
        return $this->hasMany(Message::class)->oldest();
    }

    /**
     * Pesan terbaru dalam conversation ini.
     * Dipakai untuk preview di daftar inbox (seperti WhatsApp).
     */
    public function latestMessage()
    {
        return $this->hasOne(Message::class)->latestOfMany();
    }

    // ─── Helper ──────────────────────────────────────────────────────────────

    /**
     * Hitung jumlah pesan yang belum dibaca oleh user tertentu.
     * Dipakai untuk menampilkan unread badge.
     *
     * @param int $userId  ID user penerima (bukan pengirim)
     */
    public function unreadCountFor(int $userId): int
    {
        return $this->messages()
            ->where('sender_id', '!=', $userId)
            ->whereNull('read_at')
            ->count();
    }
}
