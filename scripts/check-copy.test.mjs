import { test } from 'node:test';
import assert from 'node:assert/strict';
import {
  loadTerms, visibleText, crawlerText, stripCode, stripMdCode,
  checkBanned, checkStatusPills, checkTermsTable, checkStructure,
} from './check-copy.mjs';

const terms = loadTerms();

// ── Text helpers ──
test('visibleText drops script, style and comments', () => {
  assert.equal(visibleText('<style>a{}</style><!--x--><p>Hi&amp;yo</p><script>z()</script>'), 'Hi&yo');
});

test('stripMdCode removes fenced and inline code', () => {
  assert.equal(stripMdCode('a `token spine` b\n```\ntoken spine\n```\nc').replace(/\s+/g, ' ').trim(), 'a b c');
});

// ── Banned terms ──
test('banned: avoided phrase fails case-insensitively', () => {
  const errs = checkBanned('The Token Spine is here', terms, 'f');
  assert.equal(errs.length, 1);
  assert.match(errs[0], /"token layer"/);
});

test('banned: meta content and JSON-LD are scanned, style comments are not', () => {
  const html = '<meta name="description" content="a token spine"><style>/* token spine */</style>'
    + '<script type="application/ld+json">{"a":"the main accent"}</script><script>/* second accent */</script>';
  assert.equal(checkBanned(crawlerText(html), terms, 'f').length, 2);
});

test('banned: lowercase colour name in prose fails, inside code passes', () => {
  assert.equal(checkBanned(stripCode('<p>the chalkboard teal</p>'), terms, 'f').length, 1);
  assert.equal(checkBanned(stripCode('<code>chalkboard teal</code>'), terms, 'f').length, 0);
  assert.equal(checkBanned(stripCode('<p>the Chalkboard Teal</p>'), terms, 'f').length, 0);
});

// ── Status pills ──
test('status pills: "err" fails, "error" passes', () => {
  assert.equal(checkStatusPills('<span class="status status-err">err</span>', terms).length, 1);
  assert.equal(checkStatusPills('<span class="status status-err">error</span><span class="status status-ok">ok</span>', terms).length, 0);
});

// ── README Terms table ──
const goodReadme = '# X\n\n## Terms\n\n| Idea | Use | Avoid |\n|---|---|---|\n'
  + terms.terms.map((t) => `| ${t.idea} | ${t.use} | ${t.avoid.join(', ')} |`).join('\n') + '\n\n## Next\n';

test('terms table: complete table passes', () => {
  assert.deepEqual(checkTermsTable(goodReadme, terms), []);
});

test('terms table: missing row fails', () => {
  const readme = goodReadme.split('\n').filter((l) => !l.includes('support accent')).join('\n');
  assert.equal(checkTermsTable(readme, terms).length, 1);
});

test('terms table: missing section fails', () => {
  assert.equal(checkTermsTable('# X\n', terms).length, 1);
});

// ── Structure ──
const ld = '<script type="application/ld+json">{"a":1}</script>';

test('structure: valid page passes', () => {
  assert.deepEqual(checkStructure(`${ld}<h1>A</h1><button><span>b</span></button><h2>c</h2>`), []);
});

test('structure: two h1 fail', () => {
  assert.equal(checkStructure(`${ld}<h1>A</h1><h1>B</h1>`).length, 1);
});

test('structure: heading in button fails', () => {
  assert.equal(checkStructure(`${ld}<h1>A</h1><button type="button"><h3>x</h3></button>`).length, 1);
});

test('structure: bad JSON-LD fails', () => {
  assert.equal(checkStructure('<script type="application/ld+json">{bad</script><h1>A</h1>').length, 1);
});

// ── FAQ ↔ JSON-LD ──
import { checkFaq, checkNoJs, checkDates } from './check-copy.mjs';

const faqPage = (pairs, ldPairs = pairs) =>
  '<script type="application/ld+json">' + JSON.stringify({ '@graph': [{ '@type': 'FAQPage', mainEntity:
    ldPairs.map(([q, a]) => ({ '@type': 'Question', name: q, acceptedAnswer: { '@type': 'Answer', text: a } })) }] })
  + '</script>' + pairs.map(([q, a]) => `<details class="qa"><summary><h3>${q}</h3></summary><p>${a}</p></details>`).join('');

test('faq: matching pair passes', () => {
  assert.deepEqual(checkFaq(faqPage([['Q one?', 'Answer one.']])), []);
});

test('faq: one-word drift fails', () => {
  const errs = checkFaq(faqPage([['Q?', 'The quick fox.']], [['Q?', 'The slow fox.']]));
  assert.equal(errs.length, 1);
  assert.match(errs[0], /quick/);
  assert.match(errs[0], /slow/);
});

test('faq: tags and entities are normalised before compare', () => {
  assert.deepEqual(checkFaq(faqPage([['Q?', 'Run <code>npm i x</code> &amp; go.']], [['Q?', 'Run npm i x & go.']])), []);
});

test('faq: count mismatch fails', () => {
  assert.equal(checkFaq(faqPage([['A?', 'a.'], ['B?', 'b.']], [['A?', 'a.']])).length >= 1, true);
});

// ── No-JS copy ──
const fullPage = (extra = '') => faqPage([['What is Dialects?', 'A layer.']])
  + `<p>${terms.noJsRequired.join('. ')}.</p><p>${terms.colourNames.join(', ')}</p>${extra}`;

test('nojs: complete page passes', () => {
  assert.deepEqual(checkNoJs(fullPage(), terms), []);
});

test('nojs: colour name only inside a script fails', () => {
  const html = fullPage().replace('Pink Chalk', 'X') + '<script>var n = "Pink Chalk";</script>';
  const errs = checkNoJs(html, terms);
  assert.equal(errs.length, 1);
  assert.match(errs[0], /Pink Chalk/);
});

test('nojs: FAQ question missing from visible text fails', () => {
  const html = fullPage().replace('<h3>What is Dialects?</h3>', '<h3></h3>');
  assert.equal(checkNoJs(html, terms).length, 1);
});

// ── Dates ──
const sitemap = (d) => `<urlset><url><loc>x</loc><lastmod>${d}</lastmod></url></urlset>`;
const footer = (d) => `<footer><time datetime="${d}">x</time></footer>`;

test('dates: equal passes', () => {
  assert.deepEqual(checkDates(footer('2026-11-13'), sitemap('2026-11-13')), []);
});

test('dates: differ fails', () => {
  assert.equal(checkDates(footer('2026-11-13'), sitemap('2026-11-12')).length, 1);
});

test('dates: missing time fails', () => {
  assert.equal(checkDates('<footer></footer>', sitemap('2026-11-12')).length, 1);
});

// ── Links ──
import { githubSlug, checkLinks } from './check-copy.mjs';
import { mkdtempSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';

const root = mkdtempSync(join(tmpdir(), 'copy-'));
writeFileSync(join(root, 'llms.txt'), 'x');
const ok200 = async () => ({ status: 200 });
const page = (body) => `<button data-surface="teach">t</button><section id="faq"></section>${body}`;

test('slug: "Search and AI visibility" -> "search-and-ai-visibility"', () => {
  assert.equal(githubSlug('Search and AI visibility'), 'search-and-ai-visibility');
  assert.equal(githubSlug('Tailwind (optional, v3.4+)'), 'tailwind-optional-v34');
});

test('links: surface hashes pass, unknown hash fails', async () => {
  const good = await checkLinks({ html: page('<a href="#teach">t</a><a href="#faq">f</a>'), readme: '', root, fetchImpl: ok200 });
  assert.deepEqual(good.errors, []);
  const bad = await checkLinks({ html: page('<a href="#nope">n</a>'), readme: '', root, fetchImpl: ok200 });
  assert.equal(bad.errors.length, 1);
});

test('links: missing relative file fails', async () => {
  const r = await checkLinks({ html: page('<a href="llms.txt">a</a><link href="gone.png">'), readme: '', root, fetchImpl: ok200 });
  assert.equal(r.errors.length, 1);
  assert.match(r.errors[0], /gone\.png/);
});

test('links: 404 becomes a warning', async () => {
  const r = await checkLinks({ html: page('<a href="https://x.test/a">a</a>'), readme: '', root, fetchImpl: async () => ({ status: 404 }) });
  assert.deepEqual(r.errors, []);
  assert.equal(r.warnings.length, 1);
});

test('links: fetch rejection becomes a warning', async () => {
  const r = await checkLinks({ html: page('<a href="https://x.test/a">a</a>'), readme: '', root, fetchImpl: async () => { throw new Error('offline'); } });
  assert.deepEqual(r.errors, []);
  assert.equal(r.warnings.length, 1);
});

test('links: README anchor to missing heading fails', async () => {
  const readme = '# T\n\n## Colour names\n\n[a](#colour-names) [b](#nope) [c](llms.txt) [d](mailto:a@b.c)\n';
  const r = await checkLinks({ html: page(''), readme, root, fetchImpl: ok200 });
  assert.equal(r.errors.length, 1);
  assert.match(r.errors[0], /#nope/);
});

test('links: offline skips external fetches', async () => {
  let called = false;
  const r = await checkLinks({ html: page('<a href="https://x.test/a">a</a>'), readme: '', root, offline: true, fetchImpl: async () => { called = true; return { status: 200 }; } });
  assert.equal(called, false);
  assert.deepEqual(r, { errors: [], warnings: [] });
});

test('status pills: pill nested inside another classed element is still checked', () => {
  assert.equal(checkStatusPills('<div class="row"><span class="status status-err">err</span></div>', terms).length, 1);
});
