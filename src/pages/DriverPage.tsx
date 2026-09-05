import React, { useEffect, useMemo, useState } from "react";
import {
  AlertTriangle,
  Calendar,
  Car,
  CheckCircle2,
  ClipboardCheck,
  Clock,
  History,
  MapPin,
  MessageCircle,
  Navigation,
  Phone,
  Power,
  QrCode,
  Search,
  ShieldCheck,
  Wrench,
} from "lucide-react";
import {
  Badge,
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
import { TicketView, driverTone, orderTone, ServiceIcon } from "../components/items";
import { useAsyncData, useFlash } from "../lib/hooks";
import {
  completeInspection,
  createInspection,
  fetchDrivers,
  fetchInspections,
  fetchOrders,
  fetchVehicles,
  fetchVendors,
  findOrderByCode,
  setDriverStatus,
  updateOrder,
} from "../lib/db";
import type { Driver, Inspection, Order, Vehicle } from "../types/database";
import { FUEL_LEVELS } from "../types/database";
import { formatDate, formatDateTime, rupiah } from "../lib/format";

type DriverTab = "tugas" | "validasi" | "riwayat";

interface DData {
  drivers: Driver[];
  orders: Order[];
  vehicles: Vehicle[];
  inspections: Inspection[];
}

const loadAll = async (): Promise<DData> => {
  const [drivers, orders, vehicles, inspections] = await Promise.all([
    fetchDrivers(),
    fetchOrders(),
    fetchVehicles(),
    fetchInspections(),
  ]);
  return { drivers, orders, vehicles, inspections };
};

export default function DriverPage() {
  const ds = useAsyncData(loadAll);
  const vendorsDs = useAsyncData(fetchVendors);
  const [tab, setTab] = useState<DriverTab>("tugas");
  const [driverId, setDriverId] = useState<string | null>(null);
  const [scanResult, setScanResult] = useState<Order | null>(null);
  const [ticketView, setTicketView] = useState<Order | null>(null);
  const { flash, show } = useFlash();

  // Default driver = driver Online pertama
  useEffect(() => {
    if (!driverId && ds.data?.drivers.length) {
      const first = ds.data.drivers.find((d) => d.status === "Online") ?? ds.data.drivers[0];
      setDriverId(first.id);
    }
  }, [ds.data, driverId]);

  const driver = useMemo(
    () => ds.data?.drivers.find((d) => d.id === driverId) ?? null,
    [ds.data, driverId]
  );
  const vendorName = useMemo(() => {
    if (!driver) return "";
    return vendorsDs.data?.find((v) => v.id === driver.vendor_id)?.business_name ?? "";
  }, [driver, vendorsDs.data]);

  const vendorVehicles = useMemo(
    () => (driver ? (ds.data?.vehicles ?? []).filter((v) => v.vendor_id === driver.vendor_id) : []),
    [driver, ds.data]
  );

  if (ds.loading)
    return (
      <div className="mx-auto max-w-lg px-4 py-10">
        <PageLoader label="Memuat aplikasi Driver…" />
      </div>
    );
  if (ds.error)
    return (
      <div className="mx-auto max-w-lg px-4 py-10">
        <ErrorPanel message={ds.error} onRetry={ds.reload} />
      </div>
    );

  const data = ds.data as DData;

  return (
    <div className="mx-auto w-full max-w-lg px-3 sm:px-4 pb-20 pt-5">
      <FlashBanner flash={flash} />

      {/* ===== Kepala aplikasi driver ===== */}
      <div className="animate-rise overflow-hidden rounded-3xl bg-gradient-to-br from-lagoon-900 via-lagoon-800 to-leaf-700 p-5 text-white shadow-card-lg">
        <div className="flex items-center justify-between gap-3">
          <div className="flex items-center gap-3 min-w-0">
            <span className="avatar h-12 w-12 bg-white/20 !text-white text-[15px] shrink-0">
              {(driver?.name ?? "?").split(" ").map((p) => p[0]).slice(0, 2).join("").toUpperCase()}
            </span>
            <div className="min-w-0">
              <Select
                className="!bg-white/10 !border-white/20 !text-white font-extrabold !h-8 !w-auto !pr-8 !text-[14px] [&>option]:text-stone-800"
                value={driver?.id ?? ""}
                onChange={(e) => setDriverId(e.target.value)}
              >
                {data.drivers.map((d) => (
                  <option key={d.id} value={d.id}>{d.name}</option>
                ))}
              </Select>
              <p className="text-[11.5px] text-lagoon-100/80 truncate">{vendorName || "—"} · {driver?.phone || ""}</p>
            </div>
          </div>
          <Badge tone={driver ? driverTone(driver.status) : "muted"} className="bg-white/15 ring-white/20 !text-white">
            {driver?.status ?? "—"}
          </Badge>
        </div>

        <div className="mt-4 flex items-center justify-between rounded-2xl bg-white/10 px-4 py-3 backdrop-blur">
          <div className="flex items-center gap-2.5">
            <Power className="h-5 w-5" />
            <div>
              <p className="text-[13px] font-extrabold leading-tight">
                {driver?.status === "Online" ? "Mode Online aktif" : "Kamu sedang tidak online"}
              </p>
              <p className="text-[10.5px] text-lagoon-100/70">
                {driver?.status === "Online" ? "Tugas masuk real-time dari partner." : "Aktifkan untuk menerima penugasan."}
              </p>
            </div>
          </div>
          <button
            className={cn(
              "relative h-8 w-16 rounded-full transition-colors",
              driver?.status === "Online" ? "bg-leaf-400" : "bg-white/25"
            )}
            role="switch"
            aria-checked={driver?.status === "Online"}
            disabled={!driver}
            onClick={async () => {
              if (!driver) return;
              const next: Driver["status"] = driver.status === "Online" ? "Offline" : "Online";
              try {
                await setDriverStatus(driver.id, next);
                show("ok", next === "Online" ? "Mode Online — siap menerima tugas." : "Mode Offline.");
                ds.reload();
              } catch (e) {
                show("err", e instanceof Error ? e.message : String(e));
              }
            }}
          >
            <span
              className={cn(
                "absolute top-1 h-6 w-6 rounded-full bg-white shadow transition-all",
                driver?.status === "Online" ? "left-9" : "left-1"
              )}
            />
          </button>
        </div>
      </div>

      {/* ===== Sub tab driver ===== */}
      <div className="mt-4 grid grid-cols-3 gap-1 rounded-2xl bg-white p-1 shadow-card">
        {(
          [
            { id: "tugas", label: "Tugas", icon: <Navigation className="h-4 w-4" /> },
            { id: "validasi", label: "Validasi", icon: <QrCode className="h-4 w-4" /> },
            { id: "riwayat", label: "Riwayat", icon: <History className="h-4 w-4" /> },
          ] as { id: DriverTab; label: string; icon: React.ReactNode }[]
        ).map((t) => (
          <button
            key={t.id}
            onClick={() => setTab(t.id)}
            className={cn(
              "flex items-center justify-center gap-1.5 rounded-xl py-2.5 text-[13px] font-extrabold transition",
              tab === t.id ? "bg-gradient-to-r from-brand-500 to-amber-400 text-white shadow-warm" : "text-stone-500 hover:text-stone-700"
            )}
          >
            {t.icon}
            {t.label}
          </button>
        ))}
      </div>

      {!driver ? (
        <div className="mt-5">
          <EmptyState icon={<Car className="h-6 w-6" />} title="Belum ada sopir" desc="Partner harus menambahkan sopir dulu (seed.sql menyediakan 6 sopir contoh)." />
        </div>
      ) : (
        <>
          {tab === "tugas" && (
            <JobBoard
              driver={driver}
              orders={data.orders}
              vehicles={data.vehicles}
              inspections={data.inspections}
              vendorVehicles={vendorVehicles}
              reload={ds.reload}
              onFlash={show}
              onTicket={setTicketView}
            />
          )}
          {tab === "validasi" && (
            <ScannerTab driver={driver} onFlash={show} onTicket={setTicketView} result={scanResult} setResult={setScanResult} />
          )}
          {tab === "riwayat" && (
            <HistoryTab driver={driver} orders={data.orders} inspections={data.inspections} vehicles={data.vehicles} onTicket={setTicketView} />
          )}
        </>
      )}

      {/* ===== Modal e-tiket ===== */}
      <Modal open={!!ticketView} onClose={() => setTicketView(null)} title="Detail Tugas / e-Tiket" size="lg">
        {ticketView && (
          <TicketView
            order={ticketView}
            vehicleName={data.vehicles.find((v) => v.id === ticketView.vehicle_id)?.name}
            driverName={driver?.name}
          />
        )}
      </Modal>
    </div>
  );
}

/* =============================================================== Job Board */

function JobBoard({
  driver,
  orders,
  vehicles,
  inspections,
  vendorVehicles,
  reload,
  onFlash,
  onTicket,
}: {
  driver: Driver;
  orders: Order[];
  vehicles: Vehicle[];
  inspections: Inspection[];
  vendorVehicles: Vehicle[];
  reload: () => void;
  onFlash: (k: "ok" | "err", m: string) => void;
  onTicket: (o: Order) => void;
}) {
  const jobs = orders.filter((o) => o.driver_id === driver.id && (o.status === "Perlu Konfirmasi" || o.status === "Sedang Berjalan"));
  const inspectionFor = (orderId: string) => inspections.find((i) => i.order_id === orderId);
  const vehicleName = (vId: string | null) => vehicles.find((v) => v.id === vId)?.name;

  return (
    <div className="mt-4 space-y-3">
      {driver.status !== "Online" && (
        <div className="flex items-start gap-2.5 rounded-2xl bg-amber-50 p-3.5 text-[12.5px] text-amber-800 ring-1 ring-amber-200 animate-rise">
          <AlertTriangle className="h-[18px] w-[18px] shrink-0 mt-0.5" />
          Mode kamu <b>{driver.status}</b> — nyalakan Mode Online untuk menerima tugas baru dari partner.
        </div>
      )}
      <p className="px-1 text-[13px] font-extrabold text-stone-500 flex items-center gap-1.5">
        <Navigation className="h-4 w-4 text-brand-500" /> Tugas aktif ({jobs.length})
      </p>

      {jobs.length === 0 ? (
        <EmptyState
          icon={<Navigation className="h-6 w-6" />}
          title="Tidak ada tugas aktif"
          desc="Pesanan yang ditugaskan partner ke kamu akan muncul di sini."
        />
      ) : (
        jobs.map((o) => {
          const insp = inspectionFor(o.id);
          return (
            <JobCard
              key={o.id}
              o={o}
              vehicleName={vehicleName(o.vehicle_id)}
              insp={insp}
              vendorVehicles={vendorVehicles}
              reload={reload}
              onFlash={onFlash}
              onTicket={onTicket}
            />
          );
        })
      )}

      <div className="pt-2">
        <p className="px-1 text-[13px] font-extrabold text-stone-500">Informasi</p>
        <div className="mt-2 rounded-2xl bg-white/80 p-4 text-[12.5px] text-stone-500 leading-relaxed shadow-card space-y-1.5">
          <p className="flex gap-2"><Wrench className="h-4 w-4 text-brand-500 shrink-0" /><span>Inspeksi unit wajib diisi saat <b>mulai</b> (KM & BBM awal, kondisi bodi) dan saat <b>selesai</b> (KM & BBM akhir).</span></p>
          <p className="flex gap-2"><ShieldCheck className="h-4 w-4 text-leaf-600 shrink-0" /><span>Validasi e-tiket penumpang lewat tab <b>Validasi</b> sebelum boarding.</span></p>
        </div>
      </div>
    </div>
  );
}

function JobCard({
  o,
  vehicleName,
  insp,
  vendorVehicles,
  reload,
  onFlash,
  onTicket,
}: {
  o: Order;
  vehicleName?: string;
  insp?: Inspection;
  vendorVehicles: Vehicle[];
  reload: () => void;
  onFlash: (k: "ok" | "err", m: string) => void;
  onTicket: (o: Order) => void;
}) {
  const [showStart, setShowStart] = useState(false);
  const [showEnd, setShowEnd] = useState(false);

  const wa = (o.customer_phone || "").replace(/\D/g, "");
  const maps = encodeURIComponent(o.pickup_point || `${o.title} Indonesia`);

  return (
    <div className="card p-4 animate-rise">
      <div className="flex items-start gap-3">
        <ServiceIcon type={o.type} />
        <div className="min-w-0 grow">
          <div className="flex flex-wrap items-center gap-1.5">
            <span className="font-mono text-[10.5px] font-bold text-stone-400">{o.order_code}</span>
            <Badge tone={orderTone(o.status)}>{o.status}</Badge>
            {insp && <Badge tone="brand">Inspeksi ✓</Badge>}
          </div>
          <p className="font-extrabold text-stone-800 text-[14px] leading-snug mt-0.5">{o.title}</p>
          <div className="mt-1.5 space-y-1 text-[12px] text-stone-500">
            <p className="flex items-center gap-1.5"><Calendar className="h-3.5 w-3.5 text-stone-300" /> {formatDate(o.departure_date)} · {o.departure_time}</p>
            <p className="flex items-center gap-1.5"><MapPin className="h-3.5 w-3.5 text-stone-300" /> {o.pickup_point || "—"}</p>
            <p className="flex items-center gap-1.5"><Phone className="h-3.5 w-3.5 text-stone-300" /> {o.customer_name} · {o.customer_phone || "—"}</p>
            {vehicleName && <p className="flex items-center gap-1.5"><Car className="h-3.5 w-3.5 text-stone-300" /> {vehicleName}</p>}
            {insp && insp.km_start > 0 && (
              <p className="flex items-center gap-1.5"><ClipboardCheck className="h-3.5 w-3.5 text-stone-300" /> KM awal {insp.km_start.toLocaleString("id-ID")} · BBM {insp.fuel_start}</p>
            )}
          </div>
        </div>
      </div>

      <div className="mt-3 flex flex-wrap gap-2 border-t border-stone-100 pt-3">
        <a className="btn-soft btn-sm" href={`https://wa.me/${wa}`} target="_blank" rel="noreferrer">
          <MessageCircle className="h-3.5 w-3.5" /> WhatsApp
        </a>
        <a className="btn-soft btn-sm" href={`https://www.google.com/maps/search/?api=1&query=${maps}`} target="_blank" rel="noreferrer">
          <MapPin className="h-3.5 w-3.5" /> Maps
        </a>
        <button className="btn-ghost btn-sm ml-auto" onClick={() => onTicket(o)}>Detail</button>

        {!insp && o.status === "Sedang Berjalan" && (
          <button className="btn-primary btn-sm" onClick={() => setShowStart(true)}>
            <Wrench className="h-3.5 w-3.5" /> Mulai — Inspeksi Awal
          </button>
        )}
        {insp && o.status === "Sedang Berjalan" && (
          <button className="btn-green btn-sm" onClick={() => setShowEnd(true)}>
            <CheckCircle2 className="h-3.5 w-3.5" /> Selesaikan Perjalanan
          </button>
        )}
      </div>

      {showStart && (
        <InspectionStartModal
          order={o}
          driverId={o.driver_id!}
          defaultVehicleId={o.vehicle_id ?? vendorVehicles[0]?.id ?? ""}
          vendorVehicles={vendorVehicles}
          onClose={() => setShowStart(false)}
          onFlash={onFlash}
          reload={reload}
        />
      )}
      {showEnd && insp && (
        <InspectionEndModal
          inspection={insp}
          onClose={() => setShowEnd(false)}
          onFlash={onFlash}
          reload={reload}
          onDone={() => setShowEnd(false)}
        />
      )}
    </div>
  );
}

function InspectionStartModal({
  order,
  driverId,
  defaultVehicleId,
  vendorVehicles,
  onClose,
  onFlash,
  reload,
}: {
  order: Order;
  driverId: string;
  defaultVehicleId: string;
  vendorVehicles: Vehicle[];
  onClose: () => void;
  onFlash: (k: "ok" | "err", m: string) => void;
  reload: () => void;
}) {
  const [vehicleId, setVehicleId] = useState(defaultVehicleId);
  const [km, setKm] = useState("");
  const [fuel, setFuel] = useState<string>(FUEL_LEVELS[3]);
  const [body, setBody] = useState("Baik");
  const [err, setErr] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  const start = async () => {
    const kmVal = Number(km);
    if (!vehicleId) return setErr("Pilih unit kendaraan yang dipakai.");
    if (!km || Number.isNaN(kmVal) || kmVal < 0) return setErr("KM awal wajib diisi angka valid.");
    setBusy(true);
    setErr(null);
    try {
      await createInspection({
        driver_id: driverId,
        vehicle_id: vehicleId,
        order_id: order.id,
        km_start: Math.round(kmVal),
        fuel_start: fuel,
        body_condition: body,
      });
      onFlash("ok", "Inspeksi awal tersimpan — perjalanan siap dimulai.");
      reload();
      onClose();
    } catch (e) {
      setErr(e instanceof Error ? e.message : String(e));
    } finally {
      setBusy(false);
    }
  };

  return (
    <Modal open onClose={onClose} title="Inspeksi Awal Unit" subtitle={`${order.order_code} · catat kondisi sebelum berangkat`} size="md">
      <div className="space-y-4">
        <Labeled label="Unit kendaraan">
          <Select value={vehicleId} onChange={(e) => setVehicleId(e.target.value)}>
            {vendorVehicles.length === 0 && <option value="">Belum ada unit — hubungi partner</option>}
            {vendorVehicles.map((v) => (
              <option key={v.id} value={v.id}>{v.name} · {v.plate}</option>
            ))}
          </Select>
        </Labeled>
        <div className="grid grid-cols-2 gap-4">
          <Labeled label="KM awal (odometer)">
            <Input type="number" min={0} placeholder="cth 124500" value={km} onChange={(e) => setKm(e.target.value)} />
          </Labeled>
          <Labeled label="Indikator BBM">
            <Select value={fuel} onChange={(e) => setFuel(e.target.value)}>
              {FUEL_LEVELS.map((f) => <option key={f}>{f}</option>)}
            </Select>
          </Labeled>
        </div>
        <Labeled label="Kondisi fisik bodi">
          <Select value={body} onChange={(e) => setBody(e.target.value)}>
            {["Baik", "Lecet kecil", "Penyok ringan", "Rusak berat"].map((b) => <option key={b}>{b}</option>)}
          </Select>
        </Labeled>
        {err && <p className="rounded-xl bg-rose-50 px-3.5 py-2.5 text-[12.5px] font-semibold text-rose-600">{err}</p>}
        <div className="flex justify-end gap-2 pt-1">
          <button className="btn-ghost" onClick={onClose}>Batal</button>
          <button className="btn-primary" onClick={start} disabled={busy}>{busy ? "Menyimpan…" : "Mulai Perjalanan"}</button>
        </div>
      </div>
    </Modal>
  );
}

function InspectionEndModal({
  inspection,
  onClose,
  onFlash,
  reload,
  onDone,
}: {
  inspection: Inspection;
  onClose: () => void;
  onFlash: (k: "ok" | "err", m: string) => void;
  reload: () => void;
  onDone: () => void;
}) {
  const [km, setKm] = useState("");
  const [fuel, setFuel] = useState<string>(inspection.fuel_start ?? "3/4");
  const [notes, setNotes] = useState("");
  const [err, setErr] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [armed, setArmed] = useState(false);

  const done = async () => {
    if (!armed) {
      setArmed(true);
      setTimeout(() => setArmed(false), 4000);
      return;
    }
    const kmVal = Number(km);
    if (!km || Number.isNaN(kmVal) || kmVal < (inspection.km_start || 0)) {
      setErr(`KM akhir wajib diisi dan ≥ KM awal (${inspection.km_start.toLocaleString("id-ID")}).`);
      return;
    }
    setBusy(true);
    setErr(null);
    try {
      await completeInspection(inspection.id, {
        km_end: Math.round(kmVal),
        fuel_end: fuel,
        damage_notes: notes.trim(),
      });
      if (inspection.order_id) await updateOrder(inspection.order_id, { status: "Selesai" });
      onFlash("ok", "Perjalanan selesai! Inspeksi akhir tersimpan, vendor menerima 90% escrow.");
      reload();
      onDone();
    } catch (e) {
      setErr(e instanceof Error ? e.message : String(e));
    } finally {
      setBusy(false);
    }
  };

  return (
    <Modal open onClose={onClose} title="Selesaikan Perjalanan" subtitle="Catat kondisi akhir & tutup tugas" size="md">
      <div className="space-y-4">
        <div className="rounded-xl bg-stone-50 px-3.5 py-2.5 text-[12.5px] text-stone-500 flex flex-wrap gap-x-4 gap-y-1">
          <span>KM awal: <b className="text-stone-700">{inspection.km_start.toLocaleString("id-ID")}</b></span>
          <span>BBM awal: <b className="text-stone-700">{inspection.fuel_start}</b></span>
          <span>Bodi: <b className="text-stone-700">{inspection.body_condition}</b></span>
        </div>
        <div className="grid grid-cols-2 gap-4">
          <Labeled label="KM akhir (odometer)">
            <Input type="number" min={0} placeholder="cth 124730" value={km} onChange={(e) => setKm(e.target.value)} />
          </Labeled>
          <Labeled label="Indikator BBM akhir">
            <Select value={fuel} onChange={(e) => setFuel(e.target.value)}>
              {FUEL_LEVELS.map((f) => <option key={f}>{f}</option>)}
            </Select>
          </Labeled>
        </div>
        <Labeled label="Catatan kerusakan / kejadian (opsional)">
          <Input placeholder="cth: baret kecil di bemper kiri" value={notes} onChange={(e) => setNotes(e.target.value)} />
        </Labeled>
        {err && <p className="rounded-xl bg-rose-50 px-3.5 py-2.5 text-[12.5px] font-semibold text-rose-600">{err}</p>}
        <div className="flex justify-end gap-2 pt-1">
          <button className="btn-ghost" onClick={onClose}>Batal</button>
          <button className={cn("btn-green", armed && "btn-primary")} onClick={done} disabled={busy}>
            {busy ? "Menyimpan…" : armed ? "Yakin? Tandai Selesai" : "Tandai Perjalanan Selesai"}
          </button>
        </div>
      </div>
    </Modal>
  );
}

/* =============================================================== Scanner */

function ScannerTab({
  driver,
  onFlash,
  onTicket,
  result,
  setResult,
}: {
  driver: Driver;
  onFlash: (k: "ok" | "err", m: string) => void;
  onTicket: (o: Order) => void;
  result: Order | null;
  setResult: (o: Order | null) => void;
}) {
  const [code, setCode] = useState("");
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState<string | null>(null);
  const [checkedBusy, setCheckedBusy] = useState(false);

  const scan = async () => {
    if (code.trim().length < 4) {
      setErr("Masukkan kode booking minimal 4 karakter (cth: TRV-DEMO-0001).");
      return;
    }
    setBusy(true);
    setErr(null);
    try {
      const found = await findOrderByCode(code);
      if (!found) {
        setResult(null);
        setErr("Kode tidak ditemukan. Pastikan e-tiket valid dari Portal Customer.");
        return;
      }
      setResult(found);
      onFlash("ok", found.checked_in ? "Tiket ini sudah pernah di-check-in." : `Tiket ditemukan: ${found.order_code}`);
    } catch (e) {
      setErr(e instanceof Error ? e.message : String(e));
    } finally {
      setBusy(false);
    }
  };

  const checkin = async () => {
    if (!result) return;
    setCheckedBusy(true);
    try {
      await updateOrder(result.id, { checked_in: true });
      onFlash("ok", `Penumpang ${result.customer_name} berhasil di-check-in (boarding).`);
      setResult({ ...result, checked_in: true });
    } catch (e) {
      onFlash("err", e instanceof Error ? e.message : String(e));
    } finally {
      setCheckedBusy(false);
    }
  };

  return (
    <div className="mt-4 space-y-4">
      <div className="card p-5 text-center animate-rise">
        <span className="mx-auto grid h-14 w-14 place-items-center rounded-2xl bg-gradient-to-br from-lagoon-600 to-leaf-500 text-white shadow-card-lg">
          <QrCode className="h-7 w-7" />
        </span>
        <p className="mt-3 font-extrabold text-stone-800">Pindai / Validasi e-Tiket</p>
        <p className="text-[12.5px] text-stone-400 mt-1">
          Masukkan kode booking dari aplikasi Customer. Cocokkan nama penumpang sebelum boarding.
        </p>
        <div className="mt-4 flex gap-2">
          <Input
            className="font-mono uppercase placeholder:normal-case"
            placeholder="TRV-DEMO-0001"
            value={code}
            onChange={(e) => setCode(e.target.value.toUpperCase())}
            onKeyDown={(e) => e.key === "Enter" && scan()}
          />
          <button className="btn-primary shrink-0" onClick={scan} disabled={busy}>
            <Search className="h-4 w-4" /> Validasi
          </button>
        </div>
        {err && <p className="mt-3 rounded-xl bg-rose-50 px-3.5 py-2.5 text-[12.5px] font-semibold text-rose-600 text-left">{err}</p>}
      </div>

      {result && (
        <div className="animate-pop space-y-3">
          <div
            className={cn(
              "rounded-2xl p-4 flex items-center gap-3 shadow-card",
              result.checked_in ? "bg-leaf-50 ring-1 ring-leaf-200" : "bg-brand-50 ring-1 ring-brand-200"
            )}
          >
            {result.checked_in ? (
              <CheckCircle2 className="h-8 w-8 text-leaf-600 shrink-0" />
            ) : (
              <QrCode className="h-8 w-8 text-brand-600 shrink-0" />
            )}
            <div className="text-[13px]">
              <p className="font-extrabold text-stone-800">{result.order_code}</p>
              <p className="text-stone-500">
                {result.checked_in
                  ? "Penumpang sudah check-in — silakan berangkat."
                  : result.status === "Sedang Berjalan"
                    ? `Tiket valid atas nama ${result.customer_name}.`
                    : `Status tiket: ${result.status} (belum bisa boarding).`}
              </p>
            </div>
          </div>

          <div className="rounded-2xl border border-stone-100 bg-white p-4 shadow-card text-sm space-y-2">
            <p className="flex justify-between"><span className="text-stone-400">Penumpang</span><b>{result.customer_name}</b></p>
            <p className="flex justify-between"><span className="text-stone-400">Kontak</span><b>{result.customer_phone || "—"}</b></p>
            <p className="flex justify-between"><span className="text-stone-400">Layanan</span><b>{result.title}</b></p>
            <p className="flex justify-between"><span className="text-stone-400">Jadwal</span><b>{formatDate(result.departure_date)} {result.departure_time}</b></p>
            <p className="flex justify-between gap-3"><span className="text-stone-400 shrink-0">Penjemputan</span><b className="text-right">{result.pickup_point || "—"}</b></p>
            <p className="flex justify-between"><span className="text-stone-400">Total</span><b>{rupiah(result.total_price)}</b></p>
            <p className="flex justify-between"><span className="text-stone-400">Status</span><Badge tone={orderTone(result.status)}>{result.status}</Badge></p>
          </div>

          {driver.status !== "Online" && result.status === "Sedang Berjalan" && (
            <p className="text-[11.5px] text-stone-400 text-center">Tips: aktifkan Mode Online agar pencatatan tugas konsisten.</p>
          )}

          {result.status === "Sedang Berjalan" && !result.checked_in && (
            <button className="btn-green btn-block" onClick={checkin} disabled={checkedBusy}>
              <CheckCircle2 className="h-4 w-4" /> {checkedBusy ? "Memproses…" : "Check-in Penumpang (Boarding)"}
            </button>
          )}
          <button className="btn-ghost btn-block" onClick={() => onTicket(result)}>Lihat e-Tiket penuh</button>
        </div>
      )}
    </div>
  );
}

/* ================================================================ Riwayat */

function HistoryTab({
  driver,
  orders,
  inspections,
  vehicles,
  onTicket,
}: {
  driver: Driver;
  orders: Order[];
  inspections: Inspection[];
  vehicles: Vehicle[];
  onTicket: (o: Order) => void;
}) {
  const done = orders
    .filter((o) => o.driver_id === driver.id && o.status === "Selesai")
    .slice(0, 20);
  const doneIds = new Set(done.map((o) => o.id));

  return (
    <div className="mt-4 space-y-3">
      <p className="px-1 text-[13px] font-extrabold text-stone-500 flex items-center gap-1.5">
        <History className="h-4 w-4 text-leaf-600" /> Perjalanan selesai ({done.length})
      </p>
      {done.length === 0 ? (
        <EmptyState
          icon={<History className="h-6 w-6" />}
          title="Belum ada riwayat"
          desc="Perjalanan yang kamu selesaikan akan tercatat di sini beserta inspeksinya."
        />
      ) : (
        done.map((o) => {
          const insp = inspections.find((i) => i.order_id === o.id);
          return (
            <div key={o.id} className="card p-4 animate-rise">
              <div className="flex items-start gap-3">
                <ServiceIcon type={o.type} />
                <div className="min-w-0 grow">
                  <div className="flex flex-wrap items-center gap-1.5">
                    <span className="font-mono text-[10.5px] font-bold text-stone-400">{o.order_code}</span>
                    <Badge tone="ok">Selesai</Badge>
                  </div>
                  <p className="font-bold text-stone-800 text-[13.5px] leading-snug mt-0.5">{o.title}</p>
                  <p className="mt-1 flex flex-wrap items-center gap-x-3 gap-y-0.5 text-[11.5px] text-stone-400">
                    <span className="flex items-center gap-1"><Clock className="h-3 w-3" />{formatDateTime(o.created_at)}</span>
                    <span className="flex items-center gap-1"><Phone className="h-3 w-3" />{o.customer_name}</span>
                  </p>
                  {insp && (
                    <p className="mt-1 rounded-lg bg-leaf-50 px-2.5 py-1.5 text-[11px] text-leaf-700">
                      Inspeksi: KM {insp.km_start.toLocaleString("id-ID")} → {insp.km_end?.toLocaleString("id-ID") ?? "—"} · BBM {insp.fuel_start} → {insp.fuel_end ?? "—"} · {insp.body_condition}{insp.damage_notes ? ` · ${insp.damage_notes}` : ""}
                    </p>
                  )}
                </div>
                <p className="font-extrabold text-lagoon-900 whitespace-nowrap">{rupiah(o.total_price)}</p>
              </div>
              <button className="btn-ghost btn-sm mt-2" onClick={() => onTicket(o)}>Lihat e-Tiket</button>
            </div>
          );
        })
      )}
    </div>
  );
}
