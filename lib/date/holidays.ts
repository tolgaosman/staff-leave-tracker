/* Türkiye 2026 resmî tatilleri.
   İş günü hesabında (lib/date/business-days.ts) bu tarihler, hafta içine
   denk gelseler bile izin gününden düşülmez.

   İki grup var:
   1) SABİT ulusal bayramlar — her yıl aynı gün, kesin.
   2) DİNİ bayramlar (Ramazan/Kurban) — Arife ve bayram günleri resmi tatil takvimine dahil edilmiştir. */

export type PublicHoliday = {
  /** ISO yyyy-mm-dd */
  date: string;
  name: string;
};

export const publicHolidays2026: PublicHoliday[] = [
  // ── Sabit ulusal bayramlar (kesin) ──
  { date: "2026-01-01", name: "Yılbaşı" },
  { date: "2026-04-23", name: "Ulusal Egemenlik ve Çocuk Bayramı" },
  { date: "2026-05-01", name: "Emek ve Dayanışma Günü" },
  { date: "2026-05-19", name: "Atatürk'ü Anma, Gençlik ve Spor Bayramı" },
  { date: "2026-07-15", name: "15 Temmuz Demokrasi ve Milli Birlik Günü" },
  { date: "2026-07-20", name: "Barış ve Özgürlük Bayramı" },
  { date: "2026-08-30", name: "Zafer Bayramı" },
  { date: "2026-10-29", name: "Cumhuriyet Bayramı" },
  { date: "2026-11-15", name: "KKTC Cumhuriyet Bayramı" },

  // ── Dini bayramlar ──
  { date: "2026-03-19", name: "Ramazan Bayramı Arife" },
  { date: "2026-03-20", name: "Ramazan Bayramı (1. gün)" },
  { date: "2026-03-21", name: "Ramazan Bayramı (2. gün)" },
  { date: "2026-03-22", name: "Ramazan Bayramı (3. gün)" },
  { date: "2026-05-26", name: "Kurban Bayramı Arife" },
  { date: "2026-05-27", name: "Kurban Bayramı (1. gün)" },
  { date: "2026-05-28", name: "Kurban Bayramı (2. gün)" },
  { date: "2026-05-29", name: "Kurban Bayramı (3. gün)" },
  { date: "2026-05-30", name: "Kurban Bayramı (4. gün)" },
];

/** yyyy-mm-dd tatil tarihleri — O(1) arama için Set.
    business-days.ts döngüsünde her gün için `.has()` çağrılır. */
export const holidaySet2026: Set<string> = new Set(
  publicHolidays2026.map((h) => h.date)
);

export function getPublicHolidayName(isoDate: string): string | undefined {
  const match = publicHolidays2026.find((h) => h.date === isoDate);
  if (match) return match.name;

  const monthDay = isoDate.slice(5);
  const fixedMap: Record<string, string> = {
    "01-01": "Yılbaşı",
    "04-23": "Ulusal Egemenlik ve Çocuk Bayramı",
    "05-01": "Emek ve Dayanışma Günü",
    "05-19": "Atatürk'ü Anma, Gençlik ve Spor Bayramı",
    "07-15": "15 Temmuz Demokrasi ve Milli Birlik Günü",
    "07-20": "Barış ve Özgürlük Bayramı",
    "08-30": "Zafer Bayramı",
    "10-29": "Cumhuriyet Bayramı",
    "11-15": "KKTC Cumhuriyet Bayramı",
  };
  return fixedMap[monthDay];
}
