<?php

namespace Tests\Feature;

use App\Models\Department;
use App\Models\LeaveType;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Laravel\Sanctum\Sanctum;
use Tests\TestCase;

class ReferenceListTest extends TestCase
{
    use RefreshDatabase;

    public function test_departments_index_returns_list(): void
    {
        Sanctum::actingAs(User::factory()->create());
        Department::factory()->count(3)->create();

        $this->getJson('/api/departments')
            ->assertOk()
            ->assertJsonCount(3)
            ->assertJsonStructure([['id', 'name']]);
    }

    public function test_leave_types_index_includes_slug(): void
    {
        Sanctum::actingAs(User::factory()->create());
        LeaveType::factory()->create(['slug' => 'annual']);

        $this->getJson('/api/leave-types')
            ->assertOk()
            ->assertJsonPath('0.slug', 'annual');
    }

    public function test_reference_lists_require_authentication(): void
    {
        $this->getJson('/api/departments')->assertStatus(401);
        $this->getJson('/api/leave-types')->assertStatus(401);
    }
}
