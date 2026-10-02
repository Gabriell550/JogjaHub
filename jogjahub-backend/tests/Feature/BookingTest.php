<?php

namespace Tests\Feature;

use App\Models\Booking;
use App\Models\Service;
use App\Models\TenantProfile;
use App\Models\TimeSlot;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class BookingTest extends TestCase
{
    use RefreshDatabase;

    // ─── Create Booking ───────────────────────────────────────────────────────

    public function test_customer_bisa_buat_booking()
    {
        $customer = User::factory()->customer()->create();
        $tenant   = TenantProfile::factory()->approved()->create();
        $service  = Service::factory()->create(['tenant_id' => $tenant->id]);

        $response = $this->actingAs($customer)
            ->postJson('/api/v1/customer/bookings', [
                'service_id'     => $service->id,
                'payment_method' => 'transfer',
            ]);

        $response->assertStatus(201)
                 ->assertJsonPath('success', true)
                 ->assertJsonPath('data.status', 'pending');

        $this->assertDatabaseHas('bookings', [
            'customer_id' => $customer->id,
            'service_id'  => $service->id,
            'status'      => 'pending',
        ]);
    }

    public function test_booking_dengan_slot_menambah_booked_count()
    {
        $customer    = User::factory()->customer()->create();
        $tenant      = TenantProfile::factory()->approved()->create();
        $subcategory = \App\Models\Subcategory::factory()->requiresSlot()->create();
        $service     = Service::factory()->create(['tenant_id' => $tenant->id, 'subcategory_id' => $subcategory->id]);
        $slot        = TimeSlot::factory()->create(['service_id' => $service->id, 'quota' => 5, 'booked_count' => 0]);

        $this->actingAs($customer)
            ->postJson('/api/v1/customer/bookings', [
                'service_id'     => $service->id,
                'slot_id'        => $slot->id,
                'payment_method' => 'transfer',
            ]);

        $this->assertDatabaseHas('time_slots', [
            'id'           => $slot->id,
            'booked_count' => 1,  // ← harus bertambah
        ]);
    }

    public function test_booking_gagal_jika_slot_penuh()
    {
        $customer    = User::factory()->customer()->create();
        $tenant      = TenantProfile::factory()->approved()->create();
        $subcategory = \App\Models\Subcategory::factory()->requiresSlot()->create();
        $service     = Service::factory()->create(['tenant_id' => $tenant->id, 'subcategory_id' => $subcategory->id]);
        $slot        = TimeSlot::factory()->full()->create(['service_id' => $service->id]);

        $response = $this->actingAs($customer)
            ->postJson('/api/v1/customer/bookings', [
                'service_id'     => $service->id,
                'slot_id'        => $slot->id,
                'payment_method' => 'transfer',
            ]);

        $response->assertStatus(422);
    }

    public function test_booking_gagal_tanpa_auth()
    {
        $service = Service::factory()->create();

        $response = $this->postJson('/api/v1/customer/bookings', [
            'service_id'     => $service->id,
            'payment_method' => 'transfer',
        ]);

        $response->assertStatus(401);
    }

    public function test_tenant_tidak_bisa_buat_booking()
    {
        $tenantUser = User::factory()->tenant()->create();
        $service    = Service::factory()->create();

        $response = $this->actingAs($tenantUser)
            ->postJson('/api/v1/customer/bookings', [
                'service_id'     => $service->id,
                'payment_method' => 'transfer',
            ]);

        $response->assertStatus(403);
    }

    // ─── Cancel Booking ───────────────────────────────────────────────────────

    public function test_cancel_booking_mengembalikan_kuota_slot()
    {
        $customer = User::factory()->customer()->create();
        $tenant   = TenantProfile::factory()->approved()->create();
        $service  = Service::factory()->create(['tenant_id' => $tenant->id]);
        $slot     = TimeSlot::factory()->create(['service_id' => $service->id, 'quota' => 5, 'booked_count' => 1]);
        $booking  = Booking::factory()->create([
            'customer_id' => $customer->id,
            'service_id'  => $service->id,
            'slot_id'     => $slot->id,
            'status'      => 'pending',
        ]);

        $this->actingAs($customer)
            ->postJson("/api/v1/customer/bookings/{$booking->uuid}/cancel");

        $this->assertDatabaseHas('time_slots', [
            'id'           => $slot->id,
            'booked_count' => 0,  // ← harus kembali ke 0
        ]);

        $this->assertDatabaseHas('bookings', [
            'id'     => $booking->id,
            'status' => 'cancelled',
        ]);
    }

    public function test_customer_tidak_bisa_cancel_booking_orang_lain()
    {
        $customer1 = User::factory()->customer()->create();
        $customer2 = User::factory()->customer()->create();
        $service   = Service::factory()->create();
        $booking   = Booking::factory()->create([
            'customer_id' => $customer1->id,
            'service_id'  => $service->id,
            'status'      => 'pending',
        ]);

        $response = $this->actingAs($customer2)
            ->postJson("/api/v1/customer/bookings/{$booking->uuid}/cancel");

        $response->assertStatus(403);
    }

    // ─── Tenant Update Status ─────────────────────────────────────────────────

    public function test_tenant_bisa_konfirmasi_booking()
    {
        $tenantUser = User::factory()->tenant()->create();
        $tenant     = TenantProfile::factory()->approved()->create(['user_id' => $tenantUser->id]);
        $service    = Service::factory()->create(['tenant_id' => $tenant->id]);
        $customer   = User::factory()->customer()->create();
        $booking    = Booking::factory()->pending()->create([
            'customer_id' => $customer->id,
            'service_id'  => $service->id,
        ]);

        $response = $this->actingAs($tenantUser)
            ->patchJson("/api/v1/tenant/bookings/{$booking->uuid}/status", [
                'status' => 'confirmed',
            ]);

        $response->assertStatus(200)
                 ->assertJsonPath('data.status', 'confirmed');
    }

    public function test_tenant_tidak_bisa_ubah_status_booking_tenant_lain()
    {
        $tenantUser1 = User::factory()->tenant()->create();
        $tenantUser2 = User::factory()->tenant()->create();

        // tenantUser1 punya profile sendiri (diperlukan agar controller tidak throw null)
        TenantProfile::factory()->approved()->create(['user_id' => $tenantUser1->id]);

        $tenant2  = TenantProfile::factory()->approved()->create(['user_id' => $tenantUser2->id]);
        $service  = Service::factory()->create(['tenant_id' => $tenant2->id]);
        $customer = User::factory()->customer()->create();
        $booking  = Booking::factory()->pending()->create([
            'customer_id' => $customer->id,
            'service_id'  => $service->id,
        ]);

        $response = $this->actingAs($tenantUser1)
            ->patchJson("/api/v1/tenant/bookings/{$booking->uuid}/status", [
                'status' => 'confirmed',
            ]);

        $response->assertStatus(403);
    }

    // ─── List Booking ─────────────────────────────────────────────────────────

    public function test_customer_hanya_lihat_bookingnya_sendiri()
    {
        $customer1 = User::factory()->customer()->create();
        $customer2 = User::factory()->customer()->create();
        $service   = Service::factory()->create();

        Booking::factory()->count(3)->create(['customer_id' => $customer1->id, 'service_id' => $service->id]);
        Booking::factory()->count(2)->create(['customer_id' => $customer2->id, 'service_id' => $service->id]);

        $response = $this->actingAs($customer1)
            ->getJson('/api/v1/customer/bookings');

        $response->assertStatus(200);

        // Gunakan total dari pagination, atau count dari data array
        $total = $response->json('data.meta.total')
                 ?? count($response->json('data.data') ?? $response->json('data') ?? []);

        $this->assertEquals(3, $total);
    }
}
