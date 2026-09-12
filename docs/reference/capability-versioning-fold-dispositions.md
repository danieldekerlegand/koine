# The capability-versioning fold — a disposition for each of V-1…V-8 (and V-9, V-11; V-10 with BP-8 and AP-9; and MT-1)

> **Status:** Current · **Updated:** 2026-09-12 · **Owner:** koine · **Informative**

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
[`86-fold-the-capability-versioning-breaks`](../../tasks/chief/completed/86-fold-the-capability-versioning-breaks.json)
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

### V-9 and V-11 — two later findings, and their dispositions (added 2026-09-12)

The eight above are what the **pass** found. **V-9** and **V-11** are what the **re-run of the fold**
found, on 2026-09-03, when Steps 3, 5, 6, 7, 8, 9 and 10 were walked by hand against KCB 0.5.0: the
two clauses V-2's and V-3's rows planned were folded, and **neither was finished at its edge**. Their
dispositions belong here beside the others, because the question this page exists to answer —
*forced to what extent?* — is the same question, and because each is a second-order finding of a fold
this page decided. They land together at **KCB 0.5.3** (2026-09-12), one publication, one §7.1 edit.

| # | Severity | Disposition | Lands in | Extent — what changes, and what deliberately does not |
|---|---|---|---|---|
| **V-9** | High, structural | **FOLD (split)** | [KCB](../../specs/capability-bus.md) **§7.1** (new NORMATIVE (a)–(e) + the scoped *falsifiability* paragraph), **§2.1** (the closing pointer) | The **canonicalization** route and the **honest-limit** route, taken **together** rather than either alone: (a) fixes the digest as `sha256` over the declaration's bytes **as published** — a **content address of a document**, the form [KINP §3](../../specs/identity.md) gives an `asset` id, with **no key set, no value normalization and no serialization rule** because there is no KCB-defined object to reduce, a SHOULD applying step 3's byte discipline where the declaration is itself JSON, and step 5's rule id **excluded** from its prefix; (b) states what that determinism **is and is not**, claiming same-bytes-same-value and **explicitly declining** the cross-provider convergence step 1's key set gives `schema_id`; (c) settles retrievability by **checking §4's five verbs one at a time**, concluding `fetch` can carry it **and is the only one that can**, because by (a) the digest already *is* an `asset` address that self-verifies on arrival (delta G); (d) splits the cross-check into **two branches** — retrievable (performable) and unretrievable (**provider-attested**, carrying a `version`'s evidentiary weight, with §7's **failure mode 2 declared open**) — and makes which branch a consumer is on a **fact it discovers, never one the card asserts**; (e) adds **no provider obligation**, a declared `payload_schema_id` with nothing retrievable behind it staying conformant. **Not written:** a **sixth verb** returning the declaration, and a **reserved capability name** every declaring provider must publish — both would make the cross-check unconditional and both are refused **on the record**, a verb being a plane-wide addition with no mandate in this fold and a reserved name being a commons two authority domains must agree on, which is the ground the **shape registry** was rejected on and which [KINP §3.4](../../specs/identity.md) reserves to the prefix registry alone; any convergence rule, which would require KCB to fix the declaration's **format** (the shape registry again); any obligation to publish the declaration anywhere; and any change to step 1's kept set, either rule id, or §7.2's table — **no published `schema_id` or digest moves**. |
| **V-11** | Med-High | **FOLD** | KCB **§7.1 step 5** (a third bullet), **§7.2** (the *not a silent mutation* bullet), **§2.1** (the closing pointer) | The **mirror** of the existing `MUST NOT`, written as one bullet and **stated by property rather than by naming a rule**: a provider MUST emit the rule id of the rule it actually canonicalized under, **except** where that canonicalization is byte-identical to `kcb1`'s **for the port in hand**. Today the exception is exactly a knowledge port declaring **no** `payload_schema_id` and the MUST is exactly one declaring one, and because neither arm names a rule both carry to the next rule id §2.1's vocabulary mints **without a re-edit**. Bullet 1's `MAY` is dropped and the absent prefix is declared a **statement, not a silence** — which is the reason it is a MUST and not a SHOULD. The **correction path** is stated and shown not to be a mutation (the prefix moves, the hex does not; the comparison bullet then reads *incomparable*, so re-discovery is the recovery), with a MUST NOT on leaving a mislabel standing because correcting it would move a published value. §7.2's *not a silent mutation* bullet records that its own reservation — *the same rule, the same port, a moved digest, an unmoved version* — **holds only because** of this MUST. **Not written:** any new rule id (`kcb1`/`kcb2` are byte-unchanged); any change to the consumer-side rules, which are re-checked and stand (an unknown rule id reads *no cross-check available*; comparison is meaningful only within one rule id; growing §2.1's vocabulary mints the next rule id); any change to a published value — **every digest published to date is `kcb1` and stays prefix-free**, and §2's worked AgentCard needed **no** correction; and any §7.2 table row. |

**What the two breaks force, and the line these rows draw.** Both are **perimeter** breaks of folds
whose **models** held: V-2's reader rule and V-3's rule id were right, and each stopped one clause
short of the party that has to act on it. So what V-9 forces is a **rule and a stated reach** — not a
retrieval guarantee, which is the thing the absence of a route makes tempting and which costs a verb;
and what V-11 forces is **one strength moved to the branch that needs it** — not a second rule, and
not a re-definition of either named canonicalization. The economy is the same one the first eight
were held to: fold the smallest thing that makes the clause **operable by the party it binds**.

**Why V-9 is a split rather than a whole fold.** The honest answer to *can a consumer obtain the
declaration?* turned out to be **partial**, not *no*: `fetch` reaches it where a provider has
published it, and nothing reaches it where the provider has not. A fold that took only the optimistic
half would have promised a check that is conditional; one that took only the defeatist half would
have thrown away a route that exists. Stating **both branches** is V-2's own move — a silent break
converted into a **declared absence** — performed on the branch that *declares* a `payload_schema_id`,
as V-2 performed it on the branch that declares none.

**Versions, and what does not close.** Both land as **KCB 0.5.3** — a **patch** under KCB's own
rules: `payload_schema_id` stays OPTIONAL, no verb, field, plane, port kind, grant or authority role
is added, §7.2's table is undisturbed, step 1's kept set and both rule ids are byte-unchanged, and a
card carrying no `payload_schema_id` behaves exactly as at 0.5.2. V-11's one narrowing is stated
rather than hidden, and is a patch because the set it narrows is one 0.5.2's text **does not
determine** — the break-test's finding being that the text enforces **neither** reading — so making
the stricter one normative **disambiguates**. **0.6.0 stays spoken for** by §2.3's legacy-root
removal. Neither closes a count: both were found *inside* count **(ii)**'s own re-run, so that count
**changes shape** rather than gaining a sibling, and **V-10** — the third finding of the same re-run —
is not folded with them. *(As re-run 2026-09-12 against 0.5.3: neither V-9 nor V-11 reproduces, and
Step 9's ADR-0014 blocker is discharged by the 0.5.1 carrier — but the count does **not** close. Four
new perimeter deltas stand beside V-10: **V-12** (High, scope — (d)'s retrievable branch is a content
address, an integrity instrument, and failure mode 2 is a staleness failure), **V-14** (Med-High — the
new MUST binds the provider and no clause gives the consumer the reading), **V-15** (Med, collision —
§7.3a(a) against §2's `removal_version` SHOULD) and **V-13** (Med — `refused` missing from (d)'s
enumeration of §4.5's outcomes). Their dispositions belong with them when they land.)*

### V-10, BP-8 and AP-9 — three findings, three legs, one hole (added 2026-09-12)

**Why they are on this page together, and why they were folded as one edit.** V-10 is this document's
finding; **BP-8** ([`../../scenarios/kcb-subscription-firehose.md`](../../scenarios/kcb-subscription-firehose.md),
count (iv)) and **AP-9** ([`../../scenarios/kcb-cross-owner-posture.md`](../../scenarios/kcb-cross-owner-posture.md),
count (v)) are not. They are dispositioned here anyway because the question this page exists to answer
— *forced to what extent?* — has **one** answer for all three: they are one hole seen from three
directions, and three separate edits to §7.2 would have collided in the same table.

The hole is the axis [ADR-0014](../../decisions/ADR-0014-federated-merge-merges-attributions.md) named
in advance — *an operand deliberately kept **outside** the `schema_id` digest, with a declared
normative consequence and nothing carrying it* — and it has two halves, one per finding-cluster:

| Half | What was asserted | What was missing | Filed as |
|---|---|---|---|
| **The bump** | §4.2a (0.4.7): changing a port's `volume` is *"a **minor** bump on the capability that carries it (§7.2) — the version moves, so a pinned subscriber can see it"*. §4.3a (0.4.8): the same sentence for an `effect` class. | §7.2's **normative** table, which *"fixes what a provider MAY change under a given bump"*, had **no row for either**. The nearest row that reached them — *Editorial only — `description`, examples; no `schema_id` change* — reads **patch**, under which no version moves and the visibility both sections rest on does not exist. | **BP-8**, **AP-9**(ii) |
| **The signal** | §2.4 and §7.2's `binding` row (0.5.0): *"a live `subscribe` MUST be told on §4.2d's channel (§7.3g), never left to a failed dial"*. §4.3a (0.4.8): an effect-class change on a live binding *"is signalled on the §4.2d control channel"*. §7.2's `volume` row (0.5.4) joined them. | **§7.3g named three frames** — `successor_published`, `deprecated`, `removal` — and none of them is any of those facts; `successor_published` carries a *successor's* `binding`, never the bound one's. §4.2d's *"a subscriber MUST tolerate a producer that never sends one"* then makes an **unnamed** frame indistinguishable from an **absent** one, so the signal was unassertable (KCS §5) — the exact property §7.3g claims for its own three. | **V-10**, **AP-9**(i) |

ADR-0014 saw the first half and **declined to close it**, deliberately: *"no bump row for `volume` or
`effect` — the exposure is recorded above, and closing it is a §7.2 change that belongs to whichever
pressure test breaks it."* Three pressure tests broke it, on three different counts, within one walk
cycle. That is the ADR's own trigger firing, and the fold is the ADR being applied rather than
amended.

| # | Severity | Disposition | Lands in | Extent — what changes, and what deliberately does not |
|---|---|---|---|---|
| **BP-8** | Med | **FOLD** | [KCB](../../specs/capability-bus.md) **§7.2** (one row), **§4.2a** (the citation), **§3.1(d)** (the merge-key consequence) | One row — *Change a port's **`volume`** (§4.2a) → **minor** → No* — **agreeing with** what §4.2a already declared, so **no provider obligation changes**; what changes is that the declaration has an authority behind it. §4.2a's bullet is amended to cite the row rather than an absence. The disagreement the row removes is **recorded in §7.2** rather than quietly repaired, naming the *patch*-reading nearest row and ADR-0014's deferral. **Not written:** any change to §7.1 step 1's kept set — `volume` stays **outside** the digest and step 1's drop list is **byte-unchanged**, so **no published `schema_id` or digest moves**; any change to §4.2's operands, §4.2b's losslessness rule or §4.2e's meter; and any bump row for `cost`, which already had one. |
| **AP-9** | Med, carrier | **FOLD (split)** | KCB **§7.2** (one row) + **§7.3g** (the frame), **§4.3a** (both citations) | Split because the finding has two legs with two homes. **(ii)** takes BP-8's shape exactly: one row — *Change a capability's or a port's **`effect`** class (§4.3a) → **minor** → No* — agreeing with §4.3a. **(i)** is folded with V-10 into the **one** frame below, not into a frame of its own: a `class_changed` frame beside a `binding_changed` frame would have been two names for one event class on a channel §4.2d mints **once**. **Not written:** any change to §4.3's model — (b)'s posture-as-a-set, (c)'s intersection, (d)'s floor, (e)'s chain rule and (f)'s evaluation points are **byte-unchanged**, and the fold deliberately touches none of them; `fetch` still gets **no** class (§4.3a's carve-out, checked against KMI §7.1 a third time and stronger than when written); and **no** second signalling path, which §4.3a promised and §4.2d requires. |
| **V-10** | Med, carrier | **FOLD (split)** | KCB **§7.3g** (a fourth frame + two bullets), **§2.4** (the citation and the qualification), **§7.2** (three rows' third column) | §7.3g's table gains **`entry_changed`** — **one generic frame, not three**, which is the shape this document's own fix column proposed — announcing that a **declared non-shape operand** on the bound entry has moved (`binding` §2.4, `volume` §4.2a, `effect` §4.3a), carrying the capability's **new `version`** and naming which moved. It obeys §7.3g's existing rules **unchanged**: rides §4.2d's existing channel, **precedes** the fact it announces (a producer moving a bound `binding` without a preceding frame is now non-conformant, parallel to `removal`), is ignored by a subscriber that does not understand it, and is **bounded** — MUST NOT announce a change of **shape** (that is a new major, carried by `successor_published`) and MUST NOT stand in for `deprecated`, which has its own frame and its own §2 carrier. A `cost` change **MAY** ride it and is left a MAY on purpose, because §5 states no telling obligation and a re-price fails closed at the gate. **The split is the promise:** *"never left to a failed dial"* is **qualified, not deleted** — met for the stream holder, **not** met for a cached discovery binding, which is **DEFER-D**, stated on §2.4's own sentence. **Not written:** any new verb, transport, connection or second frame table; any cadence or TTL (DEFER-D **unmoved**, trigger intact); any change to §7.1 step 1 or a published digest — a frame is not a card field. |

**What the three force, and the line these rows draw.** All three are **carrier** breaks of clauses
whose **models** held: §7.2's bump tiers, §4.2's volume envelope and §4.3's intersection were right,
and each stated a consequence in one section with nothing in another to carry it. So what BP-8 and
AP-9(ii) force is **two table rows that say what two sections already said** — not a new bump tier,
not a re-classification of either operand, and emphatically not moving either operand **into** the
digest, which would have made a re-declared envelope read as a payload break and is the thing §4.2a
and §4.3a each excluded by name. What V-10 and AP-9(i) force is **one name** on a channel that already
existed — not a second mechanism, which §4.2d forbids in terms, and not three names for one event
class. The economy is the same one the first eight were held to: fold the smallest thing that makes
the clause **operable by the party it binds**.

**Why one generic frame rather than three specific ones.** Three facts needed announcing (`binding`,
`volume`, `effect`) and the temptation was three frames. One was chosen for three reasons, in
increasing order of durability: the break-test's own fix column proposed it; ADR-0014's marking
carrier wants the same shape; and a generic frame **carries to the next operand** minted outside the
digest without re-editing §7.3g, which is the recurring cost this axis has imposed four times already.
The frame is bounded so that generality does not become a licence — it announces a **declared
non-shape operand**, never a shape change and never a deprecation.

**Versions, and what does not close.** The two halves land as **KCB 0.5.4** and **0.5.5**
(2026-09-12), both **patch**. The bump axis is named rather than assumed, because this repo has got it
wrong twice: §7.2's table — including the two rows 0.5.4 adds — governs **a published capability's**
bumps and decides **nothing** about KCB's own spec version, which moves on §7.3b's axis. The table is
consulted for the two questions it *does* answer, and both are **No**: does a published digest move
(§7.1 step 1's drop list is byte-unchanged), and does a live subscriber break (§4.2d's
ignore-unknown-frames rule, and both new rows read *No*). **0.6.0 stays spoken for** by §2.3's
legacy-extension-URI-root removal. **None of the three counts closes**, and each was re-run
separately the same day rather than once for all three — a combined verdict would have destroyed the
structure the six counts exist to keep. Count **(ii)** returns **V-16** (the frame names which operand
moved and never its **new value**, so §7.3g's *puts the new address in its hands* and §2.4's *dials
the new address* are wider than the mechanism); count **(v)** returns **AP-10**, the same defect on
the `effect` axis and sharper, because §4.3f evaluates a `subscribe` posture **once at registration**
and leaves §4.3d's floor no evaluation point on a live stream; count **(iv)** returns **nothing** —
the same omission was put to `volume` and does **not** bite, for reasons recorded at that leg's Step
8. V-16 and AP-10 are **one additive §7.3g edit**, and **unowned**. Count (iv) is held open by
**BP-7**, which no part of this fold touched.

### MT-1 — a path plan carries no version, and §4.4c selects one silently (added 2026-09-12)

**Why it is on this page.** MT-1 is not a finding of this break-test. It is
[`../../scenarios/e2e-media-transform.md`](../../scenarios/e2e-media-transform.md)'s — **count (i)**,
returned by that count's 2026-09-03 walk. It is dispositioned here for the same reason **BP-8** and
**AP-9** are: the question this page exists to answer — *forced to what extent?* — is answered by
**§4.4**, which is this fold's section and V-5's home, and a second page reasoning one delta onto
§4.4c would have decided the same thing twice.

**The finding, in the terms this page uses.** §7.1 makes `(name, version)` the unit of discovery and
§3's *Ranking across versions* rule makes the registry match the **highest satisfying version**
first, so a composed path is **already built over a specific version of each leg** — and §3's
*Composition* bullet named ports, planes, providers and a projected cost, and no version. §4.4c(2)
then resolves a version-free `invoke` to the **grant's** major. A caller that planned over a
top-ranked successor and holds a predecessor grant is therefore served the **predecessor**: §5's gate
is satisfied, nothing is refused, and the leg that runs is not the leg that was matched or the one
the projected cost was quoted from.

**What kind of defect it is, which decides the extent.** It is not an authorization hole. V-5 was —
*highest published* let a v1-granted caller reach v2, inverting fail-closed into fail-open, which is
why §4.4c forbids that default **by name**. MT-1 is the **symmetric** silent selection with the sign
reversed, and the party it disagrees with is **not the grant**: the grant is correct, binding and
satisfied. It disagrees with **§3's own plan**, and the plan could not be disagreed with because it
said nothing. So the fold is in two halves with two homes, and the first is a **carrier**:

| Half | What was asserted | What was missing | Lands in |
|---|---|---|---|
| **The statement** | §3: the registry computes a path, prefers zero-`cost` routes, and *"returns the path's projected cost so the caller can gate spend before invoking"*. §7.1: `(name, version)`, *"not the name alone"*, is the unit of discovery. | The path result named **no version for any leg**, so a caller gating spend on the plan could not say which `(name, version)` the quote was for, and no clause anywhere could catch a disagreement about it — there was nothing to disagree **with**. | KCB **§3** (0.5.6) |
| **The refusal** | §4.4c resolves the target major by a NORMATIVE order with no default, refusing where it is genuinely ambiguous. | The order reads the **operand** and the **grant**, and nothing else. Case (2) is a silent selection among published majors, and a caller holding a plan had no way to present it. | KCB **§4.4c** (0.5.7) |

| # | Severity | Disposition | Lands in | Extent — what changes, and what deliberately does not |
|---|---|---|---|---|
| **MT-1** | High, structural | **FOLD (split)** | KCB **§3** (one NORMATIVE bullet, 0.5.6) + **§4.4c** (one OPTIONAL operand and one MUST, 0.5.7) | **§3**: each leg of a returned path MUST name the `(name, version)` it was matched over — an exact version, never a range, never the name alone, §7.1's `0.0.0`-unknown as a **value** where the entry carries none — and the projected cost is the cost of **exactly those legs**, read from the same entries. A plan leg is stated to be the registry's account of *what it matched*: it reserves nothing, expires by nothing and binds no provider, and which major an `invoke` reaches stays **§4.4's**. **§4.4c**: an OPTIONAL **`planned_leg`**, and where the **resolved** major differs from the presented leg's major the provider MUST refuse **plan mismatch** naming **both** — the instrument §5 (MA-6's unstated ceiling unit) and §4.4c(3) (want of a version) already share, applied a **third** time. Bounded by five further rules: the comparison is on the **major only**; a leg naming another capability is refused and **never ignored**; a `0.0.0`-unknown leg is compared like any other and nothing matches leniently; it is a **cross-check, never an operand of resolution** — after the order, never a fifth case, never a stand-in for a missing `version`; and the grant rule is byte-unchanged. **Not written:** the alternative the walk named — making §4.4a's `version` operand **REQUIRED** of a caller fulfilling a §3 path leg — which would have made planning through the registry a **pinning** obligation and broken §4.4e's *"no requirement that a caller pin"*; any change to §3's ranking; any default, any *highest published* fallback, any counter-offer (§4.4e); any new field, verb, plane, port kind, grant or authority role; and any change to §7.1 step 1's key sets, so **no published `schema_id` or digest moves**. |

**Why the grant rule is deliberately unmoved, and it is the whole reason the fold is shaped this
way.** The tempting fold is to make §4.4c(2) refuse whenever more than one major is published — the
symmetry with (3) is right there. It is wrong, and the reason is the one §4.4 opens with: *"whatever
the grant says is correct and the provider does not hold the issuance record."* Case (2) is the case
(b) exists for, it is the only case in the order with an **authorized** basis, and refusing it would
make every version-free call against a dual-serving provider fail — which is exactly the *"a
successor unreachable forever"* failure §4.4 rejects by name, arriving from the other side. The
disagreement MT-1 names is not with the grant; it is with the **plan**, a document the grant knows
nothing about. So what the fold adds is a **second statement to compare against**, not a new
authority. The grant still binds, a resolved major outside it is still refused at the gate before the
work, and a caller presenting no plan is served exactly as it was.

**Versions, and what does not close.** The two halves land as **KCB 0.5.6** and **0.5.7**
(2026-09-12), both **patch**, in the two-patches-one-publication-cycle form 0.5.4/0.5.5 established
for a fold with a carrier half and an enforcement half. The bump axis is named rather than assumed:
§7.2's table governs **a published capability's** bumps and decides nothing about KCB's own spec
version, which moves on §7.3b's axis; the table is consulted for the two questions it *does* answer
and both are **No**. **0.6.0 stays spoken for** by §2.3's legacy-extension-URI-root removal —
checked, not tripped. **Count (i) does not close**, and the re-run walked the same day says why:
**MT-1 does not reproduce**, and the count breaks on the fold's **perimeter** — **MT-2** (High,
carrier: §3's *"it mints no field"* is true of a **leg** and false of a **path**, since no clause
types a path request or result and §4.4c types `planned_leg` *"as §3 returned it"* against that
absence) and **MT-3** (Med-High, scope: the cross-check binds the party that cannot detect the
condition, and no response names the resolved major). Both are additive and KCB-only; both are
**unowned**. MT-2 is the **seventh** finding on the axis
[ADR-0014](../../decisions/ADR-0014-federated-merge-merges-attributions.md) named, and that walk is
the **fifth consecutive** one in this repo to break on a fold's perimeter rather than its model.

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
| **V-9** | KCB §7.1 ((a)–(e) + the scoped *falsifiability* paragraph), §2.1 (the pointer) | none | **none** — the retrieval verb and the reserved name are both rejected | Yes |
| **V-11** | KCB §7.1 step 5 (the third bullet), §7.2 (the reservation's ground), §2.1 (the pointer) | none | none | Yes |
| **BP-8** | KCB §7.2 (one row), §4.2a (the citation), §3.1(d) (the merge-key consequence) | none | none | Yes |
| **AP-9** | KCB §7.2 (one row), §7.3g (folded into V-10's frame), §4.3a (both citations) | none | none | Yes |
| **V-10** | KCB §7.3g (the fourth frame + two bullets), §2.4 (the citation + the qualification), §7.2 (three rows' third column) | none | none | Yes |

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
