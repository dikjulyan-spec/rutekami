import React from "react";
// File PNG logo penuh (ikon + wordmark "RuteTrip" + tagline) — dipakai di topbar & layar Connect.
import logoSrc from "../assets/logo.png";
// File PNG logotype (nama brand "RuteTrip" + tagline) — dipakai di navbar di samping ikon.
import logotypeSrc from "../assets/logotype.png";

/**
 * Logo RuteTrip.
 * BrandLogoImg  = logo penuh (ikon + wordmark "RuteTrip" + tagline) dalam satu kesatuan → layar Connect.
 * BrandLogotype = nama brand "RuteTrip" + tagline → navbar (di samping ikon).
 * Keduanya pakai gambar utuh (object-fit: contain), tidak pernah terpotong.
 */

/** Logo penuh RuteTrip (ikon + wordmark "RuteTrip" + tagline) — untuk layar Connect. */
export function BrandLogoImg({ className }: { className?: string }) {
  return (
    <img src={logoSrc} alt="RuteTrip — Plan · Journey · Explore" className={className} draggable={false} style={{ objectFit: "contain" }} />
  );
}

/** Nama brand "RuteTrip" + tagline (logotype) — untuk navbar di samping ikon. */
export function BrandLogotype({ className }: { className?: string }) {
  return (
    <img src={logotypeSrc} alt="RuteTrip — Plan · Journey · Explore" className={className} draggable={false} style={{ objectFit: "contain" }} />
  );
}
