import React, { useState } from "react";
import {
  ArrowRight,
  Building2,
  Bus,
  Calendar,
  Car,
  Clock,
  MapPin,
  Phone,
  Settings2,
  Users,
  Luggage,
} from "lucide-react";
import type { DriverStatus, Order, OrderStatus, Route, VendorStatus, Vehicle } from "../types/database";
import { formatDate, formatDateTime, rupiah } from "../lib/format";
import { Badge, cn, type BadgeTone } from "./ui";

// ------------------------------------------------------------------ Tone helpers

export function orderTone(s: OrderStatus): BadgeTone {
  switch (s) {
    case "Perlu Konfirmasi":
      return "warn";
    case "Sedang Berjalan":
      return "info";
    case "Selesai":
      return "ok";
    default:
      return "danger";
  }
}

export function driverTone(s: DriverStatus): BadgeTone {
  return s === "Online" ? "ok" : s === "Istirahat" ? "warn" : "muted";
}

export function vendorTone(s: VendorStatus): BadgeTone {
  return s === "verified" ? "ok" : s === "pending" ? "warn" : "danger";
}

// ------------------------------------------------------------------ Vehicle image w/ fallback

export function VehicleImage({
  src,
  alt,
  className,
  iconSize = "h-8 w-8",
}: {
  src?: string | null;
  alt: string;
  className?: string;
  iconSize?: string;
}) {
  const [err, setErr] = useState(false);
  const show = !!src && !err;
  return (
    <div
      className={cn(
        "relative overflow-hidden bg-gradient-to-br from-brand-100 via-teal-50 to-leaf-100 grid place-items-center",
        className
      )}
    >
      {show ? (
        <img
          src={src as string}
          alt={alt}
          loading="lazy"
          onError={() => setErr(true)}
          className="absolute inset-0 h-full w-full object-cover"
        />
      ) : (
        <Car className={cn("text-brand-300", iconSize)} />
      )}
    </div>
  );
}

// ------------------------------------------------------------------ Vehicle card (katalog customer)

export function VehicleCard({
  v,
  vendorName,
  cityLabel,
  onBook,
}: {
  v: Vehicle;
  vendorName: string;
  cityLabel: string;
  onBook: () => void;
}) {
  const effective = v.allow_self_drive ? v.price_per_day : (v.price_with_driver ?? v.price_per_day);
  return (
    <div className="card card-hover overflow-hidden flex flex-col animate-rise">
      <div className="relative">
        <VehicleImage src={v.image_url} alt={v.name} className="h-44 w-full" />
        <span className="absolute left-3 top-3">
          <Badge tone="brand" className="bg-white/90 backdrop-blur">{v.category}</Badge>
        </span>
        <span className="absolute right-3 top-3">
          <Badge tone={v.is_active ? "ok" : "danger"} className="bg-white/90 backdrop-blur">
            {v.is_active ? "Tersedia" : "Nonaktif"}
          </Badge>
        </span>
      </div>
      <div className="flex flex-col grow p-4 sm:p-5">
        <div className="flex items-start justify-between gap-2">
          <h3 className="font-extrabold text-stone-800 leading-tight">{v.name}</h3>
          <span className="text-[11px] font-bold tracking-wider text-stone-400 font-mono whitespace-nowrap mt-0.5">
            {v.plate}
          </span>
        </div>
        <p className="mt-1 flex items-center gap-1.5 text-[13px] text-stone-500">
          <Building2 className="h-3.5 w-3.5 text-brand-400" />
          {vendorName}
        </p>

        <div className="mt-3 grid grid-cols-2 gap-x-3 gap-y-2 text-[13px] text-stone-500">
          <span className="flex items-center gap-1.5"><Users className="h-3.5 w-3.5 text-leaf-600" /> {v.seats} kursi</span>
          <span className="flex items-center gap-1.5"><Luggage className="h-3.5 w-3.5 text-leaf-600" /> {v.luggage} bagasi</span>
          <span className="flex items-center gap-1.5"><Settings2 className="h-3.5 w-3.5 text-leaf-600" /> {v.transmission}</span>
          <span className="flex items-center gap-1.5"><MapPin className="h-3.5 w-3.5 text-leaf-600" /> {cityLabel}</span>
        </div>

        <div className="mt-3 flex flex-col gap-1.5 rounded-xl bg-stone-50 p-3 text-[13px]">
          {v.allow_self_drive && (
            <div className="flex justify-between">
              <span className="text-stone-500">Lepas Kunci</span>
              <span className="font-bold text-stone-700">{rupiah(v.price_per_day)}<span className="font-medium text-stone-400">/hari</span></span>
            </div>
          )}
          {v.price_with_driver != null && (
            <div className="flex justify-between">
              <span className="text-stone-500">Dengan Sopir</span>
              <span className="font-bold text-stone-700">{rupiah(v.price_with_driver)}<span className="font-medium text-stone-400">/hari</span></span>
            </div>
          )}
        </div>

        <div className="grow" />
        <button className="btn-primary btn-block mt-4" onClick={onBook} disabled={!v.is_active}>
          {v.is_active ? "Pesan Sekarang" : "Tidak Tersedia"}
        </button>
        <p className="mt-1.5 text-center text-[11px] text-stone-400">mulai {rupiah(effective)}/hari</p>
      </div>
    </div>
  );
}

// ------------------------------------------------------------------ Travel route card

export function TravelCard({
  r,
  vendorName,
  onBook,
}: {
  r: Route;
  vendorName: string;
  onBook: () => void;
}) {
  return (
    <div className={cn("card card-hover p-4 sm:p-5 animate-rise", !r.is_active && "opacity-60")}>
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-3 min-w-0">
          <span className="grid h-11 w-11 shrink-0 place-items-center rounded-2xl bg-gradient-to-br from-leaf-100 to-leaf-50 text-leaf-600">
            <Bus className="h-[22px] w-[22px]" />
          </span>
          <div className="min-w-0">
            <p className="font-extrabold text-stone-800 text-[15px] flex items-center flex-wrap gap-x-2 gap-y-0.5">
              {r.origin}
              <ArrowRight className="h-4 w-4 text-brand-500" />
              {r.destination}
            </p>
            <p className="text-[12px] text-stone-400 flex items-center gap-1.5 mt-0.5">
              <Building2 className="h-3 w-3" /> {vendorName} · {r.fleet_type}
            </p>
          </div>
        </div>
        <div className="text-right">
          <p className="font-extrabold text-lagoon-900">{rupiah(r.price_per_seat)}</p>
          <p className="text-[11px] text-stone-400">/ kursi</p>
        </div>
      </div>
      <div className="mt-4 flex flex-wrap items-center justify-between gap-3">
        <div className="flex flex-wrap gap-1.5">
          {r.departures.map((d) => (
            <span key={d} className="rounded-lg bg-lagoon-50 px-2 py-1 text-[12px] font-bold text-lagoon-700 font-mono">
              {d}
            </span>
          ))}
        </div>
        <button className="btn-green btn-sm" onClick={onBook} disabled={!r.is_active}>
          Pesan Kursi
        </button>
      </div>
    </div>
  );
}

// ------------------------------------------------------------------ Baris pesanan (dipakai semua portal)

export function ServiceIcon({ type, className }: { type: Order["type"]; className?: string }) {
  return (
    <span
      className={cn(
        "grid h-10 w-10 shrink-0 place-items-center rounded-xl",
        type === "rental" ? "bg-brand-50 text-brand-600" : "bg-leaf-50 text-leaf-600",
        className
      )}
    >
      {type === "rental" ? <Car className="h-5 w-5" /> : <Bus className="h-5 w-5" />}
    </span>
  );
}

export function OrderListRow({
  order,
  vendorName,
  right,
  extraMeta,
}: {
  order: Order;
  vendorName?: string;
  right?: React.ReactNode;
  extraMeta?: React.ReactNode;
}) {
  return (
    <div className="card p-4 sm:p-5 animate-rise">
      <div className="flex flex-wrap items-center gap-3 sm:gap-4">
        <ServiceIcon type={order.type} />
        <div className="min-w-0 grow">
          <div className="flex flex-wrap items-center gap-x-2 gap-y-1">
            <span className="font-mono text-[11px] font-bold tracking-wider text-stone-400">{order.order_code}</span>
            <Badge tone={orderTone(order.status)}>{order.status}</Badge>
            {order.checked_in && <Badge tone="brand">✓ Check-in</Badge>}
          </div>
          <p className="font-bold text-stone-800 mt-0.5 leading-snug">{order.title}</p>
          <div className="mt-1.5 flex flex-wrap gap-x-4 gap-y-1 text-[12.5px] text-stone-500">
            <span className="flex items-center gap-1"><Calendar className="h-3.5 w-3.5 text-stone-400" />{formatDate(order.departure_date)}</span>
            <span className="flex items-center gap-1"><Clock className="h-3.5 w-3.5 text-stone-400" />{order.departure_time}</span>
            <span className="flex items-center gap-1"><MapPin className="h-3.5 w-3.5 text-stone-400" />{order.pickup_point || "—"}</span>
            {vendorName && (
              <span className="flex items-center gap-1"><Building2 className="h-3.5 w-3.5 text-stone-400" />{vendorName}</span>
            )}
            {extraMeta}
          </div>
        </div>
        <div className="flex flex-col items-end gap-1.5">
          <p className="font-extrabold text-lagoon-900 whitespace-nowrap">{rupiah(order.total_price)}</p>
          <p className="flex items-center gap-1 text-[11.5px] text-stone-400">
            <Phone className="h-3 w-3" /> {order.customer_name}
          </p>
        </div>
      </div>
      {right && <div className="mt-3 flex flex-wrap gap-2 border-t border-stone-100 pt-3">{right}</div>}
    </div>
  );
}

// ------------------------------------------------------------------ E-Ticket

export function TicketView({
  order,
  vendorName,
  vehicleName,
  driverName,
}: {
  order: Order;
  vendorName?: string;
  vehicleName?: string;
  driverName?: string;
}) {
  const base = order.total_price - order.insurance_cost;
  return (
    <div className="overflow-hidden rounded-3xl border border-stone-200 bg-white shadow-card">
      {/* Header */}
      <div className="bg-gradient-to-r from-brand-500 via-brand-400 to-leaf-500 px-5 sm:px-6 py-4 flex items-center justify-between gap-3">
        <div className="flex items-center gap-2.5 text-white">
          <span className="grid h-9 w-9 place-items-center rounded-xl bg-white/20 backdrop-blur">
            <Car className="h-5 w-5" />
          </span>
          <div>
            <p className="font-extrabold leading-none tracking-tight">E-TIKET RUTEKAMI</p>
            <p className="text-[11px] text-white/80 mt-1">RuteTrip · transaksi aman escrow</p>
          </div>
        </div>
        <div className="text-right">
          <p className="font-mono text-white font-extrabold tracking-wider text-[13px]">{order.order_code}</p>
          <Badge tone="brand" className="bg-white/90 backdrop-blur !text-brand-700 mt-1">
            {order.status}
          </Badge>
        </div>
      </div>

      {/* Divider dashed */}
      <div className="relative flex items-center px-2">
        <span className="absolute -left-3 h-6 w-6 rounded-full bg-cream" />
        <span className="h-0 w-full border-t-2 border-dashed border-stone-200" />
        <span className="absolute -right-3 h-6 w-6 rounded-full bg-cream" />
      </div>

      <div className="px-5 sm:px-6 py-4 space-y-3 text-sm">
        <TicketRow label="Nama Penumpang" value={order.customer_name} strong />
        <TicketRow label="No. Handphone" value={order.customer_phone || "—"} />
        <TicketRow
          label={order.type === "rental" ? "Unit Armada" : "Trayek Perjalanan"}
          value={vehicleName ?? order.title}
          strong
        />
        {vendorName && <TicketRow label="Penyedia (Vendor)" value={vendorName} />}
        {driverName && <TicketRow label="Sopir" value={driverName} />}
        <div className="grid grid-cols-2 gap-3">
          <TicketRow label="Tanggal" value={formatDate(order.departure_date)} />
          <TicketRow label="Jam" value={order.departure_time} />
        </div>
        <TicketRow
          label="Titik Penjemputan"
          value={order.pickup_point || "—"}
          icon={<MapPin className="h-3.5 w-3.5 text-stone-400" />}
        />
        {order.type === "rental" ? (
          <TicketRow label="Durasi Sewa" value={`${order.duration_days} hari`} />
        ) : (
          <TicketRow label="Jumlah Kursi" value={`${order.seat_count} kursi`} />
        )}
        {order.notes && <TicketRow label="Catatan" value={order.notes} />}

        <div className="rounded-2xl bg-stone-50 p-4 space-y-1.5 text-[13.5px]">
          <div className="flex justify-between text-stone-500">
            <span>{order.type === "rental" ? `Sewa ${order.duration_days} hari` : `${order.seat_count} kursi`}</span>
            <span>{rupiah(base)}</span>
          </div>
          {order.insurance && (
            <div className="flex justify-between text-stone-500">
              <span>Proteksi asuransi perjalanan</span>
              <span>{rupiah(order.insurance_cost)}</span>
            </div>
          )}
          <div className="flex justify-between border-t border-stone-200 pt-2 text-[15px] font-extrabold text-lagoon-900">
            <span>Total Dibayar</span>
            <span>{rupiah(order.total_price)}</span>
          </div>
        </div>

        <p className="flex items-center justify-between text-[11px] text-stone-400 pt-1">
          <span>Diterbitkan {formatDateTime(order.created_at)}</span>
          <span className="font-semibold">Tunjukkan kode ini saat boarding</span>
        </p>
      </div>
    </div>
  );
}

export function TicketRow({
  label,
  value,
  strong,
  icon,
}: {
  label: string;
  value: string;
  strong?: boolean;
  icon?: React.ReactNode;
}) {
  return (
    <div className="flex items-start justify-between gap-4">
      <span className="text-stone-400 text-[12.5px] shrink-0 flex items-center gap-1">
        {icon}
        {label}
      </span>
      <span className={cn("text-right text-stone-800 min-w-0 break-words", strong ? "font-bold" : "font-medium")}>
        {value}
      </span>
    </div>
  );
}
