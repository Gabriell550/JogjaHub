<?php

namespace Tests\Feature;

use App\Models\TenantProfile;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Http\UploadedFile;
use Illuminate\Support\Facades\Storage;
use Tests\TestCase;

/**
 * Test suite untuk fitur upload foto profil.
 *
 * Customer: avatar opsional, bisa diupdate kapan saja
 * Tenant  : logo wajib saat submit profil pertama kali, tampil publik
 */
class ProfilePhotoTest extends TestCase
{
    use RefreshDatabase;

    // ─── Customer: GET profile ────────────────────────────────────────────────

    public function test_customer_bisa_lihat_profil_sendiri()
    {
        $customer = User::factory()->customer()->create();

        $response = $this->actingAs($customer)
            ->getJson('/api/v1/customer/profile');

        $response->assertStatus(200)
                 ->assertJsonPath('success', true)
                 ->assertJsonPath('data.id', $customer->id)
                 ->assertJsonPath('data.email', $customer->email)
                 // avatar_url null karena belum upload
                 ->assertJsonPath('data.avatar_url', null);
    }

    // ─── Customer: upload avatar ──────────────────────────────────────────────

    public function test_customer_bisa_upload_avatar()
    {
        Storage::fake('public');

        $customer = User::factory()->customer()->create();

        $response = $this->actingAs($customer)
            ->postJson('/api/v1/customer/profile', [
                'avatar' => UploadedFile::fake()->image('foto.jpg', 200, 200),
            ]);

        $response->assertStatus(200)
                 ->assertJsonPath('success', true);

        // avatar_url harus terisi (berupa full URL)
        $avatarUrl = $response->json('data.avatar_url');
        $this->assertNotNull($avatarUrl);
        $this->assertStringContainsString('/storage/avatars/', $avatarUrl);

        // File harus tersimpan di disk public
        $user = $customer->fresh();
        Storage::disk('public')->assertExists($user->avatar_url);
    }

    public function test_upload_avatar_baru_menghapus_avatar_lama()
    {
        Storage::fake('public');

        // Buat customer dengan avatar lama
        $oldPath  = 'avatars/old-avatar.jpg';
        Storage::disk('public')->put($oldPath, 'dummy');

        $customer = User::factory()->customer()->create(['avatar_url' => $oldPath]);

        $this->actingAs($customer)
            ->postJson('/api/v1/customer/profile', [
                'avatar' => UploadedFile::fake()->image('new-foto.jpg'),
            ])
            ->assertStatus(200);

        // Avatar lama harus dihapus
        Storage::disk('public')->assertMissing($oldPath);

        // Avatar baru harus ada
        $user = $customer->fresh();
        Storage::disk('public')->assertExists($user->avatar_url);
    }

    public function test_customer_bisa_update_profil_tanpa_avatar()
    {
        $customer = User::factory()->customer()->create(['name' => 'Budi Lama']);

        $response = $this->actingAs($customer)
            ->postJson('/api/v1/customer/profile', [
                'name' => 'Budi Baru',
            ]);

        $response->assertStatus(200)
                 ->assertJsonPath('data.name', 'Budi Baru');

        $this->assertDatabaseHas('users', [
            'id'   => $customer->id,
            'name' => 'Budi Baru',
        ]);
    }

    public function test_customer_tidak_bisa_akses_profil_tanpa_login()
    {
        $this->getJson('/api/v1/customer/profile')->assertStatus(401);
        $this->postJson('/api/v1/customer/profile', [])->assertStatus(401);
    }

    public function test_tenant_tidak_bisa_akses_customer_profile_endpoint()
    {
        $tenantUser = User::factory()->tenant()->create();

        $this->actingAs($tenantUser)
            ->getJson('/api/v1/customer/profile')
            ->assertStatus(403);
    }

    // ─── Tenant: logo wajib saat pertama daftar ───────────────────────────────

    public function test_tenant_baru_gagal_tanpa_logo()
    {
        Storage::fake('local');
        Storage::fake('public');

        $tenantUser = User::factory()->tenant()->create();
        $category   = \App\Models\Category::factory()->create();

        $response = $this->actingAs($tenantUser)
            ->putJson('/api/v1/tenant/profile', [
                'business_name'   => 'Kos Mawar',
                'address'         => ['street' => 'Jl. A', 'city' => 'Yogyakarta', 'province' => 'DI Yogyakarta'],
                'latitude'        => -7.79,
                'longitude'       => 110.36,
                'whatsapp_number' => '08123456789',
                'category_ids'    => [$category->id],
                'maps_embed_url'  => 'https://www.google.com/maps/embed?pb=!1m18FAKE',
                'ktp'             => UploadedFile::fake()->image('ktp.jpg'),
                'nib'             => UploadedFile::fake()->image('nib.jpg'),
                // sengaja tidak kirim logo
            ]);

        $response->assertStatus(422)
                 ->assertJsonValidationErrors(['logo']);
    }

    public function test_tenant_baru_berhasil_dengan_logo()
    {
        Storage::fake('local');
        Storage::fake('public');

        $tenantUser = User::factory()->tenant()->create();
        $category   = \App\Models\Category::factory()->create();

        $response = $this->actingAs($tenantUser)
            ->put('/api/v1/tenant/profile', [
                'business_name'   => 'Kos Mawar',
                'address'         => ['street' => 'Jl. A', 'city' => 'Yogyakarta', 'province' => 'DI Yogyakarta'],
                'latitude'        => -7.79,
                'longitude'       => 110.36,
                'whatsapp_number' => '08123456789',
                'category_ids'    => [$category->id],
                'maps_embed_url'  => 'https://www.google.com/maps/embed?pb=!1m18FAKE',
                'logo'            => UploadedFile::fake()->image('logo.jpg'),
                'ktp'             => UploadedFile::fake()->image('ktp.jpg'),
                'nib'             => UploadedFile::fake()->image('nib.jpg'),
            ], ['Accept' => 'application/json']);

        $response->assertStatus(200)
                 ->assertJsonPath('success', true);

        $profile = TenantProfile::where('user_id', $tenantUser->id)->first();

        // logo_url harus terisi
        $this->assertNotNull($profile->logo_url);

        // Logo harus ada di disk public
        Storage::disk('public')->assertExists($profile->logo_url);

        // logo_url di response berupa full URL (bukan path relatif)
        $logoInResponse = $response->json('data.logo_url');
        $this->assertStringContainsString('/storage/tenant_logos/', $logoInResponse);
    }

    public function test_tenant_lama_bisa_update_tanpa_logo_baru()
    {
        Storage::fake('local');
        Storage::fake('public');

        // Tenant sudah ada dan sudah punya logo
        $existingLogoPath = 'tenant_logos/existing-logo.jpg';
        Storage::disk('public')->put($existingLogoPath, 'dummy');

        $tenant   = TenantProfile::factory()->approved()->create(['logo_url' => $existingLogoPath]);
        $category = \App\Models\Category::factory()->create();

        // Update profil tanpa kirim logo baru → logo lama dipertahankan
        $response = $this->actingAs($tenant->user)
            ->put('/api/v1/tenant/profile', [
                'business_name'   => $tenant->business_name,
                'address'         => ['street' => 'Jl. B', 'city' => 'Yogyakarta', 'province' => 'DI Yogyakarta'],
                'latitude'        => -7.79,
                'longitude'       => 110.36,
                'whatsapp_number' => '08123456789',
                'category_ids'    => [$category->id],
                // tidak kirim logo → harus tetap 200
            ], ['Accept' => 'application/json']);

        $response->assertStatus(200);

        // logo_url di DB tidak berubah
        $this->assertDatabaseHas('tenant_profiles', [
            'id'       => $tenant->id,
            'logo_url' => $existingLogoPath,
        ]);
    }

    public function test_tenant_lama_bisa_ganti_logo()
    {
        Storage::fake('local');
        Storage::fake('public');

        $oldLogoPath = 'tenant_logos/old-logo.jpg';
        Storage::disk('public')->put($oldLogoPath, 'dummy');

        $tenant   = TenantProfile::factory()->approved()->create(['logo_url' => $oldLogoPath]);
        $category = \App\Models\Category::factory()->create();

        $this->actingAs($tenant->user)
            ->put('/api/v1/tenant/profile', [
                'business_name'   => $tenant->business_name,
                'address'         => ['street' => 'Jl. C', 'city' => 'Yogyakarta', 'province' => 'DI Yogyakarta'],
                'latitude'        => -7.79,
                'longitude'       => 110.36,
                'whatsapp_number' => '08123456789',
                'category_ids'    => [$category->id],
                'logo'            => UploadedFile::fake()->image('new-logo.jpg'),
            ], ['Accept' => 'application/json'])
            ->assertStatus(200);

        // Logo lama harus dihapus dari disk public
        Storage::disk('public')->assertMissing($oldLogoPath);

        // Logo baru harus ada
        $profile = $tenant->fresh();
        Storage::disk('public')->assertExists($profile->logo_url);
        $this->assertNotEquals($oldLogoPath, $profile->logo_url);
    }
}

