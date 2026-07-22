# Koine registries

Shared, versioned vocabularies that the protocol specs reference by name. A registry is
**data, not prose** — machine-readable TSV that producers and consumers load at runtime so
they agree on the exact same terms.

## Relation registry

The vocabulary of relations that may appear in a claim (KINP §4 / KGP §3). Governs argument
order, arity, symmetry, and portability tier — the facts that make claim normalization
(KGP §3.2) deterministic across producers.

**Governance (ratified 2026-07-17 — closes KGP §9 Q1):** a **shared core** plus
**namespaced domain extensions**.

- `relations.tsv` — the **core** vocabulary. Unqualified relation names. Every project loads it.
- `relations/<domain>.tsv` — **domain extensions**. Relation names are qualified with a domain
  prefix (`cine:shows`, `ling:cognate_of`, `dsp:modulates`). A project loads only the domains
  it speaks. Example: [`relations/cinematography.tsv`](relations/cinematography.tsv).

New relations are added by PR. A relation's signature is **immutable once published** —
changing arity/arg-order/symmetry would silently change every dependent `claim` id (KGP §3),
so a change means a **new** relation name, never an edit in place.

### Columns (`*.tsv`)

| Column | Meaning |
|---|---|
| `relation` | canonical name (`snake_case`; domain-qualified in extension files) |
| `arity` | number of arguments |
| `arg_roles` | ordered, `\|`-separated role names — **fixes canonical argument order** (KGP §3.2 rule 1) |
| `symmetric` | `true` ⇒ operands sorted before hashing (KGP §3.2 rule 2) |
| `tier` | `grounding-only` \| `horn-safe` \| `full-prolog` (KGP §5) |
| `domain` | `core` or the extension domain |
| `inverse` | inverse relation name, if any (else empty) |
| `description` | one line |

The tiers **nest** (`grounding-only` ⊂ `horn-safe` ⊂ `full-prolog`): a relation's `tier` is the
*lowest* tier that can carry it, so a `grounding-only` relation is safe in a `horn-safe` pack.

## Bridge mappings — [`predicate-mapping.json`](predicate-mapping.json)

How each bridged project's own predicates cross into the canonical node/edge vocabulary
(Pinakes hosts the canonical schema). Lifted **verbatim** out of pinakes
`shared/predicate-mapping.json` (merged as `17f0713`) — it was already a machine-validated
cross-project registry carrying `portabilityClasses`, `idSpaces`, `temporalFieldMap` and a
multi-`projects` shape; ADR-0002's amendment ruled it be *lifted*, not rebuilt. It covers
`argos` today; the `insimul` slot is filled by `20-shared-relation-registry` US-SRR3.

**One vocabulary.** The mapping file does not coin relation names. A mapping whose
`canonicalKind` is `edge` or `derived-rule` crosses as a KGP claim and names the registry
relation(s) it normalizes to in `koineRelations`; every other kind (`node`, `node-property`,
`provenance`, `temporal`, `rule`) is not a relation and leaves `koineRelations` empty. A
bridged predicate with no registry relation is closed by **adding the relation to the TSV**,
never by naming it only in the mapping — that is what keeps this from becoming a second source
of truth. (The lift added exactly one: `media:mentions`, the reference-not-depiction
counterpart of `cine:shows`, for Argos's `refers_to` → `mentions`.)

`portabilityClasses` there still bundles two orthogonal axes — the KGP §5 **dialect** tiers and
the §7.2 **egress** class `local-only`. KGP 0.4.0 separated them; US-SRR2 splits the registry
key to match. Neither is the provenance **trust** tier (ADR-0002, "Terminology collisions").

### Canonical home (decided here)

| | |
|---|---|
| **Data / contract** | **koine** — this directory. The only authoritative copy. |
| **Tooling** | **agora** — the schema, validator and loader consumers call (ADR-0001: koine specifies, agora implements). koine ships no code. |
| **pinakes `shared/predicate-mapping.json`** | a declared **generated mirror**, listed in the file's own `mirrors` block: regenerated from this copy, never hand-edited, with the pinakes drift gate comparing the two. Its `shared/predicate-mapping.ts` keeps typing it. Wiring that regeneration is pinakes tasklist `10-pinakes-koine-align`; until then the mirror is byte-identical apart from the fields this lift added. |

A consumer loads the registry **from koine** (over the wire, via the agora loader) or keeps a
declared mirror. It never edits a local copy — that is how the registry forks.

### Immutability

The relation signature rule above (`relation` · `arity` · `arg_roles` · `symmetric`, immutable
once published) is restated in the mapping file as `signaturePolicy` so tooling can enforce it:
the agora validator diffs signatures across `registryVersion`s. Mapping entries are stable the
same way — an entry's `id` and `external` do not change; retarget by adding an entry and
superseding, never by rewriting a published one.
