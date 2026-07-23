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
  residence, added for the Insimul bridge).

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
egress is a property of *what a project's own predicate carries*, so it is declared per bridge
mapping entry below, not on the shared vocabulary.

## Entity-type, modality-enum & media-type registries (KFT)

The fine-tuning profile ([`../specs/fine-tuning.md`](../specs/fine-tuning.md), KFT) contributes three
small vocabularies so path-matching and validators recognize a finetuned-model entity, its modality,
and its weight/export bytes (closes delta **FT-H**). Like the relation registry these are **data, not
prose**, and each token is **immutable once published** (a change is a **new** token, never an
in-place edit — the same discipline as an immutable relation signature; KGP §9 decision 1).

- [`entity-types.tsv`](entity-types.tsv) — KINP **entity types** and their refinements. Currently the
  KFT `model` type (KFT §5.1): plane `entity`, refined by `modality`, minted (not content-addressed,
  FT-C), external bases carrying a Hub external anchor (FT-G). This is **not** a
  [`canonical-schema.json`](canonical-schema.json) node type: that schema is the cultural/linguistic
  translation ontology (immutable, mirrored from pinakes); `model` is a fabric entity of a different
  kind, so it is registered here rather than added to that lifted schema.
- [`enums/modality.tsv`](enums/modality.tsv) — the closed KFT `modality` enum
  (`text-generation`, `image-text-to-text`, `video-text-to-text`, `text-to-image`, `text-to-video`),
  shared by the model-entity `type` refinement (KFT §5), the `finetune` capability's port types
  (KFT §2), and the job manifest (KFT §3.1). Additive: a new modality adds a row, never a new plane.
- [`media-types.tsv`](media-types.tsv) — the weight/export `media_type`s (KFT §5.3):
  `application/vnd.koine.model+safetensors` (weights) and the `+gguf` / `+onnx` / `+coreml` / `+tflite`
  exports. Each row names the KMI lineage relation ([`relations/media.tsv`](relations/media.tsv))
  its artifacts link with — weights `media:derived_from` their base, quantized/converted exports
  `media:variant_of` the merged fp16 weights.

**Model-lineage relation usage.** Model *entities* link with core lifecycle/lineage relations
([`relations.tsv`](relations.tsv)): a finetuned model `based_on` / `derived_from` its base
(KFT §5.1), and a re-train `retrains` / `supersedes` its predecessor (KFT §5.2) — `retrains` added
to the core file here alongside `supersedes` / `retracts`. Model *weights/exports* are KMI **assets**
and link with the `media:` relations above. No relation is coined only in prose or only in the media
registry: the lineage predicates live in the relation TSVs, the media-type tokens in
[`media-types.tsv`](media-types.tsv).

## Canonical node/edge schema — [`canonical-schema.json`](canonical-schema.json)

The **entity ontology** the (agora) translation engine maps to and from — the shared node/edge
contract every project targets, lifted **verbatim** out of pinakes `shared/canonical-schema.json`
(v1.3.0) per ADR-0002's "lift, don't rebuild" amendment and demoting pinakes's copy to a
generated mirror. It carries **21 node types** and **21 edge types** plus the typed Neo4j-import
column contracts (`docs/canonical-schema.md` §1–§4).

- **Node types (21)** — `language`, `language-family`, `writing-system`, `culture`,
  `archaeological-culture`, `urheimat-hypothesis`, `religion`, `deity`, `myth-motif`,
  `art-tradition`, `literary-tradition`, `cuisine`, `ingredient`, `trade-good`, `battle`,
  `place`, `migration-route`, `asset`, `character`, `building`, `business`. Each binds a
  `name` ↔ Neo4j `:LABEL` (`language` ↔ `Language`, `business` ↔ `Business`).
- **Edge types (21)** — `descended-from`, `split-from`, `merged-with`, `influenced-by`,
  `conquered-by`, `absorbed-into`, `spoken-in`, `located-in`, `contemporary-with`,
  `part-of-period`, `borrowed-from`, `cognate-with`, `derived-from`, `syncretized-with`,
  `depicts`, `mentions`, `parent-of`, `spouse-of`, `employed-by`, `resides-in`, `caused-by`.
  Each binds a `name` ↔ Neo4j `:TYPE` (`descended-from` ↔ `DESCENDS_FROM`, `caused-by` ↔
  `CAUSED_BY`) plus `from`/`to` endpoint constraints.

**`idScheme` — the `csid`.** The primary key is `csid`, format `cs:<type>:<local>`, unique across
all nodes. When a Wikidata QID is known it *is* the identity (`cs:<type>:Q12345`, QID-anchored);
otherwise the local part is a readable slug plus a hash of the normalized `(name, lang)`. Minting
is deterministic (idempotent re-runs). Every pinakes-origin row keeps its original lexicon id in
the `pinakes_id` **alias column** so the canonical↔lexicon mapping survives round-trip (write-back).

### Provenance of the vocabulary (v1.1 → v1.3)

The lift preserves the changelog that grew the schema across three project bridges:

| Version | Added | Source |
|---|---|---|
| **v1.1** | the `license` provenance column (on both node and edge families) | pinakes US-003 |
| **v1.2** | the `asset` node + the `depicts` / `mentions` edges | argos-bridge US-003 |
| **v1.3** | the `character` / `building` / `business` nodes + the `parent-of` / `spouse-of` / `employed-by` / `resides-in` edges, and the `caused-by` edge | insimul-bridge US-003 |

`caused-by` is deliberately **endpoint-unconstrained** (empty `from`/`to`): it carries event
causality in canonical `(effect, cause)` order over Insimul truth events, which anchor on
`myth-motif` rather than a single fixed node type. Its claim counterpart is the core relation
`caused_by` ([`relations.tsv`](relations.tsv)) — see the crosswalk below.

### Canonical home (decided here)

| | |
|---|---|
| **Data / contract** | **koine** — this directory ([`canonical-schema.json`](canonical-schema.json)). The only authoritative copy. |
| **Tooling** | **agora** — the typed schema accessors, validator (`assertValidCanonicalSchema`) and loader consumers call ([../decisions/ADR-0001-control-plane-topology.md](../decisions/ADR-0001-control-plane-topology.md): koine specifies, agora implements). koine ships no code. |
| **pinakes `shared/canonical-schema.json`** | a declared **generated mirror** in the file's own `mirrors` block: regenerated from this copy, never hand-edited, with the pinakes drift gate comparing the two. Its `shared/canonical-schema.ts` keeps typing and validating it. Wiring that regeneration is pinakes tasklist `10-pinakes-koine-align`; this lift follows the same "lift, don't rebuild" pattern that moved [`predicate-mapping.json`](predicate-mapping.json) here ([../decisions/ADR-0002-reconcile-with-existing-bridges.md](../decisions/ADR-0002-reconcile-with-existing-bridges.md)). |

A consumer loads the schema **from koine** (over the wire, via the agora loader) or keeps a
declared mirror; it never edits a local copy — that is how a schema forks. The claim-bearing edge
types crosswalk to the relation vocabulary as shown next.

## Schema and relations — two layers, one ontology

[`canonical-schema.json`](canonical-schema.json) and the relation TSVs are **two distinct
layers**, not two copies of the same thing:

- The **canonical node/edge schema** is the entity **ontology**. It names *what entities are* —
  the Neo4j `:LABEL` and `:TYPE` tokens (`language`↔`Language`, `descended-from`↔`DESCENDS_FROM`),
  the `from`/`to` endpoint constraints on each edge, and the typed import-column contracts.
- The **relation registry** ([`relations.tsv`](relations.tsv) + [`relations/<domain>.tsv`](relations/))
  names the KGP **claim** relations — *how claims about those entities normalize* (arity,
  `arg_roles`, `symmetric`, dialect `tier`), the facts that make claim normalization deterministic
  (KGP §3.2).

A claim-bearing schema edge type therefore has a counterpart relation it normalizes to; a schema
node type does not (it is an entity, not a claim). The crosswalk is **exactly** the
`koineRelations` already declared on the matching [`predicate-mapping.json`](predicate-mapping.json)
entries — it is not a second declaration, only a reading of the same bridge:

| Schema edge type (`name` ↔ `:TYPE`) | Registry relation | Vocabulary file |
|---|---|---|
| `descended-from` ↔ `DESCENDS_FROM` | `descended_from` | [`relations.tsv`](relations.tsv) (core) |
| `located-in` ↔ `LOCATED_IN` | `located_in` | [`relations.tsv`](relations.tsv) (core) |
| `caused-by` ↔ `CAUSED_BY` | `caused_by` | [`relations.tsv`](relations.tsv) (core) |
| `parent-of` ↔ `PARENT_OF` | `soc:parent_of` | [`relations/social.tsv`](relations/social.tsv) (`soc:`) |
| `spouse-of` ↔ `SPOUSE_OF` | `soc:spouse_of` | [`relations/social.tsv`](relations/social.tsv) (`soc:`) |
| `employed-by` ↔ `EMPLOYED_BY` | `soc:employed_by` | [`relations/social.tsv`](relations/social.tsv) (`soc:`) |
| `resides-in` ↔ `RESIDES_IN` | `soc:resides_in` | [`relations/social.tsv`](relations/social.tsv) (`soc:`) |

**The schema coins no relation.** It names entity types and edge tokens; it never invents or
redefines a relation `name`/signature. Closing a relation gap still means **adding a row to
[`relations.tsv`](relations.tsv) / [`relations/<domain>.tsv`](relations/)** — never naming a
relation only in the schema — the same "one vocabulary, no second source of truth" rule that
governs the bridge mappings below. And the schema's own `name`↔`:LABEL`/`:TYPE` bindings are
**immutable once published**: a change is a **new** node/edge type, never an in-place edit, the
exact discipline of an immutable relation signature (a rename would silently change every
dependent `csid` / claim id).

**Why this lift matters.** With the schema promoted here, the (agora) translation engine maps
to and from a **shared** node/edge ontology loaded from koine — not a pinakes-owned one. The
schema, the relation vocabulary and the bridge mappings now sit in one directory, so translation
becomes a genuine commons: every project targets the same ontology instead of a copy governed by
a single project.

## Bridge mappings — [`predicate-mapping.json`](predicate-mapping.json)

How each bridged project's own predicates cross into the canonical node/edge vocabulary
(the [`canonical-schema.json`](canonical-schema.json) now hosted here in koine — every
`canonicalType` reference resolves against it; pinakes holds a generated mirror). Lifted
**verbatim** out of pinakes
`shared/predicate-mapping.json` (merged as `17f0713`) — it was already a machine-validated
cross-project registry carrying portability classes, `idSpaces`, `temporalFieldMap` and a
multi-`projects` shape; ADR-0002's amendment ruled it be *lifted*, not rebuilt.

It covers both bridged projects. `argos` is exactly as merged; `insimul` was added additively at
registryVersion **0.4.0** (`20-shared-relation-registry` US-SRR3) from INSIMUL_SYNC_PLAN.md
Appendix A plus the shipped `predicate-schema.ts` catalog — each entry naming the `sourceRow` it
came from, since Appendix A rows that bundle a node with its edges split into one entry per
`canonicalKind`. pinakes is deliberately *not* a `projects` entry: it remains the canonical **side** of
every mapping, so its coverage is the relation vocabulary and the canonical node/edge schema
themselves — but the canonical **schema** those entries resolve against now lives here in
koine (pinakes keeps a generated mirror), not in a pinakes-owned copy. Where the draft and the shipped code disagreed (`settlement` vs the canonical
`place`, `spouse_of/2` vs the emitted `married_to/2`), the entry follows the code and the
divergence is recorded in the project's own `collisions` block rather than quietly reconciled.

Insimul's additions closed four vocabulary gaps by **adding relations to the TSVs** — the `soc:`
domain (`parent_of`, `spouse_of`, `employed_by`, `resides_in`) and three core relations
(`located_in`, `descended_from`, `caused_by`). Person-level social facts are a domain because
only some projects speak them; descent and causality are core because they already span
languages, cultures and events.

**One vocabulary.** The mapping file does not coin relation names. A mapping whose
`canonicalKind` is `edge` or `derived-rule` crosses as a KGP claim and names the registry
relation(s) it normalizes to in `koineRelations`; every other kind (`node`, `node-property`,
`provenance`, `temporal`, `rule`, `none`) is not a relation and leaves `koineRelations` empty. A
bridged predicate with no registry relation is closed by **adding the relation to the TSV**,
never by naming it only in the mapping — that is what keeps this from becoming a second source
of truth. (The lift added exactly one: `media:mentions`, the reference-not-depiction
counterpart of `cine:shows`, for Argos's `refers_to` → `mentions`.)

### Three axes, not one (registryVersion 0.3.0)

The merged file's single `portabilityClasses` key bundled two orthogonal things. KGP 0.4.0
separated them, and 0.3.0 of this file splits the key to match — `local-only` is **not** a
fourth dialect tier:

| Axis | Key here | Spec | Values | Enforcing? |
|---|---|---|---|---|
| **dialect** — what logic a consumer may *evaluate* | `dialectTiers`, per-entry `dialect` | KGP §5 | `grounding-only` ⊂ `horn-safe` ⊂ `full-prolog` | yes — consumer rejects a pack above its tier |
| **egress** — whether knowledge may *leave* at all | `egressClasses`, per-entry `egress` | KGP §7.2 | `exportable` (default), `local-only` | yes — see below |
| **trust** — how much to *believe* a source | none: carried on provenance records | KGP §7, KINP §11 | `curated`/`auto-admitted`/`quarantine`, `synthetic`/`personal` | no — descriptive |

They travel together and none implies another (`personal` trust *correlates* with `local-only`
egress; it does not imply it). All three are called "tier" somewhere in the projects' code —
ADR-0002, "Terminology collisions". A per-entry `dialect` of `null` means the merged entry
declared no dialect, not `grounding-only`; the migration was mechanical
(`portability: ["horn-safe","local-only"]` → `dialect: "horn-safe"`, `egress: "local-only"`).

**Egress is enforced in both directions** (KGP §7.2), and the producer side is the one that
matters: a producer MUST filter `local-only` out at *pack construction*, never leaving it to
the consumer; a consumer MUST reject-and-report a pack that still contains it, rather than
silently dropping the records — silence would hide the producer bug or tamper that put them
there. agora ships that enforcement (`@agora/schemas`); egress never enters the claim hash, so
neither direction can change what a claim *is*.

An entry may exist **only** to be filtered: `canonicalKind: "none"` with `direction: "none"` means
the predicate crosses in neither direction and maps to nothing canonical, and is catalogued so
§7.2 has an explicit rule for it — Insimul's `player_cefr_level/2` and chat turns are a real
person's data, not world facts, so they are `local-only` even though everything else a generated
world emits is exportable.

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
