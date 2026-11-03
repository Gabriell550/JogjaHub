<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

/**
 * Tambah kolom price_type ke tabel services.
 *
 * - per_session : harga berlaku untuk 1 sesi/slot (salon, barbershop, kursus, dll)
 * - per_night   : harga berlaku per malam (hotel) → total = price × jumlah malam
 *
 * Default per_session agar semua service lama tidak rusak.
 */
return new class extends Migration
{
    public function up(): void
    {
        Schema::table('services', function (Blueprint $table) {
            // Tambah setelah kolom price supaya urutan kolom rapi
            $table->enum('price_type', ['per_session', 'per_night'])
                  ->default('per_session')
                  ->after('price');
        });
    }

    public function down(): void
    {
        Schema::table('services', function (Blueprint $table) {
            $table->dropColumn('price_type');
        });
    }
};
