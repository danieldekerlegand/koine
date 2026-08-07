# Koine registries

Shared, versioned vocabularies that the protocol specs reference by name. A registry is
**data, not prose** — machine-readable TSV that producers and consumers load at runtime so
they agree on the exact same terms.

## Relation registry

The vocabulary of relations that may appear in a claim (KINP §4 / KGP §3). Governs argument
order, arity, symmetry, and dialect tier — the facts that make claim normalization
(KGP §3.2) deterministic across producers.

**Governance (ratified 2026-07-17 — closes KGP §9 Q1):** a **shared core** plus
**namespaced domain extensions**.

- `relations.tsv` — the **core** vocabulary. Unqualified relation names. Every project loads it.
- `relations/<domain>.tsv` — **domain extensions**. Relation names are qualified with a domain
  prefix (`cine:shows`, `ling:cognate_of`, `dsp:modulates`). A project loads only the domains
  it speaks: [`relations/cinematography.tsv`](relations/cinematography.tsv) (`cine:`),
  [`relations/media.tsv`](relations/media.tsv) (`media:`),
  [`relations/social.tsv`](relations/social.tsv) (`soc:` — person-level kinship, employment and
  residence, added for a world producer's social vocabulary).

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
| `tier` | the **dialect** tier: `grounding-only` \| `horn-safe` \| `full-prolog` (KGP §5) |
| `domain` | `core` or the extension domain |
| `inverse` | inverse relation name, if any (else empty) |
| `description` | one line |

The tiers **nest** (`grounding-only` ⊂ `horn-safe` ⊂ `full-prolog`): a relation's `tier` is the
*lowest* tier that can carry it, so a `grounding-only` relation is safe in a `horn-safe` pack.

There is no `egress` column: a core or domain relation is `exportable` (the KGP §7.2 default) —
egress is a property of *what a participant's own predicate carries*, so it is declared per entry
on that deployment's own bridge mapping (see below), not on the shared vocabulary.

### Grounding and lineage use the relations that are already here

A producer's adapter (see [ADR-0008](../decisions/ADR-0008-fabric-producer-adapter.md)) needs two
things from this file when it publishes records that point at canonical entities, and
[`relations.tsv`](relations.tsv) already carries both:

| Need | Relation | Semantics it must have — and does |
|---|---|---|
| **Grounding** — "this local record refers to that canonical entity" | `same_as` (`based_on` across a world boundary) | symmetric, `grounding-only`, **licenses fact transfer**; the merged entity is a view over the `same_as` closure computed at query time, never written back (KINP §4.1–§4.3). `based_on` is the non-transferring half of the same firewall, chosen by the KINP §4.5 rule. |
| **Lineage** — "this record/artifact was derived from that one" | `derived_from` | asymmetric (`derived\|source`), `grounding-only`, **licenses no fact transfer** — general derivation, distinct from `based_on`'s modeled-on sense and from the `media:` asset-lineage relations. |

**There is no `mentions` relation, and adding one is out of scope** (ADR-0008 decision 5). A mention
*is* a source-local id (KINP §4.1), so a mention→canonical assertion is exactly a `same_as` between
two ids, hedged by `confidence` (KINP §4.2) and filterable per KGP §7 — a third grounding predicate
would sit outside the §4.3 firewall, express nothing `confidence` does not, and permanently fix a
signature for one pipeline's internal step. Untyped "seen together, no identity claim" is already
`co_occurs`.

## Entity-type, modality-enum & media-type registries (KFT)

The fine-tuning profile ([`../specs/fine-tuning.md`](../specs/fine-tuning.md), KFT) contributes three
small vocabularies so path-matching and validators recognize a finetuned-model entity, its modality,
and its weight/export bytes (closes delta **FT-H**). Like the relation registry these are **data, not
prose**, and each token is **immutable once published** (a change is a **new** token, never an
in-place edit — the same discipline as an immutable relation signature; KGP §9 decision 1).

- [`entity-types.tsv`](entity-types.tsv) — KINP **entity types** and their refinements. Currently the
  KFT `model` type (KFT §5.1): plane `entity`, refined by `modality`, minted (not content-addressed,
  FT-C), external bases carrying a Hub external anchor (FT-G). A `model` is a **fabric entity**, so
  it is registered here — not in a deployment's own node/edge ontology, which describes the entities
  that deployment's knowledge authority stores (see *Deployment instance data* below).
- [`enums/modality.tsv`](enums/modality.tsv) — the closed KFT `modality` enum
  (`text-generation`, `image-text-to-text`, `video-text-to-text`, `text-to-image`, `text-to-video`),
  shared by the model-entity `type` refinement (KFT §5), the `finetune` capability's port types
  (KFT §2), and the job manifest (KFT §3.1). Additive: a new modality adds a row, never a new plane.
- [`media-types.tsv`](media-types.tsv) — the weight/export `media_type`s (KFT §5.3):
  `application/vnd.koine.model+safetensors` (weights) and the `+gguf` / `+onnx` / `+coreml` / `+tflite`
  exports, plus `application/vnd.koine.dataset+jsonl` — a **training-record JSONL** (a
  `dataset-jsonl-header` first line, then one training row per line), which is how a producer's
  training exhaust is referenced from a finetune job's `dataset.records[]` (KFT §4.1, FT-M): the file
  is an ordinary KMI asset, so it needs a registered media type rather than a new plane. Each row
  names the KMI lineage relation ([`relations/media.tsv`](relations/media.tsv)) its artifacts link
  with — weights `media:derived_from` their base, quantized/converted exports `media:variant_of` the
  merged fp16 weights, a record file `media:derived_from` what the emitting run produced.

**Model-lineage relation usage.** Model *entities* link with core lifecycle/lineage relations
([`relations.tsv`](relations.tsv)): a finetuned model `based_on` / `derived_from` its base
(KFT §5.1), and a re-train `retrains` / `supersedes` its predecessor (KFT §5.2) — `retrains` added
to the core file here alongside `supersedes` / `retracts`. Model *weights/exports* are KMI **assets**
and link with the `media:` relations above. No relation is coined only in prose or only in the media
registry: the lineage predicates live in the relation TSVs, the media-type tokens in
[`media-types.tsv`](media-types.tsv).

## Deployment instance data lives elsewhere

Two things that a bridged deployment needs are **not** here, because they are instance data
rather than shared vocabulary:

| Artifact | What it is | Where it lives |
|---|---|---|
| a **canonical node/edge schema** | the entity ontology a particular knowledge authority stores — its `:LABEL`/`:TYPE` tokens, endpoint constraints and id scheme | that deployment's own integration repo |
| a **predicate mapping** | how one producer's local predicates cross into that ontology, with per-entry dialect / egress / id-space rules | that deployment's own integration repo |

The rule: **if it would read the same for any other ecosystem, it belongs here; if it names a
particular participant in a key or a value, it is deployment instance data.** The *shape* of such
an export is still a public contract — see [`../schemas/canonical-graph-export.schema.json`](../schemas/canonical-graph-export.schema.json).

What a mapping may and may not do is fixed by the specs, not by the mapping file:

- **One vocabulary.** A mapping coins **no** relation name. An entry that crosses as a KGP claim
  names the registry relation(s) it normalizes to; closing a gap means **adding a row to
  [`relations.tsv`](relations.tsv) / [`relations/<domain>.tsv`](relations/)**, never naming a
  relation only in a mapping. That is what keeps a mapping from becoming a second source of truth.
- **Three axes, not one.** *Dialect* (what logic a consumer may evaluate — KGP §5), *egress*
  (whether knowledge may leave at all — KGP §7.2), and *trust* (how much to believe a source —
  KGP §7, KINP §11) travel together and none implies another. `local-only` is an **egress** class,
  not a fourth dialect tier.
- **Immutability.** The relation-signature rule above holds across the boundary: a mapping entry's
  `id` is stable, and retargeting means adding an entry and superseding it, never rewriting a
  published one.

**Ontology vs. relations — two layers.** A node/edge ontology names *what entities are*; the
relation registry here names *how claims about those entities normalize* (arity, `arg_roles`,
`symmetric`, dialect `tier` — KGP §3.2). A claim-bearing edge type therefore has a counterpart
relation in these TSVs; a node type does not, because it is an entity, not a claim.
