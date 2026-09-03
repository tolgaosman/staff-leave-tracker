import { holidaySet2026 } from "@/lib/date/holidays";

/* İş günü (working day) hesabı.
   "İzin günü" = başlangıç ve bitiş arasındaki günlerden Cumartesi, Pazar ve
   resmî tatiller çıkarıldıktan sonra kalan gün sayısı.                    */

/**
 * "yyyy-mm-dd" metnini YEREL saat diliminde bir Date'e çevirir.
 *
 * Neden `new Date("2026-01-05")` KULLANMIYORUZ?
 *   Bu form ISO olarak UTC gece yarısı kabul edilir; UTC+3'te getDay()/
 *   getDate() bir gün kayabilir (off-by-one). `new Date(y, m-1, d)` ise
 *   argümanları yerel kabul eder → gün ve haftanın günü daima doğru.
 */
export function parseLocalDate(iso: string): Date {
  const [y, m, d] = iso.split("-").map(Number);
  return new Date(y, m - 1, d);
}

/** Bir Date'i yerel bileşenlerinden "yyyy-mm-dd" üretir (toISOString UTC'ye
    kaydığı için onu kullanmıyoruz). Tatil Set'inde arama için gerekir. */
function toLocalIso(date: Date): string {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, "0");
  const d = String(date.getDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
}

/**
 * İki tarih (dahil) arasındaki iş günü sayısı.
 * Hafta sonu (Cmt/Pz) ve `holidays` setindeki resmî tatiller sayılmaz.
 *
 * Algoritma: start'tan end'e gün gün ilerle; her gün için
 *   - haftanın günü 0 (Pazar) veya 6 (Cumartesi) ise atla,
 *   - tarih tatil setinde ise atla,
 *   - aksi halde sayacı artır.
 * Set araması O(1) olduğundan toplam maliyet O(gün sayısı).
 */
export function workingDayCount(
  startDate: string,
  endDate: string,
  holidays: Set<string> = holidaySet2026
): number {
  if (!startDate || !endDate) return 0;

  const start = parseLocalDate(startDate);
  const end = parseLocalDate(endDate);
  if (Number.isNaN(start.getTime()) || Number.isNaN(end.getTime())) return 0;
  if (end < start) return 0;

  let count = 0;
  const cursor = new Date(start);

  while (cursor <= end) {
    const day = cursor.getDay(); // 0 = Pazar, 6 = Cumartesi
    const isWeekend = day === 0 || day === 6;
    const isHoliday = holidays.has(toLocalIso(cursor));

    if (!isWeekend && !isHoliday) count++;

    cursor.setDate(cursor.getDate() + 1); // ertesi güne geç
  }

  return count;
}
