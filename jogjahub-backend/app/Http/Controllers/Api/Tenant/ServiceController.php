<?php

namespace App\Http\Controllers\Api\Tenant;

use App\Http\Controllers\Controller;
use App\Http\Requests\Tenant\StoreServiceRequest;
use App\Http\Requests\Tenant\UpdateServiceRequest;
use App\Models\Service;
use App\Http\Resources\ServiceResource;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Storage;
use Illuminate\Validation\ValidationException;

class ServiceController extends Controller
{
    public function index(Request $request)
    {
        $services = Service::where('tenant_id', $request->user()->tenantProfile->id)
            ->with('subcategory')
            // orderBy created_at desc → layanan terbaru selalu tampil paling atas & urutan deterministik
            // (tanpa ORDER BY eksplisit, MySQL tidak menjamin urutan hasil query).
            // paginate(100) → scope MVP: mobile app tidak pernah minta halaman berikutnya, jadi semua
            // layanan tenant harus muat di halaman pertama supaya tidak "hilang" tak ter-fetch.
            ->orderBy('created_at', 'desc')
            ->paginate(100);

        return ServiceResource::collection($services)->additional(['success' => true]);
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

        $service->fill($request->safe()->except(['photos', 'remove_photos']));

        $photos = $service->photos ?? [];
        $requestedRemovals = $request->input('remove_photos', []);
        $existingPhotoPaths = array_column($photos, 'url');
        $removedPhotoPaths = array_values(array_intersect($requestedRemovals, $existingPhotoPaths));
        $photos = array_values(array_filter(
            $photos,
            fn (array $photo) => !in_array($photo['url'], $removedPhotoPaths, true)
        ));

        $newPhotoFiles = $request->file('photos', []);
        if (count($photos) + count($newPhotoFiles) > 10) {
            throw ValidationException::withMessages([
                'photos' => 'Maksimal 10 foto.',
            ]);
        }

        if ($newPhotoFiles) {
            foreach ($newPhotoFiles as $file) {
                $photos[] = ['url' => $file->store('services', 'public')];
            }
        }

        foreach ($photos as $index => &$photo) {
            $photo['is_primary'] = $index === 0;
            $photo['sort_order'] = $index;
        }
        unset($photo);

        $service->photos = $photos;
        $service->save();

        if ($removedPhotoPaths) {
            Storage::disk('public')->delete($removedPhotoPaths);
        }

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

    public function show(Request $request, Service $service)
    {
        // Tenant hanya boleh lihat service miliknya sendiri
        if ($service->tenant_id !== $request->user()->tenantProfile?->id) {
            return response()->json([
                'success' => false,
                'message' => 'Tidak diizinkan',
            ], 403);
        }

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
