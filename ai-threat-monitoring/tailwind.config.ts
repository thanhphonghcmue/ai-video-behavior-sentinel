import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        brand: {
          blue: "#2563EB",       // Tech Indigo Blue Accent
          blueHover: "#1D4ED8",  // Tech Indigo Blue Dark
          blueLight: "#EFF6FF",  // Tech Indigo Tint Soft
          navy: "#0F172A",       // Deep Corporate Slate Navy (Primary Text/Header)
          slate: "#1E293B",      // Slate Navy 800
          grayBg: "#F8FAFC",     // Soft Neutral Slate Background
          border: "#E2E8F0",     // Sleek subtle border
          dark: "#0F172A",       // High-contrast primary text
          muted: "#64748B",      // Secondary text
        },
        threat: {
          low: "#059669",        // Safe Emerald Green (<40%)
          medium: "#D97706",     // Warning Amber (40-70%)
          critical: "#EA580C",   // High Risk Deep Coral-Orange (>70%)
        }
      },
      animation: {
        'pulse-fast': 'pulse 1.2s cubic-bezier(0.4, 0, 0.6, 1) infinite',
        'radar-sweep': 'radarSweep 4s linear infinite',
      },
      keyframes: {
        radarSweep: {
          '0%': { transform: 'rotate(0deg)' },
          '100%': { transform: 'rotate(360deg)' },
        }
      },
      borderRadius: {
        'pill': '9999px',
      }
    },
  },
  plugins: [],
};
export default config;
