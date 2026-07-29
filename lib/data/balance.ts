import { workingDayCount } from "@/lib/date/business-days";
import type { LeaveBalance, LeaveRequest, Personnel } from "@/lib/data/types";

/* İzin bakiyesi (leave balance) iş mantığı.
   Saf (pure) fonksiyonlar — React'e/localStorage'a bağlı değil, kolayca
   test edilebilir. Store bunları sarmalayıp reaktif hale getirir.        */

/** Bir başlangıç tarihinden bugüne kaç TAM yıl geçtiği (kıdem). */
function yearsOfService(startDate: string | undefined, now: Date = new Date()): number {
  if (!startDate) return 0;
  const start = new Date(startDate);
  if (Number.isNaN(start.getTime())) return 0;
  const ms = now.getTime() - start.getTime();
  if (ms <= 0) return 0;
  // 365.25 → artık yılları ortalar; "tam yıl" için aşağı yuvarla.
  return Math.floor(ms / (365.25 * 86_400_000));
}

/**
 * Kıdeme göre yıllık izin hakkı (Türk İş Kanunu md. 53 kademeleri):
 *   1–5 yıl (dahil)  → 14 gün
 *   5–15 yıl arası   → 20 gün
 *   15 yıl ve üzeri  → 26 gün
 * 1 yıldan az kıdemliye kanunen hak doğmaz; bir takip aracı olarak taban
 * 14 gün veriyoruz ki demo verisi anlamlı olsun.
 */
export function annualEntitlement(startDate?: string, now: Date = new Date()): number {
  const years = yearsOfService(startDate, now);
  if (years >= 15) return 26;
  if (years >= 5) return 20;
  return 14;
}

/**
 * Bir personelin izin bakiyesini, onun izin kayıtlarından türetir.
 *
 * Önemli kural: bakiyeden YALNIZCA "annual" (yıllık) izinler düşer.
 * Hastalık / mazeret / ücretsiz izin yıllık haktan yenmez — gerçek
 * hayattaki gibi. Süreler takvim günü değil İŞ GÜNÜ olarak sayılır.
 */
export function computeLeaveBalance(
  person: Personnel,
  allLeaves: LeaveRequest[]
): LeaveBalance {
  const seniorityEntitlement = annualEntitlement(person.startDate);
  const carriedOver = person.carriedOverBalance || 0;

  // approved olan izinleri sadece "used" göstermek için sayıyoruz
  let used = 0;
  let pending = 0;

  for (const leave of allLeaves) {
    if (leave.personnelId !== person.id) continue;
    if (leave.type !== "annual") continue;

    const days = workingDayCount(leave.startDate, leave.endDate);
    if (leave.status === "approved") used += days;
    if (leave.status === "pending") pending += days;
  }

  if (person.annualLeaveBalance !== undefined && person.annualLeaveBalance !== null) {
    // Veritabanındaki bakiye zaten onaylı izinler düşülmüş "kalan" değer.
    // Sadece bekleyen talepleri düşüyoruz.
    const remaining = Math.max(0, person.annualLeaveBalance - pending);
    // Hak edilen = kalan + kullanılan + bekleyen - devreden (negatif olmamalı)
    const entitled = Math.max(seniorityEntitlement, remaining + used + pending - carriedOver);
    return {
      personnelId: person.id,
      entitled,
      carriedOver,
      used,
      pending,
      remaining,
    };
  }

  // Veritabanında bakiye yoksa kıdemden hesapla
  const remaining = Math.max(0, seniorityEntitlement + carriedOver - used - pending);
  return {
    personnelId: person.id,
    entitled: seniorityEntitlement,
    carriedOver,
    used,
    pending,
    remaining,
  };
}
