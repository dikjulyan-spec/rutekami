import React from "react";
import {
  ArrowRight,
  Building2,
  Car,
  ChevronRight,
  Navigation,
  ShieldCheck,
  Sparkles,
  Ticket,
  Users,
} from "lucide-react";
import { cn } from "../components/ui";

const CARDS: {
  href: string;
  title: string;
  desc: string;
  icon: React.ComponentType<{ className?: string }>;
  gradient: string;
  tags: string[];
}[] = [
  {
    href: "./booking.html",
    title: "Booking",
    desc: "Pesan sewa mobil (lepas kunci / dengan sopir) & tiket shuttle antarkota, lalu terima e-tiket digital.",
    icon: Ticket,
    gradient: "from-brand-500 to-amber-400",
    tags: ["Rental Mobil", "Travel Antarkota", "e-Tiket"],
  },
  {
    href: "./partner.html",
    title: "Partner",
    desc: "Dashboard vendor armada: kelola unit, daftarkan trayek, tugaskan sopir, dan pantau saldo & payout.",
    icon: Building2,
    gradient: "from-lagoon-600 to-leaf-500",
    tags: ["Armada", "Trayek", "Wallet & Payout"],
  },
  {
    href: "./admin.html",
    title: "Admin HQ",
    desc: "Konsol Super Admin: awasi escrow & komisi 10%, verifikasi KYC, kontrol kepatuhan, dan integrasi API.",
    icon: ShieldCheck,
    gradient: "from-lagoon-800 to-brand-600",
    tags: ["Escrow", "KYC", "API Keys"],
  },
  {
    href: "./driver.html",
    title: "Driver",
    desc: "Aplikasi lapangan mobile-first: mode online, job board + navigasi, inspeksi unit, dan validasi e-tiket.",
    icon: Navigation,
    gradient: "from-leaf-600 to-lagoon-600",
    tags: ["Duty Toggle", "Inspeksi", "Scanner"],
  },
];

export default function HomePage() {
  return (
    <div className="mx-auto max-w-6xl px-4 sm:px-6 pb-16 pt-6 sm:pt-8">
      {/* Hero */}
      <section className="animate-rise relative overflow-hidden rounded-3xl bg-gradient-to-br from-brand-500 via-brand-400 to-leaf-500 p-6 sm:p-10 text-white shadow-card-lg">
        <div className="absolute -right-12 -top-12 h-48 w-48 rounded-full bg-white/10 blur-2xl" />
        <div className="absolute right-16 bottom-0 h-28 w-28 rounded-full bg-leaf-200/20 blur-xl" />
        <div className="relative max-w-2xl">
          <span className="inline-flex items-center gap-1.5 rounded-full bg-white/15 px-3 py-1 text-[11px] font-bold uppercase tracking-wider backdrop-blur">
            <Sparkles className="h-3.5 w-3.5" /> NusaTravelLab · Platform
          </span>
          <h1 className="mt-4 text-3xl sm:text-4xl font-extrabold leading-tight tracking-tight">
            Ekosistem Transportasi Terpadu
          </h1>
          <p className="mt-3 text-[15px] text-white/85 leading-relaxed max-w-xl">
            Satu platform, empat portal. Hubungkan penumpang, vendor armada, operasional driver, dan
            kendali pusat — dengan transaksi escrow & komisi otomatis.
          </p>
          <div className="mt-5 flex flex-wrap gap-2">
            <a href="./booking.html" className="btn bg-white text-brand-700 hover:bg-brand-50">Mulai Booking <ArrowRight className="h-4 w-4" /></a>
            <a href="./partner.html" className="btn bg-white/15 text-white hover:bg-white/25 border border-white/25">Jadi Partner</a>
          </div>
        </div>
      </section>

      {/* Statistik singkat */}
      <section className="mt-6 grid grid-cols-2 gap-3 sm:gap-4 lg:grid-cols-4">
        {[
          { n: "4", l: "Portal Terpisah", i: Users },
          { n: "90/10", l: "Escrow & Komisi", i: ShieldCheck },
          { n: "15+", l: "Unit & Trayek", i: Car },
          { n: "100%", l: "Supabase DB", i: Sparkles },
        ].map((s) => {
          const I = s.i;
          return (
            <div key={s.l} className="card p-4 animate-rise">
              <span className="grid h-9 w-9 place-items-center rounded-xl bg-brand-50 text-brand-600"><I className="h-5 w-5" /></span>
              <p className="mt-2.5 text-xl font-extrabold tracking-tight text-lagoon-900">{s.n}</p>
              <p className="text-[12px] text-stone-400">{s.l}</p>
            </div>
          );
        })}
      </section>

      {/* Kartu portal */}
      <section className="mt-8">
        <div className="flex items-end justify-between gap-3">
          <div>
            <h2 className="text-lg sm:text-xl font-extrabold tracking-tight text-lagoon-900">Pilih Portal</h2>
            <p className="text-[13px] text-stone-400 mt-0.5">Setiap portal adalah halaman & tampilan tersendiri.</p>
          </div>
        </div>
        <div className="mt-4 grid gap-4 sm:grid-cols-2">
          {CARDS.map((c, i) => {
            const I = c.icon;
            return (
              <a
                key={c.href}
                href={c.href}
                className={cn("card card-hover p-5 sm:p-6 animate-rise flex flex-col")}
                style={{ animationDelay: `${i * 60}ms` }}
              >
                <div className="flex items-start justify-between">
                  <span className={cn("grid h-12 w-12 place-items-center rounded-2xl bg-gradient-to-br text-white shadow-card", c.gradient)}>
                    <I className="h-6 w-6" />
                  </span>
                  <ChevronRight className="h-5 w-5 text-stone-300" />
                </div>
                <h3 className="mt-4 text-lg font-extrabold text-stone-800">{c.title}</h3>
                <p className="mt-1.5 text-[13.5px] text-stone-500 leading-relaxed grow">{c.desc}</p>
                <div className="mt-4 flex flex-wrap gap-1.5">
                  {c.tags.map((t) => (
                    <span key={t} className="rounded-full bg-stone-50 px-2.5 py-1 text-[11px] font-bold text-stone-500 ring-1 ring-stone-100">{t}</span>
                  ))}
                </div>
              </a>
            );
          })}
        </div>
      </section>
    </div>
  );
}
