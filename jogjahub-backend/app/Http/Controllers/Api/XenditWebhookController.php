<?php

namespace App\Http\Controllers\Api;

use App\Enums\BookingStatus;
use App\Models\Payment;
use App\Services\XenditService;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Log;

/**
 * Menerima notifikasi pembayaran dari Xendit (webhook / callback).
 *
 * Endpoint ini PUBLIC (tidak perlu login) karena yang memanggil adalah Xendit,
 * bukan user. Keamanannya dijaga lewat verifikasi x-callback-token header.
 *
 * Referensi: https://developers.xendit.co/api-reference/#invoice-callback
 */
class XenditWebhookController extends \App\Http\Controllers\Controller
{
    public function __construct(
        private readonly XenditService $xendit
    ) {}

    public function handle(Request $request): \Illuminate\Http\JsonResponse
    {
        // ── 1. Verifikasi token ──────────────────────────────────────────────
        if (!$this->xendit->verifyWebhookToken($request)) {
            Log::warning('Xendit webhook: token tidak valid.', [
                'ip'    => $request->ip(),
                'token' => $request->header('x-callback-token'),
            ]);

            // Kembalikan 200 agar Xendit tidak retry terus-menerus,
            // tapi tidak lakukan aksi apapun
            return response()->json(['message' => 'Unauthorized'], 200);
        }

        $payload = $request->all();

        Log::info('Xendit webhook diterima', ['external_id' => $payload['external_id'] ?? null]);

        // ── 2. Parse payload ─────────────────────────────────────────────────
        $data = $this->xendit->parseWebhookPayload($payload);

        if (!$data['external_id']) {
            return response()->json(['message' => 'OK']);
        }

        // ── 3. Cari payment berdasarkan external_id ──────────────────────────
        // Format external_id kita: "jogjahub-{booking_uuid}"
        $payment = Payment::where('xendit_external_id', $data['external_id'])
            ->with('booking')
            ->first();

        if (!$payment) {
            Log::warning('Xendit webhook: payment tidak ditemukan.', ['external_id' => $data['external_id']]);
            return response()->json(['message' => 'OK']); // 200 agar Xendit tidak retry
        }

        // ── 4. Idempotency check — jangan proses duplikat ────────────────────
        if ($payment->status === $data['status']) {
            Log::info('Xendit webhook: status sama, skip.', ['external_id' => $data['external_id']]);
            return response()->json(['message' => 'OK']);
        }

        // ── 5. Update payment & booking dalam satu transaksi ─────────────────
        DB::transaction(function () use ($payment, $data) {
            $payment->update([
                'status'          => $data['status'],
                'payment_method'  => $data['payment_method'],
                'payment_channel' => $data['payment_channel'],
                'paid_at'         => $data['paid_at'],
                'xendit_raw_response' => $data['raw'],
            ]);

            $booking = $payment->booking()->lockForUpdate()->first();

            if (!$booking) {
                return;
            }

            if ($data['status'] === 'paid') {
                // Pembayaran sukses → konfirmasi booking
                $booking->update(['status' => BookingStatus::CONFIRMED->value]);
                Log::info("Xendit webhook: booking #{$booking->uuid} CONFIRMED.");

            } elseif (in_array($data['status'], ['expired', 'failed'])) {
                // Pembayaran gagal/expired → batalkan booking + lepas slot
                $this->releaseSlot($booking);
                $booking->update(['status' => BookingStatus::CANCELLED->value]);
                Log::info("Xendit webhook: booking #{$booking->uuid} CANCELLED ({$data['status']}).");
            }
        });

        return response()->json(['message' => 'OK']);
    }

    /**
     * Lepaskan kuota slot ketika booking dibatalkan via webhook.
     */
    private function releaseSlot(\App\Models\Booking $booking): void
    {
        if (!$booking->slot_id) {
            return;
        }

        $slot = \App\Models\TimeSlot::where('id', $booking->slot_id)
            ->lockForUpdate()
            ->first();

        if ($slot && $slot->booked_count > 0) {
            $slot->decrement('booked_count');
        }
    }
}

