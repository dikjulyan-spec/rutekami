import React from "react";
// File PNG dari repo — Vite memproses & menghasilkan URL aset yang benar saat build/deploy.
import logoIconUrl from "../assets/icon.png";   // ikon van+pin+panah (kecil, kotak) — topbar/footer/e-tiket
import logoSrc from "../assets/logo.png";       // logo penuh (ikon + wordmark) — layar Connect
import logotypeSrc from "../assets/logotype.png"; // logotype nama brand "RuteTrip" + tagline — topbar

/**
 * Logo RuteTrip.
 * BrandIcon     = ikon van+pin+panah (tanpa teks) kotak 1:1 → topbar/footer/e-tiket.
 * BrandLogotype = logotype nama brand "RuteTrip" + tagline (file PNG asli) → topbar (sebelah ikon).
 * BrandLogoImg  = logo penuh (ikon + wordmark + tagline) → layar Connect.
 */

/** Ikon simbol RuteTrip (van + pin + panah, tanpa teks) — untuk footer/e-tiket. */
export function BrandIcon({ className }: { className?: string }) {
  return (
    <img src={logoIconUrl} alt="RuteTrip" className={className} draggable={false} />
  );
}

/** Logotype nama brand "RuteTrip" + tagline (file PNG asli) — untuk topbar (sebelah ikon). */
export function BrandLogotype({ className }: { className?: string }) {
  return (
    <img src={logotypeSrc} alt="RuteTrip — Plan · Journey · Explore" className={className} draggable={false} />
  );
}

/** Logo penuh RuteTrip (ikon + wordmark + tagline) — pakai file PNG asli, untuk layar Connect. */
export function BrandLogoImg({ className }: { className?: string }) {
  return (
    <img src={logoSrc} alt="RuteTrip — Plan · Journey · Explore" className={className} draggable={false} />
  );
}
