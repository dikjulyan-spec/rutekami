import React, { useCallback, useEffect, useState } from "react";
import {
  KeyRound,
  LogIn,
  LogOut,
  ShieldCheck,
  User as UserIcon,
  Car,
  Truck,
  Users,
  Loader2,
  Mail,
  Lock,
  ArrowRight,
  Sparkles,
} from "lucide-react";
import { BrandLogoImg } from "./Logo";
import {
  AuthState,
  Role,
  getMyAuthState,
  isAuthorized,
  roleOf,
  signIn,
  signOut,
  signUpBooking,
  requestPasswordReset,
} from "../lib/auth";
import { Modal } from "./ui";

export type { Role };

/** Hook sederhana untuk memuat ulang state auth. */
export function useAuthState() {
  const [state, setState] = useState<AuthState | null>(null);
  const [loading, setLoading] = useState(true);
  const refresh = useCallback(async () => {
    setLoading(true);
    const s = await getMyAuthState();
    setState(s);
    setLoading(false);
  }, []);
  useEffect(() => {
    refresh();
  }, [refresh]);
  return { state, loading, refresh };
}

/** Halaman yang wajib login untuk peran tertentu. Jika belum/tidak berhak → tampilkan AuthGate. */
export function RequireAuth({
  allowed,
  children,
}: {
  allowed: Role[];
  children: React.ReactNode;
}) {
  const { state, loading, refresh } = useAuthState();

  if (loading) {
    return (
      <div className="grid min-h-screen place-items-center bg-cream">
        <Loader2 className="h-8 w-8 animate-spin text-brand-500" />
      </div>
    );
  }

  if (!state) {
    return <AuthGate onAuthed={refresh} mode={allowed[0] ?? "booking"} />;
  }

  if (!isAuthorized(state, allowed)) {
    return <Unauthorized state={state} onLogout={async () => { await signOut(); refresh(); }} />;
  }

  return <>{children}</>;
}

function Unauthorized({ state, onLogout }: { state: AuthState; onLogout: () => void }) {
  return (
    <div className="grid min-h-screen place-items-center bg-cream px-4">
      <div className="card max-w-md p-8 text-center animate-rise">
        <ShieldCheck className="mx-auto h-12 w-12 text-amber-500" />
        <h1 className="mt-4 text-xl font-extrabold text-lagoon-900">Akses tidak diizinkan</h1>
        <p className="mt-2 text-sm text-stone-500 leading-relaxed">
          Anda masuk sebagai <b className="text-brand-600">{state.profile.role}</b>. Halaman ini
          hanya untuk peran tertentu. Hubungi admin bila perlu.
        </p>
        <button className="btn-primary btn-block mt-6" onClick={onLogout}>
          <LogOut className="h-4 w-4" /> Keluar
        </button>
      </div>
    </div>
  );
}

const ROLE_META: Record<Role, { label: string; icon: React.ReactNode; desc: string; accent: string }> = {
  booking: { label: "Booking", icon: <Car className="h-4 w-4" />, desc: "Cari & pesan kendaraan", accent: "text-teal-500" },
  partner: { label: "Partner", icon: <Truck className="h-4 w-4" />, desc: "Kelola unit & tugas sopir", accent: "text-brand-500" },
  driver: { label: "Driver", icon: <Users className="h-4 w-4" />, desc: "Tugas & shift lapangan", accent: "text-leaf-500" },
  admin: { label: "Admin", icon: <ShieldCheck className="h-4 w-4" />, desc: "Developer console", accent: "text-amber-500" },
};

const PORTAL_POINTS: Record<Role, string[]> = {
  booking: ["Pesan mobil & travel antarkota", "Bayar escrow aman", "E-tiket otomatis"],
  partner: ["Kelola armada milikmu", "Tugaskan tugas ke sopir", "Payout otomatis"],
  driver: ["Terima tugas dari partner", "Inspeksi unit digital", "Mode Online fleksibel"],
  admin: ["Verifikasi KYC mitra", "Monitor seluruh transaksi", "Kendali penuh platform"],
};

function AuthGate({ onAuthed, mode }: { onAuthed: () => void; mode: Role }) {
  const [tab, setTab] = useState<"login" | "signup">("login");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [name, setName] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [showGuide, setShowGuide] = useState(false);
  const [resetMode, setResetMode] = useState(false);
  const [resetSent, setResetSent] = useState(false);
  const [resetErr, setResetErr] = useState<string | null>(null);

  const meta = ROLE_META[mode];
  const showSignup = mode === "booking";
  // Partner & booking boleh self-reset password; driver harus konfirm ke partner, admin manual DB.
  const canReset = mode === "booking" || mode === "partner";

  const submitReset = async () => {
    setResetErr(null);
    if (!email.trim()) {
      setResetErr("Isi email yang terdaftar.");
      return;
    }
    setBusy(true);
    try {
      await requestPasswordReset(email.trim());
      setResetSent(true);
    } catch (e) {
      setResetErr(e instanceof Error ? e.message : "Terjadi kesalahan.");
    } finally {
      setBusy(false);
    }
  };

  if (resetMode) {
    return (
      <div className="relative min-h-screen overflow-hidden bg-cream">
        <div aria-hidden className="pointer-events-none fixed inset-0 -z-10 overflow-hidden">
          <div className="absolute inset-0 bg-hero-warm" />
          <div className="blob left-[-7rem] top-16 h-96 w-96 bg-brand-300/30" />
          <div className="blob right-[-8rem] bottom-[-6rem] h-[28rem] w-[28rem] bg-leaf-300/30" />
        </div>
        <div className="mx-auto flex min-h-screen max-w-6xl items-center justify-center px-4 py-10 sm:px-8">
          <div className="card w-full max-w-md p-8 animate-rise">
            <span className="grid h-11 w-11 place-items-center rounded-2xl bg-gradient-to-br from-brand-500 to-leaf-500 text-white shadow-warm">
              <KeyRound className="h-5 w-5" />
            </span>
            <h1 className="mt-4 text-xl font-extrabold text-lagoon-900">Reset Kata Sandi</h1>
            {resetSent ? (
              <>
                <p className="mt-2 text-sm text-stone-500 leading-relaxed">
                  Jika email <b className="text-brand-600">{email}</b> terdaftar, tautan reset telah dikirim.
                  Cek kotak masuk Anda.
                </p>
                <button className="btn-primary btn-block mt-6" onClick={() => { setResetMode(false); setResetSent(false); }}>
                  Kembali ke Masuk
                </button>
              </>
            ) : (
              <>
                <p className="mt-2 text-[13px] text-stone-500 leading-relaxed">
                  Masukkan email terdaftar untuk peran <b className="text-brand-600">{meta.label}</b>. Kami kirim tautan reset.
                </p>
                <div className="mt-5 space-y-4">
                  <div>
                    <label className="label">Email</label>
                    <div className="relative">
                      <Mail className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-stone-500" />
                      <input className="input pl-10 font-mono text-[13px]" type="email" placeholder="nama@email.com" value={email} onChange={(e) => setEmail(e.target.value)} spellCheck={false} />
                    </div>
                  </div>
                  {resetErr && <p className="rounded-xl bg-rose-50 px-3.5 py-2.5 text-[12.5px] font-semibold text-rose-600 ring-1 ring-rose-100">{resetErr}</p>}
                  <button className="btn-primary btn-block" onClick={submitReset} disabled={busy}>
                    {busy ? "Mengirim…" : "Kirim tautan reset"}
                  </button>
                  <button className="btn-ghost btn-block" onClick={() => setResetMode(false)}>Kembali ke Masuk</button>
                </div>
              </>
            )}
          </div>
        </div>
      </div>
    );
  }

  const submit = async () => {
    setError(null);
    if (!email.trim() || !password) {
      setError("Isi email & kata sandi.");
      return;
    }
    setBusy(true);
    try {
      if (tab === "login") {
        await signIn(email.trim(), password);
      } else {
        if (!name.trim()) {
          setError("Isi nama lengkap.");
          setBusy(false);
          return;
        }
        await signUpBooking(name.trim(), email.trim(), password);
      }
      onAuthed();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Terjadi kesalahan.");
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="relative min-h-screen overflow-hidden bg-cream">
      {/* backdrop dekoratif */}
      <div aria-hidden className="pointer-events-none fixed inset-0 -z-10 overflow-hidden">
        <div className="absolute inset-0 bg-hero-warm" />
        <div className="blob left-[-7rem] top-16 h-96 w-96 bg-brand-300/30" />
        <div className="blob right-[-8rem] bottom-[-6rem] h-[28rem] w-[28rem] bg-leaf-300/30" />
      </div>

      <div className="mx-auto flex min-h-screen max-w-6xl items-center justify-center px-4 py-10 sm:px-8">
        <div className="grid w-full overflow-hidden rounded-[2rem] shadow-card-lg ring-1 ring-stone-900/5 lg:grid-cols-2">
          {/* ===== Panel brand (kiri) ===== */}
          <div className="relative hidden flex-col justify-between bg-gradient-to-br from-lagoon-900 via-lagoon-800 to-leaf-700 p-10 text-white lg:flex">
            <div className="absolute -right-16 -top-16 h-56 w-56 rounded-full bg-white/10 blur-2xl" />
            <div className="absolute -bottom-12 -left-12 h-48 w-48 rounded-full bg-teal-300/20 blur-2xl" />

            <div className="relative">
              <div className="flex items-center gap-2.5">
                <BrandLogoImg className="h-10 w-auto" />
              </div>
              <p className="mt-8 text-[12px] font-bold uppercase tracking-[0.22em] text-teal-200">
                {meta.label} Portal
              </p>
              <h2 className="mt-3 text-3xl font-extrabold leading-tight tracking-tight">
                Selamat datang di<br />RuteTrip
              </h2>
              <p className="mt-4 max-w-sm text-[14.5px] leading-relaxed text-lagoon-100/85">
                Satu platform untuk perjalanan — booking, armada partner, dan tugas driver dalam satu ekosistem.
              </p>

              <ul className="mt-8 space-y-3">
                {PORTAL_POINTS[mode].map((pt) => (
                  <li key={pt} className="flex items-center gap-2.5 text-[14px] text-lagoon-50">
                    <span className="grid h-6 w-6 shrink-0 place-items-center rounded-full bg-white/15">
                      <Sparkles className="h-3.5 w-3.5 text-teal-200" />
                    </span>
                    {pt}
                  </li>
                ))}
              </ul>
            </div>

            <div className="relative mt-10 flex items-center gap-3 rounded-2xl bg-white/10 px-4 py-3 backdrop-blur">
              <ShieldCheck className="h-5 w-5 shrink-0 text-teal-200" />
              <p className="text-[12.5px] leading-snug text-lagoon-50">
                Data &amp; transaksi diamankan escrow. Komisi transparan.
              </p>
            </div>
          </div>

          {/* ===== Form (kanan) ===== */}
          <div className="bg-white/70 p-6 backdrop-blur-xl sm:p-10">
            <div className="flex flex-col gap-1 lg:hidden">
              <BrandLogoImg className="h-10 w-auto" />
            </div>

            <div className="mx-auto max-w-sm">
              <div className="mt-2 lg:mt-0 flex items-center gap-2">
                <span className="grid h-10 w-10 place-items-center rounded-2xl bg-gradient-to-br from-brand-500 to-leaf-500 text-white shadow-warm">
                  {meta.icon}
                </span>
                <div>
                  <p className="text-[15px] font-extrabold text-lagoon-900">Masuk Portal {meta.label}</p>
                  <p className="text-[12px] text-stone-500">{meta.desc}</p>
                </div>
              </div>

              {/* Toggle */}
              <div className="mt-6 flex rounded-2xl bg-stone-100 p-1 text-[13px] font-bold">
                <button onClick={() => setTab("login")} className={tab === "login" ? "active-pill" : "pill"}>
                  <LogIn className="h-4 w-4" /> Masuk
                </button>
                {showSignup && (
                  <button onClick={() => setTab("signup")} className={tab === "signup" ? "active-pill" : "pill"}>
                    <UserIcon className="h-4 w-4" /> Daftar
                  </button>
                )}
              </div>

              <div className="mt-6 space-y-4">
                {tab === "signup" && (
                  <div>
                    <label className="label">Nama Lengkap</label>
                    <input className="input" placeholder="Nama Anda" value={name} onChange={(e) => setName(e.target.value)} />
                  </div>
                )}

                <div>
                  <label className="label">Email</label>
                  <div className="relative">
                    <Mail className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-stone-500" />
                    <input className="input pl-10 font-mono text-[13px]" type="email" placeholder="nama@email.com" value={email} onChange={(e) => setEmail(e.target.value)} spellCheck={false} />
                  </div>
                </div>

                <div>
                  <label className="label">Kata Sandi</label>
                  <div className="relative">
                    <Lock className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-stone-500" />
                    <input className="input pl-10" type="password" placeholder="••••••••" value={password} onChange={(e) => setPassword(e.target.value)} />
                  </div>
                </div>

                {error && <p className="rounded-xl bg-rose-50 px-3.5 py-2.5 text-[12.5px] font-semibold text-rose-600 ring-1 ring-rose-100">{error}</p>}

                <button className="btn-primary btn-block btn-lg" onClick={submit} disabled={busy}>
                  {busy ? "Memproses…" : (tab === "login" ? (<><LogIn className="h-4 w-4" /> Masuk</>) : (<><UserIcon className="h-4 w-4" /> Daftar</>))}
                </button>

                <p className="text-[12px] text-stone-500 leading-relaxed">
                  Belum punya akun {mode}?{" "}
                  {mode === "booking" ? "Daftar di atas." :
                   mode === "driver" ? "Akun dibuat oleh mitra tempat kamu bekerja." :
                   mode === "partner" ? "Akun dibuat & diverifikasi oleh Admin HQ." :
                   "Akun dibuat manual oleh developer (DB/SQL)."}
                </p>
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <button className="btn-ghost btn-sm" onClick={() => setShowGuide(true)}>Butuh bantuan? Lihat panduan</button>
                  {canReset && tab === "login" && (
                    <button className="btn-ghost btn-sm" onClick={() => { setResetMode(true); setResetErr(null); setResetSent(false); }}>
                      <KeyRound className="h-4 w-4" /> Lupa password?
                    </button>
                  )}
                  {mode === "driver" && (
                    <span className="text-[12px] text-stone-500">Lupa password? Konfirmasi ke partner.</span>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <Modal open={showGuide} onClose={() => setShowGuide(false)} title="Panduan akun" size="md">
        <div className="space-y-3 text-sm text-stone-600 leading-relaxed">
          <p>Akun dibuat sesuai peran:</p>
          <ul className="space-y-2">
            <li className="flex gap-2"><KeyRound className="h-4 w-4 text-brand-500 shrink-0" /><span><b>Booking</b>: daftar sendiri di halaman ini.</span></li>
            <li className="flex gap-2"><ShieldCheck className="h-4 w-4 text-brand-500 shrink-0" /><span><b>Partner</b>: dibuat &amp; diverifikasi oleh Admin HQ.</span></li>
            <li className="flex gap-2"><Users className="h-4 w-4 text-brand-500 shrink-0" /><span><b>Driver</b>: dibuat oleh mitra (email+password diisi mitra).</span></li>
            <li className="flex gap-2"><ShieldCheck className="h-4 w-4 text-brand-500 shrink-0" /><span><b>Admin</b>: dibuat manual di DB / SQL.</span></li>
          </ul>
          <p className="text-[12.5px] text-stone-500">Hubungi admin untuk akun Partner/Driver/Admin.</p>
        </div>
      </Modal>
    </div>
  );
}

export { AuthGate };
