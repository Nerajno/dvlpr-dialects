/** developingdvlpr token spine — Tailwind preset.
 *  Gives the same class names as utilities.css (bg-surface, text-strong,
 *  border-surface-strong, shadow-card…) plus Tailwind variants (hover:, md:…).
 *  Usage: module.exports = { presets: [require("@nerajno/dialects/tailwind-preset")], … }
 *  The .status pill (with its marker shapes) lives in utilities.css; import it
 *  alongside the preset if you want it.
 *  Note: values are CSS variables, so opacity modifiers (bg-accent/50) don't apply.
 *  @type {import('tailwindcss').Config} */
module.exports = {
  darkMode: "class",
  theme: {
    extend: {
      colors: {
        surface: "var(--bg)",
        "surface-alt": "var(--bg-alt)",
        "surface-card": "var(--bg-card)",
        "surface-strong": "var(--border-strong)",
        elevated: "var(--bg-elevated)",
        strong: "var(--text-strong)",
        body: "var(--text-body)",
        soft: "var(--text-soft)",
        muted: "var(--text-muted)",
        accent: "var(--accent)",
        "accent-hover": "var(--accent-hover)",
        "accent-soft": "var(--accent-soft)",
        "accent-2": "var(--accent-2)",
        "accent-2-soft": "var(--accent-2-soft)",
        success: "var(--success)",
        warning: "var(--warning)",
        danger: "var(--danger)",
        info: "var(--info)",
        "on-success": "var(--on-success)",
        "on-warning": "var(--on-warning)",
        "on-danger": "var(--on-danger)",
        "on-info": "var(--on-info)",
      },
      borderColor: {
        surface: "var(--border)",
        "surface-strong": "var(--border-strong)",
      },
      fontFamily: {
        body: "var(--font-body)",
        heading: "var(--font-heading)",
        sans: "var(--font-sans)",
        display: "var(--font-display)",
        mono: "var(--font-mono)",
      },
      boxShadow: {
        card: "var(--shadow-md)",
        "card-lg": "var(--shadow-lg)",
      },
      transitionDuration: { fast: "150ms", normal: "200ms", slow: "300ms" },
    },
  },
};
