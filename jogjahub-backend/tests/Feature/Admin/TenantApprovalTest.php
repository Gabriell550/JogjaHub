<?php

namespace Tests\Feature\Admin;

use App\Models\TenantProfile;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class TenantApprovalTest extends TestCase
{
    use RefreshDatabase;

    private function createTenantProfile(string $status = 'pending'): TenantProfile
    {
        $user = User::factory()->create(['role' => 'tenant']);

        return TenantProfile::create([
            'user_id'         => $user->id,
            'business_name'   => "Tenant {$status}",
            'whatsapp_number' => '081234567890',
            'status'          => $status,
        ]);
    }

    public function test_admin_can_list_pending_tenants(): void
    {
        $admin = User::factory()->create(['role' => 'admin']);
        $this->createTenantProfile('pending');
        $this->createTenantProfile('approved');

        $response = $this->actingAs($admin, 'sanctum')->getJson('/api/v1/admin/tenants/pending');

        $response->assertOk()
            ->assertJsonPath('success', true)
            ->assertJsonCount(1, 'data.data');
    }

    public function test_admin_can_approve_tenant_by_uuid(): void
    {
        $admin = User::factory()->create(['role' => 'admin']);
        $tenant = $this->createTenantProfile('pending');

        $response = $this->actingAs($admin, 'sanctum')
            ->patchJson("/api/v1/admin/tenants/{$tenant->uuid}/approve");

        $response->assertOk()
            ->assertJsonPath('success', true);

        $this->assertDatabaseHas('tenant_profiles', [
            'id'               => $tenant->id,
            'status'           => 'approved',
            'rejection_reason' => null,
        ]);
    }

    public function test_admin_can_reject_tenant_by_uuid_with_reason(): void
    {
        $admin = User::factory()->create(['role' => 'admin']);
        $tenant = $this->createTenantProfile('pending');

        $response = $this->actingAs($admin, 'sanctum')
            ->patchJson("/api/v1/admin/tenants/{$tenant->uuid}/reject", [
                'rejection_reason' => 'Dokumen tidak lengkap',
            ]);

        $response->assertOk()
            ->assertJsonPath('success', true);

        $this->assertDatabaseHas('tenant_profiles', [
            'id'               => $tenant->id,
            'status'           => 'rejected',
            'rejection_reason' => 'Dokumen tidak lengkap',
        ]);
    }

    public function test_non_admin_cannot_approve_tenant(): void
    {
        $customer = User::factory()->create(['role' => 'customer']);
        $tenant = $this->createTenantProfile('pending');

        $response = $this->actingAs($customer, 'sanctum')
            ->patchJson("/api/v1/admin/tenants/{$tenant->uuid}/approve");

        $response->assertForbidden();
    }
}