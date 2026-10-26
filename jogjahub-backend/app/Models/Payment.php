<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class Payment extends Model
{
    use HasFactory;
    protected $fillable = [
        'booking_id',
        'xendit_invoice_id',
        'xendit_external_id',
        'amount',
        'currency',
        'status',
        'payment_method',
        'payment_channel',
        'payment_url',
        'paid_at',
        'expires_at',
        'xendit_raw_response',
    ];

    protected $casts = [
        'paid_at'              => 'datetime',
        'expires_at'           => 'datetime',
        'xendit_raw_response'  => 'array',
        'amount'               => 'integer',
    ];

    // ─── Relasi ──────────────────────────────────────────────────────────────

    public function booking(): BelongsTo
    {
        return $this->belongsTo(Booking::class);
    }

    // ─── Scope ───────────────────────────────────────────────────────────────

    public function scopePending($query)
    {
        return $query->where('status', 'pending');
    }

    public function scopePaid($query)
    {
        return $query->where('status', 'paid');
    }

    // ─── Helper ──────────────────────────────────────────────────────────────

    public function isPending(): bool
    {
        return $this->status === 'pending';
    }

    public function isPaid(): bool
    {
        return $this->status === 'paid';
    }

    public function isExpired(): bool
    {
        return $this->status === 'expired'
            || ($this->isPending() && $this->expires_at?->isPast());
    }
}

