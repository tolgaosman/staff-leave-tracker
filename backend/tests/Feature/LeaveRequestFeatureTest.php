<?php

namespace Tests\Feature;

use App\Mail\LeaveRequestStatusUpdated;
use App\Models\Department;
use App\Models\LeaveRequest;
use App\Models\LeaveType;
use App\Models\Personnel;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Mail;
use Illuminate\Support\Facades\Storage;
use Tests\TestCase;

class LeaveRequestFeatureTest extends TestCase
{
    use RefreshDatabase;

    protected function setUp(): void
    {
        parent::setUp();
        
        $this->department = Department::create(['name' => 'IT']);
        $this->leaveType = LeaveType::create(['name' => 'Yıllık', 'slug' => 'annual', 'requires_document' => false]);
        
        $this->user = User::factory()->create(['is_admin' => false]);
        $this->admin = User::factory()->create(['is_admin' => true]);
        
        $this->personnel = Personnel::create([
            'user_id' => $this->user->id,
            'department_id' => $this->department->id,
            'name' => 'Test User',
            'status' => 'active',
            'start_date' => now()->subYears(2),
        ]);
    }

    public function test_user_can_create_leave_request()
    {
        Storage::fake('public');

        $response = $this->actingAs($this->user)->postJson('/api/leave-requests', [
            'personnel_id' => $this->personnel->id,
            'leave_type_id' => $this->leaveType->id,
            'start_date' => '2026-08-03',
            'end_date' => '2026-08-04',
            'note' => 'Test',
            'attachment_url' => 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNkYAAAAAYAAjCB0C8AAAAASUVORK5CYII=',
        ]);

        $response->assertStatus(201);
        $this->assertDatabaseHas('leave_requests', [
            'personnel_id' => $this->personnel->id,
            'status' => 'pending',
            'total_days' => 2,
        ]);

        $leaveRequest = LeaveRequest::first();
        $this->assertStringContainsString('attachments/', $leaveRequest->getRawOriginal('attachment_url'));
        Storage::disk('public')->assertExists($leaveRequest->getRawOriginal('attachment_url'));
    }

    public function test_admin_can_approve_leave_request_and_mail_is_sent()
    {
        Mail::fake();

        $leaveRequest = LeaveRequest::create([
            'personnel_id' => $this->personnel->id,
            'leave_type_id' => $this->leaveType->id,
            'start_date' => '2026-08-03',
            'end_date' => '2026-08-04',
            'total_days' => 2,
            'status' => 'pending',
        ]);

        $response = $this->actingAs($this->admin)->patchJson("/api/leave-requests/{$leaveRequest->id}/approve");

        $response->assertStatus(200);
        $this->assertDatabaseHas('leave_requests', [
            'id' => $leaveRequest->id,
            'status' => 'approved',
            'decided_by' => $this->admin->id,
        ]);

        Mail::assertSent(LeaveRequestStatusUpdated::class, function ($mail) use ($leaveRequest) {
            return $mail->hasTo($this->user->email) && $mail->leaveRequest->id === $leaveRequest->id;
        });
    }

    public function test_admin_can_reject_leave_request_with_reason()
    {
        Mail::fake();

        $leaveRequest = LeaveRequest::create([
            'personnel_id' => $this->personnel->id,
            'leave_type_id' => $this->leaveType->id,
            'start_date' => '2026-08-03',
            'end_date' => '2026-08-04',
            'total_days' => 2,
            'status' => 'pending',
        ]);

        $response = $this->actingAs($this->admin)->patchJson("/api/leave-requests/{$leaveRequest->id}/reject", [
            'rejection_reason' => 'Eksik belge',
        ]);

        $response->assertStatus(200);
        $this->assertDatabaseHas('leave_requests', [
            'id' => $leaveRequest->id,
            'status' => 'rejected',
            'rejection_reason' => 'Eksik belge',
            'decided_by' => $this->admin->id,
        ]);

        Mail::assertSent(LeaveRequestStatusUpdated::class);
    }
}

