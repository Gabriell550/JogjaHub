<?php

namespace App\Http\Controllers\Api\Admin;

use App\Http\Controllers\Controller;
use App\Http\Requests\Admin\RejectTenantRequest;
use App\Http\Resources\TenantProfileResource;
use App\Models\TenantProfile;

class TenantController extends Controller
{
    public function pending()
    {
        $pendingTenants = TenantProfile::with(['user', 'categories'])
            ->where('status', 'pending')
            ->paginate(15);

        return response()->json([
            'success' => true,
            'data'    => TenantProfileResource::collection($pendingTenants),
        ]);
    }

    public function approve(TenantProfile $tenant)
    {
        $tenant->update([
            'status'           => 'approved',
            'rejection_reason' => null,
        ]);

        return response()->json([
            'success' => true,
            'message' => 'Tenant berhasil disetujui',
            'data'    => new TenantProfileResource($tenant),
        ]);
    }

    public function reject(RejectTenantRequest $request, TenantProfile $tenant)
    {
        $tenant->update([
            'status'           => 'rejected',
            'rejection_reason' => $request->rejection_reason,
        ]);

        return response()->json([
            'success' => true,
            'message' => 'Tenant ditolak',
            'data'    => new TenantProfileResource($tenant),
        ]);
    }
}
