/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        bg: "#050507",
        surface: "#0d0d12",
        "surface-2": "#15151d",
        text: "#f7f7f7",
        purple: "#7c3cff",
        yellow: "#ffd21f",
      },
      fontFamily: {
        sans: ["Inter", "Arial", "sans-serif"],
      },
      boxShadow: {
        glow: "0 0 70px rgba(124, 60, 255, 0.35)",
      },
    },
  },
  plugins: [],
};
