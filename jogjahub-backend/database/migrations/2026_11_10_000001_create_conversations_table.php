<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

/**
 * Tabel conversations — satu thread per pasangan customer-tenant.
 *
 * Desain:
 * - 1 customer hanya punya 1 conversation dengan 1 tenant (unique constraint).
 * - Kalau ingin chat lagi dengan tenant yang sama, lanjut di thread yang sudah ada.
 * - updated_at dipakai untuk mengurutkan inbox berdasarkan pesan terbaru.
 */
return new class extends Migration
{
    public function up(): void
    {
        Schema::create('conversations', function (Blueprint $table) {
            $table->id();

            // Referensi ke user dengan role customer
            $table->foreignId('customer_id')
                ->constrained('users')
                ->cascadeOnDelete();

            // Referensi ke user dengan role tenant
            $table->foreignId('tenant_id')
                ->constrained('users')
                ->cascadeOnDelete();

            $table->timestamps();

            // Satu customer hanya bisa punya 1 thread dengan 1 tenant
            $table->unique(['customer_id', 'tenant_id']);

            // Index untuk query inbox tenant (semua conversation yang masuk ke tenant X)
            $table->index('tenant_id');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('conversations');
    }
};
