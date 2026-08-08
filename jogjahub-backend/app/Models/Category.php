<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class Category extends Model
{
    protected $fillable = ['name'];

    public function tenants(){
        return $this->belongsToMany(TenantProfile::class, 'tenant_categories', 'category_id', 'tenant_profile_id');
    }
}
