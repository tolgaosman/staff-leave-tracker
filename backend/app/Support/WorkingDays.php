<?php

namespace App\Support;

use Carbon\Carbon;

/**
 * İzin taleplerinin iş günü (total_days) hesabını tek bir yerde tutar.
 * Hafta sonları VE Türkiye resmi tatilleri hariç tutulur.
 *
 * Frontend tarafındaki lib/date/business-days.ts (workingDayCount) ile aynı
 * kuralı uygular; böylece kaydedilen total_days ile arayüzde gösterilen gün
 * sayısı / bakiye düşümü örtüşür.
 */
class WorkingDays
{
    /**
     * 2026 Türkiye resmi tatilleri (yyyy-mm-dd).
     *
     * ÖNEMLİ: Bu liste frontend'deki lib/date/holidays.ts (publicHolidays2026 /
     * holidaySet2026) ile BİREBİR aynı tutulmalıdır; aksi halde iki taraf farklı
     * gün sayısı üretir. Milli bayramlar sabittir; dini bayram (Ramazan/Kurban)
     * tarihleri YAKLAŞIKTIR ve resmi takvimle doğrulanmalıdır. Yalnızca 2026
     * kapsanır — başka bir yıl için tarih eklemek gerekir.
     *
     * @var list<string>
     */
    public const HOLIDAYS_2026 = [
        '2026-01-01', // Yılbaşı
        '2026-03-19', // Ramazan Bayramı Arife
        '2026-03-20', // Ramazan Bayramı 1. Gün
        '2026-03-21', // Ramazan Bayramı 2. Gün
        '2026-03-22', // Ramazan Bayramı 3. Gün
        '2026-04-23', // Ulusal Egemenlik ve Çocuk Bayramı
        '2026-05-01', // Emek ve Dayanışma Günü
        '2026-05-19', // Atatürk'ü Anma, Gençlik ve Spor Bayramı
        '2026-05-26', // Kurban Bayramı Arife
        '2026-05-27', // Kurban Bayramı 1. Gün
        '2026-05-28', // Kurban Bayramı 2. Gün
        '2026-05-29', // Kurban Bayramı 3. Gün
        '2026-05-30', // Kurban Bayramı 4. Gün
        '2026-07-20', // Barış ve Özgürlük Bayramı
        '2026-08-01', // Toplumsal Direniş Bayramı
        '2026-08-30', // Zafer Bayramı
        '2026-10-29', // Cumhuriyet Bayramı
        '2026-11-15', // KKTC Cumhuriyet Bayramı
    ];

    /**
     * Verilen iki tarih (her ikisi de dahil) arasındaki iş günü sayısını döndürür.
     * Hafta sonları ve HOLIDAYS_2026 içindeki resmi tatiller sayılmaz.
     */
    public static function count(string $startDate, string $endDate): int
    {
        $date = Carbon::parse($startDate)->startOfDay();
        $end = Carbon::parse($endDate)->startOfDay();

        // O(1) arama için tatilleri anahtar olarak çevir
        $holidays = array_flip(self::HOLIDAYS_2026);

        $days = 0;
        while ($date->lte($end)) {
            if (! $date->isWeekend() && ! isset($holidays[$date->format('Y-m-d')])) {
                $days++;
            }
            $date->addDay();
        }

        return $days;
    }
}
