<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\TenantProfile;
use App\Models\User;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Hash;
use Illuminate\Validation\ValidationException;

class AuthController extends Controller
{
    public function login(Request $request)
    {
        $request->validate([
            'email' => 'required|email',
            'password' => 'required|string',
            'role' => 'required|string|in:customer,tenant,admin',
        ]);

        $user = User::where('email', $request->email)->first();

        if (!$user || !Hash::check($request->password, $user->password)) {
            throw ValidationException::withMessages([
                'email' => ['Email atau password yang Anda masukkan salah.'],
            ]);
        }

        // Validasi role: user harus login dengan role yang sesuai
     $expectedRole = $request->role;

if ($user->role !== $expectedRole) {
    $roleLabel = match ($expectedRole) {
        'admin' => 'Admin',
        'tenant' => 'Vendor',
        'customer' => 'Customer',
    };

    throw ValidationException::withMessages([
        'email' => [
            "Akun ini tidak bisa login sebagai {$roleLabel}. Silakan gunakan email/password yang sesuai."
        ],
    ]);
}

        $token = $user->createToken('auth_token')->plainTextToken;

        $response = [
            'success' => true,
            'message' => 'Login berhasil',
            'data' => [
                'user' => $user,
                'token' => $token,
            ],
        ];

        // Jika user adalah tenant, sertakan status tenant profile
        if ($user->role === 'tenant') {
            $tenantProfile = TenantProfile::where('user_id', $user->id)->first();
            if ($tenantProfile) {
                $response['data']['tenant_status'] = $tenantProfile->status;
                $response['data']['business_name'] = $tenantProfile->business_name;
            } else {
                // Fallback jika tenant belum punya profile (seharusnya tidak terjadi)
                $response['data']['tenant_status'] = 'pending';
                $response['data']['business_name'] = $user->name;
            }
        }

        return response()->json($response);
    }

    public function logout(Request $request)
    {
        $request->user()->currentAccessToken()->delete();

        return response()->json([
            'success' => true,
            'message' => 'Logout berhasil',
        ]);
    }
}
