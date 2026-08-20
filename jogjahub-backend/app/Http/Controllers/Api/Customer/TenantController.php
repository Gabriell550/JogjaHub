<?php

namespace App\Http\Controllers\Api\Customer;

use App\Http\Controllers\Controller;
use App\Models\TenantProfile;
use Illuminate\Http\Request;

class TenantController extends Controller
{
    public function index()
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


}
