import type { Config } from "tailwindcss";

export default {
  darkMode: ["class"],
  content: [
    "./pages/**/*.{ts,tsx}",
    "./components/**/*.{ts,tsx}",
    "./app/**/*.{ts,tsx}",
    "./src/**/*.{ts,tsx}",
  ],
  prefix: "",
  theme: {
    container: {
      center: true,
      padding: "2rem",
      screens: {
        "2xl": "1400px",
      },
    },
    extend: {
      colors: {
        border: "rgba(255,255,255,0.08)", // softer translucent border
        input: "rgba(255,255,255,0.1)",
        ring: "#00ffa3",
        background: "#0d0d0d", // slightly darker than before
        foreground: "#f5f5f5",

        primary: {
          DEFAULT: "#00ffa3", // Neon emerald accent
          foreground: "#0d0d0d",
          glow: "rgba(0,255,163,0.35)",
        },
        secondary: {
          DEFAULT: "#00bfff", // Electric cyan-blue
          foreground: "#ffffff",
          glow: "rgba(0,191,255,0.35)",
        },
        destructive: {
          DEFAULT: "#ef4444",
          foreground: "#ffffff",
        },
        muted: {
          DEFAULT: "rgba(255,255,255,0.08)",
          foreground: "rgba(255,255,255,0.6)", // soft muted text
        },
        accent: {
          DEFAULT: "#00e0ff", // radiant turquoise glow
          foreground: "#ffffff",
          glow: "rgba(0,224,255,0.35)",
        },
        popover: {
          DEFAULT: "rgba(20,20,20,0.75)",
          foreground: "#ffffff",
        },
        card: {
          DEFAULT: "rgba(20,20,20,0.65)", // deeper glass — no white tint
          foreground: "#fafafa",
        },
        sidebar: {
          DEFAULT: "rgba(15,15,15,0.9)",
          foreground: "#eaeaea",
          primary: "#00ffa3",
          "primary-foreground": "#0f0f0f",
          accent: "#00bfff",
          "accent-foreground": "#ffffff",
          border: "rgba(255,255,255,0.05)",
          ring: "#00ffa3",
        },
      },

      fontFamily: {
        sans: ["Inter", "system-ui", "-apple-system", "sans-serif"],
        mono: ["JetBrains Mono", "Fira Code", "monospace"],
      },

      borderRadius: {
        lg: "var(--radius)",
        md: "calc(var(--radius) - 4px)",
        sm: "calc(var(--radius) - 8px)",
        xl: "calc(var(--radius) + 4px)",
        "2xl": "calc(var(--radius) + 8px)",
      },

      keyframes: {
        "accordion-down": {
          from: { height: "0", opacity: "0" },
          to: { height: "var(--radix-accordion-content-height)", opacity: "1" },
        },
        "accordion-up": {
          from: {
            height: "var(--radix-accordion-content-height)",
            opacity: "1",
          },
          to: { height: "0", opacity: "0" },
        },
        "fade-in": {
          from: { opacity: "0" },
          to: { opacity: "1" },
        },
        "slide-up": {
          from: { opacity: "0", transform: "translateY(16px)" },
          to: { opacity: "1", transform: "translateY(0)" },
        },
        "slide-in": {
          from: { opacity: "0", transform: "translateX(-16px)" },
          to: { opacity: "1", transform: "translateX(0)" },
        },
        "scale-in": {
          from: { opacity: "0", transform: "scale(0.95)" },
          to: { opacity: "1", transform: "scale(1)" },
        },
        shimmer: {
          "0%": { backgroundPosition: "-1000px 0" },
          "100%": { backgroundPosition: "1000px 0" },
        },
      },

      animation: {
        "accordion-down": "accordion-down 0.3s ease-out",
        "accordion-up": "accordion-up 0.3s ease-out",
        "fade-in": "fade-in 0.5s ease-out",
        "slide-up": "slide-up 0.5s ease-out",
        "slide-in": "slide-in 0.5s ease-out",
        "scale-in": "scale-in 0.3s ease-out",
        shimmer: "shimmer 2s infinite linear",
      },

      boxShadow: {
        "xl-dark": "0 8px 40px rgba(0, 0, 0, 0.9)",
        "glow-primary": "0 0 25px rgba(0,255,163,0.3)",
        "glow-accent": "0 0 25px rgba(0,224,255,0.25)",
        "inner-glass": "inset 0 1px 0 rgba(255,255,255,0.04)",
      },

      backdropBlur: {
        xs: "2px",
        md: "12px",
        xl: "20px",
      },
    },
  },
  plugins: [require("tailwindcss-animate")],
} satisfies Config;
