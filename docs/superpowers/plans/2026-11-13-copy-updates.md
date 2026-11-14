# Copy Updates (issue #5) Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Tighten and unify the style guide's copy so a first-time visitor learns what Dialects is, how it works and how to install it from the first screen, and guard that copy with a CI check.

**Architecture:** Build the guard first: `scripts/check-copy.mjs`, a dependency-free Node script that reads one terms file (`scripts/copy-terms.json`). Run it against today's repo and record what fails. The copy tasks then rewrite `index.html`, `README.md`, `llms.txt` and `sitemap.xml` until the script passes, so the script is the test for the content work. A GitHub Action runs the script and its unit tests on pull requests.

**Tech Stack:** Plain HTML/CSS/JS (no build step), Node ≥ 20 (`node:test`, global `fetch`, `node:fs`), GitHub Actions.

**Spec:** https://github.com/Nerajno/dvlpr-dialects/issues/5. Read it with `gh issue view 5 --repo Nerajno/dvlpr-dialects`. Its "Proposed copy" section is the source of all wording below, except where this plan notes a deviation.

**Branch:** `docs/copy-updates`, already created from an up-to-date `main`.

## Global Constraints

- No token, colour-value or layout changes. The only layout additions are the ones this copy needs: card label lines, the footer `<dl>`, the switcher hint, the scroll wrapper on the colour table, and the Get started block.
- UK spelling ("colour", "learnt").
- Terms: **token layer** (shared set), **action accent** (`--accent`), **support accent** (`--accent-2`), status pill labels **ok / warn / error / info**, and colour names always in Title Case.
- "Token spine" is removed from the page, README and `llms.txt`. It may stay in CSS comments in `tokens.css` and in the CHANGELOG history.
- The sample post loses its view count.
- Keep the CSS class `.status-err` (public API in `utilities.css`). Only the visible pill text changes to "error". Keep the token `--danger` too.
- Exactly one `h1`. No heading inside a `button`. All copy must be readable with JavaScript off.
- FAQ `<details>` text must match the FAQPage JSON-LD word for word.
- Footer `<time datetime>` must equal `<lastmod>` in `sitemap.xml`. Both are set to the date of the copy commit.
- Version strings stay `v0.2.0`.
- External link failures are **warnings** (exit 0). Broken relative file links and `#anchors` are **errors**.
- Section intros and FAQ answers should stay at about 25 words or fewer per sentence and 3 or fewer sentences per paragraph. This is a review note, not a scripted check.
- Commit trailer: `Facilitated-by: Claude Opus 5.5 <noreply@anthropic.com>`. Never `Co-Authored-By`.

## Review Focus

1. **Entities and markup inside FAQ answers.** `<code>`, `<a>`, `&amp;` and `&lt;` in a `<details>` answer must reduce to the same plain text as the JSON-LD string. Collapse whitespace and decode entities before comparing. Test: `faq: tags and entities are normalised before compare` (Task 2).
2. **Banned terms in non-visible places.** The page `<title>`, `meta` content, `alt` attributes and the JSON-LD are read by crawlers. They must be scanned too, while CSS comments and `<script>` (except JSON-LD) are not. Test: `banned: meta content and JSON-LD are scanned, style comments are not` (Task 1).
3. **Hash links to surfaces.** `href="#teach"` points at a surface, not an element id. The anchor check must not flag these, but must still flag a genuinely dead `#foo`. Test: `links: surface hashes pass, unknown hash fails` (Task 3).
4. **Network down in CI.** If `fetch` throws or times out on an external URL, the script reports a warning and still exits 0. Test: `links: fetch rejection becomes a warning` (Task 3).
5. **Colour names inside code.** `` `--dial-teach` ``, hex tables and `<code>` blocks must not trip the lowercase-name rule, but a prose "chalkboard teal" must. Test: `banned: lowercase colour name in prose fails, inside code passes` (Task 1).

---

## File map

| File | Status | Responsibility |
|---|---|---|
| `scripts/copy-terms.json` | new | The single source of terms: preferred term, avoided terms, colour names, status labels and required no-JS strings |
| `scripts/check-copy.mjs` | new | Exported pure check functions and a CLI `main()` |
| `scripts/check-copy.test.mjs` | new | `node:test` unit tests with inline fixtures |
| `.github/workflows/check-copy.yml` | new | Runs tests and the check on PRs |
| `package.json` | modify | Add `scripts.test` and `scripts.check:copy`; update the description |
| `index.html` | modify | All page copy, the JSON-LD and meta tags, and small CSS for the new blocks |
| `README.md` | modify | Terms table, term renames, docs for the script |
| `llms.txt` | modify | Term renames and the new one-line definition |
| `sitemap.xml` | modify | `lastmod` |
| `CHANGELOG.md` | modify | Unreleased entry |

---

### Task 1: Terms file, text helpers, banned-term and structure checks

**Files:**
- Create: `scripts/copy-terms.json`, `scripts/check-copy.mjs`, `scripts/check-copy.test.mjs`

**Interfaces (produces):**
- `copy-terms.json` shape:
  ```json
  {
    "terms": [
      { "idea": "The shared token set", "use": "token layer", "avoid": ["token spine", "design-token system", "design token system"] },
      { "idea": "`--accent`", "use": "action accent", "avoid": ["main accent"] },
      { "idea": "`--accent-2`", "use": "support accent", "avoid": ["second accent"] },
      { "idea": "Status pill labels", "use": "ok / warn / error / info", "avoid": [] },
      { "idea": "Colour names", "use": "Title Case, e.g. Chalkboard Teal", "avoid": [] }
    ],
    "colourNames": ["Quiet Violet","Signal Indigo","Notebook Ochre","Highlighter Plum","Chalkboard Teal","Pink Chalk","Workshop Orange","Blueprint Blue","Go Green","Caution Yellow","Stop Red","Notice Blue"],
    "statusLabels": ["ok","warn","error","info"],
    "noJsRequired": ["Dialects is the design-token layer behind developingdvlpr.com", "Nerando Johnson"]
  }
  ```
  (The seven FAQ questions and the 12 colour names are added to the no-JS requirement in code. The questions are read from the JSON-LD, so they are not duplicated in this file.)
- `loadTerms(path = new URL('./copy-terms.json', import.meta.url)) -> Terms`
- `decode(s: string) -> string`: decodes `&amp; &lt; &gt; &quot; &#39; &nbsp;` and numeric entities.
- `visibleText(html: string) -> string`: removes comments, `<style>` and every `<script>`, strips tags, decodes entities, collapses whitespace. This is what a no-JS crawler reads.
- `crawlerText(html: string) -> string`: `visibleText` plus `<title>`, every `content="…"` of `<meta>`, every `alt="…"`, and the JSON-LD string values.
- `stripCode(html: string) -> string`: removes `<pre>…</pre>` and `<code>…</code>`. `stripMdCode(md: string) -> string` removes fenced and inline-backtick code.
- `checkBanned(text: string, terms: Terms, file: string) -> string[]`: case-insensitive whole-phrase match for each `avoid`, plus the lowercase colour-name rule (any case-insensitive match of a colour name that is not exactly the Title Case form fails). Each error reads like `index.html: avoid "token spine" (use "token layer")`.
- `checkStatusPills(html: string, terms: Terms) -> string[]`: every element with class `status` must have text in `statusLabels`.
- `checkTermsTable(readme: string, terms: Terms) -> string[]`: README must contain a `## Terms` section whose table has a row containing each `use` value.
- `checkStructure(html: string) -> string[]`: exactly one `<h1`, no `<h1`–`<h6` between `<button…>` and `</button>`, and every `application/ld+json` block passes `JSON.parse`.

- [ ] **Step 1: Write failing tests** in `scripts/check-copy.test.mjs` using `node:test` and `node:assert/strict`. Tests and key assertions:
  - `visibleText drops script, style and comments`: `visibleText('<style>a{}</style><!--x--><p>Hi&amp;yo</p><script>z()</script>') === 'Hi&yo'`
  - `banned: avoided phrase fails case-insensitively`: `checkBanned('The Token Spine is…', terms, 'f')` has length 1 and the error includes `"token layer"`
  - `banned: meta content and JSON-LD are scanned, style comments are not`: for `crawlerText('<meta name="description" content="a token spine"><style>/* token spine */</style>')`, `checkBanned` returns 1 error
  - `banned: lowercase colour name in prose fails, inside code passes`: `checkBanned(stripCode('<p>the chalkboard teal</p>'), …)` has length 1; `checkBanned(stripCode('<code>chalkboard teal</code>'), …)` has length 0
  - `status pills: "err" fails, "error" passes`
  - `terms table: missing row fails`: a README without `support accent` in its Terms table gives 1 error
  - `structure: two h1 fail`, `structure: heading in button fails`, `structure: bad JSON-LD fails`, and `structure: valid page passes` (returns `[]`)
- [ ] **Step 2: Run** `node --test scripts/`. Expected: FAIL, `Cannot find module` / exports missing.
- [ ] **Step 3: Implement** the files above. Use regex-based HTML handling only (no dependencies). Escape regex metacharacters in phrases. Use `\b` boundaries on phrases.
- [ ] **Step 4: Run** `node --test scripts/`. Expected: all tests pass.
- [ ] **Step 5: Commit** `test: add copy-check banned-term and structure checks`

### Task 2: FAQ ↔ JSON-LD, no-JS and dates checks

**Files:** Modify `scripts/check-copy.mjs`, `scripts/check-copy.test.mjs`

**Interfaces:**
- Consumes `decode`, `visibleText` and `loadTerms` from Task 1.
- Produces:
  - `extractFaqHtml(html) -> {q: string, a: string}[]`: one entry per `<details class="qa">`, taking the question from `<h3>` and the answer from the `<p>` children, both normalised (tags stripped, decoded, whitespace collapsed).
  - `extractFaqLd(html) -> {q, a}[]`: from the `FAQPage.mainEntity` list in the `@graph`.
  - `checkFaq(html) -> string[]`: fails if the counts differ, if any `q` differs at the same index, or if any `a` differs. The error shows both strings.
  - `checkNoJs(html, terms) -> string[]`: `visibleText(html)` must contain every `noJsRequired` string, every `colourNames` entry and every FAQ question from `extractFaqLd`.
  - `checkDates(html, sitemapXml) -> string[]`: the footer `<time datetime="YYYY-MM-DD">` must equal `<lastmod>`. If either is missing, that is an error.

- [ ] **Step 1: Write failing tests**:
  - `faq: matching pair passes`
  - `faq: one-word drift fails`
  - `faq: tags and entities are normalised before compare`: HTML answer `Run <code>npm i x</code> &amp; go.` against LD `"Run npm i x & go."` gives `[]`
  - `faq: count mismatch fails`
  - `nojs: colour name only inside a script fails`
  - `nojs: complete page passes`
  - `dates: equal passes`, `dates: differ fails`, `dates: missing time fails`
- [ ] **Step 2: Run** `node --test scripts/`. Expected: the new tests FAIL.
- [ ] **Step 3: Implement.**
- [ ] **Step 4: Run** `node --test scripts/`. Expected: all tests pass.
- [ ] **Step 5: Commit** `test: add FAQ, no-JS and date checks to copy check`

### Task 3: Link check, CLI, CI and baseline run

**Files:** Modify `scripts/check-copy.mjs` and `scripts/check-copy.test.mjs`. Create `.github/workflows/check-copy.yml`. Modify `package.json`.

**Interfaces:**
- `githubSlug(heading: string) -> string`: lowercase; drop everything except letters, digits, spaces and `-`; spaces become `-`.
- `checkLinks({html, readme, root, fetchImpl = fetch, timeoutMs = 10000}) -> Promise<{errors: string[], warnings: string[]}>`
  - `index.html` `href`/`src`: a `#x` link must be an element `id` or a `data-surface` value. A relative path must exist under `root`. `http(s)` links get a HEAD request, with GET retried on 405 or 403. A status ≥ 400 or a rejection is a **warning**. Skip `mailto:` links and the Google Fonts preconnect hosts.
  - `README.md` `[..](..)`: `#x` must match a `githubSlug` of some `#` heading. Relative paths must exist. `http(s)` links are handled as above.
  - Each external URL is fetched once, with up to 8 requests running concurrently.
- `main(argv) -> Promise<number>`: reads the files from the repo root (`new URL('..', import.meta.url)`) and runs every check. `--offline` skips the external fetches. It prints a `✗` line for each error and a `!` line for each warning, ends with a summary line, and returns `1` if there are any errors, else `0`. When run directly, `process.exitCode = await main(process.argv.slice(2))`.
- `package.json` scripts: `"test": "node --test scripts/"`, `"check:copy": "node scripts/check-copy.mjs"`.
- Workflow: runs on `pull_request` with paths `index.html, llms.txt, README.md, sitemap.xml, scripts/**, .github/workflows/check-copy.yml`. Uses `ubuntu-latest`, `actions/checkout@v4` and `actions/setup-node@v4` with node `20`. Steps are `npm test`, then `npm run check:copy`. There is no `npm install`, because the script has no dependencies.

- [ ] **Step 1: Write failing tests**:
  - `slug: "Search and AI visibility" -> "search-and-ai-visibility"`
  - `links: surface hashes pass, unknown hash fails`
  - `links: missing relative file fails`
  - `links: 404 becomes a warning`: a stub `fetchImpl` resolves `{status: 404}`
  - `links: fetch rejection becomes a warning`
  - `links: README anchor to missing heading fails`
- [ ] **Step 2: Run** `node --test scripts/`. Expected: the new tests FAIL.
- [ ] **Step 3: Implement** `githubSlug`, `checkLinks` and `main`. Add the workflow and the `package.json` scripts.
- [ ] **Step 4: Run** `npm test`. Expected: all tests pass.
- [ ] **Step 5: Baseline.** Run `npm run check:copy -- --offline; echo "exit $?"`. Expected: `exit 1`, with errors for the banned terms (about 30 hits across `index.html`, `README.md` and `llms.txt`), the "err" pill, the lowercase "chalkboard teal" and the missing README Terms table. There should be no date error yet, because both dates are `2026-11-12`. Paste the error list into the commit body. It is the to-do list for Tasks 4–7.
- [ ] **Step 6: Commit** `ci: run copy check on pull requests`

### Task 4: Head, hero, Get started and surface cards

**Files:** Modify `index.html`: the head (lines 12–34 and the JSON-LD descriptions at lines 44 and 66), the hero (348–353), a new section after the hero, the surfaces (355–366) and the CSS block (170–327).

- [ ] **Step 1: Head copy.**
  - `<title>`: `Dialects: an OKLCH design-token layer with four surface dialects`
  - Use one description string for `meta description`, `og:description`, `twitter:description` and the JSON-LD `WebSite.description` and `SoftwareSourceCode.description`: `Dialects is the source-available OKLCH design-token layer behind developingdvlpr.com, by Nerando Johnson: four surface dialects, light and dark, with WCAG-checked contrast.`
- [ ] **Step 2: Hero.** Use the issue's "Proposed copy › Hero" verbatim.
  - Eyebrow: `developingdvlpr.com · design tokens`.
  - The `h1` is unchanged.
  - The lede is two `<p class="lede">` paragraphs. The first starts `<strong>Dialects</strong> is the design-token layer behind developingdvlpr.com.` and must contain the exact `noJsRequired` string.
  - Add `<p class="switch-hint">Pick a surface and a mode. The whole page follows.</p>` before `#readout`.
  - CSS: `.switch-hint { margin: 0; font-size: .9375rem; color: var(--text-muted); }`.
- [ ] **Step 3: Get started.** Add `<section class="block" id="start">` with an `h2` reading "Get started". Use the issue's intro line, then a `.codes` block with two `<pre><code>` blocks (npm command; four `@import` lines), then the closing line. "README" links to `https://github.com/Nerajno/dvlpr-dialects#use`. Use plain text inside `<pre>` with no token spans, and escape `<head>` as `&lt;head&gt;`.
- [ ] **Step 4: Surface cards.**
  - Replace each `.k` span with `<span class="k"><b>Feels like</b> the lecture</span>` lines, one line each for Feels like, Font, Density and Colours.
  - Use the values from the current cards. Write fonts in full: portfolio "Plus Jakarta Sans"; learn "JetBrains Mono"; teach "Plus Jakarta Sans, Fraunces headings"; build "JetBrains Mono".
  - Use `span`s, because a `dl` is not allowed inside a `button`.
  - Move `.now` to directly after `.sname`, wrapped in `<span class="sname-row">` (flex, `justify-content: space-between`).
  - Give `.now` a pill look using existing tokens: `border:1px solid var(--border-strong); border-radius:999px; padding:.2rem .45rem`.
  - Surfaces intro: `Each part of the site speaks its own dialect. Pick one and the page re-skins.`
- [ ] **Step 5: Verify.** Run `npm run check:copy -- --offline`. Expected: no head or hero banned-term errors remain. Run `npm test`. Expected: all tests pass.
- [ ] **Step 6: Commit** `docs: rewrite hero, add Get started, label surface cards`

### Task 5: Section intros, demo content and colour table

**Files:** Modify `index.html`: Colour (368–375), Type and the sample post (377–401), Components (403–445), Code (447–473), Shape (475–492), the FAQ-table removal (528–537), and the JS `GROUPS` and readout (553–640).

- [ ] **Step 1: Intros.** Use the issue's copy verbatim for Colour (the intro, plus a second `<p>` with the ≈ small print), Type, Components and Code (two `<p>`s).
  - **Deviation, Shape:** `Radii and shadow sizes are the same on every surface. Shadows pick up the surface hue, and spacing is in rem, so it follows the density dial.` The issue's "motion" is dropped because no motion is shown, as its own acceptance criterion requires.
- [ ] **Step 2: Colour table.** Move `table.names` out of the FAQ to below `#groups` in Colour, wrapped in `<div style="overflow-x:auto">`.
  - Caption: `Named colours`.
  - Columns: Name, Token, Surface, Job, Light, Dark.
  - Rows: the 12 rows of the README "Colour names" table, with hex values as `<code>#596378</code>` (no `HEX:` prefix).
  - Move the `.names` CSS block under the `/* Colour */` comment.
- [ ] **Step 3: Sample post.**
  - Meta becomes `Oct 31, 2026 • 6 min read`, with the view count removed.
  - Prose: change "one spine" to "one token layer" and "chalkboard teal" to "Chalkboard Teal".
  - JS `GROUPS`: change `text-muted` use to `Dates and read time`.
- [ ] **Step 4: Components.**
  - Labels: `Buttons`, `Status pills`, `Support accent (<code>--accent-2</code>)`, `Form field`, `Card (<code>--shadow-md</code>)`, `Cross-surface links`.
  - Buttons: `Save changes`, `Read the next post`.
  - Pill text: `err` becomes `error`. Keep class `status-err`.
  - Delete the hard-coded `dial-badge` row (line 416).
  - Accent paragraph: "main accent" becomes "action accent".
  - JS: change `danger` use to `error · square marker`, and the readout label `accent-2 hue` to `support accent hue`.
- [ ] **Step 5: Verify.** Run `npm run check:copy -- --offline`. Expected: no errors from these sections. Run `npm test`. Expected: all tests pass.
- [ ] **Step 6: Commit** `docs: rewrite section intros, fix demo content, move colour table`

### Task 6: FAQ, JSON-LD, footer and dates

**Files:** Modify `index.html`: the FAQPage JSON-LD (80–140), the FAQ (494–527), the footer (542–547) and the footer CSS (323–324). Modify `sitemap.xml`.

- [ ] **Step 1: FAQ.**
  - Use the seven questions and answers from the issue's "Questions" verbatim.
  - In the HTML, wrap commands, file names and tokens in `<code>`. Keep the license `<a>` and the mailto `<a>`.
  - Paste the same text, without tags, into the JSON-LD `name` and `text` fields, in the same order.
  - Keep `open` on the first `<details>`.
  - FAQ intro is unchanged: "Short answers about what Dialects is and how to use it."
- [ ] **Step 2: Footer.**
  - Replace the paragraph and `<pre>` with `<dl class="colophon">`, with seven `<dt>`/`<dd>` pairs in the issue's order.
  - "By" keeps `<a … rel="author">Nerando Johnson</a> (<a …>@Nerajno</a>)`.
  - "Updated" is `<time datetime="YYYY-MM-DD">D Month YYYY</time>`, using the commit date.
  - "License" keeps `rel="license"`.
  - "Install" is `<code>npm i github:Nerajno/dvlpr-dialects#v0.2.0</code>`.
  - CSS: `.colophon { display:grid; grid-template-columns:max-content 1fr; gap:.25rem 1rem; margin:0 }`, and `.colophon dd { margin:0; min-width:0; overflow-wrap:anywhere }`. Remove the dead `footer pre` rule.
- [ ] **Step 3: Sitemap.** Set `<lastmod>` to the same `YYYY-MM-DD`.
- [ ] **Step 4: Verify.** Run `npm run check:copy -- --offline`. Expected: no FAQ, date, structure or no-JS errors. Run `npm test`. Expected: all tests pass.
- [ ] **Step 5: Commit** `docs: tighten FAQ and JSON-LD, restructure footer`

### Task 7: README, llms.txt, package.json, CHANGELOG

**Files:** Modify `README.md`, `llms.txt`, `package.json` (description) and `CHANGELOG.md`.

- [ ] **Step 1: README.**
  - Line 3: "The token spine behind…" becomes "The design-token layer behind developingdvlpr.com: **one token layer, four dialects.**"
  - Add `## Terms` after the intro paragraphs, and add it to the table of contents. The table has the columns `| Idea | Use | Avoid |`, filled from `copy-terms.json`. Add one sentence after it: "`scripts/check-copy.mjs` reads the same list from `scripts/copy-terms.json`, so change both together."
  - Rename "Second accent" to "Support accent" in the heading, the table column and the prose. Rename "main accent" to "action accent", and replace "spine" with "token layer" (lines 71 and 254).
  - Fix any status text that says "err".
  - Under `### Search and AI visibility`, add a paragraph on `npm run check:copy` (what the six checks are, `--offline`, and that external links only warn) and on the CI workflow. Update the "When the page changes…" line to say the check enforces the dates.
- [ ] **Step 2: llms.txt.**
  - The summary line becomes: "Dialects is the source-available OKLCH design-token layer behind developingdvlpr.com, by Nerando Johnson (@Nerajno): one layer of CSS custom properties shared by every site, with four surface dialects (portfolio, learn, teach, build) that each set a few dials (font, density and two accent colours), in light and dark mode."
  - Change "(the spine)" to "(the token layer)", and "the token spine and every dial" to "the token layer and every dial".
- [ ] **Step 3: package.json description.** "The developingdvlpr.com design-token layer: one OKLCH token layer, four surface dialects (portfolio, learn, teach, build), light and dark."
- [ ] **Step 4: CHANGELOG.** Add an `## Unreleased` section with: copy pass (#5), the check-copy script and CI, the status pill text "error" (class unchanged), and the colour table moved into Colour.
- [ ] **Step 5: Verify.** Run `npm run check:copy`. This run is online. Expected: exit 0 with 0 errors, and any warnings are external links only. Run `npm test`. Expected: all tests pass.
- [ ] **Step 6: Commit** `docs: align README and llms.txt terms, document copy check`

### Task 8: End-to-end verification and PR

- [ ] **Step 1: Prove the check fails.**
  1. Change one word in a JSON-LD FAQ answer and run `npm run check:copy -- --offline`. Expected: exit 1, with a `faq:` error that shows both strings.
  2. Revert the change and rerun. Expected: exit 0.
- [ ] **Step 2: Browser check.**
  - Run `python3 -m http.server 8080`.
  - Check all four surfaces in light and dark at 1280px and 400px. Confirm that the hero, Get started and surface cards fit before the first scroll on desktop, that the "Current" badge is separate from the text, that the footer `dl` wraps cleanly, that the colour table scrolls inside its box on a phone, and that there are no console errors.
  - Turn JavaScript off and confirm that the hero, Get started, FAQ, colour table and footer all read.
- [ ] **Step 3: Length review.** Read every section intro and FAQ answer. Note any sentence over about 25 words and any paragraph over 3 sentences, and fix them in place by updating the HTML and the JSON-LD together.
- [ ] **Step 4: Push the branch and open a PR.** Title: "Copy updates (#5)". The body says "Closes #5", lists the two deviations (Shape drops "motion"; status class kept as `status-err`), lists the confirmed decisions, and pastes the check output. End it with the PR attribution line. Push and open the PR only after the user confirms.
