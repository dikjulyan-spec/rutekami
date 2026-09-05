-- =====================================================================
-- Travondo Platform — Seed Data Contoh
-- Jalankan SETELAH schema.sql. Semua id memakai UUID tetap agar mudah
-- dilacak. Saldo wallet vendor dihitung OTOMATIS oleh trigger:
-- pesanan 'Selesai' mengkredit 90%, payout 'Selesai' mengurangi saldo.
-- =====================================================================

-- ---------------------------------------------------------------- VENDORS
insert into public.vendors (id, business_name, owner_name, email, phone, city, status, kyc_nib, kyc_npwp, kyc_insurance, wallet_balance, created_at) values
('00000000-0000-0000-0000-0000000000a1', 'PT Armada Nusantara',   'Andi Pratama',  'andi@armadanusantara.co.id', '0812-1000-2001', 'Jakarta',   'verified', 'NIB 8120001234567', 'NPWP 01.234.567.8-012.000', 'Polis Asuransi AJB-884120', 0, now() - interval '45 days'),
('00000000-0000-0000-0000-0000000000a2', 'CV Bali Roda Wisata',   'I Made Wirya',  'made@balirodawisata.co.id', '0817-1000-2002', 'Denpasar',  'verified', 'NIB 5120009876543', 'NPWP 02.345.678.9-905.000',  'Polis Asuransi Bumiputra-55231', 0, now() - interval '30 days'),
('00000000-0000-0000-0000-0000000000a3', 'PT Trans Jawa Sejahtera', 'Siti Rahma',  'siti@transjawa.co.id',     '0856-1000-2003', 'Surabaya',  'pending',  NULL, NULL, NULL, 0, now() - interval '10 days');

-- ---------------------------------------------------------------- VEHICLES
insert into public.vehicles (id, vendor_id, name, category, plate, seats, luggage, transmission, price_per_day, price_with_driver, allow_self_drive, image_url, cities, is_active, created_at) values
('00000000-0000-0000-0000-0000000000b1', '00000000-0000-0000-0000-0000000000a1', 'Toyota Innova Zenix',  'MPV',         'B 1234 TAV', 7,  4,  'Automatic', 750000,  950000,  true,  'https://picsum.photos/seed/travondo-zenix/800/520',  '{Jakarta,Bogor,Depok,Tangerang,Bekasi,Bandung}', true, now() - interval '40 days'),
('00000000-0000-0000-0000-0000000000b2', '00000000-0000-0000-0000-0000000000a1', 'Honda Brio Satya',     'City Car',    'B 5678 QWX', 5,  2,  'Manual',    300000,  450000,  true,  'https://picsum.photos/seed/travondo-brio/800/520',   '{Jakarta,Bogor,Depok,Tangerang,Bekasi}',          true, now() - interval '38 days'),
('00000000-0000-0000-0000-0000000000b3', '00000000-0000-0000-0000-0000000000a1', 'Hyundai Stargazer',    'MPV',         'B 9012 CVA', 7,  3,  'Automatic', 550000,  750000,  true,  'https://picsum.photos/seed/travondo-stargazer/800/520', '{Jakarta,Bogor,Depok,Tangerang,Bekasi,Bandung}', true, now() - interval '35 days'),
('00000000-0000-0000-0000-0000000000b4', '00000000-0000-0000-0000-0000000000a1', 'Isuzu ELF Long',       'Minibus',     'B 7890 UKA', 15, 8,  'Manual',    1800000, 2100000, false, 'https://picsum.photos/seed/travondo-elf/800/520',    '{Jakarta,Bogor,Depok,Tangerang,Bekasi,Bandung,Cirebon,Semarang}', true, now() - interval '33 days'),
('00000000-0000-0000-0000-0000000000b5', '00000000-0000-0000-0000-0000000000a1', 'Toyota Alphard',       'Luxury',      'B 1 NUSA',   7,  5,  'Automatic', 2500000, 2900000, false, 'https://picsum.photos/seed/travondo-alphard/800/520', '{Jakarta,Bogor,Bandung}', true, now() - interval '30 days'),
('00000000-0000-0000-0000-0000000000b6', '00000000-0000-0000-0000-0000000000a2', 'Suzuki Ertiga',        'Medium MPV',  'DK 4321 GG', 7,  3,  'Manual',    450000,  650000,  true,  'https://picsum.photos/seed/travondo-ertiga/800/520',  '{Denpasar,Kuta,Sanur,Ubud,Canggu,Seminyak,Uluwatu,Nusa Dua}', true, now() - interval '28 days'),
('00000000-0000-0000-0000-0000000000b7', '00000000-0000-0000-0000-0000000000a2', 'Hyundai Creta',        'SUV',         'DK 8765 JI', 5,  4,  'Automatic', 900000,  1200000, true,  'https://picsum.photos/seed/travondo-creta/800/520',   '{Denpasar,Kuta,Sanur,Ubud,Canggu,Seminyak,Uluwatu,Nusa Dua}', true, now() - interval '25 days'),
('00000000-0000-0000-0000-0000000000b8', '00000000-0000-0000-0000-0000000000a2', 'Toyota HiAce Premio',  'Minibus',     'DK 1122 RB', 12, 10, 'Manual',    1600000, 2000000, false, 'https://picsum.photos/seed/travondo-hiace/800/520',   '{Denpasar,Kuta,Sanur,Ubud,Canggu,Seminyak,Uluwatu,Nusa Dua,Lovina}', true, now() - interval '22 days'),
('00000000-0000-0000-0000-0000000000b9', '00000000-0000-0000-0000-0000000000a3', 'Toyota Innova Reborn', 'MPV',         'L 9988 AA',  7,  4,  'Automatic', 700000,  900000,  true,  'https://picsum.photos/seed/travondo-reborn/800/520',  '{Surabaya,Malang,Sidoarjo,Gresik}', true, now() - interval '12 days');

-- ---------------------------------------------------------------- ROUTES
insert into public.routes (id, vendor_id, origin, destination, fleet_type, price_per_seat, departures, is_active, created_at) values
('00000000-0000-0000-0000-0000000000c1', '00000000-0000-0000-0000-0000000000a1', 'Jakarta',  'Bandung',   'Hiace Premio', 150000, '{06:00,08:00,10:00,14:00,17:00}', true, now() - interval '40 days'),
('00000000-0000-0000-0000-0000000000c2', '00000000-0000-0000-0000-0000000000a1', 'Jakarta',  'Cirebon',   'ELF Long',     130000, '{07:00,09:00,13:00,16:00}',       true, now() - interval '38 days'),
('00000000-0000-0000-0000-0000000000c3', '00000000-0000-0000-0000-0000000000a2', 'Denpasar', 'Ubud',      'ELF Short',    60000,  '{07:00,09:00,11:00,13:00,15:00,17:00}', true, now() - interval '26 days'),
('00000000-0000-0000-0000-0000000000c4', '00000000-0000-0000-0000-0000000000a2', 'Denpasar', 'Lovina',    'Hiace Premio', 110000, '{06:00,08:00,12:00}',             true, now() - interval '24 days'),
('00000000-0000-0000-0000-0000000000c5', '00000000-0000-0000-0000-0000000000a3', 'Surabaya', 'Malang',    'Hiace Premio', 80000,  '{06:30,09:00,12:00,15:00,18:00}', true, now() - interval '10 days');

-- ---------------------------------------------------------------- DRIVERS
insert into public.drivers (id, vendor_id, name, phone, status, created_at) values
('00000000-0000-0000-0000-0000000000d1', '00000000-0000-0000-0000-0000000000a1', 'Budi Santoso',  '0812-3456-0001', 'Online',    now() - interval '40 days'),
('00000000-0000-0000-0000-0000000000d2', '00000000-0000-0000-0000-0000000000a1', 'Joko Susilo',   '0812-3456-0002', 'Offline',   now() - interval '35 days'),
('00000000-0000-0000-0000-0000000000d3', '00000000-0000-0000-0000-0000000000a1', 'Agus Wijaya',   '0813-3456-0003', 'Istirahat', now() - interval '32 days'),
('00000000-0000-0000-0000-0000000000d4', '00000000-0000-0000-0000-0000000000a2', 'Made Surya',    '0817-3456-0004', 'Online',    now() - interval '26 days'),
('00000000-0000-0000-0000-0000000000d5', '00000000-0000-0000-0000-0000000000a2', 'Wayan Gede',    '0819-3456-0005', 'Offline',   now() - interval '22 days'),
('00000000-0000-0000-0000-0000000000d6', '00000000-0000-0000-0000-0000000000a3', 'Rudi Hartono',  '0856-3456-0006', 'Offline',   now() - interval '9 days');

-- ---------------------------------------------------------------- ORDERS
insert into public.orders (id, order_code, type, title, customer_name, customer_phone, vendor_id, vehicle_id, route_id, driver_id, departure_date, departure_time, pickup_point, seat_count, duration_days, insurance, insurance_cost, total_price, status, notes, created_at) values
-- Rental sedang berjalan (driver Budi, inspeksi awal sudah dibuat di bawah)
('00000000-0000-0000-0000-0000000000e1', 'TRV-DEMO-0001', 'rental', 'Rental Toyota Innova Zenix · 3 hari (Dengan Sopir)', 'Rina Kusuma', '0812-3456-7890', '00000000-0000-0000-0000-0000000000a1', '00000000-0000-0000-0000-0000000000b1', NULL, '00000000-0000-0000-0000-0000000000d1', current_date + 2, '08:00', 'Hotel Borobudur, Jakarta Pusat', 1, 3, false, 0, 2850000, 'Sedang Berjalan', 'Minta jemput di lobby hotel', now() - interval '1 day'),
-- Rental selesai (self-drive, tanpa sopir)
('00000000-0000-0000-0000-0000000000e2', 'TRV-DEMO-0002', 'rental', 'Rental Honda Brio Satya · 2 hari (Lepas Kunci)', 'Dewi Lestari', '0811-9876-5432', '00000000-0000-0000-0000-0000000000a1', '00000000-0000-0000-0000-0000000000b2', NULL, NULL, current_date - 6, '09:00', 'Jl. Sudirman No. 12, Jakarta', 1, 2, false, 0, 600000, 'Selesai', '', now() - interval '12 days'),
-- Travel selesai (Jakarta -> Bandung)
('00000000-0000-0000-0000-0000000000e3', 'TRV-DEMO-0003', 'travel', 'Travel Jakarta → Bandung · 4 kursi', 'Fajar Ramadhan', '0813-5555-1111', '00000000-0000-0000-0000-0000000000a1', NULL, '00000000-0000-0000-0000-0000000000c1', '00000000-0000-0000-0000-0000000000d1', current_date - 7, '08:00', 'Terminal Pulogebang, Jakarta Timur', 4, 1, false, 0, 600000, 'Selesai', '', now() - interval '13 days'),
-- Travel dibatalkan
('00000000-0000-0000-0000-0000000000e4', 'TRV-DEMO-0004', 'travel', 'Travel Jakarta → Cirebon · 2 kursi', 'Sinta Melati', '0819-2222-3333', '00000000-0000-0000-0000-0000000000a1', NULL, '00000000-0000-0000-0000-0000000000c2', NULL, current_date - 2, '09:00', 'Rumah Sinta, Bekasi', 2, 1, false, 0, 260000, 'Dibatalkan', 'Perubahan jadwal mendadak', now() - interval '8 days'),
-- Travel perlu konfirmasi + asuransi (contoh kalkulator biaya)
('00000000-0000-0000-0000-0000000000e5', 'TRV-DEMO-0005', 'travel', 'Travel Jakarta → Bandung · 3 kursi', 'Bima Putra', '0821-7777-8888', '00000000-0000-0000-0000-0000000000a1', NULL, '00000000-0000-0000-0000-0000000000c1', NULL, current_date + 5, '10:00', 'Tol Jagorawi Gate Cikeas', 3, 1, true, 22500, 472500, 'Perlu Konfirmasi', '', now() - interval '3 hours'),
-- Rental Alphard perlu konfirmasi (escrow besar)
('00000000-0000-0000-0000-0000000000e6', 'TRV-DEMO-0006', 'rental', 'Rental Toyota Alphard · 5 hari (Dengan Sopir)', 'Kevin Hartono', '0815-4444-5555', '00000000-0000-0000-0000-0000000000a1', '00000000-0000-0000-0000-0000000000b5', NULL, NULL, current_date + 7, '07:00', 'Bandara Soekarno-Hatta, Terminal 3', 1, 5, false, 0, 14500000, 'Perlu Konfirmasi', 'Penjemputan internasional', now() - interval '20 hours'),
-- Travel selesai (Denpasar -> Ubud)
('00000000-0000-0000-0000-0000000000e7', 'TRV-DEMO-0007', 'travel', 'Travel Denpasar → Ubud · 2 kursi', 'Sarah Wijaya', '0812-8888-9999', '00000000-0000-0000-0000-0000000000a2', NULL, '00000000-0000-0000-0000-0000000000c3', '00000000-0000-0000-0000-0000000000d4', current_date - 4, '09:00', 'Jl. Raya Kuta No. 8, Badung', 2, 1, false, 0, 120000, 'Selesai', '', now() - interval '10 days'),
-- Rental selesai (Ertiga, Denpasar)
('00000000-0000-0000-0000-0000000000e8', 'TRV-DEMO-0008', 'rental', 'Rental Suzuki Ertiga · 1 hari (Lepas Kunci)', 'I Gede Anom', '0857-1111-2222', '00000000-0000-0000-0000-0000000000a2', '00000000-0000-0000-0000-0000000000b6', NULL, NULL, current_date - 1, '10:00', 'Villa Anom, Ubud', 1, 1, false, 0, 450000, 'Selesai', '', now() - interval '6 days'),
-- Travel sedang berjalan (Denpasar -> Lovina)
('00000000-0000-0000-0000-0000000000e9', 'TRV-DEMO-0009', 'travel', 'Travel Denpasar → Lovina · 3 kursi', 'Ni Luh Putri', '0816-6666-7777', '00000000-0000-0000-0000-0000000000a2', NULL, '00000000-0000-0000-0000-0000000000c4', '00000000-0000-0000-0000-0000000000d4', current_date + 1, '08:00', 'Penginapan di Kuta Selatan', 3, 1, false, 0, 330000, 'Sedang Berjalan', '', now() - interval '1 day'),
-- Order vendor pending KYC (dibatalkan — belum boleh transaksi)
('00000000-0000-0000-0000-0000000000ea', 'TRV-DEMO-0010', 'travel', 'Travel Surabaya → Malang · 2 kursi', 'Nadia Safitri', '0857-3333-4444', '00000000-0000-0000-0000-0000000000a3', NULL, '00000000-0000-0000-0000-0000000000c5', NULL, current_date + 3, '09:00', 'Jl. Darmo Permai III, Surabaya', 2, 1, false, 0, 160000, 'Dibatalkan', 'Vendor belum terverifikasi KYC', now() - interval '4 days'),
-- Rental selesai (Stargazer, self-drive)
('00000000-0000-0000-0000-0000000000eb', 'TRV-DEMO-0011', 'rental', 'Rental Hyundai Stargazer · 1 hari (Lepas Kunci)', 'Maya Anggraini', '0811-2222-3333', '00000000-0000-0000-0000-0000000000a1', '00000000-0000-0000-0000-0000000000b3', NULL, NULL, current_date - 3, '08:30', 'Apartemen PIK, Jakarta Utara', 1, 1, false, 0, 550000, 'Selesai', '', now() - interval '3 days');

-- ------------------------------------------------------------- INSPECTIONS
insert into public.inspections (id, driver_id, vehicle_id, order_id, km_start, km_end, fuel_start, fuel_end, body_condition, damage_notes, created_at, updated_at) values
-- Inspeksi awal pesanan yang sedang berjalan (e1)
('00000000-0000-0000-0000-0000000000f1', '00000000-0000-0000-0000-0000000000d1', '00000000-0000-0000-0000-0000000000b1', '00000000-0000-0000-0000-0000000000e1', 124500, NULL, 'Full', NULL, 'Baik', '', now() - interval '1 day', now() - interval '1 day'),
-- Inspeksi historis selesai (travel e7)
('00000000-0000-0000-0000-0000000000f2', '00000000-0000-0000-0000-0000000000d4', '00000000-0000-0000-0000-0000000000b8', '00000000-0000-0000-0000-0000000000e7', 88200, 88410, 'Full', '3/4', 'Baik', '', now() - interval '10 days', now() - interval '10 days');

-- ---------------------------------------------------------------- PAYOUTS
insert into public.payouts (id, vendor_id, amount, bank_name, account_number, account_name, status, created_at) values
('00000000-0000-0000-0000-0000000000e1', '00000000-0000-0000-0000-0000000000a1', 800000,  'BCA',     '1234567890', 'PT Armada Nusantara',  'Selesai', now() - interval '5 days'),
('00000000-0000-0000-0000-0000000000e2', '00000000-0000-0000-0000-0000000000a1', 400000,  'Mandiri', '9876543210', 'PT Armada Nusantara',  'Diajukan', now() - interval '1 day'),
('00000000-0000-0000-0000-0000000000e3', '00000000-0000-0000-0000-0000000000a2', 200000,  'BNI',     '5558881234', 'CV Bali Roda Wisata',  'Diproses', now() - interval '2 days');

-- ---------------------------------------------------------------- SETTINGS
insert into public.settings (key, value, updated_at) values
('platform_name',       'Travondo',                    now()),
('commission_rate',     '10',                          now()),
('midtrans_client_key', 'SB-Mid-client-xxxxxxxx',      now()),
('midtrans_server_key', '•••••••••••••••••••',         now()),
('xendit_secret_key',   'xnd_development_••••••',      now()),
('wa_cloud_token',      'EAAG••••••••••••••••••',      now());

-- =====================================================================
-- Cek hasil: saldo vendor dihitung trigger dari pesanan 'Selesai' &
-- payout 'Selesai'. Seharusnya: A = Rp 775.000, B = Rp 513.000.
-- =====================================================================
