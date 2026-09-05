import { getClient, getStorageBucket } from "./supabase";
import type {
  Driver,
  Inspection,
  Order,
  Payout,
  Route,
  Setting,
  Vehicle,
  Vendor,
} from "../types/database";

/**
 * Repository layer — seluruh akses Supabase terkumpul di sini.
 * Semua fungsi melempar Error dengan pesan ramah bila query gagal,
 * sehingga halaman cukup menampilkan error.message.
 */

function fail(err: unknown, ctx: string): never {
  const msg =
    err instanceof Error
      ? err.message
      : typeof err === "object" && err && "message" in err
        ? String((err as { message: unknown }).message)
        : String(err);
  throw new Error(`${ctx} — ${msg}`);
}

// ------------------------------------------------------------------ Vendor

export async function fetchVendors(): Promise<Vendor[]> {
  const sb = getClient();
  const { data, error } = await sb
    .from("vendors")
    .select("*")
    .order("created_at", { ascending: true });
  if (error) fail(error, "Gagal memuat data vendor");
  return (data ?? []) as Vendor[];
}

export async function updateVendorStatus(
  id: string,
  status: Vendor["status"]
): Promise<void> {
  const sb = getClient();
  const { error } = await sb.from("vendors").update({ status }).eq("id", id);
  if (error) fail(error, "Gagal memperbarui status vendor");
}

export async function updateVendorWallet(
  id: string,
  wallet_balance: number
): Promise<void> {
  const sb = getClient();
  const { error } = await sb
    .from("vendors")
    .update({ wallet_balance })
    .eq("id", id);
  if (error) fail(error, "Gagal memperbarui saldo vendor");
}

// ----------------------------------------------------------------- Vehicles

export async function fetchVehicles(): Promise<Vehicle[]> {
  const sb = getClient();
  const { data, error } = await sb
    .from("vehicles")
    .select("*")
    .order("created_at", { ascending: false });
  if (error) fail(error, "Gagal memuat data armada");
  return (data ?? []) as Vehicle[];
}

export type NewVehicle = Omit<
  Vehicle,
  "id" | "created_at" | "is_active"
>;

export async function insertVehicle(v: NewVehicle): Promise<Vehicle> {
  const sb = getClient();
  const { data, error } = await sb
    .from("vehicles")
    .insert({ ...v, is_active: true })
    .select()
    .single();
  if (error) fail(error, "Gagal menambah unit armada");
  return data as Vehicle;
}

export async function updateVehicle(
  id: string,
  patch: Partial<Vehicle>
): Promise<void> {
  const sb = getClient();
  const { error } = await sb.from("vehicles").update(patch).eq("id", id);
  if (error) fail(error, "Gagal memperbarui unit armada");
}

export async function deleteVehicle(id: string): Promise<void> {
  const sb = getClient();
  const { error } = await sb.from("vehicles").delete().eq("id", id);
  if (error) fail(error, "Gagal menghapus unit armada");
}

/** Upload foto unit ke Supabase Storage (bucket vehicle-photos). */
export async function uploadVehicleImage(file: File): Promise<string> {
  const sb = getClient();
  const ext = (file.name.split(".").pop() || "jpg").toLowerCase().replace(/[^a-z0-9]/g, "");
  const safeExt = /^(jpg|jpeg|png|webp|svg)$/.test(ext) ? ext : "jpg";
  const path = `public/${Date.now()}-${Math.random().toString(36).slice(2, 8)}.${safeExt}`;
  const { error } = await sb.storage
    .from(getStorageBucket())
    .upload(path, file, { contentType: file.type || "image/jpeg" });
  if (error) fail(error, "Upload foto gagal (cek kebijakan storage di schema.sql)");
  const { data } = sb.storage.from(getStorageBucket()).getPublicUrl(path);
  return data.publicUrl;
}

// ------------------------------------------------------------------ Routes

export async function fetchRoutes(): Promise<Route[]> {
  const sb = getClient();
  const { data, error } = await sb
    .from("routes")
    .select("*")
    .order("origin", { ascending: true });
  if (error) fail(error, "Gagal memuat data trayek");
  return (data ?? []) as Route[];
}

export async function insertRoute(r: {
  vendor_id: string;
  origin: string;
  destination: string;
  fleet_type: string;
  price_per_seat: number;
  departures: string[];
}): Promise<Route> {
  const sb = getClient();
  const { data, error } = await sb
    .from("routes")
    .insert({ ...r, is_active: true })
    .select()
    .single();
  if (error) fail(error, "Gagal menambah trayek");
  return data as Route;
}

export async function setRouteActive(id: string, is_active: boolean): Promise<void> {
  const sb = getClient();
  const { error } = await sb
    .from("routes")
    .update({ is_active })
    .eq("id", id);
  if (error) fail(error, "Gagal memperbarui trayek");
}

// ------------------------------------------------------------------ Drivers

export async function fetchDrivers(): Promise<Driver[]> {
  const sb = getClient();
  const { data, error } = await sb
    .from("drivers")
    .select("*")
    .order("created_at", { ascending: false });
  if (error) fail(error, "Gagal memuat data sopir");
  return (data ?? []) as Driver[];
}

export async function insertDriver(d: {
  vendor_id: string;
  name: string;
  phone: string;
}): Promise<Driver> {
  const sb = getClient();
  const { data, error } = await sb
    .from("drivers")
    .insert({ ...d, status: "Offline" })
    .select()
    .single();
  if (error) fail(error, "Gagal menambah sopir");
  return data as Driver;
}

export async function setDriverStatus(
  id: string,
  status: Driver["status"]
): Promise<void> {
  const sb = getClient();
  const { error } = await sb.from("drivers").update({ status }).eq("id", id);
  if (error) fail(error, "Gagal memperbarui status sopir");
}

// ------------------------------------------------------------------- Orders

export async function fetchOrders(): Promise<Order[]> {
  const sb = getClient();
  const { data, error } = await sb
    .from("orders")
    .select("*")
    .order("created_at", { ascending: false });
  if (error) fail(error, "Gagal memuat data pesanan");
  return (data ?? []) as Order[];
}

export type NewOrder = Omit<Order, "id" | "created_at" | "checked_in">;

export async function insertOrder(o: NewOrder): Promise<Order> {
  const sb = getClient();
  const { data, error } = await sb
    .from("orders")
    .insert({ ...o, checked_in: false })
    .select()
    .single();
  if (error) fail(error, "Gagal menyimpan pesanan");
  return data as Order;
}

export async function updateOrder(
  id: string,
  patch: Partial<Order>
): Promise<void> {
  const sb = getClient();
  const { error } = await sb.from("orders").update(patch).eq("id", id);
  if (error) fail(error, "Gagal memperbarui pesanan");
}

export async function findOrderByCode(code: string): Promise<Order | null> {
  const sb = getClient();
  const { data, error } = await sb
    .from("orders")
    .select("*")
    .ilike("order_code", `%${code.trim().toUpperCase()}%`)
    .limit(10);
  if (error) fail(error, "Gagal mencari e-tiket");
  return (data?.[0] ?? null) as Order | null;
}

// -------------------------------------------------------------- Inspections

export async function fetchInspections(): Promise<Inspection[]> {
  const sb = getClient();
  const { data, error } = await sb
    .from("inspections")
    .select("*")
    .order("created_at", { ascending: false });
  if (error) fail(error, "Gagal memuat data inspeksi");
  return (data ?? []) as Inspection[];
}

export async function createInspection(i: {
  driver_id: string;
  vehicle_id: string;
  order_id: string | null;
  km_start: number;
  fuel_start: string | null;
  body_condition: string;
}): Promise<Inspection> {
  const sb = getClient();
  const { data, error } = await sb
    .from("inspections")
    .insert({
      ...i,
      km_end: null,
      fuel_end: null,
      damage_notes: "",
    })
    .select()
    .single();
  if (error) fail(error, "Gagal menyimpan inspeksi");
  return data as Inspection;
}

export async function completeInspection(
  id: string,
  patch: { km_end: number; fuel_end: string; damage_notes: string }
): Promise<void> {
  const sb = getClient();
  const { error } = await sb
    .from("inspections")
    .update(patch)
    .eq("id", id);
  if (error) fail(error, "Gagal menyelesaikan inspeksi");
}

// ------------------------------------------------------------------ Payouts

export async function fetchPayouts(): Promise<Payout[]> {
  const sb = getClient();
  const { data, error } = await sb
    .from("payouts")
    .select("*")
    .order("created_at", { ascending: false });
  if (error) fail(error, "Gagal memuat data payout");
  return (data ?? []) as Payout[];
}

export async function insertPayout(p: {
  vendor_id: string;
  amount: number;
  bank_name: string;
  account_number: string;
  account_name: string;
}): Promise<Payout> {
  const sb = getClient();
  const { data, error } = await sb
    .from("payouts")
    .insert({ ...p, status: "Diajukan" })
    .select()
    .single();
  if (error) fail(error, "Gagal mengajukan payout");
  return data as Payout;
}

export async function updatePayoutStatus(
  id: string,
  status: Payout["status"]
): Promise<void> {
  const sb = getClient();
  const { error } = await sb.from("payouts").update({ status }).eq("id", id);
  if (error) fail(error, "Gagal memperbarui status payout");
}

// ---------------------------------------------------------------- Settings

export async function fetchSettings(): Promise<Setting[]> {
  const sb = getClient();
  const { data, error } = await sb.from("settings").select("*").order("key");
  if (error) fail(error, "Gagal memuat pengaturan");
  return (data ?? []) as Setting[];
}

export async function upsertSetting(key: string, value: string): Promise<void> {
  const sb = getClient();
  const { error } = await sb
    .from("settings")
    .upsert({ key, value, updated_at: new Date().toISOString() });
  if (error) fail(error, "Gagal menyimpan pengaturan");
}

/** Ping ringan untuk cek health API — ukur latensi query termurah. */
export async function pingDatabase(): Promise<number> {
  const sb = getClient();
  const t0 = performance.now();
  const { error } = await sb.from("orders").select("id", { head: true, count: "exact" });
  const ms = Math.round(performance.now() - t0);
  if (error) fail(error, "Koneksi database gagal");
  return ms;
}
