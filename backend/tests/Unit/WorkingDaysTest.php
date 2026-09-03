<?php

namespace Tests\Unit;

use App\Support\WorkingDays;
use PHPUnit\Framework\TestCase;

class WorkingDaysTest extends TestCase
{
    /**
     * Test Ramazan Bayramı dates are excluded from working days calculation.
     */
    public function test_ramazan_bayrami_is_excluded_from_working_days(): void
    {
        // 2026-03-19 (Thu - Arife), 2026-03-20 (Fri - 1st Day), 2026-03-21 (Sat), 2026-03-22 (Sun)
        // From 2026-03-18 (Wed) to 2026-03-23 (Mon)
        // Working days: 2026-03-18 (Wed) and 2026-03-23 (Mon) = 2 days
        $days = WorkingDays::count('2026-03-18', '2026-03-23');

        $this->assertEquals(2, $days);
    }

    /**
     * Test Kurban Bayramı dates are excluded from working days calculation.
     */
    public function test_kurban_bayrami_is_excluded_from_working_days(): void
    {
        // 2026-05-26 (Tue - Arife) to 2026-05-30 (Sat)
        // From 2026-05-25 (Mon) to 2026-06-01 (Mon)
        // Working days: 2026-05-25 (Mon) and 2026-06-01 (Mon) = 2 days
        $days = WorkingDays::count('2026-05-25', '2026-06-01');

        $this->assertEquals(2, $days);
    }
}
