# ADR-0011 — Deliberation, voting and dissent preservation are non-goals for koine

**Status:** Accepted (2026-08-18)
**Deciders:** ecosystem owner
**Refines:** [`../specs/capability-bus.md`](../specs/capability-bus.md) (KCB) **§1.2**, whose closing
bullet records as a *fact* that no koine clause implements G2 / G3 / G4 — this record supplies the
**decision** behind that fact, and §1.2 now points here.
**Closes:** the question deferred by
[`../docs/reference/governance-taxonomy-map.md`](../docs/reference/governance-taxonomy-map.md)
§ *G2 Deliberation · G3 Voting · G4 Dissent preservation — Absent*, which measured the three absences
and said explicitly that the verdict belongs in a `decisions/` record.
**Applies to:** the fabric as a whole — every role (producer / consumer / authority / host /
provider). It changes no participant's obligations; it states a boundary.
**Numbering note:** ADR-0002 – ADR-0004 are reserved for the deployment-history records that live
downstream (see [`README.md`](README.md)); this record takes the next free agnostic number.

---

## Context

A published governance taxonomy — Kang & Diponegoro, **arXiv:2606.31498**, **30 June 2026** —
grades five agent interoperability protocols against six dimensions, and concludes that governance is
*"a missing architectural layer above current interoperability standards, not a missing feature within
them."* KCB **§1.2** records that citation once, in full, with its scope and the non-overlap in both
directions; nothing here restates it.
[`../docs/reference/governance-taxonomy-map.md`](../docs/reference/governance-taxonomy-map.md) then
measured the inverse — how much of the taxonomy koine covers — and found **G1 membership** Partial,
**G5 human escalation** Partial (narrow), **G6 audit / replay** Partial in both halves, and three
dimensions **Absent** outright: **G2 deliberation**, **G3 voting**, **G4 dissent preservation**.

The map deliberately did not decide what the three absences mean. This record does, because an
unaddressed absence does not stay neutral: it decays either into an assumed backlog — three
dimensions a reader takes for debt koine intends to pay — or into a question re-derived from scratch
at every portfolio scan. **A stated non-goal is worth as much as a spec.** It is also this repo's own
discipline in the other direction: no gate fires on a value nobody wrote, and no reader is bound by a
boundary nobody stated.

**The case for taking them IN scope is real, and is stated first.** The paper's worked example (§V-D)
expresses deliberation *over claims* — `CHALLENGE claim:c-042 TARGETS claim:c-041 (author: …)`, with
`EVIDENCE_REQUIRED` and a rationale — and its dissent primitive is a retained minority **position on
a claim**. koine already has claims: content-addressed, carrying confidence, provenance, license,
world and a trust tier (KGP §2/§3), asserted by KINP-identified participants over a KCB channel that
already does `subscribe`. On materials alone the fabric looks one short hop from the primitives, and
the temptation to close a named gap with a small additive section is exactly the reflex this record
has to answer rather than ignore.

Three measurements, all dated **2026-08-18**, answer it.

### 1. Where a vote happens today, it is inside one organization — and is not a governance vote

Across the known implementations (`../ECOSYSTEM.md` §3, informative), the one place anything votes is
inside a single **orchestration host**: voting is one *strategy* among pipeline / star / hierarchy,
run over an organization that host has itself assembled, and the aggregation is
**majority-vote-over-identical-answers** — every voter answers the same broadcast task and the most
common answer wins.

Two things follow, and the second is the sharper one.

- **It never crosses an organizational boundary.** The voters are assembled by one process, under one
  minting authority. The fabric's only contract-layer proxy for "one organization" is the KINP §3.4
  namespace prefix — reserved to exactly one minting authority — and every voter in such a run sits
  under a single prefix. Nothing about the decision is interchange; it does not reach the wire koine
  specifies.
- **By the taxonomy's own definition it is not G3 at all.** G3 is *"preference aggregation with
  quorum, rounds, and position resolution."* Answer-frequency selection has no quorum, no rounds and
  no positions — it is output selection among agents that share a task and have no interests to
  resolve. It also *discards* the losing answers, which is precisely G4's absence, occurring inside
  one org, in a component that is not koine's. So the strongest apparent counter-example to this
  record is, measured, neither a cross-organizational decision nor a governance vote.

### 2. No cross-organizational edge requires a joint decision

The edges that cross an ownership boundary today are analysis of captures, corpora supplied for
specialized training, and an upstream corpus source feeding two commercial consumers
(`../ECOSYSTEM.md` §3). Each is a capability invocation or a data flow, and in each, **both parties
decide only their own side**: the caller decides whether to invoke and what to send under its egress
class and budget; the callee decides whether to admit under its grant, license, trust tier and
placement rules, and may refuse. Neither party's decision is an input to the other's, and no outcome
binds both.

This generalizes past the current cast, and that is why it is load-bearing: **every gate in the
fabric is unilateral by construction.** KGP §7 license and egress, KCB §5 grant and spend ceiling,
KFT §4 admission and §8.1 graded refusal — each is one participant deciding for itself, and *refusing
is always available*. A protocol whose every decision is unilateral, and in which refusal is never
overridden, has nothing to aggregate preferences over.

### 3. There is nothing to profile — an absence, measured

`78-kft-adopt-by-reference` and its neighbours fixed the rule: where a standard covers a concern,
koine adopts it by reference and mints nothing. Applying that rule here first requires knowing
whether a standard exists. **A sweep on 2026-08-18 found none** — the record of that sweep, with what
was examined and why each candidate fails, is the appendix below. In summary: the only standardized
agent-interaction protocols are FIPA's, frozen in 2002 and built for task allocation and bilateral
negotiation rather than multilateral deliberation; the one standardized voting artifact is
**Stagnant** and covers vote *weight*, not the decision procedure; dissent preservation has no
standards-body work of any kind; and the live standardization activity — three agent-related
Birds-of-a-Feather sessions at **IETF 126, Vienna, 18–24 July 2026** — scopes discovery, gateway
mediation and "which building blocks genuinely need to be standardized", with **none** of the three
naming collective decision-making.

The paper agrees, from the other side: it closes by calling for *"governance-native protocol
primitives … encoded at the protocol layer"* — a call for a specification that does not exist yet.

So the choice is not *adopt or invent*. **It is invent, or decline** — and koine declines.

---

## Options considered

### Option (a) — Specify all three at the contract layer

Add deliberation, voting and dissent primitives to koine: a room or decision context, turn-taking and
challenge/response over claims, rounds and quorum, a retained minority position.

**Against.**
- **It is invention, which this repo has spent three tasklists learning not to do.** With no standard
  to profile, every field would be koine's own coinage, in a contract that binds five other planes.
- **Nothing would exercise it.** No cross-organizational edge needs it (measurement 2), so the first
  implementation would also be the specification's only reader — the inverse of how every ratified
  koine surface got there, which is a pressure-test scenario first.
- **An unexercised normative surface is not free.** It enters the versioning and deprecation policy
  (ADR-0009), takes registry vocabulary, and has to be maintained against whatever standard does
  eventually arrive — and a coined surface that later has to be reconciled with a real standard is
  the position ADR-0010 found KMI's lineage claim in, at greater cost.
- **It would freeze one taxonomy's framing.** The paper's own §V-F limitation says the taxonomy
  derives from Western organizational theory (Habermas, Robert's Rules) and that other traditions
  may yield different dimensions. Encoding six borrowed dimensions into an agnostic contract makes
  that framing normative for every participant.

*Rejected.*

### Option (b) — Profile an existing standard, per the adopt-by-reference rule

The move koine would prefer, and the one it made for OTIO (ADR-0005), Croissant, ModelPack and the
Hugging Face lineage convention (KFT 0.5.0).

**Against.** **The option is unavailable on the facts.** It was examined first and rejected only
because the sweep in the appendix came back empty — not on preference. Had a standards-body
specification for any of the three existed, this record would have adopted it and the verdict would
be the opposite one. **That is the condition trigger T2 watches.**

*Unavailable.*

### Option (c) — Adopt the paper's Listing 1 verbs (`ADMIT` / `CHALLENGE` / `VOTE_BLIND` / `DISSENT_RECORD` / `ESCALATE` / `EVENT`)

The paper's illustrative listing is concrete enough to look like a wire format, so treat it as one.

**Against.**
- **It is an illustration, not a specification.** It has no encoding, no state machine, no conformance
  criterion, and the paper presents it precisely as *what cannot currently be expressed* — not as a
  proposal. Adopting it is inventing with extra steps, plus a false citation: koine would be citing
  a taxonomy as if it were a pin, which KCB §1.2 explicitly refuses.
- **It carries the framing problem of option (a)**, with the additional defect of appearing to have
  external authority it does not have.

*Rejected.*

### Option (d) — Take dissent preservation (G4) alone, since KGP can already carry a minority claim

The narrowest possible in-scope move: no rooms, no rounds, no quorum — just a retained minority
position, which the claim envelope could arguably express today.

**Against.** **The three stand or fall together.** A dissent is a minority position *within a decision
output* (`PRESERVED_IN: decision_record:…` in the paper's own listing). Nothing in koine produces a
collective decision output — that is G3 — so there is nothing for a dissent to be preserved *in*. A
"dissent" without a decision to dissent from is a claim asserted with low confidence by a
disagreeing participant, and **KGP already carries exactly that**: two participants may assert
contradictory claims, both survive, both keep provenance and confidence, and neither is silently
dropped. Minting a G4 surface would either duplicate that or require G3 first.

*Rejected — and the reason is worth keeping: koine's data plane already refuses to silently drop a
minority claim, which is the property G4 exists to protect, reached without a governance layer.*

### Option (e) — State the three as non-goals, with a checkable re-open trigger

Decide, record the reason and the evidence, and state the conditions under which the decision is
wrong — so the boundary is citable and the re-open is a test rather than an argument.

**For.** It closes the question at the same cost as leaving it open, keeps koine on its own axis,
preserves the adopt-by-reference discipline for the day a standard exists, and is reversible: a
non-goal that later becomes a goal costs a new ADR, whereas a coined surface that later has to be
withdrawn costs a deprecation cycle under ADR-0009 §7.3 and every implementation that trusted it.

*Decided.*

---

## Decision

**Deliberation, voting and dissent preservation are non-goals for koine.** Explicitly, one verdict
per dimension:

1. **G2 deliberation — NON-GOAL.** koine specifies what one participant asserts to another and under
   what terms it may be used; it does not specify a procedure by which participants argue toward a
   shared conclusion. No standard exists to profile (appendix), no cross-organizational edge exercises
   it (measurement 2), and structured argument between agents assembled by one orchestrator is that
   orchestrator's concern.
2. **G3 voting — NON-GOAL.** Every decision the fabric specifies is unilateral, and refusal is always
   available; there is no fabric decision whose outcome is a function of several participants'
   preferences. The one vote observed anywhere in the known implementations is intra-organizational
   answer selection (measurement 1), which is not preference aggregation in the taxonomy's sense.
3. **G4 dissent preservation — NON-GOAL, and dependent.** It cannot be taken alone: without a
   collective decision output there is nothing to preserve a minority position in (option d). What
   G4 protects against — a minority view being silently dropped — is already a property of the KGP
   data plane, where contradictory claims coexist with provenance and confidence intact.

**The boundary, in one sentence:** *koine specifies what crosses an organizational boundary, not how
one organization decides.*

Three consequences of that sentence are part of the decision, not commentary on it:

4. **This is not a blanket dismissal of governance.** G1 membership, G5 human escalation and G6
   audit/replay stay **measured Partial**, and findings **GOV-1** (a grant is issued and never ends),
   **GOV-2** (the fabric's gates decide and record nothing) and **GOV-3** (a report is
   content-addressable but its run is not reproducible from it) stay **open**. They sit on koine's own
   axis — license, egress, trust tier, budget, grant — and "governance is not koine's axis" MUST NOT
   be cited against them. **G5 in particular is not decided here** and is not a non-goal: the fabric's
   gates already refuse, and a refusal that needs a person is a real fabric case with exactly one
   narrow mechanism today.
5. **A participant that needs these composes them over koine, not in it.** The paper's own criterion
   is *what a specification encodes, not what can be built on top*, and a deliberating orchestrator is
   the on-top case: it can carry positions as KGP claims with provenance and confidence, address
   participants by KINP id, and move traffic over KCB. That is a **statement of what is possible, not
   a koine clause** — koine offers no conformance surface for it and makes no promise about it.
6. **No pin, no row, no gate.** The paper stays a prose citation by arXiv id and date and does **not**
   become a row in
   [`../docs/reference/upstream-standards.md`](../docs/reference/upstream-standards.md) (KCB §1.2's
   reasoning, unchanged). This record adds no gate, moves no re-ratification leg, and changes no
   normative clause anywhere in `specs/`.

---

## The re-open trigger

A non-goal is only honest if it says what would make it wrong. **Any one** of the following re-opens
this record; each is written to be *checked*, not argued.

**T1 — a cross-organizational joint decision appears.** A use case in which two or more participants
under **different KINP §3.4 minting authorities** must reach **one** decision that binds all of them,
where all three hold: (i) no single participant can reach it unilaterally; (ii) the outcome is not
reducible to each party applying its own gate; and (iii) each party could refuse, so the outcome is
genuinely contested. *The test:* name the edge and name the decision output. If what is described is
one party invoking and the other admitting or refusing, T1 has **not** fired — that is the status quo
this record measured.

**T2 — a standard appears.** Any standards-body specification — IETF, W3C, OASIS, IEEE, or an ERC
past Stagnant — that specifies deliberation, preference aggregation or dissent primitives **at the
protocol layer**. On T2 the answer is a **profile by reference** (`78-kft-adopt-by-reference`), never
an invention, and the scope question is re-argued against the standard's actual shape rather than
against the taxonomy. *Watch list, as of this record's date:* the IETF 126 agent Birds-of-a-Feather
lineage — **agentproto**, **DAWN**, **DMSC** — and the A2A extension registry, whose four published
extensions the paper found carry no governance content.

**T3 — a koine gate stops being unilateral.** If any fabric gate acquires a case where two
participants must **jointly** decide one outcome — a shared world whose canonical state requires two
authorities to agree, a grant that only a quorum can issue or revoke, a placement neither party can
decide alone — then the premise under §3 of the Decision fails, and with it this record's core reason.
Note that **GOV-1**'s candidate deltas are deliberately *not* this: an expiry, or a withdrawal riding
an in-band control frame, keeps the decision with the issuing host.

**What does NOT re-open it,** stated so the trigger is not diluted:

- The paper being cited, replicated, or joined by another taxonomy naming the same dimensions. A
  restated gap is not a new fact.
- An orchestration framework in the known implementations adding, changing or improving a voting
  strategy. That is intra-organizational by construction (measurement 1) and belongs to that
  component.
- A downstream repo wanting a shared helper for its own deliberation. That is runtime commons work
  under [ADR-0001](ADR-0001-control-plane-topology.md) — koine specifies, the commons implements —
  and needs no koine clause.
- Demand alone. koine has never added a normative surface without a pressure-test scenario; T1
  describes the scenario that would have to exist first.

---

## Consequences

- **The question is closed and citable.** A portfolio scan that raises "koine has no voting" is
  answered by a link rather than by re-deriving the analysis. That is the whole return on this record.
- **KCB takes a patch bump (0.4.4 → 0.4.5) and nothing else in `specs/` moves.** §1.2's closing bullet
  gains a pointer to this record, so a spec reader who asks *"omission or decision?"* is answered
  where the question occurs. No field, clause, manifest byte, schema, registry file or policy file
  changes, and both KCB re-ratification legs are restated unmoved.
- **The map's three Absent rows are now labelled decided, not debt** — and stay Absent. A future
  measurement re-derives the grade; it does not inherit it.
- **A standing review item, but not a pin.** T2 is checked on the cadence
  [`../docs/reference/upstream-standards.md`](../docs/reference/upstream-standards.md) already runs
  for pin drift, without becoming a row in it: there is nothing to pin until something is adopted. A
  BoF is not a standard and a taxonomy is not a specification.
- **Cost accepted, and it is real.** If T1 fires, koine will be *late* — it will design or profile
  under time pressure instead of having a surface ready. That is accepted because the alternative
  cost is worse and less reversible: three invented dimensions that nothing exercises, frozen into an
  agnostic contract, ageing against whatever standard eventually lands, and removable only through a
  full ADR-0009 §7.3 deprecation cycle.
- **The non-goal is bounded.** It covers three named dimensions. It is not a precedent for declining
  governance-adjacent work generally, and §4 of the Decision exists to prevent it being read as one.

---

## Appendix — the prior-art sweep, as observed 2026-08-18

The record that option (b) was tried first. Every row was examined for the same thing: *does it
specify deliberation, preference aggregation, or dissent retention at the protocol layer, such that
koine could profile it by reference?*

| Candidate | What it is | Status as observed | Why it is not something to profile |
|---|---|---|---|
| **FIPA interaction protocols + ACL** — SC00029 / SC00030 Contract Net and Iterated Contract Net, SC00036 Propose, SC00033 Brokering, SC00037 Communicative Act Library, SC00061 ACL Message Structure | The only body of standardized agent-communication interaction protocols | Standard-status set, © 2002, unrevised since | Covers **task allocation and bilateral negotiation** (call for proposals → bid → award), not multilateral deliberation, and has no voting or dissent construct at all. The strongest evidence is independent: ACP inherits this heritage directly — the paper describes it as *"drawing on FIPA-ACL heritage"* with typed performatives (propose, accept, reject, counter) — and is still graded **G2 Partial** (bilateral, not multilateral; no turn-taking governance or synthesis) and **G3 / G4 Absent**. The nearest ancestor does not discharge the requirement. |
| **ERC-5805 — "Voting with delegation"** | The one standardized voting artifact found anywhere | **Stagnant**, created 2022-07-04 | Standardizes vote **weight**: delegation and historical checkpoints so weight can be queried at a timepoint. It explicitly does **not** cover proposal mechanics or vote execution — i.e. everything G3 asks for. Also token-weighted and chain-bound, which is not a shape an agnostic interchange contract can adopt. |
| **ERC-8004 — Trustless Agents** | On-chain identity, reputation and validation registries | Draft (created 2025-08-13, per the paper's reference) | One of the five protocols the paper analyses; graded **G2 / G3 / G4 Absent**, and it scopes itself to *"discover, choose, and interact with agents."* The paper's §V-B adds the structural objection: on-chain latency and cost are incompatible with real-time deliberation even if registries were added. |
| **IETF agent work — the BoFs at IETF 126, Vienna, 18–24 July 2026**: **agentproto** (Thu 23 July, 09:00–11:00 CEST), **DAWN**, **DMSC** | The live standardization activity in this space | WG-forming BoF stage | Scopes are, in the IETF's own listing: *"identify which building blocks of agent-to-agent and agent-to-tool communication genuinely need to be standardized"* (agentproto), decentralized discovery (DAWN), and gateway-mediated collaboration — capability exposure, forwarding, coordination, policy control, observability (DMSC). **None names collective decision-making, voting, deliberation or dissent.** This is the sharpest form of the absence: the bodies actively deciding what to standardize here are not standardizing these three. |
| **A2A extensions** | The extension mechanism the paper calls the *extensible* path | Four published extensions as the paper observed them (Secure Passport, Timestamp, Traceability, Agent Gateway Protocol) | No governance content in any of them. The paper's §V-A makes the point that matters: the gap is extensible *in principle* and **no one has done so** — so there is still nothing to profile. |
| **Argumentation and social-choice literature** — argumentation-based negotiation (Sierra, Jennings, Noriega & Parsons, 2004), constitutional multi-agent governance, conformal social choice for multi-agent deliberation | Research mechanisms, several cited in the paper's related work | Active research | Mechanisms and ontologies, not standards-body specifications: no wire format, no conformance criterion, no version to pin. Profiling one would mean koine picking a research position and normalizing it, which is option (a) wearing a citation. |
| **Habermas; Robert's Rules of Order** | The taxonomy's own sources | — | Organizational and parliamentary theory, not machine protocols. Named here because they are where the six dimensions come from, and because the paper's §V-F flags them as a **Western** framing whose universality it does not claim. |

**Conclusion of the sweep:** for G2 the nearest standard is 24 years old and addresses a different
interaction shape; for G3 the nearest is Stagnant and addresses vote accounting rather than deciding;
for G4 there is nothing at all. Option (b) is unavailable, and that unavailability is itself part of
the justification for the verdict — not a reason to fill the space.

---

## Relationship to the specs

- [`../specs/capability-bus.md`](../specs/capability-bus.md) **§1.2** — the layer claim, the paper's
  scope, and the non-overlap in both directions. That section states the fact; this record states the
  decision, and §1.2 points here. Nothing else in KCB is touched.
- [`../docs/reference/governance-taxonomy-map.md`](../docs/reference/governance-taxonomy-map.md) — the
  dated measurement this record decides on, including the three findings (**GOV-1…GOV-3**) that stay
  open and the Partial grades this record does **not** touch.
- [`ADR-0001-control-plane-topology.md`](ADR-0001-control-plane-topology.md) — *koine specifies, the
  runtime commons implements*, which is why a participant that wants deliberation builds it there.
- [`ADR-0007-self-describing-participant.md`](ADR-0007-self-describing-participant.md) — why G1
  membership is Partial by choice (existence is membership; the registry returns an address, never a
  privilege), and the closest existing precedent for stating a governance-shaped absence as a
  deliberate position.
- [`ADR-0009-capability-versioning-deprecation.md`](ADR-0009-capability-versioning-deprecation.md) —
  the deprecation cost a coined-then-withdrawn surface would incur, which is half the argument against
  option (a).
- [`ADR-0010-kmi-lineage-bridge-not-vocabulary.md`](ADR-0010-kmi-lineage-bridge-not-vocabulary.md) —
  the adopt-or-project discipline applied when prior art **does** exist. This record is the same test
  run on a concern where the sweep comes back empty, and reaching the opposite conclusion for the same
  reason: koine mints a surface only when it can defend one.
