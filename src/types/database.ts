/**
 * Travondo Platform — Data Models & Typescript Interfaces
 *
 * Catatan: nama properti sengaja mengikuti nama kolom PostgreSQL (snake_case)
 * agar hasil query PostgREST/Supabase dapat langsung dipakai tanpa mapping.
 * Skema lengkap + seed ada di folder /supabase.
 */

// ---------- Enums / Union ----------

export type VehicleCategory =
  | "MPV"
  | "Medium MPV"
  | "SUV"
  | "City Car"
  | "Minibus"
  | "Luxury";

export type Transmission = "Automatic" | "Manual" | "CVT";

export type OrderStatus =
  | "Perlu Konfirmasi"
  | "Sedang Berjalan"
  | "Selesai"
  | "Dibatalkan";

export type VendorStatus = "pending" | "verified" | "rejected";

export type DriverStatus = "Online" | "Istirahat" | "Offline";

export type PayoutStatus = "Diajukan" | "Diproses" | "Selesai" | "Ditolak";

// ---------- Rows (PostgreSQL) ----------

export interface Vendor {
  id: string;
  business_name: string;
  owner_name: string;
  email: string;
  phone: string;
  city: string;
  status: VendorStatus;
  kyc_nib: string | null;
  kyc_npwp: string | null;
  kyc_insurance: string | null;
  wallet_balance: number;
  created_at: string;
}

export interface Vehicle {
  id: string;
  vendor_id: string;
  name: string;
  category: VehicleCategory;
  plate: string;
  seats: number;
  luggage: number;
  transmission: Transmission;
  price_per_day: number;
  price_with_driver: number | null;
  allow_self_drive: boolean;
  image_url: string | null;
  cities: string[];
  is_active: boolean;
  created_at: string;
}

export interface Route {
  id: string;
  vendor_id: string;
  origin: string;
  destination: string;
  fleet_type: string;
  price_per_seat: number;
  departures: string[];
  is_active: boolean;
  created_at: string;
}

export interface Driver {
  id: string;
  vendor_id: string;
  name: string;
  phone: string;
  status: DriverStatus;
  created_at: string;
}

export interface Order {
  id: string;
  order_code: string;
  type: "rental" | "travel";
  title: string;
  customer_name: string;
  customer_phone: string;
  vendor_id: string | null;
  vehicle_id: string | null;
  route_id: string | null;
  driver_id: string | null;
  departure_date: string; // 'YYYY-MM-DD'
  departure_time: string; // 'HH:MM'
  pickup_point: string;
  seat_count: number;
  duration_days: number;
  insurance: boolean;
  insurance_cost: number;
  total_price: number;
  status: OrderStatus;
  checked_in: boolean;
  notes: string;
  created_at: string;
}

export interface Inspection {
  id: string;
  driver_id: string;
  vehicle_id: string;
  order_id: string | null;
  km_start: number;
  km_end: number | null;
  fuel_start: string | null;
  fuel_end: string | null;
  body_condition: string;
  damage_notes: string;
  created_at: string;
  updated_at: string;
}

export interface Payout {
  id: string;
  vendor_id: string;
  amount: number;
  bank_name: string;
  account_number: string;
  account_name: string;
  status: PayoutStatus;
  created_at: string;
}

export interface Setting {
  key: string;
  value: string;
  updated_at: string;
}

// ---------- Kategori / label lookup ----------

export const VEHICLE_CATEGORIES: VehicleCategory[] = [
  "City Car",
  "MPV",
  "Medium MPV",
  "SUV",
  "Minibus",
  "Luxury",
];

export const TRANSMISSIONS: Transmission[] = ["Automatic", "Manual", "CVT"];

export const ORDER_STATUSES: OrderStatus[] = [
  "Perlu Konfirmasi",
  "Sedang Berjalan",
  "Selesai",
  "Dibatalkan",
];

export const FUEL_LEVELS = ["1/4", "1/2", "3/4", "Full"] as const;
