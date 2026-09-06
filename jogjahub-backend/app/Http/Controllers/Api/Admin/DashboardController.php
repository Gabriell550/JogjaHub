<?php

namespace App\Http\Controllers\Api\Admin;

use App\Http\Controllers\Controller;
use App\Models\Booking;
use App\Models\TenantProfile;

class DashboardController extends Controller
{
    public function summary()
    {
        return response()->json([
            'success' => true,
            'data' => [
                'tenants_pending' =>TenantProfile::where('status', 'pending')->count(),
                'tenants_approved' =>TenantProfile::where('status', 'approved')->count(),
                'bookings_today' =>Booking::whereDate('created_at', now()->toDateString())->count(),
                'bookings_pending' =>Booking::where('status', 'pending')->count(),
                'bookings_confirmed' =>Booking::where('status', 'confirmed')->count(),
                'bookings_cancelled' =>Booking::where('status', 'cancelled')->count(),
            ],
        ]);
    }
}
