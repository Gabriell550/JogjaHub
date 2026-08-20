<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class TimeSlot extends Model
{
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
}
