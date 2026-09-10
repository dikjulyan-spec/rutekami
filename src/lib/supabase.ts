import { createClient, SupabaseClient } from "@supabase/supabase-js";

/**
 * Inisialisasi Supabase Client.
 *
 * Kredensial diambil dari dua sumber (prioritas tinggi → rendah):
 *  1. Override runtime di localStorage (kunci `travondo.supabase`) — berguna
 *     untuk pratinjau tanpa perlu rebuild (anon key memang aman di frontend).
 *  2. Variabel lingkungan build: VITE_SUPABASE_URL + VITE_SUPABASE_ANON_KEY
 *     (diisi lewat file .env, cara standar untuk Cloudflare Pages / Vite).
 */

const RUNTIME_KEY = "travondo.supabase";

export interface SupabaseConfig {
  url: string;
  anonKey: string;
}

function readEnvConfig(): SupabaseConfig | null {
  const url = (import.meta.env.VITE_SUPABASE_URL || "").trim();
  const anonKey = (import.meta.env.VITE_SUPABASE_ANON_KEY || "").trim();
  if (url && anonKey) return { url, anonKey };
  return null;
}

function readRuntimeConfig(): SupabaseConfig | null {
  try {
    const raw = window.localStorage.getItem(RUNTIME_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as Partial<SupabaseConfig>;
    const url = (parsed.url || "").trim();
    const anonKey = (parsed.anonKey || "").trim();
    if (/^https?:\/\/.+/.test(url) && anonKey) return { url, anonKey };
  } catch {
    /* abaikan localStorage korup */
  }
  return null;
}

export function saveRuntimeConfig(cfg: SupabaseConfig): void {
  window.localStorage.setItem(RUNTIME_KEY, JSON.stringify(cfg));
}

export function clearRuntimeConfig(): void {
  window.localStorage.removeItem(RUNTIME_KEY);
}

/** Konfigurasi aktif — env build diutamakan bila ada. */
export function getActiveConfig(): SupabaseConfig | null {
  return readEnvConfig() ?? readRuntimeConfig();
}

export function isSupabaseConfigured(): boolean {
  return getActiveConfig() !== null;
}

/**
 * Deteksi portal dari URL halaman (MPA: tiap portal = file HTML sendiri).
 * Dipakai untuk memisahkan sesi login per portal (storageKey berbeda),
 * sehingga login di /admin.html tidak otomatis terbaca di /partner.html.
 */
export type PortalKey = "main" | "booking" | "partner" | "driver" | "admin";

export function detectPortal(): PortalKey {
  if (typeof window === "undefined") return "main";
  const path = window.location.pathname.toLowerCase();
  const last = path.split("/").filter(Boolean).pop() ?? "";
  const target = last || "index.html";
  if (target.startsWith("booking")) return "booking";
  if (target.startsWith("partner")) return "partner";
  if (target.startsWith("driver")) return "driver";
  if (target.startsWith("admin")) return "admin";
  return "main";
}

let cachedClient: { key: string; client: SupabaseClient } | null = null;

/**
 * Ambil (dan cache) client Supabase. Lempar error bila belum dikonfigurasi.
 * Sesi login disimpan di storageKey terpisah per portal (lihat detectPortal),
 * sehingga tiap portal punya sesi login sendiri-sendiri.
 */
export function getClient(): SupabaseClient {
  const cfg = getActiveConfig();
  if (!cfg) {
    throw new Error(
      "Supabase belum dikonfigurasi. Isi .env (VITE_SUPABASE_URL & VITE_SUPABASE_ANON_KEY) atau atur kredensial runtime di menu Pengaturan."
    );
  }
  const portal = detectPortal();
  const cacheKey = `${cfg.url}::${cfg.anonKey}::${portal}`;
  if (cachedClient && cachedClient.key === cacheKey) return cachedClient.client;

  const client = createClient(cfg.url, cfg.anonKey, {
    auth: {
      persistSession: true,
      autoRefreshToken: true,
      detectSessionInUrl: true,
      storageKey: `rutetrip-auth-${portal}`,
    },
  });
  cachedClient = { key: cacheKey, client };
  return client;
}

/** URL publik bucket storage "vehicle-photos" (dibuat di schema.sql). */
export function getStorageBucket(): string {
  return "vehicle-photos";
}
