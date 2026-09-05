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
        // Nuansa travel Indonesia: oranye hangat + hijau segar + cream
        cream: "#FFFBF2",
        brand: {
          50: "#FFF4E6",
          100: "#FFE6C7",
          200: "#FFCB8A",
          300: "#FFAB4D",
          400: "#FF941F",
          500: "#F97316",
          600: "#EA580C",
          700: "#C2410C",
          800: "#9A3412",
          900: "#7C2D12",
        },
        leaf: {
          50: "#ECFDF5",
          100: "#D1FAE5",
          200: "#A7F3D0",
          300: "#6EE7B7",
          400: "#34D399",
          500: "#10B981",
          600: "#059669",
          700: "#047857",
          800: "#065F46",
          900: "#064E3B",
        },
        lagoon: {
          50: "#EFFAF6",
          100: "#D7F0E9",
          200: "#AFE1D3",
          300: "#7CCBB7",
          400: "#4AAE9B",
          500: "#2E9483",
          600: "#22786B",
          700: "#1F6259",
          800: "#1D4F49",
          900: "#1B423E",
        },
      },
      boxShadow: {
        warm: "0 8px 30px rgb(249 115 22 / 0.10)",
        "warm-lg": "0 24px 60px -18px rgb(249 115 22 / 0.28)",
        card: "0 6px 24px -8px rgb(28 25 23 / 0.10)",
        "card-lg": "0 24px 50px -20px rgb(28 25 23 / 0.22)",
      },
      backgroundImage: {
        "hero-warm":
          "radial-gradient(900px 420px at 12% -8%, rgb(255 237 213 / 0.9), transparent 60%), radial-gradient(800px 420px at 92% 4%, rgb(209 250 229 / 0.9), transparent 55%), radial-gradient(640px 420px at 55% 110%, rgb(255 226 196 / 0.75), transparent 60%)",
      },
    },
  },
  plugins: [],
};
