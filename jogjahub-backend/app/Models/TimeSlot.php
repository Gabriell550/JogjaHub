<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class TimeSlot extends Model
{
    use HasFactory;

    protected $fillable = [
        'service_id',
        'slot_date',
        'start_time',
        'end_time',
        'quota',
        'booked_count',
    ];

    public function service()
    {
        return $this->belongsTo(Service::class);
    }

    /**
     * Relasi balik ke Booking via pivot booking_slots.
     *
     * Dipakai untuk mengetahui booking mana saja yang sedang mengunci slot ini,
     * berguna saat release/cancel multi-slot.
     */
    public function bookings()
    {
        return $this->belongsToMany(
            Booking::class,
            'booking_slots',
            'time_slot_id',
            'booking_id'
        )->withTimestamps();
    }
}
