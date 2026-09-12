# Koine Identity & Namespace Protocol (KINP)

**Spec version:** 0.5.0
**Status:** Candidate
**Last updated:** 2026-09-12
**Applies to:** every participant that mints, publishes, or resolves identifiers — producers,
consumers, identity authorities, control-plane hosts.

> The keystone protocol. Every other Koine contract (grounding-pack, media-interchange,
> capability-bus) references the identifiers, envelopes, and resolution semantics defined
> here. Get identity right and cross-participant **intersection** — joining data produced by
> different participants — becomes a query rather than an integration effort.

---

## 0. Design axioms

1. **Different kinds of thing get different identity strategies.** Using one scheme for
   everything is the root mistake. See §2.
2. **Never destructively merge.** Reconciliation is an *equivalence layer* over
   source-local identifiers, and "merge" is a query-time view. See §4.
3. **Sameness has grades.** `same_as` licenses inference across identifiers; `based_on`
   records lineage without licensing it. This is the firewall between real and fictional
   entities. See §4.3.
4. **Truth is world-relative.** Assertions are true *in a world/context*, not globally.
   See §5.
5. **Offline-first minting.** No identifier requires a round-trip to a central authority
   to be created. Reconciliation is eventually-consistent. See §6.
6. **Borrow standards, don't adopt the stack.** IRIs, CURIEs, W3C PROV shape, and the
   OpenRefine/Wikidata Reconciliation API — over Prolog/TSV-native storage. No mandated
   RDF triplestore. See §9.

---

## 1. Scope

KINP defines:
- the **kinds** of identifiable thing (§2),
- the **identifier grammar** — canonical IRI, compact CURIE, and Prolog term forms (§3),
- the **namespace registry** (§3.4),
- **entity resolution**: local IDs, the equivalence layer, `same_as` vs `based_on`,
  reconciliation (§4),
- the **world/context** model (§5),
- **minting** rules, including offline-first (§6),
- the **assertion** and **asset** envelopes, with provenance and bitemporal time (§7),
- the **resolver API** (§8),
- the per-role **adoption map** (§10),
- the **ratified decisions** on the three design forks (§11).

KINP does **not** define storage engines, wire encodings for bulk transfer (that is
grounding-pack / media-interchange), or reasoning semantics.

---

## 2. The three kinds of identifiable thing

The most consequential decision in the whole protocol:

| Kind | Is a… | Identity strategy | Rationale |
|---|---|---|---|
| **Entity** | *thing* (person, place, plugin, NPC, org, agent) | **Stable, minted, resolved.** Identity is independent of the thing's current attributes. | A thing stays the same thing as what we know about it changes. Deriving an entity ID from its properties breaks the instant a property changes. |
| **Assertion** | *claim* about entities | **Content-addressed** (hash of the normalized claim). | Immutable; identical claims dedup/merge automatically. (A producer that already content-addresses its predicates keeps its scheme.) |
| **Asset** | *bytes* (a file / blob) | **Content-addressed** (hash of the bytes, à la git blob / IPFS CID). | Same file ingested twice = one asset. Perfect dedup. |

**Corollary:** content-addressing is correct for assertions and assets and *wrong* for
entities. Entities need identity that is stable *because* it does not depend on current
knowledge.

---

## 3. Identifier grammar

### 3.1 Canonical form (IRI)

```
https://id.<root>/<kind>/<namespace>/<local-id>
```

- `<root>` — the ecosystem's identity domain. **Placeholder:** `id.koine.example`
  (production root TBD).
- `<kind>` — one of: `ent` | `claim` | `asset` | `world` | `agent` | `activity` | `src`.
- `<namespace>` — the minting authority (§3.4).
- `<local-id>` — opaque within the namespace; `[a-z0-9][a-z0-9._-]*` (lowercase,
  percent-encode anything else).

Canonical IRIs SHOULD be dereferenceable (§8): dereferencing returns the thing plus its
known equivalences and provenance.

**A run is an `activity`, and it has exactly one spelling (NORMATIVE — IMP-7).** A *run* — one
execution of an extraction pipeline, a media transform, or a training job — is an identifier
every participant has to mint, because every assertion envelope carries `prov.activity` (§7.1),
every asset envelope carries `produced_by` (KMI §2), and a training leg is attributable only by
its job id (KFT §3, §5.2, §6). It is minted under kind **`activity`** and under no other:

```
<namespace>:activity:<local-id>   →   https://id.<root>/activity/<namespace>/<local-id>
```

A consumer MAY therefore recognise a run activity **by its kind segment alone**, across
participants and without knowing the minting namespace's local conventions. That is the point of
fixing it here rather than leaving it to each producer: a `prov` record is only comparable across
participants if the activity id is.

Two spellings this protocol previously showed in worked examples are **not** admitted and never
were: a bare `<namespace>:run/<runid>` with no kind segment at all (§3.4's `analyzer` row, §7.1's
envelope, KMI §2), and `<namespace>:activity:ft-run/<runid>` with a solidus inside the local id
(KFT §3, §5.2, §6). Both are corrected to the form above; see the changelog.

**The `<local-id>` charset is NOT widened to admit the solidus, and the reason is the IRI
(NORMATIVE).** `<local-id>` is the final **path segment** of the canonical form, so a `/` inside
it makes the expansion non-invertible: `https://id.<root>/activity/orchestrator/ft-run/9f2a` no
longer parses back to one `(kind, namespace, local-id)` triple, and §3.2's CURIE↔IRI mapping
stops being a function — the same class of defect as an unparseable multi-segment id. A namespace
that wants internal structure in a run id MUST express it with a separator the charset already
admits — `.`, `-` or `_` — which is what `orchestrator:activity:ft-run.9f2a` does. `<local-id>`
remains **opaque within the namespace**: no participant may read another's local structure, so
`ft-run.` is the orchestrator's own convention and **not** a protocol-level segment.

**What this move can and cannot invalidate.** §3.4's immutability rule binds a **prefix**: once
published it names one minting authority forever, because changing it changes every identifier
under it. This fold moves **no prefix** — `analyzer`, `orchestrator` and `mediastore` are
untouched and every identifier under them keeps resolving. Nor does it narrow the grammar:
`activity` is **added** to a closed enum and the `<local-id>` charset is unchanged, so nothing
§3.1 admitted before stops being admitted and **no conformant identifier is invalidated**. What
it does do is bring two previously *non*-conformant spellings inside a rule. An id already minted
under either of them was never admitted by §3.1, so this protocol cannot promise it resolves on
its own terms — but the transition is stated rather than left to be guessed: a resolver (§8) MAY
accept either legacy form on **read** and, where it does, MUST return the `activity` form as the
canonical id; a minting participant MUST NOT emit either legacy form. **No claim id moves** —
all of `prov` is excluded from KGP §3.1's hashed set, and `src(…)` is an annotation beside
`confidence(…)`, never an argument of the relation (§4.2), so no activity id has ever been inside
`HASH_INPUT`.

**Why `src` stays in the enum, unused.** `src` is in the list above and is used as a kind
**nowhere** in these specs — the audit's companion observation to IMP-7, and it is answered here
rather than left standing. It stays, for two reasons and with one clarification:

- **Removing it would narrow a published closed enum.** Nothing in this repo mints a
  `<ns>:src:<local>`, but §3.1's enum is normative surface a producer implements against, and a
  participant that did mint one would have its identifiers stop conforming. Adding `activity`
  widens; removing `src` would narrow, and this fold does not do both directions at once.
- **The clarification matters more than the token.** `src` in this enum is a **name collision**
  with the `src(…)` provenance annotation of §4.2 and §7.1, not evidence of a use. A reader MUST
  NOT infer that the argument of `src(…)` carries kind `src`: in every example here that argument
  is an `activity` id or an `agent` id, and after this fold it is one of those two and never a
  third thing.
- **The re-open condition is stated.** If a participant needs a kind for a *source document*
  distinct from the `activity` that read it and the `agent` that ran it, it proposes a use for
  `src` — with the shape of its local ids — rather than minting under an unclaimed token. Until
  then `src` is reserved, not retired.

### 3.2 Compact form (CURIE)

For Prolog atoms, TSV cells, and human use:

```
<namespace>:<kind>:<local-id>
```

A prefix registry maps `<namespace>` → IRI root. Example expansions (the namespaces below are
**illustrative placeholders** — see §3.4):

```
refkb:ent:napoleon-i           → https://id.koine.example/ent/refkb/napoleon-i
analyzer:claim:sha256-9f3c1a…  → https://id.koine.example/claim/analyzer/sha256-9f3c1a…
mediastore:asset:blake3-a1b2…  → https://id.koine.example/asset/mediastore/blake3-a1b2…
worldsim:world:alderforest     → https://id.koine.example/world/worldsim/alderforest
orchestrator:agent:dsp-engineer → https://id.koine.example/agent/orchestrator/dsp-engineer
orchestrator:activity:ft-run.9f2a → https://id.koine.example/activity/orchestrator/ft-run.9f2a
```

### 3.3 Prolog term form

CURIEs map to a canonical compound term so a participant with a native Prolog core handles
identifiers as first-class terms, not string-matched atoms:

```prolog
% id(Kind, Namespace, LocalId)
id(ent, refkb, 'napoleon-i')
id(world, worldsim, alderforest)

% Convenience readers may be provided, e.g. ent(NS, L) :- ... but id/3 is canonical.
```

A **URN alternative** (`urn:koine:<kind>:<namespace>:<local-id>`) is reserved for
contexts that reject `https` IRIs; IRIs are preferred because resolvability is the point.

### 3.4 Namespace registry

`<namespace>` names the **minting authority**, embedding provenance into the identifier.

The registry is **open**: any participant that mints identifiers registers a prefix by PR, in
the role it claims. A prefix is reserved to exactly one minting authority and is immutable once
published (changing it changes every identifier under it). Registration confers a name, not a
privilege — the only namespace the protocol treats specially is the one a deployment designates
as its identity authority for real-world entities (§6, §11 decision 1).

**The prefix registry is the one deliberately non-federated commons (normative — MA-7).** Under
[ADR-0012](../decisions/ADR-0012-federated-authority-roles.md) an authority is a role and every
authority role federates — except this one. The registry is a **shared naming convention, not a
further authority role**: registration confers *a name, not a privilege* (above), so federating it
buys nothing, while a federated namespace registry would make minting an identifier depend on
reaching an online authority — precisely the dependency ADR-0012 exists to remove (§6). It is
therefore held in common and not split per domain. That is a deliberate exception, stated here so a
federated deployment does not have to infer it.

What follows from it is a collision rule, because two domains that federate *after the fact* have
no reason to have shared the registry and nothing obliged them to:

- Two authority domains that federate MUST establish **prefix disjointness** — that no prefix names
  a different minting authority in each — before merging any result set that attributes entries by
  namespace (KCB §3.1(c)(d)).
- A prefix held in good faith by a different authority in each domain is a **reportable defect**
  that blocks attribution for every identifier under it. It MUST be reported. It MUST NOT be
  resolved by silently merging the two, by preferring either, or by rewriting identifiers on one
  side — a prefix is immutable once published (above), so a rewrite changes every identifier under
  it.
- The defect is **representable**, which is what makes it reportable rather than silent: a
  federated `find` attributes every entry to the peer that served it by KINP id (KCB §3, §3.1(c)),
  so two entries under the colliding prefix arrive visibly served by two different authorities.

*Rejected: an authority-scoped prefix form* (`<authority>/<namespace>:…`) that makes a collision
unrepresentable by construction. It would change the shape of **every identifier in the fabric** —
§3.1, §3.2, §3.3 and every envelope — to represent a condition the rule above makes reportable at
federation time. Recorded so the rejection is visibly a choice.

**Illustrative registrations.** The rows below are the placeholder namespaces used by the worked
examples throughout the Koine specs; they are **examples of what a registration looks like**, not
a reserved set. Substitute your own.

| Namespace | Registered to (role) | Notes |
|---|---|---|
| `refkb` | identity / knowledge **authority** | Canonical authority for real-world entities, anchored to external authorities (§6, §4.4). |
| `worldsim` | **world producer** (simulation / generative) | World/context IDs are namespaced further: `worldsim:world:<w>`; entities within a world use that world as their namespace — see §5. |
| `analyzer` | **knowledge producer** (extraction pipeline) | Run-scoped locals: `analyzer:run/<runid>`. |
| `mediastore` | **media producer** | Assets, devices, instruments, plugins, hardware models. |
| `orchestrator` | control-plane **host** | Agents, roles, orgs (control plane). |
| `provider` | capability **provider** | Orgs/agents that execute capabilities on the bus (transforms, trainers, model providers). |

The set above describes a **single** authority domain — one identity authority, one host, one media
producer — which is the vocabulary every worked example in these specs is written in. A federated
deployment has more than one of each, so the rows below are the placeholders the federation examples
use (§4.2, §5); they are illustrative in exactly the same sense:

| Namespace | Registered to (role) | Notes |
|---|---|---|
| `archivekb` | a **second** identity / knowledge **authority** | An independently operated holder of the role (§11 decision 1, ADR-0012), with its own `archivekb:world:consensus-reality` and its own §4 equivalence layer. |
| `coordinator` | a **second** control-plane **host** | Its own registry (KCB §3) and its own grant issuance (KCB §5). |
| `assetstore` | a **second** **media producer** | Its own store, advertising `fetch:asset` (KMI §7.1). |

Two rows are **normative**, not illustrative:

| Namespace | Registered to | Notes |
|---|---|---|
| `wikidata`, `musicbrainz`, `geonames`, … | external authorities | For anchoring; never minted by a Koine participant (§4.4). |
| `<ns>:local` | any participant | Provisional, pre-reconciliation locals under that participant's own prefix (§6). |

---

## 4. Entity identity & resolution

### 4.1 Local IDs, never a hard merge

Every participant mints its **own local entity IDs**. The same real-world thing will have
several — a Wikidata-anchored `refkb:ent:…`, an `analyzer:ent:…` extracted from a user's
footage, a `worldsim:world:…:ent:…` in a fictional world. **These are never merged
destructively.** A separate **equivalence layer** records links between them with
confidence and provenance. "The merged entity" is a *view* computed at query time from the
`same_as` closure — it is never written back over the sources.

This generalizes the intra-participant entity resolution such stores already run to the
cross-participant case.

**A closure that spans two authorities is governed by its weakest link (normative — MA-1).** The
view above is computed over whatever links the consumer holds, and under
[ADR-0012](../decisions/ADR-0012-federated-authority-roles.md) those may have been issued by more
than one holder of the identity-authority role. The confidence threshold and the review queue of
§11 decision 2 are scoped **inside** an authority, so a path assembled across two of them can
produce a merged identity that neither authority asserted and no review gate saw — every link on it
conformant where it was issued. A consumer computing a `same_as` closure MUST therefore do one of:

- **Cut the closure at the authority boundary** — traverse only links issued by a single authority
  and present the domains separately; or
- **Re-evaluate each imported link against its own threshold** before traversing it, exactly as if
  the link had been proposed to it under §4.5, routing anything below that threshold to its own
  review queue (§11 decision 2) rather than into the closure.

Either way, a view reached over a **multi-authority path** MUST carry the **weakest issuer and the
lowest confidence** on that path, so a consumer of the view can tell what it is resting on. The
operand for all of this already exists and nothing is added to the envelope: a link is itself an
assertion (§4.2, §7.1) and its `src` names the authority that issued it.

This changes nothing about §4.1's non-destructive, query-time model — which is what makes an
over-wide closure recoverable at all, since it is never written back over the sources — and nothing
about §11 decision 2, whose per-world threshold is correct as it stands.

### 4.2 The equivalence layer

Links are themselves assertions (§7), so they carry confidence, provenance, and time:

```prolog
same_as(id(ent, analyzer, 'e-8842'), id(ent, refkb, 'napoleon-i'),
        confidence(0.97), src('analyzer:run/1a2b')).
```

Relations in the equivalence layer:

| Relation | Meaning | Licenses fact transfer? |
|---|---|---|
| `same_as` | identical referents | **Yes** — facts flow both ways |
| `based_on` | one is modeled on / derived from the other | **No** — lineage only |
| `part_of` | mereological containment | Partial (context-dependent) |
| `instance_of` | type membership | No |

**Lifecycle relations** (reserved; not equivalence links, but they use the same envelope,
§7.1): `retracts` — withdraws a prior claim; `supersedes` — replaces a prior claim with a
newer one. Because claims are immutable and content-addressed (§2), correction is *additive*:
assert a `retracts`/`supersedes` with a later transaction time (§7.1) rather than deleting.

**The layer ranges over worlds too (normative — MA-4).** The relations above range over
**entities**. Under [ADR-0012](../decisions/ADR-0012-federated-authority-roles.md) each holder of
the identity-authority role has its **own** default real world (§5), so the same fact stamped in
two domains mints two `claim` ids (§6) even where both anchor the entity to the same external
authority (§4.4) — and nothing above can assert that two such worlds denote the same context.
`same_as` cannot be widened in place to cover them: a relation's signature is immutable once
published, and widening it would change every claim id that already depends on it
([`../registry/README.md`](../registry/README.md)). The layer therefore gains **one new core
relation**, over two **world** ids:

| Relation | Meaning | Licenses fact transfer? |
|---|---|---|
| `world_aligns_with` | the two **world** ids denote the same context | **No** — see the firewall note below |

```prolog
world_aligns_with(id(world, refkb, 'consensus-reality'),
                  id(world, archivekb, 'consensus-reality'),
                  confidence(1.0), src('refkb:agent:resolver')).
```

- It is an **assertion** like every other link here (§7.1): it carries confidence, provenance and
  time, and §11 decision 2 auto-applies or queues it exactly as it does an entity link.
- **§4.3's firewall semantics are preserved.** A `world_aligns_with` link MUST NOT be read as
  inheritance-as-identity. It says two worlds are the same context; it never says either world
  inherits identity from the other, and §4.5 continues to read a world's **own** inheritance
  metadata (§5) — never this link — when choosing `same_as` vs `based_on`. Aligning two fictional
  worlds does not make either of them real.
- A consumer that needs to reason over worlds reads the **closure** of this relation, under the
  same weakest-link rule §4.1 states for entities. That is what gives KGP §7's
  `world = consensus-reality` filter a federated reading without KGP restating anything: the
  filter's referent is a world id, which §5 defines here.
- It is **not** a substitute for a shared hash. Two aligned worlds still mint two `claim` ids
  (§6); the alignment is a query-time view, like everything else in this layer.

*Rejected: a namespace-free canonical world token* for consensus reality that every authority
stamps. It is one line of prose and it would re-hash **every real-world claim already minted** —
the world is inside the §6 claim hash — to represent a condition this relation represents at no
cost to identity. Recorded so the rejection is visibly a choice.

### 4.3 The firewall: `same_as` vs `based_on`

The single distinction that keeps fiction from corrupting real-world knowledge.

- **`same_as`** — the two identifiers denote the same referent; inference flows across.
- **`based_on`** — records that one entity was modeled on another; inference does **not**
  flow across.

Worked case — a world producer's fictional general modeled on the real Napoleon:

```prolog
% Lineage only — NOT same_as:
based_on(id(ent, 'worldsim:world:alderforest', 'npc-renaud'),
         id(ent, refkb, 'napoleon-i'), confidence(0.8)).

% A claim asserted ONLY inside the fictional world (note the @world scoping, §5):
fought(id(ent, 'worldsim:world:alderforest', 'npc-renaud'),
       id(ent, 'worldsim:world:alderforest', 'dragon-3')) @ world(alderforest).
```

Consequences:
- Query *"facts true of the real Napoleon"* traverses `same_as` (+ world =
  `consensus-reality`) → **never** returns "fought a dragon."
- Query *"which real figures inspired characters in my game?"* traverses `based_on` →
  returns Napoleon immediately.

One graph, both queries, zero contamination.

### 4.4 Anchoring to external authorities

Do not reinvent identity for things the world already identifies. An authority's entity
(`refkb:ent:…`) carries `same_as` / `exact_match` links to external authority IDs:

```prolog
same_as(id(ent, refkb, 'napoleon-i'), id(ent, wikidata, 'Q517'), confidence(1.0)).
```

Wikidata is the primary general real-world anchor; a media producer anchors audio/artist/gear
entities to MusicBrainz; places anchor to GeoNames; etc. Pick the authority that already
identifies the *kind* of thing you mint.

### 4.5 Reconciliation

Fuzzy matching a descriptor (name, type, attributes, embedding) to candidate entities is
**probabilistic**, never assumed correct. KINP adopts the **OpenRefine / Wikidata
Reconciliation API** shape for the `reconcile` operation (§8) — the *Reconciliation Service API*
published by the W3C Entity Reconciliation Community Group, pinned by version in
[`../docs/reference/upstream-standards.md`](../docs/reference/upstream-standards.md): a published standard that an
identity authority with a Wikidata backbone can answer directly, giving every knowledge and
world producer fuzzy matching against a standard interface for free. What KINP borrows is the
**shape** of the query/candidate/score exchange, not a transport binding — which is what bounds
what a version move can cost this section. Reconciliation *proposes*
links; per the ratified
merge policy (§11, decision 2) they are auto-applied above a confidence threshold and
otherwise queued for review.

**Choosing `same_as` vs `based_on` (normative — delta C).** When the resolver links a
candidate, it MUST pick the relation by world and ontological status:

- **different worlds, and the candidate's world does *not* inherit-as-identity** → emit
  `based_on` (lineage only; no fact transfer). This is what stops knowledge extracted from a
  fictional world from contaminating the real entity it was modeled on.
- **same world, or an identity-inheriting world** → emit `same_as`.
- **ambiguous / below threshold** → emit nothing; queue for review (§11, decision 2).
- **an operand is unresolvable** → emit `based_on`, or nothing, and queue for review (§11,
  decision 2); **never `same_as`**.

A candidate reached only via an existing `based_on` chain (e.g. fiction → real figure) is
never promoted to `same_as` by transitivity.

**The fourth branch is fail-closed, and it is not the third (normative — MA-2).** The third branch
is about **confidence** — a match the resolver is unsure of. The fourth is about a missing
**operand**: the rule needs the candidate's **world** and that world's inherit-as-identity mode
(§5), both of which are published by whoever produced the world — which, under
[ADR-0012](../decisions/ADR-0012-federated-authority-roles.md), may be a participant in a different
authority domain. A high-confidence match against a candidate whose world the resolver cannot
resolve satisfies the threshold and does **not** satisfy the rule, and with only three branches it
falls through to `same_as`. That is the firewall being **absent** on the second authority rather
than over-merged. So: where the candidate's world, or that world's inheritance mode, cannot be
resolved, the resolver MUST NOT emit `same_as`, irrespective of the match score.

This is deliberately the whole of the fold. A **route** by which a world's inheritance mode crosses
an authority boundary — a control-plane lookup in KCB §3/§4, or a KINP §8 operation — is *not*
specified here. The branch above degrades rather than stops (same-domain reconciliation is
untouched, and a cross-domain candidate whose world the resolver *can* resolve still auto-applies),
and such a route needs a query axis no KCB §3 verb has, since the operand's holder is found by
**namespace**. It is deferred with its forcing trigger stated in
[`../docs/reference/federation-fold-dispositions.md`](../docs/reference/federation-fold-dispositions.md)
(DEFER-A).

---

## 5. Worlds / contexts

Truth in the fabric is not global — it is **true-in-a-world**. The same world/context axis
already exists independently under different names in each role; KINP unifies it:

- world producer: **editor canon** vs. **per-playthrough save-file state**.
- knowledge producer: extraction **provenance** on each predicate.
- knowledge authority: **source provenance**.

Every assertion is stamped with a **world** (a named graph). Worlds form an inheritance
chain; reasoning is always relative to a world and inherits from its parents unless
overridden.

```
consensus-reality                          (the authority's default real world)
└── worldsim:world:alderforest             (a fiction; inherits real-world facts unless overridden)
    └── worldsim:world:alderforest#save-7f (a playthrough; forks the world's canon)
```

- Default world for real-world knowledge: the identity authority's `…:world:consensus-reality`
  (written `refkb:world:consensus-reality` in these examples).
- A fictional world MAY inherit consensus reality (so "Paris is in France" holds in-fiction
  unless the fiction overrides it) — inheritance policy is per-world metadata.
- **Under federation each authority's `…:world:consensus-reality` is its own (normative — MA-4).**
  The default above is *the identity authority's* real world, and
  [ADR-0012](../decisions/ADR-0012-federated-authority-roles.md) admits more than one holder of that
  role — so a federation has more than one default real world, each a legitimately distinct world id
  under its own namespace (§3.4). That two of them denote the same context is **asserted, never
  assumed**: it is a `world_aligns_with` link in the §4.2 equivalence layer, subject to §11 decision
  2 like any other link. A consumer MUST NOT infer world identity from the **local part** of a world
  id — `refkb:world:consensus-reality` and `archivekb:world:consensus-reality` are two worlds until
  something says otherwise — and MUST NOT rewrite either into the other, which would move claim ids
  (§6).

**Prolog representation:** an explicit context argument `@world(W)` (ratified over modules,
§11 decision 3) so worlds round-trip cleanly to TSV and the grounding-pack.
Assertions without an explicit world default to the producer's declared world.

---

## 6. Minting rules (offline-first)

| Kind | How minted | Authority round-trip? |
|---|---|---|
| **Assertion** | `claim` id = hash of the normalized claim (predicate + args in canonical order + world). | **Never.** |
| **Asset** | `asset` id = hash of the bytes (algorithm-prefixed: `blake3-…`, `sha256-…`). | **Never.** |
| **Entity** | Mint a **provisional local** id immediately: `<ns>:ent:<uuid-or-hash>` (or `<ns>:local:…`). | **Never at creation.** |

The **resolver** (§8) later reconciles provisional locals against canonical entities and
emits `same_as` links — eventually-consistent, never blocking. This preserves:
- a knowledge producer's zero-spend / local-first operation,
- an embedded (no-network) world-producer runtime,
- an authority's bulk imports.

**Canonical authority:** a deployment MAY designate **one** participant in the identity-authority
role as canonical for *real-world* entities (anchoring them to an external authority such as
Wikidata) — §11 decision 1. Every other participant mints locals and defers canonicalization to
the resolver. A federation MAY instead comprise multiple independently operated holders of that
role; the local minting rule above is unchanged, and reconciliation happens later rather than
requiring any authority to be online.

**Claim normalization is normative and load-bearing — not optional (delta B).**
Content-addressed claim dedup across producers *only* works if every producer canonicalizes a
claim to the exact same byte string before hashing. Producers MUST apply the shared
normalization — canonical argument order, CURIE↔IRI normalization, world stamping, and
literal/number/whitespace formatting — defined in
[`grounding-pack.md`](grounding-pack.md) §Normalization. A claim hashed under any other rule
is non-conformant.

Note that *pre*-reconciliation, two producers describing the same fact still mint different
`claim` ids because their entity references differ (provisional locals, §4). The claims
converge only after the resolver links those entities and the claims are re-expressed against
the canonical entity **of the re-expressing participant's own authority domain** (see below).
Normalization guarantees convergence is *possible*; reconciliation makes it *happen*.

**Claim-id convergence is domain-scoped (normative — MA-3).** *The* canonical entity was written
singular, for one holder of the role. Under
[ADR-0012](../decisions/ADR-0012-federated-authority-roles.md) a federation has more than one
holder, hence more than one canonical entity for one referent — so the re-expression target has to
be named, and it is named as the **re-expressing participant's own authority domain**.
Content-addressed convergence — delta B's cross-producer dedup, which this section calls
load-bearing and not optional — therefore holds **within** an authority domain and stops at its
boundary. Two domains minting the same fact mint two `claim` ids, and that is **conformant, not a
defect**.

Across authorities the instrument is the **§4 equivalence layer**, not a shared hash: `same_as`
over the entities (§4.2), `world_aligns_with` over the worlds (§4.2, §5), read as the query-time
view §4.1 defines and governed by its weakest-link rule. A consumer that needs cross-domain dedup
computes it over that view.

Two things this deliberately does not do. It does **not** nominate a federation-wide re-expression
target, which would reinstate a privileged holder — ADR-0012's rejected option (a) — and make
minting depend on reaching it, breaking the offline-first rule this whole section states. And it
does **not** define a federation-scoped canonical form re-expressing against §4.4's shared external
anchor: to converge anything, such a form would have to be **mandatory** wherever an anchor exists,
which changes what claims are hashed against and moves ids already minted, and it would still cover
only the anchored subset. That remainder is deferred with its forcing trigger stated in
[`../docs/reference/federation-fold-dispositions.md`](../docs/reference/federation-fold-dispositions.md)
(DEFER-B). Silence was the one option not available.

---

## 7. Envelopes

### 7.1 Assertion envelope

Every assertion carries provenance, confidence, and **bitemporal** time. The seed is the
predicate shape common to extraction pipelines (subject/relation/object + confidence +
embedding + provenance + `[t_start,t_end]`); KINP promotes it to the fabric envelope and
splits the two times.

```jsonc
{
  "id":        "analyzer:claim:sha256-9f3c…", // content hash (§6)
  "world":     "worldsim:world:alderforest",  // §5
  "subject":   "worldsim:world:alderforest:ent:npc-renaud",
  "relation":  "fought",
  "object":    "worldsim:world:alderforest:ent:dragon-3",
  "confidence": 0.62,
  "embedding":  [/* optional vector */],
  "embedding_model": "…",                          // REQUIRED when embedding present; re-embed on mismatch
  "valid_time": { "start": "…", "end": null },   // when true IN ITS WORLD
  "prov": {                                        // W3C PROV shape
    "agent":    "orchestrator:agent:continuity-critic",
    "activity": "analyzer:run/1a2b",
    "asserted": "2026-07-17T12:00:00Z",            // transaction time
    "method":   "vision-analysis@2.3"
  }
}
```

- **Valid time** — when the claim is true within its world.
- **Transaction time** (`prov.asserted`) — when it entered the fabric.
  Together these answer both "what was true in 1799?" and "what did we believe last month?"
- **Embedding** is model-specific: `embedding_model` records which model produced it. A
  consumer whose model differs MUST re-embed rather than compare vectors across models. Both
  `embedding` and `embedding_model` are excluded from the claim hash (KGP §3.1), so they never
  affect claim identity (resolves KGP §9 decision 2).
- Equivalence links (`same_as`, `based_on`, …) are ordinary assertions using these
  reserved relations, so they inherit confidence/provenance/time.

### 7.2 Asset envelope

```jsonc
{
  "id":       "mediastore:asset:blake3-a1b2…", // hash of bytes
  "media_type": "audio/wav",
  "bytes":     480000,
  "source_world": "worldsim:world:alderforest",// REQUIRED at ingest — the world the bytes
                                                //   depict; claims extracted from this asset
                                                //   default to this world (delta A)
  "attaches_to": ["refkb:ent:tr-808"],         // entities this asset depicts/realizes
  "produced_by": "mediastore:run/…",
  "prov": { /* as above */ }
}
```

Assets **attach to entities by identifier** — media is not a node type in the knowledge
graph; it hangs off entities in the fabric. `source_world` is **required at ingest** (delta
A): it is how the firewall (§4.3) engages on ingested media — knowledge extracted from an
asset lands in the asset's `source_world`, never silently in consensus reality.

**Out of scope (delta E):** `asset` ids are byte-exact hashes and do *not* capture perceptual
identity — a re-encode of the same audio/video mints a different `asset` id. Near-duplicate /
perceptual matching, and the asset-level `derived_from` relation that records re-encode
lineage, belong to `media-interchange.md`. Shared *meaning* across re-encodes is carried at
the entity level via `attaches_to`. Full asset/EDL interchange is likewise
`media-interchange.md`; KINP fixes only the `asset` identifier, `source_world`, and
`attaches_to`.

---

## 8. Resolver API

Deliberately small. Maps onto existing standards where noted.

```
resolve(id [, world])
    → { entity, same_as_closure[], based_on[], provenance[], attached_assets[] }
    Dereference an identifier. Merged view is computed here, not stored.

reconcile(descriptor)                          ← OpenRefine/Wikidata Reconciliation API
    → ranked [ { candidate_id, score, why } ]
    Fuzzy-match a descriptor to candidate entities.

mint(kind, payload)
    → id
    Deterministic for claim/asset (returns the content hash); allocates a provisional
    local for entity.

link(a, b, relation, confidence, prov)
    → claim_id
    Assert an equivalence-layer relation (same_as | based_on | part_of | instance_of).

query(pattern, world)
    → assertions[]
    Read the fabric relative to a world (with inheritance, §5).
```

**Deployment:** the resolver is a *thin* service over the fabric — a registry + reconciler
+ forwarder, **not** a transform gateway. It holds no participant-specific business logic. Per
the fabric thesis, it can itself be provisioned as an org by the control-plane host. The
designated identity authority provides the `resolve` / `reconcile` surface for real-world
entities; any participant can run a local resolver cache for offline use that syncs `same_as`
links opportunistically.

---

## 9. Standards borrowed (and deliberately not adopted)

| Borrowed | Used for | Not adopting |
|---|---|---|
| IRIs / CURIEs (W3C) | identifier form (§3) | — |
| W3C PROV (shape only) | provenance envelope (§7) | the full PROV ontology / the RDF stack **as storage and identity** — see the note below |
| OpenRefine/Wikidata Reconciliation API | `reconcile` (§4.5, §8) | — |
| Content addressing (git/IPFS-style) | claim + asset IDs (§2, §6) | IPFS network itself |
| `owl:sameAs` semantics (concept only) | `same_as` licensing (§4.3) | OWL reasoning stack |

**Each borrowed standard is pinned by version** in
[`../docs/reference/upstream-standards.md`](../docs/reference/upstream-standards.md) — the table of record for every
external version this fabric depends on, and the one place a pin can be wrong. The rows this table
draws on are W3C PROV (the provenance ontology §7's envelope is shaped after) and the
Reconciliation Service API (§4.5, §8); the versions are deliberately not restated here. See
[`README.md`](README.md) § *External standards — the pin rule* for what a pin claims and what
moving one costs.

Storage stays **Prolog / TSV / grounding-pack native.** A full RDF triplestore + SPARQL
commitment would fight a Prolog-cored world producer and a TSV-first knowledge authority for
little gain. KINP stays IRI-*compatible* so an RDF export remains possible later.

**Scope of "not adopting" (narrowed by
[ADR-0006](../decisions/ADR-0006-kgp-rdf-prov-jsonld-relationship.md)).** The row above decides a
*storage and identity* question, and only that one: no mandated triplestore, no SPARQL as the
query contract, and no RDF dataset canonicalization as the id mechanism (claim ids are minted per
[`grounding-pack.md`](grounding-pack.md) §3, which depends on no resolvable context document).
RDF-star, W3C PROV, and JSON-LD **are** adopted as a specified **egress form** — the projection
fixed in KGP §4.1. The design rule is unchanged: adopt the interface or the shape, not the
runtime. Identifiers, envelopes, and resolution semantics are untouched; IRI-compatibility (§3) is
what makes that projection mechanical.

### 9.1 Identity standards considered, and the gap they leave (rationale, INFORMATIVE)

The table above records what KINP borrows. This subsection records the identity standards KINP
does **not** borrow from, and the specific question each one leaves unanswered. It is
**informative**: it binds no clause, and the identifier grammar (§3), the envelopes (§7), and the
resolution semantics (§4, §8) are unchanged by it. Dated data points come from a prior-art sweep of
**2026-08** and are stated with their dates so the claim ages visibly; the narrative version lives
in [`../docs/reference/positioning.md`](../docs/reference/positioning.md) and, where the two disagree, this spec wins.

**DIDs and Verifiable Credentials.** W3C **Decentralized Identifiers** give a self-certifying
identifier that resolves — by a registered DID method — to a DID document; **Verifiable
Credentials** give cryptographically signed attestations *about* a subject. Both are mature and
widely implemented, and both solve real problems KINP does not attempt: an identifier no registry
can revoke out from under its controller, and a claim whose signer is checkable. Neither is adopted
here, and the reason is the **question**, not the quality. KINP's question is not *"who signed
this?"* but **"two authorities each minted an identifier for what is plausibly the same entity —
what is the merged view, and what must never merge?"** A DID method **resolves**; it does not
**reconcile**. Nothing in the DID data model expresses a merged view across two *minting
authorities* — resolution is per-identifier by construction — and nothing in either data model
expresses the inverse obligation, a **firewall** against merges that must never happen, which is
what §4.3 draws between `same_as` and `based_on`. A signed attestation that two identifiers denote
the same thing is still an assertion needing §4.2's confidence, world scope, and review gate (§11
decision 2); signing it does not discharge them. The layers therefore compose rather than compete:
a participant may mint DIDs and present VCs and still need §4's equivalence layer, unchanged, above
them. A deployment wanting DID-backed identifiers registers a namespace for them under §3.4 and
anchors to them under §4.4, like any other external authority.

**No standard does cross-authority merge.** That is the load-bearing observation behind §4.1
(local IDs, never a hard merge) and §11 decision 2 (hybrid merge policy), and the sweep found no
counter-example. The three nearest attempts each answer a *different* question:

| Prior art | What it does when two authorities collide | Why that is not §4 |
|---|---|---|
| **Agent Name Service v2** | **Revokes** one side of the collision | Revocation picks a winner and destroys the loser. §4 needs both identifiers to survive, each keeping its own authority's provenance, with the merge as a query-time view (§4.2) that can later be withdrawn. |
| **MCP Registry** | **Prevents** the collision, via namespace ownership | Prevention is a governance answer, and KINP already has it — §3.4 gives one authority per prefix. It is orthogonal to the case that remains: two **independently governed** authorities that each legitimately minted an identifier for the same entity. That case is why §4 exists. |
| **`owl:sameAs`** | Asserts global, symmetric, **transitive** identity | Fifteen years of deployment experience document the failure mode: **identity inflation**, and the now-canonical *"`sameAs` is not always the same"* critique — unqualified transitive sameness propagates a single bad link across an entire graph. §9's table borrows the *concept* and this spec refuses the semantics: `same_as` is confidence-scored, world-scoped, provenance-carrying, and routed to review above an impact threshold (§4.2, §11 decision 2), and `based_on` exists precisely so lineage is never stated as identity (§4.3). |

**IETF Web Bot Auth is not a competitor, and the reason is scope rather than maturity.** A reader
tracking agent-identity work will meet the IETF **Web Bot Auth** effort and reasonably ask whether
it supersedes §3. It does not. The maturity facts are the *weaker* half of the answer: as of the
2026-08 sweep the working group, chartered **2025-10-23**, has **zero `draft-ietf-webbotauth-*`
documents** and has missed **both** of its charter milestones. Those facts can age — a working
group can ship. The half that does not age is the **scope**: Web Bot Auth authenticates a **bot to
a website**, explicitly *"using existing identifiers."* Taking the identifiers as given is the one
premise KINP does not get to make, because supplying and reconciling them across authorities is its
entire subject. So the orthogonality is by construction: were Web Bot Auth to ship every milestone
tomorrow, a participant would authenticate its bot with it and still have to answer §4's question
about the two identifiers underneath. The two compose; neither retires the other.

KINP therefore claims a **narrow** gap, and states it that way: not identifier issuance, not
resolution, not attestation — all three are occupied by better-resourced work KINP is happy to
anchor to (§4.4) — but the **merged view across independently governed minting authorities, and
the firewall against merges that must not happen**.

---

## 10. Adoption map (by role)

Nobody rewrites their core. Most of adoption is promoting private conventions to the shared
namespace and adding the equivalence layer. A participant reads only the rows for the roles it
claims; most participants claim several.

| Role | Typical starting point | Change needed |
|---|---|---|
| **Identity authority** | canonical entity store, external anchoring (e.g. Wikidata), entity-resolution, a tabular source of truth | Expose `resolve` + `reconcile` (§8); emit KINP IRIs/CURIEs on its canonical schema; run the equivalence layer (§4). |
| **Knowledge producer / consumer** | content-addressed predicates + assets, provenance, valid-time | Mostly **relabeling**: predicate → assertion (keep), subject/object → entity refs (resolve), asset id → `asset` kind; emit `same_as` to the authority; add the transaction-time split (§7). |
| **World producer** (simulation / generative) | engine-local facts, a local predicate schema, a canon/save-file split | Add **world-scoped** entity IDs + `based_on` links to real-world entities; formalize canon vs. playthrough as worlds (§5); carry ids as `id/3` terms against a registered prefix (§3). |
| **Media producer** | asset / device / instrument registries | Give catalogued things **entity** IDs; anchor to an external authority where one exists; outputs are the `asset` kind with `attaches_to` (§7.2). |
| **Control-plane host** | agent roles, an org model, agent knowledge bases | Agents/orgs get **entity/agent** IDs in the shared namespace; provision the resolver as an org. |

---

## 11. Ratified decisions

The three design forks were ratified on 2026-07-17. The choices below are now normative;
rejected alternatives are recorded for provenance.

1. **Resolver authority → a canonical identity-authority role** for real-world entities
   (anchored to an external authority such as Wikidata); a deployment MAY designate one
   participant to hold it. A single-authority deployment remains conformant unchanged. Per
   [ADR-0012](../decisions/ADR-0012-federated-authority-roles.md), a federation MAY instead
   comprise multiple independently operated holders of the role: each remains authoritative for
   the identifiers it mints and the reconciliation it publishes, while the namespace and
   provenance rules (§3.4, §4) identify that authority boundary. Cross-authority reconciliation
   MUST still use the §4 equivalence layer, including its `same_as` review gate and
   `based_on` firewall; it MUST NOT turn a holder into a mandatory online minting service.
   *Rejected:* fully federated peers with no distinguished authority role or convergence policy.
   *Rationale:* a selected holder preserves canonical quality and dedup where a deployment wants
   it, while federation is additive; offline-first is preserved because minting is local and
   reconciliation is eventually-consistent (§6). Authority is a **role**, not a hard dependency.
   This normative change is candidate pending the cross-authority break test in
   [`chief/53-multi-authority-scenario`](../tasks/chief/completed/53-multi-authority-scenario.json), now
   written and run as
   [`../scenarios/e2e-multi-authority.md`](../scenarios/e2e-multi-authority.md). That pass did
   **not** run clean — deltas MA-1…MA-11, of which **MA-1, MA-2, MA-3 and MA-4** are blocking on
   this spec, plus **MA-7** on §3.4. All five are **folded at 0.4.0**: §4.1's weakest-link rule for
   a multi-authority closure (MA-1), §4.5's fourth fail-closed branch (MA-2), §6's domain-scoped
   convergence rule (MA-3), §4.2's `world_aligns_with` relation together with §5's
   two-consensus-realities statement (MA-4), and §3.4's non-federated-commons statement with its
   collision rule (MA-7). The extent of each, and the three remainders deliberately **not** folded,
   are reasoned in
   [`../docs/reference/federation-fold-dispositions.md`](../docs/reference/federation-fold-dispositions.md).
   KINP nevertheless stayed **Candidate** at 0.4.0 — a fold does not close its own gate. This is
   still this spec's **only** re-ratification count, and after the fold it read as a **re-run of
   that pass against the folded text**: Steps 2, 3, 4 and 6 the ones that had to flip, Step 1 the
   regression set. **That re-run has now happened, and its prose leg is clean.** It was walked by
   hand on **2026-09-03** against KINP 0.4.0 as published — deliberately *not* a replay of
   `kcs:multi-authority`, which returned `green` over the original not-clean pass (**DR-8**) — and
   is recorded per step in that scenario's *Re-run — Steps 1–10 walked by hand against the folded
   text* section: **Step 1 holds and Steps 2, 3, 4 and 6 all flip.** No delta of the original pass
   reproduces against 0.4.0 and no new delta was found against this spec. One residual is declared
   and is not a break: under §4.5's fourth branch a cross-domain candidate whose world is resolvable
   only *in principle* now **queues** rather than auto-applying, which is the fail-closed side of
   the clause to be on and is what **DEFER-A** defers with a trigger.

   **KINP is nevertheless not promoted, and the blocker that remains is not in the prose.** Under
   [the ratification gate](README.md#the-ratification-gate) `candidate → ratified` also requires a
   machine-replayable **KCS encoding whose assertions cite the clauses being ratified**; a
   hand-walked prose pass is *necessary but no longer sufficient*. `kcs:multi-authority` exists and
   ran on 2026-08-24, but it was written against the **pre-fold** text and by design asserts none of
   the folded clauses (**DR-8**) — so §4.1's weakest-link rule, §4.2's `world_aligns_with`, §4.5's
   fourth branch, §6's domain-scoped convergence and §3.4's non-federated commons have **no encoded
   assertion at all**. Extending that encoding to cite them is now the whole of what stands between
   KINP and `ratified`: it is downstream work under
   [ADR-0001](../decisions/ADR-0001-control-plane-topology.md), it is the same shape **DR-7** records
   for KCB count (ii), it is bounded in turn by **MA-11** and KCS open question 1 — which is where an
   authority-boundary assertion vocabulary would have to come from — and it is **unowned**. The
   ranking of
   what stands between each spec and `ratified` is kept once, in
   [`../docs/reference/promotability.md`](../docs/reference/promotability.md); what the fold did to
   each gate is reasoned in
   [`../docs/reference/federation-fold-dispositions.md`](../docs/reference/federation-fold-dispositions.md).
2. **Merge aggressiveness → hybrid.** Auto-apply `same_as`/`based_on` above a confidence
   threshold; route high-impact or below-threshold links to a **review queue**, reusing the
   authority's convergence-QA gate. *Rejected:* always-auto (contamination risk) and
   always-review (does not scale). The threshold is configurable per world.
3. **World model in Prolog → explicit `@world(W)` context argument.** *Rejected:* one module
   per world. *Rationale:* the context argument round-trips cleanly to TSV and the
   grounding-pack; modules would trap world scoping inside the Prolog runtime and complicate
   export. Ergonomic sugar over the argument MAY be provided.

See [`../scenarios/e2e-worlds-to-fabric.md`](../scenarios/e2e-worlds-to-fabric.md) for the
end-to-end pressure test that drove deltas A–E, all folded into this 0.2.0 revision.

**Downstream evidence — the identity firewall held under machine replay.** That pressure test's KCS
encoding (`kcs:worlds-to-fabric`) was run over real MCP/A2A links on **2026-08-24** and is the
**only** scenario in the suite with a fully live cast: all three roles — world producer, knowledge
producer, identity authority — were live participants, no delta-N stand-in, verdict `live-pass`.
What that observes for this spec, rather than argues:

- **§4.3's separation of `based_on` from `same_as` is the property that held.** `firewall_holds`
  passed, and so did two `no_sameas_across_worlds` probes, the second running the full path
  *fiction NPC → intermediate entity → the real figure → an external anchor*. No `same_as` path
  joins the fiction to the real figure through either hop.
- **Delta A** — `source_world_is` on the ingested asset: the source world travels with the asset,
  which is what lets a later extraction scope itself at all.
- **Delta C** — `based_on_exists` across a world that does not inherit identity.

Two limits on citing it, both recorded as findings in that scenario's `## Downstream results`:
a `green` run means *the encoded assertions held*, never *the spec holds*; and this run predates
[ADR-0012](../decisions/ADR-0012-federated-authority-roles.md), so it touches **none** of the
federation surface §11 decision 1 opened. This spec's single count — the cross-authority break test
below — is **unaffected** by it: MA-1…MA-4 were folded at 0.4.0 and this encoding still asserts
nothing about them, which is why the count's remaining leg is an **extension** of the encoding
rather than a re-run of it.

---

## Changelog

- **0.5.0** (2026-09-12) — **The run-activity fold (IMP-7).** §3.1 fixed `<kind>` at a closed six
  and `<local-id>` at `[a-z0-9][a-z0-9._-]*`, and **this protocol's own worked examples broke both
  and did not agree with each other**: §7.1's assertion envelope and §3.4's `analyzer` row spelled a
  run `analyzer:run/1a2b` (no kind segment, and a solidus outside the charset), while KFT §3/§5.2/§6
  spelled the same thing `orchestrator:activity:ft-run/9f2a` (kind `activity`, absent from the enum,
  and the solidus again), and KMI §2's `produced_by` carried the first form, making it load-bearing
  on a third spec. A consumer could not pattern-match a run activity across participants and an
  implementer minting one met a contradiction rather than a rule — already
  [**IMP-7**](../docs/reference/implementability-audit.md) and since reproduced from the outside by
  a producer that had to mint one and found no spelling satisfying §3.1 and §5.2 at once.

  **Decided: widen the kind enum, not the charset.** `activity` joins `ent | claim | asset | world
  | agent | src`, and §3.1 now states the run-activity spelling **normatively** —
  `<namespace>:activity:<local-id>`, recognisable by its kind segment alone. The `<local-id>`
  charset is deliberately **left alone**: `<local-id>` is the canonical IRI's final *path segment*,
  so admitting `/` would make `https://id.<root>/activity/orchestrator/ft-run/9f2a` non-invertible
  and §3.2's CURIE↔IRI mapping would stop being a function. A namespace wanting structure in a run
  id uses a separator the charset already admits (`orchestrator:activity:ft-run.9f2a`), and that
  structure stays **opaque within the namespace** — it is the orchestrator's convention, not a
  protocol segment. The rejected route — stating the bare `<ns>:run/<runid>` form normatively and
  correcting §3.4 to match — is recorded as rejected because it would have made the kind segment
  optional for exactly one kind, which is the thing that made the two spellings unmatchable.

  **Minor, and the status does not move.** §3.1's enum is surface a reader implements against and a
  new admissible kind widens what a conformant participant must recognise — the same reading KFT
  0.7.0 gave two new `modality` tokens. It is **additive**: nothing §3.1 admitted at 0.4.0 stops
  being admitted, **no prefix moves** (§3.4's immutability rule binds the prefix, and `analyzer`,
  `orchestrator` and `mediastore` are untouched), and **no claim id moves** — all of `prov` is
  excluded from KGP §3.1's hashed set and `src(…)` is an annotation beside `confidence(…)`, never a
  relation argument, so no activity id was ever inside `HASH_INPUT`. The two legacy spellings were
  never conformant, so nothing conformant is invalidated; §3.1 states the transition rather than
  leaving it to be guessed — a resolver MAY accept either on **read** and MUST return the
  `activity` form as canonical, and a minting participant MUST NOT emit either.

  **`src` is answered, not left standing.** The audit's companion observation — `src` is in the
  enum and used as a kind nowhere — is recorded in §3.1 with its reasoning: it **stays**, because
  removing it would narrow a published closed enum while this fold widens one, and because the
  thing worth writing down is that `src` here is a **name collision** with the `src(…)` provenance
  annotation of §4.2/§7.1 and not evidence of a use — the argument of `src(…)` is an `activity` id
  or an `agent` id, never a `src`. A re-open condition is stated.

  **Status stays `candidate`** and this fold adds **no new gate**: KINP's single re-ratification
  count is unchanged — the KCS-encoding condition of
  [the ratification gate](README.md#the-ratification-gate), which `kcs:multi-authority` predates
  (**DR-8**) and must be **extended** rather than re-run. Nothing here touches the federation
  surface: §4, §5, §6, §8, §9, §10 and §11 are byte-unchanged, no relation, envelope field or
  resolution rule moves, and `registry/` is untouched. The reconciliation of the examples in §3.4,
  §7.1, §7.2, KFT and KMI to the one decided spelling lands in this same version.

- **Editorial** (2026-09-03) — **The federation re-run walked, and what it does not license.**
  0.4.0's fold was gated on a **re-run of
  [`../scenarios/e2e-multi-authority.md`](../scenarios/e2e-multi-authority.md) against the folded
  text** — this spec's only re-ratification count. That re-run was walked by hand on 2026-09-03
  against KINP 0.4.0 as published, per step and adversarially, and is recorded in that scenario's
  *Re-run — Steps 1–10 walked by hand against the folded text* section. **The prose leg is clean:**
  Step 1 (both authorities dark) **holds** — §6's minting table is byte-unchanged and none of §3.4's
  merge-time disjointness rule, §4.5's fourth branch or `world_aligns_with` smuggles in a minting
  dependency — and Steps **2**, **3**, **4** and **6** all **flip**, with one declared residual
  (**DEFER-A**, a queue rather than an auto-apply, on the fail-closed side). It is deliberately not
  a replay of `kcs:multi-authority`: **DR-8** records that encoding returning `green` over the
  original pass with six blocking deltas open, so its verdict is evidence about its own assertions
  and not about the folded text.

  **Status does not move, and the reason is stated rather than left as an omission.** Under
  [the ratification gate](README.md#the-ratification-gate) the prose pass is *necessary but no
  longer sufficient*; the second condition is a machine-replayable KCS encoding **whose assertions
  cite the clauses being ratified**, and `kcs:multi-authority` predates the fold and asserts none of
  them (**DR-8**). Extending it is downstream work under
  [ADR-0001](../decisions/ADR-0001-control-plane-topology.md), bounded by **MA-11** / KCS open
  question 1, and **unowned**. §11 decision 1 is rewritten to say so; the KGP precedent is the bar —
  that promotion cost an artifact plus an audit of the artifact, not a status edit.

  **Editorial in the strict sense.** No clause changed: §0–§10 are byte-unchanged, §11 decisions 2
  and 3 are byte-unchanged, no relation, envelope field, identifier form or resolution rule moves,
  and **no claim id moves**. The two paragraphs that changed are §11 decision 1's gate paragraph and
  the *Downstream evidence* note's last sentence, which still said MA-1…MA-4 were "blocking and
  unfolded" after 0.4.0 folded them. The walk found no new KINP delta; the two it did find land on
  **KCB** (Step 5) and **KMI** (Step 10, new delta **MA-12**) and are recorded there and in
  [`../docs/reference/promotability.md`](../docs/reference/promotability.md).

- **0.4.0** (2026-08-26) — **The federation fold.** Folds the five deltas
  [`../scenarios/e2e-multi-authority.md`](../scenarios/e2e-multi-authority.md) — the ADR-0012
  cross-authority break test named as this spec's only gate — recorded against KINP: **MA-1**
  (§4.1: a `same_as` closure spanning two authorities MUST be cut at the boundary or have each
  imported link re-evaluated against the consumer's own threshold, and a multi-authority path
  carries its **weakest issuer and lowest confidence** into the view — the operand is §4.2's
  existing `src`, so no envelope field is added); **MA-2** (§4.5: a **fourth, fail-closed branch** —
  operand unresolvable → `based_on` or nothing and queue, **never `same_as`** — distinct from the
  third branch, which is about confidence); **MA-3** (§6: claim-id convergence is **domain-scoped**,
  the re-expression target is the participant's **own** authority's canonical entity, and the
  cross-domain instrument is the §4 equivalence view rather than a shared hash — no existing claim
  id moves); **MA-4** (§4.2: one **new core relation** `world_aligns_with` over two world ids, with
  §4.3's firewall semantics preserved, plus §5's statement that each authority's
  `…:world:consensus-reality` is its own and cross-domain sameness is asserted, never assumed);
  **MA-7** (§3.4: the prefix registry is the one deliberately **non-federated commons**, with the
  prefix-disjointness obligation and the collision-is-a-reportable-defect rule). Also §3.4's
  illustrative table gains three second-domain placeholder rows (`archivekb` / `coordinator` /
  `assetstore`, the scenario's own) so the federation examples resolve — illustrative, not
  normative, and the observation that drove it is one the scenario filed as documentation rather
  than as a delta.
  **Minor, not patch:** behaviour is additive — a single-authority deployment reconciles, converges
  and mints exactly as at 0.3.0, `world_aligns_with` is a new name rather than a widened signature
  (a relation's signature is immutable once published), and no identifier, envelope field, or claim
  id moves — but four of the five folds are normative surface a reader implements against, including
  a new branch on §4.5's relation-choice rule and a new consumer obligation on §4.1.
  **Three remainders are deliberately not folded**, each with the future break that would force it
  stated in
  [`../docs/reference/federation-fold-dispositions.md`](../docs/reference/federation-fold-dispositions.md):
  the control-plane route by which world metadata crosses a boundary (DEFER-A, from MA-2) and a
  federation-scoped canonical form over §4.4's external anchor (DEFER-B, from MA-3). Two
  alternatives are **rejected on the record** rather than passed over: a namespace-free canonical
  world token (§4.2 — it re-hashes every real-world claim already minted) and an authority-scoped
  prefix form (§3.4 — it changes the shape of every identifier in the fabric).
  **Status: stays Candidate.** New normative text re-enters validation, and a fold does not close
  its own gate; the single count is now a **re-run of that pass against the folded text**
  (§11 decision 1). No schema twin changes — no `schemas/*.json` models an equivalence link — and
  `registry/relations.tsv` gains one row, never an edit in place. MA-5/MA-10 land in KMI and
  MA-6/MA-8/MA-9 in KCB; MA-11 is closed as evidence for a KCS open question that already cites it.

- **Editorial** (2026-08-26) — Recorded the **downstream result** of this spec's gating pressure
  test in *Pressure test*. `kcs:worlds-to-fabric`, the KCS encoding of
  [`../scenarios/e2e-worlds-to-fabric.md`](../scenarios/e2e-worlds-to-fabric.md), was run over real
  MCP/A2A links on 2026-08-24 with the suite's **only fully live cast** (3/3 roles, verdict
  `live-pass`) and machine-observed §4.3's separation of `based_on` from `same_as` — `firewall_holds`
  plus two `no_sameas_across_worlds` probes, the second over the full four-hop path — along with
  deltas **A** and **C**. Under [`README.md`](README.md#the-ratification-gate) a recorded result is
  citable evidence alongside a hand-walked pass, so this is stated as **positive evidence** rather
  than as an unread reference. Two limits are stated with it: `green` means *the encoded assertions
  held*, not *the spec holds*, and the run predates
  [ADR-0012](../decisions/ADR-0012-federated-authority-roles.md) and touches no federation surface.
  **No clause changes and the status does not move** — KINP stays **Candidate** on the same single
  count, with **MA-1…MA-4** blocking and unfolded.

- **Editorial** (2026-08-24) — The cross-authority break test §11 decision 1 and the 0.3.0 entry
  below name as this spec's gate has **landed and been run**:
  [`../scenarios/e2e-multi-authority.md`](../scenarios/e2e-multi-authority.md), two independently
  built authority domains composed into one fabric. It did **not** pass clean — deltas
  **MA-1…MA-11**, four of them blocking here (**MA-1** a query-time `same_as` closure that unions
  two authorities and is governed by its weakest link; **MA-2** §4.5's relation-choice rule with no
  fail-closed branch for an operand published in the other domain; **MA-3** §6's convergence rule
  re-expressing against *the* canonical entity, singular; **MA-4** two default consensus-reality
  worlds inside the claim hash with no equivalence layer over worlds) — plus **MA-7** on §3.4's
  namespace-prefix registry, the one authority federation reintroduces unfederated. Step 1 attacked
  the ADR's central invariant directly and it **held**: minting succeeded with both authorities
  dark. **No clause changes and the status does not move** — KINP stays **Candidate** on the same
  single count, now with a run pass and an open delta list behind it. That scenario's
  *Re-ratification — what this pass gates* section records what a clean re-run would license.
- **0.3.0** (2026-08-23) — Applied [ADR-0012](../decisions/ADR-0012-federated-authority-roles.md)
  to §11 decision 1: the canonical identity-authority role can now be held by federated,
  independently operated authorities, each identified by the existing namespace and provenance
  rules and still bound by §4 reconciliation. This is additive: a single designated authority
  remains conformant, and §6 local offline-first minting does not require reaching any authority.
  **Candidate** pending the cross-authority break test in
  [`chief/53-multi-authority-scenario`](../tasks/chief/completed/53-multi-authority-scenario.json).
- **Editorial** (2026-08-13) — Pointed KINP's two external references at the fabric-wide pin table,
  [`../docs/reference/upstream-standards.md`](../docs/reference/upstream-standards.md): §4.5 now names the
  *Reconciliation Service API* (W3C Entity Reconciliation Community Group) as the published form of
  the OpenRefine / Wikidata shape it adopts and cites the pin, and §9's borrowed-standards table
  gains a pointer covering both that row and W3C PROV. §4.5 also states explicitly what was already
  true — KINP borrows the **shape** of the query/candidate/score exchange, not a transport binding —
  which is what bounds the blast radius of an upstream version move. **Pointers and one clarifying
  sentence only — no normative change:** §3's identifier forms, §4's equivalence layer including
  §4.3's `same_as`/`based_on` rule and §4.5's threshold-and-review-queue behaviour, §6, §7's
  envelope, §8's operations and §11's decisions are all unchanged, and no identifier, envelope or
  resolution semantic moves. The versions are **not** restated here by design — the table is the
  record ([`README.md`](README.md) § *External standards — the pin rule*). Stays
  **0.2.1 Ratified**.
- **Editorial** (2026-08-13) — Added **§9.1**, an informative prior-art subsection recording the
  identity standards KINP had never engaged in writing and the gap they leave: **DIDs / Verifiable
  Credentials** are cited and dismissed *for this problem* (a DID method resolves, it does not
  reconcile; neither data model expresses a merged view across two minting authorities, nor the
  §4.3 firewall against merges that must not happen), **no standard does cross-authority merge**
  (Agent Name Service v2 revokes one side, the MCP Registry prevents the collision by namespace
  ownership, `owl:sameAs` is fifteen years into the documented identity-inflation failure mode),
  and **IETF Web Bot Auth is not a competitor** for reasons of scope rather than maturity
  (chartered 2025-10-23, zero `draft-ietf-webbotauth-*` documents, both milestones missed, and a
  scope of bot-to-website authentication *"using existing identifiers"*). **Rationale and prior art
  only — no normative change:** no clause, identifier grammar (§3), envelope (§7), or resolution
  semantic (§4, §8) is added, removed, or altered in meaning, no `same_as`/`based_on` rule moves,
  and KINP stays **0.2.1 Ratified**. The narrative version is
  [`../docs/reference/positioning.md`](../docs/reference/positioning.md) *Prior art considered*; where the two differ,
  this spec wins.
- **Editorial** (2026-08-02) — §9's "not adopting" row is **narrowed, not reversed**, per
  [ADR-0006](../decisions/ADR-0006-kgp-rdf-prov-jsonld-relationship.md) decision 5: what is not
  adopted is the RDF stack *as storage and identity* (no mandated triplestore, no SPARQL query
  contract, no dataset canonicalization as the id mechanism); RDF-star / W3C PROV / JSON-LD are
  adopted as a specified egress form via KGP §4.1's projection. No normative change — identifiers,
  envelopes, resolution semantics, and every MUST/SHOULD clause are unchanged in meaning; KINP
  stays **Ratified**.
- **Editorial** (2026-07-31) — Agnostic reframe, part 2: the §3.4 namespace registry is now an
  **open** registry whose product-named rows became **illustrative placeholder** registrations
  (`refkb` / `worldsim` / `analyzer` / `mediastore` / `orchestrator`) keyed to roles; every worked
  example, CURIE, and Prolog term across the spec uses those placeholders; §11 decision 1 is
  stated as the identity-**authority role** rather than a named product. No normative change —
  the registry's rules (one authority per prefix, immutable once published, PR to register), the
  identifier grammar, the envelopes, and every MUST/SHOULD clause are unchanged in meaning.
- **Editorial** (2026-07-31) — Agnostic reframe: the `Applies to:` header and the participation/adoption table are now expressed as abstract **roles** (producer / consumer /
  authority / host / provider) instead of named products. No normative change — identifiers,
  envelopes, verbs, and every MUST/SHOULD clause are byte-identical in meaning.

- **0.2.1** (2026-07-17) — Added `embedding_model` to the assertion envelope (§7.1),
  resolving KGP §9 embedding-portability decision. Excluded from claim identity; non-breaking.
- **0.2.0** (2026-07-17) — **Ratified.** Folded pressure-test deltas A–E: asset
  `source_world` (A, §7.2); claim normalization promoted to normative (B, §6); resolver
  `same_as`-vs-`based_on` rule (C, §4.5); reserved `retracts`/`supersedes` lifecycle relations
  (D, §4.2); perceptual/near-dup asset matching scoped out (E, §7.2). Ratified the three design
  forks (§11): a single identity **authority role** for real-world entities, hybrid merge
  policy, `@world(W)` argument.
- **0.1.0** (2026-07-17) — Initial candidate draft.
