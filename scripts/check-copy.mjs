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
export function visibleText(html) {
  return textOf(html
    .replace(/<!--[\s\S]*?-->/g, ' ')
    .replace(/<style\b[\s\S]*?<\/style>/gi, ' ')
    .replace(/<script\b[\s\S]*?<\/script>/gi, ' '));
}

function ldBlocks(html) {
  return [...html.matchAll(/<script\b[^>]*type=["']application\/ld\+json["'][^>]*>([\s\S]*?)<\/script>/gi)].map((m) => m[1]);
}

function strings(v, out = []) {
  if (typeof v === 'string') out.push(v);
  else if (v && typeof v === 'object') Object.values(v).forEach((x) => strings(x, out));
  return out;
}

/** visibleText plus meta content, alt text and JSON-LD strings. */
export function crawlerText(html) {
  const attrs = [
    ...[...html.matchAll(/<meta\b[^>]*\bcontent="([^"]*)"/gi)].map((m) => m[1]),
    ...[...html.matchAll(/\balt="([^"]*)"/gi)].map((m) => m[1]),
  ].map(decode);
  const ld = ldBlocks(html).flatMap((b) => { try { return strings(JSON.parse(b)); } catch { return [b]; } });
  return [visibleText(html), ...attrs, ...ld].join('\n');
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
  return [...html.matchAll(/<(\w+)\b[^>]*class="([^"]*)"[^>]*>([\s\S]*?)<\/\1>/g)]
    .filter((m) => m[2].split(/\s+/).includes('status'))
    .map((m) => textOf(m[3]))
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
  ldBlocks(html).forEach((b, i) => {
    try { JSON.parse(b); } catch (e) { errs.push(`index.html: JSON-LD block ${i + 1} does not parse: ${e.message}`); }
  });
  return errs;
}
