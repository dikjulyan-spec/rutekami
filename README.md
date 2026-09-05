# 🚗 RuteTrip Platform — Explore · Plan · Journey

Aplikasi ekosistem transportasi terpadu **multi-portal** dalam build statis **MPA (multi-page app)**:
**Booking**, **Partner (vendor armada)**, **Super Admin HQ**, dan **Driver (app lapangan)**.

- **Frontend:** React 18 + TypeScript + Vite 6 + Tailwind CSS v3 + lucide-react
- **Backend & data:** Supabase (PostgreSQL + Storage) — `@supabase/supabase-js`
- **Deploy target:** Cloudflare Pages (`npm run build` → `dist/`, base path relatif `./`)
- **Desain:** tema travel cerah oranye/hijau, font *Plus Jakarta Sans*, responsif desktop & mobile

> Setiap portal = **halaman HTML terpisah** dengan URL & layout sendiri (`booking.html`,
> `partner.html`, `admin.html`, `driver.html`), semua berbagi satu pool kode & satu database.
> Beranda (`index.html`) adalah launcher pemilih portal.

---

## 1. Halaman & URL

| Halaman | File HTML | Portal |
|---|---|---|
| Beranda (launcher) | `index.html` | Pemilih 4 portal |
| Booking | `booking.html` | Pemesanan Customer (rental + travel + e-tiket) |
| Partner | `partner.html` | Dashboard vendor armada |
| Admin HQ | `admin.html` | Konsol Super Admin |
| Driver | `driver.html` | Aplikasi lapangan (mobile-first) |

Nav bar di tiap halaman menghubungkan antar portal lewat link relatif (`./booking.html`),
sehingga berfungsi baik di root Cloudflare maupun subpath platform.

---

## 2. Cara Menjalankan

### A. Siapkan database Supabase (sekali saja)

1. Buat proyek gratis di [supabase.com](https://supabase.com) (PostgreSQL + API).
2. Buka **SQL Editor** → tempel isi **`supabase/schema.sql`** → **Run**.
   - Membuat 8 tabel, trigger escrow, RLS demo, bucket storage `vehicle-photos`.
3. (Jika perlu reset dari kondisi rusak) → jalankan **`supabase/reset.sql`** dulu.
4. Tempel isi **`supabase/seed.sql`** → **Run** (data contoh).
   - Trigger otomatis menghitung saldo vendor: pesanan **Selesai** → kredit **90%**.

### B. Hubungkan kredensial (pilih salah satu)

**Opsi 1 — file `.env` (produksi):**
```bash
cp .env.example .env   # isi VITE_SUPABASE_URL & VITE_SUPABASE_ANON_KEY (anon key)
```

**Opsi 2 — runtime di browser (pratinjau tanpa rebuild):**
Jalankan app → layar *Connect Supabase* → tempel Project URL & anon key → **Simpan & Masuk**.
Tersimpan di `localStorage`. Anon key memang untuk frontend, jadi aman.

### C. Jalankan

```bash
npm install
npm run dev        # development (Vite serve semua halaman)
npm run typecheck  # cek tipe
npm run build      # produksi → dist/ (5 html + assets)
npm run preview    # pratinjau hasil build
```

**Deploy Cloudflare Pages:** Framework preset **Vite**, build `npm run build`, output `dist`.

---

## 3. Struktur Direktori

```
travondo/
├── index.html  booking.html  partner.html  admin.html  driver.html  # 5 entry halaman
├── package.json / vite.config.ts / tsconfig.json
├── tailwind.config.js / postcss.config.js
├── .env.example
├── supabase/
│   ├── reset.sql             # hapus tabel lama (untuk schema tidak konsisten)
│   ├── schema.sql            # DDL + trigger escrow + RLS + bucket storage
│   └── seed.sql              # data contoh
└── src/
    ├── entry-main.tsx / entry-booking.tsx / entry-partner.tsx
    ├── entry-admin.tsx / entry-driver.tsx    # entry React per halaman
    ├── lib/                  # supabase client, db repo, hooks, format
    ├── types/database.ts     # interface + union status
    ├── components/
    │   ├── Layout.tsx        # TopBar + nav antar portal + Footer + PageShell
    │   ├── ConnectGate.tsx   # layar setup Supabase (WithSupabase)
    │   ├── ui.tsx            # primitives (Modal, Badge, Input, Toggle, …)
    │   ├── shell.tsx         # PortalPage, SubTabs, CardSection
    │   └── items.tsx         # VehicleCard, TravelCard, OrderListRow, TicketView
    └── pages/
        ├── HomePage.tsx      # launcher pemilih portal
        ├── CustomerPage.tsx  # Portal Booking
        ├── PartnerPage.tsx   # Portal Partner
        ├── AdminPage.tsx     # Super Admin HQ
        └── DriverPage.tsx    # App Driver (mobile-first)
```

---

## 4. Escrow & komisi (otomatis via trigger)

Saat `orders.status → 'Selesai'`:
- `vendors.wallet_balance += floor(total_price * 0.90)` (90% ke partner)
- sisanya 10% = komisi platform (dihitung dari tabel orders di UI Admin)
- saat `payouts.status → 'Selesai'`: `vendors.wallet_balance -= amount`

---

## 5. Keamanan (sebelum produksi)

Mode prototype memakai **anon key + policy RLS longgar** (`for all to anon`). Untuk produksi:
1. Aktifkan **Supabase Auth** dan beri role per portal.
2. Ganti policy RLS dengan batasan per-role & per-baris.
3. Pindahkan API keys payment gateway ke **Supabase Edge Functions / Vault**.
4. Verifikasi **signature webhook** sebelum memercayai payload.

---

*Dibuat untuk Explore · Plan · Journey — ekosistem transportasi Indonesia: sewa mobil lepas kunci/dengan
sopir, shuttle antarkota, escrow & komisi platform, dan operasional driver.*

