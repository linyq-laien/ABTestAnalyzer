const { nextui } = require("@nextui-org/react");

/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    './pages/**/*.{js,ts,jsx,tsx,mdx}',
    './components/**/*.{js,ts,jsx,tsx,mdx}',
    './app/**/*.{js,ts,jsx,tsx,mdx}',
    './node_modules/@nextui-org/theme/dist/**/*.{js,ts,jsx,tsx}'
  ],
  theme: {
    extend: {},
  },
  darkMode: "class",
  plugins: [nextui({
    themes: {
      light: {
        colors: {
          primary: {
            50: "#eff6ff",
            100: "#dbeafe",
            200: "#bfdbfe",
            300: "#93c5fd",
            400: "#60a5fa",
            500: "#3b82f6",
            600: "#2563eb",
            700: "#1d4ed8",
            800: "#1e40af",
            900: "#1e3a8a",
            DEFAULT: "#3b82f6",
            foreground: "#ffffff",
          },
          focus: "#3b82f6",
        },
      },
      dark: {
        colors: {
          primary: {
            50: "#0f172a",
            100: "#1e293b",
            200: "#334155",
            300: "#475569",
            400: "#64748b",
            500: "#94a3b8",
            600: "#cbd5e1",
            700: "#e2e8f0",
            800: "#f1f5f9",
            900: "#f8fafc",
            DEFAULT: "#3b82f6",
            foreground: "#ffffff",
          },
          focus: "#3b82f6",
        },
      },
    },
  })],
} 