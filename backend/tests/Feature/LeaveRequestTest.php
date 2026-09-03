<?php

namespace Tests\Feature;

use App\Models\LeaveRequest;
use App\Models\LeaveType;
use App\Models\Personnel;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Laravel\Sanctum\Sanctum;
use Tests\TestCase;

class LeaveRequestTest extends TestCase
{
    use RefreshDatabase;

    public function test_store_autocomputes_total_days_excluding_weekends_and_holidays(): void
    {
        Sanctum::actingAs(User::factory()->create(['is_admin' => true]));
        $personnel = Personnel::factory()->create(['start_date' => '2020-01-01']);
        $type = LeaveType::factory()->create([
            'slug' => 'annual',
            'requires_document' => false,
        ]);

        // 22 Nis (Çar) - 24 Nis (Cum); 23 Nis resmi tatil => yalnızca Çar + Cum = 2 iş günü
        $response = $this->postJson('/api/leave-requests', [
            'personnel_id' => $personnel->id,
            'leave_type_id' => $type->id,
            'start_date' => '2026-04-22',
            'end_date' => '2026-04-24',
        ])->assertCreated();

        $response->assertJsonPath('total_days', 2)
            ->assertJsonPath('status', 'pending');
    }

    public function test_approve_stamps_status_and_decider(): void
    {
        $admin = User::factory()->create(['is_admin' => true]);
        Sanctum::actingAs($admin);
        $leave = LeaveRequest::factory()->create(['status' => 'pending']);

        $this->patchJson("/api/leave-requests/{$leave->id}/approve")
            ->assertOk()
            ->assertJsonPath('status', 'approved')
            ->assertJsonPath('decided_by', $admin->id);

        $this->assertNotNull($leave->fresh()->decided_at);
    }

    public function test_reject_requires_reason(): void
    {
        Sanctum::actingAs(User::factory()->create(['is_admin' => true]));
        $leave = LeaveRequest::factory()->create(['status' => 'pending']);

        $this->patchJson("/api/leave-requests/{$leave->id}/reject", [])
            ->assertStatus(422)
            ->assertJsonValidationErrors('rejection_reason');
    }

    public function test_reject_sets_status_and_reason(): void
    {
        $admin = User::factory()->create(['is_admin' => true]);
        Sanctum::actingAs($admin);
        $leave = LeaveRequest::factory()->create(['status' => 'pending']);

        $this->patchJson("/api/leave-requests/{$leave->id}/reject", [
            'rejection_reason' => 'Uygun görülmedi.',
        ])->assertOk()
            ->assertJsonPath('status', 'rejected')
            ->assertJsonPath('rejection_reason', 'Uygun görülmedi.');
    }

    public function test_non_admin_cannot_approve_or_reject(): void
    {
        Sanctum::actingAs(User::factory()->create(['is_admin' => false]));
        $leave = LeaveRequest::factory()->create(['status' => 'pending']);

        $this->patchJson("/api/leave-requests/{$leave->id}/approve")->assertStatus(403);
        $this->patchJson("/api/leave-requests/{$leave->id}/reject", [
            'rejection_reason' => 'Yetkisiz',
        ])->assertStatus(403);
    }
}
