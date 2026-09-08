import React from "react";
import { Link2, MapPin, Wrench } from "lucide-react";
import { BackdropDecor } from "./ConnectGate";
import { BrandLogoImg, BrandLogotype } from "./Logo";

export type PortalId = "main" | "booking" | "partner" | "admin" | "driver";

/** Topbar brand + (tanpa menu portal) — navigasi antar portal diakses lewat URL langsung. */
export function TopBar({ active }: { active: PortalId }) {
  void active;
  return (
    <header className="sticky top-0 z-40 border-b border-white/60 bg-cream/80 backdrop-blur-xl">
      <div className="mx-auto max-w-6xl px-4 sm:px-6">
        <div className="flex h-16 items-center justify-between gap-3">
          <a href="./index.html" className="flex items-center gap-2.5 text-left shrink-0">
            <BrandLogotype className="h-8 w-auto" />
          </a>
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
          <BrandLogoImg className="h-12 w-auto" />
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
