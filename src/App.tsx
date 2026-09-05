import React, { Suspense, useState } from "react";
import {
  Building2,
  Car,
  CheckCircle2,
  Database,
  FileKey2,
  KeyRound,
  Navigation,
  Play,
  ShieldCheck,
  TerminalSquare,
  Unplug,
} from "lucide-react";
import {
  clearRuntimeConfig,
  getActiveConfig,
  isSupabaseConfigured,
  saveRuntimeConfig,
} from "./lib/supabase";
import { cn } from "./components/ui";
import { Modal } from "./components/ui";

// Portal dimuat lazy agar bundle utama ringan — tiap portal chunk sendiri.
const CustomerPage = React.lazy(() => import("./pages/CustomerPage"));
const PartnerPage = React.lazy(() => import("./pages/PartnerPage"));
const AdminPage = React.lazy(() => import("./pages/AdminPage"));
const DriverPage = React.lazy(() => import("./pages/DriverPage"));

type PortalId = "customer" | "partner" | "admin" | "driver";

const PORTALS: { id: PortalId; label: string; sub: string; icon: React.ReactNode }[] = [
  { id: "customer", label: "Customer", sub: "Pesan & e-Tiket", icon: <Car className="h-[18px] w-[18px]" /> },
  { id: "partner", label: "Partner", sub: "Vendor armada", icon: <Building2 className="h-[18px] w-[18px]" /> },
  { id: "admin", label: "Admin HQ", sub: "Developer console", icon: <ShieldCheck className="h-[18px] w-[18px]" /> },
  { id: "driver", label: "Driver", sub: "App lapangan", icon: <Navigation className="h-[18px] w-[18px]" /> },
];

export default function App() {
  const [configured, setConfigured] = useState<boolean>(() => isSupabaseConfigured());
  const [portal, setPortal] = useState<PortalId>("customer");

  if (!configured) {
    return <SetupGate onSaved={() => setConfigured(true)} />;
  }

  return (
    <div className="relative min-h-screen">
      <BackdropDecor />

      <TopBar portal={portal} onPortal={setPortal} />

      <main key={portal}>
        <Suspense
          fallback={
            <div className="flex items-center justify-center py-24 text-stone-400">
              <span className="animate-spin inline-block h-6 w-6 rounded-full border-[3px] border-stone-200 border-t-brand-500 mr-2.5" />
              Memuat portal…
            </div>
          }
        >
          {portal === "customer" && <CustomerPage />}
          {portal === "partner" && <PartnerPage />}
          {portal === "admin" && <AdminPage />}
          {portal === "driver" && <DriverPage />}
        </Suspense>
      </main>

      <footer className="border-t border-white/60 py-6 mt-4">
        <div className="mx-auto max-w-6xl px-4 flex flex-wrap items-center justify-between gap-2 text-[12px] text-stone-400">
          <p className="flex items-center gap-1.5">
            <span className="grid h-5 w-5 place-items-center rounded-md bg-gradient-to-br from-brand-500 to-leaf-500 text-white">
              <Car className="h-3 w-3" />
            </span>
            <b className="text-stone-500">Travondo Platform</b> · NusaTravelLab
          </p>
          <p>Prototipe multi-portal · React 18 + TypeScript + Vite 6 + Supabase</p>
        </div>
      </footer>
    </div>
  );
}

// ------------------------------------------------------------------ Dekorasi latar

function BackdropDecor() {
  return (
    <div aria-hidden className="pointer-events-none fixed inset-0 -z-10 overflow-hidden">
      <div className="absolute inset-0 bg-hero-warm" />
      <div className="blob left-[-7rem] top-16 h-80 w-80 bg-brand-300/30" />
      <div className="blob right-[-8rem] top-1/4 h-96 w-96 bg-leaf-300/30" />
      <div className="blob bottom-[-9rem] left-1/3 h-80 w-80 bg-amber-300/25" />
    </div>
  );
}

// ------------------------------------------------------------------ Top bar + portal switcher

function TopBar({ portal, onPortal }: { portal: PortalId; onPortal: (p: PortalId) => void }) {
  return (
    <header className="sticky top-0 z-40 border-b border-white/60 bg-cream/80 backdrop-blur-xl">
      <div className="mx-auto max-w-6xl px-4 sm:px-6">
        <div className="flex h-16 items-center justify-between gap-3">
          <button
            className="flex items-center gap-2.5 text-left shrink-0"
            onClick={() => onPortal("customer")}
          >
            <span className="grid h-9 w-9 place-items-center rounded-xl bg-gradient-to-br from-brand-500 to-leaf-500 text-white shadow-warm">
              <Car className="h-5 w-5" />
            </span>
            <span className="leading-none">
              <span className="block text-[17px] font-extrabold tracking-tight text-lagoon-900">
                Travondo
              </span>
              <span className="mt-1 block text-[10px] font-bold uppercase tracking-[0.16em] text-stone-400">
                NusaTravelLab
              </span>
            </span>
          </button>

          {/* Status pill (desktop) */}
          <span className="hidden lg:flex items-center gap-1.5 rounded-full bg-leaf-50 ring-1 ring-leaf-200 px-3 py-1.5 text-[11.5px] font-bold text-leaf-700">
            <span className="relative flex h-2 w-2">
              <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-leaf-400 opacity-60" />
              <span className="relative inline-flex h-2 w-2 rounded-full bg-leaf-500" />
            </span>
            Escrow & komisi aktif (10%)
          </span>

          <div className="hidden md:flex items-center gap-1 rounded-2xl bg-white/70 p-1 ring-1 ring-stone-200/70 shadow-sm">
            {PORTALS.map((p) => (
              <button
                key={p.id}
                onClick={() => onPortal(p.id)}
                className={cn(
                  "flex items-center gap-2 rounded-xl px-3.5 py-2 transition-all",
                  portal === p.id
                    ? "bg-gradient-to-r from-brand-500 to-brand-400 text-white shadow-warm"
                    : "text-stone-500 hover:bg-stone-100 hover:text-stone-800"
                )}
              >
                {p.icon}
                <span className="text-left leading-tight">
                  <span className="block text-[13px] font-extrabold">{p.label}</span>
                  <span className={cn("block text-[9.5px] font-medium", portal === p.id ? "text-white/80" : "text-stone-400")}>
                    {p.sub}
                  </span>
                </span>
              </button>
            ))}
          </div>
        </div>

        {/* Portal pills (mobile) */}
        <div className="no-scrollbar -mx-4 flex gap-1.5 overflow-x-auto px-4 pb-2.5 md:hidden">
          {PORTALS.map((p) => (
            <button
              key={p.id}
              onClick={() => onPortal(p.id)}
              className={cn(
                "flex shrink-0 items-center gap-1.5 rounded-xl px-3.5 h-9 text-[13px] font-bold transition border",
                portal === p.id
                  ? "bg-gradient-to-r from-brand-500 to-brand-400 border-transparent text-white shadow-warm"
                  : "bg-white/80 border-stone-200 text-stone-500"
              )}
            >
              {p.icon}
              {p.label}
            </button>
          ))}
        </div>
      </div>
    </header>
  );
}

// ------------------------------------------------------------------ Config gate

function SetupGate({ onSaved }: { onSaved: () => void }) {
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
    // Simulasi kecil agar UI responsif; penyimpanan sinkron & cepat.
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
        {/* Brand */}
        <div className="flex items-center gap-3 animate-rise">
          <span className="grid h-11 w-11 place-items-center rounded-2xl bg-gradient-to-br from-brand-500 to-leaf-500 text-white shadow-warm-lg">
            <Car className="h-6 w-6" />
          </span>
          <div>
            <h1 className="text-2xl font-extrabold tracking-tight text-lagoon-900">Travondo Platform</h1>
            <p className="text-[12px] font-bold uppercase tracking-[0.16em] text-stone-400">NusaTravelLab · hubungkan database</p>
          </div>
        </div>

        <div className="mt-8 grid gap-6 lg:grid-cols-[1.1fr_1fr] items-start">
          {/* Panel intro */}
          <div className="card p-6 sm:p-8 animate-rise">
            <p className="text-lg font-extrabold text-lagoon-900">Selamat datang 👋</p>
            <p className="text-sm text-stone-500 mt-1.5 leading-relaxed">
              Travondo adalah ekosistem transportasi multi-portal — Customer, Partner armada, Super
              Admin HQ, dan Driver. Seluruh data & transaksi (escrow, komisi, payout) dikelola
              PostgreSQL Supabase. Tanpa kredensial, aplikasi ini hanya menampilkan layar ini.
            </p>

            <ol className="mt-6 space-y-4">
              {steps.map((s, i) => (
                <li key={s.t} className="flex gap-3.5">
                  <span className="grid h-8 w-8 shrink-0 place-items-center rounded-xl bg-brand-50 text-brand-600 ring-1 ring-brand-100">
                    {s.icon}
                  </span>
                  <div className="min-w-0">
                    <p className="text-sm font-bold text-stone-800">
                      <span className="text-brand-500">{i + 1}. </span>
                      {s.t}
                    </p>
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

          {/* Panel form */}
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
                <p className="rounded-xl bg-rose-50 px-3.5 py-2.5 text-[12.5px] font-semibold text-rose-600 ring-1 ring-rose-100">
                  {error}
                </p>
              )}
              <button className="btn-primary btn-block btn-lg" onClick={save} disabled={saving}>
                {saving ? "Menghubungkan…" : (
                  <>
                    <Play className="h-4 w-4" /> Simpan & Masuk ke Platform
                  </>
                )}
              </button>

              <div className="flex flex-wrap items-center justify-between gap-2 pt-1">
                <button className="btn-ghost btn-sm" onClick={() => setShowGuide(true)}>
                  Pakai .env (build)? Lihat panduan
                </button>
                {existing && (
                  <button
                    className="btn-danger btn-sm"
                    onClick={() => {
                      clearRuntimeConfig();
                      setUrl("");
                      setKey("");
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
          <p>
            Untuk deployment statis (Cloudflare Pages / platform ini), kredensial dibekukan saat{" "}
            <code className="rounded bg-stone-100 px-1.5 py-0.5 text-[12px] font-mono">npm run build</code>:
          </p>
          <ol className="space-y-1.5">
            <li className="flex gap-2"><CheckCircle2 className="h-4 w-4 text-leaf-500 shrink-0" /><span>Salin <code className="font-mono text-[12px] bg-stone-100 px-1.5 rounded">.env.example</code> menjadi <code className="font-mono text-[12px] bg-stone-100 px-1.5 rounded">.env</code> di root proyek.</span></li>
            <li className="flex gap-2"><CheckCircle2 className="h-4 w-4 text-leaf-500 shrink-0" /><span>Isi <code className="font-mono text-[12px] bg-stone-100 px-1.5 rounded">VITE_SUPABASE_URL</code> & <code className="font-mono text-[12px] bg-stone-100 px-1.5 rounded">VITE_SUPABASE_ANON_KEY</code>.</span></li>
            <li className="flex gap-2"><CheckCircle2 className="h-4 w-4 text-leaf-500 shrink-0" /><span>Jalankan <code className="font-mono text-[12px] bg-stone-100 px-1.5 rounded">npm run build</code> lalu deploy folder <code className="font-mono text-[12px] bg-stone-100 px-1.5 rounded">dist/</code>.</span></li>
          </ol>
          <p className="text-[12.5px] text-stone-400">
            Kredensial runtime (form di halaman ini) berguna untuk pratinjau cepat tanpa rebuild.
          </p>
        </div>
      </Modal>
    </div>
  );
}
