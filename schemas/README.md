# koine/schemas — the machine-readable twin of the prose specs

JSON Schema (draft-2020-12) formalizations of the KGP/KINP/KFT interchange contracts.
Absorbed from the deprecated **rosetta** package and rehomed to the `https://koine.ecosystem/schemas/…`
namespace — see [`../decisions/ADR-0003-deprecate-rosetta.md`](../decisions/ADR-0003-deprecate-rosetta.md).

## Layout

- [`provenance.schema.json`](provenance.schema.json) — shared `$defs` every other schema `$ref`s:
  `contractVersion`, `provenance`, `license`, `tier`, `dialect`, `egress`, `csid`, `assetId`, `nodeRef`.
  The machine-readable form of the KINP [`identity.md`](../specs/identity.md) §7.1 assertion envelope
  and the KGP [`grounding-pack.md`](../specs/grounding-pack.md) §5/§7 axes.
- [`grounding-pack.schema.json`](grounding-pack.schema.json) — KGP §2 grounding-pack envelope.
- [`entity-grounding-snapshot.schema.json`](entity-grounding-snapshot.schema.json) — compact,
  license-filtered entity snapshot (KGP §2 entity envelope).
- [`canonical-world-export.schema.json`](canonical-world-export.schema.json) — Insimul → Pinakes
  generated-world export (synthetic trust tier, KGP §7).
- [`argos-canonical-export.schema.json`](argos-canonical-export.schema.json) — Argos `to_canonical`
  graph export (personal trust tier, KGP §7).
- [`dataset-jsonl-header.schema.json`](dataset-jsonl-header.schema.json) — first record of every
  training-exhaust JSONL file; carries tier + license + provenance.
- [`finetune-job.schema.json`](finetune-job.schema.json) — KFT fine-tuning job manifest
  (the `invoke` payload; [`../specs/fine-tuning.md`](../specs/fine-tuning.md) §3, KFT 0.3.0). `$ref`s
  `provenance.schema.json#/$defs/contractVersion` (as `kft_version`) and `dataset-jsonl-header.schema.json`
  (as `dataset.header`) — both resolve within this directory once koine:10 has landed them.
- [`fixtures/finetune-job.json`](fixtures/finetune-job.json) — a single **golden positive** example of
  a finetune job, kept off any library surface (like koine's other fixtures). It validates green against
  `finetune-job.schema.json`; the full negative/conformance fixture suite is agora's, not koine's (see
  Scope below).

## The four portability axes (KGP 0.4.0)

Rosetta conflated logic-dialect and egress under one `portabilityFlags` key. KGP 0.4.0 separates
them; the ported schemas model each as its own field so no consumer inherits the merged axis:

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
  `argos-canonical-export.nodes`/`.edges`). Enforced at pack construction (producer filters
  `local-only` out) and on import (consumer rejects `local-only` and reports), per KGP §7.2.
- **`license`** and **`tier`** — per-record axes already carried on every record.

The registry-level counterpart — splitting the merged relation registry's single `portabilityClasses`
key into these same separate axes — is handed to agora's `20-shared-relation-registry` **US-SRR2**
(ADR-0003 §Axes).

## Policy enums — `../policy/`

The license-class and trust-tier vocabularies the schemas reference are absorbed from rosetta into
koine [`../policy/`](../policy/):

- [`../policy/license-classes.json`](../policy/license-classes.json) — the SPDX license-class
  allowlist (`public-domain` / `attribution` / `share-alike` / `proprietary` / `personal`) backing
  every record `license` field (KGP §7.1). `Apache-2.0` — koine's own [`../LICENSE`](../LICENSE) —
  classes under **attribution**.
- [`../policy/trust-tiers.json`](../policy/trust-tiers.json) — the provenance trust tiers
  (`curated` / `acquired` / `synthetic` / `personal`) backing every record `tier` field (KGP §7),
  with the synthetic/personal containment rules.

Per ADR-0002's reverse-flow finding, KGP already adopted the SPDX license policy (§7.1) and treats
the provenance **trust tier** as an axis separate from the **dialect** (§5) and **egress** (§7.2)
axes — so these two policy files are the *source* for the license-class + trust-tier enums, not a
fourth conflated key.

## Scope — contracts only; validators live in agora

Koine holds **only** the machine-readable contract: the schemas in this directory plus the policy
enums above. Per ADR-0001 (koine = contracts / agora = runtime), the thin validators
(`validate.py` / `ajv`) and the conformance fixture *suite* that exercises these schemas are **not**
ported into koine — they are runtime and live in **agora**, targeted at the **40 band**. See
[`../decisions/ADR-0003-deprecate-rosetta.md`](../decisions/ADR-0003-deprecate-rosetta.md) §Decision(c).

This includes `finetune-job.schema.json`: the ajv/jsonschema validators **and** the conformance CI for
the finetune-job manifest land in **agora:40**, alongside the rosetta-absorbed validators, **not** in
koine. What koine keeps is exactly the contract plus one `fixtures/finetune-job.json` golden positive —
draft-2020-12 structural validation only checks the manifest's *shape*. The finetuning-specific
**semantic** admission rules the schema can't express — `modality × method` compatibility
([`../specs/fine-tuning.md`](../specs/fine-tuning.md) §3.1, FT-F) and egress/license aggregation over
`{data ∪ base}` before pinning compute (§4.2, FT-B) — are the validator's job in agora, and their
required behavior is pinned by the pressure-test scenarios
([`../scenarios/e2e-finetune.md`](../scenarios/e2e-finetune.md) §"Schema conformance").
