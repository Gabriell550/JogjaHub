<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\SoftDeletes;

class Service extends Model
{
    use SoftDeletes;

    protected $fillable = [
        'tenant_id',
        'subcategory_id',
        'name',
        'description',
        'price',
        'photos',
    ];

    protected $casts = [
        'photos' => 'array',
        'price' => 'decimal:2',
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
}
