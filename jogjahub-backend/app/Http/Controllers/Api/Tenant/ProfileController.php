<?php

namespace App\Http\Controllers\Api\Tenant;

use App\Http\Controllers\Controller;
use App\Models\TenantProfile;
use Illuminate\Http\Request;
use Illuminate\Validation\Rule;

class ProfileController extends Controller
{
    public function update(Request $request)
    {
        $request->validate([
            'business_name' => 'required|string|max:255',
            'description' => 'nullable|string',
            'address.street' => 'required|string',
            'address.city' => 'required|string',
            'address.province' => ['required', 'string', Rule::in(['DI Yogyakarta', 'Daerah Istimewa Yogyakarta'])],
            'address.postal_code' => 'nullable|string',
            'latitude' => 'required|numeric|between:-8.5, -7.5',
            'longitude' => 'required|numeric|between:110.0, 110.8',
            'whatsapp_number' => 'required|string|max:20',
            'category_ids' => 'required|array|min:1',
            'category_ids.*' => 'exists:categories,id',

            'ktp' => 'required|file|mimes:jpg,jpeg,png,pdf|max:2048',
            'nib' => 'required_without:portfolio|file|mimes:jpg,jpeg,png,pdf|max:2048',
            'portfolio' => 'required_without:nib|file|mimes:jpg,jpeg,png,pdf|max:5020',
        ]);

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
                'business_name' => $request->business_name,
                'description' => $request->description,
                'address' => $request->address,
                'latitude' => $request->latitude,
                'longitude' => $request->longitude,
                'whatsapp_number' => $request->whatsapp_number,
                'status' => 'pending',
                'rejection_reason' => null,
            ], $documentPaths)
        );

        $tenantProfile->categories()->sync($request->category_ids);

        return response()->json([
            'success' => true,
            'message' => 'Profil tenant berhasil disimpan, menunggu approval admin',
            'data' => $tenantProfile->load('categories'),
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
            'data' => $tenantProfile,
        ]);
    }
}
