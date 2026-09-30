<?php

namespace Tests\Feature;

use App\Models\Service;
use App\Models\TenantProfile;
use App\Models\User;
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

    public function test_show_service_404_jika_tidak_ada()
    {
        $response = $this->getJson('/api/v1/services/999999');

        $response->assertStatus(404);
    }
}
