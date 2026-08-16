<?php

namespace App\Http\Controllers\Api\Tenant;

use App\Http\Controllers\Controller;
use App\Models\Category;
use App\Models\TenantProfile;
use App\Models\User;
use Illuminate\Http\Request;

class AuthController extends Controller
{
    protected function resolveCategoryIds(array $rawCategories): array
    {
        if (empty($rawCategories)) {
            return [];
        }

        $aliases = [
            'salon_mua' => 'Beauty & Style',
            'butik_wisuda' => 'Beauty & Style',
            'penginapan' => 'Penginapan',
            'selempang_plakat' => 'Gifting',
            'akrilik' => 'Gifting',
            'florist' => 'Gifting',
            'beauty_and_style' => 'Beauty & Style',
            'gifting' => 'Gifting',
            'hotel' => 'Penginapan',
        ];

        $categoryIds = [];

        foreach ($rawCategories as $value) {
            if (is_numeric($value)) {
                $categoryIds[] = (int) $value;
                continue;
            }

            $raw = strtolower(trim((string) $value));
            $raw = preg_replace('/[^a-z0-9]+/', '_', $raw);
            $raw = trim((string) $raw, '_');

            $lookup = $aliases[$raw] ?? $raw;
            $normalized = strtolower(trim((string) $lookup));
            $normalized = preg_replace('/[^a-z0-9]+/', '_', $normalized);
            $normalized = trim((string) $normalized, '_');

            if ($normalized === '') {
                continue;
            }

            $matchedCategory = Category::query()
                ->whereRaw('LOWER(REPLACE(name, " ", "_")) = ?', [$normalized])
                ->orWhereRaw('LOWER(REPLACE(name, "_", "_")) = ?', [$normalized])
                ->orWhereRaw('LOWER(name) = ?', [str_replace('_', ' ', $normalized)])
                ->first();

            if ($matchedCategory) {
                $categoryIds[] = (int) $matchedCategory->id;
            }
        }

        return array_values(array_unique(array_filter($categoryIds, fn ($id) => $id > 0)));
    }

    public function register(Request $request)
    {
        $request->validate([
            'name' => 'required|string|max:255',
            'email' => 'required|email|unique:users,email',
            'password' => 'required|string|min:8|confirmed',
            'address' => 'nullable|string|max:1000',
            'phone' => 'nullable|string|max:20',
            'categories' => 'nullable|array|min:1',
            'categories.*' => 'nullable|string',
        ]);

        $user = User::create([
            'name' => $request->name,
            'email' => $request->email,
            'password' => bcrypt($request->password),
            'role' => 'tenant',
        ]);

        $address = $request->filled('address')
            ? ['street' => $request->address]
            : ['street' => ''];

        $tenantProfile = TenantProfile::create([
            'user_id' => $user->id,
            'business_name' => $request->name,
            'address' => $address,
            'whatsapp_number' => $request->phone ?? '',
            'status' => 'pending',
        ]);

        $categoryIds = $this->resolveCategoryIds((array) $request->input('categories', []));

        if (!empty($categoryIds)) {
            $tenantProfile->categories()->sync($categoryIds);
        }

        return response()->json([
            'success' => true,
            'message' => 'Registrasi vendor berhasil. Menunggu approval admin.',
            'data' => [
                'user' => $user,
                'tenant_profile' => $tenantProfile->load('categories'),
            ],
        ], 201);
    }
}
