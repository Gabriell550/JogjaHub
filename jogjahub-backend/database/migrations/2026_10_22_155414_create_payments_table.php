<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Tabel payments menyimpan detail transaksi pembayaran via Xendit.
     * Satu booking memiliki tepat satu payment record.
     *
     * Alur: booking dibuat → payment dibuat (pending) → Xendit webhook
     *       → payment diupdate (paid/expired/failed) → booking diupdate (confirmed/cancelled)
     */
    public function up(): void
    {
        Schema::create('payments', function (Blueprint $table) {
            $table->id();

            $table->foreignId('booking_id')
                  ->unique()                   // 1 booking = 1 payment
                  ->constrained()
                  ->cascadeOnDelete();

            // Data dari Xendit
            $table->string('xendit_invoice_id')->nullable()->index();  // ID invoice di sistem Xendit
            $table->string('xendit_external_id')->nullable()->index(); // ID unik buatan kita yang dikirim ke Xendit

            // Detail transaksi
            $table->unsignedBigInteger('amount');                      // nominal dalam Rupiah (tanpa desimal)
            $table->string('currency', 3)->default('IDR');
            $table->string('status')->default('pending');              // pending | paid | expired | failed

            // Diisi setelah user memilih metode dan menyelesaikan pembayaran
            $table->string('payment_method')->nullable();              // VIRTUAL_ACCOUNT | QRIS | EWALLET
            $table->string('payment_channel')->nullable();             // BCA | BNI | GOPAY | OVO | dsb

            // URL halaman pembayaran Xendit yang dikirim ke user
            $table->text('payment_url')->nullable();

            // Timestamps penting
            $table->timestamp('paid_at')->nullable();                  // kapan pembayaran dikonfirmasi Xendit
            $table->timestamp('expires_at')->nullable();               // batas waktu bayar (default: 1 jam dari booking)

            // Raw response dari Xendit untuk keperluan debugging / dispute
            $table->jsonb('xendit_raw_response')->nullable();

            $table->timestamps();

            $table->index(['status', 'expires_at']); // untuk query job release expired
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('payments');
    }
};
