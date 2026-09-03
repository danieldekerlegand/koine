# Scenario: a caller's autonomy posture crosses an ownership boundary (KCB pressure leg)

**Purpose:** pressure-test the clause
[ADR-0013](../decisions/ADR-0013-autonomy-posture-boundary-clause.md) authorizes and does not write
— *autonomy posture as interchange, in the boundary half only* — against
[`../specs/capability-bus.md`](../specs/capability-bus.md) (KCB 0.4.7, *Candidate*) as it stands.

ADR-0013 answers *"should posture be a koine clause?"* **yes**, on two measurements: that the fabric
expresses **spend** (KCB §5) and names **irreversibility** nowhere, and that only the callee's
unilateral gates plus the caller's narrowed grant bind across an ownership line. Both are grep-level
facts about the repo. Neither is a scenario. This leg supplies the scenario, and it is deliberately
adversarial about the ADR's own design rather than about the question it settled: the ADR is taken as
the brief, and every verdict in it is treated as a **hypothesis to break**.

The subject is the pair of edges [`../ECOSYSTEM.md`](../ECOSYSTEM.md) §3 records as crossing an
organizational boundary — a QA/tooling caller dispatching A/V analysis to a media participant under a
different owner, and a world producer offering world-derived corpora to a specialized trainer under a
different owner. Both are ordinary fabric traffic; the contracts do not distinguish them, and this leg
is about what that costs when the caller has a posture and the callee has never heard of it.

Focused follow-up to [`kcb-subscription-firehose.md`](kcb-subscription-firehose.md) (which found the
in-band control channel this leg reuses rather than re-mints) and
[`e2e-multi-authority.md`](e2e-multi-authority.md) (which established that two authority domains
compose without a privileged holder — the topology this leg's disagreement runs inside). Same method as
every pass in this directory: each step is marked ✅ *held* or 🔴/🟡 *broke*, **Findings** collects the
deltas, and the bias is to find the break rather than walk the happy path. **Only what this leg forces
is carried into a fold.**

---

## Setup

All names are the KINP §3.4 placeholder namespaces
([`../specs/identity.md`](../specs/identity.md)), not deployment names or endpoints. What matters is
the **owner** column: the leg is uninteresting inside one organization, and every finding below turns
on a line being crossed.

| Role | Participant | Owner | In this leg |
|---|---|---|---|
| **World producer / tooling consumer** | `worldsim` | **Owner A** | the **caller** — captures playtest runs, dispatches analysis, and offers world-derived corpora for training |
| **Media producer / knowledge producer** | `analyzer` | **Owner B** | the **callee** on edge 1 — runs Tier-B/C A/V analysis and emits findings as KGP claims |
| **Capability provider (specialized trainer)** | `provider:agent:trainer-local` | **Owner B** | the callee on edge 2 — the containment-bound `finetune` provider |
| **Capability provider (paid model)** | `provider:agent:vision-model` | **Owner C** | `analyzer`'s own upstream — a party the caller has **no relationship with at all** |
| **Media producer (CAS)** | `mediastore` | **Owner B** | holds the bytes the analysis reads and writes (delta G/L, KMI §7.1) |
| **Control-plane host** | `orchestrator` | shared / neutral | provisions the registry (§3), issues grants (§5); **off the dispatch path** by ADR-0001 |

**The caller's posture, in its own words.** `worldsim` runs unattended overnight against a build
queue. Its operator's rule is not *"spend at most N"* — §5 already expresses that, and the grant it
holds carries `budget_units: 25000`. Its rule is:

> *Analysis may run unattended. Nothing that a person cannot undo tomorrow morning may run unattended,
> and nothing may leave Owner A's evidence trail without a person, whatever it costs.*

That is one sentence, it is entirely ordinary, and this leg is the record of trying to say it on the
wire.

`analyzer`'s card, abridged to what this leg reads:

```jsonc
// analyzer's /.well-known/agent-card.json → capabilities.extensions[uri=…/kcb/manifest/0.3].params
{
  "kcb_version": "0.4.7",
  "capabilities": [
    { "name": "analyze-capture", "version": "2.1.0",
      "inputs":  [ { "plane": "media",     "media_types": ["video/mp4"], "schema_id": "sha256-11c0…" } ],
      "outputs": [ { "plane": "knowledge", "dialect": "grounding-only",  "schema_id": "sha256-77aa…" } ],
      "cost":    { "tier": "paid", "est_units": 400 } },
    { "name": "publish-findings", "version": "1.0.0",
      "inputs":  [ { "plane": "knowledge", "dialect": "grounding-only",  "schema_id": "sha256-77aa…" } ],
      "outputs": [ { "plane": "knowledge", "dialect": "grounding-only",  "schema_id": "sha256-77aa…" } ],
      "cost":    { "tier": "free" } }
  ],
  "auth": { "scheme": "capability-token",
            "grants_required": ["invoke:analyze-capture", "invoke:publish-findings"] }
}
```

Nothing in that card is malformed, and nothing in it is unusual. Read it as a caller with the rule
above and the leg has already started.

---

## Step 1 — The caller cannot ask the question

`worldsim` discovers over §3 (`find(plane: media, media_types: video/mp4)`), gets `analyzer`'s two
capabilities back, and now has to decide which of them may run while nobody is watching.

Every field a capability or a port may carry, exhaustively, at 0.4.7:

| Field | §  | What it says | Does it bound *irreversibility*? |
|---|---|---|---|
| `name` + `version` | §7.1 | which capability, at which semver | No |
| `schema_id` | §7.1 | a digest over the port's **shape** | No — shape, and §7.1 excludes `cost` and `description` from it by design |
| `cost` | §2.1 | `tier` + `est_units`, priced per invoke | **Spend only.** The one quantity the bus gates before an invoke |
| `volume` | §4.2a | the delivery envelope of a **stream** | No — rate and size, and only on a subscription |
| `world_pattern` / `worlds` | §2.1 | which world the payload is scoped to | No |
| `dialect`, `media_types`, `types`, `shape` | §2.1 | the type vocabulary of the payload | No |
| `auth.grants_required` | §2/§5 | which grant the caller must hold | **Whether**, never **how permanent** |

🔴 **BROKE (AP-1, high — structural).** `analyze-capture` reads bytes and returns claims;
`publish-findings` writes into a shared knowledge surface that replicates out of Owner B's domain and
has no inverse on this bus. They are **the same shape on every field the manifest, the registry and
the path planner can see** — two knowledge ports, a `schema_id` apiece, one paid and one free. The
cheaper one is the one that cannot be undone, so the single pre-flight quantity the bus does compute
(projected `cost`, delta K) does not merely fail to help: **it ranks the irreversible capability
first.**

This is ADR-0013's measurement 1 arriving as a concrete break rather than as a grep. The caller's rule
has two halves; §5 expresses the half about money exactly, and there is no field anywhere in KCB, KGP,
KMI, KFT or KINP against which the other half can even be **stated**, let alone enforced. A posture
across this boundary is not weak. It is **inapplicable** — there is nothing for it to read.

*Not a `schema_id` problem, and registering the shape would not touch it.* **V-2** of
[`e2e-live-schema-mutation.md`](e2e-live-schema-mutation.md) found that a knowledge port's `shape` is
an unregistered free-form name; fixing that makes the two digests above diverge if and only if the
**payloads** differ, and here they do not. Effect is not shape, exactly as volume is not shape
(**BP-1**), and no digest over a shape can carry either.

---

## Step 2 — So the caller sends a mode flag, and it buys nothing

The obvious repair, and the one a console reaches for first: `worldsim` attaches its declared posture
to the invocation as the runtime already names it internally — `"posture": "approve-edits"`, the third
rung of its four-rung ladder.

Three things go wrong, and they are independent.

**The rung has no referent.** `analyzer` is under a different owner, with a different runtime, and its
own supervision model has three states, not four. `approve-edits` names a **button in a console the
callee does not run**. There is no mapping, no registry of rung names, and nothing to appeal to: the
string is uninterpretable at the far end, and the honest thing for the callee to do with it is ignore
it. 🔴 **BROKE (AP-2, high).**

**A flag the callee is trusted to honour is not a guarantee.** Even granting a shared vocabulary, what
does the caller now hold? A hope. The callee reads the flag, or does not; nothing checks. This is
precisely the disposition ADR-0013's appendix records for the advisory tool-annotation hints on the
control-plane transport — *supplied by the party being described, and the defining specification tells
clients not to rely on them for security decisions* — reproduced by koine, one layer up, with the same
defect. A cross-owner guarantee cannot be a field the beneficiary does not control.

**The direction is backwards.** The flag as sent asks the callee to *do less than it otherwise would*.
But the callee's behaviour is already bounded by its own gates, and the caller's exposure is bounded by
what the caller **dispatches** and what its grant permits. The one party who can act on the caller's
rule with no trust required is **the caller**, and the mode flag routes the decision away from it.

🟡 **Held, in a way worth recording.** The mode flag is not merely inadequate; it is inadequate in a
way that **names the fix**. What the caller needs is not to instruct the callee — it is to *read
something declared by the callee* and then decline to dispatch. That is option (d) of the ADR (narrow
the credential) plus exactly one operand, which is the shape the fold takes.

---

## Step 3 — The disagreement, and which one wins

This is the step the leg exists for. Give both sides a posture and set them against each other.

- **The caller** (`worldsim`, Owner A) will let run unattended: effects that change nothing outside the
  callee's own transient run, and effects confined to the callee's domain that the callee can undo.
- **The callee** (`analyzer`, Owner B) will execute unattended: everything except a capability that
  incurs a per-call charge against its own upstream — *its* rule is about money, and it is stricter
  than the caller's on exactly that axis and looser on every other.

`worldsim` invokes `publish-findings` (free, irreversible, externally visible). Four candidate rules
were tested against it, and three fail on their own terms:

| Rule | What happens on this invoke | Why it fails |
|---|---|---|
| **The caller's posture governs** | The callee is instructed to refuse. | Requires the callee to honour a peer's flag — Step 2, unchanged. And it lets a caller *widen* a callee: the same rule that can restrict can relax. |
| **The callee's posture governs** | The publish proceeds; it is free, so the callee's rule is silent on it. | The caller's rule is discarded at the boundary — the exact failure ADR-0013 was asked to prevent. |
| **The host arbitrates** | `orchestrator` decides. | It is not on the path (ADR-0001, §3), it has no jurisdiction over Owner B, and under §3.1 federation there may be no single host over both ends at all. This is **BP-5** repeating, and it fails for the same structural reason. |
| **The intersection governs** | The publish is **refused by the caller, before dispatch**; the paid analysis is refused by the **callee**, on its own gate. | Nothing to fail. Neither side honours the other's declaration; each reads the other's and does **less**. |

✅ **HELD — and it is the load-bearing verdict.** The intersection rule survives because it asks
nothing of trust: a posture is **monotone-restrictive**, so a declaration a peer presents can only ever
cause the reader to withhold, never to proceed. *Which one wins* therefore has an answer that needs no
arbitration, no shared authority and no honest peer: **the restriction wins, always.** Both refusals in
the last row are unilateral, which is why
[ADR-0011](../decisions/ADR-0011-governance-deliberation-voting-dissent-non-goal.md)'s trigger **T3
does not fire** — no gate in the fabric becomes joint, and each side still decides alone.

🔴 **BROKE (AP-3, high — structural), against 0.4.7 as it stands.** The rule holds; **no clause states
it.** A caller and a callee that both have postures today have no specified way to combine them, and
the three losing rows are what implementations will pick in the absence of one — each defensible in
isolation, and mutually incompatible across an ownership boundary. An unstated conflict rule is a
coin-flip per implementation pair.

*A second-order finding falls out of the table.* The effect classes do **not** form a total order. The
caller's rule and the callee's rule are strict on different axes — permanence versus spend — and
neither posture is *"higher"* than the other. Any vocabulary that ranks postures on one ladder must
therefore either lose one of these two rules or invent a comparison that does not exist. 🟡 **AP-4:**
the vocabulary must intersect **sets**, and must define **no** total order over them; a ladder is what
a product supplies as its own projection.

---

## Step 4 — The leg the caller never sees

`worldsim` accepts the Step 3 outcome and dispatches only `analyze-capture` — read bytes, return
claims, and by the callee's own description nothing that cannot be undone.

`analyzer` fulfils it by invoking `provider:agent:vision-model` (Owner C) on a paid per-call basis.
That invocation enqueues the frames for the provider's model-improvement corpus, which is disclosed in
that provider's own terms and is, once made, not undoable by anybody in this leg.

The caller's evidence trail has left Owner A's control, under a posture that admitted only effects
confined to the callee's domain, via a capability truthfully declared as reading bytes and returning
claims.

🔴 **BROKE (AP-5, high — blocking).** Two separate holes, and the second is worse:

- **The class was declared over the wrong thing.** `analyzer` classified *its own code*. The
  invocation's effects are the effects of the **leg** — everything the callee does to fulfil it,
  including every dispatch it makes downstream. Nothing says so, and the natural reading of *"what my
  capability does"* is the one that produced this.
- **A posture has no carrier along a chain, and spend does.** §5 is explicit that a grant's ceiling
  binds a *"cross-participant chain (knowledge producer → media producer → paid model)"* so that it
  *"cannot exceed the caller's authorized spend"* — money propagates because the credential propagates.
  The effective posture of Step 3 is computed pairwise and then **evaporates**: `analyzer` → Owner C is
  a fresh pair with a fresh intersection, and the caller is not in it. A rule that holds for one hop
  and not for two is not a boundary rule at all, because the boundary is transitive and the caller
  cannot enumerate the parties behind its callee.

This is the finding that would have made the whole clause cosmetic. The fix has to be
monotone-restrictive **along the chain** in the same shape §5's ceiling already is: a re-dispatch may
narrow what it was invoked under and may never widen it, and a declared class covers the leg rather
than the code.

---

## Step 5 — The second edge, and a refusal with nowhere to put its reason

Edge 2. `worldsim` offers a world-derived corpus to `provider:agent:trainer-local` (Owner B) as a KFT
job. The trainer is containment-bound and refuses jobs outside its envelope with a graded code — which
is what it is *for* (KFT §8.1).

Two halves, and they come apart.

✅ **HELD — the refusal grade needs no new vocabulary.** A posture refusal on a KFT job is a normative
gate refusing it here, which is exactly `refused-policy` in §8.1's table. `route_to[]`'s standing rule
— *a route MUST NOT breach the gate it just enforced* — reads correctly over posture without being
rewritten: naming a provider whose posture is **wider** than the one that just refused converts a
correct refusal into the breach it prevented, in the same way routing a `local-only` job to a
cloud-capable trainer does. KFT does not have to move for this.

🟡 **BROKE (AP-6, med — layering).** Edge 1 is not a KFT job. It is a plain `invoke` on the bus, and
**KCB has no refusal vocabulary of its own**: §5 says an over-ceiling invoke *"fails at the gate"* and
fixes no shape for what comes back, §7.2 says a mismatch is *"a defect"*, and the only graded refusal
in the fabric lives in **KFT**, which is a *profile composed over KCB*. A control-plane clause that
discharges its refusal shape onto a profile inverts the layering — every non-finetune caller on the bus
would have to read a fine-tuning spec to learn what a refusal carries. KCB must state the minimum in
its own terms and cite §8.1 as the profile's richer form, not the other way round.

🟡 **Recorded, not folded.** The refusal must also not become a disclosure: naming *which* class was
refused is required, and naming the corpus, the world, or the capability's internals is not. KFT §8.1
already fixes exactly this for `local-only` contents (*"naming the class is enough"*), and the same
sentence is what KCB's minimum needs.

---

## Step 6 — The live binding, and the fetch

Two composition checks against the sections KCB folded most recently. Both hold, and one of them holds
only because §4.2 exists.

✅ **HELD — a class change on a live subscription has a channel, and it is not a new one.**
`analyzer`'s effect class is a property of a capability, so it can move under a version bump while a
subscriber is mid-stream — the shape **V-7** found for deprecation signals, where *no §7 signal reaches
a live `subscribe` at all*. §4.2d has since specified **one** in-band control channel in both
directions and requires V-7's fold to ride it rather than mint a second. A posture clause folded after
it inherits that requirement rather than re-opening it: an effect-class change is a producer→subscriber
frame on the existing channel, and a clause that minted a third signalling path would be the defect.

✅ **HELD — `fetch` needs no class of its own.** A `fetch` across an authority boundary *is*
irreversible: bytes that leave a domain do not come back. But it is already gated, and by the party
that must gate it — KMI §7.1 fixes that the **serving** participant evaluates license, egress and trust
tier in its own authority domain and fails closed, over KGP §7's classes. The floor (Step 7) says a
posture may not relax that gate, and nothing about a posture makes it stricter than an already
fail-closed gate. So `fetch` gets no operand: the existing clause is not merely adequate, it is in the
right place, and a second control over the same act would be two gates disagreeing.

---

## Step 7 — What a caller may actually rely on

Strip out everything a peer declares and ask what is left, because that residue is the whole guarantee
across an ownership line.

Left standing: the **callee's unilateral gates** (KGP §7 license and egress, KCB §5 grant and ceiling,
KFT §4 admission and §8.1 refusal), the **grant the caller narrows**, and the caller's own decision not
to dispatch. Everything else on the wire is an assertion by its declarant.

🟡 **BROKE (AP-7, med).** A clause that stops here reads as a security control it is not: `analyzer`
may declare `analyze-capture` harmless and do something permanent, and no protocol mechanism detects
it. Unstated, that is a hole. Stated, it is a boundary — and the difference between this and the
advisory hints of Step 2 is real, so the clause has to say what it is:

- **Silence costs the declarant, not the caller.** An absent class reads *unknown*, and *unknown* is not
  admitted by a caller that gates on class — the same fail-safe direction §4.2a took for `volume`. A
  callee that declines to classify loses the traffic. An advisory hint defaults to *benign* and puts the
  cost on the reader.
- **A misdeclaration is a breach of a stated term, not a disappointed expectation.** The declaration
  rides the participant's own signed card (§5 `signing`), so it is attributable rather than asserted,
  and it is a **conformance criterion** — a KCS assertion (KCS §5) can state that an invocation whose
  class was not admitted was refused.
- **The posture composes with the grant, and the grant is not an assertion.** A caller that will not
  accept an irreversible effect should not hold a grant that reaches one. Posture says which classes may
  proceed *unattended*; the grant says what may be invoked *at all*. The first is read; the second binds.

🟡 **AP-8, med — the floor is nowhere stated.** Everything above only holds if no posture can relax a
mandatory gate, and at 0.4.7 nothing says that. The most permissive posture in any vocabulary must not
read as licence to skip KGP §7, KCB §5 or KFT §4/§8.1, and an unadmitted effect must be a **refusal** —
never a silent proceed, and never a silent substitution of a lesser effect, which is the disposition KFT
§3.3 already fixed for an unexpressible adaptation axis. Unstated, the floor is the first thing an
implementation optimizes away.

---

## Step 8 — No console anywhere

The conformance question ADR-0013 states as a requirement rather than an aspiration. Re-run the whole
leg with every participant headless — no UI, no operator, no approval queue, nobody to ask.

- `analyzer` declares its classes at publication time and never varies them. ✅
- `worldsim` holds a **fixed** posture from its configuration, computes the intersection, dispatches
  what is admitted and refuses what is not. No person is consulted, because none exists. ✅
- The refused `publish-findings` does not block, park, or await anything: it is refused, and the caller
  records it. ✅
- Tomorrow, an operator that does exist re-invokes under a widened posture. That is **a new dispatch**,
  not a resumption — so no verb, no state, no correlation id and no timeout is needed anywhere in the
  contract. ✅

✅ **HELD.** Nothing the leg needs names a person, an interface, a timeout, or an approval message.
The whole of what crosses the wire is a declaration, a set, and a refusal — which is the boundary
ADR-0013 draws between *when a stop is required* (koine's) and *how a stop is served* (the
implementer's, ADR-0001). A headless provider is fully conformant, and a console is one projection of a
posture rather than a prerequisite for one.

---

## What held

Recorded so the fold does not "fix" something that was never broken.

- **§5's grant and ceiling are correct and untouched.** Every finding above is about the axis §5 does
  not cover. Spend gating works exactly as specified — Step 4's chain rule is *modelled on* it.
- **ADR-0001's topology survives the whole leg.** No finding wants the host on the path; Step 3's
  losing row is the one that did, and it fails for BP-5's reason.
- **§4.2d's control channel is sufficient.** A posture fold reuses it. No third signalling mechanism.
- **KMI §7.1 and KGP §7 are in the right place.** Step 6 tried to find a posture hole on the `fetch`
  path and found a gate that already fails closed in the right domain.
- **KFT needs no edit.** §8.1's grades and its no-breach routing rule read correctly over posture as
  written (Step 5).
- **Every gate stays unilateral.** ADR-0011's T3 does not fire, and the intersection rule is the reason.
- **No new plane, verb, artifact kind, media type or authority role is wanted by any finding.**

---

## Findings — required spec deltas

| # | Severity | What broke | Required fold | Lands in |
|---|---|---|---|---|
| **AP-1** | **High (structural)** | Nothing in any spec declares what an invocation does that the caller cannot undo, or whether it is visible outside the callee's domain. Two capabilities identical on every indexed field differ by permanence, and cost ranking prefers the irreversible one. | Mint the **effect class** as an optional declaration on a capability and on a port — reversibility × visibility — outside the `schema_id` digest as `cost` and `volume` are. Absent reads **unknown**, never *harmless*. | KCB §2.1 + §4.3a |
| **AP-2** | **High** | A posture sent as a console rung is uninterpretable across owners, and a mode flag the callee is trusted to honour is not a guarantee — the advisory-hint defect, one layer up. | A posture is a **set of admitted effect classes**, named by what it guarantees. koine adopts no rung names; a product ladder is a **projection** onto the classes, with lossy edges named (ADR-0010's discipline). | KCB §4.3b |
| **AP-3** | **High (structural)** | Two peers with postures have no specified way to combine them; three plausible rules each fail across an ownership boundary. | **Monotone-restrictive intersection**: a posture never grants autonomy, only removes it; the effective posture is the intersection; the restriction always wins; each side enforces its own half; no declaration can widen a gate. State that this is what keeps ADR-0011's T3 from firing. | KCB §4.3c |
| **AP-4** | Med | Postures strict on different axes are incomparable; ranking them on one ladder loses a rule. | Intersect **sets**; define **no total order** over classes. A total order is a product's own projection. | KCB §4.3b |
| **AP-5** | **High (blocking)** | A truthfully declared read-only capability re-dispatched to a third owner and made the caller's data permanent. The class covered the callee's code, not the leg, and the effective posture evaporates at the second hop while spend propagates. | A declared class **covers the leg** — every dispatch made to fulfil the invocation. A re-dispatch MUST NOT present a posture wider than the effective posture it was invoked under, mirroring §5's chain rule for spend. | KCB §4.3e |
| **AP-6** | Med | KCB has no refusal vocabulary of its own; the fabric's only graded refusal lives in KFT, a profile composed over KCB. A posture refusal on a plain `invoke` has no stated shape. | State the **minimum a posture refusal carries** in KCB's own terms (the gate, the offending class, no disclosure of contents), citing KFT §8.1 as the profile's richer form. | KCB §4.3h |
| **AP-7** | Med | Nothing verifies a declared class, so an unqualified clause reads as a security control it is not. | State plainly **what a declaration is worth across a boundary**: silence costs the declarant, a misdeclaration is a breach of a stated term on a signed card and is KCS-assertable, and the posture composes with the grant — which binds rather than asserts. | KCB §4.3i |
| **AP-8** | Med | The floor is nowhere stated, so the most permissive posture reads as licence to skip mandatory gates. | **No posture relaxes** KGP §7, KCB §5, or KFT §4/§8.1. An unadmitted effect is a **refusal** — never a silent proceed, never a silent substitution. An undeclared class is not admitted. Refusal is always available to both sides. | KCB §4.3d |

---

## Only the boundary half is forced

What this leg deliberately does **not** carry into a fold, so the scope of the clause cannot drift on
the way in:

- **The approval mechanism.** Step 8 proves the contract needs none: the wire carries a declaration, a
  set and a refusal. How a person is asked, in what interface, with what timeout, and how the answer
  returns is the implementer's (ADR-0001), and nothing above wanted otherwise.
- **Intra-organizational supervision.** Every finding is a two-owner finding. A host supervising agents
  it assembled itself never appears, which is ADR-0011's *"how one organization decides"*, unchanged.
- **A decision record.** Step 7 shows that a stop leaving no trace is unverifiable by the other
  organization — which is **GOV-2**
  ([`../docs/reference/governance-taxonomy-map.md`](../docs/reference/governance-taxonomy-map.md)),
  open, on koine's own axis, and this clause's companion rather than part of it. This leg records the
  adjacency and folds nothing for it, so the two are not solved twice or half each.
- **A trust or reputation surface.** AP-7 is answered by stating the boundary honestly, not by adding
  machinery that would put the fabric in the business of scoring peers.
- **Any change to KFT, KGP, KMI or KINP.** Step 5 and Step 6 tested for one and found none.

---

## Re-ratification — what this pass gates

The findings above are folded into **KCB 0.4.8** as normative **§4.3**, with the `effect` declaration
added to §2.1's port and capability vocabulary and one reading rule added to §5. The fold is a
**patch**: every field is optional on read and on write, a dispatch that declares no posture behaves
exactly as it did at 0.4.7, no verb / plane / port kind / media type is added, §7.2's compatibility
table is undisturbed, and **0.5.0 remains spoken for** by §7.3's removal of §2.2's standalone manifest.

| Spec | Status after this pass | What would clear it |
|---|---|---|
| **KCB 0.4.8** | **Candidate**, on a **fifth** count | A re-run of *this leg* against the folded §4.3: Step 1 must distinguish the two capabilities before dispatch, Step 3's disagreement must resolve by a stated rule with no arbitration, Step 4's delegated leg must not escape the caller's posture, Step 5's refusal must have a shape stated in KCB, and Step 8 must still complete with no console anywhere. Gates **§4.3 alone**; the four existing counts are restated and none moves. |
| **KCB 0.4.8** | Additionally gated by ADR-0013's retained condition | A **second independent implementation** whose postures project onto the effect classes without adding a class per implementation (ADR-0013 **W3**, tested by ADR-0010 §3.4's *complete or reported* criterion). This is a ratification condition carried by the ADR, not a finding of this leg. |
| **KFT, KGP, KMI, KINP** | Unmoved | Nothing here folds into them; Steps 5 and 6 are the record of testing for it. |

**Conformance gate.** Under [the ratification gate](../specs/README.md#the-ratification-gate) a
hand-walked pass earns `draft → candidate` and `candidate → ratified` additionally requires this
scenario's **machine-replayable KCS encoding**. None exists: this is the **twelfth** scenario against a
downstream encoding set of nine, so §4.3's clauses have no runnable document citing them and KCB is not
promotable on this count until one is written. That encoding is downstream runtime work (ADR-0001) and
is **unowned** as of this date. Named here, in [`README.md`](README.md), in
[`../ROADMAP.md`](../ROADMAP.md) and in
[`../docs/reference/kcs-encoding-gate-verification.md`](../docs/reference/kcs-encoding-gate-verification.md)
§6.3, because no guard in this repo checks it — the downstream set-equality
test is the only thing that will notice, and it will notice as a red build in another repository.

**Resolution (2026-08-26).** Deltas **AP-1…AP-8** folded into KCB **0.4.8** §4.3 (with §2.1 and §5
edits). This document stands as the historical record of what the pass found; a re-run against the
folded text is the fifth of KCB's re-ratification counts.

## Re-run — Steps 1–8 walked by hand against §4.3 (2026-09-03)

**What this is.** KCB's **count (v)**, opened by 0.4.8 and gating **§4.3 alone**, on the conditions
*Re-ratification* states above — *"Step 1 must distinguish the two capabilities before dispatch, Step 3's
disagreement must resolve by a stated rule with no arbitration, Step 4's delegated leg must not escape
the caller's posture, Step 5's refusal must have a shape stated in KCB, and Step 8 must still complete
with no console anywhere."*

**Method, and why it is not a replay.** By hand, against the prose. `kcs:cross-owner-posture` exists,
ran `green` / `partial-live`, and is recorded above — **DR-13 is closed**, and the *Downstream results*
section says in terms that `green` is not a gate verdict here either. The encoding asserts what koine
folded; AP-1 and AP-7's predicates are declared **console extensions** because KCS §5 cannot state them,
and a declared extension cannot report a clause with no carrier. Same standing reason as **DR-7** and
**DR-8**.

### Per-step verdicts

| Step | Delta under test | Verdict |
|---|---|---|
| **1** — The caller cannot ask the question | **AP-1** | ✅ **flips** |
| **2** — So the caller sends a mode flag | **AP-2** | ✅ **flips** |
| **3** — The disagreement, and which one wins | **AP-3**, AP-4 | ✅ **flips** |
| **4** — The leg the caller never sees | **AP-5** *(blocking)* | ✅ **flips**, two declared residuals |
| **5** — A refusal with nowhere to put its reason | **AP-6** | ✅ **flips** |
| **6** — The live binding, and the fetch | two holds | 🟡 **half-holds** → new delta **AP-9** |
| **7** — What a caller may actually rely on | **AP-7**, **AP-8** | ✅ **flips** |
| **8** — No console anywhere | the conformance requirement | ✅ **holds** *(regression)* |

### Step 1 — The caller cannot ask the question ✅ *flips*

There is now a field. §4.3a mints the **effect class** — `reversibility` (`none` / `local` /
`irreversible`) × `visibility` (`internal` / `external`) — as an optional declaration on a capability
**and** on a port, so Step 1's exhaustive field table gains the row it did not have.
`analyze-capture` declares `{none, internal}`; `publish-findings` declares `{irreversible, external}`.
The two capabilities that were *"the same shape on every field the manifest, the registry and the path
planner can see"* are now distinguishable **before dispatch**, on a field the caller reads off the
callee's own card.

Three probes, all held:

- *Declare nothing.* An absent `effect` reads **`unknown`**, never *harmless*, and `unknown` is admitted
  only where a posture names it explicitly. The fail-safe direction §4.2a took for `volume`, reused
  deliberately.
- *Who may assert it.* §4.3a fixes that the class is declared by the participant that **implements** the
  capability, on its own card (ADR-0007), with no registry holding it and no third party asserting it on
  another's behalf. That is what stops the field becoming a reputation surface, which *Only the boundary
  half is forced* rules out by name.
- *Does cost ranking still prefer the irreversible one?* Yes — §3's path search still prefers
  zero-`cost` routes, and §4.3 adds no ranking rule, deliberately. But AP-1's complaint was that the
  caller had **no field against which the rule could even be stated**; it now has one, and it gates
  before dispatch rather than relying on an ordering. Recorded so the two are not confused: the ranking
  observation was an amplifier, and it is not repaired because it is not a defect.

### Step 2 — So the caller sends a mode flag, and it buys nothing ✅ *flips*

§4.3b answers all three of the step's independent failures. **The rung has no referent** →
*"koine adopts no rung names — no `autonomous`, no `plan-first`, no `ask-first`"*; a posture is a **set
of admitted effect classes**, named by what it guarantees, and a product's ladder is a **projection**
onto them with its lossy edges named, which is ADR-0010's discipline applied a third time. **A flag the
callee is trusted to honour is not a guarantee** → §4.3c makes the declaration something the reader acts
on by withholding, never something the peer is asked to honour. **The direction is backwards** → the
operand exists in both directions and the caller's half is enforced by the caller.

The step's 🟡 — *the mode flag is inadequate in a way that names the fix* — is what the fold took, and
taking it is why the flip is clean rather than partial.

### Step 3 — The disagreement, and which one wins ✅ *flips*

§4.3c states the rule the step found and could not cite: posture is **monotone-restrictive**, the
effective posture is the **intersection**, each side enforces its own half against its own gates, and
**no posture presented by a peer may widen any gate**. `worldsim` refuses `publish-findings` before
dispatch; `analyzer` refuses the paid analysis on its own gate. Nothing is arbitrated, nobody is trusted,
and the three losing rows of the step's table are each excluded by name — the caller-governs and
callee-governs rows by *"a declaration a peer presents can only ever cause the reader to do **less**"*,
and the host-arbitrates row by the same structural fact **BP-5** established, that no party has
jurisdiction over both ends.

**AP-4 flips with it.** §4.3b states that `admits` is a **set** and that the specification defines **no
total order** over classes, with the reason the step gave: two postures may each be stricter on a
different axis and neither is *"higher"*.

**And ADR-0011's T3 is checked, not asserted.** §4.3c states that every gate stays unilateral *as a
design constraint on the section, not an observation about it*. Walked: both refusals in the winning row
are taken alone, by the party that owns the gate, with no joint decision anywhere. T3 does not fire.

### Step 4 — The leg the caller never sees ✅ *flips, with two declared residuals*

The blocking delta does not reproduce. §4.3e closes both holes the step found, and closes them in the
order the step ranked them:

- **The class covers the leg, not the code.** *"A declared `effect` … states what the invocation causes,
  **including every dispatch the callee makes to fulfil it** — not what the callee's own code does in
  isolation. A callee whose downstream provider publishes the caller's inputs declares `external`,
  whatever its own code does."* `analyzer`'s truthful-but-narrow `{none, internal}` on `analyze-capture`
  is now a **misdeclaration**, not a defensible reading.
- **The posture has a carrier along the chain.** *"A re-dispatch MUST NOT present a posture wider than
  the effective posture it was invoked under. It MAY narrow further."* Monotone-restrictive along the
  chain, in the shape §5's spend ceiling already has — which is the analogy the step itself demanded —
  and a callee that cannot bound its downstream legs to the effective posture MUST refuse rather than
  dispatch and hope.

**Residual 1, and §4.3i states it.** The chain rule is an obligation on the callee that the caller
cannot verify: `worldsim` cannot observe the `analyzer` → `vision-model` leg. That is not a hole here
because §4.3i says plainly what a declaration is worth and what three things nonetheless separate it
from an advisory hint. Recorded so a re-runner does not read §4.3e as enforcement.

**Residual 2, and it is DEFER-D's.** The leg-covering claim is only as current as `analyzer`'s
declaration, and Owner C may change what `vision-model` does. §4.3a requires the class change to be a
**minor** bump and to be signalled on §4.2d's channel — but the party that needs it here holds a cached
**discovery binding** and invokes, not a `subscribe`, and §7.3g's own closing bullet says that binding
form has no channel (**DEFER-D**). So a leg's class can go stale for a caller with no signal path. That
is DEFER-D's stated trigger arriving on a second surface, not a new delta — and the *signalling* half of
it is **AP-9**, below.

### Step 5 — The second edge, and a refusal with nowhere to put its reason ✅ *flips*

The ✅ half is unchanged and needed nothing: KFT §8.1's `refused-policy` and its no-breach `route_to[]`
rule read over posture as written, and KFT did not move — Step 5 predicted that and it is confirmed by
re-reading §8.1 against §4.3, not by assuming it.

AP-6's layering inversion is repaired. §4.3h states KCB's **own** minimum: a refusal MUST name **which
gate refused** and **which class** was not admitted, MUST NOT disclose the contents behind the class, and
MAY carry the richer graded form where the caller is on a surface that defines one — *"KFT is a profile
composed over KCB, so the citation runs this way and not the other: no caller on this bus needs to read
a fine-tuning spec to learn what a refusal carries."* The non-disclosure half — the 🟡 the step recorded
and did not file — is folded with it, on the sentence KFT §8.1 already uses for a `local-only` corpus.

### Step 6 — The live binding, and the fetch 🟡 *half-holds*

**The `fetch` half holds, and holds for the reason the step gave.** §4.3a states in terms that `fetch`
gets **no** effect class, because KMI §7.1 over KGP §7 already gates it fail-closed in the right domain
— *"a second control over the same act would be two gates disagreeing."* Re-probed against KMI 0.3.5:
MA-5 made the asset's own `license`/`egress` travel with the bytes and made §7.1(e) evaluate them **in
addition to** the serving domain's, so the gate the step relied on got **stronger**, not weaker, and the
carve-out is more clearly right than when it was written. §4.3f restates the exclusion at the evaluation
point. ✅

**🔴 BROKE (AP-9, medium — carrier). The live-binding half asserts a signal that no frame carries.**
§4.3a states: *"Where a capability's class changes while a `subscribe` binding is live, the producer
signals it on the **§4.2d control channel** — the single in-band channel that section specifies in both
directions. This section mints **no** second signalling path."* Not minting a second path is right and
is what the step asked for. But **§4.2d specifies a channel and names no frames**; the only section that
names frames on it is **§7.3g**, and its table has exactly three — `successor_published`, `deprecated`,
`removal`. **None of them announces an effect-class change.**

§4.2d's own rule turns that from an omission into an equivalence: *"A producer that receives an unknown
frame MUST ignore it; a subscriber MUST tolerate a producer that never sends one."* A frame no section
names is a frame every conformant subscriber may ignore, so an **undefined** signal and an **absent**
one are the same signal on the wire. And it costs the section the property §7.3g explicitly claims for
its own three — that *"a producer that emits none is now **detectable** rather than merely silent,
because the frames are named and a scenario can assert their absence (KCS §5)"*. An effect-class change
is neither detectable nor assertable, which matters more here than for most fields: `unknown` is not
admitted, so a class **narrowing** a subscriber never learns of is a dispatch it keeps making under a
posture that no longer admits it.

**A second instance, on the other axis of the same clause.** §4.3a also states that changing `effect` is
*"a **minor** bump on the capability that carries it (§7.2), so the version moves and a pinned consumer
can see it."* §7.2's table is normative and has **no row for `effect`**; the nearest row a provider will
land on is *editorial, no `schema_id` change* → **patch**, since `effect` sits outside the digest. So the
version-movement half of the visibility claim is asserted in §4.3 and absent from the table that governs
it. That is [`kcb-subscription-firehose.md`](kcb-subscription-firehose.md)'s **BP-8**, which found the
identical defect for `volume` at §4.2a on the same date; both are recorded because each count must carry
its own verdict, and the fold is one edit for both.

**The class this belongs to.** [ADR-0014](../decisions/ADR-0014-federated-merge-merges-attributions.md)
generalizes it in advance: *"every operand deliberately kept **outside** the digest — `cost`, `binding`,
`volume`, `effect`, the marking — is outside the merge key too, and only the two with a declared §7.2
bump are rescued."* This walk and the firehose walk together establish that **`effect` and `volume` are
not among the two**: their bumps are declared in §4.3a and §4.2a and nowhere in §7.2. The same shape
appears once more at §2.4 and §7.2's `binding` row, filed as
[`e2e-live-schema-mutation.md`](e2e-live-schema-mutation.md)'s **V-10**.

*The fold is additive and small:* a named frame on §7.3g's table for a class change on the bound
`(name, major)` — or one generic *entry changed* frame naming the field that moved, which is also the
shape ADR-0014's marking carrier and V-10's `binding` signal both want — plus the `effect` row in §7.2's
table. Neither moves a digest, adds a verb, or touches §4.3's model. → KCB §4.3a/§7.3g/§7.2.

### Step 7 — What a caller may actually rely on ✅ *flips*

**AP-7** is answered by §4.3i, which states the boundary rather than adding machinery: silence costs the
declarant (absent reads `unknown`, `unknown` is not admitted, *"a participant that declines to classify
loses the traffic"*), a misdeclaration is a **breach of a stated term** on a card §5's `signing` makes
attributable and is **KCS-assertable**, and the posture composes with the grant — *"the first is read;
the second binds."* The clause says what it is not, which is what stops it reading as the security
control the step warned about. No trust or reputation surface is added, which *Only the boundary half is
forced* required.

**AP-8** is answered by §4.3d, and the floor is stated where the step said it had to be — in the
callee's unilateral half. No posture relaxes KGP §7, KCB §5 or KFT §4/§8.1; an unadmitted effect is a
**refusal**, never a silent proceed and never a silent **substitution** of a lesser effect (KFT §3.3's
disposition, reused); an undeclared class is not admitted; refusal remains unconditionally available to
both sides. Probed for the obvious erosion — *"can the most permissive expressible posture skip a
gate?"* — and §4.3d forecloses it in terms: a participant that omits one is non-conformant regardless of
what either side declared.

### Step 8 — No console anywhere ✅ *holds (regression)*

Re-walked with every participant headless and it completes. §4.3g is a **NORMATIVE conformance
requirement** and states each of the step's four bullets: the section names no person, defines no
interface, timeout, correlation id, approval message or queue; a headless provider declaring classes and
a headless caller computing the intersection are both fully conformant; and a refused dispatch *"is not
parked, held, or resumable — a subsequent dispatch under a widened posture is a **new** invocation"*,
which is why §4.3 needs no verb, no state and no resumption operand. Checked against §4's verb table
(five entries, unchanged) and §2.1's port table (three planes, unchanged): the fold added an optional
field and an optional operand and nothing else.

### Findings — from the re-run

| # | Severity | Gap | Fold | Spec |
|---|---|---|---|---|
| **AP-9** | Med (carrier) | §4.3a asserts two consequences §4.3 does not carry. **(i)** An effect-class change on a live `subscribe` *"is signalled on the §4.2d control channel"*, but §4.2d names no frames and §7.3g — the only section that does — names three, none of them this; §4.2d's *tolerate a producer that never sends one* then makes an unnamed frame indistinguishable from an absent one, so the signal is undetectable and unassertable (KCS §5), and a class **narrowing** reaches no live binding. **(ii)** Changing `effect` is stated to be a **minor** bump under §7.2, and §7.2's normative table has no row for it — the nearest reads *patch*, so the version-movement the visibility claim rests on is not authorized by the table that governs bumps. The **BP-8** defect, second instance; ADR-0014's class. | Add a named frame to §7.3g's table for a class change on the bound `(name, major)` — or one generic *entry changed* frame, the shape ADR-0014's marking carrier and **V-10** both want — plus an `effect` row in §7.2's table beside `cost` and `binding`. | KCB §4.3a/§7.3g/§7.2 |

### What this re-run does and does not close

**Count (v) does NOT close.** All five conditions *Re-ratification* names are met, and met by walking:
Step 1 distinguishes the two capabilities before dispatch, Step 3's disagreement resolves by a stated
rule with no arbitration and no trust, Step 4's delegated leg does not escape the caller's posture,
Step 5's refusal has a shape stated in KCB, and Step 8 completes with no console anywhere. **AP-5, the
blocking delta, does not reproduce**, and neither do AP-1, AP-2, AP-3, AP-4, AP-6, AP-7 or AP-8 —
**eight of eight flip**. §4.3's *model* is not in question and this walk did not find one that was.

It does not close because Step 6's live-binding hold does not hold: **AP-9**, a carrier gap on §4.3a's
own two visibility claims. That is a perimeter break of the same kind the original leg found, and the
fold is additive.

So the count **changes shape** rather than closing: from *re-run this leg against the folded §4.3* to
**fold AP-9 (one frame in §7.3g plus one row in §7.2 — the same edit that closes BP-8 and V-10), then
re-run Steps 1–8 again**. It is **unowned**.

**And the count's second condition is unmoved.** ADR-0013's retained
**second-independent-implementation** condition (**W3**) gates §4.3's ratification beside this re-run,
tested by ADR-0010 §3.4's *complete or reported* criterion. Nothing in this walk touches it, no
implementation of it is known to this repo, and it is **unowned**. A clean re-run would not have
promoted §4.3 on its own.

**What this walk does not touch.** KFT, KGP, KMI and KINP are unmoved, exactly as *Only the boundary
half is forced* said they would be — Steps 5 and 6 are the record of testing for it a second time, and
KMI 0.3.5's MA-5 made Step 6's `fetch` carve-out **more** clearly right rather than less. GOV-2 is
unchanged and still this clause's companion rather than part of it. **No version moves and no clause
moves** — the edit is this section, a gate paragraph in
[`../specs/capability-bus.md`](../specs/capability-bus.md) and a changelog entry. **KCB is not
promoted.**

---

## Downstream results

> **What this section is.** The recorded result of a **downstream run** of this pressure test's
> KCS encoding, in the shape [`README.md`](README.md#downstream-results-where-a-real-runs-result-lands)
> fixes. Instance-free, role-scoped, and it **promotes nothing**.

> **CORRECTED 2026-09-03.** What follows replaced a statement that this scenario *"has never been
> run downstream, and has no encoding."* True when written on 2026-08-26, overtaken the same
> afternoon, and unnoticed here for a week. The old text is not preserved in this section because it
> is what a ratification gate reads for evidence; the correction is written up at
> [`../docs/reference/kcs-encoding-gate-verification.md`](../docs/reference/kcs-encoding-gate-verification.md)
> §6.0 and §6.4, where the old reading is left standing.

| | |
|---|---|
| Encoding | **`console/src/kcs/scenarios/cross-owner-posture.ts`**, registered in `index.ts` with `source: 'scenarios/kcb-cross-owner-posture.md'` and `gates: 'KCB §4.3 (ADR-0013)'`. The predicates KCS §5 cannot state are declared as **console extensions** and reported as such, per AP-1…AP-8 |
| Run | `kcs:cross-owner-posture` — **`green: true`**, `live_pass: false`, verdict **`partial-live`**, 2 of 4 participants live (`worldsim:agent:author`, `analyzer:agent:pipeline`), the local trainer and the store answering from delta-N `standin` fixtures, no transport failures |
| Artifact | `sha256-eb8fdc9ce041162db78ef80df42998e25793dc6a20e7ac8974f77d7615236dd5`, generated **2026-08-26T17:26:10.420Z**, twelve scenarios, 26 of 44 slots live (59%), suite verdict `partial-live` |
| Landed | `agora` **`378fd3c`**, 2026-08-26 12:30:18 — the same commit encoded all three then-unencoded legs **and regenerated the artifact**. Verified by running both gates at `agora` `main` = **`c971fc2`** on 2026-09-03 |

**`green` is not a gate verdict here either.** The encoding asserts what koine has **folded**; its §4.3 count (v)
remains open on its own re-run against the folded text, and this result discharges the *artefact*
condition alone.

| Why | This document landed with `chief/71` on **2026-08-26**, a week after the nine encodings were built (`agora chief/75`, merged 2026-08-19) and two days after they were run |

This is the **third** document in this directory in that position, after
[`kft-resume-checkpoint.md`](kft-resume-checkpoint.md#downstream-results) and
[`kcb-subscription-firehose.md`](kcb-subscription-firehose.md#downstream-results). All three landed
on the same day, all three after the encoding set was frozen at nine, and none is owned — so the
same red light now names three files: `coverage.test.ts` asserts set-equality between
`KOINE_SCENARIOS` and this directory's `*.md`, and its `KOINE_SCENARIOS.length` assertion — **9** when
this was written, **12** since `378fd3c` — went red on all three until that commit closed it. That gate is downstream and it is the only enforcement there is;
koine's own `.chief/verify.sh` checks links, status mirrors, schemas and the registry and has
nothing that could notice. Adding a file to `scenarios/` is a cross-repo obligation with no local
red light.

### Findings — from the absence of a downstream run

**DR-13 is CLOSED, on 2026-08-26, and koine learned on 2026-09-02.** The row below is left standing as
the finding of record — its reasoning is intact and only the world moved. `console/src/kcs/scenarios/cross-owner-posture.ts`
landed at `agora` `378fd3c`, forty-nine minutes after the koine document recording this gap was last
written, and the gate was re-run at `agora` `main` = `c971fc2` on 2026-09-03
([`../docs/reference/kcs-encoding-gate-verification.md`](../docs/reference/kcs-encoding-gate-verification.md)
§6.4). **KCB does not lose the artefact gate on this count** — and is no closer to `ratified` for it:
all five of its counts remain open on their own re-runs, and count (ii) still fails the artefact
condition on **DR-7**, its encoding predating the fold it would have to assert.


| # | Severity | Gap | Consequence |
|---|---|---|---|
| DR-13 | ~~Blocking~~ → **CLOSED 2026-08-26** (for KCB §4.3 alone) | The KCB 0.4.8 fold this leg forced — §4.3a's `effect` class on a capability or port, §4.3b's posture as a set of admitted classes with no rung names and no total order, §4.3c's monotone-restrictive intersection, §4.3d's floor, §4.3e's chain rule, §4.3f's minimum refusal shape and §4.3g's no-console conformance requirement — has **no machine-replayable document citing any of it**, and neither does AP-1…AP-8. | [The ratification gate](../specs/README.md#the-ratification-gate) forbids promoting a spec whose scenario has no KCS encoding, so **KCB loses the artefact gate on this count**. It is narrow: KCB's three encoded counts re-run [`e2e-media-transform.md`](e2e-media-transform.md), [`e2e-live-schema-mutation.md`](e2e-live-schema-mutation.md) and [`e2e-multi-authority.md`](e2e-multi-authority.md) and are unaffected, as are the four specs that touch none of the three unencoded documents. This is on top of, not instead of, the fifth count's own re-run gate and [ADR-0013](../decisions/ADR-0013-autonomy-posture-boundary-clause.md)'s retained second-independent-implementation condition. Building the encoding is downstream runtime work under [ADR-0001](../decisions/ADR-0001-control-plane-topology.md) and is **unowned** as of 2026-08-26. |

Suite-wide limits **DR-1** and **DR-2** are recorded in
[`README.md`](README.md#downstream-results-where-a-real-runs-result-lands); neither applies to a
scenario that was never run. **DR-11** is the same finding against
[`kft-resume-checkpoint.md`](kft-resume-checkpoint.md#findings-from-the-absence-of-a-downstream-run)
and a different spec, and **DR-12** the same finding against
[`kcb-subscription-firehose.md`](kcb-subscription-firehose.md#findings-from-the-absence-of-a-downstream-run)
and KCB's §4.2 count; the three are recorded separately because each costs a different count its
gate and any one could be discharged without the others.
