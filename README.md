# Dialects

The design-token layer behind developingdvlpr.com: **one token layer, four dialects.**

Every surface (portfolio, learn, teach, build) uses the same token names and the same classes. A surface looks different only because a handful of `--dial-*` variables change underneath it: the font, the density, and the accent colours. Light and dark mode reuse the same dials with the lightness flipped.

**See it:** the style guide shows every token, type style and component on all four surfaces, in light and dark, with live contrast ratios: **https://nerajno.github.io/dvlpr-dialects/** (built from `index.html`).

- [Terms](#terms)
- [Surfaces](#surfaces)
- [Install](#install)
- [Use](#use)
- [Tokens](#tokens)
- [Colour names](#colour-names)
- [Rules of thumb](#rules-of-thumb)
- [Add or change a surface](#add-or-change-a-surface)
- [Releasing](#releasing)
- [License](#license)

## Terms

The page, this README, `llms.txt` and the JSON-LD use one term per idea:

| Idea | Use | Avoid |
|---|---|---|
| The shared token set | token layer | `token spine`, `design-token system`, `design token system` |
| `--accent` | action accent | `main accent` |
| `--accent-2` | support accent | `second accent` |
| Status pill labels | ok / warn / error / info | — |
| Colour names | Title Case, e.g. Chalkboard Teal | — |

`scripts/check-copy.mjs` reads the same list from `scripts/copy-terms.json`, so change both together.

## Surfaces

| Surface | Persona | Font | Density | Action accent | Support accent |
|---|---|---|---|---|---|
| `portfolio` (default) | the front door | Plus Jakarta Sans | 1.125× | Quiet Violet (hue 265) | Signal Indigo (hue 265) |
| `learn` | the notebook | JetBrains Mono | 0.875× | Notebook Ochre (hue 72) | Highlighter Plum (hue 312) |
| `teach` (blog, slides) | the lecture | Plus Jakarta Sans, Fraunces headings | 1× | Chalkboard Teal (hue 168) | Pink Chalk (hue 350) |
| `build` | the workbench | JetBrains Mono | 0.875× | Workshop Orange (hue 38) | Blueprint Blue (hue 225) |

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

### Support accent

Each surface's support accent was picked with a colour-theory rule against its action accent:

| Surface | Rule |
|---|---|
| `portfolio` | Monochrome: same hue, more colour. Portfolio's action accent is near-gray, so the support accent is where its colour comes from. |
| `learn` | Triadic: Highlighter Plum on a Notebook Ochre page. |
| `teach` | Complement: Pink Chalk on a Chalkboard Teal board. |
| `build` | Complement: Blueprint Blue against Workshop Orange. Chroma is capped at 0.09 to stay inside sRGB. |

## Install

The package is named `@nerajno/dialects` and installs from a tagged GitHub release:

```bash
npm i github:Nerajno/dvlpr-dialects#v0.2.0
```

**Browser support:** the tokens use `oklch()` with `calc()` inside it, so they need a current evergreen browser. There's no fallback for older ones.

## Use

### 1. Stylesheets

Import once per site, in this order:

```css
@import "@nerajno/dialects/fonts.css";      /* Jakarta, Fraunces, JetBrains Mono (self-hosted) */
@import "@nerajno/dialects/tokens.css";     /* the token layer */
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

### Status pills

`utilities.css` includes a status pill that shows a marker shape as well as a colour:

```html
<span class="status status-ok">Shipped</span>
<span class="status status-warn">In review</span>
<span class="status status-err">Blocked</span>
<span class="status status-info">Draft</span>
```

Add your own padding, radius and font; the classes only set the colours and the marker.

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
| `text-on-success` `bg-success` … | status colours and their text colours |

Values are CSS variables, so Tailwind's opacity modifiers (`bg-accent/50`) don't work. Use the `-soft` tokens instead.

### Code blocks (Astro)

Set `markdown.shikiConfig = { theme: "css-variables" }` and import `code.css`. Keywords take the surface's accent, strings take its `--accent-2`, and functions and constants take other surfaces' accents, so no two roles share a colour.

### No build step (Jekyll and other static sites)

Link the files from jsDelivr at a pinned tag, load the fonts from Google Fonts (`fonts.css` needs a bundler to resolve its packages), then add the `<script>` from step 2 inline with the contents of `theme-init.js`:

```html
<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Fraunces:opsz,wght@9..144,400..800&family=JetBrains+Mono:wght@400;500;700&family=Plus+Jakarta+Sans:wght@400..800&display=swap">
<link rel="stylesheet" href="https://cdn.jsdelivr.net/gh/Nerajno/dvlpr-dialects@v0.2.0/tokens.css">
<link rel="stylesheet" href="https://cdn.jsdelivr.net/gh/Nerajno/dvlpr-dialects@v0.2.0/utilities.css">
<link rel="stylesheet" href="https://cdn.jsdelivr.net/gh/Nerajno/dvlpr-dialects@v0.2.0/code.css">
```

## Tokens

| Group | Tokens |
|---|---|
| Surfaces | `--bg` `--bg-alt` `--bg-card` `--bg-elevated` |
| Text | `--text-strong` `--text-body` `--text-soft` `--text-muted` |
| Borders | `--border` (decorative hairline) · `--border-strong` (control edges, ≥3:1) |
| Accent | `--accent` `--accent-hover` `--accent-soft` `--focus` |
| Support accent | `--accent-2` `--accent-2-soft` |
| Cross-surface | `--dial-portfolio` `--dial-learn` `--dial-teach` `--dial-build` |
| Status | `--success` `--warning` `--danger` `--info`, each with a `-soft` version · `--on-success` `--on-warning` `--on-danger` `--on-info` (text on a solid status fill) |
| Fonts | `--font-body` `--font-heading` (resolved per surface) · `--font-sans` `--font-display` `--font-mono` |
| Shape | `--radius-sm` 4 · `--radius-md` 8 · `--radius-lg` 12 · `--radius-xl` 16 |
| Elevation | `--shadow-sm` `--shadow-md` `--shadow-lg` (tinted with the surface hue) |
| Motion | `--transition-fast` `--transition-normal` `--transition-slow` |

The cross-surface tokens are each surface's accent, pinned so any page can point at another surface: "read this on learn" links, surface switchers, and the code colours.

### Colour names

Every colour that carries meaning has a human name, so you can say "use Pink Chalk for the tag" instead of "the teach surface's support accent". Backgrounds, text and borders keep their role names (`--bg`, `--text-body`), because their tint changes with the surface.

| Name | Token | Where | Job | Light | Dark |
|---|---|---|---|---|---|
| Quiet Violet | `--accent` | portfolio | action | `HEX: #596378` | `HEX: #9AABCE` |
| Signal Indigo | `--accent-2` | portfolio | support | `HEX: #3E5FAD` | `HEX: #86A9F7` |
| Notebook Ochre | `--accent` | learn | action | `HEX: #805307` | `HEX: #D39747` |
| Highlighter Plum | `--accent-2` | learn | support | `HEX: #7A4D94` | `HEX: #C296DD` |
| Chalkboard Teal | `--accent` | teach | action | `HEX: #166E54` | `HEX: #54BB97` |
| Pink Chalk | `--accent-2` | teach | support | `HEX: #973F6E` | `HEX: #E38AB5` |
| Workshop Orange | `--accent` | build | action | `HEX: #AA3606` | `HEX: #FF7B4F` |
| Blueprint Blue | `--accent-2` | build | support | `HEX: #116D8A` | `HEX: #71B6D1` |
| Go Green | `--success` | all | ok | `HEX: #409D48` | `HEX: #67BB6B` |
| Caution Yellow | `--warning` | all | warn | `HEX: #CDAF33` | `HEX: #DEC358` |
| Stop Red | `--danger` | all | error | `HEX: #C5353E` | `HEX: #EF6567` |
| Notice Blue | `--info` | all | info | `HEX: #338FC7` | `HEX: #55AEE8` |

Variants take the base name: Chalkboard Teal hover is `--accent-hover`, Pink Chalk soft is `--accent-2-soft`. The cross-surface tokens (`--dial-teach` and the rest) carry the same names as each surface's accent.

### Hex values

The tokens are written in `oklch()`, which is the source of truth. For Figma and other tools that want hex, here are the nearest sRGB values. The style guide shows the oklch and hex for every token, live, in whichever surface and mode you pick.

**Accents (oklch)**

| Surface | `--accent` light | `--accent` dark | `--accent-2` light | `--accent-2` dark |
|---|---|---|---|---|
| `portfolio` | `oklch(0.5 0.035 265)` | `oklch(0.74 0.055 265)` | `oklch(0.5 0.13 265)` | `oklch(0.74 0.12 265)` |
| `learn` | `oklch(0.48 0.1 72)` | `oklch(0.72 0.12 72)` | `oklch(0.5 0.12 312)` | `oklch(0.74 0.11 312)` |
| `teach` | `oklch(0.48 0.09 168)` | `oklch(0.72 0.11 168)` | `oklch(0.5 0.13 350)` | `oklch(0.74 0.12 350)` |
| `build` | `oklch(0.5 0.16 38)` | `oklch(0.74 0.18 38)` | `oklch(0.5 0.09 225)` | `oklch(0.74 0.08 225)` |

**Accents (hex)**

| Surface | `--accent` light | `--accent` dark | `--accent-2` light | `--accent-2` dark | `--accent-2-soft` light | `--accent-2-soft` dark |
|---|---|---|---|---|---|---|
| `portfolio` | `#596378` | `#9AABCE` | `#3E5FAD` | `#86A9F7` | `#E3EBFD` | `#223154` |
| `learn` | `#805307` | `#D39747` | `#7A4D94` | `#C296DD` | `#F1E7F7` | `#3D2949` |
| `teach` | `#166E54` | `#54BB97` | `#973F6E` | `#E38AB5` | `#FAE4EE` | `#4B2437` |
| `build` | `#AA3606` | `#FF7B4F` | `#116D8A` | `#71B6D1` | `#DFEEF4` | `#163844` |

The cross-surface tokens (`--dial-portfolio` and the rest) equal each surface's `--accent` in the matching mode.

**Status**

| Token | Light | Dark | Marker |
|---|---|---|---|
| `--success` (Go Green) | `oklch(0.62 0.15 145)` `HEX: #409D48` | `oklch(0.72 0.14 145)` `HEX: #67BB6B` | circle |
| `--warning` (Caution Yellow) | `oklch(0.76 0.14 95)` `HEX: #CDAF33` | `oklch(0.82 0.13 95)` `HEX: #DEC358` | triangle |
| `--danger` (Stop Red) | `oklch(0.55 0.18 22)` `HEX: #C5353E` | `oklch(0.68 0.17 22)` `HEX: #EF6567` | square |
| `--info` (Notice Blue) | `oklch(0.62 0.12 240)` `HEX: #338FC7` | `oklch(0.72 0.12 240)` `HEX: #55AEE8` | diamond |

A few vivid values sit just outside sRGB (build's dark `--accent`, for example), so their hex is the clipped nearest match and looks very slightly duller than the oklch original in a wide-gamut browser.

### Contrast

- All four text tokens and `--accent` reach at least 4.5:1 on `--bg`, `--bg-alt` and `--bg-card` in every surface and mode.
- `--accent-2` reaches at least 5.2:1 on every background in light mode and 7.2:1 in dark, and at least 4.9:1 on `--accent-2-soft`.
- `--on-success`, `--on-warning`, `--on-danger` and `--on-info` reach at least 4.6:1 on their solid status fill in both modes.
- `--border-strong` reaches at least 3:1 on every background.
- `--border` is decorative only, at about 1.3:1.
- In dark mode, `--accent-soft` doesn't hold body text (the best text token reaches about 3.8:1), so use it only as a fill there.

## Rules of thumb

- **One action colour.** Links, buttons and focus rings use `--accent`. `--accent-2` is for supporting details: tags, highlights, code strings, a second chart series.
- **Put `--accent-2` text on `--accent-2-soft`**, not on `--accent-soft`.
- **Status needs more than colour.** The status hues sit 16–25° from the nearest surface accent (build's orange and danger are the closest pair), so a status is never shown by hue alone. Use the `.status` pill from `utilities.css`, which pairs each colour with a label and a marker shape, or add your own label or icon.
- **Never hard-code a colour.** If a token is missing, add it to the token layer rather than to one site.

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
4. Open the style guide in that surface, in both modes, and check every contrast badge still meets the numbers above. Keep the new hues at least 30° away from the other surfaces' accents and the status hues (22, 95, 145, 240).

## Releasing

1. Change the CSS and check the style guide in all four surfaces, light and dark.
2. Move the **Unreleased** entries in `CHANGELOG.md` under the new version.
3. Bump `version` in `package.json` and the `#v…` / `@v…` tags in this README.
4. Commit, then tag and push: `git tag v0.2.0 && git push --tags`.

Each site upgrades by changing the tag in its install string. The style guide is served by GitHub Pages from `main` (root folder).

### Search and AI visibility

The style guide is set up to be found and quoted by search engines and AI answer tools:

- `index.html`: a descriptive title and meta description, a canonical URL, Open Graph and Twitter tags with `og-image.png` (1200 × 630), and JSON-LD for the site, its author, the code and the FAQ.
- A static **Questions** section and a named-colour table that read without JavaScript, since the swatches are built by script.
- `llms.txt`: a plain summary of Dialects for AI tools, with links to the docs and source.
- `sitemap.xml`: submit it in Google Search Console and Bing Webmaster Tools.

When the page changes, update the `<time>` in the footer and `lastmod` in `sitemap.xml`. Re-render `og-image.png` if the accents change.

#### Copy check

`npm run check:copy` runs `scripts/check-copy.mjs`, a dependency-free Node script (Node 20+). It fails when:

- a Questions answer differs from its FAQPage JSON-LD entry;
- a term from the [Terms](#terms) table's Avoid column appears, a status pill isn't ok / warn / error / info, or a colour name isn't in Title Case (code is skipped);
- the page has more than one `h1`, a heading inside a `button`, or JSON-LD that doesn't parse;
- the definition, the questions, the colour names or the author are missing with JavaScript off;
- the footer `<time>` and `lastmod` in `sitemap.xml` differ;
- a `#anchor` or local file linked from `index.html` or this README is missing.

External links are checked too, but a broken one is only a warning, so a flaky site can't block a pull request. Add `-- --offline` to skip them. `npm test` runs the script's own tests. The **Check copy** GitHub Action runs both on pull requests that touch `index.html`, `llms.txt`, `README.md`, `sitemap.xml` or `scripts/`.

## License

Dialects is **source-available** under the [PolyForm Noncommercial License 1.0.0](LICENSE.md). You can use, copy and change it for any non-commercial purpose: personal projects, learning, research, education, charities and government. Commercial use needs a separate license: email [nerando@developingdvlpr.com](mailto:nerando@developingdvlpr.com).

Required Notice: Copyright 2026 Nerando Johnson (https://developingdvlpr.com)
