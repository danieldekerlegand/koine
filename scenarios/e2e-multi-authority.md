# Scenario: two authorities in one fabric (ADR-0012 federation break-test)

**Purpose:** break-test the three federation §-edits that
[`../decisions/ADR-0012-federated-authority-roles.md`](../decisions/ADR-0012-federated-authority-roles.md)
licensed and `chief/52` applied — [`../specs/identity.md`](../specs/identity.md) §11 decision 1
(KINP 0.3.0, *Candidate*), [`../specs/capability-bus.md`](../specs/capability-bus.md) §3.1
(KCB 0.4.6, *Candidate*), and [`../specs/media-interchange.md`](../specs/media-interchange.md) §7.1
(KMI 0.3.4, *Candidate*). All three name this pass by name and are candidate on it. Same method as
the earlier passes — every step is marked ✅ *held* or 🔴/🟡 *broke*, §Findings collects the deltas,
and the bias is **adversarial**: the point is to find the silent break, not to demonstrate the happy
path. Where a step *does* hold, it holds because something was tried against it.

ADR-0012 states the property under test and names the hazards it wants hunted:

> **An authority is a role, not a hard dependency.**
> […] *The later pressure test must actively seek these hazards without assuming a particular
> deployment: cross-authority `same_as` reconciliation that over-merges or bypasses the `based_on`
> firewall; registry peering that returns stale, conflicting, or unresolvable authority records; and
> per-project CAS replication on reference that loses content identity, provenance, or availability
> semantics.*

Everything below is an attempt to make one of those three happen while every clause is satisfied.

**The story.** Two organizations run **independent authority domains** and decide to interoperate.
Domain **A** already exists — it is the deployment of
[`e2e-worlds-to-fabric.md`](e2e-worlds-to-fabric.md), with the fiction *Alderforest*, the NPC
*Général Renaud* modeled on the real Napoleon, and the identity firewall that keeps the two apart.
Domain **B** is an archive that has been running on its own the whole time, with its own identity
authority, its own registry, and its own store. Neither is subordinate to the other; neither was
built with the other in mind. They federate: the authorities reconcile, the registries peer, the
stores replicate on reference. Nothing is *added* to either deployment — federation is supposed to
be additive, so the test is whether two conformant single-authority deployments compose into one
conformant federated one.

**Setup (KINP §3.4 placeholder namespaces).**

| Domain | Role | Namespace | Holds |
|---|---|---|---|
| **A** | identity **authority** | `refkb` | real-world entities, `refkb:world:consensus-reality`, the §4 equivalence layer for A |
| **A** | control-plane **host** | `orchestrator` | registry A (§3), grant issuance for A (§5) |
| **A** | **knowledge producer** | `analyzer` | extraction from footage; run-scoped locals |
| **A** | **world producer** | `worldsim` | `worldsim:world:alderforest` and its inheritance metadata |
| **A** | **media producer** | `mediastore` | store A — advertises `fetch:asset` (KCB §2/§4) |
| **B** | identity **authority** | `archivekb` | archival entities, `archivekb:world:consensus-reality`, the §4 equivalence layer for B |
| **B** | control-plane **host** | `coordinator` | registry B (§3), grant issuance for B (§5) |
| **B** | **media producer** | `assetstore` | store B — advertises `fetch:asset` |

`archivekb`, `coordinator`, and `assetstore` are **additional placeholder registrations** in the
illustrative style of KINP §3.4, which says in terms that its rows are *"examples of what a
registration looks like, not a reserved set."* They are needed because the existing placeholder set
contains **exactly one** identity authority, one host, and one media producer — the vocabulary the
specs write their examples in is itself single-authority-shaped, which is the first small sign of
what the rest of this pass finds. No product or deployment is named anywhere below, and no step
depends on how either domain is operated.

---

## Step 1 — Both authorities go dark (KINP §6, ADR-0012's central invariant)

The first thing to attack is the invariant ADR-0012 rates highest, because if it fails nothing else
matters. Both authorities are made unreachable — not slow, **gone** — and every producer keeps
working.

```prolog
% analyzer, offline, no authority reachable:
entity(id(ent, 'analyzer:local', 'e-8842'), type(person)).                    % §6: never
commands(id(ent,'analyzer:local','e-8842'),
         id(ent,'analyzer:local','e-8842-army')) @ world(alderforest).        % §6: never
% mediastore, offline:
% asset id = blake3(bytes)                                                     % §6: never
```

Pushed harder than the clause needs: the claim above is stamped `@world(alderforest)`, and a world
stamp is *inside* the claim hash (§6). If the world id had to come from an authority, minting would
have acquired a round-trip through the back door. It does not — `worldsim:world:alderforest` is
minted by the **world producer** under its own prefix (§3.4, §5), so the stamp is available offline
too.

✅ **Held, and it is the strongest thing this pass found.** All three rows of §6's minting table
read *Never*, and federation does not touch any of them. Neither authority's absence changed an
identifier, blocked a claim, or forced a queue. §11 decision 1's *"MUST NOT turn a holder into a
mandatory online minting service"* is not merely asserted — there is no clause anywhere that could
have made it false, because the three minting rules are stated without reference to an authority at
all. Two authorities are exactly as absent as one.

🟡 Noted, not filed: what a producer **cannot** do offline is know *which* authority it will
eventually reconcile against. That is not a minting dependency, and §6 is right that reconciliation
is eventually-consistent — but it is the seam Steps 2–5 walk through.

---

## Step 2 — Both authorities reconcile the same descriptor (KINP §4.5, §5)

`analyzer:local:e-8842` was extracted from *fiction footage*. In the single-authority pass, `refkb`
got this right: different worlds, `alderforest` does not inherit-as-identity, therefore **`based_on`,
not `same_as`** — the firewall. Now `archivekb` is asked the same question, because the federation's
whole purpose is that either authority may answer.

`archivekb` runs §4.5's normative relation-choice rule and needs two operands:

1. **the candidate's world** — `worldsim:world:alderforest`; and
2. **whether that world inherits-as-identity** — per-world metadata (§5).

Both exist. Both are published by `worldsim`, in domain A, per
[ADR-0007](../decisions/ADR-0007-self-describing-participant.md). Neither reaches `archivekb`:

- Registry peering (KCB §3.1) forwards a **`find`** and merges **entries** — it returns `worldsim`'s
  *address*, not its world metadata. §3.1(a) is explicit that a registry indexes participants, and
  §3.1(b) that what comes back is an address.
- No KCB verb returns a world's inheritance mode. `describe` describes ports (§4); `fetch` is a CAS
  GET by `asset` id (§4, KMI §7); `invoke`/`subscribe` are capability calls. World records travel as
  KGP payloads, and nothing obliges domain A to send domain B a pack — nor obliges `archivekb` to
  have read one *before deciding*.

🔴 **BROKE (MA-2, High — structural).** §4.5's rule has **three** branches — *different
non-inheriting world* → `based_on`; *same or identity-inheriting world* → `same_as`; *ambiguous or
below threshold* → queue for review. The third covers low **confidence**. It does not cover a
**missing operand**: a match at confidence 0.93 whose world cannot be resolved satisfies neither of
the first two branches and is not "below threshold". There is no fail-closed default, and the
conformant-looking reading of *"same world, or an identity-inheriting world"* — *I see no other
world, so it is mine* — emits **`same_as`**. The firewall is not over-merged; it is simply **absent
on the second authority**, and one edge is enough.

🔴 **Second horn of the same break.** Suppose `archivekb` *does* obtain the operand. It must then
evaluate *"inherits-as-identity"* of a chain that terminates in
`refkb:world:consensus-reality` — a world in the **other** authority's namespace. B's own default
real world is `archivekb:world:consensus-reality` (§5: *"the identity authority's
`…:world:consensus-reality`"*). §4.2's equivalence layer ranges over **entities**; there is no
`same_as` for **worlds**, so B has no way to assert, and no way to be told, that A's consensus
reality is the same world as its own. The operand is unusable even when it arrives. → **MA-4**.

✅ **Held, narrowly:** §4.5's last sentence — *"a candidate reached only via an existing `based_on`
chain is never promoted to `same_as` by transitivity"* — was attacked directly and did not yield.
Chaining A's `based_on(npc-renaud, napoleon-i)` through B's links never produced a promotion. The
clause holds against exactly what it covers; MA-2 routes **around** it by minting a *fresh,
independent* `same_as` rather than promoting an existing edge, which is a case the clause does not
speak to.

---

## Step 3 — The consumer computes the merged view (KINP §4.1, §11 decision 2)

Now the part that makes MA-2 systemic rather than local. Per §4.1 *"the merged entity"* is a **view
computed at query time from the `same_as` closure** and is never written back. A consumer holding
both authorities' link sets computes one closure over their union. Three links, each conformant
where it was issued:

```prolog
% Issued by refkb (domain A). A's auto-apply threshold: 0.90.
same_as(id(ent,refkb,'napoleon-i'),
        id(ent,archivekb,'bonaparte-napoleon'), confidence(0.94), src('refkb:reconcile/7c1')).

% Issued by archivekb (domain B). B's auto-apply threshold for its own working world: 0.70.
same_as(id(ent,archivekb,'bonaparte-napoleon'),
        id(ent,'archivekb:local','e-2210'),     confidence(0.72), src('archivekb:reconcile/3f9')).

% Issued by archivekb, per MA-2 — the firewall edge that should have been based_on.
same_as(id(ent,'analyzer:local','e-8842'),
        id(ent,archivekb,'bonaparte-napoleon'), confidence(0.93), src('archivekb:reconcile/3fa')).
```

`archivekb:local:e-2210` is an entity extracted from a mislabelled archival record and is **a
different person**. Query time, §4.1, one closure:

```
refkb:napoleon-i ≡ archivekb:bonaparte-napoleon ≡ archivekb:local:e-2210 ≡ analyzer:local:e-8842
```

🔴 **BROKE (MA-1, High — structural).** The merged view asserts an identity **no authority
asserted** and **no review gate saw**. §11 decision 2 puts the threshold and the review queue
*inside* an authority — *"configurable per world"* — so a closure over two authorities' links is
governed by whichever link is weakest, and the weakest link was above **its issuer's** threshold, in
**its issuer's** scope, for **its issuer's** purposes. Nothing in §4.1 or §4.2 scopes a closure to an
authority, weights a link by its issuer, states how confidence composes along a path, or requires a
consumer to re-evaluate an imported link against its own threshold. KCB §5's *merge-review linkage*
is the nearest thing and does not reach: it routes packs from a **low-trust provider** to the review
queue, and an identity authority is not one.

The re-run of `e2e-worlds-to-fabric.md`'s **Q2** — *"list facts true of the real Napoleon"*, the
query whose exclusion of `commands(_, army-of-ash)` is that pass's core anti-contamination
property — now traverses `same_as` into `analyzer:local:e-8842` and returns a fiction-derived claim
and a mislabelled archival person's biography. **Delta A–E's firewall is intact and has been walked
around**, at query time, by a consumer that broke no clause.

🟡 Worth stating precisely, because it bounds the fix: **§4.1 is not wrong.** Non-destructive merge,
links-as-assertions, and a query-time view are exactly what make this *recoverable* — no source was
overwritten, and every link carries its `src` (§4.2), so a closure **could** be cut at an authority
boundary or annotated with its weakest issuer. Nothing says it must be.

---

## Step 4 — The same fact, twice, with two different hashes (KINP §6, KGP §3.3)

Both domains hold footage of the same event and both extract from it. Normalization (KGP §3, KINP
delta B) is applied faithfully on both sides — canonical argument order, CURIE normalization, world
stamping, literal formatting. Both then do what §6 says: re-express the claim against the canonical
entity.

```
A:  commands(refkb:napoleon-i, refkb:grande-armee)      @ refkb:world:consensus-reality
    → claim:blake3-7c1d…
B:  commands(archivekb:bonaparte-napoleon, archivekb:grande-armee)
                                                         @ archivekb:world:consensus-reality
    → claim:blake3-e93a…
```

🔴 **BROKE (MA-3, High — structural).** §6 says the claims converge *"after the resolver links those
entities and the claims are re-expressed against **the canonical entity**"* — singular, and written
when there was one holder of the role. There are now two canonical entities for one referent, so the
same fact mints two ids and delta B's cross-producer dedup — which §6 itself calls *load-bearing,
not optional* — stops at the authority boundary. §11 decision 1 nominates no re-expression target,
and nominating one would reinstate exactly the permanently privileged holder ADR-0012 rejected as
option (a). This is the sharpest tension in the ADR, and no §-edit owns it: KINP generalized *who may
hold the role*, not *what content-addressing means when two do*.

🔴 **BROKE (MA-4, High — structural) — and it does not need MA-3.** The **world** is inside the claim
hash (§6: *"predicate + args in canonical order + world"*), and §5 defines the default real world as
**the identity authority's** `…:world:consensus-reality`. Two authorities, two default real worlds.
So even where both domains reference an entity they *both* anchor to the same external authority —
`same_as(…, id(ent, wikidata,'Q517'), confidence(1.0))`, §4.4, no reconciliation ambiguity
whatsoever — the two claims still hash differently, on the world axis alone. And because §4.2's
equivalence layer is over entities, **nothing in the fabric can even state** that the two consensus
realities are one world.

The blast radius is not confined to identity: KGP §7's first-class filter is written
`accept records where … world = consensus-reality`, and that predicate has no referent in a
federated fabric. A consumer that writes it gets one domain's records and silently misses the
other's.

✅ **Held:** normalization itself never wavered. Given identical arguments and an identical world
stamp, both domains produced byte-identical canonical forms and identical hashes, across TSV and
every §4 projection. KGP §3.3's convergence property is **correct and intact within a domain**; what
it lacks is a cross-domain form. The mechanism did its job perfectly and has nothing to converge
*to*.

---

## Step 5 — The peered `find` (KCB §3, §3.1(b)(c)(d))

Control plane. `analyzer` asks registry A for a `mood(knowledge) → score:audio` path (the delta F
cross-plane leg). Registry A forwards the query to registry B, merges, and returns.

✅ **Held — the thing most likely to break did not.** §3.1(b)'s *peering resolves queries, it does
not relay traffic* survived a direct attempt to make a registry into a relay: a domain-B provider
reachable only from inside B is exactly the case where proxying is tempting, and the clause forbids
it, forbids naming a registry as a capability's address, and leaves the honest failure (*unreachable*)
rather than a silent proxy. [ADR-0001](../decisions/ADR-0001-control-plane-topology.md)'s
route-by-lookup rule is preserved verbatim under federation. §3's version ranking applied to the
merged set unchanged, and two authorities' entries for the same capability both came back, ranked and
unreconciled, per §3.1(d).

🔴 **BROKE (MA-9, Med).** Peering is **unbounded in two ways**. (i) There is no horizon: registries A
and B peer mutually, B also peers with a third, and §3.1(b) neither carries a query id, a hop limit,
nor a visited set — a `find` re-forwards. (ii) There is no de-duplication key: `mediastore`'s entry
reaches `analyzer` twice, once locally indexed and once via B, which crawled `mediastore`'s card
independently. Under §3.1(c) those are **two entries** (different serving peer, different
attribution), and §3.1(d) forbids silently picking one. The consumer is shown what looks like two
authorities offering a capability when it is **one participant seen twice**, and §3.1(d)'s otherwise
correct *never silently reconcile* rule is what keeps the duplicate in front of it.

🔴 **BROKE (MA-8, Med).** Three of §3.1's six clauses have **no carrier in the §3 response**. §3
defines `find(port | plane | world | capability) → matching manifests, ranked` — there is no field
that (c) can put the serving peer's KINP id in, no field that distinguishes a peered entry from a
local one, no field for the observation time (e) *SHOULD* carry, and no partial-result channel for
(f)'s *MUST report that a peer was unreachable*. The clauses are asserted rather than mechanized —
the same class of gap as delta **V-1** in
[`e2e-live-schema-mutation.md`](e2e-live-schema-mutation.md), and here it disables the attribution
that §3.1(c) calls *"the whole of what federation adds."*

---

## Step 6 — Who is `mediastore`? (KINP §3.4, KCB §3.1(c)(d))

`analyzer` receives, in one merged result set, two entries under the prefix `mediastore`. §3.1(c)
says attribute by **KINP id**; §3.4 says a prefix is *"reserved to exactly one minting authority and
is immutable once published."*

🔴 **BROKE (MA-7, Med-High).** Published **where**? §3.4's registry is *open* — *"any participant
that mints identifiers registers a prefix by PR"* — which is a single, shared, non-federated naming
authority. Two domains that built independently and federated later have no reason to have shared
it, and nothing in ADR-0012 or the three §-edits obliges them to. Two participants may therefore hold
the same prefix in good faith, and §3.1(d)'s merge attributes both to one id. ADR-0012 federated
three authority roles and left a **fourth** — the naming authority every one of them is attributed
by — singular and unmentioned. It is the one place where the ADR's own thesis is unapplied: a prefix
registry is an authority, and here it *is* a hard dependency.

The consequence composes with Step 3: MA-1's false closure is computed over ids whose prefixes are
assumed globally unique, and §4.2's `src` provenance — the annotation that would let a consumer cut a
closure at an authority boundary — is itself a namespaced id.

---

## Step 7 — The address resolves; the call does not (KCB §3.1, §5)

`analyzer` (domain A) picks the domain-B provider its peered `find` returned, dials it directly per
ADR-0001, and presents an `invoke:compose` token.

🔴 **BROKE (MA-6, High — structural).** §5: *"Grants are issued by the hosting org's governance (the
control-plane host's workforce governance)"* — `orchestrator`, in domain A. The domain-B provider
answers to `coordinator`. No clause says whose token a provider honors, how a grant issued under one
governance is presented to a participant under another, whether a `budget_units` ceiling means the
same quantity in two domains, or who is billed. §3.1 makes a peer's provider **discoverable** and
**directly dialable** and stops there; §5 was written for one host and was not touched by the
federation edits.

So peering returns addresses a consumer can reach and **cannot be authorized to call**. §3.1(f) is
careful that an unreachable peer *"MUST NOT invalidate … a grant already issued (§5)"* — correct, and
beside the point: the problem is not a grant invalidated, it is a grant that never existed, for a
capability discovery worked perfectly to find.

**This defect is not confined to the control plane.** KMI §7.1(b) routes cross-store replication
through the registry and §7.1(e) gates it on a **`fetch:asset` grant** — the same §5 grant, issued by
the same single host. Cross-domain CAS replication is therefore unauthorizable by exactly this hole,
which is why Steps 8–10 below are run as if the authorization question were already answered: it is
the only way to reach the clauses underneath it.

---

## Step 8 — The bytes cross the boundary (KMI §7.1(a)(c)(d))

Domain B references an asset held only in store A. Store B fetches it from store A, verifies, and
retains.

✅ **Held — the cleanest result in this pass, and the exact counterpart to MA-3.** Every attack on
content identity bounced:

- The id `mediastore:asset:blake3-a1b2…` was **byte-identical in both stores** (§7.1(a)). A store
  wanting to namespace, scope, or re-mint its copy is forbidden in terms, and there is no reading
  under which "which store served it" enters the identifier.
- Corrupted bytes were served deliberately; §7.1(c)'s mandatory verify-against-the-id **rejected**
  them, and the receiver neither re-minted an id nor served them under the requested one.
- A verified copy was indistinguishable from the original — which is not a convenience, it is what
  makes (a) true rather than merely stated.
- §7.1(d) was attacked from the projection side: a replicated copy tempted a spurious
  `derived_from` edge and a **C2PA** ingredient / **OMC** derivation in the §3.2/§3.3 projections.
  It produced none. Both projections bind to **content**, not to a holder, so replication is
  invisible to them — the ADR-0010 bridge survives federation without a clause.

**The contrast is this pass's central finding.** Content-addressed identity is **stable across
authorities exactly where the content *is* the identity** (assets — MA-nothing) and **unstable where
the identity is a *reference* to a minted entity or a named world** (claims — MA-3, MA-4). KMI §7.1
is sound because bytes need no authority to mean the same thing twice. KINP's claim hash is not,
because entity ids and world ids do.

---

## Step 9 — The copy escapes the policy that governed it (KMI §2, §7.1(d)(e), KGP §7)

Store B now holds the bytes and is asked for them by a third participant.

§7.1(e): the **serving** participant MUST evaluate the request against *"its own authority domain's
license, egress, and trust-tier policy (KGP §7,
[`../policy/license-classes.json`](../policy/license-classes.json))"* and MUST **fail closed**.

🔴 **BROKE (MA-5, High — structural). The gate has no operand.** The KMI §2 asset envelope carries
`id`, `media_type`, `bytes`, `source_world`, `attaches_to`, `produced_by`, `probe`, `prov`. It
carries **no `license` and no `egress` field**. License class (KGP §7.1) and egress class (KGP §7.2)
are **record** properties — carried on entity/assertion records and on relations via the shared
registry, filtered at *pack construction*. No clause anywhere attaches either to a sequence of bytes.
Store B, holding a verified copy, has nothing to read.

And it cannot recover the operand, because §7.1(d) — correctly, for the reason it gives — says
provenance and lineage **do not replicate implicitly**: *"A store that replicates bytes MUST NOT
synthesize an envelope, a lineage edge, or a `prov` record for them."* So (d) removes what (e)
requires. Both horns are conformant and both are wrong:

| Horn | Store B's behavior | Result |
|---|---|---|
| Fail closed on *unknown* | Refuse every replicated asset | Replication on reference is inoperative — the section describes nothing that can run |
| Evaluate under B's own policy | Serve per domain B's allowlist | The asset's governing policy ended at the boundary |

The second horn is the live one, and §7.1(e)'s own wording licenses it: *its own* authority domain's
policy. The single legitimate cross-domain fetch of Step 8 therefore **launders** the asset — once
retained under §7.1(b)'s *MAY retain*, every onward decision is made under the receiving domain's
rules. (e)'s closing sentence — *"a peer's willingness to serve a copy MUST NOT be read as having
pre-cleared that decision for anyone else"* — addresses the **reader** of a copy, not its
**retainer**, and the retainer is where the control is lost.

✅ **Held, and it is the half that works:** the *outbound* leg. An asset whose governing policy
forbids leaving domain A was requested from store A and store A **refused**, correctly, at its own
boundary, and no clause let domain B read that refusal as anything but a refusal. §7.1(e) is right
about **where** the decision is made. It is wrong only about the decision being **makeable at the
second holder**.

---

## Step 10 — The asset that will never arrive (KMI §7.1(b)(f), KCB delta L)

Store A is decommissioned. A §4 timeline in domain B references an asset store A held and store B
never fetched.

§7.1(f) says an unreachable store *"MAY delay or deny byte retrieval"* but MUST NOT invalidate the
`asset` id, its envelope, a lineage edge, a timeline that references it, an analysis claim derived
from it, or a grant — *"a reference whose bytes are not yet reachable is a **pending fetch**, never a
broken identifier."*

✅ **Held on its own terms, and the call is right.** Invalidating an id because a holder went away
would make identity depend on availability, which is the whole error ADR-0012 exists to avoid.
Timelines, lineage edges, and derived claims all survived, and KCB delta L's dangling-ref tolerance
absorbed the reference without a special case.

🔴 **BROKE (MA-10, Med).** *Pending* is now **unfalsifiable and unbounded**. With one store,
unreachability was an outage against a known holder and resolved either way. With N stores and
retention **optional** (§7.1(b): *MAY retain*), no participant is obliged to hold any given asset,
no clause requires a minimum replica count or a designated durable holder, and a consumer polling
every reachable store can never distinguish *not yet propagated* from *no holder remains*. A
timeline can reference an asset that will never resolve, indefinitely, with every clause satisfied
and nothing to report. Federation converted a **detectable outage** into a **permanent maybe** —
which is precisely the ADR's third named hazard, *"loses … availability semantics"*, arriving from
the direction it did not expect: not from a lost copy, but from a lost *answer about* the copy.

---

## Assertions — as KCS steps (KCS §3, §5)

Encoding this pass as a KCS document ([`../specs/conformance-scenario.md`](../specs/conformance-scenario.md))
is what makes it replayable across two real authority domains. The assertions it needs:

| # | Assertion | KCS §5 predicate | Step |
|---|---|---|---|
| 1 | Minting succeeds with every authority unreachable | `always_completes(scenario)` — *nearest available; asserts liveness, not independence* | 1 |
| 2 | A cross-world candidate yields `based_on`, from **either** authority | — **none** | 2 |
| 3 | The query-time closure does not cross an authority boundary | — **none** | 3 |
| 4 | The same fact mints one claim id across two domains | `resolves_to(local, canonical)` — *cannot express "and the same canonical"* | 4 |
| 5 | A peered entry is attributed to the peer that served it | — **none** | 5 |
| 6 | An unreachable peer is reported, not silently dropped | `refused(step)` — *inverted; a report is not a refusal* | 5 |
| 7 | A grant issued in one domain is refused in the other | `refused(step)` with `expect: "reject"` | 7 |
| 8 | Replicated bytes verify against the id, and mismatched bytes are rejected | — **none** | 8 |
| 9 | A `local-only` asset is not replicated across a boundary | `refused(step)` | 9 |
| 10 | A reference with no reachable holder is distinguishable from one with none at all | — **none** | 10 |

🟡 **BROKE (MA-11, cleanup — lands in KCS, not in the three gated specs).** Five of the ten have
**no predicate** and three more borrow a neighbour's meaning. KCS §5 has no vocabulary for an
**authority boundary** at all — *this entry came from that peer*, *this closure stayed inside one
authority*, *these bytes verified*, *this fetch was refused at a domain edge* are all unassertable,
because every §5 predicate was written for a fabric with one of each authority role. Same class as
delta **V-8** in [`e2e-live-schema-mutation.md`](e2e-live-schema-mutation.md), and it lands in the
same place: KCS is Ratified 0.2.0 and its own open question 1 (*fixed core plus an escape hatch*)
would have absorbed all five without a spec bump. Filed as **evidence for that question**, not as a
demand on a ratified spec. → KCS §5/§7.1.

---

## Findings — required spec deltas

| # | Severity | Gap | Delta | Spec |
|---|---|---|---|---|
| **MA-1** | **High (structural)** | §4.1 computes *"the merged entity"* as a query-time closure over the union of both authorities' links, while §11 decision 2 scopes the threshold and the review queue **inside** an authority. The closure is governed by its weakest link, which was conformant where it was issued. A merged identity results that no authority asserted and no review gate saw — Q2's anti-contamination property walked around without breaking a clause. | Make the closure authority-aware: a `same_as` carries its issuing authority (`src` already does, §4.2), a consumer MUST re-evaluate an imported link against its own threshold or cut the closure at an authority boundary, and a multi-authority path carries its weakest issuer + confidence into the view. | KINP §4.1/§4.2/§11.1-2 |
| **MA-2** | **High (structural)** | §4.5's relation-choice rule needs the candidate's **world** and its **inherit-as-identity** mode; both are published by the world producer in the *other* domain, no KCB verb returns them, and peering forwards queries about capabilities rather than world metadata. §4.5 has **no branch for a missing operand** — its third branch is about confidence — so a high-confidence match with an unresolvable world falls through to `same_as`. The firewall is not over-merged; it is absent on the second authority. | A **fourth, fail-closed branch**: operand unresolvable → emit `based_on` (or nothing) and queue, never `same_as`. Plus a route by which world metadata crosses a boundary — a world's inheritance mode is control-plane-discoverable, or an authority MUST NOT reconcile a candidate whose world it cannot resolve. | KINP §4.5/§5/§11.1, KCB §3.1/§4 |
| **MA-3** | **High (structural)** | §6's convergence rule re-expresses claims *"against **the canonical entity**"* — singular, written for one role holder. Two holders means two canonical entities for one referent and two claim ids for one fact, so delta B's cross-producer dedup — which §6 calls load-bearing, not optional — stops at the authority boundary. §11 decision 1 nominates no re-expression target, and nominating one reinstates ADR-0012's rejected option (a). | Either a **federation-scoped canonical form** (re-express against the shared external anchor — §4.4's `wikidata:` id — when one exists, and admit non-convergence when it does not), or state explicitly that claim-id convergence is **domain-scoped** and give consumers a cross-domain equivalence view instead of a shared hash. Silence is the one option that is not available. | KINP §6/§11.1, KGP §3.3 |
| **MA-4** | **High (structural)** | The **world** is inside the claim hash (§6) and §5 makes the default real world *the identity authority's* `…:world:consensus-reality`. Two authorities → two default real worlds → two hashes for one fact, **even for an entity both anchor to the same external authority** (§4.4). §4.2's equivalence layer ranges over entities only, so nothing can assert that two consensus realities are one world. KGP §7's `world = consensus-reality` filter loses its referent. | Extend the equivalence layer to **worlds** (a `same_as`/`aligns_with` over world ids, with the §4.3 firewall semantics preserved), **or** define a namespace-free canonical world token for consensus reality that every authority stamps. Whichever is chosen must also give KGP §7's world filter a federated reading. | KINP §5/§4.2/§6, KGP §7 |
| **MA-5** | **High (structural)** | KMI §7.1(e)'s egress/license gate has **no operand**: the §2 envelope carries no `license` and no `egress` field, and KGP §7's classes are *record* properties filtered at pack construction, never attached to bytes. §7.1(d) then forbids synthesizing the envelope that would carry them. So a second holder either refuses everything (replication inoperative) or serves under **its own** domain's policy — and one legitimate fetch plus §7.1(b)'s *MAY retain* ends the originating domain's control permanently. | Attach the governing policy to the **asset**, not to the holder: an `egress` + `license` pair on the §2 envelope (excluded from the id, like every other envelope field), travelling with a replication as the **one** thing (d) permits to accompany bytes, and re-evaluated by every holder. A copy whose policy did not travel MUST NOT be served onward. | KMI §2/§7.1(d)(e), KGP §7.1/§7.2 |
| **MA-6** | **High (structural)** | Discovery federates; **authorization does not**. §5 issues grants from *"the hosting org's governance"* — one host — while §3.1 makes a peer's provider discoverable and directly dialable. No clause says whose token a provider honors across a domain edge, how a grant crosses one, or whether `budget_units` denominates the same quantity in two governance domains. Peering returns addresses that cannot be authorized. KMI §7.1(b)(e) inherits the identical hole for `fetch:asset`, so cross-domain CAS replication is unauthorizable by the same defect. | A cross-domain grant form: a grant names its **issuing host** (a KINP id, already available) and a provider states which issuers it honors — a federation is a stated set of accepted issuers, not an implicit one. Spend ceilings either denominate in a stated unit or a cross-domain invoke is refused for want of one. Fail closed on an unrecognized issuer. | KCB §5/§3.1, KMI §7.1(b)(e) |
| **MA-7** | Med-High | Federation reintroduces one **unfederated** authority and does not say so: §3.4's namespace-prefix registry, which §3.1(c)'s attribution and §3.1(d)'s merge both assume is globally unique. Two domains that federated after the fact have no reason to share it and nothing obliges them to, so two participants may hold one prefix in good faith and the merged result set attributes both to one id. | State the prefix registry's status under ADR-0012 — either it is the one deliberately non-federated commons (and say so, with the collision rule for a deployment that does not upstream), or prefixes gain an authority-scoped form so a collision is representable rather than silent. | KINP §3.4, KCB §3.1(c)(d) |
| **MA-8** | Med | Three of §3.1's six clauses have **no carrier**. §3's `find` returns *"matching manifests, ranked"*: no field for the serving peer's KINP id (c), none marking an entry peered vs. local (c), none for the observation time (e) SHOULD carry, and no partial-result channel for (f)'s MUST-report-an-unreachable-peer. The clauses are asserted, not mechanized — disabling the attribution (c) calls *"the whole of what federation adds."* | Give the §3 response a shape: per-entry `served_by` (peer KINP id) + `observed_at`, and a result-level `incomplete[]` naming unreachable peers. Additive; no manifest field moves. | KCB §3/§3.1(c)(e)(f) |
| **MA-9** | Med | Peering is unbounded in two ways: no horizon (no query id, hop limit, or visited set, so mutual or three-way peering re-forwards a `find`) and no de-duplication key (one participant crawled by two registries is two entries under (c) that (d) forbids collapsing, so a consumer sees two authorities where there is one participant). | A forwarded `find` carries a query id + remaining hop count and a registry drops a query it has seen; and (d)'s never-silently-reconcile rule gains its converse — entries that resolve to the **same provider KINP id and `schema_id`** are one entry with multiple attributions, not two capabilities. | KCB §3.1(b)(c)(d) |
| **MA-10** | Med | §7.1(f)'s *pending fetch, never a broken identifier* is right and becomes unfalsifiable under federation: retention is *MAY* (b), no clause requires a minimum replica count or a durable holder, and a consumer polling every reachable store cannot distinguish *not yet propagated* from *no holder remains*. A detectable outage becomes a permanent maybe. | Not a durability mandate — koine specifies contracts, not operations. A **stateable** one: an asset reference MAY name a designated durable holder, and a store MUST be able to answer *not held, and not expected* distinctly from *not reachable*, so a consumer can conclude. | KMI §7.1(b)(f), KCB delta L |
| **MA-11** | Cleanup | KCS §5 has no vocabulary for an authority boundary — five of this pass's ten assertions have no predicate and three borrow a neighbour's meaning. Every §5 predicate was written for a fabric with one holder of each authority role. | Evidence for KCS open question 1 (*fixed core + escape hatch*); no demand on the ratified spec. | KCS §5/§7.1 |

**Not deltas — what this pass tried to break and could not.** **Offline-first minting** survived
both authorities being gone, including the world-stamp back door, and there is no clause that could
have made it fail (Step 1). **Asset identity** is byte-stable across stores under every attack tried:
re-minting is forbidden in terms, corrupted bytes were rejected by the mandatory verify, and a
verified copy is indistinguishable from the original (Step 8). **§7.1(d)'s refusal to make a copy a
lineage edge** held even through the §3.2/§3.3 projections — a C2PA hard binding and an OMC
derivation both bind to content, so replication is invisible to them and the ADR-0010 bridge needed
no federation clause. **§3.1(b)'s route-by-lookup rule** survived the case built to break it (a peer
reachable only from inside its own domain) and left an honest *unreachable* rather than a silent
proxy; §3's version ranking applied to the merged set unchanged and §3.1(d) returned both
authorities' entries without reconciling them. **§4.5's ban on promoting a `based_on` chain by
transitivity** was attacked directly across two authorities and did not yield — MA-2 routes around
it with a fresh edge rather than through it. And **§7.1(f)'s refusal to invalidate an id, envelope,
lineage edge, timeline, or grant when a store disappears** is the right call and held; MA-10 is
about what a consumer can *conclude*, not about what (f) protects.

Also noted and deliberately not filed: KINP §3.4's placeholder table has exactly one identity
authority, one host, and one media producer, so every worked example in the specs is written in a
single-authority vocabulary. That is a documentation observation, not a contract gap — but it is why
this pass had to mint three placeholder namespaces before it could state its setup, and a
federation-aware example set would make the seams above visible to a reader before a scenario finds
them.

---

## Verdict

**Each of the three §-edits is locally sound; jointly they are incomplete, and every break is at a
seam none of them owns.** This is the opposite shape from
[`e2e-live-schema-mutation.md`](e2e-live-schema-mutation.md), where one spec's model held and its
perimeter leaked. Here there is no argument anywhere against ADR-0012's decision — option (a) really
would have broken offline-first, option (b) really would have left reconciliation unspecified, and
Step 1 vindicates the central invariant outright. What the pass shows is that federation was applied
**per plane**, three times, by three edits that each correctly generalized *their own* surface — and
that the fabric's load-bearing properties live **between** planes.

Five of the six blocking findings are on that between:

- **Identity means two different things, and only one of them federates (MA-3, MA-4).** An asset id
  is stable across authorities because the content *is* the identifier; a claim id is not, because it
  is a *reference* to a minted entity and a named world, and federation multiplies both. KMI §7.1
  needed no convergence clause and KINP §6 needs one it cannot have without reinstating a privileged
  holder. That tension is real, it is in ADR-0012's own reasoning, and no §-edit surfaced it.
- **The firewall's operand does not cross the boundary the firewall now spans (MA-2), and the merged
  view is computed over a union nobody governs (MA-1).** KINP generalized *who may hold the role*
  and left *what a second holder can see* and *what a consumer may compose* untouched. Together they
  turn the one property `e2e-worlds-to-fabric.md` exists to protect into a query-time accident.
- **Discovery federates and authorization does not (MA-6).** KCB §3.1 is careful, correct, and
  delivers addresses that §5 cannot authorize a call to — and KMI §7.1's replication rides the same
  grant, so the bytes leg inherits it.
- **The policy gate at the boundary has no operand (MA-5).** KMI §7.1(e) puts the decision in exactly
  the right place and the §2 envelope carries nothing to decide with, while §7.1(d) — correctly —
  forbids inventing it. The two clauses are individually right and jointly inoperative.

**Blocking: MA-1, MA-2, MA-3, MA-4, MA-5, MA-6.** Should-fix in the same fold: MA-7, MA-8, MA-9,
MA-10. MA-11 is evidence for a KCS open question and blocks nothing. **None requires redesign** and
none reopens ADR-0012: MA-1/MA-2 add a fail-closed branch and an authority-aware closure, MA-3/MA-4
choose a convergence target and extend equivalence to worlds, MA-5 puts two fields on an envelope,
MA-6 names a grant's issuer, MA-7 states one registry's status, MA-8 shapes a response, MA-9 bounds a
forward, MA-10 makes absence answerable. Every one is additive.

**Not clean. KINP 0.3.0, KCB 0.4.6 and KMI 0.3.4 all stay Candidate** on the gate each of them names
as this pass.

> **Resolution:** — see *Re-ratification — what this pass gates*, below.

---

## Re-ratification — what this pass gates

The older scenarios keep a **Resolution** note naming the spec version that folded their deltas
([`e2e-worlds-to-fabric.md`](e2e-worlds-to-fabric.md) for A–E,
[`e2e-media-transform.md`](e2e-media-transform.md) for F–L,
[`e2e-producer-exhaust-finetune.md`](e2e-producer-exhaust-finetune.md) for FT-M…Q). This pass, like
[`e2e-live-schema-mutation.md`](e2e-live-schema-mutation.md), is **younger than the edits it tests**
— all three were published *naming this test as their gate* — so the note runs the other way round:
it records which spec version this pass gates, and what a clean re-run would license.

### Which specs this pass gates

| Spec | Version at the time of this pass | What this pass does to it |
|---|---|---|
| **KINP** ([`../specs/identity.md`](../specs/identity.md)) | 0.3.0, **Candidate** | **Gated spec 1 of 3.** §11 decision 1's federation clause, plus the §3.4/§4.1/§4.2/§4.5/§5/§6 surfaces that decision was wired through and never re-read against a second holder. Deltas **MA-1, MA-2, MA-3, MA-4, MA-7**; four blocking (**MA-1, MA-2, MA-3, MA-4**). This is KINP's **only** re-ratification count, so this pass is the whole of its gate. **Not clean → KINP stays Candidate.** |
| **KCB** ([`../specs/capability-bus.md`](../specs/capability-bus.md)) | 0.4.6, **Candidate** | **Gated spec 2 of 3, on one of its three counts.** §3.1 in full, plus §3's `find` response and §5's grants, which §3.1 composes over. Deltas **MA-6, MA-8, MA-9** and the control-plane half of **MA-2**; **MA-6** blocking. **Not clean → the §3.1 count does not close.** The other two counts — the [`e2e-media-transform.md`](e2e-media-transform.md) re-run against the §2 AgentCard-extension manifest, and the §7.5 fold that [`e2e-live-schema-mutation.md`](e2e-live-schema-mutation.md) left open — are **untouched by this pass and do not move**. |
| **KMI** ([`../specs/media-interchange.md`](../specs/media-interchange.md)) | 0.3.4, **Candidate** | **Gated spec 3 of 3, on one of its two counts.** §7.1 in full, plus the §2 envelope it needs an operand from and the §3 lineage graph it must *not* write to. Deltas **MA-5, MA-10**; **MA-5** blocking. Four of §7.1's own clauses **held under direct attack** — (a) byte-stable id, (c) verify-and-reject, (d) a copy is not a lineage edge (through the §3.2/§3.3 C2PA and OMC projections as well), (f) no invalidation. **Not clean → the §7.1 count does not close**; the outstanding KCB re-run count is untouched. |
| **KGP** ([`../specs/grounding-pack.md`](../specs/grounding-pack.md)) | 0.5.2, Candidate | **Named as a consequence surface, not gated.** No step contradicts a KGP clause on its own terms, and **no version moves** — but three deltas land partly here and cannot be folded without stating KGP's reading: **MA-3** (claim-id convergence, §3.3), **MA-4** (§7's `world = consensus-reality` filter loses its referent when there are two consensus realities), **MA-5** (the license/egress classes of §7.1/§7.2 are the operand KMI §7.1(e) has no carrier for). Whoever folds MA-3/MA-4/MA-5 answers for this column too. |
| **KCS** ([`../specs/conformance-scenario.md`](../specs/conformance-scenario.md)) | 0.3.0, Candidate | **MA-11 only, and as evidence, not a demand.** Five of this pass's ten assertions have no §5 predicate and three more borrow a neighbour's meaning; §5 has no authority-boundary vocabulary at all. That is input to KCS open question 1 (*fixed core + escape hatch*) — the same class as delta **V-8**. No clause is contradicted and **no version moves**. |
| [ADR-0012](../decisions/ADR-0012-federated-authority-roles.md) | accepted | **Not reopened.** Nothing in this pass argues against the decision: option (a) really would have broken offline-first, option (b) really would have left reconciliation unspecified, and Step 1 vindicates *an authority is a role, not a hard dependency* outright. Every delta is additive and lands in a spec, not in the ADR. |
| [`../schemas/`](../schemas/) | — | **No shape change, by construction.** This is a control/data-plane *behavior* test: it moves ids, addresses, grants and bytes, and reads no machine-readable twin. The twins that exist (`provenance`, `media-timeline`, `finetune-job`) are document shapes no step writes. Every `schemas/*.json` is byte-unchanged and still parses. |

### What a clean pass would license

On a **clean** re-run — Steps 1–10 all ✅, no delta reopened — the three federation §-edits
([ADR-0012](../decisions/ADR-0012-federated-authority-roles.md) → KINP §11 decision 1, KCB §3.1,
KMI §7.1; `chief/51` + `chief/52`) may leave **Candidate**, and each affected spec's changelog may
cite this document by name and section as the evidence, exactly as KINP's *Ratified decisions* §
already cites [`e2e-worlds-to-fabric.md`](e2e-worlds-to-fabric.md) for A–E and KCB's *Pressure test*
§ cites [`e2e-media-transform.md`](e2e-media-transform.md) for F–L.

*What* leaving Candidate means differs per spec, because this pass is the whole gate for only one of
the three:

1. **KINP 0.3.0 → Ratified.** This pass is its only count. A clean re-run — with **MA-1, MA-2,
   MA-3, MA-4** folded first and **MA-7** in the same fold — restores the status 0.2.1 held. Steps
   2, 3, 4 and 6 are the ones that must flip; Step 1 held and is the regression set.
2. **KCB — one count of three closes.** Folding **MA-6**, with **MA-8** and **MA-9** alongside,
   discharges the §3.1 count and nothing else: KCB remains Candidate until the media-transform
   re-run lands *and* the §7.5 deltas **V-2/V-4/V-5/V-7** are folded. All of MA-6/MA-8/MA-9 are
   additive, so they fold into the same **0.5.0** minor those already occupy.
3. **KMI — one count of two closes.** Folding **MA-5**, with **MA-10** alongside, discharges the
   §7.1 count; KMI remains Candidate until the KCB re-run lands. MA-5 adds two fields to the §2
   envelope and MA-10 adds an answerable *not held, and not expected* — additive, and **0.4.0 is
   already spoken for** by §4.4's EDL removal, so they land at **0.5.0** or in a patch that adds no
   field, not by displacing that removal.

**And a second condition, fabric-wide, that no fold can satisfy.** Under
[the ratification gate](../specs/README.md#the-ratification-gate), `candidate → ratified` requires a
machine-replayable **KCS encoding** whose assertions cite the clauses being ratified — a prose pass
is necessary and *no longer sufficient*. This pass's encoding is `kcs:multi-authority`, and it reads
**planned** in [`README.md`](README.md). **MA-11 is the reason it cannot simply be written**: KCS §5
cannot express five of the ten assertions this pass needs, so the encoding is gated on KCS open
question 1 in turn. A clean re-run of the prose is therefore the *first* of two things KINP needs,
not the last.

**What this pass does discharge** is ADR-0012's own requirement — that *"the later pressure test
must actively seek these hazards without assuming a particular deployment."* It named three; all
three were run and all three produced findings. Cross-authority `same_as` that over-merges or
bypasses the `based_on` firewall: found twice, **MA-1** (a closure nobody governs) and **MA-2** (a
firewall whose operand does not cross the boundary) — and note that the firewall itself, §4.5's ban
on promoting a `based_on` chain by transitivity, was attacked head-on and did **not** yield; MA-2
goes around it. Registry peering that returns stale, conflicting, or unresolvable records: found in
a **weaker form than the ADR feared** — the records resolve and §3.1(b)'s route-by-lookup rule held
— but the attribution that (c) requires has no carrier (**MA-8**) and the forward has no horizon
(**MA-9**). Per-project CAS replication that loses content identity, provenance, or availability
semantics: identity held under every attack tried and provenance held including through the
projections, but the **policy** that governs the bytes does not travel (**MA-5**) and availability
degrades to an unfalsifiable *pending* (**MA-10**). The test exists and has been run; what remains
is the fold.

> **Resolution (2026-08-24):** recorded against **KINP 0.3.0**, **KCB 0.4.6** and **KMI 0.3.4** —
> the three §-edits `chief/52` applied under
> [ADR-0012](../decisions/ADR-0012-federated-authority-roles.md), each of which names this pass as a
> re-ratification count. Deltas **MA-1…MA-11** are **open — none folded**, and **MA-1…MA-6** are
> blocking, so **all three stay Candidate**: this pass is the whole of KINP's gate, one of three
> counts on KCB, and one of two on KMI. No other spec version moves — MA-11 is evidence for a KCS
> open question, KGP 0.5.2 is a consequence surface rather than a gated spec, ADR-0012 is not
> reopened, and every `schemas/*.json` is byte-unchanged. When a fold lands, amend this note to name
> the version that closed each delta — as [`e2e-media-transform.md`](e2e-media-transform.md)'s
> Resolution does for F–L — after which this document stands as the historical record of what the
> break-test found.
