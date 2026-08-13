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
| [`capability-bus.md`](capability-bus.md) | **KCB** — Capability-Bus | control — discovery / invoke / subscribe over MCP + A2A | 0.4.3 · 🚧 candidate |
| [`conformance-scenario.md`](conformance-scenario.md) | **KCS** — Conformance-Scenario | test — declarative scenario data that drives **N real** participants over their actual MCP/A2A connections, asserting cross-plane properties, each cited to the clause it checks | 0.2.0 · ✅ ratified |
| [`fine-tuning.md`](fine-tuning.md) | **KFT** — Fine-Tuning | profile — composes the four planes into a `finetune` capability | 0.5.0 · 🚧 candidate |

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

**The two specs ratified before the rule — grandfathered, with the debt named.** KINP 0.2.1 and
KCS 0.2.0 reached `ratified` under the previous rule, each on a hand-walked prose pass and nothing
else. They **keep** the status. The rule binds forward: applying it retroactively would demote two
specs as a side effect of editing this file, and a status change is a deliberate act taken on a
spec's own merits — never a consequence of a governance amendment. It would also penalize work that
satisfied the rule in force when it was done, which is not what a lifecycle rule is for.

Grandfathered is not forgiven. Each of the two carries a named debt — the missing machine-replayable
encoding of the prose pass that gated it — and the debt is tracked, not merely noted:

| Spec | Gated by (prose) | Outstanding debt | Tracked in |
|---|---|---|---|
| **KINP 0.2.1** | [`../scenarios/e2e-worlds-to-fabric.md`](../scenarios/e2e-worlds-to-fabric.md) | `kcs:worlds-to-fabric` — that pass encoded as a runnable KCS document, then run over real links | [`../ROADMAP.md`](../ROADMAP.md) Phase F4 — `agora chief/62-encode-scenarios-as-kcs`, then `chief/63-run-kcs-over-live-links` (cross-repo, ADR-0001) |
| **KCS 0.2.0** | [`../scenarios/kcs-format-stress.md`](../scenarios/kcs-format-stress.md) | the encodings that pass *attempts* in prose, produced for real (see the self-reference note below) | same two Phase F4 tasklists |

**What forces the debt to be paid.** The grandfather clause covers the status these two specs hold
today and does not survive a demotion. When either spec's model shape changes and its status returns
to `candidate`, it re-enters the lifecycle at the ordinary gate and **MUST NOT** return to `ratified`
without the artefact; there is no second grandfathering. That is the event, and it is the only one —
a grandfathered spec that never moves never owes the artefact. Note what this costs the two of them
specifically: the corollary above buys a demoted spec a cheap re-ratification because it replays the
scenario it earned, and a grandfathered spec has none, so its first demotion is where it pays the
full price at the worst moment. That asymmetry is a reason to settle the debt under Phase F4 ahead of
need, not a reason to weaken the rule.

**KCS's self-reference, and why it is not circular.** KCS is both a `ratified` spec and the format
the rule's artefact is written in, so "KCS needs a KCS scenario" reads as a loop. It is not one,
because the two roles sit at different levels. What the rule requires is a runnable document that
exercises the clauses being ratified; for every other spec that document is a KCS scenario driving
participants over their real connections. KCS's own clauses are about *expressing* scenarios, and the
artefact that exercises them is [`../scenarios/kcs-format-stress.md`](../scenarios/kcs-format-stress.md):
it ratifies KCS by attempting to encode **other** specs' pressure tests as KCS documents and
recording every place the format could not say what a scenario needed — which is exactly what
produced its deltas. The encodings are the artefact; KCS is the notation they are written in, never
the subject they assert about. So KCS is never asserted against itself, and the Phase F4 encoding
work discharges KCS's debt as a by-product of discharging every other spec's: a KCS document that
cannot express a scenario is a KCS defect, surfaced by the attempt to write it. KCS is the one spec
whose conformance artefact is earned by **use** rather than by a run.

**How a spec earns the artefact — Phase F4 is the mechanism.** The rule would be empty without a
defined path from the prose pass a spec already has to the runnable document it now needs, and that
path exists: [`../ROADMAP.md`](../ROADMAP.md) **Phase F4** — `agora chief/62-encode-scenarios-as-kcs`
encodes each [`../scenarios/`](../scenarios/) pressure test as a machine-replayable KCS document, and
`agora chief/63-run-kcs-over-live-links` runs the suite over real MCP/A2A connections (with delta-N
`standin` fixtures for roles nobody has adopted yet). Both are built downstream, not here
([`../decisions/ADR-0001-control-plane-topology.md`](../decisions/ADR-0001-control-plane-topology.md)):
koine specifies the format and holds the prose; the console that replays a document is runtime. What
this rule changes is that pair's standing. Encoding the scenarios used to be the KCS payoff — nice to
have, scheduled behind everything with a delivery date. It is now the **only** route to `ratified`
for every spec in the table above, which puts it on the critical path. The per-scenario state of that
work is tracked where a reader already looks: the **KCS encoding** column of
[`../scenarios/README.md`](../scenarios/README.md).

**Where a run's result lands, and which gate consumes it.** A run is only evidence if it is recorded
somewhere a gate reads, so: a downstream conformance result is recorded in the scenario it ran, as a
**`## Downstream results`** section of that [`../scenarios/`](../scenarios/) document — run date,
participants **by role**, pass/fail per assertion with the clause each assertion cites, and for a
failure the finding it opens or the delta it reopens. It stays instance-free and role-scoped: koine
records that *a* participant in a role passed or failed a clause-cited assertion, never whose
deployment it was. The gate that consumes it is the **spec owner**'s: an owner proposing a promotion
**MAY** cite a recorded pass as evidence alongside the hand-walked re-validation, and **MUST** reopen
a finding that a recorded failure contradicts. A recorded result never promotes a spec by itself —
promotion stays a deliberate act — but no spec may be promoted *past* a recorded failure without
answering it.

**What a ratification does in the meantime.** Nothing, and that is the intended reading. As of this
writing no scenario has a KCS encoding, so no spec is currently promotable to `ratified` — the four
at `candidate` stay there until Phase F4 delivers, and their outstanding prose re-validations
(ROADMAP Phase 1) are now necessary-but-not-sufficient rather than the last step. There is no
provisional status, no waiver, and no "ratified pending encoding": the rule has one exception, the
grandfather clause above, and it is closed to new entrants. If that holds specs at `candidate` for a
year, the roadmap is telling the truth about where this repo is.

## How to read a spec

- **Header first.** Each spec opens with its **version**, **status**, `Applies to:` (the roles it
  binds), and `Depends on:` (the specs it builds on). Read only the clauses for the roles you
  claim.
- **Status is a lifecycle:** `draft → candidate → ratified`, and the two promotions are gated
  differently — the second is **conformance-gated** ([The ratification gate](#the-ratification-gate)
  above). A spec is also demoted back to **candidate** when a later change touches its model shape.
  Four sit there now — KGP 0.5.2, KMI 0.3.2, KCB 0.4.3, KFT 0.5.0 — each for its own reason; which
  re-validation is outstanding for which spec is tracked in [`../ROADMAP.md`](../ROADMAP.md).
- **Clauses are §-numbered and normative.** MUST / SHOULD / MAY carry RFC-2119 weight; other specs
  and the schemas cite these section numbers (e.g. "KGP §7.2", "KINP §4.3"), so the numbering is a
  stable reference surface.
- **Changelog + immutability.** Each spec carries its own changelog. A published identifier,
  relation signature, or claim-normalization rule is immutable — a change means a new version and,
  where it touches a vocabulary, a new token in [`../registry/`](../registry/), never an edit in
  place.
