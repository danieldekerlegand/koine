# The federation fold — a disposition for each of MA-1…MA-11

> **Status:** Current · **Updated:** 2026-08-26 · **Owner:** koine · **Informative**

[`../../scenarios/e2e-multi-authority.md`](../../scenarios/e2e-multi-authority.md) — the
cross-authority break test that [ADR-0012](../../decisions/ADR-0012-federated-authority-roles.md)
required and `chief/53` wrote — ran two independently built authority domains into one fabric and
came back with **eleven findings, six of them blocking**. When this page was written nothing had
been folded: three specs described the pre-break design, and two of them
([KINP](../../specs/identity.md), [KMI](../../specs/media-interchange.md)) were held at `candidate`
partly by exactly these deltas. The fold has since landed — see the note below — and all three are
still `candidate`, now on a re-run rather than on these findings.

This page began as the **first half** of the fold: what each of the eleven gets, decided and reasoned
**before** a clause is touched. It changes **no clause and no version** — deciding what to fold and
folding it are different acts, and conflating them is how a fold overreaches. The second half (the
edits themselves) is [`85-fold-the-federation-breaks`](../../tasks/chief/completed/85-fold-the-federation-breaks.json)
US-2, which landed each **FOLD** row below and nothing else.

Two sections were added after the edits landed, and they also change no clause:
*What the fold does to promotability* (the effect on each spec's gate, with the ranking itself left
to [`promotability.md`](promotability.md)) and *What the pressure test taught about the pattern, not
the clauses* — the finding that outlives the eleven, since three specs deferred one question and each
predicted it would resolve the same way at its own surface.

> **The fold landed, 2026-08-26.** Every **FOLD** row below is applied, at the version this page's
> *Where each fold lands* table planned for it: **KINP 0.4.0**, **KMI 0.3.5**, **KCB 0.4.9**, with
> **KGP** taking an Editorial changelog entry and no version move, and **MA-11** closed unfolded. The
> per-finding re-read against the folded text — does each step's break still reproduce? — is the
> *Fold status* section of
> [`../../scenarios/e2e-multi-authority.md`](../../scenarios/e2e-multi-authority.md), and each spec's
> changelog is the record. All three specs **stay Candidate**: a fold does not close its own gate.
> This page remains the reasoning, not a status mirror.

**What this page is not.** It binds no clause, and it is not a status mirror — each spec's own
header is the authority on its version and status
([`../../specs/README.md`](../../specs/README.md)). The version landing-zones named in
*Where each fold lands* are **intent**, not a record; the changelog entry US-2 writes is the record.

---

## The rule this page applies

`scenarios/`' standing policy is that an open question is folded **only when a pressure break forces
it**, never speculatively. Eleven breaks are eleven forcings — but *forced to what extent* is a
separate question from *forced at all*, and it is the one that decides what this contract costs. A
clause added beyond the forcing is paid for twice, once by each organization that implements koine.

So each finding is classified as exactly one of:

| Disposition | Means |
|---|---|
| **FOLD** | A clause changes. Named spec, named section, and the extent stated — including what is deliberately *not* written. |
| **CLOSE** | No clause changes: the break is already covered by an existing clause read correctly, or already discharged where it lands, or the scenario was wrong. The reasoning is recorded, not the absence. |
| **DEFER** | Genuinely reactive: a real gap that no break has yet forced. **A DEFER states the future break that would force it.** "Not now" without a trigger is how an open question becomes permanent. |

A finding may be **split** — the half the break forces is folded and the remainder deferred with its
own trigger. Three of the eleven split that way, and those three splits are where most of the
economy in this fold is: the scenario's *suggested* delta column proposes, in each case, a second
mechanism that the break itself does not demand.

---

## First: verifying the attributions rather than inheriting them

The tasklist says MA-1/2/3/4 are recorded against KINP and MA-5 against KMI. Both are **correct**,
and the check is worth its cost because each spec's *own* record — not the scenario's Spec column —
is what a reader of that spec meets:

| Spec | What its own text records | Verified |
|---|---|---|
| [KINP](../../specs/identity.md) | §11 decision 1 + the 2026-08-24 Editorial changelog entry: deltas MA-1…MA-11, of which **MA-1, MA-2, MA-3, MA-4 are blocking on this spec**, plus **MA-7** on §3.4. This pass is KINP's **only** re-ratification count. | ✅ as recorded — and MA-7 is on that list too, which the tasklist's summary does not mention. |
| [KMI](../../specs/media-interchange.md) | §7.1's *Re-ratification* paragraph: **MA-5** blocking, **MA-10** alongside; four of §7.1's own clauses held under direct attack. Second of two counts; the KCB re-run count is unaffected. | ✅ as recorded. |
| [KCB](../../specs/capability-bus.md) | §3.1's *Re-ratification* paragraph: **MA-6** blocking, **MA-8** and **MA-9** alongside. Third of (now) four counts; the other counts do not move. | ✅ as recorded. |
| [KGP](../../specs/grounding-pack.md) | Nothing. The scenario names it a **consequence surface, not a gated spec** — no step contradicts a KGP clause and no version moves — but says *"whoever folds MA-3/MA-4/MA-5 answers for this column too."* | ✅ — and answered below, at no version cost. See *Why KGP does not move*. |
| [KCS](../../specs/conformance-scenario.md) | §7 open question 1 already cites **MA-11 by name**, alongside V-8, as evidence that the escape hatch works as the question imagines. | ✅ — which is why MA-11 is the one **CLOSE** on this page. |

Two corrections to the scenario's own framing, found by reading the clauses rather than the finding:

1. **MA-5's field list is one field short.** The scenario lists the §2 envelope as
   `id, media_type, bytes, source_world, attaches_to, produced_by, probe, prov`. §2 also defines an
   optional **`excerpt`**. It carries neither licence nor egress, so the finding stands unchanged —
   but the fold in §2 adds fields beside `excerpt`, not to a closed list of eight.
2. **MA-9's de-duplication half is narrower than stated.** §3.1(d) *already* speaks to "the same
   provider reached through two peers" — for the case where the two entries carry a **differing
   `schema_id`**, which it correctly calls a defect at the provider and requires both entries be
   returned. What is unaddressed is the **identical** case: same provider KINP id, same
   `(name, version)`, same `schema_id`, two serving peers. The fold is therefore a *converse* to an
   existing clause, not new machinery — one sentence, in the clause that already covers its sibling.

---

## The dispositions

| # | Severity | Disposition | Lands in | Extent — what changes, and what deliberately does not |
|---|---|---|---|---|
| **MA-1** | **High**, blocking | **FOLD** | [KINP](../../specs/identity.md) **§4.1** (+ a pointer from §4.2) | A consumer obligation, not a new field: a `same_as` closure spanning links issued by **more than one authority** MUST either be cut at the authority boundary or have each imported link re-evaluated against the consumer's own threshold, and a multi-authority path MUST carry its **weakest issuer + confidence** into the computed view. The operand already exists — §4.2's `src` — so nothing is added to the envelope. **Not written:** any change to §11 decision 2 (a ratified decision whose per-world threshold is correct as it stands), any cross-authority threshold-negotiation mechanism, and any change to §4.1's non-destructive query-time model, which the scenario explicitly finds *not wrong* and is what makes the break recoverable at all. |
| **MA-2** | **High**, blocking | **FOLD** (split — see DEFER-A) | [KINP](../../specs/identity.md) **§4.5** | A **fourth, fail-closed branch** on the normative relation-choice rule: *operand unresolvable* (the candidate's world, or its inherit-as-identity mode, cannot be resolved) → emit `based_on` or nothing and queue for review (§11 decision 2), **never `same_as`**. This is precisely the missing branch — the existing third branch covers low **confidence**, which a 0.93 match is not. **Not written:** the control-plane route by which world metadata would cross a domain boundary → **DEFER-A**. |
| **MA-3** | **High**, blocking | **FOLD** (split — see DEFER-B) | [KINP](../../specs/identity.md) **§6** | Of the two options the scenario offers, take the cheaper and state it: claim-id convergence is **domain-scoped**. §6's *"re-expressed against the canonical entity"* is amended to say which canonical entity — *the re-expressing participant's own authority's* — and to state that across authorities the cross-domain instrument is the **§4 equivalence layer**, a query-time view, not a shared hash. Silence was the one unavailable option; this is the option that mints no new machinery, moves **no existing claim id**, and reinstates no privileged holder (ADR-0012's rejected option (a)). **Not written:** a federation-scoped canonical form re-expressing against §4.4's external anchor → **DEFER-B**. |
| **MA-4** | **High**, blocking | **FOLD** | [KINP](../../specs/identity.md) **§4.2** + **§5** (+ a note at §6); [`registry/relations.tsv`](../../registry/relations.tsv) | Extend the equivalence layer to **worlds** — the scenario's option (i). A **new** core relation over two world ids (never `same_as` widened in place: a relation's signature is immutable once published, so a change is a new name — the precedent is KFT 0.6.0's `continues`), asserting that two named worlds denote the same context, with §4.3's firewall semantics preserved: a world-equivalence link MUST NOT be read as inheritance-as-identity, and §4.5 keeps reading the world's own inheritance metadata rather than this link. §5 states that each authority's `…:world:consensus-reality` is its own and that cross-domain equality is **asserted, not assumed**. **Not written:** option (ii), a namespace-free canonical world token — one line of prose that would re-hash **every existing real-world claim**, since the world stamp is inside the §6 hash. Rejected on blast radius, and the rejection is recorded so it is visibly a choice. |
| **MA-5** | **High**, blocking | **FOLD** | [KMI](../../specs/media-interchange.md) **§2** + **§7.1(d)(e)** | Two optional fields on the asset envelope — `license` and `egress`, valued from KGP §7.1's classes and §7.2's egress classes, **excluded from the id** like every other envelope field (§2's opening rule; no `asset` id moves). §7.1(d) gains the single carve-out its own reasoning already implies: the policy pair is the **one** thing that accompanies replicated bytes — it is not synthesized, it travels — and §7.1(e) gains the consequence: a copy whose governing policy did **not** travel MUST NOT be served onward. That is what turns (e)'s gate from inoperative into decidable at the second holder. **Not written:** any change to where the decision is made (§7.1(e) is right that it is the serving participant's, in its own domain), any signing or hard-binding requirement on the pair, and no KGP clause — the classes are reused, not redefined. |
| **MA-6** | **High**, blocking | **FOLD** | [KCB](../../specs/capability-bus.md) **§5** (+ an optional `auth` field in **§2**) | A grant names its **issuing host** by KINP id, and a provider states which issuers it honours — an additive, optional `auth.accepted_issuers[]` beside the existing `auth.scheme` / `auth.grants_required`. A federation is a **stated** set of accepted issuers, never an implicit one; an unrecognized issuer **fails closed**. `budget_units` either denominates in a stated unit or a cross-domain `invoke` is refused for want of one. KMI §7.1(b)(e) inherits the fix by citing §5, as it already does — the `fetch:asset` leg needs no separate clause. **Not written:** token format, issuance, rotation, or any trust-federation protocol — §5's own boundary is that KCB fixes the **shape** of grants and leaves auth mechanics to the host's infra, and this fold does not move that boundary. |
| **MA-7** | Med-High | **FOLD** | [KINP](../../specs/identity.md) **§3.4** | State the prefix registry's status under ADR-0012, which is the whole of the delta: it is the one deliberately **non-federated commons** — a shared naming convention, not a fourth authority role — because a prefix confers *a name, not a privilege* (§3.4 already says so) and a federated namespace registry would make identity depend on an online authority, which is the error ADR-0012 exists to avoid. Plus the collision rule the current text has no room for: two domains federating MUST establish prefix disjointness, and a collision is a **reportable defect** that blocks attribution, never a silent merge. The KCB half is discharged by MA-8's `served_by` attribution, which is what makes a collision *representable*. **Not written:** an authority-scoped prefix form (the scenario's option (ii)) — it would change the shape of every identifier in the fabric to represent a condition the collision rule makes reportable at federation time. |
| **MA-8** | Med | **FOLD** | [KCB](../../specs/capability-bus.md) **§3** (the `find` response) + **§3.1(c)(e)(f)** | Give the response a shape, which is the delta verbatim: per-entry `served_by` (the serving peer's KINP id) and `observed_at`, plus a result-level `incomplete[]` naming unreachable peers. Three of §3.1's six clauses are asserted with nothing to carry them; this is mechanization of clauses already normative, not new obligation. Additive — no manifest field moves, and a single-registry deployment emits none of it. **Not written:** a ranking or trust weighting over `served_by`, which §3.1(d) deliberately refuses. |
| **MA-9** | Med | **FOLD** | [KCB](../../specs/capability-bus.md) **§3.1(b)** and **§3.1(d)** | Two sentences. (b): a forwarded `find` carries a **query id and a remaining hop count**, and a registry drops a query it has already seen — the horizon peering has none of. (d): the **converse** of never-silently-reconcile — entries resolving to the same provider KINP id, `(name, version)` **and** `schema_id` are **one** entry with multiple attributions, not two capabilities. Per the correction above, this completes a case (d) already half-covers. **Not written:** a peering topology, a federation membership protocol, or any bound on how peers are configured. |
| **MA-10** | Med | **FOLD** (split — see DEFER-C) | [KMI](../../specs/media-interchange.md) **§7.1(f)** | A store MUST be able to answer **not held, and not expected** distinctly from **not reachable**. That single distinction is what makes *pending* falsifiable: a consumer polling the reachable set can now conclude for that set instead of waiting forever. (f)'s substance is untouched and correct — an unreachable store still invalidates nothing. **Not written:** any durability mandate, minimum replica count, or retention obligation — koine specifies contracts, not operations — and not the optional *designated durable holder* the scenario proposes → **DEFER-C**. |
| **MA-11** | Cleanup | **CLOSE** | [KCS](../../specs/conformance-scenario.md) — no change | Already discharged where it lands. The scenario filed it as **evidence for KCS open question 1**, not as a demand on the spec, and §7 open question 1 **already cites MA-11 by name** alongside V-8 as the escape hatch being used as designed — by two different authors, reported as declared console extensions rather than smuggled into §5. No clause is contradicted, no version moves, and folding an authority-boundary vocabulary into §5 now would pre-empt the very question the evidence feeds. Its resolution is itself reactive and belongs to whoever takes up open question 1. |

**Count: 10 FOLD, 1 CLOSE, 0 whole-finding DEFER, 3 deferred remainders.** Every blocking finding
(MA-1…MA-6) folds. No finding is dismissed as a scenario error — the pass was accurate, and the two
corrections above are refinements to its framing, not defects in its findings.

---

## The deferred remainders, and what would force each

Each of these is a *second* mechanism the scenario proposes beside the one the break forces. Each is
a real gap. None is forced by what happened, and each names the break that would force it.

| # | From | What is deferred | What would force it |
|---|---|---|---|
| **DEFER-A** | MA-2 | A control-plane route by which a world's **inherit-as-identity mode** crosses an authority boundary — a discovery-time lookup, in KCB §3/§4 or KINP §8. | **A pass showing the fail-closed branch does not degrade gracefully** — i.e. that cross-authority reconciliation of candidates whose world is genuinely resolvable-in-principle piles into the §11 decision 2 review queue with no path to drain it. Today it degrades rather than stopping: same-domain reconciliation is untouched, and a cross-domain candidate whose world the consumer *can* resolve still auto-applies. And the route is not one line — the operand's holder is found by **namespace**, and no §3 query is by namespace, so building it means either a new query axis or MA-7's registry becoming a lookup surface. That is more machinery than the break bought. |
| **DEFER-B** | MA-3 | A **federation-scoped canonical form**: re-expressing a claim against §4.4's shared external anchor (`wikidata:…`) so two domains hash one fact identically. | **A pass showing the domain-scoped answer plus the §4 equivalence view is insufficient for a real consumer** — cross-domain dedup that a query-time view cannot do at all, rather than does more expensively. Note what an anchor-based canonical would cost if taken: to converge it must be **mandatory** wherever an anchor exists (an optional canonical form converges nothing), which changes what claims are hashed against and moves ids — the opposite of additive. It also only ever covers the anchored subset. That is a redesign, and this pass explicitly found that **none** of the eleven requires one. |
| **DEFER-C** | MA-10 | An asset reference **naming a designated durable holder** (a §2 envelope field or a §7.1(b) obligation). | **A pass showing the three-valued answer is not enough to conclude** — a case where every reachable store correctly answers *not held, and not expected* yet the consumer still cannot act, or where the answer itself is unavailable because no store ever knew of the asset. A store that never knew is exactly the *not expected* case, so the gap is currently theoretical; a break would make it concrete. |

---

## Where each fold lands, and what it costs the spec

Intent, for US-2 to execute and record. Version numbers here are a plan; the spec header and its
changelog are the authority once written.

| Spec | Folds landing | Version intent | Status |
|---|---|---|---|
| **KINP** 0.3.0 | MA-1, MA-2, MA-3, MA-4, MA-7 — §3.4, §4.1, §4.2, §4.5, §5, §6 | **0.4.0** (minor). Additive in behaviour, but it adds a normative branch to §4.5, a consumer obligation to §4.1, a new equivalence relation, and a scoping statement to §6. Four of its six touched sections are normative surface a reader implements against. | Stays **Candidate**. New normative text re-enters validation; the fold does not clear its gate on its own — see US-3. |
| **KMI** 0.3.4 | MA-5, MA-10 — §2, §7.1(d)(e)(f) | **0.3.5** (patch), following the standing constraint that **0.4.0 is spent** on §4.4's EDL removal (KCB §7.3c forbids declaring and removing in the same publication) and the established KCB precedent that additive-optional normative text lands as a patch when the next minor is reserved. `license`/`egress` are optional on read and write; a single-store deployment behaves exactly as at 0.3.4. | Stays **Candidate**. |
| **KCB** 0.4.8 | MA-6, MA-8, MA-9 — §2 (`auth`), §3, §3.1(b)(c)(d)(e)(f), §5 | **0.4.9** (patch), on the same reasoning KCB used at **0.4.6** (six normative §3.1 clauses, patch), **0.4.7** and **0.4.8** (every field optional, patch): **0.5.0 stays spoken for** by §2.2's standalone-manifest removal, which a fold must not force early. | Stays **Candidate** — four of its five counts are untouched by this fold. |
| **KGP** 0.5.2 | None — see below | **No version moves.** | Unchanged. |
| **KCS** 0.3.0 | None — MA-11 is CLOSE | **No version moves.** | Unchanged. |

### Why KGP does not move

The scenario names KGP a consequence surface and says whoever folds MA-3/MA-4/MA-5 answers for it.
The answer is that all three readings belong in **KINP or KMI**, and putting them there is not
avoidance — it is the repo's own rule that *identifiers, envelopes, and resolution semantics are
defined once in KINP and referenced, never redefined, by other specs*:

- **MA-3** (claim-id convergence, KGP §3.3) — §3.3's convergence property is **correct and intact**;
  the scenario's Step 4 records that normalization never wavered and produced byte-identical
  canonical forms across TSV and every §4 projection. What it lacked was a cross-domain target, and
  the target is an *identity* question, which §6 of KINP owns and answers.
- **MA-4** (KGP §7's `world = consensus-reality` filter) — the filter's referent is a **world id**,
  which KINP §5 defines. Once §4.2's equivalence layer ranges over worlds, the filter reads over
  that closure and has a federated reading without KGP restating it.
- **MA-5** (KGP §7.1/§7.2 classes as the missing operand) — KMI **reuses** the classes on the §2
  envelope and cites KGP for their meaning. No KGP clause changes: egress stays enforced at pack
  construction for knowledge records, and KMI states separately where it is enforced for bytes.

KGP is at `candidate` on **one** remaining item — a downstream round-trip fixture
([`promotability.md`](promotability.md)) — and adding normative text here would add a **second**
gate to the spec closest to promotion, to restate semantics another spec already owns. The
appropriate record is a dated **Editorial** changelog entry citing this page and the three readings,
which moves no version and adds no gate. US-2 writes it.

---

## What the fold does to promotability

Plainly, because two specs were held at `candidate` partly by these deltas and a reader should not
have to infer the effect: **the fold clears the federation half of nobody's gate.** Not KINP's, not
KMI's, not KCB's. A fold does not close its own gate — new normative text re-enters validation — so
in every case the count **changed shape rather than closing**, from *fold the deltas* to *re-run the
pass against the folded text*.

| Spec | Was the fold the whole of its federation gate? | What the count reads as now | Promotable? |
|---|---|---|---|
| **KINP** | Yes — MA-1/2/3/4 (blocking) + MA-7 were the entirety of its **only** re-ratification count. | A re-run of [`e2e-multi-authority.md`](../../scenarios/e2e-multi-authority.md) against the folded text: **Steps 2, 3, 4 and 6 must flip**, Step 1 is the regression set. | **No.** But nothing else stands in the way — no second count, no fold outstanding, no koine-side deliverable. One clean re-run is the whole of the prose leg. |
| **KMI** | Only for count (i). MA-5 (blocking) + MA-10 were §7.1's whole gate; KMI's **second** count is the [`e2e-media-transform.md`](../../scenarios/e2e-media-transform.md) re-run, which is **KCB's** work and untouched here. | A re-run of **Steps 8–10** against the folded text. | **No**, and it would not be even on a clean re-run — count (ii) is not KMI's to discharge. |
| **KCB** | Only for count (iii) of five. | A re-run of **Steps 5–7**. | **No.** Four other counts stand, one of them [`86`](../../tasks/chief/86-fold-the-capability-versioning-breaks.json)'s fold, two of them also failing the conformance gate (**DR-12**, **DR-13**). |
| **KGP** | It had no federation gate. MA-3/MA-4/MA-5 read *through* KGP and are answered in KINP and KMI by the define-once rule. | Unchanged — one downstream round-trip fixture. | **No**, for a reason that has nothing to do with federation. |

**And the re-run is unowned.** No tasklist in any repo owns it: `53` wrote and ran the pass and is
retired, `85` folded what it broke and ends here. Three specs' counts now sit on one hand-walk of one
document that nobody has picked up. That is the honest state and it is recorded as such rather than
parked against a tasklist that would make it look scheduled.

**The ladder is not kept here.** [`promotability.md`](promotability.md) is the one place that ranks
what stands between each spec and `ratified`, and its rows for KINP, KMI and KCB were updated with
the above rather than a second ranking being started on this page — a fourth unchecked mirror is
exactly what that page warns against. Nothing is promoted from here: promotion is the owner's act
against that page.

---

## Coordination with the sibling fold

[`86-fold-the-capability-versioning-breaks`](../../tasks/chief/86-fold-the-capability-versioning-breaks.json)
folds KCB's **V-1…V-8** into the same spec. Where federation and capability versioning meet — a
capability advertised across an authority boundary is both — the two folds must agree. The
constraint this page fixes on its side, so 86 can plan against it:

- **The KCB minor stays reserved.** MA-6/MA-8/MA-9 land as a **patch** (0.4.9) and do **not** consume
  0.5.0, which is owed to §2.2's standalone-manifest removal and is where V-1…V-8 are already
  expected to land. This fold takes nothing 86 needs.
- **The §3 `find` response gains a shape (MA-8).** V-1's finding is the same class — a clause with no
  carrier — so 86 should extend that shape rather than mint a second response envelope.
- **`auth.accepted_issuers[]` is additive and optional (MA-6),** sitting beside `grants_required`; it
  does not touch §7.1's `schema_id` digest, §7.2's compatibility table, or the `(capability, major)`
  grant binding V-4/V-5 bear on.

**Amended 2026-08-26, after the fold landed and the base moved.** Three things changed under this
section between its writing and the fold, and `86` should plan against the amended version:

- **KCB is at 0.4.9, not 0.4.8.** While this branch was open, `chief/71` independently landed
  **KCB 0.4.8** — normative **§4.3**, autonomy posture across an ownership boundary
  ([ADR-0013](../../decisions/ADR-0013-autonomy-posture-boundary-clause.md)) — taking the patch
  number this fold had planned for. The federation fold renumbered to **0.4.9**. **0.5.0 is still
  reserved and still unspent**, so the constraint above is unchanged in substance: `86` gets the
  minor. The lesson is worth carrying, because `86` is about to be the third fold in the same
  queue — *the reserved-minor convention pushes every fold onto the same next patch, and nothing in
  CI catches two branches claiming it.* Diff the version cell against `git show main:specs/capability-bus.md`
  before assuming a merge was textual.
- **KCB now carries five re-ratification counts, not three.** `86`'s US-1 asks which of "the three
  counts currently holding KCB at Candidate" its fold clears. The answer set has grown: (i) the
  media-transform re-run, (ii) §7.5 — **`86`'s own**, (iii) §3.1 — folded here, now a re-run,
  (iv) §4.2 subscription backpressure, (v) §4.3 autonomy posture. `86` clears **(ii) and only
  (ii)**, and even then only after a clean re-run of
  [`e2e-live-schema-mutation.md`](../../scenarios/e2e-live-schema-mutation.md). Counts (iv) and (v)
  additionally fail the **conformance gate** — their scenarios have no KCS encoding (**DR-12**,
  **DR-13**) — so *KCB is not promotable on any fold, by either tasklist*, and `86`'s US-3 should
  say so plainly rather than discover it late.
- **§4.3 landed between the two folds and adds a surface both must respect.** `effect` sits
  **outside** the `schema_id` digest, exactly as `cost` (§5) and `volume` (§4.2a) do. **V-1**'s
  digest-blindness fold must not pull it in: the three envelope operands are outside the digest by
  the same reasoning — price, rate and reversibility are not *shape* — and a fold that digests one
  of them re-digests every contract that declares it.

One near-miss worth naming, because it is the exact class of contradiction this section exists to
catch. **MA-9's de-duplication converse keys on `(provider KINP id, (name, version), schema_id)`** —
and `version` is precisely what **V-4** (no address for a second major) and **V-5** (no version
operand at invoke) are about. The two folds do **not** conflict, but only because `version` is *in*
the key: two majors of one capability stay two entries under MA-9, which is what V-4 needs. Were
`86` to simplify that key to `(provider, name, schema_id)` — a plausible tidy-up, since a differing
`schema_id` already separates them in most cases — it would collapse two majors into one entry with
"multiple attributions" and silently undo V-4 at the discovery layer. **Do not drop `version` from
the key.**

A conflict found later between the two folds is itself a finding worth an ADR, not a quiet
reconciliation inside one of them.

**Amended 2026-08-26, after `86` landed and the cross-read ran.** The read is
[`fold-coordination-federation-versioning.md`](fold-coordination-federation-versioning.md), and it
checked this section's constraints rather than inheriting them. **All three hold**: the KCB minor was
still unspent when `86` took it for 0.5.0; V-4's transport `binding` extends the entry MA-8's `find`
response already carries rather than minting a second envelope; and `auth.accepted_issuers[]` is
nowhere near §7.1's digest or §7.2's table. **The named near-miss is clear** — §3.1(d)'s converse is
byte-unchanged at 0.5.0 and `version` is still in the key. One finding came back, against **this**
fold's clause rather than `86`'s: §3.1(d) keys on `(provider KINP id, (name, version), schema_id)`, so
it merges away every operand the fabric deliberately keeps *outside* the digest — and §7.3's deprecated
marking, which has no carrier and no §7.2 bump row, is the one of those that is a **gate**. Recorded as
[ADR-0014](../../decisions/ADR-0014-federated-merge-merges-attributions.md), which lands with counts (ii)
and (iii) rather than in either fold's version. That is the rule this section states, applied to this
section.

---

## What the pressure test taught about the pattern, not the clauses

The clause-level findings are above. This section records the thing that outlives them, because it
is the part that would have to be re-learned the next time three specs defer one question.

**The setup.** KINP §11 decision 1, KCB open question 1 and KMI open question 3 were three
independent deferrals of one question — *is an authority a permanently privileged dependency, or a
role more than one peer can hold?* Each spec's note said the question mirrored its siblings' and
**would likely resolve the same way**; KCB's note still carries the follow-up sentence, *"It did."*
[ADR-0012](../../decisions/ADR-0012-federated-authority-roles.md) then decided it once for all three,
`52` applied it at three surfaces, and `53` attacked the result. So the prediction is testable, and
this is the pass that tests it.

**It held for the decision, and only for the decision.** ADR-0012's invariant — *an authority is a
role, not a hard dependency; a single holder stays conformant; federation is additive composition and
never a relay* — was attacked at all three planes and broke at none. The scenario's
*Not deltas* paragraph is the evidence, and it is three-for-three: **offline-first minting** survived
both authorities being gone, including the world-stamp back door (KINP); **asset identity** stayed
byte-stable across stores under re-minting, corruption and copy-substitution attacks (KMI); and
**route-by-lookup-not-proxy** survived the case built specifically to break it — a peer reachable
only from inside its own domain — leaving an honest *unreachable* rather than a silent proxy (KCB).
Not one of the eleven findings requires a redesign, which is the same result read from the other
side. The shared ADR was the right instrument and picking option (c) was right.

**It did not hold for the applications, and the failure modes were not even the same kind.** This is
the finding worth keeping. Sort the ten folded deltas by the plane they landed on and each plane broke
on the thing *its own* plane is about:

| Plane | Deltas | Blocking | What kind of failure |
|---|---|---|---|
| **KINP** | MA-1, MA-2, MA-3, MA-4, MA-7 | 4 | **Meaning.** What a merged closure *is* (MA-1), which relation to emit when an operand is missing (MA-2), what a claim id converges *on* (MA-3), what "the real world" denotes when there are two of them (MA-4), which namespace is global (MA-7). Every one is a question about what a term means across a boundary. |
| **KCB** | MA-6, MA-8, MA-9 | 1 | **Carriage and bounds.** Three of §3.1's six clauses were correct and had **no field to carry them** (MA-8); a grant had no issuer to name (MA-6); a forwarded query had no horizon and a merged result no de-duplication key (MA-9). The rules were right; nothing conveyed them. |
| **KMI** | MA-5, MA-10 | 1 | **Decidability at the far holder.** §7.1(e)'s egress gate was correct and had **no operand** (MA-5); §7.1(f)'s *pending fetch, never a broken identifier* was correct and **unfalsifiable** (MA-10). The rules were right; a second holder could not evaluate them. |

Meaning, carriage, decidability. **No plane's breaks would have been found by pressure-testing
another plane**, and no plane's fold substitutes for another's. "Likely resolve the same way" was
true of the *decision* and false of the *application* — and the specs' deferral notes did not
distinguish the two, which is what made the prediction read as stronger than it was.

**The severity distribution says the same thing, and inverts the obvious guess.** The shortest
application took the worst damage. KINP's federation edit was a **decision paragraph** in §11 plus a
sentence in §3; KCB §3.1 and KMI §7.1 are full lettered normative sections. Yet KINP took **five**
findings and **four of the six blocking ones**, while KCB took three (one blocking) and KMI two (one
blocking). Length was not the variable. What tracked was **how much of the plane's semantics the
authority boundary passes through** — and identity is the plane every other plane's terms are
expressed in, so every ambiguity there surfaces everywhere. A future shared fold should expect the
keystone plane to absorb most of the breaks and should budget the deepest reading there, whatever the
size of the edit.

**A shared decision does not license parallel drafting.** MA-8's own words are that §3.1's clauses
were *"asserted, not mechanized"* — three of six had no carrier in §3's `find` response. That is what
a section written to mirror a sibling's structure looks like when the sibling's plane already had a
carrier and this one did not. The correct discipline, and the one the fold applied in reverse: after
adopting a shared decision, **re-read each plane's application against that plane's own existing
surfaces**, not against its siblings' sections. It is the sibling-shaped section that hides the
missing field.

**The define-once rule is what made eleven cross-plane findings foldable at three specs.** Seven of
the eleven name more than one spec in their delta — MA-2 (KINP + KCB), MA-3 and MA-4 (KINP + KGP),
MA-5 (KMI + KGP), MA-6 (KCB + KMI), MA-7 (KINP + KCB), MA-10 (KMI + KCB) — and every one folded at
**exactly one** spec, with the others inheriting by citation. **KGP moved no version at all** despite
being named in three of them. A cross-plane finding is not an obligation on every spec it names; it
is an obligation on the one that *defines* the thing, and the rest cite. Had each named spec folded
its own half, this pass would have produced roughly seventeen clauses instead of ten, in three places
that could then drift.

**And the pattern needed one exception it did not predict.** ADR-0012 says an authority is a role, not
a hard dependency — and MA-7 found the one authority where the honest answer is that it *is* a shared
commons: §3.4's namespace-prefix registry, which §3.1(c)'s attribution and §3.1(d)'s merge both
assume is globally unique. Federating it would make a collision representable at the cost of changing
every identifier's shape; leaving it unstated let two domains hold one prefix in good faith. The fold
states it as **deliberately non-federated**, with prefix-disjointness and collision-is-a-reportable-defect.
A pattern of this kind should be expected to have exactly this sort of exception, and to be asked for
it explicitly: *which authority in this plane is not a role?*

**What bounds all of the above.** **DR-9** — every live slot in the 2026-08-24 run sat in domain **A**;
domain **B**'s authority and both CAS stores were stand-ins. So the properties that depend on the far
authority being *independently operated* — MA-2's missing operands, MA-8/MA-9's peer attribution —
cannot be distinguished here from a fixture that simply did not model them. Closing that needs a
**second adopter**, not a document change, and no re-run of this scenario supplies it.
