<?php

namespace App\Http\Controllers\Api\Tenant;

use App\Http\Controllers\Controller;
use App\Http\Requests\Auth\RegisterTenantRequest;
use App\Models\Category;
use App\Models\TenantProfile;
use App\Models\User;
use App\Http\Resources\UserResource;
use App\Http\Resources\TenantProfileResource;

class AuthController extends Controller
{
    protected function resolveCategoryIds(array $rawCategories): array
    {
        if (empty($rawCategories)) {
            return [];
        }

        $aliases = [
            'salon_mua'        => 'Beauty & Style',
            'butik_wisuda'     => 'Beauty & Style',
            'penginapan'       => 'Penginapan',
            'selempang_plakat' => 'Gifting',
            'akrilik'          => 'Gifting',
            'florist'          => 'Gifting',
            'beauty_and_style' => 'Beauty & Style',
            'gifting'          => 'Gifting',
            'hotel'            => 'Penginapan',
        ];

        // Fetch semua kategori SEKALI, bukan per-item
        $allCategories = Category::all();

        $categoryIds = [];

        foreach ($rawCategories as $value) {
            if (is_numeric($value)) {
                $categoryIds[] = (int) $value;
                continue;
            }

            $raw = strtolower(trim((string) $value));
            $raw = preg_replace('/[^a-z0-9]+/', '_', $raw);
            $raw = trim((string) $raw, '_');

            $lookup     = $aliases[$raw] ?? $raw;
            $normalized = strtolower(trim((string) $lookup));
            $normalized = preg_replace('/[^a-z0-9]+/', '_', $normalized);
            $normalized = trim((string) $normalized, '_');

            if ($normalized === '') {
                continue;
            }

            // Filter in-memory, tidak hit DB lagi
            $matched = $allCategories->first(function ($cat) use ($normalized) {
                $name           = strtolower(trim($cat->name));
                $nameNormalized = preg_replace('/[^a-z0-9]+/', '_', $name);
                $nameNormalized = trim($nameNormalized, '_');

                return $nameNormalized === $normalized
                    || str_replace('_', ' ', $nameNormalized) === str_replace('_', ' ', $normalized);
            });

            if ($matched) {
                $categoryIds[] = (int) $matched->id;
            }
        }

        return array_values(array_unique(array_filter($categoryIds, fn($id) => $id > 0)));
    }

    public function register(RegisterTenantRequest $request)
    {
        $user = User::create([
            'name'     => $request->name,
            'email'    => $request->email,
            'password' => bcrypt($request->password),
            'role'     => 'tenant',
            'phone'    => $request->phone,
        ]);

        $address = $request->filled('address')
            ? ['street' => $request->address]
            : ['street' => ''];

        $tenantProfile = TenantProfile::create([
            'user_id'         => $user->id,
            'business_name'   => $request->name,
            'address'         => $address,
            'whatsapp_number' => $request->phone ?? '',
            'status'          => 'pending',
        ]);

        $categoryIds = $this->resolveCategoryIds((array) $request->input('categories', []));

        if (!empty($categoryIds)) {
            $tenantProfile->categories()->sync($categoryIds);
        }

        return response()->json([
            'success' => true,
            'message' => 'Registrasi tenant berhasil. Menunggu approval admin.',
            'data'    => [
                'user'           => new UserResource($user),
                'tenant_profile' => new TenantProfileResource($tenantProfile->load('categories')),
            ],
        ], 201);
    }
}
