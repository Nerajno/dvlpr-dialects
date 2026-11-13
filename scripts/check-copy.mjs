#!/usr/bin/env node
// Copy guard for the Dialects style guide. Dependency-free; Node >= 20.
// Run: node scripts/check-copy.mjs [--offline]
// Terms live in scripts/copy-terms.json, the same list the README "Terms" table shows.
import { readFileSync } from 'node:fs';

// ── Terms ──
export function loadTerms(path = new URL('./copy-terms.json', import.meta.url)) {
  return JSON.parse(readFileSync(path, 'utf8'));
}

// ── Text helpers ──
const NAMED = { amp: '&', lt: '<', gt: '>', quot: '"', apos: "'", nbsp: ' ', '#39': "'" };

export function decode(s) {
  return s.replace(/&(#x[0-9a-f]+|#\d+|[a-z]+|#39);/gi, (m, e) => {
    if (NAMED[e.toLowerCase()] !== undefined) return NAMED[e.toLowerCase()];
    if (e[0] === '#') return String.fromCodePoint(e[1].toLowerCase() === 'x' ? parseInt(e.slice(2), 16) : +e.slice(1));
    return m;
  });
}

const squash = (s) => s.replace(/\s+/g, ' ').trim();

/** Plain text of the markup, without tags. */
export function textOf(html) {
  return squash(decode(html.replace(/<[^>]+>/g, ' '))).replace(/\s+([.,;:!?)])/g, '$1').replace(/\(\s+/g, '(');
}

/** What a crawler with JavaScript off reads: no comments, styles or scripts. */
export function visibleText(html, { skipCode = false } = {}) {
  const visible = html
    .replace(/<!--[\s\S]*?-->/g, ' ')
    .replace(/<style\b[\s\S]*?<\/style>/gi, ' ')
    .replace(/<script\b[\s\S]*?<\/script>/gi, ' ');
  return textOf(skipCode ? stripCode(visible) : visible);
}

function ldBlocks(html) {
  return [...html.matchAll(/<script\b[^>]*type=["']application\/ld\+json["'][^>]*>([\s\S]*?)<\/script>/gi)].map((m) => m[1]);
}

function strings(v, out = []) {
  if (typeof v === 'string') out.push(v);
  else if (v && typeof v === 'object') Object.values(v).forEach((x) => strings(x, out));
  return out;
}

/** visibleText plus meta content, alt text and JSON-LD strings. skipCode drops <pre>/<code> after scripts are gone. */
export function crawlerText(html, { skipCode = false } = {}) {
  const attrs = [
    ...[...html.matchAll(/<meta\b[^>]*\bcontent="([^"]*)"/gi)].map((m) => m[1]),
    ...[...html.matchAll(/\balt="([^"]*)"/gi)].map((m) => m[1]),
  ].map(decode);
  const ld = ldBlocks(html).flatMap((b) => { try { return strings(JSON.parse(b)); } catch { return [b]; } });
  return [visibleText(html, { skipCode }), ...attrs, ...ld].join('\n');
}

export function stripCode(html) {
  return html.replace(/<pre\b[\s\S]*?<\/pre>/gi, ' ').replace(/<code\b[\s\S]*?<\/code>/gi, ' ');
}

export function stripMdCode(md) {
  return md.replace(/^```[\s\S]*?^```/gm, ' ').replace(/`[^`\n]*`/g, ' ');
}

// ── Checks (each returns a list of error strings) ──
const esc = (s) => s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

export function checkBanned(text, terms, file) {
  const errs = [];
  for (const t of terms.terms) {
    for (const bad of t.avoid) {
      const n = (text.match(new RegExp(`\\b${esc(bad)}\\b`, 'gi')) || []).length;
      if (n) errs.push(`${file}: avoid "${bad}" (use "${t.use}")${n > 1 ? ` ×${n}` : ''}`);
    }
  }
  for (const name of terms.colourNames) {
    const wrong = (text.match(new RegExp(`\\b${esc(name)}\\b`, 'gi')) || []).filter((m) => m !== name);
    if (wrong.length) errs.push(`${file}: colour name "${wrong[0]}" should be "${name}"${wrong.length > 1 ? ` ×${wrong.length}` : ''}`);
  }
  return errs;
}

export function checkStatusPills(html, terms) {
  return [...html.matchAll(/<(\w+)\b[^>]*\bclass="(?:[^"]*\s)?status(?:\s[^"]*)?"[^>]*>([\s\S]*?)<\/\1>/g)]
    .map((m) => textOf(m[2]))
    .filter((label) => !terms.statusLabels.includes(label))
    .map((label) => `index.html: status pill "${label}" (use ${terms.statusLabels.join(' / ')})`);
}

export function checkTermsTable(readme, terms) {
  const m = /^## Terms\s*$([\s\S]*?)(?=^## |(?![\s\S]))/m.exec(readme);
  if (!m) return ['README.md: missing "## Terms" section'];
  const rows = m[1].split('\n').filter((l) => l.trim().startsWith('|'));
  return terms.terms
    .filter((t) => !rows.some((r) => r.includes(t.use)))
    .map((t) => `README.md: Terms table has no row for "${t.use}"`);
}

export function checkStructure(html) {
  const errs = [];
  const h1 = (html.match(/<h1[\s>]/gi) || []).length;
  if (h1 !== 1) errs.push(`index.html: expected one <h1>, found ${h1}`);
  for (const b of html.matchAll(/<button\b[^>]*>([\s\S]*?)<\/button>/gi)) {
    if (/<h[1-6][\s>]/i.test(b[1])) errs.push(`index.html: heading inside <button>: ${textOf(b[1]).slice(0, 40)}`);
  }
  const shown = [...html.matchAll(/<\w+\b[^>]*\bclass="(?:[^"]*\s)?now(?:\s[^"]*)?"[^>]*>/g)].filter((m) => !/\shidden[\s>=]/.test(m[0])).length;
  if (shown) errs.push(`index.html: ${shown} "Current" badge(s) not marked hidden; with JavaScript off every surface would read as current`);
  ldBlocks(html).forEach((b, i) => {
    try { JSON.parse(b); } catch (e) { errs.push(`index.html: JSON-LD block ${i + 1} does not parse: ${e.message}`); }
  });
  return errs;
}

// ── FAQ: visible <details> must match the FAQPage JSON-LD word for word ──
export function extractFaqHtml(html) {
  return [...html.matchAll(/<details\b[^>]*class="[^"]*\bqa\b[^"]*"[^>]*>([\s\S]*?)<\/details>/gi)].map((m) => ({
    q: textOf((/<h3\b[^>]*>([\s\S]*?)<\/h3>/i.exec(m[1]) || [, ''])[1]),
    a: textOf(m[1].replace(/^[\s\S]*?<\/summary>/i, '')),
  }));
}

export function extractFaqLd(html) {
  for (const b of ldBlocks(html)) {
    let data; try { data = JSON.parse(b); } catch { continue; }
    const nodes = Array.isArray(data['@graph']) ? data['@graph'] : [data];
    const faq = nodes.find((n) => n && n['@type'] === 'FAQPage');
    if (faq) return (faq.mainEntity || []).map((e) => ({ q: squash(e.name || ''), a: squash(e.acceptedAnswer?.text || '') }));
  }
  return [];
}

export function checkFaq(html) {
  const page = extractFaqHtml(html), ld = extractFaqLd(html), errs = [];
  if (page.length !== ld.length) errs.push(`index.html: ${page.length} FAQ entries on the page, ${ld.length} in the FAQPage JSON-LD`);
  for (let i = 0; i < Math.min(page.length, ld.length); i++) {
    if (page[i].q !== ld[i].q) errs.push(`index.html: FAQ ${i + 1} question differs\n    page: ${page[i].q}\n    ld:   ${ld[i].q}`);
    if (page[i].a !== ld[i].a) errs.push(`index.html: FAQ ${i + 1} answer differs ("${page[i].q}")\n    page: ${page[i].a}\n    ld:   ${ld[i].a}`);
  }
  return errs;
}

// ── No-JS: the definition, questions, colour names and author read without script ──
export function checkNoJs(html, terms) {
  const text = visibleText(html);
  const need = [...terms.noJsRequired, ...terms.colourNames, ...extractFaqLd(html).map((e) => e.q)];
  return need.filter((s) => !text.includes(s)).map((s) => `index.html: "${s}" is not readable with JavaScript off`);
}

// ── Dates: footer <time> and sitemap <lastmod> agree ──
export function checkDates(html, sitemapXml) {
  const footer = (/<footer\b[\s\S]*?<\/footer>/i.exec(html) || [''])[0];
  const time = (/<time\b[^>]*datetime="([^"]+)"/i.exec(footer) || [])[1];
  const lastmod = (/<lastmod>\s*([^<\s]+)\s*<\/lastmod>/i.exec(sitemapXml) || [])[1];
  if (!time) return ['index.html: footer has no <time datetime>'];
  if (!lastmod) return ['sitemap.xml: no <lastmod>'];
  return time === lastmod ? [] : [`dates differ: footer <time> ${time}, sitemap <lastmod> ${lastmod}`];
}

// ── Links: dead #anchors and missing local files fail; external links only warn ──
export function githubSlug(heading) {
  return heading.trim().toLowerCase().replace(/[^\p{L}\p{N} -]/gu, '').replace(/ /g, '-');
}

const SKIP = /^(mailto:|tel:|data:|javascript:)/i;

async function probe(url, fetchImpl, timeoutMs) {
  const go = (method) => fetchImpl(url, { method, redirect: 'follow', signal: AbortSignal.timeout(timeoutMs) });
  let res = await go('HEAD');
  if (res.status === 405 || res.status === 403) res = await go('GET');
  return res.status;
}

export async function checkLinks({ html, readme, root, fetchImpl = fetch, timeoutMs = 10000, offline = false }) {
  const { existsSync } = await import('node:fs');
  const { join } = await import('node:path');
  const errors = [], warnings = [], external = new Map();
  const local = (file, href) => {
    const path = decodeURIComponent(href.split(/[?#]/)[0]);
    if (path && !existsSync(join(root, path))) errors.push(`${file}: link to missing file "${href}"`);
  };
  const visit = (file, href, anchors) => {
    if (!href || SKIP.test(href)) return;
    if (/^https?:\/\//i.test(href)) { if (!external.has(href)) external.set(href, file); return; }
    if (href.startsWith('#')) {
      const id = decodeURIComponent(href.slice(1));
      if (id && !anchors.has(id)) errors.push(`${file}: link to missing anchor "${href}"`);
      return;
    }
    local(file, href);
  };

  // index.html: ids plus data-surface values (#teach switches surface)
  const ids = new Set([
    ...[...html.matchAll(/\bid="([^"]+)"/g)].map((m) => m[1]),
    ...[...html.matchAll(/\bdata-surface="([^"]+)"/g)].map((m) => m[1]),
  ]);
  for (const tag of html.matchAll(/<(?:a|link|img|script|source)\b[^>]*>/gi)) {
    if (/\brel="[^"]*preconnect/i.test(tag[0])) continue;
    const m = /\b(?:href|src)="([^"]*)"/i.exec(tag[0]);
    if (m) visit('index.html', decode(m[1]), ids);
  }

  // README.md: anchors are GitHub heading slugs
  if (readme) {
    const prose = readme.replace(/^```[\s\S]*?^```/gm, '');
    const slugs = new Set([...prose.matchAll(/^#{1,6}\s+(.+?)\s*#*\s*$/gm)].map((m) => githubSlug(m[1].replace(/`/g, ''))));
    for (const m of prose.replace(/`[^`\n]*`/g, '').matchAll(/\]\(([^)\s]+)(?:\s+"[^"]*")?\)/g)) visit('README.md', m[1], slugs);
  }

  if (!offline) {
    const queue = [...external.entries()];
    const worker = async () => {
      for (let item = queue.shift(); item; item = queue.shift()) {
        const [url, file] = item;
        try {
          const status = await probe(url, fetchImpl, timeoutMs);
          if (status >= 400) warnings.push(`${file}: ${url} returned ${status}`);
        } catch (e) {
          warnings.push(`${file}: ${url} could not be reached (${e.message || e})`);
        }
      }
    };
    await Promise.all(Array.from({ length: 8 }, worker));
  }
  return { errors, warnings };
}

// ── CLI ──
export async function main(argv = []) {
  const { readFileSync: read } = await import('node:fs');
  const { fileURLToPath } = await import('node:url');
  const root = fileURLToPath(new URL('..', import.meta.url));
  const file = (f) => read(new URL(`../${f}`, import.meta.url), 'utf8');
  const terms = loadTerms();
  const html = file('index.html'), readme = file('README.md'), llms = file('llms.txt'), sitemapXml = file('sitemap.xml');

  const errors = [
    ...checkFaq(html),
    ...checkBanned(crawlerText(html, { skipCode: true }), terms, 'index.html'),
    ...checkBanned(stripMdCode(readme), terms, 'README.md'),
    ...checkBanned(stripMdCode(llms), terms, 'llms.txt'),
    ...checkStatusPills(html, terms),
    ...checkTermsTable(readme, terms),
    ...checkStructure(html),
    ...checkNoJs(html, terms),
    ...checkDates(html, sitemapXml),
  ];
  const links = await checkLinks({ html, readme, root, offline: argv.includes('--offline') });
  errors.push(...links.errors);

  errors.forEach((e) => console.log(`✗ ${e}`));
  links.warnings.forEach((w) => console.log(`! ${w}`));
  console.log(`\ncheck-copy: ${errors.length} error(s), ${links.warnings.length} warning(s)${argv.includes('--offline') ? ' (external links skipped)' : ''}`);
  return errors.length ? 1 : 0;
}

import { pathToFileURL } from 'node:url';
if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  process.exitCode = await main(process.argv.slice(2));
}
