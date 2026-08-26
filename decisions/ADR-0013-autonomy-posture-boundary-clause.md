# ADR-0013 — Autonomy posture is a contract clause, in the boundary half only

**Status:** Accepted (2026-08-26)
**Deciders:** ecosystem owner
**Answers:** the parked question *"should autonomy posture be a koine clause?"* — raised 2026-08-19
against a consumer-side safety-mode vocabulary being built in one of the known implementations, and
deliberately left unscheduled until it could be decided on evidence rather than on one console's
shape.
**Refines:** [`ADR-0011-governance-deliberation-voting-dissent-non-goal.md`](ADR-0011-governance-deliberation-voting-dissent-non-goal.md)
§4 of the Decision, which explicitly declined to decide **G5 human escalation** and recorded that *"a
refusal that needs a person is a real fabric case with exactly one narrow mechanism today."* This
record decides the part of G5 that crosses an ownership boundary, and only that part.
**Applies to:** every role that dispatches or executes work — producer, consumer, host, provider.
Authorities are touched only where they hold a gate.
**Numbering note:** ADR-0002 – ADR-0004 are reserved for the deployment-history records that live
downstream (see [`README.md`](README.md)); this record takes the next free agnostic number.

---

## Context

### The question, and where it came from

A consumer in the known implementations is building a **safety-mode vocabulary** for its default
export console: a declared posture — roughly *ask-for-approval → approve-edits → plan-first →
autonomous* — that its runtime enforces and its run records, gating **spend and irreversibility**
rather than gating every individual action. It is being built locally, in a shape that could become a
contract without being rewritten. Hence the question.

Two answers were available before any analysis, and both are respectable.

**For.** koine exists for exactly this class of problem. Two organizations run products over this
fabric, and the shape of the disagreement is the fabric's own: if a caller under one owner dispatches
work to a callee under another, *"autonomous"* has to mean the same thing on both sides, or the
posture the caller believes it selected is not the posture the callee enforces.

**Against.** One console's vocabulary is not evidence of a shared need, and a clause written before
two independent implementations exist tends to encode the first one's accidents. That is not a
hypothetical failure mode in this repo —
[ADR-0010](ADR-0010-kmi-lineage-bridge-not-vocabulary.md) records what it costs to discover, after
the fact, that a minted vocabulary was standing on occupied ground.

### The concrete case — the edges, named

This is decided against the two edges that actually cross an ownership boundary today, listed in
[`../ECOSYSTEM.md`](../ECOSYSTEM.md) §3 (*Edges that cross an organizational boundary*, informative),
not against a general worry about autonomy:

| Edge | Crosses | What the caller dispatches | Plane |
|---|---|---|---|
| **talos → argos** — Tier-B/C A/V analysis of playtest captures | Overpowered Inc. → Ontolo Labs | a KCB `invoke` after registry lookup, then direct MCP/A2A; findings return as KGP claims | control + knowledge |
| **insimul → lugh** — world-derived corpora for specialized fine-tuning | Overpowered Inc. → Ontolo Labs | a KFT job manifest, containment-gated by data classification | control + fine-tuning profile |

A third boundary is upstream rather than lateral — an authority under a third owner supplies corpora
to both companies — and is a data flow rather than a dispatch, so it exercises license and egress
gating and not posture. It is out of scope here and stays where
[`../ECOSYSTEM.md`](../ECOSYSTEM.md) §3 puts it.

Naming the edges is the whole method of this record. *"Autonomy is dangerous"* is not a koine
argument; *"at this edge, the caller cannot decide from anything in the contract whether the callee's
execution contains an effect the caller cannot undo"* is.

### What "posture" is, stripped of the console

A posture is a standing answer to one question, asked before a dispatch rather than during it:
**which classes of effect may proceed without a person, and which must stop for one.** Everything
else the console ladder carries — how the person is asked, what the approval UI looks like, how many
rungs the ladder has, what each rung is called — is how one organization supervises itself.

That distinction is not this record's invention. It is
[ADR-0011](ADR-0011-governance-deliberation-voting-dissent-non-goal.md)'s boundary sentence applied
to a new concern: ***koine specifies what crosses an organizational boundary, not how one
organization decides.*** Under that sentence the ladder is intra-organizational and the *"which
classes of effect may proceed"* half is not, because at both edges above the effects in question are
produced by the **callee**, under a **different owner**, out of the caller's sight.

---

## Three measurements, all dated 2026-08-26

### 1. The fabric has half the operand a posture needs, and the missing half is the irreversible half

A posture gates **spend and irreversibility**. Measured against the contracts as they stand:

- **Spend is fully expressed and enforced across the boundary.** KCB §5 grants are
  per-capability, per-world and carry a `budget_units` ceiling; path search surfaces projected cost
  before an `invoke`; a re-priced capability fails closed; and since KCB 0.4.7 §4.2e a subscription
  is metered **on delivery** with a brake before the cliff. A caller that wants *"never spend more
  than X unattended"* already has a contract-level way to say so, and the callee already enforces it
  unilaterally.
- **Irreversibility is expressed nowhere.** A sweep of all six specs on this date finds **no
  clause, field, or enum anywhere in the fabric that says what an invocation will do that cannot be
  undone.** There is no effect class, no read-only marker, no destructive marker, no
  externally-visible-effect marker on a KCB capability or on any of its ports. `describe` and
  `fetch` are read-only by their own definitions; `invoke` is not characterized at all. The nearest
  neighbours are about *redelivery* (KCB §4, KGP §6, KFT §6 — content-addressed, so redelivery is
  idempotent) and they are a statement about the **stream**, not about the world the callee touches.

So the caller at `talos → argos` selects a posture and then dispatches into a contract that cannot
tell it whether the dispatch is a read or a write. Whatever the posture said, the dispatch was not
decided against it. **The posture is not weak at the boundary; it is inapplicable.**

This is the sharpest form of the case *for* a clause, and it is measurable rather than argued: the
gap is not that the two organizations disagree about what *"autonomous"* means, it is that neither
of them can compute the answer for a given call from anything either one publishes.

### 2. Advisory does not survive an ownership boundary — and the prior art says so out loud

The tasklist's third acceptance condition states the constraint: *a posture that is only advisory
across the ownership line provides no guarantee to either side.* The sweep in the appendix confirms
it from the outside, and the confirmation is unusually direct: the closest existing thing to an
effect class in this space is a set of **hints**, and the specification that defines them says in
terms that a client must not rely on them for security decisions, because they arrive from a party
the client does not control.

That is the correct disposition for a hint, and it is why koine cannot simply adopt one. It also
fixes what a koine clause has to be made of. There are exactly two mechanisms in this fabric that
bind across an ownership boundary:

- **the callee's own unilateral gates** — KGP §7 license and egress, KCB §5 grant and ceiling, KFT
  §4 admission and §8.1 graded refusal — each of which is one participant deciding for itself, with
  refusal always available; and
- **the credential the caller presents** — a KCB §5 grant, which the caller can issue *narrower*
  than its own authority.

Anything else a caller sends is a request the callee may honour or ignore. Therefore a posture
clause that means anything must be expressed as **a narrowing of those two**, and never as a mode
flag the callee is trusted to interpret faithfully. A posture that the callee must be trusted to
honour is a posture the caller already trusted the callee for, in which case the clause bought
nothing.

### 3. There is a shape to adopt for the ladder, and nothing to adopt for the guarantee

`78-kft-adopt-by-reference` and its neighbours fixed the rule: where a standard covers a concern,
koine adopts it by reference and mints nothing. Applied here the sweep splits cleanly, and the split
is the reason this record's answer is *"yes, narrowly"* rather than either *"yes"* or *"no"*:

- **For the ladder** there is real prior art and a real method — a guarantee-defined level scale in
  which each level is named by *what it no longer requires of a person*, not by what a product's
  buttons are called. It is domain-bound (vehicles) and not adoptable as a wire contract, but it is
  citable as **method**, and it is what makes the console's four rungs a *projection* rather than a
  vocabulary.
- **For the guarantee** — a declared, machine-checkable statement of *"this call may/may not proceed
  without a person, and here is the class of effect that decision turns on"*, verifiable across an
  ownership boundary — there is **nothing at the protocol layer to profile.** The candidates are
  hints (advisory by their own text), mechanisms for pausing a task (a transport for an approval,
  not a statement of when one is required), and regulatory frameworks that oblige a deployer without
  giving a caller anything to check.

So this is not *adopt or invent*. It is **adopt the method, mint the minimum, and refuse the
vocabulary** — which is the same disposition [ADR-0010](ADR-0010-kmi-lineage-bridge-not-vocabulary.md)
reached for lineage, arrived at from the opposite direction.

---

## Options considered

### Option (a) — Decline: posture is not a koine concern

State it as a non-goal, as [ADR-0011](ADR-0011-governance-deliberation-voting-dissent-non-goal.md)
did for deliberation, voting and dissent, and let each participant supervise itself.

**Against.** The premise that carried ADR-0011 **fails here, and fails on measurement**. There, the
concern never reached the wire: no cross-organizational edge required a joint decision, and every
decision the fabric specified was already unilateral and already expressible. Here the concern
reaches the wire at two named edges, and the thing the caller needs is *not* expressible — there is
no effect class anywhere (measurement 1). Declining would leave a caller's declared posture silently
inapplicable at exactly the edges the fabric exists to serve, which is the failure mode ADR-0011 §4
warned against when it refused to let *"governance is not koine's axis"* be cited against G5.

*Rejected — and the asymmetry with ADR-0011 is deliberate, not an inconsistency.*

### Option (b) — Profile an existing standard

The move koine prefers, and made for OTIO, Croissant, ModelPack and the published-lineage
convention.

**Against.** Unavailable for the guarantee, on the facts of the appendix, not on preference. It *is*
taken for the method: the level-scale discipline in the Decision below is borrowed, and cited as
prior art rather than pinned, because a method is not a specification. **This is what trigger W2
watches.**

*Partly taken; unavailable where it would have decided the question.*

### Option (c) — Adopt the console's ladder as the fabric vocabulary

Take the four rungs as they are — *ask-for-approval / approve-edits / plan-first / autonomous* — and
make them normative.

**Against.**
- **They are named for a supervision experience, not for a guarantee.** *"approve-edits"* names a
  category of thing a person clicks; a callee under another owner has no edits, no editor and no
  person in the caller's org to ask. Two of the four rungs do not survive translation to a headless
  provider at all.
- **It is one implementation's shape, promoted before a second one exists.** That is precisely the
  prematurity objection, and it applies to *this option specifically* rather than to the question.
- **It would freeze a UI taxonomy into an agnostic contract**, which is the objection
  ADR-0011 raised against encoding six borrowed governance dimensions, at the same cost and with
  less external authority behind it.

*Rejected.*

### Option (d) — Narrow the grant, and mint no posture surface at all

Since the only cross-boundary enforcement is the callee's gates plus the presented credential
(measurement 2), tell callers to encode posture entirely as a narrower KCB §5 grant and stop there.

**For, and it is strong.** It mints nothing, it composes with the existing gate, it is monotone by
construction, and it is how capability-based systems have always expressed *"act, but only this
far."*

**Against.** **A grant bounds spend and scope; it cannot bound irreversibility, because nothing
names irreversibility** (measurement 1). A grant of `invoke:compose` with a budget authorizes a
cheap irreversible publication exactly as readily as a cheap reversible analysis. So option (d) is
not a smaller version of the answer — it is the answer with its load-bearing half missing. It does,
however, fix the *form* the answer takes, and that is carried into option (e): what is minted is the
missing operand, and the enforcement stays on the gate that already exists.

*Rejected as sufficient; adopted as the mechanism.*

### Option (e) — Mint the boundary half: a guarantee-defined posture over a declared effect class, monotone-restrictive

Say exactly three things at the contract layer — what class of effect a capability produces, what a
posture guarantees in terms of those classes, and whose posture governs when the two sides disagree
— and say nothing about how a person is asked, who the person is, or how the answer returns.

**For.** It closes the measured gap and nothing more; it is derived from koine's own gates plus one
absence rather than from any console; every rung a console has is expressible as a projection onto
it; and it is **monotone-restrictive**, so it cannot become an escalation-of-privilege surface (see
Decision §3), which is what makes it safe to add before a second implementation exists.

*Decided.*

---

## Decision

**Autonomy posture IS a koine clause — the boundary half of it, and not the console's ladder.** Six
verdicts, each binding.

1. **The concern is in scope.** A posture that governs a dispatch across an ownership boundary is
   interchange, and it belongs in the contracts. This resolves the part of **G5 human escalation**
   that [ADR-0011](ADR-0011-governance-deliberation-voting-dissent-non-goal.md) §4 left undecided;
   the rest of G5 — who the human authority is, how the decision returns, and when a person *may*
   rather than *must* be involved inside one organization — stays out of scope by that record's
   boundary sentence.

2. **Postures are named by what they GUARANTEE, never by what a console calls its buttons.** The
   fabric's vocabulary is defined over **classes of effect that may proceed unattended**. A product
   ladder is a **projection** onto that vocabulary — declared by the product, mapped by the product,
   lossy edges named — in the same relationship KMI's lineage relations have to C2PA and OMC
   ([ADR-0010](ADR-0010-kmi-lineage-bridge-not-vocabulary.md)) and a KFT job has to a trainer's
   native config. koine adopts no rung names.

3. **A declared posture is monotone-restrictive. It never grants autonomy; it only removes it.**
   This is the load-bearing clause and it is what makes the surface safe:
   - the **caller's** posture bounds what the caller will dispatch;
   - the **callee's** posture bounds what the callee will execute;
   - **the effective posture is the intersection — the more restrictive of the two governs**, and
     each side enforces its own half against its own gates;
   - **no posture field presented by a peer can widen any gate.** A caller cannot raise a callee's
     autonomy by asserting a posture, and a callee cannot lower a caller's by publishing one.
     Refusal remains available to both, unconditionally.

   Two consequences follow immediately. First, *"which wins"* has an answer that needs no arbitration
   and no trust: **the restriction wins, always**, because neither side is being asked to honour the
   other's declaration — each is being told something that can only cause it to do less. Second,
   because both sides still decide alone, **[ADR-0011](ADR-0011-governance-deliberation-voting-dissent-non-goal.md)'s
   trigger T3 does not fire**: no gate in this fabric becomes joint, and the unilateral premise that
   record rests on is preserved intact. That is a deliberate design constraint on this clause, not an
   observation about it.

4. **The missing operand is minted, and it is the effect class — not a mode flag.** A capability port
   gains a declared class of effect: what the invocation does that the caller cannot undo, and
   whether the effect is confined to the callee's authority domain or is externally visible once
   made. It is a property of the **capability**, published by the participant that implements it
   ([ADR-0007](ADR-0007-self-describing-participant.md) — participants are self-describing), and it
   is the operand every posture decision reads. Absence reads as **unknown**, never as *harmless* —
   the same fail-safe direction KCB §4.2a took for `volume`, and for the same reason: a default that
   reads as benign converts a missing declaration into a silent grant.

5. **The floor is stated in terms of gates that already exist, and no posture may skip it.** The
   only part of a posture a caller can rely on when the callee is another organization is the part
   the callee enforces unilaterally, so the floor is written there:
   - **No posture relaxes a mandatory gate.** KGP §7 license and egress, KCB §5 grant and spend
     ceiling, KFT §4 admission and §8.1 graded refusal fire identically at every posture. The most
     autonomous posture in the vocabulary is *not* a licence to omit them, and a participant that
     omits one is non-conformant regardless of what posture either side declared.
   - **An effect the caller's posture does not admit is a REFUSAL, never a silent proceed** — and
     never a silent substitution of a lesser effect either, which is the disposition KFT §3.3
     already fixed for an unexpressible adaptation axis.
   - **An undeclared effect class is treated as not admitted** at any posture that gates on class
     (verdict 4).
   - **Refusal is always available to both sides**, and stating a posture never removes it.

   The floor is the whole guarantee. Everything above it is negotiable per deployment; the floor is
   not, and it is what a caller may assume of a conformant callee it has never met.

6. **No new plane, no new verb, no new authority.** The clause lands on surfaces that exist: the
   effect class is a port declaration in the KCB §2 manifest carried on the AgentCard extension; the
   caller's posture is an **operand** on the existing verbs, in the shape KCB §4.2 established for
   `subscribe`'s flow-control operands; the refusal path is KFT §8.1's graded refusal, reused rather
   than re-minted. **It is expressible by an implementation that has no console at all** — a headless
   provider declares its effect classes and enforces a fixed posture with no human anywhere in it,
   and is fully conformant. That is a conformance requirement on the clause, not an aspiration for
   it.

**What this record does NOT decide,** stated so the scope cannot drift:

- **Not the approval mechanism.** How a person is asked, in what interface, with what timeout, and
  how the answer returns are the implementer's ([ADR-0001](ADR-0001-control-plane-topology.md)).
  koine fixes when a stop is **required**, not how it is served.
- **Not who the human authority is.** Naming it would put one organization's org chart in an
  agnostic contract.
- **Not intra-organizational supervision.** A host supervising agents it assembled itself is
  ADR-0011's *"how one organization decides"*, unchanged.
- **Not a decision record.** Whether a fired gate must leave a trace is **GOV-2**, open, on koine's
  own axis, and decided elsewhere. This record notes only that a posture whose stops leave no
  evidence is unauditable across a boundary, and that GOV-2 is therefore this clause's natural
  companion rather than part of it.

---

## The prematurity objection, answered rather than dismissed

The question was parked on a specific condition: *do not start until the console has shipped and a
**second** consumer wants the same vocabulary.* That condition was right, and it is **kept** — but it
is a gate on **ratification**, not on the decision, and the difference is the point.

- **What the condition protects against is encoding one implementation's accidents.** This record
  is structurally immune to that, and the immunity is checkable by anyone: **nothing in the Decision
  is derived from the console.** Verdict 4 comes from a measured absence in koine's own specs
  (measurement 1); verdict 3 comes from koine's own unilateral-gate property (measurement 2 and
  ADR-0011); verdict 5 is a restatement of gates that already exist in KGP, KCB and KFT. The
  console's four rungs appear in this record exactly once — in option (c), where they are
  **rejected**.
- **The condition is retained where it bites.** The clause this record authorizes enters at
  `draft`/`candidate` and **cannot be ratified** until both of the repo's normal conditions are met
  — the pressure-test scenario walks it, per [the ratification
  gate](../specs/README.md#the-ratification-gate), *and* a **second independent implementation** has
  exercised it. The second-implementation requirement is recorded here as part of the decision so it
  survives the tasklist that raised it.
- **Deciding now has a cost that not deciding does not.** A parked question with no closing
  condition is a backlog entry that gets re-derived at every portfolio scan — the exact cost
  ADR-0011 was written to stop paying. This record closes it either way: the answer is citable, and
  the withdrawal condition below is checkable.

---

## The withdrawal trigger

A *"yes"* is only honest if it says what would make it wrong. **Any one** of the following withdraws
this record and returns the concern to the implementers; each is written to be checked, not argued.

**W1 — the effect class turns out not to be decidable by the party that must declare it.** If, on the
pressure-test scenario, a callee cannot classify its own effects without knowing the caller's
context — i.e. the same invocation is reversible for one caller and not for another — then verdict 4
is minting an operand nobody can fill, and the clause reduces to option (d) plus a hint. *The test:*
name the capability and the two callers for which the class differs.

**W2 — a standard appears.** Any standards-body specification that defines, at the protocol layer, a
machine-checkable statement of which effects may proceed without human authorization, verifiable by
a party that does not control the declarant. On W2 the answer is a **profile by reference**
(`78-kft-adopt-by-reference`), never a retained coinage, and this record's minted operand is
re-argued against that standard's actual shape. *Watch list, as of this record's date:* the agent
protocol standardization lineage tracked by
[ADR-0011](ADR-0011-governance-deliberation-voting-dissent-non-goal.md)'s T2, and any promotion of
the existing advisory hints from *hint* to *contract*.

**W3 — the second implementation contradicts the vocabulary.** If, when the second consumer arrives,
its postures cannot be expressed as a projection onto the effect classes without adding a class per
implementation, then the vocabulary is a UI taxonomy after all and verdict 2 has failed on its own
terms. *The test:* the projection table, with its lossy edges named — the same criterion
[ADR-0010](ADR-0010-kmi-lineage-bridge-not-vocabulary.md) §3.4 uses, which is *complete or reported*,
never *lossless*.

**What does NOT withdraw it,** stated so the trigger is not diluted:

- A console changing, adding or renaming its rungs. Verdict 2 makes rung names a projection
  precisely so this is a downstream edit and not a spec change.
- A participant declining to declare an effect class. Verdict 4's fail-safe default already covers
  it: undeclared reads as unknown, and unknown is not admitted where class is gated.
- Demand for a richer posture ladder. koine has never widened a normative surface without a
  pressure-test scenario, and W3 describes the evidence that would have to exist first.
- An intra-organizational supervision feature of any kind. Out of scope by verdict 1 and by
  ADR-0011's boundary sentence.

---

## Consequences

- **The parked question is closed and citable.** A portfolio scan that raises *"should posture be a
  contract?"* is answered by a link, and the tasklist that raised it is retired against this record.
- **A normative surface is authorized, and it is small.** One port declaration (effect class), one
  verb operand (declared posture), one conflict rule (intersection), one floor. It adds no plane, no
  verb, no artifact kind, no media type and no authority role. Specifying it — the vocabulary, the
  floor, the cross-org disagreement scenario, and the no-console conformance requirement — is the
  work this record authorizes and does not itself perform.
- **It arrives as `candidate`, gated twice.** The pressure-test scenario per [the ratification
  gate](../specs/README.md#the-ratification-gate), **and** the retained second-implementation
  condition. Both are stated above as part of the decision.
- **ADR-0011 is refined, not contradicted.** Its three non-goals stand, its boundary sentence is the
  instrument used here, and its unilateral-gate premise is preserved by verdict 3 — T3 does not fire.
  What changes is that **G5's boundary half moves from *undecided* to *decided in scope*;** G5's
  intra-organizational half stays out, and the map's Partial grade is re-derived by a future
  measurement rather than edited here.
- **GOV-2 becomes more valuable, and is still not part of this.** A stop that fires and leaves no
  trace is a stop the other organization cannot verify after the fact. This record deliberately does
  not resolve that — it names the adjacency so the two are not solved twice or, worse, half each.
- **A prior-art citation, not a pin.** The level-scale method borrowed in verdict 2 is cited as prior
  art in the appendix and does **not** become a row in
  [`../docs/reference/upstream-standards.md`](../docs/reference/upstream-standards.md): no clause
  delegates to it, and a method is not a specification. This is KCB §1.2's reasoning, unchanged. The
  advisory-hint row in the appendix carries a **verification item** rather than a citation — its
  status under the fabric's currently pinned upstream revisions must be confirmed before any
  normative clause names it, and **no verdict here depends on it**.
- **Cost accepted, and it is real.** koine mints an operand that no standard yet blesses, one
  implementation ahead of the second. If W2 fires, the operand must be reconciled with a real
  standard under [ADR-0009](ADR-0009-capability-versioning-deprecation.md) §7.3's deprecation policy.
  That cost is accepted because the alternative is a caller's posture being silently inapplicable at
  every cross-owner dispatch, which is not a smaller cost — it is an unmeasured one.
- **No spec version moves in this record.** It authorizes a clause; it does not write one. No field,
  clause, manifest byte, schema, registry file or policy file changes here, and no re-ratification
  leg anywhere in `specs/` is added or moved.

---

## Amendment log

- **2026-08-26 — the clause is written.** This record authorized a normative surface and did not
  perform it; that work has now landed as **KCB §4.3** ([`../specs/capability-bus.md`](../specs/capability-bus.md),
  0.4.8, patch), pressure-tested first by
  [`../scenarios/kcb-cross-owner-posture.md`](../scenarios/kcb-cross-owner-posture.md) (deltas
  **AP-1…AP-8**, blocking **AP-5**). Every verdict above survived the leg **except by addition**: the
  leg confirmed verdicts 1–4 and 6 as written, and found one hole none of them covered — a posture
  computed **pairwise** evaporates at the second hop, so a truthfully-declared read-only capability can
  re-dispatch to a third owner and make the caller's data permanent (**AP-5**). §4.3e closes it with a
  chain rule modelled on §5's spend ceiling: a declared class covers the **leg** rather than the
  callee's own code, and a re-dispatch may narrow but never widen the posture it was invoked under.
  Verdict 5's floor is §4.3d verbatim in substance; verdict 3's intersection is §4.3c, and **T3 still
  does not fire**. **W1 did not fire:** every capability in the leg was classifiable by its
  implementer without knowing the caller's context. **The retained
  second-independent-implementation condition (W3) is unchanged** and is now recorded as a
  ratification gate on §4.3 in the spec itself, alongside the re-run of the leg — which is KCB's
  **fifth** re-ratification count.

---

## Appendix — the prior-art sweep, as observed 2026-08-26

The record that option (b) was tried first. Every row was examined for the same thing: *does it
specify, at the protocol layer, a machine-checkable statement of which effects may proceed without
human authorization — such that a party who does not control the declarant can rely on it, and koine
could profile it by reference?*

| Candidate | What it is | Why it is not something to profile for the guarantee |
|---|---|---|
| **Tool-annotation hints on the control-plane transport** — the advisory read-only / destructive / idempotent / open-world markers a tool may carry | The closest existing thing to an effect class, and the reason this row is first | **Advisory by their own text.** They are *hints*, supplied by the party being described, and the defining specification tells clients not to rely on them for security decisions because they come from a party the client does not control. That is correct for a hint and fatal for a cross-owner guarantee — it is measurement 2, stated by the prior art itself. Useful as **shape** for verdict 4's declaration and unusable as the guarantee. **Verification item:** their exact status under the revisions this fabric currently pins ([`../docs/reference/upstream-standards.md`](../docs/reference/upstream-standards.md)) must be confirmed before any normative clause names them; nothing in the Decision depends on the outcome. |
| **Task-pause / input-required states on the agent-to-agent transport** | A task may suspend and signal that further input or authorization is needed | A **transport for an approval**, not a statement of when one is required. It answers *how the stop is served*, which verdict 6 explicitly leaves to the implementer, and says nothing about which effects require a stop. Complementary; not the missing piece. |
| **Server-initiated request-for-user-input mechanisms** | A callee asks the caller's runtime to obtain something from its user mid-request | Routes callee → caller's person, which is a real and useful direction — but it is a **request the caller may decline**, with no declared class of effect behind it and no guarantee in either direction. Same disposition as the row above. |
| **Capability-based authorization — scoped credentials** (the OAuth-style scope discipline, and this fabric's own KCB §5 grant) | The structural precedent for *"act, but only this far"* across a trust boundary: narrow the credential rather than trust the peer's mode flag | **Adopted as the mechanism, and it is already here.** This is option (d): it is right about form and short by exactly one operand, because a scope bounds *what* and *how much* and cannot bound *how permanent*. It is why verdict 4 mints an effect class instead of a mode flag. |
| **SAE J3016 driving-automation levels (0–5)** | The canonical guarantee-defined autonomy ladder: each level is defined by what it no longer requires of the human, not by what the vehicle can do | **Method, adopted; specification, not adoptable.** It is domain-bound to vehicles, has no wire format, no participant roles and no conformance surface an interchange contract could use. What is borrowed is the discipline in verdict 2 — *name the level by the guarantee, never by the feature* — and it is cited as prior art, not pinned. |
| **Human-oversight obligations in AI regulation and risk-management frameworks** — the deployer-side oversight duties and the govern/map/measure/manage framings | The reason many organizations have a posture at all | They **oblige a deployer**; they give a *caller* nothing to check. They are organizational controls with no identifier, no declaration, no wire representation and no conformance criterion, so there is nothing a callee could publish and nothing a caller could verify. They also bind by jurisdiction, which an agnostic contract cannot assume. Motivation, not prior art. |
| **AI/ML management-system and engineering-ethics standards** (management-system certification, value-based design process standards) | Process and management standards in the adjacent space | Certify **how an organization runs**, not what one system tells another on the wire. No protocol surface at all — the same disqualification ADR-0011 recorded for parliamentary and organizational theory. |
| **Vendor autonomy-level scales published by model and agent providers** | Marketing-adjacent ladders that resemble the console's | Not standards-body work, not versioned as specifications, not cross-vendor, and each named for its own product's supervision experience — which is exactly the defect option (c) was rejected for. Named here so the sweep cannot be accused of missing them. |

**Conclusion of the sweep.** For the **ladder** there is a good method and it is borrowed. For the
**declaration** there is a good shape and it is borrowed. For the **guarantee** — the part that has
to survive an ownership boundary — the field contains advisory hints, approval transports and
organizational obligations, and no specification. Option (b) is therefore partly taken and
unavailable where it would have decided the question, which is why this record mints one operand and
refuses a vocabulary.

---

## Relationship to the specs

- [`../specs/capability-bus.md`](../specs/capability-bus.md) — where the clause lands: **§2** manifest
  ports for the effect-class declaration, **§4** verbs for the posture operand (in **§4.2**'s
  established operand shape), **§5** for the gate that enforces it and the grant that carries the
  caller's narrowing. Nothing in KCB is touched by *this* record.
- [`../specs/fine-tuning.md`](../specs/fine-tuning.md) — **§8.1**'s graded refusal is the refusal
  path verdict 6 reuses, and **§4**'s admission is one of the mandatory gates verdict 5's floor
  names. The `insimul → lugh` edge is a KFT job, so KFT is the second edge's surface.
- [`../specs/grounding-pack.md`](../specs/grounding-pack.md) — **§7** license and egress: the gate
  that already carries the *"may this leave"* half of a posture correctly, and the model for how the
  floor is written.
- [`../specs/conformance-scenario.md`](../specs/conformance-scenario.md) — how the cross-org
  disagreement is pressure-tested; the scenario that gates ratification is a KCS-driven one.
- [`ADR-0011-governance-deliberation-voting-dissent-non-goal.md`](ADR-0011-governance-deliberation-voting-dissent-non-goal.md)
  — the boundary sentence this record applies, the G5 carve-out it acts on, and the unilateral-gate
  premise verdict 3 is constrained to preserve.
- [`ADR-0007-self-describing-participant.md`](ADR-0007-self-describing-participant.md) — why the
  effect class is published by the participant that implements the capability, and never held in a
  registry or a central policy file.
- [`ADR-0001-control-plane-topology.md`](ADR-0001-control-plane-topology.md) — *koine specifies, the
  runtime commons implements*, which is why the approval mechanism is out of scope.
- [`ADR-0010-kmi-lineage-bridge-not-vocabulary.md`](ADR-0010-kmi-lineage-bridge-not-vocabulary.md) —
  the adopt-or-project discipline verdict 2 reuses, and the round-trip criterion W3 is tested by.
- [`ADR-0009-capability-versioning-deprecation.md`](ADR-0009-capability-versioning-deprecation.md) —
  the deprecation cost accepted if W2 fires.
- [`../docs/reference/governance-taxonomy-map.md`](../docs/reference/governance-taxonomy-map.md) —
  the dated measurement of **G5 Partial (narrow)** this record acts on, and **GOV-2**, which stays
  open and is named as this clause's companion.
