<?php

namespace App\Http\Controllers\Api\Tenant;

use App\Http\Controllers\Controller;
use App\Http\Requests\Tenant\StoreServiceRequest;
use App\Http\Requests\Tenant\UpdateServiceRequest;
use App\Models\Service;
use App\Http\Resources\ServiceResource;
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
            'data'    => ServiceResource::collection($services),
        ]);
    }

    public function store(StoreServiceRequest $request)
    {
        $photoData = [];
        if ($request->hasFile('photos')) {
            foreach ($request->file('photos') as $index => $file) {
                $path        = $file->store('services', 'public');
                $photoData[] = [
                    'url'        => $path,
                    'is_primary' => $index === 0,
                    'sort_order' => $index,
                ];
            }
        }

        $service = Service::create([
            'tenant_id'      => $request->user()->tenantProfile->id,
            'subcategory_id' => $request->subcategory_id,
            'name'           => $request->name,
            'description'    => $request->description,
            'price'          => $request->price,
            'photos'         => $photoData,
        ]);

        return response()->json([
            'success' => true,
            'message' => 'Service berhasil ditambahkan',
            'data'    => new ServiceResource($service),
        ]);
    }

    public function update(UpdateServiceRequest $request, Service $service)
    {
        if ($service->tenant_id !== $request->user()->tenantProfile->id) {
            return response()->json([
                'success' => false,
                'message' => 'Tidak diizinkan',
            ], 403);
        }

        $service->update($request->validated());

        return response()->json([
            'success' => true,
            'message' => 'Service berhasil diperbarui',
            'data'    => new ServiceResource($service),
        ]);
    }

    public function destroy(Request $request, Service $service)
    {
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

    public function show(Service $service)
    {
        $service->load(['subcategory', 'tenant']);
        $service->loadCount(['bookings as bookings_count' => fn($q) => $q->where('status', 'confirmed')]);
        $service->reviews_avg_rating = round(
            $service->bookings()->whereHas('review')->with('review')->get()->avg(fn($b) => $b->review->rating) ?? 0,
            1
        );
        $service->reviews_count = $service->bookings()->whereHas('review')->count();

        return response()->json([
            'success' => true,
            'data'    => new ServiceResource($service),
        ]);
    }
}
