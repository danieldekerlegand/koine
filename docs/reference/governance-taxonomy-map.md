# The six governance dimensions, mapped onto koine

> **Status:** Current · **Updated:** 2026-08-18 · **Owner:** koine

**Status:** informative. This document binds no clause, adds no gate, and **moves no spec version** —
every spec header is unchanged by it. Where it disagrees with a spec, the spec wins and this file is
the defect.

## Why this document exists

A published governance taxonomy names six dimensions and grades five interoperability protocols
against them. [`../../specs/capability-bus.md`](../../specs/capability-bus.md) **§1.2** records the
half of that which points *at* koine — the paper reaches koine's own structural conclusion
independently, and is therefore validation and prior art over nothing.

This file answers the **inverse** question, which is the one a reader re-derives from scratch every
time the paper comes up: **how much of their taxonomy does koine cover?** Three of the six are
partly covered, and *"partly"* is exactly the answer that decays into folklore if nobody writes it
down — so it is measured once here, dated, against named sections, with the shortfalls that matter
filed as **findings** rather than left in prose.

Read it with the companion document: [`positioning.md`](positioning.md) is the narrative of where
koine sits among standards; this is the one table that narrative would otherwise have to guess at.

## The taxonomy, and how this map grades itself

The paper — Kang & Diponegoro, **arXiv:2606.31498**, **30 June 2026** — is described once, in KCB
§1.2 (its scope, its conclusion quoted verbatim, why it is cited by id and date, and why it is
deliberately **not** a row in [`upstream-standards.md`](upstream-standards.md): a taxonomy is not a
specification, no koine clause delegates to it, and a prior-art citation is not a pin). That section
is the anchor; nothing here restates it.

Its six dimensions, with the paper's own definitions:

| | Dimension | Definition (the paper's) |
|---|---|---|
| **G1** | Membership | "admission, invitation, removal, and role assignment for community participants" |
| **G2** | Deliberation | "structured argument exchange with turn-taking, challenge, and response semantics" |
| **G3** | Voting | "preference aggregation with quorum, rounds, and position resolution" |
| **G4** | Dissent preservation | "minority positions are retained in decision outputs, not silently dropped" |
| **G5** | Human escalation | "conditions and mechanisms for routing decisions to human authority" |
| **G6** | Audit / replay | "tamper-evident event logs enabling deterministic reconstruction of the decision process" |

**Six, not seven — and G6 is two claims.** Two errors are easy to make when the six are copied out
as a flat list, and both were made before this file existed. First, **G5 human escalation is the one
that gets dropped**, because "membership, deliberation, voting, dissent, audit, replay" also counts
to six. Second, **audit and replay are one dimension**, not two: G6 asks for a tamper-evident log
*and* deterministic reconstruction from it. This map keeps all six and splits G6's two claims
explicitly, because koine's coverage of them differs — and because *replay* is a word koine already
uses, in a different sense (see G6b).

**The grading criteria are the paper's own**: a dimension is *Supported* / *Partial* / *Absent*
based on **what the specification encodes, not what could be built on top**. That criterion is
load-bearing here — koine is a contracts repo (ADR-0001), so "an implementer could log that" is
never a grade.

Two things this map is **not**:

- **Not the authors' assessment.** The paper does not analyse, mention, or evaluate koine. Applying
  their criteria to koine's specs is koine's own reading; any misgrade below is ours, not theirs.
- **Not a scorecard koine is trying to win.** koine is not one of the five protocols analysed and is
  not on their axis (§1.2's non-overlap runs both ways). An **Absent** that a decision record calls a
  **non-goal is a result, not a debt** — see G2–G4.

## The map

Measured **2026-08-18** against KINP 0.2.1 · KGP 0.5.2 · KCB 0.4.4 · KMI 0.3.2 · KCS 0.2.0 ·
KFT 0.5.0.

| | Dimension | koine | Where it lives | The one-line reason |
|---|---|---|---|---|
| **G1** | Membership | **Partial** | KINP §3.4 · KCB §3, §5 · [ADR-0007](../../decisions/ADR-0007-self-describing-participant.md) | Identity, self-declared role and per-capability authorization exist; **admission and removal do not**. |
| **G2** | Deliberation | **Absent** | — | No koine clause encodes argument exchange, turn-taking, or challenge/response. |
| **G3** | Voting | **Absent** | — | No koine clause encodes preference aggregation, quorum, or rounds. |
| **G4** | Dissent preservation | **Absent** | — | No koine clause encodes a minority position; nothing in the fabric produces a "decision output" to preserve one in. |
| **G5** | Human escalation | **Partial (narrow)** | KINP §11 decision 2 · KCB §5 · KGP §7 · KMI §3 | **One** route to a human exists — the hybrid merge **review queue** — and it is a knowledge-contamination control, not a decision-escalation mechanism. |
| **G6a** | Audit | **Partial** | KGP §2/§7 · KINP §7 · KMI §3 · KFT §3.3.1, §5.2 · KCB §5 | **Artifacts** are provenanced and tamper-evident by construction; **events and decisions** are not recorded at all. |
| **G6b** | Replay | **Partial** | KCS §1, §4 · KGP §6 · KCB §4 | KCS replays a **scenario** against live participants; nothing reconstructs a past run from a log. |

The rest of this section says, for each **Partial**, what is covered and what is not — because
"Partial" without that split is the folklore this file exists to replace.

### G1 Membership — Partial

**What koine covers.**

- **Existence and identity.** KINP §3.4's namespace registry reserves a prefix to exactly one
  minting authority, immutably, **in the role it claims** (producer / consumer / authority / host /
  provider). Every participant is therefore identifiable and its identifiers are attributable to it.
- **Discovery.** KCB §3's registry indexes what a participant publishes — pushed by the participant
  or crawled off its A2A AgentCard — so a participant is *findable* once it exists. The registry is
  a cache over the participant's own surface, explicitly **not** a source of truth.
- **Authorization, which is the nearest thing koine has to admission.** A KCB §5 **capability grant**
  is issued by the hosting org's governance, names a verb and scope (`invoke:compose`,
  `subscribe:world/…`, `fetch:asset`), binds to `(capability, major)` per
  [ADR-0009](../../decisions/ADR-0009-capability-versioning-deprecation.md), and carries a spend
  ceiling. That is admission **to one capability**, granted by one org, not admission to a community.
- **One conferred role.** KINP §11 decision 1 designates a single identity **authority** for
  real-world entities. It is the only role in the fabric a *deployment* confers rather than a
  participant claiming it — and it is a deployment designation, not a protocol admission handshake.

**What koine does not cover.**

- **No admission or invitation.** A participant joins by publishing a card and registering a prefix.
  KINP §3.4 says it outright: *"registration confers a name, not a privilege."* This is the same
  posture the paper grades **Partial** for A2A — *"an agent exists by publishing an Agent Card; there
  is no concept of community membership distinct from existence"* — and koine lands there for the
  same structural reason, deliberately (ADR-0007: a participant is **self-describing**, and the
  registry returns an **address** to a self-description, never the self-description).
- **No removal.** A namespace prefix is immutable once published and there is no de-registration; a
  grant has no stated end (**GOV-1**). Nothing in the fabric can express *this participant is no
  longer one of us*.
- **No role assignment.** Roles are self-declared and descriptive — clauses are written *against*
  roles, and no clause checks that a participant is entitled to the one it claims.

### G5 Human escalation — Partial (narrow)

**What koine covers.** Exactly one path routes a decision to a human, and it is specified: KINP §11
decision 2's **hybrid merge policy** auto-applies `same_as`/`based_on` above a confidence threshold
and routes high-impact or below-threshold links to a **review queue**. Three specs feed it — KCB §5's
merge-review linkage (a pack from a low-trust provider queues rather than auto-applies), KGP §7's
per-record trust tier, KMI §3's `perceptual_match` — which makes it a genuine cross-plane mechanism
rather than one spec's aside.

**What koine does not cover.** The queue answers *"should these two identifiers be merged?"* — a
knowledge-contamination control. It is not a general escalation mechanism: no other gate can escalate
(KGP §7.2 egress, KCB §5 ceiling and KFT §4 admission each refuse, and refusing is all they do), no
clause defines *when* a human must be invoked as against when one may be, and no clause names the
human authority or how the decision returns.

**Do not read KFT §8.1 as escalation.** Graded refusal routing hands a caller `route_to[]` —
resolvable addresses of *other providers* — and the spec is explicit that this is a hint and not a
delegation. It routes machine → machine. It never reaches a person.

### G6a Audit — Partial

**What koine covers, and it is real.** koine's artifacts are provenanced and tamper-evident **by
construction**, not by a logging discipline anyone has to remember to follow:

- A claim's identity **is** the hash of its normalized content (KGP §3, KINP §2), so an altered claim
  is a different claim and cannot masquerade as the original. Same for an asset's bytes.
- Every claim and assertion carries PROV-shaped `prov` (KGP §2/§7, KINP §7) with bitemporal time, so
  *who asserted this, from what, when, under which license and egress class* is answerable from the
  artifact alone.
- KMI §3's lineage graph answers the same question for derived media; KFT §5.2 hangs a training run
  off a PROV activity.
- KCB §5's signing shape makes a pack or invocation cryptographically **attributable** rather than
  merely asserted — though it is a **SHOULD**, not a MUST.
- KFT §3.3.1's **conversion record** is the fabric's one *mandatory* record: a run executed through a
  conversion whose record is absent is **not conformant**.

**What koine does not cover.** There is **no event log anywhere in the fabric**, and therefore
nothing that G6 would recognize. Specifically:

- No clause requires any participant to record **that an invocation happened**, that a grant was
  spent against, or that a gate refused. The fabric's gates — KGP §7.2 egress, KGP §7.1 license, KCB
  §5 grant + ceiling, KFT §4 admission and §8.1 graded refusal — all *decide*, and none leaves a
  required trace (**GOV-2**).
- Content-addressing is tamper-evidence over an **artifact**, not over a **sequence**. There is no
  hash chain, no ordering, and deliberately so on the data plane: KGP §6 deltas are
  ordering-independent and content-addressed, which is a feature (redelivery is safe) and the reason
  there is no order for an auditor to verify.
- The one mandatory record, KFT's, records **conversion loss** — what the target never saw — not a
  decision. It is the right shape for this problem and covers a different problem.

This is the same distinction the paper draws when it grades ERC-8004's audit **Partial**:
tamper-evidence inherited from a substrate is not a governance-audit design. koine's is inherited
from content-addressing, which is a better substrate for the artifact question and answers none of
the event question.

### G6b Replay — Partial

**What koine covers.** KCS is a **replayable** format by its own opening sentence, and specifically:
a declarative scenario document drives any combination of participants over their **real** MCP/A2A
connections (§4 step 1 — no proxy, no mock), records every request, response and stream frame into
an **observation log**, evaluates assertions against that log, and emits a report that is itself
content-addressable and archivable. Re-running a scenario is safe because content-addressed claim and
asset ids make redelivery idempotent (KGP §6, KCB §4).

**What koine does not cover — and this is the distinction the word hides.** KCS replay is
**re-execution of a script against live participants**. G6 asks for **deterministic reconstruction of
a past run from its log**. They share a word and are different claims:

| | KCS replay | G6 reconstruction |
|---|---|---|
| Input | The scenario document | The event log |
| Requires | Live participants, reachable now | Nothing but the log |
| Yields | A **new** run, and a new report | The **original** run |
| Guarantees | Redelivery is safe (idempotent ids) | The sequence is what it says it was |

And the observation log is an **output** of a run, not an input you can replay from. Worse, a KCS
report does not pin what a re-run would need to be comparable: which MCP revision each participant
spoke is INFORMATIVE (KCS §4's note, KCS §7 open question 3), and which capability **major** an
`invoke` resolved to is not carried at all (KCB finding **V-5**, [`../../scenarios/e2e-live-schema-mutation.md`](../../scenarios/e2e-live-schema-mutation.md)).
So the report is content-addressable but the run it reports is not reproducible from it (**GOV-3**).

*Third sense, for completeness:* "replay" also appears in KGP §6 / KCB §4 meaning **idempotent
redelivery** — sending the same content-addressed delta twice is harmless. That is a safety property
of the data plane and is neither of the two above.

### G2 Deliberation · G3 Voting · G4 Dissent preservation — Absent

All three are **Absent** under the paper's criterion, unambiguously: no koine spec encodes argument
exchange, preference aggregation, or minority-position retention, and nothing in the fabric produces
a *collective decision output* for a dissent to be preserved in. There is nothing partial to split.

**Their absence is a scope question, and this file does not answer it.** Whether each is a gap koine
should close or a boundary koine should state is a decision with evidence behind it, and it belongs
in a `decisions/` record where it is citable and closes the question — not in an informative map.
Until that record lands, read these three rows as *measured absent*, not as *filed as debt*. They are
**not** findings below, and that is deliberate: filing them would be the reflex this repo's
adopt-by-reference discipline exists to prevent — the paper is a **taxonomy, not a specification**,
so closing them would mean koine **inventing** three protocol dimensions rather than profiling an
existing standard.

## Findings

The three shortfalls above that matter **on koine's own axis** — license, egress, trust tier, budget,
grant — are filed here as named findings rather than left as prose, following the register posture of
[`upstream-standards.md`](upstream-standards.md) § *Open findings* and the delta tables in
[`../../scenarios/`](../../scenarios/).

**None of these is a gate.** KCB's two re-ratification legs (`e2e-media-transform.md` and a clean
§7.5 break-test) and KFT's are restated unchanged and neither moved; KCS stays **Ratified**. A
finding is a unit of work for an owner to fold or dismiss, not a status change.

| # | Severity | Dimension | Gap | Candidate delta | Spec |
|---|---|---|---|---|---|
| **GOV-1** | **Med-High** | G1 (removal) | **A grant is issued and never ends.** KCB §5 fixes the *shape* of a grant and binds it to `(capability, major)`, but no clause says how a grant is withdrawn, expires, or is **observed** to have been withdrawn. §7.3's deprecation policy retires *surfaces* — a capability major, a media type, a manifest location — never an authorization. So the one authorization koine does specify is unbounded in time at the contract layer, and a counterparty cannot tell a live grant from a rescinded one. | An expiry/TTL on the grant, and/or withdrawal riding the **same in-band control frame** V-7 already requires for a live `subscribe` — one channel, two payloads. Or: state normatively that a grant's end is host-local (§5 already carves out issuance and rotation) and that a consumer therefore MUST re-validate on a stated cadence — an explicit boundary is as good an answer as a mechanism. | KCB §5 / §7.3 |
| **GOV-2** | **Med-High** | G6a (audit) | **The fabric's gates decide and record nothing.** KGP §7.2 says a consumer MUST reject a `local-only`-carrying pack "and report it" — to whom, in what shape, retained for how long, is unaddressed. KCB §5 refuses an over-ceiling invoke. KFT §4 admits or refuses, and §8.1 grades the refusal into a **report** — which is a *response to a caller*, not a record. Fabric-wide there is exactly one MUST-record (KFT §3.3.1) and it is about conversion loss. Consequence, and it is on koine's own axis: the strongest claim koine can make about its enforcing gates is *"a conformant producer filtered"* — never *"here is the evidence it did."* License propagation and egress control are only as good as the record that the filter ran, and there is no such record. | A minimal shared **gate-decision record** — gate, outcome, the ids of the inputs it read, the policy version it read them against — attached to the PROV activity KFT §5.2 already uses, reusing PROV rather than minting a log format. **Or** an explicit statement that a decision record is the implementer's (ADR-0001) and koine deliberately fixes no shape for it. What is not tenable is the current silence, which reads as an oversight rather than a boundary. | KGP §7 · KCB §5 · KFT §4 / §8.1 |
| **GOV-3** | Med | G6b (replay) | **"Replayable" overstates what a report guarantees.** KCS §4's report is content-addressable, but the run it reports cannot be reproduced from it: the participants' MCP revision is stamped only if the console chooses to (INFORMATIVE, §4 note), the capability major an `invoke` resolved to is carried nowhere (V-5), and no spec version in play is recorded. Two KCS reports of "the same" scenario can therefore describe runs that differ in ways neither report shows. | The step-4 report names the run's **operative pins** — each participant's observed MCP revision, each resolved capability `(name, major)`, and the spec versions asserted against. This is **evidence for KCS §7 open question 3** (recording fidelity) and makes no demand on the ratified spec — the same posture as finding **V-8**. It also gets cheaper once V-5 lands, since the invoke will then carry the version it resolved. | KCS §4 / §7 (OQ3) · KCB §4 (V-5) |

### Not findings — checked, and deliberately left alone

Recording these matters as much as the findings: each is a place where the taxonomy exposes an
absence that is **already a decision**, and re-filing it would re-open settled ground.

- **Roles are self-declared and nothing confers them** (G1). That is [ADR-0007](../../decisions/ADR-0007-self-describing-participant.md),
  not an oversight: a participant is self-describing and the registry returns an address to a
  self-description. A registry that vetted role claims would be the hub ADR-0001 refuses.
- **Existence is membership at the registry** (G1). Same ADR, same reason. The paper grades A2A
  *Partial* for this exact shape; koine chose it knowingly.
- **Content-addressing is not a hash chain** (G6a). It answers a different question — artifact
  integrity, not sequence integrity — and answers it better than a log would. It is *why* G6a is
  Partial rather than Absent, and it is not a defective version of the thing G6 asks for.
- **KGP §6 deltas are ordering-independent** (G6a/G6b). A deliberate property (redelivery is safe,
  §6, and KCB §4.1 leans on it), not a missing ordering guarantee.
- **G2 / G3 / G4 being Absent.** A scope question, answered in `decisions/`, not a finding — see the
  section above.

## Keeping this map honest

- **Re-derive, do not trust.** Every row above cites the spec section it was read off. A spec version
  moving does not invalidate a row by itself; a change to a **named section** does.
- **This file is not a mirror.** It states no spec's version or status as a fact to be kept in step —
  the six versions in *The map*'s preamble are the **measurement date's** reading, deliberately frozen
  so the measurement ages visibly rather than silently updating under itself. The mirrors
  `scripts/check-doc-integrity.mjs` enforces are elsewhere ([`../../README.md`](../../README.md),
  [`../../specs/README.md`](../../specs/README.md), [`../../ECOSYSTEM.md`](../../ECOSYSTEM.md) §2), and
  this file is not one of them.
- **A finding closes in the finding, not by deletion.** GOV-1…GOV-3 stay here with their closure
  recorded when an owner folds or dismisses them — a closed finding is the evidence the check ran.
