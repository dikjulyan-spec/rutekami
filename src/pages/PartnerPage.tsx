import React, { useEffect, useMemo, useState } from "react";
import {
  Banknote,
  Building2,
  Bus,
  Car,
  CircleDollarSign,
  ClipboardList,
  Clock,
  LayoutDashboard,
  MapPin,
  PencilLine,
  Plus,
  ShieldCheck,
  Trash2,
  Truck,
  UserRound,
  Users,
  Wallet,
} from "lucide-react";
import { CardSection, PortalPage, SubTabs } from "../components/shell";
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
  Toggle,
  cn,
} from "../components/ui";
import { OrderListRow, TicketView, VehicleImage, driverTone, orderTone } from "../components/items";
import { useAsyncData, useFlash } from "../lib/hooks";
import {
  deleteVehicle,
  fetchDrivers,
  fetchOrders,
  fetchPayouts,
  fetchRoutes,
  fetchVehicles,
  fetchVendors,
  insertDriver,
  insertPayout,
  insertRoute,
  insertVehicle,
  setDriverStatus,
  setRouteActive,
  updateOrder,
  updateVehicle,
  uploadVehicleImage,
} from "../lib/db";
import type { NewVehicle } from "../lib/db";
import type {
  Driver,
  Order,
  Payout,
  Route,
  Vehicle,
  Vendor,
} from "../types/database";
import { TRANSMISSIONS, VEHICLE_CATEGORIES } from "../types/database";
import { formatDateTime, num, rupiah } from "../lib/format";

type PartnerTab = "dashboard" | "armada" | "trayek" | "pesanan" | "sopir" | "wallet";

interface Dataset {
  vendors: Vendor[];
  vehicles: Vehicle[];
  routes: Route[];
  drivers: Driver[];
  orders: Order[];
  payouts: Payout[];
}

/** Data yang sudah tersaring untuk satu vendor aktif. */
interface ScopeData {
  vendor: Vendor;
  vehicles: Vehicle[];
  routes: Route[];
  drivers: Driver[];
  orders: Order[];
  payouts: Payout[];
  vendors: Vendor[];
  allVehicles: Vehicle[];
}

const loadAll = async (): Promise<Dataset> => {
  const [vendors, vehicles, routes, drivers, orders, payouts] = await Promise.all([
    fetchVendors(),
    fetchVehicles(),
    fetchRoutes(),
    fetchDrivers(),
    fetchOrders(),
    fetchPayouts(),
  ]);
  return { vendors, vehicles, routes, drivers, orders, payouts };
};

export default function PartnerPage() {
  const ds = useAsyncData(loadAll);
  const [tab, setTab] = useState<PartnerTab>("dashboard");
  const [vendorId, setVendorId] = useState<string | null>(null);
  const [ticketOrder, setTicketOrder] = useState<Order | null>(null);
  const { flash, show } = useFlash();

  // Default vendor = vendor terverifikasi pertama
  useEffect(() => {
    if (!vendorId && ds.data?.vendors.length) {
      const first =
        ds.data.vendors.find((v) => v.status === "verified") ?? ds.data.vendors[0];
      setVendorId(first.id);
    }
  }, [ds.data, vendorId]);

  const vendor = useMemo(
    () => ds.data?.vendors.find((v) => v.id === vendorId) ?? null,
    [ds.data, vendorId]
  );

  const scope = useMemo<ScopeData | null>(() => {
    if (!ds.data || !vendor) return null;
    return {
      vendor,
      vehicles: ds.data.vehicles.filter((v) => v.vendor_id === vendor.id),
      routes: ds.data.routes.filter((r) => r.vendor_id === vendor.id),
      drivers: ds.data.drivers.filter((d) => d.vendor_id === vendor.id),
      orders: ds.data.orders.filter((o) => o.vendor_id === vendor.id),
      payouts: ds.data.payouts.filter((p) => p.vendor_id === vendor.id),
      vendors: ds.data.vendors,
      allVehicles: ds.data.vehicles,
    };
  }, [ds.data, vendor]);

  if (ds.loading) return <ShellLoading />;
  if (ds.error) {
    return (
      <PortalPage kicker="Portal Partner" title="Dashboard Vendor Armada" icon={<Building2 className="h-6 w-6" />}>
        <ErrorPanel message={ds.error} onRetry={ds.reload} />
      </PortalPage>
    );
  }

  return (
    <PortalPage
      kicker="Portal Partner · Vendor Armada"
      title="Kelola armada, trayek, sopir & pendapatan"
      desc="Omzet masuk escrow RuteTrip — 90% menjadi saldo bersih Anda otomatis saat pesanan selesai."
      icon={<Building2 className="h-6 w-6" />}
      gradient="from-lagoon-600 to-leaf-500"
      actions={
        scope?.vendors.length ? (
          <div className="flex items-center gap-2">
            <span className="text-[12px] font-bold text-stone-400">Bekerja sebagai:</span>
            <Select
              className="!h-9 !w-auto !pr-8 text-[13px] font-bold"
              value={vendor?.id ?? ""}
              onChange={(e) => setVendorId(e.target.value)}
            >
              {scope.vendors.map((v) => (
                <option key={v.id} value={v.id}>
                  {v.business_name} ({v.status})
                </option>
              ))}
            </Select>
          </div>
        ) : undefined
      }
    >
      <FlashBanner flash={flash} />

      <div className="mb-5">
        <SubTabs<PartnerTab>
          value={tab}
          onChange={setTab}
          tabs={[
            { id: "dashboard", label: "Dashboard", icon: <LayoutDashboard className="h-4 w-4" /> },
            { id: "armada", label: "Armada", icon: <Car className="h-4 w-4" /> },
            { id: "trayek", label: "Trayek", icon: <Bus className="h-4 w-4" /> },
            { id: "pesanan", label: "Pesanan", icon: <ClipboardList className="h-4 w-4" /> },
            { id: "sopir", label: "Sopir", icon: <Users className="h-4 w-4" /> },
            { id: "wallet", label: "Wallet", icon: <Wallet className="h-4 w-4" /> },
          ]}
        />
      </div>

      {!scope ? (
        <EmptyState icon={<Building2 className="h-6 w-6" />} title="Belum ada vendor" desc="Jalankan seed.sql untuk membuat data vendor contoh." />
      ) : (
        <>
          {tab === "dashboard" && (
            <DashboardTab scope={scope} onGo={(t) => setTab(t)} onTicket={setTicketOrder} onFlash={show} reload={ds.reload} />
          )}
          {tab === "armada" && (
            <ArmadaTab scope={scope} onFlash={show} reload={ds.reload} />
          )}
          {tab === "trayek" && (
            <TrayekTab scope={scope} onFlash={show} reload={ds.reload} />
          )}
          {tab === "pesanan" && (
            <OrdersTab scope={scope} onTicket={setTicketOrder} onFlash={show} reload={ds.reload} />
          )}
          {tab === "sopir" && (
            <DriversTab scope={scope} onFlash={show} reload={ds.reload} />
          )}
          {tab === "wallet" && (
            <WalletTab scope={scope} onFlash={show} reload={ds.reload} />
          )}
        </>
      )}

      <Modal
        open={!!ticketOrder}
        onClose={() => setTicketOrder(null)}
        title="Detail Pesanan & e-Tiket"
        size="lg"
      >
        {ticketOrder && (
          <TicketView
            order={ticketOrder}
            vendorName={vendor?.business_name}
            vehicleName={
              scope?.allVehicles.find((v) => v.id === ticketOrder.vehicle_id)?.name
            }
            driverName={scope?.drivers.find((d) => d.id === ticketOrder.driver_id)?.name}
          />
        )}
      </Modal>
    </PortalPage>
  );
}

function ShellLoading() {
  return (
    <PortalPage kicker="Portal Partner" title="Dashboard Vendor Armada" icon={<Building2 className="h-6 w-6" />}>
      <PageLoader />
    </PortalPage>
  );
}

/* ============================================================== Dashboard */

function DashboardTab({
  scope,
  onGo,
  onTicket,
  onFlash,
  reload,
}: {
  scope: ScopeData;
  onGo: (t: PartnerTab) => void;
  onTicket: (o: Order) => void;
  onFlash: (k: "ok" | "err", m: string) => void;
  reload: () => void;
}) {
  const { vendor, vehicles, drivers, orders } = scope;
  const now = new Date();
  const monthPrefix = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`;

  const completed = orders.filter((o) => o.status === "Selesai");
  const omzetBulanIni = completed
    .filter((o) => o.created_at.startsWith(monthPrefix))
    .reduce((s, o) => s + o.total_price, 0);
  const netBulanIni = Math.floor(omzetBulanIni * 0.9);
  const activeOrders = orders.filter(
    (o) => o.status === "Perlu Konfirmasi" || o.status === "Sedang Berjalan"
  );
  const usedVehicleIds = new Set(
    orders
      .filter((o) => o.status === "Sedang Berjalan" && o.vehicle_id)
      .map((o) => o.vehicle_id as string)
  );
  const standby = vehicles.filter((v) => v.is_active && !usedVehicleIds.has(v.id)).length;
  const driverOnline = drivers.filter((d) => d.status === "Online").length;

  return (
    <div className="space-y-5">
      <div className="grid grid-cols-2 gap-3 sm:gap-4 lg:grid-cols-4">
        <StatTile label="Omzet bulan ini" value={rupiah(omzetBulanIni)} sub={`${completed.length} pesanan selesai`} icon={<CircleDollarSign className="h-5 w-5" />} tone="bg-brand-50 text-brand-600" />
        <StatTile label="Bersih (90%)" value={rupiah(netBulanIni)} sub="otomatis dari trigger escrow" icon={<Wallet className="h-5 w-5" />} tone="bg-leaf-50 text-leaf-600" />
        <StatTile label="Pesanan aktif" value={String(activeOrders.length)} sub={`${orders.filter((o) => o.status === "Perlu Konfirmasi").length} perlu konfirmasi`} icon={<ClipboardList className="h-5 w-5" />} tone="bg-amber-50 text-amber-600" />
        <StatTile label="Armada standby" value={String(standby)} sub={`${vehicles.length} total · ${driverOnline} sopir online`} icon={<Car className="h-5 w-5" />} tone="bg-sky-50 text-sky-600" />
      </div>

      <div className="grid gap-5 lg:grid-cols-[1fr_300px]">
        <CardSection title="Pesanan terbaru" desc="Perlu konfirmasi lebih dulu — lalu tandai selesai agar 90% masuk wallet.">
          {orders.length === 0 ? (
            <EmptyState icon={<ClipboardList className="h-5 w-5" />} title="Belum ada pesanan" desc="Pesanan dari Customer akan muncul di sini." />
          ) : (
            <div className="space-y-3">
              {orders.slice(0, 4).map((o) => (
                <OrderListRow key={o.id} order={o} vendorName={vendor.business_name} right={
                  <>
                    <button className="btn-ghost btn-sm" onClick={() => onTicket(o)}>Detail</button>
                    {o.status === "Perlu Konfirmasi" && (
                      <button className="btn-primary btn-sm" onClick={() => onGo("pesanan")}>Atur tugas →</button>
                    )}
                  </>
                } />
              ))}
              {orders.length > 4 && (
                <button className="btn-ghost btn-sm" onClick={() => onGo("pesanan")}>Lihat semua pesanan</button>
              )}
            </div>
          )}
        </CardSection>

        <div className="space-y-5">
          <CardSection title="Status armada">
            <div className="space-y-2.5">
              {vehicles.length === 0 && <p className="text-sm text-stone-400">Belum ada unit.</p>}
              {vehicles.slice(0, 4).map((v) => {
                const busy = usedVehicleIds.has(v.id);
                return (
                  <div key={v.id} className="flex items-center gap-3">
                    <VehicleImage src={v.image_url} alt={v.name} className="h-10 w-14 rounded-lg" iconSize="h-4 w-4" />
                    <div className="min-w-0 grow">
                      <p className="text-[13px] font-bold text-stone-700 truncate">{v.name}</p>
                      <p className="text-[11px] text-stone-400">{v.plate}</p>
                    </div>
                    <Badge tone={busy ? "info" : v.is_active ? "ok" : "muted"}>
                      {busy ? "Bertugas" : v.is_active ? "Standby" : "Nonaktif"}
                    </Badge>
                  </div>
                );
              })}
            </div>
            <button className="btn-soft btn-sm mt-4" onClick={() => onGo("armada")}>Kelola armada</button>
          </CardSection>

          <CardSection title="Wallet & payout">
            <div className="rounded-2xl bg-gradient-to-br from-lagoon-800 to-lagoon-600 p-4 text-white">
              <p className="text-[11px] font-bold uppercase tracking-widest text-lagoon-100">Saldo bersih tersedia</p>
              <p className="mt-1 text-2xl font-extrabold">{rupiah(vendor.wallet_balance)}</p>
              <p className="mt-1 text-[11.5px] text-lagoon-200">Terkredit otomatis dari pesanan selesai (90% — komisi platform 10%).</p>
            </div>
            <button className="btn-green btn-block mt-4" onClick={() => onGo("wallet")}>
              <Banknote className="h-4 w-4" /> Tarik dana ke rekening
            </button>
          </CardSection>
        </div>
      </div>
    </div>
  );
}

// tipe scope dipakai antar-tab
type Scope = ScopeData;

function StatTile({
  label,
  value,
  sub,
  icon,
  tone,
}: {
  label: string;
  value: string;
  sub?: string;
  icon: React.ReactNode;
  tone: string;
}) {
  return (
    <div className="card p-4 animate-rise">
      <div className="flex items-center gap-2 text-[11px] font-extrabold uppercase tracking-wider text-stone-400">
        <span className={cn("grid h-7 w-7 place-items-center rounded-lg", tone)}>{icon}</span>
        {label}
      </div>
      <p className="mt-2 text-xl sm:text-[22px] font-extrabold tracking-tight text-lagoon-900 truncate">{value}</p>
      {sub && <p className="mt-0.5 text-[11.5px] text-stone-400 truncate">{sub}</p>}
    </div>
  );
}

/* ================================================================ Armada */

function ArmadaTab({
  scope,
  onFlash,
  reload,
}: {
  scope: Scope;
  onFlash: (k: "ok" | "err", m: string) => void;
  reload: () => void;
}) {
  const [adding, setAdding] = useState(false);
  return (
    <CardSection
      title={`Unit armada (${scope.vehicles.length})`}
      desc="Tambahkan unit, kelola harga, atau nonaktifkan sementara."
      action={
        <button className="btn-primary btn-sm" onClick={() => setAdding(true)}>
          <Plus className="h-4 w-4" /> Tambah Unit
        </button>
      }
    >
      {scope.vehicles.length === 0 ? (
        <EmptyState icon={<Car className="h-6 w-6" />} title="Belum ada unit armada" desc="Tambahkan unit pertama Anda.">
          <button className="btn-primary btn-sm" onClick={() => setAdding(true)}>Tambah Unit</button>
        </EmptyState>
      ) : (
        <div className="space-y-3">
          {scope.vehicles.map((v) => (
            <VehicleRow key={v.id} v={v} scope={scope} onFlash={onFlash} reload={reload} />
          ))}
        </div>
      )}
      {adding && <AddVehicleModal scope={scope} onClose={() => setAdding(false)} onFlash={onFlash} reload={reload} />}
    </CardSection>
  );
}

function VehicleRow({
  v,
  scope,
  onFlash,
  reload,
}: {
  v: Vehicle;
  scope: Scope;
  onFlash: (k: "ok" | "err", m: string) => void;
  reload: () => void;
}) {
  const [busy, setBusy] = useState(false);
  const [armDel, setArmDel] = useState(false);

  const toggle = async (val: boolean) => {
    setBusy(true);
    try {
      await updateVehicle(v.id, { is_active: val });
      onFlash("ok", val ? `${v.name} diaktifkan kembali.` : `${v.name} dinonaktifkan (tidak muncul di katalog).`);
      reload();
    } catch (e) {
      onFlash("err", e instanceof Error ? e.message : String(e));
    } finally {
      setBusy(false);
    }
  };

  const remove = async () => {
    if (!armDel) {
      setArmDel(true);
      setTimeout(() => setArmDel(false), 3000);
      return;
    }
    setBusy(true);
    try {
      await deleteVehicle(v.id);
      onFlash("ok", "Unit dihapus dari armada.");
      reload();
    } catch (e) {
      onFlash("err", e instanceof Error ? e.message : String(e));
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="flex flex-wrap items-center gap-3 rounded-2xl border border-stone-100 bg-stone-50/60 p-3">
      <VehicleImage src={v.image_url} alt={v.name} className="h-14 w-20 rounded-xl" iconSize="h-5 w-5" />
      <div className="min-w-0 grow">
        <div className="flex flex-wrap items-center gap-2">
          <p className="font-extrabold text-stone-800 text-[14px]">{v.name}</p>
          <Badge tone="brand">{v.category}</Badge>
          {!v.is_active && <Badge tone="danger">Nonaktif</Badge>}
        </div>
        <p className="mt-0.5 flex flex-wrap items-center gap-x-3 gap-y-0.5 text-[12px] text-stone-400">
          <span className="font-mono">{v.plate}</span>
          <span>{v.seats} kursi · {v.luggage} bagasi · {v.transmission}</span>
          <span className="flex items-center gap-1"><MapPin className="h-3 w-3" />{v.cities.join(", ") || "—"}</span>
        </p>
      </div>
      <div className="flex items-center gap-3 text-right">
        <div className="text-[12px] leading-tight">
          <p className="font-extrabold text-lagoon-900">{rupiah(v.price_per_day)}<span className="text-stone-400">/hari</span></p>
          <p className="text-stone-400">sopir {rupiah(v.price_with_driver ?? v.price_per_day)}/hari</p>
        </div>
        <Toggle checked={v.is_active} onChange={toggle} onColor="bg-leaf-500" />
        <button
          className={cn("btn-sm", armDel ? "btn-danger" : "btn-ghost")}
          onClick={remove}
          disabled={busy}
        >
          <Trash2 className="h-3.5 w-3.5" /> {armDel ? "Yakin?" : "Hapus"}
        </button>
      </div>
    </div>
  );
}

function AddVehicleModal({
  scope,
  onClose,
  onFlash,
  reload,
}: {
  scope: Scope;
  onClose: () => void;
  onFlash: (k: "ok" | "err", m: string) => void;
  reload: () => void;
}) {
  const [form, setForm] = useState({
    name: "",
    category: "MPV" as Vehicle["category"],
    plate: "",
    seats: "7",
    luggage: "3",
    transmission: "Automatic" as Vehicle["transmission"],
    price_per_day: "",
    price_with_driver: "",
    allow_self_drive: true,
    cities: "",
  });
  const [file, setFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [busy, setBusy] = useState(false);

  const set = (k: keyof typeof form, val: string | boolean) => setForm((f) => ({ ...f, [k]: val }));

  const submit = async () => {
    const e: Record<string, string> = {};
    if (form.name.trim().length < 3) e.name = "Nama unit wajib diisi.";
    if (!form.plate.trim()) e.plate = "Nopol wajib diisi.";
    const price = Number(form.price_per_day);
    if (!price || price <= 0) e.price_per_day = "Harga sewa per hari wajib diisi.";
    setErrors(e);
    if (Object.keys(e).length) return;

    setBusy(true);
    try {
      let image_url: string | null = null;
      if (file) image_url = await uploadVehicleImage(file);
      const cities = form.cities.split(",").map((s) => s.trim()).filter(Boolean);
      const payload: NewVehicle = {
        vendor_id: scope.vendor.id,
        name: form.name.trim(),
        category: form.category,
        plate: form.plate.trim().toUpperCase(),
        seats: Math.max(1, Number(form.seats) || 5),
        luggage: Math.max(0, Number(form.luggage) || 0),
        transmission: form.transmission,
        price_per_day: price,
        price_with_driver: form.price_with_driver ? Number(form.price_with_driver) : null,
        allow_self_drive: form.allow_self_drive,
        image_url,
        cities: cities.length ? cities : [scope.vendor.city || "Jakarta"],
      };
      await insertVehicle(payload);
      onFlash("ok", `Unit ${payload.name} berhasil ditambahkan.`);
      reload();
      onClose();
    } catch (err) {
      onFlash("err", err instanceof Error ? err.message : String(err));
    } finally {
      setBusy(false);
    }
  };

  return (
    <Modal open onClose={onClose} title="Tambah Unit Armada" subtitle={`Milik ${scope.vendor.business_name}`} size="lg">
      <div className="grid gap-4 sm:grid-cols-2">
        <div className="sm:col-span-2">
          <Labeled label="Nama unit" error={errors.name}>
            <Input placeholder="cth: Toyota Avanza 1.3 G" value={form.name} onChange={(e) => set("name", e.target.value)} />
          </Labeled>
        </div>
        <Labeled label="Kategori">
          <Select value={form.category} onChange={(e) => set("category", e.target.value)}>
            {VEHICLE_CATEGORIES.map((c) => <option key={c}>{c}</option>)}
          </Select>
        </Labeled>
        <Labeled label="Nomor polisi" error={errors.plate}>
          <Input placeholder="cth: B 1234 ABC" value={form.plate} onChange={(e) => set("plate", e.target.value)} />
        </Labeled>
        <Labeled label="Kursi">
          <Input type="number" min={1} value={form.seats} onChange={(e) => set("seats", e.target.value)} />
        </Labeled>
        <Labeled label="Kapasitas bagasi">
          <Input type="number" min={0} value={form.luggage} onChange={(e) => set("luggage", e.target.value)} />
        </Labeled>
        <Labeled label="Transmisi">
          <Select value={form.transmission} onChange={(e) => set("transmission", e.target.value)}>
            {TRANSMISSIONS.map((t) => <option key={t}>{t}</option>)}
          </Select>
        </Labeled>
        <Labeled label="Harga sewa / hari (lepas kunci)">
          <Input type="number" min={0} placeholder="400000" value={form.price_per_day} onChange={(e) => set("price_per_day", e.target.value)} />
        </Labeled>
        <Labeled label="Harga dengan sopir / hari" hint="Kosongkan jika tidak disewakan dengan sopir.">
          <Input type="number" min={0} placeholder="550000" value={form.price_with_driver} onChange={(e) => set("price_with_driver", e.target.value)} />
        </Labeled>
        <div className="flex items-center justify-between rounded-xl bg-stone-50 px-3.5 py-2.5">
          <span className="text-sm font-semibold text-stone-600 flex items-center gap-2"><PencilLine className="h-4 w-4 text-brand-500" /> Izinkan lepas kunci</span>
          <Toggle checked={form.allow_self_drive} onChange={(v) => set("allow_self_drive", v)} />
        </div>
        <Labeled label="Kota layanan" hint="Pisahkan dengan koma. Dipakai filter katalog Customer.">
          <Input placeholder="Jakarta, Bogor, Depok" value={form.cities} onChange={(e) => set("cities", e.target.value)} />
        </Labeled>
        <div className="sm:col-span-2">
          <Labeled label="Foto unit" hint="JPG/PNG/WebP maks 15MB — disimpan di Supabase Storage (bucket vehicle-photos).">
            <label className="flex cursor-pointer items-center gap-3 rounded-2xl border-2 border-dashed border-stone-200 p-3 hover:border-brand-300 transition">
              {preview ? (
                <img src={preview} alt="preview" className="h-14 w-20 rounded-xl object-cover" />
              ) : (
                <span className="grid h-14 w-20 place-items-center rounded-xl bg-stone-100 text-stone-400">
                  <Truck className="h-5 w-5" />
                </span>
              )}
              <span className="text-[13px] text-stone-500">
                {file ? file.name : "Klik untuk pilih file gambar"}
              </span>
              <input
                type="file"
                accept="image/*"
                className="hidden"
                onChange={(e) => {
                  const f = e.target.files?.[0] ?? null;
                  setFile(f);
                  setPreview(f ? URL.createObjectURL(f) : null);
                }}
              />
            </label>
          </Labeled>
        </div>
      </div>
      <div className="mt-5 flex flex-col-reverse sm:flex-row justify-end gap-2">
        <button className="btn-ghost" onClick={onClose}>Batal</button>
        <button className="btn-primary" onClick={submit} disabled={busy}>
          {busy ? "Menyimpan…" : "Simpan Unit"}
        </button>
      </div>
    </Modal>
  );
}

/* ================================================================ Trayek */

function TrayekTab({
  scope,
  onFlash,
  reload,
}: {
  scope: Scope;
  onFlash: (k: "ok" | "err", m: string) => void;
  reload: () => void;
}) {
  const [adding, setAdding] = useState(false);
  const [form, setForm] = useState({ origin: "", destination: "", fleet_type: "Hiace Premio", price_per_seat: "", departures: "06:00,09:00,14:00" });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [busy, setBusy] = useState(false);

  const submit = async () => {
    const e: Record<string, string> = {};
    if (form.origin.trim().length < 2) e.origin = "Kota asal wajib diisi.";
    if (form.destination.trim().length < 2) e.destination = "Kota tujuan wajib diisi.";
    const price = Number(form.price_per_seat);
    if (!price || price <= 0) e.price = "Harga per kursi wajib diisi.";
    const deps = form.departures.split(",").map((s) => s.trim()).filter((s) => /^\d{2}:\d{2}$/.test(s));
    if (!deps.length) e.departures = "Minimal satu jadwal jam (HH:MM, pisahkan koma).";
    setErrors(e);
    if (Object.keys(e).length) return;

    setBusy(true);
    try {
      await insertRoute({
        vendor_id: scope.vendor.id,
        origin: form.origin.trim(),
        destination: form.destination.trim(),
        fleet_type: form.fleet_type.trim() || "Hiace Premio",
        price_per_seat: price,
        departures: deps,
      });
      onFlash("ok", "Trayek baru didaftarkan dan langsung tampil di katalog Customer.");
      setForm({ origin: "", destination: "", fleet_type: "Hiace Premio", price_per_seat: "", departures: "06:00,09:00,14:00" });
      setAdding(false);
      reload();
    } catch (err) {
      onFlash("err", err instanceof Error ? err.message : String(err));
    } finally {
      setBusy(false);
    }
  };

  return (
    <CardSection
      title={`Trayek travel (${scope.routes.length})`}
      desc="Rute shuttle antarkota yang dijual di Portal Customer."
      action={
        <button className="btn-primary btn-sm" onClick={() => setAdding(true)}>
          <Plus className="h-4 w-4" /> Daftarkan Trayek
        </button>
      }
    >
      {scope.routes.length === 0 ? (
        <EmptyState icon={<Bus className="h-6 w-6" />} title="Belum ada trayek" desc="Daftarkan trayek agar kursi bisa dijual." />
      ) : (
        <div className="space-y-3">
          {scope.routes.map((r) => (
            <RouteManageRow key={r.id} r={r} onFlash={onFlash} reload={reload} />
          ))}
        </div>
      )}

      {adding && (
        <Modal open onClose={() => setAdding(false)} title="Daftarkan Trayek Baru" size="md">
          <div className="grid gap-4 sm:grid-cols-2">
            <Labeled label="Kota asal" error={errors.origin}>
              <Input placeholder="cth: Jakarta" value={form.origin} onChange={(e) => setForm({ ...form, origin: e.target.value })} />
            </Labeled>
            <Labeled label="Kota tujuan" error={errors.destination}>
              <Input placeholder="cth: Bandung" value={form.destination} onChange={(e) => setForm({ ...form, destination: e.target.value })} />
            </Labeled>
            <Labeled label="Jenis armada">
              <Input placeholder="cth: Hiace Premio" value={form.fleet_type} onChange={(e) => setForm({ ...form, fleet_type: e.target.value })} />
            </Labeled>
            <Labeled label="Harga per kursi" error={errors.price}>
              <Input type="number" placeholder="150000" value={form.price_per_seat} onChange={(e) => setForm({ ...form, price_per_seat: e.target.value })} />
            </Labeled>
            <div className="sm:col-span-2">
              <Labeled label="Jadwal keberangkatan" error={errors.departures} hint="Format 24 jam, pisahkan koma: 06:00,09:00,14:00">
                <Input placeholder="06:00,09:00,14:00" value={form.departures} onChange={(e) => setForm({ ...form, departures: e.target.value })} />
              </Labeled>
            </div>
          </div>
          <div className="mt-5 flex justify-end gap-2">
            <button className="btn-ghost" onClick={() => setAdding(false)}>Batal</button>
            <button className="btn-primary" onClick={submit} disabled={busy}>{busy ? "Menyimpan…" : "Simpan Trayek"}</button>
          </div>
        </Modal>
      )}
    </CardSection>
  );
}

function RouteManageRow({
  r,
  onFlash,
  reload,
}: {
  r: Route;
  onFlash: (k: "ok" | "err", m: string) => void;
  reload: () => void;
}) {
  const [busy, setBusy] = useState(false);
  const toggle = async (val: boolean) => {
    setBusy(true);
    try {
      await setRouteActive(r.id, val);
      onFlash("ok", val ? "Trayek diaktifkan." : "Trayek dinonaktifkan.");
      reload();
    } catch (e) {
      onFlash("err", e instanceof Error ? e.message : String(e));
    } finally {
      setBusy(false);
    }
  };
  return (
    <div className="flex flex-wrap items-center gap-3 rounded-2xl border border-stone-100 bg-stone-50/60 p-3.5">
      <span className="grid h-10 w-10 place-items-center rounded-xl bg-gradient-to-br from-leaf-100 to-leaf-50 text-leaf-600">
        <Bus className="h-5 w-5" />
      </span>
      <div className="min-w-0 grow">
        <p className="font-extrabold text-stone-800 text-[14px]">{r.origin} → {r.destination}</p>
        <div className="mt-1 flex flex-wrap gap-1.5">
          {r.departures.map((d) => (
            <span key={d} className="rounded-md bg-white px-1.5 py-0.5 font-mono text-[11px] font-bold text-lagoon-700 ring-1 ring-lagoon-100">{d}</span>
          ))}
        </div>
      </div>
      <div className="text-right text-[12px]">
        <p className="font-extrabold text-lagoon-900">{rupiah(r.price_per_seat)}<span className="text-stone-400">/kursi</span></p>
        <p className="text-stone-400">{r.fleet_type}</p>
      </div>
      <Toggle checked={r.is_active} onChange={toggle} onColor="bg-leaf-500" disabled={busy} />
    </div>
  );
}

/* =============================================================== Pesanan */

function OrdersTab({
  scope,
  onTicket,
  onFlash,
  reload,
}: {
  scope: Scope;
  onTicket: (o: Order) => void;
  onFlash: (k: "ok" | "err", m: string) => void;
  reload: () => void;
}) {
  const orderOf = (s: Order["status"]) => scope.orders.filter((o) => o.status === s);
  const need = orderOf("Perlu Konfirmasi");
  const running = orderOf("Sedang Berjalan");
  const rest = scope.orders.filter((o) => o.status === "Selesai" || o.status === "Dibatalkan");

  return (
    <div className="space-y-5">
      <CardSection title="Perlu konfirmasi" desc="Tetapkan sopir & konfirmasi agar perjalanan berjalan.">
        {need.length === 0 ? (
          <p className="text-sm text-stone-400">Tidak ada pesanan menunggu konfirmasi. 🎉</p>
        ) : (
          <div className="space-y-3">
            {need.map((o) => (
              <OrderActionRow key={o.id} o={o} scope={scope} onTicket={onTicket} onFlash={onFlash} reload={reload} />
            ))}
          </div>
        )}
      </CardSection>

      <CardSection title="Sedang berjalan" desc="Tandai selesai saat tugas selesai — 90% otomatis masuk wallet.">
        {running.length === 0 ? (
          <p className="text-sm text-stone-400">Tidak ada perjalanan aktif.</p>
        ) : (
          <div className="space-y-3">
            {running.map((o) => (
              <OrderActionRow key={o.id} o={o} scope={scope} onTicket={onTicket} onFlash={onFlash} reload={reload} />
            ))}
          </div>
        )}
      </CardSection>

      {rest.length > 0 && (
        <CardSection title="Riwayat selesai / dibatalkan">
          <div className="space-y-3">
            {rest.slice(0, 10).map((o) => (
              <OrderListRow key={o.id} order={o} vendorName={scope.vendor.business_name} right={<button className="btn-ghost btn-sm" onClick={() => onTicket(o)}>Detail</button>} />
            ))}
          </div>
        </CardSection>
      )}
    </div>
  );
}

function OrderActionRow({
  o,
  scope,
  onTicket,
  onFlash,
  reload,
}: {
  o: Order;
  scope: Scope;
  onTicket: (o: Order) => void;
  onFlash: (k: "ok" | "err", m: string) => void;
  reload: () => void;
}) {
  const [driverId, setDriverId] = useState(o.driver_id ?? "");
  const [busy, setBusy] = useState(false);
  const [doneArmed, setDoneArmed] = useState(false);
  const [cancelArmed, setCancelArmed] = useState(false);
  const assignable = scope.drivers.filter((d) => d.status === "Online" || d.id === o.driver_id);

  const confirm = async () => {
    if (!driverId) {
      onFlash("err", "Pilih sopir dulu sebelum mengonfirmasi pesanan.");
      return;
    }
    setBusy(true);
    try {
      await updateOrder(o.id, { driver_id: driverId, status: "Sedang Berjalan" });
      onFlash("ok", `${o.order_code} dikonfirmasi & ditugaskan.`);
      reload();
    } catch (e) {
      onFlash("err", e instanceof Error ? e.message : String(e));
    } finally {
      setBusy(false);
    }
  };

  const complete = async () => {
    if (!doneArmed) {
      setDoneArmed(true);
      setTimeout(() => setDoneArmed(false), 3500);
      return;
    }
    setBusy(true);
    try {
      await updateOrder(o.id, { status: "Selesai" });
      onFlash("ok", "Perjalanan selesai — 90% nilai pesanan masuk saldo vendor (escrow).");
      reload();
    } catch (e) {
      onFlash("err", e instanceof Error ? e.message : String(e));
    } finally {
      setBusy(false);
    }
  };

  const cancel = async () => {
    if (!cancelArmed) {
      setCancelArmed(true);
      setTimeout(() => setCancelArmed(false), 3500);
      return;
    }
    setBusy(true);
    try {
      await updateOrder(o.id, { status: "Dibatalkan" });
      onFlash("ok", "Pesanan dibatalkan.");
      reload();
    } catch (e) {
      onFlash("err", e instanceof Error ? e.message : String(e));
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="card p-4">
      <div className="flex flex-wrap gap-3">
        <div className="min-w-0 grow">
          <div className="flex flex-wrap items-center gap-2">
            <span className="font-mono text-[11px] font-bold text-stone-400">{o.order_code}</span>
            <Badge tone={orderTone(o.status)}>{o.status}</Badge>
          </div>
          <p className="font-bold text-stone-800 mt-0.5">{o.title}</p>
          <p className="text-[12.5px] text-stone-500 mt-1">{o.customer_name} · {formatDateTime(o.created_at)}</p>
        </div>
        <p className="font-extrabold text-lagoon-900 text-lg">{rupiah(o.total_price)}</p>
      </div>

      <div className="mt-3 flex flex-wrap items-center gap-2 border-t border-stone-100 pt-3">
        {o.status === "Perlu Konfirmasi" && (
          <>
            <div className="flex items-center gap-2">
              <UserRound className="h-4 w-4 text-stone-400" />
              <Select className="!h-9 !w-auto !text-[13px]" value={driverId} onChange={(e) => setDriverId(e.target.value)}>
                <option value="">Pilih sopir…</option>
                {assignable.map((d) => (
                  <option key={d.id} value={d.id}>{d.name} ({d.status})</option>
                ))}
              </Select>
            </div>
            <button className="btn-soft btn-sm" onClick={() => onTicket(o)}>Detail</button>
            <button className="btn-danger btn-sm ml-auto" onClick={cancel} disabled={busy}>{cancelArmed ? "Yakin batalkan?" : "Batalkan"}</button>
            <button className="btn-primary btn-sm" onClick={confirm} disabled={busy}>{busy ? "Memproses…" : "Konfirmasi & Tugaskan"}</button>
          </>
        )}
        {o.status === "Sedang Berjalan" && (
          <>
            <span className="text-[12.5px] text-stone-500">
              Sopir: <b>{scope.drivers.find((d) => d.id === o.driver_id)?.name ?? "Belum ditugaskan"}</b>
            </span>
            <button className="btn-ghost btn-sm" onClick={() => onTicket(o)}>Detail</button>
            <button className="btn-green btn-sm ml-auto" onClick={complete} disabled={busy}>
              {doneArmed ? "Yakin selesai? (90% → wallet)" : "Tandai Selesai"}
            </button>
          </>
        )}
      </div>
    </div>
  );
}

/* ================================================================ Sopir */

function DriversTab({
  scope,
  onFlash,
  reload,
}: {
  scope: Scope;
  onFlash: (k: "ok" | "err", m: string) => void;
  reload: () => void;
}) {
  const [adding, setAdding] = useState(false);
  const [form, setForm] = useState({ name: "", phone: "" });
  const [errs, setErrs] = useState<Record<string, string>>({});
  const [busy, setBusy] = useState(false);

  const add = async () => {
    const e: Record<string, string> = {};
    if (form.name.trim().length < 3) e.name = "Nama sopir wajib diisi.";
    if (form.phone.replace(/\D/g, "").length < 8) e.phone = "Nomor HP tidak valid.";
    setErrs(e);
    if (Object.keys(e).length) return;
    setBusy(true);
    try {
      await insertDriver({ vendor_id: scope.vendor.id, name: form.name.trim(), phone: form.phone.trim() });
      onFlash("ok", "Sopir baru ditambahkan.");
      setForm({ name: "", phone: "" });
      setAdding(false);
      reload();
    } catch (err) {
      onFlash("err", err instanceof Error ? err.message : String(err));
    } finally {
      setBusy(false);
    }
  };

  return (
    <CardSection
      title={`Sopir terdaftar (${scope.drivers.length})`}
      desc="Sopir login ke aplikasi Driver untuk menerima tugas via mode Online."
      action={
        <button className="btn-primary btn-sm" onClick={() => setAdding(true)}>
          <Plus className="h-4 w-4" /> Tambah Sopir
        </button>
      }
    >
      {scope.drivers.length === 0 ? (
        <EmptyState icon={<Users className="h-6 w-6" />} title="Belum ada sopir" desc="Tambahkan sopir agar bisa ditugaskan ke pesanan." />
      ) : (
        <div className="grid gap-3 sm:grid-cols-2">
          {scope.drivers.map((d) => (
            <DriverRow key={d.id} d={d} onFlash={onFlash} reload={reload} />
          ))}
        </div>
      )}

      {adding && (
        <Modal open onClose={() => setAdding(false)} title="Tambah Sopir" size="sm">
          <div className="space-y-4">
            <Labeled label="Nama lengkap" error={errs.name}>
              <Input placeholder="cth: Budi Santoso" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
            </Labeled>
            <Labeled label="No. WhatsApp" error={errs.phone}>
              <Input placeholder="08xxxxxxxxxx" value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} />
            </Labeled>
            <div className="flex justify-end gap-2 pt-1">
              <button className="btn-ghost" onClick={() => setAdding(false)}>Batal</button>
              <button className="btn-primary" onClick={add} disabled={busy}>{busy ? "Menyimpan…" : "Simpan Sopir"}</button>
            </div>
          </div>
        </Modal>
      )}
    </CardSection>
  );
}

function DriverRow({
  d,
  onFlash,
  reload,
}: {
  d: Driver;
  onFlash: (k: "ok" | "err", m: string) => void;
  reload: () => void;
}) {
  const [busy, setBusy] = useState(false);
  const statuses: Driver["status"][] = ["Online", "Istirahat", "Offline"];
  const setSt = async (s: Driver["status"]) => {
    setBusy(true);
    try {
      await setDriverStatus(d.id, s);
      onFlash("ok", `Status ${d.name} → ${s}.`);
      reload();
    } catch (e) {
      onFlash("err", e instanceof Error ? e.message : String(e));
    } finally {
      setBusy(false);
    }
  };
  const initials = d.name.split(" ").map((p) => p[0]).slice(0, 2).join("").toUpperCase();
  return (
    <div className="flex items-center gap-3 rounded-2xl border border-stone-100 bg-stone-50/60 p-3.5">
      <span className="avatar h-11 w-11 text-[14px]">{initials}</span>
      <div className="min-w-0 grow">
        <p className="font-extrabold text-stone-800">{d.name}</p>
        <p className="text-[12px] text-stone-400">{d.phone || "—"}</p>
      </div>
      <div className="flex items-center gap-2">
        <Badge tone={driverTone(d.status)}>{d.status}</Badge>
        <Select className="!h-8 !w-auto !text-[12px]" value={d.status} onChange={(e) => setSt(e.target.value as Driver["status"])} disabled={busy}>
          {statuses.map((s) => <option key={s}>{s}</option>)}
        </Select>
      </div>
    </div>
  );
}

/* ================================================================ Wallet */

function WalletTab({
  scope,
  onFlash,
  reload,
}: {
  scope: Scope;
  onFlash: (k: "ok" | "err", m: string) => void;
  reload: () => void;
}) {
  const { vendor } = scope;
  const [requesting, setRequesting] = useState(false);
  const [form, setForm] = useState({ amount: "", bank_name: "BCA", account_number: "", account_name: "" });
  const [errs, setErrs] = useState<Record<string, string>>({});
  const [busy, setBusy] = useState(false);

  const request = async () => {
    const amount = Number(form.amount);
    const e: Record<string, string> = {};
    if (!amount || amount <= 0) e.amount = "Nominal wajib diisi.";
    else if (amount > vendor.wallet_balance) e.amount = `Maksimal ${rupiah(vendor.wallet_balance)} (saldo tersedia).`;
    if (form.account_number.replace(/\D/g, "").length < 6) e.account_number = "No. rekening tidak valid.";
    if (form.account_name.trim().length < 3) e.account_name = "Nama pemilik rekening wajib diisi.";
    setErrs(e);
    if (Object.keys(e).length) return;
    setBusy(true);
    try {
      await insertPayout({
        vendor_id: vendor.id,
        amount,
        bank_name: form.bank_name.trim(),
        account_number: form.account_number.trim(),
        account_name: form.account_name.trim(),
      });
      onFlash("ok", "Permintaan payout dikirim — menunggu proses Admin HQ.");
      setRequesting(false);
      setForm({ amount: "", bank_name: "BCA", account_number: "", account_name: "" });
      reload();
    } catch (err) {
      onFlash("err", err instanceof Error ? err.message : String(err));
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="grid gap-5 lg:grid-cols-[1fr_360px] items-start">
      <div className="space-y-5">
        <div className="rounded-3xl bg-gradient-to-br from-lagoon-800 via-lagoon-700 to-leaf-600 p-6 text-white shadow-card-lg">
          <p className="flex items-center gap-2 text-[12px] font-extrabold uppercase tracking-widest text-lagoon-100">
            <Wallet className="h-4 w-4" /> Saldo bersih (90%)
          </p>
          <p className="mt-2 text-4xl font-extrabold tracking-tight">{rupiah(vendor.wallet_balance)}</p>
          <p className="mt-2 text-[12.5px] text-lagoon-100/90 leading-relaxed">
            Setiap pesanan selesai → trigger escrow mengkredit 90% ke wallet ini; komisi platform 10%
            dihitung dari total transaksi. Payout diproses Admin HQ.
          </p>
          <div className="mt-4 flex flex-wrap gap-2">
            <button className="btn bg-white text-lagoon-800 hover:bg-lagoon-50" onClick={() => setRequesting(true)}>
              <Banknote className="h-4 w-4" /> Ajukan Penarikan
            </button>
          </div>
        </div>

        <CardSection title="Riwayat payout">
          {scope.payouts.length === 0 ? (
            <EmptyState icon={<Banknote className="h-6 w-6" />} title="Belum ada payout" desc="Ajukan penarikan saldo ke rekening bank Anda." />
          ) : (
            <div className="space-y-3">
              {scope.payouts.map((p) => (
                <PayoutRow key={p.id} p={p} />
              ))}
            </div>
          )}
        </CardSection>
      </div>

      <CardSection title="Ringkasan pesanan" desc="Basis perhitungan escrow.">
        <div className="space-y-2.5 text-sm">
          {(
            [
              ["Total transaksi (semua status)", scope.orders.reduce((s, o) => s + o.total_price, 0)],
              ["Transaksi selesai", scope.orders.filter((o) => o.status === "Selesai").reduce((s, o) => s + o.total_price, 0)],
              ["Komisi platform (10%)", Math.floor(scope.orders.filter((o) => o.status === "Selesai").reduce((s, o) => s + o.total_price, 0) * 0.1)],
              ["Dana escrow berjalan", scope.orders.filter((o) => o.status === "Perlu Konfirmasi" || o.status === "Sedang Berjalan").reduce((s, o) => s + o.total_price, 0)],
            ] as [string, number][]
          ).map(([l, v]) => (
            <div key={l} className="flex justify-between gap-3">
              <span className="text-stone-500">{l}</span>
              <b className="text-stone-800">{rupiah(v)}</b>
            </div>
          ))}
          <p className="border-t border-stone-100 pt-2 text-[11.5px] text-stone-400">
            Angka dihitung langsung dari tabel <code className="font-mono">orders</code> (Supabase), bukan perkiraan.
          </p>
        </div>
      </CardSection>

      {requesting && (
        <Modal open onClose={() => setRequesting(false)} title="Ajukan Penarikan Dana" subtitle={`Saldo tersedia ${rupiah(vendor.wallet_balance)}`} size="sm">
          <div className="space-y-4">
            <Labeled label="Nominal (IDR)" error={errs.amount}>
              <Input type="number" min={10000} placeholder="500000" value={form.amount} onChange={(e) => setForm({ ...form, amount: e.target.value })} />
            </Labeled>
            <div className="grid grid-cols-[110px_1fr] gap-2">
              <Labeled label="Bank">
                <Select value={form.bank_name} onChange={(e) => setForm({ ...form, bank_name: e.target.value })}>
                  {["BCA", "Mandiri", "BNI", "BRI", "BSI", "Permata", "Jenius", "GoPay", "OVO"].map((b) => <option key={b}>{b}</option>)}
                </Select>
              </Labeled>
              <Labeled label="No. rekening" error={errs.account_number}>
                <Input placeholder="1234567890" value={form.account_number} onChange={(e) => setForm({ ...form, account_number: e.target.value })} />
              </Labeled>
            </div>
            <Labeled label="Nama pemilik rekening" error={errs.account_name}>
              <Input placeholder="Sesuai rekening" value={form.account_name} onChange={(e) => setForm({ ...form, account_name: e.target.value })} />
            </Labeled>
            <button className="btn-primary btn-block" onClick={request} disabled={busy}>
              {busy ? "Mengirim…" : `Ajukan ${form.amount ? rupiah(Number(form.amount)) : "Payout"}`}
            </button>
          </div>
        </Modal>
      )}
    </div>
  );
}

function PayoutRow({ p }: { p: Payout }) {
  const tone = p.status === "Selesai" ? "ok" : p.status === "Ditolak" ? "danger" : p.status === "Diproses" ? "info" : "warn";
  return (
    <div className="flex flex-wrap items-center gap-3 rounded-2xl border border-stone-100 bg-stone-50/60 p-3.5">
      <span className="grid h-10 w-10 place-items-center rounded-xl bg-brand-50 text-brand-600">
        <Banknote className="h-5 w-5" />
      </span>
      <div className="min-w-0 grow">
        <p className="font-extrabold text-stone-800">{rupiah(p.amount)}</p>
        <p className="text-[12px] text-stone-400">{p.bank_name} · {p.account_number} · {p.account_name}</p>
      </div>
      <div className="text-right">
        <Badge tone={tone as "ok" | "danger" | "info" | "warn"}>{p.status}</Badge>
        <p className="text-[10.5px] text-stone-400 mt-1">{formatDateTime(p.created_at)}</p>
      </div>
    </div>
  );
}
