# The capability-versioning fold — a disposition for each of V-1…V-8

> **Status:** Current · **Updated:** 2026-08-26 · **Owner:** koine · **Informative**

[`../../scenarios/e2e-live-schema-mutation.md`](../../scenarios/e2e-live-schema-mutation.md) — the
break-test [KCB §7.5](../../specs/capability-bus.md#75-pressure-test-for-this-section) asked for by
name, written and run by `chief/54`…`chief/56` — drove a capability through a full release cycle
(widen, re-price, edit-without-a-bump, ship a successor, deprecate, remove) while a subscriber stayed
live throughout, and came back with **eight findings, four of them blocking**. When this page was
written nothing had been folded and [KCB](../../specs/capability-bus.md) still described the
pre-break design at 0.4.9; **count (ii)** of the five holding it at `candidate` *is* these deltas.
**The fold has since landed — KCB 0.5.0, 2026-08-26** — and count (ii) is now a re-run of that pass
against the folded text. This page is retained as the *reasoning* that decided each fold's extent,
not as a record of the spec's state.

This page is the **first half** of the fold: what each of the eight gets, decided and reasoned
**before** a clause is touched. It changes **no clause and no version** — deciding what to fold and
folding it are different acts, and conflating them is how a fold overreaches. The second half (the
edits themselves) is
[`86-fold-the-capability-versioning-breaks`](../../tasks/chief/86-fold-the-capability-versioning-breaks.json)
US-2, which lands each **FOLD** row below and nothing else.

**What this page is not.** It binds no clause, and it is not a status mirror — each spec's own header
is the authority on its version and status ([`../../specs/README.md`](../../specs/README.md)). The
version landing-zone named in *Where each fold lands* is **intent**, not a record; the changelog entry
US-2 writes is the record.

---

## The rule this page applies

`scenarios/`' standing policy is that an open question is folded **only when a pressure break forces
it**, never speculatively. Eight breaks are eight forcings — but *forced to what extent* is a
separate question from *forced at all*, and it is the one that decides what this contract costs.
KCB is the most-implemented plane in the fabric; a clause added beyond the forcing is paid for by
every router already built against it.

So each finding is classified as exactly one of:

| Disposition | Means |
|---|---|
| **FOLD** | A clause changes. Named spec, named section, and the extent stated — including what is deliberately *not* written. |
| **CLOSE** | No clause changes: the break is already covered by an existing clause read correctly, or already discharged where it lands, or the scenario was wrong. The reasoning is recorded, not the absence. |
| **DEFER** | Genuinely reactive: a real gap that no break has yet forced. **A DEFER states the future break that would force it.** "Not now" without a trigger is how an open question becomes permanent. |

A finding may be **split** — the half the break forces is folded and the remainder deferred with its
own trigger. Three of the eight split that way (V-7, V-6, V-2), and each of the three splits is a
case where the scenario's *Delta* column proposes two or three mechanisms and the break itself
demands one.

---

## First: verifying the attributions rather than inheriting them

The tasklist says V-1…V-8 are recorded against KCB and that three counts hold it at Candidate. The
first is **correct with one exception**; the second is **out of date**. Both checks are worth their
cost, because what a reader of the spec meets is the spec's own record, not the tasklist's summary:

| Spec | What its own text records | Verified |
|---|---|---|
| [KCB](../../specs/capability-bus.md) | §7.5's closing paragraph: deltas **V-1…V-8**, of which **V-2, V-4, V-5 and V-7 are blocking**; §7's *model* is not in question and its *perimeter* is; the fold is a **minor — 0.5.0**, the version §7.3 already schedules for §2.2's removal. | ✅ as recorded. |
| [KCS](../../specs/conformance-scenario.md) | §7 open question 1 cites **V-8 by name**, alongside MA-11, as evidence that the escape hatch works as the question imagines — *"both sets were built as declared console extensions and reported as such."* | ✅ — which is why V-8 is the one **CLOSE** on this page. |
| [KMI](../../specs/media-interchange.md) / [KFT](../../specs/fine-tuning.md) | Nothing. The scenario records KMI **untouched** and KFT **untouched with one confirmation** (§11.5's archival-pin pointer, vindicated by Step 11). | ✅ — and neither moves here. |
| [`../../schemas/`](../../schemas/) | Nothing, by construction: koine ships **no machine-readable twin of the KCB card extension**. The three twins that exist are data-plane document shapes and no step of the pass reads or writes one. | ✅ — see *Where each fold lands*: no schema twin moves. |
| [`../../registry/`](../../registry/) | Nothing today. V-2's scenario text proposes a **shape registry** as one of two candidate folds — the only finding that would touch this surface. | ✅ — and that route is **rejected on the record** below, so the registry does not move either. |

Three corrections to the framing this fold inherits, found by reading the clauses rather than the
findings:

1. **There are five counts, not three.** The tasklist was written against KCB 0.4.6. Since then
   0.4.7's §4.2 and 0.4.8's §4.3 each added one, and 0.4.9 folded the federation deltas into §3.1/§5
   without closing count (iii). All five are enumerated in *The five counts* below;
   [`promotability.md`](promotability.md) already records the number as five and is the mirror of
   record.
2. **The scenario's own regression set mis-files Step 3.** *What a clean pass would license* says
   *"Steps 2, 3, 4, 6 and 11 held and are the regression set"* — but Step 3 carries 🔴 **V-1**. What
   held at Step 3 is the **digest exclusion** (a re-price does not re-digest, and must not); what
   broke is the **quote**. Both are true of one step, and a re-run cannot treat Step 3 as pure
   regression while V-1 is open. Recorded here rather than silently worked around: the step is a
   regression check for the exclusion **and** a flip check for the quote.
3. **V-8's "no demand on a ratified spec" is stale.** KCS was `0.2.0, Ratified` when the pass ran and
   is **0.3.0, Candidate** today. The disposition does not change — but the *reason* does: V-8 is a
   CLOSE because open question 1 already holds it as evidence and the escape hatch is proven in a
   real run, not because a ratified spec is off limits.

---

## The five counts, and what this fold does to each

US-1's third criterion. **This fold clears none of them** — a fold does not close its own gate, the
rule [`85`](../../tasks/chief/completed/85-fold-the-federation-breaks.json) established and this page inherits.
What it does is change the *shape* of exactly one:

| # | Count | Source | What this fold does to it |
|---|---|---|---|
| **(i)** | Re-run [`e2e-media-transform.md`](../../scenarios/e2e-media-transform.md) against the 0.3.0 AgentCard-extension manifest shape | KCB 0.3.0 (§2), outstanding since 2026-07-22 | **Restated, does not move.** V-4's transport binding lands in §2, so the re-run reads a manifest with one more optional field — additive, and the discovery legs that count (i) exercises are unchanged. |
| **(ii)** | A **clean** §7.5 mutate-live-schema break-test | KCB 0.4.0 §7.5 | **Changes shape.** Today it reads *"fold the deltas, then re-run"*; after US-2 it reads **"a re-run of Steps 3, 5, 7, 8, 9 and 10 against the folded text"**, with Steps 2, 4, 6 and 11 as the regression set. Still open, and **still unowned after this tasklist** — US-2 folds; nobody re-runs. |
| **(iii)** | §3.1 registry peering — re-run of [`e2e-multi-authority.md`](../../scenarios/e2e-multi-authority.md) Steps 5–7 against 0.4.9's folded text | KCB 0.4.6 §3.1 | **Restated, does not move** — but it is the count this fold must be read against, because a capability advertised across an authority boundary is governed by both. See *Where this fold meets the federation fold*. |
| **(iv)** | Re-run of [`kcb-subscription-firehose.md`](../../scenarios/kcb-subscription-firehose.md) against the folded §4.2 | KCB 0.4.7 §4.2 | **Restated, does not move.** V-7 rides §4.2d's control channel rather than minting a second, so the fold adds frame types to a channel that count (iv) already exercises — it does not re-open §4.2's own operands. |
| **(v)** | Re-run of [`kcb-cross-owner-posture.md`](../../scenarios/kcb-cross-owner-posture.md) against the folded §4.3, plus [ADR-0013](../../decisions/ADR-0013-autonomy-posture-boundary-clause.md)'s **W3** second-independent-implementation condition | KCB 0.4.8 §4.3 | **Restated, does not move.** §4.3a already states that a fold of V-7 carries deprecation and removal on §4.2d's channel; this fold satisfies that forward reference rather than disturbing it. |

**And one consequence for count (ii)'s artefact gate that this fold creates.** Count (ii) is the one
KCB count that *has* a KCS encoding — `kcs:live-schema-mutation`, run 2026-08-24. But **DR-7** records
that it came back `green` over all four blocking deltas, because *"the encoding deliberately does not
assert an unfolded delta."* So re-running today's encoding against the folded text proves nothing
about the fold: it asserts the subset that held. **The encoding must be extended to assert the folded
behaviour**, and V-8 is the standing warning about what that costs — four of the pass's ten
assertions have no KCS §5 predicate and the run already declared five console extensions. US-2's
conformance case is therefore an extension of that encoding through KCS's escape hatch, not a re-run
of it. That is not a sixth count; it is what makes count (ii) discharge*able*.

---

## Dispositions

| # | Severity | Disposition | Extent |
|---|---|---|---|
| **V-2** | **Blocking** | **FOLD (split)** | The digest route only: knowledge ports get an optional `payload_schema_id`, and a bare `shape` name is normatively **not** a cross-check. The shape-registry route is **rejected on the record**. |
| **V-4** | **Blocking** | **FOLD** | An optional per-entry **transport binding** in `params.capabilities[]`. Nothing about the capability *name*, discovery, or the digest moves. |
| **V-5** | **Blocking** | **FOLD** | An optional version/range operand on `invoke`; the granted major travels **in** the token; no-operand resolves against the grant and **refuses for want of one** rather than defaulting. |
| **V-7** | **Blocking** | **FOLD (split)** | Deprecation/removal frames on **§4.2d's existing channel**, and the producer's duty to emit them — for an open `subscribe` only. Cadence and TTL are deferred. |
| **V-3** | Should-fix | **FOLD** | The canonicalization **rule id** joins the algorithm in the digest prefix; an unrecomputable digest reads *no cross-check available*, never *mutated*. |
| **V-6** | Should-fix | **FOLD (split)** | The floor is raised for a retiring **capability major** only, on the axis's own unit. `deprecated_at` is deferred. |
| **V-1** | Cleanup | **FOLD (minimal)** | One optional `invoke` operand — the quoted cost the caller gated against — and a refusal that names *quote mismatch*. |
| **V-8** | Cleanup | **CLOSE** | Already discharged where it lands: KCS §7 open question 1 cites it by name and the escape hatch is proven in a real run. No KCB clause, no KCS version. |

### V-2 — the digest is blind on knowledge ports · **FOLD (split)** · KCB §7.1, §2.1

**Forced, and blocking.** A `knowledge` port's shape keys are `dialect`, `worlds` and `shape`
(§2.1), and `shape` holds a **free-form name**. Redefining the payload behind an unchanged name
produces a byte-identical digest at an unchanged `version` — the exact failure §7.1 exists to make
impossible, surviving on the cross-plane leg (delta F) the fabric's thesis is about. Media ports are
protected because a `media_type` names an externally-standardized format; entity ports because
`types` are registry-controlled. Knowledge ports have neither property.

**What is folded.** Two things, and the first matters more than the second:

1. **A bare `shape` name is not a cross-check.** Normatively: a knowledge port declaring `shape` and
   no payload digest establishes the port's *routing* identity and **not** its payload identity, and
   a consumer MUST read it as §7.1's own *no cross-check available* default rather than as
   *unchanged*. This converts a **silent** break into a **declared absence**, which is the whole of
   what the pass demands — `analyzer` did not fail because it lacked a digest, it failed because it
   believed the digest it had covered the payload.
2. **An optional `payload_schema_id`** on a knowledge port, over the participant's own canonical
   declaration of that payload, so a provider that wants the cross-check can publish one. Optional on
   read and write, and inside the §7.1 canonicalization as a shape key (unlike `cost`, `volume` and
   `effect`, this **is** shape).

**Rejected on the record — the shape registry.** The scenario's cheaper-looking option was to make
`shape` names registry entries with immutable signatures, on the identical rule as a relation. It is
rejected for two reasons that only became visible after 0.4.6/0.4.9:

- **It would mint a second non-federated commons.** [KINP §3.4](../../specs/identity.md) states that
  the prefix registry is *"the one deliberately non-federated commons"* (MA-7), and under
  [ADR-0012](../../decisions/ADR-0012-federated-authority-roles.md) every other authority role
  federates. A global shape registry is a commons two authority domains must agree on before they can
  exchange a knowledge port — which is precisely the dependency §3.1 was written to avoid.
- **It contradicts ADR-0007.** A payload shape is authored by the participant that implements the
  capability; participants are **self-describing**, and their declarations ride their own cards. A
  digest over the participant's own declaration needs no third party; a registry entry needs one for
  every shape anyone ever names.

*Re-open trigger:* a break in which two participants in **different authority domains** independently
mint the same `shape` name for incompatible payloads and neither publishes a `payload_schema_id` —
i.e. the collision case MA-7 solved for prefixes, reproduced for shapes. Then a commons is forced and
this rejection is wrong.

**Not folded:** no registry file, no schema twin, no change to media or entity ports, and no
obligation on a provider to publish a payload digest. The obligation added is on the **reader**.

### V-4 — the second major has no address · **FOLD** · KCB §2, §4, §6

**Forced, and blocking; and it cannot be folded apart from V-5.** §7.2 mandates that a provider serve
both majors for a transition window, and the transport KCB chose cannot represent it: an MCP tool
namespace is flat and name-keyed, so `tools/list` cannot return two tools called `compose`, while
§7.1 forbids the name-mangling that would fix it and §2 carries one `params.mcp` field. The contract
layer and the transport layer disagree, and §6 does not reconcile them.

**What is folded.** Each entry in `params.capabilities[]` MAY carry an optional **transport binding**
— the tool name and/or endpoint that major is invocable at — which a consumer **reads from the
manifest and never guesses**. The distinction that makes this consistent with §7.1 is that there are
two namespaces and only one of them is governed by the ban on version-in-the-name:

- the **capability name** is what the registry matches and what a subscriber searches for; it MUST
  NOT carry a version, and §7.1 is unchanged, because a successor hiding under a different *name* is
  invisible to the party that needs it;
- the **transport binding** is a local addressing detail nobody discovers by. A provider may serve
  major 2 at a tool id of its choosing precisely because no consumer ever guesses it.

It is **not shape**: it addresses a capability, not a port, so §7.1's canonicalization and every
published `schema_id` are untouched. Absent, a provider serves one major at the single `params.mcp`
address exactly as it does at 0.4.9.

**Not folded:** no requirement to serve two majors at two endpoints, no naming convention for
transport ids, no registry field (the registry indexes what the card carries and needs no rule of its
own), and no change to §7.1's ban.

### V-5 — nothing carries a version at invoke · **FOLD** · KCB §4, §5, §7.2

**Forced, blocking, and the finding this whole fold is named for.** §5's rule is right — a grant binds
to `(capability, major)`, `invoke:compose` issued at major 1 does not authorize major 2, fail closed —
and it **has no operand**. The token is version-free by design (§5 says so explicitly, and the reason
is good: encoding the major into the grant name fragments authorization the way `compose-v2`
fragments discovery). `invoke` defines no version argument. The card offers both majors under one
name. So a provider must choose a major for a version-free call, and the scenario's table shows every
available default failing: *highest published* inverts fail-closed into **fail-open** and bills a
v1-granted caller at v2; *lowest* makes the successor unreachable forever; *whatever the grant says*
is correct and the provider does not hold the issuance record.

**What is folded**, three clauses that must land together:

1. **An optional target version or range operand on `invoke`** (§4), in the operand shape §4.2b
   established and §4.3b reused — a consumer that pins says so on the wire.
2. **The granted major travels in the token** (§5). The grant's `invoke:<capability>` **form is
   unchanged**, so §5's anti-fragmentation argument is untouched; what changes is that the issuance
   fact §5 already describes becomes readable by the party that enforces it.
3. **The resolution rule, stated so that two implementations cannot differ** (§4/§7.2). A provider
   resolves the target major from the operand where one is present, otherwise from the grant; where a
   call carries neither and more than one major is published, it MUST **refuse for want of one**
   rather than pick. A resolved major outside the granted major is refused at the gate — before the
   work, not after the bill.

The refuse-for-want-of-one shape is deliberately the **same** one 0.4.9 gave `budget_units` crossing
an authority boundary (MA-6): where a number or a name could mean two things and no party is entitled
to guess, KCB refuses rather than assumes. Reusing it is the point — under
[ADR-0001](../../decisions/ADR-0001-control-plane-topology.md) the registry returns an address and the
peers dial directly, so there is **no hub to arbitrate a disagreement about which major was meant**,
and a clause that leaves a default to the implementer produces a mismatch far from its cause.

**Not folded:** no token format, no issuance or rotation mechanism (§5's own stated boundary), no
version negotiation protocol, and no requirement that a caller pin.

### V-7 — no §7 signal reaches a live subscriber · **FOLD (split)** · KCB §7.3, §7.2

**Forced, blocking, and already half-answered by a later section.** Every §7 signal is pull-side and
the bus's most durable binding never pulls: `analyzer` learned of the removal by a dead stream, with
no misbehaviour anywhere. That violates ADR-0009's central invariant — *a subscriber never learns of a
break by failing*.

**Half of the fold already exists.** 0.4.7's **§4.2d** mints the in-band control channel in **both
directions** and says so normatively: *"A fold of V-7 MUST carry its deprecation and removal signals
on this channel rather than mint a second, parallel signalling mechanism."* §4.3a repeats the
constraint. So the transport is not this fold's to invent; what is missing is a **duty and a frame
vocabulary**.

**What is folded.** A producer serving a live `subscribe` against a `(name, major)` MUST emit, on
§4.2d's channel, the §7 events that bind that subscriber: the **successor's appearance**, the
**deprecation marking with its removal version**, and the **end of the subscription at removal** —
each before the fact it announces, not after. §4.2d's *ignore what you do not understand* rule makes
this additive: a subscriber that implements none of it is exactly as exposed as it is today and no
worse, and a producer that emits none is detectable rather than merely silent.

**Deferred: the other two options, and the binding the channel cannot reach — DEFER-D.** The scenario
offers a re-validation cadence and a TTL on the binding or grant. Neither is folded:

- a **cadence** works only if the declared window is trustworthy, which V-6 says it is not;
- a **TTL** is the most invasive of the three, touches §5's issuance, and buys nothing the frame does
  not, for a subscriber that has a stream.

But the boundary must be stated exactly, because the frame does **not** close V-7 in full. Step 1's
table names three binding forms, and §4.2d's channel exists on only one of them:

| Binding form | Reached by the folded frame? |
|---|---|
| An open `subscribe` (§4) | ✅ — this is what §4.2d is |
| A **discovery binding** — cached port shapes, no stream open | ❌ no channel exists |
| A **grant** (§5), which never expires | ❌ no channel exists |

*DEFER-D trigger:* a break driven through a consumer holding **only** a cached discovery binding —
one that discovered once, never subscribed, and invokes on a cadence of its own. The control frame
cannot reach it by construction, and a cadence or a TTL is then the only remaining mechanism. That
break is not this scenario's: `analyzer` held all three forms and the stream is what died.

### V-3 — the canonicalization is unversioned · **FOLD** · KCB §7.1, §7.2 (and §7.4's thread)

**Forced, and self-inflicted if left.** §7.1 step 1 keeps only the shape keys of §2.1's **current**
vocabulary, so any future minor that grows that table makes a provider and a consumer one minor apart
digest the same port differently — and §7.2 converts that disagreement into *silent mutation*, the
verdict it makes non-recoverable. Two conformant parties break each other. And *ignore unknown
fields* (which keeps the minor tier alive at the manifest layer) and *hash only the fields you know*
(which forks the digest at the canonicalization layer) cannot both hold of one key.

This is not hypothetical for this fold: **V-2 grows §2.1's knowledge-port vocabulary by adding
`payload_schema_id`.** Folding V-2 without V-3 would fire V-3 on publication day.

**What is folded.** §7.1 step 4's own principle — *"a future algorithm is a new prefix, never a
reinterpretation of this one"* — extended from the **hash** to the **key-set rule**. The digest
carries a canonicalization **rule id** alongside the algorithm; comparison is meaningful only between
digests computed under the same rule id; a digest whose rule id a consumer does not know reads as
**no cross-check available** (§7.1's own stated default), never as a defect and never as a mutation.
A `schema_id` carrying no rule id is read as the 0.4.x rule, so **every already-published digest keeps
its meaning** and the change is additive.

This also closes Step 11's 🟡 thread at no extra cost: an archival `schema_id` (§7.4) is
*interpretable* decades out only if the rule that produced it is known, and the rule id is what makes
it so. §7.4 needs no clause of its own — it is where the cost of not folding V-3 comes due, not a
second fold.

**Not folded:** no new hash algorithm, no re-digesting of published cards, no obligation to migrate.

### V-6 — the deprecation floor is not a floor · **FOLD (split)** · KCB §7.3b/c

**Forced, and narrowly.** §7.3c's *"at least one full minor"* is a real floor for a surface whose
version axis is published by **koine** on a public cadence — "removed at KMI 0.4.0" is a deadline a
consumer can plan against. It is a formality where the retiring party **authors the axis**:
`mediastore` declares `1.x` removed at `2.1.0`, which is conformant, and ships `2.1.0` the next day.
§7.3e forbids moving the declared version earlier and never forbids *arriving* at it sooner. The
distinction between the two kinds of axis is the thing §7.3b does not draw.

**What is folded.** The floor is stated per axis rather than once: for a retiring **capability major**
— an axis the counterparty publishes at will — the removal is no earlier than the successor's **next
major**, one full breaking-change cycle of dual service, which costs the provider something to reach.
§7.3c's *one full minor* is **retained unchanged** for every surface whose axis is a koine spec
version (a media type, a manifest location, an extension URI), which is where it was argued and where
it is correct. The three surfaces mid-window today (§2.2, §2.3, KMI §4.4) are all of that second kind,
so **none of their declared removal versions moves**.

**Deferred: `deprecated_at` — DEFER-E.** The scenario's second option makes the declared *span*
observable rather than only its endpoint. It is not forced, because a subscriber can already
reconstruct the span from what §7.3d returns: it sees the successor's version and the removal version,
and under the folded floor those two determine whether the floor was honoured.
*DEFER-E trigger:* a break where the declaring version is **not** inferrable from the entry — a line
whose window was extended under §7.3e and re-declared, or a surface with several successive
deprecations, where the endpoint alone no longer tells a subscriber what it was promised.

### V-1 — a re-price is refused, but the refusal misnames its condition · **FOLD (minimal)** · KCB §4, §5

**Forced, and one field wide.** The refusal itself is **correct** — it fails closed, nothing is
silently billed, delta K holds, and the digest exclusion for `cost` is right in both directions
(Step 3's regression half). What breaks is that the caller gates against the price *it last fetched*
while §5 evaluates the **then-published** one, and the invoke carries neither: the caller learns the
price moved **by being refused**, and the provider cannot distinguish *"the caller saw 4000 and
accepted"* from *"the caller is still budgeting against 1200"*.

**What is folded.** An optional **quoted cost** operand on `invoke` — the projected cost §3's path
search already returns and the caller actually gated against — and a provider that fails closed on a
**quote mismatch**, which names the real condition, rather than on a ceiling that may have been
computed against a stale number. Same family as V-5's and MA-6's shape: a number crossing a boundary
says what it is, and the reader refuses rather than assumes.

**Not folded:** no price lock, no quote token, no expiry, no negotiation, and no change to who
governs — the provider's then-published cost still decides, and it still fails closed.

### V-8 — four assertions have no KCS predicate · **CLOSE** · no clause, no version

**Already discharged where it lands.** [KCS](../../specs/conformance-scenario.md) §7 open question 1
cites V-8 **by name**, alongside MA-11, as evidence that its own leaning (*fixed core + an escape
hatch*) works: both sets of missing predicates *"were built as declared console extensions and
reported as such rather than smuggled into §5."* The 2026-08-24 run of `kcs:live-schema-mutation`
declared five such extensions and reported them, which is the escape hatch behaving.

Closing it does not make it inert. V-8 is the standing cost estimate for US-2's conformance case: the
predicates that assert *this digest moved*, *this digest did not move*, *this silent mutation was
detected*, *this successor was offered beside its predecessor* and *this deprecation was visible before
its removal* are the ones the folded clauses most need, and they live in the escape hatch rather than
in §5. That is a KCS question with a KCS record, and it is not a demand on KCB.

---

## Where each fold lands

**Intent, not a record.** US-2's changelog entry is the record — and it now exists: the fold landed
**2026-08-26 at KCB 0.5.0**, exactly as the table below predicted, with the sections named below and
no schema twin or registry file touched. What each fold says as published is the spec's; what follows
is retained as the reasoning that decided its extent. Where the two ever disagree, the spec wins and
this page is the bug.

| # | Spec + section | Schema twin | Registry | New normative text? |
|---|---|---|---|---|
| **V-2** | [KCB](../../specs/capability-bus.md) §7.1 (canonicalization + the reader's rule), §2.1 (the port field) | **none** — no twin models the KCB card extension | **none** — registry route rejected | Yes |
| **V-4** | KCB §2 (the field), §4 (the reader), §6 (the transport mapping) | none | none | Yes |
| **V-5** | KCB §4 (the operand), §5 (the token + the gate), §7.2 (cross-reference) | none | none | Yes |
| **V-7** | KCB §7.3 (the duty + the frames), §7.2 (cross-reference); rides §4.2d unchanged | none | none | Yes |
| **V-3** | KCB §7.1 step 4, §7.2 (what an unknown rule id reads as) | none | none | Yes |
| **V-6** | KCB §7.3b/c | none | none | Yes |
| **V-1** | KCB §4 (the operand), §5 (the refusal) | none | none | Yes |
| **V-8** | — | none | none | No |

**Version landing zone: KCB 0.5.0, a minor.** Every fold above is additive — fields optional on read
and write, no field removed, no verb, plane, port kind or authority role added, and a participant that
implements none of them stays conformant — but seven of the eight are **new normative surface a reader
implements against**, and §7.2's compatibility table itself gains a reader's obligation (V-2). That is
a minor by KCB's own §7.2, not a patch. 0.5.0 is the version §7.5 and §7.3 both already name for this
fold, and it is the one minor this spec had left un-spent.

**And publishing 0.5.0 obliges one thing that is not on this page.** §2.2 declares the standalone
`/.well-known/kcb-manifest.json` **removed at KCB 0.5.0**, and §2.3 declares the legacy extension-URI
root removed at 0.6.0. Under §7.3f, publishing 0.5.0 *is* that removal: past it a provider MUST NOT
rely on the standalone file being read and a registry is no longer obliged to crawl it. US-2 lands
that alongside the folds — not as a fold, as an obligation already declared and now due. §2.3's
window is untouched and still runs to 0.6.0.

**Status after the fold: still Candidate.** A fold does not close its own gate. *(As published:
KCB 0.5.0 stays Candidate on all five counts; count (ii) reads as a re-run of Steps 3, 5, 7, 8, 9 and
10 against the folded text, and the scenario's new* Conformance case *section carries the **F1–F13**
assertion set that re-run needs — the extension DR-7 makes unavoidable and V-8 measures the cost of.
Building it is unowned downstream work.)*

---

## Where this fold meets the federation fold

A capability advertised across an authority boundary is governed by **both** this fold and
[`85`](../../tasks/chief/completed/85-fold-the-federation-breaks.json)'s. The full read is US-3's, and it is
listed here because two of the extent decisions above were **made on federation grounds** and would
be wrong without them:

- **V-2's rejected registry route** is rejected because a global shape registry would be a second
  non-federated commons, and KINP §3.4 records the prefix registry as the only one. That is a
  federation argument deciding a versioning fold.
- **V-5's refuse-for-want-of-one** is deliberately the shape 0.4.9 gave `budget_units` crossing a
  boundary (MA-6). The two clauses should read as one rule applied twice, not as two conventions.
- **V-4's transport binding** must be read against §3.1(d)'s de-duplication converse (MA-9): two
  entries are **one** capability where the provider KINP id, `(name, version)` **and** `schema_id`
  match. A transport binding is none of those three, so the converse is undisturbed — but US-3 owes
  that reading explicitly, because a per-major address is exactly the field someone would be tempted
  to add to the key.
- **V-7's frames** ride §4.2d, whose own text says it *"composes across §3.1 federation unchanged,
  precisely because it never required a party with jurisdiction over both ends."* The version signals
  inherit that property; US-3 confirms it rather than assuming it.

No contradiction is claimed here. US-3's first job is to look for one, and its standing instruction is
that a real conflict is an **ADR**, not a quiet reconciliation inside whichever fold merges second.

**That read has now run**, and is
[`fold-coordination-federation-versioning.md`](fold-coordination-federation-versioning.md). It
enumerated **eleven** seams — the four above plus seven it added — and read each against the
*published* text of both folds. **All four above hold**, including the federation fold's named
near-miss: `version` is still in §3.1(d)'s de-duplication key, so two majors of one name stay two
entries and V-4 is not undone at the discovery layer. **Ten of eleven agree.** The eleventh is a
**gap at the seam** rather than a contradiction — §7.3's deprecated marking has no carrier, and
§3.1(d)'s converse merges two attributions that disagree about one into a single entry whose marking
is undefined — and it is recorded as
[ADR-0014](../../decisions/ADR-0014-federated-merge-merges-attributions.md), owned by neither fold and
landing with KCB counts (ii) and (iii). Nothing was folded into 0.5.0 for it.
