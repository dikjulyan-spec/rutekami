import React from "react";
// File PNG logo ikon — dari REPO ANDA (mis. Cloudflare Pages build /opt/buildhome/repo/src/assets/logo.png).
// Vite memproses import ini & menghasilkan URL aset yang benar saat build/deploy.
import logoIconUrl from "../assets/logo.png";

/** Ikon simbol RuteTrip (van + pin, tanpa teks) — untuk topbar/footer/e-tiket. */
export function BrandIcon({ className }: { className?: string }) {
  return (
    <img src={logoIconUrl} alt="RuteTrip" className={className} draggable={false} />
  );
}

/** Logo penuh RuteTrip (simbol + wordmark "RuteTrip" + tagline "PLAN · JOURNEY · EXPLORE") — layar besar/Connect. */
export function BrandLogo({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 760 420" width="760" height="420" fill="none" className={className} aria-label="RuteTrip — Plan · Journey · Explore" role="img">
      <defs>
        <linearGradient id="rt-nav" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" stopColor="#153E63" />
          <stop offset="1" stopColor="#0F2F4E" />
        </linearGradient>
        <linearGradient id="rt-teal" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" stopColor="#21AAA6" />
          <stop offset="0.55" stopColor="#0E9A96" />
          <stop offset="1" stopColor="#086B69" />
        </linearGradient>
      </defs>
      <g transform="translate(60 20)">
        <path d="M40 300 C 90 280 130 240 175 210 C 225 178 275 160 335 150" stroke="#8DDBD8" strokeWidth="26" strokeLinecap="round" fill="none" opacity="0.55" />
        <path d="M40 300 C 90 280 130 240 175 210 C 225 178 275 160 335 150" stroke="url(#rt-teal)" strokeWidth="14" strokeLinecap="round" fill="none" />
        <path d="M300 150 L 352 118 M 352 118 L 322 122 M 352 118 L 350 148" stroke="url(#rt-teal)" strokeWidth="20" strokeLinecap="round" strokeLinejoin="round" fill="none" />
        <g transform="translate(352 84)">
          <path d="M0 0 C -24 4 -40 20 -40 42 C -40 66 0 96 0 96 C 0 96 40 66 40 42 C 40 20 24 4 0 0 Z" fill="url(#rt-nav)" />
          <circle cx="0" cy="40" r="22" fill="#E6F7F6" />
          <circle cx="0" cy="40" r="22" fill="#54C4C0" opacity="0.35" />
          <path d="M-9 40 L -3 47 L 10 33" stroke="#153E63" strokeWidth="4.5" strokeLinecap="round" strokeLinejoin="round" fill="none" />
        </g>
        <g transform="translate(-10 128)">
          <path d="M0 70 L 12 70 L 20 48 L 128 48 L 150 62 A 12 12 0 0 1 158 74 L 158 82 A 8 8 0 0 1 150 90 L 148 90 A 10 10 0 0 0 130 90 L 40 90 A 10 10 0 0 0 22 90 L 20 90 A 8 8 0 0 1 12 82 L 12 78 Z" fill="url(#rt-nav)" />
          <path d="M22 88 L 28 54 L 74 54 L 66 88 Z" fill="#D2E2F1" opacity="0.9" />
          <path d="M80 54 L 126 54 L 118 88 L 72 88 Z" fill="#A6C6E1" opacity="0.85" />
          <line x1="76" y1="54" x2="72" y2="88" stroke="#153E63" strokeWidth="2" />
          <rect x="20" y="62" width="8" height="10" rx="2" fill="#E6F7F6" />
          <circle cx="46" cy="90" r="12" fill="#0A2339" />
          <circle cx="46" cy="90" r="6" fill="#8DDBD8" />
          <circle cx="122" cy="90" r="12" fill="#0A2339" />
          <circle cx="122" cy="90" r="6" fill="#8DDBD8" />
          <rect x="152" y="62" width="10" height="9" rx="3" fill="#F3F8FC" />
        </g>
      </g>
      <text x="80" y="330" fontFamily="Plus Jakarta Sans, Inter, system-ui, sans-serif" fontSize="118" fontWeight="800" letterSpacing="-3" fill="#153E63">
        Rute<tspan fill="#0E9A96">Trip</tspan>
      </text>
      <text x="92" y="376" fontFamily="Plus Jakarta Sans, Inter, system-ui, sans-serif" fontSize="26" fontWeight="700" letterSpacing="5.5" fill="#0E9A96">
        PLAN · JOURNEY · EXPLORE
      </text>
    </svg>
  );
}
