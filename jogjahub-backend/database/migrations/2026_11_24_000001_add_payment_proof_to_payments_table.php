<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

/**
 * Tambah kolom payment_proof_url ke tabel payments.
 *
 * Digunakan untuk menyimpan path foto/screenshot bukti transfer manual
 * yang diunggah customer setelah melakukan pembayaran ke rekening tenant.
 *
 * Kolom xendit_* (xendit_invoice_id, xendit_external_id, payment_url, payment_method,
 * payment_channel, xendit_raw_response) dibiarkan ada untuk:
 * - Backward compatibility dengan data lama
 * - Kemudahan reaktivasi Xendit di masa depan (Opsi A)
 */
return new class extends Migration
{
    public function up(): void
    {
        Schema::table('payments', function (Blueprint $table) {
            // Path file bukti transfer yang diupload customer ke disk 'public'
            // Format: 'payment_proofs/xxx.jpg'
            // Null = customer belum upload bukti
            $table->string('payment_proof_url')->nullable()->after('payment_url');
        });
    }

    public function down(): void
    {
        Schema::table('payments', function (Blueprint $table) {
            $table->dropColumn('payment_proof_url');
        });
    }
};
