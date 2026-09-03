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

**MA-12 and MA-13 are not in the table above, deliberately.** Both were returned by the
**2026-09-03 re-runs** of the folded text, not by this pass, and the table is the record of what the
2026-08-24 pass found. Each is defined once: **MA-12** in *Re-run — Steps 1–10 walked by hand against
the folded text*, under Step 10; **MA-13** in *Re-run — Steps 8–10 re-attacked after the KCB walks*,
under Step 9.

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

> **Resolution:** — see *Fold status*, immediately below, and *Re-ratification — what this pass
> gates*. The verdict above is the record of the **pass**, stated at the versions it ran against;
> the deltas were folded on 2026-08-26 at KINP 0.4.0 / KMI 0.3.5 / KCB 0.4.9, and all three specs
> are still Candidate — on a re-run, not on these findings.

---

## Fold status — MA-1…MA-11 re-read against the folded specs (2026-08-26)

The fold landed as `chief/85-fold-the-federation-breaks`: **KINP 0.4.0**, **KMI 0.3.5**, **KCB
0.4.9**, plus an Editorial entry in **KGP 0.5.2** stating its reading at no version cost. What each
disposition is and *why it stops where it stops* is reasoned in
[`../docs/reference/federation-fold-dispositions.md`](../docs/reference/federation-fold-dispositions.md);
what follows is this document's own re-read — each step run again against the folded text, saying
whether the break it recorded still reproduces.

**A fold does not close a gate.** All three specs stay **Candidate**: each of the counts below is
now a **re-run of the relevant steps against the folded text**, which has not happened. Nothing here
may be cited as a pass.

| # | Folded in | Does the step's break still reproduce? |
|---|---|---|
| **MA-1** | KINP 0.4.0 **§4.1** | **No.** Re-running Step 3's three-link closure: a consumer MUST now cut at the authority boundary or re-evaluate each imported link against its own threshold, so `archivekb`'s 0.72 link — below A's 0.90 — no longer enters A's closure, and any view over a multi-authority path carries its weakest issuer and lowest confidence. The false identity does not form, and the fix is independent of MA-2's: it holds even where a bad link exists. §4.1's non-destructive query-time model is unchanged, as Step 3's 🟡 note asked. |
| **MA-2** | KINP 0.4.0 **§4.5** | **No.** Step 2's 0.93 match against an unresolvable world now meets the fourth branch and MUST NOT be emitted as `same_as`; it is `based_on` or nothing, queued under §11 decision 2. The conformant-looking *"I see no other world, so it is mine"* reading is closed off in terms. **Open by design:** the operand still does not cross the boundary, so cross-domain reconciliation of a candidate whose world is resolvable *in principle* now queues rather than auto-applies — a **degradation**, not the break, and the remainder is DEFER-A with its trigger stated. |
| **MA-3** | KINP 0.4.0 **§6** | **No — and read this one precisely.** Step 4's two hashes still differ, and that is now the **specified** answer rather than an unanswered clause: convergence is domain-scoped, the re-expression target is the participant's own authority's canonical entity, and the cross-domain instrument is the §4 equivalence view. The defect was *silence*, which Findings called the one unavailable option; the symptom is retained deliberately, because the alternative moves ids. No claim id in this document changes. Remainder: DEFER-B. |
| **MA-4** | KINP 0.4.0 **§4.2**, **§5** (+ `registry/relations.tsv`) | **No.** Step 2's second horn — B has no way to be told A's consensus reality is its own — is answered by the new core relation `world_aligns_with`, which the fabric can now state and §11 decision 2 governs like any other link; §5 says the two defaults are distinct until something asserts otherwise. Step 4's KGP-§7-filter consequence reads over that closure. The relation is **new**, not a widened `same_as`: no signature moved, so no existing claim id moved. |
| **MA-5** | KMI 0.3.5 **§2**, **§7.1(d)(e)** | **No.** Both horns of Step 9's table are closed. Store B now reads the asset's **own** `license`/`egress`, which travel with the bytes as the single carve-out (d) permits, and evaluates them **in addition to** its own domain's policy; a copy whose policy did *not* travel MUST NOT be served onward across a boundary. Laundering-by-retention is closed at the retainer, which is where Step 9 said control was lost. The outbound leg that already held is untouched, and (d)'s no-synthesis rule is intact — the pair is carried, never invented. |
| **MA-6** | KCB 0.4.9 **§5** (+ optional `auth.accepted_issuers[]` in **§2**) | **No.** Step 7's dial now has an answer: a grant names its issuing host by KINP id, the domain-B provider states which issuers it honours and **fails closed** on one it does not, and a ceiling crossing the boundary states its unit or the `invoke` is refused for want of one. Steps 8–10 no longer have to be run *"as if the authorization question were already answered"*. KMI's `fetch:asset` leg inherits it by citation. **Deliberately unspecified:** token format, issuance, rotation, issuer discovery — §5's own boundary, unmoved. |
| **MA-7** | KINP 0.4.0 **§3.4** | **No, as a contract gap.** Step 6's *published **where**?* is answered: the prefix registry is the one deliberately **non-federated commons**, federating domains MUST establish prefix disjointness before merging an attributed result set, and a collision is a **reportable defect** that blocks attribution — never a silent merge, a preference, or a rewrite. What koine can do is make the collision *representable* (via MA-8's `served_by`) and forbid resolving it silently; it cannot prevent two domains from having minted one prefix, and the clause says so. |
| **MA-8** | KCB 0.4.9 **§3** (+ pointers from **§3.1(c)(e)(f)**) | **No.** Step 5's three carrier-less clauses have carriers: per-entry `served_by` + a resolvable address (c), per-entry `observed_at` (e), result-level `incomplete[]` (f). Attribution — *"the whole of what federation adds"* — is mechanized rather than merely asserted. Emitted only by a federating deployment; a single-registry `find` is byte-unchanged. |
| **MA-9** | KCB 0.4.9 **§3.1(b)**, **§3.1(d)** | **No.** Step 5(i): a forwarded `find` carries a query id and a remaining hop count and a registry drops one it has seen, so the mutual/three-way re-forward terminates. Step 5(ii): `mediastore` seen twice — same provider KINP id, same `(name, version)`, same `schema_id` — is now **one** entry with two attributions. **One honest residual:** `schema_id` is optional (§2), so where a provider publishes none the three-part key cannot be met and §3.1(d)'s existing conservative default applies — both entries are returned, unreconciled. That is the safe direction and not a new break; a consumer resolves it against the provider's own card, as (e) already requires. |
| **MA-10** | KMI 0.3.5 **§7.1(f)** | **No, for the reachable set.** Step 10's consumer can now conclude: a store MUST answer *not held, and not expected* distinctly from *not reachable*, so polling the reachable set terminates instead of waiting forever. (f)'s substance is untouched — nothing is invalidated, whatever the answer. **Open by design:** no minimum replica count, no retention obligation, no designated durable holder (DEFER-C) — koine specifies contracts, not operations. |
| **MA-11** | — **not folded** | **Yes, and deliberately.** KCS §5 still has no authority-boundary vocabulary, and this pass's five unexpressible assertions stand. It was filed as **evidence** for KCS §7 open question 1, which already cites it by name alongside V-8; folding a vocabulary into §5 now would pre-empt the question the evidence feeds. No KCS version moves. It remains the reason `kcs:multi-authority` cannot assert what this pass needs — see *What a clean pass would license*. |

**What the fold did not touch, on purpose.** Everything under *Not deltas* above is unchanged: Step
1's offline-first minting, §7.1(a)/(c)/(d)'s asset identity and its survival through the §3.2/§3.3
projections, §3.1(b)'s route-by-lookup rule, §3's version ranking over a merged set, §4.5's ban on
promoting a `based_on` chain by transitivity, and §7.1(f)'s refusal to invalidate anything. Those are
the regression set for the re-runs.

**What this pass taught about the pattern, as opposed to the clauses.** Three specs deferred one
question, [ADR-0012](../decisions/ADR-0012-federated-authority-roles.md) decided it once, and each
spec's note predicted its plane would *"likely resolve the same way."* This pass is the test of that
prediction, and the answer is split: the **decision** held at all three planes — the *Not deltas* set
above is three-for-three on ADR-0012's invariant — while the **applications** broke in three
different kinds of way (KINP on *meaning*, KCB on *carriage*, KMI on *decidability at the far
holder*), none of which another plane's pass would have found. That finding, the severity
distribution that goes with it, and the one authority the pattern needed to exempt (MA-7's prefix
registry) are recorded in
[`../docs/reference/federation-fold-dispositions.md`](../docs/reference/federation-fold-dispositions.md),
under *What the pressure test taught about the pattern, not the clauses*. **DR-9** bounds all of it:
domain B was a stand-in in the 2026-08-24 run, so the properties that need the far authority to be
independently operated await a second adopter, not another document.

---

## Re-run — Steps 1–10 walked by hand against the folded text (2026-09-03)

**What this section is.** The *Fold status* table above is a **re-read**: it says, per delta,
whether the break the 2026-08-24 pass recorded still reproduces. It is not the re-run. Each of the
three counts named under *Re-ratification* reads as **a re-run of this pass against the folded
text**, and this section is that re-run: Steps 1–10 walked again, adversarially, against
**KINP 0.4.0 / KCB 0.5.0 / KMI 0.3.5** as published, with a verdict recorded **per step** rather
than in aggregate.

**Method, and why it is a hand-walk.** Every step below was walked against the **prose of the
current specs**, section by section, with the same bias the original pass declares: *prefer finding
breaks over asserting correctness*, and where a step holds, it holds because something was tried
against it. It is deliberately **not** a replay of `kcs:multi-authority`. **DR-8** is the standing
reason: that encoding returned **`green`** over this very pass with six blocking deltas open,
because an encoding does not assert a delta its spec has not folded. A green run is evidence about
the encoding's assertions; it is not a verdict on the folded text, and it cannot be one for clauses
written after it was frozen. The 2026-08-24 run is cited below only where it corroborates a step it
actually asserted.

**Verdict in one line, per count.** KINP's four steps **flip** and Step 1 holds. KCB's Steps 5–7 and
KMI's Steps 8–10 **do not** — one blocker each, both of the same kind, both already visible from
inside this repo. Neither is a reopening of ADR-0012, and neither is a defect in the fold's
reasoning; both are the **carrier** class MA-8 named, arriving one clause further out than MA-8's
fold reached.

### Per-step verdicts

| Step | Deltas at issue | Gates | Verdict |
|---|---|---|---|
| **1** | — (regression set) | KINP | ✅ **Holds.** Unchanged, and nothing folded touches it. |
| **2** | MA-2, MA-4 (2nd horn) | KINP | ✅ **Flips.** §4.5's fourth branch is fail-closed; §4.2's `world_aligns_with` gives the second horn an instrument. |
| **3** | MA-1 | KINP | ✅ **Flips.** The false closure does not form, from **either** domain's side. |
| **4** | MA-3, MA-4 | KINP | ✅ **Flips.** The symptom is retained **by specification**; the defect was silence, and silence is gone. |
| **5** | MA-8, MA-9 | KCB | 🔴 **Does not flip.** MA-8's and MA-9's own folds hold — and [ADR-0014](../decisions/ADR-0014-federated-merge-merges-attributions.md)'s clause, which lands on this count, is **not written into the spec**. |
| **6** | MA-7 | KINP | ✅ **Flips.** §3.4 states the exception, the disjointness precondition, and the collision rule. |
| **7** | MA-6 | KCB | ✅ **Flips.** A grant names its issuer, a provider names the issuers it accepts, and an unrecognized one fails closed. |
| **8** | — (regression set) | KMI | ✅ **Holds**, including through §2's two new fields. |
| **9** | MA-5 | KMI | ✅ **Flips.** The gate has an operand and the retainer is where it now bites. *(Superseded the same day — the second pass below reverses this on **MA-13**.)* |
| **10** | MA-10 | KMI | 🔴 **Does not flip.** The three-valued answer is required of a store and **no wire carries it** → new delta **MA-12**. |

### Step 1 — Both authorities go dark ✅ *holds (regression)*

§6's minting table is byte-unchanged: all three rows still read **Never**, and the two paragraphs the
fold added to §6 (domain-scoped convergence) and §5 (each authority's own consensus reality) add no
operand that has to be fetched. The world-stamp back door was pushed again and is still shut —
`worldsim:world:alderforest` is minted by the world producer under its own prefix (§3.4), which the
fold did not move.

Three *new* clauses were checked for a minting dependency they might have smuggled in, because that
is the way this invariant would realistically fall:

- **§3.4's prefix-disjointness MUST** binds *"before merging any result set that attributes entries
  by namespace"* — a **merge-time** obligation on a federating deployment, not a registration-time
  or mint-time one. Registration is still by PR and still offline.
- **§4.5's fourth branch** makes an unresolvable operand fail closed. Under total darkness *every*
  operand is unresolvable, so the resolver emits `based_on` or nothing and queues — which is
  §6's own *eventually-consistent, never blocking* model doing exactly what it says. Reconciliation
  degrades; minting does not.
- **`world_aligns_with`** is an assertion like any other (§4.2, §7.1), so it is minted under §6's
  assertion row — hash of the normalized claim, no round-trip. It is registered in
  [`../registry/relations.tsv`](../registry/relations.tsv) as a core binary relation, checked.

✅ **Held.** Two authorities are still exactly as absent as one, and the fold added no clause that
could have made it otherwise. *Corroborated by the 2026-08-24 run:* row 1 of the assertions table
(`always_completes` with both authorities dark) is one of the eight the encoding does assert.

### Step 2 — Both authorities reconcile the same descriptor ✅ *flips*

**First horn (MA-2) — closed in terms.** §4.5 now has a **fourth branch** — *an operand is
unresolvable → emit `based_on`, or nothing, and queue; **never `same_as`***  — with a paragraph that
says why it is not the third: the third is about **confidence**, the fourth about a missing
**operand**. Re-running the attack: `archivekb` gets a 0.93 match against a candidate whose world it
cannot resolve. 0.93 clears any threshold, so the third branch is still not engaged — and the fourth
now is: *"where the candidate's world, or that world's inheritance mode, cannot be resolved, the
resolver MUST NOT emit `same_as`, irrespective of the match score."* The conformant-looking reading
the original pass found — *I see no other world, so it is mine* — has no branch left to arrive
through.

Pushed further, two ways, and it did not yield either time:

- **The both-operands dodge.** A resolver might resolve the world **id** syntactically and stop,
  claiming the operand arrived. The clause names *both* the world and *that world's inheritance
  mode*, so a resolved id with unresolved metadata is still the fourth branch.
- **The never-tried dodge.** A resolver that never attempts resolution has, as a matter of fact, not
  resolved the operand, and the clause binds on the state of the operand rather than on effort. Both
  readings land on the same fail-closed side, which is the property that matters.

**Second horn (MA-4) — has an instrument.** B can now *be told* that A's consensus reality is its
own: `world_aligns_with` over two world ids, §11 decision 2 governing it like any other link. And
§4.2's firewall bullet was attacked directly — *can an alignment be read as inheritance-as-identity,
so that aligning two worlds promotes a `based_on` into a `same_as`?* No: the bullet forbids exactly
that reading and §4.5 *"continues to read a world's **own** inheritance metadata (§5) — never this
link."* **Aligning two fictional worlds does not make either of them real** is stated in the spec,
not inferred here.

✅ **Flips.** 🟡 **Residual, declared, not a break:** the operand still does not cross the boundary,
so a cross-domain candidate whose world is resolvable *in principle* now **queues** rather than
auto-applying. §4.5 names that as the whole of the fold and defers the route (**DEFER-A**) with a
trigger. A degradation in the fail-closed direction is the right side of this clause to be on, and
the pass asked for a fail-closed default rather than a route.

### Step 3 — The consumer computes the merged view ✅ *flips*

The three links were re-issued verbatim and the closure recomputed under §4.1's new rule, **from both
domains' sides**, because a rule that only works for the domain that happens to be reading it is not
a fix.

**From domain A (threshold 0.90), option 1 — cut at the authority boundary.** A traverses only
`refkb`-issued links. Link 1 (0.94, `refkb`) enters; links 2 and 3 (both `archivekb`) do not. The
closure stops at `archivekb:bonaparte-napoleon` and the fiction-derived `analyzer:local:e-8842`
never joins it.

**From domain A, option 2 — re-evaluate each imported link.** This is the branch worth walking
slowly, because the threshold **alone** does not do the job and the clause knows it:

- Link 2 (0.72) is below A's 0.90 → review queue, not the closure. Threshold suffices.
- Link 3 is **0.93 — above A's threshold**. Re-evaluated on confidence alone it would enter, and
  MA-1's contamination would reproduce through it. What stops it is the clause's own wording:
  *"exactly as if the link had been proposed to it under §4.5."* A, re-evaluating in domain A, **can**
  resolve `worldsim:world:alderforest` (its own world producer), finds a different,
  non-identity-inheriting world, and lands on §4.5's **first** branch — `based_on`, which is not a
  `same_as` link and does not enter a `same_as` closure.

So the false identity does not form under either option. 🟡 **Worth recording precisely, because a
reader can miss it:** the phrase *"exactly as if the link had been proposed to it under §4.5"* is
**load-bearing** in option 2, and an implementer who reads only the summary clause beside it
(*"routing anything below that threshold to its own review queue"*) implements a threshold check,
lets the 0.93 link through, and reproduces MA-1 while believing itself conformant. The clause is
correct; its own restatement is narrower than it is.

**From domain B (threshold 0.70).** Links 1 and 2 clear B's threshold. Link 3 is re-evaluated under
§4.5 by a resolver that **cannot** resolve `alderforest` — the fourth branch — so it is not a
`same_as` and does not enter. B's closure is `napoleon-i ≡ bonaparte-napoleon ≡ e-2210`: a merge of
a real person with a mislabelled archival person, at B's own threshold, in B's own scope, which was
always B's call and is conformant. The fold deliberately does **not** second-guess an authority
inside its own domain, and Q2's anti-contamination property — the fiction edge — is what it
protects. Correct scope.

**The third obligation** was checked separately: a view reached over a multi-authority path MUST
carry the **weakest issuer and lowest confidence**. Under option 1 the surviving path is one
`refkb`-issued link at 0.94 crossing into `archivekb`'s namespace — still a multi-authority path,
still annotated. The operand is §4.2's existing `src` and **no envelope field was added**, which
Step 3's original 🟡 asked for by name.

✅ **Flips.** 🟡 **One reading note, not a delta:** §4.1 offers the two options to *"a consumer"*, and
option 2 presumes the consumer **has** a threshold and a §4.5 resolver — an authority-shaped
participant. A plain knowledge consumer has neither, so only option 1 is operable for it. The
disjunction still leaves it a conformant, and the more conservative, route; §4.1 simply does not say
which readers option 2 is available to.

### Step 4 — The same fact, twice, with two different hashes ✅ *flips*

The two hashes still differ. **That is the flip, not a failure to flip**, and the distinction is the
whole of MA-3: the original finding was that §6 said *"the canonical entity"* — singular, written for
one holder — and then said nothing about what that means with two, while calling the dedup it
governs *load-bearing, not optional*. Findings named silence as the one option not available.

Re-walked against §6 as it now stands, the answer is present and exhaustive: the re-expression target
is **the re-expressing participant's own authority domain**'s canonical entity; convergence holds
**within** a domain and stops at its boundary; two domains minting the same fact mint two `claim` ids
and that is *"conformant, not a defect"*; and the cross-domain instrument is named — the §4 equivalence
view, `same_as` over entities plus `world_aligns_with` over worlds, read under §4.1's weakest-link
rule. §6 also states, on the record, the two things it declines to do and why (a federation-wide
target reinstates ADR-0012's rejected option (a); a federation-scoped canonical form would have to be
mandatory and would move ids already minted → **DEFER-B**).

**MA-4's independent half** was re-walked too, on the case that needs no reconciliation ambiguity at
all — both domains anchoring to `wikidata:Q517` under §4.4. The two claims still hash differently on
the **world** axis, and §5 now says so deliberately: each authority's `…:world:consensus-reality` is
its own, sameness is *asserted, never assumed*, a consumer **MUST NOT** infer world identity from the
local part of a world id, and **MUST NOT** rewrite either into the other — which is the clause that
protects the ids the fold refused to move.

**The blast radius was checked at its far end**, since MA-4's consequence was never confined to KINP:
KGP §7's `accept records where … world = consensus-reality` filter. §4.2 gives it a federated reading
through the `world_aligns_with` closure *"without KGP restating anything"* — and the filter fails in
the safe direction under §4.1's weakest-link rule: an alignment link below the reading domain's own
threshold is queued rather than traversed, so the filter narrows to that domain's own records instead
of silently widening to another's. **No KGP clause moved, and KGP's own reading is on its record** as
a dated Editorial entry.

✅ **Flips.** The mechanism that *"did its job perfectly and has nothing to converge to"* is now told,
normatively, what it converges to and where it stops.

### Step 5 — The peered `find` 🔴 *does not flip*

**MA-9(i) — the horizon holds.** §3.1(b) requires a query id and a remaining hop count on a forwarded
`find`, a decrement per forward, no forward at zero, and a **drop** on a query id already seen. The
mutual A↔B and the three-way A→B→C→A re-forwards both terminate. The clause also states its own
boundary — it bounds *a query, not a topology* — which is the right scope: no membership protocol is
implied.

**MA-9(ii) — the converse holds, with the residual it declares.** `mediastore` reached twice, once
locally indexed and once via B, resolves to the same provider KINP id, the same `(name, version)` and
the same `schema_id` → **one** entry carrying **both** `served_by` attributions. The honest residual
is on the record: `schema_id` is optional (§2), so where a provider publishes none the three-part key
cannot be met and §3.1(d)'s conservative default returns both, unreconciled. Safe direction.

**MA-8 — the carriers exist.** §3's `find` response now defines per-entry **`served_by`** (the
serving registry's KINP id, the peer's for a peered entry) with a resolvable address, per-entry
**`observed_at`**, and result-level **`incomplete[]`**. All three clauses §3.1 asserted without a
carrier — (c), (e), (f) — have one, and a single-registry deployment emits none of it.

🔴 **BROKE — and it is a break the repo had already found and had not yet written.**
[ADR-0014](../decisions/ADR-0014-federated-merge-merges-attributions.md) (Accepted 2026-08-26)
records that §7.3's **deprecated marking and its removal version have no carrier** in §2's manifest
or §3's `find` response, and that §3.1(d)'s de-duplication converse — MA-9's own fold, exercised
above — keys on `(provider KINP id, (name, version), schema_id)`, **none of which a marking moves**.
Re-walked here and it reproduces exactly:

- Registry A holds a **stale** attribution of `compose 1.4.0` crawled before the provider deprecated
  it. Registry B holds a **fresh** one, marked deprecated with its removal version. Same provider
  id, same `(name, version)`, same `schema_id`.
- §3.1(d)'s converse **requires** them to be returned as **one** entry. Neither §2 nor §3 defines a
  field for the marking, so the merged entry's marking is undefined — and §3's own ranking rule
  (*"MUST rank a **deprecated** entry below any non-deprecated entry … while still returning it,
  marked and carrying its removal version"*) has nothing to read.
- §3.1(e) — *resolve any disagreement against the provider's own card* — **cannot fire**: the
  converse has just removed the visible disagreement. The consumer sees one entry and no reason to
  look.

Verified against the text rather than assumed: `grep`ping `specs/capability-bus.md` for a deprecation
field on a capability entry returns none — §2's entry carries `name`, `version`, `binding`,
`inputs`/`outputs`, `schema_id`, `payload_schema_id`, `cost` and the manifest-level `auth`/`signing`,
and §3's response shape carries `served_by`, `observed_at` and `incomplete[]`. ADR-0014's own
disposition is explicit about where this lands: *"**Not yet written**: the clause lands with counts
(ii) and (iii)"*, and **count (iii) is this walk**. Its four parts — a carrier for the marking, *a
registry MUST NOT synthesize a value for a field outside the merge key*, *where the field is a gate
the restriction wins*, and *this does not license reconciling two authorities* — are the fold this
step is waiting on.

**Why this is Step 5's verdict and not a footnote.** The step is *the peered `find`*, and the thing
being re-run is §3.1(d)'s merge. A merge rule that produces an entry whose gate-bearing field is
undefined has not walked clean, whatever the two deltas it was written to close did. It is also
precisely the class MA-8 folded — *a clause asserted with no carrier* — reappearing one clause
outside the boundary MA-8's fold drew, which is the pattern this pass's own *Fold status* warns about.

### Step 6 — Who is `mediastore`? ✅ *flips*

§3.4 answers *published **where**?* in terms. The prefix registry is stated as **the one deliberately
non-federated commons** *with the reason* — registration confers a name, not a privilege, so
federating it buys nothing, while a federated namespace registry would make minting depend on
reaching an online authority, which is the dependency ADR-0012 exists to remove. That is the fourth
authority the original finding said ADR-0012 had left singular and unmentioned, now named and
exempted on the record rather than by omission.

The collision rule was walked on the case that produced the finding — two domains that federated
after the fact, both holding `mediastore` in good faith:

- Disjointness MUST be established **before** merging any namespace-attributed result set, so the
  collision is caught at federation time rather than discovered in a merged `find`.
- A collision is a **reportable defect** that blocks attribution for every identifier under the
  prefix, and MUST NOT be resolved by silently merging, by preferring either side, or by rewriting —
  a rewrite would move every identifier under the prefix, which is the reason the immutability rule
  exists.
- It is **representable**, which is what makes it reportable: MA-8's `served_by` makes the two
  entries arrive visibly served by two different authorities.

The alternative is **rejected on the record** — an authority-scoped prefix form would change the
shape of every identifier in the fabric to represent a condition this rule makes reportable at no
cost. And the documentation observation the original pass filed *deliberately not as a delta* — that
§3.4's placeholder table was single-authority-shaped, so this pass had to mint three namespaces before
it could state its setup — is **closed too**: `archivekb`, `coordinator` and `assetstore` are now
illustrative rows in §3.4, with the single-authority set labelled as such.

✅ **Flips.** 🟡 **One navigability note, not a delta:** §3.4 points *forward* at KCB §3.1(c)(d), and
KCB §3.1 does not point back — a registry implementer reading KCB alone attributes and merges by
namespace without meeting the disjointness precondition that governs it. The obligation binds the
federating deployment either way and the define-once rule puts the clause in the right spec; what is
missing is the citation in the citing direction.

### Step 7 — The address resolves; the call does not ✅ *flips*

Re-dialled. §5 now requires a grant to name its **issuing host** by KINP id, and a provider to state
which issuers it honours via §2's optional `auth.accepted_issuers[]`. Walked through the four cases:

- `analyzer` presents an `orchestrator`-issued token to a domain-B provider that accepts only
  `coordinator` → **refused, fail closed**, *"exactly as it would for a missing grant"*. The
  original finding — an address a consumer can reach and cannot be authorized to call — is now a
  **specified refusal** rather than an unanswered question.
- The domain-B provider lists `orchestrator` in `accepted_issuers[]` → the call is authorized. **A
  federation is a stated set of accepted issuers, never an implicit one**, and *"publishing a card
  that a peer registry indexes is not consent to another domain's governance"* answers the
  discovery-implies-authorization slip directly.
- A provider stating no issuers honours only its own domain's — so a single-host deployment behaves
  exactly as before, and a federating one has to say so deliberately.
- `budget_units` crossing the boundary MUST state its unit or the `invoke` is **refused for want of
  one**; never converted silently. The quantity question the original finding raised — *whether a
  ceiling means the same thing in two domains* — is answered by refusing to assume.

**KMI's leg inherits it by citation**, as §5 states and KMI §7.1(b)(e) relies on, so cross-domain CAS
replication is authorizable and Steps 8–10 no longer have to be run *"as if the authorization
question were already answered"* — they were re-walked below with it answered.

✅ **Flips.** 🟡 **Declared boundary, not a residual break:** §5 specifies no token format, issuance,
rotation, or issuer-discovery protocol, so *how* a domain-A caller comes to hold a token a domain-B
provider accepts is deployment infra. That is §5's own long-standing boundary, unmoved by the fold,
and the fold's job was the **shape** — that a grant carries its issuer and a provider publishes whom
it accepts.

### Step 8 — The bytes cross the boundary ✅ *holds (regression)*

§7.1(a)/(c)/(d) are unchanged and were re-attacked with the fold's two new fields in play, because
the realistic way this regresses is a new envelope field leaking into the identifier:

- **`license` and `egress` are excluded from the id** — stated twice, in §2 (*"attaching a policy
  does not mint a new asset, and changing one never moves an `asset` id"*) and in §7.1's preamble.
  The id is still the hash of the bytes, still byte-identical in both stores.
- Corrupted bytes were served again; (c)'s mandatory verify **rejected** them, and no id was re-minted.
- (d) was attacked from the projection side once more: a replicated copy still produces no
  `derived_from` edge, no C2PA ingredient and no OMC derivation, because both projections bind to
  **content**. The new carve-out is explicitly *not* authorship or provenance — §2 and §7.1(d) both
  say the pair is read off the envelope's `prov`, never off the store that served the bytes — so the
  ADR-0010 bridge still needs no federation clause.

✅ **Holds.** The pass's central contrast survives the fold intact: content-addressed identity is
stable across authorities exactly where the content *is* the identity.

### Step 9 — The copy escapes the policy that governed it ✅ *flips*

Both horns of the original table are gone. §2 carries an optional `license` / `egress` pair; §7.1(d)
permits it — and it alone — to accompany a replication, *"precisely because it is **not**
synthesized: it is the asset's own governing policy, carried from the envelope the requesting
participant already holds"*; §7.1(e) requires a serving participant to evaluate the asset's **own**
pair **in addition to**, never instead of, its own domain's policy, with either alone able to refuse.
Re-walked:

- **`local-only` never crosses.** Store A refuses the outbound leg irrespective of the requester —
  the half that already held, now with the operand stated rather than implied.
- **Laundering-by-retention is closed at the retainer.** A holder with bytes and **no** policy MUST
  NOT serve them onward across an authority-domain boundary, MAY still serve them inside its own
  domain, and MUST NOT synthesize the missing pair to pass the gate — *"passing a gate is not a
  reason to invent an assertion."* Step 9's *"the retainer is where the control is lost"* now has a
  clause at exactly that point.

**The attack this re-run added, because the fold created the surface for it.** The pair is
**excluded from the id** — necessarily, or every asset id would move — so unlike the bytes, which
(c) makes self-verifying, the pair is **not** verifiable against the asset. A requester that supplies
a downgraded pair (`local-only` → `exportable`) would hand the receiving store an operand that makes
its onward gate pass. Walked, and it **does not yield to an unstated assumption**, because the spec
states its position rather than leaving it: the pair is an **envelope field**, asserted by whoever
asserted the envelope and attributable through that envelope's `prov`; §2 then says in terms that
*"KMI requires no signing or hard binding on the pair; a deployment that wants one uses the signing
shape KCB §5 already defines."* So the exposure is **declared and located** — attribution yes,
cryptographic binding no, by choice, with the mechanism named for a deployment that needs it.

✅ **Flips.** 🟡 **Two residuals, both stated by the spec rather than found here:** the pair is
attributable but not hard-bound to the bytes (above); and a holder without the policy may still serve
freely **inside** its own domain, the originating domain's consent point having been its own outbound
decision under (e).

> **Superseded the same day — do not cite this ✅ on its own.** Step 9 was re-attacked in *Re-run —
> Steps 8–10 re-attacked after the KCB walks* below and **does not flip**: the first residual above
> was walked as a **downgrade** (a falsified pair, answered by attribution), and the case that breaks
> it is **divergence** — two conformant envelopes for one id, no misbehaviour, and no rule for which
> pair governs. New delta **MA-13** (High, structural).

### Step 10 — The asset that will never arrive 🔴 *does not flip*

**§7.1(f)'s substance still holds** and was re-attacked: store A decommissioned, a domain-B timeline
referencing an asset it held. The `asset` id, the envelope, the lineage edge, the timeline, the
derived analysis claim and the already-issued grant all survive; KCB delta L's dangling-ref tolerance
absorbs the reference. Invalidating an id because a holder went away would make identity depend on
availability, and it still does not.

**MA-10's fold is the right answer** — a store MUST be able to answer **not held, and not expected**
*"distinctly from *not reachable* and from *not held, pending*"*, and a consumer that reaches every
store it can see and gets that answer from all of them MAY conclude for **that set**. Walked as a
consumer, the rule terminates where the original pass could not.

🔴 **BROKE (MA-12, Med — carrier). The answer the clause requires has no wire to arrive on.** The
consumer-side half of (f) obliges a consumer to *receive and recognize* three distinguishable
answers. Nothing in either spec defines them:

- **KCB §4** types the verb as *"**fetch** | CAS GET by `asset` id | retrieve asset bytes by their
  KINP id; integrity self-verifies against the hash (delta G). Requires a `fetch:asset` grant."*
  No response vocabulary, no status set, no operand — and §4 is where the wire is defined, since
  KMI §7 says of itself that it *"defines the payloads, not the pipe."*
- **KMI §7 / §7.1** name the three answers in prose and define no field, enum, or envelope for any
  of them. `not held, and not expected` appears in this fabric exactly three times, all three in
  §7.1(f) and its fold note.
- **KCB cites none of it**, and its one use of the phrase pulls the other way. Searched: KCB
  references §7.1(f) nowhere and *not held* nowhere; its single occurrence of *pending fetch* is
  **§4.2f**, where a CAS holder applying its own `fetch` limit *"MUST signal a refusal"* and *"a
  refused `fetch` is a **pending fetch**."* So a **fourth** state — *held, but rate-limited* —
  already shares the one word (f) uses for its default, on the same verb. The
  [dispositions record](../docs/reference/federation-fold-dispositions.md) classes MA-10 as a
  two-spec delta (**KMI + KCB**) folded at one spec *"with the others inheriting by citation"*; here
  the citation was never written, and the half that would have carried it is the half KCB owns.

**Consequence, and it is the exact one MA-10 was folded to remove.** Two conformant implementations
cannot interoperate on the distinction: a store answering a miss has no specified way to say *and
not expected* rather than *pending*, and a consumer receiving a non-delivery has no specified way to
tell which of **four** states it is in — *held but rate-limited* (§4.2f), *not held, pending*, *not
held and not expected* (§7.1(f)), or *not reachable*. *Pending* therefore remains unfalsifiable in practice while reading as answered in
prose — which is worse than the original finding, because the original was visible. This is MA-8's
class precisely (*a clause asserted with no carrier*), on the one clause of this fold that lives on
the byte plane, where MA-8's fold — scoped to §3's `find` response — could not reach it.

**Not in scope of this delta:** any durability mandate, minimum replica count, retention obligation
or designated durable holder. **DEFER-C** is unmoved and its trigger unchanged; MA-12 asks only that
the answer §7.1(f) already requires be **expressible**.

| # | Severity | Gap | Delta | Spec |
|---|---|---|---|---|
| **MA-12** | Med (carrier) | KMI §7.1(f) requires a store to answer **not held, and not expected** distinctly from *not reachable* and *not held, pending*, and requires a consumer to conclude from that answer. KCB §4's `fetch` is *"a CAS GET by `asset` id"* with no response vocabulary; KMI §7 defines *"the payloads, not the pipe"* and no field for any of the three; KCB cites §7.1(f) nowhere, so the *inherit-by-citation* half of this two-spec delta was never written; and KCB §4.2f independently calls a **rate-limited refusal** a *pending fetch*, so a fourth state shares the word. The clause is asserted and unmechanized — MA-8's class, one plane over. | Give the three answers a carrier on the verb that must deliver them: a `fetch` response distinguishes *held* / *not held, pending* / *not held, and not expected*, with **absent reading *pending*** (never *not expected*), and KCB §4 cites KMI §7.1(f) as the clause that defines their meaning. Additive; no `asset` id moves, no envelope field is added, and a single-store deployment is unaffected. | KCB §4, KMI §7.1(f) |

### What this re-run does and does not close

| Count | Steps | Outcome |
|---|---|---|
| **KINP** — its **only** count, the whole of its gate | 2, 3, 4, 6 flip; 1 is the regression set | ✅ **The prose gate is discharged.** No delta of this pass reproduces against KINP 0.4.0 and no new one was found against it. |
| **KCB** — count (iii) of **five**, gating §3.1 alone | 5, 6, 7 | 🔴 **Does not close.** Step 5 breaks on ADR-0014's decided-but-unwritten clause. Steps 6 and 7 flip. The other **four** counts are untouched and none moves. |
| **KMI** — count (i) of **two**, gating §7.1 alone | 8, 9, 10 | 🔴 **Does not close.** Step 10 breaks on **MA-12**. Steps 8 and 9 flip. Count (ii) — the [`e2e-media-transform.md`](e2e-media-transform.md) re-run — is **KCB's** work, untouched, and does not move. |

**Neither KCB nor KMI is promotable on this walk, and neither would have been on a clean one.** KCB
has four other counts; KMI's second count is not KMI's to discharge. That is stated here because the
failure this document's own *Re-ratification* section exists to prevent is a reader concluding a spec
is promotable from a single satisfied gate.

**KINP is not promoted either, and the reason is not in the prose.** Under
[the ratification gate](../specs/README.md#the-ratification-gate) `candidate → ratified` requires a
machine-replayable KCS encoding **whose assertions cite the clauses being ratified**, and a prose
pass is *necessary but no longer sufficient*. `kcs:multi-authority` **exists** and ran on 2026-08-24
— but it was written against the **pre-fold** text and, by design, asserts none of the folded
clauses (**DR-8**: it replays MA-1…MA-5 and MA-8/MA-9 and asserts nothing about them, *"because a
document that asserted the broken properties would be asserting a fold koine has not made"*). The
clauses this walk discharges — §4.1's weakest-link rule, §4.2's `world_aligns_with`, §4.5's fourth
branch, §6's domain-scoping, §3.4's non-federated commons — therefore have **no encoded assertion at
all**. The encoding must be **extended** to cite them, which is the same shape **DR-7** records for
KCB count (ii), and it is downstream work under
[ADR-0001](../decisions/ADR-0001-control-plane-topology.md). **MA-11** still bounds how far §5's own
vocabulary reaches, and the 2026-08-24 run shows the §7.1 escape hatch being used for exactly this
(four declared console extensions), so the route exists and is unowned.

**DR-9 still bounds every federation property below.** Domain B's authority and both CAS stores were
stand-ins in the 2026-08-24 run, so the properties that need the far authority to be *independently
operated* are corroborated by this hand-walk only as far as a reading of the contracts goes.

> **Re-run note (2026-09-03).** Steps 1–10 walked by hand against **KINP 0.4.0 / KCB 0.5.0 /
> KMI 0.3.5**. **KINP's four gating steps flip and its regression step holds — its prose gate is
> discharged, and it stays Candidate on the KCS-encoding condition alone.** **KCB count (iii) does
> not close** (Step 5, [ADR-0014](../decisions/ADR-0014-federated-merge-merges-attributions.md)
> unwritten) and **KMI count (i) does not close** (Step 10, new delta **MA-12**). No spec version
> moves for this walk: nothing normative changed in it. The findings above are the fold each of the
> two counts is now waiting on.

---

## Re-run — Steps 8–10 re-attacked after the KCB walks (2026-09-03, second pass)

**Why there is a second pass on the same day, and what would make it waste.** The section above
walked Steps 1–10 and gave **KMI count (i)** its verdict — 🔴, on **MA-12**. Nothing normative moved
between that pass and this one, so a re-read of the same clauses against the same bytes would be
bookkeeping and is not what this is. This pass exists because, later the same day, KCB's **four**
other counts were walked
([`e2e-media-transform.md`](e2e-media-transform.md), [`e2e-live-schema-mutation.md`](e2e-live-schema-mutation.md),
[`kcb-subscription-firehose.md`](kcb-subscription-firehose.md), [`kcb-cross-owner-posture.md`](kcb-cross-owner-posture.md))
and returned seven new findings — **MT-1, V-9, V-10, V-11, BP-7, BP-8, AP-9** — of which **four sit
on one axis**: *an operand deliberately kept outside a content digest, carrying a declared normative
consequence, with nothing that carries it.*
[ADR-0014](../decisions/ADR-0014-federated-merge-merges-attributions.md) named that axis in advance,
for KCB's `schema_id` digest and the registry merge key built on it.

**KMI §2's `license` / `egress` pair is outside the `asset` id by exactly the same design**, and
§7.1(d)/(e) hang a gate on it. An axis that produced four findings one plane over is not a reason to
assume the byte plane is unaffected; it is a reason to go and look. This pass looked, and **Step 9 —
which the first pass flipped — does not survive it.**

**Method.** Prose, by hand, adversarial, against **KMI 0.3.5 / KCB 0.5.0** as published, with the
first pass's verdicts treated as claims to attack rather than results to carry forward. Deliberately
not a replay: **DR-8** stands, and `kcs:multi-authority` predates the fold either pass is testing.
Where this pass agrees with the first it says so and does not restate the argument.

### Per-step verdicts (second pass)

| Step | Gates | First pass | This pass |
|---|---|---|---|
| **8** | §7.1(a)(c)(d) | ✅ holds | ✅ **Holds.** The axis was put to §7.1(a) directly and it is the wrong kind of hazard for an identifier. |
| **9** | §2, §7.1(d)(e) | ✅ flips | 🔴 **Does not flip** → new delta **MA-13** (High, structural). |
| **10** | §7.1(b)(f) | 🔴 MA-12 | 🔴 **MA-12 re-confirmed**, and two of the KCB findings **constrain how it may be folded**. |

### Step 8 — The bytes cross the boundary ✅ *holds (re-confirmed)*

The first pass's attacks on content identity are not repeated; they held and nothing since touches
them. What this pass added is the axis question, asked of §7.1(a) directly: **does an operand
excluded from the digest put pressure on the digest?**

It does not, and the reason is worth stating because it is what separates this plane's exposure from
KCB's. §7.1(a) is a claim about *what the id is a hash of* — the bytes — and no envelope field enters
it; §2 says in terms that *"attaching a policy does not mint a new asset, and changing one never
moves an `asset` id."* An operand outside a digest is a hazard for **decisions taken over it**, never
for the identity the digest establishes. That is why every finding on this axis, here and in KCB, is
a **carrier or perimeter** break and none is a model break. Step 8 is where that distinction is
visible on the byte plane, and it is intact.

✅ **Holds.**

### Step 9 — The copy escapes the policy that governed it 🔴 *does not flip (reverses the first pass)*

**MA-5's fold is not what breaks, and the first pass's reasoning about it is not disputed.** §2
carries the pair; §7.1(d) lets it travel *carried, never synthesized*; §7.1(e) evaluates the asset's
own pair **in addition to** the serving domain's; and (e)'s third bullet closes
laundering-by-retention at a holder that has **no** pair. Re-walked, all four still hold, and
`local-only` is still refused on the outbound leg.

**What neither pass had asked: *which* envelope.** §2 fixes the pair as an ordinary envelope field —
*"asserted by whoever asserted the envelope and ... read off its `prov`"*, with *"no signing or hard
binding on the pair"* required. An envelope is therefore **per-asserter**, while the `asset` id binds
**bytes**. Two participants holding the same bytes hold the same id by construction (§7.1(a), and it
is the property the whole section relies on) and may each assert their own envelope — both
conformant, both attributable, neither derived from the other. **No clause in §2, §7.1(d) or §7.1(e)
says an asset has one envelope, ranks two, or names which one governs.**

Read (e)'s two operative bullets against that, and they are about two different objects:

- **Bullet 1 is written over an envelope.** A serving participant evaluates *"the asset's own
  `license` and `egress` — the values that travelled with it under (d)"*, and (d) sources those from
  *"the envelope the requesting participant already holds."*
- **Bullet 2 is written over the asset.** *"Where an asset's `egress` is `local-only`, it MUST NOT be
  replicated across an authority-domain boundary and no holder may serve it across one, irrespective
  of that holder's own policy."*

The walk that separates them, with no participant misbehaving at any hop:

1. Domain A ingests a master under `egress: local-only` and asserts envelope **E_A**. Store A refuses
   every outbound request — correct, and the half that already held.
2. Participant **B**, in domain B, obtains the **same bytes** by a route this contract does not forbid
   and could not forbid: the vendor's own delivery, an independent second ingest, or a copy taken
   before 0.3.5 existed. The id is the hash, so it is **the same asset** — that is (a), working.
3. B asserts **its own** envelope **E_B** with `egress: exportable`, honestly, because under the
   licence B holds it is. E_B's `prov` is clean and names B.
4. B serves across an authority-domain boundary to **C**. C holds bytes and E_B, evaluates the only
   pair it has ever seen, and serves onward.

Every participant satisfies **bullet 1** on the only pair available to it. **Bullet 2 is breached at
every hop after the first**, by participants for whom the fact that breaches it is **unreachable**:
no verb returns *the other envelopes for this id*, §7.1(d) forbids B and C from synthesizing one, and
E_A never travels because A, correctly, never serves. The MUST is stated over a property of the
asset; every operand any participant can obtain is a property of **an envelope**; and §2 makes those
two different things.

**This is not the downgrade attack the first pass declared a residual, and the difference is what
makes it a delta.** There, a requester supplies a **falsified** pair, and the spec's answer — the
pair is attributable through its envelope's `prov`, cryptographic binding declined by choice, with
KCB §5's signing shape named for a deployment that wants one — is a real answer, because there is a
misdeclaration and a declarant to hang it on. **Here nobody misdeclares.** Two conformant assertions
disagree, both prov chains are clean, and attribution resolves nothing: it says who said what, and
the question is which one *governs*. A serving participant must decide at the moment of a `fetch`,
and (e) presupposes there is one pair to decide with.

🔴 **BROKE (MA-13, High — structural). The gate has an operand and no rule for which value it
takes.** MA-5's finding was *the gate has no operand*; 0.3.5 gave it one; this is *the operand is not
determined*, and it arrives at the same destination MA-5 named — an asset's governing policy ends at
an authority boundary — through a door the fold did not close. It is reachable with **no
misbehaviour anywhere in the chain**, which the retention hole (e)'s third bullet closed was not, and
it is not answerable by attribution, which is the answer §2 gives for the pair generally.

**The fold, and it is KMI-only and additive.** Three parts, none of which mints a field:

1. **§7.1(d) names *whose* pair travels.** The pair that accompanies a replication is the one the
   **serving** participant evaluated under (e) — a policy that has already been through a gate — not
   whichever copy the requester happens to hold. (d)'s *carried, never synthesized* rule is unchanged;
   this only fixes the source.
2. **§7.1(e) states the conflict rule.** Where a holder has more than one conformant pair for an id,
   **the most restrictive governs**, and a holder MUST NOT prefer the pair it asserted itself. This is
   [ADR-0013](../decisions/ADR-0013-autonomy-posture-boundary-clause.md)'s monotone-restrictive
   discipline reused for a gate — exactly as
   [ADR-0014](../decisions/ADR-0014-federated-merge-merges-attributions.md) reuses it for a registry's
   merged attributions, and exactly as KFT §4.2 already takes the most restrictive `egress` across a
   job's inputs. koine has decided this question twice on other surfaces and not on this one.
3. **Bullet 2's MUST is scoped to what a holder can know** — the pairs it holds or has received — so
   the clause becomes decidable rather than a duty over facts no verb returns. (e)'s existing
   fail-closed default for **absence** is unchanged and is what still covers the copy that arrived
   with no policy at all.

No `asset` id moves (the pair stays excluded from the id), no envelope field is added, no lineage
relation, media type, timeline shape or `fetch` grant moves, **no KGP clause moves** and no
`schemas/*.json` models the §2 envelope. A deployment in which one asserter's envelope is the only
one behaves exactly as at 0.3.5. **DEFER-C is unmoved**, and this is not a durability, replica-count
or retention obligation.

### Step 10 — The asset that will never arrive 🔴 *does not flip (MA-12 re-confirmed)*

MA-12 was re-attacked and reproduces unchanged: (f)'s substance holds, MA-10's three-valued answer is
still the right fold, and **KCB §4 still types `fetch` with no response vocabulary**, still cites
§7.1(f) nowhere, and still spends *pending fetch* on §4.2f's rate-limited refusal. The first pass's
argument stands and is not restated.

**What this pass adds is a constraint on the fold, from two of the KCB findings.** MA-12's fold is
two-spec (KCB §4 + KMI §7.1(f)), so the failure modes KCB produced on the same day bound it:

- **V-10** is a MUST routed to a frame table that names no such frame — a normative consequence
  written in one section and left uncarried by the table that governs it. MA-12's three answers must
  therefore land as a **named response vocabulary on §4's `fetch`**, in the table that types the verb,
  not as prose in §7.1(f) with §4 left to be read as implying it. That is the failure this fold exists
  to remove, and KCB has now produced it twice.
- **BP-7** is a rule stated at one moment of a binding's life and silently absent at another
  (registration, not live adjustment). §7.1(f)'s answers are owed **per request**; the fold must say
  so on the verb, or it becomes a registration-time property of a store rather than an answer a
  consumer can rely on for the id it asked about.
- **ADR-0014's second decision applies verbatim**: a store **MUST NOT synthesize** *not held, and not
  expected*. Absent reads *pending* — which the first pass already specified, and which is the same
  never-invent-a-value-for-an-uncarried-field rule ADR-0014 decided for the registry.

🔴 **Does not flip.** MA-12 unchanged in substance, narrowed in shape.

| # | Severity | Gap | Delta | Spec |
|---|---|---|---|---|
| **MA-13** | **High (structural)** | §7.1(e) bullet 2 is a MUST over *"an asset's `egress`"*, but §2 makes `license`/`egress` ordinary envelope fields — per-asserter, unsigned, read off the envelope's own `prov` — while the `asset` id binds **bytes**. Two participants holding the same bytes may each assert a conformant envelope with a different pair, and (d) sources the travelling pair from *"the envelope the requesting participant already holds"*. So a holder that has only the permissive envelope satisfies bullet 1 while breaching bullet 2, cannot discover the restrictive one (no verb returns it, and (d) forbids synthesizing it), and serves onward across a boundary with every clause it can evaluate satisfied. MA-5's laundering hole returns through **divergence** rather than absence, with **no misbehaviour at any hop** — so attribution, which is §2's stated answer for the pair, resolves nothing. | KMI-only and additive, minting no field: (d) names the **serving** participant's evaluated pair as the one that travels; (e) states that where a holder has more than one conformant pair the **most restrictive governs** and a holder MUST NOT prefer its own; and bullet 2's MUST is scoped to the pairs a holder holds or has received, leaving (e)'s fail-closed default for **absence** unchanged. Reuses ADR-0013's monotone-restrictive discipline as ADR-0014 does, and KFT §4.2's most-restrictive-egress rule. No `asset` id moves, no envelope field is added, no KGP clause moves, and DEFER-C is unmoved. | KMI §2, §7.1(d)(e) |

### What this second pass does and does not close

| Count | Steps | Outcome |
|---|---|---|
| **KMI** — count (i) of **two**, gating §7.1 alone | 8, 9, 10 | 🔴 **Does not close, and it now needs *two* folds.** Step 8 holds. Step 9 **reverses** the first pass on **MA-13** (KMI-only, additive). Step 10 re-confirms **MA-12** (two-spec: KCB §4 + KMI §7.1(f)). Count (ii) is **KCB's** work and is untouched by this pass. |

**The count changed shape a third time**: from *re-run Steps 8–10 against the folded text* (first
pass) → *fold MA-12, then re-run* → **fold MA-12 and MA-13, then re-run Steps 8–10 again**. Both
folds are additive, neither moves an `asset` id or an envelope field, and **both are unowned**.

**One premise of the walk was tested rather than inherited.** Count (i) is routinely described as
*KMI's own work, independent of KCB*. As a **count** that is still true — it gates §7.1 alone and no
KCB re-run moves it. As **work** it is now half false: MA-12's fold cannot be written in this spec
alone, because the carrier belongs on KCB §4's verb. MA-13 is the half that genuinely is KMI's own.

### KMI's status — the conditions, and which hold

KMI's promotion needs **all** of the following. Recorded together because the failure this document's
*Re-ratification* section exists to prevent is a reader concluding a spec is promotable from one
satisfied gate:

| # | Condition | Holds? |
|---|---|---|
| 1 | **Count (i)** — §7.1 CAS federation, gated by Steps 8–10 of this pass | ❌ **No.** Re-run twice on 2026-09-03; **MA-12** and **MA-13** open, both unowned. |
| 2 | **Count (ii)** — the [`e2e-media-transform.md`](e2e-media-transform.md) re-run against KCB's §2 AgentCard-extension manifest | ❌ **No.** Walked the same day and **not clean** → **MT-1**. KMI's OTIO half was re-validated clean at 0.3.0 and is not what blocks this; the count is **KCB's** work and no KMI edit moves it. |
| 3 | **The conformance gate** ([`../specs/README.md`](../specs/README.md#the-ratification-gate)) — a machine-replayable KCS encoding whose assertions **cite the clauses being ratified** | ❌ **No**, and for two different reasons on two documents. `kcs:media-transform` (Phase F4) exists and ran green, but `kcs:kmi-otio-roundtrip` is that same encoding re-titled over the same fixture and asserts nothing OTIO-specific (**DR-4**). `kcs:multi-authority` exists and ran green **over six blocking deltas** (**DR-8**) — it predates the 0.3.5 fold and asserts none of §2's `license`/`egress` or §7.1(d)(e)(f), so §7.1's folded clauses have **no encoded assertion at all** and the encoding must be **extended**, the same shape **DR-7** records for KCB count (ii). Downstream under [ADR-0001](../decisions/ADR-0001-control-plane-topology.md), bounded by **MA-11**, and **unowned**. |

**None of the three holds. KMI stays Candidate**, and would have stayed Candidate on a clean pass of
count (i): one of its two counts is not KMI's to discharge, and the conformance gate binds on top of
both.

> **Second-pass note (2026-09-03).** Steps 8–10 re-attacked against **KMI 0.3.5 / KCB 0.5.0** after
> KCB's four counts were walked, because four of those walks' seven findings sit on the axis KMI's
> `license`/`egress` pair also sits on. **Step 8 holds; Step 10 re-confirms MA-12; Step 9 reverses
> the first pass on new delta MA-13.** **No spec version moves and no clause moves** — nothing
> normative changed in this walk. Count (i) now waits on **two** additive folds, and KMI is not
> promotable.

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

1. **KINP → Ratified.** This pass is its only count. A clean re-run — with **MA-1, MA-2, MA-3,
   MA-4** folded first and **MA-7** in the same fold — restores the status 0.2.1 held. Steps 2, 3, 4
   and 6 are the ones that must flip; Step 1 held and is the regression set. *(All five folded at
   **KINP 0.4.0**, 2026-08-26 — see* Fold status *above. The re-run has not happened.)*
2. **KCB — one count of four closes.** Folding **MA-6**, with **MA-8** and **MA-9** alongside,
   discharges the §3.1 count and nothing else: KCB remains Candidate until the media-transform
   re-run lands, the §7.5 deltas **V-2/V-4/V-5/V-7** are folded, and §4.2's own re-run lands.
   *(Folded at **KCB 0.4.9**, 2026-08-26 — a **patch**, not the 0.5.0 minor this line first
   predicted: 0.5.0 is spoken for by §2.2's standalone-manifest removal, which V-1…V-8 also occupy,
   and a fold must not force it early. The count reads as a re-run of Steps 5–7 against the folded
   text. "One count of four" was true when this line was written; KCB accrued a **fifth** count the
   same day — §4.3 autonomy posture, at 0.4.8 — so the fold discharges one of five, and §4.3's own
   re-run joins the list above. Nothing this pass found bears on it.)*
3. **KMI — one count of two closes.** Folding **MA-5**, with **MA-10** alongside, discharges the
   §7.1 count; KMI remains Candidate until the KCB re-run lands. MA-5 adds two fields to the §2
   envelope and MA-10 adds an answerable *not held, and not expected* — additive, and **0.4.0 is
   already spoken for** by §4.4's EDL removal. *(Folded at **KMI 0.3.5**, 2026-08-26 — a **patch**.
   This line offered "0.5.0 or a patch that adds no field"; the fold took the third reading, a patch
   that adds two **optional** fields, on the precedent KCB set at 0.4.6/0.4.7 for additive normative
   text landing as a patch while the next minor is reserved. Nothing that conformed at 0.3.4 stops
   conforming, and the EDL removal keeps 0.4.0.)*

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

> **Resolution (amended 2026-08-26 — the fold landed):** deltas **MA-1…MA-10** are **folded** —
> MA-1/MA-2/MA-3/MA-4/MA-7 at **KINP 0.4.0**, MA-5/MA-10 at **KMI 0.3.5**, MA-6/MA-8/MA-9 at **KCB
> 0.4.9**, with an Editorial entry at **KGP 0.5.2** stating that spec's reading at no version cost.
> **MA-11 is closed unfolded**, as evidence for KCS §7 open question 1, which already cites it by
> name. Three remainders are deliberately deferred with a forcing trigger each (DEFER-A/B/C), and
> two alternatives are rejected on the record. Per-finding detail is in *Fold status* above; the
> reasoning for each disposition is in
> [`../docs/reference/federation-fold-dispositions.md`](../docs/reference/federation-fold-dispositions.md).
> **All three specs nevertheless stay Candidate** — a fold does not close its own gate. Each count
> below now reads as a **re-run of this pass against the folded text**, and that re-run has not
> happened; nothing above may be cited as a pass. The fabric-wide second condition is unmoved and
> still binds: `kcs:multi-authority` cannot assert five of the ten assertions until KCS open question
> 1 resolves (MA-11).
>
> **Resolution (2026-08-24, superseded above but retained as the record of the break-test):**
> recorded against **KINP 0.3.0**, **KCB 0.4.6** and **KMI 0.3.4** —
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

---

## Downstream results

> **What this section is.** The recorded result of a **downstream run** of this pressure test's
> KCS encoding, in the shape [`README.md`](README.md#downstream-results-where-a-real-runs-result-lands)
> fixes. Instance-free, role-scoped, and it **promotes nothing**.

**Run of 2026-08-24** · encoding `kcs:multi-authority` · KCS 0.3.0 · evidence
`sha256-2d9e6c43…c17bb3` **(superseded 2026-08-26 by `sha256-eb8fdc9c…36dd5`, twelve scenarios — this scenario's own per-scenario entry is byte-identical in it, checked 2026-09-03)**, verified in
[`../docs/reference/kcs-encoding-gate-verification.md`](../docs/reference/kcs-encoding-gate-verification.md).
This is the encoding that landed last, with the follow-up merge that also re-captured the run.

| | |
|---|---|
| Participants, by role | domain **A** identity **authority** (`refkb`, live) · knowledge **producer** (`analyzer`, live) · control-plane **host** (`orchestrator`, live) · domain **B** identity **authority** (`archivekb`, **stand-in**) · domain A **store** (**stand-in**) · domain B **store** (**stand-in**) |
| Over what links | **3 of 6 live** (50%) — and the split runs along the domain boundary: every live slot is in domain **A**, every domain-**B** participant and both CAS stores are recordings |
| Encoded as | 17 steps + **13** assertions, of which **4** are `expect: reject`. Four predicates are declared **console extensions** — `peer_entries_unreconciled`, `asset_id_stable_across_holders`, `replicated_bytes_verified`, `copy_is_not_lineage` |
| Result | `green` · verdict **`partial-live`** · `transport_failures: []` |

**`green` here does not mean this pass came out clean.** It did not: **MA-1…MA-11** are open,
**MA-1…MA-6** blocking, none folded, and all three specs ADR-0012 licensed stay candidate. The
encoding replays **every** step, including the ones that broke, and asserts only the federation
properties the pass attacked and could not break — *"a document that asserted the broken properties
would be asserting a fold koine has not made."*

**What passed**, by the row of the §Assertions table:

| Row | Step | Property | Held as |
|---|---|---|---|
| 1 | 1 | Minting works with **both** authorities dark — ADR-0012's central invariant | `always_completes` |
| 2 | 2 | Domain A's firewall edge, the half that held | `based_on_exists` |
| 4 | 4 | Normalization converges **within** a domain | `claims_converge` |
| 5 | 5 | The merged `find` set is ranked and **both** authorities are returned | `capability_path_exists` + `peer_entries_unreconciled` (ext) |
| 7 | 7 | A cross-domain grant is not honoured | `refused` over `expect: reject` |
| 8 | 8 | The three KMI §7.1 clauses that held: byte-stable id, verified bytes, a copy is not a lineage edge | `asset_id_stable_across_holders`, `replicated_bytes_verified`, `copy_is_not_lineage` (ext) + `refused` |
| 9 | 9 | The **outbound** egress leg — store A deciding at its own boundary | `refused` |
| 10 | 10 | An unreachable store invalidates nothing | `dangling_ref_tolerated` + `source_world_is` |

**What was replayed but deliberately not asserted.** Each of these is a step whose answer the run
records — so the exposure is visible — with no assertion claiming the property holds, because on
today's contracts it does not:

- **MA-2** — KINP §4.5's relation-choice rule needs the candidate's world and its
  inherit-as-identity mode; both are published in the *other* domain, no KCB verb returns them, and
  §4.5's third branch covers low **confidence**, not a **missing operand**. The firewall is not
  over-merged, it is **absent on the second authority**, so a `no_sameas_across_worlds` here would
  assert a fail-closed branch §4.5 does not have.
- **MA-1** — §4.1's merged closure is governed by its weakest link, and the weakest was above *its
  issuer's* threshold for *its issuer's* purposes. Nothing scopes a closure to an authority, so the
  run records the closure and its weakest issuer and asserts nothing about it.
- **MA-3 / MA-4** — two authorities means two canonical entities and two default real worlds, so one
  fact mints two claim ids even when both anchor to the same external authority. There is no
  cross-domain convergence target, which is why `claims_converge` above is scoped to domain **A**
  only — precisely the scope the property still has.
- **MA-5** — KMI §7.1(e)'s egress gate has no operand: the §2 envelope carries no `license` and no
  `egress`, and §7.1(d) forbids synthesizing one. The **outbound** refusal is asserted because store
  A decides at its own boundary; nothing asserts the policy **travelled** with the copy, because it
  did not.
- **MA-8 / MA-9** — three of §3.1's six clauses have no carrier in the §3 response: no field for the
  serving peer's KINP id, and none marking an entry peered rather than local.

**MA-11** is the same shape as V-8 one spec over: every §5 predicate was written for a fabric with
one holder of each authority role, which is why four predicates above are extensions. Like V-8, this
run **corroborates it by construction** — the encoding could not be written inside §5.

**What the run does not say.** The domain-boundary split above is the finding underneath the
percentage: a federation pressure test whose **entire second domain** is a recording exercised
peering and replication against a cooperative fixture, never against an independently operated
authority. That is the property ADR-0012 is staked on — *"neither was built with the other in
mind"* — and it is the one a stand-in cannot supply.

### Findings — from the downstream run

| # | Severity | Gap | Consequence |
|---|---|---|---|
| DR-8 | **High** (reading hazard, not a new break) | `kcs:multi-authority` returns **`green`** over a pass with MA-1…MA-11 open and six blocking. The encoding is right to be silent on the broken properties, but the evidence artifact records only the aggregate, so nothing in it says which properties were skipped — and the skipped set is where every blocking delta lives. | A green line here may **not** be cited as evidence for KINP §11.1, KCB §3.1 or KMI §7.1. All three stay candidate on exactly the terms the *Re-ratification — what this pass gates* section above sets, and this run moves none of them. What it **does** support is the eight rows above, most usefully ADR-0012's central invariant (minting with both authorities dark) and the three §7.1 CAS clauses. |
| DR-9 | Minor | Every live slot sits in domain **A**; domain **B**'s authority and both CAS stores are delta-N stand-ins. The federation was therefore tested across a boundary with a **recorded** counterparty on the far side. | The properties that depend on the far authority being *independently operated* — MA-2's missing operands, MA-8/MA-9's peer attribution — cannot be distinguished here from a fixture that simply did not model them. Closing this needs a second adopter, not a document change. |

Suite-wide limits **DR-1** and **DR-2** are recorded in
[`README.md`](README.md#downstream-results-where-a-real-runs-result-lands).
