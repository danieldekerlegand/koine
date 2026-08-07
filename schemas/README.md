# koine/schemas — the machine-readable twin of the prose specs

JSON Schema (draft-2020-12) formalizations of the KGP/KINP/KMI/KFT interchange contracts — plus the one
non-interchange document koine shapes, a participant's in-repo self-description
([`../decisions/ADR-0007-self-describing-participant.md`](../decisions/ADR-0007-self-describing-participant.md))
— published under the `https://koine.ecosystem/schemas/…` namespace. Every schema is **role-scoped** — it names producers,
consumers, and authorities, never a specific product. Illustrative CURIEs use the placeholder namespaces
registered in KINP [`identity.md`](../specs/identity.md) §3.4 (`refkb` / `worldsim` / `analyzer` /
`mediastore` / `orchestrator` / `provider`).

## Layout

- [`provenance.schema.json`](provenance.schema.json) — shared `$defs` every other schema `$ref`s:
  `contractVersion`, `provenance`, `license`, `tier`, `dialect`, `egress`, `csid`, `assetId`, `nodeRef`.
  The machine-readable form of the KINP [`identity.md`](../specs/identity.md) §7.1 assertion envelope
  and the KGP [`grounding-pack.md`](../specs/grounding-pack.md) §5/§7 axes.
- [`grounding-pack.schema.json`](grounding-pack.schema.json) — KGP §2 grounding-pack envelope
  ([`../specs/grounding-pack.md`](../specs/grounding-pack.md), KGP 0.5.0). This is the §4 **JSON**
  encoding — the lossless twin of the canonical TSV, and deliberately *not* a JSON-LD document: per
  [`../decisions/ADR-0006-kgp-rdf-prov-jsonld-relationship.md`](../decisions/ADR-0006-kgp-rdf-prov-jsonld-relationship.md)
  KGP **retains** its bespoke canonical, and RDF-star / W3C PROV / JSON-LD is a one-directional
  **projection** (§4.1) that is never authoritative on ingest. So no `@context` sits in the identity
  path, `provenance` stays PROV-*shaped* rather than PROV-*named*, and a `claimId` received as a
  projection annotation must be re-derived per §3 before it is trusted.
- [`entity-grounding-snapshot.schema.json`](entity-grounding-snapshot.schema.json) — compact,
  license-filtered entity snapshot (KGP §2 entity envelope).
- [`canonical-world-export.schema.json`](canonical-world-export.schema.json) — a **world producer's**
  generated-world export to a knowledge authority (synthetic trust tier, KGP §7).
- [`canonical-graph-export.schema.json`](canonical-graph-export.schema.json) — a **producer's**
  canonical node/edge graph export (personal trust tier, KGP §7).
- [`dataset-jsonl-header.schema.json`](dataset-jsonl-header.schema.json) — first record of every
  training-record JSONL file; carries tier + license + **egress** + **recordCount** + provenance. The
  file itself is a KMI asset (media type `application/vnd.koine.dataset+jsonl`,
  [`../registry/media-types.tsv`](../registry/media-types.tsv)) referenced from a job's
  `dataset.records[]`, and this header is copied inline into the manifest so the KFT §4.2 egress gate
  and §7 spend estimate can run **before** any fetch (KFT 0.4.0, FT-M…FT-P). Every axis on it is a
  *file-level aggregate* — most-restrictive egress, union license, row count — so a producer whose
  rows differ in class splits the file instead of widening the header.
- [`media-timeline.schema.json`](media-timeline.schema.json) — KMI's canonical timeline
  ([`../specs/media-interchange.md`](../specs/media-interchange.md) §4, KMI 0.3.0). Not a timeline
  model: KMI **adopts** OpenTimelineIO
  ([`../decisions/ADR-0005-otio-canonical-timeline.md`](../decisions/ADR-0005-otio-canonical-timeline.md)),
  so this is a **profile over an OTIO document** — OTIO's composition structure stays open and
  unmodified (§4.1), and the schema checks only koine's additive layer (§4.2): the KINP asset id at
  every clip's `media_reference.metadata.koine.asset`, `RationalTime`/`TimeRange` timing with no
  separate frame-rate field, and the OPTIONAL `metadata.koine` timeline carriers `kmi_version` +
  the delta-I `media_map` (§4.2d/§4.3). It also rejects the deprecated EDL's clip shape (§4.4), so
  a legacy document cannot pass as canonical. Lineage (§3) and analysis (§5) are KGP assertions
  that live *outside* the timeline and are deliberately out of scope here. `$ref`s
  `provenance.schema.json#/$defs/contractVersion` (as `kmi_version`).
- [`finetune-job.schema.json`](finetune-job.schema.json) — KFT fine-tuning job manifest
  (the `invoke` payload; [`../specs/fine-tuning.md`](../specs/fine-tuning.md) §3, KFT 0.4.0). `$ref`s
  `provenance.schema.json#/$defs/contractVersion` (as `kft_version`) and `dataset-jsonl-header.schema.json`
  (as `dataset.header`) — both resolve within this directory. Training data is referenced under three
  slots — `knowledge[]` (KGP packs), `media[]` (image/video/audio assets) and `records[]` (training-record
  JSONL assets, FT-M) — and `dataset.header` is an object **or** an array, positionally one per
  `records[]` entry (FT-O).
- [`participant-self-description.schema.json`](participant-self-description.schema.json) — the **source**
  self-description a participant keeps in its **own** repository
  ([`../decisions/ADR-0007-self-describing-participant.md`](../decisions/ADR-0007-self-describing-participant.md)
  decision 7): where its four facets — identity (KINP §3.2–§3.4, §4.4, §6), capability (KCB §2, §2.1),
  egress (KGP §7.1–§7.2), translation (KGP §5, §7) — live, so the artifact it serves can be derived from a
  declared intent. The odd one out in this directory: it is not an interchange payload and is **never
  served**. The runtime self-description remains the KCB AgentCard extension, and this schema **references**
  that manifest shape rather than restating it (a second served manifest was rejected — KCB §2.2, ADR-0007
  decision 7). Held to that decision's three bounds structurally: every facet block is
  `additionalProperties: false` over **pointers and references only**, so a manifest payload, a mapping's
  rows, a topology, or a node/edge ontology cannot be embedded — those are the deployment's instance data
  and stay in the participant's repo. `$ref`s `provenance.schema.json#/$defs/contractVersion` (as
  `self_description_version`) and `#/$defs/egress` (as `egress.default_class`). Having one is OPTIONAL; see
  the adopter guide, [`../docs/self-describing-participant.md`](../docs/self-describing-participant.md).
- [`fixtures/finetune-job.json`](fixtures/finetune-job.json) — a single **golden positive** example of
  a finetune job, kept off any library surface (like koine's other fixtures). It validates green against
  `finetune-job.schema.json`; the full negative/conformance fixture suite is a runtime concern, not
  koine's (see Scope below).
- [`fixtures/media-timeline.json`](fixtures/media-timeline.json) — the same, for
  `media-timeline.schema.json`: one **golden positive** multitrack V/A conform (V1 clip over an A1
  score and an A2 narration), each clip carrying its asset id, plus a `media_map`. It mirrors the
  conform step of [`../scenarios/e2e-media-transform.md`](../scenarios/e2e-media-transform.md).
- [`fixtures/participant-self-description.json`](fixtures/participant-self-description.json) — the same, for
  `participant-self-description.schema.json`: a minimal **golden positive** for a knowledge producer that is
  also a consumer, in the `analyzer` placeholder namespace. Every value is a pointer — a repo-relative path
  or a served URL — so the fixture demonstrates the bounds as much as the shape.

## The four portability axes (KGP 0.5.0)

Logic-dialect and egress are commonly conflated under one "portability" flag. KGP keeps them
apart; the schemas model each as its own field so no consumer inherits a merged axis:

| Axis | `$def` | Values | Spec | Says |
|---|---|---|---|---|
| **dialect** | `dialect` | `grounding-only` / `horn-safe` / `full-prolog` | KGP §5 | *what logic a consumer may safely evaluate* |
| **egress** | `egress` | `exportable` (default) / `local-only` | KGP §7.2 | *whether a record may cross a project boundary* |
| **license class** | `license` | SPDX id / ecosystem pseudo-id | KGP §7.1 | *admission allowlist* (per-record) |
| **trust tier** | `tier` | `curated` / `acquired` / `synthetic` / `personal` | KGP §7 | *how much to believe a source* (descriptive) |

`local-only` is an **egress** class, **not** a dialect tier (KGP §5): it constrains whether a record
may travel, not what logic may be evaluated over it. So the `dialect` enum deliberately excludes it.
Where the axes appear:

- **`dialect`** — a pack-level property on the `grounding-pack` envelope (KGP §2).
- **`egress`** — a per-record property (defaulting to `exportable`) on the entity/node/edge record
  shapes (`grounding-pack.entities`, `entity-grounding-snapshot.entities`,
  `canonical-graph-export.nodes`/`.edges`). Enforced at pack construction (producer filters
  `local-only` out) and on import (consumer rejects `local-only` and reports), per KGP §7.2.
- **`license`** and **`tier`** — per-record axes already carried on every record.

All four axes ride *records*, never the claim hash, so they survive every KGP §4 encoding — columns
in TSV, fields here, statement or record annotations in the RDF projection (§4.1) — and slicing a
pack along any of them never changes what a claim *is*. `egress` is the one with an ordering
guarantee attached: it is enforced at pack construction, so `local-only` is gone before any encoding
exists and no projection can reintroduce it.

The registry-level counterpart — a relation registry that still carries a single merged
`portabilityClasses` key — MUST split it into these same separate axes when it is loaded.

**No schema models a §4 projection.** Prolog, Datalog, ProbLog, Neo4j, and RDF-star / PROV / JSON-LD
are derived encodings, one-directional from the canonical pack; what makes one conformant is the
lossless round-trip back to the canonical (§4.1), which is exercised by the pressure test
([`../scenarios/e2e-worlds-to-fabric.md`](../scenarios/e2e-worlds-to-fabric.md), *Re-validation —
KGP 0.5.0*) and by a downstream validator — not by a document shape held here. The **pack** is the
unit of transfer; a bare projection, arriving without its manifest, is not.

## Policy enums — `../policy/`

The license-class and trust-tier vocabularies the schemas reference live in koine
[`../policy/`](../policy/):

- [`../policy/license-classes.json`](../policy/license-classes.json) — the SPDX license-class
  allowlist (`public-domain` / `attribution` / `share-alike` / `proprietary` / `personal`) backing
  every record `license` field (KGP §7.1). `Apache-2.0` — koine's own [`../LICENSE`](../LICENSE) —
  classes under **attribution**.
- [`../policy/trust-tiers.json`](../policy/trust-tiers.json) — the provenance trust tiers
  (`curated` / `acquired` / `synthetic` / `personal`) backing every record `tier` field (KGP §7),
  with the synthetic/personal containment rules.

KGP adopts the SPDX license policy (§7.1) and treats the provenance **trust tier** as an axis separate
from the **dialect** (§5) and **egress** (§7.2) axes — so these two policy files are the *source* for
the license-class + trust-tier enums, not a fourth conflated key.

## Scope — contracts only; validators live downstream

Koine holds **only** the machine-readable contract: the schemas in this directory plus the policy
enums above. Per [`../decisions/ADR-0001-control-plane-topology.md`](../decisions/ADR-0001-control-plane-topology.md)
(koine = contracts, no code), the thin validators (`ajv` / `jsonschema`) and the conformance fixture
*suite* that exercises these schemas are **not** held here — they are runtime and belong to whichever
participant or runtime commons implements them.

This includes `finetune-job.schema.json`: its validators **and** its conformance CI land downstream,
not in koine. What koine keeps is exactly the contract plus one `fixtures/finetune-job.json` golden
positive — draft-2020-12 structural validation only checks the manifest's *shape*. The finetuning-specific
**semantic** admission rules the schema can't express — `modality × method` compatibility
([`../specs/fine-tuning.md`](../specs/fine-tuning.md) §3.1, FT-F), egress/license aggregation over
`{data ∪ base}` before pinning compute (§4.2, FT-B), and the inline-header checks an inline copy
invites (header-vs-file disagreement, positional mismatch, `recordCount` overrun — §4.1/§7, FT-N…FT-P)
— are the downstream validator's job, and their required behavior is pinned by the pressure-test
scenarios ([`../scenarios/e2e-finetune.md`](../scenarios/e2e-finetune.md) and
[`../scenarios/e2e-producer-exhaust-finetune.md`](../scenarios/e2e-producer-exhaust-finetune.md),
each §"Schema conformance").
