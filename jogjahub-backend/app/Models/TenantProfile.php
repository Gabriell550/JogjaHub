<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class TenantProfile extends Model
{
    protected $fillable = [
        'user_id',
        'business_name',
        'description',
        'address',
        'latitude',
        'longitude',
        'whatsapp_number',
        'status',
    ];

    protected $casts = [
        'address' => 'array'
    ];

    public function getLocationAttribute(): array
    {
        return [
            'latitude' => (float) $this->latitude,
            'longitude' => (float) $this->longitude,
        ];
    }

    protected $appends = ['location'];

    public function user()
    {
        return $this->belongsTo(User::class);
    }

    public function categories()
    {
        return $this->belongsToMany(Category::class, 'tenant_categories', 'tenant_profile_id', 'category_id');
    }
}
