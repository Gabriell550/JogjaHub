<?php

namespace App\Http\Controllers\Api\Admin;

use App\Http\Controllers\Controller;
use App\Models\TenantProfile;


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
        $tenant->update(['status' => 'approved']);

        return response()->json([
            'success' => true,
            'message' => 'Tenant berhasil disetujui',
            'data' => $tenant,
        ]);
    }

    public function reject(TenantProfile $tenant)
    {
        $tenant->update(['status' => 'rejected']);

        return response()->json([
            'success' => true,
            'message' => 'Tenant berhasil ditolak',
            'data' => $tenant,
        ]);
    }
}
