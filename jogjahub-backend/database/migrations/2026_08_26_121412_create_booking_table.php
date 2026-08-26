<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('bookings', function (Blueprint $table) {
            $table->id();
            $table->foreignId('customer_id')->constrained('users')->cascadeOnDelete();
            $table->foreignId('service_id')->constrained()->cascadeOnDelete();
            $table->foreignId('slot_id')->nullable()->constrained('time_slots')->nullOnDelete();
            $table->string('status')->default('pending'); // pending, confirmed, cancelled
            $table->string('payment_method')->nullable(); // transfer, cod
            $table->string('payment_proof_url')->nullable();
            $table->jsonb('details')->nullable(); // field dinamis per kategori (ukuran baju, check-in/out, dsb)
            $table->timestamps();
            $table->softDeletes();

            $table->index(['customer_id', 'status']);
            $table->index(['service_id', 'status']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('bookings');
    }
};
