-- ============================================================================
-- RuteTrip Platform — Skema Otorisasi (Auth + Peran + RLS per-peran)
-- Dijalankan SETELAH schema.sql & seed.sql. Jalankan SEKALI.
--
-- PERAN (role) di public.profiles:
--   'booking'  -> pelanggan booking (self-register, wajib login saat checkout)
--   'partner'  -> mitra armada (dibuat & diverifikasi oleh admin, tidak self-register)
--   'driver'   -> sopir (dibuat oleh mitra)
--   'admin'    -> developer/pengelola (dibuat manual di DB, tidak bisa registrasi publik)
-- ============================================================================

-- ---------------------------------------------------------------------------
-- TIPE ENUM role
-- ---------------------------------------------------------------------------
do $$ begin
  create type public.user_role as enum ('booking','partner','driver','admin');
exception when duplicate_object then null; end $$;

-- ---------------------------------------------------------------------------
-- PROFILES
-- ---------------------------------------------------------------------------
create table if not exists public.profiles (
  id         uuid primary key references auth.users(id) on delete cascade,
  email      text not null default '',
  full_name  text not null default '',
  role       text not null default 'booking'
             check (role in ('booking','partner','driver','admin')),
  vendor_id  uuid references public.vendors(id) on delete set null,
  driver_id  uuid references public.drivers(id) on delete set null,
  is_active  boolean not null default true,
  created_at timestamptz not null default now()
);
create index if not exists idx_profiles_role on public.profiles(role);
create index if not exists idx_profiles_vendor on public.profiles(vendor_id);

-- ---------------------------------------------------------------------------
-- FUNGSI HELPER (dipakai RLS; gunakan SECURITY DEFINER agar aman)
-- ---------------------------------------------------------------------------
create or replace function public.current_role()
returns text language sql stable security definer set search_path = public as $$
  select coalesce((select role from public.profiles where id = auth.uid()), 'anon');
$$;

create or replace function public.current_vendor_id()
returns uuid language sql stable security definer as $$
  select (select vendor_id from public.profiles where id = auth.uid());
$$;

create or replace function public.current_driver_id()
returns uuid language sql stable security definer as $$
  select (select driver_id from public.profiles where id = auth.uid());
$$;

-- ---------------------------------------------------------------------------
-- TRIGGER — buat profil otomatis saat akun Supabase dibuat.
-- ---------------------------------------------------------------------------
drop function if exists public.handle_new_user();
create or replace function public.handle_new_user()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  insert into public.profiles (id, email, full_name, role)
  values (
    new.id,
    coalesce(new.email, ''),
    coalesce(split_part(new.email, '@', 1), ''),
    'booking'
  )
  on conflict (id) do nothing;
  return new;
end $$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- ---------------------------------------------------------------------------
-- ROW LEVEL SECURITY pada profiles
-- ---------------------------------------------------------------------------
alter table public.profiles enable row level security;

drop policy if exists "profiles select self" on public.profiles;
drop policy if exists "profiles update self" on public.profiles;
drop policy if exists "profiles insert self" on public.profiles;
drop policy if exists "profiles insert by partner for driver" on public.profiles;
drop policy if exists "profiles update by partner for driver" on public.profiles;

create policy "profiles select self"
  on public.profiles for select to authenticated
  using (id = auth.uid() or public.current_role() = 'admin');

create policy "profiles update self"
  on public.profiles for update to authenticated
  using (id = auth.uid() or public.current_role() = 'admin')
  with check (id = auth.uid() or public.current_role() = 'admin');

create policy "profiles insert by partner for driver"
  on public.profiles for insert to authenticated
  with check (
    public.current_role() = 'admin'
    or (new.role = 'driver' and public.current_role() = 'partner')
  );

create policy "profiles update by partner for driver"
  on public.profiles for update to authenticated
  using (old.role = 'driver' or public.current_role() = 'admin')
  with check (
    public.current_role() = 'admin'
    or (new.role = 'driver' and public.current_role() = 'partner')
  );

-- ---------------------------------------------------------------------------
-- HAPUS kebijakan "anon full access" lama (dibuat di schema.sql lama / versi lama)
-- ---------------------------------------------------------------------------
do $$
declare t text;
begin
  foreach t in array array['vendors','vehicles','routes','drivers','orders','inspections','payouts','settings']
  loop
    execute format('drop policy if exists "anon full access %s" on public.%I', t, t);
  end loop;
end $$;

-- ---------------------------------------------------------------------------
-- RLS per-peran pada tabel bisnis
-- ---------------------------------------------------------------------------

-- VEHICLES: baca publik, tulis admin / partner pemilik
drop policy if exists "vehicles read anon" on public.vehicles;
create policy "vehicles read anon" on public.vehicles
  for select to anon, authenticated using (true);
drop policy if exists "vehicles admin all" on public.vehicles;
create policy "vehicles admin all" on public.vehicles
  for all to authenticated using (public.current_role() = 'admin') with check (public.current_role() = 'admin');
drop policy if exists "vehicles partner own" on public.vehicles;
create policy "vehicles partner own" on public.vehicles
  for all to authenticated
  using (public.current_role() = 'partner' and vendor_id = public.current_vendor_id())
  with check (public.current_role() = 'partner' and vendor_id = public.current_vendor_id());

-- ROUTES: baca publik, tulis admin / partner pemilik
drop policy if exists "routes read anon" on public.routes;
create policy "routes read anon" on public.routes
  for select to anon, authenticated using (true);
drop policy if exists "routes admin all" on public.routes;
create policy "routes admin all" on public.routes
  for all to authenticated using (public.current_role() = 'admin') with check (public.current_role() = 'admin');
drop policy if exists "routes partner own" on public.routes;
create policy "routes partner own" on public.routes
  for all to authenticated
  using (public.current_role() = 'partner' and vendor_id = public.current_vendor_id())
  with check (public.current_role() = 'partner' and vendor_id = public.current_vendor_id());

-- DRIVERS: baca admin/partner pemilik/sopir itu sendiri; tulis admin/partner pemilik
drop policy if exists "drivers read" on public.drivers;
create policy "drivers read" on public.drivers
  for select to authenticated
  using (
    public.current_role() = 'admin'
    or (public.current_role() = 'partner' and vendor_id = public.current_vendor_id())
    or (public.current_role() = 'driver' and id = public.current_driver_id())
  );
drop policy if exists "drivers write admin" on public.drivers;
create policy "drivers write admin" on public.drivers
  for all to authenticated using (public.current_role() = 'admin') with check (public.current_role() = 'admin');
drop policy if exists "drivers partner write" on public.drivers;
create policy "drivers partner write" on public.drivers
  for all to authenticated
  using (public.current_role() = 'partner' and vendor_id = public.current_vendor_id())
  with check (public.current_role() = 'partner' and vendor_id = public.current_vendor_id());

-- ORDERS: baca publik, tulis sesuai alur
drop policy if exists "orders read" on public.orders;
create policy "orders read" on public.orders
  for select to anon, authenticated using (true);
drop policy if exists "orders create customer" on public.orders;
create policy "orders create customer" on public.orders
  for insert to authenticated
  with check (public.current_role() in ('booking','partner','admin'));
drop policy if exists "orders update partner" on public.orders;
create policy "orders update partner" on public.orders
  for update to authenticated
  using (
    public.current_role() = 'admin'
    or (public.current_role() = 'partner' and vendor_id = public.current_vendor_id())
  )
  with check (
    public.current_role() = 'admin'
    or (public.current_role() = 'partner' and vendor_id = public.current_vendor_id())
  );
drop policy if exists "orders update driver" on public.orders;
create policy "orders update driver" on public.orders
  for update to authenticated
  using (public.current_role() = 'driver' and driver_id = public.current_driver_id())
  with check (public.current_role() = 'driver' and driver_id = public.current_driver_id());

-- PAYOUTS: partner pemilik & admin
drop policy if exists "payouts read" on public.payouts;
create policy "payouts read" on public.payouts
  for select to authenticated
  using (
    public.current_role() = 'admin'
    or (public.current_role() = 'partner' and vendor_id = public.current_vendor_id())
  );
drop policy if exists "payouts write" on public.payouts;
create policy "payouts write" on public.payouts
  for all to authenticated
  using (
    public.current_role() = 'admin'
    or (public.current_role() = 'partner' and vendor_id = public.current_vendor_id())
  )
  with check (
    public.current_role() = 'admin'
    or (public.current_role() = 'partner' and vendor_id = public.current_vendor_id())
  );

-- INSPECTIONS: driver & admin
drop policy if exists "inspections driver" on public.inspections;
create policy "inspections driver" on public.inspections
  for all to authenticated
  using (public.current_role() = 'admin' or (public.current_role() = 'driver' and driver_id = public.current_driver_id()))
  with check (public.current_role() = 'admin' or (public.current_role() = 'driver' and driver_id = public.current_driver_id()));

-- SETTINGS: read anon, tulis admin
drop policy if exists "settings read anon" on public.settings;
create policy "settings read anon" on public.settings
  for select to anon, authenticated using (true);
drop policy if exists "settings admin write" on public.settings;
create policy "settings admin write" on public.settings
  for all to authenticated using (public.current_role() = 'admin') with check (public.current_role() = 'admin');

-- VENDORS: read anon, insert anon (pendaftaran), update admin/partner pemilik
drop policy if exists "vendors read anon" on public.vendors;
create policy "vendors read anon" on public.vendors
  for select to anon, authenticated using (true);
drop policy if exists "vendors insert anon" on public.vendors;
create policy "vendors insert anon" on public.vendors
  for insert to anon with check (true);
drop policy if exists "vendors admin all" on public.vendors;
create policy "vendors admin all" on public.vendors
  for all to authenticated using (public.current_role() = 'admin') with check (public.current_role() = 'admin');
drop policy if exists "vendors partner own" on public.vendors;
create policy "vendors partner own" on public.vendors
  for update to authenticated
  using (public.current_role() = 'partner' and id = public.current_vendor_id())
  with check (public.current_role() = 'partner' and id = public.current_vendor_id());

-- ============================================================================
-- SELESAI. Setelah ini, buat akun contoh (lihat auth_seed.sql) lalu ikat vendor_id/driver_id.
-- ============================================================================
