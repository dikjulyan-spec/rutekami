# 🚗 Travondo Platform — NusaTravelLab

Aplikasi ekosistem transportasi terpadu **multi-portal** dalam satu build statis:
**Customer**, **Partner (vendor armada)**, **Super Admin HQ**, dan **Driver (app lapangan)**.

- **Frontend:** React 18 + TypeScript + Vite 6 + Tailwind CSS v3 + lucide-react
- **Backend & data:** Supabase (PostgreSQL + Storage) — `@supabase/supabase-js`
- **Deploy target:** Cloudflare Pages (`npm run build` → `dist/`, base path relatif `./`)
- **Desain:** tema travel cerah oranye/hijau, font *Plus Jakarta Sans*

> Prototipe yang dirancang sesuai `Spesifikasi_Teknis_Travondo_Platform.docx`.
> Skema memakai RLS demo (anon penuh) — lihat bagian Keamanan sebelum produksi.

---

## 1. Cara Menjalankan

### A. Siapkan database Supabase (sekali saja)

1. Buat proyek gratis di [supabase.com](https://supabase.com) (PostgreSQL + API).
2. Buka **SQL Editor** → tempel isi **`supabase/schema.sql`** → **Run**.
   - Membuat 8 tabel (`vendors`, `vehicles`, `routes`, `drivers`, `orders`,
     `inspections`, `payouts`, `settings`), trigger escrow, RLS demo, bucket
     storage `vehicle-photos`.
3. Tempel isi **`supabase/seed.sql`** → **Run** (data contoh, opsional tapi dianjurkan).
   - 3 vendor, 9 unit armada, 5 trayek, 6 sopir, 11 pesanan, payout & settings.
   - Trigger otomatis menghitung saldo vendor: pesanan **Selesai** → kredit **90%**,
     payout **Selesai** → kurangi saldo. Seed selesai: vendor A = Rp 775.000, B = Rp 513.000.

### B. Hubungkan kredensial (pilih salah satu)

**Opsi 1 — file `.env` (standar produksi):**
```bash
cp .env.example .env
# isi VITE_SUPABASE_URL dan VITE_SUPABASE_ANON_KEY (anon public key, bukan service role!)
```

**Opsi 2 — runtime di browser (pratinjau cepat tanpa rebuild):**
Jalankan aplikasi → layar *Connect Supabase* → tempel Project URL & anon key → **Simpan & Masuk**.
Tersimpan di `localStorage` browser. Anon key memang untuk frontend, jadi aman.

### C. Jalankan

```bash
npm install
npm run dev        # development
npm run typecheck  # cek tipe
npm run build      # produksi → dist/
npm run preview    # pratinjau hasil build
```

**Deploy Cloudflare Pages:** Framework preset **Vite**, build command `npm run build`,
output directory `dist`.

---

## 2. Multi-Portal (satu bundle, tab switching di `App.tsx`)

| Portal | File | Kemampuan inti |
|---|---|---|
| Customer | `src/pages/CustomerPage.tsx` | Filter rental (kota/kategori/skema Lepas Kunci vs Dengan Sopir), booking travel antarkota (rute + jam + kursi), kalkulator biaya + asuransi opsional, e-tiket digital, pencarian pesanan via HP/kode |
| Partner | `src/pages/PartnerPage.tsx` | Dashboard omzet bulanan & armada standby, manajemen armada (+upload foto ke Storage), daftar trayek, konfirmasi pesanan + penugasan sopir, kelola sopir, wallet (saldo 90%) & payout |
| Admin HQ | `src/pages/AdminPage.tsx` | GMV, komisi 10%, dana escrow, verifikasi KYC vendor (NIB/NPWP/polis), takedown unit, kontrol status pesanan semua vendor, simulasi webhook, health check DB/storage, manajemen API keys (Midtrans/Xendit/WA) |
| Driver | `src/pages/DriverPage.tsx` | Duty toggle Online/Offline, job board + navigasi (WA/Google Maps), inspeksi awal & akhir unit (KM/BBM/bodi), validasi & check-in e-tiket, riwayat perjalanan |

Tiap portal di-*lazy import* sehingga bundle terpecah per portal.

---

## 3. Model Data (PostgreSQL)

Kolom memakai `snake_case` agar hasil PostgREST bisa langsung dipakai
(`src/types/database.ts`). Ringkasan:

- **vendors** — profil mitra + status KYC (`pending/verified/rejected`) + `wallet_balance`
- **vehicles** — unit armada (kategori, nopol, harga `/hari` & `/hari+sopir`, `cities[]`, aktif)
- **routes** — trayek shuttle (asal-tujuan, `departures[]` jam, harga/kursi)
- **drivers** — sopir vendor (`Online/Istirahat/Offline`)
- **orders** — pesanan rental & travel; sumber escrow (`total_price`, status, `checked_in`)
- **inspections** — catatan KM/BBM/bodi per tugas
- **payouts** — penarikan saldo partner
- **settings** — konfigurasi platform & API keys (prototype)

### Escrow & komisi (otomatis via trigger)

`supabase/schema.sql` mendefinisikan:

```sql
-- saat order.status → 'Selesai':
--   vendors.wallet_balance += floor(total_price * 0.90)   (90% ke partner)
-- sisanya 10% = komisi platform (dihitung dari tabel orders di UI Admin)
-- saat payouts.status → 'Selesai':
--   vendors.wallet_balance -= amount
```

---

## 4. Struktur Direktori

```
travondo/
├── index.html                # Entry Vite (root)
├── package.json / vite.config.ts / tsconfig.json
├── tailwind.config.js / postcss.config.js
├── .env.example              # template VITE_SUPABASE_URL & _ANON_KEY
├── supabase/
│   ├── schema.sql            # DDL + trigger escrow + RLS demo + bucket storage
│   └── seed.sql              # data contoh (id UUID tetap)
└── src/
    ├── App.tsx               # tab switcher 4 portal + layar Connect Supabase
    ├── main.tsx / styles.css
    ├── lib/
    │   ├── supabase.ts       # inisialisasi client (env → runtime localStorage)
    │   ├── db.ts             # repository layer (semua query Supabase)
    │   ├── hooks.ts          # useAsyncData / useFlash
    │   └── format.ts         # rupiah, tanggal, kode TRV-…
    ├── types/database.ts     # interface + union status
    ├── components/
    │   ├── ui.tsx            # primitives (Modal, Badge, Input, Toggle, …)
    │   ├── shell.tsx         # PortalPage, SubTabs, CardSection
    │   └── items.tsx         # VehicleCard, TravelCard, OrderListRow, TicketView
    └── pages/
        ├── CustomerPage.tsx  # Portal Customer
        ├── PartnerPage.tsx   # Portal Partner/Vendor
        ├── AdminPage.tsx     # Super Admin HQ
        └── DriverPage.tsx    # App Driver (mobile-first)
```

---

## 5. Troubleshooting

| Gejala | Penyebab & solusi |
|---|---|
| Layar "Connect Supabase" terus muncul | Kredensial belum ada. Isi `.env` lalu build ulang, atau tempel di layar tsb (tersimpan di browser). |
| `Gagal memuat … relation "vehicles" does not exist` | `schema.sql` belum dijalankan di SQL Editor. |
| Tidak ada data / empty state | `seed.sql` belum dijalankan. |
| Upload foto gagal (403/duplicate) | Bucket `vehicle-photos` belum dibuat / policy belum ada → jalankan ulang `schema.sql` (idempoten). |
| Saldo vendor tidak bertambah saat selesai | Trigger belum terpasang → jalankan ulang bagian trigger pada `schema.sql`; pastikan kolom `status` di-update ke `Selesai`. |
| Katalog Customer kosong padahal unit ada | Unit hanya tampil bila vendor berstatus `verified` (KYC) dan `vehicles.is_active = true`. |

---

## 6. Keamanan (sebelum produksi)

Mode prototype memakai **anon key + policy RLS longgar** (`for all to anon`) supaya demo
langsung berjalan. Untuk produksi:
1. Aktifkan **Supabase Auth** dan beri role per portal (customer/partner/admin/driver).
2. Ganti policy RLS dengan batasan per-role & per-baris (vendor hanya lihat datanya sendiri).
3. Pindahkan API keys payment gateway (server key) ke **Supabase Edge Functions / Vault**
   — jangan pernah di bundle frontend.
4. Verifikasi **signature webhook** Midtrans/Xendit/WhatsApp sebelum memercayai payload.

---

*Dibuat untuk NusaTravelLab — ekosistem transportasi Indonesia: sewa mobil lepas kunci/dengan
sopir, shuttle antarkota, escrow & komisi platform, dan operasional driver.*
