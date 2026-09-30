<?php

namespace Tests\Feature\Admin;

use App\Models\TenantProfile;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class DashboardSummaryTest extends TestCase
{
    use RefreshDatabase;

    public function test_admin_dashboard_summary_includes_customer_and_tenant_totals(): void
    {
        $admin = User::factory()->create(['role' => 'admin']);
        User::factory()->count(2)->create(['role' => 'customer']);

        foreach (['pending', 'approved', 'rejected'] as $status) {
            $tenant = User::factory()->create(['role' => 'tenant']);
            TenantProfile::create([
                'user_id' => $tenant->id,
                'business_name' => "Tenant {$status}",
                'whatsapp_number' => '081234567890',
                'status' => $status,
            ]);
        }

        $response = $this->actingAs($admin, 'sanctum')->getJson('/api/v1/admin/dashboard/summary');

        $response->assertOk()
            ->assertJsonPath('data.customers_total', 2)
            ->assertJsonPath('data.tenants_total', 3);
    }
}