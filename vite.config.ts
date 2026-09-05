import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import { fileURLToPath, URL } from "node:url";

// RuteTrip Platform — MPA (multi-page app), build statis untuk Cloudflare Pages.
// Ada 5 halaman HTML entry (masing-masing = satu portal) + home launcher.
// base: "./" & relative asset => hasil /dist bisa disajikan di subpath mana pun
// (Cloudflare Pages root maupun platform ini).
export default defineConfig({
  plugins: [react()],
  base: "./",
  build: {
    target: "es2020",
    outDir: "dist",
    sourcemap: false,
    rollupOptions: {
      input: {
        main: fileURLToPath(new URL("./index.html", import.meta.url)),
        booking: fileURLToPath(new URL("./booking.html", import.meta.url)),
        partner: fileURLToPath(new URL("./partner.html", import.meta.url)),
        admin: fileURLToPath(new URL("./admin.html", import.meta.url)),
        driver: fileURLToPath(new URL("./driver.html", import.meta.url)),
      },
    },
  },
});
