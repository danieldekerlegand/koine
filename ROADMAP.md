# koine — Roadmap

> The **contracts source-of-truth** for a neuro-symbolic interchange fabric — six protocol
> specs (KINP · KGP · KMI · KCB · KCS · KFT), a shared relation registry, JSON-Schema twins,
> and the agnostic ADRs. No runtime code: *"koine specifies, agora implements."* North star:
> *any two conformant AI systems interoperate on identity, knowledge, media, and capability
> without a single point-to-point bridge.*

**Status:** Contract layer complete — 3 of 6 specs ratified, 3 in candidate re-validation · maintenance + ratification cadence · **Last updated:** 2026-08-10

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

Two intertwined programs: the **per-contract ratification program** (each spec's climb through
`draft → candidate → ratified`, gated by a scenario in `scenarios/`) and the **ecosystem
implementation program** (the runtime that adopts these contracts, built downstream, not here).

### Per-contract ratification program

A spec is promoted only after a concrete pressure test fails to break it; a change to a *ratified*
model's shape drops it back to **candidate** and re-enters validation. Status below is each
spec's own header (authoritative).

| Contract | Plane | Version · status | Gating scenario | Notes |
|---|---|---|---|---|
| **KINP** — Identity & Namespace | keystone | 0.2.1 · ✅ ratified | `e2e-worlds-to-fabric` | Deltas A–E folded; three forks decided; the namespace every other spec references. |
| **KCS** — Conformance-Scenario | test | 0.2.0 · ✅ ratified | `kcs-format-stress` | Replayable scripts over participants' real MCP/A2A links; observer, not hub. |
| **KGP** — Grounding-Pack | data (knowledge) | 0.5.0 · 🚧 candidate | `e2e-worlds-to-fabric` (*Re-validation — KGP 0.5.0*) | ADR-0006 retains the bespoke TSV + content-addressed claim canonical; RDF-star/PROV/JSON-LD becomes a specified projection. Stays candidate on two minor projection findings (KGP-1, KGP-2) + a missing downstream round-trip fixture. |
| **KMI** — Media-Interchange | data (media) | 0.3.0 · 🚧 candidate | `e2e-media-transform` (*Re-validation — KMI 0.3.0*) | ADR-0005 adopts OpenTimelineIO as the canonical timeline; `edl+json` deprecated. KMI half re-validated clean; blocked only because the same scenario also gates KCB's manifest change. |
| **KCB** — Capability-Bus | control | 0.3.0 · 🚧 candidate | `e2e-media-transform` (outstanding) | §2 manifest redefined as a named A2A **AgentCard extension** (was `/.well-known/kcb-manifest.json`). Re-ratification path: re-run the media-transform scenario against the extension shape. |
| **KFT** — Fine-Tuning | profile | 0.4.0 · 🚧 candidate | `e2e-finetune`, `e2e-finetune-multimodal`, `e2e-producer-exhaust-finetune` (*Re-validation — KFT 0.4.0*) | A profile composing the four planes, not a fifth. Ratified 2026-07-23 on two passes; a third (producer-exhaust) folded strictly-additive intake deltas FT-M…FT-Q, so status returns to candidate pending owner re-ratification. |

### Ecosystem implementation program (downstream — built in siblings, not here)

koine specifies; the runtime is adopted by others. Tranches below are *tracked* by koine as the
consumers of its contracts — the code lives in each named repo, never in koine.

| Tranche | Adopts | Where it's built | Status |
|---|---|---|---|
| Runtime commons — provider-router, KCB discovery registry, KINP resolver, translation engine, conformance console | all six specs | **agora** | 🚧 in progress (per agora's own roadmap) |
| Fabric producers — worlds / knowledge / media / audio join as producers | KINP + KGP + KMI + KCB (+ KFT by reference) | insimul · pinakes · argos · formant | 🚧 rolling adoption |
| Memory substrate — joins as a KCB provider | KINP + KCB | tessera | 🚧 |
| Fine-tuning providers — general + specialized (local-only) trainers, registry-routed | KFT | agora (general) · lugh (specialized) | 🚧 |

### Contract-hardening milestones (Chief-driven, in koine)

| Phase | What | Status |
|---|---|---|
| Adopt OTIO as KMI's canonical timeline | demote bespoke EDL to deprecated; ADR-0005; KMI → 0.3.0 | ✅ `chief/10-kmi-adopt-otio` (ADR-0005) |
| KGP standards alignment | RDF-star / W3C PROV / JSON-LD as a specified projection; ADR-0006; KGP → 0.5.0 | ✅ `chief/20-kgp-standards-alignment` (ADR-0006) |
| Self-describing participant | namespace + KCB manifest (AgentCard ext) + egress policy + bridge maps published at the edge; ADR-0007; `schemas/participant-self-description.schema.json` + [`docs/self-describing-participant.md`](docs/self-describing-participant.md) | ✅ `chief/30-self-describing-participant` (ADR-0007) |
| Fabric-producer adapter | one thin translate-only adapter; per-app bridge/projection code superseded; `same_as` grounding (no `mentions` relation); ADR-0008 | ✅ `chief/40-fabric-producer-contracts` (ADR-0008) |

---

## Remaining / Next

koine's contract layer is complete; the tail is small and mostly one-off.

**One-off:**
1. **Re-ratify KCB 0.3.0** ⬜ — re-run [`scenarios/e2e-media-transform.md`](scenarios/e2e-media-transform.md) against the AgentCard-extension manifest shape. This is the single outstanding gate; KMI 0.3.0 re-ratifies with it (its half is already clean).
2. **Re-ratify KGP 0.5.0** ⬜ — close projection findings KGP-1 (which confidence a multi-provenance merged claim projects to ProbLog) and KGP-2 (name the §4.1 annotation predicates), and land the missing downstream RDF-star/PROV/JSON-LD round-trip fixture.
3. **Re-ratify KFT 0.4.0** ⬜ — owner re-ratification of the strictly-additive FT-M…FT-Q intake fold (already walked clean by `e2e-producer-exhaust-finetune`'s re-validation section).
4. **Doc-sync the index tables** ⬜ — bring `specs/README.md` and root `README.md` status columns in line with the current spec headers (KGP 0.5.0 candidate, KFT 0.4.0 candidate, KMI/KCB 0.3.0 candidate).

**Ongoing:**
5. **Spec stewardship** 🚧 — new agnostic ADRs (numbered ≥ 0005; 0002–0004 permanently reserved to the downstream sequence), registry growth by *new* namespaced relation names (never in-place edits), and keeping `schemas/` in lockstep with spec versions. Steady-state, not a phase.
6. **Track downstream adoption** 🚧 — as agora and the sibling producers implement the contracts, feed real conformance results back into the ratification gates.

---

## Chief Tasklist Status

- **Chief:** 4/4 tasklists merged (`10`–`40`); **0 pending**. Records in [`tasks/chief/completed/`](tasks/chief/completed/), each carrying a `mergedToMain` commit.
  - `10-kmi-adopt-otio` → ADR-0005 · `20-kgp-standards-alignment` → ADR-0006 · `30-self-describing-participant` → ADR-0007 · `40-fabric-producer-contracts` → ADR-0008.

No open autonomous work remains in this repo. The remaining re-ratifications above are
spec-owner gates driven by re-running existing scenarios, not new Chief tasklists.

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
