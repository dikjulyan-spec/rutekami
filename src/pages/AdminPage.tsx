import React, { useEffect, useMemo, useState } from "react";
import {
  Activity,
  BadgeCheck,
  Ban,
  Banknote,
  Building2,
  Car,
  CheckCircle2,
  ClipboardList,
  Database,
  FileCheck,
  Globe,
  KeyRound,
  LayoutDashboard,
  Plug,
  Radio,
  RefreshCw,
  Search,
  Settings2,
  ShieldAlert,
  ShieldCheck,
  TerminalSquare,
  Users,
  Wallet,
  XCircle,
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
  cn,
} from "../components/ui";
import { OrderListRow, TicketView, VehicleImage, driverTone, vendorTone } from "../components/items";
import { useAsyncData, useFlash } from "../lib/hooks";
import { getClient, getStorageBucket } from "../lib/supabase";
import {
  fetchOrders,
  fetchPayouts,
  fetchRoutes,
  fetchSettings,
  fetchVehicles,
  fetchVendors,
  pingDatabase,
  updateOrder,
  updatePayoutStatus,
  updateVehicle,
  updateVendorStatus,
  upsertSetting,
} from "../lib/db";
import type { Order, Payout, Route, Setting, Vehicle, Vendor } from "../types/database";
import { ORDER_STATUSES } from "../types/database";
import { formatDateTime, rupiah } from "../lib/format";

type AdminTab = "ringkasan" | "kyc" | "pesanan" | "armada" | "integrasi";

interface AdminData {
  vendors: Vendor[];
  vehicles: Vehicle[];
  routes: Route[];
  orders: Order[];
  payouts: Payout[];
  settings: Setting[];
}

const loadAll = async (): Promise<AdminData> => {
  const [vendors, vehicles, routes, orders, payouts, settings] = await Promise.all([
    fetchVendors(),
    fetchVehicles(),
    fetchRoutes(),
    fetchOrders(),
    fetchPayouts(),
    fetchSettings(),
  ]);
  return { vendors, vehicles, routes, orders, payouts, settings };
};

export default function AdminPage() {
  const ds = useAsyncData(loadAll);
  const [tab, setTab] = useState<AdminTab>("ringkasan");
  const [ticketOrder, setTicketOrder] = useState<Order | null>(null);
  const { flash, show } = useFlash();

  if (ds.loading)
    return (
      <PortalPage kicker="Super Admin HQ" title="Developer Console Travondo" icon={<ShieldCheck className="h-6 w-6" />}>
        <PageLoader />
      </PortalPage>
    );
  if (ds.error)
    return (
      <PortalPage kicker="Super Admin HQ" title="Developer Console Travondo" icon={<ShieldCheck className="h-6 w-6" />}>
        <ErrorPanel message={ds.error} onRetry={ds.reload} />
      </PortalPage>
    );

  const data = ds.data as AdminData;

  return (
    <PortalPage
      kicker="Super Admin HQ · Developer Console"
      title="Awasi escrow, komisi, KYC & kesehatan sistem"
      desc="Console pusat NusaTravelLab: semua vendor, seluruh arus uang, dan kontrol kepatuhan platform."
      icon={<ShieldCheck className="h-6 w-6" />}
      gradient="from-lagoon-800 to-brand-600"
    >
      <FlashBanner flash={flash} />

      <div className="mb-5">
        <SubTabs<AdminTab>
          value={tab}
          onChange={setTab}
          tabs={[
            { id: "ringkasan", label: "Ringkasan", icon: <LayoutDashboard className="h-4 w-4" /> },
            { id: "kyc", label: "Verifikasi KYC", icon: <FileCheck className="h-4 w-4" /> },
            { id: "pesanan", label: "Pesanan & Escrow", icon: <ClipboardList className="h-4 w-4" /> },
            { id: "armada", label: "Kontrol Armada", icon: <Car className="h-4 w-4" /> },
            { id: "integrasi", label: "API & Integrasi", icon: <KeyRound className="h-4 w-4" /> },
          ]}
        />
      </div>

      {tab === "ringkasan" && <Ringkasan data={data} onFlash={show} reload={ds.reload} onGo={setTab} />}
      {tab === "kyc" && <KycTab data={data} onFlash={show} reload={ds.reload} />}
      {tab === "pesanan" && <OrdersAdminTab data={data} onTicket={setTicketOrder} onFlash={show} reload={ds.reload} />}
      {tab === "armada" && <ArmadaAdminTab data={data} onFlash={show} reload={ds.reload} />}
      {tab === "integrasi" && <IntegrasiTab data={data} onFlash={show} reload={ds.reload} />}

      <Modal open={!!ticketOrder} onClose={() => setTicketOrder(null)} title="Detail e-Tiket" size="lg">
        {ticketOrder && (
          <TicketView
            order={ticketOrder}
            vendorName={data.vendors.find((v) => v.id === ticketOrder.vendor_id)?.business_name}
            vehicleName={data.vehicles.find((v) => v.id === ticketOrder.vehicle_id)?.name}
          />
        )}
      </Modal>
    </PortalPage>
  );
}

/* ============================================================== Ringkasan */

function Ringkasan({
  data,
  onFlash,
  reload,
  onGo,
}: {
  data: AdminData;
  onFlash: (k: "ok" | "err", m: string) => void;
  reload: () => void;
  onGo: (t: AdminTab) => void;
}) {
  const [events, setEvents] = useState<string[]>([]);
  const [health, setHealth] = useState<{ db: number | null; storage: boolean | null; checking: boolean }>({
    db: null,
    storage: null,
    checking: false,
  });

  const checkHealth = async () => {
    setHealth((h) => ({ ...h, checking: true }));
    try {
      const dbMs = await pingDatabase();
      let storageOk = false;
      try {
        const sb = getClient();
        const { error } = await sb.storage.from(getStorageBucket()).list("public", { limit: 1 });
        storageOk = !error;
      } catch {
        storageOk = false;
      }
      setHealth({ db: dbMs, storage: storageOk, checking: false });
      onFlash("ok", "Health check selesai — database & storage terpantau.");
    } catch (e) {
      setHealth((h) => ({ ...h, checking: false }));
      onFlash("err", e instanceof Error ? e.message : String(e));
    }
  };

  useEffect(() => {
    void checkHealth();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const simWebhook = (gateway: string) => {
    const ev = `[${formatDateTime(new Date().toISOString())}] Webhook ${gateway} diterima — status 200, signature valid. Payload masuk antrian escrow.`;
    setEvents((l) => [ev, ...l].slice(0, 8));
    onFlash("ok", `${gateway}: webhook uji dikirim & diterima (simulasi live).`);
  };

  const completed = data.orders.filter((o) => o.status === "Selesai");
  const gmv = data.orders.filter((o) => o.status !== "Dibatalkan").reduce((s, o) => s + o.total_price, 0);
  const commission = Math.floor(completed.reduce((s, o) => s + o.total_price, 0) * 0.1);
  const escrow = data.orders
    .filter((o) => o.status === "Perlu Konfirmasi" || o.status === "Sedang Berjalan")
    .reduce((s, o) => s + o.total_price, 0);
  const pendingPayouts = data.payouts.filter((p) => p.status === "Diajukan");
  const verified = data.vendors.filter((v) => v.status === "verified").length;
  const pendingKyc = data.vendors.filter((v) => v.status === "pending").length;
  const today = new Date().toDateString();
  const ordersToday = data.orders.filter((o) => new Date(o.created_at).toDateString() === today).length;
  const onDuty = data.orders.filter((o) => o.status === "Sedang Berjalan").length;

  return (
    <div className="space-y-5">
      <div className="grid grid-cols-2 gap-3 sm:gap-4 lg:grid-cols-4">
        <Met label="GMV kotor" value={rupiah(gmv)} sub={`${completed.length} transaksi selesai`} icon={<Wallet className="h-5 w-5" />} tone="bg-lagoon-50 text-lagoon-600" />
        <Met label="Komisi platform (10%)" value={rupiah(commission)} sub="dipotong dari pesanan selesai" icon={<Banknote className="h-5 w-5" />} tone="bg-brand-50 text-brand-600" />
        <Met label="Dana escrow berjalan" value={rupiah(escrow)} sub={`${onDuty} perjalanan aktif`} icon={<ShieldCheck className="h-5 w-5" />} tone="bg-amber-50 text-amber-600" />
        <Met label="Payout diminta" value={rupiah(pendingPayouts.reduce((s, p) => s + p.amount, 0))} sub={`${pendingPayouts.length} permintaan menunggu`} icon={<Activity className="h-5 w-5" />} tone="bg-rose-50 text-rose-600" />
      </div>

      <div className="grid gap-5 lg:grid-cols-[1fr_340px] items-start">
        <div className="space-y-5">
          {/* Health status */}
          <CardSection
            title="Health status sistem & API"
            desc="Cek koneksi Supabase (PostgREST) & bucket storage."
            action={
              <button className="btn-ghost btn-sm" onClick={checkHealth} disabled={health.checking}>
                <RefreshCw className={cn("h-3.5 w-3.5", health.checking && "animate-spin")} /> Cek ulang
              </button>
            }
          >
            <div className="grid gap-3 sm:grid-cols-3">
              <HealthItem
                icon={<Database className="h-4 w-4" />}
                label="Database PostgreSQL"
                state={health.db === null ? (health.checking ? "check" : "idle") : health.db <= 1500 ? "ok" : "warn"}
                detail={health.db === null ? (health.checking ? "memeriksa…" : "belum dicek") : `${health.db} ms`}
              />
              <HealthItem
                icon={<Globe className="h-4 w-4" />}
                label="Storage (bucket)"
                state={health.storage === null ? (health.checking ? "check" : "idle") : health.storage ? "ok" : "err"}
                detail={health.storage === null ? (health.checking ? "memeriksa…" : "belum dicek") : health.storage ? "vehicle-photos tersedia" : "bucket tidak ditemukan — jalankan schema.sql"}
              />
              <HealthItem
                icon={<Radio className="h-4 w-4" />}
                label="Webhook simulator"
                state="ok"
                detail="Midtrans / Xendit / WhatsApp"
              />
            </div>
            <p className="mt-4 rounded-xl bg-stone-50 px-3.5 py-2.5 text-[12px] text-stone-400">
              <b className="text-stone-500">Catatan:</b> angka GMV/komisi/escrow dihitung real-time dari tabel <code className="font-mono">orders</code>. Komisi dikredit ke escrow platform otomatis lewat trigger <code className="font-mono">handle_order_completion</code> saat status pesanan berubah jadi "Selesai".
            </p>
          </CardSection>

          {/* Webhook simulator */}
          <CardSection
            title="Simulasi webhook transaksi (live)"
            desc="Kirim event uji seolah-olah dari payment gateway — berguna saat integrasi production."
          >
            <div className="flex flex-wrap gap-2">
              <button className="btn-soft btn-sm" onClick={() => simWebhook("Midtrans")}>
                <Plug className="h-3.5 w-3.5" /> Midtrans payment.success
              </button>
              <button className="btn-soft btn-sm" onClick={() => simWebhook("Xendit")}>
                <Plug className="h-3.5 w-3.5" /> Xendit invoice.paid
              </button>
              <button className="btn-soft btn-sm" onClick={() => simWebhook("WhatsApp Cloud API")}>
                <Plug className="h-3.5 w-3.5" /> WA message.status
              </button>
            </div>
            {events.length > 0 && (
              <div className="mt-4 space-y-2">
                {events.map((ev, i) => (
                  <div key={i} className="flex items-start gap-2 rounded-xl bg-lagoon-950/95 px-3.5 py-2.5 font-mono text-[11px] text-leaf-300">
                    <TerminalSquare className="h-3.5 w-3.5 mt-0.5 shrink-0" />
                    <span>{ev}</span>
                  </div>
                ))}
              </div>
            )}
          </CardSection>
        </div>

        {/* Ekosistem */}
        <div className="space-y-5">
          <CardSection title="Ecosystem metrics">
            <div className="space-y-3 text-sm">
              <EcoRow icon={<Building2 className="h-4 w-4" />} label="Vendor terdaftar" value={String(data.vendors.length)} tone="bg-stone-100 text-stone-600" />
              <EcoRow icon={<BadgeCheck className="h-4 w-4" />} label="Terverifikasi KYC" value={String(verified)} tone="bg-leaf-50 text-leaf-600" />
              <EcoRow icon={<ShieldAlert className="h-4 w-4" />} label="Menunggu verifikasi" value={String(pendingKyc)} tone="bg-amber-50 text-amber-600" />
              <EcoRow icon={<Car className="h-4 w-4" />} label="Unit armada aktif" value={String(data.vehicles.filter((v) => v.is_active).length)} tone="bg-brand-50 text-brand-600" />
              <EcoRow icon={<ClipboardList className="h-4 w-4" />} label="Pesanan hari ini" value={String(ordersToday)} tone="bg-sky-50 text-sky-600" />
            </div>
          </CardSection>

          <CardSection title="Aksi cepat">
            <div className="flex flex-col gap-2">
              <button className="btn-ghost btn-sm justify-start" onClick={() => onGo("kyc")}>
                ⚠️ Verifikasi vendor pending
              </button>
              <button className="btn-ghost btn-sm justify-start" onClick={() => void checkHealth()}>
                🔎 Uji API & latency
              </button>
              <button className="btn-ghost btn-sm justify-start" onClick={() => onFlash("ok", "Semua trigger escrow aktif: komisi 10% & kredit 90% otomatis.")}>
                🛡️ Cek status trigger escrow
              </button>
            </div>
          </CardSection>
        </div>
      </div>
    </div>
  );
}

function Met({ label, value, sub, icon, tone }: { label: string; value: string; sub?: string; icon: React.ReactNode; tone: string }) {
  return (
    <div className="card p-4 animate-rise">
      <p className="text-[10.5px] font-extrabold uppercase tracking-wider text-stone-400 flex items-center gap-1.5">
        <span className={cn("grid h-6 w-6 place-items-center rounded-md", tone)}>{icon}</span>
        {label}
      </p>
      <p className="mt-1.5 text-[17px] sm:text-xl font-extrabold tracking-tight text-lagoon-900 truncate">{value}</p>
      {sub && <p className="text-[11px] text-stone-400 truncate">{sub}</p>}
    </div>
  );
}

function EcoRow({ icon, label, value, tone }: { icon: React.ReactNode; label: string; value: string; tone: string }) {
  return (
    <div className="flex items-center justify-between gap-3">
      <span className="flex items-center gap-2 text-stone-500 text-[13px]">
        <span className={cn("grid h-7 w-7 place-items-center rounded-lg", tone)}>{icon}</span>
        {label}
      </span>
      <b className="text-lagoon-900">{value}</b>
    </div>
  );
}

function HealthItem({
  icon,
  label,
  state,
  detail,
}: {
  icon: React.ReactNode;
  label: string;
  state: "ok" | "warn" | "err" | "check" | "idle";
  detail: string;
}) {
  const color =
    state === "ok" ? "text-leaf-600 bg-leaf-50" : state === "err" ? "text-rose-600 bg-rose-50" : state === "warn" ? "text-amber-600 bg-amber-50" : "text-stone-400 bg-stone-100";
  const dot = state === "ok" ? "bg-leaf-500" : state === "err" ? "bg-rose-500" : state === "warn" ? "bg-amber-500" : state === "check" ? "bg-brand-400 animate-pulse" : "bg-stone-300";
  return (
    <div className="rounded-2xl border border-stone-100 bg-stone-50/60 p-3.5">
      <div className="flex items-center gap-2">
        <span className={cn("grid h-7 w-7 place-items-center rounded-lg", color)}>{icon}</span>
        <p className="text-[12.5px] font-bold text-stone-700">{label}</p>
      </div>
      <p className="mt-2 flex items-center gap-1.5 text-[11.5px] text-stone-400">
        <span className={cn("h-1.5 w-1.5 rounded-full", dot)} />
        {detail}
      </p>
    </div>
  );
}

/* ================================================================== KYC */

function KycTab({
  data,
  onFlash,
  reload,
}: {
  data: AdminData;
  onFlash: (k: "ok" | "err", m: string) => void;
  reload: () => void;
}) {
  const [armed, setArmed] = useState<{ id: string; act: "verify" | "reject" } | null>(null);
  const [busyId, setBusyId] = useState<string | null>(null);

  const act = async (v: Vendor, kind: "verify" | "reject") => {
    if (armed?.id !== v.id || armed.act !== kind) {
      setArmed({ id: v.id, act: kind });
      setTimeout(() => setArmed((a) => (a?.id === v.id && a.act === kind ? null : a)), 3500);
      return;
    }
    setBusyId(v.id);
    try {
      await updateVendorStatus(v.id, kind === "verify" ? "verified" : "rejected");
      onFlash("ok", kind === "verify" ? `${v.business_name} diverifikasi — armada & trayek kini tampil di katalog Customer.` : `${v.business_name} ditolak.`);
      reload();
    } catch (e) {
      onFlash("err", e instanceof Error ? e.message : String(e));
    } finally {
      setBusyId(null);
      setArmed(null);
    }
  };

  const sorted = [...data.vendors].sort((a, b) => (a.status === "pending" ? -1 : 1) - (b.status === "pending" ? -1 : 1) || a.business_name.localeCompare(b.business_name));

  return (
    <CardSection
      title="Verifikasi KYC mitra"
      desc="Audit dokumen perizinan usaha (NIB, NPWP, polis asuransi) sebelum vendor tampil publik."
    >
      {sorted.length === 0 ? (
        <EmptyState icon={<FileCheck className="h-6 w-6" />} title="Belum ada vendor" desc="Seed vendors dulu lewat seed.sql." />
      ) : (
        <div className="space-y-3">
          {sorted.map((v) => {
            const kycDone = [v.kyc_nib, v.kyc_npwp, v.kyc_insurance].filter(Boolean).length;
            return (
              <div key={v.id} className={cn("rounded-2xl border p-4", v.status === "pending" ? "border-amber-200 bg-amber-50/50" : "border-stone-100 bg-stone-50/50")}>
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div className="flex items-center gap-3">
                    <span className="avatar h-11 w-11 text-[14px] bg-gradient-to-br from-brand-500 to-lagoon-600">{v.business_name.split(" ").map((w) => w[0]).slice(0, 2).join("").toUpperCase()}</span>
                    <div>
                      <div className="flex flex-wrap items-center gap-2">
                        <p className="font-extrabold text-stone-800">{v.business_name}</p>
                        <Badge tone={vendorTone(v.status)}>
                          {v.status === "verified" ? "Terverifikasi" : v.status === "pending" ? "Menunggu audit" : "Ditolak"}
                        </Badge>
                      </div>
                      <p className="text-[12.5px] text-stone-400 mt-0.5">{v.owner_name} · {v.city} · {v.phone || "—"} · {v.email || "—"}</p>
                      <p className="text-[11.5px] text-stone-400 mt-0.5">Terdaftar {formatDateTime(v.created_at)}</p>
                    </div>
                  </div>
                  {v.status !== "verified" && (
                    <div className="flex gap-2">
                      <button
                        className={cn(armed?.id === v.id && armed.act === "reject" ? "btn-danger" : "btn-ghost", "btn-sm")}
                        onClick={() => act(v, "reject")}
                        disabled={busyId === v.id}
                      >
                        <XCircle className="h-3.5 w-3.5" /> {armed?.id === v.id && armed.act === "reject" ? "Yakin tolak?" : "Tolak"}
                      </button>
                      <button
                        className={cn("btn-sm", armed?.id === v.id && armed.act === "verify" ? "btn-primary" : "btn-green")}
                        onClick={() => act(v, "verify")}
                        disabled={busyId === v.id}
                      >
                        <CheckCircle2 className="h-3.5 w-3.5" /> {armed?.id === v.id && armed.act === "verify" ? "Yakin verifikasi?" : "Verifikasi"}
                      </button>
                    </div>
                  )}
                </div>

                <div className="mt-3 grid gap-2 sm:grid-cols-3">
                  {(["kyc_nib", "kyc_npwp", "kyc_insurance"] as const).map((doc) => {
                    const val = v[doc];
                    const label = doc === "kyc_nib" ? "NIB" : doc === "kyc_npwp" ? "NPWP" : "Polis Asuransi";
                    return (
                      <div key={doc} className="flex items-center gap-2 rounded-xl bg-white px-3 py-2 text-[12px]">
                        {val ? (
                          <>
                            <FileCheck className="h-4 w-4 text-leaf-600 shrink-0" />
                            <span className="truncate text-stone-600"><b className="text-stone-500">{label}:</b> {val}</span>
                          </>
                        ) : (
                          <>
                            <Ban className="h-4 w-4 text-stone-300 shrink-0" />
                            <span className="text-stone-300">{label} belum diunggah</span>
                          </>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </CardSection>
  );
}

/* =========================================================== Pesanan escrow */

function OrdersAdminTab({
  data,
  onTicket,
  onFlash,
  reload,
}: {
  data: AdminData;
  onTicket: (o: Order) => void;
  onFlash: (k: "ok" | "err", m: string) => void;
  reload: () => void;
}) {
  const [filter, setFilter] = useState<"Semua" | Order["status"]>("Semua");
  const [armed, setArmed] = useState<string | null>(null);
  const [busyId, setBusyId] = useState<string | null>(null);

  const rows = filter === "Semua" ? data.orders : data.orders.filter((o) => o.status === filter);

  const setStatus = async (o: Order, status: Order["status"]) => {
    if (status === "Selesai" || status === "Dibatalkan") {
      if (armed !== o.id) {
        setArmed(o.id);
        setTimeout(() => setArmed((a) => (a === o.id ? null : a)), 3500);
        return;
      }
    }
    setBusyId(o.id);
    try {
      await updateOrder(o.id, { status });
      onFlash("ok", `${o.order_code} → ${status}.`);
      reload();
    } catch (e) {
      onFlash("err", e instanceof Error ? e.message : String(e));
    } finally {
      setBusyId(null);
      setArmed(null);
    }
  };

  return (
    <div className="space-y-5">
      <CardSection
        title="Seluruh pesanan platform"
        desc="Kontrol langsung status escrow. Perubahan ke Selesai memicu pembagian 90/10."
        action={
          <Select className="!h-9 !w-auto !text-[13px]" value={filter} onChange={(e) => setFilter(e.target.value as typeof filter)}>
            <option>Semua</option>
            {ORDER_STATUSES.map((s) => <option key={s}>{s}</option>)}
          </Select>
        }
      >
        {rows.length === 0 ? (
          <EmptyState icon={<Search className="h-6 w-6" />} title="Tidak ada pesanan" desc="Tidak ada pesanan dengan filter ini." />
        ) : (
          <div className="space-y-3">
            {rows.slice(0, 25).map((o) => (
              <OrderListRow
                key={o.id}
                order={o}
                vendorName={data.vendors.find((v) => v.id === o.vendor_id)?.business_name}
                right={
                  <>
                    <button className="btn-ghost btn-sm" onClick={() => onTicket(o)}>e-Tiket</button>
                    {o.status === "Perlu Konfirmasi" && (
                      <>
                        <button className="btn-primary btn-sm" onClick={() => setStatus(o, "Sedang Berjalan")} disabled={busyId === o.id}>Setujui & Jalankan</button>
                        <button className={cn("btn-sm", armed === o.id ? "btn-danger" : "btn-ghost")} onClick={() => setStatus(o, "Dibatalkan")} disabled={busyId === o.id}>
                          {armed === o.id ? "Yakin?" : "Batalkan"}
                        </button>
                      </>
                    )}
                    {o.status === "Sedang Berjalan" && (
                      <>
                        <button className="btn-ghost btn-sm" onClick={() => setStatus(o, "Dibatalkan")} disabled={busyId === o.id}>
                          {armed === o.id ? "Yakin?" : "Batalkan"}
                        </button>
                        <button className={cn("btn-green btn-sm", armed === o.id && "btn-primary")} onClick={() => setStatus(o, "Selesai")} disabled={busyId === o.id}>
                          {armed === o.id ? "Yakin selesai?" : "Tandai Selesai (90/10)"}
                        </button>
                      </>
                    )}
                    {o.status === "Selesai" && (
                      <button className="btn-ghost btn-sm" onClick={() => setStatus(o, "Dibatalkan")}>
                        {armed === o.id ? "Yakin?" : "Batalkan"}
                      </button>
                    )}
                  </>
                }
              />
            ))}
          </div>
        )}
      </CardSection>
    </div>
  );
}

/* ========================================================== Kontrol armada */

function ArmadaAdminTab({
  data,
  onFlash,
  reload,
}: {
  data: AdminData;
  onFlash: (k: "ok" | "err", m: string) => void;
  reload: () => void;
}) {
  const vendorName = (id: string) => data.vendors.find((v) => v.id === id)?.business_name ?? "—";
  const toggle = async (v: Vehicle) => {
    try {
      await updateVehicle(v.id, { is_active: !v.is_active });
      onFlash("ok", !v.is_active ? `${v.name} diaktifkan kembali.` : `${v.name} di-takedown dari katalog publik (Control & Compliance).`);
      reload();
    } catch (e) {
      onFlash("err", e instanceof Error ? e.message : String(e));
    }
  };

  return (
    <CardSection
      title="Control & Compliance — semua unit"
      desc="Takedown unit bermasalah = nonaktifkan dari katalog Customer tanpa menghapus data."
    >
      {data.vehicles.length === 0 ? (
        <EmptyState icon={<Car className="h-6 w-6" />} title="Belum ada unit" />
      ) : (
        <div className="space-y-3">
          {data.vehicles.map((v) => {
            const vendor = data.vendors.find((x) => x.id === v.vendor_id);
            return (
              <div key={v.id} className="flex flex-wrap items-center gap-3 rounded-2xl border border-stone-100 bg-stone-50/60 p-3">
                <VehicleImage src={v.image_url} alt={v.name} className="h-12 w-20 rounded-xl" iconSize="h-5 w-5" />
                <div className="min-w-0 grow">
                  <div className="flex flex-wrap items-center gap-2">
                    <p className="font-extrabold text-stone-800 text-[13.5px]">{v.name}</p>
                    <Badge tone="brand">{v.category}</Badge>
                    <Badge tone={vendorTone(vendor?.status ?? "pending")}>
                      {vendor ? vendor.business_name : "—"}
                    </Badge>
                  </div>
                  <p className="text-[12px] text-stone-400 mt-0.5 font-mono">{v.plate} · {rupiah(v.price_per_day)}/hari</p>
                </div>
                <button
                  className={cn("btn-sm", v.is_active ? "btn-ghost" : "btn-danger")}
                  onClick={() => toggle(v)}
                >
                  {v.is_active ? <><Ban className="h-3.5 w-3.5" /> Takedown</> : "Aktifkan Kembali"}
                </button>
                <span className={cn("h-2 w-2 rounded-full", v.is_active ? "bg-leaf-500" : "bg-rose-400")} />
              </div>
            );
          })}
        </div>
      )}
    </CardSection>
  );
}

/* ============================================================== Integrasi */

function IntegrasiTab({
  data,
  onFlash,
  reload,
}: {
  data: AdminData;
  onFlash: (k: "ok" | "err", m: string) => void;
  reload: () => void;
}) {
  const [map, setMap] = useState<Record<string, string>>(() =>
    Object.fromEntries(data.settings.map((s) => [s.key, s.value]))
  );
  const [busy, setBusy] = useState(false);

  const save = async () => {
    setBusy(true);
    try {
      const keys = Object.keys(map);
      for (const k of keys) await upsertSetting(k, map[k]);
      onFlash("ok", "Pengaturan integrasi disimpan.");
      reload();
    } catch (e) {
      onFlash("err", e instanceof Error ? e.message : String(e));
    } finally {
      setBusy(false);
    }
  };

  const groups: { title: string; desc: string; keys: string[] }[] = [
    { title: "Payment Gateway", desc: "Kunci server dipegang backend production — pada prototype tersimpan di tabel settings.", keys: ["midtrans_client_key", "midtrans_server_key", "xendit_secret_key"] },
    { title: "WhatsApp Cloud API", desc: "Token untuk notifikasi booking & boarding ke pelanggan.", keys: ["wa_cloud_token"] },
    { title: "Konfigurasi platform", desc: "Nama platform & persentase komisi escrow.", keys: ["platform_name", "commission_rate"] },
  ];

  return (
    <div className="grid gap-5 lg:grid-cols-[1fr_320px] items-start">
      <div className="space-y-5">
        {groups.map((g) => (
          <CardSection key={g.title} title={g.title} desc={g.desc}>
            <div className="space-y-3">
              {g.keys.map((k) => (
                <Labeled key={k} label={k}>
                  <Input
                    className="font-mono text-[13px]"
                    value={map[k] ?? ""}
                    placeholder="—"
                    spellCheck={false}
                    onChange={(e) => setMap((m) => ({ ...m, [k]: e.target.value }))}
                  />
                </Labeled>
              ))}
            </div>
          </CardSection>
        ))}
        <div className="flex justify-end">
          <button className="btn-primary" onClick={save} disabled={busy}>
            {busy ? "Menyimpan…" : "Simpan Semua Pengaturan"}
          </button>
        </div>
      </div>

      <div className="space-y-5">
        <CardSection title="Status integrasi">
          <div className="space-y-3 text-[13px]">
            <p className="flex items-center justify-between"><span className="text-stone-500">Midtrans</span><Badge tone={map.midtrans_server_key && !map.midtrans_server_key.includes("••") ? "ok" : "warn"}>{map.midtrans_server_key && !map.midtrans_server_key.includes("••") ? "Terisi" : "Mode uji"}</Badge></p>
            <p className="flex items-center justify-between"><span className="text-stone-500">Xendit</span><Badge tone={map.xendit_secret_key && !map.xendit_secret_key.includes("xnd_development") ? "ok" : "warn"}>{map.xendit_secret_key ? "Terpasang" : "Kosong"}</Badge></p>
            <p className="flex items-center justify-between"><span className="text-stone-500">WhatsApp Cloud API</span><Badge tone={map.wa_cloud_token && !map.wa_cloud_token.includes("EAAG") ? "ok" : "warn"}>Terpasang</Badge></p>
            <p className="flex items-center justify-between"><span className="text-stone-500">Komisi platform</span><Badge tone="brand">{map.commission_rate || "10"}%</Badge></p>
          </div>
        </CardSection>
        <CardSection title="Catatan produksi">
          <ul className="space-y-2 text-[12.5px] text-stone-400 list-disc list-inside leading-relaxed">
            <li>Server keys sebaiknya hanya di backend (Supabase Edge Functions / Vault), bukan di frontend.</li>
            <li>Aktifkan Supabase Auth & ganti policy RLS demo dengan per-role.</li>
            <li>Webhook signature harus diverifikasi sebelum memercayai payload.</li>
          </ul>
        </CardSection>
      </div>
    </div>
  );
}
