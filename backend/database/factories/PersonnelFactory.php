<?php

namespace Database\Factories;

use App\Models\Department;
use App\Models\Personnel;
use Illuminate\Database\Eloquent\Factories\Factory;

/**
 * @extends Factory<Personnel>
 */
class PersonnelFactory extends Factory
{
    public function definition(): array
    {
        return [
            'department_id' => Department::factory(),
            'user_id' => null,
            'name' => fake()->firstName() . ' ' . fake()->lastName(),
            'phone' => fake()->numerify('05#########'),
            'status' => 'active',
            'start_date' => '2022-01-15',
            'avatar_url' => null,
        ];
    }
}
