<?php

namespace Tests\Feature;

use App\Models\Category;
use App\Models\Service;
use App\Models\TenantProfile;
use App\Models\User;
use App\Models\Subcategory;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class ServiceTest extends TestCase
{
    use RefreshDatabase;

    // ─── List Services ────────────────────────────────────────────────────────

    public function test_list_services_bisa_diakses_publik()
    {
        TenantProfile::factory()->approved()->count(3)->create()
            ->each(fn ($tenant) => Service::factory()->create(['tenant_id' => $tenant->id]));

        $response = $this->getJson('/api/v1/services');

        $response->assertStatus(200)
                 ->assertJsonPath('success', true)
                 ->assertJsonStructure(['data', 'success']);
    }

    public function test_list_services_hanya_tampilkan_tenant_approved()
    {
        $approvedTenant = TenantProfile::factory()->approved()->create();
        $pendingTenant  = TenantProfile::factory()->pending()->create();

        Service::factory()->create(['tenant_id' => $approvedTenant->id, 'name' => 'Layanan Approved']);
        Service::factory()->create(['tenant_id' => $pendingTenant->id,  'name' => 'Layanan Pending']);

        $response = $this->getJson('/api/v1/services');

        // Ambil array data — bisa flat array atau paginated
        $items = $response->json('data.data') ?? $response->json('data') ?? [];
        $this->assertCount(1, $items);
        $this->assertEquals('Layanan Approved', $items[0]['name']);
    }

    // ─── Search ───────────────────────────────────────────────────────────────

    public function test_search_service_by_nama()
    {
        $tenant = TenantProfile::factory()->approved()->create();

        Service::factory()->create(['tenant_id' => $tenant->id, 'name' => 'Salon Rambut Premium']);
        Service::factory()->create(['tenant_id' => $tenant->id, 'name' => 'Pijat Refleksi']);
        Service::factory()->create(['tenant_id' => $tenant->id, 'name' => 'Salon Kuku Cantik']);

        $response = $this->getJson('/api/v1/services?q=salon');

        $items = $response->json('data.data') ?? $response->json('data') ?? [];
        $this->assertCount(2, $items); // "Salon Rambut" dan "Salon Kuku"
    }

    public function test_search_service_by_deskripsi()
    {
        $tenant = TenantProfile::factory()->approved()->create();

        Service::factory()->create([
            'tenant_id'   => $tenant->id,
            'name'        => 'Layanan A',
            'description' => 'Perawatan wajah terbaik',
        ]);
        Service::factory()->create([
            'tenant_id'   => $tenant->id,
            'name'        => 'Layanan B',
            'description' => 'Pijat badan relaksasi',
        ]);

        $response = $this->getJson('/api/v1/services?q=wajah');

        $items = $response->json('data.data') ?? $response->json('data') ?? [];
        $this->assertCount(1, $items);
    }

    public function test_search_tidak_ketemu_return_kosong()
    {
        $tenant = TenantProfile::factory()->approved()->create();
        Service::factory()->create(['tenant_id' => $tenant->id, 'name' => 'Salon Rambut']);

        $response = $this->getJson('/api/v1/services?q=tidakadahasilnya');

        $items = $response->json('data.data') ?? $response->json('data') ?? [];
        $this->assertCount(0, $items);
    }


    // ─── Show Service ─────────────────────────────────────────────────────────

    public function test_show_service_detail()
    {
        $tenant  = TenantProfile::factory()->approved()->create();
        $service = Service::factory()->create(['tenant_id' => $tenant->id]);

        $response = $this->getJson("/api/v1/services/{$service->id}");

        $response->assertStatus(200)
                 ->assertJsonPath('success', true)
                 ->assertJsonPath('data.id', $service->id);
    }

    public function test_public_tenant_includes_bookable_services_and_slot_requirement(): void
    {
        $tenant = TenantProfile::factory()->approved()->create();
        $subcategory = Subcategory::factory()->create(['requires_time_slot' => true]);
        $service = Service::factory()->create(['tenant_id' => $tenant->id, 'subcategory_id' => $subcategory->id]);

        $this->getJson("/api/v1/tenants/{$tenant->uuid}")
            ->assertOk()
            ->assertJsonPath('data.services.0.id', $service->id)
            ->assertJsonPath('data.services.0.subcategory.requires_time_slot', true);

        $this->getJson("/api/v1/services/{$service->id}")
            ->assertOk()
            ->assertJsonPath('data.tenant.uuid', $tenant->uuid)
            ->assertJsonPath('data.subcategory.requires_time_slot', true);
    }

    public function test_catalog_filters_per_night_services(): void
    {
        $tenant = TenantProfile::factory()->approved()->create();
        Service::factory()->create(['tenant_id' => $tenant->id, 'price_type' => 'per_session']);
        $hotel = Service::factory()->create(['tenant_id' => $tenant->id, 'price_type' => 'per_night']);

        $this->getJson('/api/v1/services?price_type=per_night')
            ->assertOk()
            ->assertJsonCount(1, 'data')
            ->assertJsonPath('data.0.id', $hotel->id)
            ->assertJsonPath('meta.last_page', 1);
    }

    public function test_tenant_can_hide_and_republish_a_service(): void
    {
        $tenant = TenantProfile::factory()->approved()->create();
        $customer = User::factory()->customer()->create();
        $service = Service::factory()->create(['tenant_id' => $tenant->id]);
        $url = "/api/v1/services/{$service->id}";

        $this->actingAs($tenant->user)->putJson("/api/v1/tenant/services/{$service->id}", ['is_active' => false])
            ->assertOk()
            ->assertJsonPath('data.is_active', false);

        $this->getJson('/api/v1/services')->assertJsonCount(0, 'data');
        $this->getJson("/api/v1/tenants/{$tenant->uuid}")->assertJsonCount(0, 'data.services');
        $this->getJson($url)->assertNotFound();
        $this->getJson($url . '/slots')->assertNotFound();
        $this->actingAs($customer)->postJson('/api/v1/customer/bookings', ['service_id' => $service->id])
            ->assertUnprocessable();

        $this->actingAs($tenant->user)->putJson("/api/v1/tenant/services/{$service->id}", ['is_active' => true])
            ->assertOk();
        $this->getJson($url)->assertOk();
    }

    public function test_hotel_catalog_includes_flat_rate_lodging_and_nightly_services(): void
    {
        $tenant = TenantProfile::factory()->approved()->create();
        $category = Category::factory()->create(['name' => 'Penginapan']);
        $room = Subcategory::factory()->create(['category_id' => $category->id]);
        $hotel = Service::factory()->create([
            'tenant_id' => $tenant->id,
            'subcategory_id' => $room->id,
            'price_type' => 'per_session',
        ]);
        Service::factory()->create(['tenant_id' => $tenant->id, 'price_type' => 'per_night']);
        Service::factory()->create(['tenant_id' => $tenant->id, 'price_type' => 'per_session']);

        $this->getJson('/api/v1/services?accommodation=true')
            ->assertOk()
            ->assertJsonCount(2, 'data')
            ->assertJsonPath('data.0.id', $hotel->id)
            ->assertJsonPath('data.0.is_accommodation', true);
    }

    public function test_show_service_404_jika_tidak_ada()
    {
        $response = $this->getJson('/api/v1/services/999999');

        $response->assertStatus(404);
    }
}
