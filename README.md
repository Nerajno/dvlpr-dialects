# Dialects

The token spine behind developingdvlpr.com: **one token layer, four dialects.**

Every surface (portfolio, learn, teach, build) uses the same semantic token names and the same classes. A surface looks different only because five `--dial-*` variables change underneath: font, density, and accent hue, saturation and lightness. Light and dark mode reuse the same dials with the lightness inverted.

| Surface | Persona | Font | Density | Accent |
|---|---|---|---|---|
| `portfolio` (default) | the front door | Plus Jakarta Sans | 1.125× | near-neutral violet (hue 265) |
| `learn` | the notebook | JetBrains Mono | 0.875× | ochre (hue 72) |
| `teach` (blog, slides) | the lecture | Plus Jakarta Sans, Fraunces headings | 1× | chalkboard teal (hue 168) |
| `build` | the workbench | JetBrains Mono | 0.875× | workshop orange (hue 38) |

### Second accent

Each surface also has `--accent-2`, set by two more dials (`--dial-accent2-hue`, `--dial-accent2-chroma`) and picked with a colour-theory rule. Use it for supporting details: tags, highlights, code strings, a second chart series. Links, buttons and focus stay on `--accent`, so there's still one action colour per page.

| Surface | `--accent-2` | Rule |
|---|---|---|
| `portfolio` | indigo (hue 265, chroma 0.13) | monochrome: same hue, more colour |
| `learn` | plum (hue 312) | triadic: highlighter on the notebook |
| `teach` | raspberry (hue 350) | complement: pink chalk on the chalkboard |
| `build` | blueprint (hue 225, chroma 0.09) | complement: blueprint and safety orange |

## See it

The style guide shows every token, type style and component on all four surfaces, in light and dark: **https://nerajno.github.io/dvlpr-dialects/** (built from `index.html`; enable GitHub Pages on `main`, root folder).

## Install

Install from a tagged release on GitHub:

```bash
npm i github:Nerajno/dvlpr-dialects#v0.1.0
```

## Use

**1. Stylesheets** (once per site, in this order):

```css
@import "@nerajno/dialects/fonts.css";      /* Jakarta, Fraunces, JetBrains Mono */
@import "@nerajno/dialects/tokens.css";     /* the spine */
@import "@nerajno/dialects/utilities.css";  /* skip if you use the Tailwind preset */
@import "@nerajno/dialects/code.css";       /* optional: syntax colours */
```

**2. Theme and surface on `<html>`, before first paint.** Inline `theme-init.js` in `<head>` and name the surface:

```astro
---
import themeInit from "@nerajno/dialects/theme-init.js?raw";
---
<script is:inline data-surface="teach" set:html={themeInit}></script>
```

This sets `.light` or `.dark` (from the saved choice or the system setting), `data-theme` and `data-surface`. A missing or unknown surface falls back to `portfolio`.

**3. Base styles.** Read the semantic tokens, never raw colours:

```css
body { background: var(--bg); color: var(--text-body); font-family: var(--font-body); }
h1, h2, h3, h4, h5, h6 { font-family: var(--font-heading); color: var(--text-strong); }
a { color: var(--accent); }
a:hover { color: var(--accent-hover); }
```

**Tailwind** (optional). The preset gives the same class names as `utilities.css` (`bg-surface`, `text-strong`, `border-surface-strong`, `shadow-card`…), plus variants such as `hover:` and `md:`. It leaves Tailwind's own radius and shadow scales alone.

```js
// tailwind.config.cjs
module.exports = { presets: [require("@nerajno/dialects/tailwind-preset")], /* … */ };
```

**Code blocks** (Astro). Set `markdown.shikiConfig = { theme: "css-variables" }` and import `code.css`. Keywords take the surface's accent and strings take its `--accent-2`, while functions and constants take other surfaces' accents.

**No build step** (Jekyll and other static sites). Link the files from jsDelivr at a pinned tag, then add the `<script>` from step 2 inline:

```html
<link rel="stylesheet" href="https://cdn.jsdelivr.net/gh/Nerajno/dvlpr-dialects@v0.1.0/tokens.css">
<link rel="stylesheet" href="https://cdn.jsdelivr.net/gh/Nerajno/dvlpr-dialects@v0.1.0/utilities.css">
```

`fonts.css` needs a bundler to resolve the fontsource packages, so a static site loads the three fonts from Google Fonts instead.

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

**Contrast:**
- All four text tokens and `--accent` reach at least 4.5:1 on `--bg`, `--bg-alt` and `--bg-card` in every surface and mode.
- `--border-strong` reaches at least 3:1 on every background.
- `--border` is decorative only, at about 1.3:1.
- `--accent-2` reaches at least 5.2:1 on every background in light mode and 7.2:1 in dark, and at least 4.9:1 on `--accent-2-soft`.
- In dark mode, `--accent-soft` doesn't hold body text (the best text token reaches about 3.8:1), so use it only as a fill there.

## Releasing

Change the CSS, add an entry to `CHANGELOG.md`, bump `version` in `package.json`, then commit and tag (`git tag v0.2.0 && git push --tags`). Each site upgrades by changing the tag in its install string.
