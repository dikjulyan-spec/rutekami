import React, { useMemo, useState } from "react";
import {
  ArrowRight,
  BadgeCheck,
  Building2,
  Car,
  CheckCircle2,
  ClipboardCheck,
  FileCheck,
  Handshake,
  Rocket,
  ShieldCheck,
  Sparkles,
  Truck,
  Users,
  Wallet,
} from "lucide-react";
import { cn } from "../components/ui";
import { ErrorPanel, FlashBanner, Input, Labeled, Modal, PageLoader, Select } from "../components/ui";
import { useAsyncData, useFlash } from "../lib/hooks";
import { fetchVendors, insertVendor } from "../lib/db";
import type { Vendor } from "../types/database";

const BENEFITS: { icon: React.ComponentType<{ className?: string }>; t: string; d: string }[] = [
  { icon: Users, t: "Jangkauan lebih luas", d: "Unit & trayek Anda tampil di seluruh penjuru platform Travondo." },
  { icon: Wallet, t: "Escrow & payout otomatis", d: "Dana aman di escrow — 90% masuk saldo Anda saat perjalanan selesai." },
  { icon: ShieldCheck, t: "Verifikasi KYC resmi", d: "Setelah QC Admin, status terverifikasi membuka akses penuh ke katalog." },
  { icon: Truck, t: "Kelola armada fleksibel", d: "Atur unit, trayek, sopir, harga, dan pantau omzet dalam satu dashboard." },
];

export default function HomePage() {
  return (
    <div className="mx-auto max-w-6xl px-4 sm:px-6 pb-16 pt-6 sm:pt-8">
      <Hero />
      <Benefits />
      <RegisterCTA />
    </div>
  );
}

/* ------------------------------------------------------------------ HERO */
function Hero() {
  return (
    <section className="animate-rise relative overflow-hidden rounded-3xl bg-gradient-to-br from-brand-500 via-brand-400 to-leaf-500 p-6 sm:p-10 text-white shadow-card-lg">
      <div className="absolute -right-12 -top-12 h-48 w-48 rounded-full bg-white/10 blur-2xl" />
      <div className="absolute right-16 bottom-0 h-28 w-28 rounded-full bg-leaf-200/20 blur-xl" />
      <div className="relative max-w-2xl">
        <span className="inline-flex items-center gap-1.5 rounded-full bg-white/15 px-3 py-1 text-[11px] font-bold uppercase tracking-wider backdrop-blur">
          <Sparkles className="h-3.5 w-3.5" /> NusaTravelLab · Platform
        </span>
        <h1 className="mt-4 text-3xl sm:text-4xl font-extrabold leading-tight tracking-tight">
          Mitra Armada, Tingkatkan Bisnis Anda
        </h1>
        <p className="mt-3 text-[15px] text-white/85 leading-relaxed max-w-xl">
          Bergabunglah dengan ekosistem Travondo. Sewa mobil & travel antarkota Anda menjangkau
          penumpang lebih luas, dengan pembayaran escrow yang aman dan payout otomatis.
        </p>
        <div className="mt-5 flex flex-wrap gap-2">
          <a href="#daftar-partner" className="btn bg-white text-brand-700 hover:bg-brand-50">
            Bergabung jadi Partner <ArrowRight className="h-4 w-4" />
          </a>
          <a href="#keuntungan" className="btn bg-white/15 text-white hover:bg-white/25 border border-white/25">
            Lihat Keuntungan
          </a>
        </div>
      </div>
    </section>
  );
}

/* -------------------------------------------------------------- BENEFITS */
function Benefits() {
  return (
    <section id="keuntungan" className="mt-8">
      <h2 className="text-lg sm:text-xl font-extrabold tracking-tight text-lagoon-900">Keuntungan jadi Mitra</h2>
      <p className="text-[13px] text-stone-400 mt-0.5">Pendaftaran sederhana — tim Admin kami melakukan QC dokumen Anda.</p>
      <div className="mt-4 grid gap-4 sm:grid-cols-2">
        {BENEFITS.map((b, i) => {
          const I = b.icon;
          return (
            <div key={b.t} className="card card-hover p-5 animate-rise" style={{ animationDelay: `${i * 50}ms` }}>
              <span className="grid h-11 w-11 place-items-center rounded-2xl bg-gradient-to-br from-brand-50 to-leaf-50 text-brand-600">
                <I className="h-5.5 w-5.5" />
              </span>
              <h3 className="mt-3 font-extrabold text-stone-800">{b.t}</h3>
              <p className="mt-1 text-[13.5px] text-stone-500 leading-relaxed">{b.d}</p>
            </div>
          );
        })}
      </div>
    </section>
  );
}

/* ------------------------------------------------------------ REGISTER CTA */
function RegisterCTA() {
  const vendors = useAsyncData(fetchVendors);
  const [open, setOpen] = useState(false);
  return (
    <section id="daftar-partner" className="mt-8">
      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-lagoon-800 via-lagoon-700 to-leaf-600 p-6 sm:p-9 text-white shadow-card-lg">
        <div className="absolute -right-10 -bottom-10 h-36 w-36 rounded-full bg-white/10 blur-2xl" />
        <div className="relative flex flex-wrap items-center justify-between gap-5">
          <div className="max-w-xl">
            <h2 className="text-2xl font-extrabold tracking-tight">Siap Bergabung dengan Travondo?</h2>
            <p className="mt-2 text-[14.5px] text-lagoon-100/90 leading-relaxed">
              Isi formulir pendaftaran sekali (lengkap dengan dokumen KYC). Tim Admin akan melakukan
              QC dan mengaktifkan armada Anda.
            </p>
          </div>
          <button className="btn bg-white text-lagoon-800 hover:bg-lagoon-50" onClick={() => setOpen(true)}>
            <Handshake className="h-4 w-4" /> Bergabung jadi Partner
          </button>
        </div>
      </div>

      {open && <RegisterModal vendors={vendors.data ?? []} onClose={() => setOpen(false)} />}
    </section>
  );
}

/* -------------------------------------------------------- REGISTER MODAL */
function RegisterModal({ vendors, onClose }: { vendors: Vendor[]; onClose: () => void }) {
  const [done, setDone] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [v, setV] = useState({
    business_name: "",
    owner_name: "",
    email: "",
    phone: "",
    city: "",
    kyc_nib: "",
    kyc_npwp: "",
    kyc_insurance: "",
  });
  const [errs, setErrs] = useState<Record<string, string>>({});

  // Untuk validasi "kota sudah terdaftar"
  const existingCity = useMemo(() => vendors.find((x) => x.city.toLowerCase() === v.city.trim().toLowerCase()), [v.city, vendors]);

  const set = (k: keyof typeof v, val: string) => setV((s) => ({ ...s, [k]: val }));

  const submit = async () => {
    const e: Record<string, string> = {};
    if (v.business_name.trim().length < 3) e.business_name = "Nama usaha wajib diisi (min. 3 karakter).";
    if (v.owner_name.trim().length < 3) e.owner_name = "Nama pemilik wajib diisi.";
    if (!/^\S+@\S+\.\S+$/.test(v.email.trim())) e.email = "Email tidak valid.";
    if (v.phone.replace(/\D/g, "").length < 8) e.phone = "Nomor HP tidak valid.";
    if (v.city.trim().length < 2) e.city = "Kota wajib diisi.";
    if (v.kyc_nib.trim().length < 5) e.kyc_nib = "Nomor NIB wajib diisi.";
    if (v.kyc_npwp.trim().length < 10) e.kyc_npwp = "Nomor NPWP wajib diisi.";
    if (v.kyc_insurance.trim().length < 5) e.kyc_insurance = "Nomor polis asuransi wajib diisi.";
    setErrs(e);
    if (Object.keys(e).length) return;

    setBusy(true);
    setError(null);
    try {
      await insertVendor({
        business_name: v.business_name.trim(),
        owner_name: v.owner_name.trim(),
        email: v.email.trim(),
        phone: v.phone.trim(),
        city: v.city.trim(),
        kyc_nib: v.kyc_nib.trim(),
        kyc_npwp: v.kyc_npwp.trim(),
        kyc_insurance: v.kyc_insurance.trim(),
      });
      setDone(true);
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err));
    } finally {
      setBusy(false);
    }
  };

  if (done) {
    return (
      <Modal open onClose={onClose} title="Pendaftaran terkirim 🎉" size="sm">
        <div className="text-center py-4">
          <span className="mx-auto grid h-14 w-14 place-items-center rounded-full bg-leaf-50 text-leaf-600">
            <CheckCircle2 className="h-7 w-7" />
          </span>
          <p className="mt-4 font-extrabold text-stone-800 text-lg">Terima kasih!</p>
          <p className="mt-1.5 text-[13.5px] text-stone-500 leading-relaxed">
            Pendaftaran <b>{v.business_name}</b> sudah masuk antrian. Tim Admin akan melakukan QC
            dokumen & verifikasi KYC Anda. Setelah disetujui, armada Anda tampil di platform.
          </p>
          <button className="btn-primary btn-block mt-5" onClick={onClose}>Selesai</button>
        </div>
      </Modal>
    );
  }

  return (
    <Modal
      open
      onClose={onClose}
      title="Bergabung jadi Partner"
      subtitle="Daftarkan usaha & dokumen KYC Anda — antrian QC Admin."
      size="lg"
    >
      <div className="grid gap-4 sm:grid-cols-2">
        <Labeled label="Nama usaha / badan" error={errs.business_name}>
          <Input placeholder="cth: PT Armada Nusantara" value={v.business_name} onChange={(e) => set("business_name", e.target.value)} />
        </Labeled>
        <Labeled label="Nama pemilik / penanggung jawab" error={errs.owner_name}>
          <Input placeholder="cth: Andi Pratama" value={v.owner_name} onChange={(e) => set("owner_name", e.target.value)} />
        </Labeled>
        <Labeled label="Email" error={errs.email}>
          <Input type="email" placeholder="cth: andi@usaha.co.id" value={v.email} onChange={(e) => set("email", e.target.value)} />
        </Labeled>
        <Labeled label="No. WhatsApp / HP" error={errs.phone}>
          <Input placeholder="08xxxxxxxxxx" value={v.phone} onChange={(e) => set("phone", e.target.value)} />
        </Labeled>
        <Labeled label="Kota / wilayah operasi" error={errs.city}>
          <Input placeholder="cth: Jakarta" value={v.city} onChange={(e) => set("city", e.target.value)} />
        </Labeled>
        <div className="flex items-end">
          {existingCity && (
            <p className="rounded-xl bg-amber-50 px-3 py-2 text-[12px] font-semibold text-amber-700 ring-1 ring-amber-100">
              <Building2 className="h-3.5 w-3.5 inline -mt-0.5 mr-1" />
              Kota ini sudah diisi vendor lain — tim kami tetap bisa memproses permohonan Anda.
            </p>
          )}
        </div>
      </div>

      {/* Dokumen KYC */}
      <div className="mt-5">
        <p className="label flex items-center gap-1.5">
          <FileCheck className="h-4 w-4 text-brand-500" /> Dokumen perizinan usaha (KYC)
        </p>
        <div className="grid gap-4 sm:grid-cols-3">
          <Labeled label="Nomor NIB" error={errs.kyc_nib}>
            <Input placeholder="cth: 8120001234567" value={v.kyc_nib} onChange={(e) => set("kyc_nib", e.target.value)} />
          </Labeled>
          <Labeled label="Nomor NPWP" error={errs.kyc_npwp}>
            <Input placeholder="cth: 01.234.567.8-012.000" value={v.kyc_npwp} onChange={(e) => set("kyc_npwp", e.target.value)} />
          </Labeled>
          <Labeled label="Polis asuransi" error={errs.kyc_insurance}>
            <Input placeholder="cth: AJB-884120" value={v.kyc_insurance} onChange={(e) => set("kyc_insurance", e.target.value)} />
          </Labeled>
        </div>
        <p className="hint">Nomor tersebut akan diperiksa oleh Admin selama proses QC sebelum armada tampil.</p>
      </div>

      {error && <p className="mt-4 rounded-xl bg-rose-50 px-3.5 py-2.5 text-[12.5px] font-semibold text-rose-600 ring-1 ring-rose-100">{error}</p>}

      <div className="mt-5 flex flex-col-reverse sm:flex-row justify-end gap-2">
        <button className="btn-ghost" onClick={onClose}>Batal</button>
        <button className="btn-primary" onClick={submit} disabled={busy}>
          {busy ? "Mengirim…" : "Kirim & Ajukan QC"}
        </button>
      </div>
    </Modal>
  );
}
