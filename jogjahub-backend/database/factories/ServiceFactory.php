<?php

namespace Database\Factories;

use App\Enums\PriceType;
use App\Models\Subcategory;
use App\Models\TenantProfile;
use Illuminate\Database\Eloquent\Factories\Factory;

/**
 * @extends Factory<\App\Models\Service>
 */
class ServiceFactory extends Factory
{
    public function definition(): array
    {
        return [
            'tenant_id'      => TenantProfile::factory(),
            'subcategory_id' => Subcategory::factory(),
            'name'           => fake()->words(3, true),
            'description'    => fake()->sentence(),
            'price'          => fake()->numberBetween(50000, 500000),
            // Default per_session agar test lama (salon/barbershop) tidak rusak
            'price_type'     => PriceType::PER_SESSION->value,
            'photos'         => [],
        ];
    }

    /**
     * State untuk service hotel (harga per malam).
     *
     * Dipakai di test hotel booking untuk memastikan total = price × nights.
     */
    public function perNight(): static
    {
        return $this->state(fn () => [
            'price_type' => PriceType::PER_NIGHT->value,
        ]);
    }
}
