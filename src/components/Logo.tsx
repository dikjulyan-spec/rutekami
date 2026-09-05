import React from "react";
// Vite memuat file SVG sebagai URL aset (base "./" => path relatif, aman di subpath)
import fullLogoUrl from "../assets/rutetrip-logo.svg";
import iconUrl from "../assets/rutetrip-icon.svg";

/** Ikon simbol RuteTrip (van + pin + panah, tanpa teks) — untuk topbar/footer/e-tiket. */
export function BrandIcon({ className }: { className?: string }) {
  return <img src={iconUrl} alt="RuteTrip" className={className} draggable={false} />;
}

/** Logo penuh RuteTrip (simbol + wordmark + tagline) — untuk layar besar/Connect. */
export function BrandLogo({ className }: { className?: string }) {
  return <img src={fullLogoUrl} alt="RuteTrip — Plan · Journey · Explore" className={className} draggable={false} />;
}
