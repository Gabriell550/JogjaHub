<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

/**
 * Tabel pivot booking_slots — menghubungkan satu booking ke banyak time_slot.
 *
 * Digunakan untuk:
 *  - Multi-slot booking (hotel): satu booking mencakup banyak malam/slot sekaligus.
 *  - Single-slot booking (salon, barbershop, dll): tetap satu record di pivot ini
 *    selain kolom bookings.slot_id yang dipertahankan untuk backward compatibility.
 */
return new class extends Migration
{
    public function up(): void
    {
        Schema::create('booking_slots', function (Blueprint $table) {
            $table->id();

            // Foreign key ke tabel bookings — hapus pivot jika booking dihapus
            $table->foreignId('booking_id')
                  ->constrained('bookings')
                  ->cascadeOnDelete();

            // Foreign key ke tabel time_slots — hapus pivot jika slot dihapus
            $table->foreignId('time_slot_id')
                  ->constrained('time_slots')
                  ->cascadeOnDelete();

            $table->timestamps();

            // Cegah duplikat: satu booking tidak boleh mengunci slot yang sama dua kali
            $table->unique(['booking_id', 'time_slot_id']);

            // Index tambahan untuk query "slot ini dimiliki booking mana saja"
            $table->index('time_slot_id');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('booking_slots');
    }
};
