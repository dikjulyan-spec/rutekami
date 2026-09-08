import React from "react";
import { Link2, MapPin, Wrench, LogIn, LogOut } from "lucide-react";
import { BackdropDecor } from "./ConnectGate";
import { BrandLogoImg } from "./Logo";
import { signOut } from "../lib/auth";

export type PortalId = "main" | "booking" | "partner" | "admin" | "driver";

/** Topbar brand + tombol masuk/keluar + status peran. */
export function TopBar({ active, role, onAuthed }: { active: PortalId; role?: string | null; onAuthed?: () => void }) {
  void active;
  const handleLogout = async () => { await signOut(); window.location.reload(); };
  return (
    <header className="sticky top-0 z-40 border-b border-white/60 bg-cream/80 backdrop-blur-xl">
      <div className="mx-auto max-w-6xl px-4 sm:px-6">
        <div className="flex h-16 items-center justify-between gap-3">
          <a href="./index.html" className="flex items-center gap-2.5 text-left shrink-0">
            <BrandLogoImg className="h-8 w-auto" />
          </a>
          <div className="flex items-center gap-2">
            {role ? (
              <span className="inline-flex items-center gap-1.5 rounded-full bg-brand-50 px-3 py-1.5 text-[12px] font-bold capitalize text-brand-700 ring-1 ring-brand-100">
                {role}
              </span>
            ) : null}
            {role ? (
              <button className="btn-ghost btn-sm" onClick={handleLogout}>
                <LogOut className="h-4 w-4" /> Keluar
              </button>
            ) : (
              <button className="btn-primary btn-sm" onClick={() => onAuthed?.()} style={{ display: "none" }}>
                <LogIn className="h-4 w-4" /> Masuk
              </button>
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
  role,
  onAuthed,
}: {
  active: PortalId;
  children: React.ReactNode;
  role?: string | null;
  onAuthed?: () => void;
}) {
  return (
    <div className="relative min-h-screen">
      <BackdropDecor />
      <TopBar active={active} role={role} onAuthed={onAuthed} />
      {children}
      <Footer />
    </div>
  );
}
