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
| [`identity.md`](identity.md) | **KINP** — Identity & Namespace | keystone — the shared namespace every join is expressed in | 0.5.0 · 🟡 candidate |
| [`grounding-pack.md`](grounding-pack.md) | **KGP** — Grounding-Pack | data — knowledge (claims / predicates / graph) | 0.6.0 · 🚧 candidate |
| [`media-interchange.md`](media-interchange.md) | **KMI** — Media-Interchange | data — media (assets, lineage, OTIO timelines, transforms) | 0.3.8 · 🚧 candidate |
| [`capability-bus.md`](capability-bus.md) | **KCB** — Capability-Bus | control — discovery / invoke / subscribe over MCP + A2A | 0.5.8 · 🚧 candidate |
| [`conformance-scenario.md`](conformance-scenario.md) | **KCS** — Conformance-Scenario | test — declarative scenario data that drives **N real** participants over their actual MCP/A2A connections, asserting cross-plane properties, each cited to the clause it checks | 0.3.0 · 🚧 candidate |
| [`fine-tuning.md`](fine-tuning.md) | **KFT** — Fine-Tuning | profile — composes the four planes into a `finetune` capability | 0.7.1 · 🚧 candidate |

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
([`../docs/reference/positioning.md`](../docs/reference/positioning.md)).

**The cost, stated rather than glossed.** This rule makes ratification **harder**, and it holds
specs at `candidate` longer. It did so absolutely between 2026-08-13, when the rule landed, and
2026-08-19, when the first machine-replayable encodings landed downstream: over that window no spec
in the fabric was promotable at all, because the artefact the rule requires did not exist anywhere.
That trade is deliberate. A spec that is honestly `candidate` tells an implementer
something true; a `ratified` status that flips back twice a year tells them nothing, and quietly
costs them the one thing ratification is supposed to buy. Slower promotion is the price of a status that means what it says.

**The spec ratified before the rule — grandfathered, with the debt named.** KCS 0.2.0 reached
`ratified` under the previous rule on a hand-walked prose pass and nothing else. It is now back at
`candidate` because its 0.3.0 determinism fold is a normative change. KINP likewise returned to
`candidate` with its 0.3.0 federation fold. The rule binds forward: a status change is a deliberate
act taken on a spec's own merits — never a consequence of a governance amendment — and a normative
change does not retain grandfathered ratification.

Grandfathered is not forgiven. KCS carried a named debt — the missing machine-replayable encoding
of the prose pass that gated it — and the debt was tracked, not merely noted. It has since been
**discharged**:

| Spec | Gated by (prose) | Debt | Status |
|---|---|---|---|
| **KCS 0.2.0** | [`../scenarios/kcs-format-stress.md`](../scenarios/kcs-format-stress.md) | the encodings that pass *attempts* in prose, produced for real (see the self-reference note below) | **paid 2026-08-19** — all nine encodings exist downstream, `kcs:format-stress` among them (Phase F4 below) |

Paying the debt does not by itself promote KCS: it is at `candidate` on its own 0.3.0 determinism
fold, so it re-enters at the ordinary gate — which the discharged debt now satisfies, leaving that
fold's own re-validation as what remains. **That re-validation was walked by hand on 2026-09-03 and
did not clear it**: the fold half-flips, `structure_matches` having a normative *MUST NOT be byte
equality* and no statement of what it does compare, so the count changed shape rather than closing
(new blocking delta **R** — see [`conformance-scenario.md`](conformance-scenario.md) *Pressure test*).
KCS stays `candidate`, and when it does promote it is under **this** rule and not the grandfathered
one — the grandfather clause does not survive a demotion.

**What forces the debt to be paid.** The grandfather clause does not survive a demotion. When a
grandfathered spec's model shape changes and its status returns to `candidate`, it re-enters the
lifecycle at the ordinary gate and **MUST NOT** return to `ratified` without the artefact; there is
no second grandfathering. That is the event, and it is the only one — a grandfathered spec that
never moves never owes the artefact. The corollary above buys an ordinarily demoted spec a cheap
re-ratification because it replays the scenario it earned; a grandfathered spec has none, so its
first demotion is where it pays the full price at the worst moment. That asymmetry is a reason to
settle the debt under Phase F4 ahead of need, not a reason to weaken the rule. It played out exactly
that way: KCS was demoted by its 0.3.0 fold and the debt had already been settled, so the demotion
cost it a re-validation rather than a build.

**KCS's self-reference, and why it is not circular.** KCS is the format
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

**How a spec earns the artefact — Phase F4 is the mechanism, and it has delivered.** The rule would
be empty without a defined path from the prose pass a spec already has to the runnable document it
now needs. That path is [`../ROADMAP.md`](../ROADMAP.md) **Phase F4**, and as of **2026-08-19** it
has been walked: `agora chief/75-encode-scenarios-as-kcs` encoded every
[`../scenarios/`](../scenarios/) pressure test as a machine-replayable KCS document, and
`agora chief/76-run-kcs-over-live-links` ran the suite over real MCP/A2A connections (with delta-N
`standin` fixtures for roles nobody has adopted yet), leaving a committed evidence artifact. Both
were built downstream, not here
([`../decisions/ADR-0001-control-plane-topology.md`](../decisions/ADR-0001-control-plane-topology.md)):
koine specifies the format and holds the prose; the console that replays a document is runtime. What
this rule changed is that pair's standing. Encoding the scenarios used to be the KCS payoff — nice to
have, scheduled behind everything with a delivery date. It became the **only** route to `ratified`
for every spec in the table above, which put it on the critical path, and it is the reason that path
is now clear. The per-scenario state of that work is tracked where a reader already looks: the
**KCS encoding** column of [`../scenarios/README.md`](../scenarios/README.md) — corrected on
**2026-08-26** by `84-record-the-downstream-results`, which flipped the nine stale `planned` cells
and recorded the run itself (below) in the same pass. That column is the **register of record** for
per-scenario encoding state; this section restates it and is the bug on disagreement.

(The two tasklist ids this paragraph used to name — `agora chief/62` / `chief/63` — were koine-side
*markers* for work that could only run downstream. They were retired when the downstream tasklists
that did the work were authored; `75` / `76` are those tasklists, and they are what to read.)

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

**What this gate blocks today — corrected 2026-08-26.** This paragraph used to read *"no scenario
has a KCS encoding, so no spec is currently promotable to `ratified`"*. That has been false since
**2026-08-19**. All nine [`../scenarios/`](../scenarios/) pressure tests now have machine-replayable
KCS encodings, built downstream and checked in at `agora/console/src/kcs/scenarios/`
(`agora chief/75`), and the suite was run over real MCP/A2A links with delta-N stand-ins for
unadopted roles (`agora chief/76`), leaving `agora/console/evidence/kcs-live-run.json` — a
content-addressed run record that koine has verified **exists and covers all nine**, and whose
`green` verdict is that artifact's own claim rather than something re-run here
([`../docs/reference/kcs-encoding-gate-verification.md`](../docs/reference/kcs-encoding-gate-verification.md)).

So the **artefact gate is met for all six specs** — corrected **2026-09-03**, from *"four of the
six"* — and for all six what a promotion waits on is no longer this rule. It is each spec's own
outstanding pass — an unfolded delta set, an un-re-run scenario, a missing downstream fixture. For
**KGP** that outstanding pass was the whole of what remained, and it closed on 2026-08-28: the §4.1
round-trip fixture landed downstream, was read and perturbed at a named sha, and KGP 0.5.2 was
promoted — this rule's first promotion. **KGP has since been demoted again** (0.6.0, 2026-09-12 —
the `arg_types` fold, which changes which canonicalization rule a claim argument is emitted under),
and its new count is this rule's sharper form below rather than this one: the fixture's evidence is
untouched, and the *encoding* has to be **extended**. The two that used to be blocked by this rule are **KFT**,
whose 0.6.0 fold is gated by
[`../scenarios/kft-resume-checkpoint.md`](../scenarios/kft-resume-checkpoint.md), and **KCB** on §4.2
and §4.3, gated by
[`../scenarios/kcb-subscription-firehose.md`](../scenarios/kcb-subscription-firehose.md) and
[`../scenarios/kcb-cross-owner-posture.md`](../scenarios/kcb-cross-owner-posture.md) — three scenarios
written **after** the nine encodings were built, and all three encoded downstream at `agora`
`378fd3c` on **2026-08-26**, which closes findings **DR-11**, **DR-12** and **DR-13**. koine did not
learn for a week and then **ran** the downstream gates rather than reading them
([`../docs/reference/kcs-encoding-gate-verification.md`](../docs/reference/kcs-encoding-gate-verification.md)
§6.4). **No spec was promoted by that**, which is this rule working as designed: an encoding is a
precondition, and every count it preconditioned is still open.

**The sharper form of this rule survives, and it is what a promotion argument now has to answer.** An
encoding that **predates the fold it would have to assert** satisfies the count and not the clause:
`kcs:live-schema-mutation` for KCB count (ii) (**DR-7**) and `kcs:multi-authority` for KINP's only
count (**DR-8**) both came back `green` over open blocking deltas, because an encoding deliberately
does not assert a delta koine has not folded. Each must be **extended**, not re-run. Adding a document
to [`../scenarios/`](../scenarios/) incurs this gate, and no koine guard notices — the red light is
downstream, in both directions: nothing here goes red when a scenario arrives without an encoding, and
nothing here goes green when the encoding lands. **A third spec now shows the same shape, and it is the one that had been promoted.** KGP 0.5.2
reached `ratified` on 2026-08-28 — the first promotion under this rule, and the first with a
runnable artefact behind it — once the §4.1 round-trip fixture was delivered downstream and **read
at a named sha** rather than taken from a tasklist's `passes` flags
([`../docs/reference/kgp-projection-gate-verification.md`](../docs/reference/kgp-projection-gate-verification.md)).
Its **0.6.0** fold (2026-09-12) returned it to `candidate`, and `kcs:worlds-to-fabric` predates that
fold exactly as the two above predate theirs: every claim in the scenario stands on an `id|id`
relation, so the encoding asserts no literal-typed argument position and would come back `green`
without touching the fold. It must be **extended** too. **All six are `candidate` and none is
promotable today** — the count is back to **0 of 6** — for spec-specific reasons that this
section no longer supplies. One line per
spec naming that reason — and ranking the six by what a promotion actually costs from here — is
[`../docs/reference/promotability.md`](../docs/reference/promotability.md); the *program* view, with
tasklists and phases, stays in [`../ROADMAP.md`](../ROADMAP.md) *Phase 1*, which covers four of the
six (KINP and KCS have no Phase 1 row).

Two things this correction deliberately does **not** do:

- It does not promote anything. The encoding is a **precondition**, never a promotion: a status
  change stays the owner's deliberate act on the spec's own merits.
- It does not let a recorded run promote anything either — **corrected 2026-08-26**. Under the
  paragraph above, a citable result is one recorded **here**, in the scenario it ran, as a
  `## Downstream results` section. Every scenario now carries one, so the run *is* citable evidence
  and the clause that consumes it is live rather than hypothetical. Two conditions on citing it,
  both from the run's own findings, and an owner who skips them repeats the mistake the gate exists
  to prevent:
  - **`green` is not a gate verdict.** Per the runner, `green` means every encoded step and
    assertion passed with no transport failure. Two scenarios came back green over passes koine
    records as *not* clean, with four and six blocking deltas open (**DR-7**, **DR-8**), because an
    encoding deliberately does not assert a delta that has not been folded. Citing `green` as "the
    spec holds" is the `passes: true` error one layer down.
  - **A green encoding is evidence only for what it encodes.** Three findings record a clause that
    no assertion reaches — KGP's §4.1 projection round-trip (**DR-3**), KMI's **M-1** (**DR-4**),
    KFT's §3.3 and §8.1 (**DR-5**) — and the artifact records a per-scenario aggregate rather than
    pass/fail per assertion with its cited clause (**DR-2**), so the mapping from a green line to a
    discharged clause is read off the encoding by hand. The index of all fourteen findings is
    [`../scenarios/README.md`](../scenarios/README.md#findings-from-the-run-dr-1dr-14).

There is still no provisional status, no waiver, and no "ratified pending encoding": the rule has
one exception, the grandfather clause above, and it is closed to new entrants.

## External standards — the pin rule

Every spec here is a convention over standards koine does not control, and those standards version
on their own schedule. The rule that keeps that from silently rotting binds the **spec author**:

**Every normative reference to an external standard MUST name a version or a dated revision.** A
bare reference — "as in A2A", "per MCP", "PROV-shaped" — is a **defect**, not shorthand, and is
fixed the way any other defect in a clause is fixed. This is not pedantry about citation style: two
of the standards this fabric rides on shipped breaking changes to surfaces a koine spec maps onto,
so an unversioned "over MCP" does not name one wire protocol, it names two incompatible ones, and an
implementer cannot conform to it.

Three consequences follow, and they are the whole of the rule:

- **A pin states what koine was *validated against*** — never that the upstream is frozen. A newer
  upstream is normal and expected; an **unrecorded** newer upstream is the failure. So a pin ages
  honestly rather than becoming wrong.
- **Moving a pin is a spec change**, run through the lifecycle above like any other: a version bump,
  a changelog entry that says what moved and why, and — where the pin touches a **normative**
  surface — a re-run of the scenario gating that spec. A pin is not metadata that can be edited in
  passing.
- **There is exactly one table of record**, [`../docs/reference/upstream-standards.md`](../docs/reference/upstream-standards.md),
  which also carries the drift-check cadence (at every ratification or re-ratification, and
  quarterly as a floor). A spec **MAY** restate a pin it depends on so it reads standalone — KCB
  §1.1 and KMI §4.1 both do — and when it does it **MUST** cite that file; a restatement that
  disagrees with the table is the bug, and the spec is what gets fixed. A spec that does not restate
  a pin **MUST** point at the table rather than name a bare standard.

Note the direction, which is the reverse of the version/status mirrors above and deliberately so: a
spec's **own** version is a property of the spec, so its header wins over any table. An **upstream**
version is a shared fact about the world — the pinned MCP revision is the same fact for KCB and for
KCS — so it is recorded once where a single sweep can check it, and the specs cite it.

Drift is found by *resolving* a pin, not by re-reading the prose around it. The first sweep under
this rule turned up an SPDX identifier in [`../policy/license-classes.json`](../policy/license-classes.json)
that no SPDX release has ever defined — which no amount of careful reading would have surfaced.

---

## How to read a spec

- **Header first.** Each spec opens with its **version**, **status**, `Applies to:` (the roles it
  binds), and `Depends on:` (the specs it builds on). Read only the clauses for the roles you
  claim.
- **Status is a lifecycle:** `draft → candidate → ratified`, and the two promotions are gated
  differently — the second is **conformance-gated** ([The ratification gate](#the-ratification-gate)
  above). A spec is also demoted back to **candidate** when a later change touches its model shape.
  **All six sit there now** — KINP 0.5.0, KMI 0.3.8, KCB 0.5.8, KCS 0.3.0, KFT 0.7.1 and, since
  2026-09-12, KGP 0.6.0 — each for its own reason; which re-validation is outstanding for which spec
  is tracked in [`../ROADMAP.md`](../ROADMAP.md). KGP **was** `ratified` from 2026-08-28, the first
  promotion under the conformance gate, and its 0.6.0 argument-type fold demoted it the ordinary
  way — which is the rule working, not a setback: the fold closed a blocking interoperability
  finding in the one section every claim id depends on.
- **Clauses are §-numbered and normative.** MUST / SHOULD / MAY carry RFC-2119 weight; other specs
  and the schemas cite these section numbers (e.g. "KGP §7.2", "KINP §4.3"), so the numbering is a
  stable reference surface.
- **Changelog + immutability.** Each spec carries its own changelog. A published identifier,
  relation signature, or claim-normalization rule is immutable — a change means a new version and,
  where it touches a vocabulary, a new token in [`../registry/`](../registry/), never an edit in
  place.
