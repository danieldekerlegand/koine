# ADR-0003 — Deprecate rosetta; absorb its JSON-Schema layer into koine

**Status:** Accepted
**Deciders:** ecosystem owner
**Date:** 2026-07-23
**Refines:** [`../decisions/ADR-0002-reconcile-with-existing-bridges.md`](../decisions/ADR-0002-reconcile-with-existing-bridges.md)
(the fold + reverse-flow adoption), [`../decisions/ADR-0001-control-plane-topology.md`](../decisions/ADR-0001-control-plane-topology.md)
(koine = contracts / agora = runtime).
**Basis:** read-only survey of `~/Development/rosetta` (CONTRACT_VERSION `0.1.0`), 2026-07-23,
against [`../specs/grounding-pack.md`](../specs/grounding-pack.md) (KGP 0.4.0) and
[`../specs/identity.md`](../specs/identity.md) (KINP 0.2.1).

---

## Context — the last open reconciliation loop

ADR-0002 folded the pairwise `*_SYNC_PLAN.md` bridge program into koine: it named the three
mirror sync-plan documents, marked them *superseded by koine*, and lifted their proven work
(the SPDX license-class policy → KGP §7.1, the provenance trust tiers as a separate axis, the
merged predicate registry) into the contracts. But ADR-0002 surveyed the *plans and the code*.
It never named the **package** those plans were written against.

That package is **rosetta** (`~/Development/rosetta`) — a separate, standalone JSON-Schema
library, *not* one of the five projects and *not* a service. Its own README describes it as
"a **library, not a service**: versioned JSON Schemas, one predicate/edge-mapping registry, the
license/trust-tier policy, golden conformance fixtures, and thin validators … smart endpoints,
dumb pipes." It carries a single `CONTRACT_VERSION` (`0.1.0`), and every cross-project artifact
was meant to carry `contractVersion` and validate against it on import. Concretely it holds:

- **6 draft-2020-12 schemas** (`schemas/`): `provenance.schema.json` (the shared `$defs`:
  `contractVersion`, `provenance`, `license`, `tier`, `csid`, `assetId`, `nodeRef`),
  `grounding-pack.schema.json`, `entity-grounding-snapshot.schema.json`,
  `canonical-world-export.schema.json`, `argos-canonical-export.schema.json`,
  `dataset-jsonl-header.schema.json`;
- **2 policy files** (`policy/`): `license-classes.json`, `trust-tiers.json`;
- a **registry** (`registry/predicate-mapping.json`) whose scope is already owned by koine's
  `registry/` + the agora `20-shared-relation-registry` tasklist;
- **validators + conformance fixtures** (`validators/`, `conformance/`, `tests/`).

Rosetta **is the pre-koine interchange contract** — the same neutral-interchange role koine now
holds, under a different name and predating the repo split. Its grounding-pack schema even hard-codes
`"source": { "const": "linguascrape" }`, the exact LinguaScrape → Pinakes terminology collision
ADR-0002 resolved. So the overlap ADR-0002 closed *in prose* was left open *as a package*: koine's
specs, decisions, and `CLAUDE.md` never acknowledge rosetta by name, and its schema layer — the
machine-readable form of what became KGP/KINP — has no home in koine. This ADR closes that loop.

This is deliberately scoped to koine only. Per ADR-0001 (koine = contracts, agora = runtime), the
rosetta **deprecation** and the downstream **renames** it forces (§Downstream) are recorded here as
follow-ups, not applied in the rosetta or workspace repos — this ADR touches only `koine-contracts`
and `koine-schemas`.

## Decision

**(a) Rosetta is deprecated in favor of koine `specs/` + the new koine `schemas/`.** Rosetta's
role — the neutral interchange contract every cross-project artifact validates against — is now
koine's. The prose lives in `specs/` (KINP, KGP, KCB, KMI, KFT); the machine-readable twin lives
in koine `schemas/`. Rosetta's `CONTRACT_VERSION 0.1.0` and its `contractVersion`-per-artifact
discipline are superseded by koine's per-spec semver (e.g. KGP `kgp_version`).

**(b) Rosetta's schema + policy layer is absorbed as the machine-readable twin of KGP/KINP,
updated to KGP 0.4.0.** The 6 draft-2020-12 schemas are ported into koine `schemas/` (this
tasklist, US-2/US-3/US-4), rehomed from the `https://rosetta.ecosystem/schemas/…` namespace to
`https://koine.ecosystem/schemas/…`, retied to the KGP/KINP prose sections they formalize, with
every `LinguaScrape` string renamed to `Pinakes` (ADR-0002 terminology fix). The two policy files
(`policy/license-classes.json`, `policy/trust-tiers.json`) are absorbed under koine `policy/` as
the source for the license-class + trust-tier enums the schemas reference — reconciled with the
fact that KGP already adopted the SPDX license policy (§7.1) and treats the provenance **trust
tier** as an axis separate from the **dialect** and **egress** axes (§5, §7.2). Rosetta's single
conflated `portabilityFlags` key (which grouped `grounding-only`/`horn-safe`/`full-prolog`
alongside `local-only`) is split into the **three orthogonal axes** KGP 0.4.0 defines: **dialect**
(§5: `grounding-only`/`horn-safe`/`full-prolog`), **egress** (§7.2: `exportable`/`local-only`),
and provenance **trust tier** (§7: `curated`/`acquired`/`synthetic`/`personal`). See §Axes.

**(c) Validators, CI, and conformance fixtures land in agora, not koine.** Per ADR-0001, koine
holds only the machine-readable contract. Rosetta's `validators/` (`validate.py` / `validate.mjs`),
its `conformance/` golden fixtures, and its CI (`.github/workflows/conformance.yml`) are **not**
ported into koine — they are runtime, and belong in agora. They are tracked in the agora **40 band**
and explicitly out of scope here. Koine ships the schemas + policy; agora ships the thin validators
+ fixtures that exercise them.

## Axes — splitting rosetta's `portabilityFlags` into three (KGP 0.4.0)

Rosetta conflated two orthogonal concerns under one key. KGP 0.4.0 (and ADR-0002's reverse-flow
finding) separated them; the ported schemas follow suit:

| Axis | Values | Spec | Says |
|---|---|---|---|
| **dialect** | `grounding-only` / `horn-safe` / `full-prolog` | KGP §5 | *what logic a consumer may safely evaluate* |
| **egress** | `exportable` (default) / `local-only` | KGP §7.2 | *whether a record may cross a project boundary at all* |
| **trust tier** | `curated` / `acquired` / `synthetic` / `personal` | KGP §7 | *how much to believe a source* (descriptive) |
| **license class** | SPDX id / pseudo-id, classed | KGP §7.1 | *admission allowlist* (per-record) |

`local-only` was rosetta's fourth "portability flag"; it is **not** a dialect tier — it constrains
egress, not evaluable logic (ADR-0002 reverse-flow finding, KGP §5/§7.2). The registry-level
reconciliation of the merged registry's single `portabilityClasses` key into these separate axes
is handed to agora's `20-shared-relation-registry` **US-SRR2**.

## Downstream — recorded here, applied elsewhere

These are consequences of the deprecation, tracked as follow-ups (not edited by this tasklist):

- **rosetta grounding-pack identity retired.** The `"source": { "const": "linguascrape" }`
  discriminator and the free-string `packId` are dropped in the ported schema in favor of a KINP
  `producer` namespace + a content-addressed `pack_id` (KGP §2.1). See US-4.
- **`insimul-grounding-v1` → `kgp_version`.** Insimul's own `contractVersion` const
  `insimul-grounding-v1` (`workspace/insimul-babylon/packages/core/schemas/grounding-pack.schema.json`
  + `canonical-world-export.schema.json`, and `GROUNDING_CONTRACT_ID` in
  `workspace/insimul-server/rust/insimul-server/src/routes/v1/grounding.rs`) is a downstream rename
  onto KGP's `kgp_version`. The **insimul adoption tasklist** (workspace `tasks/chief`
  `80-identity-adoption`) applies it — **not** this tasklist, which touches only koine.
- **rosetta repo deprecation.** Marking `~/Development/rosetta` deprecated (README banner,
  `CONTRACT_VERSION` freeze, pointer to koine) is a follow-up in the rosetta repo, out of scope here.

## Consequences

**Positive**
- The last pre-koine interchange package is named and superseded; koine now owns both the prose
  and the machine-readable form of the interchange contract, closing the loop ADR-0002 left open.
- The schemas become the validatable twin of KGP/KINP — a downstream project can validate a pack
  against `schemas/grounding-pack.schema.json` and get the KGP §2 envelope, not the LinguaScrape one.
- Rosetta's `portabilityFlags` conflation is fixed at the point of absorption, so no consumer
  inherits the merged axis.

**Cost / follow-ups**
- The rosetta repo and the `insimul-grounding-v1` const are renamed in *their* repos later
  (§Downstream); until then rosetta and koine both physically hold schema copies.
- Validators + fixtures must be (re)built in agora (40 band) rather than reused verbatim.

**Neutral**
- koine gains a `schemas/` (already seeded by `finetune-job.schema.json`) and a `policy/`
  directory as first-class contract surfaces alongside `specs/` and `registry/`.

## Relationship to prior decisions

- **ADR-0002** superseded the sync-plan *contracts* in prose and did the reverse-flow adoption
  (license policy → KGP §7.1; trust tiers as a separate axis). ADR-0003 finishes the job by naming
  and deprecating the **package** those plans validated against, and rehoming its schemas.
- **ADR-0001** draws the koine/agora line this ADR honors: schemas + policy here, validators + CI
  + fixtures in agora.
- **KGP** ([`../specs/grounding-pack.md`](../specs/grounding-pack.md)) is the prose the ported
  `grounding-pack.schema.json` + `provenance.schema.json` now formalize (envelope §2, normalization
  §3, dialect §5, license §7.1, egress §7.2).
