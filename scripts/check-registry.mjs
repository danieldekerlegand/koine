#!/usr/bin/env node
/**
 * Registry guard — the shared vocabularies, checked as data.
 *
 * `registry/` is data, not prose: producers and consumers load these TSVs at
 * runtime so they agree on the exact same terms, and downstream repos vendor
 * them by drift-gated copy. A malformed row here is therefore not a local
 * defect — it is a failing drift gate in every repo that carries the copy, and
 * a claim id that no two producers compute the same way.
 *
 * Three things are checked:
 *
 *   1. COLUMN SHAPE. Each file's header must be exactly the columns its kind
 *      declares below, every row must carry exactly that many fields, and no
 *      cell may be padded, blank where it is required, or hiding a CR. A row
 *      short one tab silently shifts every value after it into the wrong
 *      column — `tier` reads as a domain, `inverse` reads as a description,
 *      and the file still loads.
 *
 *   2. DUPLICATE IDS. A relation name, entity type, media type or enum token
 *      appearing twice means one name with two signatures. For a relation that
 *      is the sharpest failure this repo has: a signature fixes canonical
 *      argument order AND argument type (KGP §3.2), so two of them means two
 *      claim ids for the same claim. Relation names are unique across the CORE file and every
 *      domain file at once, not merely within one file.
 *
 *   3. REFERENTIAL INTEGRITY. Every cross-file pointer resolves: a domain
 *      file's rows carry that file's own prefix and `domain`, a media type's
 *      `lineage_relation` names a relation that exists, and an entity type's
 *      `refinement_enum` names an enum file that exists whose token column is
 *      the `refinement` it claims.
 *
 * An `inverse` is NOT required to be a declared relation — the registry names
 * inverses it has not minted (`has_part`, `soc:child_of`), which is deliberate.
 * What is checked is that a declared one agrees: a symmetric relation has no
 * inverse, and where both halves of a pair exist they name each other and
 * reverse each other's roles and arg_types.
 *
 * A TSV under registry/ that matches no kind below is an ERROR, not a file the
 * guard skips: an ungated registry file is exactly what this guard exists to
 * make impossible.
 *
 * Usage: node scripts/check-registry.mjs [--json]
 */
import { readdirSync, readFileSync, existsSync, statSync } from 'node:fs';
import { join } from 'node:path';

const asJson = process.argv.includes('--json');

const DIR = 'registry';
const RELATION_COLUMNS = ['relation', 'arity', 'arg_roles', 'arg_types', 'symmetric', 'tier', 'domain', 'inverse', 'description'];
const TIERS = ['grounding-only', 'horn-safe', 'full-prolog'];
/**
 * The closed argument-type vocabulary. `id` selects KGP §3.2 rule 3
 * (canonical CURIE); every other token selects one branch of rule 5, naming it
 * outright so rule 5's "when a bare literal is ambiguous" judgement never has to
 * be made for a registered relation.
 */
const ARG_TYPES = ['id', 'string', 'integer', 'decimal', 'boolean', 'datetime'];
const NAME = /^[a-z][a-z0-9_]*$/;
const QUALIFIED = /^[a-z][a-z0-9_]*:[a-z][a-z0-9_]*$/;
/** Columns that may be empty; every other column of a kind is required. */
const OPTIONAL = { relations: ['inverse'] };

const errors = [];

/** The kind of registry file a path is, and the columns it must carry. */
function kindOf(path) {
  if (path === 'registry/relations.tsv') return { kind: 'relations', core: true, columns: RELATION_COLUMNS };
  if (/^registry\/relations\/[^/]+\.tsv$/.test(path)) return { kind: 'relations', core: false, columns: RELATION_COLUMNS };
  if (path === 'registry/entity-types.tsv') {
    return { kind: 'entity-types', columns: ['entity_type', 'plane', 'refinement', 'refinement_enum', 'external_anchor', 'description'] };
  }
  if (path === 'registry/media-types.tsv') {
    return { kind: 'media-types', columns: ['media_type', 'category', 'lineage_relation', 'description'] };
  }
  const enumMatch = path.match(/^registry\/enums\/([^/]+)\.tsv$/);
  // An enum's token column is its filename, so a file cannot be renamed out of
  // step with the column the specs cite.
  if (enumMatch) return { kind: 'enum', columns: null, token: enumMatch[1] };
  return null;
}

// ---------------------------------------------------------------- read

function tsvFiles(dir) {
  const out = [];
  for (const entry of readdirSync(dir, { withFileTypes: true }).sort((a, b) => a.name.localeCompare(b.name))) {
    const path = join(dir, entry.name);
    if (entry.isDirectory()) out.push(...tsvFiles(path));
    else if (entry.name.endsWith('.tsv')) out.push(path);
  }
  return out;
}

/** Parse one TSV into { columns, rows } after checking its shape. */
function parse(path, spec) {
  const raw = readFileSync(path, 'utf8');
  if (raw === '') {
    errors.push(`${path}: empty`);
    return null;
  }
  if (raw.includes('\r')) errors.push(`${path}: contains a carriage return — these files are LF, and a CR rides into the last cell of every row`);
  if (!raw.endsWith('\n')) errors.push(`${path}: no trailing newline — the last row appends to whatever is concatenated after it`);

  const lines = raw.replace(/\n$/, '').split('\n');
  const header = lines[0].split('\t');
  const columns = spec.columns ?? [spec.token, ...header.slice(1)];

  if (spec.columns && header.join('\t') !== spec.columns.join('\t')) {
    errors.push(`${path}: header is [${header.join(', ')}] — a ${spec.kind} file's columns are [${spec.columns.join(', ')}]`);
    return null;
  }
  if (!spec.columns) {
    if (header[0] !== spec.token) errors.push(`${path}: first column is "${header[0]}" — an enum's token column is its filename, "${spec.token}"`);
    if (header[header.length - 1] !== 'description') errors.push(`${path}: last column is "${header[header.length - 1]}" — every registry file's last column is "description"`);
    if (header.length < 2) errors.push(`${path}: needs at least a token column and a description`);
  }

  const rows = [];
  for (let i = 1; i < lines.length; i += 1) {
    const line = lines[i];
    const at = `${path}:${i + 1}`;
    if (line.trim() === '') {
      errors.push(`${at}: blank line — a registry file is rows only`);
      continue;
    }
    const cells = line.split('\t');
    if (cells.length !== columns.length) {
      errors.push(`${at}: ${cells.length} field(s), header declares ${columns.length} — a missing tab shifts every value after it into the wrong column`);
      continue;
    }
    const row = {};
    const optional = OPTIONAL[spec.kind] ?? [];
    columns.forEach((column, c) => {
      const value = cells[c];
      if (value !== value.trim()) errors.push(`${at}: "${column}" is padded with whitespace ("${value}") — a padded cell is a different token`);
      if (value.trim() === '' && !optional.includes(column)) errors.push(`${at}: "${column}" is empty and is required`);
      row[column] = value.trim();
    });
    row.$at = at;
    rows.push(row);
  }

  // The id column is the first one, and it is the file's key.
  const seen = new Map();
  for (const row of rows) {
    const id = row[columns[0]];
    if (seen.has(id)) errors.push(`${row.$at}: duplicate ${columns[0]} "${id}" — already declared at ${seen.get(id)}`);
    else seen.set(id, row.$at);
  }
  return { columns, rows };
}

// ---------------------------------------------------------------- check

const relations = new Map(); // name → { row, path, domain }
const parsed = new Map(); // path → { columns, rows }
const files = [];

if (!existsSync(DIR) || !statSync(DIR).isDirectory()) {
  errors.push(`${DIR}/: missing`);
}

for (const path of existsSync(DIR) ? tsvFiles(DIR) : []) {
  const spec = kindOf(path);
  if (!spec) {
    errors.push(`${path}: matches no registry kind — add its columns to scripts/check-registry.mjs rather than shipping an unchecked vocabulary`);
    continue;
  }
  const table = parse(path, spec);
  if (!table) continue;
  parsed.set(path, table);
  files.push({ path, kind: spec.kind, rows: table.rows.length });

  if (spec.kind !== 'relations') continue;

  // A domain file declares ONE domain, and every name in it carries it as a prefix.
  const domains = new Set(table.rows.map((r) => r.domain));
  if (!spec.core && domains.size > 1) {
    errors.push(`${path}: declares ${domains.size} domains (${[...domains].join(', ')}) — a domain file is one domain`);
  }

  for (const row of table.rows) {
    const { relation, arity, arg_roles: argRoles, arg_types: argTypes, symmetric, tier, domain, inverse } = row;

    if (spec.core) {
      if (domain !== 'core') errors.push(`${row.$at}: domain "${domain}" — every relation in the core file is domain "core"`);
      if (!NAME.test(relation)) errors.push(`${row.$at}: "${relation}" is not an unqualified snake_case name — a core relation carries no domain prefix`);
    } else {
      if (domain === 'core') errors.push(`${row.$at}: domain "core" in a domain file — the core vocabulary is registry/relations.tsv`);
      if (!QUALIFIED.test(relation)) errors.push(`${row.$at}: "${relation}" is not a domain-qualified name (expected "${domain}:<snake_case>")`);
      else if (relation.split(':')[0] !== domain) errors.push(`${row.$at}: "${relation}" carries prefix "${relation.split(':')[0]}" but declares domain "${domain}"`);
    }

    // One name, one signature — across the core file and every domain file.
    // A repeat WITHIN a file is already reported as a duplicate id above; this
    // catches the cross-file case, which no per-file key check can see.
    const prior = relations.get(relation);
    if (prior && prior.path !== path) {
      errors.push(`${row.$at}: relation "${relation}" is already declared at ${prior.row.$at} — one name with two signatures is two claim ids for the same claim`);
    } else if (!prior) {
      relations.set(relation, { row, path });
    }

    const roles = argRoles.split('|');
    const types = argTypes.split('|');
    if (!/^[1-9][0-9]*$/.test(arity)) {
      errors.push(`${row.$at}: arity "${arity}" is not a positive integer`);
    } else if (Number(arity) !== roles.length) {
      errors.push(`${row.$at}: arity ${arity} but ${roles.length} arg_role(s) [${argRoles}] — arg_roles is what fixes canonical argument order (KGP §3.2)`);
    }
    for (const role of roles) {
      if (!NAME.test(role)) errors.push(`${row.$at}: arg_role "${role}" is not snake_case`);
    }
    if (new Set(roles).size !== roles.length) errors.push(`${row.$at}: arg_roles [${argRoles}] repeats a role — the order it fixes would be ambiguous`);

    // arg_types is POSITIONAL and parallel to arg_roles: one token per argument,
    // in the same order. It is what decides, per position, whether KGP §3.2 rule 3
    // or rule 5 canonicalizes the argument — so a missing or wrong-length value is
    // two producers hashing one observation two ways (INT-3).
    if (types.length !== roles.length) {
      errors.push(`${row.$at}: ${roles.length} arg_role(s) [${argRoles}] but ${types.length} arg_type(s) [${argTypes}] — arg_types is positional and parallel to arg_roles`);
    }
    for (const type of types) {
      if (!ARG_TYPES.includes(type)) errors.push(`${row.$at}: arg_type "${type}" is not one of ${ARG_TYPES.join(' | ')}`);
    }

    if (symmetric !== 'true' && symmetric !== 'false') errors.push(`${row.$at}: symmetric "${symmetric}" is not true|false`);
    // Rule 2 sorts a symmetric relation's operands against each other, which is
    // only meaningful where they are the same kind of thing.
    if (symmetric === 'true' && new Set(types).size > 1) {
      errors.push(`${row.$at}: symmetric relation "${relation}" mixes arg_types [${argTypes}] — KGP §3.2 rule 2 sorts its operands against each other, so they are one type`);
    }
    if (!TIERS.includes(tier)) errors.push(`${row.$at}: tier "${tier}" is not one of ${TIERS.join(' | ')}`);

    if (inverse !== '') {
      if (symmetric === 'true') errors.push(`${row.$at}: symmetric relation "${relation}" declares an inverse ("${inverse}") — a symmetric relation IS its own inverse`);
      if (inverse === relation) errors.push(`${row.$at}: "${relation}" names itself as its inverse`);
      if (!NAME.test(inverse) && !QUALIFIED.test(inverse)) errors.push(`${row.$at}: inverse "${inverse}" is not a relation name`);
    }
  }
}

// Cross-file: a declared inverse pair must agree in both directions.
for (const [name, { row }] of relations) {
  const inverse = row.inverse;
  if (inverse === '' || !relations.has(inverse)) continue;
  const other = relations.get(inverse).row;
  if (other.inverse !== name) {
    errors.push(`${row.$at}: "${name}" names inverse "${inverse}", but ${other.$at} names inverse "${other.inverse || '(none)'}" — an inverse pair agrees in both directions`);
  }
  const roles = row.arg_roles.split('|');
  const otherRoles = other.arg_roles.split('|');
  if (roles.join('|') !== [...otherRoles].reverse().join('|')) {
    errors.push(`${row.$at}: "${name}" [${row.arg_roles}] and its inverse "${inverse}" [${other.arg_roles}] do not reverse each other's roles`);
  }
  const types = row.arg_types.split('|');
  const otherTypes = other.arg_types.split('|');
  if (types.join('|') !== [...otherTypes].reverse().join('|')) {
    errors.push(`${row.$at}: "${name}" [${row.arg_types}] and its inverse "${inverse}" [${other.arg_types}] do not reverse each other's arg_types`);
  }
}

// Cross-file: media-types → relations, entity-types → enums. Both tables were
// parsed above; re-parsing would report every shape error in them twice.
for (const row of parsed.get(join(DIR, 'media-types.tsv'))?.rows ?? []) {
  if (row.lineage_relation && !relations.has(row.lineage_relation)) {
    errors.push(`${row.$at}: lineage_relation "${row.lineage_relation}" is in no relation file — a lineage predicate is named in the relation registry, never only here`);
  }
}

for (const row of parsed.get(join(DIR, 'entity-types.tsv'))?.rows ?? []) {
  const target = join(DIR, row.refinement_enum);
  if (!existsSync(target)) {
    errors.push(`${row.$at}: refinement_enum "${row.refinement_enum}" resolves to no file (${target})`);
    continue;
  }
  const column = readFileSync(target, 'utf8').split('\n')[0].split('\t')[0];
  if (column !== row.refinement) {
    errors.push(`${row.$at}: refinement "${row.refinement}" but ${target}'s token column is "${column}"`);
  }
}

// ---------------------------------------------------------------- report

if (asJson) {
  console.log(JSON.stringify({ files, relations: [...relations.keys()].sort(), errors }, null, 2));
} else {
  for (const { path, kind, rows } of files) {
    console.log(`  ${path.padEnd(38)} ${String(rows).padStart(3)} row(s)  ${kind}`);
  }
  console.log(`  ${relations.size} relation names, unique across the core file and every domain file`);
}

if (errors.length) {
  console.error(`\nregistry: ${errors.length} error(s)`);
  for (const e of errors) console.error(`  ${e}`);
  process.exit(1);
}
if (!asJson) console.log('\nregistry: OK — column shape holds, no id is declared twice, and every cross-file reference resolves');
