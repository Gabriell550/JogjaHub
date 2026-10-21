<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Tambah kolom maps_embed_url ke tenant_profiles.
     *
     * Menyimpan URL src dari embed Google Maps (diambil dari tag <iframe>).
     * Nullable supaya tenant lama (yang sudah ada sebelum fitur ini) tetap
     * bisa update profil tanpa harus langsung isi maps (Skenario B).
     */
    public function up(): void
    {
        Schema::table('tenant_profiles', function (Blueprint $table) {
            // TEXT karena URL embed Google Maps bisa sangat panjang (> 255 karakter)
            $table->text('maps_embed_url')->nullable()->after('longitude');
        });
    }

    public function down(): void
    {
        Schema::table('tenant_profiles', function (Blueprint $table) {
            $table->dropColumn('maps_embed_url');
        });
    }
};
