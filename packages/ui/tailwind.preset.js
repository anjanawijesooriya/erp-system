/** Shared Tailwind preset — extend this from each app's tailwind.config. */
module.exports = {
  theme: {
    extend: {
      colors: {
        // Primary brand scale (indigo-leaning blue) — used for CTAs, active
        // nav states, focus rings, and the auth-page gradient panel.
        brand: {
          50: "#eef2ff",
          100: "#e0e7ff",
          200: "#c7d2fe",
          300: "#a5b4fc",
          400: "#818cf8",
          500: "#6366f1",
          600: "#4f46e5",
          700: "#4338ca",
          800: "#3730a3",
          900: "#312e81",
          950: "#1e1b4b",
        },
        // Accent (teal/emerald) — reserved for success states, POS/sales
        // highlights, and secondary CTAs that need to stand apart from the
        // primary brand color.
        accent: {
          50: "#ecfdf5",
          400: "#34d399",
          500: "#10b981",
          600: "#059669",
          700: "#047857",
        },
        // Semantic status colors — exact hexes from the Vertex ERP design
        // mockups (design-mockups/*.html), used by Badge's tone mapping so
        // every status pill across the app reads the same four colors.
        success: {
          50: "#EFFBEF",
          100: "#D4EED4",
          500: "#2DBE8C",
          600: "#1F9A6E",
          700: "#15803D",
        },
        warning: {
          50: "#FFF4E5",
          100: "#FDE8C8",
          500: "#F5A524",
          600: "#C77D10",
          700: "#B45309",
        },
        danger: {
          50: "#FDEAEA",
          100: "#FAD4D2",
          500: "#E2574C",
          600: "#CB4038",
          700: "#C0362C",
        },
        info: {
          50: "#E8F2FE",
          100: "#D3E7FD",
          500: "#3B82F6",
          600: "#2563CE",
          700: "#1D6FD1",
        },
      },
      fontFamily: {
        sans: ["var(--font-sans)", "ui-sans-serif", "system-ui", "sans-serif"],
      },
    },
  },
};
