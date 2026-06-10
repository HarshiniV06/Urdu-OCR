/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{js,jsx}"],
  theme: {
    extend: {
      colors: {
        ink: { DEFAULT: "#070605", light: "#12100e", card: "#161311" },
        gold: { DEFAULT: "#d4a017", light: "#f0c75a", dim: "#8a6914" },
        emerald: { DEFAULT: "#10b981", light: "#6ee7b7", dim: "#064e3b" },
        parchment: "#f5f0e8",
      },
      fontFamily: {
        display: ["'Playfair Display'", "Georgia", "serif"],
        sans: ["'DM Sans'", "system-ui", "sans-serif"],
        urdu: ["'Noto Nastaliq Urdu'", "serif"],
      },
      boxShadow: {
        card: "0 8px 32px rgba(0,0,0,0.35), inset 0 1px 0 rgba(255,255,255,0.05)",
        "card-lg": "0 24px 64px rgba(0,0,0,0.45), inset 0 1px 0 rgba(255,255,255,0.06)",
        glow: "0 0 40px rgba(212, 160, 23, 0.25)",
      },
      backgroundImage: {
        mesh: "radial-gradient(at 40% 20%, rgba(16,185,129,0.12) 0px, transparent 50%), radial-gradient(at 80% 0%, rgba(212,160,23,0.1) 0px, transparent 50%), radial-gradient(at 0% 50%, rgba(16,185,129,0.08) 0px, transparent 50%)",
      },
    },
  },
  plugins: [],
};
