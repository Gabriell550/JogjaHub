<?php

namespace Tests\Feature;

use App\Models\TenantProfile;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Laravel\Sanctum\Sanctum;
use Tests\TestCase;

class ConversationTest extends TestCase
{
    use RefreshDatabase;

    public function test_customer_and_tenant_exchange_messages_using_public_tenant_uuid(): void
    {
        $this->freezeTime();
        $customer = User::factory()->create(['role' => 'customer']);
        $tenant = TenantProfile::factory()->approved()->create();

        Sanctum::actingAs($customer);
        $first = $this->postJson('/api/v1/customer/conversations', ['tenant_uuid' => $tenant->uuid])
            ->assertCreated();
        $id = $first->json('data.id');

        $this->postJson('/api/v1/customer/conversations', ['tenant_id' => $tenant->user_id])
            ->assertCreated()
            ->assertJsonPath('data.id', $id);
        $this->postJson("/api/v1/customer/conversations/{$id}/messages", ['body' => 'Apakah jadwal tersedia?'])
            ->assertCreated()
            ->assertJsonPath('data.is_mine', true);

        Sanctum::actingAs($tenant->user);
        $this->getJson('/api/v1/tenant/conversations')
            ->assertOk()
            ->assertJsonPath('data.0.unread_count', 1);
        $this->getJson("/api/v1/tenant/conversations/{$id}/messages")
            ->assertOk()
            ->assertJsonPath('last_page', 1)
            ->assertJsonPath('data.0.is_mine', false);
        $this->patchJson("/api/v1/tenant/conversations/{$id}/read")->assertOk();
        $this->postJson("/api/v1/tenant/conversations/{$id}/messages", ['body' => 'Jadwal tersedia.'])
            ->assertCreated();

        Sanctum::actingAs($customer);
        $this->getJson("/api/v1/customer/conversations/{$id}/messages")
            ->assertOk()
            ->assertJsonPath('data.0.body', 'Jadwal tersedia.')
            ->assertJsonPath('data.0.is_mine', false);
    }
}
