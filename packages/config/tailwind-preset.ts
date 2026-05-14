import type { Config } from "tailwindcss";

/**
 * Shared Tailwind preset.
 *
 * Theme tokens (deep navy gradient, cyan→violet accent, glassmorphism, status colors)
 * will be wired up in the UI theme milestone. For now this only fixes the font
 * families so consuming apps inherit Inter (body) and Space Grotesk (display).
 */
const preset: Partial<Config> = {
  darkMode: "class",
  theme: {
    extend: {
      fontFamily: {
        sans: ["var(--font-inter)", "Inter", "system-ui", "sans-serif"],
        display: ["var(--font-space-grotesk)", "Space Grotesk", "sans-serif"],
      },
    },
  },
};

export default preset;
