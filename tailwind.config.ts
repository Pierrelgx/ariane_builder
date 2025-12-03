import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./app/**/*.{ts,tsx}",
    "./components/**/*.{ts,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        primary: {
          DEFAULT: "#22c55e",
          50: "#f0fdf4",
          100: "#dcfce7",
          200: "#bbf7d0",
          300: "#86efac",
          400: "#4ade80",
          500: "#22c55e",
          600: "#16a34a",
          700: "#15803d",
          800: "#166534",
          900: "#14532d",
        },
        dark: {
          DEFAULT: "#0f0f0f",
          50: "#1a1a1a",
          100: "#1f1f1f",
          200: "#262626",
          300: "#2a2a2a",
          400: "#333333",
          500: "#404040",
          600: "#525252",
          700: "#737373",
          800: "#a3a3a3",
          900: "#e5e5e5",
        },
      },
      fontFamily: {
        sans: ["Inter", "sans-serif"],
      },
    },
  }
};

export default config;
