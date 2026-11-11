# Changelog

## Unreleased

- New `--accent-2` and `--accent-2-soft`: a second accent for each surface, driven by two new dials (`--dial-accent2-hue`, `--dial-accent2-chroma`). Portfolio gets indigo (same hue, more colour), learn plum (triadic), teach raspberry (complement) and build blueprint (complement).
- `code.css`: strings now use the surface's `--accent-2` instead of another surface's accent.
- New utilities `.text-accent-2` and `.bg-accent-2-soft`, and `accent-2` / `accent-2-soft` in the Tailwind preset.
- Style guide: `--accent-2` swatches with live contrast, a second-accent component demo, and the accent-2 dials in the readout.

## v0.1.0 (2026-10-31)

First release, extracted from `portfolio_v3` (`feat/423-token-spine-dialects` plus `feat/423-spine-type-and-contrast`).

- The token spine: five `--dial-*` variables drive the surfaces, text, borders, accent, status colours and shadows for four surfaces in light and dark mode.
- Fonts: Plus Jakarta Sans (`--font-sans`), Fraunces (`--font-display`, used for headings on teach) and JetBrains Mono (`--font-mono`).
- `--border-strong` raised to at least 3:1 on every background, so it works as a form-control edge.
- Learn's accent described as ochre (hue 72); the colour itself is unchanged.
- `index.html`: a style guide for GitHub Pages showing every token, type style and component on all four surfaces in light and dark, with live contrast ratios.
- New `--dial-*` cross-surface accents, `utilities.css`, `code.css` (Shiki css-variables colours), `theme-init.js` and a Tailwind preset.
