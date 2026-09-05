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

let cachedClient: { cfgKey: string; client: SupabaseClient } | null = null;

/** Ambil (dan cache) client Supabase. Lempar error bila belum dikonfigurasi. */
export function getClient(): SupabaseClient {
  const cfg = getActiveConfig();
  if (!cfg) {
    throw new Error(
      "Supabase belum dikonfigurasi. Isi .env (VITE_SUPABASE_URL & VITE_SUPABASE_ANON_KEY) atau atur kredensial runtime di menu Pengaturan."
    );
  }
  const cfgKey = `${cfg.url}::${cfg.anonKey}`;
  if (cachedClient && cachedClient.cfgKey === cfgKey) return cachedClient.client;

  const client = createClient(cfg.url, cfg.anonKey, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
  cachedClient = { cfgKey, client };
  return client;
}

/** URL publik bucket storage "vehicle-photos" (dibuat di schema.sql). */
export function getStorageBucket(): string {
  return "vehicle-photos";
}
