<?php

namespace App\Http\Controllers\Api\Customer;

use App\Http\Controllers\Controller;
use App\Http\Resources\UserResource;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Storage;
use Illuminate\Validation\Rules\File;

class ProfileController extends Controller
{
    /**
     * Tampilkan profil customer yang sedang login.
     */
    public function show(Request $request)
    {
        return response()->json([
            'success' => true,
            'data'    => new UserResource($request->user()),
        ]);
    }

    /**
     * Update profil customer: name, phone, dan/atau avatar.
     *
     * - Semua field opsional (partial update).
     * - Avatar disimpan di disk 'public' (bisa diakses via URL /storage/avatars/...).
     * - File lama dihapus otomatis setelah file baru berhasil disimpan.
     */
    public function update(Request $request)
    {
        $validated = $request->validate([
            'name'   => 'sometimes|string|max:255',
            'phone'  => 'sometimes|string|max:20',
            // Avatar: opsional, harus gambar, max 2MB
            'avatar' => ['sometimes', 'nullable', File::image()->max(2 * 1024)],
        ]);

        $user    = $request->user();
        $updates = [];

        if (isset($validated['name'])) {
            $updates['name'] = $validated['name'];
        }

        if (isset($validated['phone'])) {
            $updates['phone'] = $validated['phone'];
        }

        // Proses upload avatar jika ada file baru
        if ($request->hasFile('avatar')) {
            // Simpan file baru di folder avatars/ pada disk public
            $newPath = $request->file('avatar')->store('avatars', 'public');

            // Hapus avatar lama supaya tidak menumpuk di storage
            if ($user->avatar_url) {
                Storage::disk('public')->delete($user->avatar_url);
            }

            $updates['avatar_url'] = $newPath;
        }

        // Hapus avatar (kirim avatar=null untuk reset)
        if ($request->has('avatar') && is_null($request->avatar) && !$request->hasFile('avatar')) {
            if ($user->avatar_url) {
                Storage::disk('public')->delete($user->avatar_url);
            }
            $updates['avatar_url'] = null;
        }

        $user->update($updates);

        return response()->json([
            'success' => true,
            'message' => 'Profil berhasil diperbarui',
            'data'    => new UserResource($user->fresh()),
        ]);
    }
}

