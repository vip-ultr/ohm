import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  darkMode: "class",
  theme: {
    extend: {
      colors: {
        green: {
          DEFAULT: "#03A338",
          dim: "#027a2a",
          glow: "rgba(3, 163, 56, 0.18)",
          subtle: "rgba(3, 163, 56, 0.08)",
        },
        brand: {
          bg: "#000000",
          bg2: "#0a0a0a",
          bg3: "#111111",
          bg4: "#181818",
          border: "#1a1a1a",
          text: "#e0e0e0",
          muted: "#555555",
        },
      },
      fontFamily: {
        sans: ["Rajdhani", "Futura", "Century Gothic", "Arial", "sans-serif"],
        mono: ["'Share Tech Mono'", "monospace"],
      },
      animation: {
        "pulse-dot": "pulseDot 2s ease-in-out infinite",
        "fade-in": "fadeIn 0.3s ease forwards",
        "slide-up": "slideUp 0.4s ease forwards",
      },
      keyframes: {
        pulseDot: {
          "0%, 100%": { opacity: "1", transform: "scale(1)" },
          "50%": { opacity: "0.4", transform: "scale(0.8)" },
        },
        fadeIn: {
          from: { opacity: "0" },
          to: { opacity: "1" },
        },
        slideUp: {
          from: { opacity: "0", transform: "translateY(16px)" },
          to: { opacity: "1", transform: "translateY(0)" },
        },
      },
    },
  },
  plugins: [],
};
export default config;
