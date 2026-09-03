# Scenario: a high-volume world drowns its subscriber (KCB §8.1 pressure leg)

**Purpose:** pressure-test [`../specs/capability-bus.md`](../specs/capability-bus.md) (KCB 0.4.6,
*Candidate*) **§8.1**, the one open question the spec has left — *"**Subscription backpressure** —
flow-control for high-volume-world subscriptions (per-invoke cost is now handled by capability
`cost` + grant spend ceilings, §2.1/§5); firehose flow-control remains an infra concern for the
host's cost advisor."*

That sentence makes two claims, and this leg attacks them separately. The **first** is that the cost
question is already handled and the flow-control question is what remains — so the leg must show a
break that survives the `cost` + `budget_units` machinery working exactly as specified, or it has
found nothing new. The **second** is the parking assignment itself: that flow control can be left to
the host's cost advisor. That claim is not tested by asking whether the advisor is *good enough*; it
is tested by asking whether the host is **in a position to do it at all**, given the fabric's own
route-by-lookup-not-proxy rule ([ADR-0001](../decisions/ADR-0001-control-plane-topology.md), §3).

Focused follow-up to [`e2e-media-transform.md`](e2e-media-transform.md) (which opened the
cross-plane port model and delta L's dangling-reference tolerance) and
[`e2e-live-schema-mutation.md`](e2e-live-schema-mutation.md) (which found, as **V-7**, that no §7
signal reaches a live `subscribe` at all). Same method as every pass in this directory: each step is
marked ✅ *held* or 🔴/🟡 *broke*, §Findings collects the deltas, and the bias is **adversarial** —
the point is to find the break, not to walk the happy path. **Only the question this leg forces is
carried into a fold.**

---

## Setup

All names are the KINP §3.4 placeholder namespaces, not deployment names or endpoints.

| Role | Participant | In this leg |
|---|---|---|
| **World producer** | `worldsim` | runs the high-volume world `alderforest` and streams KGP deltas from it (KGP §6) |
| **Knowledge producer / consumer** | `analyzer` | **the subscriber under test** — merges `alderforest` deltas and re-emits derived claims |
| **Media producer** | `mediastore` | holds the CAS the deltas' asset references resolve against (delta G/L) |
| **Identity authority** | `refkb` | holds entities, and publishes the *low*-volume world `consensus-reality` — the control case in Step 1 |
| **Control-plane host** | `orchestrator` | provisions the registry (§3), issues grants (§5), and runs the **cost advisor** §8.1 names |

`worldsim`'s card, abridged to what this leg reads:

```jsonc
// worldsim's /.well-known/agent-card.json → capabilities.extensions[uri=…/kcb/manifest/0.3].params
{
  "kcb_version": "0.4.6",
  "produces": [
    { "plane": "knowledge", "dialect": "grounding-only", "shape": "world-state-delta",
      "worlds": ["alderforest"], "schema_id": "sha256-8b40…" }
  ],
  "auth": { "scheme": "capability-token",
            "grants_required": ["subscribe:world/alderforest"] }
}
```

**The volumes.** `alderforest` is a simulation: ~9,000 tracked entities, and at peak ~40,000
assertions per second. `worldsim` coalesces at 250 ms, so the wire carries **4 deltas/second**, each
~10,000 assertions, ~6 MB canonical (KGP §3), each carrying ~120 KMI asset references — **~24 MB/s
sustained, ~2 TB/day**. `analyzer` normalizes and merges at ~3,000 assertions/second: a **13×
deficit**. `refkb`'s `consensus-reality` emits a handful of deltas a day.

`orchestrator` issues `analyzer` the grant `subscribe:world/alderforest` with
`budget_units: 50000` (§5). Nothing about that grant is unusual, and Step 2 is about what it does.

---

## Step 1 — Discovery cannot tell a firehose from a trickle

Before `analyzer` binds anything, it does what §3 tells it to do: `find(plane: knowledge, dialect:
grounding-only)`. Two entries come back — `worldsim`'s `alderforest` port and `refkb`'s
`consensus-reality` port — and the registry ranks them by the only ordering §3 defines, *highest
satisfying version first, deprecated below non-deprecated*.

Set the two port declarations side by side. §2.1 fixes what a knowledge port may carry: a KGP
`dialect`, an optional `worlds` list, a `shape` naming the payload, and an optional `schema_id`.

| Field | `worldsim` / `alderforest` | `refkb` / `consensus-reality` |
|---|---|---|
| `plane` | `knowledge` | `knowledge` |
| `dialect` | `grounding-only` | `grounding-only` |
| `shape` | `world-state-delta` | `world-state-delta` |
| `worlds` | `["alderforest"]` | `["consensus-reality"]` |
| `schema_id` | `sha256-8b40…` | `sha256-8b40…` — *the same digest*, the payload declaration being identical |

🔴 **BROKE (BP-1, high).** The two ports differ by **six orders of magnitude in delivery volume**
and are **indistinguishable on every field the registry indexes**. §2.1's port vocabulary has no
volume, rate, cadence, or cardinality field on any of its three planes; §3's query matches ports and
its ranking reads versions; and the one pre-flight quantity path search does compute — the projected
`cost` (delta K) — is defined over `params.capabilities[].cost` and is returned *"so the caller can
gate spend **before invoking**"*. There is no `invoke` here. The subscriber must therefore choose
between two bindings on evidence that omits the only property that determines whether either is
survivable, and the way it discovers which one it picked is by running.

*Not V-2, and a V-2 fold would not touch this.* V-2 found that a knowledge port's `shape` is a
free-form **name** with no registered signature, so a payload can be redefined behind an unchanged
digest. Registering that name — V-2's fix — makes the two digests above diverge if and only if the
payloads differ, which here they do not. Volume is not shape, and no digest over a shape can carry
it.

---

## Step 2 — The grant is issued, and never fires

`analyzer` subscribes. `orchestrator`'s cost advisor sees a well-formed `subscribe:world/alderforest`
grant with a 50,000-unit ceiling and admits it, exactly as §5 says: grants are *"per-capability,
per-world, and carry a spend ceiling (`budget_units`, delta K), so a cross-participant chain … cannot
exceed the caller's authorized spend."*

Then the stream runs for four hours, delivers 3.4 TB, and the ceiling reads **50,000 units
remaining**.

🔴 **BROKE (BP-2, high — structural).** Not because the ceiling is too high or too coarse. Because
it has **no operand and no evaluation point**:

- **Nothing prices a delta.** §2.1 puts `cost` on `params.capabilities[]` — a *named, invocable
  unit*. A subscription scopes to a **world**, and a world is not an entry in `params.capabilities`;
  it is a value of a port's `worlds` / `world_pattern`. `subscribe:world/consensus-reality` is one of
  §5's own three grant examples, and there is no manifest object anywhere it could read a price from.
- **Nothing evaluates it after registration.** §5 is precise about when the ceiling is checked:
  *"the grant's `budget_units` ceiling is evaluated **at invoke** against the then-published cost."*
  A subscription is registered once and then delivers indefinitely. There is no second invoke, so
  there is no second evaluation, and `budget_units` is never decremented by anything.

The ceiling is inert on a stream — decorative rather than merely generous. **This is what
distinguishes the flow-control question from the cost question §8.1 says is closed.** §2.1/§5 do
close per-invoke cost: [`e2e-live-schema-mutation.md`](e2e-live-schema-mutation.md) Step 3 walked a
re-price through them and they held (its one finding, V-1, is that the *quote* is not carried, not
that the ceiling fails). None of that machinery reaches a stream.

**And extending it would not solve backpressure either.** Grant the most generous possible repair —
a per-delta `est_units`, decremented on delivery. §5's enforcement rule is that *"a raise beyond the
caller's remaining ceiling **fails at the gate** rather than overspending."* Applied to a stream, the
exhausted ceiling can only stop the stream. **A ceiling is a cliff; backpressure is a brake.** A
cliff cannot be used as a brake, because the only state on the far side of it is a dead subscription
— which is Step 4. Cost accounting and flow control are answering different questions, and the
second one is genuinely open.

---

## Step 3 — Saturated. Every lever the contract offers

Ninety seconds in, `analyzer`'s merge queue is 13× behind and growing. It goes looking for a way to
ask for less. Every lever §3, §4 and §5 offer is tried:

| Lever attempted | Result |
|---|---|
| **An argument on `subscribe`** | **There is none.** §4 defines the verb as *"register for a world or capability; receive KGP deltas (KGP §6) or media events as they occur."* The registration carries a scope and nothing else — no rate, no window, no batch size, no sampling ratio, no maximum in flight. There is no field to narrow, because there is no field. |
| **Narrow the scope** | The grant is already **per-world** (§5) and the world is the smallest scope the vocabulary has. Sub-world scoping would be `worldsim`'s modelling decision — a re-partition of `alderforest` — not something a subscriber can ask for. |
| **Filter to what it can afford** | KGP §7 makes confidence, license and provenance **first-class filters**, and this is the closest thing in the fabric to the right idea. But it is a filter over *a pack a consumer already has*, and §7.2's egress gate is applied by the producer *at pack construction*. The vocabulary exists and sits on the far side of the wire: every byte is delivered, and therefore paid for, before a filter can drop it. |
| **Re-negotiate the price** | No operand (BP-2), and §5's re-price path is provider-initiated: a `cost` change is a minor bump the *provider* publishes. |
| **Ask `orchestrator` to throttle it** | Step 6. |
| **Stop reading the socket** | Step 7. |
| **Disconnect** | The only lever that works. Step 4 is what it costs. |

✅ **Held, narrowly and worth recording:** nothing here is a *missing verb*. `subscribe` is the right
verb, held by the right party, scoped to the right unit. What is missing is arguments to it and a
signal back along it — which is why Step 8 can say the fold is additive.

---

## Step 4 — Disconnecting is where the loss becomes silent

`analyzer` drops the stream at delta 1,412, sheds its queue, and re-subscribes 40 seconds later.
Delta 1,573 arrives. Its `basis` is delta 1,572's pack id — a pack `analyzer` has never seen.

§4's justification for having no flow control at all is one sentence:

> *"Ordering-independence (KGP §6) means the bus needs no exactly-once guarantee — content-addressed
> claim ids make redelivery idempotent."*

That argument is **sound, and it is about redelivery**. It says duplicates are safe. It says nothing
whatever about **non-delivery**, and this leg is the case where the two come apart.

🔴 **BROKE (BP-3, high — structural).** The gap is detectable and unrecoverable, and merging past it
is silently wrong.

- **No resumption operand.** `subscribe` registers for deltas *"as they occur"* (§4). There is no
  `since`, no `from_basis`, no cursor, and no sequence the consumer may name. A subscription cannot
  be resumed; it can only be re-established at now.
- **No range-pull verb.** KGP §6 does say *"Pull (consumer requests a snapshot/range) … [is] valid"*
  — but KCB's verb table has exactly five entries (**discover · describe · invoke · subscribe ·
  fetch**) and none of them is a range pull. It would have to be an `invoke` against a capability the
  producer *chose* to publish, and **no clause requires a producer that streams a world to publish
  one.** Recovery is provider-optional.
- **Where recovery exists, it is congestion collapse.** A snapshot capability *is* an entry in
  `params.capabilities[]`, so it has a `cost` and the ceiling does bind — meaning the one operation
  §5 actually meters is a **full snapshot of a high-volume world**, the most expensive request in the
  fabric, demanded at exactly the moment the subscriber is already underwater. **The recovery from
  overload costs strictly more than the overload.**
- **A missed retraction never expires.** KGP §6: *"Retraction uses the `retracts` / `supersedes`
  lifecycle relations (KINP §4.2), never deletion — deltas stay append-only and content-addressed."*
  A retraction in the gap is not re-sent, because there is nothing to re-send it *to*: the claim it
  retracts is, from the stream's point of view, already handled. `analyzer` merges the post-gap
  deltas — nothing forbids it, and KGP's merge is commutative and idempotent by construction — and
  produces a graph that is **internally consistent and factually wrong**, asserting claims
  `worldsim` retracted.

The last point is the sharp edge of the whole leg. Content-addressing makes a **duplicate** a no-op,
which is why §4 can dispense with exactly-once. The same property makes a **gap** leave no trace: a
merged graph records what arrived, and there is nothing in it shaped like what did not. The one
mechanism the contract relies on to make flow control unnecessary is the mechanism that makes its
absence undetectable.

---

## Step 5 — One stream, and a third participant nobody asked

Each `alderforest` delta carries ~120 KMI asset references — observation frames the world emitted.
`analyzer` does what §4 requires (delta L):

> *"consumers MUST tolerate dangling asset references and `fetch` them lazily on demand; producers
> MUST NOT assume bytes are pre-propagated."*

At 4 deltas/second that is **~480 `fetch`es per second** against `mediastore`'s CAS.

🔴 **BROKE (BP-4, high).** `mediastore` is party to neither binding. It never subscribed to
`alderforest`, it has no relationship with `worldsim`'s emission rate, and the only thing it issued
`analyzer` is a `fetch:asset` grant — which §5 defines as a **verb + scope**, a boolean capability,
with no rate, concurrency, or volume dimension anywhere in its shape. Worse, §4.1 records that
`fetch` is *"wire-independent — not an MCP call at all"*, a CAS `GET`: so the fan-out is not even
metered as an invoke, and the one place §5's ceiling does bind never sees it.

The rate `mediastore` absorbs is set by `worldsim`'s coalescing window multiplied by `analyzer`'s
tolerance obligation, and **neither of those parties is `mediastore`**. Backpressure is *transitive*,
and the contract has no way to express a limit that crosses a hop. Two clauses widen the blast
radius further:

- **KMI §7.1** (CAS replication on reference) has an unheld asset dialed **directly** at the store
  that holds it, so a firehose whose references land outside the local store amplifies into a
  **second** authority domain's CAS.
- **KCB §3.1** (peering registries) forwards a *query* and merges entries — never traffic. So
  discovery composes across the boundary and there is nothing at the boundary that could throttle
  what discovery introduced.

And the one mitigation §4 does offer is the word **lazy** — *fetch on demand*. Under a firehose the
demand *is* the firehose.

---

## Step 6 — The cost advisor is not on the path

`analyzer` escalates to `orchestrator`, which is precisely where §8.1 says this belongs:
*"firehose flow-control remains an infra concern for the host's cost advisor."*

`orchestrator` cannot do anything. Not because its advisor is unsophisticated — because it is **not
on the stream**. §3 is unambiguous, and it is quoting the fabric's founding topology decision:

> **Route-by-lookup, not proxy ([ADR-0001](../decisions/ADR-0001-control-plane-topology.md)).** *"The
> registry returns addresses; peers then connect **directly** over MCP/A2A — **no inter-service
> traffic flows through it.**"*

🔴 **BROKE (BP-5, high — structural). §8.1's parking assignment is void, not merely deferred.**
`orchestrator` introduced `analyzer` to `worldsim` and left the path. It cannot observe the stream's
rate, meter its volume, throttle it, pause it, or terminate it. Its complete inventory of instruments
against a running subscription is:

| Instrument | Why it does not reach |
|---|---|
| The **grant** (§5) | Evaluated at issue and at invoke. BP-2: a stream has neither after registration, and the ceiling has no operand regardless. |
| **Revoking** the grant | §5 fixes the *shape* of grants and leaves issuance and rotation to the host's infra — and there is **no channel to a live subscription**. This is V-7's finding arrived at from the other side: *every §7 signal is pull-side, and the bus's most durable binding never pulls.* A revocation reaches `analyzer` the next time it re-discovers, which nothing obliges it ever to do. |
| **Registry ranking** (§3) | Pre-bind only. It orders what `discover` returns; it has no relationship to a subscription that was established months ago. |
| The **aggregator facade** (§3) | Would be on the path — and §3 disqualifies it in the same breath: it forwards *"without transforming"* and *"is never the mandatory path."* A contract clause cannot be discharged by an optional component, and making it mandatory is the proxy topology ADR-0001 exists to reject. |

Under **§3.1** it is worse than off-path. Where `worldsim` and `analyzer` sit in different authority
domains whose registries merely peer, there is **no single host with jurisdiction over both ends** —
§3.1 is explicit that peering *"forwards a query and merges entries"* and that a registry never
carries `invoke` / `subscribe` / `fetch` for a peer. Across an authority boundary, "the host's cost
advisor" names a party that does not exist.

**This is what the leg was built to find.** §8.1 does not defer flow control to someone who could
answer it later, pending infrastructure that has not been built. It defers it to a party the fabric's
own topology rule forbids from being in position — so no amount of downstream infra work discharges
it, and the question cannot leave the contract.

---

## Step 7 — Transport flow control is real, and says nothing

The obvious objection: a `subscribe` stream rides **A2A streaming** under the pinned revision (§1.1,
§4.1), the wire beneath it has flow control of its own, and a receiver that stops reading stalls the
sender. `analyzer` *can* physically slow `worldsim` down. Isn't the problem solved one layer below?

✅ **Held — the mechanism exists — 🟡 and it is not an answer.** Three reasons, and the third is the
one that matters:

1. **It is unattributable.** A stalled window is indistinguishable, at both ends, between *the
   consumer is saturated*, *the network is slow*, and *the consumer has died*. None of the three is
   expressible, so a producer cannot respond to them differently — and §4 has already told it not to
   reason about propagation at all (delta L).
2. **It is unassertable.** KCS §5's cross-plane assertion vocabulary ranges over **interactions
   between participants**, and a stalled transport window is not an interaction. No KCS scenario can
   state *"the subscriber applied backpressure and the producer honoured it"*, so the behaviour
   cannot be a conformance requirement — it cannot be tested, and a clause nothing can test is not a
   clause. (Consistent with **V-8** and with the interop-trial's **INT-11**; it also touches KCS §7.3,
   *how much stream payload the observation log retains*.)
3. **It converts straight into BP-3.** A producer whose send buffer fills has two conformant options:
   block — which, on a shared A2A connection, penalizes every other subscriber and task multiplexed
   onto it, turning one slow consumer into a fabric-wide stall — or drop the subscriber, which lands
   in Step 4's gap. Transport backpressure is therefore not an alternative to the missing clause. It
   is the mechanism by which the missing clause becomes **silent knowledge loss**.

---

## Step 8 — What held

Four things this leg tried to break and could not, worth recording so the fold stays narrow:

✅ **The payload layer is rate-safe by construction.** KGP §6 deltas are ordering-independent and
KGP §3 claim ids are content-addressed and byte-stable, so coalescing two deltas, batching a window,
re-ordering, or dropping a duplicate moves **no claim id** and changes **no merge outcome** (KGP
§3.3's convergence is untouched). Any *lossless* rate adaptation is free. This is why the fold is
additive, and why it lands in **KCB and not KGP** — the payload contract needs nothing. It also fixes
the boundary precisely: the one thing that is **not** rate-safe is dropping a **retraction** (BP-3),
so what the contract must say is not *how fast* but *whether a given adaptation is lossless*.

✅ **The grant shape is already right.** `subscribe:world/alderforest` is already per-world and
already carries `budget_units` (§5). The slot exists and no clause reads it for a stream — the same
shape of gap the KFT resume leg found at FT-S. The repair is a reading rule plus an operand, not a
new grant kind, and the grant *name* need not change.

✅ **No new verb, plane, port kind, media type, or artifact kind is needed.** Step 3 established that
`subscribe` is the right verb held by the right party at the right scope; Step 5's fan-out rides
`fetch` and `fetch:asset`, both of which already exist. Everything BP-1…BP-5 asks for is an argument,
a field, or a frame on a surface that is already there.

✅ **§7.2's compatibility table is not disturbed.** An optional flow-control operand on a
subscription is not a change to a published capability's *shape* — it appears nowhere in §7.2's
eleven rows, and the nearest row (*add an optional input*) is minor and explicitly does not break a
live subscriber. Nothing folded here can break a subscriber, which is the invariant ADR-0009 rates
highest.

🟡 **Convergence with V-7, and deliberately not a re-finding.** V-7 already established that no §7
signal reaches a live `subscribe`, and proposed *"an in-band deprecation/removal **control frame** on
the subscription stream — the push channel §7's preamble says is missing."* BP-5 needs a frame in
that same direction (host or producer → subscriber) and BP-3 needs one in the other (subscriber →
producer). **The channel V-7's fold is already scheduled to open is the carrier backpressure needs.**
Recorded as convergence, not as a second mechanism and not as a reopening of V-7: whoever folds
0.5.0 should know these two questions want one channel, not two.

---

## Findings — required spec deltas

| # | Severity | Gap | Forced question | Spec |
|---|---|---|---|---|
| **BP-5** | **High (structural)** | §8.1 parks flow control on *"the host's cost advisor"*, but §3 / [ADR-0001](../decisions/ADR-0001-control-plane-topology.md) keep the host **off the stream path** — it returns addresses and no traffic flows through it — its grant, revocation, ranking and facade instruments all fail to reach a running subscription, and under §3.1 federation no single host has jurisdiction over both ends at all. The assignee cannot observe, meter, throttle or terminate what it was assigned. | **Where does flow control live**, given route-by-lookup-not-proxy — and can the question leave the contract at all? | KCB §8.1/§3/§3.1 |
| **BP-3** | **High (structural)** | The only working lever is disconnect (Step 3), and `subscribe` has no resumption operand, KGP delta `basis` chains break across the gap, and KCB publishes no range-pull verb — so recovery is provider-optional and, where it exists, is a full snapshot of a high-volume world demanded of an already-saturated subscriber. A missed **retraction** leaves a claim asserted forever, and content-addressed merge leaves no hole to detect it by. §4's idempotency argument covers redelivery, **not** non-delivery. | What is the **lossless** way to slow a stream, and how does a subscriber resume without re-pulling the world? | KCB §4 (+ KGP §6) |
| **BP-2** | **High (structural)** | `cost` sits on a capability (§2.1) and a subscription scopes to a **world**, which has no manifest object to price; §5 evaluates the ceiling *"at invoke"* and a stream has no second invoke — so `budget_units` never decrements and the ceiling is inert, not merely generous. Extending it does not help: enforcement *"fails at the gate"*, so an exhausted ceiling can only **stop** the stream. A ceiling is a cliff; backpressure is a brake. | Is a subscription **priced and metered** — and is exhaustion a brake or a cliff? | KCB §2.1/§5 |
| **BP-1** | High | §2.1's port vocabulary carries no volume, rate, cadence or cardinality field on any plane, and §3 ranks by version, so a firehose world and a trickle world are **indistinguishable on every field the registry indexes**; path search's projected `cost` is returned *"before invoking"* and there is no invoke. A subscriber learns what it bound to by running. | Can a subscriber learn the **volume it is binding to before it binds**? | KCB §2.1/§3 |
| **BP-4** | High | Delta L's *lazy `fetch` on demand* amplifies the stream rate onto **`mediastore`'s CAS**, a third participant party to neither binding, at a rate set by two parties that are not it; `fetch:asset` is a boolean grant with no rate dimension and §4.1 makes `fetch` not an MCP call, so §5's ceiling never sees it. Under KMI §7.1 the amplification crosses into a second authority domain, and §3.1's peering forwards queries, never traffic. | Does backpressure **compose transitively** across a fetch fan-out and an authority boundary? | KCB §4/§5 (+ KMI §7.1, §3.1) |
| **BP-6** | Cleanup | Transport-level flow control exists beneath A2A streaming but is **unattributable** (saturated / slow / dead are one signal) and **unassertable**: KCS §5's predicates range over interactions between participants and a stalled window is not one, so no scenario can assert that backpressure was applied and honoured. | Can a conformance run **observe** backpressure? | KCS §5/§7.1/§7.3 — evidence, not a demand |

**Blocking: BP-5, BP-3.** Without BP-5 the open question has no addressee and cannot be discharged
downstream by anyone; without BP-3 the only available flow-control action converts overload into
undetectable knowledge loss. **Should-fix in the same fold: BP-2, BP-1, BP-4** — all three are the
same missing dimension (volume) read at three different points: at discovery, at the gate, and across
a hop. **BP-6** is evidence for a KCS open question and blocks nothing; no KCS version moves.

**None requires redesign.** Every delta is an additive argument, field, or frame on a surface that
already exists, and Step 8 records why: the payload layer is rate-safe by construction, the grant
already has the slot, the verb is already the right verb, §7.2 is not disturbed, and the control
channel needed is one V-7's fold is already scheduled to open.

---

## Only §8.1 is forced

This leg drove a **single-world, single-producer, single-subscriber** knowledge subscription on
purpose, so that what it forces is unambiguous. §8 holds exactly one open question after 0.4.6, and
this is it. Nothing else is carried into a fold:

- **V-1…V-8 are not reopened.** No capability was widened, re-priced, mutated, superseded, deprecated
  or removed in this leg; one capability version ran throughout, and `worldsim`'s card is byte-stable
  from Step 1 to Step 7. V-7 is *converged with* in Step 8 — the two folds want one control channel —
  which is a note to whoever folds 0.5.0, not a re-finding, and BP-1 is explicitly shown in Step 1 to
  survive a V-2 fold rather than duplicate it.
- **MA-1…MA-11 are untouched.** §3.1 and KMI §7.1 appear in Steps 5 and 6 only as *amplifiers* of a
  break that is already complete inside one authority domain: every finding here reproduces with a
  single registry and a single CAS. No cross-authority reconciliation, `same_as` merge, or peered
  attribution is exercised.
- **KGP is untouched, and Step 8 says why.** §3's canonical, §3.3's convergence and §6's delta
  semantics are the *reason* the fold can be additive; no claim id moves and no clause of KGP is
  asked to change. The `basis`-chain break in Step 4 is a KCB gap — a missing resumption operand —
  not a defect in how KGP chains deltas.
- **§7.2's compatibility table does not move** (Step 8), so no live subscriber anywhere is broken by
  the fold this leg forces.
- **KMI, KFT and the `schemas/` twins are untouched.** This is a delivery-rate behaviour test: koine
  ships no machine-readable twin of the KCB card extension, and no step reads or writes one of the
  data-plane twins. Every `schemas/*.json` is byte-unchanged.

**What a fold must answer.** BP-1…BP-5 are five faces of one contract question: *the fabric can say
what a stream carries and cannot say how much of it, how fast, or what to do when that is too much.*
The answer has to let a subscriber see the volume before it binds (BP-1), let a subscription be
metered rather than merely granted (BP-2), give the subscriber a **lossless** way to slow or resume
one (BP-3), let a limit compose across the fetch fan-out (BP-4), and put the mechanism where the
topology allows it to be — **between the two peers, on the binding's own axis**, since ADR-0001
forbids the host being anywhere else (BP-5). It must stay **additive** on KCB's own precedent: every
0.4.x card stays conformant, `subscribe` stays one verb, no plane or port kind is added, and a
subscription that declares nothing behaves exactly as it does today. Anything larger is out of scope
for what this leg found.

---

## Re-ratification — what this pass gates

| Spec | Version at the time of this pass | What this pass does to it |
|---|---|---|
| **KCB** ([`../specs/capability-bus.md`](../specs/capability-bus.md)) | 0.4.6, **Candidate** | **The gated spec.** §8.1 in full, plus the §2.1/§3/§3.1/§4/§4.1/§5 surfaces a subscription actually runs over. Six deltas **BP-1…BP-6**; two blocking (**BP-5, BP-3**). |
| **KGP** ([`../specs/grounding-pack.md`](../specs/grounding-pack.md)) | 0.5.2, Candidate | **Untouched — one confirmation.** §6's ordering-independent, content-addressed deltas are what make a lossless rate adaptation free (Step 8); §6 is also what makes a *gap* undetectable (Step 4), and that is a KCB gap, not a KGP one. No clause changes and **no version moves.** |
| **KMI** ([`../specs/media-interchange.md`](../specs/media-interchange.md)) | 0.3.4, Candidate | **Untouched — an amplifier only.** §7.1's replicate-on-reference widens BP-4 across an authority boundary; BP-4 is complete without it. No asset envelope, lineage, or timeline clause is read. **No version moves.** |
| **KCS** ([`../specs/conformance-scenario.md`](../specs/conformance-scenario.md)) | 0.3.0, Candidate | **BP-6 only, and as evidence.** No §5 predicate can assert that backpressure was applied and honoured; input to KCS open question 1, and it touches §7.3's recording-fidelity question. No clause is contradicted and **no version moves.** |
| **`../schemas/`** | — | **No shape change, by construction** — a delivery-rate behaviour test, and koine ships no twin of the KCB card extension. Every `schemas/*.json` byte-unchanged and still parsing. |

**What a clean pass would license.** A re-run against a folded §8.1 closes this gate when Steps 1–7
walk clean where they broke and Step 8's holds stay held — specifically: Step 1 distinguishes the two
worlds *before* binding, Step 2's meter moves, Step 3's table has a lever that is not disconnect,
Step 4 resumes without a snapshot and cannot silently miss a retraction, Step 5's limit survives the
hop, and Step 6 names a party that is actually on the path. That is a gate **additional to** KCB's
three existing counts (the `e2e-media-transform.md` extension re-run, the `e2e-live-schema-mutation.md`
§7.5 re-run, and `e2e-multi-authority.md` for §3.1); this pass re-runs none of them and makes no claim
about any.

**On the fold's version.** Every delta is additive, which on KCB's own precedent points at a
**patch**: §3.1 — new normative text, no manifest field, no verb change — landed as **0.4.6** on
exactly that reasoning, because 0.5.0 was already spent on §2.2's standalone-manifest removal. The
same reading makes this fold **0.4.7**. The alternative is to fold it *into* the V-1…V-8 minor, where
it rides **0.5.0** and shares the control frame V-7 opens (Step 8). Either is defensible; the choice
belongs to the fold, not to this pass.

> **Resolution (2026-08-26):** recorded against **KCB 0.4.6**, whose §8.1 this leg pressure-tests.
> Deltas **BP-1…BP-6** are **open — none folded** — and BP-5/BP-3 are blocking, so **KCB stays
> Candidate** on this count in addition to its three existing ones. No other spec version moves: BP-6
> is evidence for a KCS open question, KGP §6 and KMI §7.1 are *confirmed* rather than changed. When a
> fold lands, amend this note to name the version that closed each delta — as
> [`e2e-media-transform.md`](e2e-media-transform.md)'s Resolution does for F–L — after which this
> document stands as the historical record of what the pressure leg found.

> **Amended (2026-08-26) — the fold landed at [KCB 0.4.7](../specs/capability-bus.md), normative
> §4.2.** §8's last open question is **resolved in place** (numbering deliberately unshifted, so
> every §8.1 reference still resolves), and §8 now holds none. Where each delta closed:
>
> | Delta | Closed by |
> |---|---|
> | **BP-5** | **§4.2** as a whole, and **§4.2d**. The mechanism is placed *between the two peers, on the binding's own axis*, because ADR-0001 admits nobody else; §4.2d states that it composes across §3.1 federation unchanged precisely because it never needed a party with jurisdiction over both ends. §8's parking sentence is struck, and the record says why it was wrong rather than merely incomplete. |
> | **BP-3** | **§4.2b** (lossless-vs-lossy is the governing question, and **a retraction is never shed**) and **§4.2c** (an optional content-addressed `resume` operand — not a new verb — that a producer MUST answer resumed / `gap-unavailable` / `resume-unsupported`, never with silence; and a subscriber MUST NOT silently merge past an unseen `basis`). A gap is now **detectable**. |
> | **BP-2** | **§4.2e** + a new §5 bullet: a port's `volume.cost` is the missing operand, delivery is the missing evaluation point, and an exhausted ceiling MUST NOT be the *first* signal — the producer signals on §4.2d first, which is what turns the cliff into a brake. |
> | **BP-1** | **§4.2a** + §2.1: an optional port `volume` envelope, outside the `schema_id` digest as `cost` is, read *unknown* when absent and never *low*. §3's ranking rules are untouched. |
> | **BP-4** | **§4.2f**: `volume.references` makes the fan-out predictable before binding, the fan-out is the *subscriber's* traffic and is bounded by its own `max_rate`, and a CAS holder's limit is a **refusal** that lands on delta L's existing pending-fetch tolerance. Holds unchanged under KMI §7.1 and §3.1. |
> | **BP-6** | **Not closed, and not a demand** — evidence for a KCS open question, as recorded above. §4.2d does supply the missing handle: a control frame *is* an interaction between participants, so KCS §5 predicates can range over it where a stalled transport window cannot be reached. **No KCS version moves.** |
>
> Step 8's convergence note was taken: **§4.2d specifies one control channel in both directions** and
> requires **V-7**'s fold to ride it rather than mint a second. The fold is a **patch** — every field
> optional, a subscription that declares nothing unchanged, §7.2 undisturbed, and 0.5.0 still spoken
> for by §2.2's removal. **KCB stays Candidate**, and this leg becomes its **fourth** re-ratification
> count: a re-run of Steps 1–7 against the folded text, per *What a clean pass would license* above.
> The three existing counts are restated and none moves.
>
> **One obligation this leg creates, and it is cross-repo.** This is koine's **eleventh** scenario
> against a downstream encoding set of nine, and no koine guard checks that correspondence — so a
> clean re-run is *necessary but not sufficient*: under
> [the ratification gate](../specs/README.md#the-ratification-gate) §4.2 also needs a
> machine-replayable **KCS encoding** of this document, which does not exist and is **unowned**.
> Recorded in [`../docs/reference/kcs-encoding-gate-verification.md`](../docs/reference/kcs-encoding-gate-verification.md) §6.2
> and in [`../ROADMAP.md`](../ROADMAP.md).

## Re-run — Steps 1–8 walked by hand against §4.2 (2026-09-03)

**What this is.** KCB's **count (iv)**, opened by 0.4.7 and gating **§4.2 alone**: a re-run of this leg
against the folded text, on the conditions *What a clean pass would license* states — *"Step 1
distinguishes the two worlds before binding, Step 2's meter moves, Step 3's table has a lever that is
not disconnect, Step 4 resumes without a snapshot and cannot silently miss a retraction, Step 5's limit
survives the hop, and Step 6 names a party that is actually on the path."*

**Method, and why it is not a replay.** By hand, against the prose. `kcs:subscription-firehose` exists —
it landed downstream at `agora` `378fd3c` on 2026-08-26 and ran `green` / `partial-live`, which is why
**DR-12 is closed** — and a `green` there is not this verdict. The encoding asserts what koine had
folded when it was written, and the predicates KCS §5 cannot state are declared console extensions
(**BP-6**); it cannot report a clause that has no carrier. Same standing reason as **DR-7** and
**DR-8**.

### Per-step verdicts

| Step | Delta under test | Verdict |
|---|---|---|
| **1** — Discovery cannot tell a firehose from a trickle | **BP-1** | ✅ **flips** |
| **2** — The grant is issued, and never fires | **BP-2** | ✅ **flips** |
| **3** — Saturated. Every lever the contract offers | **BP-3** *(the brake)* | 🟡 **half-flips** → new delta **BP-7** |
| **4** — Disconnecting is where the loss becomes silent | **BP-3** *(the gap)* | ✅ **flips**, one declared residual |
| **5** — One stream, and a third participant nobody asked | **BP-4** | ✅ **flips** |
| **6** — The cost advisor is not on the path | **BP-5** *(blocking)* | ✅ **flips** |
| **7** — Transport flow control says nothing | **BP-6** | ✅ **holds** *(regression)*; BP-6 gains a handle, not a predicate |
| **8** — What held | four holds | 🟡 **three hold; the fourth is where BP-8 lands** |

### Step 1 — Discovery cannot tell a firehose from a trickle ✅ *flips*

§4.2a puts a `volume` on the port, so the two entries that were identical on every indexed field are
now distinguishable **before** either is bound: `worldsim`'s `alderforest` port declares
`unit: "delta"`, `rate {typical 4, peak 20}`, `payload_bytes {typical 6000000}`, `references {typical
120}` and a `resume_horizon`; `refkb`'s `consensus-reality` port declares a handful a day. Six orders of
magnitude, on a field the registry returns.

Re-attacked three ways and it holds:

- *Declare nothing.* An **absent** `volume` reads *unknown*, **never** *low*, and a consumer MAY decline
  to bind a port that declares none. The un-cooperative producer is not made cooperative, but its
  silence is now a **declared absence** the subscriber can act on rather than an invisible one — the
  same move V-2's fold makes at the knowledge port, and the fail-safe direction §4.3a then reuses for
  `effect`.
- *Game the ranking.* §4.2a states in terms that §3's ranking rules do not change and that **no registry
  may reorder on volume**; a consumer MAY rank locally. So a high-volume port cannot be buried or
  promoted by the registry, and BP-1's fix does not smuggle a trust weighting into §3 — the thing
  §3.1(d) refuses.
- *Move it silently.* `volume` sits outside the `schema_id` digest, so a re-declared envelope does not
  present as a payload break — but §4.2a makes changing it a **minor** bump, so a pinned subscriber sees
  the version move. That claim is where **BP-8** lands; see Step 8.

**BP-1's own disclaimer is confirmed rather than assumed:** a `volume` is an estimate of an envelope,
never a guarantee and never an SLA, and a producer that exceeds it is not in breach. What BP-1 asked for
was *"the ability to choose before it binds"*, and that is exactly and only what arrived.

### Step 2 — The grant is issued, and never fires ✅ *flips*

Both halves of BP-2 are answered, and separately. **The operand:** §4.2e lets a port's `volume` carry a
`cost` in §2.1's shape, denominated per `unit` — so a **world**, which has no entry in
`params.capabilities` to price, is priced where it *is* addressable, on the port that delivers it.
**The evaluation point:** the `budget_units` ceiling decrements **on delivery** rather than at invoke,
so the four-hour, 3.4 TB stream that left the ceiling at 50,000 now moves it on every delta.

The probe that mattered: *what if the producer declares no `volume.cost`?* §4.2e answers in terms —
*"Where it does not, the subscription is unmetered exactly as it is today"* — and, crucially, `volume`
rides the **port**, which §3 returns at discovery. So a host issuing `subscribe:world/alderforest` with
a ceiling can see **before it issues** whether that ceiling has an operand. The inert-ceiling condition
survives, but it is now readable pre-bind rather than discoverable only by watching a number fail to
move. That is a different fact from BP-2, and it is the one §4.2e claims.

**And the brake is the part that matters more.** §4.2e makes an exhausted ceiling MUST NOT be the
**first** signal: a producer approaching it signals on the §4.2d channel first. §5's *"fails at the
gate"* on a stream can only mean stopping, and this is what turns the cliff into a brake — BP-2's own
framing, answered in its own words.

### Step 3 — Saturated. Every lever the contract offers 🟡 *half-flips*

**The half that flips.** §4.2b gives `subscribe` the operands the table went looking for — `max_rate`,
`max_in_flight`, `window`, `on_overflow` — and §4.2d makes them adjustable in-band, so Step 3's
one-working-lever table now has a lever that is not disconnect. The governing rule is right and is the
one Step 8 predicted: the contract's question is not *how fast* but **whether an adaptation is
lossless**. `coalesce` and `defer` are lossless for KGP payloads by construction; `drop` is lossy and
must be named by the subscriber that chooses it; a producer MAY apply a lossless adaptation unasked and
MUST NOT apply a lossy one that was not asked for. And **a retraction is never shed**, which is the one
payload that is not rate-safe. The verb is unchanged, which is what Step 3 said it should be.

**🔴 BROKE (BP-7, medium-high). The lever is normative at registration and advisory thereafter — and
Step 3 is a mid-stream step.** §4.2b's enforcement clause is stated once and it is stated at one
moment: *"A producer that cannot honour a declared limit MUST refuse the subscription **at
registration**, with a stated reason, rather than accept it and exceed it."* §4.2d then says the
operands are *"adjustable in-band"* and that the subscriber→producer direction is *"the lever Step 3 of
the leg went looking for and did not find."* But **no clause states what a producer owes a live
adjustment**. It is not required to honour it, not required to answer it, and not required to say it
cannot — and §4.2d's own tolerance rule, *"a subscriber MUST tolerate a producer that never sends
one,"* makes silence conformant on the return path.

Set that beside §4.2c, which governs the *other* in-band operand and gets this exactly right: *"A
producer MUST answer a `resume` in exactly one of three ways, and **silence is not one of them**"* —
resumed, `gap-unavailable`, or `resume-unsupported`. The discipline exists, in the same subsection, one
paragraph away, and it is not extended to (b)'s operands on a live subscription.

The consequence is Step 3's own situation, unrepaired. `analyzer` did not learn it was 13× behind at
registration; it learned ninety seconds in, which is when a merge queue tells you. It sends a
`max_rate` adjustment on the channel §4.2d mints. A conformant producer may ignore it entirely, and
`analyzer` cannot distinguish *honoured*, *refused*, and *not implemented* — so it is back to the one
lever that always worked, which is disconnect, which is Step 4. The registration-time rule does not
help: a subscriber that could have declared the right limit at registration would not have needed the
channel.

*The fold is one sentence and it is already drafted elsewhere in the section.* Extend §4.2c's
answer-or-be-non-conformant discipline to a live (b) adjustment: a producer receiving one MUST answer
applied / `cannot-honour` (with the limit it can meet) / `unsupported`, and silence is not one of them.
Additive — the frame rides §4.2d's existing channel, no verb, no second mechanism — and it is what makes
the lever assertable by a KCS scenario, which §4.2d's last bullet argues is the reason to prefer a frame
over transport flow control at all. → KCB §4.2b/§4.2d.

### Step 4 — Disconnecting is where the loss becomes silent ✅ *flips, with one declared residual*

The gap is **detectable**, which is what BP-3 asked for. §4.2c adds an optional content-addressed
`resume {after: <KGP pack id>}` — an operand, deliberately **not** a sixth verb, so §4's table still has
five entries — that a producer MUST answer resumed / `gap-unavailable` (naming the earliest point it
can resume from) / `resume-unsupported`, and **never with silence**. Beside it, the rule that closes
Step 4's sharp edge: *"A subscriber that receives a delivery whose `basis` (KGP §6) it has not seen MUST
NOT merge it silently. It MUST resume, or record the gap."* Delta 1,573 arriving with delta 1,572's
unseen `basis` is now a stop, not a merge. And §4.2b's *a retraction is never shed* closes the other
half — the graph that was *"internally consistent and factually wrong"* is no longer reachable by a
conformant party.

The congestion-collapse half is answered too: recovery is a `resume` on the existing subscription rather
than an `invoke` against a snapshot capability, so the most expensive request in the fabric is no longer
the only route back. And §4.2a's `resume_horizon` on the port lets a subscriber tell **before it binds**
whether resumption after a plausible outage is available at all.

**Declared residual, and it is stated by the fold rather than found by this walk.** *Recovery* remains
provider-optional: *"A producer that cannot resume is conformant."* What is mandatory is **detection**
and an **answer**. That is the correct line — BP-3's own words are *"the requirement is that a gap be
detectable, which before this clause it was not"* — but it means a subscriber against a
`resume-unsupported` producer is still re-established at now, with a recorded gap rather than a silent
one. Recorded so a future re-runner does not read Step 4 as promising more than it does.

### Step 5 — One stream, and a third participant nobody asked ✅ *flips*

§4.2f answers all three of BP-4's parts. **Predictable:** `volume.references` makes the derived `fetch`
rate the delivery rate multiplied by that count, readable before binding — 4 × 120 = ~480/s, the number
Step 5 had to compute by hand from facts no field carried. **Attributed:** the fan-out is the
**subscriber's** traffic, because delta L makes the `fetch` the consumer's own action, so it is bounded
by `analyzer`'s own declared `max_rate` and `analyzer` is accountable for the load it places on a third
participant. **Refusable:** a CAS holder MAY apply its own limit and MUST **signal a refusal** rather
than stall or drop silently — and because `fetch` is request/response (§4.1), that refusal needs no
stream frame: it is a **pending fetch**, which delta L already requires every consumer to handle. The
backpressure lands on machinery that already existed, which is why nothing in §4 or §5 had to change.

Both amplifiers were re-probed. **KMI §7.1**: the limit is applied by the participant that **holds the
bytes**, in its own authority domain, fail-closed — the same placement §7.1 already fixes for license,
egress and trust tier, and KMI 0.3.5's MA-5 fold strengthens it rather than disturbing it, since the
asset's own policy now travels with the bytes. **§3.1**: peering forwards a *query* and merges entries,
never traffic, so there is still nothing at the boundary to throttle — and there no longer needs to be,
because the limit is at the holder.

### Step 6 — The cost advisor is not on the path ✅ *flips*

BP-5 is answered by placement rather than by mechanism, and the answer is stated where it can be
checked. §8's parking sentence is **struck**: open question 1 is marked *resolved in place at 0.4.7*,
its numbering deliberately unshifted, and the record says the second clause was *"wrong rather than
incomplete"* — the host cannot be the addressee at all. §4.2 puts the mechanism between the two peers on
the binding's own axis, §4.2d states that it composes across §3.1 federation unchanged *precisely
because it never needed a party with jurisdiction over both ends*, and §4.2g fixes the boundary so the
clause does not quietly become a QoS contract.

Probed for the failure the leg was built to find and it does not reproduce: every instrument in Step 6's
table is still off the path, and **none of them is now assigned anything**. `orchestrator` is not named
in §4.2 as an actor at all. ADR-0001's topology is intact — no traffic flows through the registry, and
no clause makes the optional aggregator facade mandatory.

### Step 7 — Transport flow control is real, and says nothing ✅ *holds (regression)*

All three reasons stand unchanged: a stalled A2A window is still unattributable, still unassertable, and
still converts into BP-3 for a producer whose send buffer fills. What §4.2 adds is the alternative, not
a repair to the transport: §4.2d's last bullet argues that a **frame is an interaction between
participants**, so KCS §5's vocabulary can range over it where it cannot reach a stalled window — *"a
clause nothing can test is not a clause."*

**BP-6 gains a handle and not a predicate, and it is still open as evidence.** KCS §5 has no
backpressure vocabulary today, so *"the subscriber applied backpressure and the producer honoured it"*
is still unassertable in the fixed core; what changed is that it is now expressible **about** something
observable. That is input to KCS open question 1 alongside V-8 and MA-11, and **no KCS version moves**.
BP-7 above sharpens it: an adjustment a producer is not obliged to answer is not observable even with a
predicate, so the vocabulary gap and the carrier gap have to close in that order.

### Step 8 — What held 🟡 *three of four hold*

- ✅ **The payload layer is rate-safe by construction.** Unchanged, and it is why §4.2b can state
  losslessness as the governing question. No KGP clause moved.
- ✅ **The grant shape is already right.** Confirmed by execution: §4.2e added a *reading rule plus an
  operand*, and the grant's name, scope and `budget_units` field are byte-unchanged, exactly as the hold
  predicted.
- ✅ **No new verb, plane, port kind, media type or artifact kind.** Checked against §4's table, which
  still has five entries, and against §2.1's port table, which still has three planes. `resume` is an
  operand and §4.2c says so in terms.
- 🔴 **BROKE (BP-8, medium). *"§7.2's compatibility table is not disturbed"* held for the fold and does
  not hold for the fold's own bump claim.** §4.2a states that changing a port's `volume` is *"a **minor**
  bump on the capability that carries it (§7.2) — the version moves, so a pinned subscriber can see
  it."* §7.2's table is **normative** and *"fixes what a provider MAY change under a given bump"* — and
  it has **no row for `volume`**. It gained rows for `cost` and, at 0.5.0, for an added
  `payload_schema_id` and a changed `binding`; it never gained one here. The nearest row a provider
  reading the table will land on is *"Editorial only — `description`, examples; no `schema_id` change →
  **patch**"*, since `volume` is outside the digest and is not a payload change — which contradicts
  §4.2a's *minor* and, under a patch, gives a pinned subscriber no version movement to see. So the
  mechanism BP-1's fix depends on for visibility is asserted in §4.2a and absent from the table that
  governs it.

  **The same defect reproduces once more, at §4.3a**, which states an `effect` change is a minor bump
  under §7.2 against a table with no row for it — recorded on count (v) as
  [`kcb-cross-owner-posture.md`](kcb-cross-owner-posture.md)'s **AP-9**. And it is the same **class** as
  [ADR-0014](../decisions/ADR-0014-federated-merge-merges-attributions.md)'s: a normative consequence
  attached to an operand deliberately kept **outside** the `schema_id` digest, with nothing carrying it.
  ADR-0014 generalizes the point already — *"every operand deliberately kept outside the digest —
  `cost`, `binding`, `volume`, `effect`, the marking — is outside the merge key too, and only the two
  with a declared §7.2 bump are rescued."* This walk establishes that **`volume` is not one of the two**:
  its bump is declared in §4.2a and not in §7.2.

  *The fold is two table rows.* Add *Change a port's `volume` (§4.2a) → minor → No* and *Change a
  capability's or port's `effect` (§4.3a) → minor → No*, beside the `cost` and `binding` rows that are
  already there. Additive, moves no digest, breaks no subscriber. → KCB §7.2 (+ §4.2a, §4.3a).

### What this re-run does and does not close

**Count (iv) does NOT close.** Five of the six conditions *What a clean pass would license* names are
met, and met by walking rather than by reading: Step 1 distinguishes the two worlds before binding,
Step 2's meter moves and its cliff became a brake, Step 4 resumes without a snapshot and cannot silently
miss a retraction, Step 5's limit survives the hop, and Step 6 names a party actually on the path — the
two peers, which is the only party the topology admits. **BP-5, the blocking delta and the one this leg
was built to find, does not reproduce**, and neither do BP-1, BP-2 or BP-4.

The sixth condition — *"Step 3's table has a lever that is not disconnect"* — is met **at registration
and not on a live subscription**, which is the moment Step 3 occupies. That is **BP-7**. And Step 8's
fourth hold does not hold: §4.2a's own visibility mechanism is asserted against a §7.2 table that has no
row for it, which is **BP-8**.

So the count **changes shape** rather than closing: from *re-run this leg against the folded text* to
**fold BP-7 (§4.2b/d — extend §4.2c's answer-or-be-non-conformant discipline to a live adjustment) and
BP-8 (two rows in §7.2's table), then re-run Steps 1–8 again**. Both are additive, both are KCB-only,
neither moves a digest or a verb, and both are **unowned**.

**What this walk does not touch.** KGP, KMI, KFT and `../schemas/` are unmoved, exactly as *Only §8.1 is
forced* said they would be; V-1…V-11, MA-6…MA-12 and AP-1…AP-8 are not reopened by anything here, and
the two cross-references above (BP-8 at §4.3a, BP-7's dependency on KCS open question 1) are recorded
rather than folded. **No version moves and no clause moves** — the edit is this section, a gate paragraph
in [`../specs/capability-bus.md`](../specs/capability-bus.md) and a changelog entry. **KCB is not
promoted**, and this count alone was never going to promote it.

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
| Encoding | **`console/src/kcs/scenarios/subscription-firehose.ts`**, registered in `index.ts` with `source: 'scenarios/kcb-subscription-firehose.md'` and `gates: 'KCB §4.2'`. The predicates KCS §5 cannot state are declared as **console extensions** and reported as such, per BP-1…BP-6 |
| Run | `kcs:subscription-firehose` — **`green: true`**, `live_pass: false`, verdict **`partial-live`**, 3 of 4 participants live (`worldsim:agent:author`, `analyzer:agent:pipeline`, `refkb:agent:resolver`), the store answering from a delta-N `standin` fixture, no transport failures |
| Artifact | `sha256-eb8fdc9ce041162db78ef80df42998e25793dc6a20e7ac8974f77d7615236dd5`, generated **2026-08-26T17:26:10.420Z**, twelve scenarios, 26 of 44 slots live (59%), suite verdict `partial-live` |
| Landed | `agora` **`378fd3c`**, 2026-08-26 12:30:18 — the same commit encoded all three then-unencoded legs **and regenerated the artifact**. Verified by running both gates at `agora` `main` = **`c971fc2`** on 2026-09-03 |

**`green` is not a gate verdict here either.** The encoding asserts what koine has **folded**; its §4.2 count (iv)
remains open on its own re-run against the folded text, and this result discharges the *artefact*
condition alone.

| Why | This document landed with `chief/70` on **2026-08-26**, a week after the nine encodings were built (`agora chief/75`, merged 2026-08-19) and two days after they were run |

This is the **second** document in this directory in that position, the first being
[`kft-resume-checkpoint.md`](kft-resume-checkpoint.md#downstream-results) and the third
[`kcb-cross-owner-posture.md`](kcb-cross-owner-posture.md#downstream-results). All three landed on
the same day, all three after the encoding set was frozen at nine, and **all three were encoded
downstream that same afternoon** (`agora` `378fd3c`) — so the same
red light named three files rather than one until 2026-08-26: `coverage.test.ts` asserts set-equality between
`KOINE_SCENARIOS` and this directory's `*.md`, and its `KOINE_SCENARIOS.length` assertion — **9** when
this was written, **12** since `378fd3c` — went red on all three until that commit closed it. That gate is downstream and it is the only enforcement there is;
koine's own `.chief/verify.sh` checks links, status mirrors, schemas and the registry and has
nothing that could notice. Adding a file to `scenarios/` is a cross-repo obligation with no local
red light.

The full verification, with the merges and the artifacts it was read off, is
[`../docs/reference/kcs-encoding-gate-verification.md`](../docs/reference/kcs-encoding-gate-verification.md)
§6.2; it is not restated here.

### Findings — from the absence of a downstream run

**DR-12 is CLOSED, on 2026-08-26, and koine learned on 2026-09-02.** The row below is left standing as
the finding of record — its reasoning is intact and only the world moved. `console/src/kcs/scenarios/subscription-firehose.ts`
landed at `agora` `378fd3c`, forty-nine minutes after the koine document recording this gap was last
written, and the gate was re-run at `agora` `main` = `c971fc2` on 2026-09-03
([`../docs/reference/kcs-encoding-gate-verification.md`](../docs/reference/kcs-encoding-gate-verification.md)
§6.4). **KCB does not lose the artefact gate on this count** — and is no closer to `ratified` for it:
all five of its counts remain open on their own re-runs, and count (ii) still fails the artefact
condition on **DR-7**, its encoding predating the fold it would have to assert.


| # | Severity | Gap | Consequence |
|---|---|---|---|
| DR-12 | ~~Blocking~~ → **CLOSED 2026-08-26** (for KCB §4.2 alone) | The KCB 0.4.7 fold this leg forced — §4.2a's port `volume` envelope, §4.2b's lossless-vs-lossy rule and never-shed-a-retraction clause, §4.2c's `resume` operand and its three required answers, §4.2d's bidirectional control channel, §4.2e's delivery-time ceiling evaluation and §4.2f's `volume.references` fan-out bound — has **no machine-replayable document citing any of it**, and neither does BP-1…BP-6. | [The ratification gate](../specs/README.md#the-ratification-gate) forbids promoting a spec whose scenario has no KCS encoding, so **KCB loses the artefact gate on this count**. It is narrow: KCB's other three re-ratification counts re-run [`e2e-media-transform.md`](e2e-media-transform.md), [`e2e-live-schema-mutation.md`](e2e-live-schema-mutation.md) and [`e2e-multi-authority.md`](e2e-multi-authority.md), all of which **are** encoded, so those counts are unaffected — as are the four specs that touch none of the three unencoded documents. This is on top of, not instead of, the fourth count's own re-run gate. Building the encoding is downstream runtime work under [ADR-0001](../decisions/ADR-0001-control-plane-topology.md) and is **unowned** as of 2026-08-26. |

Suite-wide limits **DR-1** and **DR-2** are recorded in
[`README.md`](README.md#downstream-results-where-a-real-runs-result-lands); neither applies to a
scenario that was never run. **DR-11** is the same finding against
[`kft-resume-checkpoint.md`](kft-resume-checkpoint.md#findings-from-the-absence-of-a-downstream-run)
and a different spec, and **DR-13** the same finding again against
[`kcb-cross-owner-posture.md`](kcb-cross-owner-posture.md#findings-from-the-absence-of-a-downstream-run)
and KCB's **§4.3** count; the three are recorded separately because each costs a different count its
gate and any one could be discharged without the others.
