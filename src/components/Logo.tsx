import React from "react";
// File PNG logo penuh (ikon + wordmark "RuteTrip" + tagline) — dipakai di topbar & layar Connect.
import logoSrc from "../assets/logo.png";

/**
 * Logo RuteTrip.
 * BrandLogoImg = logo penuh (ikon + wordmark "RuteTrip" + tagline) dalam satu kesatuan.
 *                Dipakai di topbar (navbar) & layar Connect. Pakai gambar utuh, jadi tidak pernah terpotong.
 */

/** Logo penuh RuteTrip (ikon + wordmark "RuteTrip" + tagline) — untuk topbar & layar Connect. */
export function BrandLogoImg({ className }: { className?: string }) {
  return (
    <img src={logoSrc} alt="RuteTrip — Plan · Journey · Explore" className={className} draggable={false} style={{ objectFit: "contain" }} />
  );
}
