# Dialects

The token spine behind developingdvlpr.com: **one token layer, four dialects.**

Every surface (portfolio, learn, teach, build) uses the same token names and the same classes. A surface looks different only because a handful of `--dial-*` variables change underneath it: the font, the density, and the accent colours. Light and dark mode reuse the same dials with the lightness flipped.

**See it:** the style guide shows every token, type style and component on all four surfaces, in light and dark, with live contrast ratios: **https://nerajno.github.io/dvlpr-dialects/** (built from `index.html`).

- [Surfaces](#surfaces)
- [Install](#install)
- [Use](#use)
- [Tokens](#tokens)
- [Rules of thumb](#rules-of-thumb)
- [Add or change a surface](#add-or-change-a-surface)
- [Releasing](#releasing)

## Surfaces

| Surface | Persona | Font | Density | Accent | Second accent |
|---|---|---|---|---|---|
| `portfolio` (default) | the front door | Plus Jakarta Sans | 1.125× | near-neutral violet (hue 265) | indigo (hue 265) |
| `learn` | the notebook | JetBrains Mono | 0.875× | ochre (hue 72) | plum (hue 312) |
| `teach` (blog, slides) | the lecture | Plus Jakarta Sans, Fraunces headings | 1× | chalkboard teal (hue 168) | raspberry (hue 350) |
| `build` | the workbench | JetBrains Mono | 0.875× | workshop orange (hue 38) | blueprint (hue 225) |

### The dials

Each surface sets these on `<html data-surface="…">`. Everything else in `tokens.css` is derived from them.

| Dial | Controls |
|---|---|
| `--dial-type-scale` | Density. Scales the root font size, so every `rem` (type and spacing) follows. |
| `--dial-font` | `sans` or `mono`. Documents which face the surface uses; `--font-body` and `--font-heading` do the switching. |
| `--dial-accent-hue` | Hue of `--accent`, and the tint in every background, text, border and shadow token. |
| `--dial-accent-chroma` | How saturated `--accent` is (0.03 near-gray → 0.16 vivid). |
| `--dial-accent-light` | Lightness of `--accent` in light mode. Dark mode adds to it. |
| `--dial-accent2-hue` | Hue of `--accent-2`. |
| `--dial-accent2-chroma` | How saturated `--accent-2` is. |

### Second accent

Each surface's second accent was picked with a colour-theory rule against its main accent:

| Surface | Rule |
|---|---|
| `portfolio` | Monochrome: same hue, more colour. Portfolio's main accent is near-gray, so the second one is where its colour comes from. |
| `learn` | Triadic: a plum highlighter on an ochre notebook. |
| `teach` | Complement: pink chalk on a teal chalkboard. |
| `build` | Complement: blueprint blue against safety orange. Chroma is capped at 0.09 to stay inside sRGB. |

> `--accent-2` is new since v0.1.0 and ships in the next tagged release.

## Install

The package is named `@nerajno/dialects` and installs from a tagged GitHub release:

```bash
npm i github:Nerajno/dvlpr-dialects#v0.1.0
```

**Browser support:** the tokens use `oklch()` with `calc()` inside it, so they need a current evergreen browser. There's no fallback for older ones.

## Use

### 1. Stylesheets

Import once per site, in this order:

```css
@import "@nerajno/dialects/fonts.css";      /* Jakarta, Fraunces, JetBrains Mono (self-hosted) */
@import "@nerajno/dialects/tokens.css";     /* the spine */
@import "@nerajno/dialects/utilities.css";  /* skip if you use the Tailwind preset */
@import "@nerajno/dialects/code.css";       /* optional: syntax colours */
```

### 2. Theme and surface, before first paint

Inline `theme-init.js` in `<head>` and name the surface on the script tag. Inlining it (not loading it as a file) is what stops a flash of the wrong theme.

```astro
---
import themeInit from "@nerajno/dialects/theme-init.js?raw";
---
<script is:inline data-surface="teach" set:html={themeInit}></script>
```

It sets `.light` or `.dark` (from the saved choice, then the system setting), plus `data-theme` and `data-surface`, on `<html>`. A missing or unknown surface falls back to `portfolio`.

### 3. Base styles

Read the semantic tokens, never raw colours:

```css
body { background: var(--bg); color: var(--text-body); font-family: var(--font-body); }
h1, h2, h3, h4, h5, h6 { font-family: var(--font-heading); color: var(--text-strong); }
a { color: var(--accent); }
a:hover { color: var(--accent-hover); }
:focus-visible { outline: 2px solid var(--focus); outline-offset: 2px; }
```

### 4. A dark-mode toggle

`theme-init.js` reads the choice from `localStorage` under the key `theme`, so a toggle only has to write the same key and swap the class:

```js
function setTheme(mode) { // "light" | "dark"
  const html = document.documentElement;
  html.classList.remove("light", "dark");
  html.classList.add(mode);
  html.setAttribute("data-theme", mode);
  try { localStorage.setItem("theme", mode); } catch {}
}
```

### Tailwind (optional, v3.4+)

The preset gives the same class names as `utilities.css`, plus Tailwind variants such as `hover:` and `md:`. It leaves Tailwind's own radius and shadow scales alone.

```js
// tailwind.config.cjs
module.exports = { presets: [require("@nerajno/dialects/tailwind-preset")], /* … */ };
```

| Classes | Token |
|---|---|
| `bg-surface` `bg-surface-alt` `bg-surface-card` `bg-elevated` | backgrounds |
| `text-strong` `text-body` `text-soft` `text-muted` | text |
| `text-accent` `bg-accent` `bg-accent-soft` | `--accent` |
| `text-accent-2` `bg-accent-2-soft` | `--accent-2` |
| `border-surface` `border-surface-strong` | borders |
| `shadow-card` `shadow-card-lg` | shadows |

Values are CSS variables, so Tailwind's opacity modifiers (`bg-accent/50`) don't work. Use the `-soft` tokens instead.

### Code blocks (Astro)

Set `markdown.shikiConfig = { theme: "css-variables" }` and import `code.css`. Keywords take the surface's accent, strings take its `--accent-2`, and functions and constants take other surfaces' accents, so no two roles share a colour.

### No build step (Jekyll and other static sites)

Link the files from jsDelivr at a pinned tag, load the fonts from Google Fonts (`fonts.css` needs a bundler to resolve its packages), then add the `<script>` from step 2 inline with the contents of `theme-init.js`:

```html
<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Fraunces:opsz,wght@9..144,400..800&family=JetBrains+Mono:wght@400;500;700&family=Plus+Jakarta+Sans:wght@400..800&display=swap">
<link rel="stylesheet" href="https://cdn.jsdelivr.net/gh/Nerajno/dvlpr-dialects@v0.1.0/tokens.css">
<link rel="stylesheet" href="https://cdn.jsdelivr.net/gh/Nerajno/dvlpr-dialects@v0.1.0/utilities.css">
<link rel="stylesheet" href="https://cdn.jsdelivr.net/gh/Nerajno/dvlpr-dialects@v0.1.0/code.css">
```

## Tokens

| Group | Tokens |
|---|---|
| Surfaces | `--bg` `--bg-alt` `--bg-card` `--bg-elevated` |
| Text | `--text-strong` `--text-body` `--text-soft` `--text-muted` |
| Borders | `--border` (decorative hairline) · `--border-strong` (control edges, ≥3:1) |
| Accent | `--accent` `--accent-hover` `--accent-soft` `--focus` |
| Second accent | `--accent-2` `--accent-2-soft` |
| Cross-surface | `--dial-portfolio` `--dial-learn` `--dial-teach` `--dial-build` |
| Status | `--success` `--warning` `--danger` `--info`, each with a `-soft` version |
| Fonts | `--font-body` `--font-heading` (resolved per surface) · `--font-sans` `--font-display` `--font-mono` |
| Shape | `--radius-sm` 4 · `--radius-md` 8 · `--radius-lg` 12 · `--radius-xl` 16 |
| Elevation | `--shadow-sm` `--shadow-md` `--shadow-lg` (tinted with the surface hue) |
| Motion | `--transition-fast` `--transition-normal` `--transition-slow` |

The cross-surface tokens are each surface's accent, pinned so any page can point at another surface: "read this on learn" links, surface switchers, and the code colours.

### Contrast

- All four text tokens and `--accent` reach at least 4.5:1 on `--bg`, `--bg-alt` and `--bg-card` in every surface and mode.
- `--accent-2` reaches at least 5.2:1 on every background in light mode and 7.2:1 in dark, and at least 4.9:1 on `--accent-2-soft`.
- `--border-strong` reaches at least 3:1 on every background.
- `--border` is decorative only, at about 1.3:1.
- In dark mode, `--accent-soft` doesn't hold body text (the best text token reaches about 3.8:1), so use it only as a fill there.

## Rules of thumb

- **One action colour.** Links, buttons and focus rings use `--accent`. `--accent-2` is for supporting details: tags, highlights, code strings, a second chart series.
- **Put `--accent-2` text on `--accent-2-soft`**, not on `--accent-soft`.
- **Status needs more than colour.** Three surface accents sit close to a status hue (build's orange near danger, learn's ochre near warning, teach's teal near success), so always pair a status colour with a label or icon.
- **Never hard-code a colour.** If a token is missing, add it to the spine rather than to one site.

## Add or change a surface

A surface is just a block of dials in `tokens.css`:

```css
:root[data-surface="notes"] {
  --dial-font: sans;
  --dial-type-scale: 1;
  --dial-accent-hue: 300;
  --dial-accent-chroma: 0.1;
  --dial-accent-light: 0.48;
  --dial-accent2-hue: 120;
  --dial-accent2-chroma: 0.1;
}
```

Then:

1. If it uses mono, add it to the `--font-body` / `--font-heading` mono block in `tokens.css`.
2. Add a `--dial-<name>` cross-surface accent for light and dark.
3. Add the name to the `SURFACES` list in `theme-init.js` and to the style guide's switcher in `index.html`.
4. Open the style guide in that surface, in both modes, and check every contrast badge still meets the numbers above. Keep the new hues at least 30° away from the other surfaces' accents and the status hues (27, 85, 152, 230).

## Releasing

1. Change the CSS and check the style guide in all four surfaces, light and dark.
2. Move the **Unreleased** entries in `CHANGELOG.md` under the new version.
3. Bump `version` in `package.json` and the `#v…` / `@v…` tags in this README.
4. Commit, then tag and push: `git tag v0.2.0 && git push --tags`.

Each site upgrades by changing the tag in its install string. The style guide is served by GitHub Pages from `main` (root folder).
