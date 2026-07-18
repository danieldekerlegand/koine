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
