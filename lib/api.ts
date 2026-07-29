import { clearSimulatedRole } from "@/components/auth/simulated-role-storage";

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000/api";

export async function apiFetch<T>(
  endpoint: string,
  options: RequestInit = {}
): Promise<T> {
  const token = typeof window !== "undefined" ? localStorage.getItem("token") : null;

  const headers: Record<string, string> = {
    Accept: "application/json",
    ...(options.headers as Record<string, string>),
  };

  if (!(options.body instanceof FormData)) {
    headers["Content-Type"] = "application/json";
  }

  if (token) {
    headers["Authorization"] = `Bearer ${token}`;
  }

  const response = await fetch(`${API_BASE_URL}${endpoint}`, {
    ...options,
    headers,
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));

    // 401 → token yok/süresi dolmuş/iptal edilmiş. Yerel oturumu temizle ve
    // (giriş sayfasında değilsek) girişe yönlendir; aksi halde kullanıcı bozuk
    // bir panelde takılı kalır. Girişteki 401 (hatalı şifre) döngü yapmasın diye
    // /login yolundayken yönlendirme atlanır.
    if (response.status === 401 && typeof window !== "undefined") {
      localStorage.removeItem("token");
      localStorage.removeItem("izin-takip-auth");
      // Simüle edilen görünüm rolü de gitmeli; aksi halde bir sonraki
      // kullanıcının oturumuna sızar.
      clearSimulatedRole();
      if (!window.location.pathname.includes("/login")) {
        window.location.assign(`${process.env.NEXT_PUBLIC_BASE_PATH || ""}/login`);
      }
    }

    throw new Error(errorData.message || `İstek başarısız: ${response.status}`);
  }

  return response.json();
}

/* ── Referans listeleri (formlardaki açılır menüler için) ───────────────── */

export type ApiDepartment = { id: number; name: string };

export type ApiLeaveType = {
  id: number;
  name: string;
  slug: string;
  max_days: number | null;
  requires_document: boolean;
};

/** Departman listesi — personel formundaki departman seçici için. */
export function getDepartments(): Promise<ApiDepartment[]> {
  return apiFetch<ApiDepartment[]>("/departments");
}

/** İzin türü listesi — izin formundaki tür seçici ve slug→id eşlemesi için. */
export function getLeaveTypes(): Promise<ApiLeaveType[]> {
  return apiFetch<ApiLeaveType[]>("/leave-types");
}
