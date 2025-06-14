// tailwind.config.ts
import type { Config } from "tailwindcss";

const config: Config = {
  content: ["./src/**/*.{js,ts,jsx,tsx,mdx}"],
  theme: {
    extend: {
      colors: {
        primary: {
          DEFAULT: "#2563eb", // azul-600
          hover: "#1d4ed8",   // azul-700
          ring: "#3b82f6",    // azul-500
        },
        secondary: {
          DEFAULT: "#e5e7eb", // gray-200
          text: "#1f2937",    // gray-800
          hover: "#d1d5db",   // gray-300
        },
        danger: {
          DEFAULT: "#dc2626", // red-600
          hover: "#b91c1c",   // red-700
        },
        info: {
          bg: "#dbeafe",      // blue-100
          text: "#1e40af",    // blue-800
          border: "#93c5fd",  // blue-300
        },
        success: {
          bg: "#d1fae5",      // green-100
          text: "#065f46",    // green-800
          border: "#6ee7b7",  // green-300
        },
        warning: {
          bg: "#fef9c3",      // yellow-100
          text: "#92400e",    // yellow-800
          border: "#fde68a",  // yellow-300
        },
        error: {
          bg: "#fee2e2",      // red-100
          text: "#991b1b",    // red-800
          border: "#fca5a5",  // red-300
        },
        muted: {
          DEFAULT: "#f3f4f6", // gray-100
          text: "#6b7280",    // gray-500
          border: "#d1d5db",  // gray-300
        },
      },
    },
  },
  plugins: [],
};

export default config;
