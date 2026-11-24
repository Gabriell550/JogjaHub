<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\SoftDeletes;
use Illuminate\Support\Carbon;

class Booking extends Model
{
    use HasFactory, SoftDeletes;


    protected $fillable = [
        'customer_id',
        'service_id',
        'slot_id',
        'status',
        'payment_method',
        'payment_proof_url',
        'details',
    ];

    protected $casts = [
        'details' => 'array',
        'fulfilled_at' => 'datetime',
        'completed_at' => 'datetime',
        'issue_reported_at' => 'datetime',
        'completion_reminded_at' => 'datetime',
    ];


    protected static function booted(): void
    {
        static::creating(function ($model) {
            if (empty($model->uuid)) {
                $model->uuid = (string) \Illuminate\Support\Str::uuid();
            }
        });
    }

    public function getRouteKeyName()
    {
        return 'uuid';
    }

    public function customer()
    {
        return $this->belongsTo(User::class, 'customer_id');
    }

    public function canMarkFulfilled(): bool
    {
        $timezone = 'Asia/Jakarta';
        $checkout = $this->details['check_out_date'] ?? null;
        if ($checkout) {
            return now()->gte(Carbon::parse($checkout, $timezone));
        }
        $slot = $this->slot;
        return !$slot || now()->gte(Carbon::parse(
            substr($slot->slot_date, 0, 10) . ' ' . ($slot->end_time ?: $slot->start_time),
            $timezone
        ));
    }

    public function service()
    {
        return $this->belongsTo(Service::class)->withTrashed();
    }

    public function slot()
    {
        return $this->belongsTo(TimeSlot::class, 'slot_id');
    }

    /**
     * Relasi many-to-many ke TimeSlot via pivot booking_slots.
     *
     * Dipakai untuk multi-slot booking (hotel): semua malam/slot yang dikunci
     * oleh satu booking tersimpan di sini. Untuk single-slot (salon, dll),
     * juga ada 1 record di pivot ini demi konsistensi release saat cancel/expired.
     */
    public function slots()
    {
        return $this->belongsToMany(
            TimeSlot::class,
            'booking_slots',
            'booking_id',
            'time_slot_id'
        )->withTimestamps();
    }

    public function review()
    {
        return $this->hasOne(Review::class);
    }

    public function payment()
    {
        return $this->hasOne(Payment::class);
    }
}
