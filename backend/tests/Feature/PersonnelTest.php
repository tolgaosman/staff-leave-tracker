<?php

namespace Tests\Feature;

use App\Models\Department;
use App\Models\Personnel;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Hash;
use Laravel\Sanctum\Sanctum;
use Tests\TestCase;

class PersonnelTest extends TestCase
{
    use RefreshDatabase;

    public function test_index_requires_authentication(): void
    {
        $this->getJson('/api/personnel')->assertStatus(401);
    }

    public function test_can_list_personnel_with_department_and_user(): void
    {
        Sanctum::actingAs(User::factory()->create(['is_admin' => true]));
        Personnel::factory()->create();

        $this->getJson('/api/personnel')
            ->assertOk()
            ->assertJsonStructure([['id', 'name', 'department' => ['id', 'name']]]);
    }

    public function test_non_admin_cannot_list_personnel(): void
    {
        Sanctum::actingAs(User::factory()->create(['is_admin' => false]));

        $this->getJson('/api/personnel')->assertStatus(403);
    }

    public function test_store_creates_personnel(): void
    {
        Sanctum::actingAs(User::factory()->create(['is_admin' => true]));
        $dept = Department::factory()->create();

        $this->postJson('/api/personnel', [
            'department_id' => $dept->id,
            'name' => 'Test Personel',
            'status' => 'active',
        ])->assertCreated()
            ->assertJsonPath('name', 'Test Personel');

        $this->assertDatabaseHas('personnels', ['name' => 'Test Personel']);
    }

    public function test_non_admin_cannot_store_personnel(): void
    {
        Sanctum::actingAs(User::factory()->create(['is_admin' => false]));
        $dept = Department::factory()->create();

        $this->postJson('/api/personnel', [
            'department_id' => $dept->id,
            'name' => 'Yetkisiz Deneme',
        ])->assertStatus(403);
    }

    public function test_store_with_email_creates_linked_login_account(): void
    {
        Sanctum::actingAs(User::factory()->create(['is_admin' => true]));
        $dept = Department::factory()->create();

        $response = $this->postJson('/api/personnel', [
            'department_id' => $dept->id,
            'name' => 'Çalışan Kişi',
            'email' => 'calisan@test.com',
        ])->assertCreated();

        // Bağlı kullanıcı oluştu ve personele bağlandı
        $this->assertDatabaseHas('users', ['email' => 'calisan@test.com']);
        $this->assertNotNull($response->json('user_id'));
        $this->assertSame('calisan@test.com', $response->json('user.email'));

        // Varsayılan şifreyle ('password') giriş yapılabilir olmalı (hash doğru kurulmuş mu)
        $created = User::where('email', 'calisan@test.com')->first();
        $this->assertTrue(Hash::check('password', $created->password));
    }

    public function test_store_validation_fails_without_department(): void
    {
        Sanctum::actingAs(User::factory()->create(['is_admin' => true]));

        $this->postJson('/api/personnel', ['name' => 'Eksik'])
            ->assertStatus(422)
            ->assertJsonValidationErrors('department_id');
    }

    public function test_update_personnel(): void
    {
        Sanctum::actingAs(User::factory()->create(['is_admin' => true]));
        $personnel = Personnel::factory()->create();

        $this->putJson("/api/personnel/{$personnel->id}", [
            'department_id' => $personnel->department_id,
            'name' => 'Güncellenmiş Ad',
        ])->assertOk()->assertJsonPath('name', 'Güncellenmiş Ad');
    }

    public function test_non_admin_cannot_update_personnel(): void
    {
        Sanctum::actingAs(User::factory()->create(['is_admin' => false]));
        $personnel = Personnel::factory()->create();

        $this->putJson("/api/personnel/{$personnel->id}", [
            'department_id' => $personnel->department_id,
            'name' => 'Yetkisiz Güncelleme',
        ])->assertStatus(403);
    }

    public function test_destroy_personnel(): void
    {
        Sanctum::actingAs(User::factory()->create(['is_admin' => true]));
        $personnel = Personnel::factory()->create();

        $this->deleteJson("/api/personnel/{$personnel->id}")->assertOk();
        $this->assertDatabaseMissing('personnels', ['id' => $personnel->id]);
    }

    public function test_non_admin_cannot_destroy_personnel(): void
    {
        Sanctum::actingAs(User::factory()->create(['is_admin' => false]));
        $personnel = Personnel::factory()->create();

        $this->deleteJson("/api/personnel/{$personnel->id}")->assertStatus(403);
        $this->assertDatabaseHas('personnels', ['id' => $personnel->id]);
    }
}
