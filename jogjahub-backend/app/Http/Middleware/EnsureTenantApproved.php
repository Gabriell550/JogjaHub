<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;

class EnsureTenantApproved
{
    /**
     * Pastikan tenant sudah disetujui (status = approved) sebelum boleh
     * membuat/mengelola service, slot waktu, atau booking.
     */
    public function handle(Request $request, Closure $next): Response
    {
        $profile = $request->user()?->tenantProfile;

        if (!$profile || $profile->status !== 'approved') {
            return response()->json([
                'success' => false,
                'message' => 'Akun tenant Anda belum disetujui admin.',
            ], 403);
        }

        return $next($request);
    }
}

