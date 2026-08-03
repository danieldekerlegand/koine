# koine/schemas — the machine-readable twin of the prose specs

JSON Schema (draft-2020-12) formalizations of the KGP/KINP/KMI/KFT interchange contracts, published under
the `https://koine.ecosystem/schemas/…` namespace. Every schema is **role-scoped** — it names producers,
consumers, and authorities, never a specific product. Illustrative CURIEs use the placeholder namespaces
registered in KINP [`identity.md`](../specs/identity.md) §3.4 (`refkb` / `worldsim` / `analyzer` /
`mediastore` / `orchestrator` / `provider`).

## Layout

- [`provenance.schema.json`](provenance.schema.json) — shared `$defs` every other schema `$ref`s:
  `contractVersion`, `provenance`, `license`, `tier`, `dialect`, `egress`, `csid`, `assetId`, `nodeRef`.
  The machine-readable form of the KINP [`identity.md`](../specs/identity.md) §7.1 assertion envelope
  and the KGP [`grounding-pack.md`](../specs/grounding-pack.md) §5/§7 axes.
- [`grounding-pack.schema.json`](grounding-pack.schema.json) — KGP §2 grounding-pack envelope.
- [`entity-grounding-snapshot.schema.json`](entity-grounding-snapshot.schema.json) — compact,
  license-filtered entity snapshot (KGP §2 entity envelope).
- [`canonical-world-export.schema.json`](canonical-world-export.schema.json) — a **world producer's**
  generated-world export to a knowledge authority (synthetic trust tier, KGP §7).
- [`canonical-graph-export.schema.json`](canonical-graph-export.schema.json) — a **producer's**
  canonical node/edge graph export (personal trust tier, KGP §7).
- [`dataset-jsonl-header.schema.json`](dataset-jsonl-header.schema.json) — first record of every
  training-exhaust JSONL file; carries tier + license + provenance.
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
  (the `invoke` payload; [`../specs/fine-tuning.md`](../specs/fine-tuning.md) §3, KFT 0.3.0). `$ref`s
  `provenance.schema.json#/$defs/contractVersion` (as `kft_version`) and `dataset-jsonl-header.schema.json`
  (as `dataset.header`) — both resolve within this directory once koine:10 has landed them.
- [`fixtures/finetune-job.json`](fixtures/finetune-job.json) — a single **golden positive** example of
  a finetune job, kept off any library surface (like koine's other fixtures). It validates green against
  `finetune-job.schema.json`; the full negative/conformance fixture suite is a runtime concern, not
  koine's (see Scope below).
- [`fixtures/media-timeline.json`](fixtures/media-timeline.json) — the same, for
  `media-timeline.schema.json`: one **golden positive** multitrack V/A conform (V1 clip over an A1
  score and an A2 narration), each clip carrying its asset id, plus a `media_map`. It mirrors the
  conform step of [`../scenarios/e2e-media-transform.md`](../scenarios/e2e-media-transform.md).

## The four portability axes (KGP 0.4.0)

Logic-dialect and egress are commonly conflated under one "portability" flag. KGP 0.4.0 keeps them
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

The registry-level counterpart — a relation registry that still carries a single merged
`portabilityClasses` key — MUST split it into these same separate axes when it is loaded.

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
([`../specs/fine-tuning.md`](../specs/fine-tuning.md) §3.1, FT-F) and egress/license aggregation over
`{data ∪ base}` before pinning compute (§4.2, FT-B) — are the downstream validator's job, and their
required behavior is pinned by the pressure-test scenarios
([`../scenarios/e2e-finetune.md`](../scenarios/e2e-finetune.md) §"Schema conformance").
