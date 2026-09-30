<?php

namespace Tests\Feature;

use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class AuthTest extends TestCase
{
    use RefreshDatabase;

    // ─── Register Customer ────────────────────────────────────────────────────

    public function test_customer_bisa_register()
    {
        $response = $this->postJson('/api/v1/auth/register/customer', [
            'name'                  => 'Budi Customer',
            'email'                 => 'budi@test.com',
            'password'              => 'password123',
            'password_confirmation' => 'password123',
            'phone'                 => '081234567890',
        ]);

        $response->assertStatus(201)
                 ->assertJsonPath('success', true)
                 ->assertJsonStructure(['data' => ['token']]);

        $this->assertDatabaseHas('users', [
            'email' => 'budi@test.com',
            'role'  => 'customer',
        ]);
    }

    public function test_register_customer_gagal_jika_email_duplikat()
    {
        User::factory()->customer()->create(['email' => 'budi@test.com']);

        $response = $this->postJson('/api/v1/auth/register/customer', [
            'name'                  => 'Budi Lain',
            'email'                 => 'budi@test.com',
            'password'              => 'password123',
            'password_confirmation' => 'password123',
            'phone'                 => '081234567890',
        ]);

        $response->assertStatus(422);
    }

    // ─── Register Tenant ──────────────────────────────────────────────────────

    public function test_tenant_bisa_register()
    {
        $response = $this->postJson('/api/v1/auth/register/tenant', [
            'name'                  => 'Sari Salon',
            'email'                 => 'sari@test.com',
            'password'              => 'password123',
            'password_confirmation' => 'password123',
            'phone'                 => '082345678901',
        ]);

        $response->assertStatus(201)
                 ->assertJsonPath('success', true);

        $this->assertDatabaseHas('users', [
            'email' => 'sari@test.com',
            'role'  => 'tenant',
        ]);
    }

    // ─── Login ────────────────────────────────────────────────────────────────

    public function test_customer_bisa_login()
    {
        User::factory()->customer()->create([
            'email'    => 'budi@test.com',
            'password' => bcrypt('password123'),
        ]);

        $response = $this->postJson('/api/v1/auth/login', [
            'email'    => 'budi@test.com',
            'password' => 'password123',
            'role'     => 'customer',
        ]);

        $response->assertStatus(200)
                 ->assertJsonPath('success', true)
                 ->assertJsonStructure(['data' => ['token', 'user']]);
    }

    public function test_login_gagal_jika_role_tidak_sesuai()
    {
        // User adalah customer tapi login dengan role tenant
        User::factory()->customer()->create([
            'email'    => 'budi@test.com',
            'password' => bcrypt('password123'),
        ]);

        $response = $this->postJson('/api/v1/auth/login', [
            'email'    => 'budi@test.com',
            'password' => 'password123',
            'role'     => 'tenant',  // ← salah role
        ]);

        // Controller throw ValidationException → 422 (bukan 403)
        $response->assertStatus(422)
                 ->assertJsonStructure(['errors']);
    }

    public function test_login_gagal_jika_password_salah()
    {
        User::factory()->customer()->create([
            'email'    => 'budi@test.com',
            'password' => bcrypt('password123'),
        ]);

        $response = $this->postJson('/api/v1/auth/login', [
            'email'    => 'budi@test.com',
            'password' => 'salahpassword',
            'role'     => 'customer',
        ]);

        // Controller throw ValidationException → 422 (bukan 401)
        $response->assertStatus(422)
                 ->assertJsonStructure(['errors']);
    }


    // ─── Logout ───────────────────────────────────────────────────────────────

    public function test_user_bisa_logout()
    {
        // actingAs() pakai TransientToken yang tidak bisa di-delete
        // Harus login via API dulu untuk dapat token sungguhan
        User::factory()->customer()->create([
            'email'    => 'logout@test.com',
            'password' => bcrypt('password123'),
        ]);

        $loginResponse = $this->postJson('/api/v1/auth/login', [
            'email'    => 'logout@test.com',
            'password' => 'password123',
            'role'     => 'customer',
        ]);

        $token = $loginResponse->json('data.token');

        $response = $this->withToken($token)
                         ->postJson('/api/v1/auth/logout');

        $response->assertStatus(200)
                 ->assertJsonPath('success', true);
    }

    public function test_logout_gagal_tanpa_token()
    {
        $response = $this->postJson('/api/v1/auth/logout');

        $response->assertStatus(401);
    }
}
