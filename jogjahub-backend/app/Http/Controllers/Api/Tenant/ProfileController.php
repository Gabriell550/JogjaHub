<?php

namespace App\Http\Controllers\Api\Tenant;

use App\Http\Controllers\Controller;
use App\Http\Requests\Tenant\UpdateProfileRequest;
use App\Http\Requests\Tenant\ResubmitRequest;
use App\Enums\VendorStatus;
use App\Models\TenantProfile;
use App\Http\Resources\TenantProfileResource;
use App\Rules\GoogleMapsEmbed;
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
                // Ekstrak URL src dari <iframe> jika user paste HTML mentah,
                // atau simpan URL langsung jika sudah berupa URL.
                // Null-safe: kalau field tidak dikirim (tenant lama update hal lain),
                // biarkan nilai lama yang tersimpan di database.
                'maps_embed_url'  => $request->has('maps_embed_url')
                    ? (new GoogleMapsEmbed)->extractSrc($request->maps_embed_url)
                    : ($existing?->maps_embed_url),
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

    /**
     * Pengajuan ulang pendaftaran tenant yang ditolak (issue #59).
     *
     * Alur: tenant rejected hanya diminta mengunggah ulang dokumen tertentu.
     * Request TIDAK boleh mengosongkan/menimpa data profil yang sudah tersimpan —
     * method ini hanya:
     *   1. mengganti dokumen yang diunggah ulang (ktp/nib/portfolio),
     *   2. mengubah status rejected → pending,
     *   3. menghapus rejection_reason.
     */
    public function resubmit(ResubmitRequest $request)
    {
        $existing = $request->user()->tenantProfile;

        if (!$existing) {
            return response()->json([
                'success' => false,
                'message' => 'Profil tenant tidak ditemukan',
            ], 404);
        }

        if ($existing->status !== VendorStatus::REJECTED->value) {
            return response()->json([
                'success' => false,
                'message' => 'Hanya tenant berstatus rejected yang dapat mengajukan ulang pendaftaran.',
            ], 422);
        }

        $documentPaths = [];
        $oldFiles      = [];

        foreach (['ktp' => 'ktp_url', 'nib' => 'nib_url', 'portfolio' => 'portfolio_url'] as $input => $column) {
            if ($request->hasFile($input)) {
                $documentPaths[$column] = $request->file($input)->store('tenant_documents', 'local');

                if ($existing->{$column}) {
                    $oldFiles[] = $existing->{$column};
                }
            }
        }

        // Hanya dokumen yang diunggah ulang yang diganti — data profil lama dipertahankan.
        $existing->update(array_merge($documentPaths, [
            'status'           => VendorStatus::PENDING->value,
            'rejection_reason' => null,
        ]));

        // Hapus file lama SETELAH update tersimpan, supaya tidak hilang duluan kalau penyimpanan gagal.
        if ($oldFiles) {
            Storage::disk('local')->delete($oldFiles);
        }

        return response()->json([
            'success' => true,
            'message' => 'Pengajuan ulang terkirim, menunggu persetujuan admin',
            'data'    => new TenantProfileResource($existing->load('categories')),
        ]);
    }
}
