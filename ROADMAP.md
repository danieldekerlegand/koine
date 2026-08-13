# koine — Roadmap

> The **contracts source-of-truth** for a neuro-symbolic interchange fabric — six protocol
> specs (KINP · KGP · KMI · KCB · KCS · KFT), a shared relation registry, JSON-Schema twins,
> and the agnostic ADRs. No runtime code: *"koine specifies, agora implements."* North star:
> *any two conformant AI systems interoperate on identity, knowledge, media, and capability
> without a single point-to-point bridge.*

**Status:** Contract layer complete — 2 of 6 specs ratified (KINP, KCS), 4 in candidate re-validation (KGP, KMI, KCB, KFT) · maintenance + ratification cadence, with a planned "second act" (Phases F1–F6 below) and an **in-progress prior-art/standards-hygiene pass (Phase F7)** · **Last updated:** 2026-08-11

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
- **Chief program:** 4/4 built-program tasklists (`10`–`40`) merged; **13 koine-owned forward
  tasklists authored** (`tasks/chief/*.json`, `passes:false`, unrun) — pending a run, not merged;
  plus **17 parked markers** — proposal-only Phase-F stems and cross-repo runtime built downstream
  per ADR-0001, neither run under koine.
- **Note on drift (internal):** `specs/README.md` and the root `README.md` still list KGP and KFT as
  *ratified* at older versions (KGP 0.4.0, KFT 0.3.0). The authoritative status is each spec's
  own header, reflected below: both are now in **candidate** at higher versions pending
  re-ratification. Those two index tables are a small doc-sync tail (see Remaining / Next).
- **Note on drift (external) — new, 2026-08-11:** until now **no koine spec pinned any external
  standard version**, and a prior-art sweep found drift already present in three places (the A2A
  card shape, an MCP method name, and MCP's breaking 2026-07-28 revision). The pin table and the
  drift-check cadence now live in [`docs/upstream-standards.md`](docs/upstream-standards.md); the
  normative corrections are Phase F7. Separately, the **KCB extension URI had been minted under a
  private hostname that was never registered** — hence squattable, verified 2026-08-11; moving it to
  the w3id.org permanent identifier `https://w3id.org/koine/…` is the first row of that phase
  (registration PR and rationale:
  [`decisions/ADR-0007-self-describing-participant.md`](decisions/ADR-0007-self-describing-participant.md)'s
  amendment log).
- **Prior art:** [`docs/positioning.md`](docs/positioning.md) now cites and dismisses the six
  bodies koine had never engaged (nanopublications/Trusty URIs · C2PA · Croissant ·
  Frictionless/Data Package · Pact/consumer-driven contract testing · DIDs/VCs). The sweep's
  verdict was **keep the suite** — but it narrowed KMI to a bridge and moved half of KFT's manifest
  surface to adoption-by-reference (Phase F7).

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
so it cannot collide. **Every F-phase proposal is now authored as a `tasks/chief/*.json` (`passes:false`, unrun)** — the koine-owned rows as live koine spec/ADR/scenario tasklists, the **cross-repo** rows only as *parked* markers whose runtime work is built downstream (agora / lugh / a consumer) per ADR-0001, moving to the sibling repo when actionable and never running under koine's gates.

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
the new shape — except the doc-sync (`chief/50`), the two discrete spec edits the tail needs
(`chief/71` KFT dep re-pin, `chief/72` KGP findings closure), and the one missing fixture (which
is Phase F5).

| Status | Milestone | Tasklist |
|---|---|---|
| ⬜ | **Re-ratify KCB 0.4.0** — **two** gates now (KCB pressure-test §): re-run the media-transform scenario against the 0.3.0 AgentCard-extension shape (`capabilities.extensions[]`, `https://w3id.org/koine/kcb/manifest/0.3`), **and** a *clean* §7.5 break-test. The second gate's scenario has landed and run (`scenarios/e2e-live-schema-mutation.md`) and is **not clean** — V-2/V-4/V-5/V-7 blocking — so re-ratification now waits on the KCB **0.5.0** fold (Phase F2) plus a re-run | re-run `scenarios/e2e-media-transform.md` + `scenarios/e2e-live-schema-mutation.md` · — |
| 🚧 | **Re-ratify KMI 0.3.0** — OTIO half already re-validated clean; blocked only because the same scenario also gates KCB's manifest change (media-interchange.md pressure-test §) | rides with KCB re-run · — |
| 🚧 | **Re-ratify KGP 0.5.2** — projection findings **KGP-1** (which confidence a multi-provenance merged claim projects to ProbLog) and **KGP-2** (name the §4.1 annotation predicates) are ✅ **closed** by the normative §4/§4.1 edits of `chief/72` (KGP 0.5.1, 2026-08-13), and 0.5.2 (2026-08-13) is rationale-only (§3.4 prior art + the ADR-0006 amendment); the one remaining gate is the missing round-trip fixture, Phase F5 | `scenarios/e2e-worlds-to-fabric.md` *(Re-validation — KGP 0.5.0)* · — |
| 🚧 | **Re-ratify KFT 0.4.0** — owner re-ratification of the strictly-additive FT-M…FT-Q intake fold (already walked clean; fine-tuning.md pressure-test §); the header's stale plane-version pins are a named precondition, closed by `chief/71` (below) | `scenarios/e2e-producer-exhaust-finetune.md` *(Re-validation — KFT 0.4.0)* · — |
| ⬜ | **Doc-sync the index tables** — bring `specs/README.md` + root `README.md` status columns in line with the spec headers (KGP 0.5.0, KFT 0.4.0, KMI/KCB 0.3.0 all candidate). *Its ECOSYSTEM.md story context is already resolved* — the file exists since `2e228c6` (see Loose wishlist ✅), so `50`'s remaining scope is the index tables + link integrity · S | `chief/50-doc-sync-status-tables` *(proposed, koine)* |
| ⬜ | **KFT dependency re-pin** — re-pin or explicitly justify KFT §1/header's plane-version pins (KGP 0.4.0 / KMI 0.2.0 / KCB 0.2.0 — the last-ratified versions — vs current 0.5.0 / 0.3.0 / 0.3.0 candidates) as part of the 0.4.0 re-ratification; reconcile the in-body cross-plane citations (esp. §2's KCB manifest shape) · S | `chief/71-kft-dep-repin` *(proposed, koine)* |
| ⬜ | **KGP findings closure** — the normative §4/§4.1 spec edits closing KGP-1 (one ProbLog fact per admitted prov record; aggregation is consumer policy) and KGP-2 (name the annotation predicates: a koine-owned term namespace, reusing external terms where they exist) + the §4.1 reference to the downstream round-trip fixture — the spec-edit work `chief/50` is barred from · S | `chief/72-kgp-findings-closure` *(proposed, koine)* |

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
| ⬜ | **D: conformance-results intake** — the koine-side half of "real conformance results feed back into the ratification gates" is undefined and needs a decision, not code: **where downstream results land** (proposed: a per-scenario *Downstream results* section in the relevant `scenarios/*.md`, recording run date, participants-by-role, and pass/fail per assertion — instance-free, role-scoped) and **which gate consumes them** (proposed: the Phase 1 spec-owner re-ratification rows, which MAY cite a recorded downstream pass as evidence alongside the hand-walked re-validation, and MUST reopen a finding a downstream failure contradicts). Until decided, the feedback loop has a defined downstream half (agora's console emits KCS reports) and an undefined koine half | — |

### Phase F1 — Cross-spec federation — ⬜ planned (scale: L)

Three specs independently deferred the same single-authority → federation question. Resolve the
shared pattern **once** in an ADR, then apply it per-spec and pressure-test a multi-authority
deployment. *Nothing is built until a deployment actually needs more than one authority.*

| Status | Milestone | Tasklist |
|---|---|---|
| ⬜ | A **federation ADR (≥0009)** resolving the shared single-authority-role → federated-peers pattern once, so KINP/KCB/KMI stop deferring it three separate ways · L | `chief/51-federation-adr` *(proposed, koine)* |
| ⬜ | Per-spec §-edits applying the ADR — KINP §11.1 (identity-authority role → federated authorities), KCB §8.1 (single registry → peering registries), KMI §9.3 (single CAS → per-project stores replicating on reference) · M | `chief/52-federation-spec-edits` *(proposed, koine)* |
| ⬜ | A **multi-authority pressure scenario** — two authorities, cross-authority `same_as` reconciliation + registry peering, hunting the break the shared pattern must survive · M | `chief/53-multi-authority-scenario` *(proposed, koine `scenarios/`)* |

*Depends on:* a real >1-authority deployment target to justify starting; ADR (`51`) gates the §-edits (`52`) and the scenario (`53`). Source: identity.md §11.1, capability-bus.md §8.1, media-interchange.md §9.3.

### Phase F2 — Capability versioning & deprecation — 🚧 in progress (scale: M)

How a provider evolves a capability's schema without breaking subscribers — **decided** in
[ADR-0009](decisions/ADR-0009-capability-versioning-deprecation.md) and normative at KCB §7, which
KFT §11.5 now inherits by reference (a finetuned model's pinned `kft_version` is an archival pin,
KCB §7.4). KMI's unfinished deprecation is closed with it: the `edl+json` transition window (§4.4)
names its removal — **KMI 0.4.0** — under the one deprecation policy at KCB §7.3. The break-test has
now been written and run, and it **found the perimeter open** — so what remains is the fold it
demands (KCB **0.5.0**: V-2/V-4/V-5/V-7 blocking, V-3/V-6 should-fix, all additive) and a clean
re-run.

| Status | Milestone | Tasklist |
|---|---|---|
| ✅ | A **versioning ADR** — both options were adopted at different layers: semver `(name, version)` carries *compatibility*, a content-addressed `schema_id` makes a silent mutation detectable; ADR-0009 | `chief/54-capability-versioning-adr` |
| ✅ | KCB §7 §-edit encoding the decision (KCB → 0.4.0) + the KMI §4.4 `edl+json` removal version (KMI → 0.3.1, removed at 0.4.0) + the KFT §11.5 inheritance resolved as an informative pointer | `chief/55-kcb-versioning-spec-edit` |
| ✅ | A **mutate-live-schema scenario** — a provider widens, re-prices, mutates without bumping, ships v2 beside v1 and retires v1, all under a live subscriber. Required by KCB §7.5 before KCB can re-ratify; **run, not clean** — deltas **V-1…V-8**, blocking V-2/V-4/V-5/V-7 (see the scenario's *Re-ratification* §) | `chief/56-live-schema-mutation-scenario` → `scenarios/e2e-live-schema-mutation.md` |
| ⬜ | **KCB 0.5.0 — fold V-1…V-8** — additive: a version operand on `invoke` + the granted major in the token (V-5), a per-major transport binding in `capabilities[]` (V-4), an in-band deprecation/removal control frame on `subscribe` (V-7), a digested payload shape on knowledge ports (V-2), a versioned canonicalization prefix (V-3), a removal floor (V-6), a quoted cost (V-1); then re-run the break-test. Same minor already carries §2.2's removal (KCB §7.3) · M | *(proposed, koine)* |

*Depends on:* none hard; naturally pairs with F1 (both are "how the fabric evolves"). Source: capability-bus.md §7 (was §7.2), fine-tuning.md §11.5, media-interchange.md §4.4.

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
| ⬜ | **KCB §8.2** — subscription firehose backpressure / flow-control for high-volume-world subscriptions · S | `chief/70-kcb-subscription-backpressure` *(proposed, koine)* |

*Depends on:* a new pressure-test leg for each before it folds — these are intentionally reactive. Source: media-interchange.md §9, conformance-scenario.md §7, fine-tuning.md §11, capability-bus.md §8.2.

### Phase F7 — Prior-art closure, standards pins & governance — 🚧 in progress (scale: M, koine)

The output of the **2026-08 prior-art sweep** (decisions D14 · D15 · D15b · D15c of the operator's
adopt/decide/register log — that log is instance data and lives outside this repo; what it *decided*
is restated below and in `docs/`, so nothing here depends on reading it).
Its headline is that **the suite is KEPT** — four of six specs sit in a real gap and two are
correctly-scoped profiles — but that koine had **zero written engagement** with six prior-art
bodies, **no external-standard version pin anywhere**, and **one squattable identifier**. Nothing
here adds a plane; it closes citations, narrows two claims to what they can defend, and fixes two
verified defects. The informative half is already landed in
[`docs/positioning.md`](docs/positioning.md) (prior art cited and dismissed) and
[`docs/upstream-standards.md`](docs/upstream-standards.md) (the pin table + drift check); the rows
below are the **normative** half.

| Status | Milestone | Tasklist |
|---|---|---|
| ⬜ | ⚠️ **The KCB extension URI was minted under an UNREGISTERED private hostname** — verified 2026-08-11 (`curl` → could not resolve), so the identifier the fabric names itself by was squattable with no recovery once implementations shipped the literal. Migrate the namespace to **`https://w3id.org/koine/…`** (a PR against `perma-id/w3id.org`) and specify the dual-accept transition window; the extension URI is a *matching key*, so the change is breaking · S — **schedule first** | `chief/75-w3id-namespace-migration` *(proposed, koine)* |
| ⬜ | **No spec pins any external standard version**, and drift is already present: KCB's example card uses the A2A **v0.x** top-level `"url"` where **v1.0 uses `supported_interfaces[]`** (`AgentInterface{url, protocol_binding}`); KCB §6 cites `MCP list_tools` where the method is **`tools/list`**; and **MCP's 2026-07-28 revision went stateless** (no `initialize`, no session id, per-request `_meta`) and added a mandatory `server/discover`. Fix all three, make the pin table load-bearing, adopt the drift-check cadence · M | `chief/76-upstream-standards-pins` *(proposed, koine)* |
| ⬜ | **KGP prior art + ADR-0006 re-founding** — cite nanopublications/**Trusty URIs** (they hash *all four graphs*, so identical triples mint *different* URIs; **KGP hashes the claim alone**, and that inversion is what makes cross-producer merge work) and Frictionless/Data Package; lead ADR-0006 with the decisive argument — **RDFC-1.0 is RDF-1.1-only with no defined behaviour for RDF 1.2 triple terms, and revising it is explicitly out of the RDF/SPARQL WG charter (to 2027)** · M | `chief/73-kgp-prior-art-and-canonicalization` *(proposed, koine)* |
| ⬜ | **KINP + KCS prior art and novelty** — cite DIDs/VCs and Pact/consumer-driven contract testing; record that **no standard does cross-authority MERGE** (ANS v2 *revokes*, MCP Registry *prevents*, `owl:sameAs` is 15 years into documented failure) and that **Web Bot Auth is not a competitor** (zero `draft-ietf-webbotauth-*` documents; scope is bot→website authn "using existing identifiers"); fix the positioning bug that **KCS is the most defensible spec and the least advertised** (Pact is bilateral + mock-based; A2A's own TCK is 45★) · M | `chief/74-kinp-kcs-prior-art-and-novelty` *(proposed, koine)* |
| ⬜ | **KMI narrows to a BRIDGE** — **C2PA** already ships a *signed* derivation chain (`c2pa.ingredient` · `parentOf`/`componentOf`/`inputTo`, 159 certified products) and **MovieLabs OMC v2.8** a *richer* vocabulary (Revision/Variant/Derivation/Representation/Alternative), so KMI defines **projections onto both** instead of being a third vocabulary; what stays KMI's is the **analysis→knowledge bridge** + world-scoping. Plus the ADR-0005 caveat: **OTIO is not 1.0** (1.0 milestone due 2026-04-10, ~4 months late) and `target_url` is under-specified enough that **Premiere Beta 26.1 and DaVinci Resolve 20.2 break against each other** (#1985) · L | `chief/77-kmi-lineage-bridge-projections` *(proposed, koine)* |
| ⬜ | **KFT keeps the gate, adopts the rest** — by reference: **Croissant v1.1** (datasets), **ModelPack/KitOps** (weights; `model.parts[].type` already contemplates LoRA), **HF `base_model`** (lineage), **Kubeflow TrainJob** `initializer.{dataset,model}.storageUri` (structural precedent). Defensible and kept: the **objective × adaptation taxonomy**, **egress-gated placement**, **graded refusal routing**, and **cross-provider job portability** — nothing converts between Axolotl/LLaMA-Factory/torchtune/TRL/OpenAI despite 190k+ combined stars, which makes portability arguably KFT's most valuable deliverable · L | `chief/78-kft-adopt-by-reference` *(proposed, koine)* |
| ⬜ | **Conformance-gated ratification** — adopt MCP's **SEP-2484**: *a spec cannot reach Final without a matching conformance scenario.* Directly fixes the ratification treadmill (four specs are back at candidate on model-shape changes, and all six scenarios are hand-walked prose). Promotes Phase F4 from "the unbuilt KCS payoff" to the **ratification critical path**, and forces the Phase 2 conformance-results-intake decision · M | `chief/79-conformance-gated-ratification` *(proposed, koine)* |

*Depends on:* `76` depends on `75` (the pin corrections rewrite the same example card the namespace
move touches). `77` fills the OTIO/C2PA/OMC rows of the pin table and `78` the KFT rows, so both
share `docs/upstream-standards.md` as a conflict domain with `76`. `78` coordinates with
`chief/71-kft-dep-repin`, which owns the cross-*plane* pins where `78` owns the cross-*standard*
ones. `79` changes the lifecycle every other row lands under, so it is cheapest either first or
last, never mid-flight. **Downstream:** `75` has a cross-repo half — a runtime commons pins the
same extension URI in at least four places including a byte-for-byte conformance corpus
(`agora:72-kcb-extension-uri-migration`), built there per ADR-0001, never here.

### Ongoing — steady-state, not a phase — 🚧 continuous

| Status | Milestone | Tasklist |
|---|---|---|
| 🚧 | **Spec stewardship** — new agnostic ADRs (numbered ≥ 0009 after F1/F2; 0002–0004 permanently reserved to the downstream sequence), registry growth by *new* namespaced relation names (never in-place edits), `schemas/` kept in lockstep with spec versions | — |
| 🚧 | **Track downstream adoption** — as agora and the sibling producers implement the contracts, feed real conformance results back into the ratification gates | — |

### Loose wishlist — ⬜ not yet phased

Smaller open threads noted across the specs/registry, not big enough to anchor a phase:

- ✅ **Reconcile the dangling `ECOSYSTEM.md` references** — resolved 2026-08-11: [`ECOSYSTEM.md`](ECOSYSTEM.md) now exists as the thin, informative, shape-level living topology (planes + status, role map, ADR-0001 topology principles, cross-repo conventions) carrying **no instance data** — the instance topology stays in the private integration repo, per its §7.
- **Reserved-but-unexercised lifecycle relations** — KINP `retracts` / `supersedes` (delta D, identity.md §4.2) and KFT `retrains` / `supersedes` (registry) are registered but never driven by a scenario.
- **Perceptual / near-dup asset matching** — scoped *out* of KINP 0.2.0 (delta E) and still unbacked; the `media:perceptual_match` relation has no chosen backend (ties to KMI §9.4).
- **Registry vocabulary growth** — the `cine:` / `media:` / `soc:` domain families grow by PR (new immutable names), driven by real producer needs.
- **Perceptual-hash provenance recording** — record which pHash/fingerprint/embedding backs a match (the way KGP records `embedding_model`) so scores are comparable (KMI §9.4).

---

## Chief Tasklist Status

- **Chief:** 4/4 built-program tasklists merged (`10`–`40`); **13 koine-owned forward tasklists authored** (`tasks/chief/*.json`, `passes:false`, unrun) — pending a run, not merged; plus **17 parked markers** — proposal-only Phase-F stems and cross-repo runtime built downstream per ADR-0001, neither run under koine. Records in [`tasks/chief/completed/`](tasks/chief/completed/), each carrying a `mergedToMain` commit.
  - `10-kmi-adopt-otio` → ADR-0005 · `20-kgp-standards-alignment` → ADR-0006 · `30-self-describing-participant` → ADR-0007 · `40-fabric-producer-contracts` → ADR-0008.
- **30 proposed tasklists** (`chief/50`–`chief/79`) back Phase 1's doc-sync + ratification-tail edits, the planned Phases F1–F6, and the Phase F7 prior-art/standards pass above — **all now authored** as `tasks/chief/*.json` (`passes:false`, unrun), numbered above the existing `10`–`40` band so they cannot collide. Twenty are koine-owned spec/ADR/scenario stems (including the Phase-1 `71-kft-dep-repin` and `72-kgp-findings-closure` and the seven Phase-F7 stems `73`–`79`); the other ten are **cross-repo** (agora / lugh / a consumer) and sit here only as *parked* markers — runtime work built downstream per ADR-0001, moved to the sibling repo when actionable, never in koine.
- **Phase F7 (`73`–`79`) is decided work, not a proposal shelf.** It comes from the 2026-08 prior-art sweep and includes the two **verified defects** — the KCB extension URI minted under an unregistered hostname (`75`) and the total absence of external-standard pins (`76`) — which are the highest-value rows on this roadmap by cost-to-fix. One row of `75` is cross-repo (`agora:72-kcb-extension-uri-migration`).

The four candidate **re-ratifications** are spec-owner gates driven by re-running existing
scenarios, not Chief tasklists; the koine-own contract edits are the F1/F2/F6 spec/ADR/scenario
stems and the Phase-1 stems — the doc-sync (`chief/50`) plus the two ratification-tail spec edits
(`chief/71-kft-dep-repin`, `chief/72-kgp-findings-closure`). Everything F-banded is a
**proposal only**.

---

## Related Docs

**Canonical reference surfaces (kept in place — this roadmap links, never duplicates them):**
- [`specs/`](specs/) — the six protocol contracts ([`identity.md`](specs/identity.md) · [`grounding-pack.md`](specs/grounding-pack.md) · [`media-interchange.md`](specs/media-interchange.md) · [`capability-bus.md`](specs/capability-bus.md) · [`conformance-scenario.md`](specs/conformance-scenario.md) · [`fine-tuning.md`](specs/fine-tuning.md)) and their [`README.md`](specs/README.md).
- [`decisions/`](decisions/) — the agnostic ADRs: [ADR-0001](decisions/ADR-0001-control-plane-topology.md) (control-plane topology) · [ADR-0005](decisions/ADR-0005-otio-canonical-timeline.md) (OTIO) · [ADR-0006](decisions/ADR-0006-kgp-rdf-prov-jsonld-relationship.md) (KGP canonical + projection) · [ADR-0007](decisions/ADR-0007-self-describing-participant.md) (self-describing participant) · [ADR-0008](decisions/ADR-0008-fabric-producer-adapter.md) (fabric-producer adapter).
- [`schemas/`](schemas/) · [`registry/`](registry/) · [`policy/`](policy/) — the machine-readable twins, shared vocabularies, and license/trust policy.
- [`scenarios/`](scenarios/) — the end-to-end pressure tests that gate ratification.

**Guides & positioning:**
- [`docs/positioning.md`](docs/positioning.md) — how koine relates to A2A, MCP, and mature domain standards (the governance gaps it fills; what it builds on rather than replaces), and the **prior art it cites and dismisses** — nanopublications/Trusty URIs, C2PA, Croissant, Frictionless, Pact, DIDs/VCs.
- [`docs/upstream-standards.md`](docs/upstream-standards.md) — the **pin table**: which version or dated revision of each external standard koine was validated against, and the drift-check cadence that keeps it honest.
- [`docs/self-describing-participant.md`](docs/self-describing-participant.md) — the adopter checklist (namespace, capability manifest, egress policy, vocabulary mappings).
- [`docs/walkthrough-capability-bus.md`](docs/walkthrough-capability-bus.md) — a KCB advertise → discover → direct-dial walkthrough with real payloads.
- [`README.md`](README.md) · [`CLAUDE.md`](CLAUDE.md) — the fabric thesis / role vocabulary, and the in-repo working conventions + per-spec current state.
