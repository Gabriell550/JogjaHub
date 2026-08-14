<?php

namespace App\Http\Controllers\Api\Tenant;

use App\Http\Controllers\Controller;
use App\Models\TenantProfile;
use Illuminate\Http\Request;

class ProfileController extends Controller
{
    public function update(Request $request)
    {
        $request->validate([
            'business_name' => 'required|string|max:255',
            'description' => 'nullable|string',
            'address.street' => 'required|string',
            'address.city' => 'required|string',
            'address.province' => 'required|string',
            'address.postal_code' => 'nullable|string',
            'latitude' => 'required|numeric',
            'longitude' => 'required|numeric',
            'whatsapp_number' => 'required|string|max:20',
            'category_ids' => 'required|array|min:1',
            'category_ids.*' => 'exists:categories,id',
        ]);

        $tenantProfile = TenantProfile::updateOrCreate(
            ['user_id' => $request->user()->id],
            [
                'business_name' => $request->business_name,
                'description' => $request->description,
                'address' => $request->address,
                'latitude' => $request->latitude,
                'longitude' => $request->longitude,
                'whatsapp_number' => $request->whatsapp_number,
                'status' => 'pending',
            ]
        );

        $tenantProfile->categories()->sync($request->category_ids);

        return response()->json([
            'success' => true,
            'message' => 'Profil tenant berhasil disimpan, menunggu approval admin',
            'data' => $tenantProfile->load('categories'),
        ]);
    }
}
