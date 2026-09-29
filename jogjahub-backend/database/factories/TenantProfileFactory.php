<?php

namespace Database\Factories;

use App\Models\User;
use Illuminate\Database\Eloquent\Factories\Factory;

/**
 * @extends Factory<\App\Models\TenantProfile>
 */
class TenantProfileFactory extends Factory
{
    public function definition(): array
    {
        return [
            'user_id'       => User::factory()->tenant(),
            'business_name' => fake()->company(),
            'description'   => fake()->sentence(),
            'address'       => [
                'street'      => fake()->streetAddress(),
                'city'        => 'Yogyakarta',
                'province'    => 'DI Yogyakarta',
                'postal_code' => '55000',
            ],
            'latitude'        => fake()->latitude(-8.1, -7.7),
            'longitude'       => fake()->longitude(110.2, 110.6),
            'whatsapp_number' => fake()->numerify('08##########'),
            'status'          => 'approved',
            'ktp_url'         => 'tenant_documents/ktp.jpg',
            'nib_url'         => 'tenant_documents/nib.jpg',
            'portfolio_url'   => null,
            'rejection_reason'=> null,
        ];
    }

    public function pending(): static
    {
        return $this->state(fn () => ['status' => 'pending']);
    }

    public function approved(): static
    {
        return $this->state(fn () => ['status' => 'approved']);
    }

    public function rejected(): static
    {
        return $this->state(fn () => [
            'status'           => 'rejected',
            'rejection_reason' => 'Dokumen tidak valid',
        ]);
    }
}
