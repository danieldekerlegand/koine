#!/usr/bin/env node
/**
 * Schema guard — the machine-readable twin of the specs, checked as JSON
 * Schema rather than merely as JSON.
 *
 * `schemas/` is a published contract surface: agora, cuneiform and every
 * export vendor these documents by drift-gated copy, so a defect here does not
 * stay here. Three failures are checked, and all three are SILENT — the file
 * still parses, so nothing downstream reports anything:
 *
 *   1. THE DIALECT. Every document declares draft-2020-12 in `$schema` and
 *      carries the `$id` its filename implies. A `$id` that drifts from its
 *      path breaks the relative `$ref`s that other schemas aim at it.
 *
 *   2. UNKNOWN KEYWORDS. A misspelled keyword (`additionalProperies`,
 *      `requred`) is not an error to a validator — it is an unrecognized
 *      annotation, silently ignored, and the constraint the author meant to
 *      write is simply absent. Every key at a schema position must be a
 *      draft-2020-12 keyword, and every keyword's value must have the shape
 *      the dialect gives it (`required` an array of strings, `pattern` a
 *      regex that compiles, `properties` a map of schemas, …).
 *
 *   3. DANGLING `$ref`s. A schema that parses but whose refs do not resolve
 *      validates nothing: the ref position is unconstrained. Both forms are
 *      resolved — a local `#/$defs/x` pointer and a cross-file
 *      `provenance.schema.json#/$defs/x` — file first, then the JSON pointer
 *      inside it.
 *
 * Fixtures under `schemas/fixtures/` are checked only for the two things that
 * need no validator: they parse, and each names a schema that exists. Whether a
 * golden-positive fixture still SATISFIES its schema is a validator's job, and
 * validators live downstream (ADR-0001).
 *
 * Usage: node scripts/check-schemas.mjs [--json]
 */
import { readdirSync, readFileSync, existsSync } from 'node:fs';
import { join } from 'node:path';

const asJson = process.argv.includes('--json');

const DIR = 'schemas';
const FIXTURE_DIR = join(DIR, 'fixtures');
const DIALECT = 'https://json-schema.org/draft/2020-12/schema';
const ID_BASE = 'https://koine.ecosystem/schemas/';

/** Keywords whose value is itself a schema. */
const SCHEMA_VALUED = [
  'additionalProperties', 'contains', 'contentSchema', 'else', 'if', 'items',
  'not', 'propertyNames', 'then', 'unevaluatedItems', 'unevaluatedProperties',
];
/** Keywords whose value is an array of schemas. */
const SCHEMA_ARRAY = ['allOf', 'anyOf', 'oneOf', 'prefixItems'];
/** Keywords whose value is a map of name → schema. */
const SCHEMA_MAP = ['$defs', 'dependentSchemas', 'patternProperties', 'properties'];
/** Keywords carrying a number. */
const NUMERIC = [
  'exclusiveMaximum', 'exclusiveMinimum', 'maxContains', 'maxItems', 'maxLength',
  'maxProperties', 'maximum', 'minContains', 'minItems', 'minLength',
  'minProperties', 'minimum', 'multipleOf',
];
/** Keywords carrying a string. */
const STRING = [
  '$anchor', '$comment', '$dynamicAnchor', '$dynamicRef', '$id', '$ref', '$schema',
  'contentEncoding', 'contentMediaType', 'description', 'format', 'pattern', 'title',
];
/** Keywords carrying a boolean. */
const BOOLEAN = ['deprecated', 'readOnly', 'uniqueItems', 'writeOnly'];
/** Keywords carrying an arbitrary instance value, checked no further. */
const ANY = ['const', 'default'];

const TYPES = ['array', 'boolean', 'integer', 'null', 'number', 'object', 'string'];

const KNOWN = new Set([
  ...SCHEMA_VALUED, ...SCHEMA_ARRAY, ...SCHEMA_MAP, ...NUMERIC, ...STRING,
  ...BOOLEAN, ...ANY,
  '$vocabulary', 'dependentRequired', 'enum', 'examples', 'required', 'type',
]);

const errors = [];
const docs = new Map(); // filename → parsed document
const refs = []; // { file, at, ref }
let schemaPositions = 0;

const isObject = (v) => v !== null && typeof v === 'object' && !Array.isArray(v);

// ---------------------------------------------------------------- load

for (const entry of readdirSync(DIR).sort()) {
  if (!entry.endsWith('.schema.json')) continue;
  try {
    docs.set(entry, JSON.parse(readFileSync(join(DIR, entry), 'utf8')));
  } catch (err) {
    errors.push(`${DIR}/${entry}: unparseable JSON (${err.message})`);
  }
}

if (docs.size === 0 && errors.length === 0) {
  errors.push(`${DIR}/: no *.schema.json found — the guard would pass vacuously`);
}

// ---------------------------------------------------------------- walk

/** walk one schema position: check its keywords, then recurse. */
function walk(node, file, at) {
  // A boolean is a legal schema (`true` = anything, `false` = nothing).
  if (typeof node === 'boolean') return;
  if (!isObject(node)) {
    errors.push(`${file}${at}: not a schema — expected an object or a boolean, got ${Array.isArray(node) ? 'an array' : typeof node}`);
    return;
  }
  schemaPositions += 1;

  for (const [key, value] of Object.entries(node)) {
    const where = `${file}${at}/${key}`;
    if (!KNOWN.has(key)) {
      errors.push(`${where}: "${key}" is not a draft-2020-12 keyword — a misspelled keyword is silently ignored, so the constraint it means is absent`);
      continue;
    }
    if (STRING.includes(key) && typeof value !== 'string') {
      errors.push(`${where}: must be a string`);
      continue;
    }
    if (NUMERIC.includes(key) && typeof value !== 'number') {
      errors.push(`${where}: must be a number`);
      continue;
    }
    if (BOOLEAN.includes(key) && typeof value !== 'boolean') {
      errors.push(`${where}: must be a boolean`);
      continue;
    }
    switch (key) {
      case 'pattern':
        try { new RegExp(value, 'u'); } catch (err) { errors.push(`${where}: not a valid regular expression (${err.message})`); }
        break;
      case '$ref':
        refs.push({ file, at, ref: value });
        break;
      case 'type': {
        const list = Array.isArray(value) ? value : [value];
        if (list.length === 0) errors.push(`${where}: an empty type array matches nothing`);
        for (const t of list) {
          if (typeof t !== 'string' || !TYPES.includes(t)) {
            errors.push(`${where}: "${t}" is not a JSON Schema type (${TYPES.join(', ')})`);
          }
        }
        break;
      }
      case 'enum':
        if (!Array.isArray(value) || value.length === 0) errors.push(`${where}: must be a non-empty array`);
        break;
      case 'examples':
        if (!Array.isArray(value)) errors.push(`${where}: must be an array`);
        break;
      case 'required':
        if (!Array.isArray(value) || value.some((v) => typeof v !== 'string')) {
          errors.push(`${where}: must be an array of property-name strings`);
        } else if (new Set(value).size !== value.length) {
          errors.push(`${where}: names the same property twice`);
        }
        break;
      case 'dependentRequired':
        if (!isObject(value) || Object.values(value).some((v) => !Array.isArray(v))) {
          errors.push(`${where}: must map a property name to an array of property names`);
        }
        break;
      default:
        break;
    }

    if (SCHEMA_VALUED.includes(key)) walk(value, file, `${at}/${key}`);
    if (SCHEMA_ARRAY.includes(key)) {
      if (!Array.isArray(value) || value.length === 0) {
        errors.push(`${where}: must be a non-empty array of schemas`);
      } else {
        value.forEach((sub, i) => walk(sub, file, `${at}/${key}/${i}`));
      }
    }
    if (SCHEMA_MAP.includes(key)) {
      if (!isObject(value)) {
        errors.push(`${where}: must be an object mapping names to schemas`);
      } else {
        for (const [name, sub] of Object.entries(value)) {
          if (key === 'patternProperties') {
            try { new RegExp(name, 'u'); } catch (err) { errors.push(`${where}/${name}: property pattern is not a valid regular expression (${err.message})`); }
          }
          walk(sub, file, `${at}/${key}/${name}`);
        }
      }
    }
  }

  // A `$ref` alongside `properties`/`required` is legal in 2020-12 but is the
  // classic pre-2019 mistake read back — say so where it appears at the root.
  if (node.$ref && at === '' && (node.properties || node.required)) {
    errors.push(`${file}: the root carries both "$ref" and its own constraints — in draft-2020-12 these compose, which is rarely what a root ref means`);
  }
}

for (const [file, doc] of docs) {
  if (!isObject(doc)) {
    errors.push(`${DIR}/${file}: the root must be an object`);
    continue;
  }
  if (doc.$schema !== DIALECT) {
    errors.push(`${DIR}/${file}: "$schema" must be "${DIALECT}" (got ${JSON.stringify(doc.$schema) ?? 'nothing'})`);
  }
  const wantId = `${ID_BASE}${file}`;
  if (doc.$id !== wantId) {
    errors.push(`${DIR}/${file}: "$id" must be "${wantId}" (got ${JSON.stringify(doc.$id) ?? 'nothing'}) — a $id that drifts from its path breaks every relative $ref aimed at it`);
  }
  walk(doc, `${DIR}/${file}`, '');
}

// ---------------------------------------------------------------- refs

/** Resolve a JSON pointer inside a document; undefined when it dangles. */
function pointer(doc, pointerText) {
  if (pointerText === '' || pointerText === '#') return doc;
  if (!pointerText.startsWith('/')) return undefined;
  let node = doc;
  for (const raw of pointerText.slice(1).split('/')) {
    const token = decodeURIComponent(raw).replace(/~1/g, '/').replace(/~0/g, '~');
    if (Array.isArray(node)) node = node[Number(token)];
    else if (isObject(node)) node = node[token];
    else return undefined;
    if (node === undefined) return undefined;
  }
  return node;
}

let refsChecked = 0;
for (const { file, at, ref } of refs) {
  refsChecked += 1;
  const where = `${file}${at}/$ref`;
  if (/^https?:/i.test(ref)) {
    // An absolute ref is only resolvable here if it names a schema in this dir.
    const local = ref.startsWith(ID_BASE) ? ref.slice(ID_BASE.length).split('#')[0] : null;
    if (!local || !docs.has(local)) {
      errors.push(`${where}: "${ref}" points outside schemas/ — this guard cannot resolve it, so it must not be used`);
      continue;
    }
  }
  const [target, fragment = ''] = ref.split('#');
  const doc = target === '' ? docs.get(file.slice(DIR.length + 1)) : docs.get(target.replace(/^.*\//, ''));
  if (!doc) {
    errors.push(`${where}: "${ref}" names no schema in ${DIR}/`);
    continue;
  }
  if (pointer(doc, fragment) === undefined) {
    errors.push(`${where}: "${ref}" dangles — the pointer resolves to nothing, so this position is UNCONSTRAINED`);
  }
}

// ---------------------------------------------------------------- fixtures

const fixtures = [];
if (existsSync(FIXTURE_DIR)) {
  for (const entry of readdirSync(FIXTURE_DIR).sort()) {
    if (!entry.endsWith('.json')) continue;
    fixtures.push(entry);
    try {
      JSON.parse(readFileSync(join(FIXTURE_DIR, entry), 'utf8'));
    } catch (err) {
      errors.push(`${FIXTURE_DIR}/${entry}: unparseable JSON (${err.message})`);
      continue;
    }
    const schema = `${entry.replace(/\.json$/, '')}.schema.json`;
    if (!docs.has(schema)) {
      errors.push(`${FIXTURE_DIR}/${entry}: names no schema — expected ${DIR}/${schema}`);
    }
  }
}

// ---------------------------------------------------------------- report

if (asJson) {
  console.log(JSON.stringify({
    schemas: [...docs.keys()], schemaPositions, refsChecked, fixtures, errors,
  }, null, 2));
} else {
  console.log(`  ${docs.size} schemas, ${schemaPositions} schema positions, ${refsChecked} $refs, ${fixtures.length} fixtures checked`);
}

if (errors.length) {
  console.error(`\nschemas: ${errors.length} error(s)`);
  for (const e of errors) console.error(`  ${e}`);
  process.exit(1);
}
if (!asJson) console.log('\nschemas: OK — every document is draft-2020-12, every keyword is one, and every $ref resolves');
