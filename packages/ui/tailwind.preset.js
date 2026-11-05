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
      },
      fontFamily: {
        sans: ["var(--font-sans)", "ui-sans-serif", "system-ui", "sans-serif"],
      },
    },
  },
};
