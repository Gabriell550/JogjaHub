<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

/**
 * Tambah kolom logo_url ke tabel tenant_profiles.
 *
 * - Untuk tenant: foto/logo bisnis yang WAJIB diunggah saat submit profil.
 * - Disimpan di disk 'public' (storage/app/public/tenant_logos/) sehingga
 *   bisa ditampilkan langsung di halaman publik tenant.
 * - Nullable di DB (untuk data tenant lama yang belum upload),
 *   tapi validasi di UpdateProfileRequest mewajibkan jika belum ada.
 */
return new class extends Migration
{
    public function up(): void
    {
        Schema::table('tenant_profiles', function (Blueprint $table) {
            $table->string('logo_url')->nullable()->after('portfolio_url');
        });
    }

    public function down(): void
    {
        Schema::table('tenant_profiles', function (Blueprint $table) {
            $table->dropColumn('logo_url');
        });
    }
};
