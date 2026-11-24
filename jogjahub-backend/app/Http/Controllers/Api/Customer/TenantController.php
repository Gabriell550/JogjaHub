<?php

namespace App\Http\Controllers\Api\Customer;

use App\Http\Controllers\Controller;
use App\Models\TenantProfile;
use App\Http\Resources\TenantProfileResource;
use Illuminate\Http\Request;


class TenantController extends Controller
{
    public function index(Request $request)
    {
        $filters = $request->validate([
            'q' => ['nullable', 'string', 'max:120'],
            'category_id' => ['nullable', 'integer', 'min:1'],
        ]);
        $keyword = mb_strtolower(preg_replace('/\s+/u', ' ', trim($filters['q'] ?? '')));
        $categoryId = $filters['category_id'] ?? null;

        $tenants = TenantProfile::where('status', 'approved')
            ->with('categories:id,name')
            ->when($categoryId, fn ($query) => $query->whereHas(
                'services',
                fn ($services) => $services->where('is_active', true)
                    ->whereHas('subcategory', fn ($subcategory) => $subcategory->where('category_id', $categoryId))
            ));

        if ($keyword !== '') {
            $tenants->where(function ($query) use ($keyword, $categoryId) {
                $query->whereRaw('LOWER(business_name) LIKE ?', ['%' . str_replace(' ', '%', $keyword) . '%'])
                    ->orWhereHas('services', function ($services) use ($keyword, $categoryId) {
                        $services->where('is_active', true)
                            ->when($categoryId, fn ($query) => $query->whereHas(
                                'subcategory', fn ($subcategory) => $subcategory->where('category_id', $categoryId)
                            ))
                            ->where(fn ($query) => $query->whereRaw('LOWER(name) LIKE ?', ["%{$keyword}%"])
                                ->orWhereRaw('LOWER(description) LIKE ?', ["%{$keyword}%"]));
                    });
            })->orderByRaw('CASE WHEN LOWER(TRIM(business_name)) = ? THEN 0 ELSE 1 END', [$keyword]);
        }

        return TenantProfileResource::collection($tenants->orderBy('id')->paginate(15));
    }

    public function map()
    {
        $tenant = TenantProfile::where('status', 'approved')
            ->whereNotNull('latitude')
            ->whereNotNull('longitude')
            ->select('id', 'uuid', 'business_name', 'latitude', 'longitude', 'whatsapp_number')
            ->with('categories:id,name')
            ->get();

        return response()->json([
            'status' => "success",
            'data' => $tenant
        ]);
    }

    public function show(TenantProfile $tenant)
    {
        if ($tenant->status !== 'approved') {
            return response()->json([
                'status' => "success",
                'message' => 'Tenant tidak ditemukan atau belum disetujui'
            ], 404);
        }

        $tenant->load(['categories', 'services' => fn($q) => $q->where('is_active', true)->with('subcategory')]);

        return response()->json([
            'status' => "success",
            'data' => new TenantProfileResource($tenant)
        ]);
    }


}
