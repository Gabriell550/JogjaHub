<?php

namespace Database\Factories;

use App\Models\Booking;
use Illuminate\Database\Eloquent\Factories\Factory;

class PaymentFactory extends Factory
{
    public function definition(): array
    {
        return [
            'booking_id'         => Booking::factory(),
            'xendit_invoice_id'  => 'inv_' . fake()->uuid(),
            'xendit_external_id' => 'jogjahub-' . fake()->uuid(),
            'amount'             => fake()->numberBetween(50000, 500000),
            'currency'           => 'IDR',
            'status'             => 'pending',
            'payment_url'        => 'https://checkout-staging.xendit.co/v2/invoices/fake',
            'expires_at'         => now()->addHour(),
        ];
    }

    public function paid(): static
    {
        return $this->state([
            'status'  => 'paid',
            'paid_at' => now(),
        ]);
    }

    public function expired(): static
    {
        return $this->state([
            'status'     => 'expired',
            'expires_at' => now()->subHour(),
        ]);
    }
}
