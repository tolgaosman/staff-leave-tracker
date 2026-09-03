<?php

namespace Database\Factories;

use App\Models\LeaveRequest;
use App\Models\LeaveType;
use App\Models\Personnel;
use Illuminate\Database\Eloquent\Factories\Factory;

/**
 * @extends Factory<LeaveRequest>
 */
class LeaveRequestFactory extends Factory
{
    public function definition(): array
    {
        return [
            'personnel_id' => Personnel::factory(),
            'leave_type_id' => LeaveType::factory(),
            'start_date' => '2026-08-03', // Pazartesi
            'end_date' => '2026-08-05',   // Çarşamba
            'total_days' => 3,
            'note' => fake()->optional()->sentence(),
            'status' => 'pending',
        ];
    }
}
