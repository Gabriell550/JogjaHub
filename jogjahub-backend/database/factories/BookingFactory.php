<?php

namespace Database\Factories;

use App\Models\Service;
use App\Models\TimeSlot;
use App\Models\User;
use Illuminate\Database\Eloquent\Factories\Factory;

/**
 * @extends Factory<\App\Models\Booking>
 */
class BookingFactory extends Factory
{
    public function definition(): array
    {
        return [
            'customer_id'       => User::factory()->customer(),
            'service_id'        => Service::factory(),
            'slot_id'           => null,
            'status'            => 'pending',
            'payment_method'    => 'transfer',
            'payment_proof_url' => null,
            'details'           => null,
        ];
    }

    public function pending(): static
    {
        return $this->state(fn () => ['status' => 'pending']);
    }

    public function confirmed(): static
    {
        return $this->state(fn () => ['status' => 'confirmed']);
    }

    public function cancelled(): static
    {
        return $this->state(fn () => ['status' => 'cancelled']);
    }

    public function withSlot(TimeSlot $slot): static
    {
        return $this->state(fn () => ['slot_id' => $slot->id]);
    }
}
