-- =====================================================================
-- Travondo Platform (NusaTravelLab) — Skema Database PostgreSQL
-- Cara pakai: Buka Supabase Dashboard → SQL Editor → tempel & Run.
-- Jalankan skema ini SEKALI, lalu jalankan seed.sql (data contoh).
-- =====================================================================

create extension if not exists pgcrypto;

-- ---------------------------------------------------------------------
-- VENDORS (Mitra/Vendor armada — KYC & wallet)
-- ---------------------------------------------------------------------
create table if not exists public.vendors (
  id            uuid primary key default gen_random_uuid(),
  business_name text not null,
  owner_name    text not null,
  email         text default '',
  phone         text default '',
  city          text default '',
  status        text not null default 'pending'
                check (status in ('pending','verified','rejected')),
  kyc_nib       text,
  kyc_npwp      text,
  kyc_insurance text,
  wallet_balance bigint not null default 0,
  created_at    timestamptz not null default now()
);

-- ---------------------------------------------------------------------
-- VEHICLES (Unit armada partner)
-- ---------------------------------------------------------------------
create table if not exists public.vehicles (
  id                uuid primary key default gen_random_uuid(),
  vendor_id         uuid not null references public.vendors(id) on delete cascade,
  name              text not null,
  category          text not null
                    check (category in ('MPV','Medium MPV','SUV','City Car','Minibus','Luxury')),
  plate             text not null default '',
  seats             int  not null default 5,
  luggage           int  not null default 2,
  transmission      text not null default 'Automatic'
                    check (transmission in ('Automatic','Manual','CVT')),
  price_per_day     bigint not null default 0,
  price_with_driver bigint,
  allow_self_drive  boolean not null default true,
  image_url         text,
  cities            text[] not null default '{}',
  is_active         boolean not null default true,
  created_at        timestamptz not null default now()
);
create index if not exists idx_vehicles_vendor on public.vehicles(vendor_id);

-- ---------------------------------------------------------------------
-- ROUTES (Trayek travel/shuttle antarkota)
-- ---------------------------------------------------------------------
create table if not exists public.routes (
  id             uuid primary key default gen_random_uuid(),
  vendor_id      uuid not null references public.vendors(id) on delete cascade,
  origin         text not null,
  destination    text not null,
  fleet_type     text not null default 'Hiace Premio',
  price_per_seat bigint not null default 0,
  departures     text[] not null default '{}',
  is_active      boolean not null default true,
  created_at     timestamptz not null default now()
);
create index if not exists idx_routes_vendor on public.routes(vendor_id);

-- ---------------------------------------------------------------------
-- DRIVERS (Sopir milik vendor)
-- ---------------------------------------------------------------------
create table if not exists public.drivers (
  id         uuid primary key default gen_random_uuid(),
  vendor_id  uuid not null references public.vendors(id) on delete cascade,
  name       text not null,
  phone      text default '',
  status     text not null default 'Offline'
             check (status in ('Online','Istirahat','Offline')),
  created_at timestamptz not null default now()
);
create index if not exists idx_drivers_vendor on public.drivers(vendor_id);

-- ---------------------------------------------------------------------
-- ORDERS (Pesanan rental + travel, sumber escrow & komisi)
-- ---------------------------------------------------------------------
create table if not exists public.orders (
  id              uuid primary key default gen_random_uuid(),
  order_code      text not null unique,
  type            text not null check (type in ('rental','travel')),
  title           text not null,
  customer_name   text not null,
  customer_phone  text default '',
  vendor_id       uuid references public.vendors(id) on delete set null,
  vehicle_id      uuid references public.vehicles(id) on delete set null,
  route_id        uuid references public.routes(id) on delete set null,
  driver_id       uuid references public.drivers(id) on delete set null,
  departure_date  date not null,
  departure_time  text not null default '08:00',
  pickup_point    text default '',
  seat_count      int not null default 1,
  duration_days   int not null default 1,
  insurance       boolean not null default false,
  insurance_cost  bigint not null default 0,
  total_price     bigint not null default 0,
  status          text not null default 'Perlu Konfirmasi'
                  check (status in ('Perlu Konfirmasi','Sedang Berjalan','Selesai','Dibatalkan')),
  checked_in      boolean not null default false,
  notes           text default '',
  created_at      timestamptz not null default now()
);
create index if not exists idx_orders_vendor on public.orders(vendor_id);
create index if not exists idx_orders_driver on public.orders(driver_id);
create index if not exists idx_orders_status on public.orders(status);
create index if not exists idx_orders_code on public.orders(order_code);

-- ---------------------------------------------------------------------
-- INSPECTIONS (Inspeksi fisik unit oleh driver)
-- ---------------------------------------------------------------------
create table if not exists public.inspections (
  id             uuid primary key default gen_random_uuid(),
  driver_id      uuid not null references public.drivers(id) on delete cascade,
  vehicle_id     uuid not null references public.vehicles(id) on delete cascade,
  order_id       uuid references public.orders(id) on delete set null,
  km_start       bigint not null default 0,
  km_end         bigint,
  fuel_start     text,
  fuel_end       text,
  body_condition text not null default 'Baik',
  damage_notes   text default '',
  created_at     timestamptz not null default now(),
  updated_at     timestamptz not null default now()
);
create index if not exists idx_inspections_driver on public.inspections(driver_id);
create index if not exists idx_inspections_order on public.inspections(order_id);

-- ---------------------------------------------------------------------
-- PAYOUTS (Penarikan saldo partner)
-- ---------------------------------------------------------------------
create table if not exists public.payouts (
  id             uuid primary key default gen_random_uuid(),
  vendor_id      uuid not null references public.vendors(id) on delete cascade,
  amount         bigint not null default 0,
  bank_name      text not null default '',
  account_number text not null default '',
  account_name   text not null default '',
  status         text not null default 'Diajukan'
                 check (status in ('Diajukan','Diproses','Selesai','Ditolak')),
  created_at     timestamptz not null default now()
);
create index if not exists idx_payouts_vendor on public.payouts(vendor_id);

-- ---------------------------------------------------------------------
-- SETTINGS (Konfigurasi platform / API keys — prototype only)
-- ---------------------------------------------------------------------
create table if not exists public.settings (
  key        text primary key,
  value      text not null default '',
  updated_at timestamptz not null default now()
);

-- =====================================================================
-- TRIGGER 1 — ESCROW & KOMISI PLATFORM
-- Saat pesanan berstatus 'Selesai', 90% total masuk wallet vendor.
-- (10% sisanya = komisi platform, dihitung langsung dari data orders.)
-- =====================================================================
create or replace function public.handle_order_completion()
returns trigger language plpgsql as $$
begin
  if NEW.status = 'Selesai' and (TG_OP = 'INSERT' or OLD.status is distinct from 'Selesai') then
    if NEW.vendor_id is not null then
      update public.vendors
         set wallet_balance = wallet_balance + floor(NEW.total_price * 0.90)
       where id = NEW.vendor_id;
    end if;
  end if;
  return NEW;
end $$;

drop trigger if exists trg_order_completion on public.orders;
create trigger trg_order_completion
  after insert or update of status on public.orders
  for each row execute function public.handle_order_completion();

-- =====================================================================
-- TRIGGER 2 — PAYOUT TERSELESAIKAN = saldo vendor dikurangi
-- =====================================================================
create or replace function public.handle_payout_completion()
returns trigger language plpgsql as $$
begin
  if NEW.status = 'Selesai' and (TG_OP = 'INSERT' or OLD.status is distinct from 'Selesai') then
    update public.vendors
       set wallet_balance = wallet_balance - NEW.amount
     where id = NEW.vendor_id and wallet_balance >= NEW.amount;
    if not found then
      raise exception 'Saldo vendor tidak mencukupi untuk payout %', NEW.id;
    end if;
  end if;
  return NEW;
end $$;

drop trigger if exists trg_payout_completion on public.payouts;
create trigger trg_payout_completion
  after insert or update of status on public.payouts
  for each row execute function public.handle_payout_completion();

-- =====================================================================
-- ROW LEVEL SECURITY
-- Mode prototype/demo: semua role berbagi satu build statis dengan anon
-- key, jadi kebijakan memberi akses penuh ke anon. UNTUK PRODUKSI:
-- batasi hanya untuk authenticated + per-role (lihat README).
-- =====================================================================
alter table public.vendors     enable row level security;
alter table public.vehicles    enable row level security;
alter table public.routes      enable row level security;
alter table public.drivers     enable row level security;
alter table public.orders      enable row level security;
alter table public.inspections enable row level security;
alter table public.payouts     enable row level security;
alter table public.settings    enable row level security;

do $$
declare t text;
begin
  foreach t in array array['vendors','vehicles','routes','drivers','orders','inspections','payouts','settings']
  loop
    execute format('drop policy if exists "anon full access %s" on public.%I', t, t);
    execute format(
      'create policy "anon full access %s" on public.%I for all to anon using (true) with check (true)',
      t, t
    );
  end loop;
end $$;

-- =====================================================================
-- STORAGE — bucket foto unit armada (public read, upload via anon)
-- =====================================================================
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'vehicle-photos',
  'vehicle-photos',
  true,
  15728640, -- 15 MB
  array['image/jpeg','image/png','image/webp','image/svg+xml']
)
on conflict (id) do update set public = true, file_size_limit = excluded.file_size_limit;

drop policy if exists "vehicle-photos read"   on storage.objects;
drop policy if exists "vehicle-photos insert" on storage.objects;
drop policy if exists "vehicle-photos update" on storage.objects;
drop policy if exists "vehicle-photos delete" on storage.objects;

create policy "vehicle-photos read"   on storage.objects for select to anon using (bucket_id = 'vehicle-photos');
create policy "vehicle-photos insert" on storage.objects for insert to anon with check (bucket_id = 'vehicle-photos');
create policy "vehicle-photos update" on storage.objects for update to anon using (bucket_id = 'vehicle-photos');
create policy "vehicle-photos delete" on storage.objects for delete to anon using (bucket_id = 'vehicle-photos');
