/** @type {import('tailwindcss').Config} */
export default {
  darkMode: "class",
  content: ["./index.html", "./src/**/*.{ts,tsx}"],
  theme: {
    extend: {
      fontFamily: {
        sans: [
          "Plus Jakarta Sans",
          "Inter",
          "ui-sans-serif",
          "system-ui",
          "-apple-system",
          "Segoe UI",
          "Roboto",
          "Helvetica Neue",
          "Arial",
          "sans-serif",
        ],
      },
      colors: {
        // Palet brand RuteTrip: navy pekat (Rute) + teal/turquoise (Trip)
        cream: "#F3F8FC", // off-white dingin, pengganti cream hangat
        navy: {
          50: "#EAF1F9",
          100: "#D2E2F1",
          200: "#A6C6E1",
          300: "#6F9FC9",
          400: "#3A6FA0",
          500: "#1C4F78",
          600: "#153E63",
          700: "#0F2F4E",
          800: "#0A2339",
          900: "#061729",
        },
        teal: {
          50: "#E6F7F6",
          100: "#C4ECEA",
          200: "#8DDBD8",
          300: "#54C4C0",
          400: "#21AAA6",
          500: "#0E9A96",
          600: "#0A807D",
          700: "#086B69",
          800: "#075554",
          900: "#074643",
        },
        // brand = navy (aksi utama); leaf = teal (aksen sekunder)
        brand: {
          50: "#EAF1F9",
          100: "#D2E2F1",
          200: "#A6C6E1",
          300: "#6F9FC9",
          400: "#3A6FA0",
          500: "#1C4F78",
          600: "#153E63",
          700: "#0F2F4E",
          800: "#0A2339",
          900: "#061729",
        },
        leaf: {
          50: "#E6F7F6",
          100: "#C4ECEA",
          200: "#8DDBD8",
          300: "#54C4C0",
          400: "#21AAA6",
          500: "#0E9A96",
          600: "#0A807D",
          700: "#086B69",
          800: "#075554",
          900: "#074643",
        },
        // lagoon = navy gelap (heading, section gelap, tombol dark)
        lagoon: {
          50: "#EAF1F9",
          100: "#D2E2F1",
          200: "#A6C6E1",
          300: "#6F9FC9",
          400: "#3A6FA0",
          500: "#1C4F78",
          600: "#153E63",
          700: "#0F2F4E",
          800: "#0A2339",
          900: "#061729",
        },
      },
      boxShadow: {
        warm: "0 8px 30px rgb(20 82 110 / 0.12)",
        "warm-lg": "0 24px 60px -18px rgb(20 82 110 / 0.30)",
        card: "0 6px 24px -8px rgb(15 40 62 / 0.10)",
        "card-lg": "0 24px 50px -20px rgb(15 40 62 / 0.22)",
      },
      backgroundImage: {
        "hero-warm":
          "radial-gradient(900px 420px at 12% -8%, rgb(226 240 249 / 0.95), transparent 60%), radial-gradient(800px 420px at 92% 4%, rgb(196 236 234 / 0.95), transparent 55%), radial-gradient(640px 420px at 55% 110%, rgb(210 226 241 / 0.8), transparent 60%)",
      },
    },
  },
  plugins: [],
};
