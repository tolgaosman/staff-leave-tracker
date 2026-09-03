<?php

namespace App\Console\Commands;

use App\Models\Personnel;
use App\Support\LeaveRules;
use Illuminate\Console\Command;

/**
 * Yıl sonu devir (carry-forward) komutu.
 *
 * Kullanım: php artisan leave:carry-forward
 * Schedule: Her yılın 1 Ocak 00:05'inde otomatik çalışır (bkz. AppServiceProvider).
 *
 * Kural: Aktif her personelin yıl sonu kalan yıllık izin bakiyesinden en fazla 5 gün
 * devredilir. Kalan fazlalık yanar. Devreden gün sayısı mevcut devir bakiyesine eklenir,
 * ardından yeni yıl hak edişi sıfırdan hesaplanır.
 */
class LeaveCalculateAccruals extends Command
{
    protected $signature   = 'leave:carry-forward';
    protected $description = 'Carry forward up to 5 unused annual leave days to the next year for all active personnel.';

    /** Maksimum devredilebilecek gün sayısı. */
    private const CARRY_FORWARD_CAP = 5;

    public function handle(): int
    {
        $personnels = Personnel::where('status', 'active')->get();
        $count = 0;

        foreach ($personnels as $personnel) {
            $unused   = max(0, (int) $personnel->annual_leave_balance);
            $carryFwd = min($unused, self::CARRY_FORWARD_CAP);

            // Mevcut devir bakiyesine bu yılın devri eklenir (toplanır).
            $personnel->carried_over_balance = (int) $personnel->carried_over_balance + $carryFwd;

            // Yeni yıl hak edişi kıdeme göre hesaplanır.
            $personnel->annual_leave_balance = LeaveRules::annualEntitlement($personnel->start_date);

            $personnel->save();
            $count++;
        }

        $this->info("Carry-forward complete: {$count} personnel processed (cap: " . self::CARRY_FORWARD_CAP . " days).");

        return Command::SUCCESS;
    }
}
