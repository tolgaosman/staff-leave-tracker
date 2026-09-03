"use client";

import { Download } from "lucide-react";

import { useToast } from "@/components/ui/toast";
import { downloadXlsx, type CsvColumn } from "@/lib/utils/csv";
import { cn } from "@/lib/utils";

/* Tekrar kullanılabilir Excel "Dışa Aktar" butonu.
   Generic <T>: hangi satır tipini verirsen kolonlar da o tipe göre tiplenir
   (yanlış alan adı derleme zamanında yakalanır). */

type ExportButtonProps<T> = {
  filename: string;
  columns: CsvColumn<T>[];
  rows: T[];
  label?: string;
  className?: string;
};

export function ExportButton<T>({
  filename,
  columns,
  rows,
  label = "Dışa Aktar",
  className,
}: ExportButtonProps<T>) {
  const toast = useToast();

  async function handleExport() {
    if (rows.length === 0) {
      toast.info("Veri Bulunamadı", "Dışa aktarılacak herhangi bir kayıt mevcut değil.");
      return;
    }
    await downloadXlsx(filename, rows, columns);
    toast.success("Excel Dosyası İndirildi", `Toplam ${rows.length} adet kayıt "${filename}.xlsx" olarak indirildi.`);
  }

  return (
    <button
      onClick={handleExport}
      className={cn(
        "flex items-center gap-2 rounded-lg border border-outline-variant/30 bg-surface-1 px-4 py-2 text-sm font-bold text-on-surface-variant transition-all hover:bg-black/5 hover:text-primary active:scale-95 cursor-pointer",
        className
      )}
    >
      <Download className="size-4" />
      <span>{label}</span>
    </button>
  );
}
