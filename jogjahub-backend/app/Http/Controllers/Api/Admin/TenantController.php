<?php

namespace App\Http\Controllers\Api\Admin;

use App\Http\Controllers\Controller;
use App\Http\Requests\Admin\RejectTenantRequest;
use App\Http\Resources\TenantProfileResource;
use App\Models\TenantProfile;
use Illuminate\Support\Facades\Storage;

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

    /**
     * Admin melihat dokumen verifikasi tenant (KTP/NIB/portfolio).
     * File disimpan di disk private, jadi satu-satunya jalan aksesnya lewat endpoint ini
     * (sudah dilindungi middleware auth:sanctum + role:admin di routes/api.php).
     */
    public function document(TenantProfile $tenant, string $type)
    {
        $column = match ($type) {
            'ktp'       => 'ktp_url',
            'nib'       => 'nib_url',
            'portfolio' => 'portfolio_url',
            default     => null,
        };

        $path = $column ? $tenant->{$column} : null;

        if (!$path || !Storage::disk('local')->exists($path)) {
            return response()->json([
                'success' => false,
                'message' => 'Dokumen tidak ditemukan',
            ], 404);
        }

        return Storage::disk('local')->response($path);
    }
}
