<?php

namespace App\Http\Controllers\Api\Tenant;

use App\Http\Controllers\Controller;
use App\Http\Requests\Tenant\UpdateProfileRequest;
use App\Models\TenantProfile;
use Illuminate\Http\Request;

class ProfileController extends Controller
{
    public function update(UpdateProfileRequest $request)
    {
        $documentPaths = [];

        if ($request->hasFile('ktp')) {
            $documentPaths['ktp_url'] = $request->file('ktp')->store('tenant_documents', 'public');
        }

        if ($request->hasFile('nib')) {
            $documentPaths['nib_url'] = $request->file('nib')->store('tenant_documents', 'public');
        }

        if ($request->hasFile('portfolio')) {
            $documentPaths['portfolio_url'] = $request->file('portfolio')->store('tenant_documents', 'public');
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

        return response()->json([
            'success' => true,
            'message' => 'Profil tenant berhasil disimpan, menunggu approval admin',
            'data'    => $tenantProfile->load('categories'),
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
            'data'    => $tenantProfile,
        ]);
    }
}
