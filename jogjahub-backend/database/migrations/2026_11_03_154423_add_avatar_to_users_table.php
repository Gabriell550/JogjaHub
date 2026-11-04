<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

/**
 * Tambah kolom avatar_url ke tabel users.
 *
 * - Untuk customer: foto profil opsional sebagai identitas pribadi.
 * - Disimpan di disk 'public' (storage/app/public/avatars/) sehingga
 *   bisa diakses langsung lewat URL /storage/avatars/...
 * - Nullable karena tidak wajib — customer bisa daftar tanpa foto.
 */
return new class extends Migration
{
    public function up(): void
    {
        Schema::table('users', function (Blueprint $table) {
            // Simpan path relatif dari storage, bukan URL penuh
            // (URL penuh digenerate di resource dengan asset('storage/' . $path))
            $table->string('avatar_url')->nullable()->after('phone');
        });
    }

    public function down(): void
    {
        Schema::table('users', function (Blueprint $table) {
            $table->dropColumn('avatar_url');
        });
    }
};
