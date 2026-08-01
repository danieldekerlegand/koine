# koine/specs — the authoritative prose contracts

The six protocol specs that make up the Koine fabric. A **spec** is the normative prose contract
for one protocol: the identifiers, envelopes, verbs, and MUST/SHOULD clauses a conformant
participant implements. Prose is the source of truth; [`../schemas/`](../schemas/) is its
machine-readable twin and [`../registry/`](../registry/) holds the vocabularies the clauses
reference by name. No runtime code lives here — *koine specifies, implementers implement*
([`../decisions/ADR-0001-control-plane-topology.md`](../decisions/ADR-0001-control-plane-topology.md)).

## The six protocols

| Spec | Protocol | Plane | Version · status |
|---|---|---|---|
| [`identity.md`](identity.md) | **KINP** — Identity & Namespace | keystone — the shared namespace every join is expressed in | 0.2.1 · ✅ ratified |
| [`grounding-pack.md`](grounding-pack.md) | **KGP** — Grounding-Pack | data — knowledge (claims / predicates / graph) | 0.4.0 · ✅ ratified |
| [`media-interchange.md`](media-interchange.md) | **KMI** — Media-Interchange | data — media (assets, lineage, EDLs, transforms) | 0.2.0 · ✅ ratified |
| [`capability-bus.md`](capability-bus.md) | **KCB** — Capability-Bus | control — discovery / invoke / subscribe over MCP + A2A | 0.3.0 · 🚧 candidate |
| [`conformance-scenario.md`](conformance-scenario.md) | **KCS** — Conformance-Scenario | test — a replayable script that drives participants over their real connections | 0.2.0 · ✅ ratified |
| [`fine-tuning.md`](fine-tuning.md) | **KFT** — Fine-Tuning | profile — composes the four planes into a `finetune` capability | 0.3.0 · ✅ ratified |

**KINP is the keystone.** Every other spec references its identifiers, envelopes, worlds, and
resolution semantics rather than redefining them; KGP, KMI, and KCB each `Depends on:` it in their
header. KFT is not a fifth plane — it is a *profile* that composes KGP + KMI + KINP + KCB.

## How to read a spec

- **Header first.** Each spec opens with its **version**, **status**, `Applies to:` (the roles it
  binds), and `Depends on:` (the specs it builds on). Read only the clauses for the roles you
  claim.
- **Status is a lifecycle:** `draft → candidate → ratified`. A spec is promoted only after a
  concrete pressure-test scenario in [`../scenarios/`](../scenarios/) fails to break it. KCB sits
  at **candidate** pending re-validation of its 0.3.0 AgentCard-extension manifest.
- **Clauses are §-numbered and normative.** MUST / SHOULD / MAY carry RFC-2119 weight; other specs
  and the schemas cite these section numbers (e.g. "KGP §7.2", "KINP §4.3"), so the numbering is a
  stable reference surface.
- **Changelog + immutability.** Each spec carries its own changelog. A published identifier,
  relation signature, or claim-normalization rule is immutable — a change means a new version and,
  where it touches a vocabulary, a new token in [`../registry/`](../registry/), never an edit in
  place.
