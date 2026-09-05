import React, { useEffect, useState } from "react";
import {
  Building2,
  Car,
  ChevronDown,
  LayoutDashboard,
  Link2,
  MapPin,
  Navigation,
  ShieldCheck,
  Ticket,
  Wrench,
} from "lucide-react";
import { cn } from "./ui";
import { BackdropDecor } from "./ConnectGate";

export type PortalId = "main" | "booking" | "partner" | "admin" | "driver";

const PORTALS: {
  id: PortalId;
  label: string;
  short: string;
  path: string;
  icon: React.ComponentType<{ className?: string }>;
}[] = [
  { id: "main", label: "Beranda", short: "Home", path: "./index.html", icon: LayoutDashboard },
  { id: "booking", label: "Booking", short: "Booking", path: "./booking.html", icon: Ticket },
  { id: "partner", label: "Partner", short: "Partner", path: "./partner.html", icon: Building2 },
  { id: "admin", label: "Admin HQ", short: "Admin", path: "./admin.html", icon: ShieldCheck },
  { id: "driver", label: "Driver", short: "Driver", path: "./driver.html", icon: Navigation },
];

export function currentPortalId(): PortalId {
  const p = window.location.pathname.split("/").pop() || "index.html";
  if (p === "booking.html") return "booking";
  if (p === "partner.html") return "partner";
  if (p === "admin.html") return "admin";
  if (p === "driver.html") return "driver";
  return "main";
}

/** Topbar brand + navigasi portal (link <a>, bukan tab state). */
export function TopBar({ active }: { active: PortalId }) {
  const [open, setOpen] = useState(false);
  useEffect(() => {
    const onResize = () => window.innerWidth >= 768 && setOpen(false);
    window.addEventListener("resize", onResize);
    return () => window.removeEventListener("resize", onResize);
  }, []);
  const current = PORTALS.find((p) => p.id === active) ?? PORTALS[0];

  return (
    <header className="sticky top-0 z-40 border-b border-white/60 bg-cream/80 backdrop-blur-xl">
      <div className="mx-auto max-w-6xl px-4 sm:px-6">
        <div className="flex h-16 items-center justify-between gap-3">
          <a href="./index.html" className="flex items-center gap-2.5 text-left shrink-0">
            <span className="grid h-9 w-9 place-items-center rounded-xl bg-gradient-to-br from-brand-500 to-leaf-500 text-white shadow-warm">
              <Car className="h-5 w-5" />
            </span>
            <span className="leading-none">
              <span className="block text-[17px] font-extrabold tracking-tight text-lagoon-900">Travondo</span>
              <span className="mt-1 block text-[10px] font-bold uppercase tracking-[0.16em] text-stone-400">NusaTravelLab</span>
            </span>
          </a>

          {/* Nav (desktop) */}
          <nav className="hidden md:flex items-center gap-1 rounded-2xl bg-white/70 p-1 ring-1 ring-stone-200/70 shadow-sm">
            {PORTALS.map((p) => {
              const Icon = p.icon;
              const isActive = p.id === active;
              return (
                <a
                  key={p.id}
                  href={p.path}
                  className={cn(
                    "flex items-center gap-2 rounded-xl px-3.5 py-2 transition-all",
                    isActive ? "bg-gradient-to-r from-brand-500 to-brand-400 text-white shadow-warm" : "text-stone-500 hover:bg-stone-100 hover:text-stone-800"
                  )}
                >
                  <Icon className="h-4 w-4" />
                  <span className="text-[13px] font-extrabold">{p.label}</span>
                </a>
              );
            })}
          </nav>

          {/* Dropdown (mobile) */}
          <div className="md:hidden relative">
            <button
              onClick={() => setOpen((o) => !o)}
              className="flex items-center gap-1.5 rounded-xl bg-white/80 border border-stone-200 px-3 py-2 text-[13px] font-bold text-stone-700"
            >
              <current.icon className="h-4 w-4 text-brand-500" />
              {current.short}
              <ChevronDown className={cn("h-4 w-4 text-stone-400 transition", open && "rotate-180")} />
            </button>
            {open && (
              <div className="absolute right-0 mt-2 w-48 rounded-2xl bg-white p-1.5 shadow-card-lg ring-1 ring-stone-100 animate-pop">
                {PORTALS.map((p) => {
                  const Icon = p.icon;
                  const isActive = p.id === active;
                  return (
                    <a
                      key={p.id}
                      href={p.path}
                      onClick={() => setOpen(false)}
                      className={cn(
                        "flex items-center gap-2.5 rounded-xl px-3 py-2.5 text-[13px] font-bold transition",
                        isActive ? "bg-brand-50 text-brand-700" : "text-stone-600 hover:bg-stone-50"
                      )}
                    >
                      <Icon className="h-4 w-4" />
                      {p.label}
                    </a>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      </div>
    </header>
  );
}

/** Footer bersama */
export function Footer() {
  return (
    <footer className="border-t border-white/60 py-6 mt-4">
      <div className="mx-auto max-w-6xl px-4 flex flex-wrap items-center justify-between gap-2 text-[12px] text-stone-400">
        <p className="flex items-center gap-1.5">
          <span className="grid h-5 w-5 place-items-center rounded-md bg-gradient-to-br from-brand-500 to-leaf-500 text-white"><Car className="h-3 w-3" /></span>
          <b className="text-stone-500">Travondo Platform</b> · NusaTravelLab
        </p>
        <div className="flex items-center gap-3 text-stone-300">
          <span className="flex items-center gap-1"><MapPin className="h-3.5 w-3.5" /> Indonesia</span>
          <span className="flex items-center gap-1"><Link2 className="h-3.5 w-3.5" /> Multi-portal</span>
          <span className="flex items-center gap-1"><Wrench className="h-3.5 w-3.5" /> React 18 + Vite 6 + Supabase</span>
        </div>
      </div>
    </footer>
  );
}

/** Bungkus halaman portal penuh (BackdropDecor + TopBar + konten + footer). */
export function PageShell({
  active,
  children,
}: {
  active: PortalId;
  children: React.ReactNode;
}) {
  return (
    <div className="relative min-h-screen">
      <BackdropDecor />
      <TopBar active={active} />
      {children}
      <Footer />
    </div>
  );
}
