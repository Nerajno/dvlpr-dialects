# Changelog

## v0.1.0 (2026-10-31)

First release, extracted from `portfolio_v3` (`feat/423-token-spine-dialects` plus `feat/423-spine-type-and-contrast`).

- The token spine: five `--dial-*` variables drive the surfaces, text, borders, accent, status colours and shadows for four surfaces in light and dark mode.
- Fonts: Plus Jakarta Sans (`--font-sans`), Fraunces (`--font-display`, used for headings on teach) and JetBrains Mono (`--font-mono`).
- `--border-strong` raised to at least 3:1 on every background, so it works as a form-control edge.
- Learn's accent described as ochre (hue 72); the colour itself is unchanged.
- `index.html`: a style guide for GitHub Pages showing every token, type style and component on all four surfaces in light and dark, with live contrast ratios.
- New `--dial-*` cross-surface accents, `utilities.css`, `code.css` (Shiki css-variables colours), `theme-init.js` and a Tailwind preset.
