<?php

namespace Tests\Traits;

use App\Models\Payment;
use App\Services\XenditService;
use Mockery;

/**
 * Trait untuk mock XenditService di test.
 *
 * Tanpa mock ini, test yang memanggil createBooking() akan mencoba
 * hit Xendit API sungguhan dan gagal karena tidak ada API key di test env.
 */
trait MocksXendit
{
    /**
     * Mock XenditService::createInvoice() agar mengembalikan data palsu
     * tanpa hit API Xendit sungguhan.
     *
     * Panggil di setUp() atau di awal test yang perlu booking.
     */
    protected function mockXendit(): void
    {
        $mock = Mockery::mock(XenditService::class);

        $mock->shouldReceive('createInvoice')
             ->andReturnUsing(function ($booking) {
                 // Pastikan Payment record sudah ada sebelum mock dipanggil
                 $externalId = 'jogjahub-' . $booking->uuid;

                 return [
                     'xendit_invoice_id'  => 'inv_' . fake()->uuid(),
                     'xendit_external_id' => $externalId,
                     'payment_url'        => 'https://checkout-staging.xendit.co/v2/invoices/fake',
                     'expires_at'         => now()->addHour(),
                 ];
             });

        $mock->shouldReceive('verifyWebhookToken')->andReturn(true);
        $mock->shouldReceive('parseWebhookPayload')->andReturnUsing(function (array $payload) {
            // Duplikasi logic parseWebhookPayload agar tidak circular (mock memanggil dirinya sendiri)
            $statusMap = ['PAID' => 'paid', 'EXPIRED' => 'expired', 'FAILED' => 'failed'];
            return [
                'external_id'      => $payload['external_id'] ?? null,
                'xendit_invoice_id'=> $payload['id'] ?? null,
                'status'           => $statusMap[$payload['status'] ?? ''] ?? 'pending',
                'payment_method'   => $payload['payment_method'] ?? null,
                'payment_channel'  => $payload['payment_channel'] ?? null,
                'paid_at'          => isset($payload['paid_at'])
                    ? \Carbon\Carbon::parse($payload['paid_at'])
                    : null,
                'raw' => $payload,
            ];
        });

        $this->app->instance(XenditService::class, $mock);
    }

    /**
     * Simulasikan webhook Xendit "PAID" untuk sebuah booking.
     * Berguna untuk test flow setelah pembayaran berhasil.
     */
    protected function simulateXenditPaid(Payment $payment): void
    {
        $this->postJson('/api/v1/webhook/xendit', [
            'id'              => $payment->xendit_invoice_id ?? 'inv_fake',
            'external_id'     => $payment->xendit_external_id,
            'status'          => 'PAID',
            'payment_method'  => 'VIRTUAL_ACCOUNT',
            'payment_channel' => 'BCA',
            'paid_at'         => now()->toIso8601String(),
            'amount'          => $payment->amount,
        ], ['x-callback-token' => 'test-token']);
    }
}

