/** Utilitas format angka, tanggal, dan kode transaksi. */

const IDR = new Intl.NumberFormat("id-ID", {
  style: "currency",
  currency: "IDR",
  maximumFractionDigits: 0,
});

const NUM = new Intl.NumberFormat("id-ID");

export function rupiah(n: number): string {
  return IDR.format(n);
}

export function num(n: number): string {
  return NUM.format(n);
}

/** 'YYYY-MM-DD' lokal hari ini */
export function todayInput(): string {
  const d = new Date();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${d.getFullYear()}-${m}-${day}`;
}

/** Tambah hari pada tanggal ISO 'YYYY-MM-DD' */
export function addDays(iso: string, days: number): string {
  const [y, m, d] = iso.split("-").map(Number);
  const dt = new Date(y, m - 1, d);
  dt.setDate(dt.getDate() + days);
  const mm = String(dt.getMonth() + 1).padStart(2, "0");
  const dd = String(dt.getDate()).padStart(2, "0");
  return `${dt.getFullYear()}-${mm}-${dd}`;
}

/** Durasi sewa (hari) antara tanggal mulai & selesai (inklusif). */
export function rentalDays(startIso: string, endIso: string): number {
  const [y1, m1, d1] = startIso.split("-").map(Number);
  const [y2, m2, d2] = endIso.split("-").map(Number);
  const a = new Date(y1, m1 - 1, d1).getTime();
  const b = new Date(y2, m2 - 1, d2).getTime();
  return Math.max(1, Math.round((b - a) / 86400000) + 1);
}

export function formatDate(isoDate: string): string {
  if (!isoDate) return "-";
  const [y, m, d] = isoDate.slice(0, 10).split("-").map(Number);
  return new Intl.DateTimeFormat("id-ID", {
    weekday: "short",
    day: "numeric",
    month: "short",
    year: "numeric",
  }).format(new Date(y, m - 1, d));
}

export function formatDateTime(isoTs: string): string {
  if (!isoTs) return "-";
  return new Intl.DateTimeFormat("id-ID", {
    day: "numeric",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  }).format(new Date(isoTs));
}

export function nowTimeHM(): string {
  const d = new Date();
  return `${String(d.getHours()).padStart(2, "0")}:${String(d.getMinutes()).padStart(2, "0")}`;
}

const CHARS = "ABCDEFGHJKMNPQRSTUVWXYZ23456789";

/** Kode transaksi unik, mis. TRV-250101-8K2M */
export function genOrderCode(): string {
  const d = new Date();
  const yy = String(d.getFullYear()).slice(2);
  const mm = String(d.getMonth() + 1).padStart(2, "0");
  const dd = String(d.getDate()).padStart(2, "0");
  let suffix = "";
  for (let i = 0; i < 4; i++) suffix += CHARS[Math.floor(Math.random() * CHARS.length)];
  return `TRV-${yy}${mm}${dd}-${suffix}`;
}

export function titleCase(s: string): string {
  return s
    .split(" ")
    .map((w) => (w ? w[0].toUpperCase() + w.slice(1) : w))
    .join(" ");
}

export function onlyDigits(s: string): string {
  return s.replace(/\D/g, "");
}
