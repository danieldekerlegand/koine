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
| [`grounding-pack.md`](grounding-pack.md) | **KGP** — Grounding-Pack | data — knowledge (claims / predicates / graph) | 0.5.2 · 🚧 candidate |
| [`media-interchange.md`](media-interchange.md) | **KMI** — Media-Interchange | data — media (assets, lineage, OTIO timelines, transforms) | 0.3.2 · 🚧 candidate |
| [`capability-bus.md`](capability-bus.md) | **KCB** — Capability-Bus | control — discovery / invoke / subscribe over MCP + A2A | 0.4.1 · 🚧 candidate |
| [`conformance-scenario.md`](conformance-scenario.md) | **KCS** — Conformance-Scenario | test — declarative scenario data that drives **N real** participants over their actual MCP/A2A connections, asserting cross-plane properties, each cited to the clause it checks | 0.2.0 · ✅ ratified |
| [`fine-tuning.md`](fine-tuning.md) | **KFT** — Fine-Tuning | profile — composes the four planes into a `finetune` capability | 0.4.0 · 🚧 candidate |

**The table is a convenience mirror.** Each spec's own version + status header is the source of
truth. This table — and the ones in [`../README.md`](../README.md) and
[`../ECOSYSTEM.md`](../ECOSYSTEM.md) — restate it so the set can be scanned at once. If a table
and a header ever disagree, the header wins and the table is the thing to fix.

**KINP is the keystone.** Every other spec references its identifiers, envelopes, worlds, and
resolution semantics rather than redefining them; KGP, KMI, and KCB each `Depends on:` it in their
header. KFT is not a fifth plane — it is a *profile* that composes KGP + KMI + KINP + KCB.

## The ratification gate

`draft` is a spec still being written. `candidate` is a spec whose clauses are stable enough to
implement against. `ratified` is a spec whose clauses an implementer may treat as settled. Promotion
is earned, and the two promotions are earned differently. The rule binds the **spec owner** — the
role proposing the promotion — and nothing else in the fabric depends on who that is.

- **`draft → candidate`** — a concrete pressure-test scenario in [`../scenarios/`](../scenarios/) is
  hand-walked against the spec, adversarially (*prefer finding breaks over asserting correctness*),
  and every break it finds is folded back as a numbered delta. Prose suffices here: the question at
  this stage is whether the model *holds*, and a careful hostile read answers it.
- **`candidate → ratified`** — a spec **MUST NOT** be promoted from `candidate` to `ratified` unless
  a matching **KCS conformance scenario** exists: a machine-replayable
  [`conformance-scenario.md`](conformance-scenario.md) document that a conformant participant can
  actually run over its real MCP/A2A connections, whose assertions cite the clauses being ratified.
  A hand-walked prose pass remains **necessary** — it is what produces the deltas — but it is **no
  longer sufficient on its own**. No scenario, no ratification, however thorough the prose pass was.

**Why the second gate exists.** With no runnable artefact, *ratified* is a claim about a walk
somebody did, and the only way to check that claim again is for somebody to do the walk again. That
is the ratification treadmill this repo has actually been on: a spec is pressure-tested in prose,
promoted, then demoted the next time its model shape moves, with nothing a re-run can either pass or
fail. Making the artefact a **precondition of the status** rather than a follow-up to it is what
breaks the loop.

**The corollary that closes it.** When a ratified spec's model shape changes, its status returns to
`candidate` — that is normal and stays normal. What changes is what re-ratification *costs*: the
KCS scenario the spec earned on its way to `ratified` is **what the re-ratification runs**. A
re-ratification is therefore a replay against the new shape plus a fold of whatever the replay
breaks, not a fresh hand-walk commissioned from scratch each time. A spec that has never been
ratified has no such scenario, and its first ratification is where the artefact gets built.

**Borrowed, not invented — MCP's SEP-2484.** This is a governance design taken from the Model
Context Protocol's specification-enhancement process, whose SEP-2484 holds that *a spec cannot reach
Final without a matching conformance scenario*. Koine's lifecycle names its terminal state
`ratified` rather than `Final` and its artefact is a KCS document rather than MCP's, but the
mechanism — and the reason it works — is theirs. It is cited here rather than claimed, consistent
with how this repo treats prior art everywhere else
([`../docs/positioning.md`](../docs/positioning.md)).

**The cost, stated rather than glossed.** This rule makes ratification **harder**, and it will hold
specs at `candidate` longer — possibly much longer, since as of this writing every one of the
fabric's pressure tests is prose and the machine-replayable encodings do not yet exist. That trade
is deliberate. A spec that is honestly `candidate` tells an implementer something true; a `ratified`
status that flips back twice a year tells them nothing, and quietly costs them the one thing
ratification is supposed to buy. Slower promotion is the price of a status that means what it says.

## How to read a spec

- **Header first.** Each spec opens with its **version**, **status**, `Applies to:` (the roles it
  binds), and `Depends on:` (the specs it builds on). Read only the clauses for the roles you
  claim.
- **Status is a lifecycle:** `draft → candidate → ratified`, and the two promotions are gated
  differently — the second is **conformance-gated** ([The ratification gate](#the-ratification-gate)
  above). A spec is also demoted back to **candidate** when a later change touches its model shape.
  Four sit there now — KGP 0.5.2, KMI 0.3.2, KCB 0.4.1, KFT 0.4.0 — each for its own reason; which
  re-validation is outstanding for which spec is tracked in [`../ROADMAP.md`](../ROADMAP.md).
- **Clauses are §-numbered and normative.** MUST / SHOULD / MAY carry RFC-2119 weight; other specs
  and the schemas cite these section numbers (e.g. "KGP §7.2", "KINP §4.3"), so the numbering is a
  stable reference surface.
- **Changelog + immutability.** Each spec carries its own changelog. A published identifier,
  relation signature, or claim-normalization rule is immutable — a change means a new version and,
  where it touches a vocabulary, a new token in [`../registry/`](../registry/), never an edit in
  place.
