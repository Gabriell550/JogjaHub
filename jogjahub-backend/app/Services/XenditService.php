<?php

namespace App\Services;

use App\Models\Booking;
use App\Models\Payment;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Str;

/**
 * XenditService — wrapper untuk Xendit Invoice API.
 *
 * Dokumentasi Xendit: https://developers.xendit.co/api-reference/#create-invoice
 *
 * Metode pembayaran yang didukung untuk MVP:
 *  - Virtual Account: BCA, BNI, BRI, Mandiri, Permata
 *  - QRIS (semua e-wallet/m-banking yang support QRIS)
 *  - E-wallet: GoPay, OVO, DANA, ShopeePay
 */
class XenditService
{
    private string $secretKey;
    private string $webhookToken;
    private string $baseUrl = 'https://api.xendit.co';

    public function __construct()
    {
        $this->secretKey    = config('xendit.secret_key');
        $this->webhookToken = config('xendit.webhook_token');
    }

    /**
     * Buat invoice pembayaran di Xendit.
     *
     * @return array { xendit_invoice_id, xendit_external_id, payment_url, expires_at }
     * @throws \RuntimeException jika Xendit API error
     */
    public function createInvoice(Booking $booking): array
    {
        // External ID unik per invoice — dipakai untuk idempotency
        // Format: jogjahub-{booking_uuid} supaya mudah di-trace saat debugging
        $externalId = 'jogjahub-' . $booking->uuid;

        $payload = [
            'external_id'        => $externalId,
            'amount'             => $booking->payment->amount,
            'description'        => "Booking #{$booking->uuid} — {$booking->service->name}",
            'customer'           => [
                'given_names' => $booking->customer->name,
                'email'       => $booking->customer->email,
            ],
            'invoice_duration'   => 3600,   // 1 jam dalam detik — sesuai keputusan tim
            'currency'           => 'IDR',
            'payment_methods'    => ['BCA', 'BNI', 'BRI', 'MANDIRI', 'PERMATA', // Virtual Account
                                     'QRIS',                                      // QRIS
                                     'GOPAY', 'OVO', 'DANA', 'SHOPEEPAY'],       // E-wallet
            'success_redirect_url' => config('xendit.success_redirect_url'),
            'failure_redirect_url' => config('xendit.failure_redirect_url'),
        ];

        $response = Http::withBasicAuth($this->secretKey, '')
            ->post("{$this->baseUrl}/v2/invoices", $payload);

        if ($response->failed()) {
            Log::error('Xendit createInvoice gagal', [
                'booking_uuid' => $booking->uuid,
                'status'       => $response->status(),
                'body'         => $response->json(),
            ]);
            throw new \RuntimeException('Gagal membuat invoice pembayaran. Coba lagi.');
        }

        $data = $response->json();

        return [
            'xendit_invoice_id'  => $data['id'],
            'xendit_external_id' => $externalId,
            'payment_url'        => $data['invoice_url'],
            'expires_at'         => now()->addHour(),
        ];
    }

    /**
     * Verifikasi bahwa request webhook benar-benar dari Xendit.
     * Xendit mengirim token di header x-callback-token.
     */
    public function verifyWebhookToken(Request $request): bool
    {
        $incoming = $request->header('x-callback-token');

        if (!$incoming || !$this->webhookToken) {
            return false;
        }

        // Gunakan hash_equals untuk mencegah timing attack
        return hash_equals($this->webhookToken, $incoming);
    }

    /**
     * Parse payload webhook Xendit dan kembalikan data yang relevan.
     *
     * @return array { external_id, status, payment_method, payment_channel, paid_at, raw }
     */
    public function parseWebhookPayload(array $payload): array
    {
        // Mapping status Xendit → status internal
        $statusMap = [
            'PAID'    => 'paid',
            'EXPIRED' => 'expired',
            'FAILED'  => 'failed',
        ];

        return [
            'external_id'     => $payload['external_id'] ?? null,
            'xendit_invoice_id' => $payload['id'] ?? null,
            'status'          => $statusMap[$payload['status'] ?? ''] ?? 'pending',
            'payment_method'  => $payload['payment_method'] ?? null,
            'payment_channel' => $payload['payment_channel'] ?? null,
            'paid_at'         => isset($payload['paid_at'])
                ? \Carbon\Carbon::parse($payload['paid_at'])
                : null,
            'raw'             => $payload,
        ];
    }
}

