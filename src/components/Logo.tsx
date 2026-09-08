import React from "react";
// File PNG logo — dipakai di topbar, footer, e-tiket & layar Connect.
import logoSrc from "../assets/logo.png";

/**
 * Logo RuteTrip — satu logo saja (dipakai di semua tempat).
 * BrandLogoImg = `<img>` logo (rasio 3.32:1 wordmark nama brand), object-fit contain → tidak terpotong.
 */

/** Logo RuteTrip (nama brand + tagline) — untuk topbar, footer, e-tiket & layar Connect. */
export function BrandLogoImg({ className }: { className?: string }) {
  return (
    <img src={logoSrc} alt="RuteTrip — Plan · Journey · Explore" className={className} draggable={false} style={{ objectFit: "contain" }} />
  );
}
