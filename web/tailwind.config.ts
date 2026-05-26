import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        // AI agent palette: violet + cyan on deep navy
        violet: {
          400: "#a78bfa",
          500: "#8b5cf6",
          600: "#7c3aed",
        },
        accent: {
          300: "#67e8f9",
          400: "#22d3ee",
          500: "#06b6d4",
          600: "#0891b2",
        },
        magenta: {
          400: "#e879f9",
          500: "#d946ef",
          600: "#c026d3",
        },
      },
      fontFamily: {
        sans: ["var(--font-geist-sans)", "system-ui", "sans-serif"],
        mono: ["var(--font-geist-mono)", "ui-monospace", "monospace"],
        // Display serif used for the "Heirloom" wordmark + select hero
        // accents. Falls back to platform serifs if the web font is
        // still loading or blocked.
        display: ["var(--font-italiana)", "Georgia", "serif"],
      },
      backdropBlur: {
        xs: "4px",
      },
      boxShadow: {
        glow: "0 0 60px -10px rgba(139, 92, 246, 0.5)",
        "glow-lg": "0 0 100px -20px rgba(139, 92, 246, 0.6)",
        "glow-cyan": "0 0 60px -10px rgba(34, 211, 238, 0.5)",
        card: "0 8px 32px rgba(0, 0, 0, 0.4)",
      },
      animation: {
        "aurora-1": "aurora1 22s ease-in-out infinite alternate",
        "aurora-2": "aurora2 28s ease-in-out infinite alternate",
        "aurora-3": "aurora3 35s ease-in-out infinite alternate",
        float: "float 6s ease-in-out infinite",
        "pulse-soft": "pulseSoft 3s ease-in-out infinite",
        shimmer: "shimmer 2.5s linear infinite",
        "fade-in": "fadeIn 0.6s ease-out forwards",
        "spin-slow": "spin 12s linear infinite",
      },
      keyframes: {
        aurora1: {
          "0%": { transform: "translate(0%, 0%) scale(1)" },
          "100%": { transform: "translate(15%, 20%) scale(1.15)" },
        },
        aurora2: {
          "0%": { transform: "translate(0%, 0%) scale(1)" },
          "100%": { transform: "translate(-15%, -10%) scale(1.1)" },
        },
        aurora3: {
          "0%": { transform: "translate(0%, 0%) scale(1)" },
          "100%": { transform: "translate(-10%, 25%) scale(0.92)" },
        },
        float: {
          "0%, 100%": { transform: "translateY(0px)" },
          "50%": { transform: "translateY(-12px)" },
        },
        pulseSoft: {
          "0%, 100%": { opacity: "0.6" },
          "50%": { opacity: "1" },
        },
        shimmer: {
          "0%": { backgroundPosition: "-200% 0" },
          "100%": { backgroundPosition: "200% 0" },
        },
        fadeIn: {
          from: { opacity: "0", transform: "translateY(8px)" },
          to: { opacity: "1", transform: "translateY(0)" },
        },
      },
    },
  },
  plugins: [],
};

export default config;
