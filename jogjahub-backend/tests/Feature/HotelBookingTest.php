<?php

namespace Tests\Feature;

use App\Models\Booking;
use App\Models\Payment;
use App\Models\Service;
use App\Models\Subcategory;
use App\Models\TenantProfile;
use App\Models\TimeSlot;
use App\Models\User;
use Carbon\Carbon;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Queue;
use Tests\TestCase;
use Tests\Traits\MocksXendit;

/**
 * Test suite untuk fitur multi-slot booking (hotel).
 *
 * Skenario yang diuji:
 *  1. Hotel booking mengunci semua slot dalam rentang check_in s.d. check_out
 *  2. Hotel booking gagal jika salah satu slot dalam rentang penuh
 *  3. Hotel booking gagal jika slot tidak ada untuk tanggal tertentu
 *  4. Cancel hotel booking melepas semua slot
 *  5. Webhook EXPIRED melepas semua slot hotel
 *  6. Validasi request: check_out harus setelah check_in
 *  7. Tidak boleh kirim slot_id dan check_in_date sekaligus
 */
class HotelBookingTest extends TestCase
{
    use RefreshDatabase, MocksXendit;

    protected function setUp(): void
    {
        parent::setUp();
        // Mock Xendit supaya tidak hit API sungguhan
        $this->mockXendit();
        // Fake queue: ReleaseExpiredBookingJob tidak langsung jalan di test
        Queue::fake();
    }

    // ─── Helper: buat setup dasar (customer, tenant, service hotel) ──────────

    private function makeHotelSetup(): array
    {
        $customer    = User::factory()->customer()->create();
        $tenant      = TenantProfile::factory()->approved()->create();
        // Subcategory hotel: requires_time_slot = true (slot per malam)
        $subcategory = Subcategory::factory()->requiresSlot()->create();
        $service     = Service::factory()->create([
            'tenant_id'      => $tenant->id,
            'subcategory_id' => $subcategory->id,
        ]);

        return compact('customer', 'tenant', 'subcategory', 'service');
    }

    /**
     * Buat slot untuk setiap tanggal di antara $startDate dan $endDate (inklusif keduanya).
     */
    private function createSlotsForDates(Service $service, string $startDate, string $endDate, int $quota = 5): array
    {
        $slots = [];
        $current = Carbon::parse($startDate);
        $end     = Carbon::parse($endDate);

        while ($current->lte($end)) {
            $slots[] = TimeSlot::factory()->create([
                'service_id'   => $service->id,
                'slot_date'    => $current->toDateString(),
                'quota'        => $quota,
                'booked_count' => 0,
            ]);
            $current->addDay();
        }

        return $slots;
    }

    // ─── Test 1: Hotel booking mengunci semua slot dalam rentang ─────────────

    public function test_hotel_booking_mengunci_semua_slot_dalam_rentang()
    {
        ['customer' => $customer, 'service' => $service] = $this->makeHotelSetup();

        // Buat slot untuk 3 malam: 1, 2, 3 Januari (check_out = 4 Jan, jadi lock 1,2,3)
        $slots = $this->createSlotsForDates($service, '2027-01-01', '2027-01-03');

        $response = $this->actingAs($customer)
            ->postJson('/api/v1/customer/bookings', [
                'service_id'     => $service->id,
                'check_in_date'  => '2027-01-01',
                'check_out_date' => '2027-01-04', // 3 malam
            ]);

        $response->assertStatus(201)
                 ->assertJsonPath('success', true)
                 ->assertJsonPath('data.status', 'pending')
                 ->assertJsonStructure(['data', 'payment_url', 'expires_at']);

        // Semua 3 slot harus bertambah booked_count-nya
        foreach ($slots as $slot) {
            $this->assertDatabaseHas('time_slots', [
                'id'           => $slot->id,
                'booked_count' => 1, // ← dari 0 jadi 1
            ]);
        }

        // Booking harus ada di pivot booking_slots (3 record)
        $booking = Booking::latest()->first();
        $this->assertCount(3, $booking->slots);

        // Pivot booking_slots harus berisi semua slot ID
        foreach ($slots as $slot) {
            $this->assertDatabaseHas('booking_slots', [
                'booking_id'   => $booking->id,
                'time_slot_id' => $slot->id,
            ]);
        }

        // details harus menyimpan info check-in/out
        $this->assertEquals('2027-01-01', $booking->details['check_in_date']);
        $this->assertEquals('2027-01-04', $booking->details['check_out_date']);
        $this->assertEquals(3,            $booking->details['nights']);
    }

    // ─── Test 2: Hotel booking gagal jika salah satu slot penuh ─────────────

    public function test_hotel_booking_gagal_jika_salah_satu_slot_penuh()
    {
        ['customer' => $customer, 'service' => $service] = $this->makeHotelSetup();

        // 2 slot normal, 1 slot penuh
        $this->createSlotsForDates($service, '2027-02-01', '2027-02-01'); // slot 1 Feb (normal)
        $this->createSlotsForDates($service, '2027-02-02', '2027-02-02'); // slot 2 Feb (normal)
        // Slot 3 Feb: quota=1, booked_count=1 (penuh)
        TimeSlot::factory()->create([
            'service_id'   => $service->id,
            'slot_date'    => '2027-02-03',
            'quota'        => 1,
            'booked_count' => 1,
        ]);

        $response = $this->actingAs($customer)
            ->postJson('/api/v1/customer/bookings', [
                'service_id'     => $service->id,
                'check_in_date'  => '2027-02-01',
                'check_out_date' => '2027-02-04', // mencakup 1,2,3 Feb
            ]);

        // Harus ditolak karena slot 3 Feb penuh
        $response->assertStatus(422);

        // Pastikan booked_count tidak berubah (transaksi di-rollback)
        foreach (TimeSlot::where('service_id', $service->id)->get() as $slot) {
            $this->assertDatabaseHas('time_slots', [
                'id'           => $slot->id,
                'booked_count' => $slot->booked_count, // tetap sama
            ]);
        }
    }

    // ─── Test 3: Hotel booking gagal jika slot tidak ada untuk tanggal ───────

    public function test_hotel_booking_gagal_jika_slot_tidak_ada_untuk_tanggal_tertentu()
    {
        ['customer' => $customer, 'service' => $service] = $this->makeHotelSetup();

        // Hanya buat slot untuk 2 dari 3 malam (slot 15 Maret tidak ada)
        $this->createSlotsForDates($service, '2027-03-14', '2027-03-14');
        // sengaja tidak buat slot untuk 2027-03-15
        $this->createSlotsForDates($service, '2027-03-16', '2027-03-16');

        $response = $this->actingAs($customer)
            ->postJson('/api/v1/customer/bookings', [
                'service_id'     => $service->id,
                'check_in_date'  => '2027-03-14',
                'check_out_date' => '2027-03-17', // mencakup 14,15,16 Mar
            ]);

        // Harus ditolak karena slot 2027-03-15 tidak ditemukan
        $response->assertStatus(422);
        $response->assertJsonPath('errors.check_in_date.0',
            fn ($val) => str_contains($val, '2027-03-15')
        );
    }

    // ─── Test 4: Cancel hotel booking melepas semua slot ─────────────────────

    public function test_cancel_hotel_booking_melepas_semua_slot()
    {
        ['customer' => $customer, 'service' => $service] = $this->makeHotelSetup();

        // Buat 2 slot sudah dipesan (booked_count=1)
        $slot1 = TimeSlot::factory()->create([
            'service_id'   => $service->id,
            'slot_date'    => '2027-04-10',
            'quota'        => 5,
            'booked_count' => 1,
        ]);
        $slot2 = TimeSlot::factory()->create([
            'service_id'   => $service->id,
            'slot_date'    => '2027-04-11',
            'quota'        => 5,
            'booked_count' => 1,
        ]);

        // Buat booking manual (multi-slot, slot_id = null)
        $booking = Booking::factory()->create([
            'customer_id' => $customer->id,
            'service_id'  => $service->id,
            'slot_id'     => null,
            'status'      => 'pending',
            'details'     => [
                'check_in_date'  => '2027-04-10',
                'check_out_date' => '2027-04-12',
                'nights'         => 2,
            ],
        ]);

        // Attach ke pivot
        $booking->slots()->attach([$slot1->id, $slot2->id]);

        // Customer cancel booking
        $response = $this->actingAs($customer)
            ->postJson("/api/v1/customer/bookings/{$booking->uuid}/cancel");

        $response->assertStatus(200);

        // Semua slot harus kembali ke booked_count = 0
        $this->assertDatabaseHas('time_slots', ['id' => $slot1->id, 'booked_count' => 0]);
        $this->assertDatabaseHas('time_slots', ['id' => $slot2->id, 'booked_count' => 0]);

        $this->assertDatabaseHas('bookings', ['id' => $booking->id, 'status' => 'cancelled']);
    }

    // ─── Test 5: Webhook EXPIRED melepas semua slot hotel ────────────────────

    public function test_webhook_expired_melepas_semua_slot_hotel()
    {
        ['customer' => $customer, 'service' => $service] = $this->makeHotelSetup();

        $slot1 = TimeSlot::factory()->create([
            'service_id'   => $service->id,
            'slot_date'    => '2027-05-01',
            'quota'        => 3,
            'booked_count' => 1,
        ]);
        $slot2 = TimeSlot::factory()->create([
            'service_id'   => $service->id,
            'slot_date'    => '2027-05-02',
            'quota'        => 3,
            'booked_count' => 1,
        ]);

        $booking = Booking::factory()->create([
            'customer_id' => $customer->id,
            'service_id'  => $service->id,
            'slot_id'     => null,
            'status'      => 'pending',
        ]);
        $booking->slots()->attach([$slot1->id, $slot2->id]);

        Payment::factory()->create([
            'booking_id'         => $booking->id,
            'xendit_external_id' => 'jogjahub-' . $booking->uuid,
            'status'             => 'pending',
            'amount'             => 100000,
        ]);

        // Kirim webhook EXPIRED dari Xendit
        $this->postJson('/api/v1/webhook/xendit', [
            'id'          => 'inv_fake_hotel_expired',
            'external_id' => 'jogjahub-' . $booking->uuid,
            'status'      => 'EXPIRED',
        ], ['x-callback-token' => config('xendit.webhook_token')]);

        // Semua slot harus dilepas
        $this->assertDatabaseHas('time_slots', ['id' => $slot1->id, 'booked_count' => 0]);
        $this->assertDatabaseHas('time_slots', ['id' => $slot2->id, 'booked_count' => 0]);
        $this->assertDatabaseHas('bookings', ['id' => $booking->id, 'status' => 'cancelled']);
    }

    // ─── Test 6: Validasi request — check_out harus setelah check_in ─────────

    public function test_booking_gagal_jika_check_out_sebelum_check_in()
    {
        $customer = User::factory()->customer()->create();
        $service  = Service::factory()->create();

        $response = $this->actingAs($customer)
            ->postJson('/api/v1/customer/bookings', [
                'service_id'     => $service->id,
                'check_in_date'  => '2027-06-10',
                'check_out_date' => '2027-06-08', // lebih awal dari check_in!
            ]);

        $response->assertStatus(422);
    }

    // ─── Test 7: Tidak boleh kirim slot_id dan check_in_date sekaligus ───────

    public function test_booking_gagal_jika_kirim_slot_id_dan_check_in_sekaligus()
    {
        $customer = User::factory()->customer()->create();
        $service  = Service::factory()->create();
        $slot     = TimeSlot::factory()->create(['service_id' => $service->id]);

        $response = $this->actingAs($customer)
            ->postJson('/api/v1/customer/bookings', [
                'service_id'     => $service->id,
                'slot_id'        => $slot->id,
                'check_in_date'  => '2027-07-01',
                'check_out_date' => '2027-07-03',
            ]);

        $response->assertStatus(422);
        $response->assertJsonValidationErrors(['slot_id']);
    }
}

