<?php

namespace Database\Factories;

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
            'photos'         => [],
        ];
    }
}
