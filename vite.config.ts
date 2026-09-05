import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

// Travondo Platform — build statis React + Vite 6 (target Cloudflare Pages).
// base: "./" => seluruh referensi aset relatif sehingga hasil /dist bisa
// disajikan di subpath mana pun (Cloudflare Pages root maupun platform ini).
export default defineConfig({
  plugins: [react()],
  base: "./",
  build: {
    target: "es2020",
    outDir: "dist",
    sourcemap: false,
  },
});
