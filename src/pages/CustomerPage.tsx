import React, { useMemo, useState } from "react";
import {
  BadgeCheck,
  Bus,
  Calendar,
  Car,
  CarFront,
  Clock,
  FileSearch,
  MapPin,
  Search,
  ShieldCheck,
  Ticket,
  Users,
} from "lucide-react";
import { PortalPage } from "../components/shell";
import {
  EmptyState,
  ErrorPanel,
  FlashBanner,
  Input,
  Labeled,
  Modal,
  PageLoader,
  Select,
  cn,
} from "../components/ui";
import {
  OrderListRow,
  ServiceIcon,
  TicketView,
  TravelCard,
  VehicleCard,
  VehicleImage,
} from "../components/items";
import { useAsyncData, useFlash } from "../lib/hooks";
import { fetchOrders, fetchRoutes, fetchVehicles, fetchVendors, insertOrder } from "../lib/db";
import type { NewOrder } from "../lib/db";
import type { Order, Route, Vehicle } from "../types/database";
import { VEHICLE_CATEGORIES } from "../types/database";
import { addDays, genOrderCode, nowTimeHM, rentalDays, rupiah, todayInput } from "../lib/format";

const RENTAL_INSURANCE_RATE = 0.05; // 5% dari subtotal sewa
const TRAVEL_INSURANCE_PER_SEAT = 15000;

type Service = "rental" | "travel";

export default function CustomerPage() {
  const vendors = useAsyncData(fetchVendors);
  const vehicles = useAsyncData(fetchVehicles);
  const routes = useAsyncData(fetchRoutes);
  const { flash, show } = useFlash();

  const loading = vendors.loading || vehicles.loading || routes.loading;
  const firstError = vendors.error ?? vehicles.error ?? routes.error;

  // Filter state
  const [service, setService] = useState<Service>("rental");
  const [city, setCity] = useState("Semua");
  const [category, setCategory] = useState("Semua");
  const [scheme, setScheme] = useState<"semua" | "self" | "driver">("semua");
  const [tOrigin, setTOrigin] = useState("Semua");
  const [tDest, setTDest] = useState("Semua");

  // Booking & ticket state
  const [booking, setBooking] = useState<
    { kind: "rental"; v: Vehicle } | { kind: "travel"; r: Route } | null
  >(null);
  const [ticketOrder, setTicketOrder] = useState<Order | null>(null);

  // Pencarian pesanan
  const [searchQ, setSearchQ] = useState("");
  const [searchText, setSearchText] = useState("");

  const vendorById = useMemo(() => {
    const m = new Map<string, string>();
    (vendors.data ?? []).forEach((v) => m.set(v.id, v.business_name));
    return m;
  }, [vendors.data]);

  const vehicleById = useMemo(() => {
    const m = new Map<string, { name: string; category: string }>();
    (vehicles.data ?? []).forEach((v) => m.set(v.id, { name: v.name, category: v.category }));
    return m;
  }, [vehicles.data]);

  // Katalog hanya dari vendor terverifikasi (KYC)
  const catalogVehicles = useMemo(() => {
    const verified = new Set((vendors.data ?? []).filter((v) => v.status === "verified").map((v) => v.id));
    return (vehicles.data ?? []).filter((v) => verified.has(v.vendor_id) && v.is_active);
  }, [vehicles.data, vendors.data]);

  const activeRoutes = useMemo(() => {
    const verified = new Set((vendors.data ?? []).filter((v) => v.status === "verified").map((v) => v.id));
    return (routes.data ?? []).filter((r) => verified.has(r.vendor_id) && r.is_active);
  }, [routes.data, vendors.data]);

  const allCities = useMemo(() => {
    const s = new Set<string>();
    catalogVehicles.forEach((v) => v.cities.forEach((c) => s.add(c)));
    return [...s].sort();
  }, [catalogVehicles]);

  const origins = useMemo(() => [...new Set(activeRoutes.map((r) => r.origin))].sort(), [activeRoutes]);
  const destinations = useMemo(() => [...new Set(activeRoutes.map((r) => r.destination))].sort(), [activeRoutes]);

  const filteredVehicles = useMemo(() => {
    return catalogVehicles.filter((v) => {
      if (city !== "Semua" && !v.cities.includes(city)) return false;
      if (category !== "Semua" && v.category !== category) return false;
      if (scheme === "self" && !v.allow_self_drive) return false;
      if (scheme === "driver" && v.price_with_driver == null) return false;
      return true;
    });
  }, [catalogVehicles, city, category, scheme]);

  const filteredRoutes = useMemo(() => {
    return activeRoutes.filter((r) => {
      if (tOrigin !== "Semua" && r.origin !== tOrigin) return false;
      if (tDest !== "Semua" && r.destination !== tDest) return false;
      return true;
    });
  }, [activeRoutes, tOrigin, tDest]);

  const allOrders = useAsyncData(fetchOrders);
  const matchedOrders = useMemo(() => {
    if (!searchText.trim()) return null;
    const qDigits = searchText.replace(/\D/g, "");
    const qUpper = searchText.trim().toUpperCase();
    return (allOrders.data ?? []).filter((o) => {
      const phone = (o.customer_phone || "").replace(/\D/g, "");
      if (qDigits.length >= 3 && phone.includes(qDigits)) return true;
      if (qUpper.length >= 5 && o.order_code.toUpperCase().includes(qUpper)) return true;
      return false;
    });
  }, [searchText, allOrders.data]);

  const categoriesHere = useMemo(() => {
    const s = new Set(catalogVehicles.map((v) => v.category));
    return VEHICLE_CATEGORIES.filter((c) => s.has(c));
  }, [catalogVehicles]);

  return (
    <PortalPage
      kicker="Portal Customer"
      title="Pesan sewa mobil & tiket shuttle antarkota"
      desc={
        activeRoutes.length + catalogVehicles.length > 0 ? (
          <span className="flex flex-wrap items-center gap-x-4 gap-y-1">
            <span className="flex items-center gap-1.5"><Car className="h-3.5 w-3.5 text-brand-500" />{catalogVehicles.length} unit siap sewa</span>
            <span className="flex items-center gap-1.5"><Bus className="h-3.5 w-3.5 text-leaf-600" />{activeRoutes.length} trayek aktif</span>
            <span className="flex items-center gap-1.5"><ShieldCheck className="h-3.5 w-3.5 text-lagoon-500" />Pembayaran escrow + proteksi asuransi opsional</span>
          </span>
        ) : undefined
      }
      icon={<Ticket className="h-6 w-6" />}
      gradient="from-brand-600 to-teal-400"
    >
      <FlashBanner flash={flash} />

      {loading && <PageLoader label="Memuat katalog armada & trayek…" />}
      {!loading && firstError && <ErrorPanel message={firstError} onRetry={() => { vendors.reload(); vehicles.reload(); routes.reload(); }} />}

      {!loading && !firstError && (
        <>
          {/* ================= Hasil layanan ================= */}
          <div className="grid gap-5 lg:grid-cols-[270px_1fr] items-start">
            {/* Sidebar filter */}
            <aside className="card p-4 sm:p-5 lg:sticky lg:top-28 space-y-5">
              <div className="grid grid-cols-2 gap-1 rounded-2xl bg-stone-100 p-1">
                <button
                  className={cn(
                    "flex flex-col items-center gap-0.5 rounded-xl py-2.5 text-[13px] font-extrabold transition",
                    service === "rental" ? "bg-gradient-to-br from-brand-600 to-teal-400 text-white shadow-warm" : "text-stone-500 hover:text-stone-700"
                  )}
                  onClick={() => setService("rental")}
                >
                  <CarFront className="h-[18px] w-[18px]" />
                  Rental Mobil
                </button>
                <button
                  className={cn(
                    "flex flex-col items-center gap-0.5 rounded-xl py-2.5 text-[13px] font-extrabold transition",
                    service === "travel" ? "bg-gradient-to-br from-leaf-600 to-leaf-400 text-white shadow-card" : "text-stone-500 hover:text-stone-700"
                  )}
                  onClick={() => setService("travel")}
                >
                  <Bus className="h-[18px] w-[18px]" />
                  Travel Antarkota
                </button>
              </div>

              {service === "rental" ? (
                <>
                  <div>
                    <label className="label">Lokasi</label>
                    <Select value={city} onChange={(e) => setCity(e.target.value)}>
                      <option>Semua</option>
                      {allCities.map((c) => (
                        <option key={c}>{c}</option>
                      ))}
                    </Select>
                  </div>
                  {categoriesHere.length > 0 && (
                    <div>
                      <label className="label">Kategori</label>
                      <div className="flex flex-wrap gap-1.5">
                        <button className={cn("chip", category === "Semua" ? "chip-on" : "chip-off")} onClick={() => setCategory("Semua")}>Semua</button>
                        {categoriesHere.map((c) => (
                          <button key={c} className={cn("chip", category === c ? "chip-on" : "chip-off")} onClick={() => setCategory(c)}>{c}</button>
                        ))}
                      </div>
                    </div>
                  )}
                  <div>
                    <label className="label">Skema Sewa</label>
                    <div className="flex flex-wrap gap-1.5">
                      <button className={cn("chip", scheme === "semua" ? "chip-on" : "chip-off")} onClick={() => setScheme("semua")}>Semua</button>
                      <button className={cn("chip", scheme === "self" ? "chip-on" : "chip-off")} onClick={() => setScheme("self")}>Lepas Kunci</button>
                      <button className={cn("chip", scheme === "driver" ? "chip-on" : "chip-off")} onClick={() => setScheme("driver")}>Dengan Sopir</button>
                    </div>
                  </div>
                </>
              ) : (
                <>
                  <div>
                    <label className="label">Kota Asal</label>
                    <Select value={tOrigin} onChange={(e) => setTOrigin(e.target.value)}>
                      <option>Semua</option>
                      {origins.map((c) => <option key={c}>{c}</option>)}
                    </Select>
                  </div>
                  <div>
                    <label className="label">Kota Tujuan</label>
                    <Select value={tDest} onChange={(e) => setTDest(e.target.value)}>
                      <option>Semua</option>
                      {destinations.map((c) => <option key={c}>{c}</option>)}
                    </Select>
                  </div>
                  <p className="rounded-xl bg-lagoon-50 px-3.5 py-2.5 text-[12px] text-lagoon-800 leading-relaxed flex gap-2">
                    <MapPin className="h-4 w-4 shrink-0 mt-0.5" />
                    Shuttle antar-jemput point-to-point / door-to-door dengan armada travel terverifikasi.
                  </p>
                </>
              )}
            </aside>

            {/* Daftar hasil */}
            <div className="min-w-0">
              {service === "rental" ? (
                filteredVehicles.length === 0 ? (
                  <EmptyState
                    icon={<Car className="h-6 w-6" />}
                    title="Tidak ada unit yang cocok"
                    desc="Coba ubah lokasi, kategori, atau skema sewa. Pastikan tabel vehicles sudah terisi (seed.sql)."
                  />
                ) : (
                  <div className="grid gap-5 sm:grid-cols-2">
                    {filteredVehicles.map((v) => (
                      <VehicleCard
                        key={v.id}
                        v={v}
                        vendorName={vendorById.get(v.vendor_id) ?? "Vendor"}
                        cityLabel={city !== "Semua" ? city : (v.cities[0] ?? "—")}
                        onBook={() => setBooking({ kind: "rental", v })}
                      />
                    ))}
                  </div>
                )
              ) : filteredRoutes.length === 0 ? (
                <EmptyState
                  icon={<Bus className="h-6 w-6" />}
                  title="Belum ada trayek di rute ini"
                  desc="Pilih kombinasi kota lain, atau daftarkan trayek baru lewat portal Partner."
                />
              ) : (
                <div className="space-y-4">
                  {filteredRoutes.map((r) => (
                    <TravelCard key={r.id} r={r} vendorName={vendorById.get(r.vendor_id) ?? "Vendor"} onBook={() => setBooking({ kind: "travel", r })} />
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* ================= Cari pesanan / e-tiket ================= */}
          <section className="mt-8">
            <div className="card p-4 sm:p-6">
              <div className="flex flex-wrap items-end justify-between gap-3">
                <div>
                  <h3 className="font-extrabold text-stone-800 flex items-center gap-2">
                    <FileSearch className="h-[18px] w-[18px] text-brand-500" /> Pesanan & e-Tiket saya
                  </h3>
                  <p className="text-[12.5px] text-stone-400 mt-0.5">
                    Cari berdasarkan nomor handphone (min. 3 digit) atau kode booking.
                  </p>
                </div>
                <div className="flex w-full max-w-sm gap-2">
                  <div className="relative grow">
                    <Search className="absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-stone-300" />
                    <Input
                      className="pl-10"
                      placeholder="0812… atau TRV-…"
                      value={searchQ}
                      onChange={(e) => setSearchQ(e.target.value)}
                      onKeyDown={(e) => e.key === "Enter" && setSearchText(searchQ)}
                    />
                  </div>
                  <button className="btn-soft shrink-0" onClick={() => setSearchText(searchQ)}>Cari</button>
                </div>
              </div>

              {searchText && (
                <div className="mt-4">
                  {allOrders.loading ? (
                    <PageLoader label="Mencari…" />
                  ) : allOrders.error ? (
                    <ErrorPanel message={allOrders.error} onRetry={allOrders.reload} />
                  ) : (matchedOrders ?? []).length === 0 ? (
                    <EmptyState icon={<Search className="h-6 w-6" />} title="Tidak ditemukan" desc="Tidak ada pesanan yang cocok dengan pencarian Anda." />
                  ) : (
                    <div className="space-y-3">
                      {(matchedOrders ?? []).map((o) => (
                        <OrderListRow
                          key={o.id}
                          order={o}
                          vendorName={o.vendor_id ? vendorById.get(o.vendor_id) : undefined}
                          right={
                            <button className="btn-ghost btn-sm" onClick={() => setTicketOrder(o)}>
                              <Ticket className="h-3.5 w-3.5" /> Lihat e-Tiket
                            </button>
                          }
                        />
                      ))}
                    </div>
                  )}
                </div>
              )}
            </div>
          </section>
        </>
      )}

      {/* ================= Modal booking ================= */}
      {booking?.kind === "rental" && (
        <RentalBookingModal
          key={`rental-${booking.v.id}`}
          v={booking.v}
          vendorName={vendorById.get(booking.v.vendor_id) ?? "Vendor"}
          onClose={() => setBooking(null)}
          onDone={(order) => {
            setBooking(null);
            setTicketOrder(order);
          }}
          onError={(msg) => show("err", msg)}
        />
      )}
      {booking?.kind === "travel" && (
        <TravelBookingModal
          key={`travel-${booking.r.id}`}
          r={booking.r}
          vendorName={vendorById.get(booking.r.vendor_id) ?? "Vendor"}
          onClose={() => setBooking(null)}
          onDone={(order) => {
            setBooking(null);
            setTicketOrder(order);
          }}
          onError={(msg) => show("err", msg)}
        />
      )}

      {/* ================= Modal e-tiket ================= */}
      <Modal
        open={!!ticketOrder}
        onClose={() => setTicketOrder(null)}
        title="🎉 Pemesanan berhasil!"
        subtitle="e-Tiket digital telah diterbitkan — tunjukkan kode saat boarding / serah terima unit."
        size="lg"
      >
        {ticketOrder && (
          <div className="space-y-4">
            <TicketView
              order={ticketOrder}
              vendorName={ticketOrder.vendor_id ? vendorById.get(ticketOrder.vendor_id) : undefined}
              vehicleName={
                ticketOrder.vehicle_id
                  ? (() => {
                      const mv = vehicleById.get(ticketOrder.vehicle_id);
                      return mv ? `${mv.name}` : undefined;
                    })()
                  : undefined
              }
            />
            <div className="flex flex-wrap justify-end gap-2">
              <button className="btn-ghost" onClick={() => setTicketOrder(null)}>Tutup</button>
              <button className="btn-primary" onClick={() => setTicketOrder(null)}>Selesai</button>
            </div>
          </div>
        )}
      </Modal>
    </PortalPage>
  );
}

/* =====================================================================
   Modal Booking — Rental Mobil
   ===================================================================== */
function RentalBookingModal({
  v,
  vendorName,
  onClose,
  onDone,
  onError,
}: {
  v: Vehicle;
  vendorName: string;
  onClose: () => void;
  onDone: (o: Order) => void;
  onError: (msg: string) => void;
}) {
  const hasBoth = v.allow_self_drive && v.price_with_driver != null;
  const [scheme, setScheme] = useState<"self" | "driver">(
    v.allow_self_drive ? "self" : "driver"
  );
  const rate = scheme === "self" ? v.price_per_day : (v.price_with_driver ?? v.price_per_day);
  const [start, setStart] = useState(addDays(todayInput(), 2));
  const [end, setEnd] = useState(addDays(todayInput(), 5));
  const days = rentalDays(start, end);
  const subtotal = rate * days;
  const [insurance, setInsurance] = useState(true);
  const insCost = Math.round(subtotal * RENTAL_INSURANCE_RATE);
  const total = subtotal + (insurance ? insCost : 0);

  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [pickup, setPickup] = useState("");
  const [time, setTime] = useState("08:00");
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [saving, setSaving] = useState(false);

  const submit = async () => {
    const e: Record<string, string> = {};
    if (name.trim().length < 2) e.name = "Nama wajib diisi.";
    if (phone.replace(/\D/g, "").length < 8) e.phone = "Nomor HP tidak valid.";
    if (!pickup.trim()) e.pickup = "Titik penjemputan wajib diisi.";
    if (!start) e.start = "Tanggal mulai wajib diisi.";
    if (!end) e.end = "Tanggal selesai wajib diisi.";
    if (start && end && end < start) e.end = "Tanggal selesai harus setelah tanggal mulai.";
    setErrors(e);
    if (Object.keys(e).length) return;

    setSaving(true);
    try {
      const order: NewOrder = {
        order_code: genOrderCode(),
        type: "rental",
        title: `Rental ${v.name} · ${days} hari (${scheme === "self" ? "Lepas Kunci" : "Dengan Sopir"})`,
        customer_name: name.trim(),
        customer_phone: phone.trim(),
        vendor_id: v.vendor_id,
        vehicle_id: v.id,
        route_id: null,
        driver_id: null,
        departure_date: start,
        departure_time: time || nowTimeHM(),
        pickup_point: pickup.trim(),
        seat_count: 1,
        duration_days: days,
        insurance,
        insurance_cost: insurance ? insCost : 0,
        total_price: total,
        status: "Perlu Konfirmasi",
        notes: "",
      };
      const created = await insertOrder(order);
      onDone(created);
    } catch (err) {
      onError(err instanceof Error ? err.message : String(err));
    } finally {
      setSaving(false);
    }
  };

  return (
    <Modal open onClose={onClose} title="Pesan Rental Mobil" subtitle={`${v.name} · ${vendorName}`} size="lg">
      <div className="grid gap-5 md:grid-cols-[240px_1fr]">
        <VehicleImage src={v.image_url} alt={v.name} className="h-36 w-full rounded-2xl" />
        <div className="grid gap-4 sm:grid-cols-2 min-w-0">
          <div className="sm:col-span-2">
            <label className="label">Skema sewa</label>
            <div className="grid grid-cols-2 gap-2">
              {v.allow_self_drive && (
                <button
                  type="button"
                  onClick={() => setScheme("self")}
                  className={cn(
                    "rounded-xl border-2 px-3 py-2.5 text-left transition",
                    scheme === "self" ? "border-brand-400 bg-brand-50" : "border-stone-200 hover:border-stone-300"
                  )}
                >
                  <p className="text-[12px] font-bold text-stone-400 uppercase">Lepas Kunci</p>
                  <p className="font-extrabold text-stone-800 text-[15px]">{rupiah(v.price_per_day)}<span className="text-[11px] text-stone-400">/hari</span></p>
                </button>
              )}
              {v.price_with_driver != null && (
                <button
                  type="button"
                  onClick={() => setScheme("driver")}
                  className={cn(
                    "rounded-xl border-2 px-3 py-2.5 text-left transition",
                    scheme === "driver" ? "border-brand-400 bg-brand-50" : "border-stone-200 hover:border-stone-300"
                  )}
                >
                  <p className="text-[12px] font-bold text-stone-400 uppercase">Dengan Sopir</p>
                  <p className="font-extrabold text-stone-800 text-[15px]">{rupiah(v.price_with_driver ?? v.price_per_day)}<span className="text-[11px] text-stone-400">/hari</span></p>
                </button>
              )}
            </div>
          </div>

          <Labeled label="Tanggal mulai" error={errors.start}>
            <Input type="date" value={start} min={todayInput()} onChange={(e) => setStart(e.target.value)} />
          </Labeled>
          <Labeled label="Tanggal selesai" error={errors.end}>
            <Input type="date" value={end} min={start || todayInput()} onChange={(e) => setEnd(e.target.value)} />
          </Labeled>
          <Labeled label="Jam jemput">
            <Input type="time" value={time} onChange={(e) => setTime(e.target.value)} />
          </Labeled>
          <div className="rounded-xl bg-stone-50 px-3.5 py-2.5 text-sm flex items-center gap-2.5">
            <Calendar className="h-4 w-4 text-brand-500" />
            <span className="text-stone-500">Durasi</span>
            <b className="text-stone-800">{days} hari</b>
          </div>
        </div>
      </div>

      <div className="mt-5 grid gap-4 sm:grid-cols-2">
        <Labeled label="Nama lengkap" error={errors.name}>
          <Input placeholder="cth: Rina Kusuma" value={name} onChange={(e) => setName(e.target.value)} />
        </Labeled>
        <Labeled label="No. WhatsApp" error={errors.phone}>
          <Input placeholder="08xxxxxxxxxx" value={phone} onChange={(e) => setPhone(e.target.value)} />
        </Labeled>
        <div className="sm:col-span-2">
          <Labeled label="Titik penjemputan / pengantaran" error={errors.pickup}>
            <Input placeholder="cth: Hotel Borobudur, Jakarta Pusat" value={pickup} onChange={(e) => setPickup(e.target.value)} />
          </Labeled>
        </div>
      </div>

      {/* Kalkulator biaya */}
      <div className="mt-5 rounded-2xl border border-brand-100 bg-gradient-to-br from-brand-50 to-teal-50 p-4 sm:p-5">
        <p className="text-[11px] font-extrabold uppercase tracking-widest text-brand-500 flex items-center gap-1.5">
          <Car className="h-3.5 w-3.5" /> Kalkulator biaya
        </p>
        <div className="mt-2.5 space-y-1.5 text-sm">
          <div className="flex justify-between text-stone-600">
            <span>{rupiah(rate)} × {days} hari</span>
            <b className="text-stone-800">{rupiah(subtotal)}</b>
          </div>
          <label className="flex items-center justify-between gap-3 rounded-xl bg-white/70 px-3.5 py-2.5 cursor-pointer">
            <span className="flex items-center gap-2 text-stone-600">
              <ShieldCheck className="h-4 w-4 text-leaf-600" />
              Proteksi asuransi perjalanan <span className="text-stone-400">(5%)</span>
            </span>
            <input type="checkbox" className="h-[18px] w-[18px] accent-brand-500" checked={insurance} onChange={(e) => setInsurance(e.target.checked)} />
          </label>
          {insurance && (
            <div className="flex justify-between text-stone-600">
              <span>Premi asuransi</span>
              <b className="text-stone-800">{rupiah(insCost)}</b>
            </div>
          )}
          <div className="flex justify-between border-t border-brand-200/60 pt-2 text-base font-extrabold text-lagoon-900">
            <span>Total (escrow)</span>
            <span>{rupiah(total)}</span>
          </div>
        </div>
        <p className="mt-2 text-[11.5px] text-stone-400">
          {hasBoth ? "Bisa pilih lepas kunci atau dengan sopir." : v.allow_self_drive ? "Unit ini hanya tersedia lepas kunci." : "Unit ini disewakan lengkap dengan sopir."}
          {" "}Komisi platform 10% dibayar vendor saat perjalanan selesai — bukan dari Anda.
        </p>
      </div>

      <div className="mt-5 flex flex-col-reverse sm:flex-row justify-end gap-2">
        <button className="btn-ghost" onClick={onClose}>Batal</button>
        <button className="btn-primary btn-lg" onClick={submit} disabled={saving}>
          {saving ? "Memproses…" : `Bayar Escrow · ${rupiah(total)}`}
        </button>
      </div>
    </Modal>
  );
}

/* =====================================================================
   Modal Booking — Travel Antarkota
   ===================================================================== */
function TravelBookingModal({
  r,
  vendorName,
  onClose,
  onDone,
  onError,
}: {
  r: Route;
  vendorName: string;
  onClose: () => void;
  onDone: (o: Order) => void;
  onError: (msg: string) => void;
}) {
  const [date, setDate] = useState(addDays(todayInput(), 1));
  const [time, setTime] = useState(r.departures[0] ?? "08:00");
  const [seats, setSeats] = useState(1);
  const subtotal = r.price_per_seat * seats;
  const [insurance, setInsurance] = useState(true);
  const insCost = insurance ? TRAVEL_INSURANCE_PER_SEAT * seats : 0;
  const total = subtotal + insCost;

  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [pickup, setPickup] = useState("");
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [saving, setSaving] = useState(false);

  const submit = async () => {
    const e: Record<string, string> = {};
    if (name.trim().length < 2) e.name = "Nama wajib diisi.";
    if (phone.replace(/\D/g, "").length < 8) e.phone = "Nomor HP tidak valid.";
    if (!pickup.trim()) e.pickup = "Titik penjemputan wajib diisi.";
    if (!date) e.date = "Tanggal wajib diisi.";
    setErrors(e);
    if (Object.keys(e).length) return;

    setSaving(true);
    try {
      const order: NewOrder = {
        order_code: genOrderCode(),
        type: "travel",
        title: `Travel ${r.origin} → ${r.destination} · ${seats} kursi`,
        customer_name: name.trim(),
        customer_phone: phone.trim(),
        vendor_id: r.vendor_id,
        vehicle_id: null,
        route_id: r.id,
        driver_id: null,
        departure_date: date,
        departure_time: time,
        pickup_point: pickup.trim(),
        seat_count: seats,
        duration_days: 1,
        insurance,
        insurance_cost: insCost,
        total_price: total,
        status: "Perlu Konfirmasi",
        notes: "",
      };
      const created = await insertOrder(order);
      onDone(created);
    } catch (err) {
      onError(err instanceof Error ? err.message : String(err));
    } finally {
      setSaving(false);
    }
  };

  return (
    <Modal open onClose={onClose} title="Pesan Kursi Travel" subtitle={`${r.origin} → ${r.destination} · ${vendorName}`} size="lg">
      <div className="rounded-2xl bg-gradient-to-br from-leaf-50 to-lagoon-50 p-4 flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <span className="grid h-11 w-11 place-items-center rounded-2xl bg-white text-leaf-600 shadow-card">
            <Bus className="h-[22px] w-[22px]" />
          </span>
          <div>
            <p className="font-extrabold text-lagoon-900 text-[15px]">{r.origin} → {r.destination}</p>
            <p className="text-[12px] text-stone-500">{r.fleet_type} · armada travel</p>
          </div>
        </div>
        <div className="flex flex-wrap gap-1.5">
          {r.departures.map((d) => (
            <button
              key={d}
              onClick={() => setTime(d)}
              className={cn(
                "rounded-lg px-2.5 py-1 font-mono text-[12px] font-bold transition",
                time === d ? "bg-leaf-600 text-white" : "bg-white text-lagoon-700 hover:bg-leaf-100"
              )}
            >
              {d}
            </button>
          ))}
        </div>
      </div>

      <div className="mt-5 grid gap-4 sm:grid-cols-3">
        <Labeled label="Tanggal berangkat" error={errors.date}>
          <Input type="date" min={todayInput()} value={date} onChange={(e) => setDate(e.target.value)} />
        </Labeled>
        <Labeled label="Jam keberangkatan">
          <Select value={time} onChange={(e) => setTime(e.target.value)}>
            {r.departures.map((d) => <option key={d}>{d}</option>)}
          </Select>
        </Labeled>
        <Labeled label="Jumlah kursi">
          <div className="flex items-center gap-2">
            <button className="btn-ghost btn-sm !px-2.5" onClick={() => setSeats(Math.max(1, seats - 1))} disabled={seats <= 1}>−</button>
            <span className="input text-center font-bold flex items-center justify-center h-11 !w-full">{seats}</span>
            <button className="btn-ghost btn-sm !px-2.5" onClick={() => setSeats(Math.min(12, seats + 1))} disabled={seats >= 12}>+</button>
          </div>
        </Labeled>
      </div>

      <div className="mt-4 grid gap-4 sm:grid-cols-2">
        <Labeled label="Nama lengkap penumpang" error={errors.name}>
          <Input placeholder="cth: Fajar Ramadhan" value={name} onChange={(e) => setName(e.target.value)} />
        </Labeled>
        <Labeled label="No. WhatsApp" error={errors.phone}>
          <Input placeholder="08xxxxxxxxxx" value={phone} onChange={(e) => setPhone(e.target.value)} />
        </Labeled>
        <div className="sm:col-span-2">
          <Labeled label="Titik penjemputan (door-to-door)" error={errors.pickup}>
            <Input placeholder={`cth: Jl. Sudirman, ${r.origin}`} value={pickup} onChange={(e) => setPickup(e.target.value)} />
          </Labeled>
        </div>
      </div>

      <div className="mt-5 rounded-2xl border border-leaf-100 bg-gradient-to-br from-leaf-50 to-lagoon-50 p-4 sm:p-5">
        <p className="text-[11px] font-extrabold uppercase tracking-widest text-leaf-600 flex items-center gap-1.5">
          <Users className="h-3.5 w-3.5" /> Kalkulator biaya
        </p>
        <div className="mt-2.5 space-y-1.5 text-sm">
          <div className="flex justify-between text-stone-600">
            <span>{rupiah(r.price_per_seat)} × {seats} kursi</span>
            <b className="text-stone-800">{rupiah(subtotal)}</b>
          </div>
          <label className="flex items-center justify-between gap-3 rounded-xl bg-white/70 px-3.5 py-2.5 cursor-pointer">
            <span className="flex items-center gap-2 text-stone-600">
              <ShieldCheck className="h-4 w-4 text-leaf-600" />
              Asuransi penumpang {rupiah(TRAVEL_INSURANCE_PER_SEAT)}/kursi
            </span>
            <input type="checkbox" className="h-[18px] w-[18px] accent-leaf-600" checked={insurance} onChange={(e) => setInsurance(e.target.checked)} />
          </label>
          {insurance && (
            <div className="flex justify-between text-stone-600">
              <span>Premi asuransi ({seats} kursi)</span>
              <b className="text-stone-800">{rupiah(insCost)}</b>
            </div>
          )}
          <div className="flex justify-between border-t border-leaf-200/70 pt-2 text-base font-extrabold text-lagoon-900">
            <span>Total (escrow)</span>
            <span>{rupiah(total)}</span>
          </div>
        </div>
      </div>

      <div className="mt-5 flex flex-col-reverse sm:flex-row justify-end gap-2">
        <button className="btn-ghost" onClick={onClose}>Batal</button>
        <button className="btn-green btn-lg" onClick={submit} disabled={saving}>
          {saving ? "Memproses…" : `Bayar Escrow · ${rupiah(total)}`}
        </button>
      </div>
    </Modal>
  );
}
