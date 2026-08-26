<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\SoftDeletes;

class Booking extends Model
{
    use SoftDeletes;

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
    ];

    public function customer()
    {
        return $this->belongsTo(User::class, 'customer_id');
    }

    public function service()
    {
        return $this->belongsTo(Service::class);
    }

    public function slot()
    {
        return $this->belongsTo(TimeSlot::class, 'slot_id');
    }

    public function review()
    {
        return $this->hasOne(Review::class);
    }
}
