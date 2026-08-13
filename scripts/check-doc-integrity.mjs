#!/usr/bin/env node
/**
 * Doc-integrity guard — the two ways this repo's prose goes stale, made
 * machine-checkable. Both failures are silent: a reader sees a sentence that
 * is merely wrong, with nothing to signal it.
 *
 *   1. LINKS. Every relative Markdown link — to a file, or to a `#heading`
 *      anchor within one — must resolve. `http(s)`, `mailto:`, and the URI
 *      schemes the specs quote (`kinp:`, `did:`, `urn:`) are external and are
 *      not this repo's problem. A citation of ADR-0002/0003/0004 is likewise
 *      not a broken link: those are deliberately-not-here records (see
 *      `decisions/README.md`), which is why they are cited as text, never
 *      linked. Nothing in this repo may LINK out to the operator's private
 *      integration repo, so there is no allowlist for one.
 *
 *   2. THE STATUS MIRROR. A spec's version + status live in its own header
 *      and that header is the ONLY authority. Three tables restate it so the
 *      set can be scanned at once — `README.md`, `specs/README.md`, and
 *      `ECOSYSTEM.md` §2 — and a fourth restatement lives in prose in
 *      `CLAUDE.md`. Bump a header without touching the mirrors and the repo
 *      claims two versions of the same spec. On disagreement the header wins
 *      and the TABLE is the thing to fix.
 *
 * Neither check reads a normative clause; this guard cannot tell you a spec is
 * wrong, only that two places disagree about what it says.
 *
 * Usage: node scripts/check-doc-integrity.mjs [--json]
 */
import { readdirSync, readFileSync, existsSync, statSync } from 'node:fs';
import { join, dirname, normalize, relative } from 'node:path';

const asJson = process.argv.includes('--json');

const EXTERNAL = /^(https?|mailto|tel|data|urn|did|kinp|ftp):/i;
const MD_LINK = /(?<!!)\[[^\]]*\]\(\s*([^)\s]+)(?:\s+"[^"]*")?\s*\)/g;
const HEADING = /^ {0,3}#{1,6}\s+(.+?)\s*$/gm;
const EXPLICIT_ANCHOR = /<a\s+(?:name|id)="([^"]+)"/g;

/** Directories whose Markdown is part of the published contract surface. */
const DOC_DIRS = ['.', 'specs', 'decisions', 'docs', 'scenarios', 'schemas', 'registry', 'policy'];
/** The tables that mirror the spec headers. */
const MIRRORS = ['README.md', 'specs/README.md', 'ECOSYSTEM.md'];

const errors = [];

// ---------------------------------------------------------------- collect docs

function markdownUnder(dir) {
  const out = [];
  for (const entry of readdirSync(dir, { withFileTypes: true }).sort((a, b) => a.name.localeCompare(b.name))) {
    if (entry.name.startsWith('.')) continue;
    const path = dir === '.' ? entry.name : join(dir, entry.name);
    if (entry.isDirectory()) out.push(...markdownUnder(path));
    else if (entry.name.endsWith('.md')) out.push(path);
  }
  return out;
}

const docs = DOC_DIRS.filter((d) => existsSync(d))
  .flatMap((d) => (d === '.' ? markdownUnder('.').filter((f) => !f.includes('/')) : markdownUnder(d)));

// ---------------------------------------------------------------- 1. links

/** GitHub's heading→anchor slug, close enough for the headings this repo writes. */
function slugify(heading) {
  return heading
    .replace(/`|\*|_/g, '')
    .replace(/\[([^\]]*)\]\([^)]*\)/g, '$1')
    .toLowerCase()
    .replace(/[^\w\s-]/g, '')
    .trim()
    .replace(/\s+/g, '-');
}

const anchorCache = new Map();
function anchorsOf(file) {
  if (!anchorCache.has(file)) {
    const text = readFileSync(file, 'utf8');
    const set = new Set();
    for (const [, h] of text.matchAll(HEADING)) set.add(slugify(h));
    for (const [, a] of text.matchAll(EXPLICIT_ANCHOR)) set.add(a.toLowerCase());
    anchorCache.set(file, set);
  }
  return anchorCache.get(file);
}

let linksChecked = 0;
for (const file of docs) {
  const text = readFileSync(file, 'utf8');
  const dir = dirname(file);
  for (const match of text.matchAll(MD_LINK)) {
    const url = match[1];
    if (EXTERNAL.test(url)) continue;
    linksChecked += 1;
    const line = text.slice(0, match.index).split('\n').length;
    const at = `${file}:${line}`;

    if (url.startsWith('#')) {
      if (!anchorsOf(file).has(decodeURIComponent(url.slice(1)).toLowerCase())) {
        errors.push(`${at}: no such heading in this file — ${url}`);
      }
      continue;
    }

    const [rawPath, fragment] = url.split('#');
    const path = decodeURIComponent(rawPath).replace(/\/+$/, '');
    if (!path) continue;
    const target = normalize(join(dir, path));
    if (relative('.', target).startsWith('..')) {
      errors.push(`${at}: link escapes the repo — ${url}`);
      continue;
    }
    if (!existsSync(target)) {
      errors.push(`${at}: no such file — ${url}`);
      continue;
    }
    if (fragment && statSync(target).isFile() && target.endsWith('.md')) {
      if (!anchorsOf(target).has(decodeURIComponent(fragment).toLowerCase())) {
        errors.push(`${at}: no such heading in ${target} — #${fragment}`);
      }
    }
  }
}

// ---------------------------------------------------------------- 2. mirrors

const headers = [];
for (const entry of readdirSync('specs').sort()) {
  if (!entry.endsWith('.md') || entry === 'README.md') continue;
  const head = readFileSync(join('specs', entry), 'utf8').slice(0, 1200);
  const version = head.match(/\*\*Spec version:\*\*\s*(\d+\.\d+\.\d+)/)?.[1];
  const status = head.match(/\*\*Status:\*\*\s*([A-Za-z]+)/)?.[1]?.toLowerCase();
  if (!version || !status) {
    errors.push(`specs/${entry}: header is missing "**Spec version:**" or "**Status:**"`);
    continue;
  }
  headers.push({ file: entry, version, status });
}

for (const mirror of MIRRORS) {
  if (!existsSync(mirror)) {
    errors.push(`${mirror}: missing — the status mirror set is ${MIRRORS.join(', ')}`);
    continue;
  }
  const lines = readFileSync(mirror, 'utf8').split('\n');
  for (const { file, version, status } of headers) {
    // The spec's row: a table row that links the spec and carries a semver.
    const rows = lines.filter(
      (l) => l.trimStart().startsWith('|') && l.includes(`${file})`) && /\d+\.\d+\.\d+/.test(l),
    );
    if (rows.length === 0) {
      errors.push(`${mirror}: no row for specs/${file} (header says ${version} ${status})`);
      continue;
    }
    for (const row of rows) {
      if (!row.includes(version) || !row.toLowerCase().includes(status)) {
        errors.push(
          `${mirror}: row for specs/${file} disagrees with its header (${version} ${status}) — fix the table:\n      ${row.trim()}`,
        );
      }
    }
  }
}

// ---------------------------------------------------------------- report

if (asJson) {
  console.log(JSON.stringify({ docs: docs.length, linksChecked, specs: headers, errors }, null, 2));
} else {
  console.log(`  ${docs.length} markdown files, ${linksChecked} relative links checked`);
  for (const { file, version, status } of headers) {
    console.log(`  ${file.replace(/\.md$/, '').padEnd(22)} ${version.padEnd(6)} ${status}`);
  }
}

if (errors.length) {
  console.error(`\ndoc-integrity: ${errors.length} error(s)`);
  for (const e of errors) console.error(`  ${e}`);
  process.exit(1);
}
if (!asJson) console.log(`\ndoc-integrity: OK — every relative link resolves and all ${MIRRORS.length} status tables match their headers`);
