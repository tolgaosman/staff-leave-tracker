/* Excel (xlsx) ve CSV dışa aktarma yardımcıları.
   ExcelJS kullanılarak tamamen yerel binary .xlsx dosyaları üretilir. */

import ExcelJS from "exceljs";

/** Bir kolon tanımı: başlık + her satırdan hücre değerini üreten fonksiyon. */
export type CsvColumn<T> = {
  header: string;
  value: (row: T) => string | number | null | undefined;
};

/**
 * Satır dizisini tüm hücrelerinde Tüm Kenarlıklar (All Borders) çizilmiş,
 * başlıkları kalın (bold) ve durumları renklendirilmiş gerçek .xlsx dosyası olarak indirir.
 */
export async function downloadXlsx<T>(
  filename: string,
  rows: T[],
  columns: CsvColumn<T>[]
): Promise<void> {
  if (typeof window === "undefined") return;

  const workbook = new ExcelJS.Workbook();
  const worksheet = workbook.addWorksheet("Personel İzin Listesi", {
    views: [{ showGridLines: true }],
  });

  // 1. Kolonları tanımla
  worksheet.columns = columns.map((c) => ({
    header: c.header,
    key: c.header,
  }));

  // 2. Satır verilerini ekle
  rows.forEach((row) => {
    const rowData: Record<string, any> = {};
    columns.forEach((c) => {
      const v = c.value(row);
      rowData[c.header] = v == null ? "" : v;
    });
    worksheet.addRow(rowData);
  });

  // Başlık satırı stili - yalnızca tablonun kolonlarına uygula (sonsuz satır dolgusu olmasın)
  const headerRow = worksheet.getRow(1);
  headerRow.height = 26;
  columns.forEach((_, colIdx) => {
    const cell = headerRow.getCell(colIdx + 1);
    cell.font = { name: "Calibri", size: 11, bold: true, color: { argb: "FF0F172A" } };
    cell.fill = {
      type: "pattern",
      pattern: "solid",
      fgColor: { argb: "FFCBD5E1" },
    };
  });

  // Tüm Kenarlıklar (All Borders - Thin Border) stili
  const allBorders: Partial<ExcelJS.Borders> = {
    top: { style: "thin", color: { argb: "FF64748B" } },
    bottom: { style: "thin", color: { argb: "FF64748B" } },
    left: { style: "thin", color: { argb: "FF64748B" } },
    right: { style: "thin", color: { argb: "FF64748B" } },
  };

  // 3. Hücre kenarlıkları, hizalamaları ve renkleri uygula
  worksheet.eachRow((row, rowNumber) => {
    row.eachCell((cell) => {
      // TÜM KENARLIKLAR (All Borders)
      cell.border = allBorders;
      cell.alignment = { vertical: "middle", horizontal: "left", wrapText: true };

      if (rowNumber > 1) {
        cell.font = { name: "Calibri", size: 11 };
        const valStr = String(cell.value ?? "").trim();

        // Durum sütununa özel hücre renklendirmeleri
        if (valStr === "Aktif" || valStr === "Onaylandı") {
          cell.fill = { type: "pattern", pattern: "solid", fgColor: { argb: "FFDCFCE7" } };
          cell.font = { name: "Calibri", size: 11, bold: true, color: { argb: "FF15803D" } };
        } else if (valStr === "İzinde" || valStr === "Bekliyor") {
          cell.fill = { type: "pattern", pattern: "solid", fgColor: { argb: "FFFEF08A" } };
          cell.font = { name: "Calibri", size: 11, bold: true, color: { argb: "FFA16207" } };
        } else if (valStr === "Pasif" || valStr === "Ayrıldı" || valStr === "Reddedildi") {
          cell.fill = { type: "pattern", pattern: "solid", fgColor: { argb: "FFFEE2E2" } };
          cell.font = { name: "Calibri", size: 11, bold: true, color: { argb: "FF991B1B" } };
        }
      }
    });
  });

  // Kolon genişliklerini en uzun içeriğe göre otomatik hesapla (en uzun gerekçeyi sığdıracak şekilde genişlet)
  worksheet.columns.forEach((column) => {
    let maxLen = 0;
    column.eachCell?.({ includeEmpty: true }, (cell) => {
      const len = cell.value ? String(cell.value).length : 0;
      if (len > maxLen) maxLen = len;
    });
    column.width = Math.min(Math.max(maxLen + 5, 14), 120);
  });

  // 4. İkili .xlsx tam uyumlu binary dosyası üret ve indirmeyi tetikle
  const buffer = await workbook.xlsx.writeBuffer();
  const blob = new Blob([buffer], {
    type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
  });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  const name = filename.endsWith(".xlsx") ? filename : `${filename}.xlsx`;
  a.download = name;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
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
