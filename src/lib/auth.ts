import { getClient, getActiveConfig } from "./supabase";
import { createClient } from "@supabase/supabase-js";
import type { Session, User } from "@supabase/supabase-js";

/**
 * Lapisan autentikasi & peran RuteTrip.
 *
 * Menggunakan Supabase Auth (email + password). Setiap akun memiliki SATU baris
 * di tabel public.profiles yang menentukan peran (role): booking | partner | driver | admin.
 *
 * Alur:
 *  - booking  : self-register (role default 'booking' dari trigger).
 *  - partner  : dibuat & diverifikasi oleh admin (tidak self-register). Saat dibuat,
 *               admin memberi role 'partner' + vendor_id.
 *  - driver   : dibuat oleh mitra (partner mengetik email+password sopir di UI).
 *  - admin    : dibuat manual di DB / SQL (tidak bisa registrasi publik).
 */

export type Role = "booking" | "partner" | "driver" | "admin";

export interface ProfileRow {
  id: string;
  email: string;
  full_name: string;
  role: Role;
  vendor_id: string | null;
  driver_id: string | null;
  is_active: boolean;
  created_at: string;
}

/** Sesi aktif + profil peran (berisi role & binding vendor/driver). */
export interface AuthState {
  session: Session;
  user: User;
  profile: ProfileRow;
}

// ---------------------------------------------------------------------------
// Operasi auth (sesi ditangani otomatis oleh Supabase persistSession).
// ---------------------------------------------------------------------------

export async function signIn(email: string, password: string): Promise<AuthState> {
  const sb = getClient();
  const { data, error } = await sb.auth.signInWithPassword({ email, password });
  if (error) throw new Error(mapAuthError(error.message));
  if (!data.session) throw new Error("Tidak ada sesi yang dikembalikan.");
  const profile = await fetchMyProfile(data.user.id);
  return { session: data.session, user: data.user, profile };
}

export async function signOut(): Promise<void> {
  const sb = getClient();
  // scope 'local': hanya mencabut sesi portal ini (tiap portal punya sesi sendiri).
  await sb.auth.signOut({ scope: "local" }).catch(() => undefined);
}

/** Minta email reset password (Supabase Auth). Hanya untuk peran yang mengizinkan self-reset. */
export async function requestPasswordReset(email: string): Promise<void> {
  const sb = getClient();
  const { error } = await sb.auth.resetPasswordForEmail(email, {
    redirectTo: window.location.origin + "/index.html",
  });
  if (error) throw new Error(mapAuthError(error.message));
}

/** Pendaftaran untuk peran 'booking' (pelanggan). */
export async function signUpBooking(fullName: string, email: string, password: string): Promise<AuthState> {
  const sb = getClient();
  const { data, error } = await sb.auth.signUp({
    email,
    password,
    options: { data: { full_name: fullName } },
  });
  if (error) throw new Error(mapAuthError(error.message));
  if (!data.session) throw new Error("Pendaftaran berhasil. Silakan masuk.");
  const profile = await fetchMyProfile(data.user!.id);
  return { session: data.session, user: data.user!, profile };
}

// ---------------------------------------------------------------------------
// Profil & peran
// ---------------------------------------------------------------------------

export async function fetchMyProfile(userId: string): Promise<ProfileRow> {
  const sb = getClient();
  const { data, error } = await sb
    .from("profiles")
    .select("*")
    .eq("id", userId)
    .maybeSingle();
  if (error) throw new Error(`Gagal memuat profil: ${error.message}`);
  if (!data) {
    // Profil belum ada (mis. user dibuat sebelum trigger) — buat default booking.
    const { data: created, error: cerr } = await sb
      .from("profiles")
      .insert({ id: userId, role: "booking" })
      .select("*")
      .single();
    if (cerr) throw new Error(`Profil tidak ditemukan: ${cerr.message}`);
    return created as ProfileRow;
  }
  return data as ProfileRow;
}

export async function getMyAuthState(): Promise<AuthState | null> {
  const sb = getClient();
  // Baca sesi dari client Supabase (sudah persist otomatis).
  const { data, error } = await sb.auth.getSession();
  if (error || !data.session) return null;
  const user = data.session.user;
  try {
    const profile = await fetchMyProfile(user.id);
    // Akun nonaktif (mis. partner belum diverifikasi) — tolak akses.
    if (!profile.is_active) return null;
    return { session: data.session, user, profile };
  } catch {
    return null;
  }
}

export function roleOf(state: AuthState | null): Role | null {
  return state?.profile?.role ?? null;
}

export function isAuthorized(state: AuthState | null, allowed: Role[]): boolean {
  if (!state) return false;
  return allowed.includes(state.profile.role);
}

// ---------------------------------------------------------------------------
// Helper — email unik & pembuatan akun oleh admin/partner
// ---------------------------------------------------------------------------

export async function emailExists(email: string): Promise<boolean> {
  const sb = getClient();
  const { data, error } = await sb.auth.admin.listUsers({ page: 1, perPage: 1000 });
  // admin API butuh service_role; kalau gagal, cek via profiles.
  if (error) {
    const { data: d2, error: e2 } = await sb.from("profiles").select("email").eq("email", email).maybeSingle();
    if (e2) throw new Error("Tidak dapat memeriksa email. Coba lagi.");
    return !!d2;
  }
  return (data.users ?? []).some((u) => u.email?.toLowerCase() === email.toLowerCase());
}

/** Partner/admin membuat akun driver (mitra mengetik email+password sopir). */
export async function createDriverAccount(input: {
  email: string;
  password: string;
  name: string;
  driverId: string;
}): Promise<void> {
  const sb = getClient();
  const cfg = getActiveConfig();
  if (!cfg) throw new Error("Supabase belum dikonfigurasi.");

  // PENTING: signUp otomatis membuat sesi login sebagai akun baru. Kalau memakai
  // client utama, sesi PARTNER yang sedang login akan tertimpa jadi driver.
  // Karena itu pakai client sementara tanpa persist session.
  const temp = createClient(cfg.url, cfg.anonKey, {
    auth: { persistSession: false, autoRefreshToken: false, storageKey: "rutetrip-auth-temp" },
  });

  const { data, error } = await temp.auth.signUp({
    email: input.email,
    password: input.password,
    options: { data: { full_name: input.name } },
  });
  if (error) throw new Error(mapAuthError(error.message));
  const userId = data.user?.id;
  if (!userId) throw new Error("Gagal membuat akun driver (mungkin email sudah terdaftar).");

  // Set role driver + binding driver_id + aktifkan (via client partner, sesi tetap utuh).
  const { error: perr } = await sb
    .from("profiles")
    .update({ role: "driver", driver_id: input.driverId, full_name: input.name, is_active: true })
    .eq("id", userId);
  if (perr) throw new Error(`Gagal mengatur role driver: ${perr.message}`);
}

// ---------------------------------------------------------------------------
// Error mapping
// ---------------------------------------------------------------------------

function mapAuthError(msg: string): string {
  const m = msg.toLowerCase();
  if (m.includes("invalid login")) return "Email atau kata sandi salah.";
  if (m.includes("already registered") || m.includes("already been registered")) return "Email sudah terdaftar. Silakan masuk.";
  if (m.includes("password")) return "Kata sandi terlalu pendek / tidak memenuhi syarat.";
  if (m.includes("email not confirmed")) return "Email belum dikonfirmasi. Cek inbox Anda.";
  return msg;
}
