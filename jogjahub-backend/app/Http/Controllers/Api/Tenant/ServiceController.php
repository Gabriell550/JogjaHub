<?php

namespace App\Http\Controllers\Api\Tenant;

use App\Http\Controllers\Controller;
use App\Models\Service;
use Illuminate\Http\Request;

class ServiceController extends Controller
{
    public function index(Request $request)
    {
        $services = Service::where('tenant_id', $request->user()->tenantProfile->id)
            ->with('subcategory')
            ->paginate(15);

        return response()->json([
            'success' => true,
            'data' => $services,
        ]);
    }

    public function store(Request $request)
    {
        $request->validate([
            'subcategory_id' => 'required|exists:subcategories,id',
            'name' => 'required|string|max:255',
            'description' => 'nullable|string',
            'price' => 'required|numeric|min:0',
            'photos' => 'nullable|array',
            'photos.*' => 'image|mimes:jpeg,png,jpg,gif,svg|max:2048',
        ]);

        $photoData = [];
        if ($request->hasFile('photos')) {
            foreach ($request->file('photos') as $index => $file) {
                $path = $file->store('services', 'public');
                $photoData[] = [
                    'url' => $path,
                    'is_primary' => $index === 0,
                    'sort_order' => $index,
                ];
            }
        }

        $service = Service::create([
            'tenant_id' => $request->user()->tenantProfile->id,
            'subcategory_id' => $request->subcategory_id,
            'name' => $request->name,
            'description' => $request->description,
            'price' => $request->price,
            'photos' => $photoData,
        ]);

        return response()->json([
            'success' => true,
            'message' => 'Service berhasil ditambahkan',
            'data' => $service,
        ]);
    }

    public function update(Request $request, Service $service)
    {
        // tenant cuma bisa edit service miliknya sendiri
        if ($service->tenant_id !== $request->user()->tenantProfile->id) {
            return response()->json([
                'success' => false,
                'message' => 'Tidak diizinkan',
            ], 403);
        }

        $request->validate([
            'subcategory_id' => 'sometimes|exists:subcategories,id',
            'name' => 'sometimes|string|max:255',
            'description' => 'nullable|string',
            'price' => 'sometimes|numeric|min:0',
        ]);

        $service->update($request->only(['subcategory_id', 'name', 'description', 'price']));

        return response()->json([
            'success' => true,
            'message' => 'Service berhasil diperbarui',
            'data' => $service,
        ]);
    }

    public function destroy(Request $request, Service $service)
    {
        // tenant cuma bisa hapus service miliknya sendiri
        if ($service->tenant_id !== $request->user()->tenantProfile->id) {
            return response()->json([
                'success' => false,
                'message' => 'Tidak diizinkan',
            ], 403);
        }

        $service->delete();

        return response()->json([
            'success' => true,
            'message' => 'Service berhasil dihapus',
        ]);
    }
}
