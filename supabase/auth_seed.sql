-- ============================================================================
-- RuteTrip Platform — Seed Akun Contoh (Auth + Role binding)
-- Dijalankan SEBAGAI service_role (mis. via Supabase SQL Editor dengan
-- "Use service role", atau dashboard Authentication → Add user).
--
-- PENTING:
--   * Akun-akun ini DIBUAT MANUAL oleh admin (tidak bisa dari UI publik).
--   * Role 'booking' dibuat otomatis via trigger saat user daftar sendiri.
--   * Role 'admin'  -> dibuat manual (tidak bisa registrasi publik).
--   * Role 'partner'-> dibuat & diverifikasi admin (vendor_id wajib diisi).
--   * Role 'driver' -> dibuat oleh mitra lewat UI Partner (akun otomatis).
--
-- Cara pakai (alternatif & mudah):
--   Buka Supabase Dashboard → Authentication → Users → "Add user"
--   lalu jalankan UPDATE public.profiles SET role=..., vendor_id=..., driver_id=...
--   untuk tiap email, ATAU pakai blok PL/pgSQL di bawah ini (perlu service_role).
-- ============================================================================

-- ---------------------------------------------------------------------------
-- 1) BUAT AKUN DENGAN AUTH.ADMIN (butuh service_role). Ganti email & password.
--    Setiap blok INSERT ke auth.users diikuti insert profil + binding.
-- ---------------------------------------------------------------------------

do $$
declare
  new_id uuid;
begin
  -- --- ADMIN (developer) ---
  new_id := gen_random_uuid();
  insert into auth.users (id, instance_id, email, encrypted_password, email_confirmed_at, raw_app_meta_data, raw_user_meta_data, created_at, updated_at, role, aud)
  values (
    new_id, '00000000-0000-0000-0000-000000000000',
    'admin@rutetrip.id',
    crypt('Admin#12345', gen_salt('bf')),
    now(),
    '{"provider":"email","providers":["email"]}',
    '{"full_name":"Admin HQ"}',
    now(), now(), 'authenticated', 'authenticated'
  );
  insert into public.profiles (id, email, full_name, role, is_active)
  values (new_id, 'admin@rutetrip.id', 'Admin HQ', 'admin', true);

  -- --- PARTNER (mitra contoh) ---
  -- Ganti vendor_id dengan salah satu id vendor dari seed.sql bila perlu.
  new_id := gen_random_uuid();
  insert into auth.users (id, instance_id, email, encrypted_password, email_confirmed_at, raw_app_meta_data, raw_user_meta_data, created_at, updated_at, role, aud)
  values (
    new_id, '00000000-0000-0000-0000-000000000000',
    'partner@rutetrip.id',
    crypt('Partner#12345', gen_salt('bf')),
    now(),
    '{"provider":"email","providers":["email"]}',
    '{"full_name":"Mitra Jaya"}',
    now(), now(), 'authenticated', 'authenticated'
  );
  -- Catatan: set vendor_id setelah Anda tahu id vendor. Contoh → isi manual:
  -- insert into public.profiles (id, email, full_name, role, vendor_id, is_active)
  -- values (new_id, 'partner@rutetrip.id', 'Mitra Jaya', 'partner',
  --         (select id from public.vendors order by created_at limit 1), true);
  insert into public.profiles (id, email, full_name, role, is_active)
  values (new_id, 'partner@rutetrip.id', 'Mitra Jaya', 'partner', false);
  -- Catatan: set is_active=true & vendor_id setelah diverifikasi admin.

  -- --- DRIVER (sopir contoh) ---
  new_id := gen_random_uuid();
  insert into auth.users (id, instance_id, email, encrypted_password, email_confirmed_at, raw_app_meta_data, raw_user_meta_data, created_at, updated_at, role, aud)
  values (
    new_id, '00000000-0000-0000-0000-000000000000',
    'driver@rutetrip.id',
    crypt('Driver#12345', gen_salt('bf')),
    now(),
    '{"provider":"email","providers":["email"]}',
    '{"full_name":"Budi Sopir"}',
    now(), now(), 'authenticated', 'authenticated'
  );
  insert into public.profiles (id, email, full_name, role, is_active)
  values (new_id, 'driver@rutetrip.id', 'Budi Sopir', 'driver', true);
end $$;

-- ---------------------------------------------------------------------------
-- 2) SETELAH verifikasi: aktifkan partner & ikat vendor/driver.
--    Jalankan ini di SQL Editor (bisa dengan anon for SELECT/UPDATE via policy
--    admin, atau langsung dengan service_role).
--    GANTI <email> dengan email asli & id dari tabel terkait.
-- ---------------------------------------------------------------------------
-- update public.profiles set is_active = true, vendor_id = (select id from public.vendors limit 1)
--   where email = 'partner@rutetrip.id';
-- update public.profiles set driver_id = (select id from public.drivers limit 1)
--   where email = 'driver@rutetrip.id';
