<?php

namespace App\Http\Controllers\Api\Admin;

use App\Http\Controllers\Controller;
use App\Models\TenantProfile;
use Illuminate\Http\Request;


class TenantController extends Controller
{
    public function pending()
    {
        $pendingTenants = TenantProfile::with (['user', 'categories'])
            ->where('status', 'pending')
            ->paginate(15);

        return response()->json([
            'success' => true,
            'data' => $pendingTenants,
        ]);
    }

    public function approve(TenantProfile $tenant)
    {
        $tenant->update([
            'status' => 'approved',
            'rejection_reason' => null,
            ]);

        return response()->json([
            'success' => true,
            'message' => 'Tenant berhasil disetujui',
            'data' => $tenant,
        ]);
    }

    public function reject(TenantProfile $tenant, Request $request)
    {

        $request->validate([
            'rejection_reason' => 'required|string|max:500',
        ]);

        $tenant->update([
            'status' => 'rejected',
            'rejection_reason' => $request->input('rejection_reason')
        ]);

        return response()->json([
            'success' => true,
            'message' => 'Tenant ditolak',
            'data' => $tenant,
        ]);
    }
}
