<?php

namespace Tests\Feature;

use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class AuthTest extends TestCase
{
    use RefreshDatabase;

    public function test_login_with_valid_credentials_returns_token_and_user(): void
    {
        $user = User::factory()->create(['password' => 'secret123']);

        $response = $this->postJson('/api/login', [
            'email' => $user->email,
            'password' => 'secret123',
        ]);

        $response->assertOk()
            ->assertJsonStructure(['token', 'user' => ['id', 'email']]);
    }

    public function test_login_with_invalid_credentials_returns_401(): void
    {
        $user = User::factory()->create(['password' => 'secret123']);

        $this->postJson('/api/login', [
            'email' => $user->email,
            'password' => 'wrong-password',
        ])->assertStatus(401);
    }

    public function test_unauthenticated_request_returns_json_401(): void
    {
        $this->getJson('/api/me')
            ->assertStatus(401)
            ->assertJsonStructure(['message']);
    }

    public function test_logout_revokes_current_token(): void
    {
        // Gerçek SPA yalnızca Bearer token gönderir (oturum çerezi değil); bu yüzden
        // token'ı doğrudan üretip öyle kullanıyoruz — /login çağırıp test istemcisinin
        // oturum çerezini taşımasından kaçınıyoruz (aksi halde guard token yerine
        // web oturumunu görür).
        $user = User::factory()->create();
        $token = $user->createToken('api-token')->plainTextToken;

        $this->assertCount(1, $user->tokens()->get());

        $this->withHeader('Authorization', 'Bearer '.$token)
            ->postJson('/api/logout')
            ->assertOk();

        $this->assertCount(0, $user->fresh()->tokens()->get());
    }
}
