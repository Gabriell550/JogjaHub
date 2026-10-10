<?php

namespace App\Http\Controllers\Api\Tenant;

use App\Http\Controllers\Controller;
use App\Http\Requests\Tenant\UpdateProfileRequest;
use App\Models\TenantProfile;
use App\Http\Resources\TenantProfileResource;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Storage;

class ProfileController extends Controller
{
    public function update(UpdateProfileRequest $request)
    {
        $existing      = $request->user()->tenantProfile;
        $documentPaths = [];
        $oldFiles      = [];

        // Dokumen pribadi (KTP/NIB/portfolio) disimpan di disk 'local' (storage/app/private),
        // BUKAN 'public' — supaya tidak bisa diakses langsung lewat URL /storage/...
        // Admin melihatnya lewat endpoint khusus: GET /admin/tenants/{uuid}/documents/{type}
        foreach (['ktp' => 'ktp_url', 'nib' => 'nib_url', 'portfolio' => 'portfolio_url'] as $input => $column) {
            if ($request->hasFile($input)) {
                $documentPaths[$column] = $request->file($input)->store('tenant_documents', 'local');

                if ($existing && $existing->{$column}) {
                    $oldFiles[] = $existing->{$column};
                }
            }
        }

        $tenantProfile = TenantProfile::updateOrCreate(
            ['user_id' => $request->user()->id],
            array_merge([
                'business_name'   => $request->business_name,
                'description'     => $request->description,
                'address'         => $request->address,
                'latitude'        => $request->latitude,
                'longitude'       => $request->longitude,
                'whatsapp_number' => $request->whatsapp_number,
                'status'          => 'pending',
                'rejection_reason'=> null,
            ], $documentPaths)
        );

        $tenantProfile->categories()->sync($request->category_ids);

        // Hapus file lama SETELAH data tersimpan, supaya tidak menumpuk
        // (dan tidak hilang duluan kalau penyimpanan gagal)
        if ($oldFiles) {
            Storage::disk('local')->delete($oldFiles);
        }

        return response()->json([
            'success' => true,
            'message' => 'Profil tenant berhasil disimpan, menunggu approval admin',
            'data'    => new TenantProfileResource($tenantProfile->load('categories')),
        ]);
    }

    public function show(Request $request)
    {
        $tenantProfile = $request->user()->tenantProfile()->with('categories')->first();

        if (!$tenantProfile) {
            return response()->json([
                'success' => false,
                'message' => 'Profil tenant tidak ditemukan',
            ], 404);
        }

        return response()->json([
            'success' => true,
            'data'    => new TenantProfileResource($tenantProfile),
        ]);
    }
}
