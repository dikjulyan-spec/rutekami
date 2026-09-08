import React from "react";
// File PNG dari repo — Vite memproses & menghasilkan URL aset yang benar saat build/deploy.
import logoIconUrl from "../assets/icon.png";   // ikon van+pin+panah (kecil, kotak) — footer/e-tiket
import logoSrc from "../assets/logo.png";       // logo penuh (ikon + wordmark) — navbar & Connect

/**
 * Logo RuteTrip.
 * BrandIcon    = ikon van+pin+panah (tanpa teks) kotak 1:1 → topbar kecil/footer/e-tiket.
 * BrandLogoImg = logo penuh (ikon + wordmark "RuteTrip" + tagline) → navbar & layar Connect (pakai file asli).
 */

/** Ikon simbol RuteTrip (van + pin + panah, tanpa teks) — untuk footer/e-tiket. */
export function BrandIcon({ className }: { className?: string }) {
  return (
    <img src={logoIconUrl} alt="RuteTrip" className={className} draggable={false} />
  );
}

/** Logo penuh RuteTrip (ikon + wordmark + tagline) — pakai file PNG asli, untuk navbar & layar Connect. */
export function BrandLogoImg({ className }: { className?: string }) {
  return (
    <img src={logoSrc} alt="RuteTrip — Plan · Journey · Explore" className={className} draggable={false} />
  );
}
