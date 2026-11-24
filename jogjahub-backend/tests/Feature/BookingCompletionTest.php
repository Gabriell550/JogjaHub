<?php

namespace Tests\Feature;

use App\Models\Booking;
use App\Models\Service;
use App\Models\TenantProfile;
use App\Models\TimeSlot;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Laravel\Sanctum\Sanctum;
use Tests\TestCase;

class BookingCompletionTest extends TestCase
{
    use RefreshDatabase;

    public function test_completion_preserves_slot_quota_and_only_allows_the_owners_to_act(): void
    {
        $this->freezeTime();
        $tenant = TenantProfile::factory()->create();
        $service = Service::factory()->for($tenant, 'tenant')->create();
        $slot = TimeSlot::factory()->for($service)->create([
            'slot_date' => now()->subDay()->toDateString(), 'booked_count' => 1,
        ]);
        $booking = Booking::factory()->for($service)->for($slot, 'slot')->create(['status' => 'confirmed']);
        $booking->slots()->attach($slot);
        $service->delete();
        $customerPath = "/api/v1/customer/bookings/{$booking->uuid}";
        $tenantPath = "/api/v1/tenant/bookings/{$booking->uuid}";

        Sanctum::actingAs(TenantProfile::factory()->create()->user);
        $this->postJson("$tenantPath/mark-fulfilled")->assertForbidden();
        Sanctum::actingAs($booking->customer);
        $this->postJson("$customerPath/review", ['rating' => 5])->assertUnprocessable();
        $this->postJson("$customerPath/confirm-completion")->assertUnprocessable();
        Sanctum::actingAs($tenant->user);
        $marked = $this->postJson("$tenantPath/mark-fulfilled")->assertOk()
            ->assertJsonPath('data.status', 'awaiting_completion_confirmation')->json('data.fulfilled_at');
        $this->travel(5)->minutes();
        $this->postJson("$tenantPath/mark-fulfilled")->assertOk()->assertJsonPath('data.fulfilled_at', $marked);
        Sanctum::actingAs(User::factory()->create(['role' => 'customer']));
        $this->postJson("$customerPath/confirm-completion")->assertForbidden();
        $this->postJson("$customerPath/completion-issue", ['reason' => 'Barang rusak'])->assertForbidden();

        Sanctum::actingAs($booking->customer);
        $reported = $this->postJson("$customerPath/completion-issue", ['reason' => 'Barang rusak'])->assertOk()
            ->assertJsonPath('data.status', 'awaiting_completion_confirmation')->json('data.issue_reported_at');
        $this->postJson("$customerPath/completion-issue", ['reason' => 'Duplikat'])->assertOk()
            ->assertJsonPath('data.completion_issue', 'Barang rusak')->assertJsonPath('data.issue_reported_at', $reported);
        $this->assertDatabaseCount('conversations', 1);
        Sanctum::actingAs($tenant->user);
        $this->getJson($tenantPath)->assertOk()->assertJsonPath('data.completion_issue', 'Barang rusak')
            ->assertJsonPath('data.completion_conversation_id', 1);
        $this->travel(25)->hours();
        $this->artisan('bookings:remind-completion')->assertSuccessful();
        $this->assertNull($booking->fresh()->completion_reminded_at);

        Sanctum::actingAs($booking->customer);
        $completed = $this->postJson("$customerPath/confirm-completion")->assertOk()
            ->assertJsonPath('data.status', 'completed')->json('data.completed_at');
        $this->travel(5)->minutes();
        $this->postJson("$customerPath/confirm-completion")->assertOk()->assertJsonPath('data.completed_at', $completed);
        $this->postJson("$customerPath/review", ['rating' => 5])->assertCreated();
        $this->postJson("$customerPath/review", ['rating' => 5])->assertUnprocessable();
        $this->assertEquals(1, $slot->fresh()->booked_count);
    }

    public function test_hourly_reminder_is_recorded_once_and_keeps_booking_waiting(): void
    {
        $this->freezeTime();
        $old = Booking::factory()->create(['status' => 'awaiting_completion_confirmation']);
        $old->forceFill(['fulfilled_at' => now()->subHours(25)])->save();
        $recent = Booking::factory()->create(['status' => 'awaiting_completion_confirmation']);
        $recent->forceFill(['fulfilled_at' => now()->subHour()])->save();
        $this->artisan('bookings:remind-completion')->assertSuccessful();
        $first = $old->fresh()->completion_reminded_at;
        $this->assertNotNull($first);
        $this->assertNull($recent->fresh()->completion_reminded_at);
        $this->travel(2)->hours();
        $this->artisan('bookings:remind-completion')->assertSuccessful();
        $this->assertEquals($first, $old->fresh()->completion_reminded_at);
        $this->assertSame('awaiting_completion_confirmation', $old->fresh()->status);
    }

    public function test_tenant_cannot_mark_a_future_slot_or_hotel_stay_complete(): void
    {
        $tenant = TenantProfile::factory()->create();
        $service = Service::factory()->for($tenant, 'tenant')->create();
        $future = now('Asia/Jakarta')->addDay()->toDateString();
        $slot = TimeSlot::factory()->for($service)->create(['slot_date' => $future]);
        $single = Booking::factory()->for($service)->for($slot, 'slot')->create(['status' => 'confirmed']);
        $hotel = Booking::factory()->for($service)->create(['status' => 'confirmed', 'details' => ['check_out_date' => $future]]);
        Sanctum::actingAs($tenant->user);
        foreach ([$single, $hotel] as $booking) {
            $this->postJson("/api/v1/tenant/bookings/{$booking->uuid}/mark-fulfilled")->assertUnprocessable();
        }
    }
}
