/* Excel (xlsx/xls) ve CSV dışa aktarma yardımcıları.
   Tamamen tarayıcı tarafında çalışır (statik export'a uygun, sunucu yok). */

import * as XLSX from "xlsx";

/** Bir kolon tanımı: başlık + her satırdan hücre değerini üreten fonksiyon. */
export type CsvColumn<T> = {
  header: string;
  value: (row: T) => string | number | null | undefined;
};

function escapeHtml(str: string | number | null | undefined): string {
  if (str == null) return "";
  return String(str)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

function getCellStyle(header: string, valStr: string): string {
  const normalized = valStr.trim();

  // Durum sütununa özel hücre renklendirmeleri
  if (normalized === "Aktif" || normalized === "Onaylandı") {
    return 'style="background-color: #dcfce7; color: #15803d; font-weight: bold; padding: 6px 12px; border: 1px solid #94a3b8; text-align: left; vertical-align: middle;"';
  }
  if (normalized === "İzinde" || normalized === "Bekliyor") {
    return 'style="background-color: #fef08a; color: #a16207; font-weight: bold; padding: 6px 12px; border: 1px solid #94a3b8; text-align: left; vertical-align: middle;"';
  }
  if (normalized === "Pasif" || normalized === "Ayrıldı" || normalized === "Reddedildi") {
    return 'style="background-color: #fee2e2; color: #991b1b; font-weight: bold; padding: 6px 12px; border: 1px solid #94a3b8; text-align: left; vertical-align: middle;"';
  }

  return 'style="padding: 6px 12px; border: 1px solid #94a3b8; text-align: left; vertical-align: middle;"';
}

/**
 * Satır dizisini tüm kenarlıkları (all borders), kalın başlıkları ve renklendirilmiş durum hücreleri olan Excel olarak indirir.
 */
export function downloadXlsx<T>(filename: string, rows: T[], columns: CsvColumn<T>[]): void {
  if (typeof window === "undefined") return;

  const headers = columns.map((c) => c.header);

  // Excel HTML şablonu
  const html = `<html xmlns:o="urn:schemas-microsoft-com:office:office" xmlns:x="urn:schemas-microsoft-com:office:excel" xmlns="http://www.w3.org/TR/REC-html40">
  <head>
    <meta charset="utf-8" />
    <!--[if gte mso 9]>
    <xml>
      <x:ExcelWorkbook>
        <x:ExcelWorksheets>
          <x:ExcelWorksheet>
            <x:Name>Veri</x:Name>
            <x:WorksheetOptions>
              <x:DisplayGridlines/>
            </x:WorksheetOptions>
          </x:ExcelWorksheet>
        </x:ExcelWorksheets>
      </x:ExcelWorkbook>
    </xml>
    <![endif]-->
    <style>
      table { border-collapse: collapse; width: 100%; font-family: Calibri, sans-serif; font-size: 11pt; }
      th { background-color: #cbd5e1; color: #0f172a; font-weight: bold !important; text-align: left; padding: 8px 12px; border: 1px solid #475569; }
      td { padding: 6px 12px; border: 1px solid #94a3b8; text-align: left; vertical-align: middle; }
      tr:nth-child(even) { background-color: #f8fafc; }
    </style>
  </head>
  <body>
    <table>
      <thead>
        <tr>
          ${headers.map((h) => `<th style="font-weight: bold; background-color: #cbd5e1; border: 1px solid #475569; padding: 8px 12px;">${escapeHtml(h)}</th>`).join("")}
        </tr>
      </thead>
      <tbody>
        ${rows
          .map(
            (row) => `
          <tr>
            ${columns
              .map((c) => {
                const v = c.value(row);
                const valStr = v == null ? "" : String(v);
                const cellStyle = getCellStyle(c.header, valStr);
                return `<td ${cellStyle}>${escapeHtml(valStr)}</td>`;
              })
              .join("")}
          </tr>`
          )
          .join("")}
      </tbody>
    </table>
  </body>
  </html>`;

  const blob = new Blob([html], { type: "application/vnd.ms-excel;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  const name = filename.endsWith(".xls") || filename.endsWith(".xlsx") ? filename : `${filename}.xls`;
  link.download = name;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

// --- Geriye dönük uyumluluk: eski CSV fonksiyonları ---

function escapeCell(value: string | number | null | undefined): string {
  const s = value == null ? "" : String(value);
  if (/[",\n\r]/.test(s)) {
    return `"${s.replace(/"/g, '""')}"`;
  }
  return s;
}

export function toCsv<T>(rows: T[], columns: CsvColumn<T>[]): string {
  const header = columns.map((c) => escapeCell(c.header)).join(",");
  const body = rows
    .map((row) => columns.map((c) => escapeCell(c.value(row))).join(","))
    .join("\r\n");
  return `\uFEFF${header}\r\n${body}`;
}

export function downloadCsv(filename: string, content: string): void {
  if (typeof window === "undefined") return;
  const blob = new Blob([content], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = filename.endsWith(".csv") ? filename : `${filename}.csv`;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}
