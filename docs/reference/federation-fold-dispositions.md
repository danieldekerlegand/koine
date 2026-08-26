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

This page is the **first half** of the fold: what each of the eleven gets, decided and reasoned
**before** a clause is touched. It changes **no clause and no version** — deciding what to fold and
folding it are different acts, and conflating them is how a fold overreaches. The second half (the
edits themselves) is [`85-fold-the-federation-breaks`](../../tasks/chief/85-fold-the-federation-breaks.json)
US-2, which lands each **FOLD** row below and nothing else.

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

A conflict found later between the two folds is itself a finding worth an ADR, not a quiet
reconciliation inside one of them.
