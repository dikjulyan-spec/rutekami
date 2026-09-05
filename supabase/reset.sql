-- =====================================================================
-- RuteTrip Platform — RESET DATABASE (drop semua tabel lalu mulai bersih)
--
-- GUNAKAN bila schema kamu dalam kondisi tidak konsisten / error seperti
-- "column vendor_id does not exist" / "relation does not exist".
--
-- ⚠️ PERINGATAN: skrip ini MENGHAPUS semua tabel di bawah beserta datanya.
--    Untuk proyek demo dengan data seed, ini aman.
--    Untuk proyek yang sudah berisi data asli, JANGAN jalankan tanpa backup.
--
-- Cara pakai (di SQL Editor Supabase, urutkan):
--   1) reset.sql   (skrip ini — bersihkan tabel lama yang rusak)
--   2) schema.sql  (buat ulang tabel + trigger + RLS + bucket)
--   3) seed.sql    (isikan data contoh)
-- =====================================================================

-- Hapus trigger functions dulu
drop function if exists public.handle_order_completion cascade;
drop function if exists public.handle_payout_completion cascade;

-- Hapus tabel (CASCADE menangani foreign key)
drop table if exists public.inspections cascade;
drop table if exists public.orders      cascade;
drop table if exists public.payouts     cascade;
drop table if exists public.routes      cascade;
drop table if exists public.drivers     cascade;
drop table if exists public.vehicles    cascade;
drop table if exists public.vendors     cascade;
drop table if exists public.settings    cascade;

-- Pastikan RLS tidak terkunci oleh kebijakan lama
alter table if exists public.vendors     disable row level security;
alter table if exists public.vehicles    disable row level security;
alter table if exists public.routes      disable row level security;
alter table if exists public.drivers     disable row level security;
alter table if exists public.orders      disable row level security;
alter table if exists public.inspections disable row level security;
alter table if exists public.payouts     disable row level security;
alter table if exists public.settings    disable row level security;

-- Selesai. Lanjutkan menjalankan schema.sql lalu seed.sql.
