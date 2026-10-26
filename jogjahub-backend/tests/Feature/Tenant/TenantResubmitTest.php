<?php

namespace Tests\Feature\Tenant;

use App\Enums\VendorStatus;
use App\Models\TenantProfile;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Http\UploadedFile;
use Illuminate\Support\Facades\Storage;
use Tests\TestCase;

/**
 * Feature test untuk alur pengajuan ulang tenant yang ditolak (issue #59).
 */
class TenantResubmitTest extends TestCase
{
    use RefreshDatabase;

    private function rejectedTenant(): TenantProfile
    {
        return TenantProfile::factory()->rejected()->create([
            'ktp_url' => 'tenant_documents/ktp-lama.jpg',
            'nib_url' => 'tenant_documents/nib-lama.jpg',
        ]);
    }

    private function seedOldFiles(): void
    {
        Storage::disk('local')->put('tenant_documents/ktp-lama.jpg', 'isi ktp lama');
        Storage::disk('local')->put('tenant_documents/nib-lama.jpg', 'isi nib lama');
    }

    public function test_rejected_tenant_mengajukan_ulang_berhasil_menjadi_pending(): void
    {
        Storage::fake('local');
        $this->seedOldFiles();
        $tenant = $this->rejectedTenant();

        $response = $this->actingAs($tenant->user, 'sanctum')
            ->post('/api/v1/tenant/profile/resubmit', [
                'ktp' => UploadedFile::fake()->image('ktp-baru.jpg'),
            ], ['Accept' => 'application/json']);

        $response->assertOk()
            ->assertJsonPath('success', true)
            ->assertJsonPath('data.status', 'pending')
            ->assertJsonPath('data.rejection_reason', null);

        $tenant->refresh();

        // Status => pending + rejection_reason dihapus.
        $this->assertSame(VendorStatus::PENDING->value, $tenant->status);
        $this->assertNull($tenant->rejection_reason);

        // Dokumen baru tersimpan, file lama dihapus.
        $this->assertNotSame('tenant_documents/ktp-lama.jpg', $tenant->ktp_url);
        Storage::disk('local')->assertExists($tenant->ktp_url);
        Storage::disk('local')->assertMissing('tenant_documents/ktp-lama.jpg');

        // Dokumen yang TIDAK diunggah ulang tetap dipertahankan.
        $this->assertSame('tenant_documents/nib-lama.jpg', $tenant->nib_url);
        Storage::disk('local')->assertExists($tenant->nib_url);
    }

    public function test_rejected_tenant_tanpa_dokumen_ditolak_dan_status_tetap_rejected(): void
    {
        $tenant = $this->rejectedTenant();

        $response = $this->actingAs($tenant->user, 'sanctum')
            ->post('/api/v1/tenant/profile/resubmit', [], ['Accept' => 'application/json']);

        $response->assertStatus(422)
            ->assertJsonValidationErrors('documents');

        $tenant->refresh();
        $this->assertSame(VendorStatus::REJECTED->value, $tenant->status);
        $this->assertNotNull($tenant->rejection_reason);
    }

    public function test_upload_dokumen_tidak_valid_mengembalikan_error_dan_status_tetap_rejected(): void
    {
        Storage::fake('local');
        $this->seedOldFiles();
        $tenant = $this->rejectedTenant();

        $response = $this->actingAs($tenant->user, 'sanctum')
            ->post('/api/v1/tenant/profile/resubmit', [
                'ktp' => UploadedFile::fake()->create('ktp.txt', 100),
            ], ['Accept' => 'application/json']);

        $response->assertStatus(422);

        // Status dan dokumen lama tidak berubah.
        $tenant->refresh();
        $this->assertSame(VendorStatus::REJECTED->value, $tenant->status);
        $this->assertSame('tenant_documents/ktp-lama.jpg', $tenant->ktp_url);
        Storage::disk('local')->assertExists('tenant_documents/ktp-lama.jpg');
    }

    public function test_pending_tenant_tidak_bisa_mengajukan_ulang(): void
    {
        $tenant = TenantProfile::factory()->pending()->create();

        $response = $this->actingAs($tenant->user, 'sanctum')
            ->post('/api/v1/tenant/profile/resubmit', [
                'ktp' => UploadedFile::fake()->image('ktp.jpg'),
            ], ['Accept' => 'application/json']);

        $response->assertStatus(422);

        $tenant->refresh();
        $this->assertSame(VendorStatus::PENDING->value, $tenant->status);
    }

    public function test_approved_tenant_tidak_bisa_mengajukan_ulang(): void
    {
        $tenant = TenantProfile::factory()->approved()->create();

        $response = $this->actingAs($tenant->user, 'sanctum')
            ->post('/api/v1/tenant/profile/resubmit', [
                'ktp' => UploadedFile::fake()->image('ktp.jpg'),
            ], ['Accept' => 'application/json']);

        $response->assertStatus(422);

        $tenant->refresh();
        $this->assertSame(VendorStatus::APPROVED->value, $tenant->status);
    }
}
