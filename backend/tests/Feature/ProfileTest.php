<?php

namespace Tests\Feature;

use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Laravel\Sanctum\Sanctum;
use Tests\TestCase;

class ProfileTest extends TestCase
{
    use RefreshDatabase;

    public function test_update_profile_persists_fields(): void
    {
        $user = User::factory()->create();
        Sanctum::actingAs($user);

        $this->putJson('/api/me', [
            'title' => 'Yazılım Mühendisi',
            'phone' => '05551112233',
            'location' => 'İstanbul',
            'bio' => 'Kısa özgeçmiş.',
            'birth_date' => '1990-05-20',
        ])->assertOk()
            ->assertJsonPath('title', 'Yazılım Mühendisi');

        $this->assertDatabaseHas('users', [
            'id' => $user->id,
            'title' => 'Yazılım Mühendisi',
            'location' => 'İstanbul',
        ]);
    }

    public function test_update_profile_requires_authentication(): void
    {
        $this->putJson('/api/me', ['title' => 'X'])->assertStatus(401);
    }
}
