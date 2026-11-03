<?php

namespace App\Models;

use App\Enums\PriceType;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\SoftDeletes;

class Service extends Model
{
    use HasFactory, SoftDeletes;


    protected $fillable = [
        'tenant_id',
        'subcategory_id',
        'name',
        'description',
        'price',
        // price_type menentukan cara kalkulasi total harga saat booking:
        // - per_session: harga tetap 1 sesi (default, backward compat)
        // - per_night  : harga per malam, dikalikan jumlah malam saat checkout
        'price_type',
        'photos',
    ];

    protected $casts = [
        'photos'     => 'array',
        'price'      => 'decimal:2',
        // Cast ke Enum PriceType agar bisa dibandingkan dengan PriceType::PER_NIGHT
        'price_type' => PriceType::class,
    ];

    public function tenant()
    {
        return $this->belongsTo(TenantProfile::class, 'tenant_id');
    }

    public function subcategory()
    {
        return $this->belongsTo(Subcategory::class);
    }

    public function timeSlots()
    {
        return $this->hasMany(TimeSlot::class);
    }

    public function bookings()
    {
        return $this->hasMany(Booking::class);
    }
}
