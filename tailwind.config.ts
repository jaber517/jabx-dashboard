import type { Config } from "tailwindcss";

const config: Config = {
  darkMode: ["class"],
  content: [
    "./app/**/*.{ts,tsx}",
    "./components/**/*.{ts,tsx}",
    "./features/**/*.{ts,tsx}",
    "./lib/**/*.{ts,tsx}"
  ],
  theme: {
    extend: {
      colors: {
        background: "hsl(var(--background))",
        foreground: "hsl(var(--foreground))",
        muted: "hsl(var(--muted))",
        "muted-foreground": "hsl(var(--muted-foreground))",
        border: "hsl(var(--border))",
        surface: "hsl(var(--surface))",
        "surface-elevated": "hsl(var(--surface-elevated))",
        primary: "hsl(var(--primary))",
        "primary-strong": "hsl(var(--primary-strong))",
        "primary-foreground": "hsl(var(--primary-foreground))",
        success: "hsl(var(--success))",
        warning: "hsl(var(--warning))",
        danger: "hsl(var(--danger))",
        ring: "hsl(var(--ring))",
        // Status, priority and category hues; each has a light and a dark
        // value in globals.css so text stays at 4.5:1 in both themes.
        tone: {
          blue: "hsl(var(--tone-blue))",
          green: "hsl(var(--tone-green))",
          amber: "hsl(var(--tone-amber))",
          red: "hsl(var(--tone-red))",
          violet: "hsl(var(--tone-violet))",
          pink: "hsl(var(--tone-pink))",
          slate: "hsl(var(--tone-slate))"
        }
      },
      // Brand guide: 12-16px corners on cards and buttons.
      borderRadius: {
        lg: "0.5rem",
        xl: "0.625rem",
        "2xl": "0.75rem",
        "3xl": "1rem"
      },
      // Brand guide: cards carry a 1px border and no drop shadow.
      boxShadow: {
        soft: "none",
        glass: "none"
      },
      transitionTimingFunction: {
        // A critically-damped decelerate curve — the default "response" feel
        // for anything that isn't gesture-driven momentum.
        spring: "cubic-bezier(0.22, 1, 0.36, 1)",
        // A touch of overshoot, reserved for interactions that carry real
        // momentum (drag release, flick) rather than plain fades/pops.
        "spring-bounce": "cubic-bezier(0.34, 1.56, 0.64, 1)"
      },
      keyframes: {
        float: {
          "0%, 100%": { transform: "translateY(0px)" },
          "50%": { transform: "translateY(-6px)" }
        },
        pulseSoft: {
          "0%, 100%": { opacity: "0.85" },
          "50%": { opacity: "1" }
        },
        overlayIn: {
          from: { opacity: "0" },
          to: { opacity: "1" }
        },
        overlayOut: {
          from: { opacity: "1" },
          to: { opacity: "0" }
        },
        materializeIn: {
          from: { opacity: "0", transform: "translateY(10px) scale(0.96)" },
          to: { opacity: "1", transform: "translateY(0) scale(1)" }
        },
        materializeOut: {
          from: { opacity: "1", transform: "translateY(0) scale(1)" },
          to: { opacity: "0", transform: "translateY(6px) scale(0.97)" }
        },
        dropIn: {
          from: { opacity: "0", transform: "translateY(-8px) scale(0.98)" },
          to: { opacity: "1", transform: "translateY(0) scale(1)" }
        },
        dropOut: {
          from: { opacity: "1", transform: "translateY(0) scale(1)" },
          to: { opacity: "0", transform: "translateY(-6px) scale(0.98)" }
        }
      },
      animation: {
        float: "float 7s ease-in-out infinite",
        pulseSoft: "pulseSoft 3s ease-in-out infinite",
        "overlay-in": "overlayIn 200ms cubic-bezier(0.22, 1, 0.36, 1) forwards",
        "overlay-out": "overlayOut 160ms cubic-bezier(0.4, 0, 1, 1) forwards",
        "materialize-in": "materializeIn 260ms cubic-bezier(0.22, 1, 0.36, 1) forwards",
        "materialize-out": "materializeOut 160ms cubic-bezier(0.4, 0, 1, 1) forwards",
        "drop-in": "dropIn 220ms cubic-bezier(0.22, 1, 0.36, 1) forwards",
        "drop-out": "dropOut 150ms cubic-bezier(0.4, 0, 1, 1) forwards"
      }
    }
  },
  plugins: []
};

export default config;
