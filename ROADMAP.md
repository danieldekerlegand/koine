# koine — Roadmap

> The **contracts source-of-truth** for a neuro-symbolic interchange fabric — six protocol
> specs (KINP · KGP · KMI · KCB · KCS · KFT), a shared relation registry, JSON-Schema twins,
> and the agnostic ADRs. No runtime code: *"koine specifies, agora implements."* North star:
> *any two conformant AI systems interoperate on identity, knowledge, media, and capability
> without a single point-to-point bridge.*

**Status:** Contract layer complete — 2 of 6 specs ratified (KINP, KCS), 4 in candidate re-validation (KGP, KMI, KCB, KFT) · maintenance + ratification cadence, with a planned "second act" (Phases F1–F6 below) · **Last updated:** 2026-08-10

This is the single canonical roadmap for koine. koine has no prior ROADMAP; this file
synthesizes the contract program from the spec headers, the ADRs, the pressure-test scenarios,
and the completed Chief tasklists. The **specs** (`specs/`), **ADRs** (`decisions/`),
**registry** (`registry/`), **schemas** (`schemas/`), and **scenarios** (`scenarios/`) remain
the canonical reference surfaces and are linked, not duplicated, here.

---

## Vision & Scope

koine replaces the *N²* web of bespoke point-to-point integrations between AI systems with one
shared format every participant reads from and writes to. A new participant learns *one* set of
contracts, not one per peer. The intelligence and all the traffic stay at the edges — koine is
*dumb pipes, smart endpoints*: a specification only, layered **above** A2A and MCP (which carry
the message) to add the identity/knowledge/media/capability *meaning* those transports leave
undefined ([`docs/positioning.md`](docs/positioning.md)).

**In scope:** the normative prose contracts (role-scoped: producer / consumer / authority /
host / provider), their machine-readable JSON-Schema twins, the shared agnostic vocabularies
(relations, entity/media kinds, enums), license/trust policy, the replayable pressure-test
scenarios that gate ratification, and the agnostic ADRs recording *why*.

**Out of scope (by design):** application/runtime code (lives in **agora** and each
participant's own repo), instance data — topologies, bridge/predicate mappings, a deployment's
node/edge ontology, adoption programs — which lives in the operator's private integration repo.
koine holds contract **shape**, never a deployment instance.

## Current State

- **Six protocols specified; all four data/control planes validated by at least one concrete
  pressure test.** The contract layer is functionally complete — remaining work is
  re-ratification of three specs whose *model shape* changed after their last pass, not new
  contract authoring.
- **No runtime code in-repo.** koine is Markdown + TSV/JSON. Validators, CI, and the
  conformance console live downstream (ADR-0001).
- **Reference surfaces present and current:** `schemas/` (JSON Schema draft-2020-12 twins, each
  with a golden fixture, updated to the current spec versions), `registry/` (agnostic binary
  relations + entity/media kinds + enums; signatures immutable once published), `policy/`
  (license-class + trust-tier), `scenarios/` (six end-to-end pressure tests + the KCS stress
  test), `decisions/` (five agnostic ADRs).
- **Chief program:** all 4 tasklists (`10`–`40`) merged; **nothing pending**.
- **Note on drift:** `specs/README.md` and the root `README.md` still list KGP and KFT as
  *ratified* at older versions (KGP 0.4.0, KFT 0.3.0). The authoritative status is each spec's
  own header, reflected below: both are now in **candidate** at higher versions pending
  re-ratification. Those two index tables are a small doc-sync tail (see Remaining / Next).

---

## Milestones

One list, everything: ratified, in-candidate, and planned. The early phases are the executed
**contract-authoring + hardening** program (the four Chief tasklists `10`–`40`, plus the two specs
ratified before Chief); the **candidate re-ratification** phase closes the ratification tail left by
model-shape changes; **Phases F1–F6** are the mined-but-unbuilt "second act"; the **Ongoing** and
**Loose wishlist** blocks cover steady-state and un-phased threads. Status legend: **✅
ratified / merged · 🚧 partial / in-progress / candidate-pending · ⬜ not started**. The Tasklist
column is the Chief tasklist that delivered a row (✅ merged) or the *(proposed)* one that would —
koine's own (`chief/NN-…`) for a spec/ADR/scenario edit, or a **cross-repo** tasklist in a named
sibling (agora / lugh / a consumer) for runtime work that is built downstream, never in koine.
A `—` means the row is a spec-owner gate (re-run an existing scenario) or continuous work with no
discrete tasklist. Existing tasklists occupy band `10`–`40`; every proposed one is numbered `50`+
so it cannot collide. **All F-phase rows are proposals only — no `tasks/chief/*.json` is authored.**

> **A spec is promoted only after a concrete pressure test fails to break it**; a change to a
> *ratified* model's shape drops it back to **candidate** and re-enters validation. The per-row
> status is each spec's own header (authoritative) — where `specs/README.md` and the root
> `README.md` index tables still show KGP/KFT ratified at older versions, those tables are the
> doc-sync tail (Phase 1 below), not the truth.

### Phase 0 — Contract authoring, ratification & hardening — ✅ complete

The four data/control planes are specified and each is validated by at least one concrete pressure
test; two specs are ratified, and four ADR-driven hardening passes landed via Chief.

| Status | Milestone | Tasklist |
|---|---|---|
| ✅ | **KINP 0.2.1** ratified — identity keystone; deltas A–E folded, three design forks decided (single identity **authority role**, hybrid merge, `@world(W)` arg); the namespace every other spec references (identity.md §11) | gated by `scenarios/e2e-worlds-to-fabric.md` · — (pre-Chief) |
| ✅ | **KCS 0.2.0** ratified — declarative, replayable scenarios over participants' real MCP/A2A links; observer, not hub (conformance-scenario.md) | gated by `scenarios/kcs-format-stress.md` · — (pre-Chief) |
| ✅ | **KGP / KMI / KCB / KFT** first-authored & pressure-tested — all four planes covered by an e2e scenario | `scenarios/` · — (pre-Chief) |
| ✅ | Adopt **OTIO** as KMI's canonical timeline; demote bespoke `edl+json` to deprecated; ADR-0005; KMI → 0.3.0 | `chief/10-kmi-adopt-otio` |
| ✅ | **KGP standards alignment** — RDF-star / W3C PROV / JSON-LD as a specified, round-trip-tested projection; bespoke TSV canonical retained; ADR-0006; KGP → 0.5.0 | `chief/20-kgp-standards-alignment` |
| ✅ | **Self-describing participant** — namespace + KCB AgentCard-extension manifest + egress policy + bridge maps published at the edge; ADR-0007; `schemas/participant-self-description.schema.json` + [`docs/self-describing-participant.md`](docs/self-describing-participant.md) | `chief/30-self-describing-participant` |
| ✅ | **Fabric-producer adapter** — one thin translate-only adapter; `same_as` grounding + `derived_from` lineage (no `mentions` relation); ADR-0008 | `chief/40-fabric-producer-contracts` |

### Phase 1 — Candidate re-ratification (close the ratification tail) — 🚧 in progress (scale: S)

Four specs sit at **candidate** because their *model shape* changed after their last pass, not
because new contract is needed. These are spec-owner gates — re-run the existing scenario against
the new shape — except the doc-sync and the one missing fixture (which is Phase F5).

| Status | Milestone | Tasklist |
|---|---|---|
| ⬜ | **Re-ratify KCB 0.3.0** — the §2 manifest is now a named A2A **AgentCard extension** (`capabilities.extensions[]`, `https://koine.dev/kcb/manifest/0.3`); re-run the media-transform scenario against the extension shape. The single outstanding gate (KCB §7 pressure-test note) | re-run `scenarios/e2e-media-transform.md` · — |
| 🚧 | **Re-ratify KMI 0.3.0** — OTIO half already re-validated clean; blocked only because the same scenario also gates KCB's manifest change (media-interchange.md pressure-test §) | rides with KCB re-run · — |
| 🚧 | **Re-ratify KGP 0.5.0** — close projection findings **KGP-1** (which confidence a multi-provenance merged claim projects to ProbLog) and **KGP-2** (name the §4.1 annotation predicates); the missing round-trip fixture is Phase F5 | `scenarios/e2e-worlds-to-fabric.md` *(Re-validation — KGP 0.5.0)* · — |
| 🚧 | **Re-ratify KFT 0.4.0** — owner re-ratification of the strictly-additive FT-M…FT-Q intake fold (already walked clean; fine-tuning.md pressure-test §) | `scenarios/e2e-producer-exhaust-finetune.md` *(Re-validation — KFT 0.4.0)* · — |
| ⬜ | **Doc-sync the index tables** — bring `specs/README.md` + root `README.md` status columns in line with the spec headers (KGP 0.5.0, KFT 0.4.0, KMI/KCB 0.3.0 all candidate) — the only discrete koine edit in this phase · S | `chief/50-doc-sync-status-tables` *(proposed, koine)* |

*Depends on:* nothing external; all are re-runs of existing `scenarios/`. KMI re-ratifies the moment KCB's re-run passes.

### Phase 2 — Downstream adoption (tracked, built in siblings) — 🚧 rolling

koine specifies; the runtime is adopted by others. These tranches are *tracked* by koine as the
consumers of its contracts — the code lives in each named repo, never here — and their concrete
build programs are Phases F3–F5 below. Real conformance results feed back into the ratification gates.

| Status | Milestone | Tasklist |
|---|---|---|
| 🚧 | **Runtime commons** — provider-router, KCB discovery registry, KINP resolver, translation engine, conformance console (adopts all six specs) | **agora** (its own roadmap) |
| 🚧 | **Fabric producers** — worlds / knowledge / media / audio join as producers (KINP + KGP + KMI + KCB, KFT by reference) | insimul · pinakes · argos · formant |
| 🚧 | **Memory substrate** — joins as a KCB provider (KINP + KCB) | tessera |
| 🚧 | **Fine-tuning providers** — general + specialized (local-only) trainers, registry-routed (KFT) | agora (general) · lugh (specialist) |

### Phase F1 — Cross-spec federation — ⬜ planned (scale: L)

Three specs independently deferred the same single-authority → federation question. Resolve the
shared pattern **once** in an ADR, then apply it per-spec and pressure-test a multi-authority
deployment. *Nothing is built until a deployment actually needs more than one authority.*

| Status | Milestone | Tasklist |
|---|---|---|
| ⬜ | A **federation ADR (≥0009)** resolving the shared single-authority-role → federated-peers pattern once, so KINP/KCB/KMI stop deferring it three separate ways · L | `chief/51-federation-adr` *(proposed, koine)* |
| ⬜ | Per-spec §-edits applying the ADR — KINP §11.1 (identity-authority role → federated authorities), KCB §7.1 (single registry → peering registries), KMI §9.3 (single CAS → per-project stores replicating on reference) · M | `chief/52-federation-spec-edits` *(proposed, koine)* |
| ⬜ | A **multi-authority pressure scenario** — two authorities, cross-authority `same_as` reconciliation + registry peering, hunting the break the shared pattern must survive · M | `chief/53-multi-authority-scenario` *(proposed, koine `scenarios/`)* |

*Depends on:* a real >1-authority deployment target to justify starting; ADR (`51`) gates the §-edits (`52`) and the scenario (`53`). Source: identity.md §11.1, capability-bus.md §7.1, media-interchange.md §9.3.

### Phase F2 — Capability versioning & deprecation — ⬜ planned (scale: M)

How a provider evolves a capability's schema without breaking subscribers — KCB §7.2, explicitly
inherited by KFT §11.5 (a finetuned model pins its `kft_version`). Folds in KMI's unfinished
deprecation: the deprecated `edl+json` transition window (§4.4) has **no removal date**.

| Status | Milestone | Tasklist |
|---|---|---|
| ⬜ | A **versioning ADR** — semver on capability names vs content-addressed schemas; the subscriber-compatibility contract · M | `chief/54-capability-versioning-adr` *(proposed, koine)* |
| ⬜ | KCB §7.2 §-edit encoding the decision (+ set the KMI §4.4 `edl+json` removal date; note the KFT §11.5 inheritance) · S | `chief/55-kcb-versioning-spec-edit` *(proposed, koine)* |
| ⬜ | A **mutate-live-schema scenario** — a provider ships a capability v2 while a v1 subscriber is live; assert no silent break · M | `chief/56-live-schema-mutation-scenario` *(proposed, koine `scenarios/`)* |

*Depends on:* none hard; naturally pairs with F1 (both are "how the fabric evolves"). Source: capability-bus.md §7.2, fine-tuning.md §11.5, media-interchange.md §4.4.

### Phase F3 — KFT downstream runtime program — ⬜ planned (scale: L, cross-repo)

KFT §9.1 hands implementers three runtime programs plus two follow-ups; none is built in koine. The
client's live end-to-end run is externally blocked until **≥1 real provider** exists.

| Status | Milestone | Tasklist |
|---|---|---|
| ⬜ | **(a) General `finetune` provider** — the `trainer`/finetune-router leaf capability, engine ladder gated by the §4.2 egress class; cloud-capable; sibling to (never merged with) the provider-router · L | agora `chief/57-general-finetune-provider` *(proposed, cross-repo)* |
| ⬜ | **(b) Specialized local-only provider** — a distinct `finetune` capability **on the bus** (not an adapter inside the general trainer), registry-routed, local-only where its data is synthetic/proprietary/personal-tier · L | lugh `chief/58-specialist-finetune-provider` *(proposed, cross-repo)* |
| ⬜ | **(c) The `finetune` KCB client** replacing the stub runner — discover → invoke → **subscribe** to the §6 telemetry stream, wiring export (§5.3) + registry (§8) + `invoke:finetune` grants (§7) · L | agora `chief/59-finetune-kcb-client` *(proposed, cross-repo)* |
| ⬜ | **`finetune-job.schema.json` validator + conformance CI** — the §3 syntactic gate, landing wherever shared validators live (ADR-0001: downstream) · M | agora `chief/60-finetune-job-validator-ci` *(proposed, cross-repo)* |
| ⬜ | **A flagship consumer bridge** — a media/design participant realigning its generic "finetune bridge" onto the real KFT contract · M | consumer `chief/61-flagship-kft-consumer-bridge` *(proposed, cross-repo)* |

*Depends on:* the client (`59`) live-run is blocked until `57` **or** `58` ships a real provider. The semantic admission rules the validator (`60`) can't express are Phase F5. Source: fine-tuning.md §9.1.

### Phase F4 — Conformance console (the unbuilt KCS payoff) — ⬜ planned (scale: L, cross-repo)

All six scenarios are hand-walked **prose**. The KCS payoff is to encode each as a
machine-replayable KCS document and run it over real MCP/A2A links (KCS §6 names this a downstream
conformance-console tasklist). Partly blocked because the media producer is still a *planned* KCB
provider — bridged by the KCS **delta-N stand-in** already in the format.

| Status | Milestone | Tasklist |
|---|---|---|
| ⬜ | Encode the six `scenarios/` as machine-replayable **KCS documents** (`kcs:worlds-to-fabric`, `kcs:media-transform`, the finetune passes, the format-stress) · L | agora `chief/62-encode-scenarios-as-kcs` *(proposed, cross-repo)* |
| ⬜ | Run the KCS suite over **real MCP/A2A connections**, using **delta-N `standin`** fixtures for not-yet-adopted providers (the still-*planned* media KCB provider) · L | agora `chief/63-run-kcs-over-live-links` *(proposed, cross-repo)* |

*Depends on:* Phase 2 adoption (real participants to drive) and Phase F3 for the finetune legs; KCS 0.2.0 (ratified, delta N folded) already expresses the stand-ins. Source: conformance-scenario.md §6, scenarios/kcs-format-stress.md (delta N).

### Phase F5 — Downstream validator obligations (explicit, un-owned) — ⬜ planned (scale: M, cross-repo)

Concrete validator behaviors the specs *require* but koine deliberately does not hold (ADR-0001) —
today un-owned. One of them (the KGP round-trip fixture) also unblocks Phase 1's KGP re-ratification.

| Status | Milestone | Tasklist |
|---|---|---|
| ⬜ | The missing **RDF-star / PROV / JSON-LD round-trip fixture** for KGP §4 — proves a projection is lossless back to the canonical pack; also closes the last KGP 0.5.0 re-ratification blocker · M | agora `chief/64-kgp-projection-roundtrip-fixture` *(proposed, cross-repo)* |
| ⬜ | **Rejection of a manifest-less pack** — a bare projection arriving without its manifest is not a unit of transfer; the validator must refuse it (schemas/README.md) · S | agora `chief/65-manifestless-pack-rejection` *(proposed, cross-repo)* |
| ⬜ | The **finetune-job SEMANTIC admission rules** the schema can't express — `modality × method` compatibility (FT-F), egress/license aggregation over `{data ∪ base}` (FT-B), inline-header checks (FT-N…P); pinned by the finetune scenarios · M | agora/lugh `chief/66-finetune-semantic-admission` *(proposed, cross-repo)* |

*Depends on:* `64` feeds Phase 1 (KGP); `66` lives with the F3 providers (a)/(b). Source: scenarios/e2e-worlds-to-fabric.md, scenarios/e2e-finetune.md, schemas/README.md, registry/README.md.

### Phase F6 — Per-spec deferred design questions — ⬜ planned (scale: S–M each, koine)

Each spec's own §"Open questions" — folded **on the next pressure break**, not speculatively (each
note says "unless a pressure test forces it into the contract"). Grouped by spec; each is a koine
§-edit gated by a new scenario leg.

| Status | Milestone | Tasklist |
|---|---|---|
| ⬜ | **KMI §9** — OTIO schema-version pinning, profile-vocabulary granularity, perceptual-hash backend for `media:perceptual_match`, id re-attach after a third-party OTIO round-trip drops `metadata.koine` · M | `chief/67-kmi-open-questions` *(proposed, koine)* |
| ⬜ | **KCS §7** — assertion extensibility (fixed vocab vs predicate DSL), determinism strictness (assert structure/invariants, not generated content), observation-log fidelity · S | `chief/68-kcs-open-questions` *(proposed, koine)* |
| ⬜ | **KFT §11** — adapter-selection hint, distributed-run metering + checkpoint lineage, resume-checkpoint ref, eval-as-reward KCS profile for `method: dpo` · M | `chief/69-kft-open-questions` *(proposed, koine)* |
| ⬜ | **KCB §7.3** — subscription firehose backpressure / flow-control for high-volume-world subscriptions · S | `chief/70-kcb-subscription-backpressure` *(proposed, koine)* |

*Depends on:* a new pressure-test leg for each before it folds — these are intentionally reactive. Source: media-interchange.md §9, conformance-scenario.md §7, fine-tuning.md §11, capability-bus.md §7.3.

### Ongoing — steady-state, not a phase — 🚧 continuous

| Status | Milestone | Tasklist |
|---|---|---|
| 🚧 | **Spec stewardship** — new agnostic ADRs (numbered ≥ 0009 after F1/F2; 0002–0004 permanently reserved to the downstream sequence), registry growth by *new* namespaced relation names (never in-place edits), `schemas/` kept in lockstep with spec versions | — |
| 🚧 | **Track downstream adoption** — as agora and the sibling producers implement the contracts, feed real conformance results back into the ratification gates | — |

### Loose wishlist — ⬜ not yet phased

Smaller open threads noted across the specs/registry, not big enough to anchor a phase:

- **Reconcile the dangling `ECOSYSTEM.md` references** — the root `CLAUDE.md` and `specs/fine-tuning.md` §changelog both cite an `ECOSYSTEM.md` as "the living topology," but **no such file exists in koine** (topology is deployment instance data → the private integration repo). Either point those references at the private integration repo, or add a thin, agnostic in-repo index that carries no instance data.
- **Reserved-but-unexercised lifecycle relations** — KINP `retracts` / `supersedes` (delta D, identity.md §4.2) and KFT `retrains` / `supersedes` (registry) are registered but never driven by a scenario.
- **Perceptual / near-dup asset matching** — scoped *out* of KINP 0.2.0 (delta E) and still unbacked; the `media:perceptual_match` relation has no chosen backend (ties to KMI §9.4).
- **Registry vocabulary growth** — the `cine:` / `media:` / `soc:` domain families grow by PR (new immutable names), driven by real producer needs.
- **Perceptual-hash provenance recording** — record which pHash/fingerprint/embedding backs a match (the way KGP records `embedding_model`) so scores are comparable (KMI §9.4).

---

## Chief Tasklist Status

- **Chief:** 4/4 tasklists merged (`10`–`40`); **0 pending**. Records in [`tasks/chief/completed/`](tasks/chief/completed/), each carrying a `mergedToMain` commit.
  - `10-kmi-adopt-otio` → ADR-0005 · `20-kgp-standards-alignment` → ADR-0006 · `30-self-describing-participant` → ADR-0007 · `40-fabric-producer-contracts` → ADR-0008.
- **~21 proposed tasklists** (`chief/50`–`chief/70`) back Phase 1's doc-sync and the planned Phases F1–F6 above — **none authored yet** (no new `tasks/chief/*.json`); they are roadmap stubs, numbered above the existing `10`–`40` band so they cannot collide. Several are **cross-repo** (agora / lugh / a consumer) — runtime work built downstream per ADR-0001, not in koine.

The four candidate **re-ratifications** are spec-owner gates driven by re-running existing
scenarios, not Chief tasklists; the only new koine-own contract edits are the F1/F2/F6 spec/ADR/
scenario stems and the Phase-1 doc-sync (`chief/50`). Everything F-banded is a **proposal only**.

---

## Related Docs

**Canonical reference surfaces (kept in place — this roadmap links, never duplicates them):**
- [`specs/`](specs/) — the six protocol contracts ([`identity.md`](specs/identity.md) · [`grounding-pack.md`](specs/grounding-pack.md) · [`media-interchange.md`](specs/media-interchange.md) · [`capability-bus.md`](specs/capability-bus.md) · [`conformance-scenario.md`](specs/conformance-scenario.md) · [`fine-tuning.md`](specs/fine-tuning.md)) and their [`README.md`](specs/README.md).
- [`decisions/`](decisions/) — the agnostic ADRs: [ADR-0001](decisions/ADR-0001-control-plane-topology.md) (control-plane topology) · [ADR-0005](decisions/ADR-0005-otio-canonical-timeline.md) (OTIO) · [ADR-0006](decisions/ADR-0006-kgp-rdf-prov-jsonld-relationship.md) (KGP canonical + projection) · [ADR-0007](decisions/ADR-0007-self-describing-participant.md) (self-describing participant) · [ADR-0008](decisions/ADR-0008-fabric-producer-adapter.md) (fabric-producer adapter).
- [`schemas/`](schemas/) · [`registry/`](registry/) · [`policy/`](policy/) — the machine-readable twins, shared vocabularies, and license/trust policy.
- [`scenarios/`](scenarios/) — the end-to-end pressure tests that gate ratification.

**Guides & positioning:**
- [`docs/positioning.md`](docs/positioning.md) — how koine relates to A2A, MCP, and mature domain standards (the governance gaps it fills; what it builds on rather than replaces).
- [`docs/self-describing-participant.md`](docs/self-describing-participant.md) — the adopter checklist (namespace, capability manifest, egress policy, vocabulary mappings).
- [`docs/walkthrough-capability-bus.md`](docs/walkthrough-capability-bus.md) — a KCB advertise → discover → direct-dial walkthrough with real payloads.
- [`README.md`](README.md) · [`CLAUDE.md`](CLAUDE.md) — the fabric thesis / role vocabulary, and the in-repo working conventions + per-spec current state.
