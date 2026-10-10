<?php

namespace Tests\Feature;

use App\Models\Category;
use App\Models\Service;
use App\Models\Subcategory;
use App\Models\TenantProfile;
use App\Models\TimeSlot;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Http\UploadedFile;
use Illuminate\Support\Facades\Storage;
use Tests\TestCase;

/**
 * Regression test untuk celah keamanan yang ditemukan saat audit (Okt 2026):
 *  #1 Dokumen KTP/NIB tenant bisa diakses publik
 *  #2 slot_id tidak dicek milik service yang dibooking
 */
class SecurityTest extends TestCase
{
    use RefreshDatabase;

    // ─── #1 Dokumen tenant tidak boleh bocor ke publik ─────────────────────────

    public function test_detail_tenant_publik_tidak_menampilkan_dokumen_pribadi()
    {
        $tenant = TenantProfile::factory()->approved()->create();

        $response = $this->getJson("/api/v1/tenants/{$tenant->uuid}");

        $response->assertStatus(200)
                 ->assertJsonMissingPath('data.ktp_url')
                 ->assertJsonMissingPath('data.nib_url')
                 ->assertJsonMissingPath('data.portfolio_url')
                 ->assertJsonMissingPath('data.rejection_reason');
    }

    public function test_list_service_publik_tidak_membocorkan_dokumen_tenant()
    {
        $tenant = TenantProfile::factory()->approved()->create();
        Service::factory()->create(['tenant_id' => $tenant->id]);

        $response = $this->getJson('/api/v1/services');

        $response->assertStatus(200);
        $this->assertStringNotContainsString('ktp_url', $response->getContent());
        $this->assertStringNotContainsString('nib_url', $response->getContent());
    }

    public function test_customer_login_juga_tidak_bisa_lihat_dokumen_tenant()
    {
        $customer = User::factory()->customer()->create();
        $tenant   = TenantProfile::factory()->approved()->create();
        Service::factory()->create(['tenant_id' => $tenant->id]);

        $response = $this->actingAs($customer)->getJson('/api/v1/services');

        $this->assertStringNotContainsString('ktp_url', $response->getContent());
    }

    public function test_tenant_pemilik_bisa_lihat_dokumennya_sendiri()
    {
        $tenant = TenantProfile::factory()->approved()->create();

        $response = $this->actingAs($tenant->user)->getJson('/api/v1/tenant/profile');

        $response->assertStatus(200)
                 ->assertJsonPath('data.ktp_url', $tenant->ktp_url);
    }

    public function test_admin_bisa_lihat_path_dokumen_tenant_pending()
    {
        $admin  = User::factory()->admin()->create();
        $tenant = TenantProfile::factory()->pending()->create();

        $response = $this->actingAs($admin)->getJson('/api/v1/admin/tenants/pending');

        $response->assertStatus(200)
                 ->assertJsonPath('data.0.ktp_url', $tenant->ktp_url)
                 ->assertJsonPath('data.0.nib_url', $tenant->nib_url);
    }

    public function test_upload_dokumen_disimpan_di_disk_private_bukan_public()
    {
        /** @var \Illuminate\Support\Testing\Fakes\StorageFake $localDisk */
        $localDisk  = Storage::fake('local');
        /** @var \Illuminate\Support\Testing\Fakes\StorageFake $publicDisk */
        $publicDisk = Storage::fake('public');

        $tenantUser = User::factory()->tenant()->create();
        $category   = Category::factory()->create();

        $response = $this->actingAs($tenantUser)->put('/api/v1/tenant/profile', [
            'business_name'   => 'Salon Test',
            'address'         => [
                'street'   => 'Jl. Malioboro 1',
                'city'     => 'Yogyakarta',
                'province' => 'DI Yogyakarta',
            ],
            'latitude'        => -7.79,
            'longitude'       => 110.36,
            'whatsapp_number' => '081234567890',
            'category_ids'    => [$category->id],
            'ktp'             => UploadedFile::fake()->image('ktp.jpg'),
            'nib'             => UploadedFile::fake()->image('nib.jpg'),
        ], ['Accept' => 'application/json']);

        $response->assertStatus(200);

        $profile = TenantProfile::where('user_id', $tenantUser->id)->first();

        $localDisk->assertExists($profile->ktp_url);
        $localDisk->assertExists($profile->nib_url);
        $publicDisk->assertMissing($profile->ktp_url);
    }

    public function test_upload_ulang_ktp_menghapus_file_lama()
    {
        /** @var \Illuminate\Support\Testing\Fakes\StorageFake $localDisk */
        $localDisk = Storage::fake('local');

        $tenant  = TenantProfile::factory()->approved()->create(['ktp_url' => 'tenant_documents/lama.jpg']);
        $localDisk->put('tenant_documents/lama.jpg', 'isi lama');
        $category = Category::factory()->create();

        $this->actingAs($tenant->user)->put('/api/v1/tenant/profile', [
            'business_name'   => $tenant->business_name,
            'address'         => ['street' => 'Jl. A', 'city' => 'Yogyakarta', 'province' => 'DI Yogyakarta'],
            'latitude'        => -7.79,
            'longitude'       => 110.36,
            'whatsapp_number' => '081234567890',
            'category_ids'    => [$category->id],
            'ktp'             => UploadedFile::fake()->image('ktp-baru.jpg'),
        ], ['Accept' => 'application/json'])->assertStatus(200);

        $localDisk->assertMissing('tenant_documents/lama.jpg');
        $localDisk->assertExists($tenant->fresh()->ktp_url);
    }

    public function test_admin_bisa_download_dokumen_tenant()
    {
        /** @var \Illuminate\Support\Testing\Fakes\StorageFake $localDisk */
        $localDisk = Storage::fake('local');
        $localDisk->put('tenant_documents/ktp.jpg', 'isi-ktp');

        $admin  = User::factory()->admin()->create();
        $tenant = TenantProfile::factory()->pending()->create(['ktp_url' => 'tenant_documents/ktp.jpg']);

        $response = $this->actingAs($admin)->get("/api/v1/admin/tenants/{$tenant->uuid}/documents/ktp");

        $response->assertStatus(200);
        $this->assertSame('isi-ktp', $response->streamedContent());
    }

    public function test_customer_tidak_bisa_download_dokumen_tenant()
    {
        $customer = User::factory()->customer()->create();
        $tenant   = TenantProfile::factory()->pending()->create();

        $this->actingAs($customer)
             ->getJson("/api/v1/admin/tenants/{$tenant->uuid}/documents/ktp")
             ->assertStatus(403);
    }

    public function test_tanpa_login_tidak_bisa_download_dokumen_tenant()
    {
        $tenant = TenantProfile::factory()->pending()->create();

        $this->getJson("/api/v1/admin/tenants/{$tenant->uuid}/documents/ktp")
             ->assertStatus(401);
    }

    public function test_download_dokumen_yang_tidak_ada_return_404()
    {
        Storage::fake('local');

        $admin  = User::factory()->admin()->create();
        $tenant = TenantProfile::factory()->pending()->create(['portfolio_url' => null]);

        $this->actingAs($admin)
             ->getJson("/api/v1/admin/tenants/{$tenant->uuid}/documents/portfolio")
             ->assertStatus(404);
    }

    // ─── #2 Slot harus milik service yang dibooking ────────────────────────────

    public function test_booking_gagal_jika_slot_milik_service_lain()
    {
        $customer    = User::factory()->customer()->create();
        $subcategory = Subcategory::factory()->requiresSlot()->create();

        $tenantA  = TenantProfile::factory()->approved()->create();
        $serviceA = Service::factory()->create(['tenant_id' => $tenantA->id, 'subcategory_id' => $subcategory->id]);

        $tenantB  = TenantProfile::factory()->approved()->create();
        $serviceB = Service::factory()->create(['tenant_id' => $tenantB->id, 'subcategory_id' => $subcategory->id]);
        $slotB    = TimeSlot::factory()->create(['service_id' => $serviceB->id, 'quota' => 5, 'booked_count' => 0]);

        // Booking service A tapi pakai slot milik service B
        $response = $this->actingAs($customer)->postJson('/api/v1/customer/bookings', [
            'service_id'     => $serviceA->id,
            'slot_id'        => $slotB->id,
            'payment_method' => 'transfer',
        ]);

        $response->assertStatus(422)->assertJsonValidationErrors('slot_id');

        // Kuota tenant B tidak boleh berkurang, dan tidak ada booking tercipta
        $this->assertDatabaseHas('time_slots', ['id' => $slotB->id, 'booked_count' => 0]);
        $this->assertDatabaseCount('bookings', 0);
    }
}
