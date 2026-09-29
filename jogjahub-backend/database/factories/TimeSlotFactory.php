<?php

namespace Database\Factories;

use App\Models\Service;
use Illuminate\Database\Eloquent\Factories\Factory;

/**
 * @extends Factory<\App\Models\TimeSlot>
 */
class TimeSlotFactory extends Factory
{
    public function definition(): array
    {
        return [
            'service_id'  => Service::factory(),
            'slot_date'   => fake()->dateTimeBetween('now', '+30 days')->format('Y-m-d'),
            'start_time'  => '09:00:00',
            'end_time'    => '10:00:00',
            'quota'       => 5,
            'booked_count'=> 0,
        ];
    }

    public function full(): static
    {
        return $this->state(fn (array $attrs) => [
            'booked_count' => $attrs['quota'],
        ]);
    }

    public function withQuota(int $quota): static
    {
        return $this->state(fn () => ['quota' => $quota, 'booked_count' => 0]);
    }
}
