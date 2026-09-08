<?php

namespace App\Http\Controllers\Api\Customer;

use App\Http\Controllers\Controller;
use App\Models\TenantProfile;
use Illuminate\Http\Request;

class TenantController extends Controller
{
    public function map()
    {
        $tenant = TenantProfile::where('status', 'approved')
            ->select('id', 'business_name', 'latitude', 'longitude', 'whatsapp_number')
            ->with('categories:id,name')
            ->get();

        return response()->json([
            'status' => 'success',
            'data' => $tenant
        ]);
    }

    public function show(TenantProfile $tenant)
    {
        if ($tenant->status !== 'approved') {
            return response()->json([
                'status' => 'error',
                'message' => 'Tenant tidak ditemukan atau belum disetujui'
            ], 404);
        }

        $tenant->load(['categories', 'services' => fn($q) => $q->with('subcategory')]);

        return response()->json([
            'status' => 'success',
            'data' => $tenant
        ]);
    }


}
