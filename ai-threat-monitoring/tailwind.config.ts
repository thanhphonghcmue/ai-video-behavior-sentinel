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
          red: "#D70018",      // Sentinel Alert Crimson Red
          darkRed: "#B30013",  // Deep Crimson Red Hover/Alert
          lightRed: "#FFF1F2", // Crimson Tint / Soft Alert Background
          grayBg: "#F4F6F8",   // Neutral soft background
          border: "#E5E7EB",   // Sleek subtle border
          dark: "#111827",     // High-contrast primary text
          muted: "#6B7280",    // Secondary text
        },
        threat: {
          low: "#10B981",       // Safe Green (<50%)
          medium: "#F59E0B",    // Suspicious Amber (50-80%)
          critical: "#D70018",  // High Danger Alert Red (>80%)
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
