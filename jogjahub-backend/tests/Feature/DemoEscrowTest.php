<?php

namespace Tests\Feature;

use App\Models\Booking;
use App\Models\Service;
use App\Models\TenantProfile;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Laravel\Sanctum\Sanctum;
use Tests\TestCase;

class DemoEscrowTest extends TestCase
{
    use RefreshDatabase;

    private const EARNINGS = '/api/v1/tenant/demo-earnings';
    private const DESTINATION = '/api/v1/tenant/demo-payout-destination';
    private const CASES = '/api/v1/admin/demo-escrow-cases';

    public function test_payment_and_receipt_retries_keep_one_ledger_entry_and_a_masked_payout(): void
    {
        $this->freezeTime();
        $service = Service::factory()->create(['price' => 100000]);
        $customer = User::factory()->create(['role' => 'customer']);
        $uuid = $this->checkout($customer, $service, demoPickup: true);
        $this->assertDatabaseCount('bookings', 1);
        $this->assertDatabaseCount('payments', 1);
        $customerPath = "/api/v1/customer/bookings/$uuid";
        $tenantPath = "/api/v1/tenant/bookings/$uuid";
        $booking = Booking::where('uuid', $uuid)->firstOrFail();

        Sanctum::actingAs(TenantProfile::factory()->create()->user);
        $this->getJson(self::EARNINGS)->assertOk()->assertJsonCount(0, 'data');
        $this->postJson("$tenantPath/mark-fulfilled")->assertForbidden();

        Sanctum::actingAs($service->tenant->user);
        $this->saveDestination();
        $this->getJson(self::EARNINGS)->assertOk()->assertJsonCount(1, 'data')
            ->assertJsonPath('data.0.id', $booking->id)
            ->assertJsonPath('data.0.total_amount', 100000)
            ->assertJsonPath('data.0.payment.fund_status', 'held');
        $this->postJson("$tenantPath/mark-fulfilled")->assertOk()
            ->assertJsonPath('data.demo_pickup', true)
            ->assertJsonPath('data.payment.fund_status', 'held');
        $this->travel(2)->minutes();
        $this->artisan('bookings:advance-demo-payouts')->assertSuccessful();
        $this->getJson(self::EARNINGS)->assertJsonPath('data.0.payment.fund_status', 'held');

        Sanctum::actingAs(User::factory()->create(['role' => 'customer']));
        $this->postJson("$customerPath/confirm-completion")->assertForbidden();
        Sanctum::actingAs($customer);
        $confirmed = $this->postJson("$customerPath/confirm-completion")->assertOk()
            ->assertJsonPath('data.payment.fund_status', 'processing')
            ->assertJsonPath('data.payment.payout_destination', 'BCA •••• 1234')
            ->json('data.completed_at');
        $this->postJson("$customerPath/completion-issue", ['reason' => 'Terlambat'])->assertUnprocessable();
        $this->travel(5)->seconds();
        $this->artisan('bookings:advance-demo-payouts')->assertSuccessful();
        $this->postJson("$customerPath/confirm-completion")->assertOk()
            ->assertJsonPath('data.completed_at', $confirmed)
            ->assertJsonPath('data.payment.fund_status', 'simulated');

        Sanctum::actingAs($service->tenant->user);
        $this->saveDestination('0000005678');
        $this->getJson(self::EARNINGS)->assertJsonCount(1, 'data')
            ->assertJsonPath('data.0.id', $booking->id)
            ->assertJsonPath('data.0.payment.payout_destination', 'BCA •••• 1234')
            ->assertJsonPath('data.0.payment.fund_status', 'simulated')
            ->assertDontSee('0000001234');
        $this->assertDatabaseCount('payments', 1);
    }

    public function test_admin_resolves_complaint_and_destination_setup_releases_held_funds_automatically(): void
    {
        $this->freezeTime();
        $service = Service::factory()->create(['price' => 100000]);
        $customer = User::factory()->create(['role' => 'customer']);
        $uuid = $this->checkout($customer, $service);
        $customerPath = "/api/v1/customer/bookings/$uuid";
        $resolve = "/api/v1/admin/bookings/$uuid/resolve-completion-issue";
        $this->postJson("$customerPath/completion-issue", ['reason' => 'Barang rusak'])->assertOk();
        $this->postJson($resolve, ['resolution' => 'Selesai'])->assertForbidden();

        Sanctum::actingAs($service->tenant->user);
        $this->postJson("/api/v1/tenant/bookings/$uuid/mark-fulfilled")->assertOk();
        $this->getJson(self::CASES)->assertForbidden();
        Sanctum::actingAs($customer);
        $this->postJson("$customerPath/confirm-completion")->assertUnprocessable();
        $this->getJson($customerPath)->assertJsonPath('data.payment.fund_status', 'held');

        Sanctum::actingAs(User::factory()->create(['role' => 'admin']));
        $this->getJson(self::CASES)->assertOk()->assertJsonPath('data.0.completion_issue', 'Barang rusak');
        $this->postJson($resolve, ['resolution' => 'Toko mengganti barang.'])->assertOk()
            ->assertJsonPath('data.issue_resolution', 'Toko mengganti barang.');
        $this->postJson($resolve, ['resolution' => 'Duplikat'])->assertOk()
            ->assertJsonPath('data.issue_resolution', 'Toko mengganti barang.');

        Sanctum::actingAs($customer);
        $confirmed = $this->postJson("$customerPath/confirm-completion")->assertOk()
            ->assertJsonPath('data.payment.payout_waiting_for_destination', true)
            ->assertJsonPath('data.payment.fund_status', 'held')
            ->json('data.completed_at');
        Sanctum::actingAs($service->tenant->user);
        $this->getJson(self::EARNINGS)->assertJsonPath('data.0.payment.payout_waiting_for_destination', true);
        $this->saveDestination();
        $this->getJson(self::EARNINGS)->assertJsonPath('data.0.payment.fund_status', 'processing');
        $this->travel(5)->seconds();
        $this->getJson(self::EARNINGS)->assertJsonPath('data.0.completed_at', $confirmed)
            ->assertJsonPath('data.0.payment.fund_status', 'simulated');
    }

    public function test_admin_can_retry_a_failed_simulation(): void
    {
        $this->freezeTime();
        $service = Service::factory()->create(['price' => 100000]);
        $customer = User::factory()->create(['role' => 'customer']);
        $uuid = $this->checkout($customer, $service);
        $retry = "/api/v1/admin/bookings/$uuid/retry-demo-payout";

        Sanctum::actingAs($service->tenant->user);
        $this->saveDestination();
        $this->postJson("/api/v1/tenant/bookings/$uuid/mark-fulfilled")->assertOk();
        $this->postJson($retry)->assertForbidden();

        Sanctum::actingAs($customer);
        $this->postJson("/api/v1/customer/bookings/$uuid/confirm-completion")->assertOk();
        Booking::where('uuid', $uuid)->firstOrFail()->payment->update(['payout_destination' => null]);
        $this->travel(5)->seconds();
        $this->artisan('bookings:advance-demo-payouts')->assertSuccessful();

        Sanctum::actingAs(User::factory()->create(['role' => 'admin']));
        $this->getJson(self::CASES)->assertJsonPath('data.0.payment.fund_status', 'failed');
        $this->postJson($retry)->assertOk()->assertJsonPath('data.payment.fund_status', 'processing');
        $this->travel(5)->seconds();
        $this->postJson($retry)->assertOk()->assertJsonPath('data.payment.fund_status', 'simulated');
        $this->assertDatabaseCount('payments', 1);
    }

    private function checkout(User $customer, Service $service, bool $demoPickup = false): string
    {
        Sanctum::actingAs($customer);
        $payload = [
            'service_id' => $service->id,
            'demo_payment_method' => 'gopay',
            'demo_checkout_key' => 'escrow-test-checkout',
            'demo_expected_amount' => 100000,
            'demo_pickup' => $demoPickup,
        ];
        $path = '/api/v1/customer/bookings';
        $this->postJson($path, array_replace($payload, ['demo_expected_amount' => 1]))
            ->assertUnprocessable()->assertJsonValidationErrors('demo_expected_amount');
        $uuid = $this->postJson($path, $payload)->assertCreated()
            ->assertJsonPath('data.status', 'confirmed')
            ->assertJsonPath('data.payment.status', 'paid')
            ->assertJsonPath('data.payment.fund_status', 'held')
            ->assertJsonPath('data.whatsapp_url', null)->assertJsonPath('payment_url', null)
            ->json('data.uuid');
        $this->postJson($path, $payload)->assertCreated()->assertJsonPath('data.uuid', $uuid);
        return $uuid;
    }

    private function saveDestination(string $number = '0000001234'): void
    {
        $this->putJson(self::DESTINATION, [
            'type' => 'bank', 'provider' => 'BCA', 'number' => $number, 'holder' => 'Pemilik Demo',
        ])->assertOk()->assertJsonPath('data.number', $number);
    }
}
