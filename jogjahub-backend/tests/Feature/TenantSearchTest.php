<?php

namespace Tests\Feature;

use App\Models\Category;
use App\Models\Service;
use App\Models\Subcategory;
use App\Models\TenantProfile;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class TenantSearchTest extends TestCase
{
    use RefreshDatabase;

    public function test_search_filters_public_shops_by_active_service_category_without_requiring_coordinates(): void
    {
        $documentation = Category::factory()->create();
        $gifting = Category::factory()->create();
        $photo = Subcategory::factory()->for($documentation)->create();
        $gift = Subcategory::factory()->for($gifting)->create();
        $shop = TenantProfile::factory()->create([
            'business_name' => 'Studio Wisuda',
            'latitude' => null,
            'longitude' => null,
        ]);
        $shop->categories()->attach([$documentation->id, $gifting->id]);
        $keywordMatch = TenantProfile::factory()->create(['business_name' => 'A Studio']);
        $pending = TenantProfile::factory()->pending()->create();
        $inactiveOnly = TenantProfile::factory()->create(['business_name' => 'Studio Wisuda Lama']);

        Service::factory()->count(2)->for($shop, 'tenant')->for($photo)->create(['is_active' => true]);
        Service::factory()->for($shop, 'tenant')->for($gift)->create(['is_active' => true]);
        Service::factory()->for($keywordMatch, 'tenant')->for($photo)->create(['name' => 'Paket Studio Wisuda', 'is_active' => true]);
        Service::factory()->for($pending, 'tenant')->for($photo)->create(['name' => 'Studio Wisuda', 'is_active' => true]);
        Service::factory()->for($inactiveOnly, 'tenant')->for($photo)->create(['is_active' => false]);

        $this->getJson('/api/v1/tenants?' . http_build_query([
            'q' => 'studio  wisuda',
            'category_id' => $documentation->id,
            'page' => 1,
        ]))->assertOk()
            ->assertJsonCount(2, 'data')
            ->assertJsonCount(2, 'data.0.categories')
            ->assertJsonPath('data.0.uuid', $shop->uuid)
            ->assertJsonPath('data.1.uuid', $keywordMatch->uuid)
            ->assertJsonPath('meta.total', 2)
            ->assertJsonMissingPath('data.0.ktp_url');

        $this->getJson('/api/v1/tenants/' . $shop->uuid)
            ->assertOk()
            ->assertJsonCount(3, 'data.services');
    }
}
