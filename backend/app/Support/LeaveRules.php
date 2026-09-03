<?php

namespace App\Support;

use App\Models\LeaveRequest;
use App\Models\LeaveType;
use App\Models\Personnel;
use Carbon\Carbon;

/**
 * Sunucu tarafında izin talebi kuralları — frontend'deki lib/data/balance.ts
 * (yıllık izin hakkı) ve leave-dialog.tsx (bakiye/belge/çakışma kontrolleri)
 * ile AYNI kuralları uygular. Frontend kontrolleri yalnızca UI'yı korur;
 * doğrudan API çağrılarının bu kuralları atlamaması için burada da uygulanır.
 */
class LeaveRules
{
    /**
     * Kıdeme göre yıllık izin hakkı (Türk İş Kanunu md. 53 kademeleri):
     *   1–5 yıl (dahil)  → 14 gün
     *   5–15 yıl arası   → 20 gün
     *   15 yıl ve üzeri  → 26 gün
     * lib/data/balance.ts::annualEntitlement ile birebir aynı mantık.
     */
    public static function annualEntitlement(?string $startDate): int
    {
        if (empty($startDate)) {
            return 14;
        }

        $start = Carbon::parse($startDate);
        $years = (int) floor($start->diffInDays(now()) / 365.25);

        if ($years >= 15) {
            return 26;
        }
        if ($years >= 5) {
            return 20;
        }

        return 14;
    }

    /**
     * Onaylanan bir YILLIK izni bakiyeden düşer. Önce devreden (carried_over)
     * bakiye tüketilir, yetmezse kalan kısım yıllık haktan düşülür.
     *
     * DİKKAT: Yalnızca "approved OLMAYAN -> approved" GEÇİŞİNDE çağrılmalıdır.
     * Zaten onaylı bir talep için tekrar çağrılırsa bakiye iki kez düşer — bir
     * personelin bakiyesini -1'e indiren hata tam olarak buydu.
     */
    public static function deductAnnual(Personnel $personnel, int $days): void
    {
        if ($days <= 0) {
            return;
        }

        if ($personnel->carried_over_balance >= $days) {
            $personnel->carried_over_balance -= $days;
        } else {
            $rem = $days - $personnel->carried_over_balance;
            $personnel->carried_over_balance = 0;
            $personnel->annual_leave_balance -= $rem;
        }

        $personnel->save();
    }

    /**
     * Onayı kaldırılan/reddedilen/silinen bir YILLIK iznin günlerini iade eder.
     * Yalnızca "approved -> (pending|rejected|silindi)" geçişinde çağrılmalıdır.
     */
    public static function refundAnnual(Personnel $personnel, int $days): void
    {
        if ($days <= 0) {
            return;
        }

        $personnel->annual_leave_balance += $days;
        $personnel->save();
    }

    /**
     * Yeni bir izin talebini kurallara göre doğrular. İhlal varsa kullanıcıya
     * gösterilecek Türkçe hata mesajını, aksi halde null döner.
     */
    public static function validateNewRequest(
        Personnel $personnel,
        LeaveType $leaveType,
        string $startDate,
        string $endDate,
        int $totalDays,
        ?string $attachmentUrl
    ): ?string {
        // 1) Çakışma: aynı personelin reddedilmemiş başka bir talebiyle tarih
        //    aralığı kesişiyorsa reddet (tür fark etmez — aynı anda iki izin olamaz).
        $overlaps = LeaveRequest::where('personnel_id', $personnel->id)
            ->where('status', '!=', 'rejected')
            ->where('start_date', '<=', $endDate)
            ->where('end_date', '>=', $startDate)
            ->exists();

        if ($overlaps) {
            return 'Bu tarih aralığı, personelin mevcut bir izin talebiyle çakışıyor.';
        }

        // 2) Zorunlu belge: izin türü belge gerektiriyorsa attachment_url zorunlu.
        if ($leaveType->requires_document && empty($attachmentUrl)) {
            return "\"{$leaveType->name}\" için belge/rapor yüklenmesi zorunludur.";
        }

        // 3) Yıllık izin bakiyesi: yalnızca "annual" türü bakiyeden düşer.
        if ($leaveType->slug === 'annual') {
            $pendingUsed = LeaveRequest::where('personnel_id', $personnel->id)
                ->where('status', 'pending')
                ->whereHas('leaveType', fn ($q) => $q->where('slug', 'annual'))
                ->sum('total_days');

            $remaining = $personnel->annual_leave_balance + $personnel->carried_over_balance - $pendingUsed;

            if ($totalDays > $remaining) {
                return "Yetersiz izin bakiyesi. Kalan {$remaining} iş günü, talep edilen {$totalDays} iş günü.";
            }
        }

        return null;
    }
}
