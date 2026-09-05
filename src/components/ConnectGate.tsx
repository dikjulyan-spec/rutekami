import React, { useCallback, useState } from "react";
import {
  CheckCircle2,
  Database,
  FileKey2,
  KeyRound,
  Play,
  TerminalSquare,
  Unplug,
} from "lucide-react";
import { BrandLogo } from "./Logo";
import {
  clearRuntimeConfig,
  getActiveConfig,
  isSupabaseConfigured,
  saveRuntimeConfig,
} from "../lib/supabase";
import { Modal } from "./ui";

/** Hook: apakah Supabase sudah dikonfigurasi (env build atau runtime). */
export function useConfigured(): [boolean, () => void] {
  const [configured, setConfigured] = useState<boolean>(() => isSupabaseConfigured());
  const refresh = useCallback(() => setConfigured(isSupabaseConfigured()), []);
  return [configured, refresh];
}

/**
 * Bungkus konten portal: tampilkan layout setup bila Supabase belum
 * terhubung, atau render children bila sudah siap.
 */
export function WithSupabase({ children }: { children: React.ReactNode }) {
  const [configured, refresh] = useConfigured();
  if (!configured) return <ConnectGate onSaved={refresh} />;
  return <>{children}</>;
}

function ConnectGate({ onSaved }: { onSaved: () => void }) {
  const existing = getActiveConfig();
  const [url, setUrl] = useState(existing?.url ?? "");
  const [key, setKey] = useState(existing?.anonKey ?? "");
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [showGuide, setShowGuide] = useState(false);

  const save = () => {
    setError(null);
    const u = url.trim();
    const k = key.trim();
    if (!/^https:\/\/.+\.supabase\.(co|in)\/?$/.test(u) && !/^http:\/\/localhost/.test(u)) {
      setError("URL Supabase tidak valid. Contoh: https://abcdefgh.supabase.co");
      return;
    }
    if (k.length < 10) {
      setError("Anon key terlalu pendek — tempel anon public key dari Project Settings → API.");
      return;
    }
    setSaving(true);
    setTimeout(() => {
      saveRuntimeConfig({ url: u, anonKey: k });
      setSaving(false);
      onSaved();
    }, 250);
  };

  const steps = [
    { icon: <Database className="h-4 w-4" />, t: "Buat proyek Supabase", d: "supabase.com → New Project (PostgreSQL gratis)." },
    { icon: <TerminalSquare className="h-4 w-4" />, t: "Jalankan supabase/schema.sql", d: "SQL Editor → tempel → Run. Membuat 8 tabel, trigger escrow 90/10, RLS demo & bucket storage." },
    { icon: <FileKey2 className="h-4 w-4" />, t: "Jalankan supabase/seed.sql", d: "Data contoh: 3 vendor, 9 unit, 5 trayek, 6 sopir, 11 pesanan, payout & settings." },
    { icon: <KeyRound className="h-4 w-4" />, t: "Isi kredensial", d: "Pakai tombol di kanan ini (tersimpan di browser untuk pratinjau) atau file .env lalu npm run build." },
  ];

  return (
    <div className="relative min-h-screen">
      <BackdropDecor />
      <div className="mx-auto max-w-5xl px-4 sm:px-6 py-8 sm:py-14">
        <div className="flex flex-col items-center gap-3 text-center animate-rise">
          <BrandLogo className="w-56 sm:w-72" />
          <h1 className="text-2xl font-extrabold tracking-tight text-lagoon-900">RuteTrip Platform</h1>
          <p className="text-[12px] font-bold uppercase tracking-[0.16em] text-stone-400">RuteTrip · hubungkan database</p>
        </div>

        <div className="mt-8 grid gap-6 lg:grid-cols-[1.1fr_1fr] items-start">
          <div className="card p-6 sm:p-8 animate-rise">
            <p className="text-lg font-extrabold text-lagoon-900">Selamat datang 👋</p>
            <p className="text-sm text-stone-500 mt-1.5 leading-relaxed">
              RuteTrip adalah ekosistem transportasi multi-portal — Booking, Partner armada, Super
              Admin HQ, dan Driver. Seluruh data & transaksi (escrow, komisi, payout) dikelola
              PostgreSQL Supabase. Tanpa kredensial, aplikasi ini hanya menampilkan layar ini.
            </p>

            <ol className="mt-6 space-y-4">
              {steps.map((s, i) => (
                <li key={s.t} className="flex gap-3.5">
                  <span className="grid h-8 w-8 shrink-0 place-items-center rounded-xl bg-brand-50 text-brand-600 ring-1 ring-brand-100">{s.icon}</span>
                  <div className="min-w-0">
                    <p className="text-sm font-bold text-stone-800"><span className="text-brand-500">{i + 1}. </span>{s.t}</p>
                    <p className="text-[12.5px] text-stone-400 leading-relaxed">{s.d}</p>
                  </div>
                </li>
              ))}
            </ol>

            <div className="mt-6 rounded-2xl bg-lagoon-50 p-4 text-[12.5px] text-lagoon-800 leading-relaxed">
              <b className="flex items-center gap-1.5"><Unplug className="h-3.5 w-3.5" /> Catatan keamanan prototype:</b>
              <br />
              Skema memakai anon-key penuh + RLS longgar agar demo cepat berjalan — sebelum produksi,
              aktifkan Supabase Auth & persempit policy per-role (lihat README).
            </div>
          </div>

          <div className="card p-6 sm:p-8 animate-rise">
            <p className="text-base font-extrabold text-lagoon-900">Hubungkan Supabase</p>
            <p className="text-[13px] text-stone-400 mt-1">
              Tempel <b>Project URL</b> & <b>anon public key</b> (Project Settings → API). Disimpan
              di browser Anda — aman dipakai karena anon key memang untuk publikasi frontend.
            </p>

            <div className="mt-5 space-y-4">
              <div>
                <label className="label">Project URL</label>
                <input
                  className="input font-mono text-[13px]"
                  placeholder="https://abcdefghijkl.supabase.co"
                  value={url}
                  onChange={(e) => setUrl(e.target.value)}
                  spellCheck={false}
                />
              </div>
              <div>
                <label className="label">Anon Public Key</label>
                <textarea
                  className="textarea font-mono text-[12.5px] min-h-[92px]"
                  placeholder="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9…"
                  value={key}
                  onChange={(e) => setKey(e.target.value)}
                  spellCheck={false}
                />
                <p className="hint">Bukan service_role key! Gunakan anon key (dimulai eyJ…).</p>
              </div>
              {error && (
                <p className="rounded-xl bg-rose-50 px-3.5 py-2.5 text-[12.5px] font-semibold text-rose-600 ring-1 ring-rose-100">{error}</p>
              )}
              <button className="btn-primary btn-block btn-lg" onClick={save} disabled={saving}>
                {saving ? "Menghubungkan…" : (<><Play className="h-4 w-4" /> Simpan & Masuk ke Platform</>)}
              </button>

              <div className="flex flex-wrap items-center justify-between gap-2 pt-1">
                <button className="btn-ghost btn-sm" onClick={() => setShowGuide(true)}>Pakai .env (build)? Lihat panduan</button>
                {existing && (
                  <button
                    className="btn-danger btn-sm"
                    onClick={() => {
                      clearRuntimeConfig();
                      setUrl("");
                      setKey("");
                      onSaved();
                    }}
                  >
                    Hapus kredensial tersimpan
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>

      <Modal open={showGuide} onClose={() => setShowGuide(false)} title="Mode .env untuk produksi" size="md">
        <div className="space-y-3 text-sm text-stone-600 leading-relaxed">
          <p>Untuk deployment statis (Cloudflare Pages / platform ini), kredensial dibekukan saat <code className="rounded bg-stone-100 px-1.5 py-0.5 text-[12px] font-mono">npm run build</code>:</p>
          <ol className="space-y-1.5">
            <li className="flex gap-2"><CheckCircle2 className="h-4 w-4 text-leaf-500 shrink-0" /><span>Salin <code className="font-mono text-[12px] bg-stone-100 px-1.5 rounded">.env.example</code> menjadi <code className="font-mono text-[12px] bg-stone-100 px-1.5 rounded">.env</code> di root proyek.</span></li>
            <li className="flex gap-2"><CheckCircle2 className="h-4 w-4 text-leaf-500 shrink-0" /><span>Isi <code className="font-mono text-[12px] bg-stone-100 px-1.5 rounded">VITE_SUPABASE_URL</code> & <code className="font-mono text-[12px] bg-stone-100 px-1.5 rounded">VITE_SUPABASE_ANON_KEY</code>.</span></li>
            <li className="flex gap-2"><CheckCircle2 className="h-4 w-4 text-leaf-500 shrink-0" /><span>Jalankan <code className="font-mono text-[12px] bg-stone-100 px-1.5 rounded">npm run build</code> lalu deploy folder <code className="font-mono text-[12px] bg-stone-100 px-1.5 rounded">dist/</code>.</span></li>
          </ol>
          <p className="text-[12.5px] text-stone-400">Kredensial runtime (form di halaman ini) berguna untuk pratinjau cepat tanpa rebuild.</p>
        </div>
      </Modal>
    </div>
  );
}

export function BackdropDecor() {
  return (
    <div aria-hidden className="pointer-events-none fixed inset-0 -z-10 overflow-hidden">
      <div className="absolute inset-0 bg-hero-warm" />
      <div className="blob left-[-7rem] top-16 h-80 w-80 bg-brand-300/30" />
      <div className="blob right-[-8rem] top-1/4 h-96 w-96 bg-leaf-300/30" />
      <div className="blob bottom-[-9rem] left-1/3 h-80 w-80 bg-teal-300/25" />
    </div>
  );
}
